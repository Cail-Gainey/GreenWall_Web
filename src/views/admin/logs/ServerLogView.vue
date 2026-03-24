<script setup lang="ts">
/**
 * @file 服务器终端日志视图（SSE 实时）。
 */
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { NCard, NButton, NSpace, NInput, NSwitch, NTag, NSelect, NTabs, NTabPane, NInputNumber, useDialog } from 'naive-ui'
import { clearServerLog, getServerLogFile, getServerLogFiles } from '../../../api/log'
import type { ServerLogFileDto } from '../../../api/types'

type LogLevel = 'trace' | 'debug' | 'info' | 'warn' | 'error' | 'fatal' | 'unknown'

interface LogLine {
  id: number
  text: string
  level: LogLevel
}

const apiBase = import.meta.env.VITE_API_BASE || 'http://localhost:8888/api'
const lines = ref<LogLine[]>([])
const connected = ref(false)
const paused = ref(false)
const autoScroll = ref(true)
const autoReconnect = ref(true)
const reconnecting = ref(false)
const filterText = ref('')
const levelFilter = ref<LogLevel | 'all'>('all')
const logPanelRef = ref<HTMLElement | null>(null)
const mode = ref<'live' | 'history'>('live')
const historyFiles = ref<ServerLogFileDto[]>([])
const historyLoading = ref(false)
const historyLines = ref<LogLine[]>([])
const historyFile = ref<string | null>(null)
const historyLimit = ref(500)
const historyPanelRef = ref<HTMLElement | null>(null)
const skipSeedKey = 'server_log_skip_seed'
const skipSeed = ref(false)
const persistConnectKey = 'server_log_persist_connect'
const connecting = ref(false)
const dialog = useDialog()
let eventSource: EventSource | null = null
let reconnectTimer: number | null = null
let retryCount = 0
let nextId = 1

const levelOptions = [
  { label: '全部', value: 'all' },
  { label: '信息', value: 'info' },
  { label: '警告', value: 'warn' },
  { label: '错误', value: 'error' },
  { label: '致命', value: 'fatal' },
  { label: '调试', value: 'debug' },
  { label: '其他', value: 'unknown' },
]

const displayLines = computed(() => {
  const keyword = filterText.value.trim()
  const level = levelFilter.value
  return lines.value.filter((line) => {
    if (level !== 'all' && line.level !== level) return false
    if (!keyword) return true
    return line.text.includes(keyword)
  })
})

const historyDisplayLines = computed(() => {
  const keyword = filterText.value.trim()
  const level = levelFilter.value
  return historyLines.value.filter((line) => {
    if (level !== 'all' && line.level !== level) return false
    if (!keyword) return true
    return line.text.includes(keyword)
  })
})

function parseLevel(line: string): LogLevel {
  const compact = line.trim()
  if (compact.startsWith('[INFO]')) return 'info'
  if (compact.startsWith('[WARN]')) return 'warn'
  if (compact.startsWith('[ERROR]') || compact.startsWith('[ERR]')) return 'error'
  if (compact.startsWith('[FATAL]') || compact.startsWith('[FTL]')) return 'fatal'
  if (compact.startsWith('[DEBUG]')) return 'debug'
  if (compact.startsWith('[TRACE]')) return 'trace'

  const match = compact.match(/\[(INF|WRN|ERR|FTL|DBG|TRC)\]/)
  if (!match) return 'unknown'
  const code = match[1]
  if (code === 'INF') return 'info'
  if (code === 'WRN') return 'warn'
  if (code === 'ERR') return 'error'
  if (code === 'FTL') return 'fatal'
  if (code === 'DBG') return 'debug'
  if (code === 'TRC') return 'trace'
  return 'unknown'
}

function appendLine(text: string) {
  const level = parseLevel(text)
  lines.value.push({ id: nextId++, text, level })
  const maxLines = 3000
  if (lines.value.length > maxLines) {
    lines.value.splice(0, lines.value.length - maxLines)
  }
  if (autoScroll.value && !paused.value) {
    nextTick(() => {
      if (logPanelRef.value) {
        logPanelRef.value.scrollTop = logPanelRef.value.scrollHeight
      }
    })
  }
}

function appendHistory(text: string) {
  const level = parseLevel(text)
  historyLines.value.push({ id: nextId++, text, level })
  if (autoScroll.value) {
    nextTick(() => {
      if (historyPanelRef.value) {
        historyPanelRef.value.scrollTop = historyPanelRef.value.scrollHeight
      }
    })
  }
}

function clearReconnectTimer() {
  if (reconnectTimer != null) {
    window.clearTimeout(reconnectTimer)
    reconnectTimer = null
  }
}

