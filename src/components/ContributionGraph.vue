<script setup lang="ts">
/**
 * @file 贡献图组件：按年份渲染可绘制的日历网格。
 */
import { ref, inject, watch, computed, onBeforeUnmount, type Ref } from 'vue';
import { useGitHubStore } from '../stores/github';
import { usePermissionStore } from '../stores/permission';
import { pushGithubContributions, getGithubPushStatus } from '../api/github';
import { usePushRecordStore } from '../stores/pushRecord';
import {
  useDialog,
  NIcon,
  NTooltip,
  NModal,
  NForm,
  NFormItem,
  NInput,
  NRadioGroup,
  NRadioButton,
  NButton,
  NSelect,
  NTag,
  NSpace
} from 'naive-ui';
import { Exit, CloudUpload, Renew, ChevronLeft, ChevronRight } from '@vicons/carbon';

const props = defineProps<{
  initialYear?: number
}>()

const activeLevel = inject<Ref<number>>('activeLevel', ref(2));
const activeTool = inject<Ref<string>>('activeTool', ref('brush'));
const activePattern = inject<Ref<boolean[][] | null>>('activePattern', ref(null));
const activePatternLevel = inject<Ref<number>>('activePatternLevel', ref(4));
const activePatternRandom = inject<Ref<boolean>>('activePatternRandom', ref(false));
const clearSignal = inject<Ref<number>>('clearSignal', ref(0));
const fillAllSignal = inject<Ref<number>>('fillAllSignal', ref(0));

const minYear = 2008;
const maxYear = new Date().getFullYear();
const clampYear = (value: number) => Math.min(Math.max(value, minYear), maxYear);
const currentYear = ref(clampYear(props.initialYear || maxYear));
const yearOptions = computed(() => {
  const options = [];
  for (let year = maxYear; year >= minYear; year--) {
    options.push({ label: String(year), value: year });
  }
  return options;
});

const githubStore = useGitHubStore();
const pushRecordStore = usePushRecordStore();
const { hasPermission } = usePermissionStore();
const dialog = useDialog();
const githubProfile = computed(() => githubStore.profile);
const isGithubConnected = computed(() => !!githubProfile.value);
const githubLogin = computed(() => githubProfile.value?.login || '');
const githubUrl = computed(() => githubProfile.value?.htmlUrl || '');
const githubAvatar = computed(() => githubProfile.value?.avatarUrl || '');
const canGithubConnect = computed(() => hasPermission('app:github:connect'));
const canGithubDisconnect = computed(() => hasPermission('app:github:disconnect'));
const canGithubPush = computed(() => hasPermission('app:github:push'));
const canGithubStatus = computed(() => hasPermission('app:github:push:status'));
const canGithubRecent = computed(() => hasPermission('app:github:push:recent'));
const canGithubQuery = computed(() => canGithubStatus.value || canGithubRecent.value);
const toolPermissionMap: Record<string, string> = {
  brush: 'app:graph:brush',
  eraser: 'app:graph:eraser',
  auto: 'app:graph:auto',
  random: 'app:graph:random',
  pattern: 'app:graph:pattern',
};
const canUseTool = (tool: string) => {
  const perm = toolPermissionMap[tool];
  return perm ? hasPermission(perm) : true;
};
const connectGithub = () => {
  const apiBase = import.meta.env.VITE_API_BASE || 'http://localhost:8080/api';
  window.location.href = `${apiBase}/github/authorize`;
};
const disconnectGithub = () => {
  dialog.warning({
    title: '断开 GitHub 授权',
    content: '确认断开 GitHub 授权并清除本地授权信息吗？',
    positiveText: '断开',
    negativeText: '取消',
    onPositiveClick: () => githubStore.clear(),
  });
};

const showPushDialog = ref(false);
const pushMode = ref<'create' | 'existing'>('create');
const repoName = ref('');
const repoFullName = ref('');
const repoVisibility = ref<'public' | 'private'>('public');
const pushError = ref('');
const repoLoading = ref(false);
const repoLoadError = ref('');
const repoOptions = ref<{ label: string; value: string }[]>([]);
const pushSubmitting = ref(false);
let pushStatusTimer: number | null = null;
const queryJobId = ref('');
const queryLoading = ref(false);
const showQueryDialog = ref(false);
const recentPushes = ref<{ jobId: string; status: string; message?: string; updatedAt: string }[]>([]);
const recentLoading = ref(false);
const recentError = ref('');

