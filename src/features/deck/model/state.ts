import { reactive, readonly } from "vue";
import {
  starter,
  createCard,
  createCurse,
  canRemove,
  findCurse,
  curseRef,
} from "../lib/collection";
import {
  upgradeCost,
  removalCost,
  purifyCost,
  campHealing,
} from "../lib/costs";
import type { CardInstance, CurseRef, ExpeditionSummary } from "@/shared/domain";
import { cards, isCurse } from "@/shared/cards";
import { sameCurseRef } from "../lib/curse";
const state = reactive({
  cards: starter(),
  hero: { hp: 72, maxHp: 72, gold: 80, scars: 0 } as ExpeditionSummary,
  removals: 0,
  purifications: 0,
  campUsed: false,
  selected: "",
  seals: [] as CurseRef[],
  sealTarget: null as CurseRef | null,
});
export const deckState = readonly(state);
export function deckCards(): CardInstance[] {
  return state.cards.map((c) => ({ ...c }));
}
export function pendingSeals(): CurseRef[] {
  return state.seals.map((s) => ({ ...s }));
}
export function addCard(key: string) {
  state.cards.push(createCard(key));
}
export function addCurse(key: string, origin: string) {
  if (!isCurse(key)) return null;
  const existing = state.cards.find(
    (c) => c.origin === origin && c.key === key,
  );
  if (existing) return existing;
  const card = createCurse(key, origin);
  state.cards.push(card);
  return card;
}
export function spendGold(amount: number) {
  if (!Number.isFinite(amount) || amount < 0 || amount > state.hero.gold)
    return false;
  state.hero.gold -= amount;
  return true;
}
export function earnGold(amount: number) {
  state.hero.gold += Math.max(0, amount);
}
export function setHp(hp: number) {
  state.hero.hp = Math.min(state.hero.maxHp, Math.max(0, hp));
}
export function heal(amount: number) {
  setHp(state.hero.hp + amount);
}
export function selectCard(id: string) {
  state.selected = id;
}
export function upgradeCard(id: string, free = false) {
  const c = state.cards.find((c) => c.id === id);
  if (!c || c.upgraded || isCurse(c.key)) return false;
  if (!free && !spendGold(upgradeCost(c.upgraded, state.hero.scars)))
    return false;
  c.upgraded = true;
  return true;
}
export function removeCard(id: string) {
  const target = state.cards.find((c) => c.id === id);
  // 诅咒不能走普通移除；必须用净化，且一次只净化选中的实例。
  if (!target || isCurse(target.key)) return false;
  if (
    !canRemove(state.cards.length) ||
    !spendGold(removalCost(state.removals))
  )
    return false;
  // 只移除这一个实例；同名诅咒的其余实例必须逐个处理。
  state.cards = state.cards.filter((c) => c.id !== id);
  state.removals++;
  state.selected = "";
  return true;
}
export function purifyCard(id: string, free = false) {
  const card = findCurse(state.cards, id);
  if (!card) return false;
  if (!free && !spendGold(purifyCost(state.purifications))) return false;
  state.cards = state.cards.filter((c) => c.id !== id);
  state.purifications++;
  state.seals = state.seals.filter((s) => !sameCurseRef(s, curseRef(card)));
  if (state.sealTarget && sameCurseRef(state.sealTarget, curseRef(card)))
    state.sealTarget = null;
  state.selected = "";
  return true;
}
export function grantSeal(refs: CurseRef[]) {
  // 只为永久牌组中仍存在的诅咒实例挂上封印。
  const valid = refs.filter((r) =>
    state.cards.some((c) => c.id === r.id && c.key === r.key && isCurse(c.key)),
  );
  if (!valid.length) return false;
  state.seals = state.seals.filter(
    (s) => !valid.some((r) => sameCurseRef(s, r)),
  );
  state.seals.push(...valid.map((r) => ({ ...r })));
  return true;
}
export function clearSeals() {
  state.seals = [];
  state.sealTarget = null;
}
export function openCamp() {
  state.campUsed = false;
}
export function useCamp(
  action: "rest" | "upgrade" | "purify",
  heat: number,
) {
  if (state.campUsed) return false;
  if (action === "rest") heal(campHealing(state.hero.maxHp, heat));
  else if (action === "upgrade") {
    if (!upgradeCard(state.selected, true)) return false;
  } else if (action === "purify") {
    // 牺牲这次免费强化，把选中诅咒永久净化。
    const c = findCurse(state.cards, state.selected);
    if (!c || !purifyCard(c.id, true)) return false;
  }
  state.campUsed = true;
  return true;
}
export function exportDeck() {
  return JSON.parse(
    JSON.stringify({
      cards: state.cards,
      hero: state.hero,
      removals: state.removals,
      purifications: state.purifications,
      campUsed: state.campUsed,
      seals: state.seals,
      sealTarget: state.sealTarget,
    }),
  );
}
export interface DeckSnapshot {
  cards: CardInstance[];
  hero: ExpeditionSummary;
  removals: number;
  purifications: number;
  campUsed: boolean;
  seals: CurseRef[];
  sealTarget: CurseRef | null;
}
export function restoreDeck(d: DeckSnapshot) {
  state.cards = (d.cards ?? []).map((c) => ({
    id: c.id,
    key: c.key,
    upgraded: !!c.upgraded,
    ...(c.origin ? { origin: c.origin } : {}),
  }));
  state.hero = { ...d.hero };
  state.removals = Number.isFinite(d.removals) ? d.removals : 0;
  state.purifications = Number.isFinite(d.purifications)
    ? d.purifications
    : 0;
  state.campUsed = !!d.campUsed;
  state.seals = Array.isArray(d.seals) ? d.seals.map((s) => ({ ...s })) : [];
  // 封印只针对牌组中仍然存在的诅咒实例。
  state.seals = state.seals.filter((s) =>
    state.cards.some(
      (c) => c.id === s.id && c.key === s.key && isCurse(c.key),
    ),
  );
  state.sealTarget =
    d.sealTarget &&
    state.seals.some((s) => sameCurseRef(s, d.sealTarget!))
      ? d.sealTarget
      : null;
  state.selected = "";
}
export function resetDeck() {
  state.cards = starter();
  state.hero = { hp: 72, maxHp: 72, gold: 80, scars: 0 };
  state.removals = 0;
  state.purifications = 0;
  state.campUsed = false;
  state.selected = "";
  state.seals = [];
  state.sealTarget = null;
}
