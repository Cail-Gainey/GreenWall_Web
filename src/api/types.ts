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
  account: string
  nickName?: string
  email?: string
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
  privacyConsent?: boolean
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
  privacyConsent: boolean
  followerCount: number
  followingCount: number
  roles: string[]
  permissions: string[]
}

export interface UserPrivacyConsentUpdateDto {
  privacyConsent: boolean
}

export interface UserFollowStatusDto {
  userId: string
  isFollowing: boolean
  followerCount: number
  followingCount: number
}

export interface UserPublicProfileDto {
  id: string
  account: string
  nickName?: string
  avatar?: string
  remark?: string
  followerCount: number
  followingCount: number
  isFollowing: boolean
}

export interface UserDataDeletionDto {
  confirmText: string
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
  account?: string
  phone?: string
  email?: string
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
  privacyConsent: boolean
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
 * @description 角色分页查询参数。
 */
export interface RoleQueryDto {
  pageIndex?: number
  pageSize?: number
  roleName?: string
  roleCode?: string
  remark?: string
  status?: number
  startTime?: number
  endTime?: number
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
 * @description 角色排序更新请求。
 */
export interface RoleSortUpdateDto {
  id: string
  sort: number
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
 * @description 菜单排序更新请求。
 */
export interface MenuSortUpdateDto {
  id: string
  sort: number
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
  visibility?: 'public' | 'followers' | 'private'
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
  creatorId: string
  visibility: 'public' | 'followers' | 'private'
  year: number
  gridCols: number
  gridRows: number
  cells: PatternCellDto[]
  viewCount: number
  likeCount: number
  favoriteCount: number
  commentCount: number
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

export interface PatternExportRequestDto {
  format: 'png' | 'json'
  background?: string
  scale?: number
}

export interface PatternExportTaskDto {
  taskId: string
  status: 'pending' | 'processing' | 'success' | 'failed'
  format: string
  downloadUrl?: string
  errorMessage?: string
  createTime: string
  completedTime?: string
}

export interface PatternJsonPayload {
  version: string
  title: string
  description?: string
  visibility: 'public' | 'followers' | 'private'
  year: number
  gridCols: number
  gridRows: number
  cells: PatternCellDto[]
}

// ========== 图案评论 ==========

export interface PatternCommentCreateDto {
  content: string
  parentId?: string | number
  replyToUserId?: string | number
}

export interface PatternCommentDto {
  id: string
  patternId: string
  parentId: string
  replyToUserId?: string
  replyToUserName?: string
  userId: string
  userName: string
  userAvatar?: string
  content: string
  likeCount: number
  createTime: string
  isOwner: boolean
  isLiked: boolean
  replyCount: number
  replies?: PatternCommentDto[]
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
  /**
   * @description 服务器展示名称（可选）。
   */
  displayName?: string
  /**
   * @description 服务器 IP（可选）。
   */
  ipAddress?: string
  /**
   * @description CPU 使用率百分比（可选）。
   */
  cpuUsage?: number
  /**
   * @description 内存使用率百分比（可选）。
   */
  ramUsage?: number
  /**
   * @description Swap 使用率百分比（可选）。
   */
  swapUsage?: number
  /**
   * @description 磁盘使用率百分比（可选）。
   */
  diskUsage?: number
}

// ========== 系统设置 ==========

/**
 * @description 系统设置响应。
 */
export interface SystemSettingsDto {
  allowRegister: boolean
  emailVerifyEnabled: boolean
  githubOAuthEnabled: boolean
  dataMigrationLastTime?: string
  autoDataMigrationOnStartup: boolean
}

/**
 * @description 更新系统设置请求。
 */
export interface SystemSettingsUpdateDto {
  allowRegister: boolean
  emailVerifyEnabled: boolean
  githubOAuthEnabled: boolean
  autoDataMigrationOnStartup: boolean
}

/**
 * @description 公共系统设置响应。
 */
export interface SystemPublicSettingsDto {
  allowRegister: boolean
  emailVerifyEnabled: boolean
  githubOAuthEnabled: boolean
}

// ========== 运维令牌 ==========

export interface OpsTokenQueryDto {
  pageIndex?: number
  pageSize?: number
  keyword?: string
  status?: number
}

export interface OpsTokenDto {
  id: string
  tokenName: string
  status: number
  remark?: string
  lastUsedTime?: string
  lastUsedByName?: string
  createUserName?: string
  updateUserName?: string
  createTime: string
  updateTime?: string
}

export interface OpsTokenCreateDto {
  tokenName: string
  token: string
  status: number
  remark?: string
}

export interface OpsTokenUpdateDto {
  id: string
  tokenName: string
  token?: string
  status: number
  remark?: string
}

// ========== 日志管理 ==========

export interface OperLogQueryDto {
  pageIndex?: number
  pageSize?: number
  keyword?: string
  status?: number
  startTime?: string
  endTime?: string
}

export interface OperLogDto {
  id: string
  userId?: string
  userName?: string
  action: string
  method?: string
  path?: string
  ip?: string
  userAgent?: string
  status: number
  resultCode?: number
  errorMsg?: string
  durationMs?: number
  createTime: string
}

export interface LoginLogQueryDto {
  pageIndex?: number
  pageSize?: number
  account?: string
  status?: number
  startTime?: string
  endTime?: string
}

export interface LoginLogDto {
  id: string
  userId?: string
  account?: string
  ip?: string
  userAgent?: string
  status: number
  message?: string
  createTime: string
}

export interface ServerLogQueryDto {
  pageIndex?: number
  pageSize?: number
  keyword?: string
  event?: string
  level?: number
  startTime?: string
  endTime?: string
}

export interface ServerLogDto {
  id: string
  level: number
  event: string
  message?: string
  detail?: string
  traceId?: string
  method?: string
  path?: string
  ip?: string
  userId?: string
  userName?: string
  machineName?: string
  environment?: string
  appVersion?: string
  createTime: string
}

export interface ServerLogFileDto {
  name: string
  size: number
  lastWriteTime: string
}

// ========== 数据字典 ==========

export interface DictTypeQueryDto {
  pageIndex?: number
  pageSize?: number
  keyword?: string
  status?: number
}

export interface DictTypeDto {
  id: string
  dictName: string
  dictType: string
  status: number
  remark?: string
  createTime: string
}

export interface DictTypeCreateDto {
  dictName: string
  dictType: string
  status: number
  remark?: string
}

export interface DictTypeUpdateDto extends DictTypeCreateDto {
  id: string
}

export interface DictDataQueryDto {
  pageIndex?: number
  pageSize?: number
  dictType?: string
  status?: number
}

export interface DictDataDto {
  id: string
  dictType: string
  dictLabel: string
  dictValue: string
  sort: number
  isDefault: boolean
  status: number
  remark?: string
  createTime: string
}

export interface DictDataCreateDto {
  dictType: string
  dictLabel: string
  dictValue: string
  sort: number
  isDefault: boolean
  status: number
  remark?: string
}

export interface DictDataUpdateDto extends DictDataCreateDto {
  id: string
}

// ========== 参数配置 ==========

export interface ConfigQueryDto {
  pageIndex?: number
  pageSize?: number
  keyword?: string
  status?: number
}

export interface ConfigDto {
  id: string
  configKey: string
  configValue?: string
  status: number
  remark?: string
  createTime: string
}

export interface ConfigCreateDto {
  configKey: string
  configValue?: string
  status: number
  remark?: string
}

export interface ConfigUpdateDto extends ConfigCreateDto {
  id: string
}

// ========== 仪表盘 ==========

export interface DashboardTrendDto {
  date: string
  success: number
  fail: number
}

export interface DashboardSummaryDto {
  userCount: string
  roleCount: string
  menuCount: string
  patternCount: string
  dictTypeCount: string
  configCount: string
  loginLogCount: string
  operLogCount: string
  loginTrend: DashboardTrendDto[]
  operTrend: DashboardTrendDto[]
  recentLoginLogs: LoginLogDto[]
  recentOperLogs: OperLogDto[]
}
