<script setup lang="ts">
/**
 * @file 图案选择弹窗：字母 / 数字 / 收藏 (用户导入的图案模板)。
 */
import { computed, onMounted, ref, watch } from 'vue'
import {
  NModal,
  NTabs,
  NTabPane,
  NIcon,
  NTooltip,
  NEmpty,
  NButton,
  NPopconfirm,
  NTag,
  useMessage,
} from 'naive-ui'
import { Shuffle, CloudUpload } from '@vicons/carbon'
import { storeToRefs } from 'pinia'
import { PATTERNS } from '../utils/patterns'
import { usePermissionStore } from '../stores/permission'
import { useStampStore } from '../stores/stamp'
import StampEditorModal from './StampEditorModal.vue'
import type { StampImportDto } from '../api/types'

const props = defineProps<{
  show: boolean
}>()

const emit = defineEmits<{
  (e: 'update:show', value: boolean): void
  (e: 'select', pattern: boolean[][], level: number, random: boolean, levels?: number[][] | null): void
}>()

const message = useMessage()
const permissionStore = usePermissionStore()
const stampStore = useStampStore()
const { imports: stampImports, importsLoading } = storeToRefs(stampStore)
const { hasPermission } = permissionStore

const localShow = computed({
  get: () => props.show,
  set: (val) => emit('update:show', val),
})

const intensityLevels = [1, 2, 3, 4]
const selectedIntensity = ref(4)
const randomizePattern = ref(false)
const randomSeed = ref(0)
const activeTab = ref<'uppercase' | 'lowercase' | 'numbers' | 'collected'>('uppercase')
const showEditor = ref(false)

const isLoggedIn = computed(() => !!localStorage.getItem('token'))
const canPublishStamp = computed(() => isLoggedIn.value && hasPermission('app:stamp:publish'))
const canManageStamp = computed(() => isLoggedIn.value && hasPermission('app:stamp:import'))

const randomizeNow = () => {
  randomizePattern.value = true
  randomSeed.value++
}

const randomLevelFor = (key: string, row: number, col: number) => {
  let hash = randomSeed.value
  for (let i = 0; i < key.length; i++) {
    hash = (hash * 31 + key.charCodeAt(i)) >>> 0
  }
  hash = (hash * 31 + row * 7 + col) >>> 0
  return (hash % 4) + 1
}

const previewCellColor = (key: string, row: number, col: number, cell: boolean) => {
  if (!cell) {
    return 'rgba(255,255,255,0.05)'
  }
  if (randomizePattern.value) {
    return levelColors[randomLevelFor(key, row, col)]!
  }
  return levelColors[selectedIntensity.value]!
}

/**
 * @description 收藏模板的格子颜色：始终使用模板自身的强度，不受顶部强度/随机选项影响。
 */
const stampCellColor = (level: number | boolean) => {
  const n = typeof level === 'number' ? level : level ? 1 : 0
  if (n <= 0) return 'rgba(255,255,255,0.05)'
  return levelColors[Math.min(Math.max(n, 1), 4)]!
}

const levelColors = [
  'var(--color-cell-empty)',
  'var(--color-cell-level-1)',
  'var(--color-cell-level-2)',
  'var(--color-cell-level-3)',
  'var(--color-cell-level-4)',
]

const uppercaseKeys = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('')
const lowercaseKeys = 'abcdefghijklmnopqrstuvwxyz'.split('')
const numberKeys = '0123456789'.split('')

const handleSelect = (key: string) => {
  const patternGrid = (PATTERNS as any)[key]
  if (patternGrid) {
    emit('select', patternGrid, selectedIntensity.value, randomizePattern.value, null)
    localShow.value = false
  }
}

const handleSelectStamp = (item: StampImportDto) => {
  if (!Array.isArray(item.cells) || item.cells.length === 0) {
    message.error('该收藏数据已损坏，无法使用')
    return
  }
  // 收藏模板带原生强度：pattern 仍传 cells 用于命中判定；levels 传 cells 让画布按原强度落色
  // 同时强制关闭 random 影响，避免顶部 shuffle 改写已有强度
  emit('select', item.cells as unknown as boolean[][], selectedIntensity.value, false, item.cells as number[][])
  localShow.value = false
}

