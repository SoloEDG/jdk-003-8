<script setup lang="ts">
import {
  rewardState,
  chooseReward,
  chooseRewardSeal,
  clearRewardSeal,
} from "../model/state";
import { cards } from "@/shared/cards";
import { shortId } from "@/features/deck/lib/curse";
import { deckCards } from "@/features/deck/model/state";
import { refreshSealTargets } from "../model/state";
import { onMounted } from "vue";

defineEmits<{ claim: [skip: boolean] }>();
onMounted(() => refreshSealTargets(deckCards()));
</script>
<template>
  <section class="panel">
    <div class="section-top">
      <span class="eyebrow">03 / THE SPOILS</span><span>三选一</span>
    </div>
    <h2>把胜利带进下一场</h2>
    <p class="muted">
      战斗结束后结算金币，并选择一张新牌。林地额外疗愈，险路改变奖励池。
    </p>
    <div v-if="rewardState.offer && !rewardState.offer.claimed">
      <div class="notice">
        ✦ {{ rewardState.offer.gold }} 金币 · 回复
        {{ rewardState.offer.heal }} 生命
      </div>
      <div class="reward-options">
        <button
          v-for="key in rewardState.offer.cards"
          :key="key"
          :class="{ selected: rewardState.selected === key }"
          @click="chooseReward(key)"
        >
          <b>{{ cards[key]?.name }}</b
          ><small>{{ cards[key]?.text }}</small
          ><em>{{ cards[key]?.rarity }}</em>
        </button>
      </div>
      <div v-if="rewardState.offer.sealTargets.length" class="seal-choice">
        <div class="curse-head">
          <span>可选 · 暂时封印一个诅咒（仅下一场战斗）</span>
          <small>封印不修改永久牌组</small>
        </div>
        <button
          v-for="s in rewardState.offer.sealTargets"
          :key="s.id"
          class="seal-chip"
          :class="{ selected: rewardState.sealTarget?.id === s.id }"
          :data-seal="s.id"
          @click="chooseRewardSeal(s.id)"
        >
          <b>{{ cards[s.key]?.name }}</b>
          <small>#{{ shortId(s.id) }} · 来自 {{ s.origin || "旅途" }}</small>
        </button>
        <button
          v-if="rewardState.sealTarget"
          class="clear-seal"
          @click="clearRewardSeal()"
        >
          取消封印
        </button>
      </div>
      <div class="toolbar">
        <button
          :disabled="!rewardState.selected"
          data-action="claim"
          @click="$emit('claim', false)"
        >
          收下选中牌与战利品</button
        ><button data-action="skip-reward" @click="$emit('claim', true)">
          仅收取金币
        </button>
      </div>
    </div>
    <div v-else class="empty-mini">
      {{
        rewardState.offer?.claimed
          ? "战利品已收入行囊。下一段路线已开放。"
          : "战胜敌人，发现下一张关键卡牌。"
      }}
    </div>
  </section>
</template>
