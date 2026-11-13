<script setup lang="ts">
import { computed } from "vue";
import { deckState, selectCard, pendingSeals } from "../model/state";
import { cards, isCurse } from "@/shared/cards";
import { upgradeCost, removalCost, purifyCost } from "../lib/costs";
import { curseBadges, shortId } from "../lib/curse";
defineProps<{ camp: boolean; locked: boolean }>();
const emit = defineEmits<{
  upgrade: [id: string];
  remove: [id: string];
  purify: [id: string];
  camp: [action: "rest" | "upgrade" | "purify"];
}>();
const curses = computed(() => curseBadges(deckState.cards));
const seals = computed(() => pendingSeals());
const selected = computed(() =>
  deckState.cards.find((c) => c.id === deckState.selected),
);
const selectedIsCurse = computed(() => !!selected.value && isCurse(selected.value.key));
</script>
<template>
  <section class="panel">
    <div class="section-top">
      <span class="eyebrow">05 / YOUR ARSENAL</span
      ><span>{{ deckState.cards.length }} 张 · 诅咒 {{ curses.length }}</span>
    </div>
    <h2>行囊中的可能</h2>
    <p class="muted">
      相同卡牌拥有独立身份。强化只影响选中的这一张，战斗中的牌组锁定。
    </p>
    <div class="curse-rule">
      <div>
        <b>永久净化</b>
        <p>
          在商店花费金币或篝火牺牲强化，从永久牌组中移除<em>这一张</em>诅咒实例。
          同名诅咒的其它实例仍然留在牌组，必须逐一净化。净化后下一场战斗不再抽到它。
        </p>
      </div>
      <div>
        <b>本场封印</b>
        <p>
          战斗奖励可封印一个诅咒实例，仅持续<em>下一场战斗</em>。封印不修改永久牌组：
          诅咒仍占牌位、仍会被抽到，但抽到时不发作。战斗结束后封印失效。
        </p>
      </div>
    </div>
    <div v-if="curses.length" class="curse-list">
      <div class="curse-head">
        <span>背负的诅咒 · {{ curses.length }} 个实例</span>
        <small>按实例计数，同名不合并</small>
      </div>
      <button
        v-for="c in curses"
        :key="c.id"
        class="curse-chip"
        :class="{ sealed: seals.some((s) => s.id === c.id) }"
        :data-curse-id="c.id"
        @click="selectCard(c.id)"
      >
        <b>{{ c.name }}</b>
        <small>{{ cards[c.key]?.text }}</small>
        <em>
          #{{ shortId(c.id) }} · 来自 {{ c.origin || "旅途" }}
          <span v-if="seals.some((s) => s.id === c.id)">· 已预约下一场封印</span>
        </em>
      </button>
    </div>
    <div v-else class="curse-clear">牌组中暂无诅咒。险路会带来代价。</div>
    <div v-if="camp" class="camp">
      <h3>篝火 · {{ deckState.campUsed ? "已经休整" : "选择一次休整" }}</h3>
      <button :disabled="deckState.campUsed" @click="emit('camp', 'rest')">
        休息 · 回复生命</button
      ><button
        :disabled="deckState.campUsed || !deckState.selected || selectedIsCurse"
        @click="emit('camp', 'upgrade')"
      >
        免费强化选中牌
      </button>
      <button
        :disabled="deckState.campUsed || !selectedIsCurse"
        data-action="camp-purify"
        @click="emit('camp', 'purify')"
      >
        牺牲强化 · 永久净化选中诅咒
      </button>
    </div>
    <div class="deck-list">
      <button
        v-for="c in deckState.cards"
        :key="c.id"
        :data-card-id="c.id"
        :class="{ selected: deckState.selected === c.id, curse: isCurse(c.key) }"
        @click="selectCard(c.id)"
      >
        <span>{{ cards[c.key]?.name }}{{ c.upgraded ? " +" : "" }}</span
        ><small>{{ cards[c.key]?.text }}</small
        ><em>{{ c.id.slice(-6) }}</em>
      </button>
    </div>
    <div class="toolbar">
      <button
        :disabled="locked || !deckState.selected || selectedIsCurse"
        @click="emit('upgrade', deckState.selected)"
      >
        强化 · {{ upgradeCost(false, deckState.hero.scars) }} 金</button
      ><button
        :disabled="
          locked ||
          !deckState.selected ||
          selectedIsCurse ||
          deckState.cards.length <= 5
        "
        @click="emit('remove', deckState.selected)"
      >
        移除 · {{ removalCost(deckState.removals) }} 金
      </button>
      <button
        v-if="selectedIsCurse"
        :disabled="locked"
        data-action="purify"
        @click="emit('purify', deckState.selected)"
      >
        永久净化 · {{ purifyCost(deckState.purifications) }} 金
      </button>
    </div>
  </section>
</template>
