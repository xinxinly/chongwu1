<template>
  <div class="pet-finder-management">
    <!-- 表格头部 -->
    <div class="table-header">
      <div class="table-title">
        <el-icon><Discount /></el-icon>
        <span>宠物寻主列表</span>
      </div>
    </div>

    <!-- 数据表格 -->
    <el-table 
      :data="tableData" 
      style="width: 100%"
      v-loading="loading"
    >
      <el-table-column prop="ownerName" label="主人姓名" width="100" show-overflow-tooltip />
      <el-table-column prop="contactPhone" label="联系电话" width="120" show-overflow-tooltip />
      <el-table-column prop="petFeatures" label="宠物特征" min-width="200" show-overflow-tooltip />
      <el-table-column prop="lng" label="经度" width="100" show-overflow-tooltip />
      <el-table-column prop="lat" label="纬度" width="100" show-overflow-tooltip />
      <el-table-column prop="username" label="发布者" width="100" show-overflow-tooltip />
      <el-table-column prop="created_time" label="发布时间" width="160">
        <template #default="{ row }">
          {{ formatDate(row.created_time) }}
        </template>
      </el-table-column>
      <el-table-column label="操作" width="160" fixed="right">
        <template #default="scope">
          <el-button type="primary" link @click="handleEdit(scope.row)">
            <el-icon><Edit /></el-icon>
            编辑
          </el-button>
          <el-button type="danger" link @click="handleDelete(scope.row)">
            <el-icon><Delete /></el-icon>
            删除
          </el-button>
        </template>
      </el-table-column>
    </el-table>

    <!-- 分页 -->
    <div class="pagination-container">
      <el-pagination
        v-model:current-page="page"
        v-model:page-size="pageSize"
        :page-sizes="[10, 20, 50, 100]"
        :total="total"
        layout="total, sizes, prev, pager, next"
        @size-change="handleSizeChange"
        @current-change="handleCurrentChange"
      />
    </div>

    <!-- 编辑对话框 -->
    <el-dialog
      v-model="dialogVisible"
      title="编辑寻主信息"
      width="500px"
      class="pet-finder-dialog"
    >
      <el-scrollbar>
        <el-form
          ref="formRef"
          :model="form"
          :rules="rules"
          label-width="100px"
          class="pet-finder-form"
        >
          <el-form-item label="联系电话" prop="contactPhone">
            <el-input v-model="form.contactPhone" placeholder="请输入联系电话" />
          </el-form-item>
          <el-form-item label="宠物特征" prop="petFeatures">
            <el-input
              v-model="form.petFeatures"
              type="textarea"
              :rows="4"
              placeholder="请输入宠物特征描述"
            />
          </el-form-item>
        </el-form>
      </el-scrollbar>
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
import { Discount, Edit, Delete } from '@element-plus/icons-vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { getPetFinderListbyPage, updatePetFinder, deletePetFinder } from '@/api/petFinder'

// 表格数据
const tableData = ref([])
const loading = ref(false)
const total = ref(0)
const page = ref(1)
const pageSize = ref(10)

// 对话框相关
const dialogVisible = ref(false)
const submitting = ref(false)
const formRef = ref(null)

// 当前编辑的记录
const currentRecord = ref(null)

// 表单数据
const form = ref({
  contactPhone: '',
  petFeatures: ''
})

// 表单验证规则
const rules = {
  contactPhone: [
    { required: true, message: '请输入联系电话', trigger: 'blur' },
    { pattern: /^1[3-9]\d{9}$/, message: '请输入正确的手机号码', trigger: 'blur' }
  ],
  petFeatures: [
    { required: true, message: '请输入宠物特征', trigger: 'blur' },
    { min: 1, message: '宠物特征描述至少10个字符', trigger: 'blur' }
  ]
}

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
    const res = await getPetFinderListbyPage({
      page: page.value,
      pageSize: pageSize.value
    })
    console.log(res)
    if (res.success) {
      tableData.value = res.data.list
      total.value = res.data.total
    }
  } catch (error) {
    console.error('获取数据失败:', error)
    ElMessage.error('获取数据失败')
  } finally {
    loading.value = false
  }
}

// 处理分页变化
const handleSizeChange = (val) => {
  pageSize.value = val
  fetchData()
}

const handleCurrentChange = (val) => {
  page.value = val
  fetchData()
}

// 处理编辑
const handleEdit = (row) => {
  currentRecord.value = row
  form.value = {
    contactPhone: row.contactPhone,
    petFeatures: row.petFeatures
  }
  dialogVisible.value = true
}

// 处理删除
const handleDelete = async (row) => {
  try {
    await ElMessageBox.confirm('确认删除该寻主信息吗？', '提示', {
      type: 'warning',
      confirmButtonText: '确定',
      cancelButtonText: '取消'
    })
    const res = await deletePetFinder(row.id, row.username)
    console.log(res)
    if (res.success) {
      ElMessage.success('删除成功')
      fetchData()
    } else {
      ElMessage.error((res.message || '删除失败'))
    }
  } catch (error) {
    if (error !== 'cancel') {
      console.error('删除失败:', error)
      ElMessage.error('删除失败')
    }
  }
}

// 处理提交
const handleSubmit = async () => {
  if (!formRef.value || !currentRecord.value) return
  
  await formRef.value.validate(async (valid) => {
    if (!valid) return
    
    submitting.value = true
    try {
      const res = await updatePetFinder(currentRecord.value.id, form.value)
      
      if (res.success) {
        ElMessage.success('更新成功')
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
  })
}

// 初始化
onMounted(() => {
  fetchData()
})
</script>

<style scoped>
.pet-finder-management {
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

.pagination-container {
  padding: 16px 24px;
  display: flex;
  justify-content: flex-end;
  background-color: var(--el-bg-color);
  border-top: 1px solid var(--el-border-color-light);
}

:deep(.el-table) {
  flex: 1;
  padding: 0 0px 15px !important;
  overflow-x: hidden;
}

:deep(.el-overlay-dialog) {
  overflow: hidden !important;
}

:deep(.el-table__body-wrapper) {
  overflow-x: hidden !important;
}

.pet-finder-form {
  padding: 20px 0;
}

:deep(.el-dialog__body) {
  padding-top: 10px;
  max-height: calc(90vh - 200px);
  overflow: hidden;
}

:deep(.pet-finder-dialog .el-dialog__body) {
  height: 100%;
  overflow: hidden;
}

:deep(.pet-finder-dialog .el-scrollbar__wrap) {
  overflow-x: hidden;
}
</style>
