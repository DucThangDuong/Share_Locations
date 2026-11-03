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

// Multi-Destination Intent Queue (tối đa 3 tỉnh, kích hoạt khi score >= 2 hoặc trực tiếp search)
export const getRecentIntentProvinces = (): RecentIntentProvinceItem[] => {
  try {
    const stored = localStorage.getItem('langthang_intent_provinces_v2')
    if (stored) {
      const parsed: RecentIntentProvinceItem[] = JSON.parse(stored)
      if (Array.isArray(parsed) && parsed.length > 0) {
        // Lọc các tỉnh còn hạn 48h và có score >= 2 (hoặc score >= 1 nếu đã lưu)
        const now = Date.now()
        const valid = parsed
          .filter((p) => p.provinceId > 0 && now - p.updatedAt < 48 * 60 * 60 * 1000)
          .sort((a, b) => b.score - a.score || b.updatedAt - a.updatedAt)
          .slice(0, 3)
        return valid
      }
    }
  } catch {
  }

  // Fallback về legacy single intent nếu có
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

// Bảng điểm danh mục (Category Affinity)
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
        .sort((a, b) => b.score - a.score || b.updatedAt - a.updatedAt)

      if (entries.length > 0) {
        return entries.slice(0, 3).map((e) => e.catId)
      }
    }
  } catch {
  }

  // Fallback từ các địa điểm vừa xem gần đây
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

// Ghi nhận xem chi tiết địa điểm (+1 điểm Tỉnh, +1 điểm Danh mục)
export const recordVisitedPlace = (place: VisitedPlaceSignal) => {
  try {
    const existing = getRecentVisitedPlaces()
    const filtered = existing.filter((item) => String(item.id) !== String(place.id))
    const updated = [place, ...filtered].slice(0, 10)

    localStorage.setItem('langthang_recent_visited', JSON.stringify(updated))

    // 1. Cập nhật điểm Tỉnh (+1 điểm)
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
        provinces[existingIdx].score += 1
        provinces[existingIdx].updatedAt = Date.now()
        if (pName) provinces[existingIdx].provinceName = pName
      } else {
        provinces.push({
          provinceId: pId,
          provinceName: pName,
          label: pLabel,
          score: 1,
          updatedAt: Date.now()
        })
      }

      provinces.sort((a, b) => b.score - a.score || b.updatedAt - a.updatedAt)
      localStorage.setItem('langthang_intent_provinces_v2', JSON.stringify(provinces.slice(0, 10)))

      // Kích hoạt vào legacy intent nếu điểm >= 2
      const activeTop = provinces.find((p) => p.score >= 2) || provinces[0]
      if (activeTop && activeTop.score >= 2) {
        const legacyIntent: IntentContextData = {
          provinceId: activeTop.provinceId,
          provinceName: activeTop.provinceName,
          label: activeTop.label,
          timestamp: Date.now()
        }
        localStorage.setItem('langthang_intent_context', JSON.stringify(legacyIntent))
      }
    }

    // 2. Cập nhật điểm Danh mục (+1 điểm)
    if (place.categoryId && place.categoryId > 0) {
      const cId = place.categoryId
      let catScores: Record<number, { score: number; updatedAt: number }> = {}
      try {
        const raw = localStorage.getItem('langthang_category_scores_v2')
        if (raw) catScores = JSON.parse(raw)
      } catch {
      }

      if (!catScores[cId]) {
        catScores[cId] = { score: 1, updatedAt: Date.now() }
      } else {
        catScores[cId].score += 1
        catScores[cId].updatedAt = Date.now()
      }
      localStorage.setItem('langthang_category_scores_v2', JSON.stringify(catScores))
    }

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

// Ghi nhận tìm kiếm / chọn bộ lọc (+3 điểm Tỉnh, +3 điểm Danh mục)
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
      keyword = keywordOrOpts
      provinceId = selectedProvinceId
      provinceName = selectedProvinceName
      categoryId = selectedCategoryId
    }

    let matchedProvince: { provinceId: number; provinceName: string; label: string } | null = null

    if (provinceId && provinceId > 0) {
      matchedProvince = {
        provinceId,
        provinceName: provinceName || '',
        label: provinceName || 'Điểm đến tìm kiếm'
      }
    } else if (keyword && keyword.trim()) {
      matchedProvince = getMatchedProvinceFromKeyword(keyword.trim().toLowerCase())
    }

    // 1. Nếu có tỉnh thành: cộng +3 điểm (kích hoạt ngay vào hàng đợi)
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

      provinces.sort((a, b) => b.score - a.score || b.updatedAt - a.updatedAt)
      localStorage.setItem('langthang_intent_provinces_v2', JSON.stringify(provinces.slice(0, 10)))

      const legacyIntent: IntentContextData = {
        provinceId: matchedProvince.provinceId,
        provinceName: matchedProvince.provinceName,
        label: matchedProvince.label,
        timestamp: Date.now()
      }
      localStorage.setItem('langthang_intent_context', JSON.stringify(legacyIntent))
    }

    // 2. Nếu có danh mục (từ khóa hoặc chọn filter): cộng +3 điểm
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

