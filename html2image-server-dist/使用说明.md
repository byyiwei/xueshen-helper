# HTML-to-Image Server · 使用说明

将 HTML 内容转换为 PNG / JPEG / WebP 图片的 HTTP 服务。  
基于 **Node.js + Puppeteer（无头 Chromium）**，跨平台运行（Windows / Linux / macOS）。

---

## 一、项目目录结构

```
html2image-server/
├── server.js              # 服务主程序（HTTP 接口 + Chromium 渲染）
├── stop.js                # 跨平台停止脚本
├── logger.js              # 日志工具（按日期滚动）
├── config.json            # ★ 所有可配置项
├── config.js              # 配置加载器（支持环境变量覆盖）
├── config-read.js         # 辅助工具：脚本读取配置用
├── package.json           # 依赖定义
├── api-docs.html          # 中文 API 文档（浏览器打开 /api-docs）
│
├── start-server.bat       # ── Windows 启动脚本
├── stop-server.bat        # ── Windows 停止脚本
│
├── start-server.sh        # ── Linux / macOS 启动脚本
├── stop-server.sh         # ── Linux / macOS 停止脚本
│
├── 使用说明.md            # 本文件
└── logs/                  # 运行时自动生成的日志目录
    ├── server-YYYY-MM-DD.log
    └── app_output.log     # 脚本启动模式下的 stdout/stderr
```

---

## 二、环境要求

| 项目 | 要求 |
|------|------|
| **Node.js** | ≥ 18（推荐 20 LTS 或更高）|
| **npm**    | 随 Node.js 自带 |
| **Chromium / Chrome** | Puppeteer 会在 `npm install` 时自动下载一份匹配版本。如无法自动下载（离线 / 受限网络），可通过配置指定系统已安装的 Chrome。 |

```bash
node --version   # 应输出 v18.x.x 或更高
npm --version
```

### 2.1 安装依赖（所有平台相同）

在项目目录执行：

```bash
npm install
```

> **Linux 提示**：服务器版（无图形界面）通常缺 `libx11, libxcomposite, libxcursor, libxdamage, libxext, libxfixes, libxi, libxtst, libnss3, libatk, libatk-bridge2.0, libcups2, libdrm2, libgbm1, libgtk-3-0, libpango, libasound2` 等系统库。  
> 可通过以下命令安装（Debian / Ubuntu）：
> ```bash
> sudo apt-get update
> sudo apt-get install -y fonts-noto-cjk fonts-wqy-zenhei \
>   libx11-6 libxcomposite1 libxcursor1 libxdamage1 libxext6 \
>   libxfixes3 libxi6 libxtst6 libnss3 libatk1.0-0 libatk-bridge2.0-0 \
>   libcups2 libdrm2 libgbm1 libgtk-3-0 libpango-1.0-0 \
>   libpangocairo-1.0-0 libasound2
> ```

---

## 三、启动服务

### 3.1 Windows

双击运行 `start-server.bat`，或在 PowerShell / CMD 中执行：

```bat
start-server.bat
```

脚本会检查 Node.js、依赖、端口占用，然后在后台启动 `node server.js`，并等待 `.app.pid` 文件出现以确认启动成功。

启动成功后显示：

```
================================================
  Server started successfully.
  PID:     12345
  URL:     http://localhost:3000
  Docs:    http://localhost:3000/api-docs
  Health:  http://localhost:3000/health
  Config:  http://localhost:3000/config
================================================
```

### 3.2 Linux / macOS

首次运行需给脚本加可执行权限（只做一次）：

```bash
chmod +x start-server.sh stop-server.sh
```

然后启动：

```bash
./start-server.sh
```

### 3.3 前台直接运行（调试用，所有平台通用）

```bash
node server.js
```

日志直接输出到控制台，按 `Ctrl+C` 停止。

---

## 四、停止服务

### 4.1 Windows

```bat
stop-server.bat
```

或：

```bat
node stop.js           :: 正常停止
node stop.js --force   :: 强制杀死
```

### 4.2 Linux / macOS

```bash
./stop-server.sh
```

或：

```bash
node stop.js           # 正常停止
node stop.js --force   # 强制杀死
node stop.js --pid 12345  # 手动指定 PID
```

**停止机制**：优先读取 `.app.pid` 文件中的进程 ID 并发送终止信号，再扫描 `node server.js` 命令行，最后检查占用端口的进程兜底，确保进程不会残留。

---

## 五、调用示例

