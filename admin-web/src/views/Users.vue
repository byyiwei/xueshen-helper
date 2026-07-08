<template>
  <div class="users-page" v-loading="loading">
    <!-- 顶部操作栏 -->
    <div class="toolbar">
      <div class="toolbar-left">
        <el-input
          v-model="searchText"
          placeholder="搜索用户名 / OpenID"
          clearable
          class="search-input"
          @input="onSearchDebounced"
          @clear="loadUsers"
          @keyup.enter="loadUsers"
        >
          <template #prefix><el-icon><Search /></el-icon></template>
        </el-input>
        <el-select v-model="filterStatus" placeholder="状态筛选" clearable class="filter-select" @change="loadUsers">
          <el-option label="正常" value="正常" />
          <el-option label="封禁" value="封禁" />
        </el-select>
        <div class="sort-btns">
          <el-button :type="sortField === 'created_at' ? 'primary' : ''" @click="setSort('created_at')">
            注册时间
            <el-icon v-if="sortField === 'created_at'"><component :is="sortOrder === 'desc' ? 'CaretBottom' : 'CaretTop'" /></el-icon>
          </el-button>
          <el-button :type="sortField === 'nickname' ? 'primary' : ''" @click="setSort('nickname')">
            昵称
            <el-icon v-if="sortField === 'nickname'"><component :is="sortOrder === 'desc' ? 'CaretBottom' : 'CaretTop'" /></el-icon>
          </el-button>
        </div>
        <el-button @click="loadUsers">查询</el-button>
      </div>
      <div class="toolbar-right">
        <el-button v-if="selectedIds.length" type="warning" @click="handleBatchBan" :loading="batching">
          批量封禁({{ selectedIds.length }})
        </el-button>
        <el-button v-if="selectedIds.length" type="danger" @click="handleBatchDelete" :loading="deleting">
          批量删除({{ selectedIds.length }})
        </el-button>
      </div>
    </div>

    <!-- 表格 -->
    <el-card class="table-card" shadow="never">
      <el-table :data="userList" stripe @selection-change="onSelectionChange" ref="tableRef" style="width:100%" empty-text="暂无用户数据">
        <el-table-column type="selection" width="45" />
        <el-table-column prop="nickname" label="昵称" min-width="160">
          <template #default="{ row }">
            <div class="user-cell">
              <el-avatar :size="32" class="user-avatar">{{ row.nickname?.charAt(0) || 'U' }}</el-avatar>
              <span class="user-name">{{ row.nickname }}</span>
            </div>
          </template>
        </el-table-column>
        <el-table-column prop="openid" label="OpenID" min-width="220">
          <template #default="{ row }">
            <span v-if="row.openid" class="openid-cell" @click="copyOpenid(row.openid)">
              {{ row.openid }}
              <el-icon :size="12"><DocumentCopy /></el-icon>
            </span>
            <span v-else class="text-muted">未获取</span>
          </template>
        </el-table-column>
        <el-table-column prop="status" label="状态" width="90" align="center">
          <template #default="{ row }">
            <el-tag :type="row.status === '正常' ? 'success' : 'danger'" size="small">{{ row.status }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="createTime" label="注册时间" width="180" />
        <el-table-column label="操作" width="200" fixed="right">
          <template #default="{ row }">
            <el-button link type="primary" size="small" @click="editUser(row)">编辑</el-button>
            <el-button v-if="row.status === '正常'" link type="warning" size="small" @click="toggleBan(row)">封禁</el-button>
            <el-button v-else link type="success" size="small" @click="toggleBan(row)">解封</el-button>
            <el-button link type="danger" size="small" @click="deleteUser(row)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>

      <!-- 分页 -->
      <div class="pagination-wrap" v-if="total > pageSize">
        <el-pagination v-model:current-page="page" :total="total" :page-size="pageSize" layout="prev, pager, next" @current-change="loadUsers" />
      </div>
    </el-card>

    <!-- 编辑对话框 -->
    <el-dialog v-model="editVisible" title="编辑用户" width="400px" destroy-on-close>
      <el-form :model="editForm" label-width="80px" label-position="top">
        <el-form-item label="昵称">
          <el-input v-model="editForm.nickname" placeholder="输入新昵称" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="editVisible = false">取消</el-button>
        <el-button type="primary" :loading="saving" @click="confirmEdit">保存</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { adminAPI } from '../api'

const searchText = ref('')
const filterStatus = ref('')
const sortField = ref('created_at')
const sortOrder = ref('desc')
const loading = ref(false)
const userList = ref([])
const page = ref(1)
const pageSize = ref(20)
const total = ref(0)

const selectedIds = ref([])
const selectedRows = ref([])

// 编辑
const editVisible = ref(false)
const editForm = ref({ id: '', nickname: '', openid: '' })
const saving = ref(false)
const deleting = ref(false)
const batching = ref(false)

let searchTimer = null

onMounted(() => {
  loadUsers()
})

async function loadUsers() {
  loading.value = true
  try {
    const res = await adminAPI.getUsers({
      search: searchText.value,
      status: filterStatus.value,
      page: page.value,
      pageSize: pageSize.value,
      sortField: sortField.value,
      sortOrder: sortOrder.value
    })
    if (res.data) {
      userList.value = res.data.list || []
      total.value = res.data.total || 0
    }
  } catch { /* ignore */ } finally {
    loading.value = false
  }
}

function onSearchDebounced() {
  if (searchTimer) clearTimeout(searchTimer)
  searchTimer = setTimeout(() => {
    page.value = 1
    loadUsers()
  }, 300)
}

function setSort(field) {
  if (sortField.value === field) {
    sortOrder.value = sortOrder.value === 'desc' ? 'asc' : 'desc'
  } else {
    sortField.value = field
    sortOrder.value = 'desc'
  }
  loadUsers()
}

function onSelectionChange(rows) {
  selectedRows.value = rows
  selectedIds.value = rows.map(r => r.id)
}

function copyOpenid(openid) {
  if (!openid) return
  navigator.clipboard.writeText(openid).then(() => {
    ElMessage.success('已复制到剪贴板')
  }).catch(() => {
    ElMessage.error('复制失败')
  })
}

function editUser(user) {
  editForm.value = { id: user.id, nickname: user.nickname, openid: user.openid }
  editVisible.value = true
}

async function confirmEdit() {
  saving.value = true
  try {
    await adminAPI.updateUser(editForm.value.id, { nickname: editForm.value.nickname })
    ElMessage.success('修改成功')
    editVisible.value = false
    loadUsers()
  } catch { /* ignore */ } finally { saving.value = false }
}

async function toggleBan(user) {
  const newStatus = user.status === '正常' ? '封禁' : '正常'
  const action = newStatus === '封禁' ? '封禁' : '解封'
  try {
    await ElMessageBox.confirm(`确定要${action}该用户吗？`, '提示', { type: 'warning' })
    await adminAPI.updateUser(user.id, { status: newStatus, openid: user.openid })
    ElMessage.success(`已${action}`)
    loadUsers()
  } catch { /* ignore */ }
}

async function deleteUser(user) {
  try {
    await ElMessageBox.confirm(
      '危险操作！删除后将清除该用户的所有数据（包括宠物、足迹、记录等），此操作不可恢复！',
      '删除用户',
      { type: 'error', confirmButtonText: '确认删除' }
    )
    await ElMessageBox.confirm('再次确认：确定要删除该用户及其所有数据吗？', '二次确认', { type: 'error' })
    await adminAPI.deleteUser(user.id)
    ElMessage.success('删除成功')
    loadUsers()
  } catch { /* ignore */ }
}

async function handleBatchBan() {
  if (!selectedRows.value.length) { ElMessage.warning('请选择用户'); return }
  const targets = selectedRows.value.filter(u => u.status === '正常')
  if (!targets.length) { ElMessage.warning('选中的用户均已封禁'); return }
  await ElMessageBox.confirm(`确定封禁选中的 ${targets.length} 个用户？`, '批量封禁', { type: 'warning' })
  batching.value = true
  try {
    for (const u of targets) {
      await adminAPI.updateUser(u.id, { status: '封禁', openid: u.openid })
    }
    selectedIds.value = []
    selectedRows.value = []
    loadUsers()
  } catch { /* ignore */ } finally { batching.value = false }
}

async function handleBatchDelete() {
  if (!selectedRows.value.length) { ElMessage.warning('请选择用户'); return }
  await ElMessageBox.confirm(
    `危险操作！将删除选中的 ${selectedRows.value.length} 个用户及其所有数据，此操作不可恢复！`,
    '批量删除',
    { type: 'error', confirmButtonText: '确认删除' }
  )
  deleting.value = true
  try {
    for (const u of selectedRows.value) {
      await adminAPI.deleteUser(u.id)
    }
    selectedIds.value = []
    selectedRows.value = []
    loadUsers()
  } catch { /* ignore */ } finally { deleting.value = false }
}
</script>

<style scoped>
.users-page { max-width: 1200px; margin: 0 auto; }
.toolbar { display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 10px; margin-bottom: 16px; }
.toolbar-left { display: flex; gap: 10px; align-items: center; flex-wrap: wrap; }
.toolbar-right { display: flex; gap: 8px; align-items: center; flex-wrap: wrap; }
.search-input { width: 220px; }
.filter-select { width: 130px; }
.sort-btns { display: flex; gap: 4px; }
.user-cell { display: flex; align-items: center; gap: 8px; }
.user-avatar { background: #3A7CFF; color: #fff; font-weight: 600; flex-shrink: 0; font-size: 13px; }
.user-name { font-size: 14px; font-weight: 600; color: #1E293B; }
.openid-cell { font-size: 12px; color: #94a3b8; cursor: pointer; display: inline-flex; align-items: center; gap: 4px; word-break: break-all; }
.openid-cell:hover { color: #3A7CFF; }
.text-muted { color: #94a3b8; font-size: 13px; }
.table-card {
  border-radius: 12px;
  margin-bottom: 16px;
  box-shadow: 0 1px 3px rgba(0,0,0,0.08);
  border: 1px solid #E2E8F0;
}
.pagination-wrap { display: flex; justify-content: flex-end; margin-top: 16px; }

/* 响应式 */
@media (max-width: 767px) {
  .toolbar { flex-direction: column; align-items: stretch; }
  .search-input { width: 100%; }
  .filter-select { width: 100%; }
  .toolbar-right { justify-content: flex-end; }
}
</style>
