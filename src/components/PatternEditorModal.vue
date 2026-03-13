<script setup lang="ts">
/**
 * @file 图案编辑弹窗模板：表单 + 工具栏 + 图案悬浮预览。
 */
import { computed, onMounted, ref, watch } from 'vue'
import { NModal, NInput, NButton, NSelect, NIcon } from 'naive-ui'
import ToolbarTemplate from './ToolbarTemplate.vue'
import PatternDialog from './PatternDialog.vue'
import GraphTableTemplate, { type GraphCell } from './GraphTableTemplate.vue'
import { calcTotalCols, getYearMeta, isFutureCell } from '../utils/graph'
import { ChevronLeft, ChevronRight } from '@vicons/carbon'

const props = withDefaults(
  defineProps<{
    show: boolean
    modalTitle: string
    submitText: string
    submitLoading?: boolean
    title: string
    desc: string
    year: number
    grid: number[][]
    cellSize?: number
    gap?: number
  }>(),
  {
    submitLoading: false,
    cellSize: 14,
    gap: 4,
  },
)

const emit = defineEmits<{
  (e: 'update:show', value: boolean): void
  (e: 'update:title', value: string): void
  (e: 'update:desc', value: string): void
  (e: 'update:year', value: number): void
  (e: 'update:grid', value: number[][]): void
  (e: 'submit'): void
}>()

const showPatternDialog = ref(false)
const activeTool = ref<'brush' | 'eraser' | 'pattern' | 'auto' | 'random'>('brush')
const activeLevel = ref(4)
const activePattern = ref<boolean[][] | null>(null)
const activePatternRandom = ref(false)

const previewCells = ref<Set<string>>(new Set())
const previewLevels = ref<Map<string, number>>(new Map())
const previewEnabled = ref(true)

const rows = computed(() => 7)
const totalCols = computed(() => calcTotalCols(props.year))
const cols = computed(() => (props.grid.length ? props.grid.length : totalCols.value))

const minYear = 2008
const maxYear = new Date().getFullYear()
const yearOptions = computed(() => {
  const options = []
  for (let year = maxYear; year >= minYear; year--) {
    options.push({ label: String(year), value: year })
  }
  return options
})

const months = ['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月']
const days = ['', '一', '', '三', '', '五', '']

const yearMeta = computed(() => getYearMeta(props.year))

const isValidCell = (c: number, r: number) => {
  const { startDayOfWeek, daysInYear } = yearMeta.value
  const index = c * 7 + r
  return index >= startDayOfWeek && index < startDayOfWeek + daysInYear
}

const levelColors = [
  'var(--color-cell-empty)',
  'var(--color-cell-level-1)',
  'var(--color-cell-level-2)',
  'var(--color-cell-level-3)',
  'var(--color-cell-level-4)',
]
const levelToColor = (level: number) => levelColors[level] ?? levelColors[0]!

const updateGrid = (mutator: (next: number[][]) => void) => {
  const next = props.grid.map((col) => col.slice())
  mutator(next)
  emit('update:grid', next)
}

const clearGrid = () => {
  updateGrid((next) => {
    next.forEach((col) => col.fill(0))
  })
}

const fillGrid = () => {
  updateGrid((next) => {
    next.forEach((col) => col.fill(4))
  })
}

const getYearMeta = (year: number) => {
  const isLeap = (year % 4 === 0 && year % 100 !== 0) || (year % 400 === 0)
  const daysInYear = isLeap ? 366 : 365
  const startDate = new Date(year, 0, 1)
  const startDayOfWeek = startDate.getDay()
  return { daysInYear, startDayOfWeek }
}

const resizeGridForYear = (year: number) => {
  const targetCols = calcTotalCols(year)
  const targetRows = 7
  if (targetCols === cols.value && rows.value === targetRows && cols.value > 0) return

  const next = Array.from({ length: targetCols }, () => Array(targetRows).fill(0))
  const copyCols = Math.min(targetCols, cols.value)
  const copyRows = Math.min(targetRows, rows.value)
  for (let c = 0; c < copyCols; c++) {
    for (let r = 0; r < copyRows; r++) {
      next[c][r] = props.grid[c]?.[r] ?? 0
    }
  }
  emit('update:grid', next)
}

const monthPositions = computed(() => {
  const year = props.year
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
  return positions.filter((p) => p.colIndex < totalCols.value)
})

