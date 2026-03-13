<script setup lang="ts">
/**
 * @file 管理端顶部栏组件：独立于前台 Header。
 */
import { computed } from "vue";
import { NButton, NDropdown, NSpace, NAvatar } from "naive-ui";
import { useTheme, type Theme } from "../composables/useTheme";
import { usePermissionStore } from "../stores/permission";
import type { UserProfileDto } from "../api/types";
import userAvatarFallback from "../assets/user.png";
import logoUrl from "../assets/logo.png";

const props = defineProps<{
    user: UserProfileDto | null;
    showBrand?: boolean;
}>();

const emit = defineEmits<{
    openProfile: [];
    logout: [];
}>();

const { currentTheme, setTheme } = useTheme();
const { hasPermission } = usePermissionStore();

const themeOptions = [
    { label: "浅色", key: "light" },
    { label: "暗色", key: "dark" },
    { label: "紫色", key: "purple" },
    { label: "粉色", key: "pink" },
    { label: "海蓝", key: "ocean" },
    { label: "琥珀", key: "amber" },
    { label: "石板", key: "slate" },
    { label: "莫奈", key: "monet" },
    { label: "系统", key: "auto" },
];

const profileOptions = computed(() => {
    const options: Array<{ label: string; key: string }> = [];
    if (hasPermission("app:profile:view")) {
        options.push({ label: "个人信息", key: "profile" });
    }
    options.push({ label: "退出登录", key: "logout" });
    return options;
});

const avatarSrc = computed(() => {
    if (!props.user?.avatar) return userAvatarFallback;
    return props.user.avatar.trim();
});

function handleThemeSelect(key: string | number) {
    setTheme(key as Theme);
}

function handleProfileSelect(key: string | number) {
    if (key === "profile") {
        emit("openProfile");
        return;
    }
    if (key === "logout") emit("logout");
}
</script>

<template>
    <div class="admin-header">
        <div class="header-left">
            <div v-if="showBrand !== false" class="brand">
                <div class="brand-badge">
                    <img :src="logoUrl" alt="logo" class="brand-logo" />
                </div>
                <div>
                    <div class="brand-title">Green Wall</div>
                    <div class="brand-sub">Admin Console</div>
                </div>
            </div>
            <slot name="left"></slot>
        </div>

        <n-space align="center">
            <n-dropdown :options="themeOptions" @select="handleThemeSelect">
                <n-button quaternary size="small">
                    主题：{{ currentTheme }}
                </n-button>
            </n-dropdown>

            <template v-if="user">
                <n-dropdown
                    :options="profileOptions"
                    @select="handleProfileSelect"
                >
                    <n-button quaternary size="small">
                        <n-space align="center" size="small">
                            <n-avatar
                                size="small"
                                :src="avatarSrc"
                                :fallback-src="userAvatarFallback"
                                :img-props="{ referrerpolicy: 'no-referrer' }"
                            />
                            <span>{{ user.nickName || user.account }}</span>
                        </n-space>
                    </n-button>
                </n-dropdown>
            </template>
            <n-button v-else type="primary" size="small" @click="emit('logout')"
                >退出</n-button
            >
        </n-space>
    </div>
</template>

<style scoped>
.admin-header {
    height: 64px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0 20px;
    border-bottom: 1px solid var(--color-border);
    background: var(--color-surface);
}

.header-left {
    display: flex;
    align-items: center;
    gap: 12px;
}

.brand {
    display: flex;
    align-items: center;
    gap: 12px;
}

.brand-badge {
    width: 32px;
    height: 32px;
    border-radius: 10px;
    background: var(--color-primary);
    display: flex;
    align-items: center;
    justify-content: center;
}

.brand-logo {
    width: 20px;
    height: 20px;
    object-fit: contain;
}

.brand-title {
    font-weight: 700;
}

.brand-sub {
    font-size: 0.75rem;
    color: var(--color-text-muted);
}
</style>
