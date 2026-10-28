import apiClient from "./apiClient";
import type { ApiSuccessResponse } from "@/types/responses/common.response";
import type {
  RankingOverviewData,
  RankingDetailViewData,
  RankingDetailParams,
  PlaceRankingItem,
  PlaceRankingParams,
  ProvinceRankingItem,
  ProvinceRankingParams,
  RankingGovernanceConfig,
} from "@/types/ranking";

export const rankingService = {
  getRankingOverview: async (): Promise<RankingOverviewData | null> => {
    const res = await apiClient.get<ApiSuccessResponse<RankingOverviewData>>(
      "/api/rankings/overview"
    );
    return res.data?.data || null;
  },

  getRankingDetail: async (params?: RankingDetailParams): Promise<RankingDetailViewData | null> => {
    const res = await apiClient.get<ApiSuccessResponse<RankingDetailViewData>>(
      "/api/rankings/detail",
      { params }
    );
    return res.data?.data || null;
  },

  getPlaceRankings: async (params?: PlaceRankingParams): Promise<PlaceRankingItem[]> => {
    const res = await apiClient.get<ApiSuccessResponse<PlaceRankingItem[]>>(
      "/api/rankings/places",
      { params }
    );
    return res.data?.data || [];
  },

  getProvinceRankings: async (params?: ProvinceRankingParams): Promise<ProvinceRankingItem[]> => {
    const res = await apiClient.get<ApiSuccessResponse<ProvinceRankingItem[]>>(
      "/api/rankings/provinces",
      { params }
    );
    return res.data?.data || [];
  },

  getRankingConfig: async (): Promise<RankingGovernanceConfig | null> => {
    const res = await apiClient.get<ApiSuccessResponse<RankingGovernanceConfig>>(
      "/api/admin/rankings/config"
    );
    return res.data?.data || null;
  },

  updateRankingConfig: async (config: RankingGovernanceConfig): Promise<RankingGovernanceConfig | null> => {
    const res = await apiClient.put<ApiSuccessResponse<RankingGovernanceConfig>>(
      "/api/admin/rankings/config",
      config
    );
    return res.data?.data || null;
  },

  clearRankingCache: async (): Promise<boolean> => {
    const res = await apiClient.post<ApiSuccessResponse<boolean>>(
      "/api/admin/rankings/clear-cache"
    );
    return Boolean(res.data?.data ?? res.data?.success ?? true);
  },
};

export default rankingService;
