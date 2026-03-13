/**
 * @file 权限状态管理 Store，使用 Vue reactive 实现。
 */
import { reactive, toRefs } from 'vue'
import { getMe } from '../api/auth'
import { getUserMenus } from '../api/permission'
import type { UserProfileDto, MenuTreeDto } from '../api/types'

interface PermissionState {
  /** 当前用户信息 */
  user: UserProfileDto | null
  /** 用户角色编码列表 */
  roles: string[]
  /** 用户权限标识列表 */
  permissions: string[]
  /** 用户可访问菜单树 */
  menus: MenuTreeDto[]
  /** 权限数据是否已加载 */
  isLoaded: boolean
}

const state = reactive<PermissionState>({
  user: null,
  roles: [],
  permissions: [],
  menus: [],
  isLoaded: false,
})

/**
 * @description 从后端加载权限数据 (调用 /Auth/me + /Permission/menus)。
 */
async function loadPermission(): Promise<UserProfileDto | null> {
  try {
    const res = await getMe()
    const user = res.data.data
    state.user = user
    state.roles = user.roles || []
    state.permissions = user.permissions || []
    localStorage.setItem('user', JSON.stringify(user))

    // 加载菜单树
    try {
      const menuRes = await getUserMenus()
      state.menus = menuRes.data.data || []
    } catch {
      state.menus = []
    }

    state.isLoaded = true
    return user
  } catch {
    reset()
    return null
  }
}

/**
 * @description 判断当前用户是否拥有指定权限。
 */
function hasPermission(perm: string): boolean {
  if (state.roles.includes('admin')) return true
  return state.permissions.includes(perm)
}

/**
 * @description 判断当前用户是否拥有指定角色。
 */
function hasRole(role: string): boolean {
  return state.roles.includes(role)
}

/**
 * @description 清空所有权限状态。
 */
function reset() {
  state.user = null
  state.roles = []
  state.permissions = []
  state.menus = []
  state.isLoaded = false
}

export function usePermissionStore() {
  return {
    ...toRefs(state),
    loadPermission,
    hasPermission,
    hasRole,
    reset,
  }
}
