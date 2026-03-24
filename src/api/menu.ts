/**
 * @file 菜单管理接口封装。
 */
import request from './request'
import { cachedGet, invalidateHttpCache } from './httpCache'
import type { ApiResult, MenuDto, MenuTreeDto, MenuCreateDto, MenuUpdateDto, MenuSortUpdateDto } from './types'

const menuCacheTags = ['menu:tree', 'menu:item']

/**
 * @description 获取完整菜单树。
 */
export function getMenuTree() {
  return cachedGet<ApiResult<MenuTreeDto[]>>('/Menu/tree', undefined, {
    ttlMs: 60_000,
    tags: ['menu:tree'],
  })
}

/**
 * @description 获取单个菜单。
 */
export function getMenuById(id: string) {
  return cachedGet<ApiResult<MenuDto>>(`/Menu/${id}`, undefined, {
    ttlMs: 60_000,
    tags: ['menu:item'],
  })
}

/**
 * @description 创建菜单。
 */
export function createMenu(data: MenuCreateDto) {
  return request.post<ApiResult<string>>('/Menu', data).then((res) => {
    invalidateHttpCache(menuCacheTags)
    return res
  })
}

/**
 * @description 更新菜单。
 */
export function updateMenu(data: MenuUpdateDto) {
  return request.put<ApiResult<boolean>>('/Menu', data).then((res) => {
    invalidateHttpCache(menuCacheTags)
    return res
  })
}

/**
 * @description 更新菜单排序。
 */
export function updateMenuSort(data: MenuSortUpdateDto[]) {
  return request.put<ApiResult<boolean>>('/Menu/sort', data).then((res) => {
    invalidateHttpCache(menuCacheTags)
    return res
  })
}

/**
 * @description 删除菜单。
 */
export function deleteMenu(id: string) {
  return request.delete<ApiResult<boolean>>(`/Menu/${id}`).then((res) => {
    invalidateHttpCache(menuCacheTags)
    return res
  })
}
