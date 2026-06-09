import { AuctionRound } from "./types";
import { TOTAL_ROUNDS } from "./constants";

const CONDITIONS = [
  { label: "Mint Condition",      multiplier: 1.6},
  { label: "Authenticated",       multiplier: 1.3},
  { label: "Restored",            multiplier: 1.0},
  { label: "Well-worn",           multiplier: 0.7},
  { label: "Cracked",             multiplier: 0.4},
  { label: "Water-damaged",       multiplier: 0.3},
  { label: "Allegedly Authentic", multiplier: 0.05},
];

const ORIGINS = [
  "Victorian", "Ming Dynasty", "Prohibition-era", 
  "Cold War Soviet", "Pre-war Parisian", "Ancient Roman",
  "Medival", "Edo period Japanese",
]

const BASE_ITEMS = [
  { noun: "Pocket Watch", emoji: "⌚",  baseMin: 200, baseMax: 700  },
  { noun: "Oil Painting", emoji: "🖼️", baseMin: 150, baseMax: 900  },
  { noun: "Coin",         emoji: "🪙",  baseMin: 100, baseMax: 500  },
  { noun: "Compass",      emoji: "🧭",  baseMin:  80, baseMax: 400  },
  { noun: "Manuscript",   emoji: "📜",  baseMin: 200, baseMax: 800  },
  { noun: "Vase",         emoji: "🏺",  baseMin: 150, baseMax: 600  },
  { noun: "Ring",         emoji: "💍",  baseMin: 100, baseMax: 700  },
  { noun: "Statuette",    emoji: "🗿",  baseMin:  50, baseMax: 500  },
  { noun: "Journal",      emoji: "📖",  baseMin:  80, baseMax: 400  },
  { noun: "Gemstone",     emoji: "💎",  baseMin: 300, baseMax: 1000 },
];

const DESCRIPTIONS: ((c: string, o: string, n: string) => string)[] = [
  (c, o, n) => `${o} in origin. The ${c.toLowerCase()} condition raises more questions than answers.`,
  (c, o, n) => `Provenance: ${o}. Condition: ${c.toLowerCase()}. The auctioneer refused to elaborate.`,
  (c, o, n) => `A ${c.toLowerCase()} specimen from the ${o} period. An expert left the room when asked to appraise it.`,
  (c, o, n) => `${o} origin confirmed by paperwork that may or may not be genuine. Currently ${c.toLowerCase()}.`,
  (c, o, n) => `The ${n.toLowerCase()} arrived in a locked crate. It is ${c.toLowerCase()}. Nobody asked where it came from.`,
];

type BaseItem = (typeof BASE_ITEMS)[number];

/** Random integer in [min, max] inclusive. */
function randInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

/** Pick a uniformly random element from a non-empty array. */
function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

/** Return a new array with the elements shuffled (Fisher–Yates). */
function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/**
 * Build one auction round from a given base item. The base item is supplied
 * (rather than picked here) so the caller can guarantee distinct items within
 * a single game.
 */
function generateRound(base: BaseItem): AuctionRound {
  const condition = pick(CONDITIONS);
  const origin    = pick(ORIGINS);
  const descFn    = pick(DESCRIPTIONS);

  const name        = `${condition.label} ${origin} ${base.noun}`;
  const description = descFn(condition.label, origin, base.noun);

  // Plausible appraisal band for this item in this condition...
  const minValue = Math.max(10, Math.round(base.baseMin * condition.multiplier));
  const maxValue = Math.max(minValue, Math.round(base.baseMax * condition.multiplier));
  // ...and the hidden true value sampled somewhere inside it.
  const trueValue = randInt(minValue, maxValue);

  // Anchor the starting bid to the item's base range, NOT the true value, so
  // it can't be used to back out the answer.
  const startingBid = Math.max(10, Math.round(base.baseMin * 0.2));

  return {
    item: { name, description, imageEmoji: base.emoji, minValue, maxValue },
    trueValue,
    startingBid,
    highestBid: startingBid,
    highestBidderId: null,
    startedAt: 0,
    extensionLeft: 3,
  };
}

/** Generate a full game's worth of rounds with distinct items where possible. */
export function generateRounds(count: number = TOTAL_ROUNDS): AuctionRound[] {
  // Shuffle the catalog so each game draws distinct items; only repeat if a
  // game ever asks for more rounds than there are base items.
  const pool = shuffle(BASE_ITEMS);
  return Array.from({ length: count }, (_, i) => generateRound(pool[i % pool.length]));
}

