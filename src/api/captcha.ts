/**
 * @file 图片验证码接口封装。
 */
import request from './request'
import type { ApiResult, CaptchaResultDto } from './types'

/**
 * @description 获取图片验证码。
 */
export function generateCaptcha() {
  return request.get<ApiResult<CaptchaResultDto>>('/Captcha/generate')
}
