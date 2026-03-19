/**
 * @file 运维令牌接口封装。
 */
import request from './request'
import type { ApiResult, PageResult, OpsTokenDto, OpsTokenQueryDto, OpsTokenCreateDto, OpsTokenUpdateDto } from './types'

/**
 * @description 获取运维令牌分页。
 */
export function getOpsTokenPage(params: OpsTokenQueryDto) {
  return request.get<ApiResult<PageResult<OpsTokenDto>>>('/OpsToken', { params })
}

/**
 * @description 获取运维令牌详情。
 */
export function getOpsToken(id: string) {
  return request.get<ApiResult<OpsTokenDto>>(`/OpsToken/${id}`)
}

/**
 * @description 新建运维令牌。
 */
export function createOpsToken(data: OpsTokenCreateDto) {
  return request.post<ApiResult<number>>('/OpsToken', data)
}

/**
 * @description 更新运维令牌。
 */
export function updateOpsToken(data: OpsTokenUpdateDto) {
  return request.put<ApiResult<boolean>>('/OpsToken', data)
}

/**
 * @description 删除运维令牌。
 */
export function deleteOpsToken(id: string) {
  return request.delete<ApiResult<boolean>>(`/OpsToken/${id}`)
}
