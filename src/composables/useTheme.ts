/**
 * @file 主题状态管理组合式函数，统一处理主题持久化与系统联动。
 */
import { ref, onMounted, onUnmounted } from 'vue'

export type Theme = 'light' | 'dark' | 'purple' | 'pink' | 'auto'

const currentTheme = ref<Theme>('auto')
const resolvedTheme = ref<'light' | 'dark' | 'purple' | 'pink'>('light')
const THEME_STORAGE_KEY = 'greenwall-theme'

/**
 * @description 获取主题状态与设置方法。
 * @returns 主题状态与设置函数。
 */
export function useTheme() {
  const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')

  /**
   * @description 解析 auto 主题：结合系统与夜间规则。
   */
  const resolveAutoTheme = () => {
    // Basic system check
    const isSystemDark = mediaQuery.matches
    
    // Additional time-based check for "night" (18:00 to 06:00) 
    // to strictly enforce the night rule as requested.
    const hours = new Date().getHours()
    const isNight = hours >= 18 || hours < 6
    
    resolvedTheme.value = (isSystemDark || isNight) ? 'dark' : 'light'
    document.documentElement.setAttribute('data-theme', resolvedTheme.value)
  }

  /**
   * @description 应用主题到 document 并同步 resolvedTheme。
   * @param {Theme} theme 目标主题。
   */
  const applyTheme = (theme: Theme) => {
    if (theme === 'auto') {
      resolveAutoTheme()
    } else {
      resolvedTheme.value = theme
      document.documentElement.setAttribute('data-theme', theme)
    }
  }

  /**
   * @description 响应系统主题变化，仅在 auto 模式下生效。
   */
  const handleSystemThemeChange = () => {
    if (currentTheme.value === 'auto') {
      resolveAutoTheme()
    }
  }

  /**
   * @description 设置主题并持久化到本地存储。
   * @param {Theme} theme 目标主题。
   */
  const setTheme = (theme: Theme) => {
    currentTheme.value = theme
    localStorage.setItem(THEME_STORAGE_KEY, theme)
    applyTheme(theme)
  }

  /**
   * @description 组件挂载时恢复主题并监听系统变化。
   */
  onMounted(() => {
    const savedTheme = localStorage.getItem(THEME_STORAGE_KEY) as Theme
    if (savedTheme) {
      currentTheme.value = savedTheme
    } else {
      currentTheme.value = 'auto'
    }
    
    applyTheme(currentTheme.value)
    
    // Listen to system changes
    mediaQuery.addEventListener('change', handleSystemThemeChange)
  })

  /**
   * @description 组件卸载时移除系统主题监听。
   */
  onUnmounted(() => {
    mediaQuery.removeEventListener('change', handleSystemThemeChange)
  })

  return {
    currentTheme,
    setTheme
  }
}
