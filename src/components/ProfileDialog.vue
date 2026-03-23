<script setup lang="ts">
/**
 * @file 个人信息弹窗：展示与编辑个人资料。
 */
import { computed, onMounted, ref, watch } from 'vue'
import { NAlert, NAvatar, NButton, NCard, NForm, NFormItemGi, NGrid, NInput, NModal, NSelect, NSpace } from 'naive-ui'
import { getMe } from '../api/auth'
import { updateProfile, uploadAvatar } from '../api/user'
import { usePermissionStore } from '../stores/permission'
import { storeToRefs } from 'pinia'
import type { UserProfileDto, UserProfileUpdateDto } from '../api/types'
import { resolveAvatar, userAvatarFallback } from '../utils/avatar'
import { TimeFormatter } from '../utils/time'
import 'vue-cropper/dist/index.css'
import { VueCropper } from 'vue-cropper'

const props = defineProps<{
  show: boolean
}>()

const emit = defineEmits<{
  'update:show': [value: boolean]
}>()

const permissionStore = usePermissionStore()
const { user } = storeToRefs(permissionStore)
const { hasPermission, loadPermission } = permissionStore

const loading = ref(false)
const saving = ref(false)
const uploading = ref(false)
const showCropper = ref(false)
const cropperImg = ref('')
const cropperRef = ref<any>(null)
const pendingAvatarFile = ref<File | null>(null)
const pendingAvatarPreview = ref<string | null>(null)
const hasPendingAvatar = computed(() => !!pendingAvatarFile.value)
const message = ref('')
const isError = ref(false)

const form = ref({
  account: '',
  nickName: '',
  avatar: '',
  email: '',
  phone: '',
  sex: 0,
  remark: '',
  lastLoginTime: '',
})

const canEdit = computed(() => hasPermission('app:profile:edit'))
const canUploadAvatar = computed(() => hasPermission('app:profile:avatar'))
const canEditEmail = computed(() => canEdit.value && !form.value.email)
const avatarSrc = computed(() => {
  if (pendingAvatarPreview.value) return pendingAvatarPreview.value
  return resolveAvatar(form.value.avatar)
})

const sexOptions = [
  { label: '未知', value: 0 },
  { label: '男', value: 1 },
  { label: '女', value: 2 },
]

const cropperOptions = {
  outputSize: 1, // 裁剪生成图片的质量
  outputType: 'png', // 裁剪生成图片的格式
  info: true, // 裁剪框的大小信息
  canScale: true, // 图片是否允许滚轮缩放
  autoCrop: true, // 是否默认生成截图框
  autoCropWidth: 200, // 默认生成截图框宽度
  autoCropHeight: 200, // 默认生成截图框高度
  fixedBox: false, // 固定截图框大小 不允许改变
  fixed: true, // 是否开启截图框宽高固定比例
  fixedNumber: [1, 1], // 截图框的宽高比例
  canMove: true, // 上传图片是否可以移动
  canMoveBox: true, // 截图框能否拖动
  original: false, // 上传图片按照原始比例渲染
  centerBox: true, // 截图框是否被限制在图片里面
  infoTrue: false, // true 为展示真实输出图片宽高 false 展示看到的截图框宽高
}

function showMsg(msg: string, error = false) {
  message.value = msg
  isError.value = error
}

/**
 * @description 清空提示信息。
 */
function clearMsg() {
  message.value = ''
  isError.value = false
}

/**
 * @description 格式化时间显示。
 * @param value 原始时间字符串
 */
/**
 * @description 用用户资料填充表单。
 * @param data 用户资料
 */
function fillForm(data: UserProfileDto) {
  form.value = {
    account: data.account || '',
    nickName: data.nickName || '',
    avatar: data.avatar || '',
    email: data.email || '',
    phone: data.phone || '',
    sex: data.sex ?? 0,
    remark: data.remark || '',
    lastLoginTime: data.lastLoginTime || '',
  }
}

/**
 * @description 拉取个人资料。
 */
async function fetchProfile() {
  loading.value = true
  clearMsg()
  try {
    const res = await getMe()
    const data = res.data.data
    fillForm(data)
  } catch (e: any) {
    showMsg(e.message, true)
  } finally {
    loading.value = false
  }
}

/**
 * @description 保存个人资料（含待上传头像）。
 */
