type Suit = 'gold' | 'silver' | 'bronze' | 'black';

type CardType = 'number' | 'sqrt' | 'multiply' | 'operation';

type OperationSymbol = '+' | '-' | '÷';

type CardData = {
    id?: string;
    type?: CardType;
    suit?: Suit;
    value?: number;
    operation?: OperationSymbol;
    encryptedData?: string;
    faceDown?: boolean;
};

// Game Core
type HandsType = {
    [playerId: string]: {
        cash: number,
        score: number,
        bet: number,
        cards: CardData[] | null,
    }
};

type BettingRoundState = {
    active: boolean;
    activePlayers: string[];
    currentTurnPlayerId: string;
    currentBet: number;
    contributions: Record<string, number>;
    lastRaiserId: string;
};

type GameState = {
    deck: CardData[],
    round: number,
    hands: HandsType,
    totalBetting: number,
    bettingRound: BettingRoundState | null,
    nextStarterIndex: number,
}

export type {
    Suit,
    CardType,
    OperationSymbol,
    CardData,
    HandsType,
    BettingRoundState,
    GameState,
};