const handleRemoveImport = async (item: StampImportDto) => {
  try {
    await stampStore.removeImport(item.id)
    message.success('已从收藏移除')
  } catch (e: any) {
    message.error(e?.message || '移除失败')
  }
}

const publishingId = ref<string | null>(null)
const handlePublishStamp = async (item: StampImportDto) => {
  if (!canPublishStamp.value) {
    message.warning('没有发布模板的权限')
    return
  }
  // 本地快照永远归当前用户所有；源仍存在走标准发布，源已删除走 republish（新建社区模板）
  publishingId.value = String(item.id)
  try {
    if (item.sourceAvailable && item.sourceStampId) {
      await stampStore.publishToCommunity(String(item.sourceStampId))
    } else {
      await stampStore.publishImportSnapshot(String(item.id))
    }
    message.success('已发布到社区')
  } catch (e: any) {
    message.error(e?.message || '发布失败')
  } finally {
    publishingId.value = null
  }
}

const handleOpenEditor = () => {
  if (!canPublishStamp.value) {
    message.warning('没有发布模板的权限')
    return
  }
  showEditor.value = true
}

const onStampPublished = () => {
  // editor 内部已刷新 imports，这里仅切到「收藏」便于查看
  activeTab.value = 'collected'
}

const refreshImports = async (force = false) => {
  if (!isLoggedIn.value) return
  try {
    await stampStore.loadImports(force)
  } catch {
    // 静默失败，UI 仍可使用字母 Tab
  }
}

watch(
  () => localShow.value,
  (open) => {
    if (open) void refreshImports(false)
  },
)

onMounted(() => {
  if (props.show) void refreshImports(false)
})
</script>

