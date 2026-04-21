import { getMe } from './auth'
import { getPublicConfigs } from './config'
import { precachePatternCommunityData } from './patternCommunity'
import { getUserMenus, getUserPermissions } from './permission'
import { getPublicSystemConfig } from './systemConfig'

export async function precacheGlobalData() {
  await Promise.allSettled([
    getPublicSystemConfig(),
    getPublicConfigs(),
    precachePatternCommunityData(),
  ])

  const token = localStorage.getItem('token')
  if (!token) return

  await Promise.allSettled([
    getMe(),
    getUserMenus(),
    getUserPermissions(),
  ])
}