async function submit() {
  if (!canEdit.value) {
    return showMsg('无权限修改个人资料', true)
  }

  if (form.value.remark.trim().length > 30) {
    return showMsg('个性签名最多 30 个字符', true)
  }

  saving.value = true
  clearMsg()
  try {
    if (pendingAvatarFile.value) {
      const res = await uploadAvatar(pendingAvatarFile.value)
      form.value.avatar = res.data.data
      if (pendingAvatarPreview.value) {
        URL.revokeObjectURL(pendingAvatarPreview.value)
      }
      pendingAvatarPreview.value = null
      pendingAvatarFile.value = null
    }

    const payload: UserProfileUpdateDto = {
      nickName: form.value.nickName || undefined,
      email: form.value.email || undefined,
      phone: form.value.phone || undefined,
      sex: form.value.sex,
      remark: form.value.remark || undefined,
    }
    await updateProfile(payload)
    showMsg('保存成功')
    await loadPermission()
    if (user.value) {
      fillForm(user.value)
    }
  } catch (e: any) {
    showMsg(e.message, true)
  } finally {
    saving.value = false
  }
}

watch(
  () => props.show,
  (val) => {
    if (val) {
      void fetchProfile()
    } else {
      if (pendingAvatarPreview.value) {
        URL.revokeObjectURL(pendingAvatarPreview.value)
      }
      pendingAvatarPreview.value = null
      pendingAvatarFile.value = null
    }
  },
)

onMounted(() => {
  if (props.show) {
    void fetchProfile()
  }
})

const fileInputRef = ref<HTMLInputElement | null>(null)

function openFilePicker() {
  if (!canUploadAvatar.value) {
    showMsg('无权限上传头像', true)
    return
  }
  fileInputRef.value?.click()
}

/**
 * @description 选择本地文件后读取图片并进入裁剪。
 * @param event 文件输入事件
 */
async function handleFileChange(event: Event) {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]
  if (!file) return
  if (!file.type.startsWith('image/')) {
    showMsg('请选择图片文件', true)
    return
  }
  if (file.size > 2 * 1024 * 1024) {
    showMsg('图片大小不能超过 2MB', true)
    return
  }

  uploading.value = true
  clearMsg()
  
  const reader = new FileReader()
  reader.onload = (e) => {
    cropperImg.value = e.target?.result as string
    showCropper.value = true
    uploading.value = false
    input.value = ''
  }
  reader.onerror = () => {
    showMsg('读取图片失败', true)
    uploading.value = false
    input.value = ''
  }
  reader.readAsDataURL(file)
}

/**
 * @description 确认裁剪，仅本地预览，等待保存上传。
 */
function confirmCrop() {
  if (!cropperRef.value) return
  uploading.value = true
  clearMsg()

  cropperRef.value.getCropBlob(async (data: Blob) => {
    try {
      const file = new File([data], 'avatar.png', { type: 'image/png' })
      if (pendingAvatarPreview.value) {
        URL.revokeObjectURL(pendingAvatarPreview.value)
      }
      pendingAvatarPreview.value = URL.createObjectURL(data)
      pendingAvatarFile.value = file
      showMsg('头像已裁剪，点击保存后上传', false)
      showCropper.value = false
    } catch (e: any) {
      showMsg(e?.message || '头像裁剪失败', true)
    } finally {
      uploading.value = false
    }
  })
}

/**
 * @description 放弃当前头像更改。
 */
function discardPendingAvatar() {
  if (pendingAvatarPreview.value) {
    URL.revokeObjectURL(pendingAvatarPreview.value)
  }
  pendingAvatarPreview.value = null
  pendingAvatarFile.value = null
  showMsg('已放弃头像更改', false)
}
</script>