### 5.1 快速验证

```bash
# 查看服务健康状态
curl http://localhost:3000/health

# 查看当前配置（只读摘要）
curl http://localhost:3000/config
```

### 5.2 生成一张 PNG 图片

```bash
curl -X POST http://localhost:3000/ \
  -H "Content-Type: application/json; charset=utf-8" \
  -d '{
    "html": "<h1 style=\"color:#0ea5e9;padding:40px;text-align:center;font-family:sans-serif;\">Hello html2image</h1>",
    "options": { "width": 800, "height": 400, "format": "png", "deviceScaleFactor": 2 }
  }'
```

**响应示例**：

```json
{
  "success": true,
  "image": "iVBORw0KGgoAAAANSUhEUgAA...(base64)...",
  "format": "png",
  "time": 1187
}
```

### 5.3 使用 Node.js 调用并保存到文件

```javascript
const fs = require('fs');

async function genImage() {
  const res = await fetch('http://localhost:3000/', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      html: '<h1 style="color:#0ea5e9;padding:40px;text-align:center;">Hello html2image</h1>',
      options: { width: 800, height: 400, format: 'png' }
    })
  });
  const data = await res.json();
  if (data.success) {
    fs.writeFileSync('output.png', Buffer.from(data.image, 'base64'));
    console.log(`Saved: output.png (${data.time} ms)`);
  } else {
    console.error('Error:', data.error);
  }
}
genImage();
```

### 5.4 在 HTML 中嵌入返回结果

```html
<script>
  fetch('http://localhost:3000/', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ html: '<h1>Hello</h1>', options: { format: 'png' } })
  })
    .then(r => r.json())
    .then(data => {
      const img = document.createElement('img');
      img.src = 'data:image/png;base64,' + data.image;
      document.body.appendChild(img);
    });
</script>
```

---

## 六、API 完整列表

| 方法 | 路径 | 说明 |
|------|------|------|
| `POST` | `/` | **主接口**：渲染 HTML → 图片（base64）|
| `GET`  | `/health` | 健康检查（负载均衡探针）|
| `GET`  | `/config` | 返回当前生效配置摘要（只读）|
| `GET`  | `/api-docs` | 中文 API 文档网页 |
| `GET`  | `/` | 服务信息（name / version / 各接口链接）|

### POST / 请求体

```json
{
  "html": "<h1>Hello</h1>",
  "options": {
    "width": 1280,
    "height": 800,
    "deviceScaleFactor": 2,
    "format": "png",
    "quality": 90,
    "fullPage": false,
    "waitFor": 0,
    "clip": null
  }
}
```

**字段说明**：

| 选项 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `html` | string | 必填 | 完整 HTML 或片段 |
| `options.width` | number | 1280 | 视口宽度（100–10000） |
| `options.height` | number | 800 | 视口高度（100–10000） |
| `options.deviceScaleFactor` | number | 2 | DPR / 像素比（1–5） |
| `options.format` | string | `png` | `png` / `jpeg` / `webp` |
| `options.quality` | number | 90 | jpeg / webp 压缩质量（1–100） |
| `options.fullPage` | boolean | false | 是否截取整个可滚动页面 |
| `options.clip` | object | null | `{ x, y, width, height }` — 仅截取指定区域 |
| `options.waitFor` | number | 0 | 页面加载完成后额外等待毫秒数 |
| `options.loadTimeout` | number | 30000 | 页面加载超时（毫秒） |

---

## 七、配置文件（config.json）

所有可配置项集中在项目根目录的 `config.json`。**修改后需重启服务才能生效**。

```json
{
  "server": {
    "host": "0.0.0.0",
    "port": 3000
  },
  "process": {
    "pidFile": ".app.pid"
  },
  "logging": {
    "logDir": "logs",
    "stdoutLog": "app_output.log",
    "startupLog": "startup.log",
    "stopLog": "stop.log"
  },
  "browser": {
    "executablePath": "",
    "headless": true,
    "launchTimeoutMs": 45000,
    "protocolTimeoutMs": 30000,
    "args": [
      "--no-sandbox",
      "--disable-setuid-sandbox",
      "--disable-dev-shm-usage",
      "--disable-gpu",
      "--disable-software-rasterizer",
      "--no-first-run",
      "--no-default-browser-check",
      "--disable-popup-blocking",
      "--disable-background-networking",
      "--disable-extensions"
    ]
  },
  "rendering": {
    "defaultViewport": { "width": 1280, "height": 800, "deviceScaleFactor": 2 },
    "defaultFormat": "png",
    "defaultQuality": 90,
    "loadTimeoutMs": 30000,
    "defaultWaitForMs": 0,
    "fullPageByDefault": false
  },
  "http": {
    "maxRequestBodyBytes": 10485760,
    "startupWaitSeconds": 15
  }
}
```

