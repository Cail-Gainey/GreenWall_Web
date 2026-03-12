<script setup lang="ts">
/**
 * @file 用户管理：Naive UI DataTable + Modal。
 */
import { computed, h, onMounted, ref } from 'vue'
import {
  NAlert,
  NButton,
  NCard,
  NCheckbox,
  NCheckboxGroup,
  NDataTable,
  NForm,
  NFormItem,
  NInput,
  NModal,
  NPagination,
  NSelect,
  NSpace,
  NTag,
  type DataTableColumns,
} from 'naive-ui'
import { createUser, deleteUser, getUserPage, updateUser } from '../../api/user'
import { getAllRoles } from '../../api/role'
import { assignUserRoles } from '../../api/permission'
import { usePermissionStore } from '../../stores/permission'
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
const keyword = ref('')
const status = ref<'all' | '1' | '2' | '3'>('all')
const loading = ref(false)

const message = ref('')
const isError = ref(false)

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

const { hasPermission } = usePermissionStore()

const totalPages = computed(() =>
  Math.max(1, Math.ceil(total.value / pageSize.value)),
)

const roleCodeToId = computed(() => {
  return new Map(roles.value.map((r) => [r.roleCode, r.id]))
})

const statusOptions = [
  { label: '全部状态', value: 'all' },
  { label: '正常', value: '1' },
  { label: '禁用', value: '2' },
  { label: '锁定', value: '3' },
]

const pageSizeOptions = [
  { label: '10 / 页', value: 10 },
  { label: '20 / 页', value: 20 },
  { label: '50 / 页', value: 50 },
]

function showMsg(msg: string, error = false) {
  message.value = msg
  isError.value = error
}

function clearMsg() {
  message.value = ''
  isError.value = false
}

function formatDate(value?: string) {
  if (!value) return '-'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return date.toLocaleString()
}

function statusLabel(s: number) {
  if (s === 1) return '正常'
  if (s === 2) return '禁用'
  return '锁定'
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
    const res = await getUserPage({
      pageIndex: pageIndex.value,
      pageSize: pageSize.value,
      keyword: keyword.value.trim() || undefined,
      status: status.value === 'all' ? undefined : Number(status.value),
    })
    const page = res.data.data
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
    const res = await getAllRoles()
    roles.value = res.data.data || []
  } catch (e: any) {
    showMsg(e.message, true)
  }
}

function resetFilters() {
  keyword.value = ''
  status.value = 'all'
  pageIndex.value = 1
  fetchUsers()
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
  if (formMode.value === 'create') {
    if (!form.value.account.trim()) {
      return showMsg('请输入账号', true)
    }
    if (form.value.password.length < 6) {
      return showMsg('密码至少 6 位', true)
    }
    const payload: UserCreateDto = {
      account: form.value.account.trim(),
      password: form.value.password,
      nickName: form.value.nickName || undefined,
      email: form.value.email || undefined,
      phone: form.value.phone || undefined,
      sex: form.value.sex,
      remark: form.value.remark || undefined,
      roleIds: form.value.roleIds,
    }
    try {
      await createUser(payload)
      showMsg('创建成功')
      showForm.value = false
      fetchUsers()
    } catch (e: any) {
      showMsg(e.message, true)
    }
    return
  }

  const updatePayload: UserUpdateDto = {
    id: form.value.id,
    nickName: form.value.nickName || undefined,
    email: form.value.email || undefined,
    phone: form.value.phone || undefined,
    sex: form.value.sex,
    status: form.value.status,
    remark: form.value.remark || undefined,
  }
  try {
    await updateUser(updatePayload)
    showMsg('更新成功')
    showForm.value = false
    fetchUsers()
  } catch (e: any) {
    showMsg(e.message, true)
  }
}

async function handleDelete(user: UserListItemDto) {
  if (!confirm(`确认删除用户 ${user.account} 吗？`)) return
  try {
    await deleteUser(user.id)
    showMsg('删除成功')
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
    showRoleDialog.value = false
    fetchUsers()
  } catch (e: any) {
    showMsg(e.message, true)
  }
}

