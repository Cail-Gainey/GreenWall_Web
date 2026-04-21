<script setup lang="ts">
/**
 * @file 角色管理：Naive UI DataTable + 权限分配。
 */
import { computed, h, onMounted, ref } from 'vue'
import {
  NButton,
  NCard,
  NDataTable,
  NDatePicker,
  NDropdown,
  NForm,
  NFormItem,
  NInput,
  NInputNumber,
  NIcon,
  NModal,
  NTree,
  NPagination,
  NPopover,
  NSelect,
  NSpace,
  NTag,
  NTooltip,
  NCheckbox,
  NCheckboxGroup,
  useDialog,
  useMessage,
  type DataTableColumns,
  type TreeOption,
} from 'naive-ui'
import { Column, List, Renew, ChevronUp, Filter, Pen, TrashCan, UserRole } from '@vicons/carbon'
import { createRole, deleteRole, getRoleById, getRolePage, updateRole, updateRoleSort } from '../../api/role'
import { useMenuTreeStore } from '../../stores/menuTree'
import { usePermissionStore } from '../../stores/permission'
import type { MenuTreeDto, RoleCreateDto, RoleDto, RoleQueryDto, RoleSortUpdateDto, RoleUpdateDto } from '../../api/types'
import { TimeFormatter } from '../../utils/time'
import { isValidRoleCode } from '../../utils/validators'

const roles = ref<RoleDto[]>([])
const menus = ref<MenuTreeDto[]>([])
const total = ref(0)
const pageIndex = ref(1)
const pageSize = ref(10)
const loading = ref(false)
const messageApi = useMessage()

const showForm = ref(false)
const formMode = ref<'create' | 'edit'>('create')
const showSearch = ref(false)
const showPermDialog = ref(false)
const permLoading = ref(false)
const permRole = ref<RoleDto | null>(null)
const permMenuIds = ref<string[]>([])
const permExpandedKeys = ref<string[]>([])
const draggingIndex = ref<number | null>(null)
const dragOverIndex = ref<number | null>(null)
const tableDensity = ref<'compact' | 'default' | 'comfortable'>('default')
const visibleColumns = ref<Array<'roleName' | 'roleCode' | 'status' | 'sort' | 'remark' | 'createTime' | 'actions'>>([
  'roleName',
  'roleCode',
  'status',
  'sort',
  'remark',
  'createTime',
  'actions',
])

const permissionStore = usePermissionStore()
const { hasPermission, loadPermission } = permissionStore
const menuTreeStore = useMenuTreeStore()
const dialog = useDialog()

const form = ref({
  id: '',
  roleName: '',
  roleCode: '',
  sort: 1,
  status: 1,
  remark: '',
  menuIds: [] as string[],
})

const filterForm = ref({
  roleName: '',
  roleCode: '',
  remark: '',
  status: 'all' as 'all' | '1' | '2',
  dateRange: null as [number, number] | null,
})

const appliedFilters = ref({
  roleName: '',
  roleCode: '',
  remark: '',
  status: 'all' as 'all' | '1' | '2',
  dateRange: null as [number, number] | null,
})

const densityOptions = [
  { label: '紧凑', key: 'compact' },
  { label: '默认', key: 'default' },
  { label: '宽松', key: 'comfortable' },
]

const statusOptions = [
  { label: '全部状态', value: 'all' },
  { label: '启用', value: '1' },
  { label: '禁用', value: '2' },
]

const columnOptions = [
  { label: '排序', value: 'sort' },
  { label: '角色名称', value: 'roleName' },
  { label: '编码', value: 'roleCode' },
  { label: '状态', value: 'status' },
  { label: '备注', value: 'remark' },
  { label: '创建日期', value: 'createTime' },
  { label: '操作', value: 'actions' },
]

const menuTreeOptions = computed<TreeOption[]>(() => {
  const build = (node: MenuTreeDto): TreeOption => ({
    key: node.id,
    label: node.menuName,
    children: node.children && node.children.length > 0 ? node.children.map(build) : undefined,
  })
  return menus.value.map(build)
})

function showMsg(msg: string, error = false) {
  if (!msg) return
  if (error) messageApi.error(msg)
  else messageApi.success(msg)
}

function clearMsg() {
  // no-op for toast messages
}

function statusLabel(s: number) {
  return s === 1 ? '启用' : '禁用'
}

function statusType(s: number) {
  return s === 1 ? 'success' : 'error'
}

