import { useAppSelector } from "@/store/hooks";
import { isHostPlayer, selectAllHands, selectAllPlayers, selectGameRound, selectIsPlaying, selectRoomCode } from "@/store";
import { useEffect } from "react";
import { getSocket } from "@/store/socket/socket";
import { EMIT_DEAL_CARD } from "@/store/socket/events";

export const useRoomEmitting = () => {
    // const isHost = useAppSelector(isHostPlayer);
    const roomCode = useAppSelector(selectRoomCode);
    const players = useAppSelector(selectAllPlayers);
    const isPlaying = useAppSelector(selectIsPlaying);

    const round = useAppSelector(selectGameRound);
    const allHands = useAppSelector(selectAllHands);

    const allPlayersHaveBet =
        players.length > 0 && players.every((id) => (allHands[id]?.bet ?? 0) > 0);

    useEffect(() => {
        if (isPlaying) {
            if (round === 1) {
                console.log('client 1: ', players)
                console.log('client 1: ', allHands)
                getSocket()?.emit(EMIT_DEAL_CARD, { roomCode, players, times: 1, isFirstDraw: false });
            }
            if (round === 2 && allPlayersHaveBet) {
                console.log('client 2: ', players)
                console.log('client 2: ', allHands)
                getSocket()?.emit(EMIT_DEAL_CARD, { roomCode, players, times: 1, isFirstDraw: false });
            }
        }
    }, [round, isPlaying, allPlayersHaveBet, roomCode, players]);
}