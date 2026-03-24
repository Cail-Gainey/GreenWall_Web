<script setup lang="ts">
import { computed } from 'vue'
import { NAvatar, NButton, NDivider, NIcon, NInput, NSpin, NTooltip } from 'naive-ui'
import { Chat, Send, Share, ThumbsUp, ThumbsUpFilled } from '@vicons/carbon'
import type { PatternCommentDto, PatternDetailDto } from '../api/types'
import { TimeFormatter } from '../utils/time'
import { resolveAvatar, userAvatarFallback } from '../utils/avatar'
import PatternDetailModal from './PatternDetailModal.vue'

interface ReplyState {
  visible: boolean
  loading: boolean
  items: PatternCommentDto[]
  pageIndex: number
  total: number
}

const props = withDefaults(defineProps<{
  show: boolean
  loading?: boolean
  detail: PatternDetailDto | null
  showVisibilityTag?: boolean
  isLoggedIn: boolean
  loginHint: string
  showLike: boolean
  showFavorite: boolean
  showImport: boolean
  canManageDetail: boolean
  canEdit: boolean
  canDelete: boolean
  showShare?: boolean
  comments?: PatternCommentDto[]
  commentLoading?: boolean
  hasMoreComments?: boolean
  canComment?: boolean
  enableCommentInput?: boolean
  enableReply?: boolean
  commentContent?: string
  commentSubmitting?: boolean
  activeReplyParentId?: string | null
  activeReplyToUserName?: string | null
  replyContent?: string
  replySubmitting?: boolean
  replyStates?: Record<string, ReplyState>
}>(), {
  loading: false,
  showVisibilityTag: true,
  showShare: false,
  comments: () => [],
  commentLoading: false,
  hasMoreComments: false,
  canComment: false,
  enableCommentInput: false,
  enableReply: false,
  commentContent: '',
  commentSubmitting: false,
  activeReplyParentId: null,
  activeReplyToUserName: null,
  replyContent: '',
  replySubmitting: false,
  replyStates: () => ({}),
})

const emit = defineEmits<{
  (e: 'update:show', value: boolean): void
  (e: 'like'): void
  (e: 'favorite'): void
  (e: 'import'): void
  (e: 'edit'): void
  (e: 'delete'): void
  (e: 'go-user', value?: string): void
  (e: 'share'): void
  (e: 'update:commentContent', value: string): void
  (e: 'submit-comment'): void
  (e: 'comment-like', value: PatternCommentDto): void
  (e: 'show-reply', parentId: string, replyToUserId?: string, replyToUserName?: string): void
  (e: 'toggle-replies', value: PatternCommentDto): void
  (e: 'update:replyContent', value: string): void
  (e: 'cancel-reply'): void
  (e: 'submit-reply', parentId: string): void
  (e: 'load-more-replies', parentId: string): void
  (e: 'load-more-comments'): void
}>()

const commentInput = computed({
  get: () => props.commentContent,
  set: (value: string) => emit('update:commentContent', value),
})

const replyInput = computed({
  get: () => props.replyContent,
  set: (value: string) => emit('update:replyContent', value),
})

const canShowCommentHint = computed(() => props.enableCommentInput)

const getReplyState = (parentId: string): ReplyState => {
  return props.replyStates[parentId] ?? {
    visible: false,
    loading: false,
    items: [],
    pageIndex: 1,
    total: 0,
  }
}

const handleCommentScroll = (event: Event) => {
  if (props.commentLoading || !props.hasMoreComments) return
  const target = event.target as HTMLElement
  if (target.scrollTop + target.clientHeight >= target.scrollHeight - 80) {
    emit('load-more-comments')
  }
}
</script>

