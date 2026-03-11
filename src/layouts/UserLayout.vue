<script setup lang="ts">
/**
 * @file 用户端布局：负责登录态恢复与认证弹窗控制。
 */
import { ref, onMounted } from 'vue'
import AppLayout from './AppLayout.vue'
import Header from '../components/Header.vue'
import AuthDialog from '../components/AuthDialog.vue'
import { getMe } from '../api/auth'
import type { UserDto } from '../api/types'

const showAuthDialog = ref(false)
const currentUser = ref<UserDto | null>(null)

/**
 * @description 启动时恢复缓存用户并校验 token。
 */
onMounted(async () => {
  // 优先从缓存恢复
  const stored = localStorage.getItem('user')
  if (stored) {
    try {
      currentUser.value = JSON.parse(stored)
    } catch {
      currentUser.value = null
    }
  }
  // 有 token 时通过接口刷新用户信息
  const token = localStorage.getItem('token')
  if (token) {
    try {
      const res = await getMe()
      currentUser.value = res.data.data
      localStorage.setItem('user', JSON.stringify(res.data.data))
    } catch {
      // token 失效，清除登录态
      currentUser.value = null
      localStorage.removeItem('token')
      localStorage.removeItem('user')
    }
  }
})

/**
 * @description 登录成功后更新当前用户并关闭弹窗。
 * @param {UserDto} user 当前登录用户。
 */
function onLoggedIn(user: UserDto) {
  currentUser.value = user
  showAuthDialog.value = false
}

/**
 * @description 退出登录并清理本地缓存。
 */
function onLogout() {
  currentUser.value = null
  localStorage.removeItem('token')
  localStorage.removeItem('user')
}
</script>

<template>
  <AppLayout>
    <template #header>
      <Header
        :user="currentUser"
        @open-auth="showAuthDialog = true"
        @logout="onLogout"
      />
    </template>
    <template #main>
      <router-view></router-view>
    </template>
  </AppLayout>

  <AuthDialog
    v-if="showAuthDialog"
    @close="showAuthDialog = false"
    @logged-in="onLoggedIn"
  />
</template>
