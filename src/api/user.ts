/**
 * @file 用户管理接口封装。
 */
import request from './request'
import type { ApiResult, PageResult, UserCreateDto, UserDataDeletionDto, UserDto, UserFollowStatusDto, UserListItemDto, UserPrivacyConsentUpdateDto, UserProfileUpdateDto, UserPublicProfileDto, UserQueryDto, UserUpdateDto } from './types'

/**
 * @description 创建用户（需要 sys:user:add 权限）。
 * @param {UserCreateDto} data 用户创建参数。
 */
export function createUser(data: UserCreateDto) {
  return request.post<ApiResult<string>>('/User', data)
}

/**
 * @description 获取用户信息（需要认证）。
 * @param {number} id 用户 ID。
 */
export function getUserInfo(id: string) {
  return request.get<ApiResult<UserDto>>(`/User/${id}`)
}

export function getPublicUserProfile(id: string) {
  return request.get<ApiResult<UserPublicProfileDto>>(`/User/public/${id}`)
}

/**
 * @description 分页查询用户列表（需要 sys:user:list 权限）。
 * @param {UserQueryDto} params 查询参数。
 */
export function getUserPage(params: UserQueryDto) {
  return request.get<ApiResult<PageResult<UserListItemDto>>>('/User', { params })
}

/**
 * @description 更新用户信息（需要 sys:user:edit 权限）。
 * @param {UserUpdateDto} data 更新参数。
 */
export function updateUser(data: UserUpdateDto) {
  return request.put<ApiResult<boolean>>('/User', data)
}

/**
 * @description 更新个人资料（需要 app:profile:edit 权限）。
 * @param {UserProfileUpdateDto} data 个人资料更新参数。
 */
export function updateProfile(data: UserProfileUpdateDto) {
  return request.put<ApiResult<boolean>>('/User/profile', data)
}

/**
 * @description 上传头像（需要 app:profile:edit 权限）。
 * @param file 头像文件
 */
export function uploadAvatar(file: File) {
  const form = new FormData()
  form.append('file', file)
  return request.post<ApiResult<string>>('/User/avatar', form, {
    headers: { 'Content-Type': 'multipart/form-data' },
  })
}

/**
 * @description 删除用户（需要 sys:user:delete 权限）。
 * @param {number} id 用户 ID。
 */
export function deleteUser(id: string) {
  return request.delete<ApiResult<boolean>>(`/User/${id}`)
}

export function updatePrivacyConsent(data: UserPrivacyConsentUpdateDto) {
  return request.put<ApiResult<boolean>>('/User/privacy-consent', data)
}

export function deleteCurrentUserData(data: UserDataDeletionDto) {
  return request.post<ApiResult<boolean>>('/User/delete-data', data)
}

export function getFollowStatus(userId: string) {
  return request.get<ApiResult<UserFollowStatusDto>>(`/User/follows/${userId}`)
}

export function followUser(userId: string) {
  return request.post<ApiResult<boolean>>(`/User/follows/${userId}`)
}

export function unfollowUser(userId: string) {
  return request.delete<ApiResult<boolean>>(`/User/follows/${userId}`)
}
