/**
 * ThemeManager - 主题管理器
 * 管理应用主题，支持 Canvas 绘制和 HTML 生成
 */

/**
 * 判断 URL 是否需要转 base64（非 HTTP/HTTPS/Data URI 的本地路径都需要转）
 */
function needsBase64Conversion(url) {
  if (!url || typeof url !== 'string') return false;
  // 已经是 data URI 的不需要转换
  if (url.startsWith('data:')) return false;
  // 微信临时文件路径（看似 HTTP 实际是本地路径，Puppeteer 无法访问）
  if (url.startsWith('http://tmp/') || url.startsWith('http://usr/')) return true;
  // HTTP/HTTPS 公网 URL，Puppeteer 可以直接访问，不需要转换
  if (url.startsWith('http://') || url.startsWith('https://')) return false;
  // 本地路径、wxfile://、cloud:// 等都需要转换
  return true;
}

/**
 * 将单个图片 URL 转为 base64 data URI
 * @param {string} url - 图片 URL
 * @returns {Promise<string>} base64 data URI，失败返回原 URL
 */
function urlToBase64(url) {
  if (!url || !needsBase64Conversion(url)) {
    return Promise.resolve(url);
  }

  return new Promise((resolve) => {
    try {
      // 转换为完整 HTTP URL
      let fetchUrl = url
      if (!url.startsWith('http://') && !url.startsWith('https://')) {
        const app = getApp()
        const config = app?.globalData?.systemConfig || {}
        const baseUrl = config.imageServerUrl || config.apiUrl || 'https://pets.openget.cn'
        fetchUrl = baseUrl + '/' + url.replace(/^\/+/, '')
      }

      if (typeof wx !== 'undefined' && wx.downloadFile) {
        wx.downloadFile({
          url: fetchUrl,
          success: (downloadRes) => {
            if (downloadRes.statusCode === 200) {
              try {
                const fs = wx.getFileSystemManager();
                fs.readFile({
                  filePath: downloadRes.tempFilePath,
                  encoding: 'base64',
                  success: (res) => {
                    let mimeType = 'image/jpeg';
                    if (url.endsWith('.png')) mimeType = 'image/png';
                    else if (url.endsWith('.gif')) mimeType = 'image/gif';
                    else if (url.endsWith('.webp')) mimeType = 'image/webp';
                    resolve(`data:${mimeType};base64,${res.data}`);
                  },
                  fail: () => resolve(url)
                });
              } catch (_) {
                resolve(url);
              }
            } else {
              resolve(url);
            }
          },
          fail: () => resolve(url)
        });
        return;
      }

      // 非微信环境：直接读本地文件
      const fs = wx.getFileSystemManager();
      fs.readFile({
        filePath: url,
        encoding: 'base64',
        success: (res) => {
          let mimeType = 'image/jpeg';
          if (url.endsWith('.png')) mimeType = 'image/png';
          else if (url.endsWith('.gif')) mimeType = 'image/gif';
          else if (url.endsWith('.webp')) mimeType = 'image/webp';
          resolve(`data:${mimeType};base64,${res.data}`);
        },
        fail: () => resolve(url)
      });
    } catch (_) {
      resolve(url);
    }
  });
}

/**
 * 收集 HTML 中所有 img src，将它们转为 base64 data URI
 * 同时收集 src 属性中的图片 URL（如 CSS background-image）
 * @param {string} html - 原始 HTML 字符串
 * @returns {Promise<string>} 替换后的 HTML
 */
async function convertHTMLImagesToBase64(html) {
  // 提取所有 img src
  const imgSrcRegex = /<img[^>]+src="([^"]+)"/g;
  const matches = [];
  let match;
  while ((match = imgSrcRegex.exec(html)) !== null) {
    if (needsBase64Conversion(match[1])) {
      matches.push({ full: match[0], src: match[1] });
    }
  }

  if (matches.length === 0) return html;

  // 并行转换所有图片
  const convertPromises = matches.map(async (m) => {
    const base64 = await urlToBase64(m.src);
    return { original: m.src, base64 };
  });

  const results = await Promise.all(convertPromises);

  // 替换 HTML 中的图片 URL
  let resultHtml = html;
  for (const r of results) {
    if (r.base64 !== r.original) {
      resultHtml = resultHtml.split(r.original).join(r.base64);
    }
  }

  return resultHtml;
}

const WHITE_THEME = {
  name: 'white',
  primary: '#E8A400',
  primaryDark: '#C98D00',
  primaryLight: '#FFF8E7',
  accent: '#FF8C42',
  bg: '#FAF8F5',
  bgLight: '#FFFFFF',
  pageBg: '#FAF8F5',
  cardBg: '#ffffff',
  text: '#1E293B',
  textSecondary: '#475569',
  textLight: '#94A3B8',
  border: '#E2E8F0',
};

class ThemeManager {
  static getThemeConfig() {
    return WHITE_THEME;
  }

  static getCurrentTheme() {
    return 'white';
  }
}

/**
 * 获取主题配置（兼容旧代码）
 */
function getTheme() {
  return WHITE_THEME;
}

/**
 * 生成预览页面 HTML - 完全匹配 WXML 结构和样式
 * @param {Object} data - 宠物数据
 * @param {Object} theme - 主题配置
 * @returns {string} HTML 字符串
 */
