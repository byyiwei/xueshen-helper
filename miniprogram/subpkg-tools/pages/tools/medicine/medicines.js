const medicines = [
  {
    id: 'amoxicillin',
    name: '阿莫西林',
    category: '抗生素',
    categoryId: 'antibiotic',
    indications: '细菌感染、腐皮、烂甲、肺炎初期',
    dosage: '50-100 mg / kg 体重，或 10-20 mg / L 水体',
    form: '粉剂',
    notes: '疗程 5-7 天，用药期间水温保持 28-30℃，药浴后适当补电解多维。',
    waterDose: { value: 15, unit: 'mg/L' },
    weightDose: { value: 75, unit: 'mg/kg' },
    calcModes: ['weight', 'water'],
    defaultMode: 'water',
    doseByRoute: {
      oral: { value: 75, unit: 'mg/kg' },
      bath: { value: 15, unit: 'mg/L' },
      inject: null
    },
    supportedForms: {
      oral: ['tablet', 'powder'],
      bath: ['tablet', 'powder'],
      inject: []
    }
  },
  {
    id: 'enrofloxacin',
    name: '恩诺沙星',
    category: '抗生素',
    categoryId: 'antibiotic',
    indications: '顽固性肠胃炎、呼吸道感染、败血症',
    dosage: '5-10 mg / kg 体重，或 2-5 mg / L 水体',
    form: '粉剂/口服液',
    notes: '避免与含钙、镁药物同用，疗程一般 3-5 天。',
    waterDose: { value: 3.5, unit: 'mg/L' },
    weightDose: { value: 7.5, unit: 'mg/kg' },
    calcModes: ['weight', 'water'],
    defaultMode: 'water',
    doseByRoute: {
      oral: { value: 7.5, unit: 'mg/kg' },
      bath: { value: 3.5, unit: 'mg/L' },
      inject: { value: 5, unit: 'mg/kg' }
    },
    supportedForms: {
      oral: ['tablet', 'powder', 'injection'],
      bath: ['powder'],
      inject: ['injection']
    }
  },
  {
    id: 'metronidazole',
    name: '甲硝唑',
    category: '抗生素',
    categoryId: 'antibiotic',
    indications: '厌氧菌感染、肠胃炎、口腔炎、鞭毛虫',
    dosage: '25-50 mg / kg 体重，或 5-10 mg / L 水体',
    form: '片剂/粉剂',
    notes: '对厌氧菌效果好，用药期间停食或少量喂食。',
    waterDose: { value: 7.5, unit: 'mg/L' },
    weightDose: { value: 37.5, unit: 'mg/kg' },
    calcModes: ['weight', 'water'],
    defaultMode: 'water',
    doseByRoute: {
      oral: { value: 37.5, unit: 'mg/kg' },
      bath: { value: 7.5, unit: 'mg/L' },
      inject: null
    },
    supportedForms: {
      oral: ['tablet', 'powder'],
      bath: ['tablet', 'powder'],
      inject: []
    }
  },
  {
    id: 'povidone_iodine',
    name: '聚维酮碘',
    category: '消毒杀菌',
    categoryId: 'disinfectant',
    indications: '外伤消毒、腐皮、烂甲、龟壳表面杀菌',
    dosage: '1-2 ml / L 水体稀释后浸泡，或原液稀释涂擦',
    form: '溶液',
    notes: '药浴浓度不宜过高，每次 15-30 分钟，每日 1-2 次。',
    waterDose: { value: 1.5, unit: 'ml/L' },
    weightDose: null,
    calcModes: ['water'],
    defaultMode: 'water',
    doseByRoute: {
      oral: null,
      bath: { value: 1.5, unit: 'ml/L' },
      inject: null
    },
    supportedForms: {
      oral: [],
      bath: ['injection'],
      inject: []
    }
  },
  {
    id: 'potassium_permanganate',
    name: '高锰酸钾',
    category: '消毒杀菌',
    categoryId: 'disinfectant',
    indications: '体表消毒、龟缸环境杀菌、腐皮辅助治疗',
    dosage: '5-10 mg / L 水体（淡粉色）',
    form: '晶体',
    notes: '浓度不可过高，浸泡 10-15 分钟后清水冲洗，避免接触眼睛。',
    waterDose: { value: 7.5, unit: 'mg/L' },
    weightDose: null,
    calcModes: ['water'],
    defaultMode: 'water',
    doseByRoute: {
      oral: null,
      bath: { value: 7.5, unit: 'mg/L' },
      inject: null
    },
    supportedForms: {
      oral: [],
      bath: ['powder'],
      inject: []
    }
  },
  {
    id: 'albendazole',
    name: '阿苯达唑',
    category: '驱虫药',
    categoryId: 'antiparasite',
    indications: '体内线虫、绦虫等寄生虫感染',
    dosage: '25-50 mg / kg 体重',
    form: '片剂',
    notes: '口服给药，每 2 周一次，连用 2-3 次，用药后观察排便。',
    waterDose: null,
    weightDose: { value: 37.5, unit: 'mg/kg' },
    calcModes: ['weight'],
    defaultMode: 'weight',
    doseByRoute: {
      oral: { value: 37.5, unit: 'mg/kg' },
      bath: null,
      inject: null
    },
    supportedForms: {
      oral: ['tablet', 'powder'],
      bath: [],
      inject: []
    }
  },
  {
    id: 'fenbendazole',
    name: '芬苯达唑',
    category: '驱虫药',
    categoryId: 'antiparasite',
    indications: '体内线虫、吸虫等寄生虫',
    dosage: '50-100 mg / kg 体重',
    form: '粉剂',
    notes: '口服或混入饲料，用药期间停食 24 小时后再喂药。',
    waterDose: null,
    weightDose: { value: 75, unit: 'mg/kg' },
    calcModes: ['weight'],
    defaultMode: 'weight',
    doseByRoute: {
      oral: { value: 75, unit: 'mg/kg' },
      bath: null,
      inject: null
    },
    supportedForms: {
      oral: ['powder'],
      bath: [],
      inject: []
    }
  },
  {
    id: 'multivitamin',
    name: '电解多维',
    category: '维生素',
    categoryId: 'vitamin',
    indications: '应激、病后恢复、食欲低下、补充营养',
    dosage: '0.5-1 g / L 水体，或按饲料 0.1%-0.2% 添加',
    form: '粉剂',
    notes: '可作为日常保健，新龟到家、换环境、病后恢复期使用。',
    waterDose: { value: 0.75, unit: 'g/L' },
    weightDose: null,
    calcModes: ['water'],
    defaultMode: 'water',
    doseByRoute: {
      oral: null,
      bath: { value: 0.75, unit: 'g/L' },
      inject: null
    },
    supportedForms: {
      oral: [],
      bath: ['powder'],
      inject: []
    }
  },
  {
    id: 'calcium_d3',
    name: '钙粉 + D3',
    category: '维生素',
    categoryId: 'vitamin',
    indications: '软甲、骨骼发育不良、产卵前后补钙',
    dosage: '按饲料 1%-2% 添加',
    form: '粉剂',
    notes: '配合 UVB 晒背效果更佳，产卵期母龟可适当加量。',
    waterDose: null,
    weightDose: { value: 15, unit: 'g/kg饲料' },
    calcModes: ['weight'],
    defaultMode: 'weight',
    doseByRoute: {
      oral: { value: 15, unit: 'g/kg' },
      bath: null,
      inject: null
    },
    supportedForms: {
      oral: ['powder'],
      bath: [],
      inject: []
    }
  },
  {
    id: 'nystatin',
    name: '制霉菌素',
    category: '真菌处理',
    categoryId: 'fungus',
    indications: '水霉病、真菌感染、白色棉絮状病灶',
    dosage: '5-10 万单位 / kg 体重，或 2-4 万单位 / L 水体',
    form: '片剂',
    notes: '真菌感染需保持水质清洁，治疗期间适当提高水温。',
    waterDose: { value: 3, unit: '万单位/L' },
    weightDose: { value: 7.5, unit: '万单位/kg' },
    calcModes: ['weight', 'water'],
    defaultMode: 'water',
    doseByRoute: {
      oral: { value: 7.5, unit: '万单位/kg' },
      bath: { value: 3, unit: '万单位/L' },
      inject: null
    },
    supportedForms: {
      oral: ['tablet', 'powder'],
      bath: ['tablet', 'powder'],
      inject: []
    }
  },
  {
    id: 'methylene_blue',
    name: '亚甲基蓝',
    category: '真菌处理',
    categoryId: 'fungus',
    indications: '水霉、白点、体表寄生虫辅助治疗',
    dosage: '1-2 mg / L 水体',
    form: '溶液',
    notes: '药浴 20-30 分钟，水体呈淡蓝色即可，避免阳光直射。',
    waterDose: { value: 1.5, unit: 'mg/L' },
    weightDose: null,
    calcModes: ['water'],
    defaultMode: 'water',
    doseByRoute: {
      oral: null,
      bath: { value: 1.5, unit: 'mg/L' },
      inject: null
    },
    supportedForms: {
      oral: [],
      bath: ['injection'],
      inject: []
    }
  },
  {
    id: 'dextrose',
    name: '葡萄糖',
    category: '其他',
    categoryId: 'other',
    indications: '体弱、拒食、病后补能、应激缓解',
    dosage: '5-10 g / L 水体浸泡，或口服 1-2 ml 5% 溶液',
    form: '粉剂',
    notes: '可与其他药物配合使用，帮助病龟恢复体力。',
    waterDose: { value: 7.5, unit: 'g/L' },
    weightDose: null,
    calcModes: ['water'],
    defaultMode: 'water',
    doseByRoute: {
      oral: null,
      bath: { value: 7.5, unit: 'g/L' },
      inject: null
    },
    supportedForms: {
      oral: [],
      bath: ['powder'],
      inject: []
    }
  }
]

module.exports = { medicines }
