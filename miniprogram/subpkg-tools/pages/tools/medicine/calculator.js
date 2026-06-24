const { medicines: medicineList } = require('./medicines.js')

const routeDefs = [
  { id: 'oral', name: '口服' },
  { id: 'bath', name: '药浴' },
  { id: 'inject', name: '注射' }
]

const formDefs = {
  tablet: { id: 'tablet', name: '片剂', unit: 'mg/片', specLabel: '含量', specPlaceholder: '阿莫西林含量', inputType: 'digit' },
  powder: { id: 'powder', name: '粉剂', unit: '%', specLabel: '浓度', specPlaceholder: '有效成分浓度', inputType: 'digit' },
  dry: { id: 'dry', name: '干粉', unit: 'mg/瓶', specLabel: '含量', specPlaceholder: '每瓶含量', inputType: 'digit' },
  injection: { id: 'injection', name: '注射液', unit: 'mg/ml', specLabel: '浓度', specPlaceholder: '注射液浓度', inputType: 'digit' }
}

function buildFormRows(medicine, selectedRoute, selectedForm) {
  return routeDefs.map(route => {
    const supportedForms = medicine && medicine.supportedForms[route.id] ? medicine.supportedForms[route.id] : []
    const hasSupported = supportedForms.length > 0
    return {
      route,
      active: route.id === selectedRoute,
      disabled: !hasSupported,
      forms: Object.keys(formDefs).map(formId => {
        const form = formDefs[formId]
        const supported = supportedForms.includes(formId)
        return {
          ...form,
          supported,
          active: route.id === selectedRoute && formId === selectedForm
        }
      })
    }
  })
}

