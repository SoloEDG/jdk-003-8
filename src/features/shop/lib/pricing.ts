import type { Influence } from "@/shared/domain";
export function priceFor(base: number, influence: Influence) {
  return Math.max(12, base + influence.scarcity * 5 - influence.favor * 3);
}
export function purifyPriceFor(count: number, influence: Influence) {
  return Math.max(
    30,
    55 + count * 20 + influence.scarcity * 4 - influence.favor * 3,
  );
}
export function quoteMessage(favor: number, scarcity: number) {
  return `好感折扣 −${favor * 3} / 稀缺附加 +${scarcity * 5}`;
}
