<script setup lang="ts">
/**
 * @file 认证弹窗：Naive UI Tabs + Form.
 */
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { NModal, NCard, NTabs, NTabPane, NForm, NFormItem, NInput, NButton, NAlert, NSpace, NCheckbox } from 'naive-ui'
import { login, register, resetPassword, getMe } from '../api/auth'
import { sendCode } from '../api/verifyCode'
import { getPublicSystemConfig } from '../api/systemConfig'
import type { UserProfileDto } from '../api/types'
import CaptchaInput from './CaptchaInput.vue'
import { usePermissionStore } from '../stores/permission'
import {
  isValidAccount,
  isValidEmail,
  isValidEmailCode,
  isValidImageCaptcha,
  isValidPassword,
} from '../utils/validators'

const emit = defineEmits<{
  close: []
  loggedIn: [user: UserProfileDto]
}>()

type Mode = 'login' | 'register' | 'forgot'
const mode = ref<Mode>('login')

const loading = ref(false)
const message = ref('')
const isError = ref(false)
const countdown = ref(0)
let timer: ReturnType<typeof setInterval> | null = null
const allowRegister = ref(true)
const emailVerifyEnabled = ref(true)
const permissionStore = usePermissionStore()

const loginAccount = ref('')
const loginPassword = ref('')
const loginCaptchaId = ref('')
const loginCaptchaCode = ref('')
const loginCaptchaRef = ref<InstanceType<typeof CaptchaInput> | null>(null)

const regAccount = ref('')
const regPassword = ref('')
const regConfirmPassword = ref('')
const regEmail = ref('')
const regCode = ref('')
const regPrivacyConsent = ref(false)
const regCaptchaId = ref('')
const regCaptchaCode = ref('')
const regCaptchaRef = ref<InstanceType<typeof CaptchaInput> | null>(null)

const forgotEmail = ref('')
const forgotCode = ref('')
const forgotNewPassword = ref('')
const forgotConfirmPassword = ref('')
const forgotCaptchaId = ref('')
const forgotCaptchaCode = ref('')
const forgotCaptchaRef = ref<InstanceType<typeof CaptchaInput> | null>(null)

const canSendCode = computed(() => countdown.value === 0 && !loading.value)

function showMsg(msg: string, error = false) {
  message.value = msg
  isError.value = error
}

function clearMsg() {
  message.value = ''
  isError.value = false
}

const router = useRouter()

function openPrivacy() {
  router.push('/privacy')
}

function handleEnterSubmit() {
  if (loading.value) return
  if (mode.value === 'login') {
    void handleLogin()
    return
  }
  if (mode.value === 'register') {
    void handleRegister()
    return
  }
  if (mode.value === 'forgot') {
    void handleReset()
  }
}

function startCountdown() {
  countdown.value = 60
  timer = setInterval(() => {
    countdown.value--
    if (countdown.value <= 0) {
      clearInterval(timer!)
      timer = null
    }
  }, 1000)
}

async function handleSendCode(email: string) {
  if (!emailVerifyEnabled.value) {
    showMsg('邮箱验证码功能已关闭', true)
    return
  }
  if (mode.value === 'register' && !allowRegister.value) {
    showMsg('系统已关闭注册', true)
    return
  }
  const emailValue = email.trim()
  if (!isValidEmail(emailValue)) {
    showMsg('请输入正确的邮箱地址', true)
    return
  }
  if (!canSendCode.value) return

  const captchaId = mode.value === 'register' ? regCaptchaId.value : forgotCaptchaId.value
  const captchaCode = mode.value === 'register' ? regCaptchaCode.value : forgotCaptchaCode.value
  const captchaRef = mode.value === 'register' ? regCaptchaRef.value : forgotCaptchaRef.value

  if (!captchaId) {
    showMsg('验证码ID不能为空，请刷新验证码后重试', true)
    return
  }
  if (!isValidImageCaptcha(captchaCode)) {
    showMsg('请先输入图片验证码', true)
    return
  }

  loading.value = true
  clearMsg()
  try {
    const res = await sendCode({ email: emailValue, captchaId, captchaCode: captchaCode.trim() })
    showMsg(res.data.data)
    startCountdown()
    captchaRef?.refresh()
  } catch (e: any) {
    showMsg(e.message, true)
    captchaRef?.refresh()
  } finally {
    loading.value = false
  }
}

