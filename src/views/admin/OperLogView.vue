<script setup lang="ts">
/**
 * @file 操作日志视图。
 */
import { h, onMounted, ref } from 'vue'
import { NCard, NDataTable, NInput, NSelect, NButton, NSpace, NTag, NPagination } from 'naive-ui'
import type { DataTableColumns } from 'naive-ui'
import { getOperLogs } from '../../api/log'
import type { OperLogDto } from '../../api/types'

const loading = ref(false)
const keyword = ref('')
const status = ref<number | null>(null)
const logs = ref<OperLogDto[]>([])
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
  { title: '时间', key: 'createTime' },
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
