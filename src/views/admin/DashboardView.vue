<script setup lang="ts">
/**
 * @file 管理端仪表盘视图。
 */
import { computed, onMounted, ref, h } from 'vue'
import { NCard, NGrid, NGridItem, NStatistic, NSpace, NButton, NDataTable, NTag, NDivider, NAvatar, useMessage } from 'naive-ui'
import type { DataTableColumns } from 'naive-ui'
import { getDashboardSummary } from '../../api/dashboard'
import type {
  DashboardSummaryDto,
  DashboardTopContributorDto,
  DashboardTopPatternDto,
  DashboardTrendDto,
  LoginLogDto,
  OperLogDto,
} from '../../api/types'
import { TimeFormatter } from '../../utils/time'
import { resolveAvatar, userAvatarFallback } from '../../utils/avatar'

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
  {
    title: '日期',
    key: 'date',
    render: (row) => TimeFormatter.formatDate(row.date),
  },
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
  {
    title: '时间',
    key: 'createTime',
    render: (row) => TimeFormatter.formatDateTime(row.createTime),
  },
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
  {
    title: '时间',
    key: 'createTime',
    render: (row) => TimeFormatter.formatDateTime(row.createTime),
  },
])

const topPatternColumns = ref<DataTableColumns<DashboardTopPatternDto>>([
  { title: '标题', key: 'title', ellipsis: { tooltip: true } },
  { title: '作者', key: 'creatorName', ellipsis: { tooltip: true } },
  { title: '浏览', key: 'viewCount', width: 80 },
  { title: '点赞', key: 'likeCount', width: 80 },
  { title: '评论', key: 'commentCount', width: 80 },
])

const topContributorColumns = ref<DataTableColumns<DashboardTopContributorDto>>([
  {
    title: '用户',
    key: 'nickName',
    render: (row) =>
      h(NSpace, { align: 'center', size: 'small', wrap: false }, {
        default: () => [
          h(NAvatar, {
            size: 24,
            round: true,
            src: resolveAvatar(row.avatar),
            fallbackSrc: userAvatarFallback,
          }),
          h('span', null, row.nickName || row.account),
        ],
      }),
    ellipsis: { tooltip: true },
  },
  { title: '账号', key: 'account', ellipsis: { tooltip: true } },
  { title: '图案数', key: 'patternCount', width: 90 },
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

const todayStats = computed(() => {
  const t = summary.value?.today
  return [
    { label: '今日登录', value: t?.todayLogins ?? '0', type: 'default' as const },
    { label: '今日登录失败', value: t?.todayFailedLogins ?? '0', type: 'warning' as const },
    { label: '今日操作', value: t?.todayOperations ?? '0', type: 'default' as const },
    { label: '今日新增用户', value: t?.newUsersToday ?? '0', type: 'success' as const },
    { label: '今日新增图案', value: t?.newPatternsToday ?? '0', type: 'success' as const },
  ]
})

const healthStats = computed(() => {
  const h = summary.value?.systemHealth
  return [
    { label: '24h 登录失败', value: h?.failedLogins24h ?? '0' },
    { label: '24h 操作失败', value: h?.operFailures24h ?? '0' },
    { label: '24h 服务告警', value: h?.serverLogWarnings24h ?? '0' },
    { label: '24h 服务错误', value: h?.serverLogErrors24h ?? '0' },
  ]
})

const userBreakdownStats = computed(() => {
  const u = summary.value?.userBreakdown
  return [
    { label: '启用账号', value: u?.activeUserCount ?? '0' },
    { label: '停用账号', value: u?.disabledUserCount ?? '0' },
  ]
})

const patternStats = computed(() => {
  const p = summary.value?.patternMetrics
  return [
    { label: '累计浏览', value: p?.totalViews ?? '0' },
    { label: '累计点赞', value: p?.totalLikes ?? '0' },
    { label: '累计评论', value: p?.totalComments ?? '0' },
    { label: '累计收藏', value: p?.totalFavorites ?? '0' },
  ]
})
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

    <n-card title="实体计数" size="small">
      <n-grid :x-gap="16" :y-gap="16" :cols="4" responsive="screen">
        <n-grid-item v-for="item in stats" :key="item.label">
          <n-statistic :label="item.label" :value="item.value" />
        </n-grid-item>
      </n-grid>
    </n-card>

    <n-grid :x-gap="16" :y-gap="16" :cols="2" responsive="screen">
      <n-grid-item>
        <n-card title="今日动态" size="small">
          <n-grid :x-gap="12" :y-gap="12" :cols="5" responsive="screen">
            <n-grid-item v-for="item in todayStats" :key="item.label">
              <n-statistic :label="item.label" :value="item.value" />
            </n-grid-item>
          </n-grid>
        </n-card>
      </n-grid-item>
      <n-grid-item>
        <n-card title="系统健康 (24h)" size="small">
          <n-grid :x-gap="12" :y-gap="12" :cols="4" responsive="screen">
            <n-grid-item v-for="item in healthStats" :key="item.label">
              <n-statistic :label="item.label" :value="item.value" />
            </n-grid-item>
          </n-grid>
        </n-card>
      </n-grid-item>
    </n-grid>

    <n-grid :x-gap="16" :y-gap="16" :cols="2" responsive="screen">
      <n-grid-item>
        <n-card title="用户状态" size="small">
          <n-grid :x-gap="12" :y-gap="12" :cols="2" responsive="screen">
            <n-grid-item v-for="item in userBreakdownStats" :key="item.label">
              <n-statistic :label="item.label" :value="item.value" />
            </n-grid-item>
          </n-grid>
        </n-card>
      </n-grid-item>
      <n-grid-item>
        <n-card title="图案社区累计" size="small">
          <n-grid :x-gap="12" :y-gap="12" :cols="4" responsive="screen">
            <n-grid-item v-for="item in patternStats" :key="item.label">
              <n-statistic :label="item.label" :value="item.value" />
            </n-grid-item>
          </n-grid>
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

    <n-grid :x-gap="16" :y-gap="16" :cols="2" responsive="screen">
      <n-grid-item>
        <n-card title="热门图案 Top 5" size="small">
          <n-data-table :columns="topPatternColumns" :data="summary?.topPatterns || []" :bordered="false" />
        </n-card>
      </n-grid-item>
      <n-grid-item>
        <n-card title="活跃贡献者 Top 5" size="small">
          <n-data-table :columns="topContributorColumns" :data="summary?.topContributors || []" :bordered="false" />
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
