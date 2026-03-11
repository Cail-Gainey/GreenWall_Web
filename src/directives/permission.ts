/**
 * @file v-permission 指令：按钮级权限控制。
 * 用法: v-permission="'sys:user:add'" 或 v-permission="['sys:user:add', 'sys:user:edit']"
 */
import type { App, Directive } from 'vue'
import { usePermissionStore } from '../stores/permission'

const permissionDirective: Directive<HTMLElement, string | string[]> = {
  mounted(el, binding) {
    const { hasPermission } = usePermissionStore()
    const value = binding.value

    if (!value) return

    const perms = Array.isArray(value) ? value : [value]
    const hasPerm = perms.some((p) => hasPermission(p))

    if (!hasPerm) {
      el.parentNode?.removeChild(el)
    }
  },
}

export function setupPermissionDirective(app: App) {
  app.directive('permission', permissionDirective)
}
