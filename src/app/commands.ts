import { enterRoute, resolveRoute, resetRoute } from "@/features/route";
import {
  battleState,
  beginBattle,
  playCard,
  endTurn,
  resetBattle,
} from "@/features/battle";
import {
  deckState,
  deckCards,
  addCard,
  addCurse,
  earnGold,
  spendGold,
  setHp,
  heal,
  upgradeCard,
  removeCard,
  purifyCard,
  grantSeal,
  clearSeals,
  pendingSeals,
  openCamp,
  useCamp,
  resetDeck,
} from "@/features/deck";
import {
  openReward,
  claimReward,
  resetReward,
  chooseRewardSeal,
} from "@/features/reward";
import {
  openShop,
  preparePurchase,
  preparePurify,
  completePurchase,
  closeShop,
  resetShop,
} from "@/features/shop";
import {
  session,
  switchTab,
  setContext,
  notify,
  finishRun,
  resetSession,
} from "./session";
import { save, clearSave } from "./persistence";
function persist() {
  if (!save()) notify("本地保存失败，请保留当前页面。");
}
export function navigate(id: string) {
  if (session.ended) return;
  const c = enterRoute(id);
  if (!c) return;
  setContext(c);
  if (c.kind === "shop") {
    openShop(c);
    switchTab("shop");
  } else if (c.kind === "camp") {
    openCamp();
    switchTab("deck");
  } else {
    const seals = pendingSeals();
    beginBattle(
      c,
      deckCards(),
      deckState.hero.hp,
      deckState.hero.maxHp,
      seals,
    );
    clearSeals();
    switchTab("battle");
  }
  notify(
    `进入 ${c.nodeId} · 威胁 ${c.influence.heat} / 好感 ${c.influence.favor}` +
      (c.curse ? ` · 代价：这张险路将带来诅咒` : ""),
  );
  persist();
}
export function play(id: string) {
  playCard(id);
  persist();
}
export function turn() {
  endTurn();
  persist();
}
export function settle() {
  const r = battleState.result;
  if (!r) return;
  // 封印只属于刚结束的这场战斗，结算即失效。
  clearSeals();
  if (!r.won) {
    setHp(r.hp);
    finishRun();
    notify("这次旅途已经结束。重新启程可保留你的经验。");
    persist();
    return;
  }
  // 险路的诅咒在胜利后才真正进入永久牌组。
  if (r.context.curse) {
    addCurse(r.context.curse, r.context.nodeId);
  }
  if (openReward(JSON.parse(JSON.stringify(r)), deckCards())) {
    setHp(r.hp);
    switchTab("reward");
    notify("胜利！选择一张牌或封印一个诅咒，金币都会结算。");
  }
  persist();
}
export function claim(skip: boolean) {
  const grant = claimReward(skip);
  if (!grant) return;
  if (grant.card) addCard(grant.card);
  earnGold(grant.gold);
  heal(grant.heal);
  if (grant.seal) grantSeal([grant.seal]);
  resolveRoute();
  if (session.context?.kind === "boss") {
    finishRun();
    notify("裂隙已被封存。你把余烬带回了黎明。");
  } else notify("奖励已结算，新的路线开放。");
  switchTab("route");
  persist();
}
export function buy(id: string) {
  const p = preparePurchase(id);
  if (!p || !spendGold(p.price)) {
    notify("无法购买：库存或金币不足。");
    return;
  }
  if (!completePurchase(p)) {
    earnGold(p.price);
    return;
  }
  addCard(p.card);
  notify("交易完成，卡牌已收入牌组。");
  persist();
}
export function purifyShop(id: string) {
  const p = preparePurify(id, deckState.purifications);
  if (!p || !spendGold(p.price)) {
    notify("无法净化：金币不足。");
    return;
  }
  if (!purifyCard(id, true)) {
    earnGold(p.price);
    notify("无法净化：该诅咒实例已不在永久牌组中。");
    return;
  }
  completePurchase(p);
  notify("净化完成。这个诅咒实例已永久离开牌组。");
  persist();
}
export function leaveShop() {
  closeShop();
  resolveRoute();
  switchTab("route");
  persist();
}
export function camp(action: "rest" | "upgrade" | "purify") {
  if (
    !session.context ||
    session.context.kind !== "camp" ||
    !useCamp(action, session.context.influence.heat)
  )
    return;
  resolveRoute();
  notify(
    action === "purify"
      ? "篝火吞掉了这段诅咒，你牺牲了一次强化。"
      : "篝火逐渐熄灭，你准备好继续上路。",
  );
  persist();
}
export function upgrade(id: string) {
  if (battleState.phase === "playing") return;
  notify(upgradeCard(id) ? "卡牌强化完成。" : "无法强化：金币不足或已经强化。");
  persist();
}
export function remove(id: string) {
  if (battleState.phase === "playing") return;
  notify(
    removeCard(id)
      ? "已移除卡牌。"
      : "无法移除：至少保留五张牌，且需要足够金币。",
  );
  persist();
}
export function purify(id: string) {
  if (battleState.phase === "playing") return;
  notify(
    purifyCard(id)
      ? "永久净化完成，只移除了这一个诅咒实例。"
      : "无法净化：只能选择诅咒实例，且需要足够金币。",
  );
  persist();
}
export function rewardSeal(id: string) {
  chooseRewardSeal(id);
  persist();
}
export function restart() {
  resetRoute();
  resetBattle();
  resetDeck();
  resetReward();
  resetShop();
  resetSession();
  clearSave();
  persist();
}
