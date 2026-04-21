/**
 * @file 社区页面与工作区交互状态 Store。
 */
import { defineStore } from 'pinia'

/**
 * @description 社区页面交互状态管理。
 */
export const useCommunityUiStore = defineStore('communityUi', {
  state: () => ({
    openUpload: false,
  }),
  actions: {
    /**
     * @description 触发打开上传弹窗。
     */
    triggerUpload() {
      this.openUpload = true
    },
    /**
     * @description 重置打开状态。
     */
    reset() {
      this.openUpload = false
    },
  },
})
