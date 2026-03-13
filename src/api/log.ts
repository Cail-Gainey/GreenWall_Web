/**
 * @file 日志相关接口封装。
 */
import request from './request'
import type { ApiResult, OperLogDto, OperLogQueryDto, LoginLogDto, LoginLogQueryDto, PageResult } from './types'

/**
 * @description 获取操作日志分页。
 */
export function getOperLogs(params: OperLogQueryDto) {
  return request.get<ApiResult<PageResult<OperLogDto>>>('/logs/oper', { params })
}

/**
 * @description 获取登录日志分页。
 */
export function getLoginLogs(params: LoginLogQueryDto) {
  return request.get<ApiResult<PageResult<LoginLogDto>>>('/logs/login', { params })
}
