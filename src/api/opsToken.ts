/**
 * @file 运维令牌接口封装。
 */
import request from './request'
import { cachedGet, invalidateHttpCache } from './httpCache'
import type { ApiResult, PageResult, OpsTokenDto, OpsTokenQueryDto, OpsTokenCreateDto, OpsTokenUpdateDto } from './types'

const opsTokenTags = ['ops-token:list', 'ops-token:item']

/**
 * @description 获取运维令牌分页。
 */
export function getOpsTokenPage(params: OpsTokenQueryDto) {
  return cachedGet<ApiResult<PageResult<OpsTokenDto>>>('/OpsToken', { params }, {
    ttlMs: 20_000,
    tags: ['ops-token:list'],
  })
}

/**
 * @description 获取运维令牌详情。
 */
export function getOpsToken(id: string) {
  return cachedGet<ApiResult<OpsTokenDto>>(`/OpsToken/${id}`, undefined, {
    ttlMs: 30_000,
    tags: ['ops-token:item'],
  })
}

/**
 * @description 新建运维令牌。
 */
export function createOpsToken(data: OpsTokenCreateDto) {
  return request.post<ApiResult<number>>('/OpsToken', data).then((res) => {
    invalidateHttpCache(opsTokenTags)
    return res
  })
}

/**
 * @description 更新运维令牌。
 */
export function updateOpsToken(data: OpsTokenUpdateDto) {
  return request.put<ApiResult<boolean>>('/OpsToken', data).then((res) => {
    invalidateHttpCache(opsTokenTags)
    return res
  })
}

/**
 * @description 删除运维令牌。
 */
export function deleteOpsToken(id: string) {
  return request.delete<ApiResult<boolean>>(`/OpsToken/${id}`).then((res) => {
    invalidateHttpCache(opsTokenTags)
    return res
  })
}
