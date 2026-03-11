/**
 * @file 角色管理接口封装。
 */
import request from './request'
import type { ApiResult, RoleDto, RoleCreateDto, RoleUpdateDto } from './types'

/**
 * @description 获取所有角色。
 */
export function getAllRoles() {
  return request.get<ApiResult<RoleDto[]>>('/Role')
}

/**
 * @description 获取单个角色 (含已分配菜单)。
 */
export function getRoleById(id: string) {
  return request.get<ApiResult<RoleDto>>(`/Role/${id}`)
}

/**
 * @description 创建角色。
 */
export function createRole(data: RoleCreateDto) {
  return request.post<ApiResult<string>>('/Role', data)
}

/**
 * @description 更新角色。
 */
export function updateRole(data: RoleUpdateDto) {
  return request.put<ApiResult<boolean>>('/Role', data)
}

/**
 * @description 删除角色。
 */
export function deleteRole(id: string) {
  return request.delete<ApiResult<boolean>>(`/Role/${id}`)
}
