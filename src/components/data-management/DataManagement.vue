<template>
  <div v-if="visible" class="data-management">
    <div class="management-backdrop" @click="handleClose"></div>
    <el-container class="management-container">
      <el-aside width="240px">
        <div class="aside-header">
          <h3>宠物友好型城市服务平台后台服务</h3>
        </div>
        <el-menu
          :default-active="activeMenu"
          class="aside-menu"
          @select="handleMenuSelect"
        >
          <el-menu-item index="points">
            <el-icon><Location /></el-icon>
            <span>兴趣点数据</span>
          </el-menu-item>
          <el-menu-item index="users">
            <el-icon><User /></el-icon>
            <span>用户数据</span>
          </el-menu-item>
          <el-menu-item index="pets">
            <el-icon><Discount /></el-icon>
            <span>宠物寻主数据</span>
          </el-menu-item>
        </el-menu>
      </el-aside>
      
      <el-container>
        <el-header height="64px">
          <div class="header-content">
            <div class="header-title">
              <h2>{{ currentTitle }}</h2>
              <span class="subtitle">管理和维护平台数据</span>
            </div>
            <el-button 
              type="primary" 
              circle
              class="close-button"
              @click="handleClose"
            >
              <el-icon><Close /></el-icon>
            </el-button>
          </div>
        </el-header>
        
        <el-main>
          <!-- 兴趣点数据 -->
          <points-management v-if="activeMenu === 'points'" />

          <!-- 用户数据 -->
          <users-management v-if="activeMenu === 'users'" />

          <!-- 宠物寻主数据 -->
          <pet-finder-management v-if="activeMenu === 'pets'" />
        </el-main>
      </el-container>
    </el-container>
  </div>
</template>

<script setup>
import { ref, computed, defineProps, defineEmits } from 'vue'
import { Location, User, Discount, Close } from '@element-plus/icons-vue'
import PointsManagement from './PointsManagement.vue'
import PetFinderManagement from './PetFinderManagement.vue'
import UsersManagement from './UsersManagement.vue'

defineProps({
  visible: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['update:visible'])

const activeMenu = ref('points')

// 计算当前标题
const currentTitle = computed(() => {
  const titles = {
    points: '兴趣点数据管理',
    users: '用户数据管理',
    pets: '宠物寻主数据管理'
  }
  return titles[activeMenu.value]
})

// 处理菜单选择
const handleMenuSelect = (index) => {
  activeMenu.value = index
}

// 处理关闭
const handleClose = () => {
  emit('update:visible', false)
}
</script>

<style scoped>
.data-management {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  z-index: 2000;
  display: flex;
  align-items: center;
  justify-content: center;
}

.management-backdrop {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.4);
  backdrop-filter: blur(4px);
}

.management-container {
  position: relative;
  width: 90%;
  height: 100%;
  background-color: var(--el-bg-color);
  /* border-radius: 8px; */
  box-shadow: 0 4px 24px rgba(0, 0, 0, 0.1);
  overflow: hidden;
  animation: slide-in 0.3s ease-out;
}

@keyframes slide-in {
  from {
    opacity: 0;
    transform: translateY(-20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.aside-header {
  height: 64px;
  display: flex;
  align-items: center;
  text-align: center;
  padding: 0 24px;
  background-color: var(--el-bg-color);
  border-bottom: 1px solid var(--el-border-color-light);
}

.aside-header h3 {
  margin: 0;
  font-size: 18px;
  font-weight: 600;
  color: var(--el-text-color-primary);
}

.aside-menu {
  border-right: none;
  padding: 16px 0;
}

.el-header {
  background-color: var(--el-bg-color);
  border-bottom: 1px solid var(--el-border-color-light);
  padding: 0 24px;
}

.header-content {
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.header-title {
  display: flex;
  flex-direction: column;
}

.header-title h2 {
  margin: 0;
  font-size: 20px;
  font-weight: 600;
  color: var(--el-text-color-primary);
}

.subtitle {
  font-size: 14px;
  color: var(--el-text-color-secondary);
  margin-top: 4px;
}

.el-aside {
  background-color: var(--el-menu-bg-color);
  border-right: 1px solid var(--el-border-color-light);
  transition: all 0.3s;
}

.el-main {
  background-color: var(--el-bg-color-page);
  padding: 24px;
}

.content-section {
  background-color: var(--el-bg-color);
  border-radius: 8px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.04);
}

.table-header {
  padding: 16px 24px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  border-bottom: 1px solid var(--el-border-color-light);
}

.table-title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 16px;
  font-weight: 500;
}

.table-title .el-icon {
  font-size: 18px;
  color: var(--el-color-primary);
}

:deep(.el-menu-item) {
  height: 48px;
  line-height: 48px;
  margin: 4px 0;
  border-radius: 0 24px 24px 0;
  margin-right: 16px;
}

:deep(.el-menu-item.is-active) {
  background-color: var(--el-color-primary-light-9);
  color: var(--el-color-primary);
}

:deep(.el-menu-item:hover) {
  background-color: var(--el-color-primary-light-9);
}

:deep(.el-menu-item .el-icon) {
  margin-right: 12px;
  font-size: 18px;
}

:deep(.el-table) {
  padding: 0 24px 24px;
}

:deep(.el-button--primary) {
  padding: 8px 16px;
  font-weight: 500;
}

:deep(.el-button--primary .el-icon) {
  margin-right: 4px;
  font-size: 16px;
}

:deep(.el-tag) {
  border-radius: 4px;
  padding: 4px 8px;
}
</style>