const isGraphEmpty = computed(() => {
  for (const col of gridCols.value) {
    for (const cell of col) {
      if (cell && !cell.isFuture && cell.level > 0) {
        return false;
      }
    }
  }
  return true;
});

const openPushDialog = () => {
  if (!canGithubPush.value) {
    dialog.warning({
      title: '无权限',
      content: '当前账号无推送权限。',
    });
    return;
  }
  if (isGraphEmpty.value) {
    dialog.warning({
      title: '无法推送',
      content: '贡献图为空，请先绘制后再推送。'
    });
    return;
  }
  if (!isGithubConnected.value) {
    dialog.warning({
      title: '未连接 GitHub',
      content: '请先连接 GitHub 后再推送。'
    });
    return;
  }
  pushError.value = '';
  repoLoadError.value = '';
  showPushDialog.value = true;
  if (pushMode.value === 'existing') {
    void loadRepos();
  }
};

const closePushDialog = () => {
  showPushDialog.value = false;
};

const loadRepos = async () => {
  if (pushMode.value !== 'existing') {
    return;
  }
  repoLoadError.value = '';
  repoLoading.value = true;
  const token = githubProfile.value?.accessToken;
  if (!token) {
    repoLoadError.value = '缺少 GitHub 授权信息';
    repoLoading.value = false;
    return;
  }
  try {
    const res = await fetch('https://api.github.com/user/repos?per_page=100&sort=updated&visibility=all', {
      headers: {
        Accept: 'application/vnd.github+json',
        Authorization: `Bearer ${token}`,
      },
    });
    if (!res.ok) {
      repoLoadError.value = '获取仓库失败';
      repoLoading.value = false;
      return;
    }
    const data = await res.json();
    repoOptions.value = (Array.isArray(data) ? data : []).map((repo: any) => ({
      label: repo.full_name,
      value: repo.full_name,
    }));
  } catch {
    repoLoadError.value = '获取仓库失败';
  } finally {
    repoLoading.value = false;
  }
};

const loadRecentPushes = async () => {
  if (!canGithubRecent.value) {
    return;
  }
  recentLoading.value = true;
  recentError.value = '';
  const login = githubLogin.value;
  if (!login) {
    recentError.value = '缺少 GitHub 登录名';
    recentLoading.value = false;
    return;
  }
  try {
    recentPushes.value = await pushRecordStore.fetchRecent(login);
  } catch (e: any) {
    recentError.value = e?.message || '获取记录失败';
  } finally {
    recentLoading.value = false;
  }
};

const confirmPush = async () => {
  if (!canGithubPush.value) {
    dialog.warning({
      title: '无权限',
      content: '当前账号无推送权限。',
    });
    return;
  }
  pushError.value = '';
  if (pushMode.value === 'create') {
    if (!repoName.value.trim()) {
      pushError.value = '请输入仓库名称';
      return;
    }
  } else {
    if (!repoFullName.value.trim()) {
      pushError.value = '请输入仓库全名（owner/repo）';
      return;
    }
  }
  const token = githubProfile.value?.accessToken;
  if (!token) {
    pushError.value = '缺少 GitHub 授权信息';
    return;
  }

  const cells = [];
  for (const col of gridCols.value) {
    for (const cell of col) {
      if (cell && !cell.isFuture && cell.level > 0) {
        cells.push({ date: cell.date, level: cell.level });
      }
    }
  }

  if (cells.length === 0) {
    pushError.value = '贡献图为空';
    return;
  }

  pushSubmitting.value = true;
  try {
    const payload = {
      accessToken: token,
      githubLogin: githubLogin.value || undefined,
      mode: pushMode.value,
      repoName: pushMode.value === 'create' ? repoName.value.trim() : undefined,
      repoFullName: pushMode.value === 'existing' ? repoFullName.value.trim() : undefined,
      visibility: repoVisibility.value,
      year: currentYear.value,
      cells,
    };
      const res = await pushGithubContributions(payload);
      const login = githubLogin.value;
      if (login) {
        await pushRecordStore.fetchRecent(login, true);
      }
    showPushDialog.value = false;
    dialog.success({
      title: '已入队',
      content: `任务已加入队列：${res.data.data.jobId}`,
    });
    startPushStatusPolling(res.data.data.jobId);
  } catch (e: any) {
    pushError.value = e?.message || '推送失败';
  } finally {
    pushSubmitting.value = false;
  }
};

