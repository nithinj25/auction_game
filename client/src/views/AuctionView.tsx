import { useState, useEffect, useRef } from 'react'
import type { GameState } from '../App'
import PixelSprite, { AUCTIONEER } from '../components/PixelSprite'

interface Props {
  state: GameState
  send:  (msg: object) => void
}

function fmt(n: number) { return '$' + Number(n).toLocaleString() }

const TOTAL_BLOCKS = 20

export default function AuctionView({ state, send }: Props) {
  const [bidInput, setBidInput] = useState('')

  const handleBid = () => {
    const amount = parseInt(bidInput, 10)
    if (isNaN(amount) || amount <= 0) return
    send({ type: 'bid', amount })
    setBidInput('')
  }

  const { round, highestBid, highestBidder, yourBid, secondsLeft, balance, profit } = state

  const isLeading = highestBidder === state.name

  // Briefly shake the TOP BID box the moment you lose the lead.
  const [outbid, setOutbid] = useState(false)
  const wasLeading = useRef(false)
  useEffect(() => {
    if (wasLeading.current && !isLeading && yourBid !== null) {
      setOutbid(true)
      const t = setTimeout(() => setOutbid(false), 350)
      wasLeading.current = isLeading
      return () => clearTimeout(t)
    }
    wasLeading.current = isLeading
  }, [isLeading, yourBid])

  if (!round) return null

  const filled     = Math.ceil((secondsLeft / round.timeLimit) * TOTAL_BLOCKS)
  const blockColor = secondsLeft <= 5 ? 'var(--danger)' : secondsLeft <= 10 ? 'var(--gold)' : 'var(--green)'
  const minBid     = Math.max(highestBid + Math.max(25, Math.round(highestBid * 0.1)), highestBid + 1)

  return (
    <div className="min-h-screen w-full flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md flex flex-col gap-4 slidein">

        {/* Top bar */}
        <div className="flex justify-between items-center">
          <span className="text-[var(--muted)] text-[9px] tracking-widest">
            ROUND {round.current}/{round.total}
          </span>
          <span
            className={`text-[10px] font-bold ${secondsLeft <= 5 ? 'blink' : ''}`}
            style={{ color: secondsLeft <= 5 ? 'var(--danger)' : 'var(--ink)' }}
          >
            {secondsLeft}s
          </span>
        </div>

        {/* Pixel timer bar */}
        <div className="flex gap-[3px]">
          {Array.from({ length: TOTAL_BLOCKS }, (_, i) => (
            <div
              key={i}
              className="h-4 flex-1"
              style={{ background: i < filled ? blockColor : '#1a1a1a' }}
            />
          ))}
        </div>

        {/* Item card */}
        <div className="panel p-6 text-center">
          <div className="text-5xl mb-4">{round.item.imageEmoji}</div>
          <div className="text-[var(--gold)] text-[10px] tracking-wide mb-3 leading-relaxed">
            {round.item.name.toUpperCase()}
          </div>
          <div className="font-body text-[var(--muted)]">
            {round.item.description}
          </div>
        </div>

        {/* Private hint */}
        <div className="bevel p-4 flex items-start gap-4" style={{ borderColor: 'var(--cyan)' }}>
          <PixelSprite rows={AUCTIONEER} scale={4} className="flex-shrink-0 mt-1" />
          <div>
            <div className="text-[var(--cyan)] text-[8px] tracking-widest mb-2">◈ YOUR PRIVATE INTEL</div>
            <div className="font-body text-[var(--ink)]">{round.hint}</div>
          </div>
        </div>

        {/* Stats grid */}
        <div className="grid grid-cols-2 gap-4">
          <div
            className={`bevel p-3 ${outbid ? 'shake' : ''}`}
            style={{ borderColor: isLeading ? 'var(--green)' : undefined }}
          >
            <div className="text-[var(--muted)] text-[8px] mb-2 tracking-widest">TOP BID</div>
            <div className="text-[var(--gold)] text-[11px]">
              <span key={highestBid} className="bidland inline-block">{fmt(highestBid)}</span>
            </div>
            {highestBidder && (
              <div
                className="text-[8px] mt-1 truncate"
                style={{ color: isLeading ? 'var(--green)' : 'var(--muted)' }}
              >
                {isLeading ? '★ YOU' : highestBidder.toUpperCase()}
              </div>
            )}
          </div>

          <div className="bevel p-3">
            <div className="text-[var(--muted)] text-[8px] mb-2 tracking-widest">YOUR BID</div>
            <div className="text-[11px]" style={{ color: yourBid !== null ? 'var(--cyan)' : 'var(--muted)' }}>
              {yourBid !== null ? fmt(yourBid) : '—'}
            </div>
          </div>

          <div className="bevel p-3">
            <div className="text-[var(--muted)] text-[8px] mb-2 tracking-widest">BALANCE</div>
            <div className="text-[var(--ink)] text-[11px]">{fmt(balance)}</div>
          </div>

          <div className="bevel p-3">
            <div className="text-[var(--muted)] text-[8px] mb-2 tracking-widest">PROFIT</div>
            <div className="text-[11px]" style={{ color: profit >= 0 ? 'var(--green)' : 'var(--danger)' }}>
              {profit >= 0 ? '+' : ''}{fmt(profit)}
            </div>
          </div>
        </div>

        {/* Bid input */}
        <div className="flex gap-3">
          <label htmlFor="bid-amount" className="sr-only">Bid amount</label>
          <input
            id="bid-amount"
            type="number"
            className="field flex-1"
            placeholder={`MIN ${fmt(minBid)}`}
            value={bidInput}
            onChange={e => setBidInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleBid()}
          />
          <button onClick={handleBid} className="btn btn-gold whitespace-nowrap">
            BID ▶
          </button>
        </div>

      </div>
    </div>
  )
}
