<script setup lang="ts">
/**
 * @file 参数配置视图。
 */
import { computed, h, onMounted, ref } from 'vue'
import { NCard, NDataTable, NButton, NSpace, NModal, NForm, NFormItem, NInput, NSelect, NTag, NPagination, useMessage } from 'naive-ui'
import type { DataTableColumns } from 'naive-ui'
import { usePermissionStore } from '../../stores/permission'
import { getConfigPage, createConfig, updateConfig, deleteConfig } from '../../api/config'
import type { ConfigDto } from '../../api/types'
import { useDictStore } from '../../stores/dict'

const message = useMessage()
const permissionStore = usePermissionStore()
const { hasPermission } = permissionStore
const dictStore = useDictStore()

interface ConfigDefinition {
  label: string
  dictType?: string
  dictValueMap?: Record<string, string>
  description?: string
  readOnly?: boolean
  protected?: boolean
  inputType?: 'text' | 'textarea'
}

const configDefinitions: Record<string, ConfigDefinition> = {
  'sys:register:enabled': { label: '是否开放注册', dictType: 'sys_yes_no', dictValueMap: { '1': 'true', '0': 'false' }, protected: true },
  'sys:email:verify_enabled': { label: '是否启用邮箱验证码', dictType: 'sys_yes_no', dictValueMap: { '1': 'true', '0': 'false' }, protected: true },
  'sys:github:oauth_enabled': { label: '是否启用 GitHub OAuth', dictType: 'sys_yes_no', dictValueMap: { '1': 'true', '0': 'false' }, protected: true },
  'sys:data:migration:auto_on_startup': { label: '是否在服务启动时自动执行数据迁移', dictType: 'sys_yes_no', dictValueMap: { '1': 'true', '0': 'false' }, protected: true },
  'sys:data:migration:last_time': { label: '数据迁移最近执行时间', readOnly: true, protected: true, description: '系统自动记录，无需手动修改。' },
  'app:upload:max_mb': { label: '默认上传大小限制(MB)', dictType: 'sys_upload_size_mb', protected: true },
  'app:session:timeout_minutes': { label: 'Session 超时时间(分钟)', dictType: 'sys_session_timeout', protected: true },
  'sys:announcement:max_count': { label: '公告弹窗最多展示条数', protected: true, description: '范围 1-100，默认 20。修改后用户端最长 1 分钟内生效。' },
  'app:name': { label: '系统名称', protected: true },
  'app:version': { label: '系统版本', protected: true },
}

const hiddenKeys = new Set(['sys:ops:token', 'sys:ops:force_token'])
const dictTypesToLoad = ['sys_status', 'sys_yes_no', 'sys_session_timeout', 'sys_upload_size_mb']

const loading = ref(false)
const configs = ref<ConfigDto[]>([])
const pageIndex = ref(1)
const pageSize = ref(20)
const total = ref(0)
const keyword = ref('')
const dictReady = ref(false)
const tableLoading = computed(() => loading.value || !dictReady.value)

const statusOptions = computed(() => {
  const options = dictStore.getOptions('sys_status')
  if (!options.length) {
    return [
      { label: '启用', value: 1 },
      { label: '禁用', value: 2 },
    ]
  }
  return options.map((item) => {
    const parsed = Number(item.dictValue)
    const value = Number.isNaN(parsed) ? item.dictValue : parsed
    return { label: item.dictLabel, value }
  })
})

const fetchConfigs = async () => {
  loading.value = true
  try {
    const res = await getConfigPage({
      pageIndex: pageIndex.value,
      pageSize: pageSize.value,
      keyword: keyword.value || undefined,
    })
    const items = res.data.data.items || []
    configs.value = items.filter((item) => !hiddenKeys.has(item.configKey))
    total.value = Number(res.data.data.total || 0)
  } finally {
    loading.value = false
  }
}

const ensureDicts = async () => {
  dictReady.value = false
  await Promise.all(dictTypesToLoad.map((type) => dictStore.ensure(type)))
  dictReady.value = true
}

const getDefinition = (key: string) => configDefinitions[key]

const toDictValue = (def: ConfigDefinition | undefined, configValue?: string | null) => {
  if (!def || !configValue) return configValue || ''
  if (!def.dictValueMap) return configValue
  const entry = Object.entries(def.dictValueMap).find(([, stored]) => stored === configValue)
  return entry?.[0] ?? configValue
}

const fromDictValue = (def: ConfigDefinition | undefined, dictValue: string) => {
  if (!def) return dictValue
  if (def.dictValueMap && def.dictValueMap[dictValue] !== undefined) {
    return def.dictValueMap[dictValue]
  }
  return dictValue
}

const getDictSelectOptions = (dictType: string) =>
  dictStore.getOptions(dictType).map((item) => ({ label: item.dictLabel, value: item.dictValue }))

const formatConfigValue = (row: ConfigDto) => {
  const def = getDefinition(row.configKey)
  if (def?.dictType) {
    const targetValue = toDictValue(def, row.configValue)
    const option = dictStore.getOptions(def.dictType).find((item) => item.dictValue === targetValue)
    if (option) return option.dictLabel
  }
  return row.configValue || ''
}

