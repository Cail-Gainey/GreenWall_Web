/**
 * @file GitHub OAuth 与贡献图推送接口封装。
 */
import request from './request'
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
  })
}

/**
 * @description 触发贡献图推送任务。
 * @param payload 推送请求参数
 */
export function pushGithubContributions(payload: GitHubPushRequestDto) {
  return request.post<ApiResult<GitHubPushResponseDto>>('/github/push', payload)
}

/**
 * @description 查询推送任务状态。
 * @param jobId 任务 ID
 */
export function getGithubPushStatus(jobId: string) {
  return request.get<ApiResult<GitHubPushStatusDto>>(`/github/push/${jobId}`)
}

/**
 * @description 获取用户近期推送记录。
 * @param login GitHub 登录名
 */
export function getGithubRecentPushes(login: string) {
  return request.get<ApiResult<GitHubPushStatusDto[]>>('/github/push/recent', {
    params: { login },
  })
}
