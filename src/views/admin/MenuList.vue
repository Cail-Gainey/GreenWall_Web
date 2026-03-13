<script setup lang="ts">
/**
 * @file 菜单/权限管理：Naive UI DataTable + Modal。
 */
import { computed, h, onMounted, ref } from 'vue'
import {
  NAlert,
  NButton,
  NCard,
  NDataTable,
  NForm,
  NFormItem,
  NInput,
  NInputNumber,
  NModal,
  NSelect,
  NSpace,
  NSwitch,
  NTag,
  type DataTableColumns,
} from 'naive-ui'
import { createMenu, deleteMenu, getMenuById, updateMenu } from '../../api/menu'
import { useMenuTreeStore } from '../../stores/menuTree'
import { usePermissionStore } from '../../stores/permission'
import type { MenuCreateDto, MenuTreeDto, MenuUpdateDto } from '../../api/types'

const menus = ref<MenuTreeDto[]>([])
const loading = ref(false)
const message = ref('')
const isError = ref(false)

const showForm = ref(false)
const formMode = ref<'create' | 'edit'>('create')

const permissionStore = usePermissionStore()
const { hasPermission, loadPermission } = permissionStore
const menuTreeStore = useMenuTreeStore()

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

const flatMenus = computed(() => {
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
  message.value = msg
  isError.value = error
}

function clearMsg() {
  message.value = ''
  isError.value = false
}

function typeLabel(t: number) {
  if (t === 1) return '目录'
  if (t === 2) return '菜单'
  return '按钮'
}

function statusLabel(s: number) {
  return s === 1 ? '启用' : '禁用'
}

function statusType(s: number) {
  return s === 1 ? 'success' : 'error'
}

async function fetchMenus() {
  loading.value = true
  clearMsg()
  try {
    menus.value = await menuTreeStore.fetch()
  } catch (e: any) {
    showMsg(e.message, true)
  } finally {
    loading.value = false
  }
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
      sort: detail.sort,
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
  if (!form.value.menuName.trim()) {
    return showMsg('请输入菜单名称', true)
  }

  if (formMode.value === 'create') {
    const payload: MenuCreateDto = {
      parentId: form.value.parentId,
      menuName: form.value.menuName.trim(),
      menuType: form.value.menuType,
      path: form.value.path || undefined,
      component: form.value.component || undefined,
      permission: form.value.permission || undefined,
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
    menuName: form.value.menuName.trim(),
    menuType: form.value.menuType,
    path: form.value.path || undefined,
    component: form.value.component || undefined,
    permission: form.value.permission || undefined,
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
  if (!confirm(`确认删除菜单 ${menu.menuName} 吗？`)) return
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

const columns = computed<DataTableColumns<{ menu: MenuTreeDto; level: number }>>(() => [
  {
    title: '名称',
    key: 'menuName',
    render: (row) =>
      h(
        'div',
        { style: { paddingLeft: `${row.level * 16}px`, fontWeight: '600' } },
        row.menu.menuName,
      ),
  },
  {
    title: '类型',
    key: 'menuType',
    render: (row) => typeLabel(row.menu.menuType),
  },
  {
    title: '路径',
    key: 'path',
    render: (row) => row.menu.path || '-',
  },
  {
    title: '权限标识',
    key: 'permission',
    render: (row) => row.menu.permission || '-',
  },
  {
    title: '状态',
    key: 'status',
    render: (row) =>
      h(NTag, { size: 'small', type: statusType(row.menu.status) as any }, { default: () => statusLabel(row.menu.status) }),
  },
  {
    title: '排序',
    key: 'sort',
    render: (row) => row.menu.sort,
  },
  {
    title: '操作',
    key: 'actions',
    render: (row) => {
      const actions: any[] = []
      if (hasPermission('sys:menu:add')) {
        actions.push(
          h(
            NButton,
            { size: 'tiny', quaternary: true, onClick: () => openCreate(row.menu.id) },
            { default: () => '新增子级' },
          ),
        )
      }
      if (hasPermission('sys:menu:edit')) {
        actions.push(
          h(
            NButton,
            { size: 'tiny', quaternary: true, onClick: () => openEdit(row.menu) },
            { default: () => '编辑' },
          ),
        )
      }
      if (hasPermission('sys:menu:delete')) {
        actions.push(
          h(
            NButton,
            { size: 'tiny', quaternary: true, type: 'error', onClick: () => handleDelete(row.menu) },
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

onMounted(fetchMenus)
</script>

<template>
  <n-card title="菜单管理" size="large">
    <template #header-extra>
      <n-button v-permission="'sys:menu:add'" type="primary" @click="openCreate()">新建菜单</n-button>
    </template>

    <n-space vertical size="large">
      <n-alert v-if="message" :type="isError ? 'error' : 'success'">
        {{ message }}
      </n-alert>

      <n-data-table :columns="columns" :data="flatMenus" :loading="loading" :bordered="false" />
    </n-space>
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
                ...flatMenus.map((row) => ({
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
          <n-form-item label="排序">
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
