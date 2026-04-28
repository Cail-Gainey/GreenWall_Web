/**
 * @file 前端表单通用校验规则与校验函数。
 */

/**
 * @description 常用表单正则表达式。
 */
export const FORM_REGEX = {
  account: /^[^\s]{3,50}$/,
  password: /^(?=.*[A-Za-z])(?=.*\d)[^\s]{6,100}$/,
  email: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  phone: /^\+?\d{6,20}$/,
  imageCaptcha: /^[A-Za-z0-9]{4,5}$/,
  emailCode: /^\d{6}$/,
  roleCode: /^[A-Za-z][A-Za-z0-9:_-]{1,49}$/,
  permissionCode: /^[A-Za-z][A-Za-z0-9:_-]{1,99}$/,
  menuPath: /^\/[A-Za-z0-9/_-]*$/,
  componentPath: /^[A-Za-z0-9/_-]+\.vue$/,
  tokenName: /^[\u4e00-\u9fa5A-Za-z0-9_-]{2,50}$/,
  tokenValue: /^[A-Za-z0-9._-]{16,128}$/,
  repoName: /^[A-Za-z0-9._-]{1,100}$/,
  repoFullName: /^[A-Za-z0-9._-]+\/[A-Za-z0-9._-]+$/,
} as const

/**
 * @description 校验账号。
 */
export function isValidAccount(value: string) {
  return FORM_REGEX.account.test(value.trim())
}

/**
 * @description 校验密码（至少 6 位，包含字母和数字，不含空格）。
 */
export function isValidPassword(value: string) {
  return FORM_REGEX.password.test(value)
}

/**
 * @description 校验邮箱。
 */
export function isValidEmail(value: string) {
  return FORM_REGEX.email.test(value.trim())
}

/**
 * @description 校验手机号。
 */
export function isValidPhone(value: string) {
  return FORM_REGEX.phone.test(value.trim())
}

/**
 * @description 校验图片验证码（4-5 位字母数字）。
 */
export function isValidImageCaptcha(value: string) {
  return FORM_REGEX.imageCaptcha.test(value.trim())
}

/**
 * @description 校验邮箱验证码（6 位数字）。
 */
export function isValidEmailCode(value: string) {
  return FORM_REGEX.emailCode.test(value.trim())
}

/**
 * @description 校验角色编码。
 */
export function isValidRoleCode(value: string) {
  return FORM_REGEX.roleCode.test(value.trim())
}

/**
 * @description 校验权限标识。
 */
export function isValidPermissionCode(value: string) {
  return FORM_REGEX.permissionCode.test(value.trim())
}

/**
 * @description 校验路由路径。
 */
export function isValidMenuPath(value: string) {
  return FORM_REGEX.menuPath.test(value.trim())
}

/**
 * @description 校验前端组件路径。
 */
export function isValidComponentPath(value: string) {
  return FORM_REGEX.componentPath.test(value.trim())
}

/**
 * @description 校验运维令牌名称。
 */
export function isValidTokenName(value: string) {
  return FORM_REGEX.tokenName.test(value.trim())
}

/**
 * @description 校验运维令牌内容。
 */
export function isValidTokenValue(value: string) {
  return FORM_REGEX.tokenValue.test(value.trim())
}

/**
 * @description 校验 GitHub 仓库名。
 */
export function isValidRepoName(value: string) {
  return FORM_REGEX.repoName.test(value.trim())
}

/**
 * @description 校验 GitHub 仓库全名（owner/repo）。
 */
export function isValidRepoFullName(value: string) {
  return FORM_REGEX.repoFullName.test(value.trim())
}
