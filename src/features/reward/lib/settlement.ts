import type { BattleResult, CardInstance, CurseRef, RewardOffer } from "@/shared/domain";
import { rewardPool } from "./pool";
import { toCurseRefs } from "@/features/deck/lib/curse";
export function offerFrom(
  result: BattleResult,
  deck: CardInstance[] = [],
): RewardOffer {
  return {
    id: `reward-${result.id}`,
    source: result.id,
    cards: rewardPool(result.context),
    gold: result.gold + result.context.influence.favor * 2,
    heal: result.context.region === "forest" ? 3 : 0,
    claimed: false,
    sealTargets: toCurseRefs(deck),
  };
}
export function validChoice(offer: RewardOffer | null, key: string | null) {
  return (
    !!offer && !offer.claimed && (key === null || offer.cards.includes(key))
  );
}
export function validSeal(offer: RewardOffer | null, id: string) {
  return !!(
    offer &&
    !offer.claimed &&
    offer.sealTargets.some((s) => s.id === id)
  );
}
export function sealChoice(target: CurseRef | null) {
  return target ? { ...target } : null;
}
