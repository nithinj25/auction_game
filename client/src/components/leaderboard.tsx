import type { LeaderboardEntry } from '../types'

interface Props {
  entries: LeaderboardEntry[]
  /** name of the local player, so their row can be highlighted */
  me?: string | null
}

function fmt(n: number) { return '$' + Number(n).toLocaleString() }

const RANK_COLORS = ['#f8b400', '#aaaaaa', '#cd7f32']
const RANK_LABELS = ['1ST', '2ND', '3RD']

export default function Leaderboard({ entries, me }: Props) {
  return (
    <div className="flex flex-col gap-2">
      {entries.map((e, i) => {
        const isMe = me != null && e.name === me
        return (
          <div
            key={e.name}
            className="flex items-center gap-3 border-4 px-4 py-3 slidein"
            style={{
              borderColor: isMe ? 'var(--cyan)' : i === 0 ? 'var(--gold)' : 'rgba(255,255,255,0.1)',
              background:  isMe ? 'rgba(41,173,255,0.08)' : i === 0 ? 'rgba(248,180,0,0.05)' : '#000',
              animationDelay: `${i * 60}ms`,
            }}
          >
            <div
              className="text-[8px] font-bold w-8 flex-shrink-0 text-center"
              style={{ color: RANK_COLORS[i] ?? 'rgba(255,255,255,0.3)' }}
            >
              {RANK_LABELS[i] ?? `#${i + 1}`}
            </div>

            <div className="flex-1 text-[8px] uppercase truncate">
              {e.name}
              {isMe && <span style={{ color: 'var(--cyan)' }}> ◀ YOU</span>}
            </div>

            <div className="flex flex-col items-end gap-1">
              <div
                className="text-[9px] font-bold"
                style={{ color: e.profit >= 0 ? '#00e436' : '#ff004d' }}
              >
                {e.profit >= 0 ? '+' : ''}{fmt(e.profit)}
              </div>
              <div className="text-[7px] text-white/30">{fmt(e.balance)}</div>
            </div>
          </div>
        )
      })}
    </div>
  )
}
