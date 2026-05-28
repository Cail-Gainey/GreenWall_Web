<script setup lang="ts">
/**
 * @file 7x5 图案模板（印章）编辑器：强度调色 + 橡皮擦 + 自动循环工具，保存到本人收藏后可手动发布到社区。
 */
import { computed, reactive, ref, watch } from 'vue'
import {
  NModal,
  NCard,
  NForm,
  NFormItem,
  NInput,
  NSpace,
  NButton,
  NIcon,
  NTooltip,
  useMessage,
} from 'naive-ui'
import { Pen, Erase, Lightning, TrashCan, Renew } from '@vicons/carbon'
import { useStampStore } from '../stores/stamp'
import type { StampCells } from '../api/types'

const STAMP_ROWS = 7
const STAMP_COLS = 5

type Tool = 'brush' | 'eraser' | 'auto'

const props = defineProps<{
  show: boolean
}>()

const emit = defineEmits<{
  'update:show': [value: boolean]
  saved: [stampId: string]
}>()

const message = useMessage()
const stampStore = useStampStore()

const showRef = computed({
  get: () => props.show,
  set: (value: boolean) => emit('update:show', value),
})

function createEmptyGrid(): StampCells {
  return Array.from({ length: STAMP_ROWS }, () =>
    Array.from({ length: STAMP_COLS }, () => 0),
  )
}

const form = reactive({
  title: '',
  description: '',
  cells: createEmptyGrid(),
})
const submitting = ref(false)
const activeTool = ref<Tool>('brush')
const activeLevel = ref<number>(4)
const lastDragValue = ref<number | null>(null)

const levelColors = [
  'var(--color-cell-empty)',
  'var(--color-cell-level-1)',
  'var(--color-cell-level-2)',
  'var(--color-cell-level-3)',
  'var(--color-cell-level-4)',
]
const intensityLevels = [1, 2, 3, 4]

const filledCount = computed(() =>
  form.cells.reduce((acc, row) => acc + row.filter((v) => v > 0).length, 0),
)

const canSubmit = computed(
  () => form.title.trim().length > 0 && filledCount.value > 0 && !submitting.value,
)

function reset() {
  form.title = ''
  form.description = ''
  form.cells = createEmptyGrid()
  activeTool.value = 'brush'
  activeLevel.value = 4
  lastDragValue.value = null
}

watch(showRef, (open) => {
  if (open) reset()
})

function resolveTargetLevel(currentLevel: number): number {
  if (activeTool.value === 'eraser') return 0
  if (activeTool.value === 'auto') {
    // 自动循环：0->1, 1->2, 2->3, 3->4, 4->1（始终保持已填充态）
    if (currentLevel <= 0) return 1
    return currentLevel >= 4 ? 1 : currentLevel + 1
  }
  return activeLevel.value
}

function paint(row: number, col: number) {
  if (row < 0 || row >= STAMP_ROWS || col < 0 || col >= STAMP_COLS) return
  const rowArr = form.cells[row]
  if (!rowArr) return
  const next = resolveTargetLevel(rowArr[col])
  rowArr.splice(col, 1, next)
  lastDragValue.value = next
}

function onCellEnter(row: number, col: number, ev: PointerEvent) {
  if (!ev.buttons || (ev.buttons & 1) !== 1) return
  if (lastDragValue.value === null) return
  const rowArr = form.cells[row]
  if (!rowArr) return
  rowArr.splice(col, 1, lastDragValue.value)
}

function endDrag() {
  lastDragValue.value = null
}

function clearGrid() {
  form.cells = createEmptyGrid()
  lastDragValue.value = null
}

function invertGrid() {
  // 反转：填充与空互换；填充格统一以当前画笔强度复原
  form.cells = form.cells.map((row) =>
    row.map((v) => (v > 0 ? 0 : activeLevel.value)),
  )
}

async function submit() {
  if (!canSubmit.value) return
  submitting.value = true
  try {
    const res = await stampStore.publish({
      title: form.title.trim(),
      description: form.description.trim() || undefined,
      cells: form.cells.map((row) => row.slice()),
    })
    message.success('模板已保存到我的收藏（未发布）')
    emit('saved', String(res.data.data))
    showRef.value = false
  } catch (e: any) {
    message.error(e?.message || '保存失败')
  } finally {
    submitting.value = false
  }
}
</script>

