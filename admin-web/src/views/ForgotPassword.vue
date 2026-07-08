<template>
  <div class="forgot-page">
    <div class="forgot-card">
      <div class="forgot-header">
        <router-link to="/login" class="back-link">
          <el-icon><ArrowLeft /></el-icon> 返回登录
        </router-link>
        <h1>找回密码</h1>
        <p>输入绑定的邮箱地址，我们将发送重置链接</p>
      </div>

      <!-- 步骤1: 输入邮箱 -->
      <el-form v-if="step === 1" ref="formRef" :model="form" :rules="rules" @keyup.enter="handleSendEmail">
        <el-form-item prop="email">
          <el-input
            v-model="form.email"
            placeholder="请输入绑定的管理员邮箱"
            :prefix-icon="Message"
            size="large"
          />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" size="large" :loading="loading" class="submit-btn" @click="handleSendEmail">
            发送重置链接
          </el-button>
        </el-form-item>
      </el-form>

      <!-- 步骤2: 发送成功提示 -->
      <div v-else class="success-box">
        <el-icon :size="48" color="#22C55E"><CircleCheckFilled /></el-icon>
        <p class="success-title">重置链接已发送</p>
        <p class="success-desc">请检查邮箱 <strong>{{ form.email }}</strong>，点击邮件中的链接重置密码。链接30分钟内有效。</p>
        <el-button type="primary" @click="step = 1" style="margin-top: 16px;">重新发送</el-button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive } from 'vue'
import { ArrowLeft, Message, CircleCheckFilled } from '@element-plus/icons-vue'
import { adminAuthAPI } from '../api'

const formRef = ref(null)
const loading = ref(false)
const step = ref(1)

const form = reactive({
  email: ''
})

const rules = {
  email: [
    { required: true, message: '请输入邮箱地址', trigger: 'blur' },
    { type: 'email', message: '请输入正确的邮箱格式', trigger: 'blur' }
  ]
}

async function handleSendEmail() {
  const valid = await formRef.value.validate().catch(() => false)
  if (!valid) return

  loading.value = true
  try {
    await adminAuthAPI.forgotPassword({ email: form.email })
    step.value = 2
  } catch {
    // 错误已在拦截器中处理
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.forgot-page {
  height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #1E293B 0%, #334155 100%);
}

.forgot-card {
  width: 440px;
  max-width: 90vw;
  background: #fff;
  border-radius: 16px;
  padding: 40px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
}

.forgot-header {
  margin-bottom: 28px;
}

.back-link {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  color: #3A7CFF;
  font-size: 13px;
  text-decoration: none;
  margin-bottom: 16px;
}

.back-link:hover {
  text-decoration: underline;
}

.forgot-header h1 {
  font-size: 22px;
  color: #1E293B;
  font-weight: 700;
}

.forgot-header p {
  font-size: 13px;
  color: #94A3B8;
  margin-top: 6px;
}

.submit-btn {
  width: 100%;
}

.success-box {
  text-align: center;
  padding: 20px 0;
}

.success-title {
  font-size: 18px;
  font-weight: 600;
  color: #1E293B;
  margin: 12px 0 8px;
}

.success-desc {
  font-size: 14px;
  color: #64748B;
  line-height: 1.6;
}
</style>
