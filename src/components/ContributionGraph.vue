<script setup lang="ts">
/**
 * @file 贡献图组件：按年份渲染可绘制的日历网格。
 */
import { ref, inject, type Ref } from 'vue';

const props = defineProps<{
  initialYear?: number
}>()

const activeColor = inject<Ref<string>>('activeColor');
const activeTool = inject<Ref<string>>('activeTool');

const currentYear = ref(props.initialYear || new Date().getFullYear());

const months = ['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月'];
const days = ['一', '', '三', '', '五', '', ''];

interface CellData {
  date: string;
  color: string;
  isFuture: boolean;
}

const gridCols = ref<(CellData | null)[][]>([]);
const monthPositions = ref<{ label: string; colIndex: number }[]>([]);

/**
 * @description 生成指定年份的网格数据与月份标记位置。
 * @param {number} year 目标年份。
 */
const generateGrid = (year: number) => {
  const isLeap = (year % 4 === 0 && year % 100 !== 0) || (year % 400 === 0);
  const daysInYear = isLeap ? 366 : 365;
  
  const startDate = new Date(year, 0, 1);
  const startDayOfWeek = startDate.getDay(); // 0 is Sun, 1 is Mon... 6 is Sat
  
  // We want rows 0-6 to represent Mon-Sun
  const startRowIndex = startDayOfWeek === 0 ? 6 : startDayOfWeek - 1;
  const totalCols = Math.ceil((daysInYear + startRowIndex) / 7);

  const newGrid: (CellData | null)[][] = Array.from({ length: totalCols }, () => Array(7).fill(null));
  const newMonthPositions: { label: string; colIndex: number }[] = [];

  const tempDate = new Date(year, 0, 1);
  let col = 0;
  let row = startRowIndex;

  for (let i = 0; i < daysInYear; i++) {
    // Record month positions
    if (tempDate.getDate() === 1) {
      newMonthPositions.push({
        label: months[tempDate.getMonth()]!,
        colIndex: col
      });
    }

    // Format date string as YYYY-MM-DD (local time friendly)
    const yyyy = tempDate.getFullYear();
    const mm = String(tempDate.getMonth() + 1).padStart(2, '0');
    const dd = String(tempDate.getDate()).padStart(2, '0');
    const dateStr = `${yyyy}-${mm}-${dd}`;
    
    // Check if the date is in the future
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const isFuture = tempDate > today;

    newGrid[col]![row] = {
      date: dateStr,
      color: 'var(--color-cell-empty)', // default empty color mapped to theme
      isFuture: isFuture
    };

    // Note: To mimic the existing mock data on first load for 2026, we apply some visual green boxes
    // so the grid isn't totally empty!
    if (year === props.initialYear || (year === 2026 && props.initialYear === undefined)) {
        if (col > 1 && col < 15 && row > 0 && row < 6 && newGrid[col] && newGrid[col]![row]) {
            newGrid[col]![row]!.color = '#c6e48b';
        }
    }

    // Advance to next day
    tempDate.setDate(tempDate.getDate() + 1);
    row++;
    if (row > 6) {
      row = 0;
      col++;
    }
  }

  gridCols.value = newGrid;
  monthPositions.value = newMonthPositions;
};

// Initialize
generateGrid(currentYear.value);

// Year switching
/**
 * @description 切换到上一年并重建网格。
 */
const prevYear = () => {
  currentYear.value--;
  generateGrid(currentYear.value);
};

/**
 * @description 切换到下一年并重建网格。
 */
const nextYear = () => {
  currentYear.value++;
  generateGrid(currentYear.value);
};

// Painting logic
const isMouseDown = ref(false);

/**
 * @description 开始涂色并立即绘制当前单元格。
 * @param {number} c 列索引。
 * @param {number} r 行索引。
 */
const startPaint = (c: number, r: number) => {
  isMouseDown.value = true;
  paint(c, r);
};

/**
 * @description 鼠标悬停时按需连续绘制。
 * @param {number} c 列索引。
 * @param {number} r 行索引。
 */
const hoverPaint = (c: number, r: number) => {
  if (isMouseDown.value) {
    paint(c, r);
  }
};

/**
 * @description 结束涂色。
 */
const endPaint = () => {
  isMouseDown.value = false;
};

