export interface IntentContextData {
  provinceId: number
  provinceName: string
  label: string
  timestamp: number
}

export interface RecentIntentProvinceItem {
  provinceId: number
  provinceName: string
  label: string
  score: number
  updatedAt: number
}

export interface VisitedPlaceSignal {
  id: number | string
  name: string
  provinceId?: number | null
  province?: string | null
  categoryId?: number | null
  category?: string | null
  rating?: number | null
  coverUrl?: string | null
  latitude?: number | null
  longitude?: number | null
  visitedAt?: string
}

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
const CACHE_KEY = 'langthang_home_feed_cache_v2'
const STALE_TIME_MS = 4 * 60 * 1000

export const getOrCreateDeviceId = (): string => {
  try {
    const existing = localStorage.getItem('langthang_device_id')
    if (existing && UUID_REGEX.test(existing.trim())) {
      return existing.trim()
    }
  } catch {
  }

  let newId: string
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    newId = crypto.randomUUID()
  } else {
    newId = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
      const r = (Math.random() * 16) | 0
      const v = c === 'x' ? r : (r & 0x3) | 0x8
      return v.toString(16)
    })
  }

  try {
    localStorage.setItem('langthang_device_id', newId)
  } catch {
  }
  return newId
}

export const snapGpsToGrid = (lat: number, lng: number) => {
  const roundedLat = Number(lat.toFixed(2))
  const roundedLng = Number(lng.toFixed(2))
  const gridKey = `lat_${lat.toFixed(2)}_lng_${lng.toFixed(2)}`
  return { gridKey, roundedLat, roundedLng }
}

