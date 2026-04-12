type Suit = 'gold' | 'silver' | 'bronze' | 'black';

type CardType = 'number' | 'sqrt' | 'multiply' | 'operation';

type OperationSymbol = '+' | '-' | '÷';

type CardData = {
    id: string;
    type: CardType;
    suit?: Suit;
    value?: number;
    operation?: OperationSymbol;
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
type GameState = {
    deck: CardData[],
    round: number,
    hands: HandsType,
    totalBetting: number,
}

export type {
    Suit,
    CardType,
    OperationSymbol,
    CardData,
    HandsType,
    GameState,
};