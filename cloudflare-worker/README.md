# 🌐 Cloudflare Worker 截图服务部署指南

## 📋 概述

本服务使用 Cloudflare Workers + Puppeteer 实现 HTML/CSS 到图片的截图功能。

**优势**：
- ✅ 免费额度：每天 **100,000 次**请求
- ✅ 无需信用卡（GitHub 登录即可）
- ✅ 全球 CDN 加速，国内访问速度快
- ✅ 100% 还原 CSS 效果（包括渐变、阴影等）

---

## 🚀 快速部署（10分钟）

### 第一步：准备工作

1. **注册 Cloudflare 账号**
   - 访问 https://dash.cloudflare.com
   - 使用 GitHub 账号登录（无需信用卡）

2. **安装 Wrangler CLI**
   ```bash
   # 如果没有 Node.js，先安装 https://nodejs.org
   npm install -g wrangler
   ```

3. **本地测试 Wrangler**
   ```bash
   wrangler --version
   # 应该显示版本号，如 3.x.x
   ```

### 第二步：部署 Worker

1. **克隆/复制代码**
   ```bash
   # 如果使用 Git
   git clone <your-repo>
   cd cloudflare-worker
   
   # 或者直接在项目目录找到 cloudflare-worker 文件夹
   ```

2. **安装依赖**
   ```bash
   cd cloudflare-worker
   npm install
   ```

3. **登录 Cloudflare**
   ```bash
   npx wrangler login
   ```
   - 浏览器会打开 Cloudflare 授权页面
   - 点击 "Authorize" 授权

4. **部署到 Cloudflare**
   ```bash
   npx wrangler deploy
   ```
   
   部署成功后会显示类似：
   ```
   deployed to:
   https://html-to-image.<your-subdomain>.workers.dev
   ```

### 第三步：测试服务

1. **使用 curl 测试**
   ```bash
   curl -X POST "https://html-to-image.<your-subdomain>.workers.dev" \
     -H "Content-Type: application/json" \
     -d '{
       "html": "<div style=\"width:300px;padding:20px;background:linear-gradient(135deg,#ffc53d,#B8860B);color:#fff;font-size:24px;text-align:center;\">Hello World!</div>",
       "options": {
         "viewport": {"width": 750},
         "format": "png"
       }
     }' \
     --output test.png
   ```

2. **查看图片**
   ```bash
   # macOS
   open test.png
   
   # Windows
   start test.png
   
   # Linux
   xdg-open test.png
   ```

### 第四步：接入小程序

1. **复制部署的 URL**
   部署成功后获得的 URL，例如：
   ```
   https://html-to-image.xxx.workers.dev
   ```

2. **更新小程序配置**
   
   编辑 `miniprogram/utils/htmlToImage.js`，修改：
   ```javascript
   const API_CONFIG = {
     // 替换为你部署的 URL
     workerUrl: 'https://html-to-image.xxx.workers.dev',
     // ...
   };
   ```

3. **在小程序页面中使用**
   
   在 `preview.js` 中：
   ```javascript
   const { generatePreviewImage } = require('../../utils/htmlToImage.js');
   
   // 替换原有的 saveToAlbum 方法
   async saveToAlbum() {
     try {
       const imagePath = await generatePreviewImage({
         pet: this.data.pet,
         pedigree: this.data.pedigreeData,
         records: this.data.records,
         qrcodeUrl: this.data.qrcodeUrl,
         currentTheme: this.data.currentTheme
       });
       
       // 保存到相册
       await new Promise((resolve, reject) => {
         wx.saveImageToPhotosAlbum({
           filePath: imagePath,
           success: () => {
             wx.showToast({ title: '已保存到相册', icon: 'success' });
             resolve();
           },
           fail: (err) => {
             if (err.errMsg.includes('auth deny')) {
               wx.showModal({
                 title: '需要授权',
                 content: '请允许保存图片到相册',
                 success: (res) => {
                   if (res.confirm) wx.openSetting();
                 }
               });
             }
             reject(err);
           }
         });
       });
     } catch (err) {
       console.error('保存失败:', err);
       wx.showToast({ title: '保存失败', icon: 'none' });
     }
   }
   ```

---

## 📝 API 文档

### 请求

**URL**: `https://html-to-image.<your-subdomain>.workers.dev`

**Method**: `POST`

**Content-Type**: `application/json`

### 参数

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `html` | string | ✅ | HTML 内容 |
| `css` | string | ❌ | 自定义 CSS |
| `options` | object | ❌ | 截图选项 |

### options 选项

| 选项 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `viewport.width` | number | 750 | 视口宽度（像素） |
| `viewport.height` | number | 1334 | 视口高度（像素） |
| `scaleFactor` | number | 2 | 缩放因子（1=标准，2=高清） |
| `format` | string | png | 图片格式 (png/jpeg/webp) |
| `fullPage` | boolean | true | 是否截取整个页面 |
| `response_type` | string | json | 返回类型 (json/image) |
| `delay` | number | 0 | 延迟截图时间（秒） |

### 响应

**成功** (response_type=json):
```json
{
  "success": true,
  "data": {
    "url": "data:image/png;base64,...",
    "width": 750,
    "height": 1334,
    "format": "png",
    "size": 123456
  }
}
```

**成功** (response_type=image):
- 直接返回图片二进制数据

**失败**:
```json
{
  "success": false,
  "error": "错误信息"
}
```

---

## 💰 免费额度说明

| 项目 | 免费额度 | 说明 |
|------|---------|------|
| 请求次数 | 100,000 次/天 | 超出按量计费 |
| 带宽 | 100,000 请求/天 | - |
| CPU 时间 | 10ms/请求 | 超出按量计费 |
| 响应大小 | 1MB | 免费版限制 |

**大多数个人用户完全够用！**

---

## 🔧 常见问题

### Q: 部署失败怎么办？

**A**: 检查错误信息，常见问题：
- `Not logged in` → 运行 `npx wrangler login`
- `Dependencies not found` → 运行 `npm install`
- 权限问题 → 检查 Cloudflare 账号权限

### Q: 截图不完整怎么办？

**A**: 尝试增加 `delay` 参数：
```javascript
{
  html: html,
  options: {
    delay: 1,  // 等待 1 秒
    fullPage: true
  }
}
```

### Q: 中文显示为方块怎么办？

**A**: Worker 默认不支持中文字体。解决方案：
1. 使用系统默认字体（部分支持）
2. 或者将文字转为图片（推荐用 Canvas）

### Q: 图片加载不出来？

**A**: 确保图片 URL 是公开可访问的：
- 支持：`https://` 开头的图片
- 不支持：需要登录的图片、本地文件

---

## 🎨 自定义域名（可选）

如果你有自己的域名，可以绑定：

1. 在 Cloudflare Dashboard 添加域名
2. 创建 CNAME 记录指向 Worker
3. 在 Worker 设置中绑定自定义域名

---

## 📞 获取帮助

- Cloudflare Workers 文档: https://developers.cloudflare.com/workers/
- Wrangler 文档: https://developers.cloudflare.com/workers/wrangler/
- @sparticuz/chromium: https://github.com/Sparticuz/chromium

---

## 📁 文件结构

```
cloudflare-worker/
├── src/
│   └── index.js      # Worker 主代码
├── package.json       # 依赖配置
├── wrangler.toml      # Cloudflare 配置
└── README.md          # 本文档
```

---

**祝你部署成功！🎉**
