<script setup lang="ts">
/**
 * @file 管理端布局：Naive UI 侧栏 + 顶部栏。
 */
import { computed, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { NLayout, NLayoutSider, NLayoutHeader, NLayoutContent, NMenu, NButton, NSpace, NDropdown, NAvatar } from 'naive-ui'
import { logout } from '../api/auth'
import { useGitHubStore } from '../stores/github'
import { usePermissionStore } from '../stores/permission'
import type { MenuTreeDto } from '../api/types'
import type { MenuOption } from 'naive-ui'
import AdminTabs from '../components/AdminTabs.vue'
import ProfileDialog from '../components/ProfileDialog.vue'
import { resolveAvatar, userAvatarFallback } from '../utils/avatar'
import logoUrl from '../assets/logo.png'
import { storeToRefs } from 'pinia'
import { useMenuTreeStore } from '../stores/menuTree'
import { useRoleListStore } from '../stores/roleList'
import { useUserListStore } from '../stores/userList'
import { usePushRecordStore } from '../stores/pushRecord'
import { useAdminTabsStore } from '../stores/adminTabs'
import { useTheme, type Theme } from '../composables/useTheme'
import { createThemeDropdownOptions, getThemeLabel, getThemeSwatchStyle } from '../theme/themeOptions'

const router = useRouter()
const route = useRoute()
const permissionStore = usePermissionStore()
const { menus, isLoaded, user } = storeToRefs(permissionStore)
const { loadPermission, hasPermission } = permissionStore
const githubStore = useGitHubStore()
const menuTreeStore = useMenuTreeStore()
const roleListStore = useRoleListStore()
const userListStore = useUserListStore()
const pushRecordStore = usePushRecordStore()
const adminTabsStore = useAdminTabsStore()
const { currentTheme, setTheme } = useTheme()
const showProfile = ref(false)

/**
 * @description 组件挂载时加载权限与菜单数据。
 */
onMounted(async () => {
  if (!isLoaded.value) {
    await loadPermission()
  }
})

/**
 * @description 根据后端菜单树构建 Naive UI 侧边栏菜单。
 * @returns {MenuOption[]} 菜单配置列表。
 */
const menuOptions = computed<MenuOption[]>(() => {
  const options: MenuOption[] = []
  const buildMenu = (menu: MenuTreeDto): MenuOption | null => {
    if (!menu.visible || menu.status !== 1) return null
    if (menu.menuType === 3) return null

    const children = (menu.children || [])
      .slice()
      .sort((a, b) => a.sort - b.sort)
      .map((child) => buildMenu(child))
      .filter((child): child is MenuOption => !!child)
    const hasChildren = children.length > 0

    if (menu.menuType === 1) {
      if (!hasChildren) return null
      return { key: `dir-${menu.id}`, label: menu.menuName, children }
    }

    if (menu.menuType === 2) {
      if (menu.path && !hasChildren) {
        return { key: menu.path, label: menu.menuName }
      }
      if (hasChildren) {
        return { key: `dir-${menu.id}`, label: menu.menuName, children }
      }
      if (menu.path) {
        return { key: menu.path, label: menu.menuName }
      }
    }

    return null
  }

  menus.value
    .slice()
    .sort((a, b) => a.sort - b.sort)
    .forEach((menu) => {
    const node = buildMenu(menu)
    if (node) options.push(node)
  })
  return options
})

const activeKey = computed(() => route.path)
const expandedKeys = ref<string[]>([])

const leafPaths = computed(() => {
  const paths: string[] = []
  const walk = (options: MenuOption[]) => {
    options.forEach((option) => {
      if (option.children && option.children.length > 0) {
        walk(option.children)
        return
      }
      if (typeof option.key === 'string' && !option.key.startsWith('dir-')) {
        paths.push(option.key)
      }
    })
  }
  walk(menuOptions.value)
  return paths
})

/**
 * @description 根据当前路由计算应展开的父级菜单键。
 * @param {string} targetPath 当前路由路径。
 * @returns {string[]} 需要展开的菜单键列表。
 */
function resolveExpandedKeys(targetPath: string) {
  const keys: string[] = []
  const dfs = (options: MenuOption[], parents: string[]): boolean => {
    for (const option of options) {
      const key = typeof option.key === 'string' ? option.key : String(option.key)
      if (option.children && option.children.length > 0) {
        if (dfs(option.children, [...parents, key])) {
          keys.push(...parents, key)
          return true
        }
        continue
      }
      if (key === targetPath) {
        keys.push(...parents)
        return true
      }
    }
    return false
  }
  dfs(menuOptions.value, [])
  return Array.from(new Set(keys))
}

/**
 * @description 管理后台主题下拉菜单选项。
 */
const themeOptions = createThemeDropdownOptions()

/**
 * @description 管理后台用户快捷菜单。
 * @returns {{ label: string; key: string }[]} 菜单项列表。
 */
const profileOptions = computed(() => {
  const options: Array<{ label: string; key: string }> = []
  if (hasPermission('app:profile:view')) {
    options.push({ label: '个人信息', key: 'profile' })
  }
  options.push({ label: '退出登录', key: 'logout' })
  return options
})

const avatarSrc = computed(() => resolveAvatar(user.value?.avatar))
const currentThemeLabel = computed(() => getThemeLabel(currentTheme.value))
const currentThemeSwatchStyle = computed(() => getThemeSwatchStyle(currentTheme.value))

/**
 * @description 处理侧边栏菜单选择并跳转到目标路由。
 * @param {string} key 菜单路由键。
 */
function handleSelect(key: string) {
  if (key.startsWith('dir-')) return
  router.push(key)
}

/**
 * @description 处理管理后台主题切换。
 * @param {string | number} key 选中的主题键。
 */
function handleThemeSelect(key: string | number) {
  setTheme(key as Theme)
}

/**
 * @description 处理管理后台个人菜单选择。
 * @param {string | number} key 选中的菜单键。
 */
function handleProfileSelect(key: string | number) {
  if (key === 'profile') {
    showProfile.value = true
    return
  }
  if (key === 'logout') handleLogout()
}

watch(
  () => menuOptions.value,
  (options) => {
    if (options.length === 0) return
    const available = leafPaths.value
    const current = activeKey.value
    if (!available.includes(current)) {
      router.push(available[0])
      return
    }
    expandedKeys.value = resolveExpandedKeys(current)
  },
  { immediate: true },
)

watch(
  () => activeKey.value,
  (path) => {
    if (menuOptions.value.length === 0) return
    expandedKeys.value = resolveExpandedKeys(path)
  },
)

/**
 * @description 执行退出登录并清理管理端本地状态。
 */
async function handleLogout() {
  const { reset } = usePermissionStore()
  try {
    await logout()
  } catch {
    // ignore logout errors, still clear local state
  }
  reset()
  localStorage.removeItem('token')
  localStorage.removeItem('user')
  githubStore.clear()
  menuTreeStore.reset()
  roleListStore.reset()
  userListStore.reset()
  pushRecordStore.reset()
  adminTabsStore.$reset()
  router.push('/')
}

</script>

<template>
  <n-layout class="admin-layout" has-sider>
    <n-layout-sider width="240" bordered>
      <button class="brand" type="button" @click="router.push('/admin')">
        <img :src="logoUrl" alt="logo" class="brand-logo" />
        <div class="brand-text">
          <div class="brand-title">GreenWall</div>
        </div>
      </button>
      <n-menu
        :options="menuOptions"
        :value="activeKey"
        :expanded-keys="expandedKeys"
        @update:expanded-keys="(keys) => (expandedKeys = keys as string[])"
        @update:value="handleSelect"
        accordion
      />
    </n-layout-sider>
    <n-layout class="admin-main">
      <n-layout-header bordered class="admin-header">
        <div class="header-title">管理后台</div>
        <n-space align="center">
          <n-dropdown :options="themeOptions" @select="handleThemeSelect">
            <n-button size="small" quaternary>
              <span class="theme-trigger"><span class="theme-swatch" :style="currentThemeSwatchStyle"></span>主题：{{ currentThemeLabel }}</span>
            </n-button>
          </n-dropdown>
          <n-button size="small" quaternary @click="router.push('/')">前往前台</n-button>
          <n-dropdown v-if="user" trigger="hover" :options="profileOptions" @select="handleProfileSelect">
            <n-button size="small" quaternary>
              <n-space align="center" size="small">
                <n-avatar size="small" :src="avatarSrc" :fallback-src="userAvatarFallback" :img-props="{ referrerpolicy: 'no-referrer' }" />
                <span class="header-user">{{ user.nickName || user.account }}</span>
              </n-space>
            </n-button>
          </n-dropdown>
        </n-space>
      </n-layout-header>
      <AdminTabs />
      <n-layout-content class="admin-content">
        <div class="admin-scroll-container">
          <router-view></router-view>
        </div>
      </n-layout-content>
    </n-layout>
    <ProfileDialog v-if="user" v-model:show="showProfile" />
  </n-layout>
</template>

<style scoped>
.admin-layout {
  height: 100vh;
  overflow: hidden;
}

.admin-main {
  height: 100vh;
  overflow: hidden;
}

.brand {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 18px 16px 10px;
  border: none;
  background: transparent;
  cursor: pointer;
  width: 100%;
  text-align: left;
}

.brand:hover {
  background: transparent;
}

.brand-logo {
  width: 28px;
  height: 28px;
  object-fit: contain;
}

.brand-title {
  font-weight: 700;
  font-size: 1rem;
  color: var(--color-text-main);
}


.admin-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 20px;
  height: 64px;
}

.header-title {
  font-weight: 600;
  font-size: 1rem;
}

.header-user {
  font-size: 0.85rem;
  color: var(--color-text-muted);
}

.theme-trigger {
  display: inline-flex;
  align-items: center;
  gap: 8px;
}

.theme-swatch {
  flex-shrink: 0;
}

.admin-content {
  flex: 1;
  min-height: 0;
  padding: 20px;
  overflow: hidden;
}

.admin-scroll-container {
  height: 100%;
  min-height: 0;
  overflow: auto;
}
</style>
