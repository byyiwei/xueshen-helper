<template>
  <div class="pets-page" v-loading="loading">
    <!-- 顶部操作栏 -->
    <div class="toolbar">
      <div class="toolbar-left">
        <el-input
          v-model="searchText"
          placeholder="搜索宠物名称"
          clearable
          class="search-input"
          @clear="handleSearch"
          @keyup.enter="handleSearch"
          @input="onSearchDebounced"
        >
          <template #prefix><el-icon><Search /></el-icon></template>
        </el-input>
        <el-select v-model="filterCategory" placeholder="分类筛选" clearable class="filter-select" @change="handleSearch">
          <el-option v-for="cat in categories" :key="cat" :label="cat" :value="cat" />
        </el-select>
        <el-button @click="handleSearch">查询</el-button>
      </div>
      <div class="toolbar-right"></div>
    </div>

    <!-- 表格 -->
    <el-card class="table-card" shadow="never">
      <el-table :data="petList" stripe style="width:100%" empty-text="暂无宠物数据">
        <el-table-column prop="name" label="宠物名称" min-width="120" />
        <el-table-column prop="category" label="分类" width="120">
          <template #default="{ row }"><el-tag size="small">{{ row.category || '其他' }}</el-tag></template>
        </el-table-column>
        <el-table-column prop="owner" label="主人" min-width="120" />
        <el-table-column prop="createTime" label="注册时间" min-width="160" />
      </el-table>

      <!-- 分页 -->
      <div class="pagination-wrap" v-if="total > pageSize">
        <el-pagination
          v-model:current-page="page"
          :total="total"
          :page-size="pageSize"
          layout="prev, pager, next"
          @current-change="loadPets"
        />
      </div>
    </el-card>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { Search } from '@element-plus/icons-vue'
import { adminAPI } from '../api'

const searchText = ref('')
const filterCategory = ref('')
const loading = ref(false)
const petList = ref([])
const page = ref(1)
const pageSize = ref(20)
const total = ref(0)
const categories = ref([])

let searchTimer = null

onMounted(() => {
  loadPets()
})

async function loadPets() {
  loading.value = true
  try {
    const res = await adminAPI.getPets({
      search: searchText.value,
      category: filterCategory.value,
      page: page.value,
      pageSize: pageSize.value
    })
    if (res.data) {
      petList.value = res.data.list || []
      total.value = res.data.total || 0
      // 提取分类列表
      const catSet = new Set(petList.value.map(p => p.category).filter(Boolean))
      categories.value = [...catSet]
    }
  } catch { /* ignore */ } finally {
    loading.value = false
  }
}

function handleSearch() {
  page.value = 1
  loadPets()
}

function onSearchDebounced() {
  if (searchTimer) clearTimeout(searchTimer)
  searchTimer = setTimeout(() => {
    handleSearch()
  }, 300)
}
</script>

<style scoped>
.pets-page { max-width: 1200px; margin: 0 auto; }
.toolbar { display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 10px; margin-bottom: 16px; }
.toolbar-left { display: flex; gap: 10px; align-items: center; flex-wrap: wrap; }
.toolbar-right { display: flex; gap: 8px; align-items: center; flex-wrap: wrap; }
.search-input { width: 220px; }
.filter-select { width: 130px; }
.table-card {
  border-radius: 12px;
  margin-bottom: 16px;
  box-shadow: 0 1px 3px rgba(0,0,0,0.08);
  border: 1px solid #E2E8F0;
}
.pagination-wrap { display: flex; justify-content: flex-end; margin-top: 16px; }

@media (max-width: 767px) {
  .search-input, .filter-select {
    width: 100%;
  }
}
</style>
