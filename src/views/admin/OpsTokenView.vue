<script setup lang="ts">
/**
 * @file 运维令牌管理视图。
 */
import { h, onMounted, ref } from 'vue'
import { NCard, NDataTable, NButton, NSpace, NModal, NForm, NFormItem, NInput, NSelect, NTag, NPagination, useMessage } from 'naive-ui'
import type { DataTableColumns } from 'naive-ui'
import { usePermissionStore } from '../../stores/permission'
import { getOpsTokenPage, createOpsToken, updateOpsToken, deleteOpsToken } from '../../api/opsToken'
import type { OpsTokenDto, OpsTokenCreateDto, OpsTokenUpdateDto } from '../../api/types'
import { TimeFormatter } from '../../utils/time'

const message = useMessage()
const permissionStore = usePermissionStore()
const { hasPermission } = permissionStore

const loading = ref(false)
const tokens = ref<OpsTokenDto[]>([])
const pageIndex = ref(1)
const pageSize = ref(20)
const total = ref(0)
const keyword = ref('')
const status = ref<'all' | '1' | '2'>('all')

const statusOptions = [
  { label: '全部状态', value: 'all' },
  { label: '启用', value: '1' },
  { label: '禁用', value: '2' },
]

const fetchTokens = async () => {
  loading.value = true
  try {
    const res = await getOpsTokenPage({
      pageIndex: pageIndex.value,
      pageSize: pageSize.value,
      keyword: keyword.value || undefined,
      status: status.value === 'all' ? undefined : Number(status.value),
    })
    tokens.value = res.data.data.items || []
    total.value = Number(res.data.data.total || 0)
  } finally {
    loading.value = false
  }
}

const columns = ref<DataTableColumns<OpsTokenDto>>([
  { title: '名称', key: 'tokenName' },
  {
    title: '状态',
    key: 'status',
    render: (row) => h(NTag, { size: 'small', type: row.status === 1 ? 'success' : 'error' }, { default: () => (row.status === 1 ? '启用' : '禁用') }),
  },
  { title: '最近使用人', key: 'lastUsedByName', render: (row) => row.lastUsedByName || '-' },
  { title: '最近使用时间', key: 'lastUsedTime', render: (row) => TimeFormatter.formatDateTime(row.lastUsedTime) },
  { title: '创建人', key: 'createUserName', render: (row) => row.createUserName || '-' },
  { title: '更新人', key: 'updateUserName', render: (row) => row.updateUserName || '-' },
  { title: '创建时间', key: 'createTime', render: (row) => TimeFormatter.formatDateTime(row.createTime) },
  { title: '更新时间', key: 'updateTime', render: (row) => TimeFormatter.formatDateTime(row.updateTime) },
  { title: '备注', key: 'remark' },
  {
    title: '操作',
    key: 'actions',
    render: (row) => {
      const actions: any[] = []
      if (hasPermission('sys:ops:token:edit')) {
        actions.push(h(NButton, { size: 'tiny', quaternary: true, onClick: () => openEdit(row) }, { default: () => '编辑' }))
      }
      if (hasPermission('sys:ops:token:delete')) {
        actions.push(h(NButton, { size: 'tiny', quaternary: true, type: 'error', onClick: () => handleDelete(row) }, { default: () => '删除' }))
      }
      return actions.length ? h(NSpace, { size: 'small' }, { default: () => actions }) : h('span', { class: 'muted' }, '无权限')
    },
  },
])

const showForm = ref(false)
const formMode = ref<'create' | 'edit'>('create')
const form = ref({ id: '', tokenName: '', token: '', status: 1, remark: '' })

const generateToken = () => {
  const bytes = new Uint8Array(32)
  crypto.getRandomValues(bytes)
  form.value.token = Array.from(bytes).map((b) => b.toString(16).padStart(2, '0')).join('')
}

const copyToken = async () => {
  if (!form.value.token) {
    message.error('没有可复制的令牌')
    return
  }
  try {
    await navigator.clipboard.writeText(form.value.token)
    message.success('已复制令牌')
  } catch {
    message.error('复制失败')
  }
}

