import { useNavigate } from 'react-router';
import styles from './UserGuide.module.css';
import { url } from '@/utils/constant';

export const UserGuide = () => {
    const navigate = useNavigate();

    return (
        <div className={styles.container}>
            <button className={styles.backBtn} onClick={() => navigate(url.home)}>← Back</button>

            <div className={styles.panel}>
                <h1>🎴 Math Poker: Player Guide</h1>
                <p>
                    Welcome to <strong>Math Poker</strong>, a strategic card game that blends arithmetic,
                    risk-taking, and poker-style betting. Your goal is to build the best equation using your
                    cards—and win chips by getting closest to target values.
                </p>

                <hr />

                <h2>🧩 Game Objective</h2>
                <p>Each round, players compete for two goals:</p>
                <ul>
                    <li><strong>Hi</strong> → Get as close as possible to <strong>20</strong> <em>without going over</em></li>
                    <li><strong>Lo</strong> → Get as close as possible to <strong>1</strong> <em>without going over</em></li>
                </ul>
                <p>You can bet on:</p>
                <ul>
                    <li><strong>Hi</strong></li>
                    <li><strong>Lo</strong></li>
                    <li><strong>Swing (Both Hi &amp; Lo)</strong> — high risk, high reward</li>
                </ul>

                <hr />

                <h2>🃏 The Deck</h2>
                <p>The deck contains <strong>52 cards</strong>:</p>

                <h3>Number Cards (44 total)</h3>
                <ul>
                    <li>Values: <strong>0 to 10</strong></li>
                    <li>
                        4 suits (ranked for tie-breaking):
                        <ul>
                            <li>🥇 Gold (highest)</li>
                            <li>🥈 Silver</li>
                            <li>🥉 Bronze</li>
                            <li>⚫ Black (lowest)</li>
                        </ul>
                    </li>
                </ul>

                <h3>Special Cards (8 total)</h3>
                <ul>
                    <li><strong>4 × Multiplication (×)</strong> — replaces one of your operation cards</li>
                    <li><strong>4 √ Square Root (√)</strong> — applies to a single number only (e.g., √9 = 3)</li>
                </ul>

                <hr />

                <h2>⚙️ Your Starting Tools</h2>
                <p>Each player begins every round with:</p>
                <ul>
                    <li>➕ Addition (+)</li>
                    <li>➖ Subtraction (−)</li>
                    <li>➗ Division (÷)</li>
                </ul>
                <p>These are your <strong>Operation Cards</strong>, used to build equations.</p>

                <hr />

                <h2>🔄 Round Structure</h2>
                <p>Each round has 4 main phases:</p>

                <h3>1. 🂠 Dealing Cards</h3>
                <p>Each player receives:</p>

                <h4>Hidden Card</h4>
                <ul>
                    <li>1 card face-down (only you see it)</li>
                    <li>Must be a <strong>Number Card</strong></li>
                    <li>If you draw √ or × → discard and redraw</li>
                </ul>

                <h4>Open Cards</h4>
                <ul>
                    <li>2 cards face-up (visible to all players)</li>
                </ul>

                <p><strong>Special rules:</strong></p>
                <ul>
                    <li>
                        If you draw a <strong>√ card</strong>:
                        <ul>
                            <li>Draw 1 extra Number Card</li>
                            <li>√ applies only to that number</li>
                        </ul>
                    </li>
                    <li>
                        If you draw a <strong>× card</strong>:
                        <ul>
                            <li>Lose one operation (+, −, or ÷)</li>
                            <li>Draw 1 extra Number Card</li>
                        </ul>
                    </li>
                </ul>

                <h4>3rd Open Card</h4>
                <ul>
                    <li>Dealt after the first betting round</li>
                    <li>Same special rules apply</li>
                </ul>

                <p>✅ By the end, you typically have:</p>
                <ul>
                    <li><strong>4 Number Cards</strong></li>
                    <li><strong>3 Operation Cards</strong> (possibly modified)</li>
                </ul>

                <h3>2. 💰 Betting Phases (2 Rounds)</h3>

                <h4>Ante</h4>
                <ul>
                    <li>All players place <strong>1 chip minimum</strong> to start</li>
                </ul>

                <h4>First Bet (after 2 open cards)</h4>
                <p>Choose:</p>
                <ul>
                    <li><strong>Hi</strong></li>
                    <li><strong>Lo</strong></li>
                    <li><strong>Swing (both)</strong></li>
                </ul>
                <p>Actions:</p>
                <ul>
                    <li>Check</li>
                    <li>Call</li>
                    <li>Raise</li>
                    <li>Fold</li>
                </ul>
                <p>💡 Betting continues until all active players match the highest bet.</p>

                <h4>Final Bet (after 3rd open card)</h4>
                <ul>
                    <li>Same process as above</li>
                </ul>

                <h4>Secret Bet Selection</h4>
                <p>After betting:</p>
                <ul>
                    <li>
                        Place markers secretly:
                        <ul>
                            <li><strong>1-chip marker = Lo</strong></li>
                            <li><strong>20-chip marker = Hi</strong></li>
                        </ul>
                    </li>
                    <li>Swing players place both</li>
                </ul>

                <h4>🧨 Swing Bet Rule</h4>
                <ul>
                    <li>Must win <strong>both Hi AND Lo</strong></li>
                    <li>If you fail one → you lose everything</li>
                    <li>Opponents who beat you take the pot</li>
                </ul>

                <h3>3. 🧮 Build Your Equation (90 seconds)</h3>
                <p>Using your cards:</p>
                <ul>
                    <li>
                        Create <strong>one equation</strong> using:
                        <ul>
                            <li>4 numbers</li>
                            <li>3 operations</li>
                        </ul>
                    </li>
                </ul>

                <h4>Rules:</h4>
                <ul>
                    <li>No parentheses needed</li>
                    <li>
                        Follow standard order of operations:
                        <ul>
                            <li>× and ÷ first, then + and −</li>
                        </ul>
                    </li>
                    <li>Decimals are allowed (e.g., 19.2, 1.01)</li>
                </ul>
                <p>⏱️ Time limit: <strong>90 seconds</strong></p>
                <ul>
                    <li>No submission = <strong>automatic loss</strong></li>
                </ul>

                <h3>4. 🃏 Reveal &amp; Resolve</h3>
                <p>All players reveal:</p>
                <ul>
                    <li>Hidden card</li>
                    <li>Bet choice(s)</li>
                    <li>Final equation</li>
                </ul>

                <hr />

                <h2>🏆 Winning the Round</h2>

                <h3>Hi Winner</h3>
                <ul>
                    <li>Closest to <strong>20 without going over</strong></li>
                    <li>
                        Tie-breaker:
                        <ul>
                            <li>Highest-value card</li>
                            <li>Highest suit</li>
                        </ul>
                    </li>
                </ul>

                <h3>Lo Winner</h3>
                <ul>
                    <li>Closest to <strong>1 without going over</strong></li>
                    <li>
                        Tie-breaker:
                        <ul>
                            <li>Lowest-value card</li>
                            <li>Lowest suit</li>
                        </ul>
                    </li>
                </ul>

                <h3>💵 Pot Distribution</h3>
                <ul>
                    <li>
                        Pot is split:
                        <ul>
                            <li><strong>50% to Hi winner</strong></li>
                            <li><strong>50% to Lo winner</strong></li>
                        </ul>
                    </li>
                    <li>Odd chip is discarded</li>
                </ul>

                <h3>⚡ Swing Resolution</h3>
                <ul>
                    <li>
                        Swing player reveals first:
                        <ul>
                            <li>Wins both → takes entire pot</li>
                            <li>Fails either → loses everything</li>
                        </ul>
                    </li>
                </ul>

                <hr />

                <h2>❗ Important Tips</h2>
                <ul>
                    <li>Balance risk: Swing bets are powerful but dangerous</li>
                    <li>Watch open cards: They give clues about opponents' potential</li>
                    <li>Manage operations wisely: Losing ÷ or + can limit your strategy</li>
                    <li>Think fast: 90 seconds goes quickly!</li>
                </ul>

                <hr />

                <h2>🎯 End of Game</h2>
                <ul>
                    <li>The game can run for a set number of rounds (e.g., 25)</li>
                    <li>Player with the most chips at the end wins</li>
                </ul>

                <hr />

                <p>Good luck—and may your math be sharp and your bets smarter! 🧠💰</p>
            </div>
        </div>
    );
};
