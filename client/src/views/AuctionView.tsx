import { useState } from 'react'
import type { CSSProperties } from 'react'
import type { GameState } from '../App'

interface Props {
  state: GameState
  send: (msg: object) => void
}

function fmt(n: number) {
  return '$' + Number(n).toLocaleString()
}

export default function AuctionView({ state, send }: Props) {
  const [bidInput, setBidInput] = useState('')

  const handleBid = () => {
    const amount = parseInt(bidInput, 10)
    if (isNaN(amount) || amount <= 0) return
    send({ type: 'bid', amount })
    setBidInput('')
  }

  const { round, highestBid, highestBidder, yourBid, secondsLeft, balance, profit } = state
  if (!round) return null

  const pct = Math.max(0, (secondsLeft / round.timeLimit) * 100)
  const barColor = pct < 25 ? '#ef4444' : pct < 50 ? '#f59e0b' : '#7c6fff'
  const isLeading = highestBidder === state.name

  return (
    <div style={wrap}>

      <div style={topBar}>
        <span style={roundLabel}>Round {round.current} / {round.total}</span>
        <span style={{ ...timerLabel, color: pct < 25 ? '#ef4444' : '#eeeef8' }}>
          {secondsLeft}s
        </span>
      </div>

      <div style={timerBarWrap}>
        <div style={{ ...timerBar, width: pct + '%', background: barColor }} />
      </div>

      <div style={itemCard}>
        <div style={emojiWrap}>{round.item.imageEmoji}</div>
        <h2 style={itemName}>{round.item.name}</h2>
        <p style={itemDesc}>{round.item.description}</p>
      </div>

      <div style={statsGrid}>
        <div style={stat}>
          <div style={statLabel}>Highest bid</div>
          <div style={statValue}>{fmt(highestBid)}</div>
          {highestBidder && <div style={statSub}>{isLeading ? '🏆 You' : highestBidder}</div>}
        </div>
        <div style={stat}>
          <div style={statLabel}>Your bid</div>
          <div style={{ ...statValue, color: yourBid !== null ? '#7c6fff' : '#44446a' }}>
            {yourBid !== null ? fmt(yourBid) : '—'}
          </div>
        </div>
        <div style={stat}>
          <div style={statLabel}>Balance</div>
          <div style={statValue}>{fmt(balance)}</div>
        </div>
        <div style={stat}>
          <div style={statLabel}>Profit</div>
          <div style={{ ...statValue, color: profit >= 0 ? '#22c55e' : '#ef4444' }}>
            {profit >= 0 ? '+' : ''}{fmt(profit)}
          </div>
        </div>
      </div>

      <div style={bidRow}>
        <input
          style={bidInput_}
          type="number"
          placeholder={`Min $${highestBid + 1}`}
          min={highestBid + 1}
          value={bidInput}
          onChange={e => setBidInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleBid()}
        />
        <button style={bidBtn} onClick={handleBid}>Place Bid</button>
      </div>
    </div>
  )
}

const wrap: CSSProperties = { width: '100%', maxWidth: 480, padding: '24px 16px' }
const topBar: CSSProperties = { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }
const roundLabel: CSSProperties = { fontSize: '0.8rem', fontWeight: 600, color: '#5555aa', letterSpacing: '0.08em', textTransform: 'uppercase' }
const timerLabel: CSSProperties = { fontSize: '1.3rem', fontWeight: 800, letterSpacing: '-0.02em', transition: 'color 0.5s' }
const timerBarWrap: CSSProperties = { height: 4, background: 'rgba(255,255,255,0.06)', borderRadius: 4, marginBottom: 20, overflow: 'hidden' }
const timerBar: CSSProperties = { height: '100%', borderRadius: 4, transition: 'width 0.9s linear, background 0.5s' }
const itemCard: CSSProperties = {
  background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)',
  borderRadius: 16, padding: 24, marginBottom: 16, textAlign: 'center',
  boxShadow: '0 8px 40px rgba(0,0,0,0.4)',
}
const emojiWrap: CSSProperties = {
  fontSize: '4rem', marginBottom: 12,
  filter: 'drop-shadow(0 0 16px rgba(108,99,255,0.4))',
}
const itemName: CSSProperties = { fontSize: '1.3rem', fontWeight: 700, marginBottom: 6, letterSpacing: '-0.01em' }
const itemDesc: CSSProperties = { fontSize: '0.88rem', color: '#6666aa', lineHeight: 1.5 }
const statsGrid: CSSProperties = { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 16 }
const stat: CSSProperties = {
  background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)',
  borderRadius: 12, padding: '12px 16px',
}
const statLabel: CSSProperties = { fontSize: '0.7rem', fontWeight: 600, color: '#5555aa', textTransform: 'uppercase', letterSpacing: '0.08em' }
const statValue: CSSProperties = { fontSize: '1.2rem', fontWeight: 700, marginTop: 4, letterSpacing: '-0.01em' }
const statSub: CSSProperties = { fontSize: '0.75rem', color: '#6666aa', marginTop: 2 }
const bidRow: CSSProperties = { display: 'flex', gap: 10 }
const bidInput_: CSSProperties = {
  flex: 1, padding: '13px 16px', borderRadius: 10,
  border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.05)',
  color: '#eeeef8', fontSize: '1rem', fontFamily: 'inherit',
}
const bidBtn: CSSProperties = {
  padding: '13px 20px', borderRadius: 10, border: 'none',
  background: 'linear-gradient(135deg, #7c6fff, #5448ee)',
  color: '#fff', fontSize: '0.95rem', fontWeight: 600, fontFamily: 'inherit',
  cursor: 'pointer', whiteSpace: 'nowrap',
  boxShadow: '0 4px 20px rgba(108,99,255,0.35)',
}
