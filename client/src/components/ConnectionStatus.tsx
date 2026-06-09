export type ConnStatus = 'idle' | 'connecting' | 'connected' | 'disconnected'

const MAP: Record<ConnStatus, { color: string; label: string; blink: boolean }> = {
  idle:         { color: 'var(--muted)',  label: 'IDLE',       blink: false },
  connecting:   { color: 'var(--gold)',   label: 'CONNECTING', blink: true  },
  connected:    { color: 'var(--green)',  label: 'ONLINE',     blink: false },
  disconnected: { color: 'var(--danger)', label: 'OFFLINE',    blink: true  },
}

/** Small fixed badge showing the live WebSocket state. */
export default function ConnectionStatus({ status }: { status: ConnStatus }) {
  const { color, label, blink } = MAP[status]

  return (
    <div
      className="fixed top-4 right-4 z-20 flex items-center gap-2 bevel px-3 py-2"
      role="status"
      aria-live="polite"
    >
      <span
        className={`w-2 h-2 ${blink ? 'blink' : ''}`}
        style={{ background: color }}
        aria-hidden
      />
      <span className="text-[8px] tracking-widest" style={{ color }}>
        {label}
      </span>
    </div>
  )
}
