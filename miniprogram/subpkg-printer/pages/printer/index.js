// 打印分包占位页面 - 实际打印逻辑在主包页面通过 require.async 调用
Page({
  onLoad() {
    // 自动返回
    wx.navigateBack({ delta: 1 })
  }
})
