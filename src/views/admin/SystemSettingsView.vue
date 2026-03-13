<script setup lang="ts">
/**
 * @file 系统设置视图：运维令牌强制与开放注册。
 */
import { computed, onMounted, ref } from 'vue'
import { NCard, NForm, NFormItem, NSwitch, NButton, NSpace, NAlert } from 'naive-ui'
import { getSystemConfig, updateSystemConfig } from '../../api/systemConfig'
import { usePermissionStore } from '../../stores/permission'

const loading = ref(false)
const saving = ref(false)
const message = ref('')
const isError = ref(false)

const allowRegister = ref(true)
const forceOpsToken = ref(false)
const emailVerifyEnabled = ref(true)
const githubOAuthEnabled = ref(true)

const permissionStore = usePermissionStore()
const canEdit = computed(() => permissionStore.hasPermission('sys:config:edit'))

const showMsg = (msg: string, error = false) => {
  message.value = msg
  isError.value = error
}

const load = async () => {
  loading.value = true
  showMsg('', false)
  try {
    const res = await getSystemConfig()
    allowRegister.value = res.data.data.allowRegister
    forceOpsToken.value = res.data.data.forceOpsToken
    emailVerifyEnabled.value = res.data.data.emailVerifyEnabled
    githubOAuthEnabled.value = res.data.data.githubOAuthEnabled
  } catch (e: any) {
    showMsg(e?.message || '获取系统设置失败', true)
  } finally {
    loading.value = false
  }
}

const save = async () => {
  if (!canEdit.value) return
  saving.value = true
  showMsg('', false)
  try {
    await updateSystemConfig({
      allowRegister: allowRegister.value,
      forceOpsToken: forceOpsToken.value,
      emailVerifyEnabled: emailVerifyEnabled.value,
      githubOAuthEnabled: githubOAuthEnabled.value,
    })
    showMsg('设置已保存')
  } catch (e: any) {
    showMsg(e?.message || '保存失败', true)
  } finally {
    saving.value = false
  }
}

onMounted(load)
</script>

<template>
  <n-card title="系统设置" size="large">
    <n-space vertical size="large">
      <n-alert v-if="message" :type="isError ? 'error' : 'success'">
        {{ message }}
      </n-alert>

      <n-form :disabled="loading">
        <n-form-item label="开放注册">
          <n-space align="center" size="small">
            <n-switch v-model:value="allowRegister" :disabled="!canEdit" />
            <span class="hint">关闭后将禁止新用户自助注册</span>
          </n-space>
        </n-form-item>
        <n-form-item label="强制运维令牌">
          <n-space align="center" size="small">
            <n-switch v-model:value="forceOpsToken" :disabled="!canEdit" />
            <span class="hint">开启后运维接口必须携带 X-Ops-Token</span>
          </n-space>
        </n-form-item>
        <n-form-item label="邮箱验证码">
          <n-space align="center" size="small">
            <n-switch v-model:value="emailVerifyEnabled" :disabled="!canEdit" />
            <span class="hint">关闭后注册/重置密码不再校验邮箱验证码</span>
          </n-space>
        </n-form-item>
        <n-form-item label="GitHub OAuth">
          <n-space align="center" size="small">
            <n-switch v-model:value="githubOAuthEnabled" :disabled="!canEdit" />
            <span class="hint">关闭后无法进行 GitHub 授权连接</span>
          </n-space>
        </n-form-item>
      </n-form>

      <n-space justify="end">
        <n-button v-permission="'sys:config:edit'" type="primary" :loading="saving" @click="save">保存设置</n-button>
      </n-space>
    </n-space>
  </n-card>
</template>

<style scoped>
.hint {
  color: var(--color-text-muted);
  font-size: 12px;
}
</style>
