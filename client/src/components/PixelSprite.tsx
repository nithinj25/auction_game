// A tiny pixel-art renderer: pass a `rows` map (array of equal-length strings)
// where each character maps to a colour in PALETTE. '.' is transparent.
// Rendered as a crisp CSS grid so it scales without blurring.

const PALETTE: Record<string, string> = {
  '.': 'transparent',
  '1': '#20202c', // hat / dark felt
  '2': '#f8b400', // gold (hat band, gavel)
  '3': '#ffcda0', // skin
  '4': '#101015', // eyes
  '5': '#e8e8f0', // collar / shirt
  '6': '#29adff', // suit
  '7': '#ff004d', // bow-tie
  '8': '#8b5a2b', // gavel handle
}

// 16x16 top-hat auctioneer with a little bow-tie and moustache.
export const AUCTIONEER: string[] = [
  '................',
  '.....11111......',
  '.....11111......',
  '.....11111......',
  '.....22222......',
  '...1111111111...',
  '.....33333......',
  '.....34343......',
  '.....33333......',
  '.....34443......',
  '....5555555.....',
  '....66677666....',
  '....66666666....',
  '....66666666....',
  '...6666666666...',
  '................',
]

// 8x8 gavel — handy little accent.
export const GAVEL: string[] = [
  '......88',
  '....882.',
  '...2222.',
  '..2222..',
  '.288....',
  '288.....',
  '88......',
  '8.......',
]

// 12x12 trophy — winner celebration.
export const TROPHY: string[] = [
  '.2222222222.',
  '22.222222.22',
  '22.222222.22',
  '22.222222.22',
  '.2.222222.2.',
  '..22222222..',
  '...222222...',
  '....2222....',
  '.....22.....',
  '.....22.....',
  '...888888...',
  '..88888888..',
]

interface Props {
  rows: string[]
  /** pixel size of each cell, in px */
  scale?: number
  className?: string
}

export default function PixelSprite({ rows, scale = 6, className = '' }: Props) {
  const height = rows.length
  const width = rows[0]?.length ?? 0

  return (
    <div
      className={className}
      style={{
        display: 'grid',
        gridTemplateColumns: `repeat(${width}, ${scale}px)`,
        gridTemplateRows: `repeat(${height}, ${scale}px)`,
        imageRendering: 'pixelated',
        lineHeight: 0,
      }}
      aria-hidden
    >
      {rows.flatMap((row, y) =>
        row.split('').map((ch, x) => (
          <div
            key={`${x}-${y}`}
            style={{ width: scale, height: scale, background: PALETTE[ch] ?? 'transparent' }}
          />
        )),
      )}
    </div>
  )
}
