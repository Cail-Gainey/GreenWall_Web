<script setup lang="ts">
/**
 * @file 系统设置视图：运维令牌强制与开放注册。
 */
import { computed, onMounted, ref } from 'vue'
import { NCard, NForm, NFormItem, NSwitch, NButton, NSpace, NDivider, useDialog, useMessage } from 'naive-ui'
import { getSystemConfig, updateSystemConfig, runSystemMigration } from '../../api/systemConfig'
import { usePermissionStore } from '../../stores/permission'
import { TimeFormatter } from '../../utils/time'

const loading = ref(false)
const saving = ref(false)
const migrating = ref(false)
const messageApi = useMessage()
const dialog = useDialog()

const allowRegister = ref(true)
const forceOpsToken = ref(false)
const emailVerifyEnabled = ref(true)
const githubOAuthEnabled = ref(true)
const dataMigrationLastTime = ref<string | null>(null)
const autoDataMigrationOnStartup = ref(true)

const permissionStore = usePermissionStore()
const canEdit = computed(() => permissionStore.hasPermission('sys:config:edit'))
const canMigrate = computed(() => permissionStore.hasPermission('sys:config:migrate'))

const showMsg = (msg: string, error = false) => {
  if (!msg) return
  if (error) messageApi.error(msg)
  else messageApi.success(msg)
}

const load = async () => {
  loading.value = true
  try {
    const res = await getSystemConfig()
    allowRegister.value = res.data.data.allowRegister
    forceOpsToken.value = res.data.data.forceOpsToken
    emailVerifyEnabled.value = res.data.data.emailVerifyEnabled
    githubOAuthEnabled.value = res.data.data.githubOAuthEnabled
    dataMigrationLastTime.value = res.data.data.dataMigrationLastTime || null
    autoDataMigrationOnStartup.value = res.data.data.autoDataMigrationOnStartup
  } catch (e: any) {
    showMsg(e?.message || '获取系统设置失败', true)
  } finally {
    loading.value = false
  }
}

const runMigration = () => {
  if (!canMigrate.value) return
  dialog.warning({
    title: '确认执行数据迁移？',
    content: '执行数据迁移会同步表结构与初始化数据，请确保当前无高频写入任务。',
    positiveText: '执行迁移',
    negativeText: '取消',
    onPositiveClick: async () => {
      migrating.value = true
      try {
        await runSystemMigration()
        await load()
        showMsg('数据迁移已完成')
      } catch (e: any) {
        showMsg(e?.message || '数据迁移失败', true)
      } finally {
        migrating.value = false
      }
    },
  })
}

const save = async () => {
  if (!canEdit.value) return
  saving.value = true
  try {
    await updateSystemConfig({
      allowRegister: allowRegister.value,
      forceOpsToken: forceOpsToken.value,
      emailVerifyEnabled: emailVerifyEnabled.value,
      githubOAuthEnabled: githubOAuthEnabled.value,
      autoDataMigrationOnStartup: autoDataMigrationOnStartup.value,
    })
    showMsg('设置已保存')
  } catch (e: any) {
    showMsg(e?.message || '保存失败', true)
  } finally {
    saving.value = false
  }
}

onMounted(load)
</script>

<template>
  <n-card title="系统设置" size="large">
    <n-space vertical size="large">
      <n-form :disabled="loading">
        <n-form-item label="开放注册">
          <n-space align="center" size="small">
            <n-switch v-model:value="allowRegister" :disabled="!canEdit" />
            <span class="hint">关闭后将禁止新用户自助注册</span>
          </n-space>
        </n-form-item>
        <n-form-item label="强制运维令牌">
          <n-space align="center" size="small">
            <n-switch v-model:value="forceOpsToken" :disabled="!canEdit" />
            <span class="hint">开启后运维接口必须携带 X-Ops-Token</span>
          </n-space>
        </n-form-item>
        <n-form-item label="邮箱验证码">
          <n-space align="center" size="small">
            <n-switch v-model:value="emailVerifyEnabled" :disabled="!canEdit" />
            <span class="hint">关闭后注册/重置密码不再校验邮箱验证码</span>
          </n-space>
        </n-form-item>
        <n-form-item label="GitHub OAuth">
          <n-space align="center" size="small">
            <n-switch v-model:value="githubOAuthEnabled" :disabled="!canEdit" />
            <span class="hint">关闭后无法进行 GitHub 授权连接</span>
          </n-space>
        </n-form-item>
      </n-form>

      <n-divider />

      <div class="section-title">数据迁移</div>
      <n-form :disabled="loading">
        <n-form-item label="启动时自动迁移">
          <n-space align="center" size="small">
            <n-switch v-model:value="autoDataMigrationOnStartup" :disabled="!canEdit" />
            <span class="hint">关闭后服务重启不会自动执行迁移，仅支持手动执行</span>
          </n-space>
        </n-form-item>
      </n-form>
      <n-space align="center" size="small">
        <span class="hint">最近执行：</span>
        <span class="value">{{ TimeFormatter.formatDateTime(dataMigrationLastTime) }}</span>
      </n-space>
      <n-space justify="end">
        <n-button
          v-permission="'sys:config:migrate'"
          type="warning"
          :loading="migrating"
          :disabled="!canMigrate"
          @click="runMigration"
        >执行数据迁移</n-button>
      </n-space>

      <n-space justify="end">
        <n-button v-permission="'sys:config:edit'" type="primary" :loading="saving" @click="save">保存设置</n-button>
      </n-space>
    </n-space>
  </n-card>
</template>

<style scoped>
.hint {
  color: var(--color-text-muted);
  font-size: 12px;
}

.section-title {
  font-weight: 600;
  font-size: 14px;
  color: var(--color-text-main);
}

.value {
  color: var(--color-text-main);
  font-size: 12px;
}
</style>
