/**
 * @file 角色管理接口封装。
 */
import request from './request'
import { cachedGet, invalidateHttpCache } from './httpCache'
import type { ApiResult, PageResult, RoleDto, RoleCreateDto, RoleQueryDto, RoleSortUpdateDto, RoleUpdateDto } from './types'

const roleCacheTags = ['role:list', 'role:item']

/**
 * @description 获取所有角色。
 */
export function getAllRoles() {
  return cachedGet<ApiResult<RoleDto[]>>('/Role', undefined, {
    ttlMs: 60_000,
    tags: ['role:list'],
  })
}

/**
 * @description 分页查询角色列表。
 */
export function getRolePage(params: RoleQueryDto) {
  return cachedGet<ApiResult<PageResult<RoleDto>>>('/Role/page', { params }, {
    ttlMs: 30_000,
    tags: ['role:list'],
  })
}

/**
 * @description 获取单个角色 (含已分配菜单)。
 */
export function getRoleById(id: string) {
  return cachedGet<ApiResult<RoleDto>>(`/Role/${id}`, undefined, {
    ttlMs: 45_000,
    tags: ['role:item'],
  })
}

/**
 * @description 创建角色。
 */
export function createRole(data: RoleCreateDto) {
  return request.post<ApiResult<string>>('/Role', data).then((res) => {
    invalidateHttpCache(roleCacheTags)
    return res
  })
}

/**
 * @description 更新角色。
 */
export function updateRole(data: RoleUpdateDto) {
  return request.put<ApiResult<boolean>>('/Role', data).then((res) => {
    invalidateHttpCache(roleCacheTags)
    return res
  })
}

/**
 * @description 删除角色。
 */
export function deleteRole(id: string) {
  return request.delete<ApiResult<boolean>>(`/Role/${id}`).then((res) => {
    invalidateHttpCache(roleCacheTags)
    return res
  })
}

/**
 * @description 更新角色排序。
 */
export function updateRoleSort(data: RoleSortUpdateDto[]) {
  return request.put<ApiResult<boolean>>('/Role/sort', data).then((res) => {
    invalidateHttpCache(roleCacheTags)
    return res
  })
}