function generatePetHTML(data, theme) {
  const { 
    pet, records = [], qrcodeUrl, pedigreeData, 
    paternalLine = [], maternalLine = [],
    showPedigree = false, bloodlineTab = 'paternal'
  } = data;
  
  // 计算统计数据
  const stats = {
    totalAncestors: (paternalLine.length || 0) + (maternalLine.length || 0),
    maleCount: paternalLine.length || 0,
    femaleCount: maternalLine.length || 0,
    maxDepth: Math.max(
      paternalLine.length ? paternalLine[paternalLine.length - 1]?.generation || 1 : 0,
      maternalLine.length ? maternalLine[maternalLine.length - 1]?.generation || 1 : 0
    )
  };

  // 照片部分
  const hasPhotos = pet.photos && pet.photos.length > 0;
  const photoSection = hasPhotos ? `
    <div class="photo-section">
      <img src="${pet.photos[0]}" class="photo-img" />
      <div class="photo-count">${pet.photos.length} 张照片</div>
    </div>
  ` : `
    <div class="photo-section empty-photo">
      <div class="empty-photo-placeholder">
        <div class="empty-photo-icon">📷</div>
        <div class="empty-photo-text">暂无照片</div>
      </div>
    </div>
  `;

  // 标签
  const tags = [];
  if (pet.gender) tags.push({ text: pet.gender, class: 'gender-tag' });
  if (pet.category) tags.push({ text: pet.category, class: 'category-tag' });
  if (pet.status) tags.push({ text: pet.status, class: `status-tag ${pet.statusClass ? 'status-' + pet.statusClass : ''}` });
  if (pet.alias) tags.push({ text: pet.alias, class: 'alias-tag' });
  
  const tagsHtml = tags.map(t => `<span class="tag ${t.class}">${t.text}</span>`).join('');

  // 头像
  const avatarHtml = pet.avatar 
    ? `<img src="${pet.avatar}" class="pet-avatar" />`
    : `<div class="pet-avatar-placeholder">${pet.name ? pet.name[0] : '?'}</div>`;

  // 详细信息
  const details = [];
  if (pet.birthDate) details.push({ icon: '🎂', label: '出生日期', value: pet.birthDate });
  if (pet.weight) details.push({ icon: '⚖️', label: '体重', value: pet.weight + 'g' });
  if (pet.color) details.push({ icon: '🎨', label: '颜色', value: pet.color });
  if (pet.species) details.push({ icon: '🏷️', label: '品种', value: pet.species });
  
  const detailGridHtml = details.length > 0 ? `
    <div class="detail-grid">
      ${details.map(d => `
        <div class="detail-item">
          <span class="detail-icon">${d.icon}</span>
          <div class="detail-content">
            <span class="detail-label">${d.label}</span>
            <span class="detail-value">${d.value}</span>
          </div>
        </div>
      `).join('')}
    </div>
  ` : '';

  // 谱系 - 收起状态
  const hasPedigree = paternalLine.length > 0 || maternalLine.length > 0;
  const pedigreeCollapsedHtml = hasPedigree ? `
    <div class="pedigree-cards">
      ${paternalLine.length > 0 ? `
        <div class="pedigree-card">
          <span class="card-gender-tag male">父系</span>
          <div class="card-avatar">
            ${paternalLine[0].photos && paternalLine[0].photos[0] 
              ? `<img src="${paternalLine[0].photos[0]}" class="card-img" onerror="this.style.display='none'" />`
              : ''}
          </div>
          <div class="card-info">
            <span class="card-label">${paternalLine[0].alias || paternalLine[0].name || '父本'}</span>
            <span class="card-name">${paternalLine[0].alias || paternalLine[0].name || '未命名'}</span>
            ${paternalLine.length > 1 ? `<span class="card-more">+${paternalLine.length - 1}代</span>` : ''}
          </div>
        </div>
      ` : ''}
      ${maternalLine.length > 0 ? `
        <div class="pedigree-card">
          <span class="card-gender-tag female">母系</span>
          <div class="card-avatar">
            ${maternalLine[0].photos && maternalLine[0].photos[0] 
              ? `<img src="${maternalLine[0].photos[0]}" class="card-img" onerror="this.style.display='none'" />`
              : ''}
          </div>
          <div class="card-info">
            <span class="card-label">${maternalLine[0].alias || maternalLine[0].name || '母本'}</span>
            <span class="card-name">${maternalLine[0].alias || maternalLine[0].name || '未命名'}</span>
            ${maternalLine.length > 1 ? `<span class="card-more">+${maternalLine.length - 1}代</span>` : ''}
          </div>
        </div>
      ` : ''}
    </div>
  ` : `
    <div class="family-tree-empty">
      <span class="family-status">等待补全</span>
      <span class="family-title">还没有父母谱系</span>
      <span class="family-hint">补充父本或母本后，这里就会显示当前个体的溯源关系。</span>
    </div>
  `;

  // 谱系 - 展开状态（血缘主线）
  const currentLine = bloodlineTab === 'paternal' ? paternalLine : maternalLine;
  const currentLineLabel = bloodlineTab === 'paternal' ? '父系' : '母系';
  
  const bloodlineChainHtml = currentLine.length > 0 ? `
    <div class="bloodline-chain">
      ${currentLine.map((item, index) => `
        <div class="bloodline-node">
          <div class="node-card">
            <div class="node-avatar">
              ${item.photos && item.photos[0] 
                ? `<img src="${item.photos[0]}" class="avatar-img" onerror="this.style.display='none'" />`
                : ''}
            </div>
            <div class="node-info">
              <span class="node-name">${item.alias || item.name || '未命名'}</span>
              <span class="node-category">${item.category || '无'} · 第${item.generation || index + 1}代</span>
            </div>
          </div>
          ${index < currentLine.length - 1 ? '<div class="chain-arrow">↓</div>' : ''}
        </div>
      `).join('')}
    </div>
  ` : `
    <div class="empty-line">
      <span class="empty-text">暂无${currentLineLabel}谱系</span>
    </div>
  `;

  const otherLine = bloodlineTab === 'paternal' ? maternalLine : paternalLine;
  const otherLineEmpty = otherLine.length === 0;
  const otherLineHtml = otherLineEmpty ? `
    <div class="empty-line">
      <span class="empty-text">暂无${bloodlineTab === 'paternal' ? '母系' : '父系'}谱系</span>
    </div>
  ` : '';

  // 完整家谱树
  const fullTree = pedigreeData && pedigreeData.fullTree ? pedigreeData.fullTree : null;
  const hasGen1 = fullTree && (fullTree.father || fullTree.mother);
  const hasGen2 = hasGen1 && ((fullTree.father && (fullTree.father.father || fullTree.father.mother)) || (fullTree.mother && (fullTree.mother.father || fullTree.mother.mother)));
  const hasGen3 = hasGen2 && ((fullTree.father && fullTree.father.father && (fullTree.father.father.father || fullTree.father.father.mother)) || (fullTree.mother && fullTree.mother.father && (fullTree.mother.father.father || fullTree.mother.father.mother)));

  function renderTreeNode(person, label, genderClass, nodeClass = 'ancestor') {
    if (!person) return '';
    const photo = person.photos && person.photos[0];
    return `
      <div class="tree-node ${nodeClass}">
        <span class="node-gender-tag ${genderClass}">${label}</span>
        <div class="node-avatar-wrapper">
          ${photo ? `<img src="${photo}" class="node-img" onerror="this.style.display='none'" />` : ''}
        </div>
        <span class="node-name">${person.alias || person.name || '未命名'}</span>
        ${person.alias ? `<span class="node-alias">${person.name || ''}</span>` : ''}
      </div>
    `;
  }

  const familyTreeHtml = fullTree ? `
    <div class="family-tree-visual">
      ${hasGen3 ? `
        <div class="generation-label">第3代（曾祖父母）</div>
        <div class="tree-level level-3">
          ${renderTreeNode(fullTree.father && fullTree.father.father && fullTree.father.father.father, '曾祖父', 'male')}
          ${renderTreeNode(fullTree.father && fullTree.father.father && fullTree.father.father.mother, '曾祖母', 'female')}
          ${renderTreeNode(fullTree.mother && fullTree.mother.father && fullTree.mother.father.father, '曾外祖父', 'male')}
          ${renderTreeNode(fullTree.mother && fullTree.mother.father && fullTree.mother.father.mother, '曾外祖母', 'female')}
        </div>
        <div class="tree-connections">
          ${(fullTree.father && fullTree.father.father && (fullTree.father.father.father || fullTree.father.father.mother)) ? '<div class="connection-line"></div>' : ''}
          ${(fullTree.mother && fullTree.mother.father && (fullTree.mother.father.father || fullTree.mother.father.mother)) ? '<div class="connection-line"></div>' : ''}
        </div>
      ` : ''}
      
      ${hasGen2 ? `
        <div class="generation-label">第2代（祖父母）</div>
        <div class="tree-level level-2">
          ${renderTreeNode(fullTree.father && fullTree.father.father, '祖父', 'male')}
          ${renderTreeNode(fullTree.father && fullTree.father.mother, '祖母', 'female')}
          ${renderTreeNode(fullTree.mother && fullTree.mother.father, '外祖父', 'male')}
          ${renderTreeNode(fullTree.mother && fullTree.mother.mother, '外祖母', 'female')}
        </div>
        <div class="tree-connections">
          ${(fullTree.father && (fullTree.father.father || fullTree.father.mother)) ? '<div class="connection-line"></div>' : ''}
          ${(fullTree.mother && (fullTree.mother.father || fullTree.mother.mother)) ? '<div class="connection-line"></div>' : ''}
        </div>
      ` : ''}
      
      ${hasGen1 ? `
        <div class="generation-label">第1代（父母）</div>
        <div class="tree-level level-1">
          ${renderTreeNode(fullTree.father, '父本', 'male', 'parent')}
          ${renderTreeNode(fullTree.mother, '母本', 'female', 'parent')}
        </div>
        <div class="tree-connections">
          <div class="connection-line center"></div>
        </div>
      ` : ''}
      
      <div class="tree-level level-0" style="margin-top: 0;">
        <div class="tree-node current">
          <span class="current-badge">当前</span>
          <div class="node-avatar-wrapper">
            ${pet.photos && pet.photos[0] ? `<img src="${pet.photos[0]}" class="node-img" onerror="this.style.display='none'" />` : '<span class="node-icon current">🐢</span>'}
          </div>
          <span class="node-name current">${pet.alias || pet.name || '未命名'}</span>
          ${pet.alias ? `<span class="node-alias current">${pet.name || ''}</span>` : ''}
          <span class="node-gender-text">${pet.gender || '未知'}</span>
        </div>
      </div>
    </div>
  ` : `
    <div class="empty-tree">
      <span class="empty-text">暂无家谱数据</span>
    </div>
  `;

  // 根据展开状态选择显示内容
  const pedigreeContentHtml = showPedigree ? `
    <!-- 统计信息 -->
    <div class="pedigree-stats">
      <div class="stat-item">
        <span class="stat-num">${stats.totalAncestors}</span>
        <span class="stat-label">祖先总数</span>
      </div>
      <div class="stat-item">
        <span class="stat-num">${stats.maleCount}</span>
        <span class="stat-label">父系</span>
      </div>
      <div class="stat-item">
        <span class="stat-num">${stats.femaleCount}</span>
        <span class="stat-label">母系</span>
      </div>
      <div class="stat-item">
        <span class="stat-num">${stats.maxDepth}</span>
        <span class="stat-label">最深远</span>
      </div>
    </div>
    
    <!-- 血缘主线 -->
    <div class="bloodline-section">
      <div class="bloodline-title">
        <span class="title-text">血缘主线</span>
        <div class="bloodline-tabs">
          <div class="tab ${bloodlineTab === 'paternal' ? 'active' : ''}">父本</div>
          <div class="tab ${bloodlineTab === 'maternal' ? 'active' : ''}">母本</div>
        </div>
      </div>
      <div class="bloodline-content">
        ${bloodlineChainHtml}
      </div>
    </div>
    
    <!-- 完整家谱树 -->
    <div class="family-tree-section">
      <div class="tree-title">
        <span class="title-text">完整家谱</span>
        <span class="tree-hint">（最多展示3代）</span>
      </div>
      ${familyTreeHtml}
    </div>
  ` : pedigreeCollapsedHtml;

  // 事件记录
  const eventIcons = {
    '建档': '📁',
    '交配': '💕',
    '产蛋': '🥚',
    '换公': '🔄'
  };
  
  const eventCardsHtml = records.length > 0 ? `
    <div class="event-cards">
      ${records.slice(0, 6).map(item => `
        <div class="event-card">
          <div class="event-icon ${item.type === '产蛋' ? 'event-icon-lay' : ''}">
            <span class="icon-emoji">${eventIcons[item.type] || '📝'}</span>
          </div>
          <div class="event-info">
            <span class="event-title">${item.type}</span>
            <span class="event-content">${item.text || ''}</span>
            <div class="event-date">
              <span class="date">${item.date || ''}</span>
              ${item.time ? `<span class="time">${item.time}</span>` : ''}
            </div>
          </div>
        </div>
      `).join('')}
    </div>
  ` : `
    <div class="empty-events">
      <span class="empty-icon">📋</span>
      <span class="empty-text">暂无事件记录</span>
    </div>
  `;

  return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${pet.name || '宠物档案'}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'PingFang SC', 'Microsoft YaHei', sans-serif;
      background-color: ${theme.bg};
      --primary-color: ${theme.primary};
      --primary-light: ${theme.primaryLight};
      --primary-dark: ${theme.primaryDark};
      --bg-color: ${theme.bgLight};
      --bg-light: ${theme.bg};
    }
    
    .page {
      background-color: ${theme.bg};
      padding-bottom: 40px;
    }
    
    .content {
      padding: 0;
    }
    
    /* 照片区域 - 500rpx */
    .photo-section {
      position: relative;
      width: 100%;
      height: 500px;
      background-color: #EDF2F7;
    }
    
    .photo-img {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }
    
    .photo-count {
      position: absolute;
      right: 24px;
      bottom: 24px;
      padding: 8px 20px;
      background-color: rgba(58, 124, 255, 0.5);
      border-radius: 24px;
      font-size: 24px;
      color: #ffffff;
    }
    
    .empty-photo {
      display: flex;
      align-items: center;
      justify-content: center;
    }
    
    .empty-photo-placeholder {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 16px;
    }
    
    .empty-photo-icon {
      font-size: 80px;
    }
    
    .empty-photo-text {
      font-size: 28px;
      color: #94A3B8;
    }
    
    /* 信息卡片 - 对齐 WXSS: margin -40rpx 24rpx 24rpx, padding 32rpx */
    .info-card {
      margin: -40px 24px 24px;
      padding: 32px;
      background-color: #ffffff;
      border-radius: 24px;
      box-shadow: 0 4px 20px rgba(58, 124, 255, 0.08);
      position: relative;
      z-index: 10;
    }
    
    .pet-header {
      display: flex;
      align-items: center;
      gap: 24px;
      margin-bottom: 24px;
    }
    
    .pet-avatar-section {
      width: 120px;
      height: 120px;
      border-radius: 60px;
      overflow: hidden;
      flex-shrink: 0;
      border: 4px solid #FAF8F5;
    }
    
    .pet-avatar {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }
    
    .pet-avatar-placeholder {
      width: 100%;
      height: 100%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 48px;
      color: #ffffff;
      background: linear-gradient(135deg, ${theme.accent} 0%, ${theme.primary} 100%);
    }
    
    .pet-basic-info {
      flex: 1;
    }
    
    .pet-name {
      font-size: 40px;
      font-weight: bold;
      color: #E8A400;
      margin-bottom: 16px;
      display: block;
    }
    
    .pet-tags {
      display: flex;
      gap: 12px;
      flex-wrap: wrap;
    }
    
    .tag {
      padding: 8px 16px;
      border-radius: 20px;
      font-size: 22px;
    }
    
    .gender-tag {
      background-color: #E0F2F7;
      color: #2A6F97;
    }
    
    .category-tag {
      background-color: #EDF2F7;
      color: #E8A400;
    }
    
    .status-tag {
      background-color: #EDF2F7;
      color: #E8A400;
    }
    
    .status-sick {
      background-color: #FDECE8;
      color: #E76F51;
    }
    
    .status-dead {
      background-color: #FAF8F5;
      color: #94A3B8;
    }
    
    .status-sold {
      background-color: #EDF2F7;
      color: #64748B;
    }
    
    .alias-tag {
      background-color: #E8F0F7;
      color: #2A6F97;
    }
    
    /* 父母信息 */
    .parents-row {
      display: flex;
      align-items: center;
      padding-top: 24px;
      border-top: 1px solid #EDF2F7;
    }
    
    .parent-box {
      flex: 1;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 8px;
    }
    
    .parent-label {
      font-size: 24px;
      color: #94A3B8;
    }
    
    .parent-value {
      font-size: 28px;
      color: #2A6F97;
      font-weight: 500;
    }
    
    .parent-value.unlinked {
      color: #2A6F97;
    }
    
    .parent-value.unlinked-red {
      color: #E76F51;
    }
    
    .parent-divider {
      width: 1px;
      height: 60px;
      background-color: #EDF2F7;
    }
    
    /* 通用卡片 - margin 0 24rpx 24rpx, padding 32rpx */
    .card {
      margin: 0 24px 24px;
      padding: 32px;
      background-color: #ffffff;
      border-radius: 24px;
      box-shadow: 0 4px 16px rgba(58, 124, 255, 0.06);
    }
    
    .card-title {
      font-size: 32px;
      font-weight: bold;
      color: #E8A400;
      margin-bottom: 24px;
      display: flex;
      align-items: center;
      gap: 12px;
    }
    
    .event-count {
      font-size: 26px;
      color: #94A3B8;
      font-weight: normal;
    }
    
    /* 详细信息网格 */
    .detail-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 24px;
    }
    
    .detail-item {
      display: flex;
      align-items: center;
      gap: 16px;
      padding: 20px;
      background-color: #FFFFFF;
      border-radius: 16px;
    }
    
    .detail-icon {
      font-size: 40px;
    }
    
    .detail-content {
      display: flex;
      flex-direction: column;
      gap: 4px;
    }
    
    .detail-label {
      font-size: 22px;
      color: #94A3B8;
    }
    
    .detail-value {
      font-size: 28px;
      color: #E8A400;
      font-weight: 500;
    }
    
    /* 备注 */
    .notes-content {
      font-size: 28px;
      color: #475569;
      line-height: 1.8;
    }
    
    /* 谱系区域 - 对齐 WXSS section: padding 24rpx, margin 0 24rpx 24rpx */
    .pedigree-section {
      background-color: #ffffff;
      border-radius: 24px;
      padding: 24px;
      margin: 0 24px 24px;
      box-shadow: 0 4px 16px rgba(58, 124, 255, 0.06);
    }
    
    .section-title {
      font-size: 28px;
      font-weight: bold;
      color: #E8A400;
    }
    
    .pedigree-badge {
      background: linear-gradient(135deg, ${theme.primary} 0%, ${theme.primaryDark} 100%);
      padding: 6px 16px;
      border-radius: 20px;
      display: inline-flex;
      align-items: center;
      justify-content: center;
    }
    
    .pedigree-count {
      font-size: 22px;
      color: #ffffff;
      font-weight: 500;
    }
    
    /* 收起状态 - 谱系卡片 */
    .pedigree-cards {
      display: flex;
      flex-direction: row;
      justify-content: center;
      gap: 24px;
      padding: 16px 0 24px;
    }
    
    .pedigree-card {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 8px;
      padding: 16px 28px 12px;
      background-color: #ffffff;
      border: 2px solid ${theme.primaryLight};
      border-radius: 24px;
      min-width: 200px;
      box-shadow: 0 4px 16px rgba(58, 124, 255, 0.06);
      position: relative;
      overflow: visible;
    }
    
    .card-gender-tag {
      position: absolute;
      top: 8px;
      right: 8px;
      min-width: 44px;
      height: 44px;
      padding: 0 10px;
      border-radius: 22px;
      font-size: 22px;
      color: #ffffff;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: 600;
      box-shadow: 0 4px 12px rgba(58, 124, 255, 0.3);
      z-index: 1;
      background: linear-gradient(135deg, ${theme.primary} 0%, ${theme.primaryDark} 100%);
    }
    
    .card-avatar {
      width: 120px;
      height: 120px;
      border-radius: 20px;
      background: linear-gradient(135deg, #FAF8F5 0%, #FFF8E7 100%);
      display: flex;
      align-items: center;
      justify-content: center;
      overflow: hidden;
    }
    
    .card-img {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }
    
    .card-info {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 4px;
    }
    
    .card-label {
      font-size: 24px;
      color: ${theme.primary};
      font-weight: 600;
      padding: 6px 20px;
      background-color: ${theme.primaryLight};
      border-radius: 12px;
    }
    
    .card-name {
      font-size: 32px;
      color: #E8A400;
      font-weight: 600;
      max-width: 200px;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
    
    .card-more {
      font-size: 22px;
      color: #94A3B8;
      padding: 4px 16px;
      background-color: #FAF8F5;
      border-radius: 10px;
    }
    
    /* 空状态 - 对齐 WXSS */
    .family-tree-empty {
      border: 2px dashed #CBD5E1;
      border-radius: 24px;
      padding: 48px 32px;
      text-align: center;
      background-color: #FFFFFF;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 0;
    }
    
    .family-status {
      display: inline-block;
      padding: 8px 24px;
      background-color: #EDF2F7;
      border-radius: 16px;
      font-size: 24px;
      color: #64748B;
      margin-bottom: 24px;
    }
    
    .family-title {
      font-size: 32px;
      color: #E8A400;
      display: block;
      margin-bottom: 16px;
    }
    
    .family-hint {
      font-size: 26px;
      color: #94A3B8;
      display: block;
      line-height: 1.6;
      margin-bottom: 32px;
    }
    
    /* 统计信息 */
    .pedigree-stats {
      display: flex;
      justify-content: space-around;
      padding: 16px;
      background: linear-gradient(135deg, ${theme.bg} 0%, ${theme.bgLight} 100%);
      border-radius: 20px;
      margin-bottom: 20px;
    }
    
    .pedigree-stats .stat-item {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 8px;
    }
    
    .pedigree-stats .stat-num {
      font-size: 40px;
      font-weight: bold;
      color: ${theme.primary};
    }
    
    .pedigree-stats .stat-label {
      font-size: 24px;
      color: #94A3B8;
    }
    
    /* 血缘主线 */
    .bloodline-section {
      margin-bottom: 32px;
    }
    
    .bloodline-title {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 20px;
    }
    
    .bloodline-title .title-text {
      font-size: 30px;
      font-weight: 600;
      color: #E8A400;
    }
    
    .bloodline-tabs {
      display: flex;
      gap: 12px;
    }
    
    .bloodline-tabs .tab {
      padding: 12px 24px;
      font-size: 26px;
      color: #475569;
      background-color: #FAF8F5;
      border-radius: 24px;
      transition: all 0.2s ease;
    }
    
    .bloodline-tabs .tab.active {
      color: #ffffff;
      background-color: ${theme.primary};
    }
    
    .bloodline-content {
      padding: 32px 0;
    }
    
    .empty-line {
      text-align: center;
      padding: 48px;
      color: #94A3B8;
      font-size: 28px;
    }
    
    .bloodline-chain {
      display: flex;
      flex-direction: column;
      gap: 16px;
    }
    
    .bloodline-node {
      display: flex;
      flex-direction: column;
      align-items: center;
    }
    
    .node-card {
      display: flex;
      align-items: center;
      gap: 20px;
      width: 100%;
      padding: 20px 24px;
      background-color: #ffffff;
      border: 2px solid #EDF2F7;
      border-radius: 16px;
      box-shadow: 0 2px 8px rgba(58, 124, 255, 0.04);
      position: relative;
      overflow: visible;
    }
    
    .node-avatar {
      width: 80px;
      height: 80px;
      border-radius: 50%;
      background: linear-gradient(135deg, ${theme.primaryLight} 0%, ${theme.bgLight} 100%);
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
      overflow: hidden;
    }
    
    .node-avatar .avatar-img {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }
    
    .node-info {
      flex: 1;
      display: flex;
      flex-direction: column;
      gap: 8px;
    }
    
    .node-name {
      font-size: 30px;
      font-weight: 600;
      color: #E8A400;
    }
    
    .node-category {
      font-size: 24px;
      color: #94A3B8;
    }
    
    .chain-arrow {
      font-size: 32px;
      color: ${theme.primary};
      padding: 8px 0;
    }
    
    /* 完整家谱树 */
    .family-tree-section {
      margin-top: 32px;
    }
    
    .tree-title {
      display: flex;
      align-items: center;
      gap: 12px;
      margin-bottom: 24px;
    }
    
    .tree-title .title-text {
      font-size: 30px;
      font-weight: 600;
      color: #E8A400;
    }
    
    .tree-title .tree-hint {
      font-size: 24px;
      color: #94A3B8;
    }
    
    .empty-tree {
      text-align: center;
      padding: 48px;
      color: #94A3B8;
      background-color: #FFFFFF;
      border-radius: 16px;
    }
    
    .family-tree-visual {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 12px;
      padding: 24px 24px 120px;
      background: linear-gradient(180deg, ${theme.bg} 0%, #ffffff 100%);
      border-radius: 20px;
      border: 2px solid ${theme.primaryLight};
    }
    
    .generation-label {
      font-size: 24px;
      color: ${theme.primary};
      font-weight: 600;
      padding: 8px 24px;
      background-color: ${theme.primaryLight};
      border-radius: 20px;
      margin-bottom: 8px;
    }
    
    .tree-level {
      display: flex;
      justify-content: center;
      gap: 32px;
      width: 100%;
    }
    
    .tree-level.level-2 {
      gap: 16px;
    }
    
    .tree-node {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 12px;
      padding: 16px;
      border-radius: 20px;
      position: relative;
      overflow: hidden;
    }
    
    .tree-node.ancestor {
      background-color: #ffffff;
      border: 2px solid #FFF8E7;
      min-width: 160px;
    }
    
    .tree-node.parent {
      background-color: #ffffff;
      border: 2px solid ${theme.primaryLight};
      min-width: 200px;
    }
    
    .tree-node.current {
      background: linear-gradient(135deg, ${theme.primary} 0%, ${theme.primaryDark} 100%);
      border: 2px solid ${theme.primaryDark};
      min-width: 240px;
      padding: 20px;
      margin-top: 60px;
      padding-top: 60px;
    }
    
    .tree-node .node-gender-tag {
      position: absolute;
      top: 8px;
      right: 8px;
      min-width: 44px;
      height: 44px;
      padding: 0 10px;
      border-radius: 22px;
      font-size: 22px;
      color: #ffffff;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: 600;
      box-shadow: 0 4px 12px rgba(58, 124, 255, 0.3);
      z-index: 1;
      background: linear-gradient(135deg, ${theme.primary} 0%, ${theme.primaryDark} 100%);
    }
    
    .tree-node.parent .node-gender-tag {
      min-width: 52px;
      height: 52px;
      font-size: 26px;
      border-radius: 26px;
      top: 12px;
      right: 12px;
    }
    
    .tree-node .current-badge {
      position: absolute;
      top: 0;
      left: 50%;
      transform: translateX(-50%);
      padding: 10px 28px;
      background: linear-gradient(135deg, ${theme.primary} 0%, ${theme.primaryDark} 100%);
      color: #ffffff;
      font-size: 28px;
      font-weight: 600;
      border-radius: 28px;
      box-shadow: 0 4px 16px rgba(58, 124, 255, 0.3);
      z-index: 1;
    }
    
    .tree-node .node-avatar-wrapper {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 240px;
      height: 240px;
      background-color: #FAF8F5;
      border-radius: 24px;
      overflow: hidden;
    }
    
    .tree-node .node-img {
      width: 100%;
      height: 100%;
      border-radius: 20px;
      object-fit: cover;
    }
    
    .tree-node .node-icon {
      width: 100%;
      height: 100%;
      border-radius: 20px;
      background-color: #FAF8F5;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 72px;
      color: #94A3B8;
    }
    
    .tree-node .node-gender-text {
      font-size: 26px;
      color: ${theme.primary};
      font-weight: 600;
      margin-top: 8px;
      padding: 4px 20px;
      background-color: ${theme.primaryLight};
      border-radius: 16px;
    }
    
    .tree-node .node-name {
      font-size: 26px;
      color: #E8A400;
      font-weight: 600;
      max-width: 120px;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
      margin-top: 8px;
    }
    
    .tree-node.parent .node-name {
      font-size: 28px;
      max-width: 140px;
    }
    
    .tree-node.current .node-name {
      font-size: 30px;
      color: #ffffff;
      max-width: 160px;
    }
    
    .tree-node .node-alias {
      font-size: 22px;
      color: #94A3B8;
      max-width: 120px;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
      margin-top: 4px;
    }
    
    .tree-node.parent .node-alias {
      font-size: 24px;
      max-width: 140px;
    }
    
    .tree-node.current .node-alias {
      color: rgba(255, 255, 255, 0.8);
      max-width: 160px;
    }
    
    .tree-connections {
      display: flex;
      justify-content: center;
      gap: 120px;
      width: 100%;
    }
    
    .connection-line {
      width: 2px;
      height: 32px;
      background: linear-gradient(180deg, ${theme.primary} 0%, ${theme.primaryLight} 100%);
    }
    
    .connection-line.center {
      width: 2px;
      height: 40px;
    }
    
    /* 事件卡片 - 对齐 WXSS: 2列网格, padding 32rpx 24rpx, border-radius 24rpx */
    .event-cards {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 16px;
    }
    
    .event-card {
      display: flex;
      flex-direction: column;
      align-items: center;
      padding: 32px 24px;
      background-color: #ffffff;
      border-radius: 24px;
      border: 1px solid #EDF2F7;
      box-shadow: 0 4px 16px rgba(58, 124, 255, 0.04);
    }
    
    .event-icon {
      width: 96px;
      height: 96px;
      border-radius: 24px;
      display: flex;
      align-items: center;
      justify-content: center;
      margin-bottom: 20px;
      background: linear-gradient(135deg, ${theme.primaryLight} 0%, #EDF2F7 100%);
    }
    
    .event-icon-lay {
      background: linear-gradient(135deg, #EDF2F7 0%, #EDF2F7 100%);
    }
    
    .icon-emoji {
      font-size: 52px;
      line-height: 1;
      font-weight: bold;
    }
    
    .event-info {
      width: 100%;
      text-align: center;
    }
    
    .event-title {
      font-size: 28px;
      font-weight: 600;
      color: #E8A400;
      margin-bottom: 8px;
      display: block;
    }
    
    .event-content {
      font-size: 24px;
      color: #475569;
      margin-bottom: 12px;
      display: -webkit-box;
      -webkit-line-clamp: 2;
      -webkit-box-orient: vertical;
      overflow: hidden;
      line-height: 1.4;
    }
    
    .event-date {
      font-size: 22px;
      color: #94A3B8;
    }
    
    .event-date .date {
      margin-right: 8px;
    }
    
    .event-date .time {
      opacity: 0.8;
    }
    
    .empty-events {
      display: flex;
      flex-direction: column;
      align-items: center;
      padding: 60px 0;
    }
    
    .empty-icon {
      font-size: 64px;
      margin-bottom: 16px;
    }
    
    .empty-text {
      font-size: 28px;
      color: #94A3B8;
    }
    
    /* 二维码区域 - 对齐 WXSS: padding 32rpx, 图片 160rpx */
    .qrcode-section {
      margin: 0 24px 24px;
    }
    
    .qrcode-card {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 32px;
      background-color: #ffffff;
      border-radius: 24px;
      box-shadow: 0 4px 16px rgba(58, 124, 255, 0.06);
    }
    
    .qrcode-left {
      display: flex;
      flex-direction: column;
      gap: 8px;
    }
    
    .qrcode-title {
      font-size: 30px;
      font-weight: bold;
      color: #E8A400;
    }
    
    .qrcode-subtitle {
      font-size: 24px;
      color: #94A3B8;
    }
    
    .qrcode-right {
      flex-shrink: 0;
    }
    
    .qrcode-img {
      width: 160px;
      height: 160px;
      border-radius: 12px;
      border: 2px solid #EDF2F7;
    }
    
    .qrcode-placeholder {
      width: 160px;
      height: 160px;
      border-radius: 12px;
      border: 2px dashed #FFF8E7;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    
    /* 底部 - 对齐 WXSS: padding 40rpx 24rpx 60rpx, gap 24rpx */
    .bottom-bar {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 24px;
      padding: 40px 24px 60px;
    }
    
    .footer-text {
      font-size: 24px;
      color: #CBD5E1;
    }
    
    .brand-text {
      font-size: 26px;
      color: ${theme.primary};
      text-align: center;
    }
  </style>
</head>
<body>
  <div class="page">
    <div class="content">
      <!-- 照片区域 -->
      ${photoSection}
      
      <!-- 信息卡片 -->
      <div class="info-card">
        <div class="pet-header">
          <div class="pet-avatar-section">
            ${avatarHtml}
          </div>
          <div class="pet-basic-info">
            <span class="pet-name">${pet.name || '未命名'}</span>
            <div class="pet-tags">
              ${tagsHtml}
            </div>
          </div>
        </div>
        
        <div class="parents-row">
          <div class="parent-box">
            <span class="parent-label">父本</span>
            <span class="parent-value ${pet.fatherName ? '' : 'unlinked'}">${pet.fatherName || '未关联'}</span>
          </div>
          <div class="parent-divider"></div>
          <div class="parent-box">
            <span class="parent-label">母本</span>
            <span class="parent-value ${pet.motherName ? '' : 'unlinked-red'}">${pet.motherName || '未关联'}</span>
          </div>
        </div>
      </div>
      
      <!-- 详细信息卡片 -->
      ${detailGridHtml ? `
        <div class="card">
          <div class="card-title">详细信息</div>
          ${detailGridHtml}
        </div>
      ` : ''}
      
      <!-- 备注卡片 -->
      ${pet.notes ? `
        <div class="card">
          <div class="card-title">备注</div>
          <div class="notes-content">${pet.notes}</div>
        </div>
      ` : ''}
      
      <!-- 家族谱系 -->
      <div class="pedigree-section">
        <div style="display: flex; justify-content: space-between; align-items: center; padding: 24px 0;">
          <div style="display: flex; align-items: baseline; gap: 16px;">
            <span class="section-title">家族谱系</span>
            ${stats.totalAncestors > 0 ? `
              <span class="pedigree-badge">
                <span class="pedigree-count">有血系</span>
              </span>
            ` : ''}
          </div>
        </div>
        ${pedigreeContentHtml}
      </div>
      
      <!-- 事件记录 -->
      <div class="card">
        <div class="card-title">
          种龟事件
          ${records.length > 0 ? `<span class="event-count">(${records.length}条)</span>` : ''}
        </div>
        ${eventCardsHtml}
      </div>
      
      <!-- 二维码区域 -->
      <div class="qrcode-section">
        <div class="qrcode-card">
          <div class="qrcode-left">
            <span class="qrcode-title">扫码查看宠物档案</span>
            <span class="qrcode-subtitle">微信扫一扫，查看完整信息</span>
          </div>
          <div class="qrcode-right">
            ${qrcodeUrl ? `<img src="${qrcodeUrl}" class="qrcode-img" />` : '<div class="qrcode-placeholder"></div>'}
          </div>
        </div>
      </div>
      
      <!-- 底部 -->
      <div class="bottom-bar">
        <span class="footer-text">— 养龟档案 —</span>
        <div class="brand-text">养龟档案 · 您的宠物健康管理助手</div>
      </div>
    </div>
  </div>
</body>
</html>`;
}

/**
 * 生成分享卡片 HTML（用于我的页面 → 分享 tab）
 * @param {Object} shareInfo - 分享信息（保留兼容性，本次可忽略）
 * @param {Object} options
 * @param {string} options.nickname - 用户昵称
 * @param {Object} options.theme - 主题配置（getTheme 返回值）
 * @returns {string} 完整 HTML 字符串
 */
function generateShareHTML(shareInfo, options = {}) {
  const theme = options.theme || getTheme();
  const nickname = options.nickname || '养龟档案';
  const cover = options.cover || '';
  const specialty = options.specialty || '记录、档案、繁育';
  const hasLicense = options.hasLicense || false;
  const region = options.region || '';
  const wechatId = options.wechatId || '';
  const tags = Array.isArray(options.tags) && options.tags.length > 0 ? options.tags : ['宠物档案', '繁育记录'];
  const intro = options.intro || '';
  const speciesList = Array.isArray(options.species) ? options.species : [];
  const envImages = Array.isArray(options.envImages) ? options.envImages : [];
  const envDesc = options.envDesc || '';

  // 主题色
  const primary = theme.primary || '#E8A400';
  const primaryDark = theme.primaryDark || '#C98D00';
  const primaryLight = theme.primaryLight || '#FFF8E7';

  // banner 背景：如果没有封面图，使用渐变
  const hasCover = cover && cover.length > 0;
  const bannerStyle = hasCover
    ? ''
    : `background: linear-gradient(135deg, ${primaryLight} 0%, ${theme.pageBg || '#FAF8F5'} 50%, ${primary} 100%);`;

  // 标签 HTML
  const tagsHtml = tags.map(t => `<span class="shop-tag">${t}</span>`).join('');

  // 种群展示 HTML
  const speciesHtml = speciesList.length > 0
    ? `
    <div class="section-title-row">
      <div class="section-title-bar"></div>
      <div class="section-title-text">种群展示</div>
      <div class="section-title-count">共 ${speciesList.length} 个品种</div>
    </div>
    <div class="species-grid">
      ${speciesList.map(s => `
      <div class="species-card">
        ${s.image
          ? `<img src="${s.image}" class="species-photo" />`
          : `<div class="species-photo placeholder">
               <div class="species-photo-text">${s.name}</div>
             </div>`
        }
        <div class="species-info">
          <div class="species-name">${s.name}</div>

        </div>
      </div>`).join('')}
    </div>
  `
    : '';

  // 养殖环境展示 HTML
  const envImagesHtml = envImages.length > 0
    ? `
    <div class="env-image-grid">
      ${envImages.map(src => `
      <div class="env-image-item"><img src="${src}" class="env-image"/></div>`).join('')}
    </div>
  `
    : '';
  const envHtml = `
    <div class="section-title-row">
      <div class="section-title-bar"></div>
      <div class="section-title-text">养殖环境</div>
    </div>
    ${envImagesHtml}
    ${envDesc ? `<div class="env-desc">${envDesc}</div>` : ''}
  `;

  // 信息表 HTML
  const infoLicenseRow = `
    <div class="info-row">
      <span class="info-label">营业执照</span>
      <span class="info-value">${hasLicense ? '有' : '无'}</span>
      <span class="info-label info-label-right">地区</span>
      <span class="info-value">${region || '未设置'}</span>
    </div>
  `;
  const infoWechatRow = `
    <div class="info-row">
      <span class="info-label">微信号</span>
      <span class="info-value wechat-id">${wechatId || '未设置'}</span>
      ${wechatId ? `<span class="copy-btn">复制</span>` : `<span class="info-hint">未公开</span>`}
    </div>
  `;

  // 简介 HTML
  const introHtml = intro
    ? `
    <div class="shop-intro-section">
      <div class="intro-title">龟友有话说</div>
      <span class="intro-text">${intro}</span>
    </div>
  `
    : '';

  return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  html, body {
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", "PingFang SC", "Microsoft YaHei", sans-serif;
    color: #E8A400;
    background: #FFFFFF;
    -webkit-font-smoothing: antialiased;
  }

  .share-wrapper {
    width: 750px;
    min-height: 1100px;
    padding: 40px 40px 80px;
    display: flex;
    flex-direction: column;
    align-items: center;
  }

  /* 龟友名片卡片 */
  .shop-card {
    width: 100%;
    background: #ffffff;
    border-radius: 24px;
    overflow: hidden;
    box-shadow: 0 8px 32px rgba(58, 124, 255, 0.08);
    border: 2px solid #FFF8E7;
  }

  /* 顶部封面 */
  .shop-banner {
    position: relative;
    width: 100%;
    height: 360px;
    ${bannerStyle}
    overflow: hidden;
  }

  .banner-image {
    width: 100%;
    height: 100%;
    object-fit: cover;
    display: block;
  }

  .banner-placeholder {
    width: 100%;
    height: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .banner-hint {
    font-size: 22px;
    color: rgba(255, 255, 255, 0.95);
    letter-spacing: 2px;
  }

  .banner-watermark {
    position: absolute;
    top: 24px;
    right: 24px;
    font-size: 16px;
    color: rgba(255, 255, 255, 0.85);
    letter-spacing: 2px;
    font-weight: 500;
  }

  /* 店名 + 实名标签 */
  .shop-header {
    display: flex;
    align-items: center;
    padding: 32px 32px 16px;
  }

  .shop-name {
    font-size: 32px;
    font-weight: bold;
    color: #E8A400;
    margin-right: 16px;
  }

  .verified-badge {
    padding: 6px 16px;
    background: linear-gradient(135deg, ${primary} 0%, ${primaryDark} 100%);
    color: #ffffff;
    font-size: 18px;
    border-radius: 999px;
    font-weight: 500;
  }

  /* 主玩品种 */
  .shop-specialty {
    padding: 0 32px 24px;
    display: flex;
    flex-wrap: wrap;
    align-items: flex-start;
  }

  .specialty-label {
    font-size: 22px;
    color: ${primary};
    font-weight: 500;
    flex-shrink: 0;
  }

  .specialty-text {
    font-size: 22px;
    color: ${primary};
    line-height: 1.6;
    flex: 1;
  }

  /* 信息表 */
  .shop-info {
    padding: 24px 32px;
  }

  .info-row {
    display: flex;
    align-items: center;
    padding: 16px 0;
    border-bottom: 2px solid #FAF8F5;
  }

  .info-row:last-child {
    border-bottom: none;
  }

  .info-label {
    font-size: 22px;
    color: #475569;
    width: 120px;
    flex-shrink: 0;
  }

  .info-label-right {
    width: 60px;
    margin-left: 32px;
    text-align: right;
  }

  .info-value {
    font-size: 22px;
    color: #E8A400;
    font-weight: 500;
    flex: 1;
  }

  .wechat-id {
    color: ${primaryDark};
    font-weight: 500;
  }

  .copy-btn {
    padding: 8px 20px;
    background: ${primaryLight};
    color: ${primaryDark};
    border-radius: 999px;
    font-size: 18px;
    font-weight: 500;
  }

  .info-hint {
    font-size: 18px;
    color: #94A3B8;
    margin-left: auto;
  }

  /* 标签 */
  .shop-tags {
    display: flex;
    flex-wrap: wrap;
    padding: 16px 32px 24px;
    gap: 12px;
  }

  .shop-tag {
    padding: 8px 20px;
    background: ${primaryLight};
    color: ${primaryDark};
    border-radius: 999px;
    font-size: 18px;
    font-weight: 500;
  }

  /* 区块标题行（种群、环境共用） */
  .section-title-row {
    display: flex;
    align-items: center;
    padding: 24px 32px 16px;
    border-top: 2px solid #FAF8F5;
  }

  .section-title-bar {
    width: 6px;
    height: 28px;
    background: linear-gradient(180deg, ${primary} 0%, ${primaryDark} 100%);
    border-radius: 4px;
    margin-right: 16px;
  }

  .section-title-text {
    font-size: 22px;
    font-weight: 600;
    color: #E8A400;
  }

  .section-title-count {
    margin-left: auto;
    font-size: 18px;
    color: #94A3B8;
  }

  /* 种群展示 */
  .species-grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 16px;
    padding: 0 32px 32px;
  }

  .species-card {
    background: #ffffff;
    border-radius: 16px;
    overflow: hidden;
    box-shadow: 0 2px 10px rgba(58, 124, 255, 0.06);
    border: 2px solid #EDF2F7;
  }

  .species-photo {
    width: 100%;
    height: 120px;
    object-fit: cover;
    display: block;
    background: linear-gradient(135deg, ${primaryLight} 0%, ${primary} 100%);
  }

  .species-photo.placeholder {
    display: flex;
    align-items: center;
    justify-content: center;
    background: linear-gradient(135deg, ${primaryLight} 0%, ${theme.pageBg || '#FFFFFF'} 100%);
  }

  .species-photo-text {
    font-size: 18px;
    color: ${primary};
    font-weight: 500;
  }

  .species-info {
    padding: 12px;
    text-align: center;
  }

  .species-name {
    display: block;
    font-size: 18px;
    font-weight: 600;
    color: #E8A400;
    margin-bottom: 4px;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .species-count {
    font-size: 16px;
    color: ${primaryDark};
    font-weight: 500;
  }

  /* 养殖环境展示 */
  .env-image-grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 16px;
    padding: 8px 32px 16px;
  }

  .env-image-item {
    aspect-ratio: 1;
    border-radius: 16px;
    overflow: hidden;
    background: #FAF8F5;
  }

  .env-image {
    width: 100%;
    height: 100%;
    object-fit: cover;
    display: block;
  }

  .env-placeholder {
    margin: 8px 32px 16px;
    width: 160px;
    height: 160px;
    background: linear-gradient(135deg, ${primaryLight} 0%, ${theme.pageBg || '#FAF8F5'} 100%);
    border: 2px dashed ${primary};
    border-radius: 16px;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .env-placeholder-text {
    font-size: 18px;
    color: ${primary};
    font-weight: 500;
  }

  .env-desc {
    display: block;
    padding: 0 32px 24px;
    font-size: 20px;
    color: #475569;
    line-height: 1.7;
  }

  /* 龟友有话说 */
  .shop-intro-section {
    padding: 24px 32px 32px;
    border-top: 2px solid #FAF8F5;
  }

  .intro-title {
    font-size: 22px;
    color: #E8A400;
    font-weight: 600;
    margin-bottom: 16px;
  }

  .intro-text {
    font-size: 22px;
    color: #475569;
    line-height: 1.8;
  }
</style>
</head>
<body>
  <div class="share-wrapper">
    <div class="shop-card">
      <!-- 顶部封面 -->
      <div class="shop-banner">
        ${hasCover ? `<img class="banner-image" src="${cover}" />` : `
          <div class="banner-placeholder">
            <span class="banner-hint">养龟档案 · 您的宠物健康管理助手</span>
          </div>
        `}
        <div class="banner-watermark">PRESENTED BY 养龟档案</div>
      </div>

      <!-- 店名 + 实名标签 -->
      <div class="shop-header">
        <span class="shop-name">${nickname}</span>
        <span class="verified-badge">已实名</span>
      </div>

      <!-- 主玩品种 -->
      <div class="shop-specialty">
        <span class="specialty-label">主玩：</span>
        <span class="specialty-text">${specialty}</span>
      </div>

      <!-- 信息表 -->
      <div class="shop-info">
        ${infoLicenseRow}
        ${infoWechatRow}
      </div>

      <!-- 标签 -->
      <div class="shop-tags">
        ${tagsHtml}
      </div>

      <!-- 种群展示 -->
      ${speciesHtml}

      <!-- 养殖环境展示 -->
      ${envHtml}

      <!-- 龟友有话说 -->
      ${introHtml}
    </div>
  </div>
</body>
</html>`;
}

module.exports = ThemeManager;

module.exports.getTheme = getTheme;
module.exports.generatePetHTML = generatePetHTML;
module.exports.generateShareHTML = generateShareHTML;
module.exports.urlToBase64 = urlToBase64;
module.exports.convertHTMLImagesToBase64 = convertHTMLImagesToBase64;
