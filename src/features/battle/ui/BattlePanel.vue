<script setup lang="ts">
import { computed } from "vue";
import { battleState, currentIntent } from "../model/state";
import { cards, isCurse } from "@/shared/cards";
import ActorCard from "./ActorCard.vue";
defineEmits<{ play: [id: string]; end: []; settle: [] }>();
const sealedIds = computed(() => new Set(battleState.sealed.map((s) => s.id)));
const curseCards = computed(() =>
  battleState.piles.hand.filter((c) => isCurse(c.key)),
);
const stats = computed(() => battleState.curseStats);
</script>
<template>
  <section class="panel battle-panel">
    <div class="section-top">
      <span class="eyebrow">02 / THE ENCOUNTER</span
      ><span>回合 {{ battleState.turn }}</span>
    </div>
    <h2>{{ battleState.enemy?.name ?? "等待下一场遭遇" }}</h2>
    <div v-if="battleState.enemy" class="arena">
      <ActorCard :actor="battleState.hero" name="余烬旅人" />
      <div class="versus">
        VS<br /><small>{{ battleState.context?.region.toUpperCase() }}</small>
      </div>
      <ActorCard
        :actor="battleState.enemy"
        :name="battleState.enemy.name"
        enemy
        :intent="currentIntent()"
      />
    </div>
    <div v-else class="empty-art">
      ✧
      <p>在路线图中选择一个哨站<br /><small>每次出牌都可能改变战局</small></p>
    </div>
    <div v-if="battleState.phase === 'playing'">
      <div class="energy-line">
        <b>◉ {{ battleState.energy }} / 3 能量</b
        ><span
          >抽牌 {{ battleState.piles.draw.length }} · 弃牌
          {{ battleState.piles.discard.length }} · 消耗
          {{ battleState.piles.exhaust.length }}</span
        ><button data-action="end-turn" @click="$emit('end')">
          结束回合 →
        </button>
      </div>
      <div v-if="stats.triggers || stats.sealedSkips" class="curse-ticker">
        本场诅咒触发 {{ stats.triggers }} 次 · 失血 {{ stats.hpPaid }} · 弃牌
        {{ stats.discarded }}
        <span v-if="stats.sealedSkips"> · 封印挡下 {{ stats.sealedSkips }} 次</span>
      </div>
      <div class="hand">
        <button
          v-for="c in battleState.piles.hand"
          :key="c.id"
          class="playing-card"
          :class="{ curse: isCurse(c.key), sealed: sealedIds.has(c.id) }"
          :data-hand-id="c.id"
          :disabled="isCurse(c.key) || cards[c.key]!.cost > battleState.energy"
          @click="isCurse(c.key) ? null : $emit('play', c.id)"
        >
          <i>{{ isCurse(c.key) ? "✖" : cards[c.key]!.cost }}</i
          ><span>{{
            isCurse(c.key)
              ? "☠"
              : cards[c.key]!.kind === "attack"
                ? "⚔"
                : cards[c.key]!.kind === "power"
                  ? "✺"
                  : "◇"
          }}</span>
          <h3>{{ cards[c.key]!.name }}{{ c.upgraded ? " +" : "" }}</h3>
          <p>{{ cards[c.key]!.text }}<b v-if="c.upgraded"> 效果 +2</b></p>
          <small>{{
            isCurse(c.key) ? "CURSE · 不可打出" : cards[c.key]!.kind.toUpperCase()
          }}</small>
          <em v-if="sealedIds.has(c.id)" class="seal-tag">本场已封印</em>
        </button>
      </div>
      <p v-if="curseCards.length" class="muted curse-hint">
        手牌中有 {{ curseCards.length }} 张诅咒。它们占用手牌且不能打出，会在下次抽到时按自身效果发作。
        封印只封住指定实例，且仅限本场。
      </p>
    </div>
    <div
      v-if="battleState.phase === 'won' || battleState.phase === 'lost'"
      class="notice"
    >
      <h3>
        {{
          battleState.phase === "won"
            ? "遭遇胜利 · 火种仍在"
            : "旅途结束 · 余烬熄灭"
        }}
      </h3>
      <button data-action="settle" @click="$emit('settle')">
        {{ battleState.phase === "won" ? "收取战利品 →" : "查看旅程结果" }}
      </button>
    </div>
    <details v-if="battleState.log.length" open>
      <summary>效果记录 · 最新在前</summary>
      <div class="battle-log">
        <p v-for="(line, i) in battleState.log" :key="i">{{ line }}</p>
      </div>
    </details>
  </section>
</template>
