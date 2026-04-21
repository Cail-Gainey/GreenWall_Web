/**
 * @file 认证相关接口封装。
 */
import request from './request'
import { cachedGet, invalidateHttpCache } from './httpCache'
import type { ApiResult, LoginDto, RegisterDto, ResetPasswordDto, TokenDto, UserProfileDto } from './types'

/**
 * @description 账号密码登录。
 * @param {LoginDto} data 登录参数。
 */
export function login(data: LoginDto) {
  return request.post<ApiResult<TokenDto>>('/Auth/login', data).then((res) => {
    invalidateHttpCache()
    return res
  })
}

/**
 * @description 自助注册（需邮箱验证码）。
 * @param {RegisterDto} data 注册参数。
 */
export function register(data: RegisterDto) {
  return request.post<ApiResult<TokenDto>>('/Auth/register', data).then((res) => {
    invalidateHttpCache()
    return res
  })
}

/**
 * @description 重置密码（需邮箱验证码）。
 * @param {ResetPasswordDto} data 重置参数。
 */
export function resetPassword(data: ResetPasswordDto) {
  return request.post<ApiResult<boolean>>('/Auth/reset-password', data).then((res) => {
    invalidateHttpCache()
    return res
  })
}

/**
 * @description 获取当前已登录用户信息（需 JWT）。
 */
export function getMe() {
  return cachedGet<ApiResult<UserProfileDto>>('/Auth/me', undefined, {
    ttlMs: 45_000,
    tags: ['auth:me', 'user:profile'],
  })
}

/**
 * @description 退出登录（清理后端缓存）。
 */
export function logout() {
  return request.post<ApiResult<boolean>>('/Auth/logout').then((res) => {
    invalidateHttpCache()
    return res
  })
}
