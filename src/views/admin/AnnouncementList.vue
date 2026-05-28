<script setup lang="ts">
/**
 * @file 公告管理视图：管理端 CRUD。
 */
import { computed, h, onMounted, ref } from 'vue'
import {
  NCard,
  NDataTable,
  NButton,
  NSpace,
  NModal,
  NForm,
  NFormItem,
  NInput,
  NSelect,
  NDatePicker,
  NSwitch,
  NInputNumber,
  NTag,
  NTabs,
  NTabPane,
  NEmpty,
  NPagination,
  NPopconfirm,
  useMessage,
} from 'naive-ui'
import type { DataTableColumns, FormRules } from 'naive-ui'
import { usePermissionStore } from '../../stores/permission'
import {
  createAnnouncement,
  deleteAnnouncement,
  getAnnouncementPage,
  updateAnnouncement,
} from '../../api/announcement'
import { renderMarkdown } from '../../utils/markdown'
import type { AnnouncementDto } from '../../api/types'

const message = useMessage()
const permissionStore = usePermissionStore()
const { hasPermission } = permissionStore

const loading = ref(false)
const list = ref<AnnouncementDto[]>([])
const total = ref(0)
const pageIndex = ref(1)
const pageSize = ref(20)
const keyword = ref('')
const statusFilter = ref<number | null>(null)
const priorityFilter = ref<number | null>(null)

const statusOptions = [
  { label: '全部', value: null },
  { label: '启用', value: 1 },
  { label: '禁用', value: 2 },
]
const priorityOptions = [
  { label: '全部', value: null },
  { label: '默认', value: 1 },
  { label: '进行中', value: 2 },
  { label: '成功', value: 3 },
  { label: '警告', value: 4 },
  { label: '异常', value: 5 },
]
const priorityLabelMap: Record<number, { label: string; type: 'default' | 'info' | 'success' | 'warning' | 'error' }> = {
  1: { label: '默认', type: 'default' },
  2: { label: '进行中', type: 'info' },
  3: { label: '成功', type: 'success' },
  4: { label: '警告', type: 'warning' },
  5: { label: '异常', type: 'error' },
}

interface AnnouncementForm {
  id: string
  title: string
  content: string
  priority: number
  isPinned: boolean
  sort: number
  status: number
  startTime: number | null
  endTime: number | null
}

const showForm = ref(false)
const formMode = ref<'create' | 'edit'>('create')
const submitting = ref(false)
const form = ref<AnnouncementForm>(createEmptyForm())
const contentTab = ref<'edit' | 'preview'>('edit')

function createEmptyForm(): AnnouncementForm {
  return {
    id: '',
    title: '',
    content: '',
    priority: 1,
    isPinned: false,
    sort: 0,
    status: 1,
    startTime: null,
    endTime: null,
  }
}

const rules: FormRules = {
  title: [{ required: true, message: '请输入标题', trigger: 'blur' }],
  priority: [{ required: true, type: 'number', message: '请选择优先级' }],
  status: [{ required: true, type: 'number', message: '请选择状态' }],
}