const startPushStatusPolling = (jobId: string) => {
  if (pushStatusTimer) {
    window.clearInterval(pushStatusTimer);
    pushStatusTimer = null;
  }
  pushStatusTimer = window.setInterval(async () => {
    try {
      const res = await getGithubPushStatus(jobId);
      const status = res.data.data.status;
      if (status === 'success') {
        window.clearInterval(pushStatusTimer!);
        pushStatusTimer = null;
        dialog.success({
          title: '推送完成',
          content: res.data.data.message || '贡献图已推送完成',
        });
      } else if (status === 'failed') {
        window.clearInterval(pushStatusTimer!);
        pushStatusTimer = null;
        dialog.error({
          title: '推送失败',
          content: res.data.data.message || '推送失败，请重试',
        });
      }
    } catch {
      // ignore polling errors
    }
  }, 2000);
};

const queryPushStatus = async () => {
  if (!canGithubStatus.value) {
    dialog.warning({
      title: '无权限',
      content: '当前账号无查询权限。',
    });
    return;
  }
  if (!queryJobId.value.trim()) {
    dialog.warning({
      title: '请输入任务 ID',
      content: '请先输入任务 ID 再查询。'
    });
    return;
  }
  queryLoading.value = true;
  try {
    const res = await getGithubPushStatus(queryJobId.value.trim());
    const status = res.data.data.status;
    if (status === 'success') {
      dialog.success({
        title: '推送完成',
        content: res.data.data.message || '贡献图已推送完成',
      });
    } else if (status === 'failed') {
      dialog.error({
        title: '推送失败',
        content: res.data.data.message || '推送失败，请重试',
      });
    } else {
      dialog.info({
        title: '任务状态',
        content: `当前状态：${status}`,
      });
    }
  } catch (e: any) {
    dialog.error({
      title: '查询失败',
      content: e?.message || '查询失败',
    });
  } finally {
    queryLoading.value = false;
  }
};

const openQueryDialog = () => {
  if (!canGithubQuery.value) {
    dialog.warning({
      title: '无权限',
      content: '当前账号无查询权限。',
    });
    return;
  }
  showQueryDialog.value = true;
  if (canGithubRecent.value) {
    void loadRecentPushes();
  }
};

onBeforeUnmount(() => {
  if (pushStatusTimer) {
    window.clearInterval(pushStatusTimer);
    pushStatusTimer = null;
  }
});

const formatStatus = (status: string) => {
  const map: Record<string, string> = {
    queued: '排队中',
    running: '执行中',
    success: '成功',
    failed: '失败',
  };
  return map[status] || status;
};

const statusTagType = (status: string) => {
  if (status === 'success') return 'success';
  if (status === 'failed') return 'error';
  if (status === 'running') return 'warning';
  return 'info';
};

const formatTime = (value: string) => {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString();
};

const months = ['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月'];
// GitHub 贡献图以周日为第一行，展示周一/三/五标签
const days = ['', '一', '', '三', '', '五', ''];

interface CellData {
  date: string;
  level: number;
  isFuture: boolean;
}

const gridCols = ref<(CellData | null)[][]>([]);
const monthPositions = ref<{ label: string; colIndex: number }[]>([]);
const levelColors = [
  'var(--color-cell-empty)',
  'var(--color-cell-level-1)',
  'var(--color-cell-level-2)',
  'var(--color-cell-level-3)',
  'var(--color-cell-level-4)',
];
const levelToColor = (level: number) => levelColors[level] ?? levelColors[0]!;
const clampLevel = (level: number) => Math.max(0, Math.min(4, level));

const previewCells = ref<Set<string>>(new Set());
const previewRandomLevels = ref<Map<string, number>>(new Map());
const previewEnabled = ref(true);
const previewColor = computed(() => levelToColor(clampLevel(activePatternLevel.value)));

const getPatternOffsets = (pattern: boolean[][]) => {
  const height = pattern.length;
  const width = pattern.reduce((max, row) => Math.max(max, row.length), 0);
  return {
    offsetC: Math.floor(width / 2),
    offsetR: Math.floor(height / 2)
  };
};

const buildPatternTargets = (anchorC: number, anchorR: number, pattern: boolean[][]) => {
  const { offsetC, offsetR } = getPatternOffsets(pattern);
  const next = new Set<string>();

  for (let rIndex = 0; rIndex < pattern.length; rIndex++) {
    const pRow = pattern[rIndex];
    if (!pRow) continue;
    for (let cIndex = 0; cIndex < pRow.length; cIndex++) {
      if (!pRow[cIndex]) continue;
      const targetC = anchorC + cIndex - offsetC;
      const targetR = anchorR + rIndex - offsetR;
      const targetCell = gridCols.value[targetC]?.[targetR];
      if (targetCell && !targetCell.isFuture) {
        next.add(`${targetC},${targetR}`);
      }
    }
  }

  return next;
};

