import React, { useState, useEffect } from 'react';
import {
  RefreshCw,
  Database,
  Search,
  ExternalLink,
  AlertTriangle,
  Star,
} from 'lucide-react';
import { rankingService } from '@/services/rankingService';
import { geographyService, type ProvinceDto } from '@/services/geographyService';
import { LeaderboardBadge } from '@/components/rankings/LeaderboardBadge';
import { CustomSelect } from '@/components/common/CustomSelect';
import { isUserSystemAdmin } from '@/utils/authUtils';
import type {
  PlaceRankingItem,
  ProvinceRankingItem,
} from '@/types/ranking';

interface RankingsTabProps {
  showToast?: (msg: string) => void;
}

export const RankingsTab: React.FC<RankingsTabProps> = ({ showToast }) => {
  const isSystemAdmin = isUserSystemAdmin();

  const [activeView, setActiveView] = useState<'places' | 'provinces'>('places');
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const [isClearingCache, setIsClearingCache] = useState<boolean>(false);
  const [isConfirmClearOpen, setIsConfirmClearOpen] = useState<boolean>(false);

  const [placeList, setPlaceList] = useState<PlaceRankingItem[]>([]);
  const [provinceList, setProvinceList] = useState<ProvinceRankingItem[]>([]);
  const [provincesCatalog, setProvincesCatalog] = useState<ProvinceDto[]>([]);

  const [placeTypeFilter, setPlaceTypeFilter] = useState<string>('all');
  const [provinceFilter, setProvinceFilter] = useState<string>('all');
  const [periodFilter, setPeriodFilter] = useState<string>('all_time');
  const [searchKeyword, setSearchKeyword] = useState<string>('');

  const notify = (msg: string) => {
    if (showToast) showToast(msg);
    else alert(msg);
  };

  useEffect(() => {
    const fetchCatalog = async () => {
      try {
        const res = await geographyService.getProvinces();
        if (res?.data) {
          setProvincesCatalog(res.data);
        }
      } catch (err) {
        console.error('Lỗi khi nạp danh sách tỉnh thành:', err);
      }
    };
    fetchCatalog();
  }, []);

  const loadRankingData = async () => {
    setIsLoading(true);
    try {
      if (activeView === 'places') {
        const params: Record<string, any> = {
          limit: 30,
          period: periodFilter,
        };
        if (placeTypeFilter !== 'all') params.placeTypeId = Number(placeTypeFilter);
        if (provinceFilter !== 'all') params.provinceId = Number(provinceFilter);
        const data = await rankingService.getPlaceRankings(params);
        setPlaceList(data);
      } else if (activeView === 'provinces') {
        const data = await rankingService.getProvinceRankings({ limit: 30 });
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

  const handleClearCache = async () => {
    setIsClearingCache(true);
    try {
      const success = await rankingService.clearRankingCache();
      if (success) {
        notify('Đã xóa bộ nhớ đệm Redis và ép tính toán lại bảng xếp hạng thành công!');
        setIsConfirmClearOpen(false);
        await loadRankingData();
      } else {
        notify('Yêu cầu xóa cache không thành công. Vui lòng thử lại.');
      }
    } catch (err: any) {
      console.error('Lỗi xóa cache:', err);
      const errMsg = err?.response?.data?.message || 'Lỗi khi gọi API xóa cache.';
      notify(`Thao tác thất bại: ${errMsg}`);
    } finally {
      setIsClearingCache(false);
    }
  };

  const filteredPlaces = placeList.filter((p) => {
    if (!searchKeyword.trim()) return true;
    const kw = searchKeyword.toLowerCase();
    return (
      p.name.toLowerCase().includes(kw) ||
      p.provinceName.toLowerCase().includes(kw) ||
      p.categoryName?.toLowerCase().includes(kw)
    );
  });

  const filteredProvinces = provinceList.filter((p) => {
    if (!searchKeyword.trim()) return true;
    const kw = searchKeyword.toLowerCase();
    return (
      p.name.toLowerCase().includes(kw) ||
      (p.regionName && p.regionName.toLowerCase().includes(kw))
    );
  });

  return (
    <div className="space-y-6 pb-12 animate-in fade-in duration-200">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-2xs">
        <div className="flex items-center gap-3">
          <button
            onClick={() => loadRankingData()}
            disabled={isLoading}
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl border border-slate-200 hover:bg-slate-50 text-xs font-semibold text-slate-700 transition-colors cursor-pointer disabled:opacity-50"
            title="Tải lại danh sách"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            <span>Tải lại</span>
          </button>

          {isSystemAdmin && (
            <button
              onClick={() => setIsConfirmClearOpen(true)}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-sm shadow-emerald-600/20 transition-all cursor-pointer hover:shadow-md"
            >
              <Database className="w-3.5 h-3.5" />
              <span>Xóa Cache</span>
            </button>
          )}
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-2xs overflow-hidden">
        <div className="p-4 sm:p-5 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center p-1 bg-slate-100 rounded-xl w-fit">
            <button
              onClick={() => setActiveView('places')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${activeView === 'places'
                ? 'bg-white text-emerald-800 shadow-2xs'
                : 'text-slate-600 hover:text-slate-900'
                }`}
            >
              Top Địa Điểm
            </button>
            <button
              onClick={() => setActiveView('provinces')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${activeView === 'provinces'
                ? 'bg-white text-emerald-800 shadow-2xs'
                : 'text-slate-600 hover:text-slate-900'
                }`}
            >
              Top Tỉnh Thành
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
            /* PLACES TABLE */
            filteredPlaces.length === 0 ? (
              <div className="py-16 text-center text-xs text-slate-400">
                Không có địa điểm nào phù hợp với bộ lọc hiện tại.
              </div>
            ) : (
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50/80 border-b border-slate-100 text-slate-500 font-bold uppercase tracking-wider text-[10px]">
                  <tr>
                    <th className="py-3.5 px-4 w-16 text-center">Thứ hạng</th>
                    <th className="py-3.5 px-4">Địa điểm</th>
                    <th className="py-3.5 px-4">Tỉnh / Thành</th>
                    <th className="py-3.5 px-4">Phân loại</th>
                    <th className="py-3.5 px-4 text-center">Đánh giá</th>
                    <th className="py-3.5 px-4 text-center">Lượt xem</th>
                    <th className="py-3.5 px-4 text-center">Yêu thích</th>
                    <th className="py-3.5 px-4 text-right">Thuật toán Score</th>
                    <th className="py-3.5 px-4 text-center w-20">Chi tiết</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredPlaces.map((place) => (
                    <tr
                      key={place.id}
                      className="hover:bg-slate-50/80 transition-colors group"
                    >
                      <td className="py-3 px-4 text-center">
                        <LeaderboardBadge rank={place.rank} badge={place.badge} size="sm" />
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <img
                            src={place.thumbnailUrl || '/placeholder.png'}
                            alt={place.name}
                            className="w-10 h-10 rounded-lg object-cover bg-slate-100 shrink-0 border border-slate-200/60"
                            onError={(e) => {
                              (e.target as HTMLImageElement).src = '/placeholder.png';
                            }}
                          />
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
                      <td className="py-3 px-4 text-right">
                        <span className="font-mono font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200/60">
                          {Number(place.score).toFixed(1)} pts
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <a
                          href={`/places/${place.id}`}
                          target="_blank"
                          rel="noreferrer"
                          className="p-1.5 rounded-lg text-slate-400 hover:text-emerald-700 hover:bg-emerald-50 transition-colors inline-flex items-center justify-center cursor-pointer"
                          title="Xem trang chi tiết"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                        </a>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )
          ) : (
            /* PROVINCES TABLE */
            filteredProvinces.length === 0 ? (
              <div className="py-16 text-center text-xs text-slate-400">
                {searchKeyword.trim() ? 'Không tìm thấy tỉnh thành nào phù hợp với từ khóa.' : 'Chưa có dữ liệu xếp hạng tỉnh thành.'}
              </div>
            ) : (
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50/80 border-b border-slate-100 text-slate-500 font-bold uppercase tracking-wider text-[10px]">
                  <tr>
                    <th className="py-3.5 px-4 w-16 text-center">Thứ hạng</th>
                    <th className="py-3.5 px-4">Tỉnh / Thành Phố</th>
                    <th className="py-3.5 px-4">Vùng Miền</th>
                    <th className="py-3.5 px-4 text-center">Tổng Địa Điểm</th>
                    <th className="py-3.5 px-4 text-center">Tổng Đánh Giá</th>
                    <th className="py-3.5 px-4 text-center">Điểm TB</th>
                    <th className="py-3.5 px-4 text-right">Thuật toán Score</th>
                    <th className="py-3.5 px-4 text-center w-20">Chi tiết</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredProvinces.map((prov) => (
                    <tr
                      key={prov.id}
                      className="hover:bg-slate-50/80 transition-colors group"
                    >
                      <td className="py-3 px-4 text-center">
                        <LeaderboardBadge rank={prov.rank} badge={prov.badge} size="sm" />
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <img
                            src={prov.imageUrl || '/placeholder.png'}
                            alt={prov.name}
                            className="w-10 h-10 rounded-lg object-cover bg-slate-100 shrink-0 border border-slate-200/60"
                            onError={(e) => {
                              (e.target as HTMLImageElement).src = '/placeholder.png';
                            }}
                          />
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
                      <td className="py-3 px-4 text-right">
                        <span className="font-mono font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200/60">
                          {Number(prov.score).toFixed(1)} pts
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <a
                          href={`/provinces/${prov.id}`}
                          target="_blank"
                          rel="noreferrer"
                          className="p-1.5 rounded-lg text-slate-400 hover:text-emerald-700 hover:bg-emerald-50 transition-colors inline-flex items-center justify-center cursor-pointer"
                          title="Xem trang tỉnh thành"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                        </a>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )
          )}
        </div>
      </div>

      {isConfirmClearOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-100 space-y-4">
            <div className="flex items-center gap-3 text-amber-600">
              <span className="p-2.5 rounded-xl bg-amber-50 border border-amber-200/60">
                <AlertTriangle className="w-6 h-6" />
              </span>
              <div>
                <h3 className="font-bold text-base text-slate-900">
                  Xác nhận xóa bộ nhớ đệm Bảng Xếp Hạng?
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Thao tác sẽ giải phóng toàn bộ Redis cache <code className="font-mono text-emerald-700 font-semibold">rank:*</code>
                </p>
              </div>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed bg-slate-50 p-3.5 rounded-xl border border-slate-200/60">
              Hệ thống sẽ xóa ngay lập tức mọi dữ liệu xếp hạng đang lưu trong RAM. Lần truy vấn kế tiếp của người dùng hoặc hệ thống sẽ tính toán lại toàn bộ điểm số mới nhất từ cơ sở dữ liệu.
            </p>

            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setIsConfirmClearOpen(false)}
                disabled={isClearingCache}
                className="px-4 py-2 rounded-xl border border-slate-200 hover:bg-slate-50 text-xs font-semibold text-slate-700 transition-colors cursor-pointer"
              >
                Hủy bỏ
              </button>
              <button
                type="button"
                onClick={handleClearCache}
                disabled={isClearingCache}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-all shadow-sm shadow-emerald-600/25 cursor-pointer disabled:opacity-50"
              >
                {isClearingCache ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Đang xóa...</span>
                  </>
                ) : (
                  <>
                    <Database className="w-3.5 h-3.5" />
                    <span>Xác nhận Xóa Cache</span>
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
