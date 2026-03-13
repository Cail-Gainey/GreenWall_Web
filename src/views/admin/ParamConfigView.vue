<script setup lang="ts">
/**
 * @file 参数配置视图。
 */
import { h, onMounted, ref } from 'vue'
import { NCard, NDataTable, NButton, NSpace, NModal, NForm, NFormItem, NInput, NSelect, NTag, NPagination, useMessage } from 'naive-ui'
import type { DataTableColumns } from 'naive-ui'
import { usePermissionStore } from '../../stores/permission'
import { getConfigPage, createConfig, updateConfig, deleteConfig } from '../../api/config'
import type { ConfigDto } from '../../api/types'

const message = useMessage()
const permissionStore = usePermissionStore()
const { hasPermission } = permissionStore

const loading = ref(false)
const configs = ref<ConfigDto[]>([])
const pageIndex = ref(1)
const pageSize = ref(20)
const total = ref(0)
const keyword = ref('')

const statusOptions = [
  { label: '启用', value: 1 },
  { label: '禁用', value: 2 },
]

const fetchConfigs = async () => {
  loading.value = true
  try {
    const res = await getConfigPage({
      pageIndex: pageIndex.value,
      pageSize: pageSize.value,
      keyword: keyword.value || undefined,
    })
    configs.value = res.data.data.items || []
    total.value = Number(res.data.data.total || 0)
  } finally {
    loading.value = false
  }
}

const columns = ref<DataTableColumns<ConfigDto>>([
  { title: '键', key: 'configKey' },
  { title: '值', key: 'configValue' },
  {
    title: '状态',
    key: 'status',
    render: (row) => h(NTag, { size: 'small', type: row.status === 1 ? 'success' : 'error' }, { default: () => (row.status === 1 ? '启用' : '禁用') }),
  },
  { title: '备注', key: 'remark' },
  {
    title: '操作',
    key: 'actions',
    render: (row) => {
      const actions: any[] = []
      if (hasPermission('sys:param:edit')) {
        actions.push(h(NButton, { size: 'tiny', quaternary: true, onClick: () => openEdit(row) }, { default: () => '编辑' }))
      }
      if (hasPermission('sys:param:delete')) {
        actions.push(h(NButton, { size: 'tiny', quaternary: true, type: 'error', onClick: () => handleDelete(row) }, { default: () => '删除' }))
      }
      return actions.length ? h(NSpace, { size: 'small' }, { default: () => actions }) : h('span', { class: 'muted' }, '无权限')
    },
  },
])

const showForm = ref(false)
const formMode = ref<'create' | 'edit'>('create')
const form = ref({ id: '', configKey: '', configValue: '', status: 1, remark: '' })

const openCreate = () => {
  formMode.value = 'create'
  form.value = { id: '', configKey: '', configValue: '', status: 1, remark: '' }
  showForm.value = true
}

const openEdit = (row: ConfigDto) => {
  formMode.value = 'edit'
  form.value = {
    id: row.id,
    configKey: row.configKey,
    configValue: row.configValue || '',
    status: row.status,
    remark: row.remark || '',
  }
  showForm.value = true
}

const submitForm = async () => {
  try {
    if (formMode.value === 'create') {
      await createConfig(form.value as any)
      message.success('创建成功')
    } else {
      await updateConfig(form.value as any)
      message.success('更新成功')
    }
    showForm.value = false
    await fetchConfigs()
  } catch (e: any) {
    message.error(e?.message || '操作失败')
  }
}

const handleDelete = async (row: ConfigDto) => {
  try {
    await deleteConfig(row.id)
    message.success('删除成功')
    await fetchConfigs()
  } catch (e: any) {
    message.error(e?.message || '删除失败')
  }
}

onMounted(fetchConfigs)
</script>

<template>
  <n-card title="参数设置" size="large">
    <n-space align="center" justify="space-between">
      <n-input v-model:value="keyword" placeholder="关键字" style="width: 220px" />
      <n-space>
        <n-button @click="fetchConfigs" :loading="loading">查询</n-button>
        <n-button v-permission="'sys:param:add'" type="primary" @click="openCreate">新增参数</n-button>
      </n-space>
    </n-space>

    <n-space vertical size="large" style="margin-top: 12px;">
      <n-data-table :columns="columns" :data="configs" :loading="loading" :bordered="false" />
      <n-pagination
        v-model:page="pageIndex"
        v-model:page-size="pageSize"
        :item-count="total"
        :page-sizes="[10, 20, 50]"
        show-size-picker
        @update:page="fetchConfigs"
        @update:page-size="fetchConfigs"
      />
    </n-space>
  </n-card>

  <n-modal v-model:show="showForm">
    <n-card style="width: min(560px, 92vw);" :title="formMode === 'create' ? '新增参数' : '编辑参数'">
      <n-form>
        <n-form-item label="键">
          <n-input v-model:value="form.configKey" :disabled="formMode === 'edit'" />
        </n-form-item>
        <n-form-item label="值">
          <n-input v-model:value="form.configValue" />
        </n-form-item>
        <n-form-item label="状态">
          <n-select v-model:value="form.status" :options="statusOptions" />
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
