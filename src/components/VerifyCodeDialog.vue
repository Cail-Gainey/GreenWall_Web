<script setup lang="ts">
/**
 * @file 邮箱验证码弹窗：发送与校验验证码。
 */
import { ref, computed } from 'vue'
import { sendCode, verifyCode } from '../api/verifyCode'
import CaptchaInput from './CaptchaInput.vue'
import { isValidEmail, isValidEmailCode, isValidImageCaptcha } from '../utils/validators'

const emit = defineEmits<{
  close: []
  verified: [email: string]
}>()

const email = ref('')
const code = ref('')
const step = ref<'email' | 'code'>('email')
const loading = ref(false)
const message = ref('')
const isError = ref(false)
const countdown = ref(0)
const captchaId = ref('')
const captchaCode = ref('')
const captchaRef = ref<InstanceType<typeof CaptchaInput> | null>(null)

let timer: ReturnType<typeof setInterval> | null = null

const canSend = computed(() =>
  isValidEmail(email.value) &&
  isValidImageCaptcha(captchaCode.value) &&
  countdown.value === 0 &&
  !loading.value
)
const canVerify = computed(() => isValidEmailCode(code.value) && !loading.value)

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
 * @description 设置提示消息。
 * @param {string} msg 提示内容。
 * @param {boolean} [error=false] 是否为错误提示。
 */
function showMsg(msg: string, error = false) {
  message.value = msg
  isError.value = error
}

/**
 * @description 发送验证码到邮箱。
 */
async function handleSendCode() {
  const emailValue = email.value.trim()
  if (!isValidEmail(emailValue)) {
    showMsg('请输入正确的邮箱地址', true)
    return
  }
  if (!captchaId.value) {
    showMsg('验证码ID不能为空，请刷新验证码后重试', true)
    return
  }
  if (!isValidImageCaptcha(captchaCode.value)) {
    showMsg('图片验证码为 4-5 位字母或数字', true)
    return
  }
  if (!canSend.value) return
  loading.value = true
  message.value = ''
  try {
    const res = await sendCode({
      email: emailValue,
      captchaId: captchaId.value,
      captchaCode: captchaCode.value.trim()
    })
    showMsg(res.data.data)
    step.value = 'code'
    startCountdown()
    captchaRef.value?.refresh()
  } catch (e: any) {
    showMsg(e.message, true)
    captchaRef.value?.refresh()
  } finally {
    loading.value = false
  }
}

/**
 * @description 校验邮箱验证码并通知父组件。
 */
async function handleVerify() {
  const emailValue = email.value.trim()
  const codeValue = code.value.trim()
  if (!isValidEmail(emailValue)) {
    showMsg('请输入正确的邮箱地址', true)
    return
  }
  if (!isValidEmailCode(codeValue)) {
    showMsg('验证码必须为 6 位数字', true)
    return
  }
  if (!canVerify.value) return
  loading.value = true
  message.value = ''
  try {
    await verifyCode({ email: emailValue, code: codeValue })
    showMsg('验证成功')
    setTimeout(() => emit('verified', emailValue), 800)
  } catch (e: any) {
    showMsg(e.message, true)
  } finally {
    loading.value = false
  }
}

/**
 * @description 返回输入邮箱步骤并清理状态。
 */
function handleBack() {
  step.value = 'email'
  code.value = ''
  message.value = ''
}
</script>

<template>
  <div class="overlay" @click.self="emit('close')">
    <div class="dialog">
      <div class="dialog-header">
        <h3>邮箱验证</h3>
        <button class="close-btn" @click="emit('close')">&times;</button>
      </div>

      <!-- Step 1: 输入邮箱 -->
      <div v-if="step === 'email'" class="dialog-body">
        <label class="field-label">邮箱地址</label>
        <input
          v-model="email"
          type="email"
          class="input"
          placeholder="请输入邮箱"
          @keyup.enter="handleSendCode"
        />
        <label class="field-label">图片验证码</label>
        <CaptchaInput
          ref="captchaRef"
          v-model:captcha-id="captchaId"
          v-model:captcha-code="captchaCode"
        />
        <button class="primary-btn" :disabled="!canSend" @click="handleSendCode">
          {{ loading ? '发送中...' : '发送验证码' }}
        </button>
      </div>

      <!-- Step 2: 输入验证码 -->
      <div v-else class="dialog-body">
        <p class="hint">验证码已发送至 <strong>{{ email }}</strong></p>
        <label class="field-label">验证码</label>
        <input
          v-model="code"
          type="text"
          class="input"
          maxlength="6"
          placeholder="请输入6位验证码"
          @keyup.enter="handleVerify"
        />
        <div class="btn-row">
          <button class="secondary-btn" @click="handleBack">返回</button>
          <button class="primary-btn" :disabled="!canVerify" @click="handleVerify">
            {{ loading ? '验证中...' : '验证' }}
          </button>
        </div>
        <button
          class="resend-btn"
          :disabled="countdown > 0 || loading"
          @click="handleSendCode"
        >
          {{ countdown > 0 ? `${countdown}s 后可重新发送` : '重新发送验证码' }}
        </button>
      </div>

      <!-- 提示消息 -->
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
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.15);
  overflow: hidden;
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
}
.input:focus {
  border-color: var(--color-primary, #10b981);
  box-shadow: 0 0 0 3px var(--focus-ring, rgba(16, 185, 129, 0.4));
}

.primary-btn {
  padding: 10px 20px;
  background: var(--color-primary, #10b981);
  color: var(--color-text-inverse);
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
.secondary-btn:hover {
  background: var(--color-border, #e5e7eb);
}

.btn-row {
  display: flex;
  gap: 10px;
}
.btn-row .primary-btn {
  flex: 1;
}

.resend-btn {
  background: none;
  border: none;
  color: var(--color-primary, #10b981);
  font-size: 13px;
  cursor: pointer;
  text-align: center;
  padding: 4px 0;
}
.resend-btn:disabled {
  color: var(--color-text-muted, #6b7280);
  cursor: not-allowed;
}

.hint {
  font-size: 14px;
  color: var(--color-text-muted, #6b7280);
  margin: 0;
}
.hint strong {
  color: var(--color-text-main, #111827);
}

.message {
  padding: 10px 24px 16px;
  font-size: 13px;
  color: var(--color-primary, #10b981);
  text-align: center;
}
.message.error {
  color: var(--color-danger);
}
</style>
