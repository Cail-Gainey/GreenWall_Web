/**
 * @file 验证码相关接口封装。
 */
import request from './request'
import type { ApiResult, SendCodeDto, VerifyCodeDto } from './types'

/**
 * @description 发送验证码到邮箱。
 * @param {SendCodeDto} data 发送参数。
 */
export function sendCode(data: SendCodeDto) {
  return request.post<ApiResult<string>>('/VerifyCode/send', data)
}

/**
 * @description 核验验证码。
 * @param {VerifyCodeDto} data 校验参数。
 */
export function verifyCode(data: VerifyCodeDto) {
  return request.post<ApiResult<boolean>>('/VerifyCode/verify', data)
}