export const getRecentVisitedPlaces = (): VisitedPlaceSignal[] => {
  try {
    const stored = localStorage.getItem('langthang_recent_visited')
    if (!stored) return []
    const parsed = JSON.parse(stored)
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

export const getRecentIntentProvinces = (): RecentIntentProvinceItem[] => {
  try {
    const stored = localStorage.getItem('langthang_intent_provinces_v2')
    if (stored) {
      const parsed: RecentIntentProvinceItem[] = JSON.parse(stored)
      if (Array.isArray(parsed) && parsed.length > 0) {
        const now = Date.now()
        const valid = parsed
          .filter((p) => p.provinceId > 0 && now - p.updatedAt < 48 * 60 * 60 * 1000)
          .sort((a, b) => b.updatedAt - a.updatedAt || b.score - a.score)
          .slice(0, 3)
        return valid
      }
    }
  } catch {
  }

  const legacy = getIntentContext()
  if (legacy && legacy.provinceId > 0) {
    return [
      {
        provinceId: legacy.provinceId,
        provinceName: legacy.provinceName,
        label: legacy.label,
        score: 3,
        updatedAt: legacy.timestamp
      }
    ]
  }

  return []
}

export const getTopCategoryIds = (): number[] => {
  try {
    const stored = localStorage.getItem('langthang_category_scores_v2')
    if (stored) {
      const parsed: Record<number, { score: number; updatedAt: number }> = JSON.parse(stored)
      const now = Date.now()
      const entries = Object.entries(parsed)
        .map(([catId, val]) => ({
          catId: Number(catId),
          score: val.score,
          updatedAt: val.updatedAt
        }))
        .filter((c) => c.catId > 0 && now - c.updatedAt < 48 * 60 * 60 * 1000)
        .sort((a, b) => b.updatedAt - a.updatedAt || b.score - a.score)

      if (entries.length > 0) {
        return entries.slice(0, 3).map((e) => e.catId)
      }
    }
  } catch {
  }

  const recent = getRecentVisitedPlaces()
  const counts: Record<number, number> = {}
  recent.forEach((item) => {
    if (item.categoryId && item.categoryId > 0) {
      counts[item.categoryId] = (counts[item.categoryId] || 0) + 1
    }
  })

  return Object.entries(counts)
    .sort((a, b) => b[1] - a[1])
    .map(([catId]) => Number(catId))
    .slice(0, 3)
}

export const recordVisitedPlace = (place: VisitedPlaceSignal) => {
  try {
    const existing = getRecentVisitedPlaces()
    const filtered = existing.filter((item) => String(item.id) !== String(place.id))
    const updated = [place, ...filtered].slice(0, 10)

    localStorage.setItem('langthang_recent_visited', JSON.stringify(updated))

    if (place.provinceId && place.provinceId > 0) {
      const pId = place.provinceId
      const pName = place.province || ''
      const pLabel = place.province || 'Điểm đến quan tâm'

      let provinces: RecentIntentProvinceItem[] = []
      try {
        const raw = localStorage.getItem('langthang_intent_provinces_v2')
        if (raw) provinces = JSON.parse(raw)
      } catch {
      }

      const existingIdx = provinces.findIndex((p) => p.provinceId === pId)
      if (existingIdx >= 0) {
        provinces[existingIdx].score += 2
        provinces[existingIdx].updatedAt = Date.now()
        if (pName) {
          provinces[existingIdx].provinceName = pName
          provinces[existingIdx].label = pLabel
        }
      } else {
        provinces.unshift({
          provinceId: pId,
          provinceName: pName,
          label: pLabel,
          score: 2,
          updatedAt: Date.now()
        })
      }

      provinces.sort((a, b) => b.updatedAt - a.updatedAt || b.score - a.score)
      localStorage.setItem('langthang_intent_provinces_v2', JSON.stringify(provinces.slice(0, 10)))

      const activeTop = provinces[0]
      if (activeTop) {
        const legacyIntent: IntentContextData = {
          provinceId: activeTop.provinceId,
          provinceName: activeTop.provinceName,
          label: activeTop.label,
          timestamp: Date.now()
        }
        localStorage.setItem('langthang_intent_context', JSON.stringify(legacyIntent))
      }
    }

    if (place.categoryId && place.categoryId > 0) {
      const cId = place.categoryId
      let catScores: Record<number, { score: number; updatedAt: number }> = {}
      try {
        const raw = localStorage.getItem('langthang_category_scores_v2')
        if (raw) catScores = JSON.parse(raw)
      } catch {
      }

      if (!catScores[cId]) {
        catScores[cId] = { score: 2, updatedAt: Date.now() }
      } else {
        catScores[cId].score += 2
        catScores[cId].updatedAt = Date.now()
      }
      localStorage.setItem('langthang_category_scores_v2', JSON.stringify(catScores))
    }

    sessionStorage.removeItem(CACHE_KEY)
    window.dispatchEvent(new Event('storage'))
  } catch {
  }
}

export interface RecordSearchIntentOptions {
  keyword?: string
  provinceId?: number
  provinceName?: string
  categoryId?: number
}

export const recordSearchIntent = (
  keywordOrOpts?: string | RecordSearchIntentOptions,
  selectedProvinceId?: number,
  selectedProvinceName?: string,
  selectedCategoryId?: number
): IntentContextData | null => {
  try {
    let keyword: string | undefined
    let provinceId: number | undefined
    let provinceName: string | undefined
    let categoryId: number | undefined

    if (typeof keywordOrOpts === 'object' && keywordOrOpts !== null) {
      keyword = keywordOrOpts.keyword
      provinceId = keywordOrOpts.provinceId
      provinceName = keywordOrOpts.provinceName
      categoryId = keywordOrOpts.categoryId
    } else {
      keyword = typeof keywordOrOpts === 'string' ? keywordOrOpts : undefined
      provinceId = selectedProvinceId
      provinceName = selectedProvinceName
      categoryId = selectedCategoryId
    }

    let matchedProvince: { provinceId: number; provinceName: string; label: string } | null = null

    if (provinceId && provinceId > 0) {
      const resolvedName = provinceName || getProvinceNameById(provinceId) || `Tỉnh ${provinceId}`
      matchedProvince = {
        provinceId,
        provinceName: resolvedName,
        label: resolvedName
      }
    } else if (keyword && keyword.trim()) {
      matchedProvince = getMatchedProvinceFromKeyword(keyword.trim().toLowerCase())
    }

    if (matchedProvince) {
      let provinces: RecentIntentProvinceItem[] = []
      try {
        const raw = localStorage.getItem('langthang_intent_provinces_v2')
        if (raw) provinces = JSON.parse(raw)
      } catch {
      }

      const existingIdx = provinces.findIndex((p) => p.provinceId === matchedProvince!.provinceId)
      if (existingIdx >= 0) {
        provinces[existingIdx].score += 3
        provinces[existingIdx].updatedAt = Date.now()
        provinces[existingIdx].provinceName = matchedProvince.provinceName
        provinces[existingIdx].label = matchedProvince.label
      } else {
        provinces.unshift({
          provinceId: matchedProvince.provinceId,
          provinceName: matchedProvince.provinceName,
          label: matchedProvince.label,
          score: 3,
          updatedAt: Date.now()
        })
      }

      provinces.sort((a, b) => b.updatedAt - a.updatedAt || b.score - a.score)
      localStorage.setItem('langthang_intent_provinces_v2', JSON.stringify(provinces.slice(0, 10)))

      const legacyIntent: IntentContextData = {
        provinceId: matchedProvince.provinceId,
        provinceName: matchedProvince.provinceName,
        label: matchedProvince.label,
        timestamp: Date.now()
      }
      localStorage.setItem('langthang_intent_context', JSON.stringify(legacyIntent))
    }

    let matchedCatId = categoryId
    if (!matchedCatId && keyword && keyword.trim()) {
      matchedCatId = getMatchedCategoryFromKeyword(keyword.trim().toLowerCase()) || undefined
    }

    if (matchedCatId && matchedCatId > 0) {
      let catScores: Record<number, { score: number; updatedAt: number }> = {}
      try {
        const raw = localStorage.getItem('langthang_category_scores_v2')
        if (raw) catScores = JSON.parse(raw)
      } catch {
      }

      if (!catScores[matchedCatId]) {
        catScores[matchedCatId] = { score: 3, updatedAt: Date.now() }
      } else {
        catScores[matchedCatId].score += 3
        catScores[matchedCatId].updatedAt = Date.now()
      }
      localStorage.setItem('langthang_category_scores_v2', JSON.stringify(catScores))
    }

    sessionStorage.removeItem(CACHE_KEY)
    window.dispatchEvent(new Event('storage'))

    if (matchedProvince) {
      return {
        provinceId: matchedProvince.provinceId,
        provinceName: matchedProvince.provinceName,
        label: matchedProvince.label,
        timestamp: Date.now()
      }
    }
  } catch {
  }
  return null
}

const PROVINCE_CATALOG: Array<{ id: number; name: string; keywords: string[] }> = [
  { id: 1, name: 'TP Hà Nội', keywords: ['hà nội', 'ha noi', 'thủ đô'] },
  { id: 2, name: 'TP Hải Phòng', keywords: ['hải phòng', 'hai phong', 'cát bà', 'đồ sơn'] },
  { id: 3, name: 'Tỉnh Lai Châu', keywords: ['lai châu', 'lai chau'] },
  { id: 4, name: 'Tỉnh Điện Biên', keywords: ['điện biên', 'dien bien'] },
  { id: 5, name: 'Tỉnh Sơn La', keywords: ['sơn la', 'son la', 'mộc châu', 'moc chau', 'tà xùa'] },
  { id: 6, name: 'Tỉnh Lạng Sơn', keywords: ['lạng sơn', 'lang son', 'mẫu sơn'] },
  { id: 7, name: 'Tỉnh Quảng Ninh', keywords: ['quảng ninh', 'quang ninh', 'hạ long', 'ha long', 'yên tử', 'cô tô'] },
  { id: 8, name: 'Tỉnh Cao Bằng', keywords: ['cao bằng', 'cao bang', 'bản giốc'] },
  { id: 9, name: 'Tỉnh Tuyên Quang', keywords: ['tuyên quang', 'tuyen quang', 'na hang', 'hà giang', 'ha giang', 'đồng văn'] },
  { id: 10, name: 'Tỉnh Lào Cai', keywords: ['lào cai', 'lao cai', 'sa pa', 'sapa', 'fansipan', 'bắc hà'] },
  { id: 11, name: 'Tỉnh Thái Nguyên', keywords: ['thái nguyên', 'thai nguyen', 'hồ núi cốc'] },
  { id: 12, name: 'Tỉnh Phú Thọ', keywords: ['phú thọ', 'phu tho', 'đền hùng', 'việt trì'] },
  { id: 13, name: 'Tỉnh Bắc Ninh', keywords: ['bắc ninh', 'bac ninh', 'kinh bắc'] },
  { id: 14, name: 'Tỉnh Hưng Yên', keywords: ['hưng yên', 'hung yen', 'phố hiến', 'ecopark'] },
  { id: 15, name: 'Tỉnh Ninh Bình', keywords: ['ninh bình', 'ninh binh', 'tràng an', 'trang an', 'tam cốc', 'bái đính'] },
  { id: 16, name: 'TP Huế', keywords: ['huế', 'hue', 'thừa thiên', 'cố đô'] },
  { id: 17, name: 'TP Đà Nẵng', keywords: ['đà nẵng', 'da nang', 'bà nà', 'sơn trà', 'hội an', 'hoi an'] },
  { id: 18, name: 'Tỉnh Thanh Hóa', keywords: ['thanh hóa', 'thanh hoa', 'sầm sơn', 'pù luông'] },
  { id: 19, name: 'Tỉnh Nghệ An', keywords: ['nghệ an', 'nghe an', 'cửa lò', 'vinh'] },
  { id: 20, name: 'Tỉnh Hà Tĩnh', keywords: ['hà tĩnh', 'ha tinh', 'thiên cầm'] },
  { id: 21, name: 'Tỉnh Quảng Trị', keywords: ['quảng trị', 'quang tri', 'quảng bình', 'phong nha'] },
  { id: 22, name: 'Tỉnh Quảng Ngãi', keywords: ['quảng ngãi', 'quang ngai', 'lý sơn', 'ly son'] },
  { id: 23, name: 'Tỉnh Gia Lai', keywords: ['gia lai', 'pleiku', 'quy nhơn', 'bình định'] },
  { id: 24, name: 'Tỉnh Khánh Hòa', keywords: ['khánh hòa', 'khanh hoa', 'nha trang', 'cam ranh', 'ninh thuận'] },
  { id: 25, name: 'Tỉnh Lâm Đồng', keywords: ['lâm đồng', 'lam dong', 'đà lạt', 'da lat', 'bảo lộc', 'phan thiết', 'mũi né'] },
  { id: 26, name: 'Tỉnh Đắk Lắk', keywords: ['đắk lắk', 'dak lak', 'buôn ma thuột', 'phú yên', 'tuy hòa'] },
  { id: 27, name: 'TP Hồ Chí Minh', keywords: ['hồ chí minh', 'sài gòn', 'sai gon', 'tphcm', 'vũng tàu', 'côn đảo'] },
  { id: 28, name: 'TP Cần Thơ', keywords: ['cần thơ', 'can tho', 'ninh kiều', 'cái răng'] },
  { id: 29, name: 'Tỉnh Đồng Nai', keywords: ['đồng nai', 'dong nai', 'biên hòa', 'trị an'] },
  { id: 30, name: 'Tỉnh Tây Ninh', keywords: ['tây ninh', 'tay ninh', 'núi bà đen'] },
  { id: 31, name: 'Tỉnh Vĩnh Long', keywords: ['vĩnh long', 'vinh long', 'bến tre', 'trà vinh'] },
  { id: 32, name: 'Tỉnh Đồng Tháp', keywords: ['đồng tháp', 'dong thap', 'sa đéc', 'tiền giang', 'mỹ tho'] },
  { id: 33, name: 'Tỉnh Cà Mau', keywords: ['cà mau', 'ca mau', 'đất mũi', 'bạc liêu'] },
  { id: 34, name: 'Tỉnh An Giang', keywords: ['an giang', 'châu đốc', 'phú quốc', 'kiên giang', 'hà tiên'] }
]

const getProvinceNameById = (id: number): string | null => {
  const found = PROVINCE_CATALOG.find((p) => p.id === id)
  return found ? found.name : null
}

const getMatchedProvinceFromKeyword = (
  q: string
): { provinceId: number; provinceName: string; label: string } | null => {
  for (const prov of PROVINCE_CATALOG) {
    if (prov.keywords.some((kw) => q.includes(kw))) {
      return { provinceId: prov.id, provinceName: prov.name, label: prov.name }
    }
  }
  return null
}

const getMatchedCategoryFromKeyword = (q: string): number | null => {
  if (q.includes('cà phê') || q.includes('cafe') || q.includes('coffee') || q.includes('trà') || q.includes('tráng miệng')) {
    return 2
  }
  if (q.includes('nhà hàng') || q.includes('quán ăn') || q.includes('ăn uống') || q.includes('ẩm thực') || q.includes('phở') || q.includes('bún')) {
    return 1
  }
  if (q.includes('bar') || q.includes('pub') || q.includes('club') || q.includes('lounge') || q.includes('acoustic')) {
    return 3
  }
  if (q.includes('khách sạn') || q.includes('hotel') || q.includes('resort')) {
    return 4
  }
  if (q.includes('homestay') || q.includes('farmstay')) {
    return 5
  }
  if (q.includes('danh lam') || q.includes('thắng cảnh') || q.includes('biển') || q.includes('núi') || q.includes('thác') || q.includes('săn mây') || q.includes('đồi')) {
    return 7
  }
  if (q.includes('chùa') || q.includes('đền') || q.includes('nhà thờ') || q.includes('di tích') || q.includes('lịch sử') || q.includes('tâm linh') || q.includes('bảo tàng')) {
    return 8
  }
  if (q.includes('vui chơi') || q.includes('công viên') || q.includes('giải trí') || q.includes('vinwonders')) {
    return 10
  }
  if (q.includes('chợ') || q.includes('chợ đêm') || q.includes('phố đi bộ')) {
    return 11
  }
  return null
}

export const getIntentContext = (): IntentContextData | null => {
  try {
    const raw = localStorage.getItem('langthang_intent_context')
    if (!raw) return null
    const parsed: IntentContextData = JSON.parse(raw)
    if (Date.now() - parsed.timestamp > 48 * 60 * 60 * 1000) {
      localStorage.removeItem('langthang_intent_context')
      return null
    }
    return parsed
  } catch {
    return null
  }
}

export const clearIntentContext = () => {
  try {
    localStorage.removeItem('langthang_intent_context')
    localStorage.removeItem('langthang_intent_provinces_v2')
    localStorage.removeItem('langthang_category_scores_v2')
    sessionStorage.removeItem(CACHE_KEY)
  } catch {
  }
}

export const buildCacheSignature = (
  gridKey: string,
  intentProvinceIds?: number[] | number | null,
  topCategoryIds?: number[],
  userId?: number | string | null
): string => {
  let provStr = '0'
  if (Array.isArray(intentProvinceIds)) {
    provStr = intentProvinceIds.length > 0 ? intentProvinceIds.join(',') : '0'
  } else if (intentProvinceIds) {
    provStr = String(intentProvinceIds)
  }
  const cats = (topCategoryIds || []).join(',')
  const userKey = userId ? `u_${userId}` : 'anon'
  return `${userKey}|${gridKey}|${provStr}|${cats}`
}

export const getHomeFeedCache = <T = any>(signature: string): T | null => {
  try {
    const raw = sessionStorage.getItem(CACHE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw)
    if (parsed.signature === signature && Date.now() - parsed.timestamp < STALE_TIME_MS) {
      return parsed.data as T
    }
  } catch {
  }
  return null
}

export const setHomeFeedCache = (signature: string, data: any) => {
  try {
    const payload = {
      signature,
      timestamp: Date.now(),
      data
    }
    sessionStorage.setItem(CACHE_KEY, JSON.stringify(payload))
  } catch {
  }
}
