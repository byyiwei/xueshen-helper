<template>
  <div class="medicines-page" v-loading="loading">
    <!-- 顶部操作栏 -->
    <div class="toolbar">
      <div class="toolbar-left">
        <el-input v-model="search" placeholder="搜索药品名称/适应症" clearable class="search-input" @clear="fetchList" @keyup.enter="fetchList">
          <template #prefix><el-icon><Search /></el-icon></template>
        </el-input>
        <el-select v-model="filterCategory" placeholder="分类筛选" clearable class="filter-select" @change="fetchList">
          <el-option v-for="c in categories" :key="c" :label="c" :value="c" />
        </el-select>
        <el-button @click="fetchList">查询</el-button>
      </div>
      <div class="toolbar-right">
        <el-button @click="handleExport" :loading="exporting"><el-icon><Download /></el-icon>导出</el-button>
        <el-upload :show-file-list="false" :before-upload="handleImport" accept=".json" :disabled="importing">
          <el-button :loading="importing"><el-icon><Upload /></el-icon>导入</el-button>
        </el-upload>
        <el-button v-if="selectedIds.length" type="danger" @click="handleBatchDelete" :loading="deleting">
          批量删除({{ selectedIds.length }})
        </el-button>
        <el-button type="primary" @click="openDialog()"><el-icon><Plus /></el-icon>新增药品</el-button>
      </div>
    </div>

    <!-- 表格 -->
    <el-card class="table-card" shadow="never">
      <el-table :data="list" stripe @selection-change="onSelectionChange" ref="tableRef" style="width:100%">
        <el-table-column type="selection" width="45" />
        <el-table-column prop="name" label="药品名称" min-width="120" />
        <el-table-column prop="category" label="分类" width="100">
          <template #default="{ row }"><el-tag size="small">{{ row.category }}</el-tag></template>
        </el-table-column>
        <el-table-column prop="indications" label="适应症" min-width="180" show-overflow-tooltip />
        <el-table-column prop="form" label="剂型" width="100" />
        <el-table-column label="给药方案" min-width="200">
          <template #default="{ row }">
            <template v-if="row.usageDosages && row.usageDosages.length">
              <el-tag v-for="(d, i) in row.usageDosages" :key="i" size="small" type="info" class="dosage-tag">
                {{ d.route }} {{ d.dose }}{{ d.unit }}
              </el-tag>
            </template>
            <span v-else class="text-muted">未设置</span>
          </template>
        </el-table-column>
        <el-table-column prop="enabled" label="状态" width="70" align="center">
          <template #default="{ row }">
            <el-switch :model-value="row.enabled" @change="toggleEnabled(row)" size="small" />
          </template>
        </el-table-column>
        <el-table-column label="操作" width="140" fixed="right">
          <template #default="{ row }">
            <el-button link type="primary" size="small" @click="openDialog(row)">编辑</el-button>
            <el-button link type="danger" size="small" @click="handleDelete(row)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>

      <!-- 分页 -->
      <div class="pagination-wrap" v-if="total > pageSize">
        <el-pagination v-model:current-page="page" :total="total" :page-size="pageSize" layout="prev, pager, next" @current-change="fetchList" />
      </div>
    </el-card>

    <!-- 新增/编辑对话框 -->
    <el-dialog v-model="dialogVisible" :title="isEdit ? '编辑药品' : '新增药品'" width="680px" destroy-on-close>
      <el-form :model="form" label-width="80px" label-position="top">
        <el-row :gutter="16">
          <el-col :span="12">
            <el-form-item label="药品名称" required>
              <el-input v-model="form.name" placeholder="如：阿莫西林" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="分类" required>
              <el-select v-model="form.category" placeholder="选择分类" style="width:100%">
                <el-option v-for="c in categories" :key="c" :label="c" :value="c" />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="16">
          <el-col :span="12">
            <el-form-item label="剂型描述">
              <el-input v-model="form.form" placeholder="如：粉剂/片剂" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="排序">
              <el-input-number v-model="form.sortOrder" :min="0" :max="999" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-form-item label="适应症">
          <el-input v-model="form.indications" type="textarea" :rows="2" placeholder="如：细菌感染、腐皮、烂甲" />
        </el-form-item>
        <el-form-item label="注意事项">
          <el-input v-model="form.notes" type="textarea" :rows="2" placeholder="如：疗程 5-7 天" />
        </el-form-item>
        <el-form-item label="药品图片">
          <el-upload
            v-if="isEdit"
            :show-file-list="false"
            :before-upload="handleImageUpload"
            accept="image/jpeg,image/png,image/webp"
          >
            <div class="image-upload-area">
              <el-image v-if="form.image" :src="imageUrl" fit="cover" class="medicine-image-preview" />
              <div v-else class="image-upload-placeholder">
                <el-icon><Plus /></el-icon>
                <span>点击上传图片</span>
              </div>
            </div>
          </el-upload>
          <div v-else class="image-upload-tip">
            <span style="color:#94a3b8;font-size:13px;">新增药品保存后可上传图片</span>
          </div>
        </el-form-item>

        <!-- 给药方案 -->
        <el-form-item label="给药方案">
          <div class="dosage-list">
            <div v-for="(item, index) in form.usageDosages" :key="index" class="dosage-card">
              <div class="dosage-card-head">
                <span class="dosage-card-title">方案 {{ index + 1 }}</span>
                <el-button link type="danger" @click="removeDosage(index)"><el-icon><Delete /></el-icon> 删除</el-button>
              </div>
              <div class="dosage-card-body">
                <div class="dosage-field">
                  <label class="dosage-label">给药途径</label>
                  <el-select v-model="item.route" placeholder="选择途径" style="width:140px">
                    <el-option v-for="r in routeOptions" :key="r" :label="r" :value="r" />
                  </el-select>
                </div>
                <div class="dosage-field">
                  <label class="dosage-label">剂量 <span class="dosage-hint">（每公斤体重用量）</span></label>
                  <div class="dosage-inline">
                    <el-input-number v-model="item.dose" :min="0.001" :step="0.1" :precision="3" placeholder="如 5" style="width:140px" />
                    <el-select v-model="item.unit" placeholder="单位" style="width:120px">
                      <el-option label="mg/kg" value="mg/kg" />
                      <el-option label="g/kg" value="g/kg" />
                      <el-option label="U/kg" value="U/kg" />
                      <el-option label="ml/kg" value="ml/kg" />
                    </el-select>
                  </div>
                </div>
                <!-- 注射途径：浓度 -->
                <div v-if="item.route === '注射'" class="dosage-field">
                  <label class="dosage-label">注射液浓度 <span class="dosage-hint">（药品包装上标注的浓度）</span></label>
                  <div class="dosage-inline">
                    <el-input-number v-model="item.concentration" :min="0.001" :step="1" :precision="3" placeholder="如 50" style="width:140px" />
                    <el-select v-model="item.concUnit" placeholder="浓度单位" style="width:120px">
                      <el-option label="mg/ml" value="mg/ml" />
                      <el-option label="g/ml" value="g/ml" />
                      <el-option label="g/L" value="g/L" />
                      <el-option label="U/ml" value="U/ml" />
                      <el-option label="%" value="%" />
                    </el-select>
                  </div>
                </div>
                <!-- 注射途径：自动稀释预览 -->
                <div v-if="item.route === '注射' && item.concentration > 0 && item.dose > 0" class="dilute-preview">
                  <div class="dilute-preview-title">稀释方案预览（系统自动计算，保存后小程序同步显示）</div>
                  <div class="dilute-preview-list">
                    <div v-for="w in diluteWeights" :key="w" class="dilute-preview-row">
                      <span class="dilute-weight">{{ w }}g</span>
                      <span class="dilute-detail">{{ generateDilution(item, w) }}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <el-button type="primary" link @click="addDosage"><el-icon><Plus /></el-icon>添加给药方案</el-button>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="saving" @click="handleSave">{{ isEdit ? '保存修改' : '确认新增' }}</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { medicineAPI } from '../api'

