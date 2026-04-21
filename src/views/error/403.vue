<script setup lang="ts">
/**
 * @file 403 无权限页面。
 */
import { useRouter } from 'vue-router'

const router = useRouter()
</script>

<template>
  <div class="forbidden-page">
    <div class="forbidden-content">
      <h1>403</h1>
      <p>抱歉，您没有权限访问该页面</p>
      <button @click="router.push('/')">返回首页</button>
    </div>
  </div>
</template>

<style scoped>
.forbidden-page {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  background: var(--color-bg);
}
.forbidden-content {
  text-align: center;
}
.forbidden-content h1 {
  font-size: 6rem;
  font-weight: 700;
  color: var(--color-text-muted);
  margin: 0;
}
.forbidden-content p {
  font-size: 1.2rem;
  color: var(--color-text-muted);
  margin: 1rem 0 2rem;
}
.forbidden-content button {
  padding: 10px 24px;
  background: var(--color-primary);
  color: var(--color-text-inverse);
  border: none;
  border-radius: 8px;
  font-size: 1rem;
  cursor: pointer;
}
.forbidden-content button:hover {
  opacity: 0.9;
}
</style>
