import { ItemTemplate, AuctionRound } from "./types";
import { TOTAL_ROUNDS } from "./constants";

//item pool 
//each item has a range of price and not a fixed price

const ITEM_POOL: ItemTemplate[] = [
  {
    name: "Vintage Wristwatch",
    description: "A hand-wound mechanical watch from the 1960s. Might be a Rolex. Might be a fake.",
    imageEmoji: "⌚",
    minValue: 200,
    maxValue: 800,
  },
  {
    name: "Mystery Painting",
    description: "Unsigned oil on canvas. The gallery owner swears it's a lost masterpiece.",
    imageEmoji: "🖼️",
    minValue: 100,
    maxValue: 1200,
  },
  {
    name: "Ancient Coin",
    description: "Corroded bronze coin. Origin unknown. Could be Roman. Could be a chocolate wrapper.",
    imageEmoji: "🪙",
    minValue: 50,
    maxValue: 500,
  },
  {
    name: "Stuffed Exotic Bird",
    description: "Victorian taxidermy. Glassy eyes follow you around the room.",
    imageEmoji: "🦜",
    minValue: 80,
    maxValue: 400,
  },
  {
    name: "First Edition Novel",
    description: "Water damaged. Missing the last page. The librarian is very upset it's here.",
    imageEmoji: "📖",
    minValue: 150,
    maxValue: 900,
  },
  {
    name: "Meteorite Fragment",
    description: "Heavy, dark, slightly warm. Certified by a guy named Dave.",
    imageEmoji: "🪨",
    minValue: 300,
    maxValue: 1000,
  },
  {
    name: "Ornate Music Box",
    description: "Plays a haunting melody. Stops when you look directly at it.",
    imageEmoji: "🎵",
    minValue: 120,
    maxValue: 600,
  },
  {
    name: "Sealed Crate",
    description: "Contents unknown. Something shifts inside when tilted. Smells faintly of the sea.",
    imageEmoji: "📦",
    minValue: 10,
    maxValue: 1500,  // highest variance — pure gamble
  },
  {
    name: "Cursed Compass",
    description: "Always points somewhere. Not north. Nobody knows where.",
    imageEmoji: "🧭",
    minValue: 90,
    maxValue: 700,
  },
  {
    name: "Jar of Suspicious Honey",
    description: "Glows faintly at night. Tastes incredible. The beekeeper refused to explain.",
    imageEmoji: "🍯",
    minValue: 40,
    maxValue: 300,
  },
];

//pick items
//we do fisher-yates shuffle its unbiased
//Math.random() sort trick looks clearn but is statistically biased
function shuffle<T>(arr: T[]): T[] {
    const a = [...arr];
    for(let i = a.length - 1; i > 0; i--){
        const j = Math.floor(Math.random() * (i + 1));
        [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
}

export function generateRounds(): AuctionRound[] {
    const picked  = shuffle(ITEM_POOL).slice(0, TOTAL_ROUNDS);

    return picked.map((item) => {
        const trueValue = 
            Math.floor(Math.random() * (item.maxValue - item.minValue + 1) + item.minValue);

        const startingBid = Math.round(trueValue * 0.1);

        return {
            item, 
            trueValue,
            startingBid, 
            highestBid: startingBid,
            highestBidderId: null,
            startedAt: 0,
        };
    });
} 