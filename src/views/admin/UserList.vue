<script setup lang="ts">
/**
 * @file 用户管理：Naive UI DataTable + Modal。
 */
import { computed, h, onMounted, ref } from 'vue'
import {
  NAvatar,
  NButton,
  NCard,
  NCheckbox,
  NCheckboxGroup,
  NDataTable,
  NDropdown,
  NForm,
  NFormItem,
  NInput,
  NIcon,
  NModal,
  NPagination,
  NPopover,
  NSelect,
  NSpace,
  NTag,
  NTooltip,
  useDialog,
  useMessage,
  type DataTableColumns,
} from 'naive-ui'
import { Column, FitToScreen, List, Pen, Renew, TrashCan, UserRole, ChevronDown, ChevronUp } from '@vicons/carbon'
import { createUser, deleteUser, updateUser } from '../../api/user'
import { useRoleListStore } from '../../stores/roleList'
import { assignUserRoles } from '../../api/permission'
import { useUserListStore } from '../../stores/userList'
import { usePermissionStore } from '../../stores/permission'
import { resolveAvatar, userAvatarFallback } from '../../utils/avatar'
import { TimeFormatter } from '../../utils/time'
import {
  isValidAccount,
  isValidEmail,
  isValidPassword,
  isValidPhone,
} from '../../utils/validators'
import type {
  RoleDto,
  UserCreateDto,
  UserListItemDto,
  UserUpdateDto,
} from '../../api/types'

const users = ref<UserListItemDto[]>([])
const total = ref(0)
const pageIndex = ref(1)
const pageSize = ref(10)
const account = ref('')
const phone = ref('')
const email = ref('')
const status = ref<'all' | '1' | '2' | '3'>('all')
const loading = ref(false)

const showAdvanced = ref(false)
const tableDensity = ref<'compact' | 'default' | 'comfortable'>('default')
const visibleColumns = ref<
  Array<'avatar' | 'account' | 'nickName' | 'email' | 'sex' | 'phone' | 'status' | 'createTime' | 'actions'>
>([
  'avatar',
  'account',
  'nickName',
  'email',
  'sex',
  'phone',
  'status',
  'createTime',
  'actions',
])
const isFullscreen = ref(false)
const checkedRowKeys = ref<Array<string | number>>([])

const roles = ref<RoleDto[]>([])

const showForm = ref(false)
const showRoleDialog = ref(false)
const formMode = ref<'create' | 'edit'>('create')

const form = ref({
  id: '',
  account: '',
  password: '',
  nickName: '',
  email: '',
  phone: '',
  sex: 0,
  status: 1,
  remark: '',
  roleIds: [] as string[],
})

const assignUser = ref<UserListItemDto | null>(null)
const assignRoleIds = ref<string[]>([])

const permissionStore = usePermissionStore()
const { hasPermission, loadPermission } = permissionStore
const userListStore = useUserListStore()
const roleListStore = useRoleListStore()
const dialog = useDialog()
const messageApi = useMessage()

const roleCodeToId = computed(() => {
  return new Map(roles.value.map((r) => [r.roleCode, r.id]))
})

const statusOptions = [
  { label: '全部状态', value: 'all' },
  { label: '正常', value: '1' },
  { label: '禁用', value: '2' },
  { label: '异常', value: '3' },
]

const canEditEmail = computed(() => hasPermission('sys:user:edit:email'))

const pageSizeOptions = [
  { label: '10 / 页', value: 10 },
  { label: '20 / 页', value: 20 },
  { label: '50 / 页', value: 50 },
]

const densityOptions = [
  { label: '紧凑', key: 'compact' },
  { label: '默认', key: 'default' },
  { label: '宽松', key: 'comfortable' },
]

const columnOptions = [
  { label: '头像', value: 'avatar' },
  { label: '用户名', value: 'account' },
  { label: '昵称', value: 'nickName' },
  { label: '邮箱', value: 'email' },
  { label: '性别', value: 'sex' },
  { label: '手机号', value: 'phone' },
  { label: '状态', value: 'status' },
  { label: '创建日期', value: 'createTime' },
  { label: '操作', value: 'actions' },
]

function showMsg(msg: string, error = false) {
  if (!msg) return
  if (error) messageApi.error(msg)
  else messageApi.success(msg)
}

function clearMsg() {
  // no-op for toast messages
}

function statusLabel(s: number) {
  if (s === 1) return '正常'
  if (s === 2) return '禁用'
  return '异常'
}

