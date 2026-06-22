import type { CardData } from './card';

export type PotSelection = 'hi' | 'lo' | 'swing' | null;

export type Submission = {
    cards: CardData[];
    result: number;
} | null;

export type RevealedHand = {
    cards: CardData[];
    potSelection: PotSelection;
    hiSubmission: Submission;
    loSubmission: Submission;
};

export type RevealedHands = Record<string, RevealedHand>;

export type ShowdownWinner = {
    playerId: string;
    result: number;
    amount: number;
} | null;

export type ShowdownResultPayload = {
    status: number;
    hiWinner: ShowdownWinner;
    loWinner: ShowdownWinner;
    revealedHands: RevealedHands;
    roomState: {
        round: number;
        totalBetting: number;
        hands: Record<string, { cash: number; score: number; bet: number; cards: CardData[] | null }>;
    };
};
