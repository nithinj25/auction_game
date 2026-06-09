import type { GameState } from '../App'
import Leaderboard from '../components/leaderboard'
import PixelSprite, { TROPHY } from '../components/PixelSprite'

interface Props {
  state:       GameState
  onPlayAgain: () => void
}

export default function ResultsView({ state, onPlayAgain }: Props) {
  const youWon = state.finalWinner != null && state.finalWinner === state.name

  return (
    <div className="min-h-screen w-full flex flex-col items-center justify-center p-4">

      <div className="text-center mb-8 slidein">
        <PixelSprite rows={TROPHY} scale={9} className={`mx-auto mb-5 ${youWon ? 'celebrate' : 'bob'}`} />
        <div className="text-[var(--muted)] text-[9px] tracking-[0.4em] mb-4">GAME OVER</div>
        <div
          className="text-[11px] tracking-widest blink title-glow"
          style={{ color: youWon ? 'var(--green)' : 'var(--ink)' }}
        >
          {youWon ? 'YOU WIN!' : `${state.finalWinner?.toUpperCase()} WINS!`}
        </div>
      </div>

      <div className="panel w-full max-w-sm slidein">
        <div className="border-b-4 border-[#f8b400] px-6 py-4">
          <span className="text-[#f8b400] text-[9px] tracking-widest">FINAL SCORES</span>
        </div>
        <div className="p-4">
          <Leaderboard entries={state.finalLeaderboard} me={state.name} />
        </div>
      </div>

      <div className="mt-6 w-full max-w-sm">
        <button onClick={onPlayAgain} className="btn btn-gold w-full">
          ▶ PLAY AGAIN
        </button>
      </div>

    </div>
  )
}
