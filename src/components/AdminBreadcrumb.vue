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

const normalizePath = (value?: string) => {
  if (!value) return ''
  return value.replace(/\/+$/, '')
}

const matchPaths = (candidate: string, targets: string[]) => {
  const normalized = normalizePath(candidate)
  return targets.some((target) => normalizePath(target) === normalized)
}

const findPath = (nodes: MenuTreeDto[], targets: string[], stack: MenuTreeDto[] = []): MenuTreeDto[] | null => {
  for (const node of nodes) {
    const next = [...stack, node]
    if (node.menuType === 2 && node.path && matchPaths(node.path, targets)) {
      return next
    }
    if (node.children?.length) {
      const found = findPath(node.children, targets, next)
      if (found) return found
    }
  }
  return null
}

const breadcrumbs = computed(() => {
  if (!route.path.startsWith('/admin')) return []
  const pathTargets = [route.path]
  if (route.path.startsWith('/admin/')) {
    pathTargets.push(route.path.replace(/^\/admin/, ''))
  }
  const list = findPath(menus.value || [], pathTargets) || []
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

  if (items.length > 0) {
    if (items[0]?.label !== '管理后台') {
      items.unshift({ label: '管理后台', path: '/admin', id: -1 })
    }
    return items
  }

  const matched = route.matched.map((record, index) => {
      if (record.path === '/admin') {
        return { label: '管理后台', path: '/admin', id: -1 }
      }
      return {
        label: record.meta?.title?.toString() || record.name?.toString() || record.path,
        path: record.path,
        id: -10 - index,
      }
    })

  if (matched.length > 0) return matched
  return [{ label: route.name?.toString() || '管理后台', path: route.path, id: 0 }]
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
