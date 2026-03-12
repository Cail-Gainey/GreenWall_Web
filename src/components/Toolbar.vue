<script setup lang="ts">
/**
 * @file 工具栏组件：选择画笔、橡皮擦与颜色。
 */
import { inject, ref, type Ref } from 'vue';
import { NTooltip, NIcon } from 'naive-ui';
import PatternDialog from './PatternDialog.vue';
import { Pen, Erase, ColorPalette, Lightning, StringText, TrashCan, PaintBrush } from '@vicons/carbon';

/**
 * @description 可选贡献等级调色板（0-4）。
 */
const levels = [0, 1, 2, 3, 4];
const levelColors = [
  'var(--color-cell-empty)',
  'var(--color-cell-level-1)',
  'var(--color-cell-level-2)',
  'var(--color-cell-level-3)',
  'var(--color-cell-level-4)',
];
const levelToColor = (level: number) => levelColors[level] ?? levelColors[0]!;

const activeLevel = inject<Ref<number>>('activeLevel')!;
const activeTool = inject<Ref<string>>('activeTool')!;
const requestClear = inject<() => void>('requestClear')!;
const requestFillAll = inject<() => void>('requestFillAll')!;
const activePattern = inject<Ref<boolean[][] | null>>('activePattern')!;
const activePatternLevel = inject<Ref<number>>('activePatternLevel')!;
const activePatternRandom = inject<Ref<boolean>>('activePatternRandom')!;

const showPatternDialog = ref(false);

const handlePatternSelect = (pattern: boolean[][], level: number, random: boolean) => {
  activePattern.value = pattern;
  activePatternLevel.value = level;
  activePatternRandom.value = random;
  activeTool.value = 'pattern';
};
</script>

<template>
  <div class="toolbar-container">
    <div class="toolbar">
      <!-- Brush and Eraser -->
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

      <!-- Color Palette -->
      <div class="color-palette">
        <button 
          v-for="level in levels" 
          :key="level" 
          class="color-btn"
          :style="{ backgroundColor: levelToColor(level) }"
          :class="{ 'active': activeLevel === level }"
          @click="activeLevel = level"
        ></button>
      </div>
      
      <!-- Specialized Icons -->
      <div class="special-tools">
        <n-tooltip trigger="hover">
          <template #trigger>
            <button 
              class="icon-tool auto-btn" 
              :class="{ active: activeTool === 'auto' }" 
              @click="activeTool = 'auto'"
            >
              <n-icon size="16"><Lightning /></n-icon>
            </button>
          </template>
          自动
        </n-tooltip>
        <n-tooltip trigger="hover">
          <template #trigger>
            <button 
              class="icon-tool random-btn" 
              :class="{ active: activeTool === 'random' }" 
              @click="activeTool = 'random'"
            >
              <n-icon size="16"><ColorPalette /></n-icon>
            </button>
          </template>
          随机
        </n-tooltip>
      </div>

      <div class="divider"></div>

      <!-- More Tools -->
      <div class="extra-tools">
        <n-tooltip trigger="hover">
          <template #trigger>
            <button 
              class="tool-btn" 
              :class="{ active: activeTool === 'pattern' }"
              @click="showPatternDialog = true"
            >
              <n-icon size="16"><StringText /></n-icon>
            </button>
          </template>
          图案
        </n-tooltip>

        <n-tooltip trigger="hover">
          <template #trigger>
            <button class="tool-btn" @click="requestClear">
              <n-icon size="16"><TrashCan /></n-icon>
            </button>
          </template>
          清空
        </n-tooltip>
        
        <n-tooltip trigger="hover">
          <template #trigger>
            <button class="icon-tool" style="color: var(--color-success)" @click="requestFillAll">
              <n-icon size="16"><PaintBrush /></n-icon>
            </button>
          </template>
          全满
        </n-tooltip>
      </div>

    </div>
    <PatternDialog v-model:show="showPatternDialog" @select="handlePatternSelect" />
  </div>
</template>

<style scoped>
.toolbar-container {
  position: absolute;
  bottom: 2rem;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  justify-content: center;
}

.toolbar {
  background-color: white;
  border-radius: 16px;
  box-shadow: 0 4px 24px rgba(0,0,0,0.06);
  border: 1px solid var(--color-border);
  padding: 8px;
  display: flex;
  align-items: center;
  gap: 16px;
}

.tool-group, .extra-tools {
  display: flex;
  align-items: center;
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
}

.tool-btn.active {
  background-color: white;
  color: var(--color-text-main);
  box-shadow: 0 1px 3px rgba(0,0,0,0.05);
  font-weight: 500;
}

.divider {
  width: 1px;
  height: 24px;
  background-color: var(--color-border);
}

.color-palette {
  display: flex;
  align-items: center;
  gap: 6px;
}

.color-btn {
  width: 24px;
  height: 24px;
  border-radius: 6px;
  border: 2px solid transparent;
  padding: 0;
  transition: transform 0.1s;
}

.color-btn.active {
  transform: scale(1.1);
  border-color: rgba(0,0,0,0.2);
}

.special-tools {
  display: flex;
  gap: 6px;
}

.icon-tool {
  display: flex;
  justify-content: center;
  align-items: center;
  width: 32px;
  height: 32px;
  border: none;
  background: transparent;
  color: var(--color-primary);
  border-radius: 8px;
}

.auto-btn {
  border: 1px solid var(--color-border);
  border-radius: 8px;
  box-shadow: 0 1px 2px rgba(0,0,0,0.05);
  color: var(--color-primary);
}

.auto-btn.active {
  background-color: var(--color-primary);
  color: white;
}

.random-btn {
  border: 1px solid var(--color-border);
  color: #8b5cf6; /* purple */
}

.random-btn.active {
  background-color: #8b5cf6;
  color: white;
}

</style>
