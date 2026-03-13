/**
 * @file 系统设置接口封装。
 */
import request from './request'
import type { ApiResult, SystemSettingsDto, SystemSettingsUpdateDto, SystemPublicSettingsDto } from './types'

/**
 * @description 获取系统设置（管理端）。
 */
export function getSystemConfig() {
  return request.get<ApiResult<SystemSettingsDto>>('/SystemConfig')
}

/**
 * @description 更新系统设置。
 */
export function updateSystemConfig(data: SystemSettingsUpdateDto) {
  return request.put<ApiResult<boolean>>('/SystemConfig', data)
}

/**
 * @description 获取公共系统设置（无需登录）。
 */
export function getPublicSystemConfig() {
  return request.get<ApiResult<SystemPublicSettingsDto>>('/SystemConfig/public')
}
