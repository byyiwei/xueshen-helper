# 药品管理四功能实施计划

## 概述

为龟宠管理应用的药品模块新增 4 项功能：优化后台表单 UI、药品图片上传、缺失药品上报通道、管理后台上报管理+邮件通知。

## 当前状态分析

- **数据库**：`medicines` 表无图片字段；无上报表
- **上传机制**：已有 multer 中间件（`server/src/middleware/upload.js`），但用 `requireAuth`（用户 openid），管理员无法复用
- **邮件服务**：已有 nodemailer（`server/src/services/email.js`），仅用于密码重置，可扩展
- **后台菜单**：`AdminLayout.vue` 硬编码 `<el-menu-item>`，新增菜单需同步改路由+布局
- **小程序搜索**：纯前端过滤，无结果时仅显示文字提示，无上报入口
- **主色**：`#E8A400`（金色）

---

## 功能一：优化后台药品表单稀释预览 UI

**问题**：2 列网格 5 项数据，最后一项独占一行左侧，右侧留白。

**方案**：改为 flex 弹性换行布局，奇数最后一项占满整行。

**修改文件**：`admin-web/src/views/Medicines.vue`（仅 CSS）

- `.dilute-preview-grid`：`display: grid; grid-template-columns: 1fr 1fr` → `display: flex; flex-wrap: wrap; gap: 6px 12px`
- `.dilute-preview-row`：增加 `flex: 0 0 calc(50% - 6px); min-width: 0`
- `.dilute-preview-row:last-child:nth-child(odd)`：`flex-basis: 100%`
- `.dilute-detail`：增加 `word-break: break-all; flex: 1; min-width: 0`

---

## 功能二：药品图片上传

### 2.1 数据库

**迁移 SQL**（直接执行）：
```sql
ALTER TABLE `medicines` ADD COLUMN `image` VARCHAR(500) DEFAULT '' COMMENT '药品图片相对路径' AFTER `notes`;
```

同步更新 `server/database/schema.sql` 的表定义。

### 2.2 服务端

| 文件 | 改动 |
|------|------|
| `server/src/middleware/upload.js` | `getOpenId` 函数增加管理员回退：`return req.openid \|\| (req.adminId ? 'admin_' + req.adminId : 'anonymous')` |
| `server/src/routes/medicine.js` | 1. 公开接口 SELECT 增加 `image` 字段；2. `mapMedicine()` 增加 `image: r.image \|\| ''`；3. POST/PUT 接口处理 `image` 字段；4. 新增 `POST /admin/:id/image` 上传接口（用 `requireAdminAuth` + `uploadSingle`） |

### 2.3 管理后台

| 文件 | 改动 |
|------|------|
| `admin-web/vite.config.js` | 增加 `/uploads` 代理到 `http://localhost:3004` |
| `admin-web/src/api/index.js` | `medicineAPI` 增加 `uploadImage(id, file)` 方法（FormData POST） |
| `admin-web/src/views/Medicines.vue` | 1. `form` 增加 `image` 字段；2. 表单增加 `el-upload` 图片上传区域（编辑模式下可上传，新增模式先保存再上传）；3. `openDialog` 回填 image；4. `handleSave` data 增加 image；5. 增加图片预览/上传样式 |

图片上传组件设计：120x120 方形区域，有图显示缩略图，无图显示虚线占位框 + "点击上传图片" 文案。

### 2.4 小程序

| 文件 | 改动 |
|------|------|
| `miniprogram/.../medicine/calculator.js` | `_buildMed()` 增加 `image: found.image ? (api.getBaseUrl() + '/' + found.image) : ''` |
| `miniprogram/.../medicine/calculator.wxml` | `med-row` 中药品名前增加 `<image wx:if="{{selectedMedicine.image}}" class="med-image" .../>` |
| `miniprogram/.../medicine/calculator.wxss` | 增加 `.med-image`（96x96rpx 圆角）和 `.med-info-text` 样式 |

图片展示位置：药品名称左侧，96x96rpx 圆角缩略图，仅当 `image` 非空时显示。

---

## 功能三：缺失药品上报

### 3.1 数据库

**迁移 SQL**：
```sql
CREATE TABLE `medicine_reports` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `medicine_name` VARCHAR(100) NOT NULL COMMENT '药品名称',
  `email` VARCHAR(200) NOT NULL COMMENT '上报人邮箱',
  `status` VARCHAR(20) DEFAULT 'pending' COMMENT 'pending/completed/rejected',
  `admin_note` TEXT COMMENT '管理员备注',
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX `idx_status` (`status`),
  INDEX `idx_email` (`email`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='药品上报表';
```

### 3.2 服务端

**新建文件**：`server/src/routes/medicine-report.js`

