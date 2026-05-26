<script setup lang="ts">
/**
 * @file 系统监控视图：MySQL 与 Redis 指标。
 */
import { computed, h, onBeforeUnmount, onMounted, ref } from 'vue'
import { NCard, NSpace, NStatistic, NGrid, NGridItem, NButton, NInput, useDialog, useMessage } from 'naive-ui'
import { getMySqlMonitor, getRedisMonitor, getServerMonitor, restartServer, restartMySql, restartRedis, flushRedis, clearCache } from '../../api/monitor'
import type { MySqlMonitorDto, RedisMonitorDto, ServerMonitorDto } from '../../api/types'
import { usePermissionStore } from '../../stores/permission'
import { TimeFormatter } from '../../utils/time'

const mysql = ref<MySqlMonitorDto | null>(null)
const redis = ref<RedisMonitorDto | null>(null)
const server = ref<ServerMonitorDto | null>(null)
const loading = ref(false)
const dialog = useDialog()
const message = useMessage()
const permissionStore = usePermissionStore()
const canServer = computed(() => permissionStore.hasPermission('sys:monitor:server'))
const canServerRestart = computed(() => permissionStore.hasPermission('sys:monitor:server:restart'))
const canMySqlRestart = computed(() => permissionStore.hasPermission('sys:monitor:mysql:restart'))
const canRedisRestart = computed(() => permissionStore.hasPermission('sys:monitor:redis:restart'))
const canRedisFlush = computed(() => permissionStore.hasPermission('sys:monitor:redis:flush'))
const canCacheClear = computed(() => permissionStore.hasPermission('sys:monitor:cache:clear'))
const canOpsToken = computed(() => permissionStore.hasPermission('sys:monitor:ops-token'))
const opsToken = ref(localStorage.getItem('ops_token') || '')
const showMySqlDetail = ref(false)
const showRedisDetail = ref(false)
const showServerDetail = ref(false)
const heartbeatTimer = ref<number | null>(null)
const lastUpdatedAt = ref('')
const heartbeatActive = computed(() => heartbeatTimer.value !== null)
const serverTitle = computed(() => server.value?.displayName || server.value?.machineName || '未知服务器')
const serverIp = computed(() => server.value?.ipAddress || '—')
const formatPercent = (value: number | null | undefined) => {
  if (value === undefined || value === null || Number.isNaN(value)) return null
  return Math.max(0, Math.min(100, Math.round(value)))
}
const formatBytes = (value?: number | null) => {
  if (value === undefined || value === null || Number.isNaN(value)) return '—'
  if (value === 0) return '0 B'
  const units = ['B', 'KB', 'MB', 'GB', 'TB', 'PB']
  let size = value
  let idx = 0
  while (size >= 1024 && idx < units.length - 1) {
    size /= 1024
    idx += 1
  }
  const digits = size >= 10 || idx === 0 ? 0 : 1
  return `${size.toFixed(digits)} ${units[idx]}`
}
const formatNumber = (value?: number | null) => {
  if (value === undefined || value === null || Number.isNaN(value)) return '—'
  return value.toLocaleString()
}
const formatDuration = (totalSeconds?: number | null) => {
  if (totalSeconds === undefined || totalSeconds === null || Number.isNaN(totalSeconds)) return '—'
  let remaining = Math.max(0, Math.floor(totalSeconds))
  const days = Math.floor(remaining / 86400)
  remaining %= 86400
  const hours = Math.floor(remaining / 3600)
  remaining %= 3600
  const minutes = Math.floor(remaining / 60)
  const seconds = remaining % 60
  const parts: string[] = []
  if (days) parts.push(`${days}天`)
  if (hours) parts.push(`${hours}小时`)
  if (minutes) parts.push(`${minutes}分`)
  parts.push(`${seconds}秒`)
  return parts.join(' ')
}
const formatLoad = (value?: number | null) => {
  if (value === undefined || value === null || Number.isNaN(value)) return '—'
  return value.toFixed(2)
}
const serverSummary = computed(() => {
  if (!server.value) return ''
  const parts: string[] = [`运行 ${formatDuration(server.value.uptime)}`]
  if (server.value.workingSet) parts.push(`工作集 ${formatBytes(server.value.workingSet)}`)
  if (server.value.gcMemory) parts.push(`GC ${formatBytes(server.value.gcMemory)}`)
  return parts.join(' · ')
})
const opsMetrics = computed(() => {
  const source = server.value
  const cpu = formatPercent(source?.cpuUsage)
  const ram = formatPercent(source?.ramUsage)
  const swap = formatPercent(source?.swapUsage)
  const disk = formatPercent(source?.diskUsage)
  return [
    {
      key: 'cpu',
      label: 'CPU',
      percent: cpu,
      caption: source?.cpuModel || (source ? `${source.processorCount} 核` : '—'),
    },
    {
      key: 'ram',
      label: 'RAM',
      percent: ram,
      caption: source?.totalMemoryBytes
        ? `${formatBytes(source.usedMemoryBytes)} / ${formatBytes(source.totalMemoryBytes)}`
        : '—',
    },
    {
      key: 'swap',
      label: 'SWAP',
      percent: swap,
      caption: source?.totalSwapBytes
        ? `${formatBytes(source.usedSwapBytes)} / ${formatBytes(source.totalSwapBytes)}`
        : '系统未启用 Swap',
    },
    {
      key: 'disk',
      label: 'DISK',
      percent: disk,
      caption: source?.totalDiskBytes
        ? `${formatBytes(source.usedDiskBytes)} / ${formatBytes(source.totalDiskBytes)}${source.diskMountPoint ? ` · ${source.diskMountPoint}` : ''}`
        : '—',
    },
  ]
})
const loadAverageText = computed(() => {
  if (!server.value) return '—'
  const { loadAverage1m, loadAverage5m, loadAverage15m } = server.value
  if (loadAverage1m == null && loadAverage5m == null && loadAverage15m == null) {
    return '当前系统不支持负载查询'
  }
  return `${formatLoad(loadAverage1m)} · ${formatLoad(loadAverage5m)} · ${formatLoad(loadAverage15m)}`
})

