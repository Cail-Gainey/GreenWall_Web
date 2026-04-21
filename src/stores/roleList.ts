/**
 * @file 角色列表缓存 Store。
 */
import { defineStore } from 'pinia'
import { getAllRoles } from '../api/role'
import type { RoleDto } from '../api/types'

const TTL_MS = 30 * 60 * 1000

/**
 * @description 角色列表状态管理。
 */
export const useRoleListStore = defineStore('roleList', {
  state: () => ({
    roles: [] as RoleDto[],
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
     * @description 获取角色列表（可强制刷新）。
     * @param force 是否强制刷新
     */
    async fetch(force = false) {
      if (!force && this.isValid()) {
        return this.roles
      }
      const res = await getAllRoles()
      this.roles = res.data.data || []
      this.fetchedAt = Date.now()
      return this.roles
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
      this.roles = []
      this.fetchedAt = 0
    },
  },
  persist: {
    key: 'role_list_store',
    paths: ['roles', 'fetchedAt'],
  },
})
