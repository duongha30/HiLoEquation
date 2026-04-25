import type { IGameCore } from '../interfaces/IGameCore';

// game.core.ts uses module.exports so we require it directly
// eslint-disable-next-line @typescript-eslint/no-require-imports
const GameCore = require('./game.core') as new () => IGameCore;

const Game: IGameCore = new GameCore();

export { Game, GameCore };
