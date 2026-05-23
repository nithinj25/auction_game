import type { CSSProperties } from 'react'
import type { GameState } from '../App'

interface Props {
  state: GameState
  send: (msg: object) => void
}

export default function LobbyView({ state, send }: Props) {
  const count = state.players.length
  const ready = count >= 2

  return (
    <div style={wrap}>
      <div style={header}>
        <p style={roomLabel}>ROOM</p>
        <h2 style={roomCode}>{state.roomId}</h2>
      </div>

      <div style={card}>
        <div style={cardHeader}>
          <span style={cardTitle}>Players</span>
          <span style={countBadge}>{count}</span>
        </div>

        {state.players.map((p) => (
          <div key={p.name} style={playerRow}>
            <div style={avatar}>{p.name[0].toUpperCase()}</div>
            <span style={playerName}>{p.name}</span>
            {p.isHost && <span style={badge}>HOST</span>}
          </div>
        ))}
      </div>

      <div style={statusBar}>
        <div style={{ ...dot, background: ready ? '#22c55e' : '#f59e0b' }} />
        <span style={statusText}>
          {ready
            ? `${count} players ready to start`
            : `Waiting for players… (${count}/2 minimum)`}
        </span>
      </div>

      {state.isHost && (
        <button
          style={{ ...btn, opacity: ready ? 1 : 0.4, cursor: ready ? 'pointer' : 'not-allowed' }}
          onClick={() => ready && send({ type: 'start' })}
        >
          Start Auction →
        </button>
      )}

      {!state.isHost && (
        <p style={waitText}>Waiting for host to start the game…</p>
      )}
    </div>
  )
}

const wrap: CSSProperties = { width: '100%', maxWidth: 480, padding: '24px 16px' }
const header: CSSProperties = { textAlign: 'center', marginBottom: 28 }
const roomLabel: CSSProperties = { fontSize: '0.7rem', fontWeight: 700, color: '#5555aa', letterSpacing: '0.15em' }
const roomCode: CSSProperties = { fontSize: '2rem', fontWeight: 800, letterSpacing: '-0.02em', color: '#eeeef8' }
const card: CSSProperties = {
  background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)',
  borderRadius: 16, padding: 20, marginBottom: 16,
  boxShadow: '0 8px 40px rgba(0,0,0,0.4)',
}
const cardHeader: CSSProperties = { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }
const cardTitle: CSSProperties = { fontWeight: 600, color: '#9999cc' }
const countBadge: CSSProperties = {
  background: 'rgba(108,99,255,0.2)', color: '#9b93ff',
  borderRadius: 20, padding: '2px 10px', fontSize: '0.85rem', fontWeight: 600,
}
const playerRow: CSSProperties = {
  display: 'flex', alignItems: 'center', gap: 12,
  padding: '10px 14px', borderRadius: 10,
  background: 'rgba(255,255,255,0.04)', marginBottom: 8,
  border: '1px solid rgba(255,255,255,0.05)',
}
const avatar: CSSProperties = {
  width: 32, height: 32, borderRadius: '50%',
  background: 'linear-gradient(135deg, #7c6fff, #5448ee)',
  display: 'flex', alignItems: 'center', justifyContent: 'center',
  fontSize: '0.85rem', fontWeight: 700, color: '#fff', flexShrink: 0,
}
const playerName: CSSProperties = { flex: 1, fontWeight: 500 }
const badge: CSSProperties = {
  fontSize: '0.65rem', fontWeight: 700, background: 'rgba(108,99,255,0.25)',
  color: '#9b93ff', borderRadius: 4, padding: '3px 8px', letterSpacing: '0.08em',
}
const statusBar: CSSProperties = {
  display: 'flex', alignItems: 'center', gap: 8, marginBottom: 20,
  padding: '10px 14px', borderRadius: 10, background: 'rgba(255,255,255,0.02)',
}
const dot: CSSProperties = { width: 8, height: 8, borderRadius: '50%', flexShrink: 0 }
const statusText: CSSProperties = { fontSize: '0.85rem', color: '#7777aa' }
const btn: CSSProperties = {
  width: '100%', padding: '13px 20px', borderRadius: 10, border: 'none',
  background: 'linear-gradient(135deg, #7c6fff, #5448ee)',
  color: '#fff', fontSize: '1rem', fontWeight: 600, fontFamily: 'inherit',
  boxShadow: '0 4px 20px rgba(108,99,255,0.4)', letterSpacing: '0.01em',
}
const waitText: CSSProperties = { textAlign: 'center', color: '#44446a', fontSize: '0.9rem', marginTop: 8 }
