import type { CardInstance, CurseRef } from "@/shared/domain";
import { isCurse } from "@/shared/cards";
import { uid } from "@/shared/random";
export function starter(): CardInstance[] {
  return [
    "strike",
    "strike",
    "strike",
    "guard",
    "guard",
    "venom",
    "focus",
    "shelter",
  ].map((key) => createCard(key));
}
export function createCard(key: string, origin?: string): CardInstance {
  return {
    id: uid("card"),
    key,
    upgraded: false,
    ...(origin ? { origin } : {}),
  };
}
export function createCurse(key: string, origin: string): CardInstance {
  return createCard(key, origin);
}
export function canRemove(size: number) {
  return size > 5;
}
export function findCurse(list: readonly CardInstance[], id: string) {
  return list.find((c) => c.id === id && isCurse(c.key));
}
export function curseRef(card: CardInstance): CurseRef {
  return { id: card.id, key: card.key, origin: card.origin };
}