const openCreate = () => {
  formMode.value = 'create'
  form.value = { id: '', tokenName: '', token: '', status: 1, remark: '' }
  showForm.value = true
}

const openEdit = (row: OpsTokenDto) => {
  formMode.value = 'edit'
  form.value = {
    id: row.id,
    tokenName: row.tokenName,
    token: '',
    status: row.status,
    remark: row.remark || '',
  }
  showForm.value = true
}

const submitForm = async () => {
  try {
    if (!form.value.tokenName.trim()) {
      message.error('请输入令牌名称')
      return
    }
    if (formMode.value === 'create') {
      if (!form.value.token.trim()) {
        message.error('请输入令牌')
        return
      }
      const payload: OpsTokenCreateDto = {
        tokenName: form.value.tokenName.trim(),
        token: form.value.token.trim(),
        status: form.value.status,
        remark: form.value.remark || undefined,
      }
      await createOpsToken(payload)
      message.success('创建成功')
    } else {
      const payload: OpsTokenUpdateDto = {
        id: form.value.id,
        tokenName: form.value.tokenName.trim(),
        token: form.value.token.trim() || undefined,
        status: form.value.status,
        remark: form.value.remark || undefined,
      }
      await updateOpsToken(payload)
      message.success('更新成功')
    }
    showForm.value = false
    await fetchTokens()
  } catch (e: any) {
    message.error(e?.message || '操作失败')
  }
}

const handleDelete = async (row: OpsTokenDto) => {
  try {
    await deleteOpsToken(row.id)
    message.success('删除成功')
    await fetchTokens()
  } catch (e: any) {
    message.error(e?.message || '删除失败')
  }
}

onMounted(fetchTokens)
</script>

<template>
  <n-card title="运维令牌" size="large">
    <n-space align="center" justify="space-between">
      <n-space>
        <n-input v-model:value="keyword" placeholder="关键字" style="width: 220px" />
        <n-select v-model:value="status" :options="statusOptions" style="width: 140px" />
      </n-space>
      <n-space>
        <n-button @click="fetchTokens" :loading="loading">查询</n-button>
        <n-button v-permission="'sys:ops:token:add'" type="primary" @click="openCreate">新增令牌</n-button>
      </n-space>
    </n-space>

    <n-space vertical size="large" style="margin-top: 12px;">
      <n-data-table :columns="columns" :data="tokens" :loading="loading" :bordered="false" />
      <n-pagination
        v-model:page="pageIndex"
        v-model:page-size="pageSize"
        :item-count="total"
        :page-sizes="[10, 20, 50]"
        show-size-picker
        @update:page="fetchTokens"
        @update:page-size="fetchTokens"
      />
    </n-space>
  </n-card>

  <n-modal v-model:show="showForm">
    <n-card style="width: min(560px, 92vw);" :title="formMode === 'create' ? '新增令牌' : '编辑令牌'">
      <n-form>
        <n-form-item label="名称">
          <n-input v-model:value="form.tokenName" />
        </n-form-item>
        <n-form-item label="令牌">
          <n-space align="center">
            <n-input
              v-model:value="form.token"
              type="password"
              placeholder="编辑时留空表示不修改"
              style="width: 280px"
            />
            <n-button size="small" secondary @click="generateToken">生成</n-button>
            <n-button size="small" secondary @click="copyToken">复制</n-button>
          </n-space>
        </n-form-item>
        <n-form-item label="状态">
          <n-select v-model:value="form.status" :options="[{ label: '启用', value: 1 }, { label: '禁用', value: 2 }]" />
        </n-form-item>
        <n-form-item label="备注">
          <n-input v-model:value="form.remark" type="textarea" rows="3" />
        </n-form-item>
      </n-form>
      <template #footer>
        <n-space justify="end">
          <n-button secondary @click="showForm = false">取消</n-button>
          <n-button type="primary" @click="submitForm">保存</n-button>
        </n-space>
      </template>
    </n-card>
  </n-modal>
</template>

<style scoped>
.muted {
  color: var(--color-text-muted);
}
</style>
