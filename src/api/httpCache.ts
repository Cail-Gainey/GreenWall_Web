import type { AxiosRequestConfig, AxiosResponse } from 'axios'
import request from './request'

interface CacheEntry<T = unknown> {
  expireAt: number
  data: T
  tags: string[]
}

interface CachedGetOptions {
  ttlMs?: number
  tags?: string[]
  key?: string
  forceRefresh?: boolean
}

const DEFAULT_TTL_MS = 30_000
const responseCache = new Map<string, CacheEntry<AxiosResponse>>()
const inflight = new Map<string, Promise<AxiosResponse>>()

const normalizeParams = (params: unknown): string => {
  if (!params || typeof params !== 'object') return ''
  const entries = Object.entries(params as Record<string, unknown>)
    .filter(([, value]) => value !== undefined)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, value]) => `${key}=${String(value)}`)
  return entries.join('&')
}

const buildGetCacheKey = (url: string, config?: AxiosRequestConfig, customKey?: string): string => {
  if (customKey) return customKey
  const base = `${config?.baseURL || ''}${url}`
  const params = normalizeParams(config?.params)
  return params ? `${base}?${params}` : base
}

const cloneResponse = <T = unknown>(response: AxiosResponse<T>): AxiosResponse<T> => ({
  ...response,
  data: typeof response.data === 'object' && response.data !== null
    ? JSON.parse(JSON.stringify(response.data))
    : response.data,
})

const getCachedResponse = (key: string): AxiosResponse | null => {
  const found = responseCache.get(key)
  if (!found) return null
  if (Date.now() >= found.expireAt) {
    responseCache.delete(key)
    return null
  }
  return cloneResponse(found.data)
}

const setCachedResponse = (key: string, response: AxiosResponse, ttlMs: number, tags: string[]) => {
  responseCache.set(key, {
    expireAt: Date.now() + Math.max(1000, ttlMs),
    data: cloneResponse(response),
    tags: tags.length > 0 ? tags : ['global'],
  })
}

export async function cachedGet<T = unknown>(
  url: string,
  config?: AxiosRequestConfig,
  options?: CachedGetOptions,
): Promise<AxiosResponse<T>> {
  const key = buildGetCacheKey(url, config, options?.key)
  if (!options?.forceRefresh) {
    const cached = getCachedResponse(key)
    if (cached) {
      return cached as AxiosResponse<T>
    }
  }

  const pending = inflight.get(key)
  if (pending) {
    const data = await pending
    return cloneResponse(data) as AxiosResponse<T>
  }

  const task = request.get<T>(url, config)
  inflight.set(key, task as Promise<AxiosResponse>)
  try {
    const response = await task
    setCachedResponse(key, response as AxiosResponse, options?.ttlMs ?? DEFAULT_TTL_MS, options?.tags ?? [])
    return response
  } finally {
    inflight.delete(key)
  }
}

export function invalidateHttpCache(tags?: string[]) {
  if (!tags || tags.length === 0) {
    responseCache.clear()
    return
  }

  for (const [key, entry] of responseCache.entries()) {
    if (entry.tags.some((tag) => tags.includes(tag))) {
      responseCache.delete(key)
    }
  }
}

export function getHttpCacheSize() {
  return responseCache.size
}
