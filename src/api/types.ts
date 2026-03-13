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
  phone?: string
  sex?: number
  status?: number
  remark?: string
}

/**
 * @description 个人资料更新请求。
 */
export interface UserProfileUpdateDto {
  nickName?: string
  email?: string
  phone?: string
  sex?: number
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
 * @description 个人资料响应。
 */
export interface UserProfileDto {
  id: string
  account: string
  nickName?: string
  avatar?: string
  email?: string
  phone?: string
  sex: number
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

/**
 * @description 单个贡献图单元。
 */
export interface GitHubPushCellDto {
  /** 日期（YYYY-MM-DD） */
  date: string
  /** 贡献等级 0-4 */
  level: number
}

/**
 * @description 贡献图推送请求。
 */
export interface GitHubPushRequestDto {
  /** GitHub OAuth Access Token */
  accessToken: string
  /** GitHub 登录名（可选，用于最近记录缓存） */
  githubLogin?: string
  /** 推送模式：创建新仓库或使用已有仓库 */
  mode: 'create' | 'existing'
  /** 新建仓库名称 */
  repoName?: string
  /** 现有仓库全名 owner/repo */
  repoFullName?: string
  /** 仓库可见性 */
  visibility: 'public' | 'private'
  /** 目标年份 */
  year: number
  /** 贡献图单元列表 */
  cells: GitHubPushCellDto[]
}

/**
 * @description 贡献图推送响应。
 */
export interface GitHubPushResponseDto {
  /** 任务 ID */
  jobId: string
  /** 初始状态 */
  status: string
}

/**
 * @description 贡献图推送任务状态。
 */
export interface GitHubPushStatusDto {
  /** 任务 ID */
  jobId: string
  /** 状态：queued | running | success | failed */
  status: string
  /** 失败原因或补充信息 */
  message?: string
  /** 状态更新时间 */
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

/**
 * @description 图案单元。
 */
export interface PatternCellDto {
  col: number
  row: number
  level: number
}

/**
 * @description 社区图案创建请求。
 */
export interface PatternCreateDto {
  title: string
  description?: string
  year: number
  gridCols: number
  gridRows: number
  cells: PatternCellDto[]
}

/**
 * @description 社区图案更新请求。
 */
export interface PatternUpdateDto extends PatternCreateDto {}

/**
 * @description 社区图案列表项。
 */
export interface PatternListItemDto {
  id: string
  title: string
  description?: string
  year: number
  gridCols: number
  gridRows: number
  cells: PatternCellDto[]
  viewCount: number
  likeCount: number
  favoriteCount: number
  creatorName: string
  creatorAvatar?: string
  createTime: string
  isLiked: boolean
  isFavorited: boolean
}

/**
 * @description 社区图案详情。
 */
export interface PatternDetailDto extends PatternListItemDto {
  creatorId: string
}

/**
 * @description MySQL 监控信息。
 */
export interface MySqlMonitorDto {
  version: string
  uptime: number
  threadsConnected: number
  threadsRunning: number
  connections: number
  questions: number
  slowQueries: number
  qps: number
  serverTime: string
}

/**
 * @description Redis 监控信息。
 */
export interface RedisMonitorDto {
  version: string
  uptime: number
  connectedClients: number
  totalConnections: number
  totalCommands: number
  instantOpsPerSec: number
  rejectedConnections: number
  usedMemory: number
  usedMemoryHuman: string
  maxMemory: number
}

/**
 * @description 服务器运行信息。
 */
export interface ServerMonitorDto {
  machineName: string
  osDescription: string
  frameworkDescription: string
  processId: number
  processStartTime: string
  uptime: number
  processorCount: number
  workingSet: number
  gcMemory: number
}
