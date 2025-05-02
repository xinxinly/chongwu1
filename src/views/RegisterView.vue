<template>
  <div class="register-container">
    <el-card class="register-card">
      <template #header>
        <div class="card-header">
          <h2>宠物友好型城市服务平台</h2>
          <p class="subtitle">创建新账号</p>
        </div>
      </template>
      
      <el-form
        ref="formRef"
        :model="form"
        :rules="rules"
        label-position="top"
        @submit.prevent
      >
        <el-form-item prop="username" label="用户名">
          <el-input
            v-model="form.username"
            :prefix-icon="User"
            placeholder="请输入用户名"
          />
        </el-form-item>

        <el-form-item prop="email" label="邮箱">
          <el-input
            v-model="form.email"
            :prefix-icon="Message"
            placeholder="请输入邮箱"
          />
        </el-form-item>
        
        <el-form-item prop="password" label="密码">
          <el-input
            v-model="form.password"
            type="password"
            :prefix-icon="Lock"
            placeholder="请输入密码"
            show-password
          />
        </el-form-item>

        <el-form-item prop="confirmPassword" label="确认密码">
          <el-input
            v-model="form.confirmPassword"
            type="password"
            :prefix-icon="Lock"
            placeholder="请再次输入密码"
            show-password
          />
        </el-form-item>

        <el-form-item>
          <el-button
            type="primary"
            :loading="isLoading"
            class="register-button"
            @click="handleRegister"
          >
            {{ isLoading ? '注册中...' : '注册' }}
          </el-button>
        </el-form-item>

        <div class="login-link">
          <span>已有账号？</span>
          <el-button
            type="text"
            class="login-text-button"
            @click="router.push('/login')"
          >
            立即登录
          </el-button>
        </div>
      </el-form>
    </el-card>
  </div>
</template>

<script setup>
import { ref, reactive } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { User, Lock, Message } from '@element-plus/icons-vue'
import request from '@/utils/request'

const router = useRouter()
const formRef = ref(null)
const isLoading = ref(false)

const form = reactive({
  username: '',
  email: '',
  password: '',
  confirmPassword: ''
})

// 自定义验证规则：确认密码
const validateConfirmPassword = (rule, value, callback) => {
  if (value === '') {
    callback(new Error('请再次输入密码'))
  } else if (value !== form.password) {
    callback(new Error('两次输入密码不一致'))
  } else {
    callback()
  }
}

const rules = {
  username: [
    { required: true, message: '请输入用户名', trigger: 'blur' },
    { min: 3, message: '用户名长度不能小于3个字符', trigger: 'blur' }
  ],
  email: [
    { required: true, message: '请输入邮箱', trigger: 'blur' },
    { type: 'email', message: '请输入正确的邮箱格式', trigger: 'blur' }
  ],
  password: [
    { required: true, message: '请输入密码', trigger: 'blur' },
    { min: 6, message: '密码长度不能小于6个字符', trigger: 'blur' }
  ],
  confirmPassword: [
    { required: true, message: '请再次输入密码', trigger: 'blur' },
    { validator: validateConfirmPassword, trigger: 'blur' }
  ]
}

const handleRegister = async () => {
  if (!formRef.value) return
  try {
    await formRef.value.validate()
    isLoading.value = true
    
    const userData = {
      username: form.username,
      email: form.email,
      password: form.password
    }
    
    const res = await request.post('/register', userData)
    
    if (res.code === 200) {
      ElMessage.success('注册成功')
      router.push('/login')
    } else {
      ElMessage.error(res.message || '注册失败')
    }
  } catch (error) {
    console.error('注册失败:', error)
    ElMessage.error(error.message || '注册失败，请重试')
  } finally {
    isLoading.value = false
  }
}
</script>

<style scoped>
.register-container {
  height: 100vh;
  display: flex;
  justify-content: center;
  align-items: center;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

.register-card {
  width: 100%;
  max-width: 400px;
  margin: 20px;
  border-radius: 8px;
}

.card-header {
  text-align: center;
}

.card-header h2 {
  font-size: 24px;
  color: #303133;
  margin-bottom: 8px;
}

.subtitle {
  font-size: 14px;
  color: #909399;
  margin: 0;
}

.register-button {
  width: 100%;
  padding: 12px 0;
  font-size: 16px;
}

.login-link {
  text-align: center;
  margin-top: 16px;
  color: #606266;
  font-size: 14px;
}

.login-text-button {
  padding: 0;
  margin-left: 8px;
  font-size: 14px;
  color: #409EFF;
}

.login-text-button:hover {
  color: #66b1ff;
}

:deep(.el-input__wrapper) {
  padding: 4px 11px;
}

:deep(.el-form-item__label) {
  font-weight: 500;
}
</style>
