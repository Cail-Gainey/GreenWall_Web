/**
 * @file GitHub OAuth 登录信息的本地缓存 Store。
 */
import { defineStore } from 'pinia'

/**
 * @description 已授权的 GitHub 用户信息。
 */
export interface GitHubProfile {
  /** GitHub 用户 ID */
  id: number
  /** GitHub 登录名 */
  login: string
  /** 头像地址 */
  avatarUrl?: string
  /** 主页地址 */
  htmlUrl?: string
  /** OAuth Access Token */
  accessToken: string
}

const storageKey = 'github_profile'

/**
 * @description 从 localStorage 加载 GitHub Profile。
 */
function loadProfile(): GitHubProfile | null {
  const raw = localStorage.getItem(storageKey)
  if (!raw) return null
  try {
    return JSON.parse(raw) as GitHubProfile
  } catch {
    return null
  }
}

/**
 * @description GitHub Profile 状态管理。
 */
export const useGitHubStore = defineStore('github', {
  state: () => ({
    profile: loadProfile() as GitHubProfile | null,
  }),
  actions: {
    /**
     * @description 写入 profile 并持久化到 localStorage。
     */
    setProfile(profile: GitHubProfile) {
      this.profile = profile
      localStorage.setItem(storageKey, JSON.stringify(profile))
    },
    /**
     * @description 清理 profile 缓存。
     */
    clear() {
      this.profile = null
      localStorage.removeItem(storageKey)
    },
  },
})