const clearPreview = () => {
  previewCells.value = new Set();
  previewRandomLevels.value = new Map();
};

const updatePreview = (anchorC: number, anchorR: number) => {
  if (!previewEnabled.value || activeTool.value !== 'pattern' || !activePattern.value) {
    clearPreview();
    return;
  }
  const targets = buildPatternTargets(anchorC, anchorR, activePattern.value);
  previewCells.value = targets;
  if (activePatternRandom.value) {
    const nextLevels = new Map<string, number>();
    targets.forEach((key) => {
      nextLevels.set(key, Math.floor(Math.random() * 4) + 1);
    });
    previewRandomLevels.value = nextLevels;
  } else {
    previewRandomLevels.value = new Map();
  }
};

const isPreviewCell = (c: number, r: number) => previewCells.value.has(`${c},${r}`);
const getPreviewOverlayColor = (c: number, r: number) => {
  const level = previewRandomLevels.value.get(`${c},${r}`);
  return level ? levelToColor(level) : previewColor.value;
};

/**
 * @description 生成指定年份的网格数据与月份标记位置。
 * @param {number} year 目标年份。
 */
const generateGrid = (year: number) => {
  const isLeap = (year % 4 === 0 && year % 100 !== 0) || (year % 400 === 0);
  const daysInYear = isLeap ? 366 : 365;
  
  const startDate = new Date(year, 0, 1);
  const startDayOfWeek = startDate.getDay(); // 0 is Sun, 1 is Mon... 6 is Sat
  
  // GitHub: rows 0-6 represent Sun-Sat
  const startRowIndex = startDayOfWeek;
  const totalCols = Math.ceil((daysInYear + startRowIndex) / 7);

  const newGrid: (CellData | null)[][] = Array.from({ length: totalCols }, () => Array(7).fill(null));
  const newMonthPositions: { label: string; colIndex: number }[] = [];

  const tempDate = new Date(year, 0, 1);
  let col = 0;
  let row = startRowIndex;

  for (let i = 0; i < daysInYear; i++) {
    // Record month positions
    if (tempDate.getDate() === 1) {
      newMonthPositions.push({
        label: months[tempDate.getMonth()]!,
        colIndex: col
      });
    }

    // Format date string as YYYY-MM-DD (local time friendly)
    const yyyy = tempDate.getFullYear();
    const mm = String(tempDate.getMonth() + 1).padStart(2, '0');
    const dd = String(tempDate.getDate()).padStart(2, '0');
    const dateStr = `${yyyy}-${mm}-${dd}`;
    
    // Check if the date is in the future
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const isFuture = tempDate > today;

    newGrid[col]![row] = {
      date: dateStr,
      level: 0,
      isFuture: isFuture
    };


    tempDate.setDate(tempDate.getDate() + 1);
    row++;
    if (row > 6) {
      row = 0;
      col++;
    }
  }

  gridCols.value = newGrid;
  monthPositions.value = newMonthPositions;
};

// Initialize
generateGrid(currentYear.value);

/**
 * @description 清空当前年份的全部可绘制单元格。
 */
const clearAll = () => {
  gridCols.value.forEach((col) => {
    col.forEach((cell) => {
      if (cell && !cell.isFuture) {
        cell.level = 0;
      }
    });
  });
};

watch(clearSignal, () => {
  if (!hasPermission('app:graph:clear')) {
    return;
  }
  clearAll();
});

/**
 * @description 将当前年份的全部可绘制单元格设为最高等级 (4)。
 */
const fillAll = () => {
  gridCols.value.forEach((col) => {
    col.forEach((cell) => {
      if (cell && !cell.isFuture) {
        cell.level = 4;
      }
    });
  });
};

watch(fillAllSignal, () => {
  if (!hasPermission('app:graph:fill')) {
    return;
  }
  fillAll();
});

watch(activeTool, () => {
  if (activeTool.value !== 'pattern') {
    clearPreview();
    previewEnabled.value = false;
    return;
  }
  previewEnabled.value = true;
});

watch(activePattern, () => {
  if (!activePattern.value) {
    clearPreview();
    return;
  }
  if (activeTool.value === 'pattern') {
    previewEnabled.value = true;
  }
});

