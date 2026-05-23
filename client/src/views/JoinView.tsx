import { useState } from 'react'
import type { CSSProperties } from 'react'

interface Props {
  onJoin: (name: string, roomId: string) => void
}

export default function JoinView({ onJoin }: Props) {
  const [name, setName]     = useState('')
  const [roomId, setRoomId] = useState('')

  const handleJoin = () => {
    if (!name.trim() || !roomId.trim()) return
    onJoin(name.trim(), roomId.trim())
  }

  return (
    <div style={wrap}>
      <div style={hero}>
        <div style={iconWrap}>🪙</div>
        <h1 style={title}>WS Auction</h1>
        <p style={subtitle}>Bid smart. Win big. Outsmart everyone.</p>
      </div>

      <div style={card}>
        <div style={field}>
          <label style={label}>Your name</label>
          <input
            style={input}
            placeholder="e.g. Alex"
            maxLength={20}
            value={name}
            onChange={e => setName(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && document.getElementById('room-input')?.focus()}
          />
        </div>

        <div style={field}>
          <label style={label}>Room code</label>
          <input
            id="room-input"
            style={input}
            placeholder="e.g. haunted42"
            maxLength={20}
            value={roomId}
            onChange={e => setRoomId(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleJoin()}
          />
        </div>

        <button style={btn} onClick={handleJoin}>
          Join / Create Room →
        </button>
      </div>

      <p style={hint}>Create a room by entering a new code, or join an existing one.</p>
    </div>
  )
}

const wrap: CSSProperties = {
  width: '100%', maxWidth: 480, padding: '24px 16px',
}
const hero: CSSProperties = {
  textAlign: 'center', marginBottom: 32,
}
const iconWrap: CSSProperties = {
  fontSize: '3.5rem', marginBottom: 12,
  filter: 'drop-shadow(0 0 20px rgba(108,99,255,0.6))',
}
const title: CSSProperties = {
  fontSize: '2.4rem', fontWeight: 800, letterSpacing: '-0.03em',
  background: 'linear-gradient(135deg, #fff 40%, #9b93ff)',
  WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
}
const subtitle: CSSProperties = {
  color: '#6666aa', fontSize: '0.95rem', marginTop: 8, fontWeight: 500,
}
const card: CSSProperties = {
  background: 'rgba(255,255,255,0.03)',
  border: '1px solid rgba(255,255,255,0.08)',
  borderRadius: 16, padding: 28,
  boxShadow: '0 8px 40px rgba(0,0,0,0.4)',
}
const field: CSSProperties = { marginBottom: 16 }
const label: CSSProperties = {
  display: 'block', fontSize: '0.75rem', fontWeight: 600,
  color: '#6666aa', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.08em',
}
const input: CSSProperties = {
  width: '100%', padding: '12px 16px', borderRadius: 10,
  border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.05)',
  color: '#eeeef8', fontSize: '1rem', fontFamily: 'inherit',
  transition: 'border-color 0.2s',
}
const btn: CSSProperties = {
  width: '100%', padding: '13px 20px', borderRadius: 10, border: 'none',
  background: 'linear-gradient(135deg, #7c6fff, #5448ee)',
  color: '#fff', fontSize: '1rem', fontWeight: 600,
  cursor: 'pointer', marginTop: 8, letterSpacing: '0.01em',
  boxShadow: '0 4px 20px rgba(108,99,255,0.4)',
  fontFamily: 'inherit',
}
const hint: CSSProperties = {
  textAlign: 'center', color: '#44446a', fontSize: '0.8rem', marginTop: 16,
}
