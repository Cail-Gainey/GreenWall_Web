/**
 * @file API 类型定义：请求 DTO 与响应模型。
 */

/**
 * @description 后端统一响应格式。
 */
export interface ApiResult<T> {
  code: number
  msg: string
  data: T
  timestamp: number
}

/**
 * @description 发送验证码请求。
 */
export interface SendCodeDto {
  email: string
  captchaId: string
  captchaCode: string
}

/**
 * @description 核验验证码请求。
 */
export interface VerifyCodeDto {
  email: string
  code: string
}

/**
 * @description 创建用户请求。
 */
export interface UserCreateDto {
  account: string
  password: string
  nickName?: string
  avatar?: string
  email?: string
  phone?: string
  sex?: number
  remark?: string
}

/**
 * @description 用户信息响应。
 */
export interface UserDto {
  id: number
  account: string
  nickName?: string
  avatar?: string
  email?: string
  phone?: string
  sex: number
  status: number
  createTime: string
  lastLoginTime?: string
  remark?: string
}

/**
 * @description 登录请求。
 */
export interface LoginDto {
  account: string
  password: string
  captchaId: string
  captchaCode: string
}

/**
 * @description 自助注册请求。
 */
export interface RegisterDto {
  account: string
  password: string
  confirmPassword: string
  email: string
  code: string
}

/**
 * @description 重置密码请求。
 */
export interface ResetPasswordDto {
  email: string
  code: string
  newPassword: string
  confirmPassword: string
}

/**
 * @description 登录成功响应（仅 Token，用户信息通过 /api/Auth/me 获取）。
 */
export interface TokenDto {
  token: string
  expiresAt: number
}

/**
 * @description 图片验证码生成结果。
 */
export interface CaptchaResultDto {
  captchaId: string
  imageBase64: string
}
