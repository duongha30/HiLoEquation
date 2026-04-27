import type { DragEndEvent, DragStartEvent, DragMoveEvent } from '@dnd-kit/react';
import { useRef } from 'react';
import type { CardData } from '@/types/card';
import { useRoomStore } from '../roomStore';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { updateHand } from '@/store/reducers/game';
import { selectUserId } from '@/store/selectors/user';


export const useDrapDrop = (playerCardsRef: React.RefObject<CardData[]>, cardRefs: React.RefObject<Map<string, HTMLElement>>) => {
    const { setCardTranslates } = useRoomStore();
    const dispatch = useAppDispatch();
    const playerId = useAppSelector(selectUserId);
    const snapRects = useRef<Map<string, DOMRect>>(new Map()); // Snapshotted rects of all player cards at the moment drag starts
    const insertAtRef = useRef<number>(0); // Tracks where the dragged card would land if dropped right now

    const handleDragStart = (event: DragStartEvent) => {
        const sourceId = event.operation.source?.id as string;
        if (!sourceId) return;

        // Snapshot rects of all player cards before any transform is applied
        const snap = new Map<string, DOMRect>();
        playerCardsRef?.current.forEach((card) => {
            const el = cardRefs?.current.get(card.id);
            if (el) snap.set(card.id, el.getBoundingClientRect());
        });
        snapRects.current = snap;
        insertAtRef.current = playerCardsRef.current.findIndex((c) => c.id === sourceId);
    }

    const handleDragMove = (event: DragMoveEvent) => {
        const sourceId = event.operation.source?.id as string;
        if (!sourceId) return;

        // boundingRectangle of the dragged card at its current visual (translated) position
        const currentShape = event.operation.shape?.current?.boundingRectangle;
        if (!currentShape) return;

        const cards = playerCardsRef.current;
        const origIdx = cards.findIndex((c) => c.id === sourceId);
        if (origIdx === -1) return;

        const draggedLeft = currentShape.left;
        const draggedRight = draggedLeft + currentShape.width;

        // Find the non-dragged card whose width is overlapped >= 40% by the dragged card
        let newInsertIdx = origIdx;
        let maxRatio = 0;

        cards.forEach((card, i) => {
            if (card.id === sourceId) return;
            const rect = snapRects.current.get(card.id);
            if (!rect) return;

            const overlapLeft = Math.max(draggedLeft, rect.left);
            const overlapRight = Math.min(draggedRight, rect.right);
            const overlap = Math.max(0, overlapRight - overlapLeft);
            const ratio = overlap / rect.width;

            if (ratio >= 0.4 && ratio > maxRatio) {
                maxRatio = ratio;
                newInsertIdx = i;
            }
        });

        insertAtRef.current = newInsertIdx;

        // Compute translateX offsets so each displaced card slides into the correct slot
        const newTranslates: Record<string, number> = {};

        cards.forEach((card, i) => {
            if (card.id === sourceId) return;
            const rect = snapRects.current.get(card.id);
            if (!rect) return;

            let shift = 0;

            if (newInsertIdx > origIdx && i > origIdx && i <= newInsertIdx) {
                // A moved right → these cards shift left one slot each
                const prevRect = snapRects.current.get(cards[i - 1].id);
                if (prevRect) shift = prevRect.left - rect.left;
            } else if (newInsertIdx < origIdx && i >= newInsertIdx && i < origIdx) {
                // A moved left → these cards shift right one slot each
                const nextRect = snapRects.current.get(cards[i + 1].id);
                if (nextRect) shift = nextRect.left - rect.left;
            }

            if (shift !== 0) newTranslates[card.id] = shift;
        });

        setCardTranslates(newTranslates);
    }

    const handleDragEnd = (event: DragEndEvent) => {
        setCardTranslates({});
        snapRects.current = new Map();

        if (event.canceled) return;

        const sourceId = event.operation.source?.id as string;
        if (!sourceId) return;

        const insertAt = insertAtRef.current;
        const prev = playerCardsRef.current;
        const origIdx = prev.findIndex((c) => c.id === sourceId);
        if (origIdx === -1 || origIdx === insertAt) return;

        const next = [...prev];
        const [moved] = next.splice(origIdx, 1);
        next.splice(insertAt, 0, moved);

        if (playerId) {
            dispatch(updateHand({ playerId, hand: { cards: next } }));
        }
    };

    return {
        handleDragStart,
        handleDragMove,
        handleDragEnd,
    };
}