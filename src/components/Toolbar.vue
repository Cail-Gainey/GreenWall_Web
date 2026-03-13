<script setup lang="ts">
/**
 * @file 工具栏组件：选择画笔、橡皮擦与颜色。
 */
import { computed, inject, ref, type Ref } from 'vue';
import PatternDialog from './PatternDialog.vue';
import ToolbarTemplate from './ToolbarTemplate.vue';
import { usePermissionStore } from '../stores/permission';

/**
 * @description 可选贡献等级调色板（0-4）。
 */

const activeLevel = inject<Ref<number>>('activeLevel')!;
const activeTool = inject<Ref<string>>('activeTool')!;
const requestClear = inject<() => void>('requestClear')!;
const requestFillAll = inject<() => void>('requestFillAll')!;
const activePattern = inject<Ref<boolean[][] | null>>('activePattern')!;
const activePatternLevel = inject<Ref<number>>('activePatternLevel')!;
const activePatternRandom = inject<Ref<boolean>>('activePatternRandom')!;

const { hasPermission } = usePermissionStore();
const canBrush = computed(() => hasPermission('app:graph:brush'));
const canEraser = computed(() => hasPermission('app:graph:eraser'));
const canAuto = computed(() => hasPermission('app:graph:auto'));
const canRandom = computed(() => hasPermission('app:graph:random'));
const canPattern = computed(() => hasPermission('app:graph:pattern'));
const canClear = computed(() => hasPermission('app:graph:clear'));
const canFill = computed(() => hasPermission('app:graph:fill'));

const showPatternDialog = ref(false);

const handlePatternSelect = (pattern: boolean[][], level: number, random: boolean) => {
  activePattern.value = pattern;
  activePatternLevel.value = level;
  activePatternRandom.value = random;
  activeTool.value = 'pattern';
};

const openPattern = () => {
  showPatternDialog.value = true
}

const updateTool = (tool: string) => {
  activeTool.value = tool
}

const updateLevel = (level: number) => {
  activeLevel.value = level
}
</script>

<template>
<ToolbarTemplate
  floating
  :active-tool="activeTool"
  :active-level="activeLevel"
  :can-brush="canBrush"
  :can-eraser="canEraser"
  :can-auto="canAuto"
  :can-random="canRandom"
  :can-pattern="canPattern"
  :can-clear="canClear"
  :can-fill="canFill"
  @update:activeTool="updateTool"
  @update:activeLevel="updateLevel"
  @open-pattern="openPattern"
  @clear="requestClear"
  @fill="requestFillAll"
/>
<PatternDialog v-if="canPattern" v-model:show="showPatternDialog" @select="handlePatternSelect" />
</template>

<style scoped>
</style>
