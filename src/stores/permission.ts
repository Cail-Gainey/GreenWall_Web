/**
 * @file 权限状态管理 Store，使用 Pinia + 持久化。
 */
import { defineStore } from 'pinia'
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

/**
 * @description 权限状态管理。
 */
export const usePermissionStore = defineStore('permission', {
  state: (): PermissionState => ({
    user: null,
    roles: [],
    permissions: [],
    menus: [],
    isLoaded: false,
  }),
  actions: {
    /**
     * @description 从后端加载权限数据 (调用 /Auth/me + /Permission/menus)。
     */
    async loadPermission(): Promise<UserProfileDto | null> {
      try {
        const res = await getMe()
        const user = res.data.data
        this.user = user
        this.roles = user.roles || []
        this.permissions = user.permissions || []

        // 加载菜单树
        try {
          const menuRes = await getUserMenus()
          this.menus = menuRes.data.data || []
        } catch {
          this.menus = []
        }

        this.isLoaded = true
        return user
      } catch {
        this.reset()
        return null
      }
    },
    /**
     * @description 判断当前用户是否拥有指定权限。
     */
    hasPermission(perm: string): boolean {
      if (this.roles.includes('admin')) return true
      return this.permissions.includes(perm)
    },
    /**
     * @description 判断当前用户是否拥有指定角色。
     */
    hasRole(role: string): boolean {
      return this.roles.includes(role)
    },
    /**
     * @description 清空所有权限状态。
     */
    reset() {
      this.user = null
      this.roles = []
      this.permissions = []
      this.menus = []
      this.isLoaded = false
    },
  },
  persist: {
    key: 'permission_store',
    paths: ['user', 'roles', 'permissions', 'menus', 'isLoaded'],
  },
})