<template>
  <PatternDetailModal
    :show="show"
    :loading="loading"
    :detail="detail"
    :show-visibility-tag="showVisibilityTag"
    :is-logged-in="isLoggedIn"
    :login-hint="loginHint"
    :show-like="showLike"
    :show-favorite="showFavorite"
    :show-import="showImport"
    :can-manage-detail="canManageDetail"
    :can-edit="canEdit"
    :can-delete="canDelete"
    @update:show="emit('update:show', $event)"
    @like="emit('like')"
    @favorite="emit('favorite')"
    @import="emit('import')"
    @edit="emit('edit')"
    @delete="emit('delete')"
    @go-user="emit('go-user', $event)"
  >
    <template #actions-prefix>
      <span v-if="showShare" class="detail-extra-action">
        <n-tooltip trigger="hover">
          <template #trigger>
            <n-button size="small" secondary circle :disabled="!isLoggedIn" @click="emit('share')">
              <n-icon size="16">
                <Share />
              </n-icon>
            </n-button>
          </template>
          {{ loginHint || '导出与分享' }}
        </n-tooltip>
      </span>
      <slot name="actions-prefix-extra" />
    </template>

    <template #extra>
      <n-divider />
      <div class="comment-section">
        <div class="comment-header">
          <n-icon size="16">
            <Chat />
          </n-icon>
          评论 {{ detail?.commentCount || 0 }}
        </div>

        <div v-if="enableCommentInput" class="comment-input">
          <n-input
            v-model:value="commentInput"
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
                  @click="emit('submit-comment')"
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

        <div v-if="canShowCommentHint && !isLoggedIn" class="comment-hint">请先登录后发表评论</div>
        <div v-else-if="canShowCommentHint && !canComment" class="comment-hint">当前账号无评论权限</div>

        <n-spin :show="commentLoading">
          <div v-if="comments.length === 0 && !commentLoading" class="comment-empty">暂无评论</div>
          <div v-else class="comment-list-wrap" @scroll="handleCommentScroll">
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
                  <div v-if="enableReply" class="comment-actions">
                    <n-button
                      quaternary
                      size="tiny"
                      :type="item.isLiked ? 'primary' : 'default'"
                      :disabled="!isLoggedIn || !canComment"
                      @click="emit('comment-like', item)"
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
                      @click="emit('show-reply', item.id, item.userId, item.userName)"
                    >
                      回复
                    </n-button>
                    <n-button
                      v-if="item.replyCount > 0"
                      text
                      size="tiny"
                      @click="emit('toggle-replies', item)"
                    >
                      {{ getReplyState(item.id).visible ? '收起回复' : `查看 ${item.replyCount} 条回复` }}
                    </n-button>
                  </div>

                  <div v-if="enableReply && activeReplyParentId === item.id" class="reply-input">
                    <n-input
                      v-model:value="replyInput"
                      type="textarea"
                      :autosize="{ minRows: 2, maxRows: 3 }"
                      :placeholder="activeReplyToUserName ? `回复 @${activeReplyToUserName}` : '写下你的回复...'"
                      :disabled="replySubmitting"
                    />
                    <div class="reply-actions">
                      <n-button size="tiny" @click="emit('cancel-reply')">取消</n-button>
                      <n-button
                        type="primary"
                        size="tiny"
                        :loading="replySubmitting"
                        :disabled="replySubmitting"
                        @click="emit('submit-reply', item.id)"
                      >
                        发送
                      </n-button>
                    </div>
                  </div>

                  <div v-if="enableReply && getReplyState(item.id).visible" class="reply-list">
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
                              <span v-if="reply.replyToUserName" class="reply-to">回复 @{{ reply.replyToUserName }}：</span>
                              {{ reply.content }}
                            </div>
                            <div class="comment-actions">
                              <n-button
                                quaternary
                                size="tiny"
                                :type="reply.isLiked ? 'primary' : 'default'"
                                :disabled="!isLoggedIn || !canComment"
                                @click="emit('comment-like', reply)"
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
                                @click="emit('show-reply', item.id, reply.userId, reply.userName)"
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
                          @click="emit('load-more-replies', item.id)"
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
    </template>
  </PatternDetailModal>
</template>

<style scoped>
.tooltip-wrapper {
  display: inline-flex;
}

.detail-extra-action {
  display: inline-flex;
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

.comment-hint,
.comment-empty,
.reply-empty,
.comment-load,
.reply-load {
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

.comment-body,
.reply-body {
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

.reply-to {
  color: var(--color-text-muted);
  margin-right: 4px;
}

.reply-load,
.comment-load {
  text-align: center;
  padding: 6px 0 2px;
}

.reply-more {
  color: var(--color-primary);
  cursor: pointer;
}

.user-avatar img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}
</style>
