<script setup lang="ts">
/**
 * @file 用户端布局：Naive UI Layout + 认证弹窗。
 */
import { ref, onMounted, watch } from 'vue'
import { computed, onBeforeUnmount } from 'vue'
import { useRouter } from 'vue-router'
import Header from '../components/Header.vue'
import ProfileDialog from '../components/ProfileDialog.vue'
import AuthDialog from '../components/AuthDialog.vue'
import AnnouncementDialog from '../components/AnnouncementDialog.vue'
import { getMe, logout } from '../api/auth'
import { usePermissionStore } from '../stores/permission'
import { useGitHubStore } from '../stores/github'
import { storeToRefs } from 'pinia'
import { useMenuTreeStore } from '../stores/menuTree'
import { useRoleListStore } from '../stores/roleList'
import { useUserListStore } from '../stores/userList'
import { usePushRecordStore } from '../stores/pushRecord'
import { useAnnouncementStore } from '../stores/announcement'
import type { UserProfileDto } from '../api/types'

const showAuthDialog = ref(false)
const showProfileDialog = ref(false)
const showAnnouncementDialog = ref(false)
const currentUser = ref<UserProfileDto | null>(null)
const isMobileDevice = ref(false)
const isPortrait = ref(false)
const isTryingRotate = ref(false)
const showRotateGuide = computed(() => isMobileDevice.value && isPortrait.value)
const permissionStore = usePermissionStore()
const { isLoaded, user } = storeToRefs(permissionStore)
const githubStore = useGitHubStore()
const menuTreeStore = useMenuTreeStore()
const roleListStore = useRoleListStore()
const userListStore = useUserListStore()
const pushRecordStore = usePushRecordStore()
const announcementStore = useAnnouncementStore()
const router = useRouter()
let removeRotateGestureListener: (() => void) | null = null

function detectMobileDevice() {
  const ua = navigator.userAgent || ''
  const coarsePointer = window.matchMedia('(pointer: coarse)').matches
  const smallViewport = Math.min(window.innerWidth, window.innerHeight) <= 1024
  const mobileUA = /Android|iPhone|iPad|iPod|Mobile|Windows Phone|HarmonyOS/i.test(ua)
  return mobileUA || (coarsePointer && smallViewport)
}

function updateOrientation() {
  isPortrait.value = window.matchMedia('(orientation: portrait)').matches
}

async function tryLockLandscape(useFullscreen: boolean) {
  if (!isMobileDevice.value) return
  const orientation = window.screen?.orientation as
    | (ScreenOrientation & { lock?: (mode: string) => Promise<void> })
    | undefined
  if (!orientation || typeof orientation.lock !== 'function') return

  isTryingRotate.value = true
  try {
    if (useFullscreen && !document.fullscreenElement && document.documentElement.requestFullscreen) {
      await document.documentElement.requestFullscreen()
    }
    await orientation.lock('landscape')
  } catch {
    // Some browsers require explicit user gesture or do not support orientation lock.
  } finally {
    isTryingRotate.value = false
    updateOrientation()
  }
}

function bindFirstGestureRotate() {
  const handler = () => {
    void tryLockLandscape(true)
    if (removeRotateGestureListener) {
      removeRotateGestureListener()
      removeRotateGestureListener = null
    }
  }

  window.addEventListener('touchstart', handler, { passive: true, once: true })
  window.addEventListener('click', handler, { once: true })
  removeRotateGestureListener = () => {
    window.removeEventListener('touchstart', handler)
    window.removeEventListener('click', handler)
  }
}

function handleViewportChange() {
  updateOrientation()
  if (isMobileDevice.value && isPortrait.value) {
    void tryLockLandscape(false)
  }
}

onMounted(async () => {
  isMobileDevice.value = detectMobileDevice()
  updateOrientation()
  if (isMobileDevice.value) {
    bindFirstGestureRotate()
    window.addEventListener('resize', handleViewportChange)
    window.addEventListener('orientationchange', handleViewportChange)
    void tryLockLandscape(false)
  }

  const token = localStorage.getItem('token')
  if (token) {
    try {
      const res = await getMe()
      currentUser.value = res.data.data
      if (!isLoaded.value) {
        await permissionStore.loadPermission()
      }
    } catch {
      currentUser.value = null
      permissionStore.reset()
    }
  } else {
    currentUser.value = null
    permissionStore.reset()
    githubStore.clear()
    pushRecordStore.reset()
  }

  // 公告：加载激活列表 + 启动热加载，进入时若有未读项则自动弹窗
  try {
    await announcementStore.load(true)
    if (announcementStore.unreadList.length > 0) {
      showAnnouncementDialog.value = true
    }
  } catch {
    // 离线/接口失败时使用持久化缓存兜底，不阻塞页面
    if (announcementStore.unreadList.length > 0) {
      showAnnouncementDialog.value = true
    }
  }
  announcementStore.startHotReload()
})