function statusType(s: number) {
  if (s === 1) return 'success'
  if (s === 2) return 'error'
  return 'warning'
}

function sexLabel(s: number) {
  if (s === 1) return '男'
  if (s === 2) return '女'
  return '未知'
}

async function fetchUsers() {
  loading.value = true
  clearMsg()
  try {
    const page = await userListStore.fetch({
      pageIndex: pageIndex.value,
      pageSize: pageSize.value,
      account: account.value.trim() || undefined,
      phone: phone.value.trim() || undefined,
      email: email.value.trim() || undefined,
      status: status.value === 'all' ? undefined : Number(status.value),
    })
    users.value = page.items || []
    total.value = Number(page.total || 0)
  } catch (e: any) {
    showMsg(e.message, true)
  } finally {
    loading.value = false
  }
}

async function refreshUsers() {
  loading.value = true
  clearMsg()
  try {
    const page = await userListStore.fetch(
      {
        pageIndex: pageIndex.value,
        pageSize: pageSize.value,
        account: account.value.trim() || undefined,
        phone: phone.value.trim() || undefined,
        email: email.value.trim() || undefined,
        status: status.value === 'all' ? undefined : Number(status.value),
      },
      true,
    )
    users.value = page.items || []
    total.value = Number(page.total || 0)
  } catch (e: any) {
    showMsg(e.message, true)
  } finally {
    loading.value = false
  }
}

async function fetchRoles() {
  try {
    roles.value = await roleListStore.fetch()
  } catch (e: any) {
    showMsg(e.message, true)
  }
}

function resetFilters() {
  account.value = ''
  phone.value = ''
  email.value = ''
  status.value = 'all'
  pageIndex.value = 1
  fetchUsers()
}

function handleSearch() {
  pageIndex.value = 1
  fetchUsers()
}

function toggleAdvanced() {
  showAdvanced.value = !showAdvanced.value
}

function toggleFullscreen() {
  isFullscreen.value = !isFullscreen.value
}

function confirmAction(message: string) {
  return new Promise<boolean>((resolve) => {
    dialog.warning({
      title: '确认操作',
      content: message,
      positiveText: '确认',
      negativeText: '取消',
      onPositiveClick: () => resolve(true),
      onNegativeClick: () => resolve(false),
      onClose: () => resolve(false),
    })
  })
}

function handleDensitySelect(key: string | number) {
  if (key === 'compact' || key === 'default' || key === 'comfortable') {
    tableDensity.value = key
  }
}

function isVisibleColumn(
  key: 'avatar' | 'account' | 'nickName' | 'email' | 'sex' | 'phone' | 'status' | 'createTime' | 'actions',
) {
  return visibleColumns.value.includes(key)
}

function openCreate() {
  formMode.value = 'create'
  form.value = {
    id: '',
    account: '',
    password: '',
    nickName: '',
    email: '',
    phone: '',
    sex: 0,
    status: 1,
    remark: '',
    roleIds: [],
  }
  showForm.value = true
}

function openEdit(user: UserListItemDto) {
  formMode.value = 'edit'
  form.value = {
    id: user.id,
    account: user.account,
    password: '',
    nickName: user.nickName || '',
    email: user.email || '',
    phone: user.phone || '',
    sex: user.sex,
    status: user.status,
    remark: user.remark || '',
    roleIds: [],
  }
  showForm.value = true
}

