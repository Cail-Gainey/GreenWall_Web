<script setup lang="ts">
/**
 * @file 用户端公告弹窗：时间线风格 + 5 级优先级图例。
 * 已读策略：关闭弹窗（点击遮罩 / 关闭按钮 / Esc）时自动把可见公告标为「今日已读」。
 */
import { computed } from 'vue'
import { storeToRefs } from 'pinia'
import { NModal, NCard, NEmpty, NScrollbar, NSpace, NTag, NButton } from 'naive-ui'
import { useAnnouncementStore } from '../stores/announcement'
import { formatRelative, formatDateTime } from '../utils/time'
import { renderMarkdown } from '../utils/markdown'
import type { ActiveAnnouncementDto } from '../api/types'

const props = defineProps<{
  show: boolean
}>()

const emit = defineEmits<{
  'update:show': [value: boolean]
}>()

const announcementStore = useAnnouncementStore()
const { displayList, list, hasHiddenItems, closedToday, closedPermanent } = storeToRefs(announcementStore)

const showRef = computed({
  get: () => props.show,
  set: (value: boolean) => {
    if (!value && props.show) {
      // 关闭瞬间：把当前未读项整体标为今日已读
      announcementStore.markAllUnreadAsReadToday()
    }
    emit('update:show', value)
  },
})

interface PriorityMeta {
  label: string
  color: string
}

const priorityMetaMap: Record<number, PriorityMeta> = {
  1: { label: '默认', color: '#A3A3A3' },
  2: { label: '进行中', color: '#2080F0' },
  3: { label: '成功', color: '#18A058' },
  4: { label: '警告', color: '#F0A020' },
  5: { label: '异常', color: '#D03050' },
}

const legend = [1, 2, 3, 4, 5].map((p) => priorityMetaMap[p])

function priorityFor(item: ActiveAnnouncementDto): PriorityMeta {
  return priorityMetaMap[item.priority] ?? priorityMetaMap[1]
}

function dotStyle(item: ActiveAnnouncementDto) {
  return { backgroundColor: priorityFor(item).color }
}

function todayKey(): string {
  const d = new Date()
  const pad = (n: number) => n.toString().padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}

function isReadToday(item: ActiveAnnouncementDto): boolean {
  return closedToday.value[String(item.id)] === todayKey()
}

function isClosedPermanent(item: ActiveAnnouncementDto): boolean {
  return closedPermanent.value.has(String(item.id))
}

function sideFor(index: number): 'left' | 'right' {
  return index % 2 === 0 ? 'right' : 'left'
}

function handleCloseForever(item: ActiveAnnouncementDto, event: Event) {
  event.stopPropagation()
  announcementStore.closePermanently(item.id)
}

function handleCloseDialog() {
  showRef.value = false
}

function handleResetRead() {
  announcementStore.reopenAll()
}
</script>

