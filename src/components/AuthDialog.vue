<script setup lang="ts">
/**
 * @file 认证弹窗：登录、注册与找回密码流程。
 */
import { ref, computed } from 'vue'
import { login, register, resetPassword, getMe } from '../api/auth'
import { sendCode } from '../api/verifyCode'
import type { UserDto } from '../api/types'
import CaptchaInput from './CaptchaInput.vue'

const emit = defineEmits<{
  close: []
  loggedIn: [user: UserDto]
}>()

// --- Mode ---
type Mode = 'login' | 'register' | 'forgot'
const mode = ref<Mode>('login')

// --- Shared state ---
const loading = ref(false)
const message = ref('')
const isError = ref(false)
const countdown = ref(0)
let timer: ReturnType<typeof setInterval> | null = null

// --- Login fields ---
const loginAccount = ref('')
const loginPassword = ref('')
const loginCaptchaId = ref('')
const loginCaptchaCode = ref('')
const loginCaptchaRef = ref<InstanceType<typeof CaptchaInput> | null>(null)

// --- Register fields ---
const regAccount = ref('')
const regPassword = ref('')
const regConfirmPassword = ref('')
const regEmail = ref('')
const regCode = ref('')
const regCaptchaId = ref('')
const regCaptchaCode = ref('')
const regCaptchaRef = ref<InstanceType<typeof CaptchaInput> | null>(null)

// --- Forgot fields ---
const forgotEmail = ref('')
const forgotCode = ref('')
const forgotNewPassword = ref('')
const forgotConfirmPassword = ref('')
const forgotCaptchaId = ref('')
const forgotCaptchaCode = ref('')
const forgotCaptchaRef = ref<InstanceType<typeof CaptchaInput> | null>(null)

// --- Computed ---
const dialogTitle = computed(() => {
  switch (mode.value) {
    case 'login': return '登录'
    case 'register': return '注册'
    case 'forgot': return '重置密码'
  }
})

const canLogin = computed(() =>
  loginAccount.value.length > 0 &&
  loginPassword.value.length >= 6 &&
  loginCaptchaCode.value.length >= 4 &&
  !loading.value
)

const canRegister = computed(() =>
  regAccount.value.length > 0 &&
  regPassword.value.length >= 6 &&
  regConfirmPassword.value === regPassword.value &&
  regEmail.value.includes('@') &&
  regCode.value.length === 6 &&
  !loading.value
)

const canReset = computed(() =>
  forgotEmail.value.includes('@') &&
  forgotCode.value.length === 6 &&
  forgotNewPassword.value.length >= 6 &&
  forgotConfirmPassword.value === forgotNewPassword.value &&
  !loading.value
)

const canSendCode = computed(() => countdown.value === 0 && !loading.value)

// --- Helpers ---
/**
 * @description 显示提示消息。
 * @param {string} msg 提示内容。
 * @param {boolean} [error=false] 是否为错误提示。
 */
function showMsg(msg: string, error = false) {
  message.value = msg
  isError.value = error
}

/**
 * @description 清空提示消息。
 */
function clearMsg() {
  message.value = ''
  isError.value = false
}

/**
 * @description 启动验证码倒计时。
 */
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

/**
 * @description 切换弹窗模式并重置提示。
 * @param {Mode} newMode 目标模式。
 */
function switchMode(newMode: Mode) {
  mode.value = newMode
  clearMsg()
}

// --- Send verification code (requires captcha) ---
/**
 * @description 发送邮箱验证码（需图片验证码）。
 * @param {string} email 邮箱地址。
 */
async function handleSendCode(email: string) {
  if (!email.includes('@') || !canSendCode.value) return

  const captchaId = mode.value === 'register' ? regCaptchaId.value : forgotCaptchaId.value
  const captchaCode = mode.value === 'register' ? regCaptchaCode.value : forgotCaptchaCode.value
  const captchaRef = mode.value === 'register' ? regCaptchaRef.value : forgotCaptchaRef.value

  if (captchaCode.length < 4) {
    showMsg('请先输入图片验证码', true)
    return
  }

  loading.value = true
  clearMsg()
  try {
    const res = await sendCode({ email, captchaId, captchaCode })
    showMsg(res.data.data)
    startCountdown()
    // 发送成功后刷新验证码备用
    captchaRef?.refresh()
  } catch (e: any) {
    showMsg(e.message, true)
    captchaRef?.refresh()
  } finally {
    loading.value = false
  }
}

// --- Login ---
/**
 * @description 登录并拉取用户信息。
 */