- **POST `/api/medicine-reports`**（公开，无需鉴权）：接收 `medicineName` + `email`，邮箱校验，去重检查（同邮箱+同药名+pending），插入记录
- **GET `/api/medicine-reports/admin`**（管理员）：分页列表，支持 status/search 筛选
- **PUT `/api/medicine-reports/admin/:id`**（管理员）：更新状态/备注，当 status 改为 `completed` 时调用 `sendMedicineReportReply` 发邮件（try-catch 不阻断）

**修改文件**：`server/src/app.js` 增加 `app.use('/api/medicine-reports', require('./routes/medicine-report'))`

### 3.3 小程序

| 文件 | 改动 |
|------|------|
| `miniprogram/utils/api.js` | 新增 `reportMedicine(medicineName, email)` 方法 |
| `miniprogram/.../medicine/index.wxml` | 1. 空状态区域增加"上报药品"按钮；2. 页面底部增加上报弹窗（药品名称 + 邮箱 + 提示文字 + 提交按钮） |
| `miniprogram/.../medicine/index.js` | data 增加 `showReportModal`/`reportSubmitting`/`reportForm`；增加 `openReportModal`/`closeReportModal`/`onReportNameInput`/`onReportEmailInput`/`submitReport` 方法。`openReportModal` 预填当前搜索关键词 |
| `miniprogram/.../medicine/index.wxss` | 增加上报按钮、弹窗 mask/sheet、表单输入框、提交按钮样式（金色主题） |

弹窗设计：底部弹出 sheet，含药品名称输入框（预填搜索词）、邮箱输入框、提示文字"提交后管理员将审核并添加该药品，添加完成后会通过邮件通知您"、金色提交按钮。

---

## 功能四：管理后台上报管理 + 邮件通知

### 4.1 邮件服务

**修改文件**：`server/src/services/email.js`

新增 `sendMedicineReportReply(to, medicineName)` 函数：
- 复用 `loadSmtpConfig()` 读取数据库 SMTP 配置
- HTML 模板：金色标题"养龟档案 - 药品上报处理结果"，正文告知药品已添加
- 导出加入 `module.exports`

### 4.2 管理后台路由与菜单

| 文件 | 改动 |
|------|------|
| `admin-web/src/router/index.js` | children 增加 `{ path: 'medicine-reports', name: 'MedicineReports', component: () => import('../views/MedicineReports.vue'), meta: { title: '药品上报', icon: 'Bell' } }` |
| `admin-web/src/layouts/AdminLayout.vue` | 药品管理菜单项后增加 `<el-menu-item index="/medicine-reports"><el-icon><Bell /></el-icon><template #title>药品上报</template></el-menu-item>` |

### 4.3 管理后台 API

**修改文件**：`admin-web/src/api/index.js`

新增 `medicineReportAPI`：
- `getList(params)` → GET `/medicine-reports/admin`
- `update(id, data)` → PUT `/medicine-reports/admin/:id`

### 4.4 上报管理页面

**新建文件**：`admin-web/src/views/MedicineReports.vue`

页面结构：
- **顶部工具栏**：搜索框（药品名/邮箱）+ 状态筛选下拉（待处理/已完成/已拒绝）+ 查询按钮
- **数据表格**：药品名称、上报邮箱、状态（Tag 标签）、管理员备注、上报时间、操作列
- **操作按钮**：标记完成（绿色，弹确认提示"将自动发邮件通知用户"）、拒绝（橙色）、备注（打开弹窗编辑备注+状态）
- **分页**：超过 20 条显示分页

状态 Tag 颜色：pending=warning 黄色、completed=success 绿色、rejected=info 灰色。

---

## 实施顺序

1. **数据库变更**：ALTER medicines + CREATE medicine_reports
2. **功能一**：Medicines.vue 稀释预览 CSS（独立无依赖）
3. **功能二**：upload.js → medicine.js → vite.config → api/index.js → Medicines.vue → 小程序 calculator
4. **功能三+四**：medicine-report.js → app.js → email.js → 小程序 api/index/wxml/js/wxss → admin router/layout/api/MedicineReports.vue

## 假设与决策

- 图片存储相对路径而非完整 URL，跨环境可移植
- 管理员上传复用现有 multer，仅改 `getOpenId` 一行，存入 `uploads/admin_{id}/` 目录
- 上报接口公开无需鉴权（用户可能未登录），靠邮箱去重防刷
- 邮件发送失败不阻断流程，仅记录日志
- 小程序弹窗复用项目现有 modal 底部 sheet 模式，保持 UI 一致

## 验证步骤

1. 后台编辑药品 → 上传图片 → 保存 → 小程序计算器页看到图片
2. 小程序搜索不存在的药品 → 点"上报药品" → 填写名称+邮箱 → 提交成功
3. 后台"药品上报"菜单 → 看到上报记录 → 点"标记完成" → 用户收到邮件
4. 后台药品表单稀释预览面板布局整齐，无留白
