import { useEffect, useRef, useState } from 'react';
import styles from './App.module.css';
import MainRouters from './navigation/MainRouters';
import casinoMusic from './assets/Savfk - The Invention Rooms.mp3';
import { useDisconnectSocket } from './hooks';

function App() {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [muted, setMuted] = useState(false);
  const [volume, setVolume] = useState(0.5);
  const [started, setStarted] = useState(false);
  const [showVolume, setShowVolume] = useState(false);

  useDisconnectSocket();

  // useEffect(() => {
  //   const start = Game.start('001', ['1', '2']);
  //   console.log('start', start)
  //   // deliver round 1: 3 cards each player
  //   const deal = Game.deal('001', 3);
  //   console.log('deal', deal)

  //   //1st betting
  //   const bet1 = Game.bet('001', '1', 100)
  //   const bet2 = Game.bet('001', '2', 200)
  //   console.log('bet1', bet1)
  //   console.log('bet2', bet2)

  //   // deliver round 2: draw 2 open cards, if √ or × draw 1 extra number card
  //   const deal2 = Game.deal('001', 2, false);
  //   console.log('deal2', deal2)

  //   // players submit their result
  //   Game.setSubmission('001', '1', 15);
  //   Game.setSubmission('001', '2', 18);

  //   // finalize round: determine winner, distribute pot, reset for next round
  //   const finalize = Game.finalizeRound('001');
  //   console.log('finalize', finalize)
  // }, []);

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
        {/* <audio ref={audioRef} src={casinoMusic} loop preload="auto" autoPlay /> */}
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
