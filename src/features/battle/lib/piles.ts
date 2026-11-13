import type { CardInstance } from "@/shared/domain";
import { shuffle, hash } from "@/shared/random";
export interface Piles {
  draw: CardInstance[];
  hand: CardInstance[];
  discard: CardInstance[];
  exhaust: CardInstance[];
}
export type DrawListener = (card: CardInstance, drawn: number) => boolean | void;
export function makePiles(cards: CardInstance[], seed: string): Piles {
  return {
    draw: shuffle(cards, hash(seed)),
    hand: [],
    discard: [],
    exhaust: [],
  };
}
export function drawCards(
  p: Piles,
  n: number,
  seed: number,
  onDraw?: DrawListener,
) {
  for (let i = 0; i < n; i++) {
    if (!p.draw.length && p.discard.length) {
      p.draw = shuffle(p.discard, seed + i);
      p.discard = [];
    }
    const card = p.draw.pop();
    if (!card) continue;
    p.hand.push(card);
    if (onDraw && onDraw(card, i) === false) break;
  }
}
export function discardHand(p: Piles) {
  p.discard.push(...p.hand);
  p.hand = [];
}
export function discardFromHand(p: Piles, ids: string[]) {
  const removed = p.hand.filter((c) => ids.includes(c.id));
  if (!removed.length) return [];
  p.hand = p.hand.filter((c) => !ids.includes(c.id));
  p.discard.push(...removed);
  return removed;
}
