import React from 'react'
import styles from './Button.module.css'

type ButtonProps = {
    text: string,
    onClick: () => void,
}
export const Button = ({ text, onClick }: ButtonProps) => {
    return (
        <button className={styles.buttonContainer} onClick={onClick}>
            {text}
        </button>
    )
}
