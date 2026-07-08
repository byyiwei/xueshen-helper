const { getAPI } = require('../../../../utils/api.js')

Page({
  data: {
    statusBarHeight: 0,
    loading: false,
    loadError: false,
    errorMsg: '',

    selectedMedicine: null,
    usageDosages: [],

    selectedRouteIdx: 0,
    selectedRoute: null,

    weightValue: '',
    weightUnit: 'g',

    result: null
  },

  onLoad(options) {
    const sysInfo = wx.getSystemInfoSync()
    const statusBarHeight = Math.max(sysInfo.statusBarHeight || 20, 20)
    this.setData({ statusBarHeight })
    this._medicineId = options.medicineId || ''
    this.loadMedicines()
  },

  async loadMedicines() {
    this.setData({ loading: true, loadError: false })
    let med = null

    try {
      const api = getAPI()
      const res = await api.getMedicines()
      if (res.success && Array.isArray(res.data)) {
        if (res.data.length === 0) {
          this.setData({ loading: false, loadError: true, errorMsg: '药品库为空，请先在管理后台添加药品' })
          return
        }
        if (this._medicineId) {
          const found = res.data.find(m => String(m.id) === String(this._medicineId))
          if (found) med = this._buildMed(found)
        } else {
          med = this._buildMed(res.data[0])
        }
      }
    } catch (_) {}

    if (med) {
      const dosages = med.usageDosages || []
      const first = dosages.length > 0 ? dosages[0] : null
      this.setData({
        selectedMedicine: med,
        usageDosages: dosages,
        selectedRouteIdx: 0,
        selectedRoute: first,
        loading: false
      })
    } else {
      this.setData({ loading: false, loadError: true, errorMsg: '加载药品失败，请检查网络' })
    }
  },

  _buildMed(found) {
    const api = getAPI()
    return {
      id: found.id, name: found.name, category: found.category,
      indications: found.indications, notes: found.notes,
      image: found.image ? (api.getBaseUrl() + '/' + found.image) : '',
      usageDosages: (found.usageDosages || []).map(d => ({
        route: d.route, dose: d.dose, unit: d.unit,
        concentration: d.concentration || 0,
        concUnit: d.concUnit || 'mg/ml',
        dilutionNote: d.dilutionNote || ''
      }))
    }
  },

  goBack() {
    wx.navigateBack()
  },

  retryLoad() {
    this.loadMedicines()
  },

  selectRoute(e) {
    const idx = parseInt(e.currentTarget.dataset.idx, 10)
    const route = this.data.usageDosages[idx]
    if (!route) return
    this.setData({
      selectedRouteIdx: idx,
      selectedRoute: route,
      result: null
    })
  },

  onWeightInput(e) {
    this.setData({ weightValue: e.detail.value || '', result: null })
  },

  toggleWeightUnit() {
    this.setData({ weightUnit: this.data.weightUnit === 'g' ? 'kg' : 'g', result: null })
  },

  calculate() {
    const { selectedRoute, weightValue, weightUnit } = this.data
    if (!selectedRoute) {
      wx.showToast({ title: '请选择给药途径', icon: 'none' })
      return
    }

    const weight = parseFloat(weightValue)
    if (!weight || weight <= 0) {
      wx.showToast({ title: '请输入有效体重', icon: 'none' })
      return
    }

    const weightKg = weightUnit === 'g' ? weight / 1000 : weight
    const dose = parseFloat(selectedRoute.dose) || 0
    const unit = selectedRoute.unit || 'mg/kg'
    const effectiveDose = weightKg * dose
    const doseUnit = unit.split('/')[0] || 'mg'

    const inputDesc = weightUnit === 'g'
      ? `体重 ${weight} g（${weightKg.toFixed(3)} kg）`
      : `体重 ${weight} kg`

    const result = {
      medicineName: this.data.selectedMedicine ? this.data.selectedMedicine.name : '',
      routeName: selectedRoute.route,
      amountText: effectiveDose < 0.01 ? effectiveDose.toFixed(4) : effectiveDose.toFixed(2),
      unit: doseUnit,
      formula: `${weightKg.toFixed(3)} kg × ${dose} ${unit} = ${effectiveDose.toFixed(2)} ${doseUnit}`,
      inputDesc
    }

    // 注射途径：根据浓度换算注射体积
    if (selectedRoute.route === '注射' && selectedRoute.concentration && selectedRoute.concentration > 0) {
      const conc = parseFloat(selectedRoute.concentration)
      const concUnitLabel = selectedRoute.concUnit || 'mg/ml'
      const volumeMl = effectiveDose / conc

      result.volumeUnit = 'ml'
      result.concentration = conc
      result.concFormula = `${effectiveDose.toFixed(2)} ${doseUnit} ÷ ${conc} ${concUnitLabel} = ${volumeMl.toFixed(4)} ml`

      if (volumeMl >= 0.2) {
        // 体积够大，1ml注射器直接抽取
        result.volumeText = volumeMl.toFixed(2)
        result.injectAdvice = `用1ml注射器直接抽取 ${volumeMl.toFixed(2)} ml 注射`
        result.adviceType = 'ok'
      } else {
        // 体积 < 0.2ml，需要稀释
        // 取1ml原液，加整数ml生理盐水，使稀释后抽取量 >= 0.1ml
        const origVol = 1
        let totalVol = 5

        // 逐步增加稀释总量（5的倍数），直到抽取量 >= 0.1ml
        while (volumeMl * totalVol / origVol < 0.1 && totalVol < 50) {
          totalVol += 5
        }

        const salineVol = totalVol - origVol
        const drawVol = volumeMl * totalVol / origVol
        const syringe = drawVol > 1 ? '5ml' : '1ml'

        result.volumeText = volumeMl.toFixed(4)
        result.injectAdvice = `取 ${origVol}ml 原液 + ${salineVol}ml 生理盐水 = ${totalVol}ml，摇匀后用${syringe}注射器抽取 ${drawVol.toFixed(2)} ml 注射`
        result.adviceType = 'warn'
      }
    }

    // 稀释说明
    if (selectedRoute.dilutionNote) {
      result.dilutionNote = selectedRoute.dilutionNote
    }

    this.setData({ result })
  }
})
