<script setup lang="ts">
/**
 * @file 贡献图图案社区：列表、排序、点赞收藏与一键导入。
 */
import { computed, nextTick, onMounted, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import {
  NAvatar,
  NButton,
  NGrid,
  NGridItem,
  NIcon,
  NPagination,
  NSelect,
  NTooltip,
  NSpace,
  NEmpty,
  NSpin,
  useDialog,
  useMessage,
} from 'naive-ui'
import {
  Add,
  Checkmark,
  CloudUpload,
  Download,
  Favorite,
  FavoriteFilled,
  Share,
  ThumbsUp,
  ThumbsUpFilled,
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
import type { PatternDetailDto, PatternListItemDto, PatternCommentDto, UserFollowStatusDto } from '../../api/types'
import { usePermissionStore } from '../../stores/permission'
import { usePatternImportStore } from '../../stores/patternImport'
import PatternEditorModal from '../../components/PatternEditorModal.vue'
import PatternDetailTemplate from '../../components/PatternDetailTemplate.vue'
import PatternCard from '../../components/PatternCard.vue'
import PatternExportDialog from '../../components/PatternExportDialog.vue'
import { calcTotalCols } from '../../utils/graph'
import { TimeFormatter } from '../../utils/time'
import { resolveAvatar, userAvatarFallback } from '../../utils/avatar'
import { followUser, getFollowStatus, unfollowUser } from '../../api/user'
import { buildCellsFromGrid, buildGridFromCells } from '../../utils/patternGrid'

const router = useRouter()
const dialog = useDialog()
const message = useMessage()
const permissionStore = usePermissionStore()
const importStore = usePatternImportStore()
const publishVisible = ref(false)
const publishTitle = ref('')
const publishDesc = ref('')
const publishVisibility = ref<'public' | 'followers' | 'private'>('public')
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
const followStatus = ref<UserFollowStatusDto | null>(null)
const followLoading = ref(false)
const editVisible = ref(false)
const editTitle = ref('')
const editDesc = ref('')
const editVisibility = ref<'public' | 'followers' | 'private'>('public')
const editGrid = ref<number[][]>([])
const editSubmitting = ref(false)
const editYear = ref(new Date().getFullYear())
const exportDialogVisible = ref(false)
const exportTarget = ref<PatternDetailDto | null>(null)

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
const showShare = computed(() => showImport.value)
const loginHint = computed(() => (isLoggedIn.value ? '' : '请先登录'))
const hasMoreComments = computed(() => comments.value.length < commentTotal.value)

/**
 * @description 获取指定父评论的回复状态，不存在时自动初始化。
 * @param {string} parentId 父评论 ID。
 * @returns 回复状态对象。
 */
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


/**
 * @description 加载当前详情作者的关注状态。
 * @param {string} [creatorId] 作者用户 ID。
 */
const loadFollowStatus = async (creatorId?: string) => {
  if (!creatorId || !isLoggedIn.value) {
    followStatus.value = null
    return
  }
  if (permissionStore.user?.id === creatorId) {
    followStatus.value = null
    return
  }
  try {
    followLoading.value = true
    const res = await getFollowStatus(creatorId)
    followStatus.value = res.data.data
  } catch {
    followStatus.value = null
  } finally {
    followLoading.value = false
  }
}

/**
 * @description 切换详情作者的关注状态。
 */
const toggleFollowCreator = async () => {
  if (!detail.value) return
  if (!isLoggedIn.value) {
    message.warning('请先登录后再操作')
    return
  }
  if (permissionStore.user?.id === detail.value.creatorId) return
  try {
    followLoading.value = true
    if (followStatus.value?.isFollowing) {
      await unfollowUser(detail.value.creatorId)
    } else {
      await followUser(detail.value.creatorId)
    }
    await loadFollowStatus(detail.value.creatorId)
  } catch (e: any) {
    message.error(e?.message || '操作失败')
  } finally {
    followLoading.value = false
  }
}

const openExportDialog = () => {
  if (!detail.value) return
  exportTarget.value = detail.value
  exportDialogVisible.value = true
}

const openExportDialogByItem = (item: PatternListItemDto) => {
  exportTarget.value = item
  exportDialogVisible.value = true
}

/**
 * @description 跳转到用户主页；若为本人则跳转到“我的主页”。
 * @param {string} [userId] 目标用户 ID。
 */
const goUserHome = (userId?: string) => {
  if (!userId) return
  if (permissionStore.user?.id === userId) {
    router.push('/me')
    return
  }
  router.push(`/users/${userId}`)
}

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
  publishVisibility.value = 'public'
  const cols = calcTotalCols(publishYear.value)
  publishGrid.value = Array.from({ length: cols }, () => Array(7).fill(0))
  publishVisible.value = true
}

/**
 * @description 加载社区图案列表。
 */
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

/**
 * @description 打开图案详情弹窗并加载评论、关注状态等附加数据。
 * @param {PatternListItemDto} item 图案列表项。
 */
const openDetail = async (item: PatternListItemDto) => {
  detailVisible.value = true
  detailLoading.value = true
  try {
    const res = await getPatternDetail(item.id)
    detail.value = res.data.data
    await loadFollowStatus(detail.value.creatorId)
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

/**
 * @description 加载图案评论列表，可选择是否重置分页。
 * @param {boolean} [reset=false] 是否重置评论分页与数据。
 */
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

/**
 * @description 加载指定评论的回复列表。
 * @param {string} parentId 父评论 ID。
 * @param {boolean} [reset=false] 是否重置回复分页。
 */
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

/**
 * @description 提交一级评论。
 */
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

/**
 * @description 提交回复评论。
 * @param {string} parentId 父评论 ID。
 */
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

/**
 * @description 切换图案点赞状态。
 * @param {PatternListItemDto} item 目标图案。
 */
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

/**
 * @description 切换图案收藏状态。
 * @param {PatternListItemDto} item 目标图案。
 */
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

/**
 * @description 确认并导入图案到当前编辑器。
 * @param {PatternListItemDto} item 待导入图案。
 */
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

/**
 * @description 删除当前详情中的图案。
 */
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

/**
 * @description 打开图案编辑弹窗并回填当前详情数据。
 */
const openEditModal = async () => {
  if (!detail.value) return
  editTitle.value = detail.value.title
  editDesc.value = detail.value.description || ''
  editVisibility.value = detail.value.visibility || 'public'
  editYear.value = detail.value.year
  editGrid.value = buildGridFromCells(detail.value.cells, detail.value.gridCols, detail.value.gridRows)
  editVisible.value = true
}

/**
 * @description 保存图案编辑结果。
 */
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
      visibility: editVisibility.value,
      year: editYear.value,
      gridCols: detail.value.gridCols,
      gridRows: detail.value.gridRows,
      cells,
    })
    detail.value.title = title
    detail.value.description = editDesc.value.trim() || undefined
    detail.value.visibility = editVisibility.value
    detail.value.year = editYear.value
    detail.value.cells = cells
    const idx = patterns.value.findIndex((p) => p.id === detail.value!.id)
    if (idx >= 0) {
      patterns.value[idx].title = detail.value.title
      patterns.value[idx].description = detail.value.description
      patterns.value[idx].visibility = detail.value.visibility
      patterns.value[idx].year = detail.value.year
      patterns.value[idx].cells = cells
    }
    editVisible.value = false
    message.success('已更新图案')
  } catch (e: any) {
    message.error(e?.message || '更新失败')
  } finally {
    editSubmitting.value = false
  }
}