Page({
  data: {
    statusBarHeight: 0,
    totalNavHeight: 120,

    medicines: medicineList,
    routeDefs,
    formDefs,

    selectedMedicineId: '',
    selectedMedicine: null,
    selectedRoute: 'oral',
    selectedForm: 'tablet',
    formRows: [],

    specValue: '',
    weightValue: '',
    result: null
  },

  onLoad() {
    const sysInfo = wx.getSystemInfoSync()
    const statusBarHeight = Math.max(sysInfo.statusBarHeight || 20, 20)
    const safeAreaTop = sysInfo.safeArea ? (sysInfo.safeArea.top || statusBarHeight) : statusBarHeight
    const finalStatusBarHeight = Math.max(statusBarHeight, safeAreaTop)
    const rpxRatio = 750 / sysInfo.windowWidth
    const totalNavHeight = Math.round(finalStatusBarHeight * rpxRatio) + 88 + 24

    const defaultMedicine = medicineList.find(m => {
      return m.supportedForms['oral'] && m.supportedForms['oral'].includes('tablet')
    }) || medicineList[0]

    const defaultRoute = 'oral'
    const defaultForm = this.getFirstSupportedForm(defaultMedicine, defaultRoute)

    this.setData({
      statusBarHeight: finalStatusBarHeight,
      totalNavHeight,
      selectedMedicineId: defaultMedicine.id,
      selectedMedicine: defaultMedicine,
      selectedRoute: defaultRoute,
      selectedForm: defaultForm,
      formRows: buildFormRows(defaultMedicine, defaultRoute, defaultForm)
    })
  },

  goBack() {
    wx.navigateBack()
  },

  getSelectedMedicine() {
    return this.data.medicines.find(item => item.id === this.data.selectedMedicineId)
  },

  getFirstSupportedForm(medicine, route) {
    if (!medicine || !medicine.supportedForms[route] || !medicine.supportedForms[route].length) {
      return ''
    }
    return medicine.supportedForms[route][0]
  },

  onPickMedicine(e) {
    const index = parseInt(e.detail.value, 10)
    const medicine = this.data.medicines[index]
    if (!medicine) return

    const currentRoute = this.data.selectedRoute
    let route = currentRoute
    let form = this.getFirstSupportedForm(medicine, route)

    if (!form) {
      for (const r of routeDefs) {
        form = this.getFirstSupportedForm(medicine, r.id)
        if (form) {
          route = r.id
          break
        }
      }
    }

    this.setData({
      selectedMedicineId: medicine.id,
      selectedMedicine: medicine,
      selectedRoute: route,
      selectedForm: form,
      formRows: buildFormRows(medicine, route, form),
      specValue: '',
      weightValue: '',
      result: null
    })
  },

  selectRoute(e) {
    const route = e.currentTarget.dataset.id
    const medicine = this.getSelectedMedicine()
    const form = this.getFirstSupportedForm(medicine, route)
    if (!form) return

    this.setData({
      selectedRoute: route,
      selectedForm: form,
      formRows: buildFormRows(medicine, route, form),
      specValue: '',
      weightValue: '',
      result: null
    })
  },

  selectForm(e) {
    const form = e.currentTarget.dataset.id
    const medicine = this.getSelectedMedicine()
    const route = this.data.selectedRoute
    const supported = medicine.supportedForms[route] && medicine.supportedForms[route].includes(form)
    if (!supported) return

    this.setData({
      selectedForm: form,
      formRows: buildFormRows(medicine, route, form),
      specValue: '',
      weightValue: '',
      result: null
    })
  },

  onSpecInput(e) {
    this.setData({ specValue: e.detail.value || '' })
  },

  onWeightInput(e) {
    this.setData({ weightValue: e.detail.value || '' })
  },

  calculate() {
    const medicine = this.getSelectedMedicine()
    if (!medicine) {
      wx.showToast({ title: '请选择药物', icon: 'none' })
      return
    }

    const { selectedRoute, selectedForm, specValue, weightValue } = this.data
    const doseInfo = medicine.doseByRoute[selectedRoute]
    if (!doseInfo) {
      wx.showToast({ title: '该药物不支持此用药方式', icon: 'none' })
      return
    }

    const spec = parseFloat(specValue)
    if (!spec || spec <= 0) {
      wx.showToast({ title: '请输入有效的药品规格', icon: 'none' })
      return
    }

    const weightG = parseFloat(weightValue)
    if (!weightG || weightG <= 0) {
      wx.showToast({ title: '请输入有效的龟龟体重', icon: 'none' })
      return
    }

    const weightKg = weightG / 1000
    const effectiveDose = weightKg * doseInfo.value

    let resultAmount = 0
    let resultUnit = ''
    let formula = ''
    const formInfo = formDefs[selectedForm]

    switch (selectedForm) {
      case 'tablet':
        resultAmount = effectiveDose / spec
        resultUnit = '片'
        formula = `${effectiveDose.toFixed(2)} ${doseInfo.unit} ÷ ${spec} ${formInfo.unit}`
        break
      case 'powder':
        resultAmount = effectiveDose / (spec / 100)
        resultUnit = doseInfo.unit
        formula = `${effectiveDose.toFixed(2)} ${doseInfo.unit} ÷ ${spec}%`
        break
      case 'dry':
        resultAmount = effectiveDose / spec
        resultUnit = '瓶'
        formula = `${effectiveDose.toFixed(2)} ${doseInfo.unit} ÷ ${spec} ${formInfo.unit}`
        break
      case 'injection':
        resultAmount = effectiveDose / spec
        resultUnit = 'ml'
        formula = `${effectiveDose.toFixed(2)} ${doseInfo.unit} ÷ ${spec} ${formInfo.unit}`
        break
    }

    this.setData({
      result: {
        medicineName: medicine.name,
        routeName: routeDefs.find(r => r.id === selectedRoute).name,
        formName: formInfo.name,
        weightG,
        weightKg,
        weightKgText: weightKg.toFixed(3),
        dose: doseInfo.value,
        doseUnit: doseInfo.unit,
        effectiveDose,
        effectiveDoseText: effectiveDose.toFixed(2),
        spec,
        specUnit: formInfo.unit,
        amount: resultAmount,
        amountText: resultAmount < 0.01 ? resultAmount.toFixed(4) : resultAmount.toFixed(2),
        unit: resultUnit,
        formula
      }
    })
  }
})