async function submitForm() {
  clearMsg()
  const accountValue = form.value.account.trim()
  const emailValue = form.value.email.trim()
  const phoneValue = form.value.phone.trim()

  if (formMode.value === 'create') {
    if (!isValidAccount(accountValue)) {
      return showMsg('账号为 3-50 位且不能包含空格', true)
    }
    if (!isValidPassword(form.value.password)) {
      return showMsg('密码为 6-100 位且不能包含空格', true)
    }
    if (emailValue && !isValidEmail(emailValue)) {
      return showMsg('邮箱格式不正确', true)
    }
    if (phoneValue && !isValidPhone(phoneValue)) {
      return showMsg('手机号格式不正确', true)
    }
    const payload: UserCreateDto = {
      account: accountValue,
      password: form.value.password,
      nickName: form.value.nickName || undefined,
      email: emailValue || undefined,
      phone: phoneValue || undefined,
      sex: form.value.sex,
      remark: form.value.remark || undefined,
      roleIds: form.value.roleIds,
    }
    try {
      await createUser(payload)
      showMsg('创建成功')
      await loadPermission()
      await userListStore.fetch(
        {
          pageIndex: pageIndex.value,
          pageSize: pageSize.value,
          account: account.value.trim() || undefined,
          phone: phone.value.trim() || undefined,
          email: email.value.trim() || undefined,
          status: status.value === 'all' ? undefined : Number(status.value),
        },
        true,
      )
      showForm.value = false
      fetchUsers()
    } catch (e: any) {
      showMsg(e.message, true)
    }
    return
  }

  if (!isValidAccount(accountValue)) {
    return showMsg('账号为 3-50 位且不能包含空格', true)
  }
  if (canEditEmail.value && emailValue && !isValidEmail(emailValue)) {
    return showMsg('邮箱格式不正确', true)
  }
  if (phoneValue && !isValidPhone(phoneValue)) {
    return showMsg('手机号格式不正确', true)
  }
  const updatePayload: UserUpdateDto = {
    id: form.value.id,
    account: accountValue,
    nickName: form.value.nickName || undefined,
    email: canEditEmail.value ? emailValue || undefined : undefined,
    phone: phoneValue || undefined,
    sex: form.value.sex,
    status: form.value.status,
    remark: form.value.remark || undefined,
  }
  try {
    await updateUser(updatePayload)
    showMsg('更新成功')
    await loadPermission()
    await userListStore.fetch(
      {
        pageIndex: pageIndex.value,
        pageSize: pageSize.value,
        account: account.value.trim() || undefined,
        phone: phone.value.trim() || undefined,
        email: email.value.trim() || undefined,
        status: status.value === 'all' ? undefined : Number(status.value),
      },
      true,
    )
    showForm.value = false
    fetchUsers()
  } catch (e: any) {
    showMsg(e.message, true)
  }
}

async function handleDelete(user: UserListItemDto) {
  const ok = await confirmAction(`确认删除用户 ${user.account} 吗？`)
  if (!ok) return
  try {
    await deleteUser(user.id)
    showMsg('删除成功')
    await loadPermission()
    await userListStore.fetch(
      {
        pageIndex: pageIndex.value,
        pageSize: pageSize.value,
        account: account.value.trim() || undefined,
        phone: phone.value.trim() || undefined,
        email: email.value.trim() || undefined,
        status: status.value === 'all' ? undefined : Number(status.value),
      },
      true,
    )
    if (users.value.length === 1 && pageIndex.value > 1) {
      pageIndex.value--
    }
    fetchUsers()
  } catch (e: any) {
    showMsg(e.message, true)
  }
}

function openAssign(user: UserListItemDto) {
  assignUser.value = user
  const map = roleCodeToId.value
  assignRoleIds.value = user.roles
    .map((code) => map.get(code))
    .filter((id): id is string => typeof id === 'string')
  showRoleDialog.value = true
}

async function submitAssign() {
  if (!assignUser.value) return
  try {
    await assignUserRoles({
      userId: assignUser.value.id,
      roleIds: assignRoleIds.value,
    })
    showMsg('角色分配成功')
    await loadPermission()
    await userListStore.fetch(
      {
        pageIndex: pageIndex.value,
        pageSize: pageSize.value,
        account: account.value.trim() || undefined,
        phone: phone.value.trim() || undefined,
        email: email.value.trim() || undefined,
        status: status.value === 'all' ? undefined : Number(status.value),
      },
      true,
    )
    showRoleDialog.value = false
    fetchUsers()
  } catch (e: any) {
    showMsg(e.message, true)
  }
}