const categories = ['抗生素', '驱虫药', '真菌处理', '镇痛抗炎', '维生素', '消毒杀菌', '抗病毒药', '激素类', '补液支持', '代谢类', '消化系统', '解毒药', '呼吸系统', '其他']
const routeOptions = ['口服', '药浴', '注射']
const diluteWeights = [50, 100, 300, 500, 1000]

// 自动计算稀释方案
function generateDilution(item, weightG) {
  const conc = parseFloat(item.concentration)
  const dose = parseFloat(item.dose)
  if (!conc || !dose) return ''

  const weightKg = weightG / 1000
  const doseUnit = (item.unit || 'mg/kg').split('/')[0] || 'mg'
  const effectiveDose = weightKg * dose
  // 浓度单位与剂量单位一致（mg/ml → mg, g/ml → g, U/ml → U）
  const volumeMl = effectiveDose / conc

  if (volumeMl >= 0.2) {
    return `直接抽取 ${volumeMl.toFixed(2)}ml`
  }

  // 需要稀释：取1ml原液 + 整数ml生理盐水
  const origVol = 1
  let totalVol = 5
  while (volumeMl * totalVol / origVol < 0.1 && totalVol < 50) {
    totalVol += 5
  }
  const salineVol = totalVol - origVol
  const drawVol = volumeMl * totalVol / origVol
  const syringe = drawVol > 1 ? '5ml' : '1ml'

  return `取${origVol}ml原液+${salineVol}ml盐水=${totalVol}ml，抽${drawVol.toFixed(2)}ml（${syringe}注射器）`
}

