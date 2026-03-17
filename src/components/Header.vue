<script setup lang="ts">
/**
 * @file 顶部导航栏组件：Naive UI 风格。
 */
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { NButton, NDropdown, NSpace, NAvatar } from 'naive-ui'
import { useTheme, type Theme } from '../composables/useTheme'
import { usePermissionStore } from '../stores/permission'
import type { UserProfileDto } from '../api/types'
import userAvatarFallback from '../assets/user.png'
import logoUrl from '../assets/logo.png'

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
  logout: []
}>()

const router = useRouter()
const route = useRoute()

const { currentTheme, setTheme } = useTheme()
const { hasPermission, hasRole } = usePermissionStore()

const themeOptions = [
  { label: '浅色', key: 'light' },
  { label: '暗色', key: 'dark' },
  { label: '紫色', key: 'purple' },
  { label: '粉色', key: 'pink' },
  { label: '海蓝', key: 'ocean' },
  { label: '琥珀', key: 'amber' },
  { label: '石板', key: 'slate' },
  { label: '莫奈', key: 'monet' },
  { label: '系统', key: 'auto' },
]

const profileOptions = computed(() => {
  const options: Array<{ label: string; key: string }> = []
  if (hasPermission('app:profile:view')) {
    options.push({ label: '个人信息', key: 'profile' })
  }
  options.push({ label: '退出登录', key: 'logout' })
  return options
})


const avatarSrc = computed(() => {
  if (!props.user?.avatar) return userAvatarFallback
  return props.user.avatar.trim()
})

function handleThemeSelect(key: string | number) {
  setTheme(key as Theme)
}

function handleProfileSelect(key: string | number) {
  if (key === 'profile') {
    emit('openProfile')
    return
  }
  if (key === 'logout') emit('logout')
}

function goCommunity() {
  if (route.path.startsWith('/community')) return
  router.push('/community')
}
</script>

<template>
  <div class="header">
    <div class="header-left">
      <div v-if="showBrand !== false" class="brand">
        <img :src="logoUrl" alt="logo" class="brand-logo" />
        <div class="brand-text">
          <div class="brand-title">GreenWall</div>
        </div>
      </div>
      <slot name="left"></slot>
    </div>

    <n-space align="center">
      <n-button v-if="showCommunity !== false" quaternary size="small" @click="goCommunity">
        社区
      </n-button>
      <n-button v-if="user && hasRole('admin')" quaternary size="small" @click="router.push('/admin')">
        管理后台
      </n-button>
      <n-dropdown :options="themeOptions" @select="handleThemeSelect">
        <n-button quaternary size="small">
          主题：{{ currentTheme }}
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

</style>