function handleDensitySelect(key: string | number) {
  if (key === 'compact' || key === 'default' || key === 'comfortable') {
    tableDensity.value = key
  }
}

function isVisibleColumn(
  key: 'roleName' | 'roleCode' | 'status' | 'sort' | 'remark' | 'createTime' | 'actions',
) {
  return visibleColumns.value.includes(key)
}

async function applySortUpdate(list: RoleDto[]) {
  if (!hasPermission('sys:role:sort')) return
  const sortValues = list.map((r) => r.sort).sort((a, b) => a - b)
  const updates: RoleSortUpdateDto[] = list.map((role, idx) => ({
    id: role.id,
    sort: sortValues[idx],
  }))
  roles.value = list.map((role, idx) => ({ ...role, sort: updates[idx].sort }))
  try {
    await updateRoleSort(updates)
    showMsg('排序已更新')
  } catch (e: any) {
    showMsg(e.message, true)
    fetchRoles()
  }
}

function handleDragStart(index: number, event: DragEvent) {
  if (!hasPermission('sys:role:sort')) return
  if (event.dataTransfer) {
    event.dataTransfer.effectAllowed = 'move'
    event.dataTransfer.setData('text/plain', String(index))
  }
  draggingIndex.value = index
}

function handleDragOver(index: number, event: DragEvent) {
  if (draggingIndex.value === null) return
  event.preventDefault()
  dragOverIndex.value = index
}

async function handleDrop(index: number) {
  if (draggingIndex.value === null) return
  const from = draggingIndex.value
  const to = index
  draggingIndex.value = null
  dragOverIndex.value = null
  if (from === to) return
  const list = roles.value.slice()
  const [moved] = list.splice(from, 1)
  list.splice(to, 0, moved)
  await applySortUpdate(list)
}