<template>
  <n-modal v-model:show="showRef" :mask-closable="false" :auto-focus="false">
    <n-card class="stamp-editor" :bordered="false" title="新建图案模板">
      <n-form label-placement="left" label-width="60">
        <n-form-item label="标题" required>
          <n-input
            v-model:value="form.title"
            maxlength="80"
            show-count
            placeholder="为这枚印章取个名字"
          />
        </n-form-item>
        <n-form-item label="描述">
          <n-input
            v-model:value="form.description"
            type="textarea"
            :autosize="{ minRows: 2, maxRows: 4 }"
            maxlength="500"
            show-count
            placeholder="可选，介绍这枚印章的用途"
          />
        </n-form-item>
      </n-form>

      <div class="tool-bar">
        <div class="tool-group">
          <n-tooltip trigger="hover">
            <template #trigger>
              <button
                class="tool-btn"
                :class="{ active: activeTool === 'brush' }"
                @click="activeTool = 'brush'"
              >
                <n-icon size="16"><Pen /></n-icon>
              </button>
            </template>
            画笔
          </n-tooltip>
          <n-tooltip trigger="hover">
            <template #trigger>
              <button
                class="tool-btn"
                :class="{ active: activeTool === 'eraser' }"
                @click="activeTool = 'eraser'"
              >
                <n-icon size="16"><Erase /></n-icon>
              </button>
            </template>
            橡皮擦
          </n-tooltip>
        </div>

        <div class="divider"></div>

        <div class="color-palette">
          <button
            v-for="level in intensityLevels"
            :key="level"
            class="color-btn"
            :style="{ backgroundColor: levelColors[level] }"
            :class="{ active: activeTool === 'brush' && activeLevel === level }"
            :title="`强度 ${level}`"
            @click="activeTool = 'brush'; activeLevel = level"
          ></button>
        </div>

        <div class="special-tools">
          <n-tooltip trigger="hover">
            <template #trigger>
              <button
                class="icon-tool"
                :class="{ active: activeTool === 'auto' }"
                @click="activeTool = 'auto'"
              >
                <n-icon size="16"><Lightning /></n-icon>
              </button>
            </template>
            自动循环（1→4→1）
          </n-tooltip>
        </div>

        <div class="divider"></div>

        <div class="extra-tools">
          <n-tooltip trigger="hover">
            <template #trigger>
              <button
                class="tool-btn"
                :disabled="filledCount === 0"
                @click="clearGrid"
              >
                <n-icon size="16"><TrashCan /></n-icon>
              </button>
            </template>
            清空
          </n-tooltip>
          <n-tooltip trigger="hover">
            <template #trigger>
              <button
                class="tool-btn"
                @click="invertGrid"
              >
                <n-icon size="16"><Renew /></n-icon>
              </button>
            </template>
            反转
          </n-tooltip>
        </div>
      </div>

      <div
        class="grid"
        :style="{ gridTemplateColumns: `repeat(${STAMP_COLS}, 28px)` }"
        @pointerleave="endDrag"
        @pointerup="endDrag"
        @pointercancel="endDrag"
      >
        <template v-for="(row, rIndex) in form.cells" :key="rIndex">
          <button
            v-for="(value, cIndex) in row"
            :key="`${rIndex}-${cIndex}`"
            type="button"
            class="cell"
            :class="{ filled: value > 0 }"
            :style="{ backgroundColor: levelColors[value] }"
            @pointerdown.prevent="paint(rIndex, cIndex)"
            @pointerenter="(ev) => onCellEnter(rIndex, cIndex, ev)"
          ></button>
        </template>
      </div>

      <template #footer>
        <n-space justify="space-between" align="center">
          <span class="muted small">保存后会进入「图案弹窗 → 收藏」，可在那里手动发布到社区</span>
          <n-space>
            <n-button @click="showRef = false">取消</n-button>
            <n-button type="primary" :disabled="!canSubmit" :loading="submitting" @click="submit">
              保存
            </n-button>
          </n-space>
        </n-space>
      </template>
    </n-card>
  </n-modal>
</template>

<style scoped>
.stamp-editor {
  width: 460px;
  max-width: 92vw;
}

.tool-bar {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  flex-wrap: wrap;
  background: var(--color-surface);
  border-radius: 16px;
  box-shadow: 0 4px 24px rgba(0, 0, 0, 0.06);
  border: 1px solid var(--color-border);
  padding: 8px;
  margin-bottom: 12px;
}

.tool-group, .extra-tools {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  background-color: var(--color-bg-light);
  border-radius: 12px;
  padding: 4px;
}

.tool-btn {
  display: flex;
  justify-content: center;
  align-items: center;
  background: transparent;
  border: none;
  width: 32px;
  height: 32px;
  padding: 0;
  font-size: 0.9rem;
  color: var(--color-text-muted);
  border-radius: 8px;
  cursor: pointer;
  transition: background 0.15s, color 0.15s;
}

.tool-btn:hover:not(:disabled) {
  color: var(--color-text-main);
}

.tool-btn.active {
  background-color: var(--color-surface);
  color: var(--color-text-main);
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
  font-weight: 500;
}

.tool-btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.divider {
  width: 1px;
  height: 24px;
  background-color: var(--color-border);
}

.color-palette {
  display: inline-flex;
  align-items: center;
  gap: 8px;
}

.color-btn {
  width: 28px;
  height: 28px;
  border-radius: 6px;
  border: 2px solid transparent;
  cursor: pointer;
  padding: 0;
  transition: transform 0.15s, border-color 0.15s;
}

.color-btn.active {
  transform: scale(1.1);
  border-color: var(--color-text-main);
}

.special-tools {
  display: inline-flex;
  align-items: center;
  gap: 8px;
}

.icon-tool {
  width: 32px;
  height: 32px;
  border-radius: 8px;
  border: 1px solid var(--color-border);
  background: var(--color-surface);
  color: var(--color-text-muted);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.15s;
}

.icon-tool:hover {
  color: var(--color-primary);
  border-color: var(--color-primary);
}

.icon-tool.active {
  background: var(--color-primary);
  border-color: var(--color-primary);
  color: var(--color-surface);
}

.grid {
  display: grid;
  gap: 4px;
  width: max-content;
  margin: 0 auto;
  user-select: none;
  padding: 8px;
  background: var(--color-bg-light);
  border: 1px solid var(--color-border);
  border-radius: 10px;
}

.cell {
  width: 28px;
  height: 28px;
  border-radius: 4px;
  border: 1px solid var(--color-border);
  cursor: pointer;
  padding: 0;
  transition: transform 0.1s ease;
}

.cell:hover {
  border-color: var(--color-primary);
}

.cell.filled {
  border-color: transparent;
}

.muted {
  color: var(--color-text-muted);
}

.small {
  font-size: 12px;
}
</style>
