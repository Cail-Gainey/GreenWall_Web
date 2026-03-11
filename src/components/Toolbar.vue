<script setup lang="ts">
/**
 * @file 工具栏组件：选择画笔、橡皮擦与颜色。
 */
import { inject, type Ref } from 'vue';

/**
 * @description 可选颜色调色板。
 */
const colors = [
  '#ebedf0', // light grey (empty)
  '#c6e48b', // light green
  '#7bc96f',
  '#239a3b',
  '#196127', // dark green
];
const activeColor = inject<Ref<string>>('activeColor')!;
const activeTool = inject<Ref<string>>('activeTool')!;
</script>

<template>
  <div class="toolbar-container">
    <div class="toolbar">
      <!-- Brush and Eraser -->
      <div class="tool-group">
        <button 
          class="tool-btn" 
          :class="{ active: activeTool === 'brush' }"
          @click="activeTool = 'brush'"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M12 19l7-7 3 3-7 7-3-3z"></path>
            <path d="M18 13l-1.5-7.5L2 2l3.5 14.5L13 18l5-5z"></path>
            <path d="M2 2l7.58 7.58"></path>
          </svg>
          画笔
        </button>
        <button 
          class="tool-btn"
          :class="{ active: activeTool === 'eraser' }"
          @click="activeTool = 'eraser'"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M20 20H4"></path>
            <path d="M4 16l8-8 8 8"></path>
            <path d="M4 12V8h16v4"></path>
          </svg>
          橡皮擦
        </button>
      </div>

      <div class="divider"></div>

      <!-- Color Palette -->
      <div class="color-palette">
        <button 
          v-for="color in colors" 
          :key="color" 
          class="color-btn"
          :style="{ backgroundColor: color }"
          :class="{ 'active': activeColor === color }"
          @click="activeColor = color"
        ></button>
      </div>
      
      <!-- Specialized Icons -->
      <div class="special-tools">
        <button class="icon-tool">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"></polygon>
          </svg>
        </button>
        <button class="icon-tool">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M9 3H15"></path>
            <path d="M10 9l-4 8a2 2 0 0 0 1.7 3h10.6a2 2 0 0 0 1.7-3l-4-8V3"></path>
          </svg>
        </button>
      </div>

      <div class="divider"></div>

      <!-- More Tools -->
      <div class="extra-tools">
        <button class="tool-btn icon-text">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M4 7V4h16v3"></path>
            <path d="M9 20h6"></path>
            <path d="M12 4v16"></path>
          </svg>
          ABC
        </button>
        
        <button class="icon-tool" style="color: var(--color-primary)">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M3 13h18"></path>
            <rect x="3" y="13" width="18" height="6" rx="2"></rect>
            <path d="M9 5h6"></path>
            <path d="M12 5v8"></path>
          </svg>
        </button>
        
        <button class="icon-tool" style="color: #ef4444">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M3 10V2h10v8"></path>
            <rect x="13" y="2" width="8" height="8" rx="2"></rect>
            <path d="M13 18v4"></path>
            <path d="M15 14h6"></path>
            <path d="M13 22h8"></path>
          </svg>
        </button>
      </div>

    </div>
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
  align-items: center;
  gap: 6px;
  background: transparent;
  border: none;
  padding: 6px 12px;
  font-size: 0.9rem;
  color: var(--color-text-muted);
  border-radius: 8px;
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

.special-tools .icon-tool:nth-child(1) {
  border: 1px solid var(--color-border);
  border-radius: 8px;
  box-shadow: 0 1px 2px rgba(0,0,0,0.05);
  color: var(--color-primary);
}

.special-tools .icon-tool:nth-child(2) {
  border: 1px solid var(--color-border);
  color: #8b5cf6; /* purple */
}

.icon-text {
  font-weight: bold;
}
</style>
