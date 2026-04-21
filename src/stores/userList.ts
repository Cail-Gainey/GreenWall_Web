/**
 * @file 用户列表缓存 Store。
 */
import { defineStore } from 'pinia'
import { getUserPage } from '../api/user'
import type { PageResult, UserListItemDto, UserQueryDto } from '../api/types'

const TTL_MS = 30 * 60 * 1000

/**
 * @description 用户列表状态管理。
 */
export const useUserListStore = defineStore('userList', {
  state: () => ({
    lastKey: '',
    lastResult: null as PageResult<UserListItemDto> | null,
    fetchedAt: 0,
  }),
  actions: {
    /**
     * @description 构建查询缓存 Key。
     */
    buildKey(query: UserQueryDto) {
      return JSON.stringify({
        pageIndex: query.pageIndex,
        pageSize: query.pageSize,
        account: query.account || '',
        phone: query.phone || '',
        email: query.email || '',
        keyword: query.keyword || '',
        status: query.status ?? '',
      })
    },
    /**
     * @description 判断缓存是否有效。
     */
    isValid(key: string) {
      return this.lastKey === key && this.fetchedAt > 0 && Date.now() - this.fetchedAt < TTL_MS
    },
    /**
     * @description 获取用户列表（可强制刷新）。
     * @param query 查询条件
     * @param force 是否强制刷新
     */
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
    /**
     * @description 失效缓存（不清空数据）。
     */
    invalidate() {
      this.lastKey = ''
      this.lastResult = null
      this.fetchedAt = 0
    },
    /**
     * @description 清空缓存数据。
     */
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
