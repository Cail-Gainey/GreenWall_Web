<script setup lang="ts">
/**
 * @file 菜单/权限管理：Naive UI DataTable + Modal。
 */
import { computed, h, onMounted, ref } from 'vue'
import {
  NButton,
  NCard,
  NCheckbox,
  NCheckboxGroup,
  NDataTable,
  NDropdown,
  NForm,
  NFormItem,
  NIcon,
  NInput,
  NInputNumber,
  NModal,
  NPopover,
  NRadioButton,
  NRadioGroup,
  NSelect,
  NSpace,
  NSwitch,
  NTag,
  NTooltip,
  useDialog,
  useMessage,
  type DataTableColumns,
} from 'naive-ui'
import { Add, Column, FitToScreen, List, Pen, Renew, TrashCan } from '@vicons/carbon'
import { createMenu, deleteMenu, getMenuById, updateMenu, updateMenuSort } from '../../api/menu'
import { useMenuTreeStore } from '../../stores/menuTree'
import { usePermissionStore } from '../../stores/permission'
import type { MenuCreateDto, MenuTreeDto, MenuUpdateDto } from '../../api/types'
import {
  isValidComponentPath,
  isValidMenuPath,
  isValidPermissionCode,
} from '../../utils/validators'

const menus = ref<MenuTreeDto[]>([])
const loading = ref(false)
const messageApi = useMessage()

const showForm = ref(false)
const formMode = ref<'create' | 'edit'>('create')
const hasLoaded = ref(false)
const sorting = ref(false)

const filterForm = ref({
  menuName: '',
  path: '',
  permission: '',
  menuType: 'all' as 'all' | 1 | 2 | 3,
  status: 'all' as 'all' | 1 | 2,
  visible: 'all' as 'all' | 1 | 0,
})

const filterState = ref({
  menuName: '',
  path: '',
  permission: '',
  menuType: 'all' as 'all' | 1 | 2 | 3,
  status: 'all' as 'all' | 1 | 2,
  visible: 'all' as 'all' | 1 | 0,
})

const expandedRowKeys = ref<Array<string | number>>([])
const tableDensity = ref<'compact' | 'default' | 'comfortable'>('default')
const levelMode = ref<'all' | 1 | 2 | 3>('all')
const visibleColumns = ref<
  Array<'menuName' | 'menuType' | 'path' | 'permission' | 'status' | 'sort' | 'actions'>
>([
  'menuName',
  'menuType',
  'path',
  'permission',
  'status',
  'sort',
  'actions',
])
const isFullscreen = ref(false)
const draggingId = ref<string | null>(null)
const dragOverId = ref<string | null>(null)
const draggingParentId = ref<string>('0')

const permissionStore = usePermissionStore()
const { hasPermission, loadPermission } = permissionStore
const menuTreeStore = useMenuTreeStore()
const dialog = useDialog()

const form = ref({
  id: '',
  parentId: '0',
  menuName: '',
  menuType: 1,
  path: '',
  component: '',
  permission: '',
  icon: '',
  sort: 1,
  visible: true,
  status: 1,
  remark: '',
})

const densityOptions = [
  { label: '紧凑', key: 'compact' },
  { label: '默认', key: 'default' },
  { label: '宽松', key: 'comfortable' },
]

const menuTypeOptions = [
  { label: '全部类型', value: 'all' },
  { label: '目录', value: 1 },
  { label: '菜单', value: 2 },
  { label: '按钮', value: 3 },
]

const statusOptions = [
  { label: '全部状态', value: 'all' },
  { label: '启用', value: 1 },
  { label: '禁用', value: 2 },
]

const visibleOptions = [
  { label: '全部显示', value: 'all' },
  { label: '显示', value: 1 },
  { label: '隐藏', value: 0 },
]

