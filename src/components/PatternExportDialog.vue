<script setup lang="ts">
import { computed, onBeforeUnmount, ref, watch } from 'vue'
import { NModal, NForm, NFormItem, NInput, NInputNumber, NSelect, NSpace, NButton, NDivider, NAlert, useMessage } from 'naive-ui'
import { createPatternExport, exportPatternJson, getPatternExportTask, downloadPatternExport, importPatternFromJson } from '../api/patternCommunity'
import type { PatternExportRequestDto, PatternExportTaskDto, PatternJsonPayload } from '../api/types'

const props = withDefaults(defineProps<{
  show: boolean
  patternId?: string | number | null
  patternTitle?: string
}>(), {
  show: false,
})

const emit = defineEmits<{ (e: 'update:show', value: boolean): void }>()

const message = useMessage()

const patternId = computed(() => (props.patternId ? String(props.patternId) : ''))
const patternTitle = computed(() => props.patternTitle || '未命名作品')

const form = ref<PatternExportRequestDto>({
  format: 'png',
  background: '#ffffff',
  scale: 1,
})

const task = ref<PatternExportTaskDto | null>(null)
const polling = ref(false)
const submitting = ref(false)
let pollTimer: number | null = null

const modalVisible = computed({
  get: () => props.show,
  set: (val: boolean) => emit('update:show', val),
})

const resetState = () => {
  form.value = { format: 'png', background: '#ffffff', scale: 1 }
  task.value = null
  stopPolling()
  submitting.value = false
}

watch(() => props.show, (show) => {
  if (!show) {
    resetState()
  }
})

const startPolling = (taskId: string) => {
  stopPolling()
  polling.value = true
  pollTimer = window.setInterval(async () => {
    await refreshTask(taskId)
  }, 2500)
}

const stopPolling = () => {
  polling.value = false
  if (pollTimer) {
    clearInterval(pollTimer)
    pollTimer = null
  }
}

const refreshTask = async (taskId: string) => {
  try {
    const res = await getPatternExportTask(taskId)
    task.value = res.data.data
    if (!task.value) return
    if (task.value.status === 'success' || task.value.status === 'failed') {
      stopPolling()
    }
  } catch (err: any) {
    stopPolling()
    message.error(err.message || '任务查询失败')
  }
}

const submitExport = async () => {
  if (!props.patternId) {
    message.warning('未选择作品')
    return
  }
  submitting.value = true
  try {
    const res = await createPatternExport(String(props.patternId), form.value)
    task.value = res.data.data
    if (task.value) {
      message.success('导出任务已创建')
      startPolling(task.value.taskId)
    }
  } catch (err: any) {
    message.error(err.message || '创建导出任务失败')
  } finally {
    submitting.value = false
  }
}

const downloadResult = async () => {
  if (!task.value) return
  try {
    const resp = await downloadPatternExport(task.value.taskId)
    const blob = resp.data as Blob
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = task.value.format === 'png' ? `${props.patternTitle || 'pattern'}.png` : `${props.patternTitle || 'pattern'}.${task.value.format}`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  } catch (err: any) {
    message.error(err.message || '下载失败')
  }
}

const downloadJson = async () => {
  if (!props.patternId) {
    message.warning('未选择作品')
    return
  }
  try {
    const res = await exportPatternJson(String(props.patternId))
    const blob = res.data as Blob
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${props.patternTitle || 'pattern'}.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  } catch (err: any) {
    message.error(err.message || '导出 JSON 失败')
  }
}

const importInput = ref<HTMLInputElement | null>(null)

const triggerImport = () => {
  importInput.value?.click()
}

const handleImportChange = async (event: Event) => {
  const files = (event.target as HTMLInputElement).files
  if (!files || files.length === 0) return
  const file = files[0]
  if (file.size > 2 * 1024 * 1024) {
    message.warning('JSON 文件过大')
    return
  }
  try {
    const text = await file.text()
    const payload = JSON.parse(text) as PatternJsonPayload
    const res = await importPatternFromJson(payload)
    message.success('导入成功，作品 ID: ' + res.data.data)
  } catch (err: any) {
    message.error(err.message || '导入失败，请检查文件内容')
  } finally {
    if (importInput.value) importInput.value.value = ''
  }
}

onBeforeUnmount(() => {
  stopPolling()
})
</script>

<template>
  <n-modal
    v-model:show="modalVisible"
    preset="card"
    title="导出与分享"
    closable
    class="export-dialog-modal"
    style="width: min(480px, 92vw);"
  >
    <div class="export-dialog-body">
      <n-form label-placement="top">
        <n-form-item label="作品">
          <n-input :value="patternTitle" disabled placeholder="未选择作品" />
        </n-form-item>
        <n-form-item label="格式">
          <n-select
            v-model:value="form.format"
            :options="[
              { label: 'PNG 图片', value: 'png' },
            ]"
          />
        </n-form-item>
        <n-form-item label="背景">
          <n-select
            v-model:value="form.background"
            :options="[
              { label: '透明背景', value: 'transparent' },
              { label: '白色', value: '#ffffff' },
              { label: '浅灰', value: '#f3f4f6' },
            ]"
          />
        </n-form-item>
        <n-form-item label="缩放">
          <n-input-number v-model:value="form.scale" :min="1" :max="4" style="width: 100%;" />
        </n-form-item>
        <n-form-item>
          <n-space class="action-row" :wrap="true">
            <n-button type="primary" :disabled="!patternId" :loading="submitting" @click="submitExport">开始导出</n-button>
            <n-button secondary @click="downloadJson">导出 JSON</n-button>
            <n-button secondary @click="triggerImport">导入 JSON</n-button>
          </n-space>
        </n-form-item>
      </n-form>

      <input ref="importInput" type="file" accept="application/json" style="display: none" @change="handleImportChange" />

      <n-divider />

      <div v-if="task">
        <n-alert :type="task.status === 'failed' ? 'error' : task.status === 'success' ? 'success' : 'info'" title="导出任务状态" closable>
          <template #default>
            <div>任务 ID：{{ task.taskId }}</div>
            <div>当前状态：{{ task.status }}</div>
            <div v-if="task.errorMessage">错误信息：{{ task.errorMessage }}</div>
          </template>
        </n-alert>
        <div style="margin-top: 12px;" v-if="task.status === 'success'">
          <n-button type="primary" @click="downloadResult">下载文件</n-button>
        </div>
      </div>
      <div v-else>
        <n-alert type="info">创建导出任务后将在此显示状态。</n-alert>
      </div>
    </div>
  </n-modal>
</template>

<style scoped>
.export-dialog-modal :deep(.n-card) {
  width: min(480px, 92vw);
  max-height: calc(100vh - 24px);
}

.export-dialog-modal :deep(.n-card__content) {
  max-height: calc(100vh - 140px);
  overflow-y: auto;
}

.export-dialog-body {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.action-row {
  width: 100%;
}
</style>
