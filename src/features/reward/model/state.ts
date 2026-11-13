import { reactive, readonly } from "vue";
import type { BattleResult, CardInstance, CurseRef, RewardOffer } from "@/shared/domain";
import { offerFrom, validChoice, validSeal, sealChoice } from "../lib/settlement";
import { toCurseRefs } from "@/features/deck/lib/curse";
const state = reactive({
  offer: null as RewardOffer | null,
  history: [] as string[],
  selected: "",
  sealTarget: null as CurseRef | null,
});
export const rewardState = readonly(state);
export function openReward(
  result: BattleResult,
  curseDeck: CardInstance[] = [],
) {
  if (!result.won || state.history.includes(result.id)) return false;
  state.offer = offerFrom(result, curseDeck);
  state.selected = "";
  state.sealTarget = null;
  return true;
}
export function refreshSealTargets(deck: CardInstance[]) {
  if (!state.offer || state.offer.claimed) return;
  state.offer.sealTargets = toCurseRefs(deck);
  if (
    state.sealTarget &&
    !state.offer.sealTargets.some(
      (s) => s.id === state.sealTarget!.id && s.key === state.sealTarget!.key,
    )
  )
    state.sealTarget = null;
}
export function chooseReward(key: string) {
  if (state.offer?.cards.includes(key)) state.selected = key;
}
export function clearRewardSeal() {
  state.sealTarget = null;
}
export function chooseRewardSeal(id: string) {
  if (!validSeal(state.offer, id)) {
    state.sealTarget = null;
    return;
  }
  const target =
    state.offer!.sealTargets.find((s) => s.id === id) ?? null;
  state.sealTarget = sealChoice(target);
}
export function claimReward(skip = false) {
  if (!validChoice(state.offer, skip ? null : state.selected)) return null;
  const offer = state.offer!;
  offer.claimed = true;
  state.history.push(offer.source);
  const seal = state.sealTarget;
  state.sealTarget = null;
  return {
    card: skip ? null : state.selected,
    gold: offer.gold,
    heal: offer.heal,
    seal,
  };
}
export function exportReward() {
  return JSON.parse(
    JSON.stringify({
      offer: state.offer,
      history: state.history,
      sealTarget: state.sealTarget,
    }),
  );
}
export function restoreReward(d: ReturnType<typeof exportReward>) {
  state.offer = d.offer;
  state.history = d.history;
  state.selected = "";
  state.sealTarget = d.sealTarget ?? null;
}
export function resetReward() {
  state.offer = null;
  state.history = [];
  state.selected = "";
  state.sealTarget = null;
}
export { toCurseRefs };
