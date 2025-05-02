/* eslint-disable */
import axios from 'axios'
import { ElMessage } from 'element-plus'

const request = axios.create({
  baseURL: process.env.NODE_ENV === 'development' ? '/api' : 'http://localhost:3050',
  timeout: 5000
})

// 请求拦截器
request.interceptors.request.use(
  config => {
    // 可以在这里添加 token 等
    return config
  },
  error => {
    return Promise.reject(error)
  }
)

// 响应拦截器
request.interceptors.response.use(
  response => {
    return response.data
  },
  error => {
    ElMessage.error(error.message || '请求失败')
    return Promise.reject(error)
  }
)

export default request
