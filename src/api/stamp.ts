/**
 * @file 图案模板（印章）接口封装。
 */
import request from './request'
import { cachedGet, invalidateHttpCache } from './httpCache'
import type {
  ApiResult,
  PageResult,
  StampCreateDto,
  StampDto,
  StampImportDto,
  StampQueryDto,
  StampUpdateDto,
} from './types'

const stampCacheTags = ['stamp:list', 'stamp:detail', 'stamp:imports']

export function getStampPage(params: StampQueryDto) {
  return cachedGet<ApiResult<PageResult<StampDto>>>('/stamps', { params }, {
    ttlMs: 30_000,
    tags: ['stamp:list'],
  })
}

export function getStampDetail(id: string) {
  return cachedGet<ApiResult<StampDto>>(`/stamps/${id}`, undefined, {
    ttlMs: 30_000,
    tags: ['stamp:detail'],
  })
}

export async function createStamp(data: StampCreateDto) {
  const res = await request.post<ApiResult<string>>('/stamps', data)
  invalidateHttpCache(stampCacheTags)
  return res
}

export async function updateStamp(data: StampUpdateDto) {
  const res = await request.put<ApiResult<boolean>>('/stamps', data)
  invalidateHttpCache(stampCacheTags)
  return res
}

export async function deleteStamp(id: string) {
  const res = await request.delete<ApiResult<boolean>>(`/stamps/${id}`)
  invalidateHttpCache(stampCacheTags)
  return res
}

export async function importStamp(stampId: string) {
  const res = await request.post<ApiResult<string>>(`/stamps/${stampId}/import`)
  invalidateHttpCache(stampCacheTags)
  return res
}

export async function publishStamp(stampId: string) {
  const res = await request.post<ApiResult<boolean>>(`/stamps/${stampId}/publish`)
  invalidateHttpCache(stampCacheTags)
  return res
}

export function getMyStampImports() {
  return cachedGet<ApiResult<StampImportDto[]>>('/stamps/imports/mine', undefined, {
    ttlMs: 30_000,
    tags: ['stamp:imports'],
  })
}

export async function removeStampImport(importId: string) {
  const res = await request.delete<ApiResult<boolean>>(`/stamps/imports/${importId}`)
  invalidateHttpCache(stampCacheTags)
  return res
}

export async function publishStampFromImport(importId: string) {
  const res = await request.post<ApiResult<string>>(`/stamps/imports/${importId}/publish`)
  invalidateHttpCache(stampCacheTags)
  return res
}
