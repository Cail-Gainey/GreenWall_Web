<script setup lang="ts">
/**
 * @file 图案模板社区列表：浏览、导入、删除（仅作者）。
 */
import { computed, onMounted, ref } from 'vue'
import { storeToRefs } from 'pinia'
import {
  NAvatar,
  NButton,
  NEmpty,
  NGrid,
  NGridItem,
  NIcon,
  NPagination,
  NPopconfirm,
  NSelect,
  NSpace,
  NSpin,
  NTag,
  NTooltip,
  useMessage,
} from 'naive-ui'
import { Checkmark, CloudUpload, TrashCan } from '@vicons/carbon'
import { usePermissionStore } from '../stores/permission'
import { useStampStore } from '../stores/stamp'
import { TimeFormatter } from '../utils/time'
import { resolveAvatar, userAvatarFallback } from '../utils/avatar'
import type { StampDto } from '../api/types'

const message = useMessage()
const permissionStore = usePermissionStore()
const { user } = storeToRefs(permissionStore)
const { hasPermission } = permissionStore
const stampStore = useStampStore()
const { community, communityLoading, communityTotal } = storeToRefs(stampStore)

const sortBy = ref<'time' | 'imports'>('time')
const keyword = ref('')
const pageIndex = ref(1)
const pageSize = ref(12)
const sortOptions = [
  { label: '最新发布', value: 'time' },
  { label: '导入最多', value: 'imports' },
]

const isLoggedIn = computed(() => !!localStorage.getItem('token'))
const canPublish = computed(() => isLoggedIn.value && hasPermission('app:stamp:publish'))
const canImport = computed(() => isLoggedIn.value && hasPermission('app:stamp:import'))
const canDeleteOwn = computed(() => isLoggedIn.value && hasPermission('app:stamp:delete'))

const fetchStamps = async () => {
  try {
    await stampStore.loadCommunity({
      pageIndex: pageIndex.value,
      pageSize: pageSize.value,
      sortBy: sortBy.value,
      keyword: keyword.value.trim() || undefined,
    })
  } catch (e: any) {
    message.error(e?.message || '获取模板失败')
  }
}

const onPageChange = (page: number) => {
  pageIndex.value = page
  void fetchStamps()
}

const onSortChange = () => {
  pageIndex.value = 1
  void fetchStamps()
}

const handleImport = async (item: StampDto) => {
  if (!canImport.value) {
    message.warning('请先登录')
    return
  }
  try {
    await stampStore.importToCollection(item.id)
    message.success('已加入收藏')
  } catch (e: any) {
    message.error(e?.message || '导入失败')
  }
}

const handleDelete = async (item: StampDto) => {
  try {
    await stampStore.remove(item.id)
    message.success('已删除')
  } catch (e: any) {
    message.error(e?.message || '删除失败')
  }
}

const isOwner = (item: StampDto) => {
  const uid = user.value?.id
  if (!uid) return false
  return String(uid) === String(item.creatorId)
}

const emit = defineEmits<{
  (e: 'publish-request'): void
}>()

onMounted(() => {
  void fetchStamps()
})
</script>

