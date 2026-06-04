/**
 * 本地测试脚本 - 测试 HTML转图片 服务
 * 
 * 使用方法:
 *   npm test
 *   node test.js
 */

const http = require('http');

const SERVER_URL = 'http://localhost:3000';

// 测试 HTML 模板
const testHtml = `<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <style>
    body {
      margin: 0;
      padding: 40px;
      font-family: 'Microsoft YaHei', 'PingFang SC', sans-serif;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      min-height: 100vh;
    }
    .card {
      background: rgba(255, 255, 255, 0.95);
      border-radius: 24px;
      padding: 40px;
      box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
      text-align: center;
      max-width: 600px;
      margin: 0 auto;
    }
    h1 {
      color: #333;
      font-size: 48px;
      margin: 0 0 16px;
    }
    p {
      color: #667eea;
      font-size: 24px;
      margin: 0;
    }
  </style>
</head>
<body>
  <div class="card">
    <h1>测试成功</h1>
    <p>HTML转图片服务正常运行</p>
  </div>
</body>
</html>`;

/**
 * 发送测试请求
 */
function testGenerateImage() {
  return new Promise((resolve, reject) => {
    const requestData = JSON.stringify({
      html: testHtml,
      options: { width: 750, deviceScaleFactor: 2, format: 'png' }
    });

    const options = {
      hostname: 'localhost',
      port: 3000,
      path: '/',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
        'Content-Length': Buffer.byteLength(requestData, 'utf8'),
      },
      timeout: 60000,
    };

    console.log('📡 发送请求...');
    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const result = JSON.parse(data);
          
          if (result.success && result.image) {
            const fs = require('fs');
            const buffer = Buffer.from(result.image, 'base64');
            const filename = `test-output-${Date.now()}.png`;
            fs.writeFileSync(filename, buffer);
            
            console.log('✅ 请求成功!');
            console.log(`   耗时: ${result.time} ms`);
            console.log(`   图片已保存: ${filename} (${buffer.length} bytes)`);
            resolve({ success: true, filename, time: result.time });
          } else {
            console.log('❌ 请求失败:', result.error);
            resolve({ success: false, error: result.error });
          }
        } catch (e) {
          console.log('❌ 解析响应失败:', e.message);
          resolve({ success: false, error: e.message });
        }
      });
    });

    req.on('error', (e) => {
      console.log('❌ 请求错误:', e.message);
      resolve({ success: false, error: e.message });
    });

    req.on('timeout', () => {
      console.log('❌ 请求超时');
      req.destroy();
      resolve({ success: false, error: 'timeout' });
    });

    req.write(requestData, 'utf8');
    req.end();
  });
}

/**
 * 健康检查
 */
async function testHealth() {
  return new Promise((resolve, reject) => {
    http.get(`${SERVER_URL}/health`, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const result = JSON.parse(data);
          console.log('✅ 健康检查:', result.status);
          if (result.browser) {
            console.log(`   浏览器状态: ${result.browser}`);
          }
          resolve(result);
        } catch (e) {
          console.log('❌ 健康检查失败:', e.message);
          resolve(null);
        }
      });
    }).on('error', (e) => {
      console.log('❌ 健康检查失败:', e.message);
      resolve(null);
    });
  });
}

/**
 * 主测试程序
 */
async function main() {
  console.log('=====================================');
  console.log('  HTML转图片服务 - 测试脚本');
  console.log('=====================================');
  console.log();

  // 1. 健康检查
  console.log('🔍 步骤 1: 健康检查');
  const health = await testHealth();
  if (!health) {
    console.log();
    console.log('⚠️  服务可能未启动，请先运行:');
    console.log('   npm start');
    console.log('   或双击 start.bat');
    process.exit(1);
  }
  console.log();

  // 2. 生成测试图片
  console.log('🖼️  步骤 2: 生成测试图片');
  console.log();
  const result = await testGenerateImage();
  console.log();

  // 3. 总结
  console.log('=====================================');
  if (result.success) {
    console.log('  ✅ 所有测试通过!');
  } else {
    console.log('  ❌ 测试失败');
    console.log(`   错误: ${result.error}`);
  }
  console.log('=====================================');

  process.exit(result.success ? 0 : 1);
}

main().catch(console.error);
