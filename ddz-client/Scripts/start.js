// 定义本工程的名字空间
qc.landlord = {};

// window全局函数，变量等
window.G = qc.landlord.G = {};

// 初始化逻辑
qc.initGame = function (game) {
    game.log.trace('Start the game landlord.');

    // 将game实例的引用记录下来，方便在其他逻辑脚本模块中访问
    G.game = game;

    //游戏规则
    G.gameRule = new qc.landlord.GameRule();

    G.online = new qc.landlord.Online();

    String.prototype.trim = function () {
        return this.replace(/(^\s*)|(\s*$)/g, '');
    };
};
