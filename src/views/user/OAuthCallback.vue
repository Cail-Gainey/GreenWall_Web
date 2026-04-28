<script setup lang="ts">
/**
 * @file OAuth 回调处理：接收后端重定向的 ticket 并写入 GitHub pinia。
 */
import { onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { NResult, NButton, NSpin } from 'naive-ui'
import { exchangeGithubTicket } from '../../api/github'
import { useGitHubStore } from '../../stores/github'

const route = useRoute()
const router = useRouter()
const githubStore = useGitHubStore()

const loading = ref(true)
const error = ref('')

onMounted(async () => {
  const ticket = route.query.ticket
  const errorMsg = route.query.error

  if (typeof errorMsg === 'string' && errorMsg) {
    error.value = decodeURIComponent(errorMsg)
    loading.value = false
    return
  }

  if (typeof ticket !== 'string' || !ticket) {
    error.value = '缺少授权凭证'
    loading.value = false
    return
  }

  if (!localStorage.getItem('token')) {
    error.value = '请先登录后再绑定 GitHub'
    loading.value = false
    return
  }

  try {
    const res = await exchangeGithubTicket(ticket)
    githubStore.setProfile(res.data.data)
    router.replace('/')
  } catch (e: any) {
    error.value = e?.message || '授权失败'
  } finally {
    loading.value = false
  }
})

const goHome = () => router.replace('/')
</script>

<template>
  <div class="oauth-callback">
    <n-spin v-if="loading" size="large">正在完成授权...</n-spin>
    <n-result v-else status="error" title="授权失败" :description="error">
      <template #footer>
        <n-button type="primary" @click="goHome">返回首页</n-button>
      </template>
    </n-result>
  </div>
</template>

<style scoped>
.oauth-callback {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 2rem;
}
</style>
