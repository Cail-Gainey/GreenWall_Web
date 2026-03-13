<script setup lang="ts">
/**
 * @file 系统监控视图：MySQL 与 Redis 指标。
 */
import { computed, h, onMounted, ref } from 'vue'
import { NCard, NSpace, NStatistic, NGrid, NGridItem, NButton, NTag, NInput, useDialog, useMessage } from 'naive-ui'
import { getMySqlMonitor, getRedisMonitor, getServerMonitor, restartServer, restartMySql, restartRedis, flushRedis, clearCache } from '../../api/monitor'
import type { MySqlMonitorDto, RedisMonitorDto, ServerMonitorDto } from '../../api/types'
import { usePermissionStore } from '../../stores/permission'

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
const opsToken = ref(localStorage.getItem('ops_token') || '')

const load = async () => {
  loading.value = true
  try {
    const tasks = [getMySqlMonitor(), getRedisMonitor()]
    if (canServer.value) tasks.push(getServerMonitor())
    const results = await Promise.all(tasks)
    mysql.value = results[0].data.data
    redis.value = results[1].data.data
    if (canServer.value && results[2]) {
      server.value = results[2].data.data
    }
  } catch (e: any) {
    message.error(e?.message || '获取监控数据失败')
  } finally {
    loading.value = false
  }
}

onMounted(load)

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
        h(NInput, {
          value: tempToken,
          placeholder: '运维令牌(可选)',
          size: 'small',
          onUpdateValue: (value: string) => {
            tempToken = value
          },
        }),
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
  <n-space vertical size="large">
    <n-space align="center" justify="space-between">
      <div>
        <div style="font-weight: 700; font-size: 18px;">系统监控</div>
        <div style="color: var(--color-text-muted); font-size: 12px;">MySQL / Redis 运行指标</div>
      </div>
      <n-space size="small" align="center">
        <n-input
          size="small"
          placeholder="运维令牌(可选)"
          style="width: 180px"
          :value="opsToken"
          @update:value="saveToken"
        />
        <n-button size="small" secondary @click="load" :loading="loading">刷新</n-button>
      </n-space>
    </n-space>

    <n-card title="MySQL" size="large">
      <template #header-extra>
        <n-button v-if="canMySqlRestart" size="small" secondary @click="confirmOp('重启 MySQL', restartMySql)">重启 MySQL</n-button>
      </template>
      <n-space v-if="mysql" vertical>
        <n-space align="center" size="small">
          <n-tag type="success">版本 {{ mysql.version }}</n-tag>
          <n-tag>QPS {{ mysql.qps }}</n-tag>
          <n-tag>慢查询 {{ mysql.slowQueries }}</n-tag>
        </n-space>
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
            <n-statistic label="服务器时间" :value="mysql.serverTime" />
          </n-grid-item>
        </n-grid>
      </n-space>
      <div v-else>暂无数据</div>
    </n-card>

    <n-card title="Redis" size="large">
      <template #header-extra>
        <n-space size="small">
          <n-button v-if="canRedisRestart" size="small" secondary @click="confirmOp('重启 Redis', restartRedis)">重启 Redis</n-button>
          <n-button v-if="canRedisFlush" size="small" secondary @click="confirmOp('清空 Redis', flushRedis)">清空 Redis</n-button>
          <n-button v-if="canCacheClear" size="small" secondary @click="confirmOp('清空缓存', clearCache)">清空缓存</n-button>
        </n-space>
      </template>
      <n-space v-if="redis" vertical>
        <n-space align="center" size="small">
          <n-tag type="success">版本 {{ redis.version }}</n-tag>
          <n-tag>QPS {{ redis.instantOpsPerSec }}</n-tag>
        </n-space>
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
      </n-space>
      <div v-else>暂无数据</div>
    </n-card>

    <n-card v-if="canServer" title="服务器运行信息" size="large">
      <template #header-extra>
        <n-button v-if="canServerRestart" size="small" secondary @click="confirmOp('重启服务器', restartServer)">重启服务器</n-button>
      </template>
      <n-space v-if="server" vertical>
        <n-grid :x-gap="16" :y-gap="16" :cols="4" responsive="screen">
          <n-grid-item>
            <n-statistic label="机器名" :value="server.machineName" />
          </n-grid-item>
          <n-grid-item>
            <n-statistic label="系统" :value="server.osDescription" />
          </n-grid-item>
          <n-grid-item>
            <n-statistic label=".NET" :value="server.frameworkDescription" />
          </n-grid-item>
          <n-grid-item>
            <n-statistic label="进程 ID" :value="server.processId" />
          </n-grid-item>
          <n-grid-item>
            <n-statistic label="启动时间" :value="server.processStartTime" />
          </n-grid-item>
          <n-grid-item>
            <n-statistic label="运行时长(秒)" :value="server.uptime" />
          </n-grid-item>
          <n-grid-item>
            <n-statistic label="CPU 核心" :value="server.processorCount" />
          </n-grid-item>
          <n-grid-item>
            <n-statistic label="工作集内存" :value="server.workingSet" />
          </n-grid-item>
          <n-grid-item>
            <n-statistic label="GC 内存" :value="server.gcMemory" />
          </n-grid-item>
        </n-grid>
      </n-space>
      <div v-else>暂无数据</div>
    </n-card>
  </n-space>
</template>
