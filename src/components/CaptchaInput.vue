<script setup lang="ts">
/**
 * @file 图片验证码输入组件，支持刷新与双向绑定。
 */
import { ref, onMounted } from 'vue'
import { generateCaptcha } from '../api/captcha'

const captchaId = ref('')
const captchaCode = ref('')
const imageBase64 = ref('')
const loadingCaptcha = ref(false)

const emit = defineEmits<{
  'update:captchaId': [value: string]
  'update:captchaCode': [value: string]
}>()

/**
 * @description 加载 / 刷新验证码。
 */
async function refresh() {
  loadingCaptcha.value = true
  captchaCode.value = ''
  emit('update:captchaCode', '')
  try {
    const res = await generateCaptcha()
    captchaId.value = res.data.data.captchaId
    imageBase64.value = res.data.data.imageBase64
    emit('update:captchaId', captchaId.value)
  } catch {
    imageBase64.value = ''
  } finally {
    loadingCaptcha.value = false
  }
}

/**
 * @description 处理验证码输入并向外同步。
 * @param {Event} e 输入事件。
 */
function onCodeInput(e: Event) {
  const val = (e.target as HTMLInputElement).value
  captchaCode.value = val
  emit('update:captchaCode', val)
}

onMounted(() => refresh())

defineExpose({ refresh })
</script>

<template>
  <div class="captcha-row">
    <input
      :value="captchaCode"
      type="text"
      class="input captcha-input"
      maxlength="5"
      placeholder="请输入验证码"
      autocomplete="off"
      @input="onCodeInput"
    />
    <img
      v-if="imageBase64"
      :src="`data:image/png;base64,${imageBase64}`"
      class="captcha-image"
      title="点击刷新验证码"
      alt="验证码"
      @click="refresh"
    />
    <div v-else class="captcha-placeholder" @click="refresh">
      {{ loadingCaptcha ? '加载中...' : '点击获取' }}
    </div>
  </div>
</template>

<style scoped>
.captcha-row {
  display: flex;
  gap: 10px;
  align-items: center;
  width: 100%;
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

.captcha-input {
  flex: 1;
}

.captcha-image {
  height: 40px;
  border-radius: 6px;
  cursor: pointer;
  border: 1px solid var(--color-border, #e5e7eb);
  transition: opacity 0.2s;
}
.captcha-image:hover {
  opacity: 0.8;
}

.captcha-placeholder {
  height: 40px;
  min-width: 120px;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 1px dashed var(--color-border, #e5e7eb);
  border-radius: 6px;
  font-size: 12px;
  color: var(--color-text-muted, #6b7280);
  cursor: pointer;
}
</style>
