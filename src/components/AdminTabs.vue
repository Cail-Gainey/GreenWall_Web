<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { NIcon, NDropdown } from 'naive-ui'
import { storeToRefs } from 'pinia'
import { usePermissionStore } from '../stores/permission'
import { useAdminTabsStore } from '../stores/adminTabs'
import type { MenuTreeDto } from '../api/types'
import {
  Dashboard,
  User,
  UserMultiple,
  Menu as MenuTreeIcon,
  Settings,
  CloudMonitoring,
  Book,
  Tools,
  CloudLogging,
  Close,
} from '@vicons/carbon'

const route = useRoute()
const router = useRouter()
const permissionStore = usePermissionStore()
const tabsStore = useAdminTabsStore()
const { menus } = storeToRefs(permissionStore)

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

const findMenu = (nodes: MenuTreeDto[], path: string): MenuTreeDto | null => {
  for (const node of nodes) {
    if (node.menuType === 2 && node.path === path) return node
    if (node.children?.length) {
      const found = findMenu(node.children, path)
      if (found) return found
    }
  }
  return null
}

const resolveTitle = (path: string) =>
  findMenu(menus.value || [], path)?.menuName || (route.meta?.title as string) || route.name?.toString() || path

watch(
  () => [route.path, menus.value],
  () => {
    if (!route.path.startsWith('/admin')) return
    tabsStore.open(route.path, resolveTitle(route.path))
  },
  { immediate: true },
)

const active = computed({
  get: () => tabsStore.activePath || route.path,
  set: (value: string) => {
    tabsStore.setActive(value)
    if (value !== route.path) {
      router.push(value)
    }
  },
})

const renderIcon = (path: string) => {
  const iconKey = findMenu(menus.value || [], path)?.icon
  if (!iconKey) return null
  const IconComp = iconMap[iconKey]
  if (!IconComp) return null
  return IconComp
}

const handleClose = (path: string) => {
  const closingCurrent = path === route.path
  tabsStore.close(path)
  if (closingCurrent) {
    const next = tabsStore.activePath || '/admin'
    router.push(next)
  }
}

const dropdownX = ref(0)
const dropdownY = ref(0)
const dropdownShow = ref(false)
const dropdownTarget = ref('')

const dropdownOptions = computed(() => {
  const target = dropdownTarget.value
  const tabs = tabsStore.tabs
  const idx = tabs.findIndex((t) => t.path === target)
  const closable = tabs[idx]?.closable ?? false
  const hasLeftClosable = idx > 0 && tabs.slice(0, idx).some((t) => t.closable)
  const hasRightClosable = idx >= 0 && tabs.slice(idx + 1).some((t) => t.closable)
  const hasOtherClosable = tabs.some((t) => t.closable && t.path !== target)
  const hasAnyClosable = tabs.some((t) => t.closable)

  if (!target || idx < 0) {
    return [
      { label: '关闭全部', key: 'close_all', disabled: !hasAnyClosable },
    ]
  }

  return [
    { label: '关闭', key: 'close', disabled: !closable },
    { label: '关闭左侧', key: 'close_left', disabled: !hasLeftClosable },
    { label: '关闭右侧', key: 'close_right', disabled: !hasRightClosable },
    { label: '关闭其他', key: 'close_others', disabled: !hasOtherClosable },
    { label: '关闭全部', key: 'close_all', disabled: !hasAnyClosable },
  ]
})

const openContextMenu = (path: string, event: MouseEvent) => {
  event.preventDefault()
  dropdownTarget.value = path
  dropdownX.value = event.clientX
  dropdownY.value = event.clientY
  dropdownShow.value = true
}

const handleDropdownSelect = (key: string | number) => {
  const target = dropdownTarget.value
  switch (key) {
    case 'close':
      handleClose(target)
      break
    case 'close_left':
      tabsStore.closeLeft(target)
      break
    case 'close_right':
      tabsStore.closeRight(target)
      break
    case 'close_others':
      tabsStore.closeOthers(target)
      break
    case 'close_all':
      tabsStore.closeAll()
      break
  }
  dropdownShow.value = false
}
</script>

<template>
  <div class="admin-tabs" role="tablist">
    <div
      v-for="tab in tabsStore.tabs"
      :key="tab.path"
      class="tab-item"
      :class="{ active: active === tab.path }"
      role="tab"
      @click="active = tab.path"
      @contextmenu="openContextMenu(tab.path, $event)"
    >
      <n-icon v-if="renderIcon(tab.path)" size="16" class="tab-icon">
        <component :is="renderIcon(tab.path)" />
      </n-icon>
      <span class="tab-title">{{ tab.title }}</span>
      <button
        v-if="tab.closable"
        class="tab-close"
        @click.stop="handleClose(tab.path)"
        aria-label="关闭"
      >
        <n-icon size="14">
          <Close />
        </n-icon>
      </button>
    </div>
  </div>

  <n-dropdown
    trigger="manual"
    :x="dropdownX"
    :y="dropdownY"
    :options="dropdownOptions"
    :show="dropdownShow"
    @select="handleDropdownSelect"
    @clickoutside="dropdownShow = false"
  />
</template>

<style scoped>
.admin-tabs {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 8px;
  border-radius: 12px;
  background: var(--color-bg-light);
  border: 1px solid var(--color-border);
  overflow-x: auto;
}

.admin-tabs::-webkit-scrollbar {
  height: 6px;
}

.tab-item {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 6px 10px;
  border-radius: 10px;
  background: var(--color-surface);
  border: 1px solid transparent;
  color: var(--color-text-main);
  cursor: pointer;
  transition: all 0.2s;
  white-space: nowrap;
}

.tab-item.active {
  border-color: var(--color-primary);
  color: var(--color-primary);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
}

.tab-icon {
  display: inline-flex;
}

.tab-title {
  font-size: 12px;
  line-height: 1;
}

.tab-close {
  border: none;
  background: transparent;
  padding: 0;
  margin-left: 2px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  color: var(--color-text-muted);
}

.tab-close:hover {
  color: var(--color-text-main);
}
</style>
