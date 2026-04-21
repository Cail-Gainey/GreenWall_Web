/**
 * @file 菜单树缓存 Store。
 */
import { defineStore } from 'pinia'
import { getMenuTree } from '../api/menu'
import type { MenuTreeDto } from '../api/types'

const TTL_MS = 30 * 60 * 1000

/**
 * @description 菜单树状态管理。
 */
export const useMenuTreeStore = defineStore('menuTree', {
  state: () => ({
    tree: [] as MenuTreeDto[],
    fetchedAt: 0,
  }),
  actions: {
    /**
     * @description 判断缓存是否有效。
     */
    isValid() {
      return this.fetchedAt > 0 && Date.now() - this.fetchedAt < TTL_MS
    },
    /**
     * @description 获取菜单树（可强制刷新）。
     * @param force 是否强制刷新
     */
    async fetch(force = false) {
      if (!force && this.isValid()) {
        return this.tree
      }
      const res = await getMenuTree()
      this.tree = res.data.data || []
      this.fetchedAt = Date.now()
      return this.tree
    },
    /**
     * @description 失效缓存（不清空数据）。
     */
    invalidate() {
      this.fetchedAt = 0
    },
    /**
     * @description 清空缓存数据。
     */
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
