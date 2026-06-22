import { useAppSelector } from "@/store/hooks";
import { isHostPlayer, selectAllHands, selectAllPlayers, selectGameRound, selectIsPlaying, selectRoomCode } from "@/store";
import { useEffect } from "react";
import { getSocket } from "@/store/socket/socket";
import { EMIT_DEAL_CARD } from "@/store/socket/events";

export const useRoomEmitting = () => {
    const isHost = useAppSelector(isHostPlayer);
    const roomCode = useAppSelector(selectRoomCode);
    const players = useAppSelector(selectAllPlayers);
    const isPlaying = useAppSelector(selectIsPlaying);

    const round = useAppSelector(selectGameRound);
    const allHands = useAppSelector(selectAllHands);

    const allPlayersHaveBet =
        players.length > 0 && players.every((id) => (allHands[id]?.bet ?? 0) > 0);

    useEffect(() => {
        console.log('...round', round)
    }, [round])

    useEffect(() => {
        console.log('round 1', round)
        if (isHost && isPlaying && round === 1) {
            getSocket()?.emit(EMIT_DEAL_CARD, { roomCode, players, times: 1, isFirstDraw: false });
        }
    }, [isHost, round, isPlaying, roomCode, players]);

    useEffect(() => {
        console.log('round 2 & 3', round)
        if (round > 1 && round < 4) {
            if (isHost && isPlaying && allPlayersHaveBet) {
                getSocket()?.emit(EMIT_DEAL_CARD, { roomCode, players, times: 1, isFirstDraw: false });
            }
        }
    }, [isHost, round, isPlaying, allPlayersHaveBet, roomCode, players]);
}
