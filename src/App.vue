<script setup lang="ts">
/**
 * @file 根组件：提供全局画笔状态供子组件注入。
 */
import { ref, provide } from 'vue'

/**
 * @description 当前激活颜色（用于涂色网格）。
 */
const activeColor = ref('#7bc96f')
/**
 * @description 当前工具：画笔或橡皮擦。
 */
const activeTool = ref('brush') // 'brush' or 'eraser'

provide('activeColor', activeColor)
provide('activeTool', activeTool)
</script>

<template>
  <router-view></router-view>
</template>

<style scoped>
/* App.vue is now just a wrapper for router-view */
</style>
