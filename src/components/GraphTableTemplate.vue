<script setup lang="ts">
/**
 * @file 贡献图表格模板：月份、星期、网格渲染。
 */
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
export interface GraphCell {
  level: number
  isFuture?: boolean
}

const props = withDefaults(defineProps<{
  gridCols: (GraphCell | null)[][]
  monthPositions: { label: string; colIndex: number }[]
  days: string[]
  levelToColor: (level: number) => string
  isPreviewCell?: (c: number, r: number) => boolean
  previewColor?: (c: number, r: number) => string
  onCellPointerDown?: (c: number, r: number, e: PointerEvent) => void
  onCellPointerEnter?: (c: number, r: number) => void
  onCellClick?: (c: number, r: number) => void
  onCellContextMenu?: (c: number, r: number, e: MouseEvent) => void
  onContextMenu?: (e: MouseEvent) => void
  cellSize?: number
  gap?: number
  autoScale?: boolean
  daysColWidth?: number
}>(), {
  cellSize: 14,
  gap: 4,
  autoScale: true,
  daysColWidth: 30,
})

const containerRef = ref<HTMLElement | null>(null)
const scale = ref(1)

const handleCellContextMenu = (c: number, r: number, event: MouseEvent) => {
  if (props.onCellContextMenu) {
    props.onCellContextMenu(c, r, event)
    return
  }
  props.onContextMenu?.(event)
}

const cols = computed(() => props.gridCols.length)

const recalcScale = () => {
  if (!props.autoScale) {
    scale.value = 1
    return
  }
  const el = containerRef.value
  if (!el) return
  const style = window.getComputedStyle(el)
  const paddingLeft = parseFloat(style.paddingLeft || '0')
  const paddingRight = parseFloat(style.paddingRight || '0')
  const available = Math.max(0, el.clientWidth - paddingLeft - paddingRight)
  const contentWidth = cols.value * props.cellSize + (cols.value - 1) * props.gap + props.daysColWidth
  if (contentWidth <= 0 || available <= 0) {
    scale.value = 1
    return
  }
  const next = available / contentWidth
  scale.value = Number.isFinite(next) ? Math.min(1, next) : 1
}

let resizeObserver: ResizeObserver | null = null
let contextMenuHandler: ((event: MouseEvent) => void) | null = null
onMounted(() => {
  recalcScale()
  if (containerRef.value && 'ResizeObserver' in window) {
    resizeObserver = new ResizeObserver(() => recalcScale())
    resizeObserver.observe(containerRef.value)
  }

  if (containerRef.value) {
    contextMenuHandler = (event: MouseEvent) => {
      event.preventDefault()
      event.stopPropagation()
      props.onContextMenu?.(event)
    }
    containerRef.value.addEventListener('contextmenu', contextMenuHandler, { capture: true })
  }
})

onBeforeUnmount(() => {
  resizeObserver?.disconnect()
  if (containerRef.value && contextMenuHandler) {
    containerRef.value.removeEventListener('contextmenu', contextMenuHandler, { capture: true })
  }
})

watch(cols, () => recalcScale())
</script>

<template>
  <div
    class="graph-scroll-area"
    ref="containerRef"
    @contextmenu.prevent.stop="props.onContextMenu?.($event)"
    @pointerdown.prevent="($event.button === 2) ? props.onContextMenu?.($event as any) : undefined"
  >
    <div
      class="graph-scale"
      :style="{
        '--scale': scale,
        '--cell-size': `${props.cellSize}px`,
        '--gap': `${props.gap}px`,
        '--days-col-width': `${props.daysColWidth}px`,
        '--cols': cols,
      }"
    >
      <div class="months-row" :style="{ width: `${cols * (props.cellSize + props.gap)}px` }">
        <span
          v-for="(mp, idx) in props.monthPositions"
          :key="idx"
          class="month-label"
          :style="{ left: `${mp.colIndex * (props.cellSize + props.gap)}px` }"
        >
          {{ mp.label }}
        </span>
      </div>

      <div class="graph-body">
        <div class="days-col">
          <span v-for="(d, i) in props.days" :key="i" class="day-label">{{ d }}</span>
        </div>

        <div class="grid-wrapper">
          <div class="grid-col" v-for="(col, c) in props.gridCols" :key="c">
            <template v-for="(cell, r) in col" :key="r">
              <div
                v-if="cell"
                class="grid-cell"
                :class="{
                  'future-cell': cell.isFuture,
                  'preview-cell': props.isPreviewCell?.(c, r),
                  'cell-disabled': cell.isFuture
                }"
                :style="{ backgroundColor: props.levelToColor(cell.level), '--preview-color': props.previewColor?.(c, r) }"
                @pointerdown="cell.isFuture ? undefined : props.onCellPointerDown?.(c, r, $event)"
                @pointerenter="cell.isFuture ? undefined : props.onCellPointerEnter?.(c, r)"
                @click="cell.isFuture ? undefined : props.onCellClick?.(c, r)"
                @contextmenu.prevent.stop="handleCellContextMenu(c, r, $event)"
              ></div>
              <div v-else class="grid-cell ghost-cell"></div>
            </template>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.graph-scroll-area {
  display: block;
  width: 100%;
  min-width: 0;
}

.graph-scale {
  transform: scale(var(--scale));
  transform-origin: left top;
  width: max-content;
}

.months-row {
  position: relative;
  height: 20px;
  margin-left: var(--days-col-width);
  margin-bottom: 0.5rem;
}

.month-label {
  position: absolute;
  font-size: 0.8rem;
  color: var(--color-text-muted);
  white-space: nowrap;
}

.graph-body {
  display: flex;
  gap: 10px;
}

.days-col {
  width: var(--days-col-width);
  display: flex;
  flex-direction: column;
  justify-content: space-between;
}

.day-label {
  font-size: 0.8rem;
  color: var(--color-text-muted);
  height: 14px;
  display: flex;
  align-items: center;
}

.grid-wrapper {
  display: flex;
  gap: var(--gap);
}

.grid-col {
  display: flex;
  flex-direction: column;
  gap: var(--gap);
}

.grid-cell {
  width: var(--cell-size);
  height: var(--cell-size);
  border-radius: 3px;
  transition: all 0.1s;
  touch-action: none;
}

.grid-cell.preview-cell {
  position: relative;
}

.grid-cell.preview-cell::after {
  content: '';
  position: absolute;
  inset: 0;
  background-color: var(--preview-color);
  opacity: 0.35;
  border-radius: 3px;
  pointer-events: none;
}

.grid-cell:not(.ghost-cell):not(.future-cell) {
  cursor: pointer;
}

.grid-cell:not(.ghost-cell):not(.future-cell):hover {
  transform: scale(1.1);
  box-shadow: 0 0 0 1px rgba(0,0,0,0.1);
  z-index: 2;
}

.future-cell {
  background-color: var(--color-cell-future);
  opacity: 0.8;
  cursor: not-allowed;
}

.cell-disabled {
  pointer-events: none;
}
</style>
