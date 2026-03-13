import { defineStore } from 'pinia'
import { getGithubRecentPushes } from '../api/github'
import type { GitHubPushStatusDto } from '../api/types'

const TTL_MS = 30 * 60 * 1000

interface RecentCache {
  list: GitHubPushStatusDto[]
  fetchedAt: number
}

export const usePushRecordStore = defineStore('pushRecord', {
  state: () => ({
    recentByLogin: {} as Record<string, RecentCache>,
  }),
  actions: {
    isValid(login: string) {
      const cached = this.recentByLogin[login]
      return cached && Date.now() - cached.fetchedAt < TTL_MS
    },
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
    invalidate(login?: string) {
      if (login) {
        delete this.recentByLogin[login]
        return
      }
      this.recentByLogin = {}
    },
    reset() {
      this.recentByLogin = {}
    },
  },
  persist: {
    key: 'push_record_store',
    paths: ['recentByLogin'],
  },
})
