<script setup lang="ts">
/**
 * @file 数据字典视图。
 */
import { h, onMounted, ref } from 'vue'
import { NCard, NDataTable, NButton, NSpace, NModal, NForm, NFormItem, NInput, NSelect, NTag, NPagination, NInputNumber, useMessage } from 'naive-ui'
import type { DataTableColumns } from 'naive-ui'
import { usePermissionStore } from '../../stores/permission'
import { getDictTypes, createDictType, updateDictType, deleteDictType, getDictData, createDictData, updateDictData, deleteDictData } from '../../api/dict'
import type { DictTypeDto, DictDataDto } from '../../api/types'

const message = useMessage()
const permissionStore = usePermissionStore()
const { hasPermission } = permissionStore

const typeLoading = ref(false)
const types = ref<DictTypeDto[]>([])
const typePage = ref(1)
const typeSize = ref(20)
const typeTotal = ref(0)

const dataLoading = ref(false)
const dataList = ref<DictDataDto[]>([])
const dataPage = ref(1)
const dataSize = ref(20)
const dataTotal = ref(0)
const selectedType = ref<DictTypeDto | null>(null)

const statusOptions = [
  { label: '启用', value: 1 },
  { label: '禁用', value: 2 },
]

const fetchTypes = async () => {
  typeLoading.value = true
  try {
    const res = await getDictTypes({ pageIndex: typePage.value, pageSize: typeSize.value })
    types.value = res.data.data.items || []
    typeTotal.value = Number(res.data.data.total || 0)
  } finally {
    typeLoading.value = false
  }
}

const fetchData = async () => {
  if (!selectedType.value) {
    dataList.value = []
    dataTotal.value = 0
    return
  }
  dataLoading.value = true
  try {
    const res = await getDictData({
      pageIndex: dataPage.value,
      pageSize: dataSize.value,
      dictType: selectedType.value.dictType,
    })
    dataList.value = res.data.data.items || []
    dataTotal.value = Number(res.data.data.total || 0)
  } finally {
    dataLoading.value = false
  }
}

const selectType = (row: DictTypeDto) => {
  selectedType.value = row
  dataPage.value = 1
  fetchData()
}

const typeColumns = ref<DataTableColumns<DictTypeDto>>([
  { title: '名称', key: 'dictName' },
  { title: '类型', key: 'dictType' },
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
      if (hasPermission('sys:dict:type:edit')) {
        actions.push(h(NButton, { size: 'tiny', quaternary: true, onClick: () => openTypeEdit(row) }, { default: () => '编辑' }))
      }
      if (hasPermission('sys:dict:type:delete')) {
        actions.push(h(NButton, { size: 'tiny', quaternary: true, type: 'error', onClick: () => handleTypeDelete(row) }, { default: () => '删除' }))
      }
      return actions.length ? h(NSpace, { size: 'small' }, { default: () => actions }) : h('span', { class: 'muted' }, '无权限')
    },
  },
])

const dataColumns = ref<DataTableColumns<DictDataDto>>([
  { title: '标签', key: 'dictLabel' },
  { title: '值', key: 'dictValue' },
  { title: '排序', key: 'sort' },
  {
    title: '默认',
    key: 'isDefault',
    render: (row) => (row.isDefault ? '是' : '否'),
  },
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
      if (hasPermission('sys:dict:data:edit')) {
        actions.push(h(NButton, { size: 'tiny', quaternary: true, onClick: () => openDataEdit(row) }, { default: () => '编辑' }))
      }
      if (hasPermission('sys:dict:data:delete')) {
        actions.push(h(NButton, { size: 'tiny', quaternary: true, type: 'error', onClick: () => handleDataDelete(row) }, { default: () => '删除' }))
      }
      return actions.length ? h(NSpace, { size: 'small' }, { default: () => actions }) : h('span', { class: 'muted' }, '无权限')
    },
  },
])

const showTypeForm = ref(false)
const typeMode = ref<'create' | 'edit'>('create')
const typeForm = ref({ id: '', dictName: '', dictType: '', status: 1, remark: '' })

const openTypeCreate = () => {
  typeMode.value = 'create'
  typeForm.value = { id: '', dictName: '', dictType: '', status: 1, remark: '' }
  showTypeForm.value = true
}

const openTypeEdit = (row: DictTypeDto) => {
  typeMode.value = 'edit'
  typeForm.value = { id: row.id, dictName: row.dictName, dictType: row.dictType, status: row.status, remark: row.remark || '' }
  showTypeForm.value = true
}

const submitType = async () => {
  try {
    if (typeMode.value === 'create') {
      await createDictType(typeForm.value)
      message.success('创建成功')
    } else {
      await updateDictType(typeForm.value as any)
      message.success('更新成功')
    }
    showTypeForm.value = false
    await fetchTypes()
  } catch (e: any) {
    message.error(e?.message || '操作失败')
  }
}

const handleTypeDelete = async (row: DictTypeDto) => {
  try {
    await deleteDictType(row.id)
    message.success('删除成功')
    if (selectedType.value?.id === row.id) {
      selectedType.value = null
      dataList.value = []
    }
    await fetchTypes()
  } catch (e: any) {
    message.error(e?.message || '删除失败')
  }
}

const showDataForm = ref(false)
const dataMode = ref<'create' | 'edit'>('create')
const dataForm = ref({
  id: '',
  dictType: '',
  dictLabel: '',
  dictValue: '',
  sort: 0,
  isDefault: false,
  status: 1,
  remark: '',
})

