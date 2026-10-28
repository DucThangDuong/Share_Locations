
export interface RankingOverviewCategory {
  key: string;
  type: 'place' | 'province' | 'place_type';
  placeTypeId: number | null;
  title?: string | null;
  vietnameseTitle?: string | null;
  coverImageUrl?: string | null;
}

export interface RankingOverviewData {
  title?: string | null;
  subtitle?: string | null;
  categories: RankingOverviewCategory[];
}

export interface RankingDetailHeader {
  title?: string | null;
  subtitle?: string | null;
  coverImageUrl?: string | null;
  badge?: string | null;
  targetName?: string | null;
}

export interface RankingSubCategory {
  id: number;
  name: string;
  code?: string | null;
  slug?: string | null;
  placeCount: number;
}

export interface RankingProvinceOption {
  id: number;
  name: string;
  regionId: number;
  regionName: string;
}

export interface RankingReviewSnippet {
  reviewId: number;
  authorName: string;
  authorAvatar?: string | null;
  rating: number;
  content: string;
  likesCount?: number;
  createdAt: string;
}

export interface RankingPlaceItem {
  rank: number;
  badge?: string | null;
  id: number;
  name: string;
  description?: string | null;
  address?: string | null;
  provinceId: number;
  provinceName: string;
  categoryId: number;
  categoryName: string;
  placeTypeId: number;
  placeTypeName: string;
  coverImageUrl?: string | null;
  avgRating: number;
  reviewCount: number;
  viewCount: number;
  favoritesCount: number;
  score: number;
  greatThingsToDo: string[];
  featuredReview?: RankingReviewSnippet | null;
}

export interface RankingDetailViewData {
  header: RankingDetailHeader;
  subCategories: RankingSubCategory[];
  availableProvinces: RankingProvinceOption[];
  provinceItems?: DestinationRankingItem[];
  items: RankingPlaceItem[];
  page: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
}

export interface RankingDetailParams {
  type?: 'place' | 'province' | 'place_type';
  placeTypeId?: number;
  provinceId?: number;
  categoryId?: number;
  page?: number;
  pageSize?: number;
}

export interface RankingGovernanceConfig {
  ratingPct: number;
  reviewPct: number;
  viewPct: number;
  favoritePct: number;
  ratingMultiplier: number;
  reviewMultiplier: number;
  viewMultiplier: number;
  favoriteMultiplier: number;
  minReviews: number;
  requirePublic: boolean;
  isCustomFormula: boolean;
  pinnedPlaces: Record<string, number>;
  excludedPlaceIds: number[];
  pinnedProvinces: Record<string, number>;
  excludedProvinceIds: number[];
  updatedAt?: string;
}

export interface PlaceRankingItem {
  rank: number;
  badge?: string | null;
  id: number;
  name: string;
  address?: string | null;
  provinceId: number;
  provinceName: string;
  categoryId: number;
  categoryName: string;
  placeTypeId: number;
  placeTypeName: string;
  avgRating: number;
  reviewCount: number;
  viewCount: number;
  favoritesCount: number;
  thumbnailUrl?: string | null;
  score: number;
  ratingScore?: number;
  reviewScore?: number;
  viewScore?: number;
  favoriteScore?: number;
  rankDelta?: number | null;
  isNewTrend?: boolean;
  pinnedRank?: number | null;
  isExcluded?: boolean;
}

export interface PlaceRankingParams {
  placeTypeId?: number;
  categoryId?: number;
  provinceId?: number;
  regionId?: number;
  period?: 'all_time' | 'month' | 'week' | string;
  limit?: number;
  includeExcluded?: boolean;
}

export interface ProvinceRankingItem {
  rank: number;
  badge?: string | null;
  id: number;
  name: string;
  slug?: string | null;
  tagline?: string | null;
  imageUrl?: string | null;
  regionId: number;
  regionName: string;
  totalPlaces: number;
  totalReviews: number;
  avgRating: number;
  score: number;
  ratingScore?: number;
  reviewScore?: number;
  placeCoverageScore?: number;
  rankDelta?: number | null;
  isNewTrend?: boolean;
  pinnedRank?: number | null;
  isExcluded?: boolean;
}

export interface ProvinceRankingParams {
  regionId?: number;
  limit?: number;
  includeExcluded?: boolean;
}

export interface RegionRankingItem {
  rank: number;
  badge?: string | null;
  id: number;
  name: string;
  slug?: string | null;
  tagline?: string | null;
  imageUrl?: string | null;
  totalProvinces: number;
  totalPlaces: number;
  totalReviews: number;
  avgRating: number;
  score: number;
}

export interface AwardWinningPlace {
  rank: number;
  badge?: string | null;
  id: number;
  name: string;
  address?: string | null;
  placeTypeId?: number;
  placeTypeName?: string;
  categoryId?: number;
  categoryName?: string;
  avgRating: number;
  reviewCount?: number;
  viewCount?: number;
  thumbnailUrl?: string | null;
  score: number;
}

export interface DestinationFeaturedStory {
  id: number;
  title: string;
  slug?: string;
  coverImageUrl?: string | null;
  excerpt?: string;
  readTimeMinutes: number;
}

export interface DestinationRankingItem {
  rank: number;
  badge?: string | null;
  id: number;
  name: string;
  slug?: string | null;
  tagline?: string | null;
  description?: string | null;
  imageUrl?: string | null;
  regionId: number;
  regionName: string;
  totalPlaces: number;
  totalReviews: number;
  avgRating: number;
  score: number;
  greatThingsToDo: string[];
  featuredStory?: DestinationFeaturedStory | null;
  awardWinningPlaces: AwardWinningPlace[];
}
