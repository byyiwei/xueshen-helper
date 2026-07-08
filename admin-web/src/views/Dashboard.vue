<template>
  <div class="dashboard">
    <!-- 统计卡片 -->
    <div class="stats-row">
      <div class="stat-card card-blue">
        <div class="stat-icon">
          <el-icon :size="24"><User /></el-icon>
        </div>
        <div class="stat-body">
          <div class="stat-value">{{ stats.totalUsers }}</div>
          <div class="stat-label">总用户数</div>
          <div class="stat-trend up">↑ {{ stats.userGrowth }}%</div>
        </div>
      </div>
      <div class="stat-card card-green">
        <div class="stat-icon">
          <el-icon :size="24"><Guide /></el-icon>
        </div>
        <div class="stat-body">
          <div class="stat-value">{{ stats.totalPets }}</div>
          <div class="stat-label">宠物总数</div>
          <div class="stat-trend up">↑ {{ stats.petGrowth }}%</div>
        </div>
      </div>
      <div class="stat-card card-orange">
        <div class="stat-icon">
          <el-icon :size="24"><Sunny /></el-icon>
        </div>
        <div class="stat-body">
          <div class="stat-value">{{ stats.todayActive }}</div>
          <div class="stat-label">今日活跃</div>
        </div>
      </div>
    </div>

    <!-- 图表行 -->
    <div class="charts-row">
      <el-card class="chart-card">
        <template #header>
          <span class="card-title">用户增长趋势（7日）</span>
        </template>
        <v-chart class="chart" :option="growthChartOption" autoresize />
      </el-card>
      <el-card class="chart-card">
        <template #header>
          <span class="card-title">宠物类型分布</span>
        </template>
        <v-chart v-if="petDistribution.length" class="chart" :option="distChartOption" autoresize />
        <el-empty v-else description="暂无宠物数据" />
      </el-card>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { use } from 'echarts/core'
import { BarChart, PieChart } from 'echarts/charts'
import { TitleComponent, TooltipComponent, GridComponent, LegendComponent } from 'echarts/components'
import { CanvasRenderer } from 'echarts/renderers'
import VChart from 'vue-echarts'
import { adminAPI } from '../api'

use([BarChart, PieChart, TitleComponent, TooltipComponent, GridComponent, LegendComponent, CanvasRenderer])

const stats = reactive({
  totalUsers: 0,
  totalPets: 0,
  todayActive: 0,
  userGrowth: 0,
  petGrowth: 0
})

const userChartData = ref([])
const petDistribution = ref([])

const growthChartOption = computed(() => ({
  tooltip: { trigger: 'axis' },
  grid: { left: '3%', right: '4%', bottom: '3%', containLabel: true },
  xAxis: {
    type: 'category',
    data: userChartData.value.map(d => d.day)
  },
  yAxis: { type: 'value', minInterval: 1 },
  series: [{
    data: userChartData.value.map(d => d.count),
    type: 'bar',
    itemStyle: {
      color: '#3A7CFF',
      borderRadius: [4, 4, 0, 0]
    },
    barWidth: '50%'
  }]
}))

const distChartOption = computed(() => ({
  tooltip: { trigger: 'item', formatter: '{b}: {c}只 ({d}%)' },
  legend: { bottom: '0%' },
  series: [{
    type: 'pie',
    radius: ['45%', '70%'],
    avoidLabelOverlap: false,
    itemStyle: { borderRadius: 6, borderColor: '#fff', borderWidth: 2 },
    label: { show: false },
    data: petDistribution.value.map(d => ({ name: d.type, value: d.count }))
  }]
}))

onMounted(async () => {
  try {
    const [statsRes, growthRes, distRes] = await Promise.all([
      adminAPI.getStats(),
      adminAPI.getUserGrowth({ days: 7 }),
      adminAPI.getPetDistribution()
    ])

    if (statsRes.data) {
      Object.assign(stats, statsRes.data)
    }
    if (growthRes.data) {
      userChartData.value = growthRes.data
    }
    if (distRes.data) {
      petDistribution.value = distRes.data
    }
  } catch { /* ignore */ }
})
</script>

<style scoped>
.dashboard {
  max-width: 1200px;
  margin: 0 auto;
}

/* 统计卡片 */
.stats-row {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px;
  margin-bottom: 20px;
}

.stat-card {
  background: #fff;
  border-radius: 12px;
  padding: 20px;
  display: flex;
  align-items: center;
  gap: 16px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.04);
}

.stat-icon {
  width: 48px;
  height: 48px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.card-blue .stat-icon { background: #E6F0FF; color: #3A7CFF; }
.card-green .stat-icon { background: #D1FAE5; color: #059669; }
.card-purple .stat-icon { background: #EDE9FE; color: #7C3AED; }
.card-orange .stat-icon { background: #FEF3C7; color: #D97706; }

.stat-body {
  min-width: 0;
}

.stat-value {
  font-size: 26px;
  font-weight: 800;
  color: #1E293B;
  line-height: 1.2;
}

.stat-label {
  font-size: 13px;
  color: #94A3B8;
  margin-top: 2px;
}

.stat-trend {
  font-size: 12px;
  margin-top: 4px;
}

.stat-trend.up { color: #059669; }
.stat-trend.down { color: #DC2626; }

/* 图表行 */
.charts-row {
  display: grid;
  grid-template-columns: 3fr 2fr;
  gap: 16px;
  margin-bottom: 20px;
}

.chart-card {
  border-radius: 12px;
}

.chart {
  height: 280px;
}

.card-title {
  font-size: 15px;
  font-weight: 600;
  color: #1E293B;
}


/* 响应式 */
@media (max-width: 1023px) {
  .stats-row {
    grid-template-columns: repeat(2, 1fr);
  }

  .charts-row {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 767px) {
  .stats-row {
    grid-template-columns: repeat(2, 1fr);
    gap: 10px;
  }

  .stat-card {
    padding: 14px;
    gap: 10px;
  }

  .stat-icon {
    width: 40px;
    height: 40px;
  }

  .stat-value {
    font-size: 22px;
  }

  .chart {
    height: 220px;
  }
}
</style>
