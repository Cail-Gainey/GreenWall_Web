import { defineStore } from 'pinia'

export interface AdminTabItem {
  path: string
  title: string
  closable: boolean
  pinned?: boolean
}

/** 仪表盘固定路径 */
const DASHBOARD = '/admin'

const isDashboard = (tab: AdminTabItem) => tab.path === DASHBOARD
const isClosable = (tab?: AdminTabItem | null) => Boolean(tab && tab.closable && !tab.pinned)

export const useAdminTabsStore = defineStore('admin-tabs', {
  state: () => ({
    tabs: [] as AdminTabItem[],
    activePath: '' as string,
    refreshSignal: 0,
  }),
  actions: {
    /** 确保仪表盘始终存在、固定、排第一 */
    ensureDashboard() {
      const idx = this.tabs.findIndex((t) => t.path === DASHBOARD)
      if (idx < 0) {
        this.tabs.unshift({
          path: DASHBOARD,
          title: '仪表盘',
          closable: false,
          pinned: true,
        })
      } else {
        const tab = this.tabs[idx]
        tab.pinned = true
        tab.closable = false
        if (idx !== 0) {
          this.tabs.splice(idx, 1)
          this.tabs.unshift(tab)
        }
      }
    },

    open(path: string, title: string) {
      if (!path.startsWith('/admin')) return
      this.ensureDashboard()
      const existing = this.tabs.find((t) => t.path === path)
      if (existing) {
        if (title && existing.title !== title) {
          existing.title = title
        }
      } else {
        this.tabs.push({
          path,
          title: title || path,
          closable: path !== DASHBOARD,
          pinned: false,
        })
      }
      this.activePath = path
    },

    close(path: string) {
      if (path === DASHBOARD) return
      const idx = this.tabs.findIndex((t) => t.path === path)
      if (idx < 0) return
      if (!isClosable(this.tabs[idx])) return
      this.tabs.splice(idx, 1)
      if (this.activePath === path) {
        const next = this.tabs[idx - 1] || this.tabs[idx] || this.tabs[0]
        this.activePath = next?.path || DASHBOARD
      }
    },

    closeOthers(path: string) {
      const keep = this.tabs.find((t) => t.path === path) || this.tabs.find((t) => t.path === DASHBOARD)
      if (!keep) return
      this.tabs = this.tabs.filter((t) => !isClosable(t) || t.path === keep.path)
      this.ensureDashboard()
      this.activePath = keep.path
    },

    closeLeft(path: string) {
      const idx = this.tabs.findIndex((t) => t.path === path)
      if (idx <= 0) return
      this.tabs = this.tabs.filter((t, i) => i >= idx || !isClosable(t))
      this.ensureDashboard()
      this.activePath = path
    },

    closeRight(path: string) {
      const idx = this.tabs.findIndex((t) => t.path === path)
      if (idx < 0) return
      this.tabs = this.tabs.filter((t, i) => i <= idx || !isClosable(t))
      this.ensureDashboard()
      this.activePath = path
    },

    closeAll() {
      this.tabs = this.tabs.filter((t) => !isClosable(t))
      this.ensureDashboard()
      this.activePath = DASHBOARD
    },

    togglePin(path: string) {
      if (path === DASHBOARD) return
      const tab = this.tabs.find((t) => t.path === path)
      if (!tab) return
      tab.pinned = !tab.pinned
      tab.closable = !tab.pinned
    },

    refresh() {
      this.refreshSignal += 1
    },

    setActive(path: string) {
      this.activePath = path
    },
  },
  persist: {
    key: 'admin_tabs',
    paths: ['tabs', 'activePath'],
    afterRestore(ctx) {
      // 恢复后确保仪表盘始终存在且排第一
      ctx.store.ensureDashboard()
    },
  },
})
