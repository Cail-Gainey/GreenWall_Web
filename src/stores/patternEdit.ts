/**
 * @file 图案编辑上下文 Store。
 */
import { defineStore } from 'pinia'
import type { PatternCellDto } from '../api/types'

export interface PatternEditPayload {
  id: string
  title: string
  description?: string
  year: number
  gridCols: number
  gridRows: number
  cells: PatternCellDto[]
}

export const usePatternEditStore = defineStore('patternEdit', {
  state: () => ({
    pending: null as PatternEditPayload | null,
  }),
  actions: {
    /**
     * @description 设置待编辑图案。
     */
    set(payload: PatternEditPayload) {
      this.pending = payload
    },
    /**
     * @description 清空编辑上下文。
     */
    clear() {
      this.pending = null
    },
  },
})
