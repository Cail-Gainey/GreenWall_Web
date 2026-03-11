/**
 * @file 用户管理接口封装。
 */
import request from './request'
import type { ApiResult, PageResult, UserCreateDto, UserDto, UserListItemDto, UserQueryDto, UserUpdateDto } from './types'

/**
 * @description 创建用户（需要 Admin 权限）。
 * @param {UserCreateDto} data 用户创建参数。
 */
export function createUser(data: UserCreateDto) {
  return request.post<ApiResult<string>>('/User', data)
}

/**
 * @description 获取用户信息（需要认证）。
 * @param {number} id 用户 ID。
 */
export function getUserInfo(id: string) {
  return request.get<ApiResult<UserDto>>(`/User/${id}`)
}

/**
 * @description 分页查询用户列表。
 * @param {UserQueryDto} params 查询参数。
 */
export function getUserPage(params: UserQueryDto) {
  return request.get<ApiResult<PageResult<UserListItemDto>>>('/User', { params })
}

/**
 * @description 更新用户信息（需要 sys:user:edit 权限）。
 * @param {UserUpdateDto} data 更新参数。
 */
export function updateUser(data: UserUpdateDto) {
  return request.put<ApiResult<boolean>>('/User', data)
}

/**
 * @description 删除用户（需要 Admin 权限）。
 * @param {number} id 用户 ID。
 */
export function deleteUser(id: string) {
  return request.delete<ApiResult<boolean>>(`/User/${id}`)
}
