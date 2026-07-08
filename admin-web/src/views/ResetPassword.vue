<template>
  <div class="reset-page">
    <div class="reset-card">
      <div class="reset-header">
        <h1>重置密码</h1>
        <p>请输入您的新密码</p>
      </div>

      <el-form ref="formRef" :model="form" :rules="rules" @keyup.enter="handleReset">
        <el-form-item prop="newPassword">
          <el-input
            v-model="form.newPassword"
            type="password"
            placeholder="请输入新密码（至少6位）"
            :prefix-icon="Lock"
            size="large"
            show-password
          />
        </el-form-item>
        <el-form-item prop="confirmPassword">
          <el-input
            v-model="form.confirmPassword"
            type="password"
            placeholder="再次输入新密码"
            :prefix-icon="Lock"
            size="large"
            show-password
          />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" size="large" :loading="loading" class="submit-btn" @click="handleReset">
            重置密码
          </el-button>
        </el-form-item>
      </el-form>

      <div class="reset-footer">
        <router-link to="/login">返回登录</router-link>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { Lock } from '@element-plus/icons-vue'
import { adminAuthAPI } from '../api'
import { ElMessage } from 'element-plus'

const route = useRoute()
const router = useRouter()
const formRef = ref(null)
const loading = ref(false)

const form = reactive({
  newPassword: '',
  confirmPassword: ''
})

const validateConfirm = (rule, value, callback) => {
  if (value !== form.newPassword) {
    callback(new Error('两次输入的密码不一致'))
  } else {
    callback()
  }
}

const rules = {
  newPassword: [
    { required: true, message: '请输入新密码', trigger: 'blur' },
    { min: 6, message: '密码至少6位', trigger: 'blur' }
  ],
  confirmPassword: [
    { required: true, message: '请确认新密码', trigger: 'blur' },
    { validator: validateConfirm, trigger: 'blur' }
  ]
}

async function handleReset() {
  const valid = await formRef.value.validate().catch(() => false)
  if (!valid) return

  const token = route.query.token
  if (!token) {
    ElMessage.error('无效的重置链接')
    return
  }

  loading.value = true
  try {
    await adminAuthAPI.resetPassword({ token, newPassword: form.newPassword })
    ElMessage.success('密码重置成功，请使用新密码登录')
    router.push('/login')
  } catch { /* ignore */ } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.reset-page {
  height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #1E293B 0%, #334155 100%);
}

.reset-card {
  width: 420px;
  max-width: 90vw;
  background: #fff;
  border-radius: 16px;
  padding: 40px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
}

.reset-header {
  text-align: center;
  margin-bottom: 28px;
}

.reset-header h1 {
  font-size: 22px;
  color: #1E293B;
  font-weight: 700;
}

.reset-header p {
  font-size: 13px;
  color: #94A3B8;
  margin-top: 6px;
}

.submit-btn {
  width: 100%;
}

.reset-footer {
  text-align: center;
}

.reset-footer a {
  color: #3A7CFF;
  font-size: 13px;
  text-decoration: none;
}

.reset-footer a:hover {
  text-decoration: underline;
}
</style>
