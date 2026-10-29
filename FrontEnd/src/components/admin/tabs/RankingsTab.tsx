import React, { useState, useEffect, useMemo } from 'react';
import {
  RefreshCw,
  Search,
  ExternalLink,
  Star,
  Settings,
  Zap,
  Info,
  Pin,
  Ban,
  RotateCcw,
  TrendingUp,
  TrendingDown,
  Minus,
  Sparkles,
  X,
  MapPin,
  Check,
} from 'lucide-react';
import { rankingService } from '@/services/rankingService';
import { geographyService, type ProvinceDto } from '@/services/geographyService';
import { LeaderboardBadge } from '@/components/rankings/LeaderboardBadge';
import { CustomSelect } from '@/components/common/CustomSelect';
import { isUserSystemAdmin } from '@/utils/authUtils';
import type {
  PlaceRankingItem,
  ProvinceRankingItem,
  RankingGovernanceConfig,
} from '@/types/ranking';

interface RankingsTabProps {
  showToast?: (msg: string) => void;
}

const DEFAULT_GOVERNANCE_CONFIG: RankingGovernanceConfig = {
  ratingPct: 60,
  reviewPct: 25,
  viewPct: 10,
  favoritePct: 5,
  ratingMultiplier: 25,
  reviewMultiplier: 1.5,
  viewMultiplier: 0.01,
  favoriteMultiplier: 2,
  minReviews: 5,
  requirePublic: true,
  isCustomFormula: false,
  pinnedPlaces: {},
  excludedPlaceIds: [],
  pinnedProvinces: {},
  excludedProvinceIds: [],
};