### 7.1 配置覆盖顺序

优先级从高到低：

1. **环境变量**（`H2I_` 前缀）
2. **config.json** 文件
3. **代码内默认值**

### 7.2 环境变量覆盖格式

规则：
- 前缀：`H2I_`
- 嵌套层级用单下划线 `_` 分隔
- key 名称中本身含有的下划线用双下划线 `__` 表示
- 大小写不敏感
- 数字和布尔值会自动转换

**示例**：

```bash
# Linux / macOS
H2I_SERVER_PORT=8080 node server.js                          # server.port = 8080
H2I_SERVER_HOST=127.0.0.1 ./start-server.sh                  # server.host
H2I_BROWSER__EXECUTABLE_PATH=/usr/bin/chromium node server.js # browser.executablePath
H2I_BROWSER__LAUNCH_TIMEOUT_MS=60000 node server.js          # browser.launchTimeoutMs
H2I_RENDERING__DEFAULT_FORMAT=jpeg node server.js            # rendering.defaultFormat
H2I_HTTP__MAX_REQUEST_BODY_BYTES=5242880 node server.js      # http.maxRequestBodyBytes
```

```bat
:: Windows CMD
set H2I_SERVER_PORT=8080
set H2I_BROWSER__EXECUTABLE_PATH=C:\Program Files\Google\Chrome\Application\chrome.exe
node server.js

:: 或用 PowerShell
$env:H2I_SERVER_PORT = '8080'
.\start-server.bat
```

---

## 八、常见问题

### Q1 启动后第一次 POST 请求很慢？

**A**：正常。Chromium 是懒启动的（首次请求时才真正拉起浏览器进程）。之后的请求会快得多（通常 100–500ms）。

### Q2 端口被占了怎么办？

**A**：
1. 先停掉老进程：`stop-server.bat` 或 `./stop-server.sh`
2. 修改 `config.json` 中的 `server.port`，或通过环境变量 `H2I_SERVER_PORT=8080` 临时换端口

### Q3 启动后提示浏览器启动失败 / 超时？

**A**：常见原因及解决：

- **Linux 服务器无图形库**：按 2.1 节安装系统依赖包
- **防火墙 / 沙箱限制**：`browser.args` 中已含 `--no-sandbox`，一般够用。如仍失败，可再追加 `--disable-seccomp-filter-sandbox`
- **系统中已有 Chrome 且 puppeteer 自带的版本不匹配**：在 `config.json` 中把 `browser.executablePath` 设为系统 Chrome 的完整路径（例如 `"C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe"`）
- **启动超时**：系统较慢时，可把 `browser.launchTimeoutMs` 调高到 `60000` 或更高

### Q4 响应 base64 太大？

**A**：
- 把 `format` 改为 `jpeg`（通常比 PNG 小 5–10 倍，体积 ~50KB vs ~500KB）
- 调小 `deviceScaleFactor` 到 `1`（DPR=1，图像会变小）
- 降低 `quality`

### Q5 日志在哪里？

**A**：写入 `logs/` 目录：

- `server-YYYY-MM-DD.log` —— 服务运行日志（INFO / WARN / ERROR）
- `app_output.log` —— Node 子进程的 stdout/stderr（脚本启动模式）
- `startup.log` / `stop.log` —— start/stop 脚本的操作记录

### Q6 如何让其他机器访问服务？

**A**：`server.host` 默认 `0.0.0.0`，已允许来自任意网卡的访问。只要防火墙放行对应端口（默认 3000），局域网内的其他机器即可访问。  
生产环境建议前方挂 Nginx 反代并加 HTTPS。

### Q7 忘记 PID 文件被删掉了怎么办？

**A**：不影响。`stop-server.bat` / `stop-server.sh` 会先尝试 PID 文件，再扫描 `node server.js` 命令行匹配，最后按端口兜底查找，多层保险。

---

## 九、API 文档在线查看

服务启动后在浏览器打开：

```
http://localhost:3000/api-docs
```

或直接在编辑器中打开 `api-docs.html` 文件查看。

---

© html2image-server v1.0.0
