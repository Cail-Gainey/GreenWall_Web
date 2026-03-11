<script setup lang="ts">
/**
 * @file 用户端布局：Naive UI Layout + 认证弹窗。
 */
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { NLayout, NLayoutHeader, NLayoutContent } from 'naive-ui'
import Header from '../components/Header.vue'
import AuthDialog from '../components/AuthDialog.vue'
import { getMe } from '../api/auth'
import { usePermissionStore } from '../stores/permission'
import type { UserDto } from '../api/types'

const showAuthDialog = ref(false)
const currentUser = ref<UserDto | null>(null)
const permissionStore = usePermissionStore()
const router = useRouter()

onMounted(async () => {
  const stored = localStorage.getItem('user')
  if (stored) {
    try {
      currentUser.value = JSON.parse(stored)
    } catch {
      currentUser.value = null
    }
  }

  const token = localStorage.getItem('token')
  if (token) {
    try {
      const res = await getMe()
      currentUser.value = res.data.data
      localStorage.setItem('user', JSON.stringify(res.data.data))
      if (!permissionStore.isLoaded.value) {
        await permissionStore.loadPermission()
      }
    } catch {
      currentUser.value = null
      localStorage.removeItem('token')
      localStorage.removeItem('user')
      permissionStore.reset()
    }
  }
})

async function onLoggedIn(user: UserDto) {
  currentUser.value = user
  showAuthDialog.value = false
  await permissionStore.loadPermission()
  if (permissionStore.roles.value.includes('admin')) {
    router.push('/admin')
  } else {
    router.push('/')
  }
}

function onLogout() {
  currentUser.value = null
  localStorage.removeItem('token')
  localStorage.removeItem('user')
  permissionStore.reset()
}
</script>

<template>
  <n-layout class="user-layout">
    <n-layout-header bordered>
      <Header
        :user="currentUser"
        @open-auth="showAuthDialog = true"
        @logout="onLogout"
      />
    </n-layout-header>
    <n-layout-content class="user-content">
      <router-view></router-view>
    </n-layout-content>
  </n-layout>

  <AuthDialog v-if="showAuthDialog" @close="showAuthDialog = false" @logged-in="onLoggedIn" />
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