<template>
  <n-modal
    v-model:show="localShow"
    preset="card"
    title="选择图案"
    class="pattern-modal"
    style="width: 680px; max-width: 90vw; background-color: var(--color-surface); color: var(--color-text-main);"
  >
    <div class="intensity-selector">
      <span class="intensity-label">强度：</span>
      <div class="palette-container">
        <button
          v-for="level in intensityLevels"
          :key="level"
          class="level-btn"
          :style="{ backgroundColor: levelColors[level] }"
          :class="{ active: selectedIntensity === level }"
          @click="selectedIntensity = level; randomizePattern = false"
        ></button>
      </div>
      <n-tooltip trigger="hover">
        <template #trigger>
          <button class="random-btn" :class="{ active: randomizePattern }" @click="randomizeNow">
            <n-icon size="18" :color="randomizePattern ? 'var(--color-surface)' : 'var(--color-primary)'"><Shuffle /></n-icon>
          </button>
        </template>
        随机效果（每次刷新）
      </n-tooltip>
    </div>

    <n-tabs v-model:value="activeTab" type="line" animated>
      <n-tab-pane name="uppercase" tab="A-Z">
        <div class="pattern-grid">
          <div
            v-for="key in uppercaseKeys"
            :key="key"
            class="pattern-card"
            @click="handleSelect(key)"
          >
            <div class="card-header">{{ key }}</div>
            <div class="card-preview">
              <div v-for="(row, rIndex) in PATTERNS[key as keyof typeof PATTERNS]" :key="rIndex" class="preview-row">
                <div
                  v-for="(cell, cIndex) in row"
                  :key="cIndex"
                  class="preview-cell"
                  :style="{ backgroundColor: previewCellColor(key, rIndex, cIndex, cell) }"
                ></div>
              </div>
            </div>
          </div>
        </div>
      </n-tab-pane>

      <n-tab-pane name="lowercase" tab="a-z">
        <div class="pattern-grid">
          <div
            v-for="key in lowercaseKeys"
            :key="key"
            class="pattern-card"
            @click="handleSelect(key)"
          >
            <div class="card-header">{{ key }}</div>
            <div class="card-preview">
              <div v-for="(row, rIndex) in PATTERNS[key as keyof typeof PATTERNS]" :key="rIndex" class="preview-row">
                <div
                  v-for="(cell, cIndex) in row"
                  :key="cIndex"
                  class="preview-cell"
                  :style="{ backgroundColor: previewCellColor(key, rIndex, cIndex, cell) }"
                ></div>
              </div>
            </div>
          </div>
        </div>
      </n-tab-pane>

      <n-tab-pane name="numbers" tab="0-9">
        <div class="pattern-grid">
          <div
            v-for="key in numberKeys"
            :key="key"
            class="pattern-card"
            @click="handleSelect(key)"
          >
            <div class="card-header">{{ key }}</div>
            <div class="card-preview">
              <div v-for="(row, rIndex) in PATTERNS[key as keyof typeof PATTERNS]" :key="rIndex" class="preview-row">
                <div
                  v-for="(cell, cIndex) in row"
                  :key="cIndex"
                  class="preview-cell"
                  :style="{ backgroundColor: previewCellColor(key, rIndex, cIndex, cell) }"
                ></div>
              </div>
            </div>
          </div>
        </div>
      </n-tab-pane>

      <n-tab-pane name="collected" tab="收藏">
        <div class="collected-header">
          <span class="collected-hint">{{ isLoggedIn ? '点击使用，悬停移除' : '登录后可收藏并使用社区模板' }}</span>
          <n-button
            v-if="canPublishStamp"
            size="small"
            type="primary"
            ghost
            @click="handleOpenEditor"
          >
            + 新建模板
          </n-button>
        </div>

        <n-empty
          v-if="!isLoggedIn"
          description="请先登录"
          style="padding: 32px 0"
        />
        <n-empty
          v-else-if="!importsLoading && stampImports.length === 0"
          description="还没有收藏，去社区导入或新建一个吧"
          style="padding: 32px 0"
        />
        <div v-else class="pattern-grid">
          <div
            v-for="item in stampImports"
            :key="item.id"
            class="pattern-card stamp-card"
            @click="handleSelectStamp(item)"
          >
            <div class="card-header stamp-header">
              <span class="stamp-title" :title="item.title">{{ item.title }}</span>
              <div class="stamp-actions" @click.stop>
                <n-tag
                  v-if="item.sourceAvailable && item.isPublished"
                  size="tiny"
                  type="success"
                  :bordered="false"
                  round
                >已发布</n-tag>
                <n-tag
                  v-else
                  size="tiny"
                  type="warning"
                  :bordered="false"
                  round
                >未发布</n-tag>
                <n-popconfirm
                  v-if="!(item.sourceAvailable && item.isPublished) && canPublishStamp"
                  positive-text="发布"
                  negative-text="取消"
                  @positive-click="handlePublishStamp(item)"
                >
                  <template #trigger>
                    <button
                      class="publish-btn"
                      :disabled="publishingId === String(item.id)"
                      title="发布到社区"
                    >
                      <n-icon size="12"><CloudUpload /></n-icon>
                    </button>
                  </template>
                  <template v-if="item.sourceAvailable">
                    确认将「{{ item.title }}」发布到社区？发布后其他用户可见。
                  </template>
                  <template v-else>
                    原社区版本已不存在，确认基于本地快照重新发布「{{ item.title }}」吗？将创建一个新的社区模板。
                  </template>
                </n-popconfirm>
                <n-popconfirm
                  v-if="canManageStamp"
                  :positive-text="'移除'"
                  :negative-text="'取消'"
                  @positive-click="handleRemoveImport(item)"
                >
                  <template #trigger>
                    <button
                      class="remove-btn"
                      title="从收藏移除"
                    >×</button>
                  </template>
                  确认从收藏中移除「{{ item.title }}」？
                </n-popconfirm>
              </div>
            </div>
            <div class="card-preview">
              <div v-for="(row, rIndex) in item.cells" :key="rIndex" class="preview-row">
                <div
                  v-for="(cell, cIndex) in row"
                  :key="cIndex"
                  class="preview-cell"
                  :style="{ backgroundColor: stampCellColor(cell) }"
                ></div>
              </div>
            </div>
          </div>
        </div>
      </n-tab-pane>
    </n-tabs>
  </n-modal>

  <StampEditorModal v-model:show="showEditor" @published="onStampPublished" />
