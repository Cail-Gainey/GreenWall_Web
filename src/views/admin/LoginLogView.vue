<script setup lang="ts">
/**
 * @file 登录日志视图。
 */
import { h, onMounted, ref } from 'vue'
import { NCard, NDataTable, NInput, NSelect, NButton, NSpace, NTag, NPagination, useDialog, useMessage } from 'naive-ui'
import type { DataTableColumns } from 'naive-ui'
import { clearLoginLogs, getLoginLogs } from '../../api/log'
import type { LoginLogDto } from '../../api/types'
import { TimeFormatter } from '../../utils/time'

const loading = ref(false)
const account = ref('')
const status = ref<number | null>(null)
const logs = ref<LoginLogDto[]>([])
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
    const res = await getLoginLogs({
      pageIndex: pageIndex.value,
      pageSize: pageSize.value,
      account: account.value || undefined,
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
  if (account.value) params.set('account', account.value)
  if (status.value) params.set('status', String(status.value))
  return `${apiBase}/logs/login/download?${params.toString()}`
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
    const fileName = res.headers.get('content-disposition')?.split('filename=')[1]?.replace(/\"/g, '') || 'login-logs.csv'
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
    title: '确认清空登录日志',
    content: '该操作会清空全部登录日志且无法恢复，是否继续？',
    positiveText: '确认',
    negativeText: '取消',
    onPositiveClick: async () => {
      try {
        await clearLoginLogs()
        message.success('登录日志已清空')
        await fetchLogs()
      } catch (err: any) {
        message.error(err?.message || '清空失败')
      }
    },
  })
}

const columns = ref<DataTableColumns<LoginLogDto>>([
  { title: '账号', key: 'account' },
  { title: 'IP', key: 'ip' },
  {
    title: '状态',
    key: 'status',
    render: (row) =>
      h(NTag, { size: 'small', type: row.status === 1 ? 'success' : 'error' }, { default: () => (row.status === 1 ? '成功' : '失败') }),
  },
  { title: '信息', key: 'message' },
  {
    title: '时间',
    key: 'createTime',
    render: (row) => TimeFormatter.formatDateTime(row.createTime),
  },
])

onMounted(fetchLogs)
</script>

<template>
  <n-card title="登录日志" size="large">
    <n-space align="center" justify="space-between">
      <n-space>
        <n-input v-model:value="account" placeholder="账号" style="width: 220px" />
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