<template>
  <n-modal :show="show" preset="card" title="个人信息" style="width: min(760px, 92vw);" @update:show="emit('update:show', $event)">
    <n-space vertical size="large">
      <n-alert v-if="message" :type="isError ? 'error' : 'success'">
        {{ message }}
      </n-alert>

      <div class="profile-header">
        <div class="profile-info">
          <n-avatar size="large" style="width: 64px; height: 64px;" color="transparent">
            <img :src="avatarSrc" @error="($event.target as HTMLImageElement).src = userAvatarFallback" style="width: 100%; height: 100%; object-fit: cover; display: block;" referrerpolicy="no-referrer" />
          </n-avatar>
          <div>
            <div class="profile-name">{{ form.nickName || form.account || '未命名' }}</div>
            <div class="profile-sub">账号：{{ form.account }}</div>
          </div>
        </div>
        <div class="avatar-actions">
          <input ref="fileInputRef" type="file" accept="image/*" class="avatar-input" @change="handleFileChange" />
          <n-button
            secondary
            :loading="uploading"
            :disabled="!canUploadAvatar"
            @click="openFilePicker"
          >
            选择头像
          </n-button>
        </div>
      </div>

      <n-card size="small" :bordered="false" :loading="loading" class="form-card">
        <n-form label-placement="top" :model="form">
          <n-grid :cols="2" :x-gap="24">
            <n-form-item-gi label="昵称">
              <n-input v-model:value="form.nickName" placeholder="昵称" :disabled="!canEdit" />
            </n-form-item-gi>
            <n-form-item-gi label="邮箱">
              <n-input
                v-model:value="form.email"
                placeholder="example@mail.com"
                :disabled="!canEditEmail"
              />
            </n-form-item-gi>
            <n-form-item-gi label="手机号">
              <n-input v-model:value="form.phone" placeholder="手机号" :disabled="!canEdit" />
            </n-form-item-gi>
            <n-form-item-gi label="性别">
              <n-select v-model:value="form.sex" :options="sexOptions" :disabled="!canEdit" />
            </n-form-item-gi>
            <n-form-item-gi :span="2" label="个性签名">
              <n-input
                v-model:value="form.remark"
                type="textarea"
                rows="3"
                :disabled="!canEdit"
                placeholder="请输入个性签名，最多 30 个字符"
                :maxlength="30"
                show-count
              />
            </n-form-item-gi>
          </n-grid>
        </n-form>

        <div class="meta-block">
          <span class="meta-label">最近登录</span>
          <span class="meta-value">{{ TimeFormatter.formatDateTime(form.lastLoginTime) }}</span>
        </div>
      </n-card>

      <n-space justify="end">
        <n-button secondary @click="emit('update:show', false)">关闭</n-button>
        <n-button v-if="hasPendingAvatar" secondary @click="discardPendingAvatar">放弃头像更改</n-button>
        <n-button type="primary" :loading="saving" :disabled="!canEdit" @click="submit">
          保存
        </n-button>
      </n-space>
    </n-space>
  </n-modal>

  <!-- 头像裁剪弹窗 -->
  <n-modal v-model:show="showCropper" preset="card" title="裁剪头像" style="width: 600px;">
    <div style="width: 100%; height: 400px;">
      <vue-cropper
        ref="cropperRef"
        :img="cropperImg"
        :outputSize="cropperOptions.outputSize"
        :outputType="cropperOptions.outputType"
        :info="cropperOptions.info"
        :canScale="cropperOptions.canScale"
        :autoCrop="cropperOptions.autoCrop"
        :autoCropWidth="cropperOptions.autoCropWidth"
        :autoCropHeight="cropperOptions.autoCropHeight"
        :fixedBox="cropperOptions.fixedBox"
        :fixed="cropperOptions.fixed"
        :fixedNumber="cropperOptions.fixedNumber"
        :canMove="cropperOptions.canMove"
        :canMoveBox="cropperOptions.canMoveBox"
        :original="cropperOptions.original"
        :centerBox="cropperOptions.centerBox"
        :infoTrue="cropperOptions.infoTrue"
      />
    </div>
    <template #footer>
      <n-space justify="end">
        <n-button secondary @click="showCropper = false">取消</n-button>
        <n-button type="primary" :loading="uploading" @click="confirmCrop">确认裁剪</n-button>
      </n-space>
    </template>
  </n-modal>
</template>

<style scoped>
.profile-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 4px;
}

.profile-info {
  display: flex;
  align-items: center;
  gap: 16px;
}

.profile-name {
  font-weight: 600;
  font-size: 1.15rem;
  line-height: 1.4;
}

.profile-sub {
  font-size: 0.85rem;
  color: var(--color-text-muted);
}

.avatar-input {
  display: none;
}

.form-card {
  background: transparent;
  margin-top: 8px;
}

.meta-block {
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-radius: 6px;
  padding: 12px 16px;
  background: var(--color-bg-light);
  border: 1px solid var(--color-border);
  margin-top: 8px;
  font-size: 0.9rem;
}

.meta-label {
  color: var(--color-text-muted);
}

.meta-value {
  font-weight: 500;
}
</style>
