var express = require('express');
var app = express();
var server = require('http').createServer(app);
var io = require('socket.io').listen(server);
var UUID = require('./util/UUID.js');
var util = require('./util/Util.js');
var AILogic = require('./util/AILogic.js');
var gameRule = require('./util/GameRule.js');
var DeskMgr = require('./mgr/DeskMgr.js');
var CardMgr = require('./mgr/CardMgr.js');
var offline = require('./mgr/OfflinePlayerMgr.js');
var Player = require('./model/Player.js');
var playerScoreDao = require('./dao/PlayerScoreDao.js');

var deskMgr = new DeskMgr(); // 桌子管理器,存储所有的桌子、分配桌子号等
var cardMgr = new CardMgr(); // 负责为桌子发牌之类的,只提供一些方法，不存储数据

var port = 8081;

server.listen(port, function () {
    console.log('斗地主服务开启,port =', port);
});

var handler = { // 游戏逻辑处理
    someOneExit: function (player, socket) { // 有人断开连接
        var self = this;
        var deskNo = player ? player.deskNo : null; // 从player取得玩家的桌子号,避免复杂的查找
        if (deskNo) {
            var desk = deskMgr.desks[deskNo];
            resultData = desk.playerExit(player);
            socket.leave(deskNo);
            if (desk.status === util.DESK_STATUS_READY) {
                if (desk.size() > 0) {
                    socket.broadcast.to(deskNo).emit('deskUpdate', desk.seats);
                } else {
                    for (var p in desk.seats) {
                        if (desk.seats[p]) {
                            offline.remove(seats[p].uid);
                        }
                    }
                    deskMgr.deleteDesk(deskNo);
                }
            } else if (desk.status === util.DESK_STATUS_ROB) {
                desk.status = util.DESK_STATUS_READY;
                socket.broadcast.to(deskNo).emit('forceExit', resultData);

            } else if (desk.status === util.DESK_STATUS_PLAY) {
                if (desk.onlineSize() === 0) {//本桌已没有人在线，清除
                    desk.onDestroy();
                    deskMgr.deleteDesk(deskNo);
                } else {
                    socket.broadcast.to(deskNo).emit('forceExit', resultData);

                    //延迟出牌，等待玩家回来
                    if (desk.currentPlaySeatNo === player.seatNo) {
                        desk.seats[player.seatNo].timer = setTimeout(function () {
                            desk.seats[player.seatNo].status = util.PLAYER_STATUS_LEAVE;
                            self.aiPlay(desk.seats[player.seatNo], desk);
                        }, 20000);
                    }
                }
            }
        }
    },

    play: function (data) { // 玩家出牌
        var self = this;
        var desk = deskMgr.desks[data.deskNo];
        var next = deskMgr.nextSeatNo(data.seatNo);
        var resultData = {
            'preSeatNo': data.seatNo, //前一位出牌玩家
            'nextSeatNo': next
        };

        if (data.cardInfo) {//有出牌更新桌位信息
            if (data.cardInfo.cardKind === gameRule.BOMB || data.cardInfo.cardKind === gameRule.KING_BOMB) { // 有炸弹加翻
                desk.rate *= 2;
                resultData.rate = desk.rate;
            }

            desk.seats[data.seatNo].subCards(data.cardInfo.cardList); // 剔除手牌

            if (desk.seats[data.seatNo].cardList.length === 0) { //牌出完，判断胜利方
                io.sockets.in(data.deskNo).emit('gameover', desk.gameover(data.seatNo, data.cardInfo));
                desk.afterGameover();
                return;
            }
            desk.roundWinSeatNo = data.seatNo;
            desk.winCard = data.cardInfo;
            resultData.preCardInfo = data.cardInfo; //前一位玩家出的牌
            resultData.winCard = data.cardInfo;
        } else {
            if (desk.roundWinSeatNo === next) {//不出当前牌大者再重新一轮出牌
                desk.winCard = null;
                resultData.preCardInfo = null; //前一位玩家出的牌
                resultData.winCard = null;
            } else {
                resultData.preCardInfo = null; //前一位玩家出的牌
                resultData.winCard = desk.winCard;
            }
        }
        desk.currentPlaySeatNo = next;
        io.sockets.in(data.deskNo).emit('play', resultData);

        if (desk.seats[next].status === util.PLAYER_STATUS_LEAVE) {
            console.log(next, 'ai出牌');
            self.aiPlay(desk.seats[next], desk);
        } else if (desk.seats[next].status === util.PLAYER_STATUS_OFFLINE) {
            desk.seats[next].timer = setTimeout(function () {
                desk.seats[next].status = util.PLAYER_STATUS_LEAVE;
                self.aiPlay(desk.seats[next], desk);
            }, 20000);
        }
    },

    aiPlay: function (player, desk) { // ai出牌
        var p = desk.seats[player.seatNo];
        if (desk.currentPlaySeatNo === player.seatNo) {
            var ai = new AILogic(player);
            var result = null;
            desk.setCardsCnt(player);

            if (desk.winCard) {
                result = ai.follow(
                    desk.winCard,
                    (desk.landlordSeatNo === desk.roundWinSeatNo),
                    desk.seats[desk.roundWinSeatNo].cardList.length);
            } else {
                result = ai.play(desk.seats[desk.landlordSeatNo].cardList.length);
            }

            this.play({
                'deskNo': player.deskNo,
                'seatNo': player.seatNo,
                'cardInfo': result
            });

            if (result) {
                player.subCards(result.cardList);
            }
        }
    }
};