function scheduleReconnect() {
  if (!autoReconnect.value || paused.value) return
  clearReconnectTimer()
  reconnecting.value = true
  const delay = Math.min(1000 * 2 ** retryCount, 10000)
  reconnectTimer = window.setTimeout(() => {
    retryCount += 1
    connect()
  }, delay + Math.floor(Math.random() * 300))
}

function connect() {
  if (connected.value || paused.value) return
  const token = localStorage.getItem('token')
  if (!token) {
    appendLine('[WARN] 未检测到登录凭证，无法连接日志流')
    return
  }

  const seedParam = skipSeed.value ? 'false' : 'true'
  const url = `${apiBase}/logs/server/stream?access_token=${encodeURIComponent(token)}&seed=${seedParam}`
  localStorage.setItem(persistConnectKey, '1')
  connecting.value = true
  eventSource = new EventSource(url)
  eventSource.onopen = () => {
    connected.value = true
    connecting.value = false
    reconnecting.value = false
    retryCount = 0
    localStorage.setItem(persistConnectKey, '1')
    appendLine('[INFO] 已连接日志流')
  }
  eventSource.onmessage = (event) => {
    appendLine(event.data)
  }
  eventSource.onerror = () => {
    appendLine('[WARN] 日志流连接中断')
    connecting.value = false
    disconnect(false)
    scheduleReconnect()
  }
}

function disconnect(manual = true) {
  clearReconnectTimer()
  if (eventSource) {
    eventSource.close()
    eventSource = null
  }
  connected.value = false
  reconnecting.value = false
  connecting.value = false
  if (manual) {
    retryCount = 0
    localStorage.setItem(persistConnectKey, '0')
  }
}

function togglePause() {
  paused.value = !paused.value
  if (paused.value) {
    appendLine('[INFO] 已暂停日志流')
    localStorage.setItem(persistConnectKey, '0')
    disconnect(false)
  } else {
    appendLine('[INFO] 已恢复日志流')
    localStorage.setItem(persistConnectKey, '1')
    connect()
  }
}

async function clearLogs() {
  try {
    const name = mode.value === 'history' ? historyFile.value || undefined : undefined
    await clearServerLog(name)
    lines.value = []
    historyLines.value = []
    if (mode.value === 'live') {
      skipSeed.value = true
      sessionStorage.setItem(skipSeedKey, '1')
    }
    appendLine('[INFO] 已清空日志文件')
  } catch (err) {
    appendLine(`[WARN] 清空日志失败: ${(err as Error).message}`)
  }
}

function confirmClear() {
  const target = mode.value === 'history' ? (historyFile.value || '当前日志') : '当前日志'
  dialog.warning({
    title: '确认清空日志',
    content: `将清空 ${target} 文件内容，且无法恢复。`,
    positiveText: '确认',
    negativeText: '取消',
    onPositiveClick: async () => {
      await clearLogs()
    },
  })
}

