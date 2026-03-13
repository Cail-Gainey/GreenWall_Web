import { defineStore } from 'pinia'
import { getMenuTree } from '../api/menu'
import type { MenuTreeDto } from '../api/types'

const TTL_MS = 30 * 60 * 1000

export const useMenuTreeStore = defineStore('menuTree', {
  state: () => ({
    tree: [] as MenuTreeDto[],
    fetchedAt: 0,
  }),
  actions: {
    isValid() {
      return this.fetchedAt > 0 && Date.now() - this.fetchedAt < TTL_MS
    },
    async fetch(force = false) {
      if (!force && this.isValid()) {
        return this.tree
      }
      const res = await getMenuTree()
      this.tree = res.data.data || []
      this.fetchedAt = Date.now()
      return this.tree
    },
    invalidate() {
      this.fetchedAt = 0
    },
    reset() {
      this.tree = []
      this.fetchedAt = 0
    },
  },
  persist: {
    key: 'menu_tree_store',
    paths: ['tree', 'fetchedAt'],
  },
})