watch(
  () => user.value,
  (val) => {
    if (val) {
      currentUser.value = val
    }
  },
  { immediate: true },
)

onBeforeUnmount(() => {
  window.removeEventListener('resize', handleViewportChange)
  window.removeEventListener('orientationchange', handleViewportChange)
  removeRotateGestureListener?.()
  removeRotateGestureListener = null
  announcementStore.stopHotReload()
})

async function onLoggedIn(user: UserProfileDto) {
  currentUser.value = user
  showAuthDialog.value = false
  await permissionStore.loadPermission()
  if (permissionStore.hasPermission('sys:dashboard')) {
    router.push('/admin')
    return
  }
  if (permissionStore.hasPermission('sys:user:list')) {
    router.push('/admin/users')
    return
  }
  if (permissionStore.hasPermission('sys:role:list')) {
    router.push('/admin/roles')
    return
  }
  if (permissionStore.hasPermission('sys:menu:list')) {
    router.push('/admin/menus')
    return
  }
  router.push('/')
}

function onOpenProfile() {
  showProfileDialog.value = true
}

function onOpenAnnouncements() {
  // 顶栏铃铛触发：直接打开历史时间线，不重置已读状态
  showAnnouncementDialog.value = true
  void announcementStore.load(true).catch(() => {})
}

async function onLogout() {
  try {
    await logout()
  } catch {
    // ignore logout errors, still clear local state
  }
  currentUser.value = null
  githubStore.clear()
  permissionStore.reset()
  menuTreeStore.reset()
  roleListStore.reset()
  userListStore.reset()
  pushRecordStore.reset()
}
</script>

<template>
  <div class="user-layout">
    <div class="user-header">
      <Header
        :user="currentUser"
        @open-auth="showAuthDialog = true"
        @open-profile="onOpenProfile"
        @open-announcements="onOpenAnnouncements"
        @logout="onLogout"
      />
    </div>
    <main class="user-content">
      <div class="user-scroll-container">
        <router-view></router-view>
      </div>
    </main>
    <div v-if="showRotateGuide" class="rotate-guide">
      <span>检测到手机竖屏，已尝试自动切换横屏以提升交互体验</span>
      <button class="rotate-guide-button" :disabled="isTryingRotate" @click="tryLockLandscape(true)">
        {{ isTryingRotate ? '切换中…' : '立即横屏' }}
      </button>
    </div>
  </div>

  <AuthDialog v-if="showAuthDialog" @close="showAuthDialog = false" @logged-in="onLoggedIn" />
  <ProfileDialog v-model:show="showProfileDialog" />
  <AnnouncementDialog v-model:show="showAnnouncementDialog" />
</template>

<style scoped>
.user-layout {
  height: 100vh;
  height: 100dvh;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.user-header {
  flex: 0 0 auto;
  border-bottom: 1px solid var(--color-border);
  background: var(--color-surface);
}

.user-content {
  flex: 1;
  min-height: 0;
  overflow: hidden;
}

.user-scroll-container {
  width: 100%;
  height: 100%;
  overflow: auto;
}

.rotate-guide {
  position: fixed;
  left: 12px;
  right: 12px;
  bottom: calc(12px + env(safe-area-inset-bottom));
  z-index: 1200;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  padding: 10px 12px;
  border-radius: 10px;
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  background: color-mix(in srgb, var(--color-surface) 90%, var(--color-primary) 10%);
  border: 1px solid color-mix(in srgb, var(--color-primary) 30%, var(--color-border) 70%);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);
  font-size: 13px;
  line-height: 1.4;
}

.rotate-guide-button {
  flex: 0 0 auto;
  padding: 6px 10px;
  border-radius: 8px;
  border: 1px solid var(--color-primary);
  background: var(--color-primary);
  color: #fff;
  font-size: 12px;
}

.rotate-guide-button:disabled {
  opacity: 0.7;
  cursor: default;
}

@media (orientation: landscape) and (max-width: 1024px) {
  .rotate-guide {
    display: none;
  }
}
</style>
