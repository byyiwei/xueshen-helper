# 龟缸批量快捷操作 & 首页提醒优化方案

## 概述

两个优化方向：
1. **龟缸列表批量快捷操作** — 换水/喂食统一操作入口，支持一次操作多个龟缸
2. **首页龟缸提醒显示优化** — 相同时间提醒过多时的分组/折叠/点击穿透

---

## 功能一：龟缸列表批量快捷操作

### 现状分析

- 龟缸列表页 `pages/tanks/index` 右下角只有一个 FAB（+ 添加龟缸）
- 换水/喂食记录只能在详情页逐个添加（modal 表单）
- 已有 `quick-check` 页面（单龟缸快捷打卡），但处于未使用的孤儿状态
- 服务端已有 `POST /api/tanks/:id/check` 单龟缸打卡接口，无批量接口

### 设计方案

**入口位置**：FAB 按钮区域改造为双按钮

```
原来:                    改为:
                         ┌─────────┐
                         │ 🚿 换水  │  ← 快捷换水
                         ├─────────┤
                         │ 🍽 喂食  │  ← 快捷喂食
[+ 添加龟缸]             ├─────────┤
                         │   ＋    │  ← 添加龟缸（原有）
                         └─────────┘
```

点击「换水」或「喂食」后弹出底部 sheet：
1. 勾选要操作的龟缸（多选，默认全选当天需要该操作的龟缸）
2. 填写参数（换水：1/3、1/2、全换；喂食：食物类型+投喂量）
3. 一键提交

### 实现步骤

#### 1. 龟缸列表页 WXML（`pages/tanks/index.wxml`）

- FAB 区域从单按钮改为垂直双列（换水/喂食/添加三按钮）
- 增加批量操作底部 sheet 弹窗

弹窗结构：
```xml
<!-- 批量快捷操作弹窗 -->
<view wx:if="{{showBatchModal}}" class="modal-mask" bindtap="closeBatchModal">
  <view class="modal-sheet" catchtap="stopProp">
    <view class="modal-head">
      <text class="modal-title">批量{{batchType === 'water' ? '换水' : '喂食'}}</text>
      <text class="modal-close" bindtap="closeBatchModal">×</text>
    </view>
    <!-- 龟缸多选列表 -->
    <scroll-view scroll-y class="batch-tank-list">
      <view wx:for="{{batchTanks}}" wx:key="id" class="batch-tank-item"
            bindtap="toggleBatchTank" data-id="{{item.id}}">
        <view class="batch-check {{item.checked ? 'checked' : ''}}">✓</view>
        <view class="batch-tank-info">
          <text class="batch-tank-name">{{item.name}}</text>
          <text class="batch-tank-meta">{{item.species}} · 公{{item.male_count}}母{{item.female_count}}</text>
        </view>
      </view>
    </scroll-view>
    <!-- 操作参数 -->
    <view class="batch-params">
      <!-- 换水：比例选择 -->
      <view wx:if="{{batchType === 'water'}}" class="param-row">
        <text class="param-label">换水比例</text>
        <view class="param-options">
          <view wx:for="{{waterRatios}}" wx:key="*this"
                class="param-chip {{batchWaterRatio === item ? 'active' : ''}}"
                bindtap="setBatchWaterRatio" data-value="{{item}}">{{item}}</view>
        </view>
      </view>
      <!-- 喂食：食物+量 -->
      <view wx:if="{{batchType === 'feeding'}}" class="param-row">
        <text class="param-label">食物类型</text>
        <input class="param-input" placeholder="如：龟粮" value="{{batchFoodType}}" bindinput="onBatchFoodInput"/>
      </view>
      <view wx:if="{{batchType === 'feeding'}}" class="param-row">
        <text class="param-label">投喂量(克)</text>
        <input class="param-input" type="digit" placeholder="选填" value="{{batchAmount}}" bindinput="onBatchAmountInput"/>
      </view>
    </view>
    <!-- 提交按钮 -->
    <view class="batch-submit {{batchSubmitting ? 'disabled' : ''}}" bindtap="submitBatchCheck">
      <text>{{batchSubmitting ? '提交中...' : '一键完成(' + batchSelectedCount + '个龟缸)'}}</text>
    </view>
  </view>
</view>
```

#### 2. 龟缸列表页 JS（`pages/tanks/index.js`）

新增 data：
```javascript
showBatchModal: false,
batchType: 'water',          // 'water' | 'feeding'
batchTanks: [],              // [{id, name, species, male_count, female_count, checked}]
batchWaterRatio: '1/3',
batchFoodType: '',
batchAmount: '',
batchSubmitting: false,
batchSelectedCount: 0,
waterRatios: ['1/3', '1/2', '全换']
```

新增方法：
- `openBatchModal(e)` — 打开弹窗，传入 type，构建龟缸选择列表，默认勾选当天到期的龟缸
- `closeBatchModal()` — 关闭
- `toggleBatchTank(e)` — 切换勾选
- `setBatchWaterRatio(e)` — 选择换水比例
- `onBatchFoodInput(e)` / `onBatchAmountInput(e)` — 喂食参数输入
- `submitBatchCheck()` — 循环调用 `POST /api/tanks/:id/check` 逐个提交，全部完成后提示成功

#### 3. 龟缸列表页 WXSS（`pages/tanks/index.wxss`）