/**
 * @description 发布新的社区图案。
 */
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
      visibility: publishVisibility.value,
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
    followStatus.value = null
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
          <PatternCard
            :item="item"
            clickable
            :show-visibility-tag="true"
            :hide-public-visibility="true"
            :show-year-tag="true"
            :show-author="true"
            :author-date-text="TimeFormatter.formatDate(item.createTime)"
            :show-comment-count="true"
            @card-click="openDetail"
            @user-click="goUserHome"
          >
            <template #actions>
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
              <n-tooltip v-if="showShare" trigger="hover">
                <template #trigger>
                  <span class="tooltip-wrapper">
                    <n-button size="small" secondary circle :disabled="!isLoggedIn" @click.stop="openExportDialogByItem(item)">
                      <n-icon size="16">
                        <Share />
                      </n-icon>
                    </n-button>
                  </span>
                </template>
                {{ loginHint || '导出与分享' }}
              </n-tooltip>
            </template>
          </PatternCard>
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

    <PatternDetailTemplate
      v-model:show="detailVisible"
      :loading="detailLoading"
      :detail="detail"
      :show-visibility-tag="detail?.visibility !== 'public'"
      :is-logged-in="isLoggedIn"
      :login-hint="loginHint"
      :show-like="showLike"
      :show-favorite="showFavorite"
      :show-import="showImport"
      :show-share="showShare"
      :can-manage-detail="canManageDetail"
      :can-edit="canEdit"
      :can-delete="canDelete"
      :comments="comments"
      :comment-loading="commentLoading"
      :has-more-comments="hasMoreComments"
      :can-comment="canComment"
      :enable-comment-input="true"
      :enable-reply="true"
      v-model:comment-content="commentContent"
      :comment-submitting="commentSubmitting"
      :active-reply-parent-id="activeReplyParentId"
      :active-reply-to-user-name="activeReplyToUserName"
      v-model:reply-content="replyContent"
      :reply-submitting="replySubmitting"
      :reply-states="replyStates"
      @like="detail && toggleLike(detail)"
      @favorite="detail && toggleFavorite(detail)"
      @import="detail && confirmImport(detail)"
      @share="openExportDialog"
      @edit="openEditModal"
      @delete="removePattern"
      @go-user="goUserHome"
      @submit-comment="submitComment"
      @comment-like="toggleCommentLike"
      @show-reply="showReplyInput"
      @toggle-replies="toggleReplies"
      @cancel-reply="cancelReply"
      @submit-reply="submitReply"
      @load-more-replies="loadMoreReplies"
      @load-more-comments="loadMoreComments"
    >
      <template #actions-prefix-extra>
        <n-tooltip
          v-if="isLoggedIn && detail?.creatorId !== permissionStore.user?.id"
          trigger="hover"
        >
          <template #trigger>
            <n-button size="small" secondary circle :loading="followLoading" @click="toggleFollowCreator">
              <n-icon size="16">
                <Checkmark v-if="followStatus?.isFollowing" />
                <Add v-else />
              </n-icon>
            </n-button>
          </template>
          {{ followStatus?.isFollowing ? '取消关注' : '关注作者' }}
        </n-tooltip>
      </template>
    </PatternDetailTemplate>
    <PatternExportDialog
      v-model:show="exportDialogVisible"
      :pattern-id="exportTarget?.id"
      :pattern-title="exportTarget?.title"
    />

    <PatternEditorModal
      v-model:show="editVisible"
      v-model:title="editTitle"
      v-model:desc="editDesc"
      v-model:visibility="editVisibility"
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
      v-model:visibility="publishVisibility"
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

.user-avatar img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}

.tooltip-wrapper {
  display: inline-flex;
}

.pagination-bar {
  display: flex;
  justify-content: center;
  padding-top: 8px;
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
