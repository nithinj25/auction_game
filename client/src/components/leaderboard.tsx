import type { CSSProperties } from 'react'
import type { LeaderboardEntry } from '../types'

interface Props {
  entries: LeaderboardEntry[]
}

function fmt(n: number) {
  return '$' + Number(n).toLocaleString()
}

const medals = ['🥇', '🥈', '🥉']

export default function Leaderboard({ entries }: Props) {
  return (
    <div>
      {entries.map((e, i) => (
        <div key={e.name} style={{ ...row, background: i === 0 ? 'rgba(251,191,36,0.06)' : 'rgba(255,255,255,0.03)', borderColor: i === 0 ? 'rgba(251,191,36,0.2)' : 'rgba(255,255,255,0.05)' }}>
          <span style={rank}>{medals[i] ?? `#${i + 1}`}</span>
          <span style={name}>{e.name}</span>
          <div style={right}>
            <span style={{ ...profit, color: e.profit >= 0 ? '#22c55e' : '#ef4444' }}>
              {e.profit >= 0 ? '+' : ''}{fmt(e.profit)}
            </span>
            <span style={balance}>{fmt(e.balance)}</span>
          </div>
        </div>
      ))}
    </div>
  )
}

const row: CSSProperties = {
  display: 'flex', alignItems: 'center', gap: 10,
  padding: '10px 14px', borderRadius: 10, marginBottom: 8,
  border: '1px solid',
}
const rank: CSSProperties = { fontSize: '1.1rem', minWidth: 28 }
const name: CSSProperties = { flex: 1, fontWeight: 500, fontSize: '0.95rem' }
const right: CSSProperties = { display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 2 }
const profit: CSSProperties = { fontWeight: 700, fontSize: '0.95rem' }
const balance: CSSProperties = { color: '#5555aa', fontSize: '0.75rem' }