watch(activePatternRandom, () => {
  if (!previewCells.value.size) {
    return;
  }
  if (!activePatternRandom.value) {
    previewRandomLevels.value = new Map();
    return;
  }
  const nextLevels = new Map<string, number>();
  previewCells.value.forEach((key) => {
    nextLevels.set(key, Math.floor(Math.random() * 4) + 1);
  });
  previewRandomLevels.value = nextLevels;
});

// Year switching
/**
 * @description 切换到上一年并重建网格。
 */
const prevYear = () => {
  if (currentYear.value <= minYear) return;
  currentYear.value--;
  generateGrid(currentYear.value);
  clearPreview();
};

/**
 * @description 切换到下一年并重建网格。
 */
const nextYear = () => {
  if (currentYear.value >= maxYear) return;
  currentYear.value++;
  generateGrid(currentYear.value);
  clearPreview();
};

const changeYear = (value: number) => {
  const next = clampYear(value);
  if (next === currentYear.value) return;
  currentYear.value = next;
  generateGrid(currentYear.value);
  clearPreview();
};

// Painting logic
const isPointerDown = ref(false);

/**
 * @description 开始涂色并立即绘制当前单元格。
 * @param {number} c 列索引。
 * @param {number} r 行索引。
 */
const startPaint = (c: number, r: number, event: PointerEvent) => {
  if (event.button === 2) {
    handleRightClick();
    return;
  }
  if (event.button !== 0) {
    return;
  }
  if (!canUseTool(activeTool.value)) {
    return;
  }
  isPointerDown.value = true;
  if (activeTool.value === 'pattern') {
    updatePreview(c, r);
  }
  paint(c, r);
};

/**
 * @description 鼠标悬停时按需连续绘制。
 * @param {number} c 列索引。
 * @param {number} r 行索引。
 */
const hoverPaint = (c: number, r: number) => {
  if (!canUseTool(activeTool.value)) {
    return;
  }
  if (activeTool.value === 'pattern') {
    updatePreview(c, r);
  } else if (previewCells.value.size) {
    clearPreview();
  }
  if (isPointerDown.value) {
    paint(c, r);
  }
};

/**
 * @description 结束涂色。
 */
const endPaint = () => {
  isPointerDown.value = false;
};

const handlePointerLeave = () => {
  endPaint();
  clearPreview();
};

const handleRightClick = () => {
  if (activeTool.value === 'pattern') {
    previewEnabled.value = false;
  }
  clearPreview();
  isPointerDown.value = false;
};

/**
 * @description 根据当前工具与颜色更新单元格。
 * @param {number} c 列索引。
 * @param {number} r 行索引。
 */
const paint = (c: number, r: number) => {
  if (!canUseTool(activeTool.value)) {
    return;
  }
  const cell = gridCols.value[c]?.[r];
  if (!cell || cell.isFuture) {
    return;
  }
  
  // Handle single cell tools
  if (activeTool.value !== 'pattern') {
    if (activeTool.value === 'eraser') {
      cell.level = 0;
      return;
    }
    if (activeTool.value === 'auto') {
      cell.level = cell.level >= 4 ? 0 : cell.level + 1;
      return;
    }
    if (activeTool.value === 'random') {
      cell.level = Math.floor(Math.random() * 4) + 1;
      return;
    }
    const nextLevel = clampLevel(activeLevel.value);
    cell.level = nextLevel;
    return;
  }

  // Handle pattern tool stamping
  if (activePattern.value) {
    const pattern = activePattern.value;
    const patternLevel = clampLevel(activePatternLevel.value);
    const { offsetC, offsetR } = getPatternOffsets(pattern);

    for (let rIndex = 0; rIndex < pattern.length; rIndex++) {
      const pRow = pattern[rIndex];
      if (!pRow) continue;
      
      for (let cIndex = 0; cIndex < pRow.length; cIndex++) {
        if (pRow[cIndex]) {
          const targetC = c + cIndex - offsetC;
          const targetR = r + rIndex - offsetR;
          
          const targetCell = gridCols.value[targetC]?.[targetR];
          // Only paint if the target cell exists and isn't a future date
          if (targetCell && !targetCell.isFuture) {
            if (activePatternRandom.value) {
              const previewKey = `${targetC},${targetR}`;
              const randomLevel =
                previewRandomLevels.value.get(previewKey) ?? Math.floor(Math.random() * 4) + 1;
              targetCell.level = randomLevel;
            } else {
              targetCell.level = patternLevel;
            }
          }
        }
      }
    }
  }
};
</script>

