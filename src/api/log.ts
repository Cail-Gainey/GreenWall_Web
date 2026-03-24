/**
 * @file 日志相关接口封装。
 */
import request from './request'
import { cachedGet, invalidateHttpCache } from './httpCache'
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

const logCacheTags = ['log:oper', 'log:login', 'log:server']

/**
 * @description 获取操作日志分页。
 */
export function getOperLogs(params: OperLogQueryDto) {
  return cachedGet<ApiResult<PageResult<OperLogDto>>>('/logs/oper', { params }, {
    ttlMs: 10_000,
    tags: ['log:oper'],
  })
}

/**
 * @description 获取登录日志分页。
 */
export function getLoginLogs(params: LoginLogQueryDto) {
  return cachedGet<ApiResult<PageResult<LoginLogDto>>>('/logs/login', { params }, {
    ttlMs: 10_000,
    tags: ['log:login'],
  })
}

/**
 * @description 清空操作日志。
 */
export function clearOperLogs() {
  return request.post<ApiResult<boolean>>('/logs/oper/clear').then((res) => {
    invalidateHttpCache(logCacheTags)
    return res
  })
}

/**
 * @description 清空登录日志。
 */
export function clearLoginLogs() {
  return request.post<ApiResult<boolean>>('/logs/login/clear').then((res) => {
    invalidateHttpCache(logCacheTags)
    return res
  })
}

/**
 * @description 获取服务器日志分页。
 */
export function getServerLogs(params: ServerLogQueryDto) {
  return cachedGet<ApiResult<PageResult<ServerLogDto>>>('/logs/server', { params }, {
    ttlMs: 10_000,
    tags: ['log:server'],
  })
}

/**
 * @description 获取服务器日志文件列表。
 */
export function getServerLogFiles() {
  return cachedGet<ApiResult<ServerLogFileDto[]>>('/logs/server/files', undefined, {
    ttlMs: 10_000,
    tags: ['log:server'],
  })
}

/**
 * @description 获取服务器日志文件内容(尾部行)。
 */
export function getServerLogFile(name: string, lines = 500) {
  return cachedGet<ApiResult<string[]>>('/logs/server/file', { params: { name, lines } }, {
    ttlMs: 5_000,
    tags: ['log:server'],
  })
}

/**
 * @description 清空服务器日志文件。
 */
export function clearServerLog(name?: string) {
  return request.post<ApiResult<boolean>>('/logs/server/clear', null, { params: { name } }).then((res) => {
    invalidateHttpCache(logCacheTags)
    return res
  })
}
