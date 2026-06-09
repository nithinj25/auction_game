import type { RoundEndMessage } from '../types'
import Leaderboard from './leaderboard'
import PixelSprite, { TROPHY, AUCTIONEER } from './PixelSprite'

interface Props {
  result: RoundEndMessage
  me?: string | null
}

function fmt(n: number) { return '$' + Number(n).toLocaleString() }

export default function RoundEndOverlay({ result, me }: Props) {
  const won = result.winner !== null
  const iWon = won && me != null && result.winner === me
  const accent = won ? (result.profit >= 0 ? '#00e436' : '#ff004d') : 'rgba(255,255,255,0.4)'

  return (
    <div className="fixed inset-0 bg-black/90 flex items-center justify-center z-10 p-4">
      <div className="border-4 border-[#f8b400] bg-[#0f0f0f] shadow-[8px_8px_0_#f8b400] w-full max-w-sm slidein">

        {/* Header */}
        <div
          className="border-b-4 px-6 py-5 text-center"
          style={{ borderColor: won ? (result.profit >= 0 ? '#00e436' : '#ff004d') : 'rgba(255,255,255,0.1)' }}
        >
          <PixelSprite
            rows={won && result.profit >= 0 ? TROPHY : AUCTIONEER}
            scale={5}
            className={`mx-auto mb-3 ${iWon ? 'celebrate' : won && result.profit >= 0 ? 'bob' : ''}`}
          />
          <div className="text-[10px] tracking-widest" style={{ color: accent }}>
            {iWon ? 'YOU WIN' : won ? `${result.winner!.toUpperCase()} WINS` : 'NO BIDS'}
          </div>
        </div>

        {/* Profit chip */}
        {won && (
          <div className="px-6 py-4 border-b-4 border-white/10 flex justify-between items-center">
            <div>
              <div className="text-white/30 text-[8px] mb-1 tracking-widest">PROFIT</div>
              <div
                className="text-[12px]"
                style={{ color: result.profit >= 0 ? '#00e436' : '#ff004d' }}
              >
                {result.profit >= 0 ? '+' : ''}{fmt(result.profit)}
              </div>
            </div>
            <div className="text-right">
              <div className="text-white/30 text-[8px] mb-1 tracking-widest">PAID</div>
              <div className="text-white text-[12px]">{fmt(result.winningBid)}</div>
            </div>
            <div className="text-right">
              <div className="text-white/30 text-[8px] mb-1 tracking-widest">TRUE VAL</div>
              <div className="text-[#f8b400] text-[12px]">{fmt(result.trueValue)}</div>
            </div>
          </div>
        )}

        {/* Standings */}
        <div className="p-4">
          <div className="text-white/30 text-[8px] tracking-widest mb-3">STANDINGS</div>
          <Leaderboard entries={result.leaderboard} me={me} />
        </div>

      </div>
    </div>
  )
}
