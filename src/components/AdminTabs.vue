<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { NIcon } from 'naive-ui'
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

/* ---- 右键菜单 ---- */
const menuRef = ref<HTMLElement | null>(null)
const menuVisible = ref(false)
const menuX = ref(0)
const menuY = ref(0)
const menuTarget = ref('')

const isClosable = (tab?: { closable: boolean; pinned?: boolean } | null) =>
  Boolean(tab && tab.closable && !tab.pinned)

const menuState = computed(() => {
  const target = menuTarget.value
  const tabs = tabsStore.tabs
  const idx = tabs.findIndex((t) => t.path === target)
  const pinned = tabs[idx]?.pinned ?? false
  const isCurrent = target === route.path
  const hasLeftClosable = idx > 0 && tabs.slice(0, idx).some((t) => isClosable(t))
  const hasRightClosable = idx >= 0 && tabs.slice(idx + 1).some((t) => isClosable(t))
  const hasOtherClosable = tabs.some((t) => isClosable(t) && t.path !== target)
  const hasAnyClosable = tabs.some((t) => isClosable(t))

  return {
    isCurrent,
    pinned,
    hasLeftClosable,
    hasRightClosable,
    hasOtherClosable,
    hasAnyClosable,
    pinLabel: pinned ? '取消固定' : '固定',
    canPin: target !== '/admin',
  }
})

function clampMenuPosition() {
  const menuEl = menuRef.value
  if (!menuEl) return
  const { innerWidth, innerHeight } = window
  const rect = menuEl.getBoundingClientRect()
  const padding = 8
  if (menuX.value + rect.width > innerWidth - padding) {
    menuX.value = Math.max(padding, innerWidth - rect.width - padding)
  }
  if (menuY.value + rect.height > innerHeight - padding) {
    menuY.value = Math.max(padding, innerHeight - rect.height - padding)
  }
}

function closeMenu() {
  menuVisible.value = false
}

function handleMenuAction(key: string) {
  closeMenu()
  const target = menuTarget.value
  switch (key) {
    case 'refresh':
      if (target === route.path) {
        tabsStore.refresh()
      }
      break
    case 'pin':
      tabsStore.togglePin(target)
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
}

/**
 * 唯一的 contextmenu 监听器，注册在 document 上（capture + passive:false）。
 * 不依赖任何 ref、不依赖事件冒泡。
 */
function onDocumentContextMenu(e: MouseEvent) {
  const el = e.target as HTMLElement | null
  if (!el) return

  // 点在自定义菜单内 → 仅阻止浏览器菜单
  if (menuRef.value?.contains(el)) {
    e.preventDefault()
    return
  }

  // 点在 tab-item 上 → 阻止浏览器菜单 + 显示自定义菜单
  const tabItem = el.closest?.('[data-tab-path]') as HTMLElement | null
  if (tabItem) {
    e.preventDefault()
    e.stopImmediatePropagation()
    const path = tabItem.getAttribute('data-tab-path')
    if (path) {
      menuTarget.value = path
      menuX.value = e.clientX
      menuY.value = e.clientY
      menuVisible.value = true
      nextTick(() => clampMenuPosition())
    }
    return
  }

  // 点在标签栏空白区域 → 关闭已打开的菜单
  const bar = el.closest?.('.admin-tabs')
  if (bar) {
    e.preventDefault()
    closeMenu()
    return
  }

  // 其他区域 → 关闭菜单
  closeMenu()
}

function onDocPointerDown(e: PointerEvent) {
  if (!menuVisible.value) return
  if (menuRef.value?.contains(e.target as Node)) return
  closeMenu()
}

onMounted(() => {
  document.addEventListener('contextmenu', onDocumentContextMenu, {
    capture: true,
    passive: false,
  })
  document.addEventListener('pointerdown', onDocPointerDown)
  window.addEventListener('blur', closeMenu)
})

onBeforeUnmount(() => {
  document.removeEventListener('contextmenu', onDocumentContextMenu, { capture: true } as EventListenerOptions)
  document.removeEventListener('pointerdown', onDocPointerDown)
  window.removeEventListener('blur', closeMenu)
})
</script>

<template>
  <div class="admin-tabs" role="tablist">
    <div
      v-for="tab in tabsStore.tabs"
      :key="tab.path"
      class="tab-item"
      :class="{ active: active === tab.path }"
      :data-tab-path="tab.path"
      role="tab"
      @click="active = tab.path"
    >
      <n-icon v-if="renderIcon(tab.path)" size="16" class="tab-icon">
        <component :is="renderIcon(tab.path)" />
      </n-icon>
      <span class="tab-title">{{ tab.title }}</span>
      <button
        v-if="isClosable(tab)"
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

  <Teleport to="body">
    <div
      v-show="menuVisible"
      ref="menuRef"
      class="admin-tabs-ctx-menu"
      :style="{ left: menuX + 'px', top: menuY + 'px' }"
    >
      <div
        class="ctx-item"
        :class="{ disabled: !menuState.isCurrent }"
        @click="menuState.isCurrent && handleMenuAction('refresh')"
      >刷新</div>
      <div
        class="ctx-item"
        :class="{ disabled: !menuState.canPin }"
        @click="menuState.canPin && handleMenuAction('pin')"
      >{{ menuState.pinLabel }}</div>
      <div class="ctx-divider"></div>
      <div
        class="ctx-item"
        :class="{ disabled: !menuState.hasLeftClosable }"
        @click="menuState.hasLeftClosable && handleMenuAction('close_left')"
      >关闭左侧</div>
      <div
        class="ctx-item"
        :class="{ disabled: !menuState.hasRightClosable }"
        @click="menuState.hasRightClosable && handleMenuAction('close_right')"
      >关闭右侧</div>
      <div
        class="ctx-item"
        :class="{ disabled: !menuState.hasOtherClosable }"
        @click="menuState.hasOtherClosable && handleMenuAction('close_others')"
      >关闭其他</div>
      <div
        class="ctx-item"
        :class="{ disabled: !menuState.hasAnyClosable }"
        @click="menuState.hasAnyClosable && handleMenuAction('close_all')"
      >关闭全部</div>
    </div>
  </Teleport>
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

<style>
.admin-tabs-ctx-menu {
  position: fixed;
  z-index: 99999;
  min-width: 140px;
  padding: 4px 0;
  background: #fff;
  border: 1px solid #e5e7eb;
  border-radius: 6px;
  box-shadow: 0 6px 16px rgba(0, 0, 0, 0.12);
  font-size: 13px;
  color: #333;
  user-select: none;
}

.admin-tabs-ctx-menu .ctx-item {
  padding: 6px 16px;
  cursor: pointer;
  transition: background 0.15s;
}

.admin-tabs-ctx-menu .ctx-item:hover {
  background: #f3f4f6;
}

.admin-tabs-ctx-menu .ctx-item.disabled {
  color: #c0c4cc;
  cursor: not-allowed;
}

.admin-tabs-ctx-menu .ctx-item.disabled:hover {
  background: transparent;
}

.admin-tabs-ctx-menu .ctx-divider {
  height: 1px;
  margin: 4px 8px;
  background: #e5e7eb;
}
</style>