const columns = computed<DataTableColumns<UserListItemDto>>(() => [
  {
    title: '账号',
    key: 'account',
    render: (row) =>
      h('div', {}, [
        h('div', { class: 'cell-main' }, row.account),
        h('div', { class: 'cell-sub' }, row.phone || '-'),
      ]),
  },
  {
    title: '昵称',
    key: 'nickName',
    render: (row) =>
      h('div', {}, [
        h('div', { class: 'cell-main' }, row.nickName || '-'),
        h('div', { class: 'cell-sub' }, sexLabel(row.sex)),
      ]),
  },
  {
    title: '邮箱',
    key: 'email',
    render: (row) =>
      h('div', {}, [
        h('div', { class: 'cell-main' }, row.email || '-'),
        h('div', { class: 'cell-sub' }, `最近登录：${formatDate(row.lastLoginTime)}`),
      ]),
  },
  {
    title: '角色',
    key: 'roles',
    render: (row) =>
      h(
        NSpace,
        { size: 'small' },
        {
          default: () =>
            row.roles.length === 0
              ? [h(NTag, { size: 'small', type: 'default' }, { default: () => '无' })]
              : row.roles.map((role) =>
                  h(NTag, { size: 'small', type: 'info' }, { default: () => role }),
                ),
        },
      ),
  },
  {
    title: '状态',
    key: 'status',
    render: (row) =>
      h(
        NTag,
        { size: 'small', type: statusType(row.status) as any },
        { default: () => statusLabel(row.status) },
      ),
  },
  {
    title: '创建时间',
    key: 'createTime',
    render: (row) => formatDate(row.createTime),
  },
  {
    title: '操作',
    key: 'actions',
    render: (row) => {
      const actions = []
      if (hasPermission('sys:user:edit')) {
        actions.push(
          h(
            NButton,
            { size: 'tiny', quaternary: true, onClick: () => openEdit(row) },
            { default: () => '编辑' },
          ),
        )
      }
      if (hasPermission('sys:user:assign')) {
        actions.push(
          h(
            NButton,
            { size: 'tiny', quaternary: true, onClick: () => openAssign(row) },
            { default: () => '分配角色' },
          ),
        )
      }
      if (hasPermission('sys:user:delete')) {
        actions.push(
          h(
            NButton,
            { size: 'tiny', quaternary: true, type: 'error', onClick: () => handleDelete(row) },
            { default: () => '删除' },
          ),
        )
      }
      if (actions.length === 0) {
        return h('span', { class: 'muted' }, '无权限')
      }
      return h(NSpace, { size: 'small' }, { default: () => actions })
    },
  },
])

onMounted(async () => {
  await Promise.all([fetchUsers(), fetchRoles()])
})
</script>

<template>
  <n-card title="用户管理" size="large">
    <template #header-extra>
      <n-button v-permission="'sys:user:add'" type="primary" @click="openCreate">新建用户</n-button>
    </template>

    <n-space vertical size="large">
      <n-space wrap>
        <n-input v-model:value="keyword" placeholder="搜索账号/昵称/邮箱/手机号" style="width: 260px;" />
        <n-select v-model:value="status" :options="statusOptions" style="width: 150px;" />
        <n-button @click="() => { pageIndex = 1; fetchUsers() }">搜索</n-button>
        <n-button secondary @click="resetFilters">重置</n-button>
        <n-select
          v-model:value="pageSize"
          :options="pageSizeOptions"
          style="width: 130px;"
          @update:value="() => { pageIndex = 1; fetchUsers() }"
        />
      </n-space>

      <n-alert v-if="message" :type="isError ? 'error' : 'success'">
        {{ message }}
      </n-alert>

      <n-data-table :columns="columns" :data="users" :loading="loading" :bordered="false" />

      <n-space justify="space-between" align="center">
        <span class="muted">共 {{ total }} 条</span>
        <n-pagination
          v-model:page="pageIndex"
          v-model:page-size="pageSize"
          :item-count="total"
          :page-count="totalPages"
          @update:page="fetchUsers"
          @update:page-size="fetchUsers"
        />
      </n-space>
    </n-space>
  </n-card>

  <n-modal v-model:show="showForm">
    <n-card style="width: min(720px, 92vw);" :title="formMode === 'create' ? '新建用户' : '编辑用户'">
      <n-form>
        <n-space wrap size="large">
          <n-form-item label="账号">
            <n-input v-model:value="form.account" :disabled="formMode === 'edit'" placeholder="登录账号" />
          </n-form-item>
          <n-form-item v-if="formMode === 'create'" label="密码">
            <n-input v-model:value="form.password" type="password" placeholder="至少 6 位" />
          </n-form-item>
          <n-form-item label="昵称">
            <n-input v-model:value="form.nickName" placeholder="用户昵称" />
          </n-form-item>
          <n-form-item label="邮箱">
            <n-input v-model:value="form.email" placeholder="邮箱地址" />
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
                { label: '锁定', value: 3 },
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

.cell-main {
  font-weight: 600;
}

.cell-sub {
  font-size: 0.75rem;
  color: var(--color-text-muted);
  margin-top: 2px;
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
