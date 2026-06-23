// 3D 鱼缸可视化工具 - 基于 threejs-miniprogram
import { createScopedThreejs } from 'threejs-miniprogram'

Page({
  data: {
    statusBarHeight: 0,
    totalNavHeight: 120,
    // 尺寸输入（默认 cm）
    unit: 'cm',
    inputLength: '60',
    inputWidth: '30',
    inputHeight: '35',
    // 实际 cm 值（用于公式显示和3D计算）
    lengthCm: 60,
    widthCm: 30,
    heightCm: 35,
    // 正面玻璃：full=全高，half=半截
    frontGlassMode: 'full',
    frontHeightCm: 20,
    // 容积
    volumeText: '63.0',
    // 操作提示
    showHint: true
  },

  // ─── Three.js 实例引用 ───
  _THREE: null,
  _canvas: null,
  _renderer: null,
  _scene: null,
  _camera: null,
  _tankGroup: null,      // 鱼缸模型组
  _annotationGroup: null, // 标注组
  _animId: null,

  // ─── 相机球面坐标 ───
  _camTheta: Math.PI / 4,   // 水平角度
  _camPhi: Math.PI / 3.5,   // 垂直角度（从顶部算）
  _camDist: 120,             // 距中心距离
  _camTarget: null,

  // ─── 触摸状态 ───
  _touchStartX: 0,
  _touchStartY: 0,
  _touchStartTheta: 0,
  _touchStartPhi: 0,
  _pinchStartDist: 0,
  _pinchStartCamDist: 0,
  _isTouching: false,

  // ─── 防抖定时器 ───
  _rebuildTimer: null,

  // ═══════════════════════════════
  // 生命周期
  // ═══════════════════════════════

  onLoad(options) {
    const sysInfo = wx.getSystemInfoSync()
    const statusBarHeight = Math.max(sysInfo.statusBarHeight || 20, 20)
    const safeAreaTop = sysInfo.safeArea ? (sysInfo.safeArea.top || statusBarHeight) : statusBarHeight
    const finalStatusBarHeight = Math.max(statusBarHeight, safeAreaTop)
    const rpxRatio = 750 / sysInfo.windowWidth
    const totalNavHeight = Math.round(finalStatusBarHeight * rpxRatio) + 88 + 24
    this.setData({ statusBarHeight: finalStatusBarHeight, totalNavHeight })

    // 接收计算器页面传入的尺寸参数（单位 mm）
    if (options && options.length && options.width && options.height) {
      const lengthCm = (parseFloat(options.length) / 10).toFixed(1).replace(/\.0$/, '')
      const widthCm = (parseFloat(options.width) / 10).toFixed(1).replace(/\.0$/, '')
      const heightCm = (parseFloat(options.height) / 10).toFixed(1).replace(/\.0$/, '')
      const frontMode = options.frontMode === 'half' ? 'half' : 'full'
      const frontHeightRaw = parseFloat(options.frontHeight) || parseFloat(options.height)
      const frontHeightCm = Math.min(frontHeightRaw / 10, parseFloat(heightCm))
      this.setData({
        inputLength: lengthCm,
        inputWidth: widthCm,
        inputHeight: heightCm,
        lengthCm: parseFloat(lengthCm),
        widthCm: parseFloat(widthCm),
        heightCm: parseFloat(heightCm),
        frontGlassMode: frontMode,
        frontHeightCm: parseFloat(frontHeightCm.toFixed(1))
      })
    }

    this._computeVolume()
  },

  onReady() {
    // 等待 canvas 就绪后初始化 Three.js
    setTimeout(() => this._initThree(), 100)
    // 3秒后隐藏操作提示
    setTimeout(() => this.setData({ showHint: false }), 3000)
  },

  onUnload() {
    if (this._animId && this._canvas) {
      this._canvas.cancelAnimationFrame(this._animId)
    }
    if (this._rebuildTimer) clearTimeout(this._rebuildTimer)
    this._disposeScene()
  },

  goBack() {
    wx.navigateBack()
  },

  // ═══════════════════════════════
  // Three.js 初始化
  // ═══════════════════════════════

  _initThree() {
    wx.createSelectorQuery().select('#webgl').node().exec((res) => {
      if (!res || !res[0] || !res[0].node) {
        console.error('WebGL canvas 未找到')
        return
      }
      const canvas = res[0].node
      this._canvas = canvas

      // 设置 canvas 物理像素尺寸
      const sysInfo = wx.getSystemInfoSync()
      const dpr = Math.min(sysInfo.pixelRatio || 2, 2)
      const canvasWidth = sysInfo.windowWidth * dpr
      // canvas 区域 = 视口高度 - 导航栏 - 底部面板(约280rpx)
      const navHeightPx = this.data.totalNavHeight / (750 / sysInfo.windowWidth)
      const panelHeightPx = 280 / (750 / sysInfo.windowWidth)
      const canvasHeight = Math.max(200, sysInfo.windowHeight - navHeightPx - panelHeightPx) * dpr

      canvas.width = canvasWidth
      canvas.height = canvasHeight

      // 创建适配版 Three.js
      const THREE = createScopedThreejs(canvas)
      this._THREE = THREE

      // 渲染器
      const renderer = new THREE.WebGLRenderer({ antialias: true })
      renderer.setSize(canvasWidth, canvasHeight)
      renderer.setClearColor(0xffffff, 1)
      renderer.sortObjects = true  // 透明物体正确排序
      this._renderer = renderer

      // 场景
      const scene = new THREE.Scene()
      scene.background = new THREE.Color(0xffffff)
      this._scene = scene

      // 相机
      const aspect = canvasWidth / canvasHeight
      const camera = new THREE.PerspectiveCamera(45, aspect, 1, 2000)
      this._camera = camera
      this._camTarget = new THREE.Vector3(0, 0, 0)

      // 环境光 + 平行光（模拟室内光照）
      const ambientLight = new THREE.AmbientLight(0xffffff, 0.65)
      scene.add(ambientLight)

      const dirLight = new THREE.DirectionalLight(0xffffff, 0.8)
      dirLight.position.set(50, 80, 60)
      scene.add(dirLight)

      const dirLight2 = new THREE.DirectionalLight(0xffffff, 0.3)
      dirLight2.position.set(-40, 60, -50)
      scene.add(dirLight2)

      // 初始化相机位置
      this._updateCameraPosition()

      // 构建鱼缸和标注
      this._buildTank()
      this._buildAnnotations()
      this._autoFitCamera()

      // 启动渲染循环
      this._animate()
    })
  },

  // ═══════════════════════════════
  // 渲染循环
  // ═══════════════════════════════

  _animate() {
    if (!this._canvas || !this._renderer || !this._scene || !this._camera) return
    this._animId = this._canvas.requestAnimationFrame(() => this._animate())
    try {
      this._renderer.render(this._scene, this._camera)
    } catch (err) {
      console.error('WebGL render error:', err)
    }
  },

  // ═══════════════════════════════
  // 鱼缸 3D 模型构建
  // ═══════════════════════════════

  _getFrontHeightCm() {
    const { heightCm, frontGlassMode, frontHeightCm } = this.data
    if (frontGlassMode === 'full') return heightCm
    return Math.min(frontHeightCm || heightCm, heightCm)
  },

  _addGlassPanel(group, THREE, w, h, d, x, y, z, material, edgeMaterial) {
    const geo = new THREE.BoxGeometry(w, h, d)
    const mesh = new THREE.Mesh(geo, material)
    mesh.position.set(x, y, z)
    group.add(mesh)
    const edges = new THREE.LineSegments(new THREE.EdgesGeometry(geo), edgeMaterial)
    edges.position.copy(mesh.position)
    group.add(edges)
  },

  _buildTank() {
    const THREE = this._THREE
    if (!THREE || !this._scene) return

    // 清除旧模型
    if (this._tankGroup) {
      this._scene.remove(this._tankGroup)
      this._tankGroup.traverse((child) => {
        if (child.geometry) child.geometry.dispose()
        if (child.material) {
          if (Array.isArray(child.material)) {
            child.material.forEach(m => m.dispose())
          } else {
            child.material.dispose()
          }
        }
      })
    }

    const group = new THREE.Group()
    const { lengthCm, widthCm, heightCm } = this.data
    const L = lengthCm
    const W = widthCm
    const H = heightCm
    const frontH = this._getFrontHeightCm()
    const t = 0.4 // 可视化玻璃厚度（cm）

    const glassMaterial = new THREE.MeshPhongMaterial({
      color: 0xc8e6ff,
      transparent: true,
      opacity: 0.22,
      shininess: 120,
      specular: 0x88bbff,
      side: THREE.DoubleSide,
      depthWrite: false
    })

    const edgeMaterial = new THREE.LineBasicMaterial({
      color: 0x88bbdd,
      linewidth: 1
    })

    const bottomMat = new THREE.MeshPhongMaterial({
      color: 0xa8d8ea,
      transparent: true,
      opacity: 0.35,
      shininess: 80,
      depthWrite: false
    })

    // 底部玻璃
    this._addGlassPanel(group, THREE, L, t, W, 0, t / 2, 0, bottomMat, edgeMaterial)

    // 前玻璃（+Z 方向，底边对齐缸底）
    this._addGlassPanel(group, THREE, L, frontH, t, 0, frontH / 2, W / 2 - t / 2, glassMaterial, edgeMaterial)

    // 后玻璃（全高）
    this._addGlassPanel(group, THREE, L, H, t, 0, H / 2, -W / 2 + t / 2, glassMaterial, edgeMaterial)

    // 左右玻璃（全高）
    this._addGlassPanel(group, THREE, t, H, W, -L / 2 + t / 2, H / 2, 0, glassMaterial, edgeMaterial)
    this._addGlassPanel(group, THREE, t, H, W, L / 2 - t / 2, H / 2, 0, glassMaterial, edgeMaterial)

    this._tankGroup = group
    this._scene.add(group)
  },

  // ═══════════════════════════════
  // 尺寸标注构建
  // ═══════════════════════════════

  _buildAnnotations() {
    const THREE = this._THREE
    if (!THREE || !this._scene) return

    // 清除旧标注
    if (this._annotationGroup) {
      this._scene.remove(this._annotationGroup)
      this._annotationGroup.traverse((child) => {
        if (child.geometry) child.geometry.dispose()
        if (child.material) {
          if (child.material.map) child.material.map.dispose()
          child.material.dispose()
        }
      })
    }

    const group = new THREE.Group()
    const { lengthCm, widthCm, heightCm, frontGlassMode } = this.data
    const L = lengthCm, W = widthCm, H = heightCm
    const frontH = this._getFrontHeightCm()

    // 标注线偏移量（在鱼缸外侧）
    const offset = Math.max(L, W, H) * 0.12

    // ── 绿色标注线材质 ──
    const lineMaterial = new THREE.LineBasicMaterial({ color: 0x4CAF50 })
    const frontLineMaterial = new THREE.LineBasicMaterial({ color: 0xFF9800 })

    // ── 长度标注线（沿 X 轴，底部前方） ──
    const lengthLineGeo = new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(-L / 2, -offset, W / 2 + offset),
      new THREE.Vector3(L / 2, -offset, W / 2 + offset)
    ])
    group.add(new THREE.Line(lengthLineGeo, lineMaterial))
    // 端点竖线
    this._addTickLine(group, lineMaterial, -L / 2, -offset * 0.5, W / 2 + offset, -offset * 1.5, W / 2 + offset)
    this._addTickLine(group, lineMaterial, L / 2, -offset * 0.5, W / 2 + offset, -offset * 1.5, W / 2 + offset)

    // ── 宽度标注线（沿 Z 轴，底部左侧） ──
    const widthLineGeo = new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(-L / 2 - offset, -offset, -W / 2),
      new THREE.Vector3(-L / 2 - offset, -offset, W / 2)
    ])
    group.add(new THREE.Line(widthLineGeo, lineMaterial))
    this._addTickLineX(group, lineMaterial, -L / 2 - offset, -offset, -W / 2, -L / 2 - offset * 1.5, -offset, -W / 2)
    this._addTickLineX(group, lineMaterial, -L / 2 - offset, -offset, W / 2, -L / 2 - offset * 1.5, -offset, W / 2)

    // ── 高度标注线（沿 Y 轴，右前方） ──
    const heightLineGeo = new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(L / 2 + offset, 0, W / 2 + offset),
      new THREE.Vector3(L / 2 + offset, H, W / 2 + offset)
    ])
    group.add(new THREE.Line(heightLineGeo, lineMaterial))
    this._addTickLineH(group, lineMaterial, L / 2 + offset, 0, W / 2 + offset, L / 2 + offset * 1.5, W / 2 + offset)
    this._addTickLineH(group, lineMaterial, L / 2 + offset, H, W / 2 + offset, L / 2 + offset * 1.5, W / 2 + offset)

    // 半截模式下标注前玻璃高度（正面 +Z）
    if (frontGlassMode === 'half' && frontH < H) {
      const frontOffset = offset * 0.8
      const frontLineGeo = new THREE.BufferGeometry().setFromPoints([
        new THREE.Vector3(-L / 2 - frontOffset, 0, W / 2 + frontOffset),
        new THREE.Vector3(-L / 2 - frontOffset, frontH, W / 2 + frontOffset)
      ])
      group.add(new THREE.Line(frontLineGeo, frontLineMaterial))
      this._addTickLineH(group, frontLineMaterial, -L / 2 - frontOffset, 0, W / 2 + frontOffset, -L / 2 - frontOffset * 1.5, W / 2 + frontOffset)
      this._addTickLineH(group, frontLineMaterial, -L / 2 - frontOffset, frontH, W / 2 + frontOffset, -L / 2 - frontOffset * 1.5, W / 2 + frontOffset)

      const frontSprite = this._createTextSprite(`前 ${frontH}cm`, 0xFF9800)
      frontSprite.position.set(-L / 2 - frontOffset * 2.2, frontH / 2, W / 2 + frontOffset)
      frontSprite.scale.set(H * 0.35, H * 0.09, 1)
      group.add(frontSprite)
    }

    // ── 文字标注精灵 ──
    // 长度标注文字
    const lengthSprite = this._createTextSprite(`长 ${lengthCm}cm`)
    lengthSprite.position.set(0, -offset * 2, W / 2 + offset)
    lengthSprite.scale.set(L * 0.5, L * 0.12, 1)
    group.add(lengthSprite)

    // 宽度标注文字
    const widthSprite = this._createTextSprite(`宽 ${widthCm}cm`)
    widthSprite.position.set(-L / 2 - offset * 2, -offset * 2, 0)
    widthSprite.scale.set(W * 0.5, W * 0.12, 1)
    group.add(widthSprite)

    // 高度标注文字
    const heightSprite = this._createTextSprite(`高 ${heightCm}cm`)
    heightSprite.position.set(L / 2 + offset * 2, H / 2, W / 2 + offset)
    heightSprite.scale.set(H * 0.4, H * 0.1, 1)
    group.add(heightSprite)

    // 容积文字（鱼缸内部中心）
    const volumeSprite = this._createTextSprite(`${this.data.volumeText}L`, 0xE8A400, 48)
    volumeSprite.position.set(0, H * 0.45, 0)
    volumeSprite.scale.set(Math.max(L, W) * 0.5, Math.max(L, W) * 0.15, 1)
    group.add(volumeSprite)

    this._annotationGroup = group
    this._scene.add(group)
  },

  /**
   * 添加端点竖线（长度标注用）
   */
  _addTickLine(group, material, x, y1, z, y2, z2) {
    const THREE = this._THREE
    const geo = new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(x, y1, z),
      new THREE.Vector3(x, y2, z2)
    ])
    group.add(new THREE.Line(geo, material))
  },

  /**
   * 添加端点横线（宽度标注用）
   */
  _addTickLineX(group, material, x1, y, z, x2, y2, z2) {
    const THREE = this._THREE
    const geo = new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(x1, y, z),
      new THREE.Vector3(x2, y2, z2)
    ])
    group.add(new THREE.Line(geo, material))
  },

  /**
   * 添加端点横线（高度标注用）
   */
  _addTickLineH(group, material, x, y, z, x2, z2) {
    const THREE = this._THREE
    const geo = new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(x, y, z),
      new THREE.Vector3(x2, y, z2)
    ])
    group.add(new THREE.Line(geo, material))
  },

  /**
   * 创建文字精灵（使用离屏 Canvas 生成纹理）
   * @param {string} text - 标注文字
   * @param {number} color - 文字颜色（十六进制）
   * @param {number} fontSize - 字号
   */
  _createTextSprite(text, color = 0x4CAF50, fontSize = 36) {
    const THREE = this._THREE

    // 使用小程序离屏 Canvas 绘制文字
    const offCanvas = wx.createOffscreenCanvas({ type: '2d', width: 512, height: 128 })
    const ctx = offCanvas.getContext('2d')

    // 清透明背景
    ctx.clearRect(0, 0, 512, 128)

    // 绘制文字
    const colorHex = '#' + color.toString(16).padStart(6, '0')
    ctx.font = `bold ${fontSize}px sans-serif`
    ctx.fillStyle = colorHex
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText(text, 256, 64)

    // 生成纹理
    const texture = new THREE.CanvasTexture(offCanvas)
    texture.needsUpdate = true

    const spriteMat = new THREE.SpriteMaterial({
      map: texture,
      transparent: true,
      depthWrite: false,
      depthTest: false
    })

    return new THREE.Sprite(spriteMat)
  },

  // ═══════════════════════════════
  // 相机控制
  // ═══════════════════════════════

  /**
   * 根据球面坐标更新相机位置
   */
  _updateCameraPosition() {
    if (!this._camera || !this._camTarget) return
    const dist = this._camDist
    const theta = this._camTheta
    const phi = this._camPhi
    const target = this._camTarget

    const x = dist * Math.sin(phi) * Math.sin(theta)
    const y = dist * Math.cos(phi)
    const z = dist * Math.sin(phi) * Math.cos(theta)

    this._camera.position.set(target.x + x, target.y + y, target.z + z)
    this._camera.lookAt(target)
  },

  /**
   * 根据鱼缸尺寸自动调整相机距离
   */
  _autoFitCamera() {
    const { lengthCm, widthCm, heightCm } = this.data
    const maxDim = Math.max(lengthCm, widthCm, heightCm)
    this._camDist = maxDim * 2.2
    this._camTarget = new this._THREE.Vector3(0, heightCm * 0.35, 0)
    this._updateCameraPosition()
  },

  // ═══════════════════════════════
  // 触摸手势交互
  // ═══════════════════════════════

  _getTouchPoint(touch) {
    return {
      x: touch.x != null ? touch.x : touch.clientX,
      y: touch.y != null ? touch.y : touch.clientY
    }
  },

  onTouchStart(e) {
    if (!e.touches || e.touches.length === 0) return
    this._isTouching = true

    if (e.touches.length === 1) {
      const pt = this._getTouchPoint(e.touches[0])
      this._touchStartX = pt.x
      this._touchStartY = pt.y
      this._touchStartTheta = this._camTheta
      this._touchStartPhi = this._camPhi
    } else if (e.touches.length === 2) {
      const p0 = this._getTouchPoint(e.touches[0])
      const p1 = this._getTouchPoint(e.touches[1])
      const dx = p0.x - p1.x
      const dy = p0.y - p1.y
      this._pinchStartDist = Math.sqrt(dx * dx + dy * dy)
      this._pinchStartCamDist = this._camDist
    }
  },

  onTouchMove(e) {
    if (!this._isTouching || !e.touches || e.touches.length === 0) return

    if (e.touches.length === 1) {
      const pt = this._getTouchPoint(e.touches[0])
      const deltaX = pt.x - this._touchStartX
      const deltaY = pt.y - this._touchStartY
      const sensitivity = 0.008

      this._camTheta = this._touchStartTheta - deltaX * sensitivity
      this._camPhi = Math.max(0.15, Math.min(Math.PI - 0.15,
        this._touchStartPhi - deltaY * sensitivity
      ))
      this._updateCameraPosition()

    } else if (e.touches.length === 2) {
      const p0 = this._getTouchPoint(e.touches[0])
      const p1 = this._getTouchPoint(e.touches[1])
      const dx = p0.x - p1.x
      const dy = p0.y - p1.y
      const dist = Math.sqrt(dx * dx + dy * dy)

      if (this._pinchStartDist > 0) {
        const ratio = this._pinchStartDist / dist
        const { lengthCm, widthCm, heightCm } = this.data
        const maxDim = Math.max(lengthCm, widthCm, heightCm)
        // 限制缩放范围
        this._camDist = Math.max(maxDim * 0.8, Math.min(maxDim * 6,
          this._pinchStartCamDist * ratio
        ))
        this._updateCameraPosition()
      }
    }
  },

  onTouchEnd() {
    this._isTouching = false
  },

  // ═══════════════════════════════
  // 输入处理 & 容积计算
  // ═══════════════════════════════

  /**
   * 容积 = 长(cm) × 宽(cm) × 高(cm) ÷ 1000，保留 1 位小数
   */
  _computeVolume() {
    const { lengthCm, widthCm, heightCm } = this.data
    const volume = (lengthCm * widthCm * heightCm / 1000).toFixed(1)
    this.setData({ volumeText: volume })
  },

  /**
   * 统一处理参数变更 -> 更新 cm 值 -> 计算容积 -> 防抖重建 3D
   */
  _onParamChange(key, value) {
    const { unit } = this.data
    const numVal = parseFloat(value)
    if (isNaN(numVal) || numVal <= 0) return

    // 转换为 cm
    let cmVal = numVal
    if (unit === 'mm') cmVal = numVal / 10

    // 更新 data
    const update = {}
    update[key] = cmVal
    this.setData(update)

    this._computeVolume()
    this._scheduleRebuild()
  },

  /**
   * 防抖重建 3D 场景（避免输入时频繁重建）
   */
  _scheduleRebuild() {
    if (this._rebuildTimer) clearTimeout(this._rebuildTimer)
    this._rebuildTimer = setTimeout(() => {
      this._buildTank()
      this._buildAnnotations()
      this._autoFitCamera()
    }, 300)
  },

  onLengthInput(e) {
    this._onParamChange('lengthCm', e.detail.value)
  },

  onWidthInput(e) {
    this._onParamChange('widthCm', e.detail.value)
  },

  onHeightInput(e) {
    this._onParamChange('heightCm', e.detail.value)
  },

  onParamBlur() {
    // 失焦时立即重建
    if (this._rebuildTimer) clearTimeout(this._rebuildTimer)
    this._buildTank()
    this._buildAnnotations()
    this._autoFitCamera()
  },

  /**
   * 切换单位（cm ↔ mm）
   */
  toggleUnit() {
    const { unit, lengthCm, widthCm, heightCm } = this.data
    if (unit === 'cm') {
      // cm -> mm
      this.setData({
        unit: 'mm',
        inputLength: String(Math.round(lengthCm * 10)),
        inputWidth: String(Math.round(widthCm * 10)),
        inputHeight: String(Math.round(heightCm * 10))
      })
    } else {
      // mm -> cm
      this.setData({
        unit: 'cm',
        inputLength: String(lengthCm),
        inputWidth: String(widthCm),
        inputHeight: String(heightCm)
      })
    }
  },

  // ═══════════════════════════════
  // 资源释放
  // ═══════════════════════════════

  _disposeScene() {
    if (!this._scene) return
    this._scene.traverse((child) => {
      if (child.geometry) child.geometry.dispose()
      if (child.material) {
        if (Array.isArray(child.material)) {
          child.material.forEach(m => {
            if (m.map) m.map.dispose()
            m.dispose()
          })
        } else {
          if (child.material.map) child.material.map.dispose()
          child.material.dispose()
        }
      }
    })
    if (this._renderer) {
      this._renderer.dispose()
    }
    this._scene = null
    this._camera = null
    this._renderer = null
    this._THREE = null
  }
})