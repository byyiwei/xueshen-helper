<template>
  <div class="admin-layout" :class="{ 'sidebar-collapsed': isCollapsed }">
    <!-- 侧边栏 -->
    <aside class="sidebar">
      <div class="sidebar-header">
        <div class="logo" @click="$router.push('/dashboard')">
          <span class="logo-text" v-show="!isCollapsed">管理后台</span>
        </div>
      </div>
      <el-menu
        :default-active="activeMenu"
        :collapse="isCollapsed"
        :collapse-transition="false"
        router
        background-color="#1E293B"
        text-color="#94A3B8"
        active-text-color="#3A7CFF"
        class="sidebar-menu"
      >
        <el-menu-item index="/dashboard">
          <el-icon><Odometer /></el-icon>
          <template #title>仪表盘</template>
        </el-menu-item>
        <el-menu-item index="/users">
          <el-icon><User /></el-icon>
          <template #title>用户管理</template>
        </el-menu-item>
        <el-menu-item index="/pets">
          <el-icon><Guide /></el-icon>
          <template #title>宠物管理</template>
        </el-menu-item>
        <el-menu-item index="/config">
          <el-icon><Setting /></el-icon>
          <template #title>系统配置</template>
        </el-menu-item>
        <el-menu-item index="/medicines">
          <el-icon><FirstAidKit /></el-icon>
          <template #title>药品管理</template>
        </el-menu-item>
        <el-menu-item index="/medicine-reports">
          <el-icon><Bell /></el-icon>
          <template #title>药品上报</template>
        </el-menu-item>
        <el-menu-item index="/tanks">
          <el-icon><Monitor /></el-icon>
          <template #title>龟缸管理</template>
        </el-menu-item>
        <el-menu-item index="/profile">
          <el-icon><UserFilled /></el-icon>
          <template #title>个人设置</template>
        </el-menu-item>
      </el-menu>
    </aside>

    <!-- 主体区域 -->
    <div class="main-area">
      <!-- 顶栏 -->
      <header class="topbar">
        <div class="topbar-left">
          <el-button class="collapse-btn" @click="toggleSidebar" text>
            <el-icon :size="20">
              <Fold v-if="!isCollapsed" />
              <Expand v-else />
            </el-icon>
          </el-button>
          <span class="page-title">{{ currentTitle }}</span>
        </div>
        <div class="topbar-right">
          <span class="admin-name">{{ authStore.adminInfo?.name || authStore.adminInfo?.username }}</span>
          <el-dropdown @command="handleCommand">
            <el-avatar :size="32" class="admin-avatar">
              {{ (authStore.adminInfo?.name || authStore.adminInfo?.username || 'A').charAt(0) }}
            </el-avatar>
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item command="profile">
                  <el-icon><UserFilled /></el-icon> 个人设置
                </el-dropdown-item>
                <el-dropdown-item command="logout" divided>
                  <el-icon><SwitchButton /></el-icon> 退出登录
                </el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
        </div>
      </header>

      <!-- 内容区 -->
      <main class="content">
        <router-view />
      </main>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '../stores/auth'

const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()

const isCollapsed = ref(false)

const activeMenu = computed(() => route.path)
const currentTitle = computed(() => route.meta.title || '')

function toggleSidebar() {
  isCollapsed.value = !isCollapsed.value
}

function handleCommand(cmd) {
  if (cmd === 'logout') {
    authStore.logout()
    router.push('/login')
  } else if (cmd === 'profile') {
    router.push('/profile')
  }
}
</script>

<style scoped>
.admin-layout {
  display: flex;
  height: 100vh;
  overflow: hidden;
}

/* 侧边栏 */
.sidebar {
  width: var(--sidebar-width);
  background: #1E293B;
  display: flex;
  flex-direction: column;
  transition: width 0.3s ease;
  flex-shrink: 0;
  overflow: hidden;
}

.sidebar-collapsed .sidebar {
  width: var(--sidebar-collapsed-width);
}

.sidebar-header {
  height: var(--header-height);
  display: flex;
  align-items: center;
  padding: 0 16px;
  border-bottom: 1px solid rgba(255,255,255,0.08);
}

.logo {
  display: flex;
  align-items: center;
  gap: 10px;
  cursor: pointer;
  white-space: nowrap;
}

.logo-icon {
  font-size: 24px;
  flex-shrink: 0;
}

.logo-text {
  font-size: 17px;
  font-weight: 700;
  color: #F1F5F9;
  letter-spacing: 0.5px;
}

.sidebar-menu {
  border-right: none !important;
  flex: 1;
  overflow-y: auto;
}

/* 主体区域 */
.main-area {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  min-width: 0;
}

/* 顶栏 */
.topbar {
  height: var(--header-height);
  background: #fff;
  border-bottom: 1px solid var(--color-border);
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 20px;
  flex-shrink: 0;
}

.topbar-left {
  display: flex;
  align-items: center;
  gap: 12px;
}

.collapse-btn {
  padding: 4px;
}

.page-title {
  font-size: 16px;
  font-weight: 600;
  color: var(--color-text);
}

.topbar-right {
  display: flex;
  align-items: center;
  gap: 12px;
}

.admin-name {
  font-size: 14px;
  color: var(--color-text-secondary);
}

.admin-avatar {
  background: var(--color-primary);
  color: #fff;
  cursor: pointer;
}

/* 内容区 */
.content {
  flex: 1;
  overflow-y: auto;
  padding: 20px;
}

/* 响应式 */
@media (max-width: 767px) {
  .sidebar {
    position: fixed;
    left: 0;
    top: 0;
    bottom: 0;
    z-index: 1000;
    width: var(--sidebar-width);
  }

  .sidebar-collapsed .sidebar {
    width: 0;
    overflow: hidden;
  }

  .sidebar-collapsed .sidebar::before {
    content: '';
    position: fixed;
    inset: 0;
    background: transparent;
    z-index: -1;
    display: none;
  }

  .topbar {
    padding: 0 12px;
  }

  .content {
    padding: 12px;
  }
}

@media (min-width: 768px) and (max-width: 1023px) {
  .sidebar {
    width: var(--sidebar-collapsed-width);
  }

  .sidebar-collapsed .sidebar {
    width: var(--sidebar-width);
  }

  .content {
    padding: 16px;
  }
}
</style>
