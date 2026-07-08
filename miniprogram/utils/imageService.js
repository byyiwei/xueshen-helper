/**
 * 通用图片生成服务
 * 通过 Puppeteer HTTP 服务将任意 HTML 渲染为高清图片
 * 
 * 使用方式：
 *   const { generateImageFromHTML, generatePetImage } = require('./imageService.js')
 * 
 *   // 方式1：传入任意 HTML 字符串
 *   const html = '<div>...</div>'
 *   const filePath = await generateImageFromHTML(html, { width: 750 })
 * 
 *   // 方式2：宠物档案专用（自动调用 theme.js 生成 HTML）
 *   const filePath = await generatePetImage(petData)
 */

const { convertHTMLImagesToBase64 } = require('./theme.js');

// 默认服务配置（云数据库未配置时的兜底值）
const DEFAULT_ENDPOINT = 'https://pets.openget.cn';
const DEFAULT_TIMEOUT = 60000;

/**
 * 获取当前图片服务器地址（优先读云数据库配置，其次用默认值）
 */
function getEndpoint() {
  try {
    const app = getApp();
    const url = app && app.globalData && app.globalData.systemConfig && app.globalData.systemConfig.imageServerUrl;
    return url || DEFAULT_ENDPOINT;
  } catch (e) {
    return DEFAULT_ENDPOINT;
  }
}

/**
 * 获取当前超时配置
 */
function getTimeout() {
  try {
    const app = getApp();
    const timeout = app && app.globalData && app.globalData.systemConfig && app.globalData.systemConfig.imageTimeout;
    return timeout || DEFAULT_TIMEOUT;
  } catch (e) {
    return DEFAULT_TIMEOUT;
  }
}

/**
 * 通用接口：将 HTML 渲染为图片并保存到临时文件
 * @param {string} html - 完整的 HTML 字符串
 * @param {Object} options
 * @param {number} options.width - 图片宽度，默认 750
 * @param {number} options.deviceScaleFactor - 缩放倍率，默认 2
 * @param {string} options.format - 图片格式 png/jpeg，默认 png
 * @param {number} options.quality - JPEG 质量 0-100，默认 90
 * @param {string} options.loadingText - 加载提示文字，默认 '生成图片中...'
 * @returns {Promise<string>} 临时文件路径
 */
async function generateImageFromHTML(html, options = {}) {
  const {
    width = 750,
    deviceScaleFactor = 2,
    format = 'png',
    quality = 90,
    loadingText = '生成图片中...',
  } = options;

  // 将 HTML 中的图片 URL 转为 base64 data URI（Puppeteer 无法访问本地/云存储路径）
  html = await convertHTMLImagesToBase64(html);

  // 调用 HTTP 图片生成服务
  const result = await callImageService(html, { width, deviceScaleFactor, fullPage: true, format, quality }, loadingText);

  if (!result.success) {
    throw new Error(result.error || '生成图片失败');
  }

  // 保存 Base64 图片到临时文件
  return await saveBase64Image(result.image, result.format);
}

/**
 * 宠物档案专用：生成宠物预览图
 * @param {Object} petData - 宠物数据 { pet, records, qrcodeUrl, pedigreeData, ... }
 * @returns {Promise<string>} 临时文件路径
 */
async function generatePetImage(petData) {
  const { getTheme, generatePetHTML } = require('./theme.js');
  const theme = getTheme();
  const html = generatePetHTML(petData, theme);
  return await generateImageFromHTML(html, { loadingText: '生成预览图...' });
}

/**
 * 调用 HTTP 图片生成服务
 * @private
 */
async function callImageService(html, options, loadingText = '生成图片中...') {
  return new Promise((resolve) => {
    wx.showLoading({ title: loadingText, mask: true });

    wx.request({
      url: getEndpoint(),
      method: 'POST',
      header: { 'Content-Type': 'application/json' },
      data: {
        html: html,
        options: {
          width: options.width || 750,
          deviceScaleFactor: options.deviceScaleFactor || 2,
          fullPage: true,
          format: options.format || 'png',
          quality: options.quality || 90,
        }
      },
      timeout: getTimeout(),
      success: (res) => {
        wx.hideLoading();
        if (res.statusCode === 200 && res.data.success) {
          resolve({
            success: true,
            image: res.data.image,
            format: res.data.format,
            time: res.data.time,
          });
        } else {
          resolve({
            success: false,
            error: res.data?.error || `服务器错误: ${res.statusCode}`
          });
        }
      },
      fail: (err) => {
        wx.hideLoading();
        console.error('图片服务调用失败:', err);
        resolve({
          success: false,
          error: err.errMsg || '网络请求失败'
        });
      }
    });
  });
}

/**
 * 保存 Base64 图片到临时文件
 * @private
 */
async function saveBase64Image(base64Data, format = 'png') {
  return new Promise((resolve, reject) => {
    const fs = wx.getFileSystemManager();
    const fileName = `share_${Date.now()}.${format}`;
    const filePath = `${wx.env.USER_DATA_PATH}/${fileName}`;

    try {
      // 确保用户数据目录存在
      fs.access({
        path: wx.env.USER_DATA_PATH,
        success: () => {
          // 目录已存在，直接写入
          writeFileToPath();
        },
        fail: () => {
          // 目录不存在，先创建
          fs.mkdir({
            dirPath: wx.env.USER_DATA_PATH,
            recursive: true,
            success: () => {
              writeFileToPath();
            },
            fail: (err) => {
              reject(new Error('创建目录失败: ' + err.errMsg));
            }
          });
        }
      });
    } catch (e) {
      reject(new Error('文件系统操作失败: ' + e.message));
    }

    function writeFileToPath() {
      try {
        const buffer = wx.base64ToArrayBuffer(base64Data);
        fs.writeFile({
          filePath: filePath,
          data: buffer,
          encoding: 'binary',
          success: () => resolve(filePath),
          fail: (err) => reject(new Error('保存图片失败: ' + err.errMsg))
        });
      } catch (e) {
        reject(new Error('Base64 解码失败: ' + e.message));
      }
    }
  });
}

module.exports = {
  generateImageFromHTML,
  generatePetImage,
};
