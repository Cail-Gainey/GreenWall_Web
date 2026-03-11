/**
 * @file 用户管理接口封装。
 */
import request from './request'
import type { ApiResult, UserCreateDto, UserDto } from './types'

/**
 * @description 创建用户（需要 Admin 权限）。
 * @param {UserCreateDto} data 用户创建参数。
 */
export function createUser(data: UserCreateDto) {
  return request.post<ApiResult<number>>('/User', data)
}

/**
 * @description 获取用户信息（需要认证）。
 * @param {number} id 用户 ID。
 */
export function getUserInfo(id: number) {
  return request.get<ApiResult<UserDto>>(`/User/${id}`)
}

/**
 * @description 删除用户（需要 Admin 权限）。
 * @param {number} id 用户 ID。
 */
export function deleteUser(id: number) {
  return request.delete<ApiResult<boolean>>(`/User/${id}`)
}
