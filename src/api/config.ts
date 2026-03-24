/**
 * @file 参数配置接口封装。
 */
import request from './request'
import { cachedGet, invalidateHttpCache } from './httpCache'
import type { ApiResult, ConfigDto, ConfigQueryDto, ConfigCreateDto, ConfigUpdateDto, PageResult } from './types'

const configCacheTags = ['config:list', 'config:item', 'config:public']

export function getConfigPage(params: ConfigQueryDto) {
  return cachedGet<ApiResult<PageResult<ConfigDto>>>('/config', { params }, {
    ttlMs: 20_000,
    tags: ['config:list'],
  })
}

export function getConfig(id: string) {
  return cachedGet<ApiResult<ConfigDto>>(`/config/${id}`, undefined, {
    ttlMs: 30_000,
    tags: ['config:item'],
  })
}

export function createConfig(data: ConfigCreateDto) {
  return request.post<ApiResult<string>>('/config', data).then((res) => {
    invalidateHttpCache(configCacheTags)
    return res
  })
}

export function updateConfig(data: ConfigUpdateDto) {
  return request.put<ApiResult<boolean>>('/config', data).then((res) => {
    invalidateHttpCache(configCacheTags)
    return res
  })
}

export function deleteConfig(id: string) {
  return request.delete<ApiResult<boolean>>(`/config/${id}`).then((res) => {
    invalidateHttpCache(configCacheTags)
    return res
  })
}

export function getPublicConfigs() {
  return cachedGet<ApiResult<Record<string, string | null>>>('/config/public', undefined, {
    ttlMs: 60_000,
    tags: ['config:public'],
  })
}