const columnOptions = [
  { label: '菜单名称', value: 'menuName' },
  { label: '菜单类型', value: 'menuType' },
  { label: '路由', value: 'path' },
  { label: '权限标识', value: 'permission' },
  { label: '状态', value: 'status' },
  { label: '位序', value: 'sort' },
  { label: '操作', value: 'actions' },
]

const hasFilter = computed(() =>
  !!filterState.value.menuName
  || !!filterState.value.path
  || !!filterState.value.permission
  || filterState.value.menuType !== 'all'
  || filterState.value.status !== 'all'
  || filterState.value.visible !== 'all',
)

const canDrag = computed(() => !sorting.value && !hasFilter.value && hasPermission('sys:menu:edit'))

const filteredTree = computed(() => {
  const name = filterState.value.menuName.trim().toLowerCase()
  const path = filterState.value.path.trim().toLowerCase()
  const permission = filterState.value.permission.trim().toLowerCase()
  const menuType = filterState.value.menuType
  const status = filterState.value.status
  const visible = filterState.value.visible
  if (!name && !path && !permission && menuType === 'all' && status === 'all' && visible === 'all') return menus.value

  const match = (node: MenuTreeDto) => {
    const nameMatch = !name || node.menuName.toLowerCase().includes(name)
    const pathMatch = !path || (node.path || '').toLowerCase().includes(path)
    const permissionMatch = !permission || (node.permission || '').toLowerCase().includes(permission)
    const typeMatch = menuType === 'all' || node.menuType === menuType
    const statusMatch = status === 'all' || node.status === status
    const visibleMatch = visible === 'all' || node.visible === (visible === 1)
    return nameMatch && pathMatch && permissionMatch && typeMatch && statusMatch && visibleMatch
  }

  const walk = (nodes: MenuTreeDto[]): MenuTreeDto[] => {
    const result: MenuTreeDto[] = []
    nodes.forEach((node) => {
      const children = node.children?.length ? walk(node.children) : []
      if (match(node) || children.length > 0) {
        result.push({ ...node, children })
      }
    })
    return result
  }

  return walk(menus.value)
})

const expandableIds = computed(() => {
  const ids: string[] = []
  const walk = (nodes: MenuTreeDto[]) => {
    nodes.forEach((node) => {
      if (node.children && node.children.length > 0) {
        ids.push(node.id)
        walk(node.children)
      }
    })
  }
  walk(filteredTree.value)
  return ids
})

const isAllExpanded = computed(() => {
  const ids = expandableIds.value
  if (ids.length === 0) return false
  const set = new Set(expandedRowKeys.value.map((v) => String(v)))
  return ids.every((id) => set.has(String(id)))
})

const flatMenuOptions = computed(() => {
  const rows: Array<{ menu: MenuTreeDto; level: number }> = []
  const walk = (nodes: MenuTreeDto[], level: number) => {
    nodes.forEach((node) => {
      rows.push({ menu: node, level })
      if (node.children && node.children.length > 0) {
        walk(node.children, level + 1)
      }
    })
  }
  walk(menus.value, 0)
  return rows
})

function showMsg(msg: string, error = false) {
  if (!msg) return
  if (error) messageApi.error(msg)
  else messageApi.success(msg)
}

