import { useState } from 'react'
import styles from './App.module.css';
import { Room } from './screens/Room';

function App() {
  return (
    <div className={styles.container}>
      <Room/>
    </div>
  )
}

export default App