const calendarGrid = computed<(GraphCell | null)[][]>(() => {
  const { startDayOfWeek, daysInYear } = yearMeta.value
  const colsCount = totalCols.value
  const grid: (GraphCell | null)[][] = Array.from({ length: colsCount }, () => Array(7).fill(null))
  for (let c = 0; c < colsCount; c++) {
    for (let r = 0; r < 7; r++) {
      const index = c * 7 + r
      if (index < startDayOfWeek || index >= startDayOfWeek + daysInYear) {
        grid[c][r] = null
        continue
      }
      const level = props.grid[c]?.[r] ?? 0
      const future = isFutureCell(props.year, index, startDayOfWeek)
      grid[c][r] = { level, isFuture: future }
    }
  }
  return grid
})

const prevYear = () => {
  if (props.year <= minYear) return
  emit('update:year', props.year - 1)
}

const nextYear = () => {
  if (props.year >= maxYear) return
  emit('update:year', props.year + 1)
}

const changeYear = (value: number) => {
  emit('update:year', value)
}

const getPatternOffsets = (pattern: boolean[][]) => {
  const height = pattern.length
  const width = pattern.reduce((max, row) => Math.max(max, row.length), 0)
  return {
    offsetC: Math.floor(width / 2),
    offsetR: Math.floor(height / 2),
  }
}

const applyPattern = (anchorC: number, anchorR: number) => {
  if (!activePattern.value) return
  const pattern = activePattern.value
  const { offsetC, offsetR } = getPatternOffsets(pattern)
  updateGrid((next) => {
    for (let rIndex = 0; rIndex < pattern.length; rIndex++) {
  const row = pattern[rIndex]
      if (!row) continue
      for (let cIndex = 0; cIndex < row.length; cIndex++) {
        if (!row[cIndex]) continue
        const targetC = anchorC + cIndex - offsetC
        const targetR = anchorR + rIndex - offsetR
        if (!next[targetC] || next[targetC][targetR] === undefined) continue
        if (!isValidCell(targetC, targetR)) continue
        const level = activePatternRandom.value ? Math.floor(Math.random() * 4) + 1 : activeLevel.value
        next[targetC][targetR] = level
      }
    }
  })
}

const setCell = (c: number, r: number) => {
  if (!isValidCell(c, r)) return
  if (activeTool.value === 'eraser') {
    updateGrid((next) => {
      if (!next[c]) return
      next[c][r] = 0
    })
    return
  }
  if (activeTool.value === 'pattern') {
    applyPattern(c, r)
    return
  }
  if (activeTool.value === 'auto') {
    updateGrid((next) => {
      if (!next[c]) return
      const cur = next[c][r] ?? 0
      next[c][r] = cur >= 4 ? 0 : cur + 1
    })
    return
  }
  if (activeTool.value === 'random') {
    updateGrid((next) => {
      if (!next[c]) return
      next[c][r] = Math.floor(Math.random() * 4) + 1
    })
    return
  }
  updateGrid((next) => {
    if (!next[c]) return
    next[c][r] = activeLevel.value
  })
}

const buildPatternTargets = (anchorC: number, anchorR: number) => {
  if (!activePattern.value) return new Set<string>()
  const pattern = activePattern.value
  const { offsetC, offsetR } = getPatternOffsets(pattern)
  const next = new Set<string>()
  for (let rIndex = 0; rIndex < pattern.length; rIndex++) {
    const row = pattern[rIndex]
    if (!row) continue
    for (let cIndex = 0; cIndex < row.length; cIndex++) {
      if (!row[cIndex]) continue
      const targetC = anchorC + cIndex - offsetC
      const targetR = anchorR + rIndex - offsetR
      if (targetC < 0 || targetR < 0 || targetC >= totalCols.value || targetR >= rows.value) continue
      if (!isValidCell(targetC, targetR)) continue
      next.add(`${targetC},${targetR}`)
    }
  }
  return next
}

const updatePreview = (c: number, r: number) => {
  if (!previewEnabled.value || activeTool.value !== 'pattern' || !activePattern.value) {
    previewCells.value = new Set()
    previewLevels.value = new Map()
    return
  }
  const targets = buildPatternTargets(c, r)
  previewCells.value = targets
  if (activePatternRandom.value) {
    const map = new Map<string, number>()
    targets.forEach((key) => {
      map.set(key, Math.floor(Math.random() * 4) + 1)
    })
    previewLevels.value = map
  } else {
    previewLevels.value = new Map()
  }
}