<template>
  <n-modal
    v-model:show="showRef"
    :mask-closable="true"
    :close-on-esc="true"
    :auto-focus="false"
    style="--n-color: transparent"
  >
    <n-card class="announcement-card" :bordered="false" role="dialog">
      <template #header>
        <div class="dialog-header">
          <span class="dialog-title">
            <span class="dialog-bell" aria-hidden="true">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                width="20"
                height="20"
                fill="none"
                stroke="currentColor"
                stroke-width="1.8"
                stroke-linecap="round"
                stroke-linejoin="round"
              >
                <path d="M6 8a6 6 0 0112 0v5l1.5 2.5h-15L6 13z"></path>
                <path d="M10 19a2 2 0 004 0"></path>
              </svg>
            </span>
            <span>系统公告</span>
            <n-tag v-if="list.length > 0" size="small" :bordered="false" round>
              显示最新 {{ list.length }} 条
            </n-tag>
          </span>
          <div class="legend">
            <span v-for="meta in legend" :key="meta.label" class="legend-item">
              <span class="legend-dot" :style="{ backgroundColor: meta.color }" aria-hidden="true"></span>
              <span class="legend-label">{{ meta.label }}</span>
            </span>
          </div>
        </div>
      </template>

      <n-scrollbar class="announcement-scroll">
        <n-empty
          v-if="displayList.length === 0"
          description="暂无公告"
          style="padding: 32px 0"
        />
        <div v-else class="timeline">
          <article
            v-for="(item, idx) in displayList"
            :key="item.id"
            class="timeline-row"
            :class="[`is-${sideFor(idx)}`, { 'is-read': isReadToday(item) }]"
          >
            <div class="timeline-card-wrap">
              <div class="timeline-card">
                <div class="timeline-card-body">
                  <header class="timeline-title">
                    <span>{{ item.title }}</span>
                    <n-tag v-if="isReadToday(item)" size="small" :bordered="false" round class="read-tag">
                      已读
                    </n-tag>
                  </header>
                  <div
                    v-if="item.content"
                    class="timeline-content markdown-body"
                    v-html="renderMarkdown(item.content)"
                  ></div>
                  <time class="timeline-time" :title="formatDateTime(item.startTime || item.createTime)">
                    {{ formatRelative(item.startTime || item.createTime) }}
                  </time>
                </div>
                <div class="timeline-actions">
                  <n-button
                    text
                    size="tiny"
                    type="error"
                    :disabled="isClosedPermanent(item)"
                    @click="handleCloseForever(item, $event)"
                  >
                    关闭
                  </n-button>
                </div>
              </div>
            </div>
            <div class="timeline-marker" aria-hidden="true">
              <span class="timeline-dot" :style="dotStyle(item)"></span>
            </div>
          </article>
        </div>
      </n-scrollbar>

      <template #footer>
        <n-space justify="space-between" align="center">
          <n-button v-if="hasHiddenItems" size="small" quaternary @click="handleResetRead">
            重置已读状态
          </n-button>
          <span v-else></span>
          <n-button @click="handleCloseDialog">关闭弹窗</n-button>
        </n-space>
      </template>
    </n-card>
  </n-modal>
</template>

<style scoped>
.announcement-card {
  width: 760px;
  max-width: 96vw;
  height: 560px;
  max-height: 86vh;
  display: flex;
  flex-direction: column;
}

.announcement-card :deep(.n-card-header) {
  flex: 0 0 auto;
  padding-bottom: 12px;
  border-bottom: 1px solid var(--color-border);
}

.announcement-card :deep(.n-card__content) {
  flex: 1 1 auto;
  min-height: 0;
  padding-top: 12px;
  padding-bottom: 12px;
  overflow: hidden;
}

.announcement-card :deep(.n-card__footer) {
  flex: 0 0 auto;
}

.announcement-scroll {
  height: 100%;
}

.dialog-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  flex-wrap: wrap;
}

.dialog-title {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  font-weight: 600;
  color: var(--color-text-main);
}

.dialog-bell {
  display: inline-flex;
  color: var(--color-text-main);
}

.legend {
  display: inline-flex;
  align-items: center;
  gap: 14px;
  flex-wrap: wrap;
}

.legend-item {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  color: var(--color-text-muted);
}

.legend-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
}

.legend-label {
  white-space: nowrap;
}

.timeline {
  position: relative;
  padding: 8px 8px 8px;
}

.timeline::before {
  content: '';
  position: absolute;
  left: 50%;
  top: 0;
  bottom: 0;
  width: 1px;
  background: var(--color-border);
  transform: translateX(-0.5px);
}

.timeline-row {
  position: relative;
  display: flex;
  align-items: flex-start;
  padding: 10px 0;
  min-height: 56px;
}

.timeline-row.is-right {
  justify-content: flex-end;
}

.timeline-row.is-left {
  justify-content: flex-start;
}

.timeline-row.is-read .timeline-card-body {
  opacity: 0.55;
}

.timeline-card-wrap {
  width: calc(50% - 28px);
  display: flex;
}

.timeline-row.is-right .timeline-card-wrap {
  justify-content: flex-start;
  padding-left: 24px;
}

.timeline-row.is-left .timeline-card-wrap {
  justify-content: flex-end;
  padding-right: 24px;
}

.timeline-card {
  position: relative;
  display: flex;
  flex-direction: column;
  gap: 6px;
  max-width: 100%;
}

