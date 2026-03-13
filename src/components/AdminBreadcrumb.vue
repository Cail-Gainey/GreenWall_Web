<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { storeToRefs } from 'pinia'
import { NBreadcrumb, NBreadcrumbItem } from 'naive-ui'
import { usePermissionStore } from '../stores/permission'
import type { MenuTreeDto } from '../api/types'

const route = useRoute()
const permissionStore = usePermissionStore()
const { menus } = storeToRefs(permissionStore)

const findPath = (nodes: MenuTreeDto[], path: string, stack: MenuTreeDto[] = []): MenuTreeDto[] | null => {
  for (const node of nodes) {
    const next = [...stack, node]
    if (node.menuType === 2 && node.path === path) {
      return next
    }
    if (node.children?.length) {
      const found = findPath(node.children, path, next)
      if (found) return found
    }
  }
  return null
}

const breadcrumbs = computed(() => {
  if (!route.path.startsWith('/admin')) return []
  const list = findPath(menus.value || [], route.path) || []
  const uniq = new Set<number>()
  const items = list
    .filter((m) => m.menuType !== 3)
    .filter((m) => {
      if (uniq.has(m.id)) return false
      uniq.add(m.id)
      return true
    })
    .map((m) => ({
      label: m.menuName,
      path: m.path,
      id: m.id,
    }))

  if (items.length === 0) {
    items.push({ label: route.name?.toString() || '管理后台', path: route.path, id: 0 })
  }
  return items
})
</script>

<template>
  <n-breadcrumb>
    <n-breadcrumb-item
      v-for="item in breadcrumbs"
      :key="item.id"
    >
      {{ item.label }}
    </n-breadcrumb-item>
  </n-breadcrumb>
</template>
