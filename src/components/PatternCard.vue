<script setup lang="ts">
/**
 * @file 图案卡片：标题/标签/预览/作者/统计/操作区。
 */
import { computed } from 'vue'
import { NAvatar, NCard, NIcon, NSpace, NTag } from 'naive-ui'
import { Chat, Favorite, ThumbsUp, View } from '@vicons/carbon'
import type { PatternListItemDto } from '../api/types'
import GraphTableTemplate from './GraphTableTemplate.vue'
import { calcTotalCols, getYearMeta, isFutureCell } from '../utils/graph'
import { resolveAvatar, userAvatarFallback } from '../utils/avatar'
import { visibilityLabel, visibilityTagType } from '../utils/patternVisibility'

const props = withDefaults(defineProps<{
  item: PatternListItemDto
  clickable?: boolean
  showVisibilityTag?: boolean
  hidePublicVisibility?: boolean
  showYearTag?: boolean
  showAuthor?: boolean
  authorDateText?: string
  showMeta?: boolean
  showCommentCount?: boolean
  showDate?: boolean
  dateText?: string
}>(), {
  clickable: false,
  showVisibilityTag: true,
  hidePublicVisibility: false,
  showYearTag: false,
  showAuthor: false,
  showMeta: true,
  showCommentCount: false,
  showDate: false,
})

const emit = defineEmits<{
  (e: 'card-click', value: PatternListItemDto): void
  (e: 'user-click', value?: string): void
}>()

const months = ['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月']
const days = ['', '一', '', '三', '', '五', '']

const levelToColor = (level: number) => {
  const colors = [
    'var(--color-cell-empty)',
    'var(--color-cell-level-1)',
    'var(--color-cell-level-2)',
    'var(--color-cell-level-3)',
    'var(--color-cell-level-4)',
  ]
  return colors[level] ?? colors[0]!
}

const buildMonthPositions = (year: number, cols: number) => {
  const { daysInYear, startDayOfWeek } = getYearMeta(year)
  const positions: Array<{ label: string; colIndex: number }> = []
  let col = 0
  let row = startDayOfWeek
  const tempDate = new Date(year, 0, 1)
  for (let i = 0; i < daysInYear; i++) {
    if (tempDate.getDate() === 1) {
      positions.push({ label: months[tempDate.getMonth()]!, colIndex: col })
    }
    tempDate.setDate(tempDate.getDate() + 1)
    row++
    if (row > 6) {
      row = 0
      col++
    }
  }
  return positions.filter((p) => p.colIndex < cols)
}

const buildCalendarGrid = (cells: PatternListItemDto['cells'], year: number) => {
  const { daysInYear, startDayOfWeek } = getYearMeta(year)
  const cols = calcTotalCols(year)
  const grid: Array<Array<{ level: number; isFuture: boolean } | null>> = Array.from({ length: cols }, () => Array(7).fill(null))
  const map = new Map<string, number>()
  cells.forEach((cell) => {
    map.set(`${cell.col}-${cell.row}`, cell.level)
  })
  for (let c = 0; c < cols; c++) {
    for (let r = 0; r < 7; r++) {
      const index = c * 7 + r
      if (index < startDayOfWeek || index >= startDayOfWeek + daysInYear) {
        grid[c][r] = null
        continue
      }
      grid[c][r] = {
        level: map.get(`${c}-${r}`) || 0,
        isFuture: isFutureCell(year, index, startDayOfWeek),
      }
    }
  }
  return grid
}

const showVisibility = computed(() => {
  if (!props.showVisibilityTag) return false
  if (props.hidePublicVisibility && props.item.visibility === 'public') return false
  return true
})

const handleCardClick = () => {
  if (!props.clickable) return
  emit('card-click', props.item)
}
</script>

