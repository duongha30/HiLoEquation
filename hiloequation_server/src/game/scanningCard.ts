import type { CardData } from './types.ts';

type Operand = { unitCards: CardData[]; value: number };

export type ScanResult = {
    isValid: boolean;
    correctedCards: CardData[];
    result: number;
};

function collectOperandsAndOperators(cards: CardData[]): { operands: Operand[]; operators: CardData[] } {
    const operands: Operand[] = [];
    const operators: CardData[] = [];

    for (let i = 0; i < cards.length; i++) {
        const card = cards[i];
        if (card.type === 'sqrt') {
            const next = cards[i + 1];
            if (next?.type === 'number') {
                operands.push({ unitCards: [card, next], value: Math.sqrt(next.value ?? 0) });
                i++;
            }
        } else if (card.type === 'number') {
            operands.push({ unitCards: [card], value: card.value ?? 0 });
        } else if (card.type === 'operation' || card.type === 'multiply') {
            operators.push(card);
        }
    }

    return { operands, operators };
}

function evaluate(operands: Operand[], operators: CardData[]): number {
    if (operands.length === 0) return 0;

    const values = [operands[0].value];
    const lowOps: Array<'+' | '-'> = [];

    for (let i = 0; i < operators.length; i++) {
        const op = operators[i];
        const rightVal = operands[i + 1].value;
        const symbol = op.type === 'multiply' ? '×' : (op.operation ?? '+');

        if (symbol === '×') {
            values[values.length - 1] *= rightVal;
        } else if (symbol === '÷') {
            if (rightVal === 0) continue; // no-op: division by zero, carry left value forward
            values[values.length - 1] /= rightVal;
        } else {
            lowOps.push(symbol as '+' | '-');
            values.push(rightVal);
        }
    }

    let total = values[0];
    for (let i = 0; i < lowOps.length; i++) {
        total = lowOps[i] === '+' ? total + values[i + 1] : total - values[i + 1];
    }
    return total;
}

export function scanningCard(cards: CardData[]): ScanResult {
    const { operands, operators } = collectOperandsAndOperators(cards);

    const usableOperatorCount = Math.min(operators.length, Math.max(operands.length - 1, 0));
    const usedOperands = operands.slice(0, usableOperatorCount + 1);
    const usedOperators = operators.slice(0, usableOperatorCount);

    const correctedCards: CardData[] = [];
    usedOperands.forEach((operand, idx) => {
        correctedCards.push(...operand.unitCards);
        if (idx < usedOperators.length) correctedCards.push(usedOperators[idx]);
    });

    const result = evaluate(usedOperands, usedOperators);

    const isValid =
        cards.length === correctedCards.length &&
        cards.every((card, idx) => card.id === correctedCards[idx].id);

    return { isValid, correctedCards, result };
}