const loading = ref(false)
const saving = ref(false)
const exporting = ref(false)
const importing = ref(false)
const deleting = ref(false)
const search = ref('')
const filterCategory = ref('')
const page = ref(1)
const pageSize = ref(20)
const total = ref(0)
const list = ref([])
const selectedIds = ref([])
const dialogVisible = ref(false)
const isEdit = ref(false)
const editId = ref(null)

const form = reactive({
  name: '', category: '', indications: '', form: '', notes: '', sortOrder: 0, image: '',
  usageDosages: []
})

const imageUrl = computed(() => {
  if (!form.image) return ''
  return form.image.startsWith('http') ? form.image : '/' + form.image
})

onMounted(() => fetchList())

async function fetchList() {
  loading.value = true
  try {
    const res = await medicineAPI.getList({ search: search.value, category: filterCategory.value, page: page.value, pageSize: pageSize.value })
    if (res.data) {
      list.value = res.data.list || []
      total.value = res.data.total || 0
    }
  } catch { /* ignore */ } finally { loading.value = false }
}

function onSelectionChange(rows) {
  selectedIds.value = rows.map(r => r.id)
}

function openDialog(row) {
  if (row) {
    isEdit.value = true
    editId.value = row.id
    form.name = row.name
    form.category = row.category
    form.indications = row.indications
    form.form = row.form
    form.notes = row.notes
    form.sortOrder = row.sortOrder
    form.image = row.image || ''
    form.usageDosages = (row.usageDosages || []).map(d => ({ route: d.route, dose: d.dose, unit: d.unit, concentration: d.concentration || 0, concUnit: d.concUnit || 'mg/ml', dilutionNote: d.dilutionNote || '' }))
  } else {
    isEdit.value = false
    editId.value = null
    form.name = ''; form.category = ''; form.indications = ''; form.form = ''; form.notes = ''; form.sortOrder = 0
    form.image = ''
    form.usageDosages = []
  }
  dialogVisible.value = true
}

function addDosage() {
  form.usageDosages.push({ route: '口服', dose: 0, unit: 'mg/kg', concentration: 0, concUnit: 'mg/ml', dilutionNote: '' })
}

function removeDosage(index) {
  form.usageDosages.splice(index, 1)
}

async function handleSave() {
  if (!form.name || !form.category) {
    ElMessage.warning('请填写药品名称和分类')
    return
  }
  saving.value = true
  try {
    const data = {
      name: form.name, category: form.category,
      indications: form.indications, form: form.form, notes: form.notes,
      sortOrder: form.sortOrder,
      image: form.image,
      usageDosages: form.usageDosages.filter(d => d.route && d.dose > 0).map(d => {
        const item = { route: d.route, dose: d.dose, unit: d.unit }
        if (d.route === '注射') {
          if (d.concentration > 0) {
            item.concentration = d.concentration
            item.concUnit = d.concUnit || 'mg/ml'
            // 自动生成稀释说明
            const weightKg = 0.1 // 以100g龟为参考
            const effectiveDose = weightKg * d.dose
            const volumeMl = effectiveDose / d.concentration
            const concLabel = `${d.concentration}${item.concUnit}`
            if (volumeMl < 0.2) {
              const origVol = 1
              let totalVol = 5
              while (volumeMl * totalVol / origVol < 0.1 && totalVol < 50) {
                totalVol += 5
              }
              const salineVol = totalVol - origVol
              const drawVol = volumeMl * totalVol / origVol
              item.dilutionNote = `浓度${concLabel}。体积<0.2ml需稀释：取1ml原液+${salineVol}ml生理盐水=${totalVol}ml，抽取${drawVol.toFixed(2)}ml注射`
            } else {
              item.dilutionNote = `浓度${concLabel}，可直接抽取注射`
            }
          }
        }
        return item
      })
    }
    if (isEdit.value) {
      await medicineAPI.update(editId.value, data)
    } else {
      await medicineAPI.create(data)
    }
    dialogVisible.value = false
    fetchList()
  } catch { /* ignore */ } finally { saving.value = false }
}

async function handleDelete(row) {
  await ElMessageBox.confirm(`确定删除「${row.name}」？`, '确认删除', { type: 'warning' })
  try { await medicineAPI.delete(row.id); fetchList() } catch { /* ignore */ }
}

async function handleBatchDelete() {
  if (!selectedIds.value.length) { ElMessage.warning('请选择药品'); return }
  await ElMessageBox.confirm(`确定删除选中的 ${selectedIds.value.length} 条药品？`, '批量删除', { type: 'warning' })
  deleting.value = true
  try { await medicineAPI.batchDelete(selectedIds.value); selectedIds.value = []; fetchList() } catch { /* ignore */ } finally { deleting.value = false }
}