const columns = computed<DataTableColumns<UserListItemDto>>(() => {
  const cols: DataTableColumns<UserListItemDto> = [
    { type: 'selection' },
  ]

  if (isVisibleColumn('avatar')) {
    cols.push({
      title: '头像',
      key: 'avatar',
      width: 80,
      render: (row) =>
        h(
          NAvatar,
          {
            round: true,
            size: 40,
            color: 'transparent',
          },
          {
            default: () =>
              h('img', {
                src: resolveAvatar(row.avatar),
                alt: row.nickName || row.account,
                referrerpolicy: 'no-referrer',
                onError: (event: Event) => {
                  ;(event.target as HTMLImageElement).src = userAvatarFallback
                },
                style: 'width: 100%; height: 100%; object-fit: cover; display: block;',
              }),
          },
        ),
    })
  }

  if (isVisibleColumn('account')) {
    cols.push({
      title: '用户名',
      key: 'account',
      render: (row) => row.account,
    })
  }

  if (isVisibleColumn('nickName')) {
    cols.push({
      title: '昵称',
      key: 'nickName',
      render: (row) => row.nickName || '-',
    })
  }

  if (isVisibleColumn('email')) {
    cols.push({
      title: '邮箱',
      key: 'email',
      render: (row) => row.email || '-',
    })
  }

  if (isVisibleColumn('sex')) {
    cols.push({
      title: '性别',
      key: 'sex',
      render: (row) => sexLabel(row.sex),
      width: 90,
    })
  }

  if (isVisibleColumn('phone')) {
    cols.push({
      title: '手机号',
      key: 'phone',
      render: (row) => row.phone || '-',
    })
  }

  if (isVisibleColumn('status')) {
    cols.push({
      title: '状态',
      key: 'status',
      render: (row) =>
        h(
          NTag,
          { size: 'small', type: statusType(row.status) as any },
          { default: () => statusLabel(row.status) },
        ),
      width: 110,
    })
  }

  if (isVisibleColumn('createTime')) {
    cols.push({
      title: '创建日期',
      key: 'createTime',
      render: (row: UserListItemDto) => TimeFormatter.formatDateTime(row.createTime),
    })
  }

  if (isVisibleColumn('actions')) {
    cols.push({
      title: '操作',
      key: 'actions',
      render: (row) => {
        const actions: any[] = []
        if (hasPermission('sys:user:edit')) {
          actions.push(
            h(NTooltip, null, {
              default: () => '编辑',
              trigger: () =>
                h(
                  NButton,
                  { size: 'small', quaternary: true, type: 'primary', class: 'action-btn', onClick: () => openEdit(row) },
                  {
                    icon: () =>
                      h(NIcon, null, {
                        default: () => h(Pen),
                      }),
                  },
                ),
            }),
          )
        }
        if (hasPermission('sys:user:assign')) {
          actions.push(
            h(NTooltip, null, {
              default: () => '分配角色',
              trigger: () =>
                h(
                  NButton,
                  { size: 'small', quaternary: true, type: 'primary', class: 'action-btn', onClick: () => openAssign(row) },
                  {
                    icon: () =>
                      h(NIcon, null, {
                        default: () => h(UserRole),
                      }),
                  },
                ),
            }),
          )
        }
        if (hasPermission('sys:user:delete')) {
          actions.push(
            h(NTooltip, null, {
              default: () => '删除',
              trigger: () =>
                h(
                  NButton,
                  { size: 'small', quaternary: true, type: 'error', class: 'action-btn', onClick: () => handleDelete(row) },
                  {
                    icon: () =>
                      h(NIcon, null, {
                        default: () => h(TrashCan),
                      }),
                  },
                ),
            }),
          )
        }
        if (actions.length === 0) {
          return h('span', { class: 'muted' }, '无权限')
        }
        return h(NSpace, { size: 'small' }, { default: () => actions })
      },
    })
  }

  return cols
})

onMounted(async () => {
  await Promise.all([fetchUsers(), fetchRoles()])
})
</script>

