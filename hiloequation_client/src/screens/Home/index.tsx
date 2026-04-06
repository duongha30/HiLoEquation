import { useNavigate } from "react-router";
import styles from './Home.module.css'
import { Button } from "@/components";

const DOT_COUNT = 28;

export const Home = () => {
    const navigate = useNavigate();
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
                <Button text="Create Room" onClick={() => navigate('/room/1293')} />
            </div>
        </div>
    )
}