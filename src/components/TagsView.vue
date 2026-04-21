<script setup lang="ts">
/**
 * @file 管理端标签页导航栏，支持右键菜单操作。
 */
import { nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useTabNavStore } from '../stores/tabNav'

const route = useRoute()
const router = useRouter()
const tabNav = useTabNavStore()

/* ---- 右键菜单状态 ---- */
const menuVisible = ref(false)
const menuX = ref(0)
const menuY = ref(0)
const menuTabPath = ref('')
const menuIsAffix = ref(false)

/* ---- 路由 → 标签页 ---- */
function syncRoute() {
  const path = route.path
  const title = route.meta?.title as string | undefined
  if (!path.startsWith('/admin') || !title) return
  const affix = !!route.meta?.affix
  tabNav.addTab(path, title, affix)
}

watch(() => route.path, syncRoute, { immediate: true })

function handleTabClick(path: string) {
  if (path !== route.path) router.push(path)
}

/* ---- 右键菜单（事件委托） ---- */
function handleContextMenu(e: MouseEvent) {
  const target = (e.target as HTMLElement).closest('.tag-item') as HTMLElement | null
  if (!target) return
  const path = target.dataset.path
  if (!path) return
  const tab = tabNav.tabs.find((t) => t.path === path)
  if (!tab) return
  menuTabPath.value = path
  menuIsAffix.value = tab.affix
  menuX.value = e.clientX
  menuY.value = e.clientY
  menuVisible.value = true
}

function closeMenu() {
  menuVisible.value = false
}

function handleClickOutside(e: MouseEvent) {
  if (!menuVisible.value) return
  const menu = document.querySelector('.ctx-menu')
  if (menu && menu.contains(e.target as Node)) return
  closeMenu()
}

onMounted(() => {
  document.addEventListener('click', handleClickOutside)
})
onBeforeUnmount(() => {
  document.removeEventListener('click', handleClickOutside)
})

function handleClose(path: string) {
  const redirect = tabNav.closeTab(path)
  if (redirect) router.push(redirect)
}

function menuAction(key: string) {
  closeMenu()
  const targetPath = menuTabPath.value
  switch (key) {
    case 'refresh':
      if (targetPath !== route.path) {
        router.push(targetPath)
      } else {
        router.replace('/admin').then(() => {
          nextTick(() => router.replace(targetPath))
        })
      }
      break
    case 'close':
      handleClose(targetPath)
      break
    case 'closeOthers':
      tabNav.closeOthers(targetPath)
      if (targetPath !== route.path) router.push(targetPath)
      break
    case 'closeLeft':
      tabNav.closeLeft(targetPath)
      if (!tabNav.tabs.find((t) => t.path === route.path)) router.push(targetPath)
      break
    case 'closeRight':
      tabNav.closeRight(targetPath)
      if (!tabNav.tabs.find((t) => t.path === route.path)) router.push(targetPath)
      break
    case 'closeAll': {
      const redirect = tabNav.closeAll()
      if (redirect && redirect !== route.path) router.push(redirect)
      break
    }
  }
}
</script>

<template>
  <div class="tags-view" @contextmenu.prevent="handleContextMenu">
    <div class="tags-view-scroll">
      <div
        v-for="tab in tabNav.tabs"
        :key="tab.path"
        class="tag-item"
        :class="{ active: tabNav.activeTab === tab.path }"
        :data-path="tab.path"
        :data-affix="tab.affix"
        @click="handleTabClick(tab.path)"
      >
        <span class="tag-label">{{ tab.title }}</span>
        <span
          v-if="!tab.affix"
          class="tag-close"
          @click.stop="handleClose(tab.path)"
        >&times;</span>
      </div>
    </div>

    <Teleport to="body">
      <ul
        v-if="menuVisible"
        class="ctx-menu"
        :style="{ left: menuX + 'px', top: menuY + 'px' }"
        @click.stop
        @contextmenu.prevent.stop
      >
        <li class="ctx-menu-item" @click="menuAction('refresh')">刷新页面</li>
        <li class="ctx-menu-item" :class="{ disabled: menuIsAffix }" @click="!menuIsAffix && menuAction('close')">关闭当前</li>
        <li class="ctx-menu-item" @click="menuAction('closeOthers')">关闭其他</li>
        <li class="ctx-menu-item" @click="menuAction('closeLeft')">关闭左侧</li>
        <li class="ctx-menu-item" @click="menuAction('closeRight')">关闭右侧</li>
        <li class="ctx-menu-item" @click="menuAction('closeAll')">关闭所有</li>
      </ul>
    </Teleport>
  </div>
</template>

<style scoped>
.tags-view {
  display: flex;
  align-items: center;
  height: 34px;
  padding: 0 12px;
  border-bottom: 1px solid var(--n-border-color, #e5e7eb);
  background: var(--n-color, #fff);
  user-select: none;
}

.tags-view-scroll {
  display: flex;
  gap: 4px;
  overflow-x: auto;
  scrollbar-width: none;
}

.tags-view-scroll::-webkit-scrollbar {
  display: none;
}

.tag-item {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 2px 10px;
  height: 26px;
  font-size: 12px;
  border-radius: 3px;
  border: 1px solid var(--n-border-color, #e5e7eb);
  background: var(--n-color, #fff);
  color: var(--n-text-color, #333);
  cursor: pointer;
  white-space: nowrap;
  transition: background 0.2s, color 0.2s, border-color 0.2s;
}

.tag-item:hover {
  color: var(--n-primary-color, #18a058);
}

.tag-item.active {
  background: var(--n-primary-color, #18a058);
  border-color: var(--n-primary-color, #18a058);
  color: #fff;
}

.tag-close {
  font-size: 14px;
  line-height: 1;
  border-radius: 50%;
  width: 16px;
  height: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background 0.15s;
}

.tag-close:hover {
  background: rgba(0, 0, 0, 0.15);
}

.tag-item.active .tag-close:hover {
  background: rgba(255, 255, 255, 0.3);
}
</style>

<style>
.ctx-menu {
  position: fixed;
  z-index: 99999;
  min-width: 130px;
  margin: 0;
  padding: 4px 0;
  list-style: none;
  background: #fff;
  border: 1px solid #e5e7eb;
  border-radius: 6px;
  box-shadow: 0 6px 16px rgba(0, 0, 0, 0.12);
  font-size: 13px;
  color: #333;
}

.ctx-menu-item {
  padding: 6px 16px;
  cursor: pointer;
  transition: background 0.15s;
}

.ctx-menu-item:hover {
  background: #f3f4f6;
}

.ctx-menu-item.disabled {
  color: #c0c4cc;
  cursor: not-allowed;
}

.ctx-menu-item.disabled:hover {
  background: transparent;
}
</style>
