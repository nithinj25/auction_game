import { useReducer, useCallback, useRef } from 'react'
import type { ServerMessage, RoundEndMessage, LeaderboardEntry } from './types'
import JoinView from './views/JoinView'
import LobbyView from './views/LobbyView'
import AuctionView from './views/AuctionView'
import ResultsView from './views/ResultsView'
import RoundEndOverlay from './components/RoundEndOverlay'

export type View = 'join' | 'lobby' | 'auction' | 'results'

export interface GameState {
  view: View
  playerId: string | null
  name: string | null
  isHost: boolean
  balance: number
  profit: number
  roomId: string | null
  players: { name: string; isHost: boolean }[]
  round: {
    current: number
    total: number
    item: { name: string; description: string; imageEmoji: string }
    timeLimit: number
    startingBid: number
  } | null
  highestBid: number
  highestBidder: string | null
  yourBid: number | null
  secondsLeft: number
  roundResult: RoundEndMessage | null
  finalLeaderboard: LeaderboardEntry[]
  finalWinner: string | null
  toast: string | null
}

const initial: GameState = {
  view: 'join',
  playerId: null,
  name: null,
  isHost: false,
  balance: 0,
  profit: 0,
  roomId: null,
  players: [],
  round: null,
  highestBid: 0,
  highestBidder: null,
  yourBid: null,
  secondsLeft: 0,
  roundResult: null,
  finalLeaderboard: [],
  finalWinner: null,
  toast: null,
}

type Action = { type: 'MSG'; msg: ServerMessage } | { type: 'RESET' } | { type: 'CLEAR_TOAST' }

function reducer(state: GameState, action: Action): GameState {
  if (action.type === 'RESET') return initial
  if (action.type === 'CLEAR_TOAST') return { ...state, toast: null }

  const { msg } = action

  switch (msg.type) {
    case 'joined':
      return { ...state, view: 'lobby', playerId: msg.playerId, name: msg.name, balance: msg.balance, isHost: msg.isHost, roomId: msg.roomId, profit: 0 }
    case 'lobby_update':
      return { ...state, players: msg.players }
    case 'round_start':
      return { ...state, view: 'auction', round: { current: msg.round, total: msg.totalRounds, item: msg.item, timeLimit: msg.timeLimit, startingBid: msg.startingBid }, highestBid: msg.startingBid, highestBidder: null, yourBid: null, secondsLeft: msg.timeLimit, roundResult: null }
    case 'bid_update':
      return { ...state, highestBid: msg.highestBid, highestBidder: msg.highestBidder, yourBid: msg.yourBid }
    case 'timer':
      return { ...state, secondsLeft: msg.secondsLeft }
    case 'round_end': {
      const me = msg.leaderboard.find(e => e.name === state.name)
      return { ...state, roundResult: msg, balance: me?.balance ?? state.balance, profit: me?.profit ?? state.profit }
    }
    case 'game_over':
      return { ...state, view: 'results', finalLeaderboard: msg.leaderboard, finalWinner: msg.winner, roundResult: null }
    case 'player_left':
      return { ...state, toast: `${msg.name} left (${msg.playersLeft} remaining)` }
    case 'error':
      return { ...state, toast: msg.message }
    default:
      return state
  }
}

export default function App() {
  const [state, dispatch] = useReducer(reducer, initial)
  const wsRef = useRef<WebSocket | null>(null)

  const send = useCallback((msg: object) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(msg))
    }
  }, [])

  const connect = useCallback((name: string, roomId: string) => {
    const proto = location.protocol === 'https:' ? 'wss' : 'ws'
    const url = import.meta.env.DEV ? 'ws://localhost:3000' : `${proto}://${location.host}`
    const ws = new WebSocket(url)
    wsRef.current = ws

    ws.onopen = () => send({ type: 'join', name, roomId })
    ws.onmessage = (ev) => dispatch({ type: 'MSG', msg: JSON.parse(ev.data) })
    ws.onclose = () => {
      dispatch({ type: 'RESET' })
      dispatch({ type: 'MSG', msg: { type: 'error', message: 'Disconnected from server' } })
    }
  }, [send])

  const reset = useCallback(() => {
    wsRef.current?.close()
    dispatch({ type: 'RESET' })
  }, [])

  return (
    <>
      {state.view === 'join'    && <JoinView onJoin={connect} />}
      {state.view === 'lobby'   && <LobbyView state={state} send={send} />}
      {state.view === 'auction' && <AuctionView state={state} send={send} />}
      {state.view === 'results' && <ResultsView state={state} onPlayAgain={reset} />}

      {state.roundResult && <RoundEndOverlay result={state.roundResult} />}

      {state.toast && (
        <div style={toastStyle} onClick={() => dispatch({ type: 'CLEAR_TOAST' })}>
          {state.toast}
        </div>
      )}
    </>
  )
}

const toastStyle: React.CSSProperties = {
  position: 'fixed', bottom: 24, left: '50%', transform: 'translateX(-50%)',
  background: '#c0392b', color: '#fff', padding: '10px 20px',
  borderRadius: 8, fontSize: '0.9rem', cursor: 'pointer', zIndex: 20,
}
