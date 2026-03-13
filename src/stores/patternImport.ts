/**
 * @file 图案一键导入临时缓存 Store。
 */
import { defineStore } from 'pinia'
import type { PatternCellDto } from '../api/types'

export interface PatternImportPayload {
  title?: string
  year: number
  gridCols: number
  gridRows: number
  cells: PatternCellDto[]
}

export const usePatternImportStore = defineStore('patternImport', {
  state: () => ({
    pending: null as PatternImportPayload | null,
  }),
  actions: {
    /**
     * @description 设置待导入图案。
     */
    set(pattern: PatternImportPayload) {
      this.pending = pattern
    },
    /**
     * @description 清空待导入图案。
     */
    clear() {
      this.pending = null
    },
  },
})
