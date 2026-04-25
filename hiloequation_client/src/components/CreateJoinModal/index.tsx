import { useState } from 'react';
import styles from './CreateJoinModal.module.css';

interface Props {
    onClose: () => void;
    onSubmit: (password: string, roomCode: string) => void;
    showCodeInput?: boolean;
    errorText: string;
}

export const CreateJoinModal = ({ onClose, onSubmit, showCodeInput = false, errorText }: Props) => {
    const [roomCode, setRoomCode] = useState('');
    const [roomPassword, setRoomPassword] = useState('');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (showCodeInput) {
            if (roomCode.trim()) {
                onSubmit(roomPassword.trim(), roomCode.trim());
            }
        } else {
            onSubmit(roomPassword.trim(), '');
        }
    };

    return (
        <div className={styles.overlay} onClick={onClose}>
            <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
                <h2 className={styles.title}>{showCodeInput ? "Join Room" : "Create Room"}</h2>
                <form onSubmit={handleSubmit}>
                    {showCodeInput && (
                        <input
                            className={styles.input}
                            type="text"
                            placeholder="Enter Room ID"
                            value={roomCode}
                            onChange={(e) => setRoomCode(e.target.value)}
                            autoFocus
                        />
                    )}
                    <input
                        className={styles.input}
                        type="text"
                        placeholder="Enter Room Password"
                        value={roomPassword}
                        onChange={(e) => setRoomPassword(e.target.value)}
                    />
                    <div className={styles.buttons}>
                        <button type="button" className={styles.cancelBtn} onClick={onClose}>
                            Cancel
                        </button>
                        <button type="submit" className={styles.joinBtn} disabled={showCodeInput && !roomCode.trim()}>
                            {showCodeInput ? "Join" : "Create"}
                        </button>
                    </div>
                    {errorText && <div className={styles.errorText}>{errorText}</div>}
                </form>
            </div>
        </div>
    );
};