async function handleLogin() {
  if (!canLogin.value) return
  loading.value = true
  clearMsg()
  try {
    const res = await login({
      account: loginAccount.value,
      password: loginPassword.value,
      captchaId: loginCaptchaId.value,
      captchaCode: loginCaptchaCode.value
    })
    const tokenDto = res.data.data
    localStorage.setItem('token', tokenDto.token)
    // 通过 token 获取用户信息
    const meRes = await getMe()
    const user = meRes.data.data
    localStorage.setItem('user', JSON.stringify(user))
    showMsg('登录成功')
    setTimeout(() => emit('loggedIn', user), 600)
  } catch (e: any) {
    showMsg(e.message, true)
    loginCaptchaRef.value?.refresh()
  } finally {
    loading.value = false
  }
}

// --- Register ---
/**
 * @description 注册账号并拉取用户信息。
 */
async function handleRegister() {
  if (!canRegister.value) return
  loading.value = true
  clearMsg()
  try {
    const res = await register({
      account: regAccount.value,
      password: regPassword.value,
      confirmPassword: regConfirmPassword.value,
      email: regEmail.value,
      code: regCode.value
    })
    const tokenDto = res.data.data
    localStorage.setItem('token', tokenDto.token)
    // 通过 token 获取用户信息
    const meRes = await getMe()
    const user = meRes.data.data
    localStorage.setItem('user', JSON.stringify(user))
    showMsg('注册成功')
    setTimeout(() => emit('loggedIn', user), 600)
  } catch (e: any) {
    showMsg(e.message, true)
  } finally {
    loading.value = false
  }
}

// --- Reset Password ---
/**
 * @description 重置密码后返回登录模式。
 */
