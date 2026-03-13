<script setup lang="ts">
/**
 * @file 工具栏模板：可复用的工具按钮与调色板布局。
 */
import { computed } from 'vue'
import { NTooltip, NIcon } from 'naive-ui'
import { Pen, Erase, ColorPalette, Lightning, StringText, TrashCan, PaintBrush } from '@vicons/carbon'

const props = withDefaults(
  defineProps<{
    activeTool: string
    activeLevel: number
    floating?: boolean
    canBrush?: boolean
    canEraser?: boolean
    canAuto?: boolean
    canRandom?: boolean
    canPattern?: boolean
    canClear?: boolean
    canFill?: boolean
  }>(),
  {
    floating: false,
    canBrush: true,
    canEraser: true,
    canAuto: false,
    canRandom: false,
    canPattern: false,
    canClear: false,
    canFill: false,
  },
)

const emit = defineEmits<{
  (e: 'update:activeTool', value: string): void
  (e: 'update:activeLevel', value: number): void
  (e: 'open-pattern'): void
  (e: 'clear'): void
  (e: 'fill'): void
}>()

const levels = [0, 1, 2, 3, 4]
const levelColors = [
  'var(--color-cell-empty)',
  'var(--color-cell-level-1)',
  'var(--color-cell-level-2)',
  'var(--color-cell-level-3)',
  'var(--color-cell-level-4)',
]
const levelToColor = (level: number) => levelColors[level] ?? levelColors[0]!

const toolActive = computed(() => props.activeTool)
const levelActive = computed(() => props.activeLevel)
</script>

<template>
  <div class="toolbar-container" :class="{ floating }">
    <div class="toolbar">
      <div class="tool-group">
        <n-tooltip v-if="canBrush" trigger="hover">
          <template #trigger>
            <button
              class="tool-btn"
              :class="{ active: toolActive === 'brush' }"
              @click="emit('update:activeTool', 'brush')"
            >
              <n-icon size="16"><Pen /></n-icon>
            </button>
          </template>
          画笔
        </n-tooltip>
        <n-tooltip v-if="canEraser" trigger="hover">
          <template #trigger>
            <button
              class="tool-btn"
              :class="{ active: toolActive === 'eraser' }"
              @click="emit('update:activeTool', 'eraser')"
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
          v-for="level in levels"
          :key="level"
          class="color-btn"
          :style="{ backgroundColor: levelToColor(level) }"
          :class="{ active: levelActive === level }"
          @click="emit('update:activeLevel', level)"
        ></button>
      </div>

      <div class="special-tools" v-if="canAuto || canRandom">
        <n-tooltip v-if="canAuto" trigger="hover">
          <template #trigger>
            <button
              class="icon-tool auto-btn"
              :class="{ active: toolActive === 'auto' }"
              @click="emit('update:activeTool', 'auto')"
            >
              <n-icon size="16"><Lightning /></n-icon>
            </button>
          </template>
          自动
        </n-tooltip>
        <n-tooltip v-if="canRandom" trigger="hover">
          <template #trigger>
            <button
              class="icon-tool random-btn"
              :class="{ active: toolActive === 'random' }"
              @click="emit('update:activeTool', 'random')"
            >
              <n-icon size="16"><ColorPalette /></n-icon>
            </button>
          </template>
          随机
        </n-tooltip>
      </div>

      <div class="divider" v-if="canPattern || canClear || canFill"></div>

      <div class="extra-tools" v-if="canPattern || canClear || canFill">
        <n-tooltip v-if="canPattern" trigger="hover">
          <template #trigger>
            <button
              class="tool-btn"
              :class="{ active: toolActive === 'pattern' }"
              @click="emit('open-pattern')"
            >
              <n-icon size="16"><StringText /></n-icon>
            </button>
          </template>
          图案
        </n-tooltip>

        <n-tooltip v-if="canClear" trigger="hover">
          <template #trigger>
            <button class="tool-btn" @click="emit('clear')">
              <n-icon size="16"><TrashCan /></n-icon>
            </button>
          </template>
          清空
        </n-tooltip>

        <n-tooltip v-if="canFill" trigger="hover">
          <template #trigger>
            <button class="icon-tool" style="color: var(--color-success)" @click="emit('fill')">
              <n-icon size="16"><PaintBrush /></n-icon>
            </button>
          </template>
          全满
        </n-tooltip>
      </div>
    </div>
  </div>
</template>

<style scoped>
.toolbar-container {
  position: relative;
  display: flex;
  justify-content: center;
}

.toolbar-container.floating {
  position: absolute;
  left: 50%;
  bottom: 1.5rem;
  transform: translateX(-50%);
  z-index: 2;
}

.toolbar {
  background-color: white;
  border-radius: 16px;
  box-shadow: 0 4px 24px rgba(0, 0, 0, 0.06);
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
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
  font-weight: 500;
}

.divider {
  width: 1px;
  height: 24px;
  background-color: var(--color-border);
}

.color-palette {
  display: flex;
  gap: 8px;
}

.color-btn {
  width: 28px;
  height: 28px;
  border-radius: 6px;
  border: 2px solid transparent;
  cursor: pointer;
}

.color-btn.active {
  border-color: var(--color-text-main);
}

.special-tools {
  display: flex;
  align-items: center;
  gap: 8px;
}

.icon-tool {
  width: 32px;
  height: 32px;
  border-radius: 8px;
  border: 1px solid var(--color-border);
  background: white;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
}

.icon-tool.active {
  border-color: var(--color-text-main);
}
</style>
