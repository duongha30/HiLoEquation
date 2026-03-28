import React from 'react';
import styles from './Player.module.css';
import { useDroppable } from '@dnd-kit/react';
type PlayerProps = {
    id: string;
    children?: React.ReactNode;
}

export const Player = ({ id, children }: PlayerProps) => {
    const { ref } = useDroppable({
        id,
    });
    return (
        <div ref={ref} className={styles.container}>{children}</div>
    )
}
