/**
 * Cloudflare Worker - HTML to Image Screenshot Service
 * 使用 Cloudflare Browser Rendering API 将 HTML/CSS 渲染为图片
 * 
 * 部署方式：
 * 1. 创建 API Token: https://dash.cloudflare.com/profile/api-tokens
 *    - 权限: Browser Rendering - Edit
 * 2. 设置环境变量 CLOUDFLARE_API_TOKEN
 * 3. npx wrangler deploy
 */

// 配置
const CONFIG = {
  viewport: {
    width: 750,        // 小程序标准宽度
    height: 1334,      // 默认高度
    deviceScaleFactor: 2, // 2倍图（高清）
  },
  format: 'png',       // 输出格式
  fullPage: true,      // 截取整个页面
  timeout: 30000,      // 超时时间 (ms)
};

// 主处理函数
export default {
  async fetch(request, env, ctx) {
    const corsHeaders = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    };

    // 处理 CORS 预检请求
    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders });
    }

    try {
      let html = '';
      let css = '';
      let options = {};

      // 解析请求
      if (request.method === 'POST') {
        const contentType = request.headers.get('content-type') || '';
        
        if (contentType.includes('application/json')) {
          const body = await request.json();
          html = body.html || '';
          css = body.css || '';
          options = body.options || {};
        }
      } else if (request.method === 'GET') {
        const url = new URL(request.url);
        html = decodeURIComponent(url.searchParams.get('html') || '');
        css = decodeURIComponent(url.searchParams.get('css') || '');
        options = JSON.parse(decodeURIComponent(url.searchParams.get('options') || '{}'));
      }

      if (!html) {
        return new Response(JSON.stringify({
          success: false,
          error: '缺少 html 参数'
        }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      // 合并选项
      const finalOptions = { ...CONFIG, ...options };
      const viewport = {
        width: finalOptions.viewport?.width || CONFIG.viewport.width,
        height: finalOptions.viewport?.height || CONFIG.viewport.height,
        deviceScaleFactor: finalOptions.scaleFactor || CONFIG.viewport.deviceScaleFactor,
      };

      // 构建完整的 HTML 页面
      const fullHtml = buildHtml(html, css, viewport.width);

      // 调用 Cloudflare Browser Rendering API
      const accountId = env.CLOUDFLARE_ACCOUNT_ID || '60a39f952c4569aff95be54f130601c2';
      const apiToken = env.CLOUDFLARE_API_TOKEN;
      
      if (!apiToken) {
        return new Response(JSON.stringify({
          success: false,
          error: '未配置 CLOUDFLARE_API_TOKEN'
        }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      const screenshotResponse = await fetch(
        `https://api.cloudflare.com/client/v4/accounts/${accountId}/browser-rendering/screenshot`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${apiToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            html: fullHtml,
            viewport: viewport,
            screenshotOptions: {
              fullPage: finalOptions.fullPage,
              type: finalOptions.format,
              omitBackground: false,
            },
            gotoOptions: {
              waitUntil: 'networkidle0',
              timeout: finalOptions.timeout,
            },
          }),
        }
      );

      if (!screenshotResponse.ok) {
        const errorText = await screenshotResponse.text();
        console.error('Browser Rendering API error:', errorText);
        return new Response(JSON.stringify({
          success: false,
          error: `截图服务错误: ${screenshotResponse.status}`
        }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      // 获取图片数据
      const imageBuffer = await screenshotResponse.arrayBuffer();

      // 返回结果
      const responseType = options.response_type || 'json';
      
      if (responseType === 'image') {
        // 直接返回图片
        return new Response(imageBuffer, {
          headers: {
            ...corsHeaders,
            'Content-Type': `image/${finalOptions.format}`,
            'Cache-Control': 'public, max-age=86400',
          }
        });
      } else {
        // 返回 JSON（包含图片 base64）
        const base64 = arrayBufferToBase64(imageBuffer);
        const dataUrl = `data:image/${finalOptions.format};base64,${base64}`;
        
        return new Response(JSON.stringify({
          success: true,
          data: {
            url: dataUrl,
            width: viewport.width * viewport.deviceScaleFactor,
            height: viewport.height * viewport.deviceScaleFactor,
            format: finalOptions.format,
            size: imageBuffer.byteLength,
            timestamp: Date.now()
          }
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

    } catch (error) {
      console.error('Screenshot error:', error);
      return new Response(JSON.stringify({
        success: false,
        error: error.message || '截图服务错误'
      }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }
  }
};

/**
 * 构建完整的 HTML 页面
 */
function buildHtml(content, customCss, viewportWidth) {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=${viewportWidth}, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    body {
      width: ${viewportWidth}px;
      min-height: 1px;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'PingFang SC', 'Hiragino Sans GB', 'Microsoft YaHei', sans-serif;
      -webkit-font-smoothing: antialiased;
      -moz-osx-font-smoothing: grayscale;
      overflow-x: hidden;
    }
    ${customCss}
  </style>
</head>
<body>
  ${content}
</body>
</html>`;
}

/**
 * ArrayBuffer 转 Base64
 */
function arrayBufferToBase64(buffer) {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}
