import { defineStore } from 'pinia'
import { getAllRoles } from '../api/role'
import type { RoleDto } from '../api/types'

const TTL_MS = 30 * 60 * 1000

export const useRoleListStore = defineStore('roleList', {
  state: () => ({
    roles: [] as RoleDto[],
    fetchedAt: 0,
  }),
  actions: {
    isValid() {
      return this.fetchedAt > 0 && Date.now() - this.fetchedAt < TTL_MS
    },
    async fetch(force = false) {
      if (!force && this.isValid()) {
        return this.roles
      }
      const res = await getAllRoles()
      this.roles = res.data.data || []
      this.fetchedAt = Date.now()
      return this.roles
    },
    invalidate() {
      this.fetchedAt = 0
    },
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