<template>
  <div
    class="contribution-graph-wrapper"
    @pointerup="endPaint"
    @pointerleave="handlePointerLeave"
    @pointercancel="handlePointerLeave"
    @contextmenu.prevent="handleRightClick"
    @mousedown.right.prevent="handleRightClick"
  >
    <div class="graph-container">
      <div class="graph-header">
        <div class="graph-actions">
          <div v-if="isGithubConnected" class="github-badge">
            <div class="github-avatar">
              <img v-if="githubAvatar" :src="githubAvatar" alt="github" />
              <span v-else>GH</span>
            </div>
            <a v-if="githubUrl" :href="githubUrl" target="_blank" rel="noreferrer" class="github-link">
              @{{ githubLogin }}
            </a>
            <span v-else class="github-link">@{{ githubLogin }}</span>
            <n-tooltip v-if="canGithubDisconnect" trigger="hover">
              <template #trigger>
                <button class="github-disconnect" @click="disconnectGithub" aria-label="断开 GitHub">
                  <n-icon size="14">
                    <Exit />
                  </n-icon>
                </button>
              </template>
              断开授权
            </n-tooltip>
          </div>
          <button v-else-if="canGithubConnect" class="github-connect" @click="connectGithub">连接 GitHub</button>
          <n-tooltip v-if="canGithubPush" trigger="hover">
            <template #trigger>
              <button class="github-push" @click="openPushDialog">
                <n-icon size="14">
                  <CloudUpload />
                </n-icon>
                推送
              </button>
            </template>
            推送贡献图
          </n-tooltip>
          <n-tooltip v-if="canGithubQuery" trigger="hover">
            <template #trigger>
              <button class="github-query" @click="openQueryDialog">
                查询
              </button>
            </template>
            查询推送任务
          </n-tooltip>
        </div>
      </div>
      
      <div class="graph-scroll-area">
        <!-- Months row -->
        <div class="months-row" :style="{ width: `calc(${gridCols.length * 18}px)` }">
          <span 
            v-for="(mp, idx) in monthPositions" 
            :key="idx" 
            class="month-label"
            :style="{ left: `${mp.colIndex * 18}px` }"
          >
            {{ mp.label }}
          </span>
        </div>

        <div class="graph-body">
          <!-- Days column -->
          <div class="days-col">
            <span v-for="(d, i) in days" :key="i" class="day-label">{{ d }}</span>
          </div>

          <!-- Grid -->
          <div class="grid-wrapper">
            <div class="grid-col" v-for="(col, c) in gridCols" :key="c">
              <template v-for="(cell, r) in col" :key="r">
                <div 
                  v-if="cell"
                  class="grid-cell" 
                  :class="{ 'future-cell': cell.isFuture, 'preview-cell': isPreviewCell(c, r) }"
                  :style="{ backgroundColor: levelToColor(cell.level), '--preview-color': getPreviewOverlayColor(c, r) }"
                  :data-date="cell.date"
                  @pointerdown="startPaint(c, r, $event)"
                  @pointerenter="hoverPaint(c, r)"
                ></div>
                <div v-else class="grid-cell ghost-cell"></div>
              </template>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Year Selector -->
    <div class="year-selector">
      <span class="year-label">年份:</span>
      <div class="year-control">
        <button class="icon-btn" @click="prevYear" :disabled="currentYear <= minYear">
          <n-icon size="16"><ChevronLeft /></n-icon>
        </button>
        <n-select
          :value="currentYear"
          :options="yearOptions"
          size="small"
          class="year-select"
          @update:value="changeYear"
        />
        <button class="icon-btn" @click="nextYear" :disabled="currentYear >= maxYear">
          <n-icon size="16"><ChevronRight /></n-icon>
        </button>
      </div>
    </div>

    <n-modal v-model:show="showPushDialog" preset="card" title="推送贡献图" style="width: min(460px, 92vw);">
      <n-form>
        <n-form-item label="仓库类型">
          <n-radio-group v-model:value="pushMode" @update:value="() => loadRepos()">
            <n-radio-button value="create">新建仓库</n-radio-button>
            <n-radio-button value="existing">使用现有仓库</n-radio-button>
          </n-radio-group>
        </n-form-item>
        <n-form-item v-if="pushMode === 'create'" label="仓库名称">
          <n-input v-model:value="repoName" placeholder="例如：greenwall-art" />
        </n-form-item>
        <n-form-item v-if="pushMode === 'create'" label="可见性">
          <n-radio-group v-model:value="repoVisibility">
            <n-radio-button value="public">公开</n-radio-button>
            <n-radio-button value="private">私有</n-radio-button>
          </n-radio-group>
        </n-form-item>
        <n-form-item v-else label="仓库全名">
          <n-select
            v-model:value="repoFullName"
            :options="repoOptions"
            :loading="repoLoading"
            placeholder="选择仓库"
            filterable
            clearable
          />
        </n-form-item>
        <n-form-item v-if="repoLoadError">
          <div class="push-error">{{ repoLoadError }}</div>
        </n-form-item>
        <n-form-item v-if="pushError">
          <div class="push-error">{{ pushError }}</div>
        </n-form-item>
        <n-space justify="end">
          <n-button secondary @click="closePushDialog" :disabled="pushSubmitting">取消</n-button>
          <n-button type="primary" @click="confirmPush" :loading="pushSubmitting">确认</n-button>
        </n-space>
      </n-form>
    </n-modal>

    <n-modal v-model:show="showQueryDialog" preset="card" title="查询推送任务" style="width: min(420px, 92vw);">
      <n-form>
        <n-form-item label="任务 ID">
          <n-input v-model:value="queryJobId" placeholder="输入任务 ID" />
        </n-form-item>
        <n-form-item label="最近推送">
          <div class="recent-list">
            <div class="recent-header">
              <span>列表</span>
              <n-button
                v-if="canGithubRecent"
                size="tiny"
                secondary
                :loading="recentLoading"
                @click="loadRecentPushes"
              >
                <n-icon size="14">
                  <Renew />
                </n-icon>
              </n-button>
            </div>
            <div v-if="!canGithubRecent" class="recent-muted">无查看权限</div>
            <div v-else-if="recentLoading" class="recent-muted">加载中...</div>
            <div v-else-if="recentError" class="push-error">{{ recentError }}</div>
            <div v-else-if="recentPushes.length === 0" class="recent-muted">暂无记录</div>
            <div v-else class="recent-items">
              <div v-for="item in recentPushes" :key="item.jobId" class="recent-item">
                <div class="recent-row">
                  <span class="recent-job">任务ID: {{ item.jobId }}</span>
                  <n-tag size="small" :type="statusTagType(item.status)">
                    {{ formatStatus(item.status) }}
                  </n-tag>
                </div>
                <div class="recent-time">{{ formatTime(item.updatedAt) }}</div>
                <div v-if="item.message" class="recent-msg">{{ item.message }}</div>
              </div>
            </div>
          </div>
        </n-form-item>
        <n-space justify="end">
          <n-button secondary @click="showQueryDialog = false">取消</n-button>
          <n-button
            type="primary"
            :loading="queryLoading"
            :disabled="!canGithubStatus"
            @click="queryPushStatus"
          >
            查询
          </n-button>
        </n-space>
      </n-form>
    </n-modal>
  </div>
