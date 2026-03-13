<script setup lang="ts">
/**
 * @file 管理端布局：Naive UI 侧栏 + 顶部栏。
 */
import { computed, onMounted, ref, h, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { NLayout, NLayoutSider, NLayoutHeader, NLayoutContent, NMenu, NButton, NIcon } from 'naive-ui'
import { logout } from '../api/auth'
import { useGitHubStore } from '../stores/github'
import { usePermissionStore } from '../stores/permission'
import type { MenuTreeDto } from '../api/types'
import type { MenuOption } from 'naive-ui'
import { storeToRefs } from 'pinia'
import { useMenuTreeStore } from '../stores/menuTree'
import { useRoleListStore } from '../stores/roleList'
import { useUserListStore } from '../stores/userList'
import { usePushRecordStore } from '../stores/pushRecord'
import AdminHeader from '../components/AdminHeader.vue'
import ProfileDialog from '../components/ProfileDialog.vue'
import AdminTabs from '../components/AdminTabs.vue'
import AdminBreadcrumb from '../components/AdminBreadcrumb.vue'
import {
  Menu as MenuIcon,
  Dashboard,
  User,
  UserMultiple,
  Menu as MenuTreeIcon,
  Settings,
  CloudMonitoring,
  Book,
  Tools,
  CloudLogging,
} from '@vicons/carbon'
import logoUrl from '../assets/logo.png'

const router = useRouter()
const route = useRoute()
const permissionStore = usePermissionStore()
const { menus, isLoaded, user } = storeToRefs(permissionStore)
const { loadPermission } = permissionStore
const githubStore = useGitHubStore()
const menuTreeStore = useMenuTreeStore()
const roleListStore = useRoleListStore()
const userListStore = useUserListStore()
const pushRecordStore = usePushRecordStore()
const collapsed = ref(false)
const showProfileDialog = ref(false)

onMounted(async () => {
  if (!isLoaded.value) {
    await loadPermission()
  }
})

const iconMap: Record<string, any> = {
  dashboard: Dashboard,
  user: User,
  team: UserMultiple,
  menu: MenuTreeIcon,
  setting: Settings,
  monitor: CloudMonitoring,
  book: Book,
  tool: Tools,
  log: CloudLogging,
}

const renderMenuIcon = (icon?: string | null) => {
  if (!icon) return undefined
  const IconComp = iconMap[icon]
  if (!IconComp) return undefined
  return () => h(NIcon, null, { default: () => h(IconComp) })
}

const groupIconMap: Record<string, any> = {
  overview: Dashboard,
  manage: UserMultiple,
  monitor: CloudMonitoring,
  config: Settings,
  logs: CloudLogging,
  other: MenuTreeIcon,
}

const renderGroupIcon = (key: string) => {
  const IconComp = groupIconMap[key]
  if (!IconComp) return undefined
  return () => h(NIcon, null, { default: () => h(IconComp) })
}

const adminItems = computed(() => {
  const items: Array<MenuTreeDto & { path?: string }> = []
  const collect = (menu: MenuTreeDto) => {
    if (menu.menuType === 2 && menu.path?.startsWith('/admin')) {
      items.push(menu)
      return
    }
    menu.children?.forEach(collect)
  }
  menus.value.forEach(collect)
  return items.sort((a, b) => (a.sort || 0) - (b.sort || 0))
})

const groups = [
  {
    key: 'overview',
    label: '概览',
    match: (m: MenuTreeDto) => m.path === '/admin',
  },
  {
    key: 'manage',
    label: '系统管理',
    match: (m: MenuTreeDto) => ['/admin/users', '/admin/roles', '/admin/menus'].includes(m.path || ''),
  },
  {
    key: 'monitor',
    label: '系统监控',
    match: (m: MenuTreeDto) => m.path === '/admin/monitor',
  },
  {
    key: 'config',
    label: '系统设置',
    match: (m: MenuTreeDto) => ['/admin/settings', '/admin/dicts', '/admin/params'].includes(m.path || ''),
  },
  {
    key: 'logs',
    label: '日志审计',
    match: (m: MenuTreeDto) => (m.path || '').startsWith('/admin/logs/'),
  },
]

const menuOptions = computed<MenuOption[]>(() => {
  const items = adminItems.value
  const makeItem = (menu: MenuTreeDto): MenuOption => ({
    key: menu.path!,
    label: menu.menuName,
    icon: renderMenuIcon(menu.icon),
  })

  if (collapsed.value) {
    return items.map(makeItem)
  }

  const used = new Set<MenuTreeDto>()
  const grouped: MenuOption[] = groups.map((group) => {
    const children = items.filter((m) => group.match(m)).map((m) => {
      used.add(m)
      return makeItem(m)
    })
    return { key: `group-${group.key}`, label: group.label, icon: renderGroupIcon(group.key), children }
  }).filter((g) => (g as any).children.length > 0)

  const leftovers = items.filter((m) => !used.has(m))
  if (leftovers.length > 0) {
    grouped.push({
      key: 'group-other',
      label: '其他',
      icon: renderGroupIcon('other'),
      children: leftovers.map(makeItem),
    })
  }

  return grouped
})

const expandedKeys = ref<string[]>([])

const resolveGroupKey = (path: string) => {
  const items = adminItems.value
  const target = items.find((m) => m.path === path)
  if (!target) return ''
  const matched = groups.find((g) => g.match(target))
  return matched ? `group-${matched.key}` : 'group-other'
}

watch(
  () => [route.path, collapsed.value, adminItems.value.length],
  () => {
    if (collapsed.value) {
      expandedKeys.value = []
      return
    }
    const key = resolveGroupKey(route.path)
    expandedKeys.value = key ? [key] : []
  },
  { immediate: true },
)

const handleExpandedKeys = (keys: string[] | string) => {
  const next = Array.isArray(keys) ? keys : [keys]
  expandedKeys.value = next.slice(0, 1)
}

const activeKey = computed(() => route.path)

function handleSelect(key: string) {
  if (key.startsWith('dir-')) return
  router.push(key)
}

async function handleLogout() {
  const { reset } = usePermissionStore()
  try {
    await logout()
  } catch {
    // ignore logout errors, still clear local state
  }
  reset()
  localStorage.removeItem('user')
  githubStore.clear()
  menuTreeStore.reset()
  roleListStore.reset()
  userListStore.reset()
  pushRecordStore.reset()
  router.push('/')
}

const toggleCollapsed = () => {
  collapsed.value = !collapsed.value
}
</script>

<template>
  <n-layout class="admin-layout">
    <n-layout-header bordered class="admin-header">
      <AdminHeader
        :user="user"
        :show-brand="false"
        @open-profile="showProfileDialog = true"
        @logout="handleLogout"
      >
        <template #left>
          <n-button quaternary size="small" @click="toggleCollapsed">
            <n-icon size="18">
              <MenuIcon />
            </n-icon>
          </n-button>
          <span class="admin-title">管理后台</span>
          <AdminBreadcrumb />
        </template>
      </AdminHeader>
    </n-layout-header>
    <n-layout has-sider class="admin-body">
      <n-layout-sider
        bordered
        collapse-mode="width"
        :collapsed="collapsed"
        :collapsed-width="56"
        :width="200"
      >
        <div class="brand" :class="{ collapsed }">
          <img :src="logoUrl" alt="logo" class="brand-logo" />
          <span class="brand-name">GreenWall</span>
        </div>
        <n-menu
          :options="menuOptions"
          :value="activeKey"
          :collapsed="collapsed"
          :collapsed-width="64"
          :expanded-keys="expandedKeys"
          :indent="18"
          :icon-size="18"
          :collapsed-icon-size="20"
          @update:value="handleSelect"
          @update:expanded-keys="handleExpandedKeys"
          accordion
        />
      </n-layout-sider>
      <n-layout-content class="admin-content">
        <div class="admin-nav">
          <AdminTabs />
        </div>
        <div class="admin-scroll">
          <router-view></router-view>
        </div>
      </n-layout-content>
    </n-layout>
  </n-layout>

  <ProfileDialog v-model:show="showProfileDialog" />
</template>

<style scoped>
.admin-layout {
  height: 100vh;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.admin-layout :deep(.n-layout-scroll-container) {
  overflow: hidden !important;
}


.admin-header {
  flex: 0 0 auto;
  position: sticky;
  top: 0;
  z-index: 5;
  background: var(--color-surface);
}

.admin-body {
  flex: 1;
  min-height: 0;
  height: calc(100vh - 64px);
  overflow: hidden;
}

.admin-body :deep(.n-layout-sider) {
  height: 100%;
  position: sticky;
  top: 0;
  align-self: flex-start;
}

.admin-body :deep(.n-layout-scroll-container) {
  height: 100%;
  overflow: hidden;
}

.brand {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 0 8px;
  justify-content: center;
}

.brand-logo {
  width: 32px;
  height: 32px;
  object-fit: contain;
}

.brand-name {
  font-weight: 700;
  font-size: 1.05rem;
  letter-spacing: 0.06em;
  background: linear-gradient(120deg, var(--color-primary), var(--color-info));
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
  text-shadow: 0 1px 6px rgba(0, 0, 0, 0.15);
  transition: opacity 0.28s cubic-bezier(0.22, 1, 0.36, 1),
    transform 0.28s cubic-bezier(0.22, 1, 0.36, 1),
    max-width 0.28s cubic-bezier(0.22, 1, 0.36, 1);
  max-width: 120px;
  overflow: hidden;
  white-space: nowrap;
}

.brand.collapsed .brand-name {
  opacity: 0;
  transform: translateX(-6px);
  max-width: 0;
}

.brand-title {
  font-weight: 700;
  font-size: 1rem;
}

.brand-sub {
  font-size: 0.75rem;
  color: var(--color-text-muted);
}

.admin-content {
  padding: 20px;
  display: flex;
  flex-direction: column;
  gap: 12px;
  flex: 1;
  min-height: 0;
  min-width: 0;
  overflow: hidden;
  height: 100%;
  align-items: stretch;
}

.admin-title {
  font-weight: 600;
  font-size: 0.95rem;
  color: var(--color-text-muted);
}

.admin-nav {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.admin-scroll {
  flex: 1;
  min-height: 0;
  min-width: 0;
  width: 100%;
  align-self: stretch;
  overflow: auto;
  height: 100%;
  overscroll-behavior: contain;
}

.admin-body :deep(.n-layout-content) {
  overflow: hidden;
  flex: 1;
  min-width: 0;
}

.admin-body :deep(.n-layout-sider) {
  transition: width 0.28s cubic-bezier(0.22, 1, 0.36, 1);
}

.admin-body :deep(.n-menu) {
  transition: padding 0.28s cubic-bezier(0.22, 1, 0.36, 1);
}

.admin-body :deep(.n-layout-sider-scroll-container) {
  height: 100%;
  display: flex;
  flex-direction: column;
}

.admin-body :deep(.n-menu) {
  flex: 1;
}

</style>
