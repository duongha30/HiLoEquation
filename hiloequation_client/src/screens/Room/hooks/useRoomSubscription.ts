import { selectIsSocketConnected, selectUserId, setGameState, setPlayingStatus, setGameStateWithoutCards } from "@/store";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { updatePlayersInRoom } from "@/store/reducers/room";
import { setIsForcedBetPhase, setRevealedHands, setDeclareDeadlineAt, setShowdownResult, updateHand, updateRound } from "@/store/reducers/game";
import {
    ON_BETTING, ON_CARD_DEAL, ON_FOLDING, ON_PLAYER_JOIN, ON_PLAYER_READY, ON_START, ON_PLAYER_ACTION, ON_BETTING_ROUND_END,
    ON_DECLARE_POT, ON_SUBMIT_EQUATION, ON_DECLARE_PHASE_START, ON_SHOWDOWN_RESULT,
} from "@/store/socket/events";
import { getSocket } from "@/store/socket/socket";
import { useRoomStore } from "../roomStore";
import type { ServerRoomState } from '@/store/reducers/game';
import type { RevealedHands, ShowdownWinner } from "@/types/game";
import { useEffect } from 'react';
import { decryptCards } from "@/utils/card";

type PlayerJoinSocketEvent = { status: number; players?: string[] };
type StartGameSocketEvent = { status: number; roomState: ServerRoomState };

export const useRoomSubscription = () => {
    const dispatch = useAppDispatch();
    const isConnected = useAppSelector(selectIsSocketConnected);
    const setPlayerReady = useRoomStore((s) => s.setPlayerReady);
    const resetReady = useRoomStore((s) => s.resetReady);
    const playerId = useAppSelector(selectUserId);

    useEffect(() => {
        const socket = getSocket();
        if (!socket) {
            console.warn('Socket not initialized');
            return;
        }

        const onPlayerJoin = (data: PlayerJoinSocketEvent) => {
            if (data.status !== 200) {
                console.error('Failed to join room:', data);
                return;
            }
            if (data?.players) {
                dispatch(updatePlayersInRoom({ players: data.players }));
            }
        };

        const onPlayerReady = (data: { playerId: string; isReady: boolean }) => {
            setPlayerReady(data.playerId, data.isReady);
        };

        const onStartGame = async (data: StartGameSocketEvent) => {
            if (data.status !== 200 || !data.roomState) return;
            const myHand = data.roomState.hands[playerId ?? ''];
            const myCards = myHand?.cards || [];
            const decryptedCards = await decryptCards(myCards, playerId);
            const roomState = {
                ...data.roomState,
                hands: {
                    ...data.roomState.hands,
                    ...(playerId ? { [playerId]: { ...myHand, cards: decryptedCards } } : {}),
                },
            };
            dispatch(setGameState(roomState));
            dispatch(setPlayingStatus(true));
        };

        const onDealCard = async (data: any) => {
            if (data.status !== 200 || !data.roomState) return;
            const myHand = data.roomState.hands[playerId];
            const myCards = myHand?.cards || [];
            const decryptedHands = await decryptCards(myCards, playerId)
            const roomState = {
                ...data.roomState,
                hands: {
                    ...data.roomState.hands,
                    [playerId]: {
                        ...myHand,
                        cards: decryptedHands,
                    },
                }
            }
            dispatch(setGameState(roomState));
        }

        const onBetCoin = (data: { status: number; playerId: string; playerState: any; round: number }) => {
            if (data.status !== 200) return;
            dispatch(updateHand({ playerId: data.playerId, hand: { cash: data.playerState.cash, bet: data.playerState.bet } }));
            dispatch(updateRound(data.round));
            if (data.round === 1) {
                dispatch(setIsForcedBetPhase(false));
            };
        };

        const onFoldCard = (data: { status: number; playerId: string; playerState: any }) => {
            if (data.status !== 200) return;
            dispatch(updateHand({ playerId: data.playerId, hand: { cards: null } }));
        };

        const onPlayerAction = (data: any) => {
            if (data.status !== 200 || !data.roomState) return;
            dispatch(setGameStateWithoutCards(data.roomState));
        };

        const onBettingRoundEnd = (data: any) => {
            if (data.status !== 200 || !data.roomState) return;
            dispatch(setGameStateWithoutCards(data.roomState));
        };

        const onDeclarePhaseStart = (data: { status: number; deadlineAt: number }) => {
            if (data.status !== 200) return;
            dispatch(setDeclareDeadlineAt(data.deadlineAt));
        };

        const onDeclarePot = (data: any) => {
            if (data.status !== 200 || !data.roomState) return;
            dispatch(setGameStateWithoutCards(data.roomState));
        };

        const onEquationSubmitted = (data: any) => {
            if (data.status !== 200 || !data.roomState) return;
            dispatch(setGameStateWithoutCards(data.roomState));
        };

        const onShowdownResult = (data: { status: number; hiWinner?: ShowdownWinner; loWinner?: ShowdownWinner; revealedHands?: RevealedHands; roomState?: any }) => {
            if (data.status !== 200) return;
            if (data.revealedHands) dispatch(setRevealedHands(data.revealedHands));
            if (data.roomState) dispatch(setGameStateWithoutCards(data.roomState));
            dispatch(setShowdownResult({ hiWinner: data.hiWinner ?? null, loWinner: data.loWinner ?? null }));
            // Clear the lingering declare timer and drop back to the lobby so Ready/Start reappear.
            dispatch(setDeclareDeadlineAt(null));
            dispatch(setPlayingStatus(false));
            resetReady();
        };

        socket.on(ON_PLAYER_JOIN, onPlayerJoin);
        socket.on(ON_PLAYER_READY, onPlayerReady);
        socket.on(ON_START, onStartGame);
        socket.on(ON_CARD_DEAL, onDealCard);
        socket.on(ON_BETTING, onBetCoin);
        socket.on(ON_FOLDING, onFoldCard);
        socket.on(ON_PLAYER_ACTION, onPlayerAction);
        socket.on(ON_BETTING_ROUND_END, onBettingRoundEnd);
        socket.on(ON_DECLARE_PHASE_START, onDeclarePhaseStart);
        socket.on(ON_DECLARE_POT, onDeclarePot);
        socket.on(ON_SUBMIT_EQUATION, onEquationSubmitted);
        socket.on(ON_SHOWDOWN_RESULT, onShowdownResult);

        return () => {
            socket.off(ON_PLAYER_JOIN, onPlayerJoin);
            socket.off(ON_PLAYER_READY, onPlayerReady);
            socket.off(ON_START, onStartGame);
            socket.off(ON_CARD_DEAL, onDealCard);
            socket.off(ON_BETTING, onBetCoin);
            socket.off(ON_FOLDING, onFoldCard);
            socket.off(ON_PLAYER_ACTION, onPlayerAction);
            socket.off(ON_BETTING_ROUND_END, onBettingRoundEnd);
            socket.off(ON_DECLARE_PHASE_START, onDeclarePhaseStart);
            socket.off(ON_DECLARE_POT, onDeclarePot);
            socket.off(ON_SUBMIT_EQUATION, onEquationSubmitted);
            socket.off(ON_SHOWDOWN_RESULT, onShowdownResult);
        };
    }, [isConnected, setPlayerReady, resetReady, dispatch, playerId]);
};
