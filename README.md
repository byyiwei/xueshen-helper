# 学神助手 - 项目说明

## 项目结构

```
├── src/
│   ├── backend.py          # 后端主程序（HTTP服务、API、AI调用、支付）
│   ├── database.py         # 数据库操作（MySQL、自动迁移）
│   └── run_backend.py      # 后端启动入口
├── config/
│   ├── config.json         # 管理后台配置（已被.gitignore排除，不提交）
│   ├── config.example.json # 配置文件模板
│   ├── providers.json      # AI提供商配置（已被.gitignore排除，不提交）
│   ├── providers.example.json # AI提供商配置模板
│   ├── xs.openget.cn.conf  # Nginx 配置文件
│   └── jwt_secret.key      # JWT 密钥文件
├── scripts/
│   ├── xueshen-gf.js       # 油猴脚本 - GreasyFork版本
│   └── xueshen-sc.js       # 油猴脚本 - ScriptCat版本
├── static/
│   ├── admin.html          # 管理后台页面
│   ├── user.html           # 用户中心页面
│   ├── vue.global.js       # Vue.js运行时
│   └── icon.jpg            # 脚本图标
├── libs/                   # 前端依赖库（本地托管）
├── intro/
│   └── index.html          # 项目首页
├── publish_materials/      # 发布素材
├── docs/                   # 项目文档
├── .env.example            # 环境变量模板
└── README.md               # 项目说明
```

