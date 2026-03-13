<script setup lang="ts">
/**
 * @file 管理端仪表盘视图。
 */
import { computed, onMounted, ref, h } from 'vue'
import { NCard, NGrid, NGridItem, NStatistic, NSpace, NButton, NDataTable, NTag, NDivider, useMessage } from 'naive-ui'
import type { DataTableColumns } from 'naive-ui'
import { getDashboardSummary } from '../../api/dashboard'
import type { DashboardSummaryDto, DashboardTrendDto, LoginLogDto, OperLogDto } from '../../api/types'

const loading = ref(false)
const summary = ref<DashboardSummaryDto | null>(null)
const message = useMessage()

const load = async () => {
  loading.value = true
  try {
    const res = await getDashboardSummary()
    summary.value = res.data.data
  } catch (e: any) {
    summary.value = null
    message.error(e?.message || '加载仪表盘失败')
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  void load().catch(() => {
    // errors are already handled in load
  })
})

const trendColumns = ref<DataTableColumns<DashboardTrendDto>>([
  { title: '日期', key: 'date' },
  { title: '成功', key: 'success' },
  { title: '失败', key: 'fail' },
])

const loginColumns = ref<DataTableColumns<LoginLogDto>>([
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

const operColumns = ref<DataTableColumns<OperLogDto>>([
  { title: '操作', key: 'action' },
  { title: '用户', key: 'userName' },
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

const stats = computed(() => [
  { label: '用户数', value: summary.value?.userCount ?? '0' },
  { label: '角色数', value: summary.value?.roleCount ?? '0' },
  { label: '菜单数', value: summary.value?.menuCount ?? '0' },
  { label: '图案数', value: summary.value?.patternCount ?? '0' },
  { label: '字典类型', value: summary.value?.dictTypeCount ?? '0' },
  { label: '参数配置', value: summary.value?.configCount ?? '0' },
  { label: '登录日志', value: summary.value?.loginLogCount ?? '0' },
  { label: '操作日志', value: summary.value?.operLogCount ?? '0' },
])
</script>

<template>
  <n-space vertical size="large">
    <n-space align="center" justify="space-between">
      <div>
        <div style="font-weight: 700; font-size: 18px;">后台仪表盘</div>
        <div style="color: var(--color-text-muted); font-size: 12px;">系统概览与最近动态</div>
      </div>
      <n-button size="small" secondary :loading="loading" @click="load">刷新</n-button>
    </n-space>

    <n-grid :x-gap="16" :y-gap="16" :cols="4" responsive="screen">
      <n-grid-item v-for="item in stats" :key="item.label">
        <n-card size="small">
          <n-statistic :label="item.label" :value="item.value" />
        </n-card>
      </n-grid-item>
    </n-grid>

    <n-grid :x-gap="16" :y-gap="16" :cols="2" responsive="screen">
      <n-grid-item>
        <n-card title="登录趋势 (近 7 天)" size="small">
          <n-data-table :columns="trendColumns" :data="summary?.loginTrend || []" :bordered="false" />
        </n-card>
      </n-grid-item>
      <n-grid-item>
        <n-card title="操作趋势 (近 7 天)" size="small">
          <n-data-table :columns="trendColumns" :data="summary?.operTrend || []" :bordered="false" />
        </n-card>
      </n-grid-item>
    </n-grid>

    <n-divider />

    <n-grid :x-gap="16" :y-gap="16" :cols="2" responsive="screen">
      <n-grid-item>
        <n-card title="最近登录记录" size="small">
          <n-data-table :columns="loginColumns" :data="summary?.recentLoginLogs || []" :bordered="false" />
        </n-card>
      </n-grid-item>
      <n-grid-item>
        <n-card title="最近操作记录" size="small">
          <n-data-table :columns="operColumns" :data="summary?.recentOperLogs || []" :bordered="false" />
        </n-card>
      </n-grid-item>
    </n-grid>
  </n-space>
</template>
