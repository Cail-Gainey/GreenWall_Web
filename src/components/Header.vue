<script setup lang="ts">
/**
 * @file 顶部导航栏组件：主题切换、快捷操作与用户入口。
 */
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useTheme } from '../composables/useTheme'
import type { UserDto } from '../api/types'

const props = defineProps<{
  user: UserDto | null
}>()

const emit = defineEmits<{
  openAuth: []
  logout: []
}>()

const { currentTheme, setTheme } = useTheme()

const isThemeMenuOpen = ref(false)
const isProfileMenuOpen = ref(false)

/**
 * @description 切换主题菜单的展开状态。
 */
const toggleThemeMenu = () => {
  isThemeMenuOpen.value = !isThemeMenuOpen.value
}

/**
 * @description 计算用户头像显示的首字母。
 */
const userInitial = computed(() => {
  if (!props.user) return '?'
  return (props.user.nickName || props.user.account || '?').charAt(0).toUpperCase()
})

/**
 * @description 点击头像：已登录打开菜单，未登录触发认证弹窗。
 */
function handleProfileClick() {
  if (props.user) {
    isProfileMenuOpen.value = !isProfileMenuOpen.value
  } else {
    emit('openAuth')
  }
}

/**
 * @description 退出登录并关闭菜单。
 */
function handleLogout() {
  isProfileMenuOpen.value = false
  emit('logout')
}

/**
 * @description 点击页面其他区域时关闭下拉菜单。
 * @param {MouseEvent} e 点击事件。
 */
const closeMenus = (e: MouseEvent) => {
  const target = e.target as HTMLElement
  if (!target.closest('.theme-dropdown-container')) {
    isThemeMenuOpen.value = false
  }
  if (!target.closest('.profile-dropdown-container')) {
    isProfileMenuOpen.value = false
  }
}

/**
 * @description 监听全局点击以关闭菜单。
 */
onMounted(() => {
  document.addEventListener('click', closeMenus)
})

/**
 * @description 组件销毁时移除监听。
 */
onUnmounted(() => {
  document.removeEventListener('click', closeMenus)
})
</script>

<template>
  <header class="header">
    <div class="left-section">
      <div class="logo">G</div>

      <div class="lang-toggle">
        <span class="lang-item">English</span>
        <span class="lang-item active">中文</span>
      </div>

      <div class="theme-dropdown-container" style="position: relative;">
        <button class="icon-btn theme-btn tooltip-btn" @click="toggleThemeMenu" data-tooltip="切换主题">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="12" cy="12" r="5"></circle>
            <line x1="12" y1="1" x2="12" y2="3"></line>
            <line x1="12" y1="21" x2="12" y2="23"></line>
            <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line>
            <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line>
            <line x1="1" y1="12" x2="3" y2="12"></line>
            <line x1="21" y1="12" x2="23" y2="12"></line>
            <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line>
            <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line>
          </svg>
        </button>

        <div v-if="isThemeMenuOpen" class="theme-dropdown-menu">
           <button :class="{ active: currentTheme === 'light' }" @click="setTheme('light'); isThemeMenuOpen = false">浅色</button>
           <button :class="{ active: currentTheme === 'dark' }" @click="setTheme('dark'); isThemeMenuOpen = false">暗色</button>
           <button :class="{ active: currentTheme === 'purple' }" @click="setTheme('purple'); isThemeMenuOpen = false">紫色</button>
           <button :class="{ active: currentTheme === 'pink' }" @click="setTheme('pink'); isThemeMenuOpen = false">粉色</button>
           <button :class="{ active: currentTheme === 'auto' }" @click="setTheme('auto'); isThemeMenuOpen = false">系统(夜间暗色)</button>
        </div>
      </div>

      <div class="divider"></div>

      <div class="git-status">
        <div class="status-dot">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
            <polyline points="20 6 9 17 4 12"></polyline>
          </svg>
        </div>
        <span>Git</span>
      </div>
    </div>

    <div class="center-section">
      <h1 class="title">GreenWall</h1>
    </div>

    <div class="right-section">
      <!-- Settings -->
      <button class="icon-btn tooltip-btn" data-tooltip="设置">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <circle cx="12" cy="12" r="3"></circle>
          <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path>
        </svg>
      </button>

      <!-- Info -->
      <button class="icon-btn tooltip-btn" data-tooltip="关于">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <circle cx="12" cy="12" r="10"></circle>
          <line x1="12" y1="16" x2="12" y2="12"></line>
          <line x1="12" y1="8" x2="12.01" y2="8"></line>
        </svg>
      </button>

      <!-- Book -->
      <button class="icon-btn tooltip-btn" data-tooltip="指引">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"></path>
          <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"></path>
        </svg>
      </button>

      <div class="divider"></div>

      <button class="action-btn tooltip-btn" data-tooltip="导入">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
          <polyline points="7 10 12 15 17 10"></polyline>
          <line x1="12" y1="15" x2="12" y2="3"></line>
        </svg>
      </button>

      <button class="action-btn tooltip-btn" data-tooltip="导出">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
          <polyline points="17 8 12 3 7 8"></polyline>
          <line x1="12" y1="3" x2="12" y2="15"></line>
        </svg>
      </button>

      <button class="action-btn tooltip-btn" data-tooltip="生成">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M12 2v20"></path>
          <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path>
        </svg>
      </button>

      <div class="divider"></div>

      <!-- Profile -->
      <div class="profile-dropdown-container" style="position: relative;">
        <button
          class="icon-btn profile-btn tooltip-btn"
          :data-tooltip="user ? (user.nickName || user.account) : '登录'"
          @click="handleProfileClick"
        >
          <svg v-if="!user" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
            <circle cx="12" cy="7" r="4"></circle>
          </svg>
          <span v-else class="avatar-initial">{{ userInitial }}</span>
        </button>

        <div v-if="isProfileMenuOpen && user" class="profile-dropdown-menu">
          <div class="profile-info">
            <span class="profile-name">{{ user.nickName || user.account }}</span>
            <span v-if="user.email" class="profile-email">{{ user.email }}</span>
          </div>
          <button @click="handleLogout">退出登录</button>
        </div>
      </div>
    </div>
  </header>
