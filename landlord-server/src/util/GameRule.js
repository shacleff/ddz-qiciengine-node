//游戏规则
var GameRule = function () {

};

GameRule.prototype.typeJudge = function (cards) { // 牌型判断
    var self = this,
        len = cards.length;
    switch (len) {
        case 1:
            return {'cardKind': self.ONE, 'val': cards[0].val, 'size': len};
        case 2:
            if (self.isPairs(cards))
                return {'cardKind': self.PAIRS, 'val': cards[0].val, 'size': len};
            else if (self.isKingBomb(cards))
                return {'cardKind': self.KING_BOMB, 'val': cards[0].val, 'size': len};
            else
                return null;
        case 3:
            if (self.isThree(cards))
                return {'cardKind': self.THREE, 'val': cards[0].val, 'size': len};
            else
                return null;
        case 4:
            if (self.isThreeWithOne(cards)) {
                return {'cardKind': self.THREE_WITH_ONE, 'val': self.getMaxVal(cards, 3), 'size': len};
            } else if (self.isBomb(cards)) {
                return {'cardKind': self.BOMB, 'val': cards[0].val, 'size': len};
            }
            return null;
        default:
            if (self.isProgression(cards))
                return {'cardKind': self.PROGRESSION, 'val': cards[0].val, 'size': len};
            else if (self.isProgressionPairs(cards))
                return {'cardKind': self.PROGRESSION_PAIRS, 'val': cards[0].val, 'size': len};
            else if (self.isThreeWithPairs(cards))
                return {'cardKind': self.THREE_WITH_PAIRS, 'val': self.getMaxVal(cards, 3), 'size': len};
            else if (self.isPlane(cards))
                return {'cardKind': self.PLANE, 'val': self.getMaxVal(cards, 3), 'size': len};
            else if (self.isPlaneWithOne(cards))
                return {'cardKind': self.PLANE_WITH_ONE, 'val': self.getMaxVal(cards, 3), 'size': len};
            else if (self.isPlaneWithPairs(cards))
                return {'cardKind': self.PLANE_WITH_PAIRS, 'val': self.getMaxVal(cards, 3), 'size': len};
            else if (self.isFourWithTwo(cards))
                return {'cardKind': self.FOUR_WITH_TWO, 'val': self.getMaxVal(cards, 4), 'size': len};
            else if (self.isFourWithPairs(cards))
                return {'cardKind': self.FOUR_WITH_TWO_PAIRS, 'val': self.getMaxVal(cards, 4), 'size': len};
            else
                return null;

    }
};

GameRule.prototype.isPairs = function (cards) { // 是否是对子
    return cards.length == 2 && cards[0].val === cards[1].val;
};

GameRule.prototype.isThree = function (cards) { // 是否是三根
    return cards.length == 3 && cards[0].val === cards[1].val && cards[1].val === cards[2].val;
};

GameRule.prototype.isThreeWithOne = function (cards) { // 是否是三带一
    if (cards.length != 4) return false;
    var c = this.valCount(cards);
    return c.length === 2 && (c[0].count === 3 || c[1].count === 3);
};

GameRule.prototype.isThreeWithPairs = function (cards) { // 是否是三带一对
    if (cards.length != 5) return false;
    var c = this.valCount(cards);
    return c.length === 2 && (c[0].count === 3 || c[1].count === 3);
};

GameRule.prototype.isProgression = function (cards) { // 是否是顺子
    if (cards.length < 5 || cards[0].val === 15) return false;
    for (var i = 0; i < cards.length; i++) {
        if (i != (cards.length - 1) && (cards[i].val - 1) != cards[i + 1].val) {
            return false;
        }
    }
    return true;
};

GameRule.prototype.isProgressionPairs = function (cards) { // 是否是连对
    if (cards.length < 6 || cards.length % 2 != 0 || cards[0].val === 15) return false;
    for (var i = 0; i < cards.length; i += 2) {
        if (i != (cards.length - 2) && (cards[i].val != cards[i + 1].val || (cards[i].val - 1) != cards[i + 2].val)) {
            return false;
        }
    }
    return true;
};

GameRule.prototype.isPlane = function (cards) { // 是否是飞机
    if (cards.length < 6 || cards.length % 3 != 0 || cards[0].val === 15) return false;
    for (var i = 0; i < cards.length; i += 3) {
        if (i != (cards.length - 3) && (cards[i].val != cards[i + 1].val || cards[i].val != cards[i + 2].val || (cards[i].val - 1) != cards[i + 3].val)) {
            return false;
        }
    }
    return true;
};

GameRule.prototype.isPlaneWithOne = function (cards) { // 是否是飞机带单
    if (cards.length < 8 || cards.length % 4 != 0) {
        return false;
    }
    var c = this.valCount(cards);
    var threeList = [];
    var threeCount = cards.length / 4;

    for (var i = 0; i < c.length; i++) {
        if (c[i].count == 3) {
            threeList.push(c[i]);
        }
    }
    if (threeList.length != threeCount || threeList[0].val === 15) { // 检测三根数量和不能为2
        return false;
    }
    for (i = 0; i < threeList.length; i++) { // 检测三根是否连续
        if (i != threeList.length - 1 && threeList[i].val - 1 != threeList[i + 1].val) {
            return false;
        }
    }
    return true;
};