function toggleSearch() {
  showSearch.value = !showSearch.value
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

function getAllMenuKeys(nodes: MenuTreeDto[]) {
  const keys: string[] = []
  const walk = (list: MenuTreeDto[]) => {
    list.forEach((node) => {
      keys.push(node.id)
      if (node.children && node.children.length > 0) {
        walk(node.children)
      }
    })
  }
  walk(nodes)
  return keys
}

function expandAllMenus() {
  permExpandedKeys.value = getAllMenuKeys(menus.value)
}

function collapseAllMenus() {
  permExpandedKeys.value = []
}

function selectAllMenus() {
  permMenuIds.value = getAllMenuKeys(menus.value)
}

function clearMenuSelection() {
  permMenuIds.value = []
}

function invertMenuSelection() {
  const allKeys = new Set(getAllMenuKeys(menus.value))
  const current = new Set(permMenuIds.value.filter((key) => allKeys.has(key)))
  const next: string[] = []
  allKeys.forEach((key) => {
    if (!current.has(key)) next.push(key)
  })
  permMenuIds.value = next
}

async function openPermission(role: RoleDto) {
  showPermDialog.value = true
  permLoading.value = true
  try {
    if (menus.value.length === 0) {
      await fetchMenus()
    }
    const res = await getRoleById(role.id)
    const detail = res.data.data
    permRole.value = detail
    permMenuIds.value = detail.menuIds || []
    expandAllMenus()
  } catch (e: any) {
    showMsg(e.message, true)
  } finally {
    permLoading.value = false
  }
}

async function submitPermissions() {
  if (!permRole.value) return
  try {
    await updateRole({
      id: permRole.value.id,
      roleName: permRole.value.roleName,
      roleCode: permRole.value.roleCode,
      sort: permRole.value.sort,
      status: permRole.value.status,
      remark: permRole.value.remark || undefined,
      menuIds: permMenuIds.value,
    })
    showMsg('权限更新成功')
    await loadPermission()
    showPermDialog.value = false
    refreshRoles()
  } catch (e: any) {
    showMsg(e.message, true)
  }
}

function applyFilters() {
  appliedFilters.value = {
    roleName: filterForm.value.roleName.trim(),
    roleCode: filterForm.value.roleCode.trim(),
    remark: filterForm.value.remark.trim(),
    status: filterForm.value.status,
    dateRange: filterForm.value.dateRange,
  }
  pageIndex.value = 1
  fetchRoles()
}

function resetFilters() {
  filterForm.value = {
    roleName: '',
    roleCode: '',
    remark: '',
    status: 'all',
    dateRange: null,
  }
  appliedFilters.value = {
    roleName: '',
    roleCode: '',
    remark: '',
    status: 'all',
    dateRange: null,
  }
  pageIndex.value = 1
  fetchRoles()
}

function buildQuery(): RoleQueryDto {
  const { roleName, roleCode, remark, status, dateRange } = appliedFilters.value
  const hasRange = Array.isArray(dateRange) && dateRange.length === 2
  const start = hasRange ? dateRange![0] : undefined
  const end = hasRange ? dateRange![1] : undefined
  const endWithDay = typeof end === 'number' ? end + 24 * 60 * 60 * 1000 - 1 : undefined

  return {
    pageIndex: pageIndex.value,
    pageSize: pageSize.value,
    roleName: roleName || undefined,
    roleCode: roleCode || undefined,
    remark: remark || undefined,
    status: status === 'all' ? undefined : Number(status),
    startTime: start,
    endTime: endWithDay,
  }
}

async function fetchRoles() {
  loading.value = true
  clearMsg()
  try {
    const res = await getRolePage(buildQuery())
    roles.value = res.data.data.items || []
    total.value = Number(res.data.data.total || 0)
  } catch (e: any) {
    showMsg(e.message, true)
  } finally {
    loading.value = false
  }
}

async function refreshRoles() {
  loading.value = true
  clearMsg()
  try {
    const res = await getRolePage(buildQuery())
    roles.value = res.data.data.items || []
    total.value = Number(res.data.data.total || 0)
  } catch (e: any) {
    showMsg(e.message, true)
  } finally {
    loading.value = false
  }
}

async function fetchMenus() {
  try {
    menus.value = await menuTreeStore.fetch()
  } catch (e: any) {
    showMsg(e.message, true)
  }
}

function openCreate() {
  formMode.value = 'create'
  form.value = {
    id: '',
    roleName: '',
    roleCode: '',
    sort: 1,
    status: 1,
    remark: '',
    menuIds: [],
  }
  showForm.value = true
}

async function openEdit(role: RoleDto) {
  formMode.value = 'edit'
  try {
    const res = await getRoleById(role.id)
    const detail = res.data.data
    form.value = {
      id: detail.id,
      roleName: detail.roleName,
      roleCode: detail.roleCode,
      sort: detail.sort,
      status: detail.status,
      remark: detail.remark || '',
      menuIds: detail.menuIds || [],
    }
    showForm.value = true
  } catch (e: any) {
    showMsg(e.message, true)
  }
}

async function submitForm() {
  clearMsg()
  const roleName = form.value.roleName.trim()
  const roleCode = form.value.roleCode.trim()
  if (!form.value.roleName.trim()) {
    return showMsg('请输入角色名称', true)
  }
  if (!roleCode) {
    return showMsg('请输入角色编码', true)
  }
  if (!isValidRoleCode(roleCode)) {
    return showMsg('角色编码需以字母开头，仅支持字母/数字/:/_/-，长度 2-50', true)
  }

  if (formMode.value === 'create') {
    const payload: RoleCreateDto = {
      roleName,
      roleCode,
      sort: form.value.sort,
      status: form.value.status,
      remark: form.value.remark || undefined,
      menuIds: form.value.menuIds,
    }
    try {
      await createRole(payload)
      showMsg('创建成功')
      await loadPermission()
      showForm.value = false
      refreshRoles()
    } catch (e: any) {
      showMsg(e.message, true)
    }
    return
  }

  const payload: RoleUpdateDto = {
    id: form.value.id,
    roleName,
    roleCode,
    sort: form.value.sort,
    status: form.value.status,
    remark: form.value.remark || undefined,
    menuIds: form.value.menuIds,
  }
  try {
    await updateRole(payload)
    showMsg('更新成功')
    await loadPermission()
    showForm.value = false
    refreshRoles()
  } catch (e: any) {
    showMsg(e.message, true)
  }
}

async function handleDelete(role: RoleDto) {
  const ok = await confirmAction(`确认删除角色 ${role.roleName} 吗？`)
  if (!ok) return
  try {
    await deleteRole(role.id)
    showMsg('删除成功')
    await loadPermission()
    refreshRoles()
  } catch (e: any) {
    showMsg(e.message, true)
  }
}

const columns = computed<DataTableColumns<RoleDto>>(() => {
  const cols: DataTableColumns<RoleDto> = []

  if (isVisibleColumn('sort')) {
    cols.push({ title: '排序', key: 'sort' })
  }
  if (isVisibleColumn('roleName')) {
    cols.push({ title: '角色名称', key: 'roleName' })
  }
  if (isVisibleColumn('roleCode')) {
    cols.push({ title: '编码', key: 'roleCode' })
  }
  if (isVisibleColumn('status')) {
    cols.push({
      title: '状态',
      key: 'status',
      render: (row) =>
        h(NTag, { size: 'small', type: statusType(row.status) as any }, { default: () => statusLabel(row.status) }),
    })
  }
  if (isVisibleColumn('remark')) {
    cols.push({
      title: '备注',
      key: 'remark',
      render: (row) => row.remark || '-',
    })
  }
  if (isVisibleColumn('createTime')) {
    cols.push({
      title: '创建日期',
      key: 'createTime',
      render: (row) => TimeFormatter.formatDateTime(row.createTime),
    })
  }
  if (isVisibleColumn('actions')) {
    cols.push({
      title: '操作',
      key: 'actions',
      render: (row) => {
        const actions: any[] = []
        if (hasPermission('sys:role:edit')) {
          actions.push(
            h(NTooltip, null, {
              default: () => '权限',
              trigger: () =>
                h(
                  NButton,
                  { size: 'small', quaternary: true, type: 'primary', class: 'action-btn', onClick: () => openPermission(row) },
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
        if (hasPermission('sys:role:edit')) {
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
        if (hasPermission('sys:role:delete')) {
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
  await Promise.all([fetchRoles(), fetchMenus()])
})
</script>

<template>
  <n-card title="角色管理" size="large">
    <n-space vertical size="large">
      <div v-if="showSearch" class="filter-panel">
        <n-form inline :show-feedback="false" class="filter-form">
          <n-form-item label="角色名称">
            <n-input v-model:value="filterForm.roleName" placeholder="请输入角色名称" clearable style="width: 200px;" />
          </n-form-item>
          <n-form-item label="角色编码">
            <n-input v-model:value="filterForm.roleCode" placeholder="请输入角色编码" clearable style="width: 200px;" />
          </n-form-item>
          <n-form-item label="角色描述">
            <n-input v-model:value="filterForm.remark" placeholder="请输入角色描述" clearable style="width: 240px;" />
          </n-form-item>
          <n-form-item label="角色状态">
            <n-select v-model:value="filterForm.status" :options="statusOptions" style="width: 160px;" />
          </n-form-item>
          <n-form-item label="创建日期">
            <n-date-picker
              v-model:value="filterForm.dateRange"
              type="daterange"
              clearable
              style="width: 260px;"
            />
          </n-form-item>
          <div class="filter-actions">
            <n-button secondary @click="resetFilters">重置</n-button>
            <n-button type="primary" @click="applyFilters">查询</n-button>
            <n-button text class="expand-btn" @click="toggleSearch">
              <template #icon>
                <n-icon><ChevronUp /></n-icon>
              </template>
              收起
            </n-button>
          </div>
        </n-form>
      </div>

      <div class="table-toolbar">
        <n-button v-permission="'sys:role:add'" type="primary" @click="openCreate">新建角色</n-button>
        <div class="table-tools">
          <n-tooltip>
            <template #trigger>
              <n-button quaternary size="small" @click="toggleSearch">
                <template #icon>
                  <n-icon><Filter /></n-icon>
                </template>
              </n-button>
            </template>
            {{ showSearch ? '收起筛选' : '展开筛选' }}
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
              <n-button quaternary size="small" @click="refreshRoles">
                <template #icon>
                  <n-icon><Renew /></n-icon>
                </template>
              </n-button>
            </template>
            刷新
          </n-tooltip>
        </div>
      </div>

      <n-data-table
        :class="['role-table', `density-${tableDensity}`]"
        :columns="columns"
        :data="roles"
        :loading="loading"
        :bordered="false"
        :row-props="(_, index) => ({
          draggable: hasPermission('sys:role:sort'),
          onDragstart: (e: DragEvent) => handleDragStart(index, e),
          onDragover: (e: DragEvent) => handleDragOver(index, e),
          onDrop: () => handleDrop(index),
          class: {
            'dragging-row': draggingIndex === index,
            'drag-over-row': dragOverIndex === index,
          },
        })"
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
          @update:page="fetchRoles"
          @update:page-size="fetchRoles"
        />
      </div>
    </n-space>
  </n-card>

  <n-modal v-model:show="showForm">
    <n-card style="width: min(820px, 94vw);" :title="formMode === 'create' ? '新建角色' : '编辑角色'">
      <n-form>
        <n-space wrap size="large">
          <n-form-item label="角色名称">
            <n-input v-model:value="form.roleName" />
          </n-form-item>
          <n-form-item label="角色编码">
            <n-input
              v-model:value="form.roleCode"
              :disabled="formMode === 'edit' && !hasPermission('sys:role:edit:code')"
            />
          </n-form-item>
          <n-form-item label="状态">
            <n-select
              v-model:value="form.status"
              :options="[
                { label: '启用', value: 1 },
                { label: '禁用', value: 2 },
              ]"
              style="width: 160px;"
            />
          </n-form-item>
          <n-form-item label="排序">
            <n-input-number v-model:value="form.sort" min="0" style="width: 160px;" />
          </n-form-item>
          <n-form-item label="备注" style="flex: 1 1 100%;">
            <n-input v-model:value="form.remark" type="textarea" rows="3" />
          </n-form-item>
        </n-space>
      </n-form>

      <template #footer>
        <n-space justify="end">
          <n-button secondary @click="showForm = false">取消</n-button>
          <n-button type="primary" @click="submitForm">保存</n-button>
        </n-space>
      </template>
    </n-card>
  </n-modal>

  <n-modal v-model:show="showPermDialog">
    <n-card style="width: min(720px, 92vw);" title="菜单权限">
      <div class="perm-toolbar">
        <div class="perm-title">
          <span>当前角色：</span>
          <strong>{{ permRole?.roleName || '-' }}</strong>
        </div>
        <div class="perm-actions">
          <n-button size="small" secondary @click="expandAllMenus">全部展开</n-button>
          <n-button size="small" secondary @click="collapseAllMenus">全部折叠</n-button>
          <n-button size="small" secondary @click="selectAllMenus">选中全部</n-button>
          <n-button size="small" secondary @click="clearMenuSelection">清空选择</n-button>
          <n-button size="small" secondary @click="invertMenuSelection">反选</n-button>
        </div>
      </div>

      <div class="perm-tree">
        <n-tree
          block-line
          checkable
          expand-on-click
          :loading="permLoading"
          :data="menuTreeOptions"
          v-model:checked-keys="permMenuIds"
          v-model:expanded-keys="permExpandedKeys"
        />
      </div>

      <template #footer>
        <n-space justify="end">
          <n-button secondary @click="showPermDialog = false">取消</n-button>
          <n-button type="primary" @click="submitPermissions">保存</n-button>
        </n-space>
      </template>
    </n-card>
  </n-modal>
</template>

<style scoped>
.table-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.table-tools {
  display: inline-flex;
  align-items: center;
  gap: 6px;
}

.table-alert {
  margin-bottom: 8px;
}

.table-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 12px;
}

.muted {
  color: var(--color-text-muted);
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

.expand-btn {
  padding-left: 4px;
}

.column-popover {
  min-width: 160px;
}

.column-title {
  font-weight: 600;
  margin-bottom: 8px;
}

.role-table :deep(.n-data-table-th) {
  font-weight: 600;
}

.role-table :deep(.n-data-table-tr) {
  cursor: grab;
}

.role-table :deep(.n-data-table-tr.dragging-row) {
  cursor: grabbing;
}

.role-table.density-compact :deep(.n-data-table-th),
.role-table.density-compact :deep(.n-data-table-td) {
  padding-top: 6px;
  padding-bottom: 6px;
}

.role-table.density-default :deep(.n-data-table-th),
.role-table.density-default :deep(.n-data-table-td) {
  padding-top: 12px;
  padding-bottom: 12px;
}

.role-table.density-comfortable :deep(.n-data-table-th),
.role-table.density-comfortable :deep(.n-data-table-td) {
  padding-top: 18px;
  padding-bottom: 18px;
}

.role-table :deep(.n-data-table-tr.dragging-row) td {
  opacity: 0.6;
}

.role-table :deep(.n-data-table-tr.drag-over-row) td {
  background: var(--color-bg-light);
}

.action-btn {
  padding: 4px;
}

.action-btn :deep(.n-button__icon) {
  font-size: 18px;
}

.perm-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 12px;
}

.perm-title {
  color: var(--color-text-muted);
}

.perm-title strong {
  color: var(--color-text-main);
  font-weight: 600;
}

.perm-actions {
  display: inline-flex;
  align-items: center;
  gap: 8px;
}

.perm-tree {
  border: 1px solid var(--color-border);
  border-radius: 10px;
  padding: 10px 12px;
  background: var(--color-bg-light);
  max-height: 60vh;
  overflow: auto;
}
</style>
