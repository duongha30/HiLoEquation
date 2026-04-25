'use strict';

require('tsx/cjs');

const GameCore = require('./game.core.ts');

const Game = new GameCore();

module.exports = {
    Game,
    GameCore,
};