/**
 * @description 根据当前工具与颜色更新单元格。
 * @param {number} c 列索引。
 * @param {number} r 行索引。
 */
const paint = (c: number, r: number) => {
  const cell = gridCols.value[c]?.[r];
  if (cell && !cell.isFuture && activeTool?.value && activeColor?.value) {
    if (activeTool.value === 'brush') {
      cell.color = activeColor.value;
    } else if (activeTool.value === 'eraser') {
      cell.color = 'var(--color-cell-empty)';
    }
  }
};
</script>

<template>
  <div class="contribution-graph-wrapper" @mouseup="endPaint" @mouseleave="endPaint">
    <div class="graph-container">
      
      <div class="graph-scroll-area">
        <!-- Months row -->
        <div class="months-row" :style="{ width: `calc(${gridCols.length * 18}px)` }">
          <span 
            v-for="(mp, idx) in monthPositions" 
            :key="idx" 
            class="month-label"
            :style="{ left: `${mp.colIndex * 18}px` }"
          >
            {{ mp.label }}
          </span>
        </div>

        <div class="graph-body">
          <!-- Days column -->
          <div class="days-col">
            <span v-for="(d, i) in days" :key="i" class="day-label">{{ d }}</span>
          </div>

          <!-- Grid -->
          <div class="grid-wrapper">
            <div class="grid-col" v-for="(col, c) in gridCols" :key="c">
              <template v-for="(cell, r) in col" :key="r">
                <div 
                  v-if="cell"
                  class="grid-cell" 
                  :class="{ 'future-cell': cell.isFuture }"
                  :style="{ backgroundColor: cell.color }"
                  :data-date="cell.date"
                  @mousedown="startPaint(c, r)"
                  @mouseenter="hoverPaint(c, r)"
                ></div>
                <div v-else class="grid-cell ghost-cell"></div>
              </template>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Year Selector -->
    <div class="year-selector">
      <span class="year-label">年份:</span>
      <div class="year-control">
        <button class="icon-btn" @click="prevYear">&lt;</button>
        <span class="year-val">{{ currentYear }}</span>
        <button class="icon-btn" @click="nextYear">&gt;</button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.contribution-graph-wrapper {
  width: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.graph-container {
  width: 100%;
  border: 1px solid var(--color-border);
  border-radius: 12px;
  padding: 1.5rem;
  margin-bottom: 2rem;
  overflow-x: auto; /* Fixes bounds overflow issue */
}

.graph-scroll-area {
  display: inline-block; /* Ensure it wraps contents */
  min-width: max-content;
}

.months-row {
  position: relative;
  height: 20px;
  margin-left: 30px; /* Offset for days column */
  margin-bottom: 0.5rem;
}

.month-label {
  position: absolute;
  font-size: 0.8rem;
  color: #9ca3af;
  white-space: nowrap;
}

.graph-body {
  display: flex;
  gap: 10px;
}

.days-col {
  display: flex;
  flex-direction: column;
  justify-content: space-between;
}

.day-label {
  font-size: 0.8rem;
  color: #9ca3af;
  height: 14px;
  display: flex;
  align-items: center;
}

.grid-wrapper {
  display: flex;
  gap: 4px;
}

.grid-col {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.grid-cell {
  width: 14px;
  height: 14px;
  border-radius: 3px;
  transition: all 0.1s;
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
  background-color: var(--color-cell-future) !important;
  cursor: not-allowed;
  opacity: 0.6;
}

.ghost-cell {
  background-color: transparent;
  pointer-events: none;
}

.year-selector {
  display: flex;
  align-items: center;
  gap: 12px;
}

.year-label {
  font-size: 0.95rem;
  font-weight: 500;
  color: var(--color-text-main);
}

.year-control {
  display: flex;
  align-items: center;
  background-color: var(--color-bg-light);
  border-radius: 8px;
  padding: 4px;
}

.year-control .icon-btn {
  background: transparent;
  color: var(--color-text-muted);
  border: none;
  padding: 4px 10px;
  font-weight: bold;
  cursor: pointer;
}

.year-control .icon-btn:hover {
  color: var(--color-text-main);
}

.year-val {
  font-weight: 600;
  padding: 0 16px;
  min-width: 60px;
  text-align: center;
}
</style>
