<script setup lang="ts">
/**
 * @file 用户端布局：Naive UI Layout + 认证弹窗。
 */
import { ref, onMounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import { NLayout, NLayoutHeader, NLayoutContent } from 'naive-ui'
import Header from '../components/Header.vue'
import ProfileDialog from '../components/ProfileDialog.vue'
import AuthDialog from '../components/AuthDialog.vue'
import { getMe, logout } from '../api/auth'
import { usePermissionStore } from '../stores/permission'
import { useGitHubStore } from '../stores/github'
import { storeToRefs } from 'pinia'
import { useMenuTreeStore } from '../stores/menuTree'
import { useRoleListStore } from '../stores/roleList'
import { useUserListStore } from '../stores/userList'
import { usePushRecordStore } from '../stores/pushRecord'
import type { UserProfileDto } from '../api/types'

const showAuthDialog = ref(false)
const showProfileDialog = ref(false)
const currentUser = ref<UserProfileDto | null>(null)
const permissionStore = usePermissionStore()
const { isLoaded, user } = storeToRefs(permissionStore)
const githubStore = useGitHubStore()
const menuTreeStore = useMenuTreeStore()
const roleListStore = useRoleListStore()
const userListStore = useUserListStore()
const pushRecordStore = usePushRecordStore()
const router = useRouter()

onMounted(async () => {
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
  <n-layout class="user-layout">
    <n-layout-header bordered>
      <Header
        :user="currentUser"
        @open-auth="showAuthDialog = true"
        @open-profile="onOpenProfile"
        @logout="onLogout"
      />
    </n-layout-header>
    <n-layout-content class="user-content">
      <router-view></router-view>
    </n-layout-content>
  </n-layout>

  <AuthDialog v-if="showAuthDialog" @close="showAuthDialog = false" @logged-in="onLoggedIn" />
  <ProfileDialog v-model:show="showProfileDialog" />
</template>

<style scoped>
.user-layout {
  height: 100vh;
}

.user-content {
  display: flex;
  flex-direction: column;
  flex: 1;
  position: relative;
  min-height: 0;
  box-sizing: border-box;
}

:deep(.n-layout-scroll-container) {
  display: flex;
  flex-direction: column;
  min-height: 100%;
}
</style>