- FAB 区域改为垂直三按钮布局
- 批量操作弹窗样式（复用 reminders 页的 modal 样式风格）
- 龟缸多选列表样式（checkbox + 信息行）
- 参数选择 chip 样式

#### 4. 服务端（可选优化）

当前方案：前端循环调用 `POST /api/tanks/:id/check`（简单，无需后端改动）

可选优化：新增 `POST /api/tanks/batch-check` 批量接口，接收 `{ items: [{ tankId, type, waterChange, foodType, amountG }] }`，服务端事务批量插入并更新提醒周期。前端改为一次请求。

---

## 功能二：首页龟缸提醒显示优化

### 现状分析

- 首页龟缸提醒完全平铺列表，同一龟缸的换水+喂食显示为两个独立条目
- 没有分组或折叠，提醒多时列表很长
- 点击提醒只能跳转详情页，无法直接在首页完成打卡
- 排序仅按优先级（overdue > today > tomorrow > normal），不区分龟缸

### 设计方案

**核心思路：按龟缸分组 + 当天任务优先 + 非当天折叠**

```
待办事项 [龟缸]  2项
─────────────────────
🔴 龟缸A · 换水              超期1天  [完成]
🟡 龟缸B · 喂食              今天    [完成]
─────────────────────
▸ 还有 3 项未来提醒 (明天~3天后)   ← 点击展开
```

展开后：
```
🔵 龟缸A · 喂食     明天
⚪ 龟缸C · 换水     3天后
⚪ 龟缸C · 喂食     3天后
```

### 实现方案

#### 1. 前端数据处理（`pages/index/index.js`）

修改 `loadTankReminders` 方法，对返回数据进行分组：

```javascript
// 将扁平列表分为「当天及超期」和「未来」两组
const todayList = list.filter(r => 
  r.statusClass === 'overdue' || r.statusClass === 'today'
)
const futureList = list.filter(r => 
  r.statusClass === 'tomorrow' || r.statusClass === 'normal'
)
```

data 增加：
```javascript
tankRemindersToday: [],      // 当天及超期
tankRemindersFuture: [],     // 未来提醒
hasFutureReminders: false,
futureExpanded: false,       // 折叠状态
```

#### 2. 首页 WXML（`pages/index/index.wxml`）

```xml
<block wx:if="{{todoTab === 'tank'}}">
  <view wx:if="{{hasTankReminder}}" class="reminder-list">
    <!-- 当天及超期提醒（始终显示） -->
    <view wx:for="{{tankRemindersToday}}" wx:key="id" class="reminder-item press"
      bindtap="gotoTankDetailFromReminder" data-tank-id="{{item.tankId}}">
      <!-- 同现有结构 -->
    </view>

    <!-- 未来提醒折叠区 -->
    <view wx:if="{{hasFutureReminders}}" class="future-fold press"
          bindtap="toggleFutureReminders">
      <text class="future-fold-text">
        {{futureExpanded ? '收起' : '还有 ' + tankRemindersFuture.length + ' 项未来提醒'}}
      </text>
      <text class="future-fold-arrow {{futureExpanded ? 'up' : ''}}">▾</text>
    </view>

    <!-- 未来提醒列表（展开时显示） -->
    <block wx:if="{{futureExpanded}}">
      <view wx:for="{{tankRemindersFuture}}" wx:key="id" class="reminder-item press future-item"
        bindtap="gotoTankDetailFromReminder" data-tank-id="{{item.tankId}}">
        <!-- 同现有结构，样式稍弱化 -->
      </view>
    </block>
  </view>
</block>
```

#### 3. 首页 JS 新增方法

```javascript
toggleFutureReminders() {
  this.setData({ futureExpanded: !this.data.futureExpanded })
}
```

#### 4. 首页 WXSS

- `.future-fold` — 折叠条样式（居中、浅灰背景、圆角）
- `.future-fold-arrow.up` — 箭头旋转 180°
- `.future-item` — 未来提醒项样式（透明度 0.7，弱化视觉权重）

#### 5. 点击穿透优化（可选增强）

当前点击提醒条目跳转详情页。可增加快捷完成按钮：

```xml
<view class="rem-done" catchtap="quickCheckTank" data-tank-id="{{item.tankId}}" data-type="{{item.type}}">
  <text>完成</text>
</view>
```

`quickCheckTank` 方法直接调用 `POST /api/tanks/:id/check` 完成打卡，成功后刷新提醒列表。这样用户不用离开首页就能完成打卡。

---

## 涉及文件汇总

| 功能 | 文件 | 改动 |
|------|------|------|
| 批量操作 | `pages/tanks/index.wxml` | FAB 三按钮 + 批量操作弹窗 |
| 批量操作 | `pages/tanks/index.js` | 批量操作逻辑（打开/勾选/提交） |
| 批量操作 | `pages/tanks/index.wxss` | FAB 布局 + 弹窗样式 |
| 提醒优化 | `pages/index/index.wxml` | 提醒分组显示 + 折叠区 |
| 提醒优化 | `pages/index/index.js` | 数据分组 + 折叠切换 + 快捷完成 |
| 提醒优化 | `pages/index/index.wxss` | 折叠条 + 未来项样式 |

## 假设与决策

- 批量操作前端循环调用现有接口（简单），后续可优化为批量接口
- 龟缸选择默认勾选当天到期的龟缸，减少操作步骤
- 首页提醒按「当天+超期」和「未来」分两组，未来项默认折叠
- 快捷完成按钮为可选增强，先实现折叠分组
