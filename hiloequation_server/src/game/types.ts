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

type PotSelection = 'hi' | 'lo' | 'swing' | null;

type Submission = {
    cards: CardData[];
    result: number;
} | null;

// Game Core
type HandsType = {
    [playerId: string]: {
        cash: number,
        score: number,
        bet: number,
        cards: CardData[] | null,
        potSelection: PotSelection,
        hiSubmission: Submission,
        loSubmission: Submission,
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

type ShowdownWinner = {
    playerId: string;
    result: number;
    amount: number;
} | null;

type GameState = {
    deck: CardData[],
    round: number,
    hands: HandsType,
    totalBetting: number,
    bettingRound: BettingRoundState | null,
    nextStarterIndex: number,
    declareDeadlineAt: number | null,
}

export type {
    Suit,
    CardType,
    OperationSymbol,
    CardData,
    PotSelection,
    Submission,
    HandsType,
    BettingRoundState,
    ShowdownWinner,
    GameState,
};