</template>

<style scoped>
:deep(.n-card-header__title) {
  color: var(--color-text-main) !important;
}

:deep(.n-tabs-nav) {
  padding: 0 16px;
}

.intensity-selector {
  display: flex;
  align-items: center;
  background-color: var(--color-bg-light);
  border: 1px solid var(--color-border);
  padding: 12px 20px;
  border-radius: 12px;
  margin-bottom: 24px;
}

.intensity-label {
  font-size: 14px;
  color: var(--color-text-muted);
  margin-right: 16px;
}

.palette-container {
  display: flex;
  gap: 8px;
}

.level-btn {
  width: 28px;
  height: 28px;
  border-radius: 6px;
  border: 2px solid transparent;
  cursor: pointer;
  padding: 0;
  transition: transform 0.2s, border-color 0.2s;
}

.level-btn.active {
  transform: scale(1.15);
  border-color: var(--color-text-main);
}

.random-btn {
  margin-left: 8px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border-radius: 8px;
  border: 1px solid var(--color-primary);
  background: var(--color-bg-light);
  cursor: pointer;
  padding: 0;
  transition: all 0.2s;
}

.random-btn:hover {
  background: var(--color-border);
}

.random-btn.active {
  background: var(--color-primary);
  border-color: var(--color-primary);
  color: var(--color-surface);
}

.pattern-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(80px, 1fr));
  gap: 16px;
  padding: 16px 0;
  max-height: 52vh;
  overflow-y: auto;
}

.pattern-card {
  background-color: var(--color-bg-light);
  border: 1px solid var(--color-border);
  border-radius: 12px;
  padding: 12px;
  cursor: pointer;
  display: flex;
  flex-direction: column;
  align-items: center;
  transition: all 0.2s;
  position: relative;
}

.pattern-card:hover {
  background-color: var(--color-surface);
  border-color: var(--color-primary);
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
}

.card-header {
  font-size: 14px;
  font-weight: bold;
  margin-bottom: 12px;
  color: var(--color-text-main);
}

.card-preview {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.preview-row {
  display: flex;
  gap: 2px;
}

.preview-cell {
  width: 6px;
  height: 6px;
  border-radius: 1px;
}

.collected-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 4px 0 8px;
}

.collected-hint {
  font-size: 12px;
  color: var(--color-text-muted);
}

.stamp-card {
  width: 100%;
  min-width: 0;
}

.stamp-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  gap: 6px;
}

.stamp-title {
  flex: 1 1 auto;
  font-size: 12px;
  font-weight: 600;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  text-align: center;
}

.remove-btn {
  flex: 0 0 auto;
  width: 18px;
  height: 18px;
  border-radius: 50%;
  border: 1px solid var(--color-border);
  background: var(--color-surface);
  color: var(--color-text-muted);
  cursor: pointer;
  line-height: 16px;
  text-align: center;
  font-size: 14px;
  padding: 0;
  opacity: 0;
  transition: opacity 0.15s ease;
}

.pattern-card:hover .remove-btn {
  opacity: 1;
}

.remove-btn:hover {
  color: var(--color-danger);
  border-color: var(--color-danger);
}

.stamp-actions {
  display: inline-flex;
  align-items: center;
  gap: 4px;
}

.publish-btn {
  flex: 0 0 auto;
  width: 20px;
  height: 18px;
  border-radius: 9px;
  border: 1px solid var(--color-border);
  background: var(--color-surface);
  color: var(--color-text-muted);
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 0;
  transition: all 0.15s ease;
}

.publish-btn:hover {
  color: var(--color-primary);
  border-color: var(--color-primary);
}

.publish-btn:disabled {
  cursor: not-allowed;
  opacity: 0.6;
}
</style>