async function toggleEnabled(row) {
  try {
    await medicineAPI.update(row.id, { enabled: !row.enabled })
    row.enabled = !row.enabled
  } catch { /* ignore */ }
}

async function handleExport() {
  exporting.value = true
  try {
    const res = await medicineAPI.exportAll()
    if (res.data) {
      const blob = new Blob([JSON.stringify(res.data, null, 2)], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url; a.download = 'medicines-export.json'; a.click()
      URL.revokeObjectURL(url)
      ElMessage.success('导出成功')
    }
  } catch { /* ignore */ } finally { exporting.value = false }
}

async function handleImport(file) {
  importing.value = true
  try {
    const text = await file.text()
    const data = JSON.parse(text)
    const list = Array.isArray(data) ? data : (data.data || [])
    if (!list.length) { ElMessage.warning('文件中没有有效数据'); return false }
    await medicineAPI.importData(list)
    fetchList()
  } catch (e) {
    ElMessage.error('导入失败：' + (e.message || '格式错误'))
  } finally { importing.value = false }
  return false
}

async function handleImageUpload(file) {
  if (!isEdit.value || !editId.value) {
    ElMessage.warning('请先保存药品后再上传图片')
    return false
  }
  try {
    const res = await medicineAPI.uploadImage(editId.value, file)
    if (res.data) {
      form.image = res.data.path
      ElMessage.success('图片上传成功')
    }
  } catch (e) {
    ElMessage.error('图片上传失败')
  }
  return false
}
</script>

<style scoped>
.medicines-page { max-width: 1200px; margin: 0 auto; }
.toolbar { display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 10px; margin-bottom: 16px; }
.toolbar-left { display: flex; gap: 10px; align-items: center; flex-wrap: wrap; }
.toolbar-right { display: flex; gap: 8px; align-items: center; flex-wrap: wrap; }
.search-input { width: 220px; }
.filter-select { width: 130px; }
.dosage-tag { margin: 2px 4px 2px 0; }
.text-muted { color: #94a3b8; font-size: 13px; }
.table-card {
  border-radius: 12px;
  margin-bottom: 16px;
  box-shadow: 0 1px 3px rgba(0,0,0,0.08);
  border: 1px solid #E2E8F0;
}
.pagination-wrap { display: flex; justify-content: flex-end; margin-top: 16px; }
.dosage-list { width: 100%; }
.dosage-card {
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  padding: 14px 16px;
  margin-bottom: 12px;
  background: #f8fafc;
}
.dosage-card-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 12px;
}
.dosage-card-title {
  font-size: 14px;
  font-weight: 600;
  color: #1e293b;
}
.dosage-card-body {
  display: flex;
  flex-direction: column;
  gap: 12px;
}
.dosage-field {
  display: flex;
  flex-direction: column;
  gap: 4px;
}
.dosage-label {
  font-size: 13px;
  font-weight: 600;
  color: #475569;
}
.dosage-hint {
  font-weight: 400;
  color: #94a3b8;
  font-size: 12px;
}
.dosage-inline {
  display: flex;
  align-items: center;
  gap: 8px;
}
.conc-wrap { display: flex; align-items: center; gap: 4px; }
.conc-unit { font-size: 13px; color: #94a3b8; white-space: nowrap; }

.dilute-preview {
  width: 100%;
  background: #FFF8E7;
  border: 1px solid #F0E0A0;
  border-radius: 8px;
  padding: 12px 14px;
  margin-top: 4px;
}
.dilute-preview-title {
  font-size: 13px;
  font-weight: 600;
  color: #C98D00;
  margin-bottom: 8px;
}
.dilute-preview-list {
  display: flex;
  flex-direction: column;
  gap: 4px;
}
.dilute-preview-row {
  display: flex;
  align-items: center;
  gap: 12px;
  font-size: 13px;
  line-height: 1.8;
  color: #475569;
}
.dilute-weight {
  flex-shrink: 0;
  width: 44px;
  font-weight: 600;
  color: #1E293B;
  text-align: right;
}
.dilute-detail {
  color: #64748B;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.image-upload-area { width: 120px; height: 120px; }
.medicine-image-preview { width: 120px; height: 120px; border-radius: 8px; border: 1px solid #e2e8f0; }
.image-upload-placeholder {
  width: 120px; height: 120px;
  border: 1px dashed #cbd5e1; border-radius: 8px;
  display: flex; flex-direction: column;
  align-items: center; justify-content: center;
  gap: 4px; color: #94a3b8; cursor: pointer;
}
.image-upload-placeholder .el-icon { font-size: 24px; }
.image-upload-placeholder span { font-size: 12px; }
</style>