async function handleLogin() {
  const account = loginAccount.value.trim()
  if (!isValidAccount(account)) {
    showMsg('账号为 3-50 位且不能包含空格', true)
    return
  }
  if (!isValidPassword(loginPassword.value)) {
    showMsg('密码至少 6 位，且必须包含字母和数字', true)
    return
  }
  if (!loginCaptchaId.value) {
    showMsg('验证码ID不能为空，请刷新验证码后重试', true)
    return
  }
  if (!isValidImageCaptcha(loginCaptchaCode.value)) {
    showMsg('图片验证码为 4-5 位字母或数字', true)
    return
  }
  loading.value = true
  clearMsg()
  try {
    const res = await login({
      account,
      password: loginPassword.value,
      captchaId: loginCaptchaId.value,
      captchaCode: loginCaptchaCode.value.trim()
    })
    permissionStore.setToken(res.data.data.token)
    const meRes = await getMe()
    const user = meRes.data.data
    localStorage.setItem('user', JSON.stringify(user))
    showMsg('登录成功')
    setTimeout(() => emit('loggedIn', user), 300)
  } catch (e: any) {
    showMsg(e.message, true)
    loginCaptchaRef.value?.refresh()
  } finally {
    loading.value = false
  }
}

async function handleRegister() {
  if (!allowRegister.value) {
    showMsg('系统已关闭注册', true)
    return
  }
  const account = regAccount.value.trim()
  const email = regEmail.value.trim()
  const code = regCode.value.trim()
  if (!isValidAccount(account)) {
    showMsg('账号为 3-50 位且不能包含空格', true)
    return
  }
  if (!isValidPassword(regPassword.value)) {
    showMsg('密码至少 6 位，且必须包含字母和数字', true)
    return
  }
  if (regConfirmPassword.value !== regPassword.value) {
    showMsg('两次输入的密码不一致', true)
    return
  }
  if (!isValidEmail(email)) {
    showMsg('请输入正确的邮箱地址', true)
    return
  }
  if (emailVerifyEnabled.value && !isValidEmailCode(code)) {
    showMsg('邮箱验证码必须为 6 位数字', true)
    return
  }
  if (!regPrivacyConsent.value) {
    showMsg('请先阅读并同意隐私条款', true)
    return
  }
  loading.value = true
  clearMsg()
  try {
    const res = await register({
      account,
      password: regPassword.value,
      confirmPassword: regConfirmPassword.value,
      email,
      code,
      privacyConsent: regPrivacyConsent.value
    })
    permissionStore.setToken(res.data.data.token)
    const meRes = await getMe()
    const user = meRes.data.data
    localStorage.setItem('user', JSON.stringify(user))
    showMsg('注册成功')
    setTimeout(() => emit('loggedIn', user), 300)
  } catch (e: any) {
    showMsg(e.message, true)
  } finally {
    loading.value = false
  }
}

async function handleReset() {
  const email = forgotEmail.value.trim()
  const code = forgotCode.value.trim()
  if (!isValidEmail(email)) {
    showMsg('请输入正确的邮箱地址', true)
    return
  }
  if (emailVerifyEnabled.value && !isValidEmailCode(code)) {
    showMsg('邮箱验证码必须为 6 位数字', true)
    return
  }
  if (!isValidPassword(forgotNewPassword.value)) {
    showMsg('新密码至少 6 位，且必须包含字母和数字', true)
    return
  }
  if (forgotConfirmPassword.value !== forgotNewPassword.value) {
    showMsg('两次输入的新密码不一致', true)
    return
  }
  loading.value = true
  clearMsg()
  try {
    await resetPassword({
      email,
      code,
      newPassword: forgotNewPassword.value,
      confirmPassword: forgotConfirmPassword.value
    })
    showMsg('密码重置成功，请登录')
    setTimeout(() => (mode.value = 'login'), 500)
  } catch (e: any) {
    showMsg(e.message, true)
  } finally {
    loading.value = false
  }
}

onMounted(async () => {
  try {
    const res = await getPublicSystemConfig()
    allowRegister.value = res.data.data.allowRegister
    emailVerifyEnabled.value = res.data.data.emailVerifyEnabled
    if (!allowRegister.value && mode.value === 'register') {
      mode.value = 'login'
    }
  } catch {
    allowRegister.value = true
    emailVerifyEnabled.value = true
  }
})
</script>

