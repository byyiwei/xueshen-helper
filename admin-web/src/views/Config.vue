<template>
  <div class="config-page" v-loading="loading">
    <!-- 基础配置 -->
    <el-card class="section-card">
      <template #header><span class="section-title">基础配置</span></template>
      <el-form :model="config" label-width="140px" label-position="left">
        <el-row :gutter="20">
          <el-col :md="12" :xs="24">
            <el-form-item label="系统名称">
              <el-input v-model="config.systemName" placeholder="系统名称" />
            </el-form-item>
          </el-col>
          <el-col :md="12" :xs="24">
            <el-form-item label="版本号">
              <el-input v-model="config.version" placeholder="版本号" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="20">
          <el-col :md="12" :xs="24">
            <el-form-item label="客服电话">
              <el-input v-model="config.servicePhone" placeholder="客服电话" />
            </el-form-item>
          </el-col>
        </el-row>
      </el-form>
    </el-card>

    <!-- 业务配置 -->
    <el-card class="section-card">
      <template #header><span class="section-title">业务配置</span></template>
      <el-form :model="config" label-width="140px" label-position="left">
        <el-row :gutter="20">
          <el-col :md="12" :xs="24">
            <el-form-item label="最大宠物数量">
              <el-input-number v-model="config.maxPetCount" :min="1" :max="100" />
            </el-form-item>
          </el-col>
        </el-row>
      </el-form>
    </el-card>

    <!-- 功能开关 -->
    <el-card class="section-card">
      <template #header><span class="section-title">功能开关</span></template>
      <el-form :model="config" label-width="140px" label-position="left">
        <el-row :gutter="20">
          <el-col :md="12" :xs="24">
            <el-form-item label="允许新用户注册">
              <el-switch v-model="config.allowRegister" />
            </el-form-item>
          </el-col>
          <el-col :md="12" :xs="24">
            <el-form-item label="允许匿名访问">
              <el-switch v-model="config.allowAnonymous" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="20">
          <el-col :md="12" :xs="24">
            <el-form-item label="启用推送通知">
              <el-switch v-model="config.enablePush" />
            </el-form-item>
          </el-col>
        </el-row>
      </el-form>
    </el-card>

    <!-- 图片服务配置 -->
    <el-card class="section-card">
      <template #header><span class="section-title">图片服务配置</span></template>
      <el-form :model="config" label-width="140px" label-position="left">
        <el-row :gutter="20">
          <el-col :md="12" :xs="24">
            <el-form-item label="图片服务地址">
              <el-input v-model="config.imageServerUrl" placeholder="HTML转图片服务地址" />
            </el-form-item>
          </el-col>
          <el-col :md="12" :xs="24">
            <el-form-item label="服务超时时间(ms)">
              <el-input-number v-model="config.imageTimeout" :min="10000" :step="10000" :max="120000" />
            </el-form-item>
          </el-col>
        </el-row>
      </el-form>
    </el-card>

    <!-- 腾讯云 COS 配置 -->
    <el-card class="section-card">
      <template #header><span class="section-title">腾讯云 COS 配置</span></template>
      <el-form :model="config" label-width="140px" label-position="left">
        <el-row :gutter="20">
          <el-col :md="12" :xs="24">
            <el-form-item label="SecretId">
              <el-input v-model="config.qcloudSecretId" placeholder="腾讯云 SecretId" />
            </el-form-item>
          </el-col>
          <el-col :md="12" :xs="24">
            <el-form-item label="SecretKey">
              <el-input v-model="config.qcloudSecretKey" type="password" show-password placeholder="腾讯云 SecretKey" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="20">
          <el-col :md="12" :xs="24">
            <el-form-item label="存储桶(Bucket)">
              <el-input v-model="config.qcloudBucket" placeholder="例如: bucket-123456789" />
            </el-form-item>
          </el-col>
          <el-col :md="12" :xs="24">
            <el-form-item label="区域(Region)">
              <el-input v-model="config.qcloudRegion" placeholder="例如: ap-guangzhou" />
            </el-form-item>
          </el-col>
        </el-row>
      </el-form>
    </el-card>

    <!-- 语音识别配置 -->
    <el-card class="section-card">
      <template #header><span class="section-title">语音识别配置</span></template>
      <el-form :model="config" label-width="140px" label-position="left">
        <el-row :gutter="20">
          <el-col :md="12" :xs="24">
            <el-form-item label="SecretId">
              <el-input v-model="config.asrSecretId" placeholder="腾讯云 SecretId" />
            </el-form-item>
          </el-col>
          <el-col :md="12" :xs="24">
            <el-form-item label="SecretKey">
              <el-input v-model="config.asrSecretKey" type="password" show-password placeholder="腾讯云 SecretKey" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="20">
          <el-col :md="12" :xs="24">
            <el-form-item label="区域(Region)">
              <el-input v-model="config.asrRegion" placeholder="例如: ap-guangzhou" />
            </el-form-item>
          </el-col>
        </el-row>
      </el-form>
    </el-card>

    <!-- 保存 -->
    <div class="save-bar">
      <el-button type="primary" size="large" :loading="saving" @click="saveConfig">保存配置</el-button>
      <el-button size="large" @click="loadConfig">重置修改</el-button>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { adminAPI } from '../api'

