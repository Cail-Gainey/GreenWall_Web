/**
 * @file 贡献图图案社区接口封装。
 */
import request from './request'
import { cachedGet, invalidateHttpCache } from './httpCache'
import type {
  ApiResult,
  PageResult,
  PatternCommentCreateDto,
  PatternCommentDto,
  PatternCreateDto,
  PatternDetailDto,
  PatternExportRequestDto,
  PatternExportTaskDto,
  PatternJsonPayload,
  PatternListItemDto,
  PatternUpdateDto,
} from './types'

/**
 * @description 社区排序字段。
 */
export type PatternSort = 'view' | 'like' | 'favorite'

/**
 * @description 获取社区图案列表。
 * @param params 查询参数（分页 + 排序）
 */
export function getCommunityPatterns(params: {
  pageIndex?: number
  pageSize?: number
  sort?: PatternSort
  year?: number
}) {
  return cachedGet<ApiResult<PageResult<PatternListItemDto>>>('/patterns', { params }, {
    ttlMs: 45_000,
    tags: ['pattern:list'],
  })
}

/**
 * @description 获取图案详情（浏览量 +1）。
 * @param id 图案 ID
 */
export function getPatternDetail(id: string) {
  return cachedGet<ApiResult<PatternDetailDto>>(`/patterns/${id}`, undefined, {
    ttlMs: 20_000,
    tags: ['pattern:detail'],
  })
}

/**
 * @description 获取当前用户发布的作品列表。
 * @param params 分页参数。
 */
export function getMyPatterns(params: { pageIndex?: number; pageSize?: number }) {
  return cachedGet<ApiResult<PageResult<PatternListItemDto>>>('/patterns/mine', { params }, {
    ttlMs: 35_000,
    tags: ['pattern:list', 'pattern:mine'],
  })
}

/**
 * @description 获取当前用户收藏的作品列表。
 * @param params 分页参数。
 */
export function getMyFavoritePatterns(params: { pageIndex?: number; pageSize?: number }) {
  return cachedGet<ApiResult<PageResult<PatternListItemDto>>>('/patterns/favorites/mine', { params }, {
    ttlMs: 35_000,
    tags: ['pattern:list', 'pattern:favorite'],
  })
}

/**
 * @description 获取指定用户主页作品列表。
 * @param userId 目标用户 ID。
 * @param params 分页参数。
 */
export function getUserPatterns(userId: string, params: { pageIndex?: number; pageSize?: number }) {
  return cachedGet<ApiResult<PageResult<PatternListItemDto>>>(`/patterns/users/${userId}`, { params }, {
    ttlMs: 35_000,
    tags: ['pattern:list', 'pattern:user'],
  })
}

/**
 * @description 上传图案到社区。
 * @param data 创建参数
 */
export async function createPattern(data: PatternCreateDto) {
  const res = await request.post<ApiResult<string>>('/patterns', data)
  invalidatePatternCaches()
  return res
}

/**
 * @description 更新社区图案。
 * @param id 图案 ID
 * @param data 更新参数
 */
export async function updatePattern(id: string, data: PatternUpdateDto) {
  const res = await request.put<ApiResult<boolean>>(`/patterns/${id}`, data)
  invalidatePatternCaches()
  return res
}

/**
 * @description 删除社区图案。
 * @param id 图案 ID
 */
export async function deletePattern(id: string) {
  const res = await request.delete<ApiResult<boolean>>(`/patterns/${id}`)
  invalidatePatternCaches()
  return res
}

/**
 * @description 点赞图案。
 * @param id 图案 ID
 */
export async function likePattern(id: string) {
  const res = await request.post<ApiResult<boolean>>(`/patterns/${id}/like`)
  invalidatePatternCaches()
  return res
}

/**
 * @description 取消点赞。
 * @param id 图案 ID
 */
export async function unlikePattern(id: string) {
  const res = await request.delete<ApiResult<boolean>>(`/patterns/${id}/like`)
  invalidatePatternCaches()
  return res
}

/**
 * @description 收藏图案。
 * @param id 图案 ID
 */
export async function favoritePattern(id: string) {
  const res = await request.post<ApiResult<boolean>>(`/patterns/${id}/favorite`)
  invalidatePatternCaches()
  return res
}

/**
 * @description 取消收藏。
 * @param id 图案 ID
 */
export async function unfavoritePattern(id: string) {
  const res = await request.delete<ApiResult<boolean>>(`/patterns/${id}/favorite`)
  invalidatePatternCaches()
  return res
}

/**
 * @description 获取图案评论列表。
 * @param id 图案 ID
 * @param params 分页参数
 */
export function getPatternComments(
  id: string,
  params: { pageIndex?: number; pageSize?: number; parentId?: string | number },
) {
  return cachedGet<ApiResult<PageResult<PatternCommentDto>>>(`/patterns/${id}/comments`, { params }, {
    ttlMs: 15_000,
    tags: ['pattern:comment'],
  })
}

/**
 * @description 发表评论。
 * @param id 图案 ID
 * @param data 评论内容
 */
export async function createPatternComment(id: string, data: PatternCommentCreateDto) {
  const res = await request.post<ApiResult<string>>(`/patterns/${id}/comments`, data)
  invalidatePatternCaches()
  return res
}

/**
 * @description 点赞评论。
 * @param id 图案 ID
 * @param commentId 评论 ID
 */
export async function likePatternComment(id: string, commentId: string) {
  const res = await request.post<ApiResult<boolean>>(`/patterns/${id}/comments/${commentId}/like`)
  invalidatePatternCaches()
  return res
}

/**
 * @description 取消点赞评论。
 * @param id 图案 ID
 * @param commentId 评论 ID
 */
export async function unlikePatternComment(id: string, commentId: string) {
  const res = await request.delete<ApiResult<boolean>>(`/patterns/${id}/comments/${commentId}/like`)
  invalidatePatternCaches()
  return res
}

export function createPatternExport(id: string, data: PatternExportRequestDto) {
  return request.post<ApiResult<PatternExportTaskDto>>(`/patterns/${id}/exports`, data)
}

export function getPatternExportTask(taskId: string) {
  return request.get<ApiResult<PatternExportTaskDto>>(`/patterns/exports/${taskId}`)
}

export function downloadPatternExport(taskId: string) {
  return request.get<Blob>(`/patterns/exports/${taskId}/download`, { responseType: 'blob' })
}

export function exportPatternJson(id: string) {
  return request.get<Blob>(`/patterns/${id}/exports/json`, { responseType: 'blob' })
}

export async function importPatternFromJson(data: PatternJsonPayload) {
  const res = await request.post<ApiResult<string>>('/patterns/import', data)
  invalidatePatternCaches()
  return res
}

export function invalidatePatternCaches() {
  invalidateHttpCache(['pattern:list', 'pattern:mine', 'pattern:user', 'pattern:favorite', 'pattern:detail', 'pattern:comment'])
}

export async function precachePatternCommunityData() {
  await Promise.allSettled([
    getCommunityPatterns({ pageIndex: 1, pageSize: 12, sort: 'view' }),
    getCommunityPatterns({ pageIndex: 1, pageSize: 12, sort: 'like' }),
    getCommunityPatterns({ pageIndex: 1, pageSize: 12, sort: 'favorite' }),
  ])
}
