import { selectAllPlayers, selectIsSocketConnected, selectRoomCode, selectUserId, setGameState, setPlayingStatus } from "@/store";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { updatePlayersInRoom } from "@/store/reducers/room";
import { updateHand } from "@/store/reducers/game";
import type { HandSnapshot } from "@/store/reducers/game";
import { EMIT_DEAL_CARD, ON_BETTING, ON_CARD_DEAL, ON_FOLDING, ON_PLAYER_JOIN, ON_PLAYER_READY, ON_START, ON_PLAYER_ACTION, ON_BETTING_ROUND_END } from "@/store/socket/events";
import { getSocket } from "@/store/socket/socket";
import { useRoomStore } from "@/screens/Room/roomStore";
import type { ServerRoomState } from '@/store/reducers/game';
import { useEffect } from 'react';
import { decryptCards } from "@/utils/card";

type PlayerJoinSocketEvent = { status: number; players?: string[] };
type StartGameSocketEvent = { status: number; roomState: ServerRoomState };

export const useRoomSubscription = () => {
    const dispatch = useAppDispatch();
    const isConnected = useAppSelector(selectIsSocketConnected);
    const setPlayerReady = useRoomStore((s) => s.setPlayerReady);
    const players = useAppSelector(selectAllPlayers);
    const playerId = useAppSelector(selectUserId);
    const roomCode = useAppSelector(selectRoomCode);

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

        const onStartGame = (data: StartGameSocketEvent) => {
            if (data.status !== 200 || !data.roomState) return;
            dispatch(setGameState(data.roomState));
            dispatch(setPlayingStatus(true));
            getSocket()?.emit(EMIT_DEAL_CARD, { roomCode, players, times: 1, isFirstDraw: true });
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

        const onBetCoin = (data: { status: number; playerId: string; playerState: HandSnapshot }) => {
            if (data.status !== 200) return;
            dispatch(updateHand({ playerId: data.playerId, hand: { cash: data.playerState.cash, bet: data.playerState.bet } }));
        };

        const onFoldCard = (data: { status: number; playerId: string; playerState: HandSnapshot }) => {
            if (data.status !== 200) return;
            dispatch(updateHand({ playerId: data.playerId, hand: { cards: null } }));
        };

        const onPlayerAction = (data: any) => {
            if (data.status !== 200 || !data.roomState) return;
            dispatch(setGameState(data.roomState));
        };

        const onBettingRoundEnd = (data: any) => {
            if (data.status !== 200 || !data.roomState) return;
            dispatch(setGameState(data.roomState));
        };

        socket.on(ON_PLAYER_JOIN, onPlayerJoin);
        socket.on(ON_PLAYER_READY, onPlayerReady);
        socket.on(ON_START, onStartGame);
        socket.on(ON_CARD_DEAL, onDealCard);
        socket.on(ON_BETTING, onBetCoin);
        socket.on(ON_FOLDING, onFoldCard);
        socket.on(ON_PLAYER_ACTION, onPlayerAction);
        socket.on(ON_BETTING_ROUND_END, onBettingRoundEnd);

        return () => {
            socket.off(ON_PLAYER_JOIN, onPlayerJoin);
            socket.off(ON_PLAYER_READY, onPlayerReady);
            socket.off(ON_START, onStartGame);
            socket.off(ON_CARD_DEAL, onDealCard);
            socket.off(ON_BETTING, onBetCoin);
            socket.off(ON_FOLDING, onFoldCard);
            socket.off(ON_PLAYER_ACTION, onPlayerAction);
            socket.off(ON_BETTING_ROUND_END, onBettingRoundEnd);
        };
    }, [isConnected, setPlayerReady, dispatch]);
};