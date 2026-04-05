import { useEffect, useRef, useState } from 'react';
import styles from './App.module.css';
import MainRouters from './navigation/MainRouters';
import casinoMusic from './assets/Savfk - The Invention Rooms.mp3';

function App() {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [muted, setMuted] = useState(false);
  const [volume, setVolume] = useState(0.5);
  const [started, setStarted] = useState(false);
  const [showVolume, setShowVolume] = useState(false);

  useEffect(() => {
    const startAudio = () => {
      if (!started && audioRef.current) {
        audioRef.current.volume = volume;
        audioRef.current.play().catch((error) => {
          console.log('error in play audio: ', error)
        });
        setStarted(true);
      }
    };
    window.addEventListener('click', startAudio, { once: true });
    window.addEventListener('keydown', startAudio, { once: true });
    return () => {
      window.removeEventListener('click', startAudio);
      window.removeEventListener('keydown', startAudio);
    };
  }, [started]);

  const toggleMute = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (audioRef.current) {
      audioRef.current.muted = !muted;
    }
    setMuted(prev => !prev);
  };

  const handleVolume = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.stopPropagation();
    const val = parseFloat(e.target.value);
    setVolume(val);
    if (audioRef.current) {
      audioRef.current.volume = val;
      if (val === 0) {
        audioRef.current.muted = true;
        setMuted(true);
      } else if (muted) {
        audioRef.current.muted = false;
        setMuted(false);
      }
    }
  };

  const icon = muted || volume === 0 ? '🔇' : volume < 0.4 ? '🔉' : '🔊';

  return (
    <div className={styles.container}>
      <div className={styles.audioContainer}>
        <audio ref={audioRef} src={casinoMusic} loop preload="auto" autoPlay />
        <div
          className={styles.musicControl}
          onMouseEnter={() => setShowVolume(true)}
          onMouseLeave={() => setShowVolume(false)}
        >
          <input
            className={`${styles.volumeSlider}${showVolume ? ` ${styles.volumeSliderVisible}` : ''}`}
            type="range"
            min={0}
            max={1}
            step={0.01}
            value={muted ? 0 : volume}
            onChange={handleVolume}
            onClick={e => e.stopPropagation()}
            aria-label="Volume"
          />
          <button
            className={styles.muteBtn}
            onClick={toggleMute}
            title={muted ? 'Unmute music' : 'Mute music'}
            aria-label={muted ? 'Unmute music' : 'Mute music'}
          >
            {icon}
          </button>
          <div className={styles.marqueeWrapper}>
            <div className={styles.marquee}>
              <a href="https://breakingcopyright.com/song/savfk-the-invention-rooms">The Invention Rooms</a> by Savfk | Creative Commons (BY 4.0) | <a href="https://creativecommons.org/licenses/by/4.0/">License</a>
            </div>
          </div>
        </div>
      </div>

      <MainRouters />
    </div>
  );
}

export default App