const clearPreview = () => {
  previewCells.value = new Set()
  previewLevels.value = new Map()
}

const handleRightClick = () => {
  previewEnabled.value = false
  clearPreview()
}

const isPreviewCell = (c: number, r: number) => previewCells.value.has(`${c},${r}`)
const previewColor = (c: number, r: number) => {
  const level = previewLevels.value.get(`${c},${r}`)
  return level ? levelToColor(level) : levelToColor(activeLevel.value)
}

const handlePatternSelect = (pattern: boolean[][], level: number, random: boolean) => {
  activePattern.value = pattern
  activeLevel.value = level
  activePatternRandom.value = random
  activeTool.value = 'pattern'
  previewEnabled.value = true
  showPatternDialog.value = false
}

onMounted(() => {
  resizeGridForYear(props.year)
})

watch(
  () => props.year,
  (year) => {
    resizeGridForYear(year)
  },
)

watch(
  () => props.show,
  (show) => {
    if (!show) return
    resizeGridForYear(props.year)
  },
)
watch(activeTool, () => {
  if (activeTool.value !== 'pattern') {
    previewEnabled.value = true
    clearPreview()
  }
})
</script>

<template>
  <n-modal :show="props.show" preset="card" :title="modalTitle" style="width: min(760px, 94vw);" @update:show="emit('update:show', $event)">
    <div class="calendar-header">
      <n-button size="small" secondary circle @click="prevYear" aria-label="上一年">
        <n-icon size="14"><ChevronLeft /></n-icon>
      </n-button>
      <n-select
        :value="props.year"
        :options="yearOptions"
        size="small"
        style="width: 120px"
        @update:value="changeYear"
      />
      <n-button size="small" secondary circle @click="nextYear" aria-label="下一年">
        <n-icon size="14"><ChevronRight /></n-icon>
      </n-button>
    </div>
    <div class="edit-form">
      <n-input :value="title" placeholder="请输入图案标题" maxlength="80" @update:value="emit('update:title', $event)" />
      <n-input
        :value="desc"
        type="textarea"
        placeholder="可选，简要描述图案"
        :autosize="{ minRows: 2, maxRows: 3 }"
        @update:value="emit('update:desc', $event)"
      />
    </div>
    <div class="edit-canvas">
      <div
        class="edit-preview"
        @mouseleave="clearPreview"
        @contextmenu.prevent="handleRightClick"
      >
          <GraphTableTemplate
            :grid-cols="calendarGrid"
            :month-positions="monthPositions"
            :days="days"
            :level-to-color="levelToColor"
            :is-preview-cell="isPreviewCell"
            :preview-color="previewColor"
            :on-cell-pointer-enter="updatePreview"
            :on-cell-click="setCell"
            :on-cell-context-menu="() => handleRightClick()"
            :on-context-menu="() => handleRightClick()"
            :cell-size="cellSize"
            :gap="gap"
            :auto-scale="true"
            :days-col-width="30"
          />
      </div>
      <ToolbarTemplate
        floating
        :active-tool="activeTool"
        :active-level="activeLevel"
        :can-brush="true"
        :can-eraser="true"
        :can-auto="true"
        :can-random="true"
        :can-pattern="true"
        :can-clear="true"
        :can-fill="true"
        @update:activeTool="(tool) => (activeTool = tool as 'brush' | 'eraser' | 'pattern' | 'auto' | 'random')"
        @update:activeLevel="(level) => (activeLevel = level)"
        @open-pattern="showPatternDialog = true"
        @clear="clearGrid"
        @fill="fillGrid"
      />
    </div>
    <div class="actions">
      <n-button secondary @click="emit('update:show', false)">取消</n-button>
      <n-button type="primary" :loading="submitLoading" @click="emit('submit')">
        {{ submitText }}
      </n-button>
    </div>
    <PatternDialog v-model:show="showPatternDialog" @select="handlePatternSelect" />
  </n-modal>
</template>

<style scoped>
.edit-form {
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin-bottom: 12px;
}

.calendar-header {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 8px;
  margin-bottom: 8px;
}

.edit-canvas {
  position: relative;
  padding-bottom: 84px;
}

.edit-preview {
  padding: 12px;
  border-radius: 12px;
  background: var(--color-bg-light);
  border: 1px solid var(--color-border);
  overflow: hidden;
  margin-bottom: 12px;
}


.actions {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  margin-top: 8px;
}
</style>