GameRule.prototype.isPlaneWithPairs = function (cards) { // 是否是飞机带对
    if (cards.length < 10 || cards.length % 5 != 0) {
        return false;
    }
    var c = this.valCount(cards);
    var threeList = [];
    var pairsList = [];
    var groupCount = cards.length / 5;

    for (var i = 0; i < c.length; i++) {
        if (c[i].count == 3) {
            threeList.push(c[i]);
        } else if (c[i].count == 2) {
            pairsList.push(c[i]);
        } else {
            return false;
        }
    }

    if (threeList.length != groupCount || pairsList.length != groupCount || threeList[0].val === 15) {//检测三根数量和对子数量和不能为2
        return false;
    }

    for (i = 0; i < threeList.length; i++) { //检测三根是否连续
        if (i != threeList.length - 1 && threeList[i].val - 1 != threeList[i + 1].val) {
            return false;
        }
    }
    return true;
};

GameRule.prototype.isFourWithTwo = function (cards) { // 是否是四带二
    var c = this.valCount(cards);
    if (cards.length != 6 || c.length > 3) {
        return false;
    }

    for (var i = 0; i < c.length; i++) {
        if (c[i].count === 4) {
            return true;
        }
    }
    return false;
};

GameRule.prototype.isFourWithPairs = function (cards) { // 是否是四带两个对
    if (cards.length != 8) {
        return false;
    }

    var c = this.valCount(cards);
    if (c.length != 3) {
        return false;
    }

    for (var i = 0; i < c.length; i++) {
        if (c[i].count != 4 && c[i].count != 2) {
            return false;
        }
    }

    return true;
};

GameRule.prototype.isBomb = function (cards) { //是否是炸弹
    return cards.length === 4 && cards[0].val === cards[1].val && cards[0].val === cards[2].val && cards[0].val === cards[3].val;
};

GameRule.prototype.isKingBomb = function (cards) { //是否是王炸
    return cards.length === 2 && cards[0].type == '0' && cards[1].type == '0';
};

GameRule.prototype.random = function (min, max) { // 获取min到max之间的随机整数，min和max值都取得到
    min = min == null ? 0 : min;
    max = max == null ? 1 : max;
    var delta = (max - min) + 1;
    return Math.floor(Math.random() * delta + min);
};

/**
 * 牌统计，统计各个牌有多少张，比如2张A，一张8
 * @param  {list} cards - 要统计的牌
 * @return {object array} val：值，count：数量
 */
GameRule.prototype.valCount = function (cards) {
    var result = [];
    var addCount = function (result, v) {
        for (var i = 0; i < result.length; i++) {
            if (result[i].val == v) {
                result[i].count++;
                return;
            }
        }
        result.push({'val': v, 'count': 1});
    };
    for (var i = 0; i < cards.length; i++) {
        addCount(result, cards[i].val);
    }
    return result;
};

GameRule.prototype.getMaxVal = function (cards, n) { // 获取指定张数的最大牌值
    var c = this.valCount(cards);
    var max = 0;
    for (var i = 0; i < c.length; i++) {
        if (c[i].count === n && c[i].val > max) {
            max = c[i].val;
        }
    }
    return max;
};

GameRule.prototype.cardSort = function (a, b) { // 卡牌排序 1: a<b  -1: a>b
    var va = parseInt(a.val);
    var vb = parseInt(b.val);
    if (va === vb) {
        return a.type > b.type ? 1 : -1;
    } else if (va > vb) {
        return -1;
    } else {
        return 1;
    }
};

// -----牌型枚举
GameRule.prototype.ONE = 1; // 单
GameRule.prototype.PAIRS = 2; // 对
GameRule.prototype.THREE = 3; // 三不带
GameRule.prototype.THREE_WITH_ONE = 4; // 三带一
GameRule.prototype.THREE_WITH_PAIRS = 5; // 三带二
GameRule.prototype.PROGRESSION = 6; // 顺子
GameRule.prototype.PROGRESSION_PAIRS = 7; // 蹦蹦对
GameRule.prototype.PLANE = 8; // 飞机
GameRule.prototype.PLANE_WITH_ONE = 9; // 飞机带1张
GameRule.prototype.PLANE_WITH_PAIRS = 10; //飞机带对子
GameRule.prototype.FOUR_WITH_TWO = 11; // 四带2
GameRule.prototype.FOUR_WITH_TWO_PAIRS = 12; // 四带对子
GameRule.prototype.BOMB = 13; // 炸弹
GameRule.prototype.KING_BOMB = 14; // 王炸

module.exports = new GameRule();