</template>

<style scoped>
.header {
  height: 64px;
  background-color: var(--color-surface);
  border-bottom: 1px solid var(--color-border);
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 1.5rem;
  z-index: 10;
}

.left-section, .right-section, .center-section {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.logo {
  background-color: var(--color-primary);
  color: white;
  width: 32px;
  height: 32px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: bold;
  font-size: 1.2rem;
  font-family: 'Inter', sans-serif;
}

.left-section {
  flex: 1;
}

.center-section {
  flex: 1;
  justify-content: center;
}

.right-section {
  flex: 1;
  justify-content: flex-end;
}

.lang-toggle {
  display: flex;
  background-color: var(--color-bg-light);
  border-radius: 8px;
  padding: 4px;
  font-size: 0.85rem;
}

.lang-item {
  padding: 4px 12px;
  border-radius: 6px;
  color: var(--color-text-muted);
  cursor: pointer;
}

.lang-item.active {
  background-color: white;
  color: var(--color-text-main);
  box-shadow: 0 1px 2px rgba(0,0,0,0.05);
  font-weight: 500;
}

.theme-btn {
  background: transparent;
  border: none;
  padding: 8px;
  color: var(--color-text-muted);
  display: flex;
  align-items: center;
}

.theme-btn:hover {
  color: var(--color-text-main);
}

.theme-dropdown-menu {
  position: absolute;
  top: 100%;
  left: 50%;
  transform: translateX(-50%);
  margin-top: 8px;
  background-color: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0,0,0,0.1);
  display: flex;
  flex-direction: column;
  min-width: 140px;
  overflow: hidden;
  z-index: 100;
}

.theme-dropdown-menu button {
  padding: 10px 16px;
  text-align: left;
  background: transparent;
  border: none;
  border-radius: 0;
  color: var(--color-text-main);
  cursor: pointer;
  white-space: nowrap;
}

.theme-dropdown-menu button:hover {
  background-color: var(--color-bg-light);
}

.theme-dropdown-menu button.active {
  color: var(--color-primary);
  font-weight: 600;
  background-color: var(--color-bg-dots);
}

.divider {
  width: 1px;
  height: 20px;
  background-color: var(--color-border);
}

.git-status {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 4px 10px;
  border-radius: 12px;
  background-color: rgba(16, 185, 129, 0.1);
  color: var(--color-primary);
  font-size: 0.85rem;
  font-weight: 500;
}

.status-dot {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 14px;
  height: 14px;
  border-radius: 50%;
  border: 1px solid currentColor;
}

.title {
  font-size: 1.1rem;
  font-weight: 600;
  margin: 0;
  color: var(--color-text-main);
}

.action-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  background: transparent;
  color: var(--color-text-main);
  border: none;
  font-size: 0.9rem;
  padding: 8px;
}

.action-btn:hover {
  background-color: var(--color-bg-light);
  border-radius: 8px;
}

.profile-btn {
  background-color: var(--color-bg-dots);
  color: var(--color-text-main);
  border-radius: 50%;
  padding: 8px;
  border: 1px solid var(--color-border);
}
.profile-btn:hover {
  background-color: var(--color-bg-light);
}

.avatar-initial {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 20px;
  height: 20px;
  font-size: 14px;
  font-weight: 600;
  color: var(--color-primary);
}

.profile-dropdown-menu {
  position: absolute;
  top: 100%;
  right: 0;
  margin-top: 8px;
  background-color: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0,0,0,0.1);
  display: flex;
  flex-direction: column;
  min-width: 180px;
  overflow: hidden;
  z-index: 100;
}

.profile-info {
  padding: 12px 16px;
  border-bottom: 1px solid var(--color-border);
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.profile-name {
  font-size: 14px;
  font-weight: 600;
  color: var(--color-text-main);
}

.profile-email {
  font-size: 12px;
  color: var(--color-text-muted);
}

.profile-dropdown-menu button {
  padding: 10px 16px;
  text-align: left;
  background: transparent;
  border: none;
  border-radius: 0;
  color: var(--color-text-main);
  cursor: pointer;
  white-space: nowrap;
}

.profile-dropdown-menu button:hover {
  background-color: var(--color-bg-light);
}

/* Tooltip styles */
.tooltip-btn {
  position: relative;
}

.tooltip-btn::after {
  content: attr(data-tooltip);
  position: absolute;
  bottom: -30px;
  left: 50%;
  transform: translateX(-50%);
  background-color: #1f2937;
  color: #fff;
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 12px;
  white-space: nowrap;
  opacity: 0;
  pointer-events: none;
  transition: opacity 0.2s;
  z-index: 1000;
  box-shadow: 0 2px 4px rgba(0,0,0,0.2);
}

.tooltip-btn:hover::after {
  opacity: 1;
}
</style>
