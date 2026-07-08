<template>
  <div class="login-page">
    <div class="login-card">
      <div class="login-header">
        <span class="login-logo">🐢</span>
        <h1>养龟档案</h1>
        <p>管理后台</p>
      </div>
      <el-form
        ref="formRef"
        :model="form"
        :rules="rules"
        class="login-form"
        @keyup.enter="handleLogin"
      >
        <el-form-item prop="username">
          <el-input
            v-model="form.username"
            placeholder="请输入管理员账号"
            :prefix-icon="User"
            size="large"
          />
        </el-form-item>
        <el-form-item prop="password">
          <el-input
            v-model="form.password"
            type="password"
            placeholder="请输入密码"
            :prefix-icon="Lock"
            size="large"
            show-password
          />
        </el-form-item>
        <el-form-item>
          <el-button
            type="primary"
            size="large"
            :loading="loading"
            class="login-btn"
            @click="handleLogin"
          >
            登 录
          </el-button>
        </el-form-item>
        <div class="login-footer">
          <router-link to="/forgot-password" class="link">忘记密码？</router-link>
        </div>
      </el-form>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { User, Lock } from '@element-plus/icons-vue'
import { useAuthStore } from '../stores/auth'

const router = useRouter()
const route = useRoute()
const authStore = useAuthStore()

const formRef = ref(null)
const loading = ref(false)

const form = reactive({
  username: '',
  password: ''
})

const rules = {
  username: [{ required: true, message: '请输入管理员账号', trigger: 'blur' }],
  password: [{ required: true, message: '请输入密码', trigger: 'blur' }]
}

async function handleLogin() {
  const valid = await formRef.value.validate().catch(() => false)
  if (!valid) return

  loading.value = true
  try {
    await authStore.login(form.username, form.password)
    const redirect = route.query.redirect || '/dashboard'
    router.push(redirect)
  } catch {
    // 错误已在拦截器中处理
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.login-page {
  height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #1E293B 0%, #334155 100%);
}

.login-card {
  width: 400px;
  max-width: 90vw;
  background: #fff;
  border-radius: 16px;
  padding: 40px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
}

.login-header {
  text-align: center;
  margin-bottom: 32px;
}

.login-logo {
  font-size: 48px;
  display: block;
  margin-bottom: 8px;
}

.login-header h1 {
  font-size: 22px;
  color: #1E293B;
  font-weight: 700;
}

.login-header p {
  font-size: 13px;
  color: #94A3B8;
  margin-top: 4px;
}

.login-btn {
  width: 100%;
}

.login-footer {
  text-align: center;
}

.link {
  color: #3A7CFF;
  font-size: 13px;
  text-decoration: none;
}

.link:hover {
  text-decoration: underline;
}
</style>