const columns = ref<DataTableColumns<ConfigDto>>([
  {
    title: '名称',
    key: 'label',
    render: (row) => getDefinition(row.configKey)?.label || row.remark || '-',
  },
  { title: '键', key: 'configKey' },
  {
    title: '值',
    key: 'configValue',
    render: (row) => formatConfigValue(row),
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
      const def = getDefinition(row.configKey)
      const actions: any[] = []
      if (hasPermission('sys:param:edit') && !def?.readOnly) {
        actions.push(h(NButton, { size: 'tiny', quaternary: true, onClick: () => openEdit(row) }, { default: () => '编辑' }))
      }
      if (hasPermission('sys:param:delete') && !def?.protected) {
        actions.push(h(NButton, { size: 'tiny', quaternary: true, type: 'error', onClick: () => handleDelete(row) }, { default: () => '删除' }))
      }
      return actions.length ? h(NSpace, { size: 'small' }, { default: () => actions }) : h('span', { class: 'muted' }, '无操作')
    },
  },
])

const showForm = ref(false)
const formMode = ref<'create' | 'edit'>('create')
const form = ref({ id: '', configKey: '', configValue: '', status: 1, remark: '' })
const dictValue = ref('')
const editingDefinition = computed(() => getDefinition(form.value.configKey))
const isDictField = computed(() => Boolean(editingDefinition.value?.dictType))

const openCreate = () => {
  formMode.value = 'create'
  form.value = { id: '', configKey: '', configValue: '', status: 1, remark: '' }
  dictValue.value = ''
  showForm.value = true
}

const openEdit = async (row: ConfigDto) => {
  formMode.value = 'edit'
  form.value = {
    id: row.id,
    configKey: row.configKey,
    configValue: row.configValue || '',
    status: row.status,
    remark: row.remark || '',
  }
  const def = getDefinition(row.configKey)
  if (def?.dictType) {
    await dictStore.ensure(def.dictType)
    dictValue.value = toDictValue(def, form.value.configValue)
  } else {
    dictValue.value = ''
  }
  showForm.value = true
}

const submitForm = async () => {
  try {
    const def = editingDefinition.value
    const payload: any = {
      ...form.value,
      configValue: def?.dictType ? fromDictValue(def, dictValue.value) : form.value.configValue,
    }
    if (def?.dictType) {
      if (dictValue.value === '') {
        message.warning('请选择字典值')
        return
      }
      payload.configValue = fromDictValue(def, dictValue.value)
    }
    if (formMode.value === 'create') {
      await createConfig(payload)
      message.success('创建成功')
    } else {
      await updateConfig(payload)
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

const handleSearch = () => {
  pageIndex.value = 1
  void fetchConfigs()
}

const handlePageChange = (page: number) => {
  pageIndex.value = page
  void fetchConfigs()
}

const handlePageSizeChange = (size: number) => {
  pageSize.value = size
  pageIndex.value = 1
  void fetchConfigs()
}

onMounted(async () => {
  await ensureDicts()
  await fetchConfigs()
})
</script>

<template>
  <n-card title="参数设置" size="large">
    <n-space align="center" justify="space-between">
      <n-input v-model:value="keyword" placeholder="关键字" style="width: 220px" />
      <n-space>
        <n-button @click="handleSearch" :loading="tableLoading">查询</n-button>
        <n-button v-permission="'sys:param:add'" type="primary" @click="openCreate">新增参数</n-button>
      </n-space>
    </n-space>

    <n-space vertical size="large" style="margin-top: 12px;">
      <n-data-table :columns="columns" :data="configs" :loading="tableLoading" :bordered="false" />
      <n-pagination
        v-model:page="pageIndex"
        v-model:page-size="pageSize"
        :item-count="total"
        :page-sizes="[10, 20, 50]"
        show-size-picker
        @update:page="handlePageChange"
        @update:page-size="handlePageSizeChange"
      />
    </n-space>
  </n-card>

  <n-modal v-model:show="showForm">
    <n-card style="width: min(560px, 92vw);" :title="formMode === 'create' ? '新增参数' : '编辑参数'">
      <n-form>
        <n-form-item label="键">
          <n-input v-model:value="form.configKey" :disabled="formMode === 'edit'" />
        </n-form-item>
        <n-form-item v-if="isDictField" label="值">
          <n-select
            v-model:value="dictValue"
            :options="editingDefinition?.dictType ? getDictSelectOptions(editingDefinition.dictType) : []"
            placeholder="请选择"
          />
        </n-form-item>
        <n-form-item v-else label="值">
          <n-input
            v-model:value="form.configValue"
            :type="editingDefinition?.inputType === 'textarea' ? 'textarea' : 'text'"
          />
        </n-form-item>
        <n-form-item label="状态">
          <n-select v-model:value="form.status" :options="statusOptions" />
        </n-form-item>
        <n-form-item label="备注">
          <n-input v-model:value="form.remark" type="textarea" rows="3" />
        </n-form-item>
        <div v-if="editingDefinition?.description" class="config-hint">{{ editingDefinition.description }}</div>
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
.config-hint {
  font-size: 12px;
  color: var(--color-text-muted);
  margin-top: -8px;
  margin-bottom: 12px;
}
</style>
