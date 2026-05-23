import type { CSSProperties } from 'react'
import type { RoundEndMessage } from '../types'
import Leaderboard from './leaderboard'

interface Props {
  result: RoundEndMessage
}

function fmt(n: number) {
  return '$' + Number(n).toLocaleString()
}

export default function RoundEndOverlay({ result }: Props) {
  const won = result.winner !== null

  return (
    <div style={overlay}>
      <div style={card}>
        <div style={iconWrap}>{won ? '🏆' : '😶'}</div>
        <h2 style={title}>
          {won ? `${result.winner} wins!` : 'No bids — item unsold'}
        </h2>

        {won && (
          <div style={{ ...profitChip, background: result.profit >= 0 ? 'rgba(34,197,94,0.12)' : 'rgba(239,68,68,0.12)', color: result.profit >= 0 ? '#22c55e' : '#ef4444', borderColor: result.profit >= 0 ? 'rgba(34,197,94,0.3)' : 'rgba(239,68,68,0.3)' }}>
            {result.profit >= 0 ? '+' : ''}{fmt(result.profit)} profit
          </div>
        )}

        <div style={detailRow}>
          <div style={detailItem}>
            <span style={detailLabel}>Winning bid</span>
            <span style={detailValue}>{fmt(result.winningBid)}</span>
          </div>
          <div style={divider} />
          <div style={detailItem}>
            <span style={detailLabel}>True value</span>
            <span style={detailValue}>{fmt(result.trueValue)}</span>
          </div>
        </div>

        <div style={lbSection}>
          <p style={lbLabel}>Standings</p>
          <Leaderboard entries={result.leaderboard} />
        </div>
      </div>
    </div>
  )
}

const overlay: CSSProperties = {
  position: 'fixed', inset: 0,
  background: 'rgba(0,0,0,0.85)',
  backdropFilter: 'blur(6px)',
  display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 10,
}
const card: CSSProperties = {
  background: '#0e0e1a', border: '1px solid rgba(255,255,255,0.1)',
  borderRadius: 20, padding: 32, maxWidth: 440, width: '90%', textAlign: 'center',
  boxShadow: '0 20px 60px rgba(0,0,0,0.6)',
}
const iconWrap: CSSProperties = { fontSize: '2.8rem', marginBottom: 10 }
const title: CSSProperties = { fontSize: '1.4rem', fontWeight: 700, letterSpacing: '-0.02em', marginBottom: 14 }
const profitChip: CSSProperties = {
  display: 'inline-block', padding: '6px 18px', borderRadius: 999,
  border: '1px solid', fontSize: '1.1rem', fontWeight: 700, marginBottom: 16,
}
const detailRow: CSSProperties = {
  display: 'flex', alignItems: 'center', justifyContent: 'center',
  gap: 16, marginBottom: 20, padding: '14px 0',
  borderTop: '1px solid rgba(255,255,255,0.06)',
  borderBottom: '1px solid rgba(255,255,255,0.06)',
}
const detailItem: CSSProperties = { display: 'flex', flexDirection: 'column', gap: 4 }
const detailLabel: CSSProperties = { fontSize: '0.7rem', color: '#5555aa', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em' }
const detailValue: CSSProperties = { fontSize: '1.1rem', fontWeight: 700 }
const divider: CSSProperties = { width: 1, height: 36, background: 'rgba(255,255,255,0.08)' }
const lbSection: CSSProperties = { textAlign: 'left' }
const lbLabel: CSSProperties = { fontSize: '0.7rem', fontWeight: 700, color: '#5555aa', letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 10 }