const load = async () => {
  if (loading.value) return
  loading.value = true
  try {
    const tasks: Promise<any>[] = [getMySqlMonitor(), getRedisMonitor()]
    if (canServer.value) tasks.push(getServerMonitor())
    const results = await Promise.allSettled(tasks)
    if (results[0]?.status === 'fulfilled') {
      mysql.value = results[0].value.data.data
    }
    if (results[1]?.status === 'fulfilled') {
      redis.value = results[1].value.data.data
    }
    if (canServer.value && results[2]?.status === 'fulfilled') {
      server.value = results[2].value.data.data
    }
    if (results.some((item) => item.status === 'rejected')) {
      message.error('获取监控数据失败')
    }
    lastUpdatedAt.value = TimeFormatter.formatDateTime(new Date())
  } catch (e: any) {
    message.error(e?.message || '获取监控数据失败')
  } finally {
    loading.value = false
  }
}

const startHeartbeat = () => {
  if (heartbeatTimer.value) return
  heartbeatTimer.value = window.setInterval(() => {
    void load()
  }, 5000)
}

const stopHeartbeat = () => {
  if (!heartbeatTimer.value) return
  window.clearInterval(heartbeatTimer.value)
  heartbeatTimer.value = null
}

onMounted(() => {
  void load()
  startHeartbeat()
})

onBeforeUnmount(() => {
  stopHeartbeat()
})

const saveToken = (value: string) => {
  opsToken.value = value
  localStorage.setItem('ops_token', value)
}

const confirmOp = (title: string, action: (token?: string) => Promise<any>) => {
  let tempToken = opsToken.value
  dialog.warning({
    title: `确认执行：${title}`,
    positiveText: '确认',
    negativeText: '取消',
    content: () =>
      h('div', { style: 'display:flex; flex-direction:column; gap:10px;' }, [
        h('div', { style: 'font-size:12px; color: var(--color-text-muted);' }, '该操作将立即生效，请谨慎执行。'),
        canOpsToken.value
          ? h(NInput, {
              value: tempToken,
              placeholder: '运维令牌(可选)',
              size: 'small',
              onUpdateValue: (value: string) => {
                tempToken = value
              },
            })
          : null,
      ]),
    onPositiveClick: async () => {
      saveToken(tempToken || '')
      try {
        await action(tempToken || undefined)
        message.success('操作已提交')
      } catch (e: any) {
        message.error(e?.message || '操作失败')
      }
    },
  })
}
</script>

