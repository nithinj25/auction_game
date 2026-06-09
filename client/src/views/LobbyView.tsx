import type { GameState } from '../App'

interface Props {
  state: GameState
  send:  (msg: object) => void
}

export default function LobbyView({ state, send }: Props) {
  const count = state.players.length
  const ready = count >= 2

  return (
    <div className="min-h-screen w-full flex flex-col items-center justify-center p-4">

      <div className="text-center mb-8">
        <div className="text-[var(--muted)] text-[9px] tracking-[0.4em] mb-3">ROOM CODE</div>
        <div className="text-[#f8b400] text-2xl tracking-widest title-glow">{state.roomId}</div>
      </div>

      <div className="panel w-full max-w-sm slidein">

        <div className="border-b-4 border-[#f8b400] px-6 py-4 flex justify-between items-center">
          <span className="text-[#f8b400] text-[9px] tracking-widest">PLAYERS</span>
          <span className="text-[#f8b400] text-[9px]">{count} / 8</span>
        </div>

        <div className="p-4 flex flex-col gap-2">
          {state.players.map((p) => (
            <div key={p.name} className="flex items-center gap-3 bevel px-4 py-3">
              <div className="w-8 h-8 border-4 border-[#f8b400] bg-[#f8b400] text-black flex items-center justify-center text-[9px] font-bold flex-shrink-0">
                {p.name[0].toUpperCase()}
              </div>
              <span className="flex-1 text-[9px] uppercase tracking-wide">{p.name}</span>
              {p.isHost && (
                <span className="text-[#f8b400] text-[8px] border-2 border-[#f8b400] px-2 py-1">
                  HOST
                </span>
              )}
            </div>
          ))}

          {count === 0 && (
            <div className="font-body text-[var(--muted)] text-center py-6 blink">
              WAITING FOR PLAYERS…
            </div>
          )}
        </div>

        <div className="border-t-4 border-white/10 px-6 py-4">
          <div className="flex items-center gap-3">
            <div className={`w-3 h-3 border-2 ${ready ? 'bg-[#00e436] border-[#00e436]' : 'bg-[#f8b400] border-[#f8b400] blink'}`} />
            <span className="font-body text-[var(--muted)]">
              {ready ? `${count} PLAYERS READY` : `NEED ${2 - count} MORE PLAYER${2 - count !== 1 ? 'S' : ''}`}
            </span>
          </div>
        </div>

      </div>

      <div className="mt-6 w-full max-w-sm">
        {state.isHost ? (
          <button
            onClick={() => ready && send({ type: 'start' })}
            disabled={!ready}
            className="btn btn-green w-full"
          >
            {ready ? '▶ START AUCTION' : '▶ WAITING…'}
          </button>
        ) : (
          <div className="text-center text-[var(--muted)] text-[9px] py-4 blink">
            WAITING FOR HOST…
          </div>
        )}
      </div>

    </div>
  )
}