<template>
  <n-card title="用户管理" size="large" :class="['user-card', { fullscreen: isFullscreen }]">
    <div class="filter-panel">
      <n-form inline :show-feedback="false" class="filter-form">
        <n-form-item label="用户名">
          <n-input v-model:value="account" placeholder="请输入用户名" clearable style="width: 200px;" />
        </n-form-item>
        <n-form-item label="手机号">
          <n-input v-model:value="phone" placeholder="请输入手机号" clearable style="width: 200px;" />
        </n-form-item>
        <n-form-item label="邮箱">
          <n-input v-model:value="email" placeholder="请输入邮箱" clearable style="width: 220px;" />
        </n-form-item>
        <div class="filter-actions">
          <n-button secondary @click="resetFilters">重置</n-button>
          <n-button type="primary" @click="handleSearch">查询</n-button>
          <n-button text class="expand-btn" @click="toggleAdvanced">
            <template #icon>
              <n-icon>
                <component :is="showAdvanced ? ChevronUp : ChevronDown" />
              </n-icon>
            </template>
            {{ showAdvanced ? '收起' : '展开' }}
          </n-button>
        </div>
      </n-form>
      <div v-if="showAdvanced" class="filter-advanced">
        <n-form inline :show-feedback="false">
          <n-form-item label="状态">
            <n-select v-model:value="status" :options="statusOptions" style="width: 160px;" />
          </n-form-item>
          <n-form-item label="每页">
            <n-select
              v-model:value="pageSize"
              :options="pageSizeOptions"
              style="width: 130px;"
              @update:value="() => { pageIndex = 1; fetchUsers() }"
            />
          </n-form-item>
        </n-form>
      </div>
    </div>

    <div class="table-panel">
      <div class="table-toolbar">
        <n-button v-permission="'sys:user:add'" type="primary" @click="openCreate">新增用户</n-button>
        <div class="table-tools">
          <n-tooltip>
            <template #trigger>
              <n-button quaternary size="small" @click="refreshUsers">
                <template #icon>
                  <n-icon><Renew /></n-icon>
                </template>
              </n-button>
            </template>
            刷新
          </n-tooltip>
          <n-dropdown trigger="click" :options="densityOptions" @select="handleDensitySelect">
            <n-tooltip>
              <template #trigger>
                <n-button quaternary size="small">
                  <template #icon>
                    <n-icon><List /></n-icon>
                  </template>
                </n-button>
              </template>
              密度
            </n-tooltip>
          </n-dropdown>
          <n-popover trigger="click" placement="bottom-end">
            <template #trigger>
              <n-tooltip>
                <template #trigger>
                  <n-button quaternary size="small">
                    <template #icon>
                      <n-icon><Column /></n-icon>
                    </template>
                  </n-button>
                </template>
                列设置
              </n-tooltip>
            </template>
            <div class="column-popover">
              <div class="column-title">显示列</div>
              <n-checkbox-group v-model:value="visibleColumns">
                <n-space vertical size="small">
                  <n-checkbox v-for="option in columnOptions" :key="option.value" :value="option.value">
                    {{ option.label }}
                  </n-checkbox>
                </n-space>
              </n-checkbox-group>
            </div>
          </n-popover>
          <n-tooltip>
            <template #trigger>
              <n-button quaternary size="small" @click="toggleFullscreen">
                <template #icon>
                  <n-icon><FitToScreen /></n-icon>
                </template>
              </n-button>
            </template>
            全屏
          </n-tooltip>
        </div>
      </div>

      <n-data-table
        v-model:checked-row-keys="checkedRowKeys"
        :columns="columns"
        :data="users"
        :loading="loading"
        :bordered="false"
        :row-key="(row) => row.id"
        :class="['user-table', `density-${tableDensity}`]"
      />

      <div class="table-footer">
        <span class="muted">共 {{ total }} 条</span>
        <n-pagination
          v-model:page="pageIndex"
          v-model:page-size="pageSize"
          :item-count="total"
          :page-sizes="[10, 20, 50]"
          show-size-picker
          show-quick-jumper
          @update:page="fetchUsers"
          @update:page-size="fetchUsers"
        />
      </div>
    </div>
  </n-card>

  <n-modal v-model:show="showForm">
    <n-card style="width: min(720px, 92vw);" :title="formMode === 'create' ? '新建用户' : '编辑用户'">
      <n-form>
        <n-space wrap size="large">
          <n-form-item label="账号">
            <n-input v-model:value="form.account" placeholder="登录账号" />
          </n-form-item>
          <n-form-item v-if="formMode === 'create'" label="密码">
            <n-input v-model:value="form.password" type="password" placeholder="至少 6 位" />
          </n-form-item>
          <n-form-item label="昵称">
            <n-input v-model:value="form.nickName" placeholder="用户昵称" />
          </n-form-item>
          <n-form-item label="邮箱">
            <n-input
              v-model:value="form.email"
              placeholder="邮箱地址"
              :disabled="formMode === 'edit' && !canEditEmail"
            />
          </n-form-item>
          <n-form-item label="手机号">
            <n-input v-model:value="form.phone" placeholder="手机号" />
          </n-form-item>
          <n-form-item label="性别">
            <n-select
              v-model:value="form.sex"
              :options="[
                { label: '未知', value: 0 },
                { label: '男', value: 1 },
                { label: '女', value: 2 },
              ]"
              style="width: 160px;"
            />
          </n-form-item>
          <n-form-item label="状态">
            <n-select
              v-model:value="form.status"
              :options="[
                { label: '正常', value: 1 },
                { label: '禁用', value: 2 },
                { label: '异常', value: 3 },
              ]"
              style="width: 160px;"
            />
          </n-form-item>
          <n-form-item label="备注" style="flex: 1 1 100%;">
            <n-input v-model:value="form.remark" type="textarea" rows="3" />
          </n-form-item>
        </n-space>

        <div v-if="formMode === 'create' && hasPermission('sys:user:assign')" class="role-area">
          <div class="role-title">分配角色</div>
          <n-checkbox-group v-model:value="form.roleIds">
            <n-space wrap>
              <n-checkbox v-for="role in roles" :key="role.id" :value="role.id">
                {{ role.roleName }} ({{ role.roleCode }})
              </n-checkbox>
            </n-space>
          </n-checkbox-group>
        </div>
      </n-form>

      <template #footer>
        <n-space justify="end">
          <n-button secondary @click="showForm = false">取消</n-button>
          <n-button type="primary" @click="submitForm">保存</n-button>
        </n-space>
      </template>
    </n-card>
  </n-modal>

  <n-modal v-model:show="showRoleDialog">
    <n-card style="width: min(600px, 90vw);" title="分配角色">
      <div class="role-title">{{ assignUser?.account }} 的角色</div>
      <n-checkbox-group v-model:value="assignRoleIds">
        <n-space wrap>
          <n-checkbox v-for="role in roles" :key="role.id" :value="role.id">
            {{ role.roleName }} ({{ role.roleCode }})
          </n-checkbox>
        </n-space>
      </n-checkbox-group>

      <template #footer>
        <n-space justify="end">
          <n-button secondary @click="showRoleDialog = false">取消</n-button>
          <n-button type="primary" @click="submitAssign">保存</n-button>
        </n-space>
      </template>
    </n-card>
  </n-modal>
