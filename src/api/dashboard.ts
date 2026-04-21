/**
 * @file 仪表盘接口封装。
 */
import request from './request'
import { cachedGet } from './httpCache'
import type { ApiResult, DashboardSummaryDto } from './types'

export function getDashboardSummary() {
  return cachedGet<ApiResult<DashboardSummaryDto>>('/dashboard/summary', undefined, {
    ttlMs: 20_000,
    tags: ['dashboard:summary'],
  })
}