io.sockets.on('connection', function (socket) {
    socket.on('disconnect', function () { //断线
        var player = deskMgr.getPlayerBySocketId(socket.id);
        handler.someOneExit(player, socket);
    });

    socket.on('register', function (data) { //注册
        playerScoreDao.queryByName(data.name).then(function (r) {
            var flag = r.length > 0;
            var result = {};
            if (r.length === 0) {
                result.uid = new UUID().id;
                result.name = data.name;
                result.score = 500;
                playerScoreDao.insert(result);
            }
            socket.emit('registerResult', result);
        });
    });

    //玩家加入游戏
    socket.on('joinGame', function (data) {
        playerScoreDao.queryByUid(data.uid).then(function (r) {
            console.info(r[0].player_name, ' --加入了游戏');
            var player = new Player(r[0].player_name, socket.id, r[0].uid);
            player.score = r[0].score;
            deskMgr.playerJoin(player);
            socket.join(player.deskNo);
            var seats = deskMgr.deskInfo(player);
            var resultData = {'ownSeatNo': player.seatNo};

            //是断线重连需要返回底牌信息
            if (deskMgr.desks[player.deskNo].status === util.DESK_STATUS_PLAY) {
                resultData.desk = deskMgr.desks[player.deskNo];
                //给该桌其它玩家广播信息
                socket.broadcast.to(player.deskNo).emit('playerBack', deskMgr.desks[player.deskNo].seats[player.seatNo]);
            } else {
                resultData.seats = deskMgr.desks[player.deskNo].seats;
                //给该桌其它玩家广播信息
                socket.broadcast.to(player.deskNo).emit('deskUpdate', deskMgr.desks[player.deskNo].seats);
            }

            //给玩家桌位信息
            socket.emit('joinResult', resultData);
        });
    });

    //玩家切换准备状态
    socket.on('toggleReady', function (data) {
        console.info(data.deskNo, '桌', data.seatNo, data.isReady ? '准备' : '取消准备');
        deskMgr.desks[data.deskNo].seats[data.seatNo].isReady = data.isReady;

        //通知其他玩家有人改变准备状态
        socket.broadcast.to(data.deskNo).emit('noticeReady', data);

        //本桌所有人都准备了开始游戏
        if (deskMgr.desks[data.deskNo].isAllReady()) {
            cardMgr.dealCards(deskMgr.desks[data.deskNo]);
            var desk = deskMgr.desks[data.deskNo];
            //随机选取第一个开始叫分的玩家
            desk.reset();
            var firstRob = 'p' + cardMgr.random(1, 3);
            desk.status = util.DESK_STATUS_ROB;
            for (var p in desk.seats) {
                var socketId = desk.seats[p].socketId;
                var data = {
                    'cardList': desk.seats[p].cardList,
                    'firstRob': firstRob
                };
                io.sockets.in(socketId).emit('start', data);
            }
        }
    });

    //轮换抢地主
    socket.on('robLandlord', function (data) {
        var desk = deskMgr.desks[data.deskNo]; // 哪个桌子

        var setLandlord = function () {
            var info = {
                'preSeatNo': data.seatNo, //前一位叫分玩家
                'preScore': data.robScore, //前一位玩家叫的分
                'currentScore': desk.currentScore,
                'hiddenCards': desk.hiddenCards,
                'landlordSeatNo': desk.landlordSeatNo
            };
            desk.setLandlord();
            io.sockets.in(data.deskNo).emit('setLandlord', info);
        };

        if (data.robScore < 4) {
            desk.currentScore = data.robScore;
            desk.landlordSeatNo = data.seatNo;
            if (data.robScore === 3) {
                setLandlord();
                return;
            }
        }

        if (++desk.robRound >= 3) {//已经3轮结束抢地主
            if (desk.landlordSeatNo) {
                setLandlord();
            } else {
                desk.robRound = 0;
                cardMgr.dealCards(desk);
                var firstRob = 'p' + cardMgr.random(1, 3);
                for (var p in desk.seats) {
                    var socketId = desk.seats[p].socketId;
                    var resultData = {
                        'cardList': desk.seats[p].cardList,
                        'firstRob': firstRob
                    };
                    io.sockets.in(socketId).emit('start', resultData);
                }
            }
        } else { //下一个玩家抢地主
            var next = deskMgr.nextSeatNo(data.seatNo);
            var resultData = {
                'preSeatNo': data.seatNo, //前一位叫分玩家
                'preScore': data.robScore, //前一位玩家叫的分
                'currentScore': desk.currentScore,
                'nextSeatNo': next
            };
            io.sockets.in(data.deskNo).emit('robInfo', resultData);
        }
        console.log(data.deskNo, '桌', data.seatNo, '叫分' + data.robScore);
    });

    //玩家出牌
    socket.on('playCard', function (data) {
        handler.play(data);
    });

    //玩家退出游戏
    socket.on('exitGame', function (data) {
        handler.someOneExit(data, socket);
    });
});