<script setup lang="ts">
/**
 * @file 我的收藏页面：支持分页浏览收藏作品、查看详情、取消收藏与导入。
 */
import { computed, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import {
  NButton,
  NEmpty,
  NGrid,
  NGridItem,
  NIcon,
  NPagination,
  NSpin,
  NTooltip,
  useDialog,
  useMessage,
} from 'naive-ui'
import { Edit, Share } from '@vicons/carbon'
import {
  deletePattern,
  favoritePattern,
  getMyFavoritePatterns,
  getPatternDetail,
  likePattern,
  unfavoritePattern,
  unlikePattern,
  updatePattern,
} from '../../api/patternCommunity'
import type { PatternDetailDto, PatternListItemDto } from '../../api/types'
import PatternCard from '../../components/PatternCard.vue'
import PatternDetailModal from '../../components/PatternDetailModal.vue'
import PatternExportDialog from '../../components/PatternExportDialog.vue'
import PatternEditorModal from '../../components/PatternEditorModal.vue'
import { usePermissionStore } from '../../stores/permission'
import { usePatternImportStore } from '../../stores/patternImport'
import { TimeFormatter } from '../../utils/time'
import { buildCellsFromGrid, buildGridFromCells } from '../../utils/patternGrid'

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
const detailVisible = ref(false)
const detailLoading = ref(false)
const detail = ref<PatternDetailDto | null>(null)
const exportDialogVisible = ref(false)
const exportTarget = ref<PatternDetailDto | null>(null)
const editVisible = ref(false)
const editTitle = ref('')
const editDesc = ref('')
const editVisibility = ref<'public' | 'followers' | 'private'>('public')
const editGrid = ref<number[][]>([])
const editYear = ref(new Date().getFullYear())
const editSubmitting = ref(false)
const editingPattern = ref<PatternListItemDto | null>(null)

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
 * @description 加载当前用户收藏的作品列表。
 */
const loadPage = async () => {
  loading.value = true
  try {
    const res = await getMyFavoritePatterns({ pageIndex: pageIndex.value, pageSize: pageSize.value })
    patterns.value = res.data.data.items || []
    total.value = Number(res.data.data.total || 0)
  } catch (e: any) {
    message.error(e?.message || '加载收藏列表失败')
  } finally {
    loading.value = false
  }
}

/**
 * @description 打开作品详情弹窗并同步当前列表项统计数据。
 * @param {PatternListItemDto} item 图案列表项。
 */
const openDetail = async (item: PatternListItemDto) => {
  detailVisible.value = true
  detailLoading.value = true
  try {
    const res = await getPatternDetail(item.id)
    detail.value = res.data.data
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
 * @description 切换图案收藏状态；取消收藏后会刷新当前列表。
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
      if (detail.value?.id === item.id) {
        detail.value.isFavorited = false
        detail.value.favoriteCount = item.favoriteCount
      }
      message.success('已取消收藏')
      if (patterns.value.length === 1 && pageIndex.value > 1) {
        pageIndex.value -= 1
      } else {
        await loadPage()
      }
      return
    }

    await favoritePattern(item.id)
    item.isFavorited = true
    item.favoriteCount += 1
    const idx = patterns.value.findIndex((p) => p.id === item.id)
    if (idx >= 0 && patterns.value[idx] !== item) {
      patterns.value[idx].isFavorited = true
      patterns.value[idx].favoriteCount = item.favoriteCount
    }
    message.success('已收藏')
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

watch(pageIndex, () => {
  void loadPage()
}, { immediate: true })
</script>

<template>
  <div class="my-favorites-page">
    <div class="page-header">
      <div>
        <div class="page-title">我的收藏</div>
        <div class="page-subtitle">集中查看已收藏的社区图案，支持继续浏览、导入与取消收藏。</div>
      </div>
    </div>

    <n-spin :show="loading">
      <n-empty v-if="!loading && patterns.length === 0" description="暂无收藏作品" />
      <n-grid v-else :cols="3" :x-gap="18" :y-gap="18" responsive="screen">
        <n-grid-item v-for="item in patterns" :key="item.id">
          <PatternCard
            :item="item"
            clickable
            :show-visibility-tag="item.creatorId === permissionStore.user?.id"
            :show-year-tag="false"
            :show-author="true"
            :show-comment-count="false"
            :show-date="true"
            :date-text="TimeFormatter.formatDate(item.createTime)"
            @card-click="openDetail"
            @user-click="goUserHome"
          >
            <template #header-extra>
              <n-tooltip v-if="item.creatorId === permissionStore.user?.id && canEdit" trigger="hover">
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

    <PatternDetailModal
      v-model:show="detailVisible"
      :loading="detailLoading"
      :detail="detail"
      :show-visibility-tag="detail?.creatorId === permissionStore.user?.id && detail?.visibility !== 'public'"
      :is-logged-in="isLoggedIn"
      :login-hint="loginHint"
      :show-like="showLike"
      :show-favorite="showFavorite"
      :show-import="showImport"
      :can-manage-detail="canManageDetail"
      :can-edit="canEdit"
      :can-delete="canDelete"
      @like="detail && toggleLike(detail)"
      @favorite="detail && toggleFavorite(detail)"
      @import="detail && confirmImport(detail)"
      @edit="detail && openEditModal(detail)"
      @delete="removePattern"
      @go-user="goUserHome"
    >
      <template v-if="canExportDetail" #actions-prefix>
        <span class="detail-extra-action">
          <n-tooltip trigger="hover">
            <template #trigger>
              <n-button size="small" secondary circle @click="openExportDialog">
                <n-icon size="16">
                  <Share />
                </n-icon>
              </n-button>
            </template>
            导出与分享
          </n-tooltip>
        </span>
      </template>
    </PatternDetailModal>

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
.my-favorites-page {
  padding: 24px 28px 40px;
  display: flex;
  flex-direction: column;
  gap: 18px;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 16px;
}

.page-title {
  font-size: 22px;
  font-weight: 700;
  color: var(--color-text-main);
}

.page-subtitle {
  font-size: 13px;
  color: var(--color-text-muted);
}

.pagination-bar {
  display: flex;
  justify-content: center;
  padding-top: 8px;
}
.detail-extra-action {
  display: inline-flex;
}
</style>
