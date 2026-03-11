<script setup lang="ts">
/**
 * @file 角色管理：Naive UI DataTable + 权限分配。
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
  NTag,
  NCheckbox,
  NCheckboxGroup,
  type DataTableColumns,
} from 'naive-ui'
import { createRole, deleteRole, getAllRoles, getRoleById, updateRole } from '../../api/role'
import { getMenuTree } from '../../api/menu'
import type { MenuTreeDto, RoleCreateDto, RoleDto, RoleUpdateDto } from '../../api/types'

const roles = ref<RoleDto[]>([])
const menus = ref<MenuTreeDto[]>([])
const loading = ref(false)
const message = ref('')
const isError = ref(false)

const showForm = ref(false)
const formMode = ref<'create' | 'edit'>('create')

const form = ref({
  id: '',
  roleName: '',
  roleCode: '',
  sort: 1,
  status: 1,
  remark: '',
  menuIds: [] as string[],
})

const menuFlat = computed(() => {
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

function statusLabel(s: number) {
  return s === 1 ? '启用' : '禁用'
}

function statusType(s: number) {
  return s === 1 ? 'success' : 'error'
}

function typeLabel(t: number) {
  if (t === 1) return '目录'
  if (t === 2) return '菜单'
  return '按钮'
}

async function fetchRoles() {
  loading.value = true
  clearMsg()
  try {
    const res = await getAllRoles()
    roles.value = res.data.data || []
  } catch (e: any) {
    showMsg(e.message, true)
  } finally {
    loading.value = false
  }
}

async function fetchMenus() {
  try {
    const res = await getMenuTree()
    menus.value = res.data.data || []
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
  if (!form.value.roleName.trim()) {
    return showMsg('请输入角色名称', true)
  }
  if (!form.value.roleCode.trim()) {
    return showMsg('请输入角色编码', true)
  }

  if (formMode.value === 'create') {
    const payload: RoleCreateDto = {
      roleName: form.value.roleName.trim(),
      roleCode: form.value.roleCode.trim(),
      sort: form.value.sort,
      status: form.value.status,
      remark: form.value.remark || undefined,
      menuIds: form.value.menuIds,
    }
    try {
      await createRole(payload)
      showMsg('创建成功')
      showForm.value = false
      fetchRoles()
    } catch (e: any) {
      showMsg(e.message, true)
    }
    return
  }

  const payload: RoleUpdateDto = {
    id: form.value.id,
    roleName: form.value.roleName.trim(),
    roleCode: form.value.roleCode.trim(),
    sort: form.value.sort,
    status: form.value.status,
    remark: form.value.remark || undefined,
    menuIds: form.value.menuIds,
  }
  try {
    await updateRole(payload)
    showMsg('更新成功')
    showForm.value = false
    fetchRoles()
  } catch (e: any) {
    showMsg(e.message, true)
  }
}

async function handleDelete(role: RoleDto) {
  if (!confirm(`确认删除角色 ${role.roleName} 吗？`)) return
  try {
    await deleteRole(role.id)
    showMsg('删除成功')
    fetchRoles()
  } catch (e: any) {
    showMsg(e.message, true)
  }
}

const columns = computed<DataTableColumns<RoleDto>>(() => [
  { title: '角色名称', key: 'roleName' },
  { title: '编码', key: 'roleCode' },
  {
    title: '状态',
    key: 'status',
    render: (row) =>
      h(NTag, { size: 'small', type: statusType(row.status) as any }, { default: () => statusLabel(row.status) }),
  },
  { title: '排序', key: 'sort' },
  {
    title: '备注',
    key: 'remark',
    render: (row) => row.remark || '-',
  },
  {
    title: '操作',
    key: 'actions',
    render: (row) =>
      h(
        NSpace,
        { size: 'small' },
        {
          default: () => [
            h(
              NButton,
              { size: 'tiny', quaternary: true, onClick: () => openEdit(row) },
              { default: () => '编辑' },
            ),
            h(
              NButton,
              { size: 'tiny', quaternary: true, type: 'error', onClick: () => handleDelete(row) },
              { default: () => '删除' },
            ),
          ],
        },
      ),
  },
])

onMounted(async () => {
  await Promise.all([fetchRoles(), fetchMenus()])
})
</script>

<template>
  <n-card title="角色管理" size="large">
    <template #header-extra>
      <n-button type="primary" @click="openCreate">新建角色</n-button>
    </template>

    <n-space vertical size="large">
      <n-alert v-if="message" :type="isError ? 'error' : 'success'">
        {{ message }}
      </n-alert>

      <n-data-table :columns="columns" :data="roles" :loading="loading" :bordered="false" />
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
            <n-input v-model:value="form.roleCode" :disabled="formMode === 'edit'" />
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

        <div class="menu-block">
          <div class="menu-title">权限菜单</div>
          <n-checkbox-group v-model:value="form.menuIds">
            <n-space vertical>
              <n-checkbox
                v-for="row in menuFlat"
                :key="row.menu.id"
                :value="row.menu.id"
                :style="{ marginLeft: `${row.level * 16}px` }"
              >
                <span class="menu-name">{{ row.menu.menuName }}</span>
                <span class="menu-meta">{{ typeLabel(row.menu.menuType) }}</span>
                <span class="menu-meta">{{ row.menu.permission || '-' }}</span>
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
</template>

<style scoped>
.menu-block {
  margin-top: 12px;
  padding: 12px;
  border: 1px solid var(--color-border);
  border-radius: 8px;
  background: var(--color-bg-light);
}

.menu-title {
  font-weight: 600;
  margin-bottom: 10px;
}

.menu-name {
  font-weight: 600;
  margin-right: 8px;
}

.menu-meta {
  color: var(--color-text-muted);
  font-size: 0.75rem;
  margin-left: 6px;
}
</style>
