/**
 * @file 仪表盘接口封装。
 */
import request from './request'
import type { ApiResult, DashboardSummaryDto } from './types'

export function getDashboardSummary() {
  return request.get<ApiResult<DashboardSummaryDto>>('/dashboard/summary')
}