const openDataCreate = () => {
  if (!selectedType.value) return
  dataMode.value = 'create'
  dataForm.value = {
    id: '',
    dictType: selectedType.value.dictType,
    dictLabel: '',
    dictValue: '',
    sort: 0,
    isDefault: false,
    status: 1,
    remark: '',
  }
  showDataForm.value = true
}

const openDataEdit = (row: DictDataDto) => {
  dataMode.value = 'edit'
  dataForm.value = {
    id: row.id,
    dictType: row.dictType,
    dictLabel: row.dictLabel,
    dictValue: row.dictValue,
    sort: row.sort,
    isDefault: row.isDefault,
    status: row.status,
    remark: row.remark || '',
  }
  showDataForm.value = true
}

const submitData = async () => {
  try {
    if (dataMode.value === 'create') {
      await createDictData(dataForm.value)
      message.success('创建成功')
    } else {
      await updateDictData(dataForm.value as any)
      message.success('更新成功')
    }
    showDataForm.value = false
    await fetchData()
  } catch (e: any) {
    message.error(e?.message || '操作失败')
  }
}

const handleDataDelete = async (row: DictDataDto) => {
  try {
    await deleteDictData(row.id)
    message.success('删除成功')
    await fetchData()
  } catch (e: any) {
    message.error(e?.message || '删除失败')
  }
}

onMounted(async () => {
  await fetchTypes()
})
</script>

<template>
  <n-card title="数据字典" size="large">
    <n-space vertical size="large">
      <n-space align="center" justify="space-between">
        <div style="font-weight: 600;">字典类型</div>
        <n-button v-permission="'sys:dict:type:add'" type="primary" @click="openTypeCreate">新增类型</n-button>
      </n-space>

      <n-data-table
        :columns="typeColumns"
        :data="types"
        :loading="typeLoading"
        :bordered="false"
        :row-props="(row) => ({ onClick: () => selectType(row as any) })"
      />
      <n-pagination
        v-model:page="typePage"
        v-model:page-size="typeSize"
        :item-count="typeTotal"
        :page-sizes="[10, 20, 50]"
        show-size-picker
        @update:page="fetchTypes"
        @update:page-size="fetchTypes"
      />

      <n-space align="center" justify="space-between" style="margin-top: 10px;">
        <div style="font-weight: 600;">
          字典数据
          <span style="margin-left: 6px; color: var(--color-text-muted); font-size: 12px;">
            {{ selectedType ? selectedType.dictName : '请选择字典类型' }}
          </span>
        </div>
        <n-button v-permission="'sys:dict:data:add'" type="primary" :disabled="!selectedType" @click="openDataCreate">新增数据</n-button>
      </n-space>

      <n-data-table :columns="dataColumns" :data="dataList" :loading="dataLoading" :bordered="false" />
      <n-pagination
        v-model:page="dataPage"
        v-model:page-size="dataSize"
        :item-count="dataTotal"
        :page-sizes="[10, 20, 50]"
        show-size-picker
        @update:page="fetchData"
        @update:page-size="fetchData"
      />
    </n-space>
  </n-card>

  <n-modal v-model:show="showTypeForm">
    <n-card style="width: min(560px, 92vw);" :title="typeMode === 'create' ? '新增字典类型' : '编辑字典类型'">
      <n-form>
        <n-form-item label="名称">
          <n-input v-model:value="typeForm.dictName" />
        </n-form-item>
        <n-form-item label="类型">
          <n-input v-model:value="typeForm.dictType" :disabled="typeMode === 'edit'" />
        </n-form-item>
        <n-form-item label="状态">
          <n-select v-model:value="typeForm.status" :options="statusOptions" />
        </n-form-item>
        <n-form-item label="备注">
          <n-input v-model:value="typeForm.remark" type="textarea" rows="3" />
        </n-form-item>
      </n-form>
      <template #footer>
        <n-space justify="end">
          <n-button secondary @click="showTypeForm = false">取消</n-button>
          <n-button type="primary" @click="submitType">保存</n-button>
        </n-space>
      </template>
    </n-card>
  </n-modal>

  <n-modal v-model:show="showDataForm">
    <n-card style="width: min(560px, 92vw);" :title="dataMode === 'create' ? '新增字典数据' : '编辑字典数据'">
      <n-form>
        <n-form-item label="类型">
          <n-input v-model:value="dataForm.dictType" disabled />
        </n-form-item>
        <n-form-item label="标签">
          <n-input v-model:value="dataForm.dictLabel" />
        </n-form-item>
        <n-form-item label="值">
          <n-input v-model:value="dataForm.dictValue" />
        </n-form-item>
        <n-form-item label="排序">
          <n-input-number v-model:value="dataForm.sort" min="0" style="width: 160px;" />
        </n-form-item>
        <n-form-item label="默认">
          <n-select v-model:value="dataForm.isDefault" :options="[{ label: '否', value: false }, { label: '是', value: true }]" />
        </n-form-item>
        <n-form-item label="状态">
          <n-select v-model:value="dataForm.status" :options="statusOptions" />
        </n-form-item>
        <n-form-item label="备注">
          <n-input v-model:value="dataForm.remark" type="textarea" rows="3" />
        </n-form-item>
      </n-form>
      <template #footer>
        <n-space justify="end">
          <n-button secondary @click="showDataForm = false">取消</n-button>
          <n-button type="primary" @click="submitData">保存</n-button>
        </n-space>
      </template>
    </n-card>
  </n-modal>
</template>