async function downloadLogs() {
  const token = localStorage.getItem('token')
  if (!token) {
    appendLine('[WARN] 未检测到登录凭证，无法下载日志')
    return
  }
  try {
    const name = mode.value === 'history' ? historyFile.value : null
    const url = name ? `${apiBase}/logs/server/download?name=${encodeURIComponent(name)}` : `${apiBase}/logs/server/download`
    const res = await fetch(url, {
      headers: { Authorization: `Bearer ${token}` },
    })
    if (!res.ok) {
      appendLine(`[WARN] 日志下载失败: HTTP ${res.status}`)
      return
    }
    const contentType = res.headers.get('content-type') || ''
    if (contentType.includes('application/json')) {
      const json = await res.json()
      appendLine(`[WARN] 日志下载失败: ${json.msg || '未知错误'}`)
      return
    }
    const blob = await res.blob()
    const fileName = res.headers.get('content-disposition')?.split('filename=')[1]?.replace(/\"/g, '') || 'server.log'
    const blobUrl = window.URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = blobUrl
    link.download = fileName
    link.click()
    window.URL.revokeObjectURL(blobUrl)
  } catch (err) {
    appendLine(`[WARN] 日志下载失败: ${(err as Error).message}`)
  }
}

async function loadHistoryFiles() {
  historyLoading.value = true
  try {
    const res = await getServerLogFiles()
    historyFiles.value = res.data.data || []
    if (!historyFile.value && historyFiles.value.length > 0) {
      historyFile.value = historyFiles.value[0].name
    }
  } catch (err) {
    appendHistory(`[WARN] 加载日志文件列表失败: ${(err as Error).message}`)
  } finally {
    historyLoading.value = false
  }
}

async function loadHistoryFile() {
  if (!historyFile.value) return
  historyLoading.value = true
  historyLines.value = []
  try {
    const res = await getServerLogFile(historyFile.value, historyLimit.value || 500)
    const list = res.data.data || []
    list.forEach((line) => appendHistory(line))
  } catch (err) {
    appendHistory(`[WARN] 读取日志文件失败: ${(err as Error).message}`)
  } finally {
    historyLoading.value = false
  }
}

onMounted(() => {
  skipSeed.value = sessionStorage.getItem(skipSeedKey) === '1'
  const persist = localStorage.getItem(persistConnectKey)
  if (persist === null) {
    localStorage.setItem(persistConnectKey, '1')
  }
  if (persist !== '0') {
    connect()
  }
})
onBeforeUnmount(() => disconnect(true))

watch(mode, async (val) => {
  if (val === 'history') {
    disconnect(false)
    if (historyFiles.value.length === 0) {
      await loadHistoryFiles()
    }
  } else {
    connect()
  }
})
</script>

<template>
  <n-card title="服务器终端日志" size="large">
    <n-tabs v-model:value="mode" type="line" animated>
      <n-tab-pane name="live" tab="实时日志">
        <n-space align="center" justify="space-between">
          <n-space align="center">
            <n-button v-if="!connected" type="primary" @click="connect">连接</n-button>
            <n-button v-else @click="() => disconnect()">断开</n-button>
            <n-button @click="togglePause">{{ paused ? '继续' : '暂停' }}</n-button>
            <n-button secondary @click="confirmClear">清空</n-button>
            <n-button secondary @click="downloadLogs">下载</n-button>
            <n-tag :type="connected ? 'success' : 'warning'" size="small">
              {{ connected ? '已连接' : '未连接' }}
            </n-tag>
            <n-tag v-if="reconnecting" type="warning" size="small">重连中</n-tag>
          </n-space>
          <n-space align="center">
            <n-input v-model:value="filterText" placeholder="过滤关键字" style="width: 220px" />
            <n-select v-model:value="levelFilter" :options="levelOptions" style="width: 140px" />
            <span class="auto-scroll-label">自动滚动</span>
            <n-switch v-model:value="autoScroll" />
            <span class="auto-scroll-label">自动重连</span>
            <n-switch v-model:value="autoReconnect" />
          </n-space>
        </n-space>

        <div ref="logPanelRef" class="log-panel">
          <div class="log-content">
            <div v-for="line in displayLines" :key="line.id" class="log-line" :class="`level-${line.level}`">
              {{ line.text }}
            </div>
          </div>
        </div>
      </n-tab-pane>
      <n-tab-pane name="history" tab="历史文件">
        <n-space align="center" justify="space-between">
          <n-space align="center">
            <n-select
              v-model:value="historyFile"
              :options="historyFiles.map((f) => ({ label: f.name, value: f.name }))"
              style="width: 260px"
              placeholder="选择日志文件"
            />
            <n-input-number v-model:value="historyLimit" :min="50" :max="5000" :step="50" style="width: 140px" />
            <n-button type="primary" :loading="historyLoading" @click="loadHistoryFile">加载</n-button>
            <n-button secondary @click="loadHistoryFiles">刷新列表</n-button>
            <n-button secondary @click="confirmClear">清空</n-button>
            <n-button secondary @click="downloadLogs">下载</n-button>
          </n-space>
          <n-space align="center">
            <n-input v-model:value="filterText" placeholder="过滤关键字" style="width: 220px" />
            <n-select v-model:value="levelFilter" :options="levelOptions" style="width: 140px" />
            <span class="auto-scroll-label">自动滚动</span>
            <n-switch v-model:value="autoScroll" />
          </n-space>
        </n-space>

        <div ref="historyPanelRef" class="log-panel">
          <div class="log-content">
            <div v-for="line in historyDisplayLines" :key="line.id" class="log-line" :class="`level-${line.level}`">
              {{ line.text }}
            </div>
          </div>
        </div>
      </n-tab-pane>
    </n-tabs>
  </n-card>
</template>

<style scoped>
.log-panel {
  margin-top: 12px;
  height: 520px;
  border: 1px solid var(--n-border-color, #e5e7eb);
  border-radius: 8px;
  background: var(--color-log-bg);
  color: var(--color-log-text);
  padding: 12px;
  overflow: auto;
}

.log-content {
  margin: 0;
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace;
  font-size: 12px;
  line-height: 1.6;
  white-space: pre-wrap;
}

.log-line {
  white-space: pre-wrap;
}

.level-info {
  color: var(--color-log-info);
}

.level-warn {
  color: var(--color-log-warn);
}

.level-error,
.level-fatal {
  color: var(--color-log-error);
}

.level-debug,
.level-trace {
  color: var(--color-log-muted);
}

.level-unknown {
  color: var(--color-log-text);
}

.auto-scroll-label {
  font-size: 12px;
  color: var(--color-text-muted);
}
</style>
