<script setup lang="ts">
/**
 * @file 贡献图图案社区：列表、排序、点赞收藏与一键导入。
 */
import { computed, nextTick, onMounted, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import {
  NAvatar,
  NButton,
  NCard,
  NDivider,
  NGrid,
  NGridItem,
  NIcon,
  NInput,
  NPagination,
  NSelect,
  NTag,
  NTooltip,
  NModal,
  NSpace,
  NEmpty,
  NSpin,
  useDialog,
  useMessage,
} from 'naive-ui'
import {
  CloudUpload,
  Chat,
  Download,
  Edit,
  Favorite,
  FavoriteFilled,
  Send,
  TrashCan,
  ThumbsUp,
  ThumbsUpFilled,
  User,
  View,
} from '@vicons/carbon'
import {
  getCommunityPatterns,
  getPatternDetail,
  likePattern,
  unlikePattern,
  favoritePattern,
  unfavoritePattern,
  getPatternComments,
  createPatternComment,
  likePatternComment,
  unlikePatternComment,
  createPattern,
  updatePattern,
  deletePattern,
  type PatternSort,
} from '../../api/patternCommunity'
import type { PatternDetailDto, PatternListItemDto, PatternCellDto, PatternCommentDto } from '../../api/types'
import { usePermissionStore } from '../../stores/permission'
import { usePatternImportStore } from '../../stores/patternImport'
import PatternEditorModal from '../../components/PatternEditorModal.vue'
import GraphTableTemplate from '../../components/GraphTableTemplate.vue'
import { calcTotalCols, getYearMeta, isFutureCell } from '../../utils/graph'
import { TimeFormatter } from '../../utils/time'
import { resolveAvatar, userAvatarFallback } from '../../utils/avatar'

const router = useRouter()
const dialog = useDialog()
const message = useMessage()
const permissionStore = usePermissionStore()
const importStore = usePatternImportStore()
const publishVisible = ref(false)
const publishTitle = ref('')
const publishDesc = ref('')
const publishGrid = ref<number[][]>([])
const publishSubmitting = ref(false)
const publishYear = ref(new Date().getFullYear())

const sort = ref<PatternSort>('view')
const yearFilter = ref<number | null>(null)
const pageIndex = ref(1)
const pageSize = ref(12)
const total = ref(0)
const loading = ref(false)
const patterns = ref<PatternListItemDto[]>([])

const detailVisible = ref(false)
const detailLoading = ref(false)
const detail = ref<PatternDetailDto | null>(null)
const comments = ref<PatternCommentDto[]>([])
const commentPageIndex = ref(1)
const commentPageSize = 8
const commentTotal = ref(0)
const commentLoading = ref(false)
const commentSubmitting = ref(false)
const commentContent = ref('')
const commentScrollRef = ref<HTMLElement | null>(null)
const replySubmitting = ref(false)
const replyContent = ref('')
const activeReplyParentId = ref<string | null>(null)
const activeReplyToUserId = ref<string | null>(null)
const activeReplyToUserName = ref<string | null>(null)
const replyPageSize = 6
const replyStates = ref<Record<string, {
  visible: boolean
  loading: boolean
  items: PatternCommentDto[]
  pageIndex: number
  total: number
}>>({})
const editVisible = ref(false)
const editTitle = ref('')
const editDesc = ref('')
const editGrid = ref<number[][]>([])
const editSubmitting = ref(false)
const editYear = ref(new Date().getFullYear())

const isLoggedIn = computed(() => !!permissionStore.token)
const canManageDetail = computed(() => {
  if (!detail.value) return false
  const currentId = permissionStore.user?.id
  return !!currentId && detail.value.creatorId === currentId
})
const canPublish = computed(() => permissionStore.hasPermission('app:community:publish'))
const canLike = computed(() => permissionStore.hasPermission('app:community:like'))
const canFavorite = computed(() => permissionStore.hasPermission('app:community:favorite'))
const canImport = computed(() => permissionStore.hasPermission('app:community:import'))
const canComment = computed(() => permissionStore.hasPermission('app:community:comment'))
const canEdit = computed(() => permissionStore.hasPermission('app:community:edit'))
const canDelete = computed(() => permissionStore.hasPermission('app:community:delete'))
const showPublish = computed(() => !isLoggedIn.value || canPublish.value)
const showLike = computed(() => !isLoggedIn.value || canLike.value)
const showFavorite = computed(() => !isLoggedIn.value || canFavorite.value)
const showImport = computed(() => !isLoggedIn.value || canImport.value)
const loginHint = computed(() => (isLoggedIn.value ? '' : '请先登录'))
const hasMoreComments = computed(() => comments.value.length < commentTotal.value)

const getReplyState = (parentId: string) => {
  if (!replyStates.value[parentId]) {
    replyStates.value[parentId] = {
      visible: false,
      loading: false,
      items: [],
      pageIndex: 1,
      total: 0,
    }
  }
  return replyStates.value[parentId]
}

const sortOptions = [
  { label: '浏览量', value: 'view' },
  { label: '收藏', value: 'favorite' },
  { label: '点赞', value: 'like' },
]

const yearOptions = computed(() => {
  const current = new Date().getFullYear()
  const options = [{ label: '全部年份', value: null as number | null }]
  for (let year = current; year >= 2008; year--) {
    options.push({ label: String(year), value: year })
  }
  return options
})

const goPublish = () => {
  if (!isLoggedIn.value) {
    message.warning('请先登录后再发布')
    return
  }
  if (!canPublish.value) {
    message.warning('当前账号无发布权限')
    return
  }
  publishYear.value = new Date().getFullYear()
  publishTitle.value = ''
  publishDesc.value = ''
  const cols = calcTotalCols(publishYear.value)
  publishGrid.value = Array.from({ length: cols }, () => Array(7).fill(0))
  publishVisible.value = true
}

const loadPatterns = async () => {
  loading.value = true
  try {
    const res = await getCommunityPatterns({
      pageIndex: pageIndex.value,
      pageSize: pageSize.value,
      sort: sort.value,
      year: yearFilter.value ?? undefined,
    })
    const data = res.data.data
    patterns.value = data.items || []
    total.value = Number(data.total || 0)
    await nextTick()
  } catch (e: any) {
    message.error(e?.message || '加载社区列表失败')
  } finally {
    loading.value = false
  }
}

const openDetail = async (item: PatternListItemDto) => {
  detailVisible.value = true
  detailLoading.value = true
  try {
    const res = await getPatternDetail(item.id)
    detail.value = res.data.data
    await nextTick()
    const idx = patterns.value.findIndex((p) => p.id === item.id)
    if (idx >= 0 && detail.value) {
      patterns.value[idx].viewCount = detail.value.viewCount
      patterns.value[idx].likeCount = detail.value.likeCount
      patterns.value[idx].favoriteCount = detail.value.favoriteCount
      patterns.value[idx].commentCount = detail.value.commentCount
      patterns.value[idx].isLiked = detail.value.isLiked
      patterns.value[idx].isFavorited = detail.value.isFavorited
    }
    await loadComments(true)
  } catch (e: any) {
    message.error(e?.message || '加载详情失败')
  } finally {
    detailLoading.value = false
  }
}

const loadComments = async (reset = false) => {
  if (!detail.value) return
  if (reset) {
    commentPageIndex.value = 1
    comments.value = []
    replyStates.value = {}
    activeReplyParentId.value = null
    activeReplyToUserId.value = null
    activeReplyToUserName.value = null
    replyContent.value = ''
  }
  commentLoading.value = true
  try {
    const res = await getPatternComments(detail.value.id, {
      parentId: 0,
      pageIndex: commentPageIndex.value,
      pageSize: commentPageSize,
    })
    const data = res.data.data
    commentTotal.value = Number(data.total || 0)
    const items = data.items || []
    comments.value = reset ? items : [...comments.value, ...items]
    if (reset) {
      await nextTick()
      if (commentScrollRef.value) {
        commentScrollRef.value.scrollTop = 0
      }
    }
  } catch (e: any) {
    message.error(e?.message || '加载评论失败')
  } finally {
    commentLoading.value = false
  }
}

const loadMoreComments = async () => {
  if (commentLoading.value || !hasMoreComments.value) return
  commentPageIndex.value += 1
  await loadComments(false)
}

const loadReplies = async (parentId: string, reset = false) => {
  if (!detail.value) return
  const state = getReplyState(parentId)
  if (reset) {
    state.pageIndex = 1
    state.items = []
  }
  state.loading = true
  try {
    const res = await getPatternComments(detail.value.id, {
      parentId,
      pageIndex: state.pageIndex,
      pageSize: replyPageSize,
    })
    const data = res.data.data
    state.total = Number(data.total || 0)
    const items = data.items || []
    state.items = reset ? items : [...state.items, ...items]
  } catch (e: any) {
    message.error(e?.message || '加载回复失败')
  } finally {
    state.loading = false
  }
}

const toggleReplies = async (item: PatternCommentDto) => {
  const state = getReplyState(item.id)
  state.visible = !state.visible
  if (state.visible && state.items.length === 0 && item.replyCount > 0) {
    await loadReplies(item.id, true)
  }
}

const loadMoreReplies = async (parentId: string) => {
  const state = getReplyState(parentId)
  if (state.loading || state.items.length >= state.total) return
  state.pageIndex += 1
  await loadReplies(parentId)
}

const handleCommentScroll = () => {
  const el = commentScrollRef.value
  if (!el || commentLoading.value || !hasMoreComments.value) return
  if (el.scrollTop + el.clientHeight >= el.scrollHeight - 80) {
    loadMoreComments()
  }
}

const submitComment = async () => {
  if (!detail.value) return
  if (!isLoggedIn.value) {
    message.warning('请先登录后再操作')
    return
  }
  if (!canComment.value) {
    message.warning('当前账号无评论权限')
    return
  }
  const content = commentContent.value.trim()
  if (!content) {
    message.warning('请输入评论内容')
    return
  }
  try {
    commentSubmitting.value = true
    await createPatternComment(detail.value.id, { content })
    commentContent.value = ''
    detail.value.commentCount += 1
    const idx = patterns.value.findIndex((p) => p.id === detail.value?.id)
    if (idx >= 0) {
      patterns.value[idx].commentCount = detail.value.commentCount
    }
    await loadComments(true)
    message.success('已发表评论')
  } catch (e: any) {
    message.error(e?.message || '发表评论失败')
  } finally {
    commentSubmitting.value = false
  }
}

const showReplyInput = (parentId: string, replyToUserId?: string, replyToUserName?: string) => {
  if (!isLoggedIn.value) {
    message.warning('请先登录后再操作')
    return
  }
  if (!canComment.value) {
    message.warning('当前账号无评论权限')
    return
  }
  activeReplyParentId.value = parentId
  activeReplyToUserId.value = replyToUserId ?? null
  activeReplyToUserName.value = replyToUserName ?? null
  replyContent.value = ''
}

const cancelReply = () => {
  activeReplyParentId.value = null
  activeReplyToUserId.value = null
  activeReplyToUserName.value = null
  replyContent.value = ''
}

const submitReply = async (parentId: string) => {
  if (!detail.value) return
  if (!isLoggedIn.value) {
    message.warning('请先登录后再操作')
    return
  }
  if (!canComment.value) {
    message.warning('当前账号无评论权限')
    return
  }
  const content = replyContent.value.trim()
  if (!content) {
    message.warning('请输入回复内容')
    return
  }
  try {
    replySubmitting.value = true
    await createPatternComment(detail.value.id, {
      content,
      parentId,
      replyToUserId: activeReplyToUserId.value ?? undefined,
    })
    replyContent.value = ''
    detail.value.commentCount += 1
    const idx = patterns.value.findIndex((p) => p.id === detail.value?.id)
    if (idx >= 0) {
      patterns.value[idx].commentCount = detail.value.commentCount
    }
    const parent = comments.value.find((c) => c.id === parentId)
    if (parent) {
      parent.replyCount += 1
    }
    const state = getReplyState(parentId)
    state.visible = true
    await loadReplies(parentId, true)
    activeReplyParentId.value = null
    activeReplyToUserId.value = null
    activeReplyToUserName.value = null
    message.success('已回复')
  } catch (e: any) {
    message.error(e?.message || '回复失败')
  } finally {
    replySubmitting.value = false
  }
}

const toggleCommentLike = async (item: PatternCommentDto) => {
  if (!detail.value) return
  if (!isLoggedIn.value) {
    message.warning('请先登录后再操作')
    return
  }
  if (!canComment.value) {
    message.warning('当前账号无评论权限')
    return
  }
  try {
    if (item.isLiked) {
      await unlikePatternComment(detail.value.id, item.id)
      item.isLiked = false
      item.likeCount = Math.max(0, item.likeCount - 1)
    } else {
      await likePatternComment(detail.value.id, item.id)
      item.isLiked = true
      item.likeCount += 1
    }
  } catch (e: any) {
    message.error(e?.message || '操作失败')
  }
}

const toggleLike = async (item: PatternListItemDto) => {
  if (!isLoggedIn.value) {
    message.warning('请先登录后再操作')
    return
  }
  if (!canLike.value) {
    message.warning('当前账号无点赞权限')
    return
  }
  try {
    if (item.isLiked) {
      await unlikePattern(item.id)
      item.isLiked = false
      item.likeCount = Math.max(0, item.likeCount - 1)
    } else {
      await likePattern(item.id)
      item.isLiked = true
      item.likeCount += 1
    }
    const idx = patterns.value.findIndex((p) => p.id === item.id)
    if (idx >= 0 && patterns.value[idx] !== item) {
      patterns.value[idx].isLiked = item.isLiked
      patterns.value[idx].likeCount = item.likeCount
    }
  } catch (e: any) {
    message.error(e?.message || '操作失败')
  }
}

const toggleFavorite = async (item: PatternListItemDto) => {
  if (!isLoggedIn.value) {
    message.warning('请先登录后再操作')
    return
  }
  if (!canFavorite.value) {
    message.warning('当前账号无收藏权限')
    return
  }
  try {
    if (item.isFavorited) {
      await unfavoritePattern(item.id)
      item.isFavorited = false
      item.favoriteCount = Math.max(0, item.favoriteCount - 1)
    } else {
      await favoritePattern(item.id)
      item.isFavorited = true
      item.favoriteCount += 1
    }
    const idx = patterns.value.findIndex((p) => p.id === item.id)
    if (idx >= 0 && patterns.value[idx] !== item) {
      patterns.value[idx].isFavorited = item.isFavorited
      patterns.value[idx].favoriteCount = item.favoriteCount
    }
  } catch (e: any) {
    message.error(e?.message || '操作失败')
  }
}

const confirmImport = (item: PatternListItemDto) => {
  if (!isLoggedIn.value) {
    message.warning('请先登录后再操作')
    return
  }
  if (!canImport.value) {
    message.warning('当前账号无导入权限')
    return
  }
  dialog.warning({
    title: '确认导入',
    content: '导入将覆盖当前贡献图，是否继续？',
    positiveText: '继续',
    negativeText: '取消',
    onPositiveClick: () => {
      importStore.set({
        title: item.title,
        year: item.year,
        gridCols: item.gridCols,
        gridRows: item.gridRows,
        cells: item.cells,
      })
      router.push('/')
    },
  })
}

const removePattern = () => {
  if (!detail.value) return
  dialog.warning({
    title: '删除图案',
    content: '确认删除该图案吗？删除后不可恢复。',
    positiveText: '删除',
    negativeText: '取消',
    onPositiveClick: async () => {
      try {
        await deletePattern(detail.value!.id)
        message.success('已删除')
        detailVisible.value = false
        await loadPatterns()
      } catch (e: any) {
        message.error(e?.message || '删除失败')
      }
    },
  })
}

const buildGridFromCells = (cells: PatternCellDto[], cols: number, rows: number) => {
  const grid = Array.from({ length: cols }, () => Array(rows).fill(0))
  cells.forEach((cell) => {
    if (grid[cell.col] && grid[cell.col][cell.row] !== undefined) {
      grid[cell.col][cell.row] = cell.level
    }
  })
  return grid
}

const buildCellsFromGrid = (grid: number[][]) => {
  const cells: PatternCellDto[] = []
  grid.forEach((col, cIndex) => {
    col.forEach((level, rIndex) => {
      if (level > 0) {
        cells.push({ col: cIndex, row: rIndex, level })
      }
    })
  })
  return cells
}

const openEditModal = async () => {
  if (!detail.value) return
  editTitle.value = detail.value.title
  editDesc.value = detail.value.description || ''
  editYear.value = detail.value.year
  editGrid.value = buildGridFromCells(detail.value.cells, detail.value.gridCols, detail.value.gridRows)
  editVisible.value = true
}

const saveEditPattern = async () => {
  if (!detail.value) return
  const title = editTitle.value.trim()
  if (!title) {
    message.warning('请输入图案标题')
    return
  }
  const cells = buildCellsFromGrid(editGrid.value)
  if (cells.length === 0) {
    message.warning('图案为空，无法保存')
    return
  }
  try {
    editSubmitting.value = true
    await updatePattern(detail.value.id, {
      title,
      description: editDesc.value.trim() || undefined,
      year: editYear.value,
      gridCols: detail.value.gridCols,
      gridRows: detail.value.gridRows,
      cells,
    })
    detail.value.title = title
    detail.value.description = editDesc.value.trim() || undefined
    detail.value.year = editYear.value
    detail.value.cells = cells
    const idx = patterns.value.findIndex((p) => p.id === detail.value!.id)
    if (idx >= 0) {
      patterns.value[idx].title = detail.value.title
      patterns.value[idx].description = detail.value.description
      patterns.value[idx].year = detail.value.year
      patterns.value[idx].cells = cells
    }
    editVisible.value = false
    message.success('已更新图案')
    await nextTick()
    requestAnimationFrame(() => updateDetailScale())
  } catch (e: any) {
    message.error(e?.message || '更新失败')
  } finally {
    editSubmitting.value = false
  }
}

const publishPattern = async () => {
  const title = publishTitle.value.trim()
  if (!title) {
    message.warning('请输入图案标题')
    return
  }
  const cells = buildCellsFromGrid(publishGrid.value)
  if (cells.length === 0) {
    message.warning('图案为空，无法发布')
    return
  }
  try {
    publishSubmitting.value = true
    await createPattern({
      title,
      description: publishDesc.value.trim() || undefined,
      year: publishYear.value,
      gridCols: publishGrid.value.length,
      gridRows: 7,
      cells,
    })
    message.success('已发布到社区')
    publishVisible.value = false
    await loadPatterns()
  } catch (e: any) {
    message.error(e?.message || '发布失败')
  } finally {
    publishSubmitting.value = false
  }
}

const months = ['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月']
const days = ['', '一', '', '三', '', '五', '']

const buildMonthPositions = (year: number, cols: number) => {
  const { daysInYear, startDayOfWeek } = getYearMeta(year)
  const positions: Array<{ label: string; colIndex: number }> = []
  let col = 0
  let row = startDayOfWeek
  const tempDate = new Date(year, 0, 1)
  for (let i = 0; i < daysInYear; i++) {
    if (tempDate.getDate() === 1) {
      positions.push({ label: months[tempDate.getMonth()]!, colIndex: col })
    }
    tempDate.setDate(tempDate.getDate() + 1)
    row++
    if (row > 6) {
      row = 0
      col++
    }
  }
  return positions.filter((p) => p.colIndex < cols)
}

const buildCalendarGrid = (cells: PatternCellDto[], year: number) => {
  const { daysInYear, startDayOfWeek } = getYearMeta(year)
  const cols = calcTotalCols(year)
  const grid: Array<Array<{ level: number } | null>> = Array.from({ length: cols }, () => Array(7).fill(null))
  const map = new Map<string, number>()
  cells.forEach((cell) => {
    map.set(`${cell.col}-${cell.row}`, cell.level)
  })
  for (let c = 0; c < cols; c++) {
    for (let r = 0; r < 7; r++) {
      const index = c * 7 + r
      if (index < startDayOfWeek || index >= startDayOfWeek + daysInYear) {
        grid[c][r] = null
        continue
      }
      const level = map.get(`${c}-${r}`) || 0
      const future = isFutureCell(year, index, startDayOfWeek)
      grid[c][r] = { level, isFuture: future }
    }
  }
  return grid
}

const levelToColor = (level: number) => {
  const colors = [
    'var(--color-cell-empty)',
    'var(--color-cell-level-1)',
    'var(--color-cell-level-2)',
    'var(--color-cell-level-3)',
    'var(--color-cell-level-4)',
  ]
  return colors[level] ?? colors[0]!
}


watch(sort, () => {
  pageIndex.value = 1
})

watch(yearFilter, () => {
  pageIndex.value = 1
})

watch([sort, yearFilter, pageIndex, pageSize], loadPatterns)

watch(detailVisible, (value) => {
  if (!value) {
    comments.value = []
    commentTotal.value = 0
    commentContent.value = ''
    commentPageIndex.value = 1
  }
})

onMounted(loadPatterns)
</script>

<template>
  <div class="community-page">
    <div class="community-header">
      <div>
        <div class="title">图案社区</div>
        <div class="subtitle">按浏览量、收藏、点赞排序展示热门图案</div>
      </div>
      <n-space align="center">
        <n-tooltip v-if="showPublish" trigger="hover">
          <template #trigger>
            <span class="tooltip-wrapper">
              <n-button type="primary" size="small" circle :disabled="!isLoggedIn" @click="goPublish">
                <n-icon size="16">
                  <CloudUpload />
                </n-icon>
              </n-button>
            </span>
          </template>
          {{ loginHint || '发布图案' }}
        </n-tooltip>
        <span class="sort-label">年份：</span>
        <n-select v-model:value="yearFilter" :options="yearOptions" size="small" style="width: 140px" />
        <span class="sort-label">排序：</span>
        <n-select v-model:value="sort" :options="sortOptions" size="small" style="width: 160px" />
      </n-space>
    </div>

    <n-spin :show="loading">
      <n-empty v-if="!loading && patterns.length === 0" description="暂无社区图案" />

      <n-grid v-else :x-gap="18" :y-gap="18" :cols="3" responsive="screen">
        <n-grid-item v-for="item in patterns" :key="item.id">
          <n-card class="pattern-card" hoverable @click="openDetail(item)">
            <div class="card-header">
              <div class="card-title">{{ item.title }}</div>
              <n-tag size="small" type="success">{{ item.year }}</n-tag>
            </div>
            <div class="card-desc">{{ item.description || '暂无描述' }}</div>
            <div class="pattern-preview">
              <GraphTableTemplate
                :grid-cols="buildCalendarGrid(item.cells, item.year)"
                :month-positions="buildMonthPositions(item.year, calcTotalCols(item.year))"
                :days="days"
                :level-to-color="levelToColor"
                :cell-size="10"
                :gap="3"
                :days-col-width="24"
                :auto-scale="true"
              />
            </div>
            <div class="card-author">
              <n-avatar size="small" round color="transparent" class="user-avatar">
                <img
                  :src="resolveAvatar(item.creatorAvatar)"
                  :alt="item.creatorName"
                  referrerpolicy="no-referrer"
                  @error="($event.target as HTMLImageElement).src = userAvatarFallback"
                />
              </n-avatar>
              <span class="author-name">{{ item.creatorName }}</span>
              <span class="author-date">{{ TimeFormatter.formatDate(item.createTime) }}</span>
            </div>
            <div class="card-meta">
              <span class="meta-item">
                <n-icon size="14">
                  <View />
                </n-icon>
                {{ item.viewCount }}
              </span>
              <span class="meta-item">
                <n-icon size="14">
                  <ThumbsUp />
                </n-icon>
                {{ item.likeCount }}
              </span>
              <span class="meta-item">
                <n-icon size="14">
                  <Favorite />
                </n-icon>
                {{ item.favoriteCount }}
              </span>
              <span class="meta-item">
                <n-icon size="14">
                  <Chat />
                </n-icon>
                {{ item.commentCount }}
              </span>
            </div>
            <div class="card-actions" @click.stop>
              <n-tooltip v-if="showLike" trigger="hover">
                <template #trigger>
                  <span class="tooltip-wrapper">
                    <n-button
                      size="small"
                      secondary
                      circle
                      :disabled="!isLoggedIn"
                      :type="item.isLiked ? 'success' : 'default'"
                      @click="toggleLike(item)"
                    >
                      <n-icon size="16">
                        <ThumbsUpFilled v-if="item.isLiked" />
                        <ThumbsUp v-else />
                      </n-icon>
                    </n-button>
                  </span>
                </template>
                {{ loginHint || '点赞' }}
              </n-tooltip>
              <n-tooltip v-if="showFavorite" trigger="hover">
                <template #trigger>
                  <span class="tooltip-wrapper">
                    <n-button
                      size="small"
                      secondary
                      circle
                      :disabled="!isLoggedIn"
                      :type="item.isFavorited ? 'warning' : 'default'"
                      @click="toggleFavorite(item)"
                    >
                      <n-icon size="16">
                        <FavoriteFilled v-if="item.isFavorited" />
                        <Favorite v-else />
                      </n-icon>
                    </n-button>
                  </span>
                </template>
                {{ loginHint || '收藏' }}
              </n-tooltip>
              <n-tooltip v-if="showImport" trigger="hover">
                <template #trigger>
                  <span class="tooltip-wrapper">
                    <n-button size="small" type="primary" circle :disabled="!isLoggedIn" @click="confirmImport(item)">
                      <n-icon size="16">
                        <Download />
                      </n-icon>
                    </n-button>
                  </span>
                </template>
                {{ loginHint || '一键导入' }}
              </n-tooltip>
            </div>
          </n-card>
        </n-grid-item>
      </n-grid>
    </n-spin>

    <div class="pagination-bar" v-if="total > 0">
      <n-pagination
        v-model:page="pageIndex"
        v-model:page-size="pageSize"
        :item-count="total"
        :page-sizes="[6, 12, 18, 24]"
        show-size-picker
      />
    </div>

    <n-modal v-model:show="detailVisible" preset="card" title="图案详情" style="width: min(720px, 94vw);">
      <n-spin :show="detailLoading">
        <div v-if="detail" class="detail-body">
          <div class="detail-header">
            <div class="detail-title">{{ detail.title }}</div>
            <n-tag size="small" type="success">{{ detail.year }}</n-tag>
          </div>
          <div class="detail-desc">{{ detail.description || '暂无描述' }}</div>
          <div class="pattern-preview large" ref="detailPreviewRef">
            <GraphTableTemplate
              :grid-cols="buildCalendarGrid(detail.cells, detail.year)"
              :month-positions="buildMonthPositions(detail.year, calcTotalCols(detail.year))"
              :days="days"
              :level-to-color="levelToColor"
              :cell-size="12"
              :gap="4"
              :days-col-width="26"
              :auto-scale="true"
            />
          </div>
          <div class="detail-meta">
            <span class="meta-item detail-author">
              <n-avatar size="small" round color="transparent" class="user-avatar">
                <img
                  :src="resolveAvatar(detail.creatorAvatar)"
                  :alt="detail.creatorName"
                  referrerpolicy="no-referrer"
                  @error="($event.target as HTMLImageElement).src = userAvatarFallback"
                />
              </n-avatar>
              {{ detail.creatorName }}
            </span>
            <span class="meta-item">
              <n-icon size="14">
                <View />
              </n-icon>
              {{ detail.viewCount }}
            </span>
            <span class="meta-item">
              <n-icon size="14">
                <ThumbsUp />
              </n-icon>
              {{ detail.likeCount }}
            </span>
            <span class="meta-item">
              <n-icon size="14">
                <Favorite />
              </n-icon>
              {{ detail.favoriteCount }}
            </span>
            <span class="meta-item">
              <n-icon size="14">
                <Chat />
              </n-icon>
              {{ detail.commentCount }}
            </span>
          </div>
          <div class="detail-actions">
            <n-tooltip v-if="showLike" trigger="hover">
              <template #trigger>
                <span class="tooltip-wrapper">
                  <n-button
                    size="small"
                    secondary
                    circle
                    :disabled="!isLoggedIn"
                    :type="detail.isLiked ? 'success' : 'default'"
                    @click="toggleLike(detail)"
                  >
                    <n-icon size="16">
                      <ThumbsUpFilled v-if="detail.isLiked" />
                      <ThumbsUp v-else />
                    </n-icon>
                  </n-button>
                </span>
              </template>
              {{ loginHint || '点赞' }}
            </n-tooltip>
            <n-tooltip v-if="showFavorite" trigger="hover">
              <template #trigger>
                <span class="tooltip-wrapper">
                  <n-button
                    size="small"
                    secondary
                    circle
                    :disabled="!isLoggedIn"
                    :type="detail.isFavorited ? 'warning' : 'default'"
                    @click="toggleFavorite(detail)"
                  >
                    <n-icon size="16">
                      <FavoriteFilled v-if="detail.isFavorited" />
                      <Favorite v-else />
                    </n-icon>
                  </n-button>
                </span>
              </template>
              {{ loginHint || '收藏' }}
            </n-tooltip>
            <n-tooltip v-if="showImport" trigger="hover">
              <template #trigger>
                <span class="tooltip-wrapper">
                  <n-button size="small" type="primary" circle :disabled="!isLoggedIn" @click="confirmImport(detail)">
                    <n-icon size="16">
                      <Download />
                    </n-icon>
                  </n-button>
                </span>
              </template>
              {{ loginHint || '一键导入' }}
            </n-tooltip>
            <template v-if="canManageDetail">
              <n-tooltip v-if="canEdit" trigger="hover">
                <template #trigger>
                  <span class="tooltip-wrapper">
                    <n-button size="small" circle @click="openEditModal">
                      <n-icon size="16">
                        <Edit />
                      </n-icon>
                    </n-button>
                  </span>
                </template>
                编辑图案
              </n-tooltip>
              <n-tooltip v-if="canDelete" trigger="hover">
                <template #trigger>
                  <span class="tooltip-wrapper">
                    <n-button size="small" circle type="error" ghost @click="removePattern">
                      <n-icon size="16">
                        <TrashCan />
                      </n-icon>
                    </n-button>
                  </span>
                </template>
                删除
              </n-tooltip>
            </template>
          </div>

          <n-divider />

          <div class="comment-section">
            <div class="comment-header">
              <n-icon size="16">
                <Chat />
              </n-icon>
              评论 {{ detail.commentCount }}
            </div>
            <div class="comment-input">
              <n-input
                v-model:value="commentContent"
                type="textarea"
                :autosize="{ minRows: 2, maxRows: 4 }"
                placeholder="写下你的评论..."
                :disabled="!isLoggedIn || !canComment"
              />
              <n-tooltip trigger="hover">
                <template #trigger>
                  <span class="tooltip-wrapper">
                    <n-button
                      type="primary"
                      circle
                      :loading="commentSubmitting"
                      :disabled="!isLoggedIn || !canComment || commentSubmitting"
                      @click="submitComment"
                    >
                      <n-icon size="16">
                        <Send />
                      </n-icon>
                    </n-button>
                  </span>
                </template>
                发表评论
              </n-tooltip>
            </div>
            <div v-if="!isLoggedIn" class="comment-hint">请先登录后发表评论</div>
            <div v-else-if="!canComment" class="comment-hint">当前账号无评论权限</div>

            <n-spin :show="commentLoading">
              <div v-if="comments.length === 0 && !commentLoading" class="comment-empty">暂无评论</div>
              <div v-else class="comment-list-wrap" ref="commentScrollRef" @scroll="handleCommentScroll">
                <div class="comment-list">
                  <div v-for="item in comments" :key="item.id" class="comment-item">
                    <n-avatar size="small" round color="transparent" class="user-avatar">
                      <img
                        :src="resolveAvatar(item.userAvatar)"
                        :alt="item.userName"
                        referrerpolicy="no-referrer"
                        @error="($event.target as HTMLImageElement).src = userAvatarFallback"
                      />
                    </n-avatar>
                    <div class="comment-body">
                      <div class="comment-meta">
                        <span class="comment-author">{{ item.userName }}</span>
                        <span class="comment-time">{{ TimeFormatter.formatDateTime(item.createTime) }}</span>
                      </div>
                      <div class="comment-content">{{ item.content }}</div>
                      <div class="comment-actions">
                        <n-button
                          quaternary
                          size="tiny"
                          :type="item.isLiked ? 'primary' : 'default'"
                          :disabled="!isLoggedIn || !canComment"
                          @click="toggleCommentLike(item)"
                        >
                          <template #icon>
                            <n-icon size="14">
                              <ThumbsUpFilled v-if="item.isLiked" />
                              <ThumbsUp v-else />
                            </n-icon>
                          </template>
                          {{ item.likeCount }}
                        </n-button>
                        <n-button
                          quaternary
                          size="tiny"
                          :disabled="!isLoggedIn || !canComment"
                          @click="showReplyInput(item.id, item.userId, item.userName)"
                        >
                          回复
                        </n-button>
                        <n-button
                          v-if="item.replyCount > 0"
                          text
                          size="tiny"
                          @click="toggleReplies(item)"
                        >
                          {{ getReplyState(item.id).visible ? '收起回复' : `查看 ${item.replyCount} 条回复` }}
                        </n-button>
                      </div>
                      <div v-if="activeReplyParentId === item.id" class="reply-input">
                        <n-input
                          v-model:value="replyContent"
                          type="textarea"
                          :autosize="{ minRows: 2, maxRows: 3 }"
                          :placeholder="activeReplyToUserName ? `回复 @${activeReplyToUserName}` : '写下你的回复...'"
                          :disabled="replySubmitting"
                        />
                        <div class="reply-actions">
                          <n-button size="tiny" @click="cancelReply">取消</n-button>
                          <n-button
                            type="primary"
                            size="tiny"
                            :loading="replySubmitting"
                            :disabled="replySubmitting"
                            @click="submitReply(item.id)"
                          >
                            发送
                          </n-button>
                        </div>
                      </div>
                      <div v-if="getReplyState(item.id).visible" class="reply-list">
                        <n-spin :show="getReplyState(item.id).loading">
                          <div
                            v-if="getReplyState(item.id).items.length === 0 && !getReplyState(item.id).loading"
                            class="reply-empty"
                          >
                            暂无回复
                          </div>
                          <div v-else class="reply-items">
                            <div v-for="reply in getReplyState(item.id).items" :key="reply.id" class="reply-item">
                              <n-avatar size="small" round color="transparent" class="user-avatar">
                                <img
                                  :src="resolveAvatar(reply.userAvatar)"
                                  :alt="reply.userName"
                                  referrerpolicy="no-referrer"
                                  @error="($event.target as HTMLImageElement).src = userAvatarFallback"
                                />
                              </n-avatar>
                              <div class="reply-body">
                                <div class="comment-meta">
                                  <span class="comment-author">{{ reply.userName }}</span>
                                  <span class="comment-time">{{ TimeFormatter.formatDateTime(reply.createTime) }}</span>
                                </div>
                                <div class="comment-content">
                                  <span v-if="reply.replyToUserName" class="reply-to">
                                    回复 @{{ reply.replyToUserName }}：
                                  </span>
                                  {{ reply.content }}
                                </div>
                                <div class="comment-actions">
                                  <n-button
                                    quaternary
                                    size="tiny"
                                    :type="reply.isLiked ? 'primary' : 'default'"
                                    :disabled="!isLoggedIn || !canComment"
                                    @click="toggleCommentLike(reply)"
                                  >
                                    <template #icon>
                                      <n-icon size="14">
                                        <ThumbsUpFilled v-if="reply.isLiked" />
                                        <ThumbsUp v-else />
                                      </n-icon>
                                    </template>
                                    {{ reply.likeCount }}
                                  </n-button>
                                  <n-button
                                    quaternary
                                    size="tiny"
                                    :disabled="!isLoggedIn || !canComment"
                                    @click="showReplyInput(item.id, reply.userId, reply.userName)"
                                  >
                                    回复
                                  </n-button>
                                </div>
                              </div>
                            </div>
                          </div>
                          <div v-if="getReplyState(item.id).items.length > 0" class="reply-load">
                            <span v-if="getReplyState(item.id).loading">加载中...</span>
                            <span
                              v-else-if="getReplyState(item.id).items.length < getReplyState(item.id).total"
                              class="reply-more"
                              @click="loadMoreReplies(item.id)"
                            >
                              加载更多回复
                            </span>
                            <span v-else>已加载全部</span>
                          </div>
                        </n-spin>
                      </div>
                    </div>
                  </div>
                </div>
                <div class="comment-load">
                  <span v-if="commentLoading">加载中...</span>
                  <span v-else-if="hasMoreComments">下拉加载更多</span>
                  <span v-else>已加载全部</span>
                </div>
              </div>
            </n-spin>
          </div>
        </div>
      </n-spin>
    </n-modal>

    <PatternEditorModal
      v-model:show="editVisible"
      v-model:title="editTitle"
      v-model:desc="editDesc"
      v-model:year="editYear"
      v-model:grid="editGrid"
      modal-title="编辑图案"
      submit-text="保存修改"
      :submit-loading="editSubmitting"
      @submit="saveEditPattern"
    />
    <PatternEditorModal
      v-model:show="publishVisible"
      v-model:title="publishTitle"
      v-model:desc="publishDesc"
      v-model:year="publishYear"
      v-model:grid="publishGrid"
      modal-title="发布图案"
      submit-text="发布"
      :submit-loading="publishSubmitting"
      @submit="publishPattern"
    />
  </div>
</template>

<style scoped>
.community-page {
  padding: 24px 28px 40px;
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.community-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 16px;
}

.title {
  font-size: 22px;
  font-weight: 700;
  color: var(--color-text-main);
}

.subtitle {
  font-size: 13px;
  color: var(--color-text-muted);
}

.sort-label {
  font-size: 13px;
  color: var(--color-text-muted);
}

.pattern-card {
  border-radius: 14px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.card-title {
  font-weight: 600;
}

.card-desc {
  font-size: 13px;
  color: var(--color-text-muted);
  min-height: 36px;
  margin-bottom: 12px;
}

.card-author {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 12px;
  color: var(--color-text-muted);
  margin-bottom: 10px;
}

.author-name {
  font-weight: 600;
  color: var(--color-text-main);
}

.author-date {
  margin-left: auto;
}

.user-avatar img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}

.pattern-preview {
  padding: 10px;
  border-radius: 12px;
  background: var(--color-bg-light);
  border: 1px solid var(--color-border);
  margin-bottom: 12px;
  max-width: 100%;
  overflow: hidden;
  box-sizing: border-box;
  width: 100%;
}

.pattern-preview.large {
  padding: 16px;
}

.card-meta {
  font-size: 12px;
  color: var(--color-text-muted);
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 12px;
}

.meta-item {
  display: inline-flex;
  align-items: center;
  gap: 4px;
}

.card-actions {
  display: flex;
  gap: 8px;
}

.tooltip-wrapper {
  display: inline-flex;
}

.pagination-bar {
  display: flex;
  justify-content: center;
  padding-top: 8px;
}

.detail-body {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.detail-header {
  display: flex;
  align-items: center;
  gap: 12px;
}

.detail-title {
  font-size: 18px;
  font-weight: 700;
}

.detail-desc {
  font-size: 14px;
  color: var(--color-text-muted);
}

.detail-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  font-size: 12px;
  color: var(--color-text-muted);
}

.detail-author {
  gap: 8px;
}

.detail-actions {
  display: flex;
  gap: 8px;
}

.comment-section {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.comment-header {
  display: flex;
  align-items: center;
  gap: 6px;
  font-weight: 600;
  color: var(--color-text-main);
}

.comment-input {
  display: flex;
  gap: 10px;
  align-items: flex-start;
}

.comment-input .n-input {
  flex: 1;
}

.comment-hint {
  font-size: 12px;
  color: var(--color-text-muted);
}

.comment-empty {
  font-size: 12px;
  color: var(--color-text-muted);
}

.comment-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.comment-list-wrap {
  max-height: 280px;
  overflow-y: auto;
  padding-right: 6px;
}

.comment-item {
  display: flex;
  gap: 10px;
  align-items: flex-start;
}

.comment-body {
  flex: 1;
}

.comment-meta {
  display: flex;
  gap: 8px;
  font-size: 12px;
  color: var(--color-text-muted);
  margin-bottom: 4px;
}

.comment-author {
  font-weight: 600;
  color: var(--color-text-main);
}

.comment-content {
  font-size: 13px;
  color: var(--color-text-main);
  line-height: 1.6;
  word-break: break-word;
}

.comment-actions {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-top: 6px;
}

.reply-input {
  margin-top: 8px;
  padding: 10px;
  border-radius: 10px;
  background: var(--color-bg-light);
  border: 1px solid var(--color-border);
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.reply-actions {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
}

.reply-list {
  margin-top: 8px;
  padding-left: 36px;
  border-left: 1px dashed var(--color-border);
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.reply-items {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.reply-item {
  display: flex;
  gap: 8px;
  align-items: flex-start;
}

.reply-body {
  flex: 1;
}

.reply-to {
  color: var(--color-text-muted);
  margin-right: 4px;
}

.reply-load {
  font-size: 12px;
  color: var(--color-text-muted);
  text-align: center;
  padding: 6px 0 2px;
}

.reply-more {
  color: var(--color-primary);
  cursor: pointer;
}

.reply-empty {
  font-size: 12px;
  color: var(--color-text-muted);
}

.comment-load {
  font-size: 12px;
  color: var(--color-text-muted);
  text-align: center;
  padding: 8px 0 4px;
}


@media (max-width: 1024px) {
  .community-page {
    padding: 20px;
  }
}

@media (max-width: 860px) {
  .community-header {
    flex-direction: column;
    align-items: flex-start;
  }
}

@media (max-width: 720px) {
  .pattern-preview {
    overflow-x: auto;
  }
}
</style>
