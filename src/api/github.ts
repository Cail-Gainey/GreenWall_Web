import request from './request'
import type {
  ApiResult,
  GitHubOAuthDto,
  GitHubPushRequestDto,
  GitHubPushResponseDto,
  GitHubPushStatusDto,
} from './types'

export function exchangeGithubTicket(ticket: string) {
  return request.get<ApiResult<GitHubOAuthDto>>('/github/exchange', {
    params: { ticket },
  })
}

export function pushGithubContributions(payload: GitHubPushRequestDto) {
  return request.post<ApiResult<GitHubPushResponseDto>>('/github/push', payload)
}

export function getGithubPushStatus(jobId: string) {
  return request.get<ApiResult<GitHubPushStatusDto>>(`/github/push/${jobId}`)
}

export function getGithubRecentPushes(login: string) {
  return request.get<ApiResult<GitHubPushStatusDto[]>>('/github/push/recent', {
    params: { login },
  })
}
