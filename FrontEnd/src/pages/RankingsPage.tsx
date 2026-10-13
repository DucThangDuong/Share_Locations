import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  ChevronLeft,
  ChevronRight,
  AlertCircle,
  RefreshCw,
  Compass,
} from 'lucide-react';
import { rankingService } from '@/services/rankingService';
import { RankingPlaceCard } from '@/components/rankings/RankingPlaceCard';
import { DestinationRankCard } from '@/components/rankings/DestinationRankCard';
import { CustomSelect } from '@/components/common/CustomSelect';
import type {
  RankingOverviewData,
  RankingOverviewCategory,
  RankingDetailViewData,
  RankingDetailParams,
} from '@/types/ranking';

export const RankingsPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();

  const activeTab = searchParams.get('tab') === 'detail' ? 'detail' : 'overview';

  const currentType = (searchParams.get('type') as 'place' | 'province' | 'place_type') || 'place_type';
  const currentPlaceTypeId = searchParams.get('placeTypeId')
    ? Number(searchParams.get('placeTypeId'))
    : currentType === 'place_type'
      ? 1
      : undefined;
  const currentProvinceId = searchParams.get('provinceId')
    ? Number(searchParams.get('provinceId'))
    : undefined;
  const currentCategoryId = searchParams.get('categoryId')
    ? Number(searchParams.get('categoryId'))
    : undefined;
  const currentPage = searchParams.get('page') ? Number(searchParams.get('page')) : 1;
  const currentPageSize = 20;

  const [overviewData, setOverviewData] = useState<RankingOverviewData | null>(null);
  const [detailData, setDetailData] = useState<RankingDetailViewData | null>(null);

  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const loadOverview = async () => {
    setIsLoading(true);
    setErrorMessage(null);
    try {
      const data = await rankingService.getRankingOverview();
      if (!data || !data.categories?.length) {
        setErrorMessage('API /api/rankings/overview trả về danh sách rỗng.');
      } else {
        setOverviewData(data);
      }
    } catch (err: any) {
      console.error('Lỗi khi nạp Ranking Overview:', err);
      setErrorMessage(
        err?.response?.data?.message ||
        err?.message ||
        'Không thể kết nối đến máy chủ để lấy thông tin Trang Tổng.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  const loadDetail = async () => {
    setIsLoading(true);
    setErrorMessage(null);
    try {
      const params: RankingDetailParams = {
        type: currentType,
        page: currentPage,
        pageSize: currentPageSize,
      };
      const isSpecialCategory = currentType === 'place' || currentType === 'province';
      if (currentType === 'place_type' && currentPlaceTypeId) {
        params.placeTypeId = currentPlaceTypeId;
      }
      if (!isSpecialCategory) {
        if (currentProvinceId) {
          params.provinceId = currentProvinceId;
        }
        if (currentCategoryId) {
          params.categoryId = currentCategoryId;
        }
      }

      const data = await rankingService.getRankingDetail(params);
      if (!data) {
        setErrorMessage('API /api/rankings/detail không trả về dữ liệu.');
      } else {
        setDetailData(data);
      }
    } catch (err: any) {
      console.error('Lỗi khi nạp Ranking Detail:', err);
      setErrorMessage(
        err?.response?.data?.message ||
        err?.message ||
        'Không thể kết nối đến máy chủ để lấy chi tiết xếp hạng.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'overview') {
      loadOverview();
    } else {
      loadDetail();
    }
  }, [
    activeTab,
    currentType,
    currentPlaceTypeId,
    currentProvinceId,
    currentCategoryId,
    currentPage,
    currentPageSize,
  ]);

  const handleSelectCategory = (cat: RankingOverviewCategory) => {
    const nextParams = new URLSearchParams();
    nextParams.set('tab', 'detail');
    nextParams.set('type', cat.type);
    if (cat.type === 'place_type' && cat.placeTypeId) {
      nextParams.set('placeTypeId', String(cat.placeTypeId));
    }
    nextParams.set('page', '1');
    nextParams.set('pageSize', '20');
    setSearchParams(nextParams);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const updateDetailFilter = (newFilters: {
    provinceId?: number | 'all';
    categoryId?: number | 'all';
    page?: number;
    pageSize?: number;
  }) => {
    const next = new URLSearchParams(searchParams);
    next.set('tab', 'detail');
    next.set('type', currentType);
    if (currentType === 'place_type' && currentPlaceTypeId) {
      next.set('placeTypeId', String(currentPlaceTypeId));
    } else {
      next.delete('placeTypeId');
    }

    if (newFilters.provinceId !== undefined) {
      if (newFilters.provinceId === 'all') {
        next.delete('provinceId');
      } else {
        next.set('provinceId', String(newFilters.provinceId));
      }
      next.set('page', '1');
    }

    if (newFilters.categoryId !== undefined) {
      if (newFilters.categoryId === 'all') {
        next.delete('categoryId');
      } else {
        next.set('categoryId', String(newFilters.categoryId));
      }
      next.set('page', '1');
    }

    if (newFilters.page !== undefined) {
      next.set('page', String(newFilters.page));
    }

    if (newFilters.pageSize !== undefined) {
      next.set('pageSize', String(newFilters.pageSize));
      next.set('page', '1');
    }

    setSearchParams(next);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const hideFilters = currentType === 'place' || currentType === 'province';

  const isViewingProvinces = currentType === 'province' && !currentProvinceId;
  const hasContent = isViewingProvinces
    ? Boolean(detailData?.provinceItems && detailData.provinceItems.length > 0)
    : Boolean(detailData?.items && detailData.items.length > 0);

  return (
    <div className="min-h-screen bg-white text-slate-800 pb-24 font-sans selection:bg-emerald-100 selection:text-emerald-900">
      {activeTab === 'overview' && (
        <div className="max-w-4xl mx-auto px-4 sm:px-6 pt-10 pb-16 space-y-12">
          <div className="space-y-5">
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-black text-emerald-950 tracking-tight leading-tight">
              Bảng Xếp Hạng Du Lịch Xuất Sắc Nhất 2026
            </h1>

            <div className="space-y-4 text-slate-700 text-sm sm:text-base leading-relaxed font-normal">
              <p>
                {overviewData?.subtitle ||
                  "Hàng năm, chúng tôi tôn vinh những điểm đến, khách sạn, nhà hàng và hoạt động du lịch yêu thích nhất của du khách dựa trên các đánh giá thực tế được thu thập qua 12 tháng. Vì vậy, những người chiến thắng Giải thưởng Bảng Xếp Hạng Xuất Sắc Nhất được quyết định bởi chính bạn: những du khách thực thụ từ khắp mọi nơi, chia sẻ những trải nghiệm và câu chuyện chân thực nhất."}
              </p>
              <p>
                Những người chiến thắng năm 2026 là sự tôn vinh tất cả những chuyến đi đáng nhớ của
                chúng ta trong năm qua tất cả những vùng đất mới lạ chúng ta đã khám phá và tất cả
                những lần chúng ta nói "đồng ý" với những cuộc phiêu lưu mới. Chúng tôi sẽ lần lượt
                công bố danh sách đoạt giải theo từng hạng mục trong năm, hãy tiếp tục theo dõi để
                cập nhật các thông tin mới nhất.
              </p>
            </div>
          </div>

          {isLoading && !overviewData ? (
            <div className="p-16 flex flex-col items-center justify-center space-y-3">
              <div className="w-10 h-10 border-3 border-emerald-800 border-t-transparent rounded-full animate-spin" />
              <p className="text-xs text-slate-500 font-medium">
                Đang nạp dữ liệu bảng xếp hạng...
              </p>
            </div>
          ) : errorMessage && !overviewData ? (
            <div className="p-6 rounded-3xl bg-amber-50 border border-amber-200 text-amber-900 flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
              <div className="space-y-1 flex-1">
                <p className="font-bold text-sm">Không thể nạp dữ liệu Trang Tổng</p>
                <p className="text-xs">{errorMessage}</p>
                <button
                  onClick={loadOverview}
                  className="mt-2 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-600 text-white font-bold text-xs"
                >
                  <RefreshCw className="w-3.5 h-3.5" /> Thử lại
                </button>
              </div>
            </div>
          ) : (
            <>
              <div className="space-y-6">
                {overviewData?.categories.map((cat) => (
                  <div
                    key={cat.key}
                    onClick={() => handleSelectCategory(cat)}
                    className="group relative h-48 sm:h-56 md:h-64 w-full rounded-2xl overflow-hidden cursor-pointer shadow-xs hover:shadow-lg transition-all duration-300 bg-slate-900"
                  >
                    {cat.coverImageUrl && (
                      <img
                        src={cat.coverImageUrl}
                        alt={cat.vietnameseTitle || cat.title || 'Danh mục'}
                        className="w-full h-full object-cover opacity-90 group-hover:opacity-75 transition-opacity duration-300"
                        loading="lazy"
                      />
                    )}

                    <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/25 to-transparent pointer-events-none" />

                    <div className="absolute bottom-5 left-6 z-10 max-w-2xl">
                      <h3 className="text-2xl sm:text-3xl md:text-4xl font-black text-white tracking-tight drop-shadow-md">
                        {cat.vietnameseTitle || cat.title}
                      </h3>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      )}
      {activeTab === 'detail' && (
        <div className="max-w-4xl mx-auto px-4 sm:px-6 pt-6 pb-20 space-y-8">

          <div className="relative h-64 sm:h-80 md:h-96 w-full rounded-3xl overflow-hidden shadow-sm bg-slate-900">
            {detailData?.header.coverImageUrl && (
              <img
                src={detailData.header.coverImageUrl}
                alt={detailData.header.targetName || detailData.header.title || 'Banner xếp hạng'}
                className="w-full h-full object-cover opacity-90"
              />
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/25 to-transparent pointer-events-none" />

            <div className="absolute bottom-6 sm:bottom-8 left-6 sm:left-8 right-6 z-10 text-white space-y-1">
              <h1 className="text-2xl sm:text-3xl md:text-5xl font-black tracking-tight leading-tight drop-shadow-md">
                {detailData?.header.targetName || detailData?.header.title || 'Bảng xếp hạng'}
              </h1>
              {detailData?.header.subtitle && (
                <p className="text-xs sm:text-sm text-slate-200 line-clamp-2 max-w-2xl drop-shadow-sm font-normal">
                  {detailData.header.subtitle}
                </p>
              )}
            </div>
          </div>

          {!hideFilters && (
            <div className="space-y-4 pt-1">
              <div className="flex flex-wrap items-center gap-3">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider shrink-0">
                  Phạm vi:
                </span>
                <div className="w-52 sm:w-60">
                  <CustomSelect
                    value={currentProvinceId ? String(currentProvinceId) : 'all'}
                    onChange={(val) =>
                      updateDetailFilter({ provinceId: val === 'all' ? 'all' : Number(val) })
                    }
                    options={[
                      { value: 'all', label: 'Toàn quốc' },
                      ...(detailData?.availableProvinces?.map((p) => ({
                        value: String(p.id),
                        label: p.name,
                      })) || []),
                    ]}
                    placeholder="Chọn tỉnh thành..."
                    size="sm"
                  />
                </div>
              </div>

              {detailData?.subCategories && detailData.subCategories.length > 0 && (
                <div className="flex flex-wrap items-center gap-2 pt-1">
                  <button
                    onClick={() => updateDetailFilter({ categoryId: 'all' })}
                    className={`px-4 py-2 rounded-full text-xs font-bold transition-all cursor-pointer ${!currentCategoryId
                      ? 'bg-emerald-950 text-white shadow-xs'
                      : 'border border-slate-300 text-slate-700 hover:border-slate-400 hover:bg-slate-50'
                      }`}
                  >
                    Tất cả
                  </button>
                  {detailData.subCategories.map((sub) => {
                    const isActive = currentCategoryId === sub.id;
                    return (
                      <button
                        key={sub.id}
                        onClick={() => updateDetailFilter({ categoryId: sub.id })}
                        className={`px-4 py-2 rounded-full text-xs font-bold transition-all cursor-pointer ${isActive
                          ? 'bg-emerald-950 text-white shadow-xs'
                          : 'border border-slate-300 text-slate-700 hover:border-slate-400 hover:bg-slate-50'
                          }`}
                      >
                        <span>{sub.name}</span>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {isLoading ? (
            <div className="p-16 flex flex-col items-center justify-center space-y-3">
              <div className="w-10 h-10 border-3 border-emerald-800 border-t-transparent rounded-full animate-spin" />
              <p className="text-xs text-slate-500 font-medium">
                Đang nạp dữ liệu chi tiết...
              </p>
            </div>
          ) : errorMessage && !hasContent ? (
            <div className="p-8 rounded-3xl bg-amber-50 border border-amber-200 text-amber-900 space-y-3 text-center">
              <AlertCircle className="w-8 h-8 text-amber-600 mx-auto" />
              <div className="space-y-1">
                <p className="text-base font-bold">Không thể tải dữ liệu xếp hạng</p>
                <p className="text-xs text-amber-700">{errorMessage}</p>
              </div>
              <button
                onClick={loadDetail}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs transition-colors cursor-pointer"
              >
                <RefreshCw className="w-3.5 h-3.5" /> Thử lại
              </button>
            </div>
          ) : !hasContent ? (
            <div className="p-16 text-center bg-slate-50 rounded-3xl border border-dashed border-slate-200 text-slate-500 space-y-2">
              <Compass className="w-8 h-8 text-slate-400 mx-auto" />
              <p className="font-semibold text-sm">
                {isViewingProvinces
                  ? 'Chưa có dữ liệu xếp hạng tỉnh thành.'
                  : 'Không tìm thấy địa điểm nào phù hợp.'}
              </p>
              <p className="text-xs text-slate-400">
                {hideFilters
                  ? 'Vui lòng quay lại sau khi hệ thống cập nhật thêm dữ liệu xếp hạng.'
                  : 'Hãy thử chọn tỉnh thành hoặc danh mục con khác.'}
              </p>
            </div>
          ) : (
            <>
              {isViewingProvinces ? (
                <div className="space-y-10">
                  {detailData?.provinceItems?.map((prov) => (
                    <DestinationRankCard
                      key={prov.id}
                      destination={prov}
                      onSelectProvince={(id) => updateDetailFilter({ provinceId: id })}
                    />
                  ))}
                </div>
              ) : (
                <div className="space-y-10">
                  {detailData?.items?.map((place) => (
                    <RankingPlaceCard key={place.id} place={place} />
                  ))}
                </div>
              )}

              {detailData && detailData.totalPages > 1 && (
                <div className="pt-8 border-t border-slate-100 flex items-center justify-between">
                  <p className="text-xs text-slate-500">
                    Trang <span className="font-bold text-slate-800">{detailData.page}</span> /{' '}
                    <span>{detailData.totalPages}</span> (Tổng cộng{' '}
                    <span className="font-bold text-slate-800">{detailData.totalCount}</span>{' '}
                    {isViewingProvinces ? 'tỉnh thành' : 'địa điểm'})
                  </p>

                  <div className="flex items-center gap-2">
                    <button
                      disabled={detailData.page <= 1}
                      onClick={() => updateDetailFilter({ page: detailData.page - 1 })}
                      className="inline-flex items-center gap-1 px-3.5 py-2 rounded-xl border border-slate-200 bg-white text-xs font-bold text-slate-700 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                    >
                      <ChevronLeft className="w-4 h-4" />
                      <span>Trang trước</span>
                    </button>
                    <button
                      disabled={detailData.page >= detailData.totalPages}
                      onClick={() => updateDetailFilter({ page: detailData.page + 1 })}
                      className="inline-flex items-center gap-1 px-3.5 py-2 rounded-xl border border-slate-200 bg-white text-xs font-bold text-slate-700 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                    >
                      <span>Trang sau</span>
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
};

export default RankingsPage;
