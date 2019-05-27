var Desk = require('../model/Desk.js');
var util = require('../util/Util.js');
var offline = require('../mgr/OfflinePlayerMgr.js');

var DeskMgr = function () { // 游戏分桌管理器 每个桌子对象都是独立的 根据桌子号找到对应的桌子
    this.desks = {}; // 存储所有的桌子
    this.currentNo = 0; // 当前桌子编号
};

DeskMgr.prototype.playerJoin = function (player) { // 加入新玩家并分配桌号,并设置玩家的桌号和座位号
    var self = this;
    if (self.size() === 0) { // 没有任何桌位，为这个玩家创建一个新的桌子
        self.create(player);
    } else { // 有桌位，进行匹配

        var target = offline.find(player.uid); // 先看是否存在于离线列表中, 如果在，则重置为在线状态
        if (target) {
            player.deskNo = target.deskNo;
            player.seatNo = target.seatNo;
            self.desks[player.deskNo].seats[player.seatNo].status = util.PLAYER_STATUS_NORMAL;
            if (self.desks[player.deskNo].seats[player.seatNo].timer) {
                clearTimeout(self.desks[player.deskNo].seats[player.seatNo].timer);
                self.desks[player.deskNo].seats[player.seatNo].timer = null;
            }
            offline.remove(player.uid);
            return;
        }

        for (var tb in self.desks) { // 寻找当前是否有空位
            if (self.desks[tb].size() < 3) { // 不是 <= 3 ???
                for (var p in self.desks[tb].seats) {
                    if (!self.desks[tb].seats[p]) {
                        self.desks[tb].seats[p] = player;
                        player.seatNo = p;
                        break;
                    }
                }
                player.deskNo = self.desks[tb].deskNo;
                break;
            }
        }
        if (!player.deskNo) { // 没有找到需要开新的桌位
            self.create(player);
        }
    }
};

DeskMgr.prototype.deskInfo = function (player) { // 返回指定玩家对于该玩家的桌位信息
    return this.desks[player.deskNo].seats;
};

DeskMgr.prototype.create = function (player) { // 开一张新桌,并返回桌号
    var self = this;
    var deskNo = 'tb' + (++self.currentNo); // 桌子号+1，避免重复
    seatNo = 'p1';
    self.desks[deskNo] = new Desk(deskNo);
    player.deskNo = deskNo;
    player.seatNo = seatNo;
    self.desks[deskNo].seats[seatNo] = player;
};

DeskMgr.prototype.getPlayerBySocketId = function (id) { // 根据socketid获取用户信息
    var self = this;
    for (var sn in self.desks) {
        for (var p in self.desks[sn].seats) {
            if (self.desks[sn].seats[p] && self.desks[sn].seats[p].socketId === id) {
                return self.desks[sn].seats[p];
            }
        }
    }
    return null;
};

DeskMgr.prototype.nextSeatNo = function (seatNo) { // 根据当前玩家的座位，得到下一个玩家的座位
    if (seatNo === 'p1') {
        return 'p2';
    } else if (seatNo === 'p2') {
        return 'p3';
    } else {
        return 'p1';
    }
};

DeskMgr.prototype.deleteDesk = function (deskNo) { // 删除一个桌子
    delete this.desks[deskNo];
};

DeskMgr.prototype.size = function () { // 返回当前总桌数
    var self = this;
    var total = 0;
    for (var i in self.desks) {
        if (self.desks.hasOwnProperty(i)) { // 既然都用in了，需要在hasOwnProperty判断下???
            total++;
        }
    }
    return total;
};

module.exports = DeskMgr;
