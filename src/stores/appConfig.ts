import { defineStore } from 'pinia'
import { getPublicConfigs } from '../api/config'

interface AppConfigState {
  entries: Record<string, string | null>
  loaded: boolean
  loading: boolean
}

export const useAppConfigStore = defineStore('app_config', {
  state: (): AppConfigState => ({
    entries: {},
    loaded: false,
    loading: false,
  }),
  actions: {
    async load(force = false) {
      if (this.loaded && !force) return this.entries
      if (this.loading) return this.entries
      this.loading = true
      try {
        const res = await getPublicConfigs()
        this.entries = res.data.data || {}
        this.loaded = true
        return this.entries
      } finally {
        this.loading = false
      }
    },
    getValue(key: string, fallback: string | null = null) {
      const value = this.entries[key]
      if (value === undefined || value === null) return fallback
      return value
    },
  },
})
