import { reactive, readonly } from "vue";
import type {
  Actor,
  BattleResult,
  CardInstance,
  CurseRef,
  JourneyContext,
} from "@/shared/domain";
import { cards } from "@/shared/cards";
import { uid } from "@/shared/random";
import { spawnEnemy, enemyIntent, type Enemy } from "../lib/enemies";
import {
  makePiles,
  drawCards,
  discardHand,
  discardFromHand,
  type Piles,
} from "../lib/piles";
import { resolveEffect, poisonTick, damage, type EffectEvent } from "../lib/effects";
export interface CurseStats {
  draws: Record<string, number>;
  triggers: number;
  hpPaid: number;
  discarded: number;
  sealedSkips: number;
}
interface BattleState {
  id: string;
  context: JourneyContext | null;
  hero: Actor;
  enemy: Enemy | null;
  piles: Piles;
  energy: number;
  turn: number;
  phase: "idle" | "playing" | "won" | "lost";
  queue: EffectEvent[];
  log: string[];
  result: BattleResult | null;
  sealed: CurseRef[];
  curseStats: CurseStats;
}
const emptyHero = (): Actor => ({
  hp: 72,
  maxHp: 72,
  block: 0,
  strength: 0,
  poison: 0,
  thorns: 0,
});
const emptyCurseStats = (): CurseStats => ({
  draws: {},
  triggers: 0,
  hpPaid: 0,
  discarded: 0,
  sealedSkips: 0,
});
const state = reactive<BattleState>({
  id: "",
  context: null,
  hero: emptyHero(),
  enemy: null,
  piles: makePiles([], ""),
  energy: 3,
  turn: 1,
  phase: "idle",
  queue: [],
  log: [],
  result: null,
  sealed: [],
  curseStats: emptyCurseStats(),
});
export const battleState = readonly(state);
export function beginBattle(
  context: JourneyContext,
  deck: CardInstance[],
  hp: number,
  maxHp: number,
  seals: CurseRef[] = [],
) {
  state.id = uid("battle");
  state.context = context;
  state.hero = { ...emptyHero(), hp, maxHp };
  state.enemy = spawnEnemy(context);
  state.piles = makePiles(deck, context.nodeId);
  state.energy = 3;
  state.turn = 1;
  state.phase = "playing";
  state.queue = [];
  state.result = null;
  state.sealed = seals.map((s) => ({ ...s }));
  state.curseStats = emptyCurseStats();
  state.log = ["战斗开始。状态和牌堆仅属于本场遭遇。"];
  drawCards(state.piles, 5, 1, applyCurseOnDraw);
}
function finish() {
  if (!state.enemy || !state.context) return;
  if (state.hero.hp <= 0 || state.enemy.hp <= 0) {
    state.phase = state.hero.hp <= 0 ? "lost" : "won";
    state.result = {
      id: state.id,
      nodeId: state.context.nodeId,
      won: state.phase === "won",
      hp: state.hero.hp,
      gold: state.enemy.reward,
      context: JSON.parse(JSON.stringify(state.context)),
    };
    state.queue = [];
  }
}
function applyCurseOnDraw(card: CardInstance): boolean {
  const spec = cards[card.key];
  if (!spec || spec.kind !== "curse" || !spec.curse) return true;
  const trigger = spec.curse;
  const sealed = isSealed(card.id);
  state.curseStats.draws[card.id] = (state.curseStats.draws[card.id] ?? 0) + 1;
  if (sealed) {
    state.curseStats.sealedSkips++;
    state.log.unshift(`${spec.name} 已封印 · 本场抽到但不生效`);
    return true;
  }
  state.curseStats.triggers++;
  if (trigger.onDraw === "hpLoss") {
    state.hero.hp = Math.max(0, state.hero.hp - trigger.amount);
    state.curseStats.hpPaid += trigger.amount;
    state.log.unshift(`${spec.name} 发作 · 失血 ${trigger.amount}`);
  } else {
    const others = state.piles.hand.filter((c) => c.id !== card.id);
    const normal = others.filter((c) => cards[c.key]?.kind !== "curse");
    const victims = (normal.length ? normal : others).slice(0, trigger.amount);
    const removed = discardFromHand(
      state.piles,
      victims.map((c) => c.id),
    );
    state.curseStats.discarded += removed.length;
    state.log.unshift(
      removed.length
        ? `${spec.name} 发作 · 弃掉 ${removed.length} 张手牌`
        : `${spec.name} 发作 · 手牌为空`,
    );
  }
  finish();
  return state.phase === "playing";
}
function drain() {
  while (state.queue.length && state.phase === "playing") {
    const event = state.queue.shift()!;
    if (event.effect.type === "draw") {
      const before = state.piles.hand.length;
      drawCards(state.piles, event.effect.amount, state.turn, applyCurseOnDraw);
      const gained = state.piles.hand.length - before;
      state.log.unshift(`抽取 ${gained} 张牌`);
    } else if (event.effect.type === "energy") {
      state.energy += event.effect.amount;
    } else if (state.enemy)
      state.log.unshift(resolveEffect(event, state.hero, state.enemy));
    finish();
  }
  state.log = state.log.slice(0, 18);
}
export function playCard(id: string) {
  if (state.phase !== "playing") return false;
  const card = state.piles.hand.find((c) => c.id === id);
  if (!card) return false;
  const spec = cards[card.key]!;
  if (spec.kind === "curse") return false;
  if (state.energy < spec.cost) return false;
  state.energy -= spec.cost;
  state.piles.hand = state.piles.hand.filter((c) => c.id !== id);
  (spec.kind === "power" ? state.piles.exhaust : state.piles.discard).push(card);
  state.queue.push(
    ...spec.effects.map((e) => ({
      effect: {
        ...e,
        amount: e.amount + (card.upgraded && e.type !== "energy" ? 2 : 0),
      },
      source: "hero" as const,
      label: spec.name,
    })),
  );
  drain();
  return true;
}
export function endTurn() {
  if (state.phase !== "playing" || !state.enemy) return;
  const poison = poisonTick(state.enemy);
  if (poison) state.log.unshift(`敌人中毒失去 ${poison} 生命`);
  finish();
  if (state.phase !== "playing") return;
  const amount = enemyIntent(state.enemy, state.turn);
  damage(state.hero, amount);
  state.log.unshift(`敌人攻击 ${amount}`);
  poisonTick(state.hero);
  finish();
  if (state.phase !== "playing") return;
  discardHand(state.piles);
  state.turn++;
  state.energy = 3;
  state.hero.block = 0;
  state.enemy.block = state.turn % 3 === 0 ? 5 : 0;
  drawCards(state.piles, 5, state.turn, applyCurseOnDraw);
}
export function currentIntent() {
  return state.enemy ? enemyIntent(state.enemy, state.turn) : 0;
}
export function isSealed(id: string) {
  return state.sealed.some((s) => s.id === id);
}
export function exportBattle() {
  return JSON.parse(JSON.stringify(state)) as BattleState;
}
export function restoreBattle(d: BattleState) {
  Object.assign(state, {
    ...d,
    sealed: Array.isArray(d.sealed)
      ? d.sealed
          .map((s) =>
            typeof s === "string"
              ? { id: s, key: "", origin: undefined }
              : s,
          )
      : [],
    curseStats: { ...emptyCurseStats(), ...(d.curseStats ?? {}) },
  });
}
export function resetBattle() {
  state.phase = "idle";
  state.context = null;
  state.enemy = null;
  state.result = null;
  state.piles = makePiles([], "");
  state.log = [];
  state.sealed = [];
  state.curseStats = emptyCurseStats();
}
