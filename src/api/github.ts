import request from './request'
import type { ApiResult, GitHubOAuthDto } from './types'

export function exchangeGithubTicket(ticket: string) {
  return request.get<ApiResult<GitHubOAuthDto>>('/github/exchange', {
    params: { ticket },
  })
}
