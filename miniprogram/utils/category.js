/**
 * 合并多来源分类列表，保证「无」在首位且不重复
 */
function mergeCategories(...sources) {
  const seen = new Set()
  const result = []

  const add = (name) => {
    const n = String(name || '').trim()
    if (!n || seen.has(n)) return
    seen.add(n)
    result.push(n)
  }

  add('无')
  sources.forEach((source) => {
    if (!Array.isArray(source)) return
    source.forEach((item) => {
      if (item !== '无') add(item)
    })
  })

  return result.length > 0 ? result : ['无']
}

/**
 * 将本地有、云端没有的分类补同步到数据库
 */
async function syncMissingCategoriesToCloud(categories, API) {
  if (!API || !Array.isArray(categories) || categories.length === 0) return categories

  let cloudCategories = []
  try {
    const result = await API.getCategories()
    if (result && result.success && result.data && result.data.categories) {
      cloudCategories = result.data.categories
    }
  } catch (e) {
    return categories
  }

  const cloudSet = new Set(cloudCategories)
  let merged = mergeCategories(cloudCategories, categories)

  for (const name of categories) {
    if (name === '无' || cloudSet.has(name)) continue
    try {
      const addRes = await API.addCategory(name)
      if (addRes && addRes.success && addRes.data && addRes.data.categories) {
        merged = mergeCategories(addRes.data.categories, merged)
        addRes.data.categories.forEach(c => cloudSet.add(c))
      }
    } catch (e) {
      console.warn('[分类] 补同步失败:', name, e)
    }
  }

  return merged
}

module.exports = {
  mergeCategories,
  syncMissingCategoriesToCloud
}
