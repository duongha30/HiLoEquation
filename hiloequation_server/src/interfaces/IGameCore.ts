import type { CardData, GameState } from '../game/types';

export interface PlayerSnapshot {
    cash: number;
    score: number;
    bet: number;
    cards: CardData[] | null;
}

export interface DealResult {
    playerState: PlayerSnapshot;
    round: number;
}

export interface IGameCore {
    getRoom(roomId: string): Promise<GameState | undefined>;
    getPlayer(roomId: string, playerId: string): Promise<PlayerSnapshot | undefined>;
    destroy(roomId: string): Promise<void>;
    clearPlayer(roomId: string, playerId: string): Promise<GameState | undefined>;
    start(roomId: string, players: string[]): Promise<GameState | undefined>;
    deal(roomId: string, playerId: string, times: number, isFirstDraw?: boolean): Promise<DealResult | undefined>;
    bet(roomId: string, playerId: string, betting: number): Promise<PlayerSnapshot | undefined>;
    fold(roomId: string, playerId: string): Promise<PlayerSnapshot | undefined>;
    setSubmission(roomId: string, playerId: string, result: number): Promise<PlayerSnapshot | undefined>;
    finalizeRound(roomId: string): Promise<GameState | undefined>;
}
