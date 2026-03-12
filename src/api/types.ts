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
 * @description 分页结果模型。
 */
export interface PageResult<T> {
  total: string
  pageIndex: number
  pageSize: number
  items: T[]
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
  roleIds?: string[]
}

/**
 * @description 更新用户请求。
 */
export interface UserUpdateDto {
  id: string
  nickName?: string
  avatar?: string
  email?: string
  phone?: string
  sex?: number
  status?: number
  remark?: string
}

/**
 * @description 用户列表项。
 */
export interface UserListItemDto {
  id: string
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
  roles: string[]
}

/**
 * @description 用户信息响应。
 */
export interface UserDto {
  id: string
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
  roles: string[]
  permissions: string[]
}

/**
 * @description GitHub OAuth 授权信息。
 */
export interface GitHubOAuthDto {
  id: number
  login: string
  avatarUrl?: string
  htmlUrl?: string
  accessToken: string
}

export interface GitHubPushCellDto {
  date: string
  level: number
}

export interface GitHubPushRequestDto {
  accessToken: string
  githubLogin?: string
  mode: 'create' | 'existing'
  repoName?: string
  repoFullName?: string
  visibility: 'public' | 'private'
  year: number
  cells: GitHubPushCellDto[]
}

export interface GitHubPushResponseDto {
  jobId: string
  status: string
}

export interface GitHubPushStatusDto {
  jobId: string
  status: string
  message?: string
  updatedAt: string
}

/**
 * @description 用户分页查询参数。
 */
export interface UserQueryDto {
  pageIndex?: number
  pageSize?: number
  keyword?: string
  status?: number
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
  expiresAt: string
}

/**
 * @description 图片验证码生成结果。
 */
export interface CaptchaResultDto {
  captchaId: string
  imageBase64: string
}

// ========== RBAC 权限相关 ==========

/**
 * @description 角色信息响应。
 */
export interface RoleDto {
  id: string
  roleName: string
  roleCode: string
  sort: number
  status: number
  remark?: string
  createTime: string
  menuIds?: string[]
}

/**
 * @description 创建角色请求。
 */
export interface RoleCreateDto {
  roleName: string
  roleCode: string
  sort: number
  status: number
  remark?: string
  menuIds?: string[]
}

/**
 * @description 更新角色请求。
 */
export interface RoleUpdateDto {
  id: string
  roleName: string
  roleCode: string
  sort: number
  status: number
  remark?: string
  menuIds?: string[]
}

/**
 * @description 菜单信息响应。
 */
export interface MenuDto {
  id: string
  parentId: string
  menuName: string
  menuType: number
  path?: string
  component?: string
  permission?: string
  icon?: string
  sort: number
  visible: boolean
  status: number
  remark?: string
  createTime: string
}

/**
 * @description 树形菜单响应。
 */
export interface MenuTreeDto {
  id: string
  parentId: string
  menuName: string
  menuType: number
  path?: string
  component?: string
  permission?: string
  icon?: string
  sort: number
  visible: boolean
  status: number
  children: MenuTreeDto[]
}

/**
 * @description 创建菜单请求。
 */
export interface MenuCreateDto {
  parentId: string
  menuName: string
  menuType: number
  path?: string
  component?: string
  permission?: string
  icon?: string
  sort: number
  visible: boolean
  status: number
  remark?: string
}

/**
 * @description 更新菜单请求。
 */
export interface MenuUpdateDto extends MenuCreateDto {
  id: string
}

/**
 * @description 给用户分配角色请求。
 */
export interface AssignUserRolesDto {
  userId: string
  roleIds: string[]
}