const formatDateTime = (value?: string | null) => {
  if (!value) return '-'
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return '-'
  const pad = (n: number) => n.toString().padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`
}

const columns = computed<DataTableColumns<AnnouncementDto>>(() => [
  {
    title: '标题',
    key: 'title',
    render: (row) =>
      h('span', null, [
        row.isPinned
          ? h(NTag, { size: 'small', type: 'info', style: 'margin-right: 6px;' }, { default: () => '置顶' })
          : null,
        row.title,
      ]),
  },
  {
    title: '优先级',
    key: 'priority',
    width: 90,
    render: (row) => {
      const conf = priorityLabelMap[row.priority] ?? priorityLabelMap[1]
      return h(NTag, { size: 'small', type: conf.type }, { default: () => conf.label })
    },
  },
  {
    title: '状态',
    key: 'status',
    width: 80,
    render: (row) =>
      h(
        NTag,
        { size: 'small', type: row.status === 1 ? 'success' : 'error' },
        { default: () => (row.status === 1 ? '启用' : '禁用') },
      ),
  },
  { title: '排序', key: 'sort', width: 70 },
  {
    title: '生效时间',
    key: 'startTime',
    width: 160,
    render: (row) => formatDateTime(row.startTime),
  },
  {
    title: '过期时间',
    key: 'endTime',
    width: 160,
    render: (row) => formatDateTime(row.endTime),
  },
  {
    title: '创建时间',
    key: 'createTime',
    width: 160,
    render: (row) => formatDateTime(row.createTime),
  },
  {
    title: '操作',
    key: 'actions',
    width: 140,
    render: (row) => {
      const actions: any[] = []
      if (hasPermission('sys:announcement:edit')) {
        actions.push(
          h(
            NButton,
            { size: 'tiny', quaternary: true, onClick: () => openEdit(row) },
            { default: () => '编辑' },
          ),
        )
      }
      if (hasPermission('sys:announcement:delete')) {
        actions.push(
          h(
            NPopconfirm,
            { onPositiveClick: () => handleDelete(row) },
            {
              default: () => `确认删除「${row.title}」？`,
              trigger: () =>
                h(NButton, { size: 'tiny', quaternary: true, type: 'error' }, { default: () => '删除' }),
            },
          ),
        )
      }
      return actions.length
        ? h(NSpace, { size: 'small' }, { default: () => actions })
        : h('span', { class: 'muted' }, '无操作')
    },
  },
])

const fetchList = async () => {
  loading.value = true
  try {
    const res = await getAnnouncementPage({
      pageIndex: pageIndex.value,
      pageSize: pageSize.value,
      keyword: keyword.value || undefined,
      status: statusFilter.value ?? undefined,
      priority: priorityFilter.value ?? undefined,
    })
    list.value = res.data.data.items || []
    total.value = Number(res.data.data.total || 0)
  } finally {
    loading.value = false
  }
}

const openCreate = () => {
  formMode.value = 'create'
  form.value = createEmptyForm()
  contentTab.value = 'edit'
  showForm.value = true
}

const openEdit = (row: AnnouncementDto) => {
  formMode.value = 'edit'
  form.value = {
    id: row.id,
    title: row.title,
    content: row.content || '',
    priority: row.priority,
    isPinned: row.isPinned,
    sort: row.sort,
    status: row.status,
    startTime: row.startTime ? new Date(row.startTime).getTime() : null,
    endTime: row.endTime ? new Date(row.endTime).getTime() : null,
  }
  contentTab.value = 'edit'
  showForm.value = true
}

const submitForm = async () => {
  if (!form.value.title.trim()) {
    message.warning('请填写标题')
    return
  }
  if (form.value.startTime && form.value.endTime && form.value.endTime <= form.value.startTime) {
    message.warning('过期时间必须晚于生效时间')
    return
  }
  submitting.value = true
  try {
    const payload = {
      title: form.value.title.trim(),
      content: form.value.content || undefined,
      priority: form.value.priority,
      isPinned: form.value.isPinned,
      sort: form.value.sort,
      status: form.value.status,
      startTime: form.value.startTime ? new Date(form.value.startTime).toISOString() : null,
      endTime: form.value.endTime ? new Date(form.value.endTime).toISOString() : null,
    }
    if (formMode.value === 'create') {
      await createAnnouncement(payload)
      message.success('创建成功')
    } else {
      await updateAnnouncement({ id: form.value.id, ...payload })
      message.success('更新成功')
    }
    showForm.value = false
    await fetchList()
  } catch (e: any) {
    message.error(e?.message || '操作失败')
  } finally {
    submitting.value = false
  }
}

const handleDelete = async (row: AnnouncementDto) => {
  try {
    await deleteAnnouncement(row.id)
    message.success('删除成功')
    await fetchList()
  } catch (e: any) {
    message.error(e?.message || '删除失败')
  }
}

const handleSearch = () => {
  pageIndex.value = 1
  void fetchList()
}

const handleReset = () => {
  keyword.value = ''
  statusFilter.value = null
  priorityFilter.value = null
  handleSearch()
}

const handlePageChange = (page: number) => {
  pageIndex.value = page
  void fetchList()
}

const handlePageSizeChange = (size: number) => {
  pageSize.value = size
  pageIndex.value = 1
  void fetchList()
}

onMounted(() => {
  void fetchList()
})
</script>

<template>
  <n-card title="公告管理" size="large">
    <n-space align="center" justify="space-between" wrap>
      <n-space align="center" wrap>
        <n-input v-model:value="keyword" placeholder="标题/内容关键字" clearable style="width: 220px" />
        <n-select
          v-model:value="statusFilter"
          :options="statusOptions"
          placeholder="状态"
          style="width: 120px"
          clearable
        />
        <n-select
          v-model:value="priorityFilter"
          :options="priorityOptions"
          placeholder="优先级"
          style="width: 120px"
          clearable
        />
        <n-button @click="handleSearch" :loading="loading">查询</n-button>
        <n-button quaternary @click="handleReset">重置</n-button>
      </n-space>
      <n-space>
        <n-button v-permission="'sys:announcement:add'" type="primary" @click="openCreate">新增公告</n-button>
      </n-space>
    </n-space>

    <n-space vertical size="large" style="margin-top: 12px">
      <n-data-table
        :columns="columns"
        :data="list"
        :loading="loading"
        :bordered="false"
        :row-key="(row: AnnouncementDto) => row.id"
      />
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

  <n-modal v-model:show="showForm" :mask-closable="false">
    <n-card style="width: min(640px, 92vw)" :title="formMode === 'create' ? '新增公告' : '编辑公告'">
      <n-form :model="form" :rules="rules" label-placement="left" label-width="90">
        <n-form-item label="标题" path="title">
          <n-input v-model:value="form.title" maxlength="200" show-count placeholder="请输入公告标题" />
        </n-form-item>
        <n-form-item label="正文">
          <div class="content-editor">
            <n-tabs
              v-model:value="contentTab"
              type="line"
              size="small"
              animated
              class="content-tabs"
            >
              <n-tab-pane name="edit" tab="编辑">
                <n-input
                  v-model:value="form.content"
                  type="textarea"
                  :autosize="{ minRows: 6, maxRows: 14 }"
                  placeholder="支持 Markdown：**粗体** *斜体* [链接](https://...) `code` # 标题 - 列表 > 引用"
                />
              </n-tab-pane>
              <n-tab-pane name="preview" tab="预览">
                <div class="md-preview">
                  <div
                    v-if="form.content && form.content.trim()"
                    class="markdown-body"
                    v-html="renderMarkdown(form.content)"
                  ></div>
                  <n-empty v-else description="暂无内容可预览" size="small" />
                </div>
              </n-tab-pane>
            </n-tabs>
          </div>
        </n-form-item>
        <n-form-item label="优先级" path="priority">
          <n-select
            v-model:value="form.priority"
            :options="priorityOptions.filter((o) => o.value !== null)"
          />
        </n-form-item>
        <n-form-item label="状态" path="status">
          <n-select v-model:value="form.status" :options="statusOptions.filter((o) => o.value !== null)" />
        </n-form-item>
        <n-form-item label="置顶">
          <n-switch v-model:value="form.isPinned" />
        </n-form-item>
        <n-form-item label="排序">
          <n-input-number v-model:value="form.sort" :min="0" :max="9999" />
        </n-form-item>
        <n-form-item label="生效时间">
          <n-date-picker
            v-model:value="form.startTime"
            type="datetime"
            clearable
            placeholder="立即生效"
            style="width: 100%"
          />
        </n-form-item>
        <n-form-item label="过期时间">
          <n-date-picker
            v-model:value="form.endTime"
            type="datetime"
            clearable
            placeholder="长期有效"
            style="width: 100%"
          />
        </n-form-item>
      </n-form>
      <template #footer>
        <n-space justify="end">
          <n-button secondary @click="showForm = false">取消</n-button>
          <n-button type="primary" :loading="submitting" @click="submitForm">保存</n-button>
        </n-space>
      </template>
    </n-card>
  </n-modal>
</template>

<style scoped>
.muted {
  color: var(--color-text-muted);
}

.content-editor {
  width: 100%;
}

.content-tabs :deep(.n-tabs-nav) {
  margin-bottom: 8px;
}

.md-preview {
  min-height: 132px;
  max-height: 360px;
  overflow-y: auto;
  padding: 10px 12px;
  background: var(--color-bg-light);
  border: 1px solid var(--color-border);
  border-radius: 6px;
}

.markdown-body :deep(p) {
  margin: 0 0 6px;
}

.markdown-body :deep(p:last-child) {
  margin-bottom: 0;
}

.markdown-body :deep(h1),
.markdown-body :deep(h2),
.markdown-body :deep(h3),
.markdown-body :deep(h4) {
  margin: 10px 0 6px;
  color: var(--color-text-main);
  font-weight: 600;
  line-height: 1.4;
}

.markdown-body :deep(h1) { font-size: 18px; }
.markdown-body :deep(h2) { font-size: 16px; }
.markdown-body :deep(h3) { font-size: 15px; }
.markdown-body :deep(h4) { font-size: 14px; }

.markdown-body :deep(ul),
.markdown-body :deep(ol) {
  margin: 4px 0;
  padding-left: 22px;
}

.markdown-body :deep(li) {
  margin: 2px 0;
}

.markdown-body :deep(a) {
  color: var(--color-primary);
  text-decoration: none;
}

.markdown-body :deep(a:hover) {
  text-decoration: underline;
}

.markdown-body :deep(code) {
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: 4px;
  padding: 0 4px;
  font-family: var(--font-family-mono, ui-monospace, SFMono-Regular, Menlo, monospace);
  font-size: 12px;
}

.markdown-body :deep(pre) {
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: 6px;
  padding: 8px 10px;
  margin: 6px 0;
  overflow-x: auto;
  font-size: 12px;
}

.markdown-body :deep(pre code) {
  background: transparent;
  border: none;
  padding: 0;
}

.markdown-body :deep(blockquote) {
  margin: 6px 0;
  padding: 4px 10px;
  border-left: 3px solid var(--color-border);
  color: var(--color-text-muted);
}

.markdown-body :deep(hr) {
  border: none;
  border-top: 1px dashed var(--color-border);
  margin: 8px 0;
}

.markdown-body :deep(strong) {
  color: var(--color-text-main);
}

.markdown-body :deep(img) {
  max-width: 100%;
  border-radius: 6px;
}
</style>
