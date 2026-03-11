<script setup lang="ts">
/**
 * @file 管理端布局：Naive UI 侧栏 + 顶部栏。
 */
import { computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { NLayout, NLayoutSider, NLayoutHeader, NLayoutContent, NMenu, NButton, NSpace, NAvatar } from 'naive-ui'
import { usePermissionStore } from '../stores/permission'
import type { MenuTreeDto } from '../api/types'
import type { MenuOption } from 'naive-ui'

const router = useRouter()
const route = useRoute()
const { menus, isLoaded, loadPermission, user } = usePermissionStore()

onMounted(async () => {
  if (!isLoaded.value) {
    await loadPermission()
  }
})

const menuOptions = computed<MenuOption[]>(() => {
  const options: MenuOption[] = []
  const buildMenu = (menu: MenuTreeDto): MenuOption | null => {
    if (menu.menuType === 2 && menu.path) {
      return { key: menu.path, label: menu.menuName }
    }
    if (menu.menuType === 1) {
      const children = (menu.children || [])
        .map((child) => buildMenu(child))
        .filter((child): child is MenuOption => !!child)
      if (children.length === 0) return null
      return { key: `dir-${menu.id}`, label: menu.menuName, children }
    }
    return null
  }

  menus.value.forEach((menu) => {
    const node = buildMenu(menu)
    if (node) options.push(node)
  })
  return options
})

const activeKey = computed(() => route.path)

function handleSelect(key: string) {
  if (key.startsWith('dir-')) return
  router.push(key)
}

function handleLogout() {
  const { reset } = usePermissionStore()
  reset()
  localStorage.removeItem('token')
  localStorage.removeItem('user')
  router.push('/')
}
</script>

<template>
  <n-layout class="admin-layout" has-sider>
    <n-layout-sider width="240" bordered>
      <div class="brand">
        <div class="brand-badge">G</div>
        <div class="brand-text">
          <div class="brand-title">GreenWall</div>
          <div class="brand-sub">Admin Console</div>
        </div>
      </div>
      <n-menu
        :options="menuOptions"
        :value="activeKey"
        @update:value="handleSelect"
        accordion
      />
    </n-layout-sider>
    <n-layout>
      <n-layout-header bordered class="admin-header">
        <div class="header-title">管理后台</div>
        <n-space align="center">
          <n-space v-if="user" align="center" size="small">
            <n-avatar size="small">{{ (user.nickName || user.account).slice(0, 1).toUpperCase() }}</n-avatar>
            <span class="header-user">{{ user.nickName || user.account }}</span>
          </n-space>
          <n-button size="small" secondary @click="handleLogout">退出</n-button>
        </n-space>
      </n-layout-header>
      <n-layout-content class="admin-content">
        <router-view></router-view>
      </n-layout-content>
    </n-layout>
  </n-layout>
</template>

<style scoped>
.admin-layout {
  height: 100vh;
}

.brand {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 18px 16px 10px;
}

.brand-badge {
  width: 36px;
  height: 36px;
  border-radius: 10px;
  background: var(--color-primary);
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  font-size: 1.1rem;
}

.brand-title {
  font-weight: 700;
  font-size: 1rem;
}

.brand-sub {
  font-size: 0.75rem;
  color: var(--color-text-muted);
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

.admin-content {
  padding: 20px;
}
</style>
