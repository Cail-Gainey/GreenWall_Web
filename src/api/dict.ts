/**
 * @file 数据字典接口封装。
 */
import request from './request'
import { cachedGet, invalidateHttpCache } from './httpCache'
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

const dictCacheTags = ['dict:type', 'dict:data', 'dict:options']

export function getDictTypes(params: DictTypeQueryDto) {
  return cachedGet<ApiResult<PageResult<DictTypeDto>>>('/dict/types', { params }, {
    ttlMs: 30_000,
    tags: ['dict:type'],
  })
}

export function createDictType(data: DictTypeCreateDto) {
  return request.post<ApiResult<string>>('/dict/types', data).then((res) => {
    invalidateHttpCache(dictCacheTags)
    return res
  })
}

export function updateDictType(data: DictTypeUpdateDto) {
  return request.put<ApiResult<boolean>>('/dict/types', data).then((res) => {
    invalidateHttpCache(dictCacheTags)
    return res
  })
}

export function deleteDictType(id: string) {
  return request.delete<ApiResult<boolean>>(`/dict/types/${id}`).then((res) => {
    invalidateHttpCache(dictCacheTags)
    return res
  })
}

export function getDictData(params: DictDataQueryDto) {
  return cachedGet<ApiResult<PageResult<DictDataDto>>>('/dict/data', { params }, {
    ttlMs: 30_000,
    tags: ['dict:data'],
  })
}

export function createDictData(data: DictDataCreateDto) {
  return request.post<ApiResult<string>>('/dict/data', data).then((res) => {
    invalidateHttpCache(dictCacheTags)
    return res
  })
}

export function updateDictData(data: DictDataUpdateDto) {
  return request.put<ApiResult<boolean>>('/dict/data', data).then((res) => {
    invalidateHttpCache(dictCacheTags)
    return res
  })
}

export function deleteDictData(id: string) {
  return request.delete<ApiResult<boolean>>(`/dict/data/${id}`).then((res) => {
    invalidateHttpCache(dictCacheTags)
    return res
  })
}

export function getDictOptions(dictType: string) {
  return cachedGet<ApiResult<DictDataDto[]>>(`/dict/options/${dictType}`, undefined, {
    ttlMs: 60_000,
    tags: ['dict:options'],
  })
}
