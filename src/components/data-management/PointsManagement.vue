<template>
  <div class="points-management">
    <!-- 表格头部 -->
    <div class="table-header">
      <div class="table-title">
        <el-icon><Location /></el-icon>
        <span>兴趣点列表</span>
      </div>
      <el-button type="primary" @click="handleAdd">
        <el-icon><Plus /></el-icon>
        添加兴趣点
      </el-button>
    </div>

    <!-- 数据表格 -->
    <el-table 
      :data="tableData" 
      style="width: 100%"
      v-loading="loading"
    >
      <el-table-column prop="name" label="名称" width="100" show-overflow-tooltip/>
      <el-table-column prop="type" label="类型" width="200" show-overflow-tooltip/>
      <el-table-column prop="lon" label="经度" width="100" show-overflow-tooltip/>
      <el-table-column prop="lat" label="纬度" width="100" show-overflow-tooltip/>
      <el-table-column prop="address" label="地址" show-overflow-tooltip />
      <el-table-column prop="adname" label="地区" width="90" />
      <el-table-column prop="tel" label="电话" width="120" show-overflow-tooltip />
      <el-table-column prop="categories" label="分类" width="100" />
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

    <!-- 编辑/添加对话框 -->
    <el-dialog
      v-model="dialogVisible"
      :title="dialogType === 'add' ? '添加兴趣点' : '编辑兴趣点'"
      width="500px"
      class="point-dialog"
    >
      <el-scrollbar>
        <el-form
          ref="formRef"
          :model="form"
          :rules="rules"
          label-width="80px"
          class="point-form"
        >
          <el-form-item label="名称" prop="name">
            <el-input v-model="form.name" placeholder="请输入名称" />
          </el-form-item>
          <el-form-item label="类型" prop="type">
            <el-input v-model="form.type" placeholder="请输入类型" />
          </el-form-item>
          <el-form-item label="分类" prop="categories">
            <el-input v-model="form.categories" placeholder="请输入分类" />
          </el-form-item>
          <el-form-item label="电话" prop="tel">
            <el-input v-model="form.tel" placeholder="请输入电话" />
          </el-form-item>
          <el-form-item label="地区" prop="adname">
            <el-input v-model="form.adname" placeholder="请输入地区" />
          </el-form-item>
          <el-form-item label="地址" prop="address">
            <el-input v-model="form.address" placeholder="请输入地址" />
          </el-form-item>
          <el-form-item label="经度" prop="lon">
            <el-input v-model="form.lon" placeholder="请输入经度" />
          </el-form-item>
          <el-form-item label="纬度" prop="lat">
            <el-input v-model="form.lat" placeholder="请输入纬度" />
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
import { Location, Plus, Edit, Delete } from '@element-plus/icons-vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { getPoints, createPoint, updatePoint, deletePoint } from '@/api/points'

// 表格数据
const tableData = ref([])
const loading = ref(false)
const total = ref(0)
const page = ref(1)
const pageSize = ref(10)

// 对话框相关
const dialogVisible = ref(false)
const dialogType = ref('add') // 'add' 或 'edit'
const submitting = ref(false)
const formRef = ref(null)

// 表单数据
const form = ref({
  name: '',
  type: '',
  categories: '',
  tel: '',
  adname: '',
  address: '',
  lon: '',
  lat: ''
})

// 表单验证规则
const rules = {
  name: [{ required: true, message: '请输入名称', trigger: 'blur' }],
  type: [{ required: true, message: '请输入类型', trigger: 'blur' }],
  categories: [{ required: true, message: '请输入分类', trigger: 'blur' }],
  tel: [{ required: true, message: '请输入电话', trigger: 'blur' }],
  adname: [{ required: true, message: '请输入地区', trigger: 'blur' }],
  address: [{ required: true, message: '请输入地址', trigger: 'blur' }],
  lon: [
    { required: true, message: '请输入经度', trigger: 'blur' },
    { pattern: /^-?([0-9]{1,3}|0)\.([0-9]{1,6})$/, message: '请输入有效的经度', trigger: 'blur' }
  ],
  lat: [
    { required: true, message: '请输入纬度', trigger: 'blur' },
    { pattern: /^-?([0-9]{1,2}|0)\.([0-9]{1,6})$/, message: '请输入有效的纬度', trigger: 'blur' }
  ]
}

// 获取数据
const fetchData = async () => {
  loading.value = true
  try {
    const res = await getPoints({
      page: page.value,
      pageSize: pageSize.value
    })
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

// 处理添加
const handleAdd = () => {
  dialogType.value = 'add'
  form.value = {
    name: '',
    type: '',
    categories: '',
    tel: '',
    adname: '',
    address: '',
    lon: '',
    lat: ''
  }
  dialogVisible.value = true
}

// 处理编辑
const handleEdit = (row) => {
  dialogType.value = 'edit'
  form.value = { ...row }
  dialogVisible.value = true
}

// 处理删除
const handleDelete = async (row) => {
  try {
    await ElMessageBox.confirm('确认删除该兴趣点吗？', '提示', {
      type: 'warning',
      confirmButtonText: '确定',
      cancelButtonText: '取消'
    })
    const res = await deletePoint(row.id)
    if (res.success) {
      ElMessage.success('删除成功')
      fetchData()
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
  if (!formRef.value) return
  
  await formRef.value.validate(async (valid) => {
    if (!valid) return
    
    submitting.value = true
    try {
      let res
      if (dialogType.value === 'add') {
        // 确保数据格式正确
        const pointData = {
          name: form.value.name,
          type: form.value.type,
          categories: form.value.categories,
          tel: form.value.tel,
          adname: form.value.adname,
          address: form.value.address,
          lon: form.value.lon,
          lat: form.value.lat
        }
        res = await createPoint(pointData)
      } else {
        res = await updatePoint(form.value.id, form.value)
      }
      
      if (res.success) {
        ElMessage.success(dialogType.value === 'add' ? '添加成功' : '更新成功')
        dialogVisible.value = false
        fetchData()
      } else {
        throw new Error(res.message || '操作失败')
      }
    } catch (error) {
      console.error(dialogType.value === 'add' ? '添加失败:' : '更新失败:', error)
      ElMessage.error(error.message || (dialogType.value === 'add' ? '添加失败' : '更新失败'))
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
.points-management {
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

.point-form {
  padding: 20px 0;
}

:deep(.el-dialog__body) {
  padding-top: 10px;
  max-height: calc(90vh - 200px);
  overflow: hidden;
}

:deep(.point-dialog .el-dialog__body) {
  height: 100%;
  overflow: hidden;
}

:deep(.point-dialog .el-scrollbar__wrap) {
  overflow-x: hidden;
}
</style>
