import { defineStore } from 'pinia'
import { getDictOptions } from '../api/dict'
import type { DictDataDto } from '../api/types'

interface DictState {
  options: Record<string, DictDataDto[]>
  loading: Record<string, boolean>
}

export const useDictStore = defineStore('dict', {
  state: (): DictState => ({
    options: {},
    loading: {},
  }),
  actions: {
    async ensure(dictType: string, force = false) {
      if (!force && this.options[dictType]?.length) return this.options[dictType]
      if (this.loading[dictType]) return this.options[dictType] || []
      this.loading[dictType] = true
      try {
        const res = await getDictOptions(dictType)
        this.options[dictType] = res.data.data || []
        return this.options[dictType]
      } finally {
        this.loading[dictType] = false
      }
    },
    getOptions(dictType: string) {
      return this.options[dictType] || []
    },
    clear(dictType?: string) {
      if (dictType) {
        delete this.options[dictType]
        delete this.loading[dictType]
        return
      }
      this.options = {}
      this.loading = {}
    },
  },
  persist: {
    key: 'dict_store',
    paths: ['options'],
  },
})
