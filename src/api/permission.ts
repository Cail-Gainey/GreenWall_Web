/**
 * @file 权限相关接口封装。
 */
import request from './request'
import type { ApiResult, MenuTreeDto, AssignUserRolesDto } from './types'

/**
 * @description 获取当前用户的菜单树。
 */
export function getUserMenus() {
  return request.get<ApiResult<MenuTreeDto[]>>('/Permission/menus')
}

/**
 * @description 获取当前用户的权限标识列表。
 */
export function getUserPermissions() {
  return request.get<ApiResult<string[]>>('/Permission/permissions')
}

/**
 * @description 给用户分配角色 (仅管理员)。
 */
export function assignUserRoles(data: AssignUserRolesDto) {
  return request.put<ApiResult<boolean>>('/Permission/assign-roles', data)
}
