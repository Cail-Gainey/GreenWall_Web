<script setup lang="ts">
/**
 * @file 根组件：提供全局画笔状态供子组件注入。
 */
import { computed, ref, provide, onMounted, onBeforeUnmount, watch } from 'vue'
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
import { getPalette, type ResolvedTheme } from './theme/palette'
import { useAppConfigStore } from './stores/appConfig'

/**
 * @description 当前激活贡献等级（0-4）。
 */
const activeLevel = ref(2)
/**
 * @description 当前工具：画笔或橡皮擦。
 */
const activeTool = ref('brush') // 'brush' or 'eraser' or 'pattern'
const activePattern = ref<boolean[][] | null>(null)
const activePatternLevel = ref<number>(4)
const activePatternRandom = ref(false)
const clearSignal = ref(0)
const requestClear = () => {
  clearSignal.value++;
}
const fillAllSignal = ref(0)
const requestFillAll = () => {
  fillAllSignal.value++;
}

provide('activeLevel', activeLevel)
provide('activeTool', activeTool)
provide('activePattern', activePattern)
provide('activePatternLevel', activePatternLevel)
provide('activePatternRandom', activePatternRandom)
provide('clearSignal', clearSignal)
provide('requestClear', requestClear)
provide('fillAllSignal', fillAllSignal)
provide('requestFillAll', requestFillAll)

const { currentTheme, resolvedTheme } = useTheme()
const previousHtmlOverflow = ref<string>('')
const previousBodyOverflow = ref<string>('')
const appConfigStore = useAppConfigStore()

const effectiveTheme = computed(() => {
  return currentTheme.value === 'auto' ? resolvedTheme.value : currentTheme.value
})

const themeOverrides = computed(() => {
  const palette = getPalette(effectiveTheme.value as ResolvedTheme) ?? getPalette('light')
  return {
    common: {
      fontFamily: 'Lato, Segoe UI, Tahoma, sans-serif',
      bodyColor: palette.bg,
      cardColor: palette.surface,
      popoverColor: palette.surface,
      modalColor: palette.surface,
      borderColor: palette.border,
      dividerColor: palette.border,
      textColorBase: palette.textMain,
      textColor1: palette.textMain,
      textColor2: palette.textMuted,
      textColor3: palette.textMuted,
      placeholderColor: palette.textMuted,
      iconColor: palette.textMuted,
      iconColorDisabled: palette.textMuted,
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
    },
  }
})

const naiveTheme = computed(() => (effectiveTheme.value === 'dark' ? darkTheme : null))

onMounted(() => {
  previousHtmlOverflow.value = document.documentElement.style.overflow
  previousBodyOverflow.value = document.body.style.overflow
  document.documentElement.style.overflow = 'hidden'
  document.body.style.overflow = 'hidden'
  void appConfigStore.load()
})

onBeforeUnmount(() => {
  document.documentElement.style.overflow = previousHtmlOverflow.value
  document.body.style.overflow = previousBodyOverflow.value
})

watch(
  () => appConfigStore.getValue('app:name'),
  (name) => {
    if (name) document.title = name
  },
  { immediate: true }
)
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
