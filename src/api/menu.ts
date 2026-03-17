/**
 * @file 菜单管理接口封装。
 */
import request from './request'
import type { ApiResult, MenuDto, MenuTreeDto, MenuCreateDto, MenuUpdateDto, MenuSortUpdateDto } from './types'

/**
 * @description 获取完整菜单树。
 */
export function getMenuTree() {
  return request.get<ApiResult<MenuTreeDto[]>>('/Menu/tree')
}

/**
 * @description 获取单个菜单。
 */
export function getMenuById(id: string) {
  return request.get<ApiResult<MenuDto>>(`/Menu/${id}`)
}

/**
 * @description 创建菜单。
 */
export function createMenu(data: MenuCreateDto) {
  return request.post<ApiResult<string>>('/Menu', data)
}

/**
 * @description 更新菜单。
 */
export function updateMenu(data: MenuUpdateDto) {
  return request.put<ApiResult<boolean>>('/Menu', data)
}

/**
 * @description 更新菜单排序。
 */
export function updateMenuSort(data: MenuSortUpdateDto[]) {
  return request.put<ApiResult<boolean>>('/Menu/sort', data)
}

/**
 * @description 删除菜单。
 */
export function deleteMenu(id: string) {
  return request.delete<ApiResult<boolean>>(`/Menu/${id}`)
}
