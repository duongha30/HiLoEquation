import { useState } from "react";
import { useNavigate } from "react-router";
import styles from './Home.module.css'
import { Button, CreateJoinModal } from "@/components";
import { createRoom, joinRoom, selectUserId } from "@/store";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { useConnectSocket } from "@/hooks";
import type { RoomDB } from '@/store/types/room';

const DOT_COUNT = 28;

export const Home = () => {
    const navigate = useNavigate();
    const dispatch = useAppDispatch();
    const userId = useAppSelector(selectUserId);

    useConnectSocket();

    const [showJoinModal, setShowJoinModal] = useState(false);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [errorText, setErrorText] = useState('');

    const handleJoinRoom = async (password: string, roomCode: string) => {
        const data = await dispatch(joinRoom({ roomCode, playerId: userId, password: password }));
        console.log('data', data)
        if ((data?.payload as RoomDB)?.roomCode) {
            navigate(`/room/${roomCode}`);
            setShowJoinModal(false);
            return;
        }
        setErrorText("something went wrong, please try again");
    };
    const handleCreateRoom = async (password: string = '') => {
        const data = await dispatch(createRoom({
            password,
            hostId: userId,
            maxPlayers: 4
        }));
        console.log('data', data)
        if ((data?.payload as RoomDB)?.roomCode) {
            navigate(`/room/${(data.payload as RoomDB).roomCode}`);
            setShowCreateModal(false);
            return;
        }
        setErrorText("something went wrong, please try again");
    };
    const handleCloseModal = () => {
        setShowJoinModal(false);
        setShowCreateModal(false);
        setErrorText('');
    }

    return (
        <div className={styles.container}>
            <div className={styles.banner}>
                <div className={`${styles.dotsRow} ${styles.dotsTop}`}>
                    {Array.from({ length: DOT_COUNT }).map((_, i) => (
                        <span key={i} className={styles.dot} style={{ animationDelay: `${(i * 0.12).toFixed(2)}s` }} />
                    ))}
                </div>

                <div className={styles.bannerInner}>
                    <div className={styles.casinoText}>CASINO</div>
                    <div className={styles.lineAccent} />
                    <div className={styles.marqueeWrapper}>
                        <div className={styles.marquee}>
                            <span>♠ Welcome to HiLo Casino &nbsp;♦ Try Your Luck &nbsp;♣ Play &amp; Win &nbsp;♥ Feel the Thrill &nbsp;♠ Welcome to HiLo Casino &nbsp;♦ Try Your Luck &nbsp;♣ Play &amp; Win &nbsp;♥ Feel the Thrill &nbsp;</span>
                        </div>
                    </div>
                </div>

                <div className={`${styles.dotsRow} ${styles.dotsBottom}`}>
                    {Array.from({ length: DOT_COUNT }).map((_, i) => (
                        <span key={i} className={styles.dot} style={{ animationDelay: `${(i * 0.12 + 0.06).toFixed(2)}s` }} />
                    ))}
                </div>
            </div>

            <div className={styles.buttonsSection}>
                <Button text="Create Room" onClick={() => setShowCreateModal(true)} />
                <Button text="Join Room" onClick={() => setShowJoinModal(true)} />
            </div>

            {showJoinModal && (
                <CreateJoinModal
                    onClose={handleCloseModal}
                    onSubmit={handleJoinRoom}
                    showCodeInput={true}
                    errorText={errorText}
                />
            )}
            {showCreateModal && (
                <CreateJoinModal
                    onClose={handleCloseModal}
                    onSubmit={handleCreateRoom}
                    errorText={errorText}
                />
            )}
        </div>
    )
}