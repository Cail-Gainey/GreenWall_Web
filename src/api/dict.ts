/**
 * @file 数据字典接口封装。
 */
import request from './request'
import type {
  ApiResult,
  DictTypeDto,
  DictTypeQueryDto,
  DictTypeCreateDto,
  DictTypeUpdateDto,
  DictDataDto,
  DictDataQueryDto,
  DictDataCreateDto,
  DictDataUpdateDto,
  PageResult,
} from './types'

export function getDictTypes(params: DictTypeQueryDto) {
  return request.get<ApiResult<PageResult<DictTypeDto>>>('/dict/types', { params })
}

export function createDictType(data: DictTypeCreateDto) {
  return request.post<ApiResult<string>>('/dict/types', data)
}

export function updateDictType(data: DictTypeUpdateDto) {
  return request.put<ApiResult<boolean>>('/dict/types', data)
}

export function deleteDictType(id: string) {
  return request.delete<ApiResult<boolean>>(`/dict/types/${id}`)
}

export function getDictData(params: DictDataQueryDto) {
  return request.get<ApiResult<PageResult<DictDataDto>>>('/dict/data', { params })
}

export function createDictData(data: DictDataCreateDto) {
  return request.post<ApiResult<string>>('/dict/data', data)
}

export function updateDictData(data: DictDataUpdateDto) {
  return request.put<ApiResult<boolean>>('/dict/data', data)
}

export function deleteDictData(id: string) {
  return request.delete<ApiResult<boolean>>(`/dict/data/${id}`)
}

export function getDictOptions(dictType: string) {
  return request.get<ApiResult<DictDataDto[]>>(`/dict/options/${dictType}`)
}