.timeline-card-body {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.timeline-row.is-left .timeline-card-body {
  text-align: right;
  align-items: flex-end;
}

.timeline-row.is-right .timeline-card-body {
  text-align: left;
  align-items: flex-start;
}

.timeline-title {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  font-weight: 500;
  line-height: 1.55;
  color: var(--color-text-main);
  word-break: break-word;
}

.timeline-row.is-left .timeline-title {
  flex-direction: row-reverse;
}

.read-tag {
  --n-color: color-mix(in srgb, var(--color-text-muted) 18%, transparent);
  color: var(--color-text-muted);
  font-size: 11px;
  height: 18px;
  padding: 0 6px;
}

.timeline-content {
  font-size: 13px;
  line-height: 1.55;
  color: var(--color-text-muted);
  word-break: break-word;
  margin: 0;
}

.markdown-body :deep(p) {
  margin: 0 0 6px;
}

.markdown-body :deep(p:last-child) {
  margin-bottom: 0;
}

.markdown-body :deep(h1),
.markdown-body :deep(h2),
.markdown-body :deep(h3),
.markdown-body :deep(h4) {
  margin: 8px 0 4px;
  color: var(--color-text-main);
  font-weight: 600;
  line-height: 1.4;
}

.markdown-body :deep(h1) { font-size: 16px; }
.markdown-body :deep(h2) { font-size: 15px; }
.markdown-body :deep(h3),
.markdown-body :deep(h4) { font-size: 14px; }

.markdown-body :deep(ul),
.markdown-body :deep(ol) {
  margin: 4px 0;
  padding-left: 20px;
}

.markdown-body :deep(li) {
  margin: 2px 0;
}

.markdown-body :deep(a) {
  color: var(--color-primary);
  text-decoration: none;
}

.markdown-body :deep(a:hover) {
  text-decoration: underline;
}

.markdown-body :deep(code) {
  background: var(--color-bg-light);
  border: 1px solid var(--color-border);
  border-radius: 4px;
  padding: 0 4px;
  font-family: var(--font-family-mono, ui-monospace, SFMono-Regular, Menlo, monospace);
  font-size: 12px;
}

.markdown-body :deep(pre) {
  background: var(--color-bg-light);
  border: 1px solid var(--color-border);
  border-radius: 6px;
  padding: 8px 10px;
  margin: 6px 0;
  overflow-x: auto;
  font-size: 12px;
}

.markdown-body :deep(pre code) {
  background: transparent;
  border: none;
  padding: 0;
}

.markdown-body :deep(blockquote) {
  margin: 6px 0;
  padding: 4px 10px;
  border-left: 3px solid var(--color-border);
  color: var(--color-text-muted);
}

.markdown-body :deep(hr) {
  border: none;
  border-top: 1px dashed var(--color-border);
  margin: 8px 0;
}

.markdown-body :deep(strong) {
  color: var(--color-text-main);
}

.markdown-body :deep(img) {
  max-width: 100%;
  border-radius: 6px;
}

.timeline-time {
  font-size: 12px;
  color: var(--color-text-muted);
  margin-top: 2px;
}

.timeline-actions {
  display: flex;
  gap: 8px;
  opacity: 0;
  transform: translateY(-2px);
  transition: opacity 0.18s ease, transform 0.18s ease;
}

.timeline-row.is-left .timeline-actions {
  justify-content: flex-end;
}

.timeline-row.is-right .timeline-actions {
  justify-content: flex-start;
}

.timeline-card:hover .timeline-actions,
.timeline-card:focus-within .timeline-actions {
  opacity: 1;
  transform: translateY(0);
}

.timeline-marker {
  position: absolute;
  left: 50%;
  top: 18px;
  transform: translateX(-50%);
  width: 18px;
  height: 18px;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 2;
}

.timeline-dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background: #a3a3a3;
  box-shadow: 0 0 0 3px var(--color-surface);
}

@media (max-width: 640px) {
  .announcement-card {
    width: 96vw;
    height: 80vh;
  }

  .timeline::before {
    left: 16px;
  }

  .timeline-row,
  .timeline-row.is-left,
  .timeline-row.is-right {
    justify-content: flex-start;
  }

  .timeline-card-wrap,
  .timeline-row.is-left .timeline-card-wrap,
  .timeline-row.is-right .timeline-card-wrap {
    width: calc(100% - 36px);
    margin-left: 36px;
    padding: 0;
    justify-content: flex-start;
  }

  .timeline-row.is-left .timeline-card-body,
  .timeline-row.is-right .timeline-card-body {
    text-align: left;
    align-items: flex-start;
  }

  .timeline-row.is-left .timeline-title {
    flex-direction: row;
  }

  .timeline-row.is-left .timeline-actions,
  .timeline-row.is-right .timeline-actions {
    justify-content: flex-start;
  }

  .timeline-marker {
    left: 16px;
  }
}
</style>