</template>

<style scoped>
.contribution-graph-wrapper {
  width: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.graph-container {
  width: 100%;
  border: 1px solid var(--color-border);
  border-radius: 12px;
  padding: 1.5rem;
  margin-bottom: 2rem;
  overflow-x: auto; /* Fixes bounds overflow issue */
}

.graph-header {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 16px;
  margin-bottom: 16px;
}

.graph-actions {
  display: flex;
  align-items: center;
  gap: 10px;
}

.github-badge {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 4px 10px;
  border-radius: 999px;
  border: 1px solid var(--color-border);
  background-color: var(--color-surface);
  font-size: 0.8rem;
  color: var(--color-text-main);
}

.github-avatar {
  width: 18px;
  height: 18px;
  border-radius: 999px;
  overflow: hidden;
  background-color: var(--color-bg-light);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.6rem;
  font-weight: 600;
  color: var(--color-text-muted);
}

.github-avatar img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.github-link {
  color: var(--color-text-main);
  text-decoration: none;
}

.github-link:hover {
  text-decoration: underline;
}

.github-disconnect {
  margin-left: 4px;
  border: none;
  background: transparent;
  color: var(--color-text-muted);
  font-size: 0.75rem;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  cursor: pointer;
  padding: 0;
  border-radius: 6px;
}

.github-disconnect:hover {
  color: var(--color-text-main);
  background-color: var(--color-bg-light);
}

.github-connect {
  border: 1px solid var(--color-border);
  background: var(--color-surface);
  color: var(--color-text-main);
  padding: 4px 10px;
  border-radius: 999px;
  font-size: 0.8rem;
  font-weight: 600;
}

.github-push {
  border: 1px solid var(--color-border);
  background: var(--color-surface);
  color: var(--color-text-main);
  padding: 4px 10px;
  border-radius: 999px;
  font-size: 0.8rem;
  font-weight: 600;
  display: inline-flex;
  align-items: center;
  gap: 6px;
}

.github-push:hover {
  background-color: var(--color-bg-light);
}

.github-query {
  border: 1px solid var(--color-border);
  background: var(--color-surface);
  color: var(--color-text-main);
  padding: 4px 10px;
  border-radius: 999px;
  font-size: 0.8rem;
  font-weight: 600;
}

.github-query:hover {
  background-color: var(--color-bg-light);
}

.push-error {
  color: #ef4444;
  font-size: 0.85rem;
}

.recent-list {
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.recent-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-size: 0.85rem;
  color: var(--color-text-muted);
}

.recent-items {
  display: flex;
  flex-direction: column;
  gap: 8px;
  max-height: 220px;
  overflow-y: auto;
  padding-right: 4px;
}

.recent-item {
  border: 1px solid var(--color-border);
  border-radius: 8px;
  padding: 8px 10px;
  background-color: var(--color-bg-light);
}

.recent-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}

