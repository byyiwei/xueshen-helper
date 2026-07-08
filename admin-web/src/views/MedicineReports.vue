<template>
  <div class="reports-page" v-loading="loading">
    <div class="toolbar">
      <div class="toolbar-left">
        <el-input v-model="search" placeholder="搜索药品名称/邮箱" clearable class="search-input"
                  @clear="fetchList" @keyup.enter="fetchList">
          <template #prefix><el-icon><Search /></el-icon></template>
        </el-input>
        <el-select v-model="filterStatus" placeholder="状态筛选" clearable class="filter-select" @change="fetchList">
          <el-option label="待处理" value="pending" />
          <el-option label="已完成" value="completed" />
          <el-option label="已拒绝" value="rejected" />
        </el-select>
        <el-button @click="fetchList">查询</el-button>
      </div>
    </div>

    <el-card class="table-card" shadow="never">
      <el-table :data="list" stripe style="width:100%">
        <el-table-column prop="medicineName" label="药品名称" min-width="120" />
        <el-table-column prop="email" label="上报邮箱" min-width="180" show-overflow-tooltip />
        <el-table-column prop="status" label="状态" width="100">
          <template #default="{ row }">
            <el-tag :type="statusTagType(row.status)" size="small">{{ statusLabel(row.status) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="adminNote" label="管理员备注" min-width="160" show-overflow-tooltip />
        <el-table-column prop="createTime" label="上报时间" width="160" />
        <el-table-column label="操作" width="200" fixed="right">
          <template #default="{ row }">
            <el-button link type="success" size="small" @click="handleComplete(row)"
                       :disabled="row.status === 'completed'">标记完成</el-button>
            <el-button link type="warning" size="small" @click="handleReject(row)"
                       :disabled="row.status === 'rejected'">拒绝</el-button>
            <el-button link type="primary" size="small" @click="openNoteDialog(row)">备注</el-button>
          </template>
        </el-table-column>
      </el-table>

      <div class="pagination-wrap" v-if="total > pageSize">
        <el-pagination v-model:current-page="page" :total="total" :page-size="pageSize"
                       layout="prev, pager, next" @current-change="fetchList" />
      </div>
    </el-card>

    <el-dialog v-model="noteDialogVisible" title="编辑备注" width="500px">
      <el-form label-position="top">
        <el-form-item label="药品名称">
          <el-input :model-value="currentRow.medicineName" disabled />
        </el-form-item>
        <el-form-item label="管理员备注">
          <el-input v-model="noteForm.adminNote" type="textarea" :rows="4" placeholder="处理说明..." />
        </el-form-item>
        <el-form-item label="状态">
          <el-select v-model="noteForm.status" style="width:100%">
            <el-option label="待处理" value="pending" />
            <el-option label="已完成" value="completed" />
            <el-option label="已拒绝" value="rejected" />
          </el-select>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="noteDialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="saving" @click="handleSaveNote">保存</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { medicineReportAPI } from '../api'

const loading = ref(false)
const saving = ref(false)
const search = ref('')
const filterStatus = ref('')
const page = ref(1)
const pageSize = ref(20)
const total = ref(0)
const list = ref([])

const noteDialogVisible = ref(false)
const currentRow = ref({})
const noteForm = reactive({ adminNote: '', status: 'pending' })

onMounted(() => fetchList())

async function fetchList() {
  loading.value = true
  try {
    const res = await medicineReportAPI.getList({
      search: search.value, status: filterStatus.value,
      page: page.value, pageSize: pageSize.value
    })
    if (res.data) {
      list.value = res.data.list || []
      total.value = res.data.total || 0
    }
  } catch { /* ignore */ } finally { loading.value = false }
}

function statusLabel(status) {
  return { pending: '待处理', completed: '已完成', rejected: '已拒绝' }[status] || status
}

function statusTagType(status) {
  return { pending: 'warning', completed: 'success', rejected: 'info' }[status] || ''
}

async function handleComplete(row) {
  try {
    await ElMessageBox.confirm(
      `确认将「${row.medicineName}」标记为已完成？\n系统将自动发送邮件通知用户 ${row.email}`,
      '确认完成', { type: 'success' }
    )
    const res = await medicineReportAPI.update(row.id, { status: 'completed' })
    if (res.success) {
      ElMessage.success('已标记完成，邮件已发送')
      fetchList()
    }
  } catch { /* 用户取消 */ }
}

async function handleReject(row) {
  try {
    await ElMessageBox.confirm(`确认拒绝「${row.medicineName}」的上报？`, '确认拒绝', { type: 'warning' })
    const res = await medicineReportAPI.update(row.id, { status: 'rejected' })
    if (res.success) {
      ElMessage.success('已拒绝')
      fetchList()
    }
  } catch { /* 用户取消 */ }
}

function openNoteDialog(row) {
  currentRow.value = row
  noteForm.adminNote = row.adminNote || ''
  noteForm.status = row.status
  noteDialogVisible.value = true
}

async function handleSaveNote() {
  saving.value = true
  try {
    const res = await medicineReportAPI.update(currentRow.value.id, {
      status: noteForm.status,
      adminNote: noteForm.adminNote
    })
    if (res.success) {
      ElMessage.success('保存成功')
      noteDialogVisible.value = false
      fetchList()
    }
  } catch { /* ignore */ } finally { saving.value = false }
}
</script>

<style scoped>
.reports-page { max-width: 1200px; margin: 0 auto; }
.toolbar { display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 10px; margin-bottom: 16px; }
.toolbar-left { display: flex; gap: 10px; align-items: center; flex-wrap: wrap; }
.search-input { width: 240px; }
.filter-select { width: 130px; }
.table-card {
  border-radius: 12px;
  margin-bottom: 16px;
  box-shadow: 0 1px 3px rgba(0,0,0,0.08);
  border: 1px solid #E2E8F0;
}
.pagination-wrap { display: flex; justify-content: flex-end; margin-top: 16px; }
</style>
