/**
 * @file 参数配置接口封装。
 */
import request from './request'
import type { ApiResult, ConfigDto, ConfigQueryDto, ConfigCreateDto, ConfigUpdateDto, PageResult } from './types'

export function getConfigPage(params: ConfigQueryDto) {
  return request.get<ApiResult<PageResult<ConfigDto>>>('/config', { params })
}

export function getConfig(id: string) {
  return request.get<ApiResult<ConfigDto>>(`/config/${id}`)
}

export function createConfig(data: ConfigCreateDto) {
  return request.post<ApiResult<string>>('/config', data)
}

export function updateConfig(data: ConfigUpdateDto) {
  return request.put<ApiResult<boolean>>('/config', data)
}

export function deleteConfig(id: string) {
  return request.delete<ApiResult<boolean>>(`/config/${id}`)
}

export function getPublicConfigs() {
  return request.get<ApiResult<Record<string, string | null>>>('/config/public')
}