<template>
  <n-card class="pattern-card" hoverable :class="{ clickable }" @click="handleCardClick">
    <div class="card-header">
      <div class="card-title">{{ item.title }}</div>
      <div class="card-header-actions" @click.stop>
        <n-space v-if="showVisibility || showYearTag" size="small" class="header-tags">
          <n-tag v-if="showVisibility" size="small" :type="visibilityTagType(item.visibility)">
            {{ visibilityLabel(item.visibility) }}
          </n-tag>
          <n-tag v-if="showYearTag" size="small" type="success">{{ item.year }}</n-tag>
        </n-space>
        <slot name="header-extra" />
      </div>
    </div>
    <div class="card-desc">{{ item.description || '暂无描述' }}</div>
    <div class="pattern-preview">
      <GraphTableTemplate
        :grid-cols="buildCalendarGrid(item.cells, item.year)"
        :month-positions="buildMonthPositions(item.year, calcTotalCols(item.year))"
        :days="days"
        :level-to-color="levelToColor"
        :cell-size="10"
        :gap="3"
        :days-col-width="24"
        :auto-scale="true"
      />
    </div>
    <div v-if="showAuthor" class="card-author">
      <n-avatar size="small" round color="transparent" class="user-avatar clickable" @click.stop="emit('user-click', item.creatorId)">
        <img
          :src="resolveAvatar(item.creatorAvatar)"
          :alt="item.creatorName"
          referrerpolicy="no-referrer"
          @error="($event.target as HTMLImageElement).src = userAvatarFallback"
        />
      </n-avatar>
      <span class="author-name clickable" @click.stop="emit('user-click', item.creatorId)">{{ item.creatorName }}</span>
      <span v-if="authorDateText" class="author-date">{{ authorDateText }}</span>
    </div>
    <div v-if="showMeta" class="card-meta">
      <span class="meta-item">
        <n-icon size="14">
          <View />
        </n-icon>
        {{ item.viewCount }}
      </span>
      <span class="meta-item">
        <n-icon size="14">
          <ThumbsUp />
        </n-icon>
        {{ item.likeCount }}
      </span>
      <span class="meta-item">
        <n-icon size="14">
          <Favorite />
        </n-icon>
        {{ item.favoriteCount }}
      </span>
      <span v-if="showCommentCount" class="meta-item">
        <n-icon size="14">
          <Chat />
        </n-icon>
        {{ item.commentCount }}
      </span>
      <span v-if="showDate && dateText" class="meta-item meta-date">{{ dateText }}</span>
    </div>
    <div v-if="$slots.actions" class="card-actions" @click.stop>
      <slot name="actions" />
    </div>
  </n-card>
</template>

<style scoped>
.pattern-card {
  border-radius: 14px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 8px;
}

.card-title {
  font-weight: 600;
}

.card-header-actions {
  display: inline-flex;
  align-items: center;
  gap: 8px;
}

.header-tags {
  align-items: center;
}

.card-desc {
  color: var(--color-text-muted);
  font-size: 13px;
  margin: 10px 0 12px;
  min-height: 38px;
}

.pattern-preview {
  padding: 10px;
  border-radius: 12px;
  background: var(--color-bg-light);
  border: 1px solid var(--color-border);
  margin-bottom: 12px;
  max-width: 100%;
  overflow: hidden;
  box-sizing: border-box;
  width: 100%;
}

.card-author {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 12px;
  color: var(--color-text-muted);
  margin-bottom: 10px;
}

.author-name {
  font-weight: 600;
  color: var(--color-text-main);
}

.author-date {
  margin-left: auto;
}

.card-meta {
  font-size: 12px;
  color: var(--color-text-muted);
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 12px;
  flex-wrap: wrap;
}

.meta-item {
  display: inline-flex;
  align-items: center;
  gap: 4px;
}

.meta-date {
  margin-left: auto;
}

.card-actions {
  display: flex;
  gap: 8px;
}

.user-avatar img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}

.tooltip-wrapper {
  display: inline-flex;
}

.clickable {
  cursor: pointer;
}
</style>
