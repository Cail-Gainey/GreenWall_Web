<script setup lang="ts">
/**
 * @file 顶部导航栏组件：Naive UI 风格。
 */
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { NButton, NDropdown, NSpace, NAvatar, NBadge } from 'naive-ui'
import { useTheme, type Theme } from '../composables/useTheme'
import { createThemeDropdownOptions, getThemeLabel, getThemeSwatchStyle } from '../theme/themeOptions'
import { usePermissionStore } from '../stores/permission'
import type { UserProfileDto } from '../api/types'
import { resolveAvatar, userAvatarFallback } from '../utils/avatar'
import logoUrl from '../assets/logo.png'
import { useAppConfigStore } from '../stores/appConfig'
import { useAnnouncementStore } from '../stores/announcement'
import { storeToRefs } from 'pinia'

const props = withDefaults(defineProps<{
  user: UserProfileDto | null
  showCommunity?: boolean
  showBrand?: boolean
}>(), {
  showCommunity: true,
  showBrand: true,
})

const emit = defineEmits<{
  openAuth: []
  openProfile: []
  openAnnouncements: []
  logout: []
}>()

const router = useRouter()
const route = useRoute()

const { currentTheme, setTheme } = useTheme()
const { hasPermission, hasRole } = usePermissionStore()
const appConfigStore = useAppConfigStore()
const announcementStore = useAnnouncementStore()
const { unreadList } = storeToRefs(announcementStore)

/**
 * @description 主题下拉菜单选项。
 */
const themeOptions = createThemeDropdownOptions()

/**
 * @description 当前登录用户的快捷操作菜单。
 * @returns {{ label: string; key: string }[]} 菜单项列表。
 */
const profileOptions = computed(() => {
  const options: Array<{ label: string; key: string }> = []
  options.push({ label: '个人主页', key: 'home' })
  options.push({ label: '我的收藏', key: 'favorites' })
  if (hasPermission('app:profile:view')) {
    options.push({ label: '个人信息', key: 'profile' })
  }
  options.push({ label: '退出登录', key: 'logout' })
  return options
})


const avatarSrc = computed(() => resolveAvatar(props.user?.avatar))
const currentThemeLabel = computed(() => getThemeLabel(currentTheme.value))
const currentThemeSwatchStyle = computed(() => getThemeSwatchStyle(currentTheme.value))
const appName = computed(() => appConfigStore.getValue('app:name') || 'GreenWall')
const appVersion = computed(() => appConfigStore.getValue('app:version'))
const announcementUnreadCount = computed(() => unreadList.value.length)
const canVisitAdmin = computed(() => {
  if (hasRole('admin')) return true
  const adminPerms = ['sys:dashboard', 'sys:user:list', 'sys:role:list', 'sys:menu:list']
  return adminPerms.some((perm) => hasPermission(perm))
})

/**
 * @description 处理主题切换。
 * @param {string | number} key 选中的主题键。
 */
function handleThemeSelect(key: string | number) {
  setTheme(key as Theme)
}

/**
 * @description 处理个人菜单选择，包括主页、资料与退出登录。
 * @param {string | number} key 选中的菜单键。
 */
function handleProfileSelect(key: string | number) {
  if (key === 'home') {
    router.push('/me')
    return
  }
  if (key === 'favorites') {
    router.push('/favorites')
    return
  }
  if (key === 'profile') {
    emit('openProfile')
    return
  }
  if (key === 'logout') emit('logout')
}

/**
 * @description 跳转到社区页面。
 */
function goCommunity() {
  if (route.path.startsWith('/community')) return
  router.push('/community')
}

/**
 * @description 跳转到隐私条款页面。
 */
function goPrivacy() {
  if (route.path.startsWith('/privacy')) return
  router.push('/privacy')
}
</script>

<template>
  <div class="header">
    <div class="header-left">
      <button v-if="showBrand !== false" class="brand" type="button" @click="router.push('/')">
        <img :src="logoUrl" alt="logo" class="brand-logo" />
        <div class="brand-text">
          <div class="brand-title">{{ appName }}</div>
          <div v-if="appVersion" class="brand-subtitle">v{{ appVersion }}</div>
        </div>
      </button>
      <slot name="left"></slot>
    </div>

    <n-space align="center">
      <n-button v-if="showCommunity !== false" quaternary size="small" @click="goCommunity">
        社区
      </n-button>
      <n-button quaternary size="small" @click="goPrivacy">隐私条款</n-button>
      <n-button v-if="user && canVisitAdmin" quaternary size="small" @click="router.push('/admin')">
        管理后台
      </n-button>
      <n-badge
        :value="announcementUnreadCount"
        :max="99"
        :show="announcementUnreadCount > 0"
        :offset="[-4, 4]"
        processing
      >
        <n-button quaternary size="small" aria-label="查看公告" @click="emit('openAnnouncements')">
          <span class="announcement-trigger" aria-hidden="true">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              width="18"
              height="18"
              fill="none"
              stroke="currentColor"
              stroke-width="1.8"
              stroke-linecap="round"
              stroke-linejoin="round"
            >
              <path d="M6 8a6 6 0 0112 0v5l1.5 2.5h-15L6 13z"></path>
              <path d="M10 19a2 2 0 004 0"></path>
            </svg>
            <span class="announcement-label">公告</span>
          </span>
        </n-button>
      </n-badge>
      <n-dropdown :options="themeOptions" @select="handleThemeSelect">
        <n-button quaternary size="small">
          <span class="theme-trigger"><span class="theme-swatch" :style="currentThemeSwatchStyle"></span>主题：{{ currentThemeLabel }}</span>
        </n-button>
      </n-dropdown>

      <template v-if="user">
        <n-dropdown :options="profileOptions" @select="handleProfileSelect">
          <n-button quaternary size="small">
            <n-space align="center" size="small">
              <n-avatar
                size="small"
                :src="avatarSrc"
                :fallback-src="userAvatarFallback"
                :img-props="{ referrerpolicy: 'no-referrer' }"
              />
              <span>{{ user.nickName || user.account }}</span>
            </n-space>
          </n-button>
        </n-dropdown>
      </template>
      <n-button v-else type="primary" size="small" @click="emit('openAuth')">登录</n-button>
    </n-space>
  </div>
</template>

<style scoped>
.header {
  height: 64px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 20px;
  border-bottom: 1px solid var(--color-border);
  background: var(--color-surface);
}

.header-left {
  display: flex;
  align-items: center;
  gap: 12px;
}

.brand {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 0;
  border: none;
  background: transparent;
  cursor: pointer;
}

.brand:hover {
  background: transparent;
}

.brand-logo {
  width: 28px;
  height: 28px;
  object-fit: contain;
}

.brand-text {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.brand-title {
  font-weight: 700;
  font-size: 1rem;
  color: var(--color-text-main);
}

.brand-subtitle {
  font-size: 0.75rem;
  color: var(--color-text-muted);
  line-height: 1;
}

.theme-trigger {
  display: inline-flex;
  align-items: center;
  gap: 8px;
}

.theme-swatch {
  flex-shrink: 0;
}

.announcement-trigger {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  color: inherit;
}

.announcement-label {
  font-size: 13px;
  color: inherit;
}

</style>
