<template>
  <div class="profile-page" v-loading="loading">
    <!-- 个人信息 -->
    <el-card class="section-card">
      <template #header><span class="section-title">个人信息</span></template>
      <el-form :model="profileForm" label-position="top">
        <el-row :gutter="20">
          <el-col :md="12" :xs="24">
            <el-form-item label="用户名">
              <el-input v-model="profile.username" disabled />
            </el-form-item>
          </el-col>
          <el-col :md="12" :xs="24">
            <el-form-item label="角色">
              <el-tag>{{ profile.role === 'super' ? '超级管理员' : '管理员' }}</el-tag>
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="20">
          <el-col :md="12" :xs="24">
            <el-form-item label="显示名称">
              <el-input v-model="profileForm.name" placeholder="管理员显示名称" />
            </el-form-item>
          </el-col>
          <el-col :md="12" :xs="24">
            <el-form-item label="绑定邮箱">
              <el-input v-model="profileForm.email" placeholder="用于找回密码" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="20">
          <el-col :md="12" :xs="24">
            <el-form-item label="最后登录">
              <span class="info-text">{{ profile.last_login_time || '-' }}</span>
            </el-form-item>
          </el-col>
        </el-row>
        <el-form-item>
          <el-button type="primary" :loading="saving" @click="saveProfile">保存修改</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <!-- SMTP 邮箱 -->
    <el-card class="section-card">
      <template #header>
        <div class="card-header">
          <span class="section-title">发件邮箱（SMTP）</span>
          <span class="card-tip">用于找回密码等邮件发送</span>
        </div>
      </template>
      <el-form :model="smtpForm" label-position="top">
        <el-row :gutter="20">
          <el-col :md="12" :xs="24">
            <el-form-item label="SMTP 服务器">
              <el-input v-model="smtpForm.host" placeholder="smtp.qq.com" />
            </el-form-item>
          </el-col>
          <el-col :md="6" :xs="12">
            <el-form-item label="端口">
              <el-input v-model.number="smtpForm.port" placeholder="465" />
            </el-form-item>
          </el-col>
          <el-col :md="6" :xs="12">
            <el-form-item label="SSL/TLS">
              <el-switch v-model="smtpForm.secure" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="20">
          <el-col :md="12" :xs="24">
            <el-form-item label="邮箱账号">
              <el-input v-model="smtpForm.user" placeholder="your-email@qq.com" />
            </el-form-item>
          </el-col>
          <el-col :md="12" :xs="24">
            <el-form-item label="授权码">
              <el-input v-model="smtpForm.pass" type="password" show-password placeholder="SMTP 授权码（非邮箱密码）" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="20">
          <el-col :span="24">
            <el-form-item label="发件人名称">
              <el-input v-model="smtpForm.from" placeholder="养龟档案 <your-email@qq.com>" />
              <div class="form-tip">格式：名称 &lt;邮箱&gt; 或直接留空使用邮箱账号</div>
            </el-form-item>
          </el-col>
        </el-row>
        <el-form-item>
          <el-button type="primary" :loading="savingSmtp" @click="saveSmtp">保存邮箱配置</el-button>
          <el-button :loading="testingSmtp" @click="testSmtp">测试发送</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <!-- 修改密码 -->
    <el-card class="section-card">
      <template #header><span class="section-title">修改密码</span></template>
      <el-form ref="pwdFormRef" :model="pwdForm" :rules="pwdRules" label-position="top">
        <el-row :gutter="20">
          <el-col :md="12" :xs="24">
            <el-form-item label="原密码" prop="oldPassword">
              <el-input v-model="pwdForm.oldPassword" type="password" show-password placeholder="输入当前密码" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="20">
          <el-col :md="12" :xs="24">
            <el-form-item label="新密码" prop="newPassword">
              <el-input v-model="pwdForm.newPassword" type="password" show-password placeholder="至少6位" />
            </el-form-item>
          </el-col>
          <el-col :md="12" :xs="24">
            <el-form-item label="确认密码" prop="confirmPassword">
              <el-input v-model="pwdForm.confirmPassword" type="password" show-password placeholder="再次输入新密码" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-form-item>
          <el-button type="danger" :loading="changingPwd" @click="changePassword">修改密码</el-button>
        </el-form-item>
      </el-form>
    </el-card>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { adminAuthAPI } from '../api'
import { useAuthStore } from '../stores/auth'
import { ElMessage } from 'element-plus'

const authStore = useAuthStore()

const loading = ref(false)
const profile = ref(authStore.adminInfo || {})
const saving = ref(false)
const savingSmtp = ref(false)
const testingSmtp = ref(false)
const changingPwd = ref(false)

const smtpForm = reactive({
  host: '',
  port: 465,
  secure: true,
  user: '',
  pass: '',
  from: ''
})

