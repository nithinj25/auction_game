import { useState } from 'react'
import PixelSprite, { AUCTIONEER } from '../components/PixelSprite'

interface Props {
  onJoin: (name: string, roomId: string) => void
  connecting?: boolean
  error?: string | null
}

export default function JoinView({ onJoin, connecting = false, error }: Props) {
  const [name,   setName]   = useState('')
  const [roomId, setRoomId] = useState('')

  const canStart = name.trim().length > 0 && roomId.trim().length > 0 && !connecting

  const go = () => {
    if (canStart) onJoin(name.trim(), roomId.trim())
  }

  return (
    <div className="min-h-screen w-full flex flex-col items-center justify-center p-4">

      <div className="text-center mb-8">
        <div className="text-[#f8b400] text-[10px] tracking-[0.5em] mb-6 pulse">
          ★ INSERT COIN ★
        </div>
        <PixelSprite rows={AUCTIONEER} scale={8} className="mx-auto mb-6 bob" />
        <h1 className="text-[#f8b400] text-4xl leading-loose tracking-widest title-glow">
          AUCTION<br />HOUSE
        </h1>
        <div className="text-[var(--muted)] text-[9px] mt-4 tracking-[0.4em]">
          BID · BLUFF · WIN
        </div>
      </div>

      <div className="panel p-8 w-full max-w-sm slidein flex flex-col gap-6">

        <div>
          <label htmlFor="player-name" className="block text-[#f8b400] text-[9px] mb-2 tracking-widest">
            ▶ PLAYER NAME
          </label>
          <input
            id="player-name"
            className="field uppercase"
            placeholder="PLAYER ONE"
            maxLength={20}
            autoFocus
            disabled={connecting}
            value={name}
            onChange={e => setName(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && go()}
          />
        </div>

        <div>
          <label htmlFor="room-code" className="block text-[#f8b400] text-[9px] mb-2 tracking-widest">
            ▶ ROOM CODE
          </label>
          <input
            id="room-code"
            className="field uppercase"
            placeholder="e.g.  FIRE"
            maxLength={20}
            disabled={connecting}
            value={roomId}
            onChange={e => setRoomId(e.target.value.toUpperCase())}
            onKeyDown={e => e.key === 'Enter' && go()}
          />
        </div>

        {error && (
          <div
            className="bevel px-4 py-3 text-[8px] leading-relaxed shake"
            style={{ borderColor: 'var(--danger)', color: 'var(--danger)' }}
            role="alert"
          >
            ⚠ {error.toUpperCase()}
          </div>
        )}

        <button onClick={go} disabled={!canStart} className="btn btn-gold w-full flex items-center justify-center gap-2">
          {connecting ? (
            <>
              <span className="spinner" aria-hidden /> CONNECTING…
            </>
          ) : (
            '▶ START'
          )}
        </button>

      </div>

      <div className="mt-8 text-[var(--muted)] text-[8px] text-center leading-loose">
        NEW CODE = NEW ROOM<br />
        SAME CODE = JOIN ROOM
      </div>

    </div>
  )
}