<template>
  <n-space vertical size="large" class="ops-monitor">
    <div class="ops-header">
      <div class="ops-header-left">
        <div class="ops-page-title">系统监控</div>
        <div class="ops-page-subtitle">MySQL / Redis / 服务器运行指标</div>
        <div class="ops-header-meta">
          <span class="ops-chip" :class="{ active: heartbeatActive }">
            <span class="pulse-dot"></span>
            心跳{{ heartbeatActive ? '运行中' : '已停止' }}
          </span>
          <span v-if="lastUpdatedAt" class="ops-chip">最近更新 {{ lastUpdatedAt }}</span>
        </div>
      </div>
      <div class="ops-header-right">
        <div v-if="canOpsToken" class="ops-token">
          <span class="ops-token-label">运维令牌</span>
          <n-input
            size="small"
            placeholder="运维令牌(可选)"
            style="width: 180px"
            :value="opsToken"
            @update:value="saveToken"
          />
        </div>
        <n-button size="small" secondary @click="load" :loading="loading">刷新</n-button>
      </div>
    </div>

    <n-card size="large" class="service-card mysql">
      <template #header>
        <div class="service-header">
          <div class="service-title">
            <div class="service-name">MySQL</div>
            <div class="service-desc">事务型数据库</div>
          </div>
          <div class="service-actions">
            <n-button size="small" secondary @click="showMySqlDetail = !showMySqlDetail">
              {{ showMySqlDetail ? '收起详情' : '查看详情' }}
            </n-button>
            <n-button v-if="canMySqlRestart" size="small" secondary @click="confirmOp('重启 MySQL', restartMySql)">重启 MySQL</n-button>
          </div>
        </div>
      </template>
      <div v-if="mysql" class="service-body">
        <div class="service-summary">
          <div class="summary-item">
            <div class="summary-label">版本</div>
            <div class="summary-value">{{ mysql.version }}</div>
          </div>
          <div class="summary-item">
            <div class="summary-label">QPS</div>
            <div class="summary-value">{{ mysql.qps }}</div>
          </div>
          <div class="summary-item">
            <div class="summary-label">慢查询</div>
            <div class="summary-value">{{ mysql.slowQueries }}</div>
          </div>
          <div class="summary-item">
            <div class="summary-label">当前连接</div>
            <div class="summary-value">{{ mysql.threadsConnected }}</div>
          </div>
        </div>
        <div v-if="showMySqlDetail" class="service-detail">
          <div class="service-detail-title">详细指标</div>
          <n-grid :x-gap="16" :y-gap="16" :cols="4" responsive="screen">
            <n-grid-item>
              <n-statistic label="运行时长(秒)" :value="mysql.uptime" />
            </n-grid-item>
            <n-grid-item>
              <n-statistic label="当前连接数" :value="mysql.threadsConnected" />
            </n-grid-item>
            <n-grid-item>
              <n-statistic label="运行线程数" :value="mysql.threadsRunning" />
            </n-grid-item>
            <n-grid-item>
              <n-statistic label="历史连接数" :value="mysql.connections" />
            </n-grid-item>
            <n-grid-item>
              <n-statistic label="查询总数" :value="mysql.questions" />
            </n-grid-item>
            <n-grid-item>
              <n-statistic label="服务器时间" :value="TimeFormatter.formatDateTime(mysql.serverTime)" />
            </n-grid-item>
          </n-grid>
        </div>
      </div>
      <div v-else>暂无数据</div>
    </n-card>

    <n-card size="large" class="service-card redis">
      <template #header>
        <div class="service-header">
          <div class="service-title">
            <div class="service-name">Redis</div>
            <div class="service-desc">高速缓存与队列</div>
          </div>
          <div class="service-actions">
            <n-button size="small" secondary @click="showRedisDetail = !showRedisDetail">
              {{ showRedisDetail ? '收起详情' : '查看详情' }}
            </n-button>
            <n-button v-if="canRedisRestart" size="small" secondary @click="confirmOp('重启 Redis', restartRedis)">重启 Redis</n-button>
            <n-button v-if="canRedisFlush" size="small" secondary @click="confirmOp('清空 Redis', flushRedis)">清空 Redis</n-button>
            <n-button v-if="canCacheClear" size="small" secondary @click="confirmOp('清空缓存', clearCache)">清空缓存</n-button>
          </div>
        </div>
      </template>
      <div v-if="redis" class="service-body">
        <div class="service-summary">
          <div class="summary-item">
            <div class="summary-label">版本</div>
            <div class="summary-value">{{ redis.version }}</div>
          </div>
          <div class="summary-item">
            <div class="summary-label">QPS</div>
            <div class="summary-value">{{ redis.instantOpsPerSec }}</div>
          </div>
          <div class="summary-item">
            <div class="summary-label">当前连接</div>
            <div class="summary-value">{{ redis.connectedClients }}</div>
          </div>
          <div class="summary-item">
            <div class="summary-label">已用内存</div>
            <div class="summary-value">{{ redis.usedMemoryHuman || redis.usedMemory }}</div>
          </div>
        </div>
        <div v-if="showRedisDetail" class="service-detail">
          <div class="service-detail-title">详细指标</div>
          <n-grid :x-gap="16" :y-gap="16" :cols="4" responsive="screen">
            <n-grid-item>
              <n-statistic label="运行时长(秒)" :value="redis.uptime" />
            </n-grid-item>
            <n-grid-item>
              <n-statistic label="当前连接数" :value="redis.connectedClients" />
            </n-grid-item>
            <n-grid-item>
              <n-statistic label="历史连接数" :value="redis.totalConnections" />
            </n-grid-item>
            <n-grid-item>
              <n-statistic label="命令总数" :value="redis.totalCommands" />
            </n-grid-item>
            <n-grid-item>
              <n-statistic label="拒绝连接数" :value="redis.rejectedConnections" />
            </n-grid-item>
            <n-grid-item>
              <n-statistic label="已用内存" :value="redis.usedMemoryHuman || redis.usedMemory" />
            </n-grid-item>
            <n-grid-item>
              <n-statistic label="最大内存" :value="redis.maxMemory" />
            </n-grid-item>
          </n-grid>
        </div>
      </div>
      <div v-else>暂无数据</div>
    </n-card>

    <n-card v-if="canServer" size="large" class="ops-card-shell">
      <template #header>
        <div class="ops-card-header">
          <div class="ops-card-title">
            <div class="ops-title">{{ serverTitle }}</div>
            <div class="ops-subtitle">服务器运行状态</div>
            <div v-if="serverSummary" class="ops-meta">{{ serverSummary }}</div>
          </div>
          <div class="ops-ip">
            <div>{{ serverIp }}</div>
            <div v-if="lastUpdatedAt" class="ops-updated">心跳 {{ lastUpdatedAt }}</div>
          </div>
        </div>
      </template>
      <div v-if="server">
        <div class="ops-card-body">
          <div class="ops-left">
            <div class="server-stack">
              <div class="server-unit">
                <div class="server-slot"></div>
                <div class="server-lights">
                  <span class="light green"></span>
                  <span class="light yellow"></span>
                  <span class="light blue"></span>
                </div>
              </div>
              <div class="server-unit">
                <div class="server-slot"></div>
                <div class="server-lights">
                  <span class="light green"></span>
                  <span class="light yellow"></span>
                  <span class="light blue"></span>
                </div>
              </div>
              <div class="server-unit">
                <div class="server-slot"></div>
                <div class="server-lights">
                  <span class="light green"></span>
                  <span class="light yellow"></span>
                  <span class="light blue"></span>
                </div>
              </div>
            </div>
            <div class="ops-actions">
              <button type="button" class="ops-action-btn ops-start" disabled title="暂未接入">开机</button>
              <button type="button" class="ops-action-btn ops-stop" disabled title="暂未接入">关机</button>
              <button
                v-if="canServerRestart"
                type="button"
                class="ops-action-btn ops-restart"
                @click="confirmOp('重启服务器', restartServer)"
              >
                重启
              </button>
            </div>
            <n-button size="small" secondary @click="showServerDetail = !showServerDetail">
              {{ showServerDetail ? '收起详情' : '基础信息' }}
            </n-button>
          </div>
        <div class="ops-metrics">
          <div v-for="item in opsMetrics" :key="item.key" class="ops-metric" :class="item.key">
            <div class="metric-head">
              <div class="metric-label">{{ item.label }}</div>
              <div class="metric-value-text">{{ item.percent === null ? '—' : `${item.percent}%` }}</div>
            </div>
            <div class="metric-bar">
              <div class="metric-track">
                <div
                  class="metric-fill"
                  :class="{ unknown: item.percent === null }"
                  :style="{ width: `${item.percent ?? 0}%` }"
                ></div>
              </div>
            </div>
            <div class="metric-caption">{{ item.caption }}</div>
          </div>
        </div>
      </div>
        <div v-if="showServerDetail" class="ops-detail">
          <div class="ops-detail-title">主机信息</div>
          <n-grid :x-gap="16" :y-gap="16" :cols="4" responsive="screen">
            <n-grid-item>
              <n-statistic label="机器名" :value="server.machineName || '—'" />
            </n-grid-item>
            <n-grid-item>
              <n-statistic label="IP 地址" :value="server.ipAddress || '—'" />
            </n-grid-item>
            <n-grid-item>
              <n-statistic label="操作系统" :value="server.osDescription || '—'" />
            </n-grid-item>
            <n-grid-item>
              <n-statistic label="系统架构" :value="server.osArchitecture || '—'" />
            </n-grid-item>
            <n-grid-item>
              <n-statistic label="CPU 型号" :value="server.cpuModel || '—'" />
            </n-grid-item>
            <n-grid-item>
              <n-statistic label="CPU 核心" :value="server.processorCount" />
            </n-grid-item>
            <n-grid-item>
              <n-statistic label="系统负载 (1/5/15min)" :value="loadAverageText" />
            </n-grid-item>
            <n-grid-item>
              <n-statistic label="服务器时间" :value="TimeFormatter.formatDateTime(server.serverTime || '')" />
            </n-grid-item>
          </n-grid>

          <div class="ops-detail-title">资源详情</div>
          <n-grid :x-gap="16" :y-gap="16" :cols="4" responsive="screen">
            <n-grid-item>
              <n-statistic label="内存总量" :value="formatBytes(server.totalMemoryBytes)" />
            </n-grid-item>
            <n-grid-item>
              <n-statistic label="内存已用" :value="formatBytes(server.usedMemoryBytes)" />
            </n-grid-item>
            <n-grid-item>
              <n-statistic label="内存可用" :value="formatBytes(server.availableMemoryBytes)" />
            </n-grid-item>
            <n-grid-item>
              <n-statistic label="磁盘挂载点" :value="server.diskMountPoint || '—'" />
            </n-grid-item>
            <n-grid-item>
              <n-statistic label="磁盘总量" :value="formatBytes(server.totalDiskBytes)" />
            </n-grid-item>
            <n-grid-item>
              <n-statistic label="磁盘已用" :value="formatBytes(server.usedDiskBytes)" />
            </n-grid-item>
            <n-grid-item>
              <n-statistic label="磁盘可用" :value="formatBytes(server.freeDiskBytes)" />
            </n-grid-item>
            <n-grid-item>
              <n-statistic label="Swap 总量" :value="formatBytes(server.totalSwapBytes)" />
            </n-grid-item>
          </n-grid>

          <div class="ops-detail-title">应用进程</div>
          <n-grid :x-gap="16" :y-gap="16" :cols="4" responsive="screen">
            <n-grid-item>
              <n-statistic label=".NET 运行时" :value="server.frameworkDescription || '—'" />
            </n-grid-item>
            <n-grid-item>
              <n-statistic label="进程架构" :value="server.processArchitecture || '—'" />
            </n-grid-item>
            <n-grid-item>
              <n-statistic label="进程 ID" :value="server.processId" />
            </n-grid-item>
            <n-grid-item>
              <n-statistic label="进程启动时间" :value="TimeFormatter.formatDateTime(server.processStartTime)" />
            </n-grid-item>
            <n-grid-item>
              <n-statistic label="进程运行时长" :value="formatDuration(server.uptime)" />
            </n-grid-item>
            <n-grid-item>
              <n-statistic label="进程线程数" :value="formatNumber(server.threadCount)" />
            </n-grid-item>
            <n-grid-item>
              <n-statistic label="进程句柄数" :value="formatNumber(server.handleCount)" />
            </n-grid-item>
            <n-grid-item>
              <n-statistic label="私有内存" :value="formatBytes(server.privateMemoryBytes)" />
            </n-grid-item>
            <n-grid-item>
              <n-statistic label="工作集内存" :value="formatBytes(server.workingSet)" />
            </n-grid-item>
            <n-grid-item>
              <n-statistic label="GC 已分配内存" :value="formatBytes(server.gcMemory)" />
            </n-grid-item>
          </n-grid>
        </div>
      </div>
      <div v-else>暂无数据</div>
    </n-card>
  </n-space>
