import { useReducer, useCallback, useRef, useState } from 'react'
import type { ServerMessage, RoundEndMessage, LeaderboardEntry } from './types'
import JoinView from './views/JoinView'
import LobbyView from './views/LobbyView'
import AuctionView from './views/AuctionView'
import ResultsView from './views/ResultsView'
import RoundEndOverlay from './components/RoundEndOverlay'
import ConnectionStatus, { type ConnStatus } from './components/ConnectionStatus'

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
    hint: string
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
      return { ...state, view: 'auction', round: { current: msg.round, total: msg.totalRounds, item: msg.item, timeLimit: msg.timeLimit, startingBid: msg.startingBid, hint: msg.hint }, highestBid: msg.startingBid, highestBidder: null, yourBid: null, secondsLeft: msg.timeLimit, roundResult: null }
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
  const intentionalClose = useRef(false)
  const [conn, setConn] = useState<ConnStatus>('idle')
  const [joinError, setJoinError] = useState<string | null>(null)

  const send = useCallback((msg: object) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(msg))
    }
  }, [])

  const connect = useCallback((name: string, roomId: string) => {
    setConn('connecting')
    setJoinError(null)
    dispatch({ type: 'CLEAR_TOAST' })

    const proto = location.protocol === 'https:' ? 'wss' : 'ws'
    const url = import.meta.env.DEV ? 'ws://localhost:3000' : `${proto}://${location.host}`
    const ws = new WebSocket(url)
    wsRef.current = ws

    let opened = false
    ws.onopen = () => { opened = true; setConn('connected'); send({ type: 'join', name, roomId }) }
    ws.onmessage = (ev) => dispatch({ type: 'MSG', msg: JSON.parse(ev.data) })
    ws.onerror = () => { if (!opened) setJoinError('CONNECTION FAILED — SERVER UNREACHABLE') }
    ws.onclose = () => {
      setConn('disconnected')
      if (intentionalClose.current) { intentionalClose.current = false; return }
      if (!opened) setJoinError('CONNECTION FAILED — SERVER UNREACHABLE')
      dispatch({ type: 'RESET' })
      dispatch({ type: 'MSG', msg: { type: 'error', message: 'Disconnected from server' } })
    }
  }, [send])

  const reset = useCallback(() => {
    intentionalClose.current = true
    wsRef.current?.close()
    setConn('idle')
    setJoinError(null)
    dispatch({ type: 'RESET' })
  }, [])

  return (
    <>
      {/* keyed wrapper → CRT power-on flicker each time the view changes */}
      <div key={state.view} className="poweron w-full">
        {state.view === 'join'    && <JoinView onJoin={connect} connecting={conn === 'connecting'} error={joinError ?? state.toast} />}
        {state.view === 'lobby'   && <LobbyView state={state} send={send} />}
        {state.view === 'auction' && <AuctionView state={state} send={send} />}
        {state.view === 'results' && <ResultsView state={state} onPlayAgain={reset} />}
      </div>

      {state.view !== 'join' && <ConnectionStatus status={conn} />}

      {state.roundResult && <RoundEndOverlay result={state.roundResult} me={state.name} />}

      {/* Join screen surfaces errors inline, so only toast elsewhere */}
      {state.toast && state.view !== 'join' && (
        <div
          className="fixed bottom-6 left-1/2 -translate-x-1/2 z-20 border-4 px-6 py-3 cursor-pointer tracking-widest text-[8px] slidein"
          style={{ borderColor: 'var(--danger)', color: 'var(--danger)', background: '#000', boxShadow: '4px 4px 0 var(--danger)' }}
          onClick={() => dispatch({ type: 'CLEAR_TOAST' })}
        >
          ⚠ {state.toast.toUpperCase()}
        </div>
      )}
    </>
  )
}
