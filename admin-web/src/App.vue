<template>
  <router-view />
</template>

<script setup>
</script>

<style>
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

html, body, #app {
  height: 100%;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'PingFang SC', 'Microsoft YaHei', sans-serif;
  background: #F5F7FA;
}

/* 响应式断点 */
:root {
  --sidebar-width: 220px;
  --sidebar-collapsed-width: 64px;
  --header-height: 56px;
  --color-primary: #3A7CFF;
  --color-bg: #F5F7FA;
  --color-card: #FFFFFF;
  --color-text: #1E293B;
  --color-text-secondary: #94A3B8;
  --color-border: #E5E7EB;
}
</style>
