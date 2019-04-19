var Card = require('../model/Card.js');

var CardMgr = function () { // 卡牌管理器

};

CardMgr.prototype.dealCards = function (desk) { // 发牌
    var self = this;

    var total = 17;
    var cards = (new Card()).data; // 创建一副牌

    for (var i = 0; i < 3; i++) {
        desk.hiddenCards[i] = self.getOneCard(cards); // 抽底牌
    }

    desk.seats.p1.cardList = []; // p1发牌

    for (i = 0; i < total; i++) {
        desk.seats.p1.cardList[i] = self.getOneCard(cards);
    }

    desk.seats.p2.cardList = []; // p2发牌
    for (i = 0; i < total; i++) {
        desk.seats.p2.cardList[i] = self.getOneCard(cards);
    }

    desk.seats.p3.cardList = []; //p3发牌
    for (i = 0; i < total; i++) {
        desk.seats.p3.cardList[i] = self.getOneCard(cards);
    }
};

CardMgr.prototype.getOneCard = function (cards) { // 从牌堆里面抽取牌组中的一张牌
    return cards.splice(this.random(0, cards.length - 1), 1)[0];
};

CardMgr.prototype.random = function (min, max) { // 取范围内的一个值 [min, max]
    min = min == null ? 0 : min;
    max = max == null ? 1 : max;
    var delta = (max - min) + 1;
    return Math.floor(Math.random() * delta + min);
};

module.exports = CardMgr;
