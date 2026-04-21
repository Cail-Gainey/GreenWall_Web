/**
 * @file 标签页导航状态管理 Store。
 */
import { ref } from 'vue'
import { defineStore } from 'pinia'

export interface TabItem {
  path: string
  title: string
  affix: boolean
}

export const useTabNavStore = defineStore('tabNav', () => {
  const tabs = ref<TabItem[]>([])
  const activeTab = ref('')

  function addTab(path: string, title: string, affix: boolean) {
    if (!tabs.value.find((t) => t.path === path)) {
      tabs.value.push({ path, title, affix })
    }
    activeTab.value = path
  }

  function closeTab(path: string): string | null {
    const idx = tabs.value.findIndex((t) => t.path === path)
    if (idx < 0 || tabs.value[idx].affix) return null
    tabs.value.splice(idx, 1)
    if (activeTab.value === path) {
      const next = tabs.value[Math.min(idx, tabs.value.length - 1)]
      activeTab.value = next?.path || ''
      return activeTab.value
    }
    return null
  }

  function closeOthers(path: string) {
    tabs.value = tabs.value.filter((t) => t.path === path || t.affix)
    activeTab.value = path
  }

  function closeAll(): string {
    tabs.value = tabs.value.filter((t) => t.affix)
    activeTab.value = tabs.value[0]?.path || ''
    return activeTab.value
  }

  function closeRight(path: string) {
    const idx = tabs.value.findIndex((t) => t.path === path)
    if (idx < 0) return
    tabs.value = tabs.value.filter((t, i) => i <= idx || t.affix)
    if (!tabs.value.find((t) => t.path === activeTab.value)) {
      activeTab.value = path
    }
  }

  function closeLeft(path: string) {
    const idx = tabs.value.findIndex((t) => t.path === path)
    if (idx < 0) return
    tabs.value = tabs.value.filter((t, i) => i >= idx || t.affix)
    if (!tabs.value.find((t) => t.path === activeTab.value)) {
      activeTab.value = path
    }
  }

  function reset() {
    tabs.value = []
    activeTab.value = ''
  }

  return { tabs, activeTab, addTab, closeTab, closeOthers, closeAll, closeRight, closeLeft, reset }
})
