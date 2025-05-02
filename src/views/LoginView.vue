<template>
  <div class="login-container">
    <el-card class="login-card">
      <template #header>
        <div class="card-header">
          <h2>宠物友好型城市服务平台</h2>
          <p class="subtitle">欢迎回来，请登录您的账号</p>
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
        <el-form-item prop="password" label="密码">
          <el-input
            v-model="form.password"
            type="password"
            :prefix-icon="Lock"
            placeholder="请输入密码"
            show-password
          />
        </el-form-item>

        <el-form-item>
          <el-button
            type="primary"
            :loading="isLoading"
            class="login-button"
            @click="handleLogin"
          >
            {{ isLoading ? '登录中...' : '登录' }}
          </el-button>
        </el-form-item>

        <div class="register-link">
          <span>还没有账号？</span>
          <el-button
            type="text"
            class="register-button"
            @click="handleRegister"
          >
            立即注册
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
import { User, Lock } from '@element-plus/icons-vue'
import request from '@/utils/request'

const router = useRouter()
const formRef = ref(null)
const isLoading = ref(false)

const form = reactive({
  username: '',
  password: ''
})

const rules = {
  username: [
    { required: true, message: '请输入用户名', trigger: 'blur' },
    { min: 3, message: '用户名长度不能小于3个字符', trigger: 'blur' }
  ],
  password: [
    { required: true, message: '请输入密码', trigger: 'blur' },
    { min: 6, message: '密码长度不能小于6个字符', trigger: 'blur' }
  ]
}

const handleLogin = async () => {
  try {
    await formRef.value.validate()
    isLoading.value = true
    const res = await request.post('/login', {
      username: form.username,
      password: form.password
    })
    if (res.code === 200) {
      // 存储登录状态和用户信息
      localStorage.setItem('isLoggedIn', 'true')
      localStorage.setItem('username', JSON.stringify(res.data))
      window.role = res.data.user_role
      ElMessage.success('登录成功')
      // 跳转到主页
      router.push('/')
    } else {
      ElMessage.error(res.message || '登录失败')
    }
  } catch (error) {
    console.error('登录失败:', error)
    ElMessage.error(error.message || '登录失败，请重试')
  } finally {
    isLoading.value = false
  }
}

const handleRegister = () => {
  router.push('/register')
}
</script>

<style scoped>
.login-container {
  height: 100vh;
  display: flex;
  justify-content: center;
  align-items: center;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

.login-card {
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

.login-button {
  width: 100%;
  padding: 12px 0;
  font-size: 16px;
}

.register-link {
  text-align: center;
  margin-top: 16px;
  color: #606266;
  font-size: 14px;
}

.register-button {
  padding: 0;
  margin-left: 8px;
  font-size: 14px;
  color: #409EFF;
}

.register-button:hover {
  color: #66b1ff;
}

:deep(.el-input__wrapper) {
  padding: 4px 11px;
}

:deep(.el-form-item__label) {
  font-weight: 500;
}
</style>
