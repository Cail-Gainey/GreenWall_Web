/**
 * @file 系统监控接口封装。
 */
import request from './request'
import type { ApiResult, MySqlMonitorDto, RedisMonitorDto, ServerMonitorDto } from './types'

/**
 * @description 获取 MySQL 监控数据。
 */
export function getMySqlMonitor() {
  return request.get<ApiResult<MySqlMonitorDto>>('/Monitor/mysql')
}

/**
 * @description 获取 Redis 监控数据。
 */
export function getRedisMonitor() {
  return request.get<ApiResult<RedisMonitorDto>>('/Monitor/redis')
}

/**
 * @description 获取服务器运行信息。
 */
export function getServerMonitor() {
  return request.get<ApiResult<ServerMonitorDto>>('/Monitor/server')
}

/**
 * @description 重启服务器。
 */
export function restartServer(token?: string) {
  return request.post<ApiResult<boolean>>('/Monitor/ops/server/restart', null, {
    headers: token ? { 'X-Ops-Token': token } : undefined,
  })
}

/**
 * @description 重启 MySQL。
 */
export function restartMySql(token?: string) {
  return request.post<ApiResult<boolean>>('/Monitor/ops/mysql/restart', null, {
    headers: token ? { 'X-Ops-Token': token } : undefined,
  })
}

/**
 * @description 重启 Redis。
 */
export function restartRedis(token?: string) {
  return request.post<ApiResult<boolean>>('/Monitor/ops/redis/restart', null, {
    headers: token ? { 'X-Ops-Token': token } : undefined,
  })
}

/**
 * @description 清空 Redis（当前 DB）。
 */
export function flushRedis(token?: string) {
  return request.post<ApiResult<boolean>>('/Monitor/ops/redis/flush', null, {
    headers: token ? { 'X-Ops-Token': token } : undefined,
  })
}

/**
 * @description 清空缓存（Redis 当前 DB）。
 */
export function clearCache(token?: string) {
  return request.post<ApiResult<boolean>>('/Monitor/ops/cache/clear', null, {
    headers: token ? { 'X-Ops-Token': token } : undefined,
  })
}