function clearMsg() {
  // no-op for toast messages
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

function statusLabel(s: number) {
  return s === 1 ? '启用' : '禁用'
}

function statusType(s: number) {
  return s === 1 ? 'success' : 'error'
}

function menuTypeStyle(t: number) {
  if (t === 1) return { label: '目录', type: 'default' as const, className: 'tag-dir' }
  if (t === 2) return { label: '菜单', type: 'info' as const, className: 'tag-menu' }
  return { label: '按钮', type: 'error' as const, className: 'tag-action' }
}

function applyLevelMode(mode = levelMode.value) {
  if (mode === 'all') {
    expandedRowKeys.value = [...expandableIds.value]
    return
  }
  const depth = Number(mode)
  const keys: string[] = []
  const walk = (nodes: MenuTreeDto[], level: number) => {
    if (level >= depth) return
    nodes.forEach((node) => {
      if (node.children && node.children.length > 0) {
        keys.push(node.id)
        walk(node.children, level + 1)
      }
    })
  }
  walk(filteredTree.value, 1)
  expandedRowKeys.value = keys
}

function findMenuById(nodes: MenuTreeDto[], id: string): MenuTreeDto | null {
  for (const node of nodes) {
    if (node.id === id) return node
    if (node.children && node.children.length > 0) {
      const found = findMenuById(node.children, id)
      if (found) return found
    }
  }
  return null
}

function getSiblingsRef(parentId: string) {
  if (!parentId || parentId === '0') return menus.value
  const parent = findMenuById(menus.value, parentId)
  return parent?.children ?? null
}

async function applySortUpdate(parentId: string, fromId: string, toId: string) {
  const siblings = getSiblingsRef(parentId)
  if (!siblings) return
  const fromIndex = siblings.findIndex((m) => m.id === fromId)
  const toIndex = siblings.findIndex((m) => m.id === toId)
  if (fromIndex < 0 || toIndex < 0 || fromIndex === toIndex) return

  const original = siblings.slice()
  const [moved] = siblings.splice(fromIndex, 1)
  siblings.splice(toIndex, 0, moved)

  const sortValues = siblings.map((m) => m.sort).sort((a, b) => a - b)
  const updates = siblings.map((menu, idx) => ({
    id: menu.id,
    sort: sortValues[idx],
  }))
  siblings.forEach((menu, idx) => {
    menu.sort = updates[idx].sort
  })

  sorting.value = true
  try {
    await updateMenuSort(updates)
    showMsg('排序已更新')
    menus.value = await menuTreeStore.fetch(true)
    if (levelMode.value === 'all') {
      expandedRowKeys.value = [...expandableIds.value]
    }
  } catch (e: any) {
    siblings.splice(0, siblings.length, ...original)
    showMsg(e.message, true)
  } finally {
    sorting.value = false
  }
}

function rowProps(row: MenuTreeDto) {
  const draggable = canDrag.value
  return {
    draggable,
    onDragstart: (e: DragEvent) => {
      if (!draggable) return
      draggingId.value = row.id
      draggingParentId.value = row.parentId || '0'
      dragOverId.value = null
      if (e.dataTransfer) {
        e.dataTransfer.effectAllowed = 'move'
        e.dataTransfer.setData('text/plain', row.id)
      }
    },
    onDragover: (e: DragEvent) => {
      if (!draggable || !draggingId.value) return
      if (row.id === draggingId.value) return
      if ((row.parentId || '0') !== draggingParentId.value) return
      e.preventDefault()
      dragOverId.value = row.id
    },
    onDrop: async () => {
      if (!draggingId.value) return
      if ((row.parentId || '0') !== draggingParentId.value) return
      const fromId = draggingId.value
      const toId = row.id
      draggingId.value = null
      dragOverId.value = null
      await applySortUpdate(row.parentId || '0', fromId, toId)
    },
    onDragend: () => {
      draggingId.value = null
      dragOverId.value = null
    },
    class: {
      'dragging-row': draggingId.value === row.id,
      'drag-over-row': dragOverId.value === row.id,
    },
  }
}

async function fetchMenus() {
  loading.value = true
  clearMsg()
  try {
    menus.value = await menuTreeStore.fetch()
    if (!hasLoaded.value) {
      applyLevelMode()
      hasLoaded.value = true
    }
  } catch (e: any) {
    showMsg(e.message, true)
  } finally {
    loading.value = false
  }
}

async function refreshMenus() {
  loading.value = true
  clearMsg()
  try {
    menus.value = await menuTreeStore.fetch(true)
    applyLevelMode()
  } catch (e: any) {
    showMsg(e.message, true)
  } finally {
    loading.value = false
  }
}

function resetFilters() {
  filterForm.value.menuName = ''
  filterForm.value.path = ''
  filterForm.value.permission = ''
  filterForm.value.menuType = 'all'
  filterForm.value.status = 'all'
  filterForm.value.visible = 'all'
  filterState.value.menuName = ''
  filterState.value.path = ''
  filterState.value.permission = ''
  filterState.value.menuType = 'all'
  filterState.value.status = 'all'
  filterState.value.visible = 'all'
  applyLevelMode()
}

function handleSearch() {
  filterState.value.menuName = filterForm.value.menuName.trim()
  filterState.value.path = filterForm.value.path.trim()
  filterState.value.permission = filterForm.value.permission.trim()
  filterState.value.menuType = filterForm.value.menuType
  filterState.value.status = filterForm.value.status
  filterState.value.visible = filterForm.value.visible
  if (hasFilter.value) {
    levelMode.value = 'all'
    applyLevelMode('all')
  } else {
    applyLevelMode()
  }
}

function toggleExpandAll() {
  if (isAllExpanded.value) {
    expandedRowKeys.value = []
    levelMode.value = 1
  } else {
    expandedRowKeys.value = [...expandableIds.value]
    levelMode.value = 'all'
  }
}

function toggleFullscreen() {
  isFullscreen.value = !isFullscreen.value
}

function handleDensitySelect(key: string | number) {
  if (key === 'compact' || key === 'default' || key === 'comfortable') {
    tableDensity.value = key
  }
}

function isVisibleColumn(
  key: 'menuName' | 'menuType' | 'path' | 'permission' | 'status' | 'sort' | 'actions',
) {
  return visibleColumns.value.includes(key)
}

function openCreate(parentId = '0') {
  formMode.value = 'create'
  form.value = {
    id: '',
    parentId,
    menuName: '',
    menuType: 1,
    path: '',
    component: '',
    permission: '',
    icon: '',
    sort: 1,
    visible: true,
    status: 1,
    remark: '',
  }
  showForm.value = true
}

async function openEdit(menu: MenuTreeDto) {
  formMode.value = 'edit'
  try {
    const res = await getMenuById(menu.id)
    const detail = res.data.data
    form.value = {
      id: detail.id,
      parentId: detail.parentId || '0',
      menuName: detail.menuName,
      menuType: detail.menuType,
      path: detail.path || '',
      component: detail.component || '',
      permission: detail.permission || '',
      icon: detail.icon || '',
      sort: Number(detail.sort ?? 1),
      visible: detail.visible,
      status: detail.status,
      remark: detail.remark || '',
    }
    showForm.value = true
  } catch (e: any) {
    showMsg(e.message, true)
  }
}

async function submitForm() {
  clearMsg()
  const menuName = form.value.menuName.trim()
  const path = form.value.path.trim()
  const component = form.value.component.trim()
  const permission = form.value.permission.trim()

  if (!menuName) {
    return showMsg('请输入菜单名称', true)
  }
  if ((form.value.menuType === 1 || form.value.menuType === 2) && path && !isValidMenuPath(path)) {
    return showMsg('路由路径需以 / 开头，仅支持字母/数字/_/-', true)
  }
  if (form.value.menuType === 2 && component && !isValidComponentPath(component)) {
    return showMsg('组件路径格式需类似 views/admin/UserList.vue', true)
  }
  if (permission && !isValidPermissionCode(permission)) {
    return showMsg('权限标识需以字母开头，仅支持字母/数字/:/_/-', true)
  }

  if (formMode.value === 'create') {
    const payload: MenuCreateDto = {
      parentId: form.value.parentId,
      menuName,
      menuType: form.value.menuType,
      path: path || undefined,
      component: component || undefined,
      permission: permission || undefined,
      icon: form.value.icon || undefined,
      sort: form.value.sort,
      visible: form.value.visible,
      status: form.value.status,
      remark: form.value.remark || undefined,
    }
    try {
      await createMenu(payload)
      showMsg('创建成功')
      await loadPermission()
      await menuTreeStore.fetch(true)
      showForm.value = false
      fetchMenus()
    } catch (e: any) {
      showMsg(e.message, true)
    }
    return
  }

  const payload: MenuUpdateDto = {
    id: form.value.id,
    parentId: form.value.parentId,
    menuName,
    menuType: form.value.menuType,
    path: path || undefined,
    component: component || undefined,
    permission: permission || undefined,
    icon: form.value.icon || undefined,
    sort: form.value.sort,
    visible: form.value.visible,
    status: form.value.status,
    remark: form.value.remark || undefined,
  }
  try {
    await updateMenu(payload)
    showMsg('更新成功')
    await loadPermission()
    await menuTreeStore.fetch(true)
    showForm.value = false
    fetchMenus()
  } catch (e: any) {
    showMsg(e.message, true)
  }
}

async function handleDelete(menu: MenuTreeDto) {
  const ok = await confirmAction(`确认删除菜单 ${menu.menuName} 吗？`)
  if (!ok) return
  try {
    await deleteMenu(menu.id)
    showMsg('删除成功')
    await loadPermission()
    await menuTreeStore.fetch(true)
    fetchMenus()
  } catch (e: any) {
    showMsg(e.message, true)
  }
}

const columns = computed<DataTableColumns<MenuTreeDto>>(() => {
  const cols: DataTableColumns<MenuTreeDto> = []

  if (isVisibleColumn('menuName')) {
    cols.push({
      title: '名称',
      key: 'menuName',
      render: (row) => h('span', { class: 'menu-name' }, row.menuName),
    })
  }

  if (isVisibleColumn('menuType')) {
    cols.push({
      title: '类型',
      key: 'menuType',
      render: (row) => {
        const meta = menuTypeStyle(row.menuType)
        return h(NTag, { size: 'small', type: meta.type, class: meta.className }, { default: () => meta.label })
      },
    })
  }

  if (isVisibleColumn('path')) {
    cols.push({
      title: '路由',
      key: 'path',
      render: (row) => row.path || '-',
    })
  }

  if (isVisibleColumn('permission')) {
    cols.push({
      title: '权限标识',
      key: 'permission',
      render: (row) => row.permission || '-',
    })
  }

  if (isVisibleColumn('status')) {
    cols.push({
      title: '状态',
      key: 'status',
      render: (row) =>
        h(NTag, { size: 'small', type: statusType(row.status) as any }, { default: () => statusLabel(row.status) }),
    })
  }

  if (isVisibleColumn('sort')) {
    cols.push({
      title: '位序',
      key: 'sort',
      render: (row) =>
        h('div', { class: 'sort-cell' }, [
          h('span', { class: ['drag-handle', { disabled: !canDrag.value }] }),
          h('span', { class: 'sort-value' }, String(row.sort)),
        ]),
    })
  }

  if (isVisibleColumn('actions')) {
    cols.push({
      title: '操作',
      key: 'actions',
      render: (row) => {
        const actions: any[] = []
        if (hasPermission('sys:menu:add')) {
          actions.push(
            h(NTooltip, null, {
              default: () => '新增子级',
              trigger: () =>
                h(
                  NButton,
                  { size: 'small', quaternary: true, type: 'primary', class: 'action-btn', onClick: () => openCreate(row.id) },
                  {
                    icon: () =>
                      h(NIcon, null, {
                        default: () => h(Add),
                      }),
                  },
                ),
            }),
          )
        }
        if (hasPermission('sys:menu:edit')) {
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
        if (hasPermission('sys:menu:delete')) {
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

onMounted(fetchMenus)
</script>

<template>
  <n-card title="菜单管理" size="large" :class="['menu-card', { fullscreen: isFullscreen }]">
    <div class="filter-panel">
      <n-form inline :show-feedback="false" class="filter-form">
        <n-form-item label="菜单名称">
          <n-input v-model:value="filterForm.menuName" placeholder="请输入菜单名称" clearable style="width: 200px;" />
        </n-form-item>
        <n-form-item label="路由地址">
          <n-input v-model:value="filterForm.path" placeholder="请输入路由地址" clearable style="width: 220px;" />
        </n-form-item>
        <n-form-item label="权限标识">
          <n-input v-model:value="filterForm.permission" placeholder="请输入权限标识" clearable style="width: 220px;" />
        </n-form-item>
        <n-form-item label="菜单类型">
          <n-select v-model:value="filterForm.menuType" :options="menuTypeOptions" style="width: 160px;" />
        </n-form-item>
        <n-form-item label="状态">
          <n-select v-model:value="filterForm.status" :options="statusOptions" style="width: 140px;" />
        </n-form-item>
        <n-form-item label="显示">
          <n-select v-model:value="filterForm.visible" :options="visibleOptions" style="width: 140px;" />
        </n-form-item>
        <div class="filter-actions">
          <n-button secondary @click="resetFilters">重置</n-button>
          <n-button type="primary" @click="handleSearch">查询</n-button>
        </div>
      </n-form>
    </div>

    <div class="table-panel">
      <div class="table-toolbar">
        <div class="table-toolbar-left">
          <n-button v-permission="'sys:menu:add'" type="primary" @click="openCreate()">添加菜单</n-button>
          <n-button secondary @click="toggleExpandAll">{{ isAllExpanded ? '折叠' : '展开' }}</n-button>
          <div class="level-switch">
            <span class="level-label">层级</span>
            <n-radio-group v-model:value="levelMode" size="small" @update:value="applyLevelMode">
              <n-radio-button value="all">全部</n-radio-button>
              <n-radio-button :value="1">一级</n-radio-button>
              <n-radio-button :value="2">二级</n-radio-button>
              <n-radio-button :value="3">三级</n-radio-button>
            </n-radio-group>
          </div>
        </div>
        <div class="table-tools">
          <n-tooltip>
            <template #trigger>
              <n-button quaternary size="small" @click="refreshMenus">
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
        :columns="columns"
        :data="filteredTree"
        :loading="loading"
        :bordered="false"
        :class="['menu-table', `density-${tableDensity}`]"
        :row-key="(row) => row.id"
        v-model:expanded-row-keys="expandedRowKeys"
        :row-props="rowProps"
      />
    </div>
  </n-card>

  <n-modal v-model:show="showForm">
    <n-card style="width: min(860px, 94vw);" :title="formMode === 'create' ? '新建菜单' : '编辑菜单'">
      <n-form>
        <n-space wrap size="large">
          <n-form-item label="上级菜单">
            <n-select
              v-model:value="form.parentId"
              :options="[
                { label: '根目录', value: '0' },
                ...flatMenuOptions.map((row) => ({
                  label: `${'—'.repeat(row.level)} ${row.menu.menuName}`,
                  value: row.menu.id,
                })),
              ]"
              style="width: 240px;"
            />
          </n-form-item>
          <n-form-item label="菜单名称">
            <n-input v-model:value="form.menuName" />
          </n-form-item>
          <n-form-item label="类型">
            <n-select
              v-model:value="form.menuType"
              :options="[
                { label: '目录', value: 1 },
                { label: '菜单', value: 2 },
                { label: '按钮', value: 3 },
              ]"
              style="width: 160px;"
            />
          </n-form-item>
          <n-form-item label="路由路径">
            <n-input v-model:value="form.path" placeholder="/admin/users" />
          </n-form-item>
          <n-form-item label="组件路径">
            <n-input v-model:value="form.component" placeholder="views/admin/UserList.vue" />
          </n-form-item>
          <n-form-item label="权限标识">
            <n-input v-model:value="form.permission" placeholder="sys:user:list" />
          </n-form-item>
          <n-form-item label="图标">
            <n-input v-model:value="form.icon" placeholder="user" />
          </n-form-item>
          <n-form-item label="位序">
            <n-input-number v-model:value="form.sort" min="0" style="width: 160px;" />
          </n-form-item>
          <n-form-item label="显示">
            <n-switch v-model:value="form.visible">
              <template #checked> 显示 </template>
              <template #unchecked> 隐藏 </template>
            </n-switch>
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
</template>

<style scoped>
.muted {
  color: var(--color-text-muted);
}

.menu-card.fullscreen {
  position: fixed;
  inset: 16px;
  z-index: 1000;
  margin: 0;
}

.menu-card.fullscreen :deep(.n-card__content) {
  max-height: calc(100vh - 140px);
  overflow: auto;
}

.menu-name {
  line-height: 1.2;
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

.table-panel {
  margin-top: 18px;
}

.table-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 12px;
}

.table-toolbar-left {
  display: inline-flex;
  align-items: center;
  gap: 8px;
}

.level-switch {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  margin-left: 8px;
  padding-left: 8px;
  border-left: 1px dashed var(--color-border);
}

.level-label {
  font-size: 0.85rem;
  color: var(--color-text-muted);
}

.table-tools {
  display: inline-flex;
  align-items: center;
  gap: 6px;
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

.menu-table.density-compact :deep(.n-data-table-th),
.menu-table.density-compact :deep(.n-data-table-td) {
  padding-top: 6px;
  padding-bottom: 6px;
}

.menu-table.density-default :deep(.n-data-table-th),
.menu-table.density-default :deep(.n-data-table-td) {
  padding-top: 12px;
  padding-bottom: 12px;
}

.menu-table.density-comfortable :deep(.n-data-table-th),
.menu-table.density-comfortable :deep(.n-data-table-td) {
  padding-top: 18px;
  padding-bottom: 18px;
}

.menu-table :deep(.n-data-table-th) {
  color: var(--color-text-main);
  font-weight: 600;
}

.menu-table :deep(.n-data-table-td) {
  color: var(--color-text-main);
  border-bottom: 1px solid var(--color-border);
}

.menu-table :deep(.dragging-row) {
  opacity: 0.6;
  background: var(--color-bg-light);
}

.menu-table :deep(.drag-over-row) {
  background: rgba(59, 130, 246, 0.12);
}

.menu-table :deep(.n-data-table-tr) {
  transition: background 0.12s ease, opacity 0.12s ease;
}

.sort-cell {
  display: inline-flex;
  align-items: center;
  gap: 8px;
}

.sort-value {
  min-width: 20px;
}

.drag-handle {
  width: 12px;
  height: 16px;
  border-radius: 3px;
  color: var(--color-text-muted);
  background-image:
    radial-gradient(currentColor 1.2px, transparent 1.2px),
    radial-gradient(currentColor 1.2px, transparent 1.2px);
  background-size: 4px 4px;
  background-position: 0 0, 2px 2px;
  opacity: 0.55;
  cursor: grab;
}

.drag-handle:hover {
  color: var(--color-text-main);
}

.drag-handle.disabled {
  opacity: 0.2;
  cursor: not-allowed;
}

.drag-handle.disabled:hover {
  color: var(--color-text-muted);
}

.tag-menu :deep(.n-tag__border) {
  border-color: rgba(59, 130, 246, 0.35);
}

.tag-menu :deep(.n-tag__content) {
  color: #2563eb;
}

.tag-action :deep(.n-tag__border) {
  border-color: rgba(239, 68, 68, 0.35);
}

.tag-action :deep(.n-tag__content) {
  color: #dc2626;
}

.tag-dir :deep(.n-tag__border) {
  border-color: rgba(148, 163, 184, 0.45);
}

.tag-dir :deep(.n-tag__content) {
  color: #64748b;
}
</style>
