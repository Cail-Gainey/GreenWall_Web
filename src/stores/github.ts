import { defineStore } from 'pinia'

export interface GitHubProfile {
  id: number
  login: string
  avatarUrl?: string
  htmlUrl?: string
  accessToken: string
}

const storageKey = 'github_profile'

function loadProfile(): GitHubProfile | null {
  const raw = localStorage.getItem(storageKey)
  if (!raw) return null
  try {
    return JSON.parse(raw) as GitHubProfile
  } catch {
    return null
  }
}

export const useGitHubStore = defineStore('github', {
  state: () => ({
    profile: loadProfile() as GitHubProfile | null,
  }),
  actions: {
    setProfile(profile: GitHubProfile) {
      this.profile = profile
      localStorage.setItem(storageKey, JSON.stringify(profile))
    },
    clear() {
      this.profile = null
      localStorage.removeItem(storageKey)
    },
  },
})
