import type { CSSProperties } from 'react'
import type { GameState } from '../App'
import Leaderboard from '../components/leaderboard'

interface Props {
  state: GameState
  onPlayAgain: () => void
}

export default function ResultsView({ state, onPlayAgain }: Props) {
  return (
    <div style={wrap}>
      <div style={hero}>
        <div style={trophy}>🏆</div>
        <h1 style={title}>Game Over</h1>
        <p style={winnerText}>{state.finalWinner} wins!</p>
      </div>

      <div style={card}>
        <p style={cardLabel}>Final Standings</p>
        <Leaderboard entries={state.finalLeaderboard} />
      </div>

      <button style={btn} onClick={onPlayAgain}>
        Play Again →
      </button>
    </div>
  )
}

const wrap: CSSProperties = { width: '100%', maxWidth: 480, padding: '24px 16px' }
const hero: CSSProperties = { textAlign: 'center', marginBottom: 28 }
const trophy: CSSProperties = {
  fontSize: '3.5rem', marginBottom: 12,
  filter: 'drop-shadow(0 0 20px rgba(251,191,36,0.6))',
}
const title: CSSProperties = { fontSize: '2rem', fontWeight: 800, letterSpacing: '-0.03em' }
const winnerText: CSSProperties = {
  fontSize: '1.1rem', fontWeight: 600, marginTop: 6,
  background: 'linear-gradient(135deg, #fbbf24, #f59e0b)',
  WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
}
const card: CSSProperties = {
  background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)',
  borderRadius: 16, padding: 20, marginBottom: 20,
  boxShadow: '0 8px 40px rgba(0,0,0,0.4)',
}
const cardLabel: CSSProperties = {
  fontSize: '0.7rem', fontWeight: 700, color: '#5555aa',
  letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 14,
}
const btn: CSSProperties = {
  width: '100%', padding: '13px 20px', borderRadius: 10, border: 'none',
  background: 'linear-gradient(135deg, #7c6fff, #5448ee)',
  color: '#fff', fontSize: '1rem', fontWeight: 600, fontFamily: 'inherit',
  cursor: 'pointer', boxShadow: '0 4px 20px rgba(108,99,255,0.4)',
}
