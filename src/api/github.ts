/**
 * @file GitHub OAuth 与贡献图推送接口封装。
 */
import request from './request'
import { cachedGet, invalidateHttpCache } from './httpCache'
import type {
  ApiResult,
  GitHubOAuthDto,
  GitHubPushRequestDto,
  GitHubPushResponseDto,
  GitHubPushStatusDto,
} from './types'

/**
 * @description 交换 GitHub OAuth ticket，获取 GitHub 用户信息。
 * @param ticket 临时授权票据
 */
export function exchangeGithubTicket(ticket: string) {
  return request.get<ApiResult<GitHubOAuthDto>>('/github/exchange', {
    params: { ticket },
  }).then((res) => {
    invalidateHttpCache(['github:oauth'])
    return res
  })
}

/**
 * @description 触发贡献图推送任务。
 * @param payload 推送请求参数
 */
export function pushGithubContributions(payload: GitHubPushRequestDto) {
  return request.post<ApiResult<GitHubPushResponseDto>>('/github/push', payload).then((res) => {
    invalidateHttpCache(['github:push'])
    return res
  })
}

/**
 * @description 查询推送任务状态。
 * @param jobId 任务 ID
 */
export function getGithubPushStatus(jobId: string) {
  return cachedGet<ApiResult<GitHubPushStatusDto>>(`/github/push/${jobId}`, undefined, {
    ttlMs: 3_000,
    tags: ['github:push'],
  })
}

/**
 * @description 获取用户近期推送记录。
 * @param login GitHub 登录名
 */
export function getGithubRecentPushes(login: string) {
  return cachedGet<ApiResult<GitHubPushStatusDto[]>>('/github/push/recent', {
    params: { login },
  }, {
    ttlMs: 15_000,
    tags: ['github:push'],
  })
}
