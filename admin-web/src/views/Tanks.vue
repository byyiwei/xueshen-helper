<template>
  <div class="tanks-page" v-loading="loading">
    <!-- 顶部操作栏 -->
    <div class="toolbar">
      <div class="toolbar-left">
        <el-input
          v-model="search"
          placeholder="搜索名称/品种"
          clearable
          class="search-input"
          @clear="loadList"
          @keyup.enter="loadList"
        >
          <template #prefix><el-icon><Search /></el-icon></template>
        </el-input>
        <el-select v-model="filterCategory" placeholder="分类筛选" clearable class="filter-select" @change="loadList">
          <el-option v-for="c in categories" :key="c" :label="c" :value="c" />
        </el-select>
        <el-button @click="loadList">查询</el-button>
      </div>
      <div class="toolbar-right">
        <el-button type="primary" @click="showDialog(null)"><el-icon><Plus /></el-icon>新增龟缸</el-button>
      </div>
    </div>

    <!-- 表格 -->
    <el-card class="table-card" shadow="never">
      <el-table :data="list" stripe style="width: 100%">
        <el-table-column prop="tank_code" label="编号" width="90" />
        <el-table-column prop="name" label="名称" min-width="120" />
        <el-table-column prop="size" label="尺寸" width="100" />
        <el-table-column prop="category" label="分类" width="100" />
        <el-table-column prop="species" label="饲养品种" width="120" />
        <el-table-column prop="male_count" label="公龟" width="70" />
        <el-table-column prop="female_count" label="母龟" width="70" />
        <el-table-column label="状态" width="80">
          <template #default="{ row }">
            <el-tag :type="row.enabled === 0 ? 'danger' : 'success'" size="small">
              {{ row.enabled === 0 ? '停用' : '启用' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="180" fixed="right">
          <template #default="{ row }">
            <el-button link type="primary" size="small" @click="showDialog(row)">编辑</el-button>
            <el-button link type="danger" size="small" @click="handleDelete(row)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>

      <!-- 分页 -->
      <div class="pagination-wrap">
        <el-pagination
          v-model:current-page="pageNum"
          v-model:page-size="pageSize"
          :total="total"
          :page-sizes="[10, 20, 50]"
          layout="total, sizes, prev, pager, next"
          @size-change="loadList"
          @current-change="loadList"
        />
      </div>
    </el-card>

    <!-- 新增/编辑弹窗 -->
    <el-dialog v-model="dialogVisible" :title="isEdit ? '编辑龟缸' : '新增龟缸'" width="520px" destroy-on-close>
      <el-form ref="formRef" :model="form" :rules="rules" label-width="100px">
        <el-form-item label="编号">
          <el-input v-model="form.tank_code" placeholder="留空则自动生成（如T001）" />
        </el-form-item>
        <el-form-item label="名称" prop="name">
          <el-input v-model="form.name" placeholder="如：1号缸" />
        </el-form-item>
        <el-form-item label="尺寸">
          <el-input v-model="form.size" placeholder="如：60×40×30cm" />
        </el-form-item>
        <el-form-item label="分类">
          <el-input v-model="form.category" placeholder="如：水龟、陆龟" />
        </el-form-item>
        <el-form-item label="饲养品种">
          <el-input v-model="form.species" placeholder="如：草龟、巴西龟" />
        </el-form-item>
        <el-form-item label="公龟数量">
          <el-input-number v-model="form.male_count" :min="0" />
        </el-form-item>
        <el-form-item label="母龟数量">
          <el-input-number v-model="form.female_count" :min="0" />
        </el-form-item>
        <el-form-item label="启用">
          <el-switch v-model="form.enabled" :active-value="1" :inactive-value="0" />
        </el-form-item>
        <el-form-item label="排序">
          <el-input-number v-model="form.sort_order" :min="0" />
        </el-form-item>
        <el-form-item label="备注">
          <el-input v-model="form.notes" type="textarea" :rows="2" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleSave" :loading="saving">保存</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import api from '../api'

const list = ref([])
const loading = ref(false)
const search = ref('')
const filterCategory = ref('')
const categories = ref([])
const pageNum = ref(1)
const pageSize = ref(20)
const total = ref(0)

const dialogVisible = ref(false)
const isEdit = ref(false)
const saving = ref(false)
const formRef = ref(null)

const form = reactive({
  id: null,
  tank_code: '',
  name: '',
  size: '',
  category: '无',
  species: '',
  male_count: 0,
  female_count: 0,
  notes: '',
  sort_order: 0,
  enabled: 1
})

const rules = {
  name: [{ required: true, message: '请输入名称', trigger: 'blur' }]
}

onMounted(() => {
  loadList()
})

async function loadList() {
  loading.value = true
  try {
    const params = { pageNum: pageNum.value, pageSize: pageSize.value }
    if (search.value) params.search = search.value
    if (filterCategory.value) params.category = filterCategory.value
    const res = await api.get('/tanks/admin', { params })
    if (res.data) {
      list.value = res.data.list || []
      total.value = res.data.total || 0
      // 提取分类列表
      const catSet = new Set(list.value.map(t => t.category).filter(Boolean))
      categories.value = [...catSet]
    }
  } catch (_) {}
  loading.value = false
}

function resetForm() {
  form.id = null
  form.tank_code = ''
  form.name = ''
  form.size = ''
  form.category = '无'
  form.species = ''
  form.male_count = 0
  form.female_count = 0
  form.notes = ''
  form.sort_order = 0
  form.enabled = 1
}

function showDialog(row) {
  resetForm()
  if (row) {
    isEdit.value = true
    Object.assign(form, {
      id: row.id,
      tank_code: row.tank_code || '',
      name: row.name,
      size: row.size || '',
      category: row.category || '无',
      species: row.species || '',
      male_count: row.male_count || 0,
      female_count: row.female_count || 0,
      notes: row.notes || '',
      sort_order: row.sort_order || 0,
      enabled: row.enabled
    })
  } else {
    isEdit.value = false
  }
  dialogVisible.value = true
}

async function handleSave() {
  const valid = await formRef.value.validate().catch(() => false)
  if (!valid) return

  saving.value = true
  try {
    const data = { ...form }
    delete data.id

    if (isEdit.value) {
      await api.put(`/tanks/admin/${form.id}`, data)
      ElMessage.success('更新成功')
    } else {
      await api.post('/tanks/admin', data)
      ElMessage.success('添加成功')
    }
    dialogVisible.value = false
    loadList()
  } catch (_) {}
  saving.value = false
}

async function handleDelete(row) {
  try {
    await ElMessageBox.confirm(`确认删除龟缸「${row.name}」？删除后关联的运维/繁殖/提醒数据也会一并删除。`, '确认删除', {
      type: 'warning',
      confirmButtonText: '删除',
      cancelButtonText: '取消'
    })
  } catch {
    return
  }
  try {
    await api.delete(`/tanks/admin/${row.id}`)
    ElMessage.success('删除成功')
    loadList()
  } catch (_) {}
}
</script>

<style scoped>
.tanks-page { max-width: 1200px; margin: 0 auto; }
.toolbar { display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 10px; margin-bottom: 16px; }
.toolbar-left { display: flex; gap: 10px; align-items: center; flex-wrap: wrap; }
.toolbar-right { display: flex; gap: 8px; align-items: center; flex-wrap: wrap; }
.search-input { width: 220px; }
.filter-select { width: 130px; }
.table-card { border-radius: 12px; margin-bottom: 16px; box-shadow: 0 1px 3px rgba(0,0,0,0.08); border: 1px solid #E2E8F0; }
.pagination-wrap { display: flex; justify-content: flex-end; margin-top: 16px; }

@media (max-width: 767px) {
  .toolbar { flex-direction: column; align-items: stretch; }
  .search-input { width: 100%; }
  .filter-select { width: 100%; }
  .toolbar-right { justify-content: flex-end; }
}
</style>
