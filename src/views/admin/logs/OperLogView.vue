<script setup lang="ts">
/**
 * @file 操作日志视图。
 */
import { h, onMounted, ref } from 'vue'
import { NCard, NDataTable, NInput, NSelect, NButton, NSpace, NTag, NPagination, useDialog, useMessage } from 'naive-ui'
import type { DataTableColumns } from 'naive-ui'
import { clearOperLogs, getOperLogs } from '../../../api/log'
import type { OperLogDto } from '../../../api/types'
import { TimeFormatter } from '../../../utils/time'

const loading = ref(false)
const keyword = ref('')
const status = ref<number | null>(null)
const logs = ref<OperLogDto[]>([])
const pageIndex = ref(1)
const pageSize = ref(20)
const total = ref(0)
const dialog = useDialog()
const message = useMessage()
const apiBase = import.meta.env.VITE_API_BASE || 'http://localhost:8888/api'

const statusOptions = [
  { label: '全部', value: null },
  { label: '成功', value: 1 },
  { label: '失败', value: 2 },
]

const fetchLogs = async () => {
  loading.value = true
  try {
    const res = await getOperLogs({
      pageIndex: pageIndex.value,
      pageSize: pageSize.value,
      keyword: keyword.value || undefined,
      status: status.value || undefined,
    })
    logs.value = res.data.data.items || []
    total.value = Number(res.data.data.total || 0)
  } finally {
    loading.value = false
  }
}

const buildDownloadUrl = () => {
  const params = new URLSearchParams()
  if (keyword.value) params.set('keyword', keyword.value)
  if (status.value) params.set('status', String(status.value))
  return `${apiBase}/logs/oper/download?${params.toString()}`
}

const downloadLogs = async () => {
  const token = localStorage.getItem('token')
  if (!token) {
    message.warning('未检测到登录凭证，无法下载')
    return
  }
  try {
    const res = await fetch(buildDownloadUrl(), {
      headers: { Authorization: `Bearer ${token}` },
    })
    if (!res.ok) {
      message.error(`下载失败: HTTP ${res.status}`)
      return
    }
    const contentType = res.headers.get('content-type') || ''
    if (contentType.includes('application/json')) {
      const json = await res.json()
      message.error(json.msg || '下载失败')
      return
    }
    const blob = await res.blob()
    const fileName = res.headers.get('content-disposition')?.split('filename=')[1]?.replace(/\"/g, '') || 'oper-logs.csv'
    const blobUrl = window.URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = blobUrl
    link.download = fileName
    link.click()
    window.URL.revokeObjectURL(blobUrl)
  } catch (err: any) {
    message.error(err?.message || '下载失败')
  }
}

const confirmClear = () => {
  dialog.warning({
    title: '确认清空操作日志',
    content: '该操作会清空全部操作日志且无法恢复，是否继续？',
    positiveText: '确认',
    negativeText: '取消',
    onPositiveClick: async () => {
      try {
        await clearOperLogs()
        message.success('操作日志已清空')
        await fetchLogs()
      } catch (err: any) {
        message.error(err?.message || '清空失败')
      }
    },
  })
}

const columns = ref<DataTableColumns<OperLogDto>>([
  { title: '操作', key: 'action' },
  { title: '用户', key: 'userName' },
  { title: '方法', key: 'method' },
  { title: '路径', key: 'path' },
  { title: 'IP', key: 'ip' },
  {
    title: '状态',
    key: 'status',
    render: (row) =>
      h(NTag, { size: 'small', type: row.status === 1 ? 'success' : 'error' }, { default: () => (row.status === 1 ? '成功' : '失败') }),
  },
  { title: '耗时(ms)', key: 'durationMs' },
  {
    title: '时间',
    key: 'createTime',
    render: (row) => TimeFormatter.formatDateTime(row.createTime),
  },
])

onMounted(fetchLogs)
</script>

<template>
  <n-card title="操作日志" size="large">
    <n-space align="center" justify="space-between">
      <n-space>
        <n-input v-model:value="keyword" placeholder="关键字" style="width: 220px" />
        <n-select v-model:value="status" :options="statusOptions" style="width: 140px" />
      </n-space>
      <n-space>
        <n-button type="primary" @click="fetchLogs" :loading="loading">查询</n-button>
        <n-button secondary @click="downloadLogs">下载</n-button>
        <n-button secondary @click="confirmClear">清空</n-button>
      </n-space>
    </n-space>

    <n-space vertical size="large" style="margin-top: 12px;">
      <n-data-table :columns="columns" :data="logs" :loading="loading" :bordered="false" />
      <n-pagination
        v-model:page="pageIndex"
        v-model:page-size="pageSize"
        :item-count="total"
        :page-sizes="[10, 20, 50, 100]"
        show-size-picker
        @update:page="fetchLogs"
        @update:page-size="fetchLogs"
      />
    </n-space>
  </n-card>
</template>