<template>
  <n-modal show @mask-click="emit('close')">
    <n-card style="width: min(520px, 92vw);" title="账号中心" :bordered="false">
      <n-tabs v-model:value="mode" type="line">
        <n-tab-pane name="login" tab="登录">
          <n-form @keydown.enter.prevent="handleEnterSubmit">
            <n-form-item label="账号">
              <n-input v-model:value="loginAccount" placeholder="请输入账号" />
            </n-form-item>
            <n-form-item label="密码">
              <n-input v-model:value="loginPassword" type="password" placeholder="请输入密码" />
            </n-form-item>
            <n-form-item label="图片验证码">
              <CaptchaInput v-model:captchaId="loginCaptchaId" v-model:captchaCode="loginCaptchaCode" ref="loginCaptchaRef" />
            </n-form-item>
            <n-space justify="space-between">
              <n-button secondary @click="emit('close')">取消</n-button>
              <n-button type="primary" :loading="loading" @click="handleLogin">登录</n-button>
            </n-space>
          </n-form>
        </n-tab-pane>

        <n-tab-pane v-if="allowRegister" name="register" tab="注册">
          <n-form @keydown.enter.prevent="handleEnterSubmit">
            <n-form-item label="账号">
              <n-input v-model:value="regAccount" placeholder="请输入账号" />
            </n-form-item>
            <n-form-item label="密码">
              <n-input v-model:value="regPassword" type="password" placeholder="至少 6 位，需包含字母和数字" />
            </n-form-item>
            <n-form-item label="确认密码">
              <n-input v-model:value="regConfirmPassword" type="password" placeholder="再次输入密码" />
            </n-form-item>
            <n-form-item label="邮箱">
              <n-input v-model:value="regEmail" placeholder="email@example.com" />
            </n-form-item>
            <n-form-item v-if="emailVerifyEnabled" label="图片验证码">
              <CaptchaInput v-model:captchaId="regCaptchaId" v-model:captchaCode="regCaptchaCode" ref="regCaptchaRef" />
            </n-form-item>
            <n-form-item v-if="emailVerifyEnabled" label="邮箱验证码">
              <n-space>
                <n-input v-model:value="regCode" placeholder="6 位验证码" style="width: 160px;" />
                <n-button :disabled="!canSendCode" @click="handleSendCode(regEmail)">
                  {{ countdown ? `${countdown}s` : '发送验证码' }}
                </n-button>
              </n-space>
            </n-form-item>
            <n-form-item label="隐私条款">
              <n-checkbox v-model:checked="regPrivacyConsent">
                我已阅读并同意
                <n-button text size="tiny" @click.stop="openPrivacy">隐私条款</n-button>
              </n-checkbox>
            </n-form-item>
            <n-space justify="space-between">
              <n-button secondary @click="emit('close')">取消</n-button>
              <n-button type="primary" :loading="loading" @click="handleRegister">注册</n-button>
            </n-space>
          </n-form>
        </n-tab-pane>

        <n-tab-pane name="forgot" tab="忘记密码">
          <n-form @keydown.enter.prevent="handleEnterSubmit">
            <n-form-item label="邮箱">
              <n-input v-model:value="forgotEmail" placeholder="email@example.com" />
            </n-form-item>
            <n-form-item v-if="emailVerifyEnabled" label="图片验证码">
              <CaptchaInput v-model:captchaId="forgotCaptchaId" v-model:captchaCode="forgotCaptchaCode" ref="forgotCaptchaRef" />
            </n-form-item>
            <n-form-item v-if="emailVerifyEnabled" label="邮箱验证码">
              <n-space>
                <n-input v-model:value="forgotCode" placeholder="6 位验证码" style="width: 160px;" />
                <n-button :disabled="!canSendCode" @click="handleSendCode(forgotEmail)">
                  {{ countdown ? `${countdown}s` : '发送验证码' }}
                </n-button>
              </n-space>
            </n-form-item>
            <n-form-item label="新密码">
              <n-input v-model:value="forgotNewPassword" type="password" placeholder="至少 6 位，需包含字母和数字" />
            </n-form-item>
            <n-form-item label="确认新密码">
              <n-input v-model:value="forgotConfirmPassword" type="password" placeholder="再次输入密码" />
            </n-form-item>
            <n-space justify="space-between">
              <n-button secondary @click="emit('close')">取消</n-button>
              <n-button type="primary" :loading="loading" @click="handleReset">重置</n-button>
            </n-space>
          </n-form>
        </n-tab-pane>
      </n-tabs>

      <n-alert v-if="message" :type="isError ? 'error' : 'success'" class="mt-12">
        {{ message }}
      </n-alert>
    </n-card>
  </n-modal>
</template>

<style scoped>
.mt-12 {
  margin-top: 12px;
}

</style>
