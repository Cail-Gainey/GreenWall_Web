import { defineStore } from 'pinia'

export interface AdminTabItem {
  path: string
  title: string
  closable: boolean
}

export const useAdminTabsStore = defineStore('admin-tabs', {
  state: () => ({
    tabs: [] as AdminTabItem[],
    activePath: '' as string,
  }),
  actions: {
    open(path: string, title: string) {
      if (!path.startsWith('/admin')) return
      const existing = this.tabs.find((t) => t.path === path)
      if (existing) {
        if (title && existing.title !== title) {
          existing.title = title
        }
      } else {
        this.tabs.push({
          path,
          title: title || path,
          closable: path !== '/admin',
        })
      }
      this.activePath = path
    },
    close(path: string) {
      const idx = this.tabs.findIndex((t) => t.path === path)
      if (idx < 0) return
      if (!this.tabs[idx]!.closable) return
      this.tabs.splice(idx, 1)
      if (this.activePath === path) {
        const next = this.tabs[idx - 1] || this.tabs[idx] || this.tabs[0]
        this.activePath = next?.path || '/admin'
      }
    },
    closeOthers(path: string) {
      const keep = this.tabs.find((t) => t.path === path) || this.tabs.find((t) => t.path === '/admin')
      if (!keep) return
      this.tabs = this.tabs.filter((t) => !t.closable || t.path === keep.path)
      this.activePath = keep.path
    },
    closeLeft(path: string) {
      const idx = this.tabs.findIndex((t) => t.path === path)
      if (idx <= 0) return
      this.tabs = this.tabs.filter((t, i) => i >= idx || !t.closable)
      this.activePath = path
    },
    closeRight(path: string) {
      const idx = this.tabs.findIndex((t) => t.path === path)
      if (idx < 0) return
      this.tabs = this.tabs.filter((t, i) => i <= idx || !t.closable)
      this.activePath = path
    },
    closeAll() {
      this.tabs = this.tabs.filter((t) => !t.closable)
      const home = this.tabs.find((t) => t.path === '/admin') || this.tabs[0]
      this.activePath = home?.path || '/admin'
    },
    setActive(path: string) {
      this.activePath = path
    },
  },
  persist: {
    key: 'admin_tabs',
    paths: ['tabs', 'activePath'],
  },
})
