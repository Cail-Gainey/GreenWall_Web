/**
 * @file 系统监控接口封装。
 */
import request from './request'
import { cachedGet, invalidateHttpCache } from './httpCache'
import type { ApiResult, MySqlMonitorDto, RedisMonitorDto, ServerMonitorDto } from './types'

const monitorCacheTags = ['monitor:mysql', 'monitor:redis', 'monitor:server']

/**
 * @description 获取 MySQL 监控数据。
 */
export function getMySqlMonitor() {
  return cachedGet<ApiResult<MySqlMonitorDto>>('/Monitor/mysql', undefined, {
    ttlMs: 5_000,
    tags: ['monitor:mysql'],
  })
}

/**
 * @description 获取 Redis 监控数据。
 */
export function getRedisMonitor() {
  return cachedGet<ApiResult<RedisMonitorDto>>('/Monitor/redis', undefined, {
    ttlMs: 5_000,
    tags: ['monitor:redis'],
  })
}

/**
 * @description 获取服务器运行信息。
 */
export function getServerMonitor() {
  return cachedGet<ApiResult<ServerMonitorDto>>('/Monitor/server', undefined, {
    ttlMs: 5_000,
    tags: ['monitor:server'],
  })
}

/**
 * @description 重启服务器。
 */
export function restartServer(token?: string) {
  return request.post<ApiResult<boolean>>('/Monitor/ops/server/restart', null, {
    headers: token ? { 'X-Ops-Token': token } : undefined,
  }).then((res) => {
    invalidateHttpCache(monitorCacheTags)
    return res
  })
}

/**
 * @description 重启 MySQL。
 */
export function restartMySql(token?: string) {
  return request.post<ApiResult<boolean>>('/Monitor/ops/mysql/restart', null, {
    headers: token ? { 'X-Ops-Token': token } : undefined,
  }).then((res) => {
    invalidateHttpCache(monitorCacheTags)
    return res
  })
}

/**
 * @description 重启 Redis。
 */
export function restartRedis(token?: string) {
  return request.post<ApiResult<boolean>>('/Monitor/ops/redis/restart', null, {
    headers: token ? { 'X-Ops-Token': token } : undefined,
  }).then((res) => {
    invalidateHttpCache(monitorCacheTags)
    return res
  })
}

/**
 * @description 清空 Redis（当前 DB）。
 */
export function flushRedis(token?: string) {
  return request.post<ApiResult<boolean>>('/Monitor/ops/redis/flush', null, {
    headers: token ? { 'X-Ops-Token': token } : undefined,
  }).then((res) => {
    invalidateHttpCache()
    return res
  })
}

/**
 * @description 清空缓存（Redis 当前 DB）。
 */
export function clearCache(token?: string) {
  return request.post<ApiResult<boolean>>('/Monitor/ops/cache/clear', null, {
    headers: token ? { 'X-Ops-Token': token } : undefined,
  }).then((res) => {
    invalidateHttpCache()
    return res
  })
}
