<script setup lang="ts">
/**
 * @file 根组件：提供全局画笔状态供子组件注入。
 */
import { computed, ref, provide } from 'vue'
import {
  NConfigProvider,
  NDialogProvider,
  NMessageProvider,
  NNotificationProvider,
  darkTheme,
  zhCN,
  dateZhCN
} from 'naive-ui'
import { useTheme } from './composables/useTheme'

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

const { currentTheme, resolvedTheme } = useTheme()

const effectiveTheme = computed(() => {
  return currentTheme.value === 'auto' ? resolvedTheme.value : currentTheme.value
})

const themeOverrides = computed(() => {
  const palettes = {
    light: {
      primary: '#10b981',
      primaryHover: '#0ea271',
      primaryPressed: '#0c8a5f',
      primarySuppl: '#34d399',
      info: '#3b82f6',
      infoHover: '#2563eb',
      infoPressed: '#1d4ed8',
      infoSuppl: '#60a5fa',
      success: '#22c55e',
      successHover: '#16a34a',
      successPressed: '#15803d',
      successSuppl: '#4ade80',
      warning: '#f59e0b',
      warningHover: '#d97706',
      warningPressed: '#b45309',
      warningSuppl: '#fbbf24',
      error: '#ef4444',
      errorHover: '#dc2626',
      errorPressed: '#b91c1c',
      errorSuppl: '#f87171'
    },
    dark: {
      primary: '#34d399',
      primaryHover: '#22c55e',
      primaryPressed: '#16a34a',
      primarySuppl: '#6ee7b7',
      info: '#60a5fa',
      infoHover: '#3b82f6',
      infoPressed: '#2563eb',
      infoSuppl: '#93c5fd',
      success: '#4ade80',
      successHover: '#22c55e',
      successPressed: '#16a34a',
      successSuppl: '#86efac',
      warning: '#fbbf24',
      warningHover: '#f59e0b',
      warningPressed: '#d97706',
      warningSuppl: '#fcd34d',
      error: '#f87171',
      errorHover: '#ef4444',
      errorPressed: '#dc2626',
      errorSuppl: '#fca5a5'
    },
    purple: {
      primary: '#8b5cf6',
      primaryHover: '#7c3aed',
      primaryPressed: '#6d28d9',
      primarySuppl: '#a78bfa',
      info: '#6366f1',
      infoHover: '#4f46e5',
      infoPressed: '#4338ca',
      infoSuppl: '#818cf8',
      success: '#22c55e',
      successHover: '#16a34a',
      successPressed: '#15803d',
      successSuppl: '#4ade80',
      warning: '#f59e0b',
      warningHover: '#d97706',
      warningPressed: '#b45309',
      warningSuppl: '#fbbf24',
      error: '#ef4444',
      errorHover: '#dc2626',
      errorPressed: '#b91c1c',
      errorSuppl: '#f87171'
    },
    pink: {
      primary: '#ec4899',
      primaryHover: '#db2777',
      primaryPressed: '#be185d',
      primarySuppl: '#f472b6',
      info: '#0ea5e9',
      infoHover: '#0284c7',
      infoPressed: '#0369a1',
      infoSuppl: '#38bdf8',
      success: '#22c55e',
      successHover: '#16a34a',
      successPressed: '#15803d',
      successSuppl: '#4ade80',
      warning: '#f59e0b',
      warningHover: '#d97706',
      warningPressed: '#b45309',
      warningSuppl: '#fbbf24',
      error: '#ef4444',
      errorHover: '#dc2626',
      errorPressed: '#b91c1c',
      errorSuppl: '#f87171'
    }
  }

  const palette = palettes[effectiveTheme.value]
  return {
    common: {
      fontFamily: 'Lato, Segoe UI, Tahoma, sans-serif',
      primaryColor: palette.primary,
      primaryColorHover: palette.primaryHover,
      primaryColorPressed: palette.primaryPressed,
      primaryColorSuppl: palette.primarySuppl,
      infoColor: palette.info,
      infoColorHover: palette.infoHover,
      infoColorPressed: palette.infoPressed,
      infoColorSuppl: palette.infoSuppl,
      successColor: palette.success,
      successColorHover: palette.successHover,
      successColorPressed: palette.successPressed,
      successColorSuppl: palette.successSuppl,
      warningColor: palette.warning,
      warningColorHover: palette.warningHover,
      warningColorPressed: palette.warningPressed,
      warningColorSuppl: palette.warningSuppl,
      errorColor: palette.error,
      errorColorHover: palette.errorHover,
      errorColorPressed: palette.errorPressed,
      errorColorSuppl: palette.errorSuppl
    }
  }
})

const naiveTheme = computed(() => (effectiveTheme.value === 'dark' ? darkTheme : null))
</script>

<template>
  <n-config-provider
    :locale="zhCN"
    :date-locale="dateZhCN"
    :theme="naiveTheme"
    :theme-overrides="themeOverrides"
  >
    <n-message-provider>
      <n-dialog-provider>
        <n-notification-provider>
          <router-view></router-view>
        </n-notification-provider>
      </n-dialog-provider>
    </n-message-provider>
  </n-config-provider>
</template>

<style scoped>
/* App.vue is now just a wrapper for router-view */
</style>
