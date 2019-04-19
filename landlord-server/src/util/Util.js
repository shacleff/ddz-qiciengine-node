var util = {
    cardSort: function (a, b) { // 卡牌排序 1: a<b -1: a>b
        var va = parseInt(a.val);
        var vb = parseInt(b.val);
        if (va === vb) {
            return a.type > b.type ? 1 : -1;
        } else if (va > vb) {
            return -1;
        } else {
            return 1;
        }
    }
};

// 玩家状态
util.PLAYER_STATUS_NORMAL = 1; // 正常状态
util.PLAYER_STATUS_LEAVE = 2; // 离开房间状态
util.PLAYER_STATUS_OFFLINE = 3; // 离线状态

// 桌位状态
util.DESK_STATUS_READY = 1; // 准备状态
util.DESK_STATUS_ROB = 2; // 抢地主状态
util.DESK_STATUS_PLAY = 3; // 打牌状态

module.exports = util;
