<script setup lang="ts">
/**
 * @file 顶部导航栏组件：Naive UI 风格。
 */
import { computed } from 'vue'
import { NButton, NDropdown, NSpace, NAvatar } from 'naive-ui'
import { useTheme, type Theme } from '../composables/useTheme'
import type { UserDto } from '../api/types'

const props = defineProps<{
  user: UserDto | null
}>()

const emit = defineEmits<{
  openAuth: []
  logout: []
}>()

const { currentTheme, setTheme } = useTheme()

const themeOptions = [
  { label: '浅色', key: 'light' },
  { label: '暗色', key: 'dark' },
  { label: '紫色', key: 'purple' },
  { label: '粉色', key: 'pink' },
  { label: '系统', key: 'auto' },
]

const profileOptions = [{ label: '退出登录', key: 'logout' }]

const userInitial = computed(() => {
  if (!props.user) return '?'
  return (props.user.nickName || props.user.account || '?').charAt(0).toUpperCase()
})

function handleThemeSelect(key: string | number) {
  setTheme(key as Theme)
}

function handleProfileSelect(key: string | number) {
  if (key === 'logout') emit('logout')
}
</script>

<template>
  <div class="header">
    <div class="brand">
      <div class="brand-badge">G</div>
      <div>
        <div class="brand-title">GreenWall</div>
        <div class="brand-sub">Workspace</div>
      </div>
    </div>

    <n-space align="center">
      <n-dropdown :options="themeOptions" @select="handleThemeSelect">
        <n-button quaternary size="small">
          主题：{{ currentTheme }}
        </n-button>
      </n-dropdown>

      <template v-if="user">
        <n-dropdown :options="profileOptions" @select="handleProfileSelect">
          <n-button quaternary size="small">
            <n-space align="center" size="small">
              <n-avatar size="small">{{ userInitial }}</n-avatar>
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

.brand {
  display: flex;
  align-items: center;
  gap: 12px;
}

.brand-badge {
  width: 32px;
  height: 32px;
  border-radius: 10px;
  background: var(--color-primary);
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
}

.brand-title {
  font-weight: 700;
}

.brand-sub {
  font-size: 0.75rem;
  color: var(--color-text-muted);
}
</style>
