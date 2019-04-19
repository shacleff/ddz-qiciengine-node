var mysqlDB = require('../util/Mysql.js');

var PlayerScoreDao = {};
var TABLE_ITEMS = '';

PlayerScoreDao.queryAll = function () { // 查询所有
    return mysqlDB.query('select * from player_score');
};


PlayerScoreDao.queryByName = function (name) { // 查询名称
    return mysqlDB.query('select * from player_score where player_name = ?', [name]);
};

PlayerScoreDao.queryByUid = function (uid) { // 查询名称
    return mysqlDB.query('select * from player_score where uid = ?', [uid]);
};

PlayerScoreDao.updateScore = function (uid, score) { // 更新分数
    return mysqlDB.query('update player_score set score = ? where uid = ?', [score, uid]);
};

PlayerScoreDao.insert = function (obj) { // 插入
    var sql = 'insert into player_score(uid, player_name, score) values(?, ?, ?)',
        params = [obj.uid, obj.name, obj.score];
    mysqlDB.query(sql, params).then(function (r) {
        console.info(r);
    });
};

module.exports = PlayerScoreDao;