</template>

<style scoped>
.muted {
  color: var(--color-text-muted);
}

.user-card.fullscreen {
  position: fixed;
  inset: 16px;
  z-index: 1000;
  margin: 0;
}

.user-card.fullscreen :deep(.n-card__content) {
  max-height: calc(100vh - 140px);
  overflow: auto;
}

.filter-panel {
  padding: 16px 18px;
  border: 1px solid var(--color-border);
  border-radius: 12px;
  background: var(--color-bg-light);
}

.filter-form {
  display: flex;
  flex-wrap: wrap;
  gap: 12px 16px;
  align-items: center;
}

.filter-actions {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  margin-left: auto;
}

.filter-advanced {
  margin-top: 12px;
  padding-top: 12px;
  border-top: 1px dashed var(--color-border);
}

.expand-btn {
  padding-left: 4px;
}

.table-panel {
  margin-top: 18px;
}

.table-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 12px;
}

.table-tools {
  display: inline-flex;
  align-items: center;
  gap: 6px;
}

.table-alert {
  margin-bottom: 12px;
}

.table-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 12px;
}

.column-popover {
  min-width: 160px;
}

.column-title {
  font-weight: 600;
  margin-bottom: 8px;
}

.action-btn {
  padding: 4px;
}

.action-btn :deep(.n-button__icon) {
  font-size: 18px;
}

.user-cell {
  display: flex;
  align-items: flex-start;
  gap: 14px;
}

.user-meta {
  display: flex;
  flex-direction: column;
  gap: 4px;
  line-height: 1.2;
}

.cell-main {
  font-weight: 600;
}

.cell-sub {
  font-size: 0.75rem;
  color: var(--color-text-muted);
  margin-top: 0;
}

.cell-sub.weak {
  opacity: 0.85;
}

.user-table.density-compact :deep(.n-data-table-th),
.user-table.density-compact :deep(.n-data-table-td) {
  padding-top: 6px;
  padding-bottom: 6px;
}

.user-table.density-default :deep(.n-data-table-th),
.user-table.density-default :deep(.n-data-table-td) {
  padding-top: 12px;
  padding-bottom: 12px;
}

.user-table.density-comfortable :deep(.n-data-table-th),
.user-table.density-comfortable :deep(.n-data-table-td) {
  padding-top: 18px;
  padding-bottom: 18px;
}

.user-table :deep(.n-data-table-th) {
  color: var(--color-text-main);
  font-weight: 600;
}

.user-table :deep(.n-data-table-td) {
  color: var(--color-text-main);
  border-bottom: 1px solid var(--color-border);
}

.role-area {
  margin-top: 12px;
  padding: 12px;
  border: 1px solid var(--color-border);
  border-radius: 8px;
  background: var(--color-bg-light);
}

.role-title {
  font-weight: 600;
  margin-bottom: 8px;
}
</style>
