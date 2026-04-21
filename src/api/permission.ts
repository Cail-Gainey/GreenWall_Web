/**
 * @file 权限相关接口封装。
 */
import request from './request'
import { cachedGet, invalidateHttpCache } from './httpCache'
import type { ApiResult, MenuTreeDto, AssignUserRolesDto } from './types'

const permissionTags = ['permission:menus', 'permission:list']

/**
 * @description 获取当前用户的菜单树。
 */
export function getUserMenus() {
  return cachedGet<ApiResult<MenuTreeDto[]>>('/Permission/menus', undefined, {
    ttlMs: 60_000,
    tags: ['permission:menus'],
  })
}

/**
 * @description 获取当前用户的权限标识列表。
 */
export function getUserPermissions() {
  return cachedGet<ApiResult<string[]>>('/Permission/permissions', undefined, {
    ttlMs: 60_000,
    tags: ['permission:list'],
  })
}

/**
 * @description 按前缀筛选权限标识列表。
 * @param prefix 权限前缀
 */
export function filterUserPermissions(prefix: string) {
  return cachedGet<ApiResult<string[]>>('/Permission/permissions/filter', {
    params: { prefix },
  }, {
    ttlMs: 30_000,
    tags: ['permission:list'],
  })
}

/**
 * @description 给用户分配角色 (仅管理员)。
 */
export function assignUserRoles(data: AssignUserRolesDto) {
  return request.put<ApiResult<boolean>>('/Permission/assign-roles', data).then((res) => {
    invalidateHttpCache(permissionTags)
    return res
  })
}
