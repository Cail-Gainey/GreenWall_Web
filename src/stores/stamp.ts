/**
 * @file 图案模板（印章）Pinia store：社区列表 + 当前用户收藏快照。
 */
import { defineStore } from 'pinia'
import {
  createStamp,
  deleteStamp,
  getMyStampImports,
  getStampPage,
  importStamp,
  publishStamp,
  publishStampFromImport,
  removeStampImport,
  updateStamp,
} from '../api/stamp'
import type {
  StampCreateDto,
  StampDto,
  StampImportDto,
  StampQueryDto,
  StampUpdateDto,
} from '../api/types'

interface StampState {
  community: StampDto[]
  communityTotal: number
  communityLoading: boolean
  communityLoaded: boolean
  imports: StampImportDto[]
  importsLoading: boolean
  importsLoaded: boolean
}

export const useStampStore = defineStore('stamp', {
  state: (): StampState => ({
    community: [],
    communityTotal: 0,
    communityLoading: false,
    communityLoaded: false,
    imports: [],
    importsLoading: false,
    importsLoaded: false,
  }),
  actions: {
    async loadCommunity(query: StampQueryDto = {}) {
      if (this.communityLoading) return this.community
      this.communityLoading = true
      try {
        const res = await getStampPage({ pageIndex: 1, pageSize: 50, sortBy: 'time', ...query })
        this.community = res.data.data.items || []
        this.communityTotal = Number(res.data.data.total || 0)
        this.communityLoaded = true
        return this.community
      } finally {
        this.communityLoading = false
      }
    },
    async loadImports(force = false) {
      if (this.importsLoading) return this.imports
      if (this.importsLoaded && !force) return this.imports
      this.importsLoading = true
      try {
        const res = await getMyStampImports()
        this.imports = res.data.data || []
        this.importsLoaded = true
        return this.imports
      } finally {
        this.importsLoading = false
      }
    },
    async publish(input: StampCreateDto) {
      const res = await createStamp(input)
      // 后端创建即自动建立本人快照（未发布也可在收藏看到）
      await this.loadImports(true)
      return res
    },
    async publishToCommunity(stampId: string) {
      const res = await publishStamp(stampId)
      // 触发收藏 Tab 刷新以更新 isPublished 状态；社区列表下次进入时自动刷新
      await this.loadImports(true)
      return res
    },
    async update(input: StampUpdateDto) {
      const res = await updateStamp(input)
      await this.loadCommunity()
      return res
    },
    async remove(id: string) {
      const res = await deleteStamp(id)
      // 同时刷新社区列表与本人收藏，避免快照里 isPublished/sourceAvailable 残留旧值
      await Promise.all([this.loadCommunity(), this.loadImports(true)])
      return res
    },
    async publishImportSnapshot(importId: string) {
      const res = await publishStampFromImport(importId)
      // 重新拉取：sourceStampId 可能被指向新源、isPublished 翻为 true
      await this.loadImports(true)
      return res
    },
    async importToCollection(stampId: string) {
      const res = await importStamp(stampId)
      // 标记 community 中对应项为已导入，避免立即重新拉取
      const target = this.community.find((s) => String(s.id) === String(stampId))
      if (target) target.isImported = true
      await this.loadImports(true)
      return res
    },
    async removeImport(importId: string) {
      const res = await removeStampImport(importId)
      this.imports = this.imports.filter((i) => String(i.id) !== String(importId))
      return res
    },
    reset() {
      this.community = []
      this.communityTotal = 0
      this.communityLoaded = false
      this.imports = []
      this.importsLoaded = false
    },
  },
})
