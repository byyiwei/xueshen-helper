/**
 * preview 页面已废弃，所有入口重定向到 detail 页（浏览模式）
 * 保留此页面是为了兼容已生成的小程序码（scene 指向此页面）
 */
Page({
  onLoad: function (options) {
    let petId = ''

    // 小程序码扫码进入
    if (options && options.scene) {
      const scene = decodeURIComponent(options.scene)
      const match = scene.match(/petId=([^&]+)/)
      petId = match ? match[1] : scene
    }
    if (!petId && options && options.id) {
      petId = options.id
    }
    if (!petId && options && options.petId) {
      petId = options.petId
    }

    if (petId) {
      wx.redirectTo({
        url: '/pages/pet/detail?petId=' + petId + '&isPublic=true',
        fail: () => {
          wx.navigateTo({
            url: '/pages/pet/detail?petId=' + petId + '&isPublic=true'
          })
        }
      })
    } else {
      wx.navigateBack({ fail: () => wx.switchTab({ url: '/pages/index/index' }) })
    }
  }
})