const profileForm = reactive({
  name: '',
  email: ''
})

const pwdFormRef = ref(null)
const pwdForm = reactive({
  oldPassword: '',
  newPassword: '',
  confirmPassword: ''
})

const validateConfirmPwd = (rule, value, callback) => {
  if (value !== pwdForm.newPassword) {
    callback(new Error('两次输入的密码不一致'))
  } else {
    callback()
  }
}

const pwdRules = {
  oldPassword: [{ required: true, message: '请输入原密码', trigger: 'blur' }],
  newPassword: [
    { required: true, message: '请输入新密码', trigger: 'blur' },
    { min: 6, message: '密码至少6位', trigger: 'blur' }
  ],
  confirmPassword: [
    { required: true, message: '请确认新密码', trigger: 'blur' },
    { validator: validateConfirmPwd, trigger: 'blur' }
  ]
}

onMounted(async () => {
  loading.value = true
  try {
    const data = await authStore.fetchProfile()
    profile.value = data
    profileForm.name = data.name || ''
    profileForm.email = data.email || ''
  } catch { /* ignore */ }

  try {
    const cfg = await adminAuthAPI.getSmtpConfig()
    if (cfg.data) {
      smtpForm.host = cfg.data.host || ''
      smtpForm.port = parseInt(cfg.data.port) || 465
      smtpForm.secure = cfg.data.secure !== false
      smtpForm.user = cfg.data.user || ''
      smtpForm.pass = cfg.data.pass || ''
      smtpForm.from = cfg.data.from || ''
    }
  } catch { /* 未配置时忽略 */ }
  loading.value = false
})

async function saveProfile() {
  saving.value = true
  try {
    const data = {}
    if (profileForm.name !== profile.value.name) data.name = profileForm.name
    if (profileForm.email !== profile.value.email) data.email = profileForm.email
    if (Object.keys(data).length === 0) {
      ElMessage.info('没有需要保存的更改')
      saving.value = false
      return
    }
    await adminAuthAPI.updateProfile(data)
    ElMessage.success('保存成功')
    await authStore.fetchProfile()
  } catch { /* ignore */ } finally {
    saving.value = false
  }
}

async function changePassword() {
  const valid = await pwdFormRef.value.validate().catch(() => false)
  if (!valid) return

  changingPwd.value = true
  try {
    await adminAuthAPI.updateProfile({
      oldPassword: pwdForm.oldPassword,
      newPassword: pwdForm.newPassword
    })
    ElMessage.success('密码修改成功')
    pwdForm.oldPassword = ''
    pwdForm.newPassword = ''
    pwdForm.confirmPassword = ''
    pwdFormRef.value.resetFields()
  } catch { /* ignore */ } finally {
    changingPwd.value = false
  }
}

async function saveSmtp() {
  if (!smtpForm.host || !smtpForm.user) {
    ElMessage.warning('SMTP 服务器和邮箱账号为必填项')
    return
  }
  savingSmtp.value = true
  try {
    await adminAuthAPI.updateSmtpConfig({
      host: smtpForm.host,
      port: smtpForm.port,
      secure: smtpForm.secure,
      user: smtpForm.user,
      pass: smtpForm.pass,
      from: smtpForm.from
    })
    ElMessage.success('邮箱配置已保存')
  } catch { /* ignore */ } finally {
    savingSmtp.value = false
  }
}

async function testSmtp() {
  if (!smtpForm.user) {
    ElMessage.warning('请先填写邮箱账号')
    return
  }
  testingSmtp.value = true
  try {
    await adminAuthAPI.updateSmtpConfig({
      host: smtpForm.host,
      port: smtpForm.port,
      secure: smtpForm.secure,
      user: smtpForm.user,
      pass: smtpForm.pass,
      from: smtpForm.from
    })
    await adminAuthAPI.forgotPassword({ email: smtpForm.user })
    ElMessage.success('测试邮件已发送，请检查收件箱')
  } catch { /* ignore */ } finally {
    testingSmtp.value = false
  }
}
</script>

<style scoped>
.profile-page {
  max-width: 1200px;
  margin: 0 auto;
}

.section-card {
  margin-bottom: 16px;
  border-radius: 12px;
}

.section-title {
  font-size: 15px;
  font-weight: 600;
  color: #1E293B;
}

.info-text {
  color: var(--color-text-secondary);
  font-size: 14px;
  line-height: 32px;
}

.card-header {
  display: flex;
  align-items: center;
  gap: 12px;
}

.card-tip {
  font-size: 12px;
  color: var(--color-text-secondary);
  font-weight: 400;
}

.form-tip {
  font-size: 12px;
  color: var(--color-text-secondary);
  margin-top: 4px;
}

@media (max-width: 767px) {
  .profile-page {
    max-width: 100%;
  }
}
</style>