<template>
  <div class="stamp-list">
    <div class="header">
      <div>
        <div class="title">图案模板</div>
        <div class="subtitle">用户共创的 7×5 印章，可一键加入「图案弹窗 → 收藏」</div>
      </div>
      <n-space align="center">
        <n-tooltip v-if="canPublish" trigger="hover">
          <template #trigger>
            <span class="tooltip-wrapper">
              <n-button type="primary" size="small" circle @click="emit('publish-request')">
                <n-icon size="16"><CloudUpload /></n-icon>
              </n-button>
            </span>
          </template>
          发布模板
        </n-tooltip>
        <span class="sort-label">排序：</span>
        <n-select
          v-model:value="sortBy"
          :options="sortOptions"
          size="small"
          style="width: 140px"
          @update:value="onSortChange"
        />
      </n-space>
    </div>

    <n-spin :show="communityLoading">
      <n-empty v-if="!communityLoading && community.length === 0" description="还没有人发布模板，先来一发？" />

      <n-grid v-else :x-gap="18" :y-gap="18" :cols="3" responsive="screen">
        <n-grid-item v-for="item in community" :key="item.id">
          <div class="stamp-card">
            <div class="card-head">
              <div class="card-title" :title="item.title">{{ item.title }}</div>
              <n-tag v-if="item.isImported" size="tiny" type="success" :bordered="false" round>
                已收藏
              </n-tag>
            </div>
            <div class="preview-wrap">
              <div class="preview-grid">
                <div v-for="(row, rIndex) in item.cells" :key="rIndex" class="preview-row">
                  <div
                    v-for="(cell, cIndex) in row"
                    :key="cIndex"
                    class="preview-cell"
                    :class="{ filled: cell }"
                  ></div>
                </div>
              </div>
            </div>
            <div v-if="item.description" class="card-desc" :title="item.description">
              {{ item.description }}
            </div>
            <div class="card-foot">
              <div class="author">
                <n-avatar
                  size="small"
                  :src="resolveAvatar(item.creatorAvatar)"
                  :fallback-src="userAvatarFallback"
                  :img-props="{ referrerpolicy: 'no-referrer' }"
                />
                <span class="author-name">{{ item.creatorName }}</span>
                <span class="meta">· {{ TimeFormatter.formatDate(item.createTime) }} · {{ item.importCount }} 收藏</span>
              </div>
              <n-space size="small">
                <n-popconfirm
                  v-if="canDeleteOwn && isOwner(item)"
                  positive-text="删除"
                  negative-text="取消"
                  @positive-click="handleDelete(item)"
                >
                  <template #trigger>
                    <n-button size="tiny" quaternary type="error" circle>
                      <n-icon size="14"><TrashCan /></n-icon>
                    </n-button>
                  </template>
                  确认删除「{{ item.title }}」？已导入的用户不受影响。
                </n-popconfirm>
                <n-tooltip trigger="hover">
                  <template #trigger>
                    <span class="tooltip-wrapper">
                      <n-button
                        size="tiny"
                        :type="item.isImported ? 'default' : 'primary'"
                        :disabled="!canImport || item.isImported"
                        @click="handleImport(item)"
                      >
                        <template #icon>
                          <n-icon size="14">
                            <Checkmark v-if="item.isImported" />
                            <CloudUpload v-else />
                          </n-icon>
                        </template>
                        {{ item.isImported ? '已收藏' : '导入' }}
                      </n-button>
                    </span>
                  </template>
                  {{ canImport ? (item.isImported ? '已在你的收藏中' : '导入到「图案弹窗 → 收藏」') : '请先登录' }}
                </n-tooltip>
              </n-space>
            </div>
          </div>
        </n-grid-item>
      </n-grid>

      <n-pagination
        v-if="communityTotal > pageSize"
        v-model:page="pageIndex"
        :page-size="pageSize"
        :item-count="Number(communityTotal)"
        style="margin-top: 24px; justify-content: center; display: flex;"
        @update:page="onPageChange"
      />
    </n-spin>
  </div>
</template>

<style scoped>
.stamp-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 16px;
  flex-wrap: wrap;
}

.title {
  font-size: 18px;
  font-weight: 600;
  color: var(--color-text-main);
}

.subtitle {
  font-size: 12px;
  color: var(--color-text-muted);
  margin-top: 2px;
}

.sort-label {
  font-size: 12px;
  color: var(--color-text-muted);
}

.stamp-card {
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding: 14px;
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: 12px;
  transition: border-color 0.2s ease, transform 0.2s ease;
}

.stamp-card:hover {
  border-color: var(--color-primary);
  transform: translateY(-2px);
}

.card-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}

.card-title {
  font-weight: 600;
  color: var(--color-text-main);
  font-size: 14px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  flex: 1 1 auto;
}

.preview-wrap {
  display: flex;
  justify-content: center;
  padding: 12px 0;
  background: var(--color-bg-light);
  border-radius: 8px;
}

.preview-grid {
  display: flex;
  flex-direction: column;
  gap: 3px;
}

.preview-row {
  display: flex;
  gap: 3px;
}

.preview-cell {
  width: 14px;
  height: 14px;
  border-radius: 2px;
  background: var(--color-cell-empty);
}

.preview-cell.filled {
  background: var(--color-primary);
}

.card-desc {
  font-size: 12px;
  color: var(--color-text-muted);
  line-height: 1.5;
  overflow: hidden;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  text-overflow: ellipsis;
}

.card-foot {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  flex-wrap: wrap;
}

.author {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  color: var(--color-text-muted);
  min-width: 0;
}

.author-name {
  color: var(--color-text-main);
  font-weight: 500;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  max-width: 120px;
}

.meta {
  font-size: 11px;
  white-space: nowrap;
}

.tooltip-wrapper {
  display: inline-flex;
}
</style>
