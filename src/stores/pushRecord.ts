/**
 * @file GitHub 推送记录缓存 Store。
 */
import { defineStore } from 'pinia'
import { getGithubRecentPushes } from '../api/github'
import type { GitHubPushStatusDto } from '../api/types'

const TTL_MS = 30 * 60 * 1000

/**
 * @description 最近推送记录缓存结构。
 */
interface RecentCache {
  list: GitHubPushStatusDto[]
  fetchedAt: number
}

/**
 * @description GitHub 推送记录状态管理。
 */
export const usePushRecordStore = defineStore('pushRecord', {
  state: () => ({
    recentByLogin: {} as Record<string, RecentCache>,
  }),
  actions: {
    /**
     * @description 判断缓存是否有效。
     */
    isValid(login: string) {
      const cached = this.recentByLogin[login]
      return cached && Date.now() - cached.fetchedAt < TTL_MS
    },
    /**
     * @description 获取近期推送记录（可强制刷新）。
     * @param login GitHub 登录名
     * @param force 是否强制刷新
     */
    async fetchRecent(login: string, force = false) {
      if (!force && this.isValid(login)) {
        return this.recentByLogin[login].list
      }
      const res = await getGithubRecentPushes(login)
      this.recentByLogin[login] = {
        list: res.data.data || [],
        fetchedAt: Date.now(),
      }
      return this.recentByLogin[login].list
    },
    /**
     * @description 失效缓存（可指定登录名）。
     * @param login GitHub 登录名
     */
    invalidate(login?: string) {
      if (login) {
        delete this.recentByLogin[login]
        return
      }
      this.recentByLogin = {}
    },
    /**
     * @description 清空缓存数据。
     */
    reset() {
      this.recentByLogin = {}
    },
  },
  persist: {
    key: 'push_record_store',
    paths: ['recentByLogin'],
  },
})