async function handleReset() {
  if (!canReset.value) return
  loading.value = true
  clearMsg()
  try {
    await resetPassword({
      email: forgotEmail.value,
      code: forgotCode.value,
      newPassword: forgotNewPassword.value,
      confirmPassword: forgotConfirmPassword.value
    })
    showMsg('密码重置成功，请登录')
    setTimeout(() => switchMode('login'), 1200)
  } catch (e: any) {
    showMsg(e.message, true)
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="overlay" @click.self="emit('close')">
    <div class="dialog">
      <div class="dialog-header">
        <h3>{{ dialogTitle }}</h3>
        <button class="close-btn" @click="emit('close')">&times;</button>
      </div>

      <!-- ===== LOGIN ===== -->
      <div v-if="mode === 'login'" class="dialog-body">
        <label class="field-label">账号</label>
        <input
          v-model="loginAccount"
          type="text"
          class="input"
          placeholder="请输入账号"
          @keyup.enter="handleLogin"
        />
        <label class="field-label">密码</label>
        <input
          v-model="loginPassword"
          type="password"
          class="input"
          placeholder="请输入密码"
          @keyup.enter="handleLogin"
        />
        <label class="field-label">图片验证码</label>
        <CaptchaInput
          ref="loginCaptchaRef"
          v-model:captcha-id="loginCaptchaId"
          v-model:captcha-code="loginCaptchaCode"
        />
        <button class="primary-btn" :disabled="!canLogin" @click="handleLogin">
          {{ loading ? '登录中...' : '登录' }}
        </button>
        <div class="link-row">
          <button class="link-btn" @click="switchMode('forgot')">忘记密码?</button>
          <button class="link-btn" @click="switchMode('register')">注册账号</button>
        </div>
      </div>

      <!-- ===== REGISTER ===== -->
      <div v-else-if="mode === 'register'" class="dialog-body">
        <label class="field-label">账号</label>
        <input v-model="regAccount" type="text" class="input" placeholder="请输入账号" />
        <label class="field-label">密码</label>
        <input v-model="regPassword" type="password" class="input" placeholder="请输入密码 (至少6位)" />
        <label class="field-label">确认密码</label>
        <input v-model="regConfirmPassword" type="password" class="input" placeholder="请再次输入密码" />
        <label class="field-label">邮箱</label>
        <input v-model="regEmail" type="email" class="input" placeholder="请输入邮箱" />
        <label class="field-label">图片验证码</label>
        <CaptchaInput
          ref="regCaptchaRef"
          v-model:captcha-id="regCaptchaId"
          v-model:captcha-code="regCaptchaCode"
        />
        <label class="field-label">邮箱验证码</label>
        <div class="code-row">
          <input v-model="regCode" type="text" class="input" maxlength="6" placeholder="6位验证码" />
          <button
            class="secondary-btn send-btn"
            :disabled="!regEmail.includes('@') || regCaptchaCode.length < 4 || !canSendCode"
            @click="handleSendCode(regEmail)"
          >
            {{ countdown > 0 ? `${countdown}s` : '发送' }}
          </button>
        </div>
        <button class="primary-btn" :disabled="!canRegister" @click="handleRegister">
          {{ loading ? '注册中...' : '注册' }}
        </button>
        <div class="link-row">
          <button class="link-btn" @click="switchMode('login')">已有账号? 去登录</button>
        </div>
      </div>

      <!-- ===== FORGOT PASSWORD ===== -->
      <div v-else class="dialog-body">
        <label class="field-label">邮箱</label>
        <input v-model="forgotEmail" type="email" class="input" placeholder="请输入注册时的邮箱" />
        <label class="field-label">图片验证码</label>
        <CaptchaInput
          ref="forgotCaptchaRef"
          v-model:captcha-id="forgotCaptchaId"
          v-model:captcha-code="forgotCaptchaCode"
        />
        <label class="field-label">邮箱验证码</label>
        <div class="code-row">
          <input v-model="forgotCode" type="text" class="input" maxlength="6" placeholder="6位验证码" />
          <button
            class="secondary-btn send-btn"
            :disabled="!forgotEmail.includes('@') || forgotCaptchaCode.length < 4 || !canSendCode"
            @click="handleSendCode(forgotEmail)"
          >
            {{ countdown > 0 ? `${countdown}s` : '发送' }}
          </button>
        </div>
        <label class="field-label">新密码</label>
        <input v-model="forgotNewPassword" type="password" class="input" placeholder="请输入新密码 (至少6位)" />
        <label class="field-label">确认新密码</label>
        <input v-model="forgotConfirmPassword" type="password" class="input" placeholder="请再次输入新密码" />
        <button class="primary-btn" :disabled="!canReset" @click="handleReset">
          {{ loading ? '重置中...' : '重置密码' }}
        </button>
        <div class="link-row">
          <button class="link-btn" @click="switchMode('login')">返回登录</button>
        </div>
      </div>

      <!-- Message -->
      <div v-if="message" class="message" :class="{ error: isError }">
        {{ message }}
      </div>
    </div>
  </div>
</template>

<style scoped>
.overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.4);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.dialog {
  background: var(--color-surface, #fff);
  border-radius: 12px;
  width: 380px;
  max-height: 90vh;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.15);
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.dialog-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 20px 24px 0;
}

.dialog-header h3 {
  margin: 0;
  font-size: 18px;
  color: var(--color-text-main, #111827);
}

.close-btn {
  background: none;
  border: none;
  font-size: 24px;
  cursor: pointer;
  color: var(--color-text-muted, #6b7280);
  line-height: 1;
  padding: 0 4px;
}
.close-btn:hover {
  color: var(--color-text-main, #111827);
}

.dialog-body {
  padding: 20px 24px 24px;
  display: flex;
  flex-direction: column;
  gap: 12px;
  overflow-y: auto;
}

.field-label {
  font-size: 14px;
  font-weight: 500;
  color: var(--color-text-main, #111827);
}

.input {
  width: 100%;
  padding: 10px 14px;
  border: 1px solid var(--color-border, #e5e7eb);
  border-radius: 8px;
  font-size: 14px;
  outline: none;
  box-sizing: border-box;
  transition: border-color 0.2s;
  background: var(--color-surface, #fff);
  color: var(--color-text-main, #111827);
}
.input:focus {
  border-color: var(--color-primary, #10b981);
  box-shadow: 0 0 0 3px var(--focus-ring, rgba(16, 185, 129, 0.4));
}
.input::placeholder {
  color: var(--color-text-muted, #6b7280);
}

.primary-btn {
  padding: 10px 20px;
  background: var(--color-primary, #10b981);
  color: #fff;
  border: none;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: opacity 0.2s;
}
.primary-btn:hover:not(:disabled) {
  opacity: 0.9;
}
.primary-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.secondary-btn {
  padding: 10px 20px;
  background: var(--color-bg-light, #f9fafb);
  color: var(--color-text-main, #111827);
  border: 1px solid var(--color-border, #e5e7eb);
  border-radius: 8px;
  font-size: 14px;
  cursor: pointer;
}
.secondary-btn:hover:not(:disabled) {
  background: var(--color-border, #e5e7eb);
}
.secondary-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.code-row {
  display: flex;
  gap: 10px;
}
.code-row .input {
  flex: 1;
}

.send-btn {
  white-space: nowrap;
  min-width: 72px;
}

.link-row {
  display: flex;
  justify-content: space-between;
  padding-top: 4px;
}

.link-btn {
  background: none;
  border: none;
  color: var(--color-primary, #10b981);
  font-size: 13px;
  cursor: pointer;
  padding: 0;
}
.link-btn:hover {
  text-decoration: underline;
}

.message {
  padding: 10px 24px 16px;
  font-size: 13px;
  color: var(--color-primary, #10b981);
  text-align: center;
}
.message.error {
  color: #ef4444;
}
</style>
