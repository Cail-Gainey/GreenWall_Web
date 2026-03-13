/**
 * @file 应用路由配置：区分用户端与管理端布局，包含路由守卫。
 */
import { createRouter, createWebHistory } from 'vue-router'
import { storeToRefs } from 'pinia'
import { usePermissionStore } from '../stores/permission'

/**
 * @description 路由 meta 类型声明。
 */
declare module 'vue-router' {
  interface RouteMeta {
    requiresAuth?: boolean
    roles?: string[]
    permission?: string
  }
}

/**
 * @description 创建并导出路由实例。
 */
const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      component: () => import('../layouts/UserLayout.vue'),
      children: [
        {
          path: '',
          name: 'home',
          component: () => import('../views/user/HomeView.vue')
        },
        {
          path: 'community',
          name: 'community',
          component: () => import('../views/user/CommunityView.vue')
        }
      ]
    },
    {
      path: '/oauth/callback',
      name: 'oauth-callback',
      component: () => import('../views/user/OAuthCallback.vue')
    },
    {
      path: '/admin',
      component: () => import('../layouts/AdminLayout.vue'),
      meta: { requiresAuth: true },
      children: [
        {
          path: '',
          name: 'admin-dashboard',
          component: () => import('../views/admin/DashboardView.vue'),
          meta: { permission: 'sys:dashboard' }
        },
        {
          path: 'users',
          name: 'admin-users',
          component: () => import('../views/admin/UserList.vue'),
          meta: { permission: 'sys:user:list' }
        },
        {
          path: 'roles',
          name: 'admin-roles',
          component: () => import('../views/admin/RoleList.vue'),
          meta: { permission: 'sys:role:list' }
        },
        {
          path: 'menus',
          name: 'admin-menus',
          component: () => import('../views/admin/MenuList.vue'),
          meta: { permission: 'sys:menu:list' }
        },
        {
          path: 'monitor',
          name: 'admin-monitor',
          component: () => import('../views/admin/MonitorView.vue'),
          meta: { permission: 'sys:monitor:view' }
        },
        {
          path: 'settings',
          name: 'admin-settings',
          component: () => import('../views/admin/SystemSettingsView.vue'),
          meta: { permission: 'sys:config:view' }
        }
      ]
    },
    {
      path: '/403',
      name: 'forbidden',
      component: () => import('../views/error/403.vue')
    }
  ]
})

/**
 * @description 全局路由守卫：认证 + 权限校验。
 */
router.beforeEach(async (to) => {
  const token = localStorage.getItem('token')
  const permissionStore = usePermissionStore()
  const { isLoaded } = storeToRefs(permissionStore)
  const { loadPermission, hasRole, hasPermission } = permissionStore

  // 不需要认证的路由直接放行
  if (!to.matched.some((r) => r.meta.requiresAuth)) {
    return true
  }

  // 需要认证但无 token → 回首页
  if (!token) {
    return { path: '/' }
  }

  // 如果权限数据尚未加载，先加载
  if (!isLoaded.value) {
    const user = await loadPermission()
    if (!user) {
      localStorage.removeItem('token')
      localStorage.removeItem('user')
      return { path: '/' }
    }
  }

  // 检查角色
  const requiredRoles = to.matched.reduce<string[]>((acc, r) => {
    if (r.meta.roles) acc.push(...r.meta.roles)
    return acc
  }, [])
  if (requiredRoles.length > 0 && !requiredRoles.some((r) => hasRole(r))) {
    return { name: 'forbidden' }
  }

  // 检查权限标识
  const requiredPerms = to.matched.reduce<string[]>((acc, r) => {
    if (r.meta.permission) acc.push(r.meta.permission)
    return acc
  }, [])
  if (requiredPerms.length > 0 && !requiredPerms.every((p) => hasPermission(p))) {
    return { name: 'forbidden' }
  }

  return true
})

export default router
