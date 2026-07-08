/**
 * PM2 进程管理配置
 * 使用: pm2 start ecosystem.config.js
 * 敏感信息通过 .env 文件注入（dotenv 在 app.js 启动时加载）
 */
module.exports = {
  apps: [{
    name: 'turtle-archive-api',
    script: 'src/app.js',
    cwd: __dirname,
    instances: 1,
    exec_mode: 'fork',
    watch: false,
    max_memory_restart: '300M',
    env: {
      NODE_ENV: 'production'
    },
    // 日志配置
    log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
    error_file: '/www/wwwlogs/pets.openget.cn/error.log',
    out_file: '/www/wwwlogs/pets.openget.cn/out.log',
    merge_logs: true,
    // 自动重启配置
    autorestart: true,
    max_restarts: 10,
    min_uptime: '10s',
    listen_timeout: 3000,
    kill_timeout: 5000
  }]
}
