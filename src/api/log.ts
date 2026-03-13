/**
 * @file 日志相关接口封装。
 */
import request from './request'
import type {
  ApiResult,
  OperLogDto,
  OperLogQueryDto,
  LoginLogDto,
  LoginLogQueryDto,
  PageResult,
  ServerLogDto,
  ServerLogQueryDto,
  ServerLogFileDto,
} from './types'

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

/**
 * @description 清空操作日志。
 */
export function clearOperLogs() {
  return request.post<ApiResult<boolean>>('/logs/oper/clear')
}

/**
 * @description 清空登录日志。
 */
export function clearLoginLogs() {
  return request.post<ApiResult<boolean>>('/logs/login/clear')
}

/**
 * @description 获取服务器日志分页。
 */
export function getServerLogs(params: ServerLogQueryDto) {
  return request.get<ApiResult<PageResult<ServerLogDto>>>('/logs/server', { params })
}

/**
 * @description 获取服务器日志文件列表。
 */
export function getServerLogFiles() {
  return request.get<ApiResult<ServerLogFileDto[]>>('/logs/server/files')
}

/**
 * @description 获取服务器日志文件内容(尾部行)。
 */
export function getServerLogFile(name: string, lines = 500) {
  return request.get<ApiResult<string[]>>('/logs/server/file', { params: { name, lines } })
}

/**
 * @description 清空服务器日志文件。
 */
export function clearServerLog(name?: string) {
  return request.post<ApiResult<boolean>>('/logs/server/clear', null, { params: { name } })
}
