import type { CardInstance, CurseRef } from "@/shared/domain";
import { cards, isCurse } from "@/shared/cards";
export interface CurseBadge {
  id: string;
  key: string;
  name: string;
  origin: string;
  upgraded: boolean;
}
export function curseInstances(list: readonly CardInstance[]): CardInstance[] {
  return list.filter((c) => isCurse(c.key));
}
export function curseCount(list: readonly CardInstance[]): number {
  return curseInstances(list).length;
}
export function curseBadges(list: readonly CardInstance[]): CurseBadge[] {
  return curseInstances(list).map((c) => ({
    id: c.id,
    key: c.key,
    name: cards[c.key]?.name ?? c.key,
    origin: c.origin ?? "",
    upgraded: c.upgraded,
  }));
}
export function toCurseRefs(list: readonly CardInstance[]): CurseRef[] {
  return curseInstances(list).map((c) => ({
    id: c.id,
    key: c.key,
    ...(c.origin ? { origin: c.origin } : {}),
  }));
}
export function sameCurseRef(a: CurseRef, b: CurseRef) {
  return a.id === b.id && a.key === b.key;
}
export function shortId(id: string) {
  return id.slice(-6);
}
