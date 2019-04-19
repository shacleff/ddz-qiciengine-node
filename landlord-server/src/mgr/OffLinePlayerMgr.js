/**
 * 离线玩家管理
 */

var OfflinePlayerMgr = function () {
    this.offlineList = [];
};

OfflinePlayerMgr.prototype.add = function (player) { // 添加
    this.offlineList.push(player);
};

OfflinePlayerMgr.prototype._search = function (obj) { // 搜索，返回数组下标，不存在返回-1
    var uid = null;
    if (typeof obj == 'string') {
        uid = obj;
    } else if (typeof obj == 'object' && obj.uid) {
        uid = obj.uid;
    } else {
        return;
    }
    for (var i = 0; i < this.offlineList.length; i++) {
        if (this.offlineList[i].uid === uid) {
            return i;
        }
    }
    return -1;
};

OfflinePlayerMgr.prototype.find = function (obj) { // 查找
    var idx = this._search(obj);
    if (idx != -1) {
        return this.offlineList[idx];
    }
    return null;
};

OfflinePlayerMgr.prototype.remove = function (obj) { // 删除
    var idx = this._search(obj);
    if (idx != -1) {
        this.offlineList.splice(idx, 1);
    }
};

OfflinePlayerMgr.prototype.size = function (obj) { // 数量
    return this.offlineList.length;
};


module.exports = new OfflinePlayerMgr(); // 其实这个也是单例的一种实现