</template>

<style scoped>
.ops-monitor {
  gap: 22px;
}

.ops-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 24px;
}

.ops-header-left {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.ops-page-title {
  font-size: 20px;
  font-weight: 700;
  color: var(--color-text-main);
}

.ops-page-subtitle {
  font-size: 12px;
  color: var(--color-text-muted);
}

.ops-header-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 6px;
}

.ops-chip {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 4px 10px;
  border-radius: 999px;
  font-size: 12px;
  color: var(--color-text-muted);
  background: var(--color-bg-light);
  border: 1px solid var(--color-border);
}

.ops-chip.active {
  color: var(--color-text-main);
  background: rgba(16, 185, 129, 0.12);
  border-color: rgba(16, 185, 129, 0.35);
}

.pulse-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #9ca3af;
  position: relative;
}

.ops-chip.active .pulse-dot {
  background: #10b981;
}

.ops-chip.active .pulse-dot::after {
  content: '';
  position: absolute;
  inset: -4px;
  border-radius: 50%;
  border: 1px solid rgba(16, 185, 129, 0.5);
  animation: pulse 1.6s ease-out infinite;
}

.ops-header-right {
  display: flex;
  align-items: center;
  gap: 12px;
}

.ops-token {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  padding: 6px 10px;
  border-radius: 10px;
  background: var(--color-bg-light);
  border: 1px solid var(--color-border);
}

