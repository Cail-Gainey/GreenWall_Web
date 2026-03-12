<script setup lang="ts">
import { ref, computed } from 'vue'
import {
  NModal,
  NTabs,
  NTabPane,
  NIcon,
  NTooltip
} from 'naive-ui'
import { Shuffle } from '@vicons/carbon'
import { PATTERNS } from '../utils/patterns'

const props = defineProps<{
  show: boolean
}>()

const emit = defineEmits<{
  (e: 'update:show', value: boolean): void
  (e: 'select', pattern: boolean[][], level: number, random: boolean): void
}>()

const localShow = computed({
  get: () => props.show,
  set: (val) => emit('update:show', val)
})

const intensityLevels = [1, 2, 3, 4]
const selectedIntensity = ref(4)
const randomizePattern = ref(false)
const randomSeed = ref(0)

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
    emit('select', patternGrid, selectedIntensity.value, randomizePattern.value)
    localShow.value = false
  }
}
</script>

<template>
  <n-modal 
    v-model:show="localShow" 
    preset="card" 
    title="选择图案" 
    class="pattern-modal"
    style="width: 680px; max-width: 90vw; background-color: var(--color-surface); color: var(--color-text-main);"
  >
    <template #header-extra>
      <!-- Ensure close button behaves correctly inherited from NModal preset -->
    </template>
    
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

    <n-tabs type="line" animated>
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

    </n-tabs>
  </n-modal>
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
</style>