export const RankingsTab: React.FC<RankingsTabProps> = ({ showToast }) => {
  const isSystemAdmin = isUserSystemAdmin();

  const [activeView, setActiveView] = useState<'places' | 'provinces'>('places');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSavingConfig, setIsSavingConfig] = useState<boolean>(false);

  const [isRecalculating, setIsRecalculating] = useState<boolean>(false);
  const [isConfirmRecalcOpen, setIsConfirmRecalcOpen] = useState<boolean>(false);
  const [isWeightsModalOpen, setIsWeightsModalOpen] = useState<boolean>(false);

  const [placeList, setPlaceList] = useState<PlaceRankingItem[]>([]);
  const [provinceList, setProvinceList] = useState<ProvinceRankingItem[]>([]);
  const [provincesCatalog, setProvincesCatalog] = useState<ProvinceDto[]>([]);

  const [placeTypeFilter, setPlaceTypeFilter] = useState<string>('all');
  const [provinceFilter, setProvinceFilter] = useState<string>('all');
  const [periodFilter, setPeriodFilter] = useState<string>('all_time');
  const [searchKeyword, setSearchKeyword] = useState<string>('');
  const [showExcludedOnly, setShowExcludedOnly] = useState<boolean>(false);

  const [governanceConfig, setGovernanceConfig] = useState<RankingGovernanceConfig>(DEFAULT_GOVERNANCE_CONFIG);
  const [draftConfig, setDraftConfig] = useState<RankingGovernanceConfig>(DEFAULT_GOVERNANCE_CONFIG);

  const [activeScorePopoverId, setActiveScorePopoverId] = useState<string | null>(null);
  const [activePinMenuId, setActivePinMenuId] = useState<string | null>(null);

  const notify = (msg: string) => {
    if (showToast) showToast(msg);
    else alert(msg);
  };

  useEffect(() => {
    const fetchInitialCatalogAndConfig = async () => {
      try {
        const [provRes, cfgRes] = await Promise.all([
          geographyService.getProvinces(),
          rankingService.getRankingConfig(),
        ]);
        if (provRes?.data) {
          setProvincesCatalog(provRes.data);
        }
        if (cfgRes) {
          setGovernanceConfig({
            ...DEFAULT_GOVERNANCE_CONFIG,
            ...cfgRes,
            pinnedPlaces: cfgRes.pinnedPlaces || {},
            excludedPlaceIds: cfgRes.excludedPlaceIds || [],
            pinnedProvinces: cfgRes.pinnedProvinces || {},
            excludedProvinceIds: cfgRes.excludedProvinceIds || [],
          });
        }
      } catch (err) {
        console.error('Lỗi khi nạp cấu hình bảng xếp hạng:', err);
      }
    };
    fetchInitialCatalogAndConfig();
  }, []);

  const loadRankingData = async () => {
    setIsLoading(true);
    try {
      if (activeView === 'places') {
        const params: Record<string, any> = {
          limit: 30,
          period: periodFilter,
          includeExcluded: true,
        };
        if (placeTypeFilter !== 'all') params.placeTypeId = Number(placeTypeFilter);
        if (provinceFilter !== 'all') params.provinceId = Number(provinceFilter);
        const data = await rankingService.getPlaceRankings(params);
        setPlaceList(data);
      } else if (activeView === 'provinces') {
        const data = await rankingService.getProvinceRankings({
          limit: 30,
          includeExcluded: true,
        });
        setProvinceList(data);
      }
    } catch (err) {
      console.error('Lỗi tải dữ liệu bảng xếp hạng:', err);
      notify('Không thể tải dữ liệu bảng xếp hạng.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadRankingData();
  }, [activeView, placeTypeFilter, provinceFilter, periodFilter]);

  const persistGovernanceConfig = async (
    nextConfig: RankingGovernanceConfig,
    successMessage: string
  ) => {
    setIsSavingConfig(true);
    try {
      const saved = await rankingService.updateRankingConfig(nextConfig);
      if (saved) {
        setGovernanceConfig({
          ...DEFAULT_GOVERNANCE_CONFIG,
          ...saved,
          pinnedPlaces: saved.pinnedPlaces || {},
          excludedPlaceIds: saved.excludedPlaceIds || [],
          pinnedProvinces: saved.pinnedProvinces || {},
          excludedProvinceIds: saved.excludedProvinceIds || [],
        });
      } else {
        setGovernanceConfig(nextConfig);
      }
      notify(successMessage);
      await loadRankingData();
    } catch (err: any) {
      console.error('Lỗi lưu cấu hình BXH:', err);
      const errMsg = err?.response?.data?.message || 'Không thể lưu cấu hình lên máy chủ.';
      notify(`Thao tác thất bại: ${errMsg}`);
    } finally {
      setIsSavingConfig(false);
    }
  };

  const handleRecalculateRanking = async () => {
    setIsRecalculating(true);
    try {
      const success = await rankingService.clearRankingCache();
      if (success) {
        notify('Đã đồng bộ và tính toán lại toàn bộ Bảng xếp hạng thành công!');
        setIsConfirmRecalcOpen(false);
        const cfg = await rankingService.getRankingConfig();
        if (cfg) setGovernanceConfig((prev) => ({ ...prev, ...cfg }));
        await loadRankingData();
      } else {
        notify('Yêu cầu tính toán lại BXH không thành công. Vui lòng thử lại.');
      }
    } catch (err: any) {
      console.error('Lỗi tính toán lại BXH:', err);
      const errMsg = err?.response?.data?.message || 'Lỗi khi gọi API đồng bộ điểm xếp hạng.';
      notify(`Thao tác thất bại: ${errMsg}`);
    } finally {
      setIsRecalculating(false);
    }
  };

  const renderRankTrendBadge = (rankDelta?: number | null, isNewTrend?: boolean) => {
    if (isNewTrend) {
      return (
        <span
          className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[10px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200"
          title="Mới lọt vào Bảng xếp hạng kỳ này"
        >
          <Sparkles className="w-2.5 h-2.5" />
          <span>MỚI</span>
        </span>
      );
    }

    if (typeof rankDelta === 'number' && rankDelta > 0) {
      return (
        <span
          className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200"
          title={`Tăng ${rankDelta} bậc so với kỳ trước`}
        >
          <TrendingUp className="w-2.5 h-2.5" />
          <span>+{rankDelta}</span>
        </span>
      );
    }

    if (typeof rankDelta === 'number' && rankDelta < 0) {
      return (
        <span
          className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[10px] font-bold bg-rose-50 text-rose-600 border border-rose-200"
          title={`Tụt ${Math.abs(rankDelta)} bậc so với kỳ trước`}
        >
          <TrendingDown className="w-2.5 h-2.5" />
          <span>{rankDelta}</span>
        </span>
      );
    }

    return (
      <span
        className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[10px] font-semibold bg-slate-100 text-slate-500 border border-slate-200"
        title="Giữ nguyên thứ hạng so với kỳ trước"
      >
        <Minus className="w-2.5 h-2.5" />
      </span>
    );
  };

  const displayedPlaces = useMemo(() => {
    const kw = searchKeyword.trim().toLowerCase();
    return placeList
      .filter((p) => (showExcludedOnly ? Boolean(p.isExcluded) : !p.isExcluded))
      .filter((p) => {
        if (!kw) return true;
        return (
          p.name.toLowerCase().includes(kw) ||
          p.provinceName.toLowerCase().includes(kw) ||
          p.categoryName?.toLowerCase().includes(kw)
        );
      });
  }, [placeList, showExcludedOnly, searchKeyword]);

  const displayedProvinces = useMemo(() => {
    const kw = searchKeyword.trim().toLowerCase();
    return provinceList
      .filter((p) => (showExcludedOnly ? Boolean(p.isExcluded) : !p.isExcluded))
      .filter((p) => {
        if (!kw) return true;
        return (
          p.name.toLowerCase().includes(kw) ||
          (p.regionName && p.regionName.toLowerCase().includes(kw))
        );
      });
  }, [provinceList, showExcludedOnly, searchKeyword]);

  const handlePinPlace = async (place: PlaceRankingItem, targetRank: number | null) => {
    const nextPinned = { ...governanceConfig.pinnedPlaces };
    if (targetRank === null) {
      delete nextPinned[String(place.id)];
    } else {
      Object.keys(nextPinned).forEach((k) => {
        if (nextPinned[k] === targetRank) delete nextPinned[k];
      });
      nextPinned[String(place.id)] = targetRank;
    }

    setActivePinMenuId(null);
    await persistGovernanceConfig(
      { ...governanceConfig, pinnedPlaces: nextPinned },
      targetRank === null
        ? `Đã gỡ ghim thứ hạng của "${place.name}".`
        : `Đã ghim "${place.name}" vào vị trí TOP ${targetRank} trên hệ thống!`
    );
  };

  const handleToggleExcludePlace = async (place: PlaceRankingItem) => {
    const isExcluded = Boolean(place.isExcluded);
    const nextExcluded = isExcluded
      ? governanceConfig.excludedPlaceIds.filter((id) => Number(id) !== place.id)
      : [...governanceConfig.excludedPlaceIds, place.id];

    const nextPinned = { ...governanceConfig.pinnedPlaces };
    if (!isExcluded) {
      delete nextPinned[String(place.id)];
    }

    await persistGovernanceConfig(
      {
        ...governanceConfig,
        excludedPlaceIds: nextExcluded,
        pinnedPlaces: nextPinned,
      },
      isExcluded
        ? `Đã khôi phục "${place.name}" trở lại Bảng xếp hạng.`
        : `Đã loại "${place.name}" khỏi Bảng xếp hạng (Địa điểm vẫn tồn tại trên hệ thống).`
    );
  };

  const handlePinProvince = async (prov: ProvinceRankingItem, targetRank: number | null) => {
    const nextPinned = { ...governanceConfig.pinnedProvinces };
    if (targetRank === null) {
      delete nextPinned[String(prov.id)];
    } else {
      Object.keys(nextPinned).forEach((k) => {
        if (nextPinned[k] === targetRank) delete nextPinned[k];
      });
      nextPinned[String(prov.id)] = targetRank;
    }

    setActivePinMenuId(null);
    await persistGovernanceConfig(
      { ...governanceConfig, pinnedProvinces: nextPinned },
      targetRank === null
        ? `Đã gỡ ghim thứ hạng của "${prov.name}".`
        : `Đã ghim "${prov.name}" vào vị trí TOP ${targetRank}!`
    );
  };

  const handleToggleExcludeProvince = async (prov: ProvinceRankingItem) => {
    const isExcluded = Boolean(prov.isExcluded);
    const nextExcluded = isExcluded
      ? governanceConfig.excludedProvinceIds.filter((id) => Number(id) !== prov.id)
      : [...governanceConfig.excludedProvinceIds, prov.id];

    const nextPinned = { ...governanceConfig.pinnedProvinces };
    if (!isExcluded) {
      delete nextPinned[String(prov.id)];
    }

    await persistGovernanceConfig(
      {
        ...governanceConfig,
        excludedProvinceIds: nextExcluded,
        pinnedProvinces: nextPinned,
      },
      isExcluded
        ? `Đã khôi phục "${prov.name}" trở lại Bảng xếp hạng.`
        : `Đã loại "${prov.name}" khỏi Bảng xếp hạng.`
    );
  };

  const handleSaveWeights = async () => {
    const totalPct =
      Number(draftConfig.ratingPct) +
      Number(draftConfig.reviewPct) +
      Number(draftConfig.viewPct) +
      Number(draftConfig.favoritePct);

    if (totalPct !== 100) {
      notify(`Tổng tỷ trọng hiện tại là ${totalPct}%. Vui lòng điều chỉnh để tổng 4 trọng số bằng 100%.`);
      return;
    }

    const isCustomFormula =
      draftConfig.ratingPct !== DEFAULT_GOVERNANCE_CONFIG.ratingPct ||
      draftConfig.reviewPct !== DEFAULT_GOVERNANCE_CONFIG.reviewPct ||
      draftConfig.viewPct !== DEFAULT_GOVERNANCE_CONFIG.viewPct ||
      draftConfig.favoritePct !== DEFAULT_GOVERNANCE_CONFIG.favoritePct ||
      draftConfig.ratingMultiplier !== DEFAULT_GOVERNANCE_CONFIG.ratingMultiplier ||
      draftConfig.reviewMultiplier !== DEFAULT_GOVERNANCE_CONFIG.reviewMultiplier ||
      draftConfig.viewMultiplier !== DEFAULT_GOVERNANCE_CONFIG.viewMultiplier ||
      draftConfig.favoriteMultiplier !== DEFAULT_GOVERNANCE_CONFIG.favoriteMultiplier;

    const updated: RankingGovernanceConfig = {
      ...governanceConfig,
      ...draftConfig,
      isCustomFormula,
    };

    setIsWeightsModalOpen(false);
    await persistGovernanceConfig(
      updated,
      'Đã lưu cấu hình trọng số thuật toán vào Database và tính toán lại Bảng xếp hạng!'
    );
  };

  const handleResetDefaultWeights = async () => {
    const resetConfig: RankingGovernanceConfig = {
      ...governanceConfig,
      ratingPct: DEFAULT_GOVERNANCE_CONFIG.ratingPct,
      reviewPct: DEFAULT_GOVERNANCE_CONFIG.reviewPct,
      viewPct: DEFAULT_GOVERNANCE_CONFIG.viewPct,
      favoritePct: DEFAULT_GOVERNANCE_CONFIG.favoritePct,
      ratingMultiplier: DEFAULT_GOVERNANCE_CONFIG.ratingMultiplier,
      reviewMultiplier: DEFAULT_GOVERNANCE_CONFIG.reviewMultiplier,
      viewMultiplier: DEFAULT_GOVERNANCE_CONFIG.viewMultiplier,
      favoriteMultiplier: DEFAULT_GOVERNANCE_CONFIG.favoriteMultiplier,
      minReviews: DEFAULT_GOVERNANCE_CONFIG.minReviews,
      isCustomFormula: false,
    };
    setDraftConfig(resetConfig);
    setIsWeightsModalOpen(false);
    await persistGovernanceConfig(
      resetConfig,
      'Đã khôi phục trọng số thuật toán về cấu hình chuẩn mặc định.'
    );
  };

  const formattedUpdatedTime = useMemo(() => {
    if (!governanceConfig.updatedAt) return 'Hôm nay';
    const d = new Date(governanceConfig.updatedAt);
    if (Number.isNaN(d.getTime())) return 'Hôm nay';
    return `${d.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })} (${d.toLocaleDateString('vi-VN')})`;
  }, [governanceConfig.updatedAt]);

  const currentExcludedCount =
    activeView === 'places'
      ? placeList.filter((p) => p.isExcluded).length
      : provinceList.filter((p) => p.isExcluded).length;

  const currentPinnedCount =
    activeView === 'places'
      ? Object.keys(governanceConfig.pinnedPlaces || {}).length
      : Object.keys(governanceConfig.pinnedProvinces || {}).length;

  return (
    <div className="space-y-5 pb-12 animate-in fade-in duration-200">
      <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-2xs flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="space-y-2 flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2 text-xs">
            <span className="text-slate-600">
              Chu kỳ tính điểm: <strong className="text-slate-800">Tự động mỗi 60 phút</strong>
            </span>
            <span className="text-slate-300 hidden sm:inline">|</span>
            <span className="text-slate-600">
              Cập nhật lần cuối: <strong className="text-slate-800">{formattedUpdatedTime}</strong>
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-600 bg-slate-50/90 px-3 py-2 rounded-xl border border-slate-200/60">
            <span>
              <strong className="text-slate-800">Công thức:</strong> Điểm TB (×{governanceConfig.ratingMultiplier} •{' '}
              {governanceConfig.ratingPct}%) + Lượt đánh giá (×{governanceConfig.reviewMultiplier} •{' '}
              {governanceConfig.reviewPct}%) + Lượt xem (×{governanceConfig.viewMultiplier} •{' '}
              {governanceConfig.viewPct}%) + Yêu thích (×{governanceConfig.favoriteMultiplier} •{' '}
              {governanceConfig.favoritePct}%)
            </span>
            <span className="text-slate-300">•</span>
            <span>
              Ngưỡng tối thiểu: <strong className="text-emerald-700">≥ {governanceConfig.minReviews} đánh giá</strong> &{' '}
              <strong className="text-emerald-700">Công khai</strong>
            </span>
            {currentPinnedCount > 0 && (
              <>
                <span className="text-slate-300">•</span>
                <span className="text-amber-700 font-semibold">
                  📌 Đang ghim thủ công: {currentPinnedCount}
                </span>
              </>
            )}
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 shrink-0">
          <button
            type="button"
            onClick={() => loadRankingData()}
            disabled={isLoading || isSavingConfig}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-200 hover:bg-slate-50 text-xs font-semibold text-slate-700 transition-colors cursor-pointer disabled:opacity-50"
            title="Làm mới dữ liệu hiển thị"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            <span>Tải lại</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setDraftConfig(governanceConfig);
              setIsWeightsModalOpen(true);
            }}
            disabled={isSavingConfig}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-xs font-bold text-slate-800 transition-colors cursor-pointer shadow-2xs disabled:opacity-50"
            title="Cấu hình trọng số thuật toán và điều kiện tối thiểu"
          >
            <Settings className="w-3.5 h-3.5 text-slate-600" />
            <span>Trọng số thuật toán</span>
          </button>

          {isSystemAdmin && (
            <button
              type="button"
              onClick={() => setIsConfirmRecalcOpen(true)}
              disabled={isSavingConfig}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-sm shadow-emerald-600/20 transition-all cursor-pointer hover:shadow-md disabled:opacity-50"
              title="Đồng bộ và tính toán lại toàn bộ điểm số xếp hạng ngay lập tức"
            >
              <Zap className="w-3.5 h-3.5" />
              <span>Tính toán lại BXH</span>
            </button>
          )}
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-2xs overflow-visible">
        <div className="p-4 sm:p-5 border-b border-slate-100 flex flex-col xl:flex-row xl:items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center p-1 bg-slate-100 rounded-xl w-fit">
              <button
                type="button"
                onClick={() => {
                  setActiveView('places');
                  setShowExcludedOnly(false);
                }}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${activeView === 'places'
                  ? 'bg-white text-emerald-800 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
                  }`}
              >
                Top Địa Điểm
              </button>
              <button
                type="button"
                onClick={() => {
                  setActiveView('provinces');
                  setShowExcludedOnly(false);
                }}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${activeView === 'provinces'
                  ? 'bg-white text-emerald-800 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
                  }`}
              >
                Top Tỉnh Thành
              </button>
            </div>

            <button
              type="button"
              onClick={() => setShowExcludedOnly((prev) => !prev)}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold border transition-colors cursor-pointer ${showExcludedOnly
                ? 'bg-rose-600 text-white border-rose-600 shadow-2xs'
                : currentExcludedCount > 0
                  ? 'bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-100'
                  : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                }`}
              title="Xem danh sách các mục đã bị Admin loại khỏi Bảng xếp hạng"
            >
              <Ban className="w-3.5 h-3.5" />
              <span>Đã loại khỏi BXH ({currentExcludedCount})</span>
            </button>
          </div>

          {activeView === 'places' ? (
            <div className="flex flex-wrap items-center gap-2">
              <div className="relative min-w-[180px] sm:w-56">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="text"
                  value={searchKeyword}
                  onChange={(e) => setSearchKeyword(e.target.value)}
                  placeholder="Tìm tên địa điểm..."
                  className="w-full pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
                />
              </div>

              <CustomSelect
                value={placeTypeFilter}
                onChange={(val) => setPlaceTypeFilter(String(val))}
                options={[
                  { value: 'all', label: 'Tất cả loại hình' },
                  { value: '1', label: 'Ẩm thực' },
                  { value: '2', label: 'Lưu trú' },
                  { value: '3', label: 'Tham quan' },
                  { value: '4', label: 'Giải trí' },
                ]}
                placeholder="Loại hình"
                size="sm"
                className="w-auto min-w-[145px] shrink-0"
                menuClassName="min-w-full w-max right-auto shadow-lg"
              />

              <CustomSelect
                value={provinceFilter}
                onChange={(val) => setProvinceFilter(String(val))}
                options={[
                  { value: 'all', label: 'Tất cả tỉnh thành' },
                  ...provincesCatalog.map((p) => ({
                    value: String(p.id),
                    label: p.name,
                  })),
                ]}
                placeholder="Tỉnh thành"
                size="sm"
                className="w-auto min-w-[165px] shrink-0"
                menuClassName="min-w-full w-max right-auto shadow-lg"
              />

              <CustomSelect
                value={periodFilter}
                onChange={(val) => setPeriodFilter(String(val))}
                options={[
                  { value: 'all_time', label: 'Toàn thời gian' },
                  { value: 'month', label: 'Tháng này' },
                  { value: 'week', label: 'Tuần này' },
                ]}
                placeholder="Khung giờ"
                size="sm"
                className="w-auto min-w-[135px] shrink-0"
                menuClassName="min-w-full w-max right-auto shadow-lg"
              />
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <div className="relative min-w-[200px] sm:w-64">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="text"
                  value={searchKeyword}
                  onChange={(e) => setSearchKeyword(e.target.value)}
                  placeholder="Tìm theo tên tỉnh thành..."
                  className="w-full pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
                />
              </div>
            </div>
          )}
        </div>

        <div className="overflow-x-auto">
          {isLoading ? (
            <div className="py-20 text-center">
              <div className="w-8 h-8 border-3 border-emerald-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
              <p className="text-xs text-slate-500 font-medium">Đang tải bảng xếp hạng từ hệ thống...</p>
            </div>
          ) : activeView === 'places' ? (
            displayedPlaces.length === 0 ? (
              <div className="py-16 text-center text-xs text-slate-400 space-y-2">
                <p>
                  {showExcludedOnly
                    ? 'Hiện không có địa điểm nào nằm trong danh sách loại khỏi Bảng xếp hạng.'
                    : 'Không có địa điểm nào phù hợp với bộ lọc hoặc ngưỡng đánh giá tối thiểu hiện tại.'}
                </p>
                {showExcludedOnly && (
                  <button
                    type="button"
                    onClick={() => setShowExcludedOnly(false)}
                    className="text-emerald-700 font-bold hover:underline cursor-pointer"
                  >
                    ← Quay lại Bảng xếp hạng chính
                  </button>
                )}
              </div>
            ) : (
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50/80 border-b border-slate-100 text-slate-500 font-bold uppercase tracking-wider text-[10px]">
                  <tr>
                    <th className="py-3.5 px-4 w-36 text-center">Thứ hạng</th>
                    <th className="py-3.5 px-4">Địa điểm</th>
                    <th className="py-3.5 px-4">Tỉnh / Thành</th>
                    <th className="py-3.5 px-4">Phân loại</th>
                    <th className="py-3.5 px-4 text-center">Đánh giá</th>
                    <th className="py-3.5 px-4 text-center">Lượt xem</th>
                    <th className="py-3.5 px-4 text-center">Yêu thích</th>
                    <th className="py-3.5 px-4 text-right">Thuật toán Score</th>
                    <th className="py-3.5 px-4 text-center w-36">Điều khiển / Thao tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {displayedPlaces.map((place) => {
                    const scoreKey = `place-score-${place.id}`;
                    const pinKey = `place-pin-${place.id}`;
                    const isScoreOpen = activeScorePopoverId === scoreKey;
                    const isPinOpen = activePinMenuId === pinKey;

                    const ratingPts = Number(place.ratingScore ?? 0).toFixed(1);
                    const reviewPts = Number(place.reviewScore ?? 0).toFixed(1);
                    const viewPts = Number(place.viewScore ?? 0).toFixed(1);
                    const favPts = Number(place.favoriteScore ?? 0).toFixed(1);
                    const totalScore = Number(place.score ?? 0).toFixed(1);

                    return (
                      <tr
                        key={place.id}
                        className={`hover:bg-slate-50/80 transition-colors group ${place.pinnedRank ? 'bg-amber-50/30' : ''
                          }`}
                      >
                        <td className="py-3 px-4 text-center">
                          {place.isExcluded ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
                              <Ban className="w-3 h-3" />
                              <span>Đã loại trừ</span>
                            </span>
                          ) : (
                            <div className="flex flex-col items-center gap-1">
                              <div className="inline-flex items-center justify-center gap-1.5 whitespace-nowrap">
                                <LeaderboardBadge
                                  rank={place.rank}
                                  badge={place.badge}
                                  size="sm"
                                />
                                {renderRankTrendBadge(place.rankDelta, place.isNewTrend)}
                              </div>
                              {place.pinnedRank && (
                                <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-bold bg-amber-100 text-amber-800 border border-amber-300">
                                  <Pin className="w-2.5 h-2.5" />
                                  <span>GHIM TOP {place.pinnedRank}</span>
                                </span>
                              )}
                            </div>
                          )}
                        </td>

                        <td className="py-3 px-4">
                          <div className="flex items-center gap-3">
                            {place.thumbnailUrl ? (
                              <img
                                src={place.thumbnailUrl}
                                alt={place.name}
                                className="w-10 h-10 rounded-lg object-cover bg-slate-100 shrink-0 border border-slate-200/60"
                                onError={(e) => {
                                  const target = e.currentTarget;
                                  target.onerror = null;
                                  target.style.display = 'none';
                                }}
                              />
                            ) : (
                              <div className="w-10 h-10 rounded-lg bg-slate-100 shrink-0 border border-slate-200/60 flex items-center justify-center text-slate-400">
                                <MapPin className="w-4 h-4" />
                              </div>
                            )}
                            <div>
                              <span className="font-bold text-slate-900 group-hover:text-emerald-700 transition-colors block">
                                {place.name}
                              </span>
                              <span className="text-[11px] text-slate-400 truncate max-w-xs block">
                                {place.address || 'Chưa cập nhật địa chỉ'}
                              </span>
                            </div>
                          </div>
                        </td>

                        <td className="py-3 px-4 text-slate-600 font-medium">
                          {place.provinceName}
                        </td>

                        <td className="py-3 px-4">
                          <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 text-[11px] font-medium">
                            {place.categoryName || place.placeTypeName || 'Địa điểm'}
                          </span>
                        </td>

                        <td className="py-3 px-4 text-center">
                          <div className="inline-flex items-center gap-1 font-bold text-slate-900">
                            <Star className="w-3 h-3 text-amber-500 fill-amber-500" />
                            <span>{Number(place.avgRating).toFixed(1)}</span>
                            <span className="text-[10px] text-slate-400 font-normal">
                              ({place.reviewCount})
                            </span>
                          </div>
                        </td>

                        <td className="py-3 px-4 text-center text-slate-600">
                          {place.viewCount?.toLocaleString() || 0}
                        </td>

                        <td className="py-3 px-4 text-center text-slate-600">
                          {place.favoritesCount?.toLocaleString() || 0}
                        </td>

                        <td className="py-3 px-4 text-right relative">
                          <div className="inline-block relative group/score">
                            <button
                              type="button"
                              onClick={() =>
                                setActiveScorePopoverId(isScoreOpen ? null : scoreKey)
                              }
                              title={`Điểm sao: ${ratingPts}đ + Đánh giá: ${reviewPts}đ + Lượt xem: ${viewPts}đ + Yêu thích: ${favPts}đ = ${totalScore} pts`}
                              className="inline-flex items-center gap-1 font-mono font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 px-2.5 py-1 rounded-lg border border-emerald-200/80 transition-colors cursor-pointer"
                            >
                              <span>{totalScore} pts</span>
                              <Info className="w-3 h-3 text-emerald-600/80" />
                            </button>

                            <div
                              className={`z-30 w-64 p-3 rounded-xl bg-slate-900 text-white text-[11px] shadow-xl border border-slate-700 text-left right-0 bottom-full mb-2 transition-all ${isScoreOpen
                                ? 'block absolute'
                                : 'hidden group-hover/score:block absolute pointer-events-none'
                                }`}
                            >
                              <div className="font-bold text-emerald-400 pb-1.5 mb-1.5 border-b border-slate-700/80 flex items-center justify-between">
                                <span>Chi tiết cấu thành điểm</span>
                                <span>{totalScore} pts</span>
                              </div>
                              <div className="space-y-1 text-slate-300 font-sans">
                                <div className="flex justify-between">
                                  <span>• Điểm sao ({Number(place.avgRating).toFixed(1)}★):</span>
                                  <strong className="text-white font-mono">+{ratingPts}đ</strong>
                                </div>
                                <div className="flex justify-between">
                                  <span>• Lượt đánh giá ({place.reviewCount}):</span>
                                  <strong className="text-white font-mono">+{reviewPts}đ</strong>
                                </div>
                                <div className="flex justify-between">
                                  <span>• Lượt xem ({place.viewCount?.toLocaleString()}):</span>
                                  <strong className="text-white font-mono">+{viewPts}đ</strong>
                                </div>
                                <div className="flex justify-between">
                                  <span>• Yêu thích ({place.favoritesCount}):</span>
                                  <strong className="text-white font-mono">+{favPts}đ</strong>
                                </div>
                              </div>
                              <div className="mt-2 pt-1.5 border-t border-slate-700/80 text-[10px] text-emerald-300 font-mono">
                                {ratingPts}đ + {reviewPts}đ + {viewPts}đ + {favPts}đ = {totalScore} pts
                              </div>
                            </div>
                          </div>
                        </td>

                        <td className="py-3 px-4 text-center relative">
                          <div className="inline-flex items-center justify-center gap-1">
                            <button
                              type="button"
                              onClick={() =>
                                setActiveScorePopoverId(isScoreOpen ? null : scoreKey)
                              }
                              className={`p-1.5 rounded-lg transition-colors cursor-pointer ${isScoreOpen
                                ? 'bg-emerald-100 text-emerald-800'
                                : 'text-slate-400 hover:text-emerald-700 hover:bg-emerald-50'
                                }`}
                              title="Xem chi tiết công thức điểm"
                            >
                              <Info className="w-3.5 h-3.5" />
                            </button>

                            {!place.isExcluded && (
                              <div className="relative">
                                <button
                                  type="button"
                                  disabled={isSavingConfig}
                                  onClick={() =>
                                    setActivePinMenuId(isPinOpen ? null : pinKey)
                                  }
                                  className={`p-1.5 rounded-lg transition-colors cursor-pointer disabled:opacity-50 ${place.pinnedRank
                                    ? 'bg-amber-100 text-amber-800 border border-amber-300'
                                    : 'text-slate-400 hover:text-amber-700 hover:bg-amber-50'
                                    }`}
                                  title={
                                    place.pinnedRank
                                      ? `Đang ghim tại TOP ${place.pinnedRank} (Bấm để đổi hoặc gỡ ghim)`
                                      : 'Ghim cố định thứ hạng (Chiến dịch / Sự kiện)'
                                  }
                                >
                                  <Pin className="w-3.5 h-3.5" />
                                </button>

                                {isPinOpen && (
                                  <div className="absolute right-0 top-full mt-1 z-40 w-44 bg-white rounded-xl shadow-xl border border-slate-200 p-1.5 text-left space-y-1">
                                    <div className="px-2 py-1 text-[10px] font-bold text-slate-400 uppercase">
                                      Ghim ưu tiên BXH
                                    </div>
                                    {[1, 2, 3].map((r) => (
                                      <button
                                        key={r}
                                        type="button"
                                        onClick={() => handlePinPlace(place, r)}
                                        className={`w-full px-2.5 py-1.5 rounded-lg text-xs font-semibold flex items-center justify-between cursor-pointer ${place.pinnedRank === r
                                          ? 'bg-amber-50 text-amber-800 font-bold'
                                          : 'text-slate-700 hover:bg-slate-50'
                                          }`}
                                      >
                                        <span>📌 Ghim vào TOP {r}</span>
                                        {place.pinnedRank === r && <Check className="w-3.5 h-3.5" />}
                                      </button>
                                    ))}
                                    {place.pinnedRank && (
                                      <button
                                        type="button"
                                        onClick={() => handlePinPlace(place, null)}
                                        className="w-full px-2.5 py-1.5 rounded-lg text-xs font-semibold text-rose-600 hover:bg-rose-50 flex items-center gap-1.5 cursor-pointer border-t border-slate-100 pt-1.5"
                                      >
                                        <X className="w-3.5 h-3.5" />
                                        <span>Gỡ ghim thứ hạng</span>
                                      </button>
                                    )}
                                  </div>
                                )}
                              </div>
                            )}

                            <button
                              type="button"
                              disabled={isSavingConfig}
                              onClick={() => handleToggleExcludePlace(place)}
                              className={`p-1.5 rounded-lg transition-colors cursor-pointer disabled:opacity-50 ${place.isExcluded
                                ? 'bg-emerald-600 hover:bg-emerald-700 text-white px-2.5 py-1 text-[11px] font-bold inline-flex items-center gap-1'
                                : 'text-slate-400 hover:text-rose-600 hover:bg-rose-50'
                                }`}
                              title={
                                place.isExcluded
                                  ? 'Khôi phục địa điểm này vào lại Bảng xếp hạng'
                                  : 'Loại khỏi Bảng xếp hạng (Chống spam / cày view ảo)'
                              }
                            >
                              {place.isExcluded ? (
                                <>
                                  <RotateCcw className="w-3 h-3" />
                                  <span>Khôi phục</span>
                                </>
                              ) : (
                                <Ban className="w-3.5 h-3.5" />
                              )}
                            </button>

                            <a
                              href={`/places/${place.id}`}
                              target="_blank"
                              rel="noreferrer"
                              className="p-1.5 rounded-lg text-slate-400 hover:text-emerald-700 hover:bg-emerald-50 transition-colors inline-flex items-center justify-center cursor-pointer"
                              title="Xem trang chi tiết địa điểm"
                            >
                              <ExternalLink className="w-3.5 h-3.5" />
                            </a>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )
          ) : (
            displayedProvinces.length === 0 ? (
              <div className="py-16 text-center text-xs text-slate-400">
                {showExcludedOnly
                  ? 'Hiện không có tỉnh thành nào bị loại khỏi Bảng xếp hạng.'
                  : searchKeyword.trim()
                    ? 'Không tìm thấy tỉnh thành nào phù hợp với từ khóa.'
                    : 'Chưa có dữ liệu xếp hạng tỉnh thành.'}
              </div>
            ) : (
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50/80 border-b border-slate-100 text-slate-500 font-bold uppercase tracking-wider text-[10px]">
                  <tr>
                    <th className="py-3.5 px-4 w-36 text-center">Thứ hạng</th>
                    <th className="py-3.5 px-4">Tỉnh / Thành Phố</th>
                    <th className="py-3.5 px-4">Vùng Miền</th>
                    <th className="py-3.5 px-4 text-center">Tổng Địa Điểm</th>
                    <th className="py-3.5 px-4 text-center">Tổng Đánh Giá</th>
                    <th className="py-3.5 px-4 text-center">Điểm TB</th>
                    <th className="py-3.5 px-4 text-right">Thuật toán Score</th>
                    <th className="py-3.5 px-4 text-center w-36">Điều khiển / Thao tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {displayedProvinces.map((prov) => {
                    const scoreKey = `prov-score-${prov.id}`;
                    const pinKey = `prov-pin-${prov.id}`;
                    const isScoreOpen = activeScorePopoverId === scoreKey;
                    const isPinOpen = activePinMenuId === pinKey;

                    const ratingPts = Number(prov.ratingScore ?? 0).toFixed(1);
                    const reviewPts = Number(prov.reviewScore ?? 0).toFixed(1);
                    const placePts = Number(prov.placeCoverageScore ?? 0).toFixed(1);
                    const totalScore = Number(prov.score ?? 0).toFixed(1);

                    return (
                      <tr
                        key={prov.id}
                        className={`hover:bg-slate-50/80 transition-colors group ${prov.pinnedRank ? 'bg-amber-50/30' : ''
                          }`}
                      >
                        <td className="py-3 px-4 text-center">
                          {prov.isExcluded ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
                              <Ban className="w-3 h-3" />
                              <span>Đã loại trừ</span>
                            </span>
                          ) : (
                            <div className="flex flex-col items-center gap-1">
                              <div className="inline-flex items-center justify-center gap-1.5 whitespace-nowrap">
                                <LeaderboardBadge
                                  rank={prov.rank}
                                  badge={prov.badge}
                                  size="sm"
                                />
                                {renderRankTrendBadge(prov.rankDelta, prov.isNewTrend)}
                              </div>
                              {prov.pinnedRank && (
                                <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-bold bg-amber-100 text-amber-800 border border-amber-300">
                                  <Pin className="w-2.5 h-2.5" />
                                  <span>GHIM TOP {prov.pinnedRank}</span>
                                </span>
                              )}
                            </div>
                          )}
                        </td>

                        <td className="py-3 px-4">
                          <div className="flex items-center gap-3">
                            {prov.imageUrl ? (
                              <img
                                src={prov.imageUrl}
                                alt={prov.name}
                                className="w-10 h-10 rounded-lg object-cover bg-slate-100 shrink-0 border border-slate-200/60"
                                onError={(e) => {
                                  const target = e.currentTarget;
                                  target.onerror = null;
                                  target.style.display = 'none';
                                }}
                              />
                            ) : (
                              <div className="w-10 h-10 rounded-lg bg-slate-100 shrink-0 border border-slate-200/60 flex items-center justify-center text-slate-400">
                                <MapPin className="w-4 h-4" />
                              </div>
                            )}
                            <div>
                              <span className="font-bold text-slate-900 group-hover:text-emerald-700 transition-colors block">
                                {prov.name}
                              </span>
                              <span className="text-[11px] text-slate-400 truncate max-w-xs block">
                                {prov.tagline || 'Điểm đến du lịch hấp dẫn'}
                              </span>
                            </div>
                          </div>
                        </td>

                        <td className="py-3 px-4 text-slate-600 font-medium">
                          {prov.regionName}
                        </td>

                        <td className="py-3 px-4 text-center text-slate-700 font-semibold">
                          {prov.totalPlaces}
                        </td>

                        <td className="py-3 px-4 text-center text-slate-600">
                          {prov.totalReviews}
                        </td>

                        <td className="py-3 px-4 text-center">
                          <div className="inline-flex items-center gap-1 font-bold text-slate-900">
                            <Star className="w-3 h-3 text-amber-500 fill-amber-500" />
                            <span>{Number(prov.avgRating).toFixed(1)}</span>
                          </div>
                        </td>

                        <td className="py-3 px-4 text-right relative">
                          <div className="inline-block relative group/score">
                            <button
                              type="button"
                              onClick={() =>
                                setActiveScorePopoverId(isScoreOpen ? null : scoreKey)
                              }
                              title={`Điểm sao: ${ratingPts}đ + Đánh giá: ${reviewPts}đ + Độ phủ địa điểm: ${placePts}đ = ${totalScore} pts`}
                              className="inline-flex items-center gap-1 font-mono font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 px-2.5 py-1 rounded-lg border border-emerald-200/80 transition-colors cursor-pointer"
                            >
                              <span>{totalScore} pts</span>
                              <Info className="w-3 h-3 text-emerald-600/80" />
                            </button>

                            <div
                              className={`z-30 w-64 p-3 rounded-xl bg-slate-900 text-white text-[11px] shadow-xl border border-slate-700 text-left right-0 bottom-full mb-2 transition-all ${isScoreOpen
                                ? 'block absolute'
                                : 'hidden group-hover/score:block absolute pointer-events-none'
                                }`}
                            >
                              <div className="font-bold text-emerald-400 pb-1.5 mb-1.5 border-b border-slate-700/80 flex items-center justify-between">
                                <span>Chi tiết điểm Tỉnh/Thành</span>
                                <span>{totalScore} pts</span>
                              </div>
                              <div className="space-y-1 text-slate-300 font-sans">
                                <div className="flex justify-between">
                                  <span>• Điểm TB ({Number(prov.avgRating).toFixed(1)}★):</span>
                                  <strong className="text-white font-mono">+{ratingPts}đ</strong>
                                </div>
                                <div className="flex justify-between">
                                  <span>• Tổng đánh giá ({prov.totalReviews}):</span>
                                  <strong className="text-white font-mono">+{reviewPts}đ</strong>
                                </div>
                                <div className="flex justify-between">
                                  <span>• Độ phủ địa điểm ({prov.totalPlaces}):</span>
                                  <strong className="text-white font-mono">+{placePts}đ</strong>
                                </div>
                              </div>
                              <div className="mt-2 pt-1.5 border-t border-slate-700/80 text-[10px] text-emerald-300 font-mono">
                                {ratingPts}đ + {reviewPts}đ + {placePts}đ = {totalScore} pts
                              </div>
                            </div>
                          </div>
                        </td>

                        <td className="py-3 px-4 text-center relative">
                          <div className="inline-flex items-center justify-center gap-1">
                            <button
                              type="button"
                              onClick={() =>
                                setActiveScorePopoverId(isScoreOpen ? null : scoreKey)
                              }
                              className={`p-1.5 rounded-lg transition-colors cursor-pointer ${isScoreOpen
                                ? 'bg-emerald-100 text-emerald-800'
                                : 'text-slate-400 hover:text-emerald-700 hover:bg-emerald-50'
                                }`}
                              title="Xem chi tiết công thức điểm"
                            >
                              <Info className="w-3.5 h-3.5" />
                            </button>

                            {!prov.isExcluded && (
                              <div className="relative">
                                <button
                                  type="button"
                                  disabled={isSavingConfig}
                                  onClick={() =>
                                    setActivePinMenuId(isPinOpen ? null : pinKey)
                                  }
                                  className={`p-1.5 rounded-lg transition-colors cursor-pointer disabled:opacity-50 ${prov.pinnedRank
                                    ? 'bg-amber-100 text-amber-800 border border-amber-300'
                                    : 'text-slate-400 hover:text-amber-700 hover:bg-amber-50'
                                    }`}
                                  title="Ghim cố định thứ hạng Tỉnh/Thành"
                                >
                                  <Pin className="w-3.5 h-3.5" />
                                </button>

                                {isPinOpen && (
                                  <div className="absolute right-0 top-full mt-1 z-40 w-44 bg-white rounded-xl shadow-xl border border-slate-200 p-1.5 text-left space-y-1">
                                    <div className="px-2 py-1 text-[10px] font-bold text-slate-400 uppercase">
                                      Ghim ưu tiên BXH
                                    </div>
                                    {[1, 2, 3].map((r) => (
                                      <button
                                        key={r}
                                        type="button"
                                        onClick={() => handlePinProvince(prov, r)}
                                        className={`w-full px-2.5 py-1.5 rounded-lg text-xs font-semibold flex items-center justify-between cursor-pointer ${prov.pinnedRank === r
                                          ? 'bg-amber-50 text-amber-800 font-bold'
                                          : 'text-slate-700 hover:bg-slate-50'
                                          }`}
                                      >
                                        <span>📌 Ghim vào TOP {r}</span>
                                        {prov.pinnedRank === r && <Check className="w-3.5 h-3.5" />}
                                      </button>
                                    ))}
                                    {prov.pinnedRank && (
                                      <button
                                        type="button"
                                        onClick={() => handlePinProvince(prov, null)}
                                        className="w-full px-2.5 py-1.5 rounded-lg text-xs font-semibold text-rose-600 hover:bg-rose-50 flex items-center gap-1.5 cursor-pointer border-t border-slate-100 pt-1.5"
                                      >
                                        <X className="w-3.5 h-3.5" />
                                        <span>Gỡ ghim thứ hạng</span>
                                      </button>
                                    )}
                                  </div>
                                )}
                              </div>
                            )}

                            <button
                              type="button"
                              disabled={isSavingConfig}
                              onClick={() => handleToggleExcludeProvince(prov)}
                              className={`p-1.5 rounded-lg transition-colors cursor-pointer disabled:opacity-50 ${prov.isExcluded
                                ? 'bg-emerald-600 hover:bg-emerald-700 text-white px-2.5 py-1 text-[11px] font-bold inline-flex items-center gap-1'
                                : 'text-slate-400 hover:text-rose-600 hover:bg-rose-50'
                                }`}
                              title={
                                prov.isExcluded
                                  ? 'Khôi phục vào Bảng xếp hạng'
                                  : 'Loại khỏi Bảng xếp hạng'
                              }
                            >
                              {prov.isExcluded ? (
                                <>
                                  <RotateCcw className="w-3 h-3" />
                                  <span>Khôi phục</span>
                                </>
                              ) : (
                                <Ban className="w-3.5 h-3.5" />
                              )}
                            </button>

                            <a
                              href={`/provinces/${prov.id}`}
                              target="_blank"
                              rel="noreferrer"
                              className="p-1.5 rounded-lg text-slate-400 hover:text-emerald-700 hover:bg-emerald-50 transition-colors inline-flex items-center justify-center cursor-pointer"
                              title="Xem trang tỉnh thành"
                            >
                              <ExternalLink className="w-3.5 h-3.5" />
                            </a>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )
          )}
        </div>
      </div>

      {isWeightsModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl max-w-xl w-full p-6 shadow-2xl border border-slate-100 space-y-5">
            <div className="flex items-start justify-between gap-3 border-b border-slate-100 pb-4">
              <div className="flex items-center gap-3">
                <div>
                  <h3 className="font-bold text-base text-slate-900">
                    Cấu hình trọng số thuật toán xếp hạng
                  </h3>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsWeightsModalOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 space-y-2">
                  <div className="flex items-center justify-between text-xs font-bold text-slate-800">
                    <span>1. Điểm đánh giá (Rating)</span>
                    <span className="text-emerald-700">{draftConfig.ratingPct}%</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="flex-1">
                      <label className="text-[10px] text-slate-500 block mb-1">Tỷ trọng (%)</label>
                      <input
                        type="number"
                        min={0}
                        max={100}
                        value={draftConfig.ratingPct}
                        onChange={(e) =>
                          setDraftConfig((prev) => ({
                            ...prev,
                            ratingPct: Number(e.target.value),
                          }))
                        }
                        className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-bold text-slate-900"
                      />
                    </div>
                    <div className="w-24">
                      <label className="text-[10px] text-slate-500 block mb-1">Hệ số nhân</label>
                      <input
                        type="number"
                        step="0.5"
                        min={0}
                        value={draftConfig.ratingMultiplier}
                        onChange={(e) =>
                          setDraftConfig((prev) => ({
                            ...prev,
                            ratingMultiplier: Number(e.target.value),
                          }))
                        }
                        className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-mono font-bold text-slate-900"
                      />
                    </div>
                  </div>
                </div>

                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 space-y-2">
                  <div className="flex items-center justify-between text-xs font-bold text-slate-800">
                    <span>2. Lượt đánh giá (Reviews)</span>
                    <span className="text-emerald-700">{draftConfig.reviewPct}%</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="flex-1">
                      <label className="text-[10px] text-slate-500 block mb-1">Tỷ trọng (%)</label>
                      <input
                        type="number"
                        min={0}
                        max={100}
                        value={draftConfig.reviewPct}
                        onChange={(e) =>
                          setDraftConfig((prev) => ({
                            ...prev,
                            reviewPct: Number(e.target.value),
                          }))
                        }
                        className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-bold text-slate-900"
                      />
                    </div>
                    <div className="w-24">
                      <label className="text-[10px] text-slate-500 block mb-1">Hệ số nhân</label>
                      <input
                        type="number"
                        step="0.1"
                        min={0}
                        value={draftConfig.reviewMultiplier}
                        onChange={(e) =>
                          setDraftConfig((prev) => ({
                            ...prev,
                            reviewMultiplier: Number(e.target.value),
                          }))
                        }
                        className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-mono font-bold text-slate-900"
                      />
                    </div>
                  </div>
                </div>

                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 space-y-2">
                  <div className="flex items-center justify-between text-xs font-bold text-slate-800">
                    <span>3. Lượt xem (Views)</span>
                    <span className="text-emerald-700">{draftConfig.viewPct}%</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="flex-1">
                      <label className="text-[10px] text-slate-500 block mb-1">Tỷ trọng (%)</label>
                      <input
                        type="number"
                        min={0}
                        max={100}
                        value={draftConfig.viewPct}
                        onChange={(e) =>
                          setDraftConfig((prev) => ({
                            ...prev,
                            viewPct: Number(e.target.value),
                          }))
                        }
                        className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-bold text-slate-900"
                      />
                    </div>
                    <div className="w-24">
                      <label className="text-[10px] text-slate-500 block mb-1">Hệ số nhân</label>
                      <input
                        type="number"
                        step="0.005"
                        min={0}
                        value={draftConfig.viewMultiplier}
                        onChange={(e) =>
                          setDraftConfig((prev) => ({
                            ...prev,
                            viewMultiplier: Number(e.target.value),
                          }))
                        }
                        className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-mono font-bold text-slate-900"
                      />
                    </div>
                  </div>
                </div>

                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 space-y-2">
                  <div className="flex items-center justify-between text-xs font-bold text-slate-800">
                    <span>4. Yêu thích (Favorites)</span>
                    <span className="text-emerald-700">{draftConfig.favoritePct}%</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="flex-1">
                      <label className="text-[10px] text-slate-500 block mb-1">Tỷ trọng (%)</label>
                      <input
                        type="number"
                        min={0}
                        max={100}
                        value={draftConfig.favoritePct}
                        onChange={(e) =>
                          setDraftConfig((prev) => ({
                            ...prev,
                            favoritePct: Number(e.target.value),
                          }))
                        }
                        className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-bold text-slate-900"
                      />
                    </div>
                    <div className="w-24">
                      <label className="text-[10px] text-slate-500 block mb-1">Hệ số nhân</label>
                      <input
                        type="number"
                        step="0.5"
                        min={0}
                        value={draftConfig.favoriteMultiplier}
                        onChange={(e) =>
                          setDraftConfig((prev) => ({
                            ...prev,
                            favoriteMultiplier: Number(e.target.value),
                          }))
                        }
                        className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-mono font-bold text-slate-900"
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="p-4 rounded-xl bg-amber-50/60 border border-amber-200/80 space-y-2">
                <div className="text-xs font-bold text-slate-900">
                  Điều kiện tối thiểu
                </div>
                <p className="text-[11px] text-slate-600">
                  Ngăn chặn tình trạng địa điểm mới mở chỉ có 1 người chấm 5.0 sao vượt mặt địa điểm nổi tiếng có hàng trăm đánh giá 4.8 sao:
                </p>
                <div className="flex flex-wrap items-center gap-4 pt-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-slate-700 font-medium">Số đánh giá tối thiểu ≥</span>
                    <input
                      type="number"
                      min={0}
                      max={100}
                      value={draftConfig.minReviews}
                      onChange={(e) =>
                        setDraftConfig((prev) => ({
                          ...prev,
                          minReviews: Math.max(0, Number(e.target.value)),
                        }))
                      }
                      className="w-20 px-2.5 py-1 bg-white border border-amber-300 rounded-lg text-xs font-bold text-slate-900 text-center"
                    />
                    <span className="text-xs text-slate-600">đánh giá</span>
                  </div>
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-100/80 text-emerald-800 text-[11px] font-bold">
                    <Check className="w-3 h-3" />
                    <span>Bắt buộc trạng thái công khai</span>
                  </span>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={handleResetDefaultWeights}
                className="px-3 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors cursor-pointer"
              >
                Khôi phục mặc định
              </button>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsWeightsModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 hover:bg-slate-50 text-xs font-semibold text-slate-700 transition-colors cursor-pointer"
                >
                  Hủy
                </button>
                <button
                  type="button"
                  onClick={handleSaveWeights}
                  disabled={isSavingConfig}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-sm transition-all cursor-pointer disabled:opacity-50"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>Lưu</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {isConfirmRecalcOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-100 space-y-4">
            <div className="flex items-center gap-3 text-emerald-700">
              <span className="p-2.5 rounded-xl bg-emerald-50 border border-emerald-200/60">
                <Zap className="w-6 h-6" />
              </span>
              <div>
                <h3 className="font-bold text-base text-slate-900">
                  Đồng bộ & Tính toán lại Bảng Xếp Hạng?
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Lưu Snapshot kỳ hiện tại, giải phóng Redis cache & tính lại điểm số mới nhất
                </p>
              </div>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed bg-slate-50 p-3.5 rounded-xl border border-slate-200/60">
              Hệ thống sẽ lưu lại thứ hạng hiện tại vào cơ sở dữ liệu để đối chiếu biến động thứ hạng (Rank Trend), xóa bộ nhớ đệm và tính toán lại toàn bộ điểm số xếp hạng của các Địa điểm và Tỉnh thành.
            </p>

            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setIsConfirmRecalcOpen(false)}
                disabled={isRecalculating}
                className="px-4 py-2 rounded-xl border border-slate-200 hover:bg-slate-50 text-xs font-semibold text-slate-700 transition-colors cursor-pointer"
              >
                Hủy bỏ
              </button>
              <button
                type="button"
                onClick={handleRecalculateRanking}
                disabled={isRecalculating}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-all shadow-sm shadow-emerald-600/25 cursor-pointer disabled:opacity-50"
              >
                {isRecalculating ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Đang tính toán lại...</span>
                  </>
                ) : (
                  <>
                    <Zap className="w-3.5 h-3.5" />
                    <span>Xác nhận Tính toán lại</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RankingsTab;
