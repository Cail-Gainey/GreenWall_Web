/**
 * @file 公告管理接口封装。
 */
import request from './request'
import { cachedGet, invalidateHttpCache } from './httpCache'
import type {
  ApiResult,
  ActiveAnnouncementDto,
  AnnouncementDto,
  AnnouncementQueryDto,
  AnnouncementCreateDto,
  AnnouncementUpdateDto,
  PageResult,
} from './types'

const announcementCacheTags = ['announcement:list', 'announcement:item', 'announcement:active']

export function getAnnouncementPage(params: AnnouncementQueryDto) {
  return cachedGet<ApiResult<PageResult<AnnouncementDto>>>('/announcement', { params }, {
    ttlMs: 15_000,
    tags: ['announcement:list'],
  })
}

export function getAnnouncement(id: string) {
  return cachedGet<ApiResult<AnnouncementDto>>(`/announcement/${id}`, undefined, {
    ttlMs: 30_000,
    tags: ['announcement:item'],
  })
}

export function createAnnouncement(data: AnnouncementCreateDto) {
  return request.post<ApiResult<string>>('/announcement', data).then((res) => {
    invalidateHttpCache(announcementCacheTags)
    return res
  })
}

export function updateAnnouncement(data: AnnouncementUpdateDto) {
  return request.put<ApiResult<boolean>>('/announcement', data).then((res) => {
    invalidateHttpCache(announcementCacheTags)
    return res
  })
}

export function deleteAnnouncement(id: string) {
  return request.delete<ApiResult<boolean>>(`/announcement/${id}`).then((res) => {
    invalidateHttpCache(announcementCacheTags)
    return res
  })
}

/**
 * @description 获取激活公告列表（用户端用）。
 * @param {boolean} forceRefresh 是否强制刷新缓存
 */
export function getActiveAnnouncements(forceRefresh = false) {
  return cachedGet<ApiResult<ActiveAnnouncementDto[]>>(
    '/announcement/active',
    undefined,
    {
      ttlMs: 60_000,
      tags: ['announcement:active'],
      forceRefresh,
    },
  )
}
