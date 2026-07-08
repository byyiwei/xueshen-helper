import axios from 'axios'
import { ElMessage } from 'element-plus'
import router from '../router'

const api = axios.create({
  baseURL: '/api',
  timeout: 30000
})

// 请求拦截器：自动携带 token
api.interceptors.request.use(config => {
  const token = localStorage.getItem('admin_token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// 响应拦截器：统一错误处理
api.interceptors.response.use(
  response => {
    const res = response.data
    if (res.success === false) {
      // 检测登录过期/未登录，自动跳转登录页
      if (res.message && (res.message.includes('登录') || res.message.includes('登录管理后台'))) {
        localStorage.removeItem('admin_token')
        localStorage.removeItem('admin_info')
        ElMessage.error(res.message)
        router.push('/login')
      } else {
        ElMessage.error(res.message || '操作失败')
      }
      return Promise.reject(new Error(res.message))
    }
    return res
  },
  error => {
    if (error.response?.status === 401) {
      localStorage.removeItem('admin_token')
      localStorage.removeItem('admin_info')
      router.push('/login')
      ElMessage.error('登录已过期，请重新登录')
    } else {
      ElMessage.error('网络请求失败，请稍后重试')
    }
    return Promise.reject(error)
  }
)

// Admin 认证 API
export const adminAuthAPI = {
  login: (data) => api.post('/admin/login', data),
  forgotPassword: (data) => api.post('/admin/forgot-password', data),
  resetPassword: (data) => api.post('/admin/reset-password', data),
  getProfile: () => api.get('/admin/profile'),
  updateProfile: (data) => api.put('/admin/profile', data),
  getSmtpConfig: () => api.get('/admin/smtp-config'),
  updateSmtpConfig: (data) => api.put('/admin/smtp-config', data)
}

// Admin 管理 API
export const adminAPI = {
  getStats: () => api.get('/admin/stats'),
  getUsers: (params) => api.get('/admin/users', { params }),
  updateUser: (id, data) => api.put(`/admin/users/${id}`, data),
  deleteUser: (id) => api.delete(`/admin/users/${id}`),
  getPets: (params) => api.get('/admin/pets', { params }),
  getUserGrowth: (params) => api.get('/admin/user-growth', { params }),
  getPetDistribution: () => api.get('/admin/pet-distribution'),
  getConfig: () => api.get('/admin/config'),
  updateConfig: (data) => api.put('/admin/config', data)
}

// 药品管理 API
export const medicineAPI = {
  getList: (params) => api.get('/medicines/admin', { params }),
  getDetail: (id) => api.get(`/medicines/admin/${id}`),
  create: (data) => api.post('/medicines/admin', data),
  update: (id, data) => api.put(`/medicines/admin/${id}`, data),
  delete: (id) => api.delete(`/medicines/admin/${id}`),
  batchDelete: (ids) => api.post('/medicines/admin/batch-delete', { ids }),
  exportAll: () => api.get('/medicines/admin/export'),
  importData: (data) => api.post('/medicines/admin/import', { data }),
  uploadImage: (id, file) => {
    const formData = new FormData()
    formData.append('file', file)
    return api.post(`/medicines/admin/${id}/image`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    })
  }
}

// 药品上报管理 API
export const medicineReportAPI = {
  getList: (params) => api.get('/medicine-reports/admin', { params }),
  update: (id, data) => api.put(`/medicine-reports/admin/${id}`, data)
}

export default api