.recent-job {
  font-size: 0.85rem;
  font-weight: 600;
  color: var(--color-text-main);
}

.recent-time {
  font-size: 0.75rem;
  color: var(--color-text-muted);
  margin-top: 4px;
}

.recent-msg {
  font-size: 0.75rem;
  color: var(--color-text-muted);
  margin-top: 4px;
}

.recent-muted {
  font-size: 0.85rem;
  color: var(--color-text-muted);
}

.graph-scroll-area {
  display: inline-block; /* Ensure it wraps contents */
  min-width: max-content;
}

.months-row {
  position: relative;
  height: 20px;
  margin-left: 30px; /* Offset for days column */
  margin-bottom: 0.5rem;
}

.month-label {
  position: absolute;
  font-size: 0.8rem;
  color: #9ca3af;
  white-space: nowrap;
}

.graph-body {
  display: flex;
  gap: 10px;
}

.days-col {
  display: flex;
  flex-direction: column;
  justify-content: space-between;
}

.day-label {
  font-size: 0.8rem;
  color: #9ca3af;
  height: 14px;
  display: flex;
  align-items: center;
}

.grid-wrapper {
  display: flex;
  gap: 4px;
}

.grid-col {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.grid-cell {
  width: 14px;
  height: 14px;
  border-radius: 3px;
  transition: all 0.1s;
  touch-action: none;
}

.grid-cell.preview-cell {
  position: relative;
}

.grid-cell.preview-cell::after {
  content: '';
  position: absolute;
  inset: 0;
  background-color: var(--preview-color);
  opacity: 0.35;
  border-radius: 3px;
  pointer-events: none;
}

.grid-cell:not(.ghost-cell):not(.future-cell) {
  cursor: pointer;
}

.grid-cell:not(.ghost-cell):not(.future-cell):hover {
  transform: scale(1.1);
  box-shadow: 0 0 0 1px rgba(0,0,0,0.1);
  z-index: 2;
}

.future-cell {
  background-color: var(--color-cell-future) !important;
  cursor: not-allowed;
  opacity: 0.6;
}

.ghost-cell {
  background-color: transparent;
  pointer-events: none;
}

.year-selector {
  display: flex;
  align-items: center;
  gap: 12px;
}

.year-label {
  font-size: 0.95rem;
  font-weight: 500;
  color: var(--color-text-main);
}

.year-control {
  display: flex;
  align-items: center;
  background-color: var(--color-bg-light);
  border-radius: 8px;
  padding: 4px;
  gap: 6px;
}

.year-control .icon-btn {
  background: transparent;
  color: var(--color-text-muted);
  border: none;
  padding: 4px 10px;
  font-weight: bold;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

.year-control .icon-btn:hover {
  color: var(--color-text-main);
}

.year-control .icon-btn:disabled {
  cursor: not-allowed;
  opacity: 0.5;
}

.year-select {
  min-width: 90px;
}

.year-val {
  font-weight: 600;
  padding: 0 16px;
  min-width: 60px;
  text-align: center;
}
</style>
