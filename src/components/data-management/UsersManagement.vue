<template>
  <div class="users-management">
    <!-- 表格头部 -->
    <div class="table-header">
      <div class="table-title">
        <el-icon><User /></el-icon>
        <span>用户列表</span>
      </div>
    </div>

    <!-- 数据表格 -->
    <el-table 
      :data="tableData" 
      style="width: 100%"
      v-loading="loading"
    >
      <el-table-column prop="username" label="用户名" min-width="180" show-overflow-tooltip />
      <el-table-column prop="email" label="邮箱" min-width="180" show-overflow-tooltip />
      <el-table-column prop="user_role" label="角色">
        <template #default="{ row }">
          <el-tag :type="row.user_role === 'admin' ? 'danger' : 'info'">
            {{ row.user_role === 'admin' ? '管理员' : '普通用户' }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="created_at" label="创建时间" width="160">
        <template #default="{ row }">
          {{ formatDate(row.created_at) }}
        </template>
      </el-table-column>
      <el-table-column label="操作" width="300" fixed="right">
        <template #default="scope">
          <el-button 
            type="primary" 
            link 
            @click="handleRoleChange(scope.row)"
          >
            <el-icon><Edit /></el-icon>
            修改角色
          </el-button>
          <el-button 
            type="danger" 
            link 
            @click="handleDelete(scope.row)"
          >
            <el-icon><Delete /></el-icon>
            删除
          </el-button>
        </template>
      </el-table-column>
    </el-table>

    <!-- 修改角色对话框 -->
    <el-dialog
      v-model="dialogVisible"
      title="修改用户角色"
      width="400px"
      class="role-dialog"
    >
      <el-form
        ref="formRef"
        :model="form"
        label-width="80px"
        class="role-form"
      >
        <el-form-item label="角色">
          <el-select v-model="form.role" placeholder="请选择角色">
            <el-option label="管理员" value="admin" />
            <el-option label="普通用户" value="user" />
          </el-select>
        </el-form-item>
      </el-form>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="dialogVisible = false">取消</el-button>
          <el-button type="primary" @click="handleSubmit" :loading="submitting">
            确认
          </el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { User, Edit, Delete } from '@element-plus/icons-vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { getAllUsers, deleteUser, updateUserRole } from '@/api/users'
// 表格数据
const tableData = ref([])
const loading = ref(false)

// 对话框相关
const dialogVisible = ref(false)
const submitting = ref(false)
const formRef = ref(null)

// 当前编辑的记录
const currentRecord = ref(null)

// 表单数据
const form = ref({
  role: ''
})

// 格式化日期
const formatDate = (dateString) => {
  const date = new Date(dateString)
  return date.toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  }).replace(/\//g, '-')
}

// 获取数据
const fetchData = async () => {
  loading.value = true
  try {
    const res = await getAllUsers()
    console.log(res)
    if (res.code === 200) {
      tableData.value = res.data
    } else {
      throw new Error(res.message || '获取数据失败')
    }
  } catch (error) {
    console.error('获取数据失败:', error)
    ElMessage.error(error.message || '获取数据失败')
  } finally {
    loading.value = false
  }
}

// 处理角色修改
const handleRoleChange = (row) => {
  currentRecord.value = row
  form.value.role = row.user_role
  dialogVisible.value = true
}

// 处理删除
const handleDelete = async (row) => {
  try {
    await ElMessageBox.confirm(
      `确认删除用户 "${row.username}" 吗？此操作不可恢复！`, 
      '警告', 
      {
        type: 'warning',
        confirmButtonText: '确定',
        cancelButtonText: '取消'
      }
    )
    const res = await deleteUser(row.id)
    if (res.code === 200) {
      ElMessage.success('删除成功')
      fetchData()
    } else {
      throw new Error(res.message || '删除失败')
    }
  } catch (error) {
    if (error !== 'cancel') {
      console.error('删除失败:', error)
      ElMessage.error(error.message || '删除失败')
    }
  }
}

// 处理提交
const handleSubmit = async () => {
  if (!currentRecord.value) return
  
  submitting.value = true
  try {
    const res = await updateUserRole(currentRecord.value.id, form.value.role)
    if (res.code === 200) {
      ElMessage.success('角色更新成功')
      dialogVisible.value = false
      fetchData()
    } else {
      throw new Error(res.message || '更新失败')
    }
  } catch (error) {
    console.error('更新失败:', error)
    ElMessage.error(error.message || '更新失败')
  } finally {
    submitting.value = false
  }
}

// 初始化
onMounted(() => {
  fetchData()
})
</script>

<style scoped>
.users-management {
  height: 100%;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.table-header {
  padding: 16px 24px;
  background-color: var(--el-bg-color);
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

:deep(.el-table) {
  flex: 1;
  padding: 0 0px 15px !important;
  overflow-x: hidden;
}

:deep(.el-table__body-wrapper) {
  overflow-x: hidden !important;
}

.role-form {
  padding: 20px 0;
}

:deep(.el-dialog__body) {
  padding-top: 10px;
  overflow: hidden;
}

:deep(.role-dialog .el-dialog__body) {
  overflow: hidden;
}

:deep(.el-tag) {
  text-transform: capitalize;
}
</style>