const getMatchedProvinceFromKeyword = (
  q: string
): { provinceId: number; provinceName: string; label: string } | null => {
  if (q.includes('đà lạt') || q.includes('da lat') || q.includes('lâm đồng') || q.includes('lam dong')) {
    return { provinceId: 25, provinceName: 'Tỉnh Lâm Đồng', label: 'Đà Lạt - Lâm Đồng' }
  }
  if (q.includes('hà nội') || q.includes('ha noi')) {
    return { provinceId: 1, provinceName: 'TP Hà Nội', label: 'Hà Nội' }
  }
  if (q.includes('đà nẵng') || q.includes('da nang')) {
    return { provinceId: 17, provinceName: 'TP Đà Nẵng', label: 'Đà Nẵng' }
  }
  if (q.includes('hồ chí minh') || q.includes('sài gòn') || q.includes('sai gon') || q.includes('tphcm')) {
    return { provinceId: 27, provinceName: 'TP Hồ Chí Minh', label: 'TP. Hồ Chí Minh' }
  }
  if (q.includes('sa pa') || q.includes('sapa') || q.includes('lào cai')) {
    return { provinceId: 10, provinceName: 'Tỉnh Lào Cai', label: 'Sa Pa - Lào Cai' }
  }
  if (q.includes('hội an') || q.includes('hoi an') || q.includes('quảng nam')) {
    return { provinceId: 18, provinceName: 'Tỉnh Quảng Nam', label: 'Hội An - Quảng Nam' }
  }
  if (q.includes('nha trang') || q.includes('khánh hòa') || q.includes('khanh hoa')) {
    return { provinceId: 24, provinceName: 'Tỉnh Khánh Hòa', label: 'Nha Trang - Khánh Hòa' }
  }
  if (q.includes('huế') || q.includes('hue') || q.includes('thừa thiên')) {
    return { provinceId: 16, provinceName: 'TP Huế', label: 'Cố Đô Huế' }
  }
  if (q.includes('ninh bình') || q.includes('ninh binh') || q.includes('tràng an')) {
    return { provinceId: 15, provinceName: 'Tỉnh Ninh Bình', label: 'Ninh Bình' }
  }
  if (q.includes('hạ long') || q.includes('quảng ninh') || q.includes('quang ninh')) {
    return { provinceId: 7, provinceName: 'Tỉnh Quảng Ninh', label: 'Hạ Long - Quảng Ninh' }
  }
  if (q.includes('cần thơ') || q.includes('can tho')) {
    return { provinceId: 28, provinceName: 'TP Cần Thơ', label: 'Cần Thơ' }
  }
  if (q.includes('an giang') || q.includes('châu đốc')) {
    return { provinceId: 34, provinceName: 'Tỉnh An Giang', label: 'An Giang' }
  }
  return null
}

const getMatchedCategoryFromKeyword = (q: string): number | null => {
  if (q.includes('cà phê') || q.includes('cafe') || q.includes('coffee') || q.includes('trà') || q.includes('tráng miệng')) {
    return 2 // Cà phê & Tráng miệng
  }
  if (q.includes('nhà hàng') || q.includes('quán ăn') || q.includes('ăn uống') || q.includes('ẩm thực') || q.includes('phở') || q.includes('bún')) {
    return 1 // Nhà hàng & Quán ăn
  }
  if (q.includes('bar') || q.includes('pub') || q.includes('club') || q.includes('lounge') || q.includes('acoustic')) {
    return 3 // Bar / Pub / Club
  }
  if (q.includes('khách sạn') || q.includes('hotel') || q.includes('resort')) {
    return 4 // Khách sạn & Resort
  }
  if (q.includes('homestay') || q.includes('farmstay')) {
    return 5 // Homestay & Farmstay
  }
  if (q.includes('danh lam') || q.includes('thắng cảnh') || q.includes('biển') || q.includes('núi') || q.includes('thác') || q.includes('săn mây') || q.includes('đồi')) {
    return 7 // Danh lam thắng cảnh
  }
  if (q.includes('chùa') || q.includes('đền') || q.includes('nhà thờ') || q.includes('di tích') || q.includes('lịch sử') || q.includes('tâm linh') || q.includes('bảo tàng')) {
    return 8 // Di tích & Tâm linh
  }
  if (q.includes('vui chơi') || q.includes('công viên') || q.includes('giải trí') || q.includes('vinwonders')) {
    return 10 // Khu vui chơi giải trí
  }
  if (q.includes('chợ') || q.includes('chợ đêm') || q.includes('phố đi bộ')) {
    return 11 // Chợ & Phố đi bộ
  }
  return null
}

export const getIntentContext = (): IntentContextData | null => {
  try {
    const raw = localStorage.getItem('langthang_intent_context')
    if (!raw) return null
    const parsed: IntentContextData = JSON.parse(raw)
    // Expire after 48 hours
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
  } catch {
  }
}

// Client-side Caching (sessionStorage) with cacheSignature and staleTime = 4 minutes
const CACHE_KEY = 'langthang_home_feed_cache_v2'
const STALE_TIME_MS = 4 * 60 * 1000

export const buildCacheSignature = (
  gridKey: string,
  intentProvinceIds?: number[] | number | null,
  topCategoryIds?: number[]
): string => {
  let provStr = '0'
  if (Array.isArray(intentProvinceIds)) {
    provStr = intentProvinceIds.length > 0 ? intentProvinceIds.join(',') : '0'
  } else if (intentProvinceIds) {
    provStr = String(intentProvinceIds)
  }
  const cats = (topCategoryIds || []).join(',')
  return `${gridKey}|${provStr}|${cats}`
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