const loading = ref(false)
const saving = ref(false)

const defaultConfig = {
  systemName: '',
  version: '',
  servicePhone: '',
  cloudEnvId: '',
  imageServer: '',
  imageServerUrl: '',
  imageTimeout: 60000,
  apiUrl: '',
  maxPetCount: 10,
  allowRegister: true,
  allowAnonymous: false,
  enablePush: false,
  notice: '',
  qcloudSecretId: '',
  qcloudSecretKey: '',
  qcloudBucket: '',
  qcloudRegion: 'ap-guangzhou',
  asrSecretId: '',
  asrSecretKey: '',
  asrRegion: 'ap-guangzhou'
}

const config = reactive({ ...defaultConfig })

onMounted(() => {
  loadConfig()
})

async function loadConfig() {
  loading.value = true
  try {
    const res = await adminAPI.getConfig()
    if (res.data) {
      // 后端存储为字符串，需转换布尔值类型
      const raw = res.data
      const merged = {
        ...defaultConfig,
        systemName: raw.systemName || '',
        version: raw.version || '',
        servicePhone: raw.servicePhone || '',
        cloudEnvId: raw.cloudEnvId || '',
        imageServer: raw.imageServer || '',
        imageServerUrl: raw.imageServerUrl || '',
        imageTimeout: parseInt(raw.imageTimeout) || 60000,
        apiUrl: raw.apiUrl || '',
        maxPetCount: parseInt(raw.maxPetCount) || 10,
        allowRegister: raw.allowRegister === 'true' || raw.allowRegister === true,
        allowAnonymous: raw.allowAnonymous === 'true' || raw.allowAnonymous === true,
        enablePush: raw.enablePush === 'true' || raw.enablePush === true,
        notice: raw.notice || '',
        qcloudSecretId: raw.qcloudSecretId || '',
        qcloudSecretKey: raw.qcloudSecretKey || '',
        qcloudBucket: raw.qcloudBucket || '',
        qcloudRegion: raw.qcloudRegion || 'ap-guangzhou',
        asrSecretId: raw.asrSecretId || '',
        asrSecretKey: raw.asrSecretKey || '',
        asrRegion: raw.asrRegion || 'ap-guangzhou'
      }
      Object.assign(config, merged)
    }
  } catch { /* ignore */ } finally {
    loading.value = false
  }
}

async function saveConfig() {
  saving.value = true
  try {
    // 转换为后端存储格式（string values）
    const data = {}
    for (const [key, value] of Object.entries(config)) {
      data[key] = typeof value === 'boolean' ? String(value) : String(value ?? '')
    }
    await adminAPI.updateConfig(data)
    ElMessage.success('配置已保存')
  } catch { /* ignore */ } finally {
    saving.value = false
  }
}
</script>

<style scoped>
.config-page {
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

.save-bar {
  display: flex;
  gap: 12px;
  padding: 16px 0 40px;
}

@media (max-width: 767px) {
  .config-page {
    max-width: 100%;
  }
}
</style>
