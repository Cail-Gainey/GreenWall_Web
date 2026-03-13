<script setup lang="ts">
/**
 * @file 登录日志视图。
 */
import { h, onMounted, ref } from 'vue'
import { NCard, NDataTable, NInput, NSelect, NButton, NSpace, NTag, NPagination } from 'naive-ui'
import type { DataTableColumns } from 'naive-ui'
import { getLoginLogs } from '../../api/log'
import type { LoginLogDto } from '../../api/types'

const loading = ref(false)
const account = ref('')
const status = ref<number | null>(null)
const logs = ref<LoginLogDto[]>([])
const pageIndex = ref(1)
const pageSize = ref(20)
const total = ref(0)

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
  { title: '时间', key: 'createTime' },
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
      <n-button type="primary" @click="fetchLogs" :loading="loading">查询</n-button>
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
