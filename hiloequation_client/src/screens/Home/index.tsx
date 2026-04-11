import { useNavigate } from "react-router";
import styles from './Home.module.css'
import { Button } from "@/components";
import { createRoom } from "@/store";
import { useAppDispatch } from "@/store/hooks";
import { useEffect } from "react";
import { connectSocketThunk } from "@/store/actions/socket";
import { disconnectSocket } from '@/store/socket/socket';
import { selectIsSocketConnected, disconnectSocketReducer } from '@/store';
import { useSelector } from 'react-redux';

const DOT_COUNT = 28;

export const Home = () => {
    const navigate = useNavigate();
    const dispatch = useAppDispatch();
    const isConnected = useSelector(selectIsSocketConnected);

    const handleCreateRoom = () => {
        dispatch(createRoom())
            .then(({ payload }: any) => {
                if (payload) {
                    navigate(`/room/${payload._id}`);
                }
            });
    };
    useEffect(() => {
        // TODO: should connect to socket after login
        dispatch(connectSocketThunk()).then((data) => {
            console.log('connectSocketThunk home: ', data)
        });
        return () => {
            console.log('isConnected', isConnected)
            if (isConnected) {
                disconnectSocket();
                dispatch(disconnectSocketReducer());
            }
        };
    }, []);
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
                <Button text="Create Room" onClick={handleCreateRoom} />
            </div>
        </div>
    )
}