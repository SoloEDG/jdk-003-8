<script setup lang="ts">
import { computed } from "vue";
import { deckState, pendingSeals } from "../model/state";
import { cards } from "@/shared/cards";
import { curseBadges, shortId } from "../lib/curse";
defineProps<{ compact?: boolean }>();
const curses = computed(() => curseBadges(deckState.cards));
const seals = computed(() => pendingSeals());
</script>
<template>
  <div class="curse-ledger" :class="{ compact }">
    <div class="curse-head">
      <span>诅咒清单 · {{ curses.length }} 个实例</span>
      <small>永久净化改牌组 / 本场封印不改牌组</small>
    </div>
    <div v-if="curses.length" class="curse-list">
      <div v-for="c in curses" :key="c.id" class="ledger-row">
        <b>{{ c.name }}</b>
        <small>#{{ shortId(c.id) }} · 来自 {{ c.origin || "旅途" }}</small>
        <span>{{ cards[c.key]?.text }}</span>
        <em v-if="seals.some((s) => s.id === c.id)">已预约下一场封印</em>
        <em v-else>未净化</em>
      </div>
    </div>
    <div v-else class="curse-clear">牌组中暂无诅咒。</div>
  </div>
</template>