.ops-token-label {
  font-size: 12px;
  color: var(--color-text-muted);
}

.service-card {
  position: relative;
  border-radius: 16px;
  border: 1px solid var(--color-border);
  box-shadow: 0 10px 24px rgba(15, 23, 42, 0.06);
  overflow: hidden;
  --service-accent: var(--color-primary);
}

.service-card.mysql {
  --service-accent: #3b82f6;
}

.service-card.redis {
  --service-accent: #f59e0b;
}

.service-card::before {
  content: '';
  position: absolute;
  left: 0;
  top: 0;
  width: 4px;
  height: 100%;
  background: var(--service-accent);
}

.service-card :deep(.n-card-header) {
  padding: 18px 22px;
  border-bottom: 1px solid var(--color-border);
}

.service-card :deep(.n-card__content) {
  padding: 22px;
}

.service-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
}

.service-title {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.service-name {
  font-size: 17px;
  font-weight: 700;
  color: var(--color-text-main);
}

.service-desc {
  font-size: 12px;
  color: var(--color-text-muted);
}

.service-actions {
  display: inline-flex;
  flex-wrap: wrap;
  gap: 8px;
}

.service-body {
  display: flex;
  flex-direction: column;
  gap: 18px;
}

.service-summary {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
  gap: 12px;
}

.summary-item {
  padding: 12px 14px;
  border-radius: 12px;
  background: var(--color-bg-light);
  border: 1px solid var(--color-border);
}

.summary-label {
  font-size: 12px;
  color: var(--color-text-muted);
  margin-bottom: 6px;
}

.summary-value {
  font-size: 16px;
  font-weight: 700;
  color: var(--color-text-main);
}

.service-detail {
  padding-top: 14px;
  border-top: 1px solid var(--color-border);
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.service-detail-title {
  font-size: 13px;
  font-weight: 600;
  color: var(--color-text-main);
}

.ops-card-shell {
  border-radius: 18px;
  border: 1px solid var(--color-border);
  box-shadow: 0 14px 36px rgba(15, 23, 42, 0.08);
}

.ops-card-shell :deep(.n-card-header) {
  padding: 18px 22px;
  border-bottom: 1px solid var(--color-border);
}

.ops-card-shell :deep(.n-card-header__main) {
  width: 100%;
}

.ops-card-shell :deep(.n-card__content) {
  padding: 24px;
}

.ops-card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
}

.ops-card-title {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.ops-title {
  font-size: 18px;
  font-weight: 700;
  color: var(--color-text-main);
}

.ops-subtitle {
  font-size: 12px;
  color: var(--color-text-muted);
}

.ops-meta {
  font-size: 12px;
  color: var(--color-text-muted);
}

.ops-ip {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 4px;
  font-size: 14px;
  font-weight: 600;
  color: var(--color-text-muted);
}

.ops-updated {
  font-size: 11px;
  font-weight: 500;
  color: var(--color-text-muted);
}

.ops-card-body {
  display: grid;
  grid-template-columns: minmax(200px, 240px) 1fr;
  gap: 28px;
  align-items: center;
}

.ops-left {
  display: flex;
  flex-direction: column;
  gap: 16px;
  align-items: flex-start;
}

.server-stack {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.server-unit {
  width: 200px;
  height: 44px;
  border-radius: 10px;
  padding: 10px 14px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: linear-gradient(180deg, rgba(55, 65, 81, 0.96), rgba(31, 41, 55, 0.98));
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.06);
}

.server-slot {
  width: 12px;
  height: 12px;
  border-radius: 3px;
  background: rgba(255, 255, 255, 0.2);
}

.server-lights {
  display: flex;
  gap: 6px;
  align-items: center;
}

.light {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  display: inline-block;
  box-shadow: 0 0 0 2px rgba(15, 23, 42, 0.25);
}

.light.green {
  background: #22c55e;
}

.light.yellow {
  background: #facc15;
}

.light.blue {
  background: #3b82f6;
}

.ops-actions {
  display: inline-flex;
  border-radius: 10px;
  overflow: hidden;
  border: 1px solid var(--color-border);
}

.ops-action-btn {
  border: none;
  border-radius: 0;
  padding: 8px 16px;
  font-size: 13px;
  font-weight: 600;
  color: var(--color-text-inverse);
  cursor: pointer;
  transition: transform 0.2s ease, opacity 0.2s ease;
}

.ops-action-btn:disabled {
  cursor: not-allowed;
  opacity: 0.5;
}

.ops-action-btn:not(:disabled):hover {
  transform: translateY(-1px);
}

.ops-start {
  background: #60a5fa;
}

.ops-stop {
  background: #f87171;
}

.ops-restart {
  background: #f59e0b;
}

.ops-metrics {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.ops-metric {
  display: grid;
  grid-template-columns: 1fr;
  gap: 6px;
  --metric-color: var(--color-primary);
}

.ops-metric.cpu {
  --metric-color: var(--color-info);
}

.ops-metric.ram {
  --metric-color: var(--color-success);
}

.ops-metric.swap {
  --metric-color: var(--color-warning);
}

.ops-metric.disk {
  --metric-color: var(--color-success);
}

.metric-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.metric-label {
  font-size: 13px;
  font-weight: 600;
  color: var(--color-text-main);
}

.metric-value-text {
  font-size: 13px;
  font-weight: 600;
  color: var(--color-text-main);
}

.metric-bar {
  position: relative;
  width: 100%;
}

.metric-track {
  width: 100%;
  height: 12px;
  border-radius: 999px;
  background: var(--color-border);
  overflow: hidden;
}

.metric-fill {
  height: 100%;
  border-radius: 999px;
  background: var(--metric-color);
  transition: width 0.3s ease;
}

.metric-fill.unknown {
  background: repeating-linear-gradient(
    45deg,
    var(--color-border),
    var(--color-border) 8px,
    transparent 8px,
    transparent 16px
  );
  width: 100% !important;
  opacity: 0.6;
}

.metric-caption {
  font-size: 11px;
  color: var(--color-text-muted);
  line-height: 1.4;
  word-break: break-all;
}

.ops-detail {
  margin-top: 22px;
  padding-top: 18px;
  border-top: 1px solid var(--color-border);
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.ops-detail-title {
  font-size: 14px;
  font-weight: 600;
  color: var(--color-text-main);
}

@media (max-width: 820px) {
  .ops-header {
    flex-direction: column;
    align-items: flex-start;
  }

  .ops-header-right {
    width: 100%;
    justify-content: space-between;
    flex-wrap: wrap;
  }

  .ops-token {
    width: 100%;
    justify-content: space-between;
  }

  .ops-card-body {
    grid-template-columns: 1fr;
  }

  .ops-left {
    align-items: center;
  }

  .ops-metrics {
    width: 100%;
  }
}

@keyframes pulse {
  0% {
    transform: scale(0.5);
    opacity: 0.7;
  }
  70% {
    transform: scale(1.8);
    opacity: 0;
  }
  100% {
    opacity: 0;
  }
}
</style>
