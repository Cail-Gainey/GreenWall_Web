/**
 * @file 贡献图图案社区接口封装。
 */
import request from './request'
import type {
  ApiResult,
  PageResult,
  PatternCommentCreateDto,
  PatternCommentDto,
  PatternCreateDto,
  PatternDetailDto,
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
  return request.get<ApiResult<PageResult<PatternListItemDto>>>('/patterns', { params })
}

/**
 * @description 获取图案详情（浏览量 +1）。
 * @param id 图案 ID
 */
export function getPatternDetail(id: string) {
  return request.get<ApiResult<PatternDetailDto>>(`/patterns/${id}`)
}

/**
 * @description 获取当前用户发布的作品列表。
 * @param params 分页参数。
 */
export function getMyPatterns(params: { pageIndex?: number; pageSize?: number }) {
  return request.get<ApiResult<PageResult<PatternListItemDto>>>('/patterns/mine', { params })
}

/**
 * @description 获取当前用户收藏的作品列表。
 * @param params 分页参数。
 */
export function getMyFavoritePatterns(params: { pageIndex?: number; pageSize?: number }) {
  return request.get<ApiResult<PageResult<PatternListItemDto>>>('/patterns/favorites/mine', { params })
}

/**
 * @description 获取指定用户主页作品列表。
 * @param userId 目标用户 ID。
 * @param params 分页参数。
 */
export function getUserPatterns(userId: string, params: { pageIndex?: number; pageSize?: number }) {
  return request.get<ApiResult<PageResult<PatternListItemDto>>>(`/patterns/users/${userId}`, { params })
}

/**
 * @description 上传图案到社区。
 * @param data 创建参数
 */
export function createPattern(data: PatternCreateDto) {
  return request.post<ApiResult<string>>('/patterns', data)
}

/**
 * @description 更新社区图案。
 * @param id 图案 ID
 * @param data 更新参数
 */
export function updatePattern(id: string, data: PatternUpdateDto) {
  return request.put<ApiResult<boolean>>(`/patterns/${id}`, data)
}

/**
 * @description 删除社区图案。
 * @param id 图案 ID
 */
export function deletePattern(id: string) {
  return request.delete<ApiResult<boolean>>(`/patterns/${id}`)
}

/**
 * @description 点赞图案。
 * @param id 图案 ID
 */
export function likePattern(id: string) {
  return request.post<ApiResult<boolean>>(`/patterns/${id}/like`)
}

/**
 * @description 取消点赞。
 * @param id 图案 ID
 */
export function unlikePattern(id: string) {
  return request.delete<ApiResult<boolean>>(`/patterns/${id}/like`)
}

/**
 * @description 收藏图案。
 * @param id 图案 ID
 */
export function favoritePattern(id: string) {
  return request.post<ApiResult<boolean>>(`/patterns/${id}/favorite`)
}

/**
 * @description 取消收藏。
 * @param id 图案 ID
 */
export function unfavoritePattern(id: string) {
  return request.delete<ApiResult<boolean>>(`/patterns/${id}/favorite`)
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
  return request.get<ApiResult<PageResult<PatternCommentDto>>>(`/patterns/${id}/comments`, { params })
}

/**
 * @description 发表评论。
 * @param id 图案 ID
 * @param data 评论内容
 */
export function createPatternComment(id: string, data: PatternCommentCreateDto) {
  return request.post<ApiResult<string>>(`/patterns/${id}/comments`, data)
}

/**
 * @description 点赞评论。
 * @param id 图案 ID
 * @param commentId 评论 ID
 */
export function likePatternComment(id: string, commentId: string) {
  return request.post<ApiResult<boolean>>(`/patterns/${id}/comments/${commentId}/like`)
}

/**
 * @description 取消点赞评论。
 * @param id 图案 ID
 * @param commentId 评论 ID
 */
export function unlikePatternComment(id: string, commentId: string) {
  return request.delete<ApiResult<boolean>>(`/patterns/${id}/comments/${commentId}/like`)
}
