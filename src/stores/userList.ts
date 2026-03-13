import { defineStore } from 'pinia'
import { getUserPage } from '../api/user'
import type { PageResult, UserListItemDto, UserQueryDto } from '../api/types'

const TTL_MS = 30 * 60 * 1000

export const useUserListStore = defineStore('userList', {
  state: () => ({
    lastKey: '',
    lastResult: null as PageResult<UserListItemDto> | null,
    fetchedAt: 0,
  }),
  actions: {
    buildKey(query: UserQueryDto) {
      return JSON.stringify({
        pageIndex: query.pageIndex,
        pageSize: query.pageSize,
        keyword: query.keyword || '',
        status: query.status ?? '',
      })
    },
    isValid(key: string) {
      return this.lastKey === key && this.fetchedAt > 0 && Date.now() - this.fetchedAt < TTL_MS
    },
    async fetch(query: UserQueryDto, force = false) {
      const key = this.buildKey(query)
      if (!force && this.isValid(key) && this.lastResult) {
        return this.lastResult
      }
      const res = await getUserPage(query)
      this.lastKey = key
      this.lastResult = res.data.data
      this.fetchedAt = Date.now()
      return this.lastResult
    },
    invalidate() {
      this.lastKey = ''
      this.lastResult = null
      this.fetchedAt = 0
    },
    reset() {
      this.lastKey = ''
      this.lastResult = null
      this.fetchedAt = 0
    },
  },
  persist: {
    key: 'user_list_store',
    paths: ['lastKey', 'lastResult', 'fetchedAt'],
  },
})
