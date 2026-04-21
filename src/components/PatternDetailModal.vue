<script setup lang="ts">
/**
 * @file 图案详情弹窗：标题/可见范围/预览/作者与操作区。
 */
import { computed } from 'vue'
import { NAvatar, NButton, NIcon, NModal, NSpace, NSpin, NTag, NTooltip } from 'naive-ui'
import { Chat, Download, Edit, Favorite, FavoriteFilled, ThumbsUp, ThumbsUpFilled, TrashCan, View } from '@vicons/carbon'
import type { PatternDetailDto } from '../api/types'
import GraphTableTemplate from './GraphTableTemplate.vue'
import { calcTotalCols, getYearMeta, isFutureCell } from '../utils/graph'
import { resolveAvatar, userAvatarFallback } from '../utils/avatar'
import { visibilityLabel, visibilityTagType } from '../utils/patternVisibility'

const props = withDefaults(defineProps<{
  show: boolean
  loading?: boolean
  detail: PatternDetailDto | null
  showVisibilityTag?: boolean
  isLoggedIn: boolean
  loginHint: string
  showLike: boolean
  showFavorite: boolean
  showImport: boolean
  canManageDetail: boolean
  canEdit: boolean
  canDelete: boolean
}>(), {
  loading: false,
  showVisibilityTag: true,
})

const emit = defineEmits<{
  (e: 'update:show', value: boolean): void
  (e: 'like'): void
  (e: 'favorite'): void
  (e: 'import'): void
  (e: 'edit'): void
  (e: 'delete'): void
  (e: 'go-user', value?: string): void
}>()

const modalVisible = computed({
  get: () => props.show,
  set: (value: boolean) => emit('update:show', value),
})

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

const buildCalendarGrid = (cells: PatternDetailDto['cells'], year: number) => {
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
</script>

<template>
  <n-modal v-model:show="modalVisible" preset="card" title="图案详情" style="width: min(720px, 94vw);">
    <n-spin :show="loading">
      <div v-if="detail" class="detail-body">
        <div class="detail-header">
          <div class="detail-title">{{ detail.title }}</div>
          <n-space size="small">
            <n-tag v-if="showVisibilityTag" size="small" :type="visibilityTagType(detail.visibility)">
              {{ visibilityLabel(detail.visibility) }}
            </n-tag>
            <n-tag size="small" type="success">{{ detail.year }}</n-tag>
          </n-space>
        </div>
        <div class="detail-desc">{{ detail.description || '暂无描述' }}</div>
        <div class="pattern-preview large">
          <GraphTableTemplate
            :grid-cols="buildCalendarGrid(detail.cells, detail.year)"
            :month-positions="buildMonthPositions(detail.year, calcTotalCols(detail.year))"
            :days="days"
            :level-to-color="levelToColor"
            :cell-size="12"
            :gap="4"
            :days-col-width="26"
            :auto-scale="true"
          />
        </div>
        <div class="detail-meta">
          <span class="meta-item detail-author clickable" @click="emit('go-user', detail.creatorId)">
            <n-avatar size="small" round color="transparent" class="user-avatar">
              <img
                :src="resolveAvatar(detail.creatorAvatar)"
                :alt="detail.creatorName"
                referrerpolicy="no-referrer"
                @error="($event.target as HTMLImageElement).src = userAvatarFallback"
              />
            </n-avatar>
            {{ detail.creatorName }}
          </span>
          <span class="meta-item">
            <n-icon size="14">
              <View />
            </n-icon>
            {{ detail.viewCount }}
          </span>
          <span class="meta-item">
            <n-icon size="14">
              <ThumbsUp />
            </n-icon>
            {{ detail.likeCount }}
          </span>
          <span class="meta-item">
            <n-icon size="14">
              <Favorite />
            </n-icon>
            {{ detail.favoriteCount }}
          </span>
          <span class="meta-item">
            <n-icon size="14">
              <Chat />
            </n-icon>
            {{ detail.commentCount }}
          </span>
        </div>
        <div class="detail-actions">
          <slot name="actions-prefix" />
          <n-tooltip v-if="showLike" trigger="hover">
            <template #trigger>
              <span class="tooltip-wrapper">
                <n-button
                  size="small"
                  secondary
                  circle
                  :disabled="!isLoggedIn"
                  :type="detail.isLiked ? 'success' : 'default'"
                  @click="emit('like')"
                >
                  <n-icon size="16">
                    <ThumbsUpFilled v-if="detail.isLiked" />
                    <ThumbsUp v-else />
                  </n-icon>
                </n-button>
              </span>
            </template>
            {{ loginHint || '点赞' }}
          </n-tooltip>
          <n-tooltip v-if="showFavorite" trigger="hover">
            <template #trigger>
              <span class="tooltip-wrapper">
                <n-button
                  size="small"
                  secondary
                  circle
                  :disabled="!isLoggedIn"
                  :type="detail.isFavorited ? 'warning' : 'default'"
                  @click="emit('favorite')"
                >
                  <n-icon size="16">
                    <FavoriteFilled v-if="detail.isFavorited" />
                    <Favorite v-else />
                  </n-icon>
                </n-button>
              </span>
            </template>
            {{ loginHint || '收藏' }}
          </n-tooltip>
          <n-tooltip v-if="showImport" trigger="hover">
            <template #trigger>
              <span class="tooltip-wrapper">
                <n-button size="small" type="primary" circle :disabled="!isLoggedIn" @click="emit('import')">
                  <n-icon size="16">
                    <Download />
                  </n-icon>
                </n-button>
              </span>
            </template>
            {{ loginHint || '一键导入' }}
          </n-tooltip>
          <template v-if="canManageDetail">
            <n-tooltip v-if="canEdit" trigger="hover">
              <template #trigger>
                <span class="tooltip-wrapper">
                  <n-button size="small" circle @click="emit('edit')">
                    <n-icon size="16">
                      <Edit />
                    </n-icon>
                  </n-button>
                </span>
              </template>
              编辑图案
            </n-tooltip>
            <n-tooltip v-if="canDelete" trigger="hover">
              <template #trigger>
                <span class="tooltip-wrapper">
                  <n-button size="small" circle type="error" ghost @click="emit('delete')">
                    <n-icon size="16">
                      <TrashCan />
                    </n-icon>
                  </n-button>
                </span>
              </template>
              删除
            </n-tooltip>
          </template>
        </div>
        <slot v-if="detail" name="extra" />
      </div>
    </n-spin>
  </n-modal>
</template>

<style scoped>
.detail-body {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.detail-header {
  display: flex;
  align-items: center;
  gap: 12px;
}

.detail-title {
  font-size: 18px;
  font-weight: 700;
}

.detail-desc {
  font-size: 14px;
  color: var(--color-text-muted);
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

.pattern-preview.large {
  padding: 16px;
}

.detail-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  font-size: 12px;
  color: var(--color-text-muted);
}

.detail-author {
  gap: 8px;
}

.detail-actions {
  display: flex;
  gap: 8px;
}

.meta-item {
  display: inline-flex;
  align-items: center;
  gap: 4px;
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
