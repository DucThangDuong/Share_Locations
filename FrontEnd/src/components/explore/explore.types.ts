export interface PriceTier {
  label: string
  min: number
  max: number
  exactFree?: boolean
}

export interface SortOption {
  label: string
  value: string
}

export const PRICE_TIERS: PriceTier[] = [
  { label: 'Tất cả mức giá', min: 0, max: 0 },
  { label: 'Miễn phí', min: 0, max: 0, exactFree: true },
  { label: 'Tiết kiệm (< 100k)', min: 1, max: 100000 },
  { label: 'Vừa phải (100k - 500k)', min: 100000, max: 500000 },
  { label: 'Cao cấp (> 500k)', min: 500000, max: 50000000 }
]

export const SORT_OPTIONS: SortOption[] = [
  { label: 'Được đề xuất hàng đầu', value: 'popular_desc' },
  { label: 'Đánh giá cao nhất', value: 'rating_desc' },
  { label: 'Nhiều lượt đánh giá nhất', value: 'reviews_desc' },
  { label: 'Giá: Thấp đến cao', value: 'price_asc' },
  { label: 'Giá: Cao đến thấp', value: 'price_desc' },
  { label: 'Mới nhất', value: 'newest' }
]
