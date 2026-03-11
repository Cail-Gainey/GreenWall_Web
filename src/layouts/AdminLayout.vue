<script setup lang="ts">
/**
 * @file 管理端布局：展示管理端侧边栏与顶部栏占位。
 */
import AppLayout from './AppLayout.vue'
</script>

<template>
  <AppLayout>
    <template #sidebar>
      <!-- Admin Sidebar Placeholder -->
      <aside style="width: 200px; background: var(--color-surface); border-right: 1px solid var(--color-border); padding: 10px;">
        <h3>Admin Menu</h3>
        <ul>
          <li>Dashboard</li>
          <li>Users</li>
          <li>Settings</li>
        </ul>
      </aside>
    </template>
    
    <template #header>
      <!-- Admin Header Placeholder -->
      <header style="height: 64px; background: var(--color-surface); border-bottom: 1px solid var(--color-border); padding: 0 20px; display: flex; align-items: center;">
        <h2>GreenWall Admin</h2>
      </header>
    </template>
    
    <template #main>
      <router-view></router-view>
    </template>
  </AppLayout>
</template>
