/**
 * @file 系统设置接口封装。
 */
import request from './request'
import { cachedGet, invalidateHttpCache } from './httpCache'
import type { ApiResult, SystemSettingsDto, SystemSettingsUpdateDto, SystemPublicSettingsDto } from './types'

const systemConfigTags = ['system:config', 'system:public-config']

/**
 * @description 获取系统设置（管理端）。
 */
export function getSystemConfig() {
  return cachedGet<ApiResult<SystemSettingsDto>>('/SystemConfig', undefined, {
    ttlMs: 30_000,
    tags: ['system:config'],
  })
}

/**
 * @description 更新系统设置。
 */
export function updateSystemConfig(data: SystemSettingsUpdateDto) {
  return request.put<ApiResult<boolean>>('/SystemConfig', data).then((res) => {
    invalidateHttpCache(systemConfigTags)
    return res
  })
}

/**
 * @description 执行数据迁移。
 */
export function runSystemMigration() {
  return request.post<ApiResult<boolean>>('/SystemConfig/migrate').then((res) => {
    invalidateHttpCache(systemConfigTags)
    return res
  })
}

/**
 * @description 获取公共系统设置（无需登录）。
 */
export function getPublicSystemConfig() {
  return cachedGet<ApiResult<SystemPublicSettingsDto>>('/SystemConfig/public', undefined, {
    ttlMs: 60_000,
    tags: ['system:public-config'],
  })
}
