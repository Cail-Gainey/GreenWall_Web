<script setup lang="ts">
/**
 * @file 用户主页页面：支持查看个人/他人资料、作品浏览、关注与作品操作。
 */
import { computed, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import {
  NAvatar,
  NButton,
  NCard,
  NEmpty,
  NGrid,
  NGridItem,
  NIcon,
  NPagination,
  NSpin,
  NTag,
  NTooltip,
  useDialog,
  useMessage,
} from 'naive-ui'
import { Add, Checkmark, Edit } from '@vicons/carbon'
import { getMe } from '../../api/auth'
import {
  deletePattern,
  favoritePattern,
  getMyPatterns,
  getPatternComments,
  getPatternDetail,
  getUserPatterns,
  likePattern,
  unfavoritePattern,
  unlikePattern,
  updatePattern,
} from '../../api/patternCommunity'
import { followUser, getPublicUserProfile, unfollowUser } from '../../api/user'
import type { PatternCommentDto, PatternDetailDto, PatternListItemDto, UserProfileDto, UserPublicProfileDto } from '../../api/types'
import PatternEditorModal from '../../components/PatternEditorModal.vue'
import PatternDetailTemplate from '../../components/PatternDetailTemplate.vue'
import PatternExportDialog from '../../components/PatternExportDialog.vue'
import PatternCard from '../../components/PatternCard.vue'
import { resolveAvatar, userAvatarFallback } from '../../utils/avatar'
import { TimeFormatter } from '../../utils/time'
import { usePermissionStore } from '../../stores/permission'
import { usePatternImportStore } from '../../stores/patternImport'
import { buildCellsFromGrid, buildGridFromCells } from '../../utils/patternGrid'

const route = useRoute()
const router = useRouter()
const dialog = useDialog()
const message = useMessage()
const permissionStore = usePermissionStore()
const importStore = usePatternImportStore()

const loading = ref(false)
const patterns = ref<PatternListItemDto[]>([])
const total = ref(0)
const pageIndex = ref(1)
const pageSize = ref(12)
const profile = ref<UserProfileDto | UserPublicProfileDto | null>(null)
const followLoading = ref(false)
const editVisible = ref(false)
const editTitle = ref('')
const editDesc = ref('')
const editVisibility = ref<'public' | 'followers' | 'private'>('public')
const editGrid = ref<number[][]>([])
const editYear = ref(new Date().getFullYear())
const editSubmitting = ref(false)
const editingPattern = ref<PatternListItemDto | null>(null)
const detailVisible = ref(false)
const detailLoading = ref(false)
const detail = ref<PatternDetailDto | null>(null)
const comments = ref<PatternCommentDto[]>([])
const commentLoading = ref(false)
const exportDialogVisible = ref(false)
const exportTarget = ref<PatternDetailDto | null>(null)

const userId = computed(() => String(route.params.id || ''))
const isMine = computed(() => route.name === 'me' || (!!permissionStore.user?.id && permissionStore.user.id === userId.value))
const displayName = computed(() => profile.value?.nickName || profile.value?.account || '用户主页')
const isLoggedIn = computed(() => !!permissionStore.token)
const canEdit = computed(() => permissionStore.hasPermission('app:community:edit'))
const canDelete = computed(() => permissionStore.hasPermission('app:community:delete'))
const canLike = computed(() => permissionStore.hasPermission('app:community:like'))
const canFavorite = computed(() => permissionStore.hasPermission('app:community:favorite'))
const canImport = computed(() => permissionStore.hasPermission('app:community:import'))
const canManageDetail = computed(() => {
  if (!detail.value) return false
  const currentId = permissionStore.user?.id
  return !!currentId && detail.value.creatorId === currentId
})
const canExportDetail = computed(() => canManageDetail.value)
const showLike = computed(() => !isLoggedIn.value || canLike.value)
const showFavorite = computed(() => !isLoggedIn.value || canFavorite.value)
const showImport = computed(() => !isLoggedIn.value || canImport.value)
const loginHint = computed(() => (isLoggedIn.value ? '' : '请先登录'))



/**
 * @description 打开作品详情弹窗并同步列表中的最新统计数据。
 * @param {PatternListItemDto} item 图案列表项。
 */
const openDetail = async (item: PatternListItemDto) => {
  detailVisible.value = true
  detailLoading.value = true
  comments.value = []
  try {
    const res = await getPatternDetail(item.id)
    detail.value = res.data.data
    await loadComments(item.id)
    const idx = patterns.value.findIndex((p) => p.id === item.id)
    if (idx >= 0 && detail.value) {
      patterns.value[idx].viewCount = detail.value.viewCount
      patterns.value[idx].likeCount = detail.value.likeCount
      patterns.value[idx].favoriteCount = detail.value.favoriteCount
      patterns.value[idx].commentCount = detail.value.commentCount
      patterns.value[idx].isLiked = detail.value.isLiked
      patterns.value[idx].isFavorited = detail.value.isFavorited
      patterns.value[idx].visibility = detail.value.visibility
    }
  } catch (e: any) {
    message.error(e?.message || '加载详情失败')
  } finally {
    detailLoading.value = false
  }
}

const loadComments = async (patternId: string) => {
  commentLoading.value = true
  try {
    const res = await getPatternComments(patternId, { pageIndex: 1, pageSize: 20 })
    comments.value = res.data.data.items || []
  } catch {
    comments.value = []
  } finally {
    commentLoading.value = false
  }
}

/**
 * @description 打开图案编辑弹窗并回填当前图案数据。
 * @param {PatternListItemDto} item 待编辑图案。
 */
const openEditModal = (item: PatternListItemDto) => {
  editingPattern.value = item
  editTitle.value = item.title
  editDesc.value = item.description || ''
  editVisibility.value = item.visibility || 'public'
  editYear.value = item.year
  editGrid.value = buildGridFromCells(item.cells, item.gridCols, item.gridRows)
  editVisible.value = true
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

const openExportDialog = () => {
  if (!detail.value) return
  exportTarget.value = detail.value
  exportDialogVisible.value = true
}

/**
 * @description 确认并导入图案到当前贡献图编辑器。
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
        await loadPage()
      } catch (e: any) {
        message.error(e?.message || '删除失败')
      }
    },
  })
}

/**
 * @description 跳转到指定用户主页；若为当前用户则跳转到“我的主页”。
 * @param {string} [targetUserId] 目标用户 ID。
 */
const goUserHome = (targetUserId?: string) => {
  if (!targetUserId) return
  if (permissionStore.user?.id === targetUserId) {
    router.push('/me')
    return
  }
  router.push(`/users/${targetUserId}`)
}

/**
 * @description 提交图案编辑结果并同步更新本地列表数据。
 */
const saveEditPattern = async () => {
  if (!editingPattern.value) return
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
    await updatePattern(editingPattern.value.id, {
      title,
      description: editDesc.value.trim() || undefined,
      visibility: editVisibility.value,
      year: editYear.value,
      gridCols: editingPattern.value.gridCols,
      gridRows: editingPattern.value.gridRows,
      cells,
    })
    const nextDesc = editDesc.value.trim() || undefined
    editingPattern.value.title = title
    editingPattern.value.description = nextDesc
    editingPattern.value.visibility = editVisibility.value
    editingPattern.value.year = editYear.value
    editingPattern.value.cells = cells
    const idx = patterns.value.findIndex((p) => p.id === editingPattern.value?.id)
    if (idx >= 0) {
      patterns.value[idx].title = title
      patterns.value[idx].description = nextDesc
      patterns.value[idx].visibility = editVisibility.value
      patterns.value[idx].year = editYear.value
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
 * @description 加载用户主页资料与作品列表。
 */
const loadPage = async () => {
  loading.value = true
  try {
    if (isMine.value) {
      const meRes = await getMe()
      profile.value = meRes.data.data
      const patternRes = await getMyPatterns({ pageIndex: pageIndex.value, pageSize: pageSize.value })
      patterns.value = patternRes.data.data.items || []
      total.value = Number(patternRes.data.data.total || 0)
    } else {
      const [profileRes, patternRes] = await Promise.all([
        getPublicUserProfile(userId.value),
        getUserPatterns(userId.value, { pageIndex: pageIndex.value, pageSize: pageSize.value }),
      ])
      profile.value = profileRes.data.data
      patterns.value = patternRes.data.data.items || []
      total.value = Number(patternRes.data.data.total || 0)
    }
  } catch (e: any) {
    message.error(e?.message || '加载用户主页失败')
  } finally {
    loading.value = false
  }
}

/**
 * @description 切换当前主页用户的关注状态。
 */
const toggleFollow = async () => {
  if (!profile.value || isMine.value) return
  if (!permissionStore.token) {
    message.warning('请先登录后再操作')
    return
  }
  try {
    followLoading.value = true
    const publicProfile = profile.value as UserPublicProfileDto
    if (publicProfile.isFollowing) {
      await unfollowUser(publicProfile.id)
    } else {
      await followUser(publicProfile.id)
    }
    await loadPage()
  } catch (e: any) {
    message.error(e?.message || '操作失败')
  } finally {
    followLoading.value = false
  }
}

watch([() => route.fullPath, pageIndex], () => {
  void loadPage()
}, { immediate: true })
</script>

<template>
  <div class="user-profile-page">
    <n-spin :show="loading">
      <n-card v-if="profile" class="profile-card">
        <div class="profile-header">
          <div class="profile-main">
            <n-avatar size="large" round color="transparent" class="profile-avatar">
              <img :src="resolveAvatar(profile.avatar)" :alt="displayName" @error="($event.target as HTMLImageElement).src = userAvatarFallback" referrerpolicy="no-referrer" />
            </n-avatar>
            <div class="profile-meta">
              <div class="profile-name-row">
                <div class="profile-name">{{ displayName }}</div>
                <n-tag v-if="isMine" size="small" type="success">我的主页</n-tag>
              </div>
              <div class="profile-sub">@{{ profile.account }}</div>
              <div class="profile-sign">{{ profile.remark || '这个人很神秘，什么都没留下。' }}</div>
            </div>
          </div>
          <div class="profile-actions">
            <div class="follow-stats">
              <span>粉丝 {{ profile.followerCount }}</span>
              <span>关注 {{ profile.followingCount }}</span>
            </div>
            <n-button v-if="!isMine" secondary circle :loading="followLoading" @click="toggleFollow">
              <n-icon size="16">
                <Checkmark v-if="(profile as UserPublicProfileDto).isFollowing" />
                <Add v-else />
              </n-icon>
            </n-button>
          </div>
        </div>
      </n-card>

      <div class="section-title">作品</div>
      <n-empty v-if="!loading && patterns.length === 0" description="暂无作品" />
      <n-grid v-else :cols="3" :x-gap="18" :y-gap="18" responsive="screen">
        <n-grid-item v-for="item in patterns" :key="item.id">
          <PatternCard
            :item="item"
            clickable
            :show-visibility-tag="isMine"
            :show-year-tag="false"
            :show-author="false"
            :show-comment-count="true"
            :show-date="true"
            :date-text="TimeFormatter.formatDate(item.createTime)"
            @card-click="openDetail"
          >
            <template #header-extra>
              <n-tooltip v-if="isMine && canEdit" trigger="hover">
                <template #trigger>
                  <n-button size="tiny" quaternary @click.stop="openEditModal(item)">
                    <n-icon size="14">
                      <Edit />
                    </n-icon>
                  </n-button>
                </template>
                编辑/修改可见范围
              </n-tooltip>
            </template>
          </PatternCard>
        </n-grid-item>
      </n-grid>

      <div v-if="total > 0" class="pagination-bar">
        <n-pagination v-model:page="pageIndex" v-model:page-size="pageSize" :item-count="total" />
      </div>
    </n-spin>

    <PatternDetailTemplate
      v-model:show="detailVisible"
      :loading="detailLoading"
      :detail="detail"
      :show-visibility-tag="isMine"
      :is-logged-in="isLoggedIn"
      :login-hint="loginHint"
      :show-like="showLike"
      :show-favorite="showFavorite"
      :show-import="showImport"
      :show-share="canExportDetail"
      :can-manage-detail="canManageDetail"
      :can-edit="canEdit"
      :can-delete="canDelete"
      :comments="comments"
      :comment-loading="commentLoading"
      @like="detail && toggleLike(detail)"
      @favorite="detail && toggleFavorite(detail)"
      @import="detail && confirmImport(detail)"
      @share="openExportDialog"
      @edit="detail && openEditModal(detail)"
      @delete="removePattern"
      @go-user="goUserHome"
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
  </div>
</template>

<style scoped>
 .user-profile-page { padding: 24px 28px 40px; display: flex; flex-direction: column; gap: 18px; }
.profile-card { border-radius: 16px; }
.profile-header { display: flex; justify-content: space-between; gap: 16px; align-items: flex-start; }
.profile-main { display: flex; gap: 16px; align-items: center; }
.profile-avatar img { width: 100%; height: 100%; object-fit: cover; display: block; }
.profile-meta { display: flex; flex-direction: column; gap: 6px; }
.profile-name-row { display: flex; align-items: center; gap: 8px; }
.profile-name { font-size: 22px; font-weight: 700; }
.profile-sub, .profile-sign { color: var(--color-text-muted); }
.profile-actions { display: flex; align-items: center; gap: 12px; }
.follow-stats { display: flex; gap: 12px; color: var(--color-text-muted); font-size: 13px; }
.section-title { font-size: 18px; font-weight: 700; color: var(--color-text-main); }
.pagination-bar { display: flex; justify-content: center; padding-top: 8px; }
@media (max-width: 768px) { .profile-header { flex-direction: column; } }
</style>
