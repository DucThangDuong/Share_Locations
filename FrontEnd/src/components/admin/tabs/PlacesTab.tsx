import React, { useMemo, useState, useEffect, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Search, Plus, Star, ChevronLeft, ChevronRight, Loader2, X } from "lucide-react";
import { PlaceDetailEditor } from "./PlaceDetailEditor";
import { geographyService } from "@/services/geographyService";
import { catalogService } from "@/services/catalogService";
import type { ProvinceDto } from "@/types/models/geography.model";
import type { PlaceTypeDto } from "@/types/models/place.model";

const DEFAULT_PROVINCES: ProvinceDto[] = [
  { id: 1, name: "Đà Nẵng", regionId: 2, regionName: "Miền Trung", featured: true, displayOrder: 1, placeCount: 150 },
  { id: 2, name: "Quảng Nam", regionId: 2, regionName: "Miền Trung", featured: false, displayOrder: 2, placeCount: 95 },
  { id: 3, name: "Thừa Thiên Huế", regionId: 2, regionName: "Miền Trung", featured: false, displayOrder: 3, placeCount: 80 },
  { id: 4, name: "Khánh Hòa", regionId: 3, regionName: "Nam Trung Bộ", featured: true, displayOrder: 4, placeCount: 110 },
  { id: 5, name: "Lâm Đồng", regionId: 3, regionName: "Tây Nguyên", featured: true, displayOrder: 5, placeCount: 130 },
  { id: 6, name: "Hà Nội", regionId: 1, regionName: "Miền Bắc", featured: true, displayOrder: 6, placeCount: 220 },
  { id: 7, name: "TP. Hồ Chí Minh", regionId: 4, regionName: "Miền Nam", featured: true, displayOrder: 7, placeCount: 260 },
];

const DEFAULT_CATEGORIES: PlaceTypeDto[] = [
  { id: 1, name: "Nhà hàng & Quán ăn" },
  { id: 2, name: "Cà phê & Trà sữa" },
  { id: 3, name: "Địa điểm tham quan" },
  { id: 4, name: "Khách sạn & Homestay" },
  { id: 5, name: "Giải trí & Trải nghiệm" },
  { id: 6, name: "Mua sắm & Đặc sản" },
];

interface PlacesTabProps {
  placesList: any[];
  isLoading?: boolean;
  pagination?: {
    page: number;
    pageSize: number;
    totalElements: number;
    totalPages: number;
  };
  onPageChange?: (page: number) => void;
  onFilterChange?: (filters: {
    keyword?: string;
    province?: string;
    category?: string;
    status?: string;
    page?: number;
    pageSize?: number;
  }) => void;
  selectedPlaceId: number | null;
  setSelectedPlaceId: (id: number | null) => void;
  placeSearchText: string;
  setPlaceSearchText: (v: string) => void;
  placeFilterProvince: string;
  setPlaceFilterProvince: (v: string) => void;
  placeFilterCategory?: string;
  setPlaceFilterCategory?: (v: string) => void;
  placeFilterStatus: string;
  setPlaceFilterStatus: (v: string) => void;
  setIsAddPlaceModalOpen: (v: boolean) => void;
  handleTogglePlaceStatus?: (id: number) => void;
  handleUpdatePlace?: (updatedPlace: any) => void;
}

export const PlacesTab: React.FC<PlacesTabProps> = ({
  placesList = [],
  isLoading = false,
  pagination = {
    page: 1,
    pageSize: 10,
    totalElements: placesList.length,
    totalPages: 1,
  },
  onPageChange,
  onFilterChange,
  selectedPlaceId,
  setSelectedPlaceId,
  placeSearchText,
  setPlaceSearchText,
  placeFilterProvince,
  setPlaceFilterProvince,
  placeFilterCategory: propFilterCategory,
  setPlaceFilterCategory: propSetFilterCategory,
  placeFilterStatus,
  setPlaceFilterStatus,
  setIsAddPlaceModalOpen,
  handleTogglePlaceStatus,
  handleUpdatePlace,
}) => {
  const navigate = useNavigate();
  const location = useLocation();

  const [localCategoryFilter, setLocalCategoryFilter] = useState("all");
  const categoryFilter = propFilterCategory ?? localCategoryFilter;
  const setCategoryFilter = propSetFilterCategory ?? setLocalCategoryFilter;

  const [provinces, setProvinces] = useState<ProvinceDto[]>(DEFAULT_PROVINCES);
  const [categories, setCategories] = useState<PlaceTypeDto[]>(DEFAULT_CATEGORIES);

  // Debounced Search calling API via onFilterChange
  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    let mounted = true;
    const loadMetadata = async () => {
      try {
        const [provRes, catRes] = await Promise.all([
          geographyService.getProvinces(),
          catalogService.getPlaceTypes(),
        ]);
        if (mounted) {
          if (provRes?.success && Array.isArray(provRes.data) && provRes.data.length > 0) {
            setProvinces(provRes.data);
          }
          if (catRes?.success && Array.isArray(catRes.data) && catRes.data.length > 0) {
            setCategories(catRes.data);
          }
        }
      } catch {
        // Fallback already assigned
      }
    };
    loadMetadata();
    return () => {
      mounted = false;
    };
  }, []);

  // Merge loaded provinces with any provinces present in placesList
  const allProvinces = useMemo(() => {
    const list: { id: string | number; name: string }[] = [...provinces];
    placesList.forEach((p) => {
      const pName = p.provinceName || p.province;
      if (pName && !list.some((pr) => pr.name.toLowerCase() === pName.toLowerCase())) {
        list.push({ id: p.provinceId || pName, name: pName });
      }
    });
    return list;
  }, [provinces, placesList]);

  // Merge loaded categories with any categories present in placesList
  const allCategories = useMemo(() => {
    const list: { id: string | number; name: string }[] = [...categories];
    placesList.forEach((p) => {
      const cName = p.categoryName || p.category;
      if (cName && !list.some((c) => c.name.toLowerCase() === cName.toLowerCase())) {
        list.push({ id: p.categoryId || cName, name: cName });
      }
    });
    return list;
  }, [categories, placesList]);

  const placePathMatch = location.pathname.match(/\/admin\/places\/(\d+)/i);
  const urlPlaceId = placePathMatch ? Number(placePathMatch[1]) : selectedPlaceId;

  const currentPlace = useMemo(() => {
    if (!urlPlaceId) return null;
    return placesList.find((p) => Number(p.id) === urlPlaceId) || null;
  }, [urlPlaceId, placesList]);

  // Handle Search input change with debounce to fetch from server
  const handleSearchChange = (value: string) => {
    setPlaceSearchText(value);
    if (onFilterChange) {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
      debounceTimerRef.current = setTimeout(() => {
        onFilterChange({ keyword: value, page: 1 });
      }, 350);
    }
  };

  const handleProvinceChange = (value: string) => {
    setPlaceFilterProvince(value);
    onFilterChange?.({ province: value, page: 1 });
  };

  const handleCategoryChange = (value: string) => {
    setCategoryFilter(value);
    onFilterChange?.({ category: value, page: 1 });
  };

  const handleStatusChange = (value: string) => {
    setPlaceFilterStatus(value);
    onFilterChange?.({ status: value, page: 1 });
  };

  if (currentPlace) {
    return (
      <PlaceDetailEditor
        place={currentPlace}
        onBack={() => {
          setSelectedPlaceId(null);
          navigate('/admin/places');
        }}
        onSave={(updatedPlace) => {
          if (handleUpdatePlace) {
            handleUpdatePlace(updatedPlace);
          }
        }}
        onToggleStatus={handleTogglePlaceStatus}
      />
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-150 text-xs">
      <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-2xs space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="relative flex-1 min-w-[240px]">
            <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Tìm kiếm theo tên địa điểm, địa chỉ..."
              value={placeSearchText}
              onChange={(e) => handleSearchChange(e.target.value)}
              className="w-full pl-9 pr-8 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-medium text-slate-800 placeholder:text-slate-400 focus:bg-white outline-none focus:border-emerald-500"
            />
            {placeSearchText && (
              <button
                type="button"
                onClick={() => handleSearchChange("")}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X size={14} />
              </button>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Bộ lọc Tỉnh thành */}
            <select
              value={placeFilterProvince}
              onChange={(e) => handleProvinceChange(e.target.value)}
              className="px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 font-medium text-slate-800 outline-none focus:border-emerald-500 text-xs cursor-pointer"
            >
              <option value="all">Tất cả tỉnh thành</option>
              {allProvinces.map((prov) => (
                <option key={prov.id || prov.name} value={prov.name}>
                  {prov.name}
                </option>
              ))}
            </select>

            {/* Bộ lọc Danh mục */}
            <select
              value={categoryFilter}
              onChange={(e) => handleCategoryChange(e.target.value)}
              className="px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 font-medium text-slate-800 outline-none focus:border-emerald-500 text-xs cursor-pointer"
            >
              <option value="all">Tất cả danh mục</option>
              {allCategories.map((cat) => (
                <option key={cat.id || cat.name} value={cat.name}>
                  {cat.name}
                </option>
              ))}
            </select>

            {/* Bộ lọc Trạng thái */}
            <select
              value={placeFilterStatus}
              onChange={(e) => handleStatusChange(e.target.value)}
              className="px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 font-medium text-slate-800 outline-none focus:border-emerald-500 text-xs cursor-pointer"
            >
              <option value="all">Tất cả trạng thái</option>
              <option value="active">Công khai</option>
              <option value="hidden">Đang ẩn</option>
            </select>

            <button
              type="button"
              onClick={() => setIsAddPlaceModalOpen(true)}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold cursor-pointer transition-all shadow-sm shadow-emerald-600/20 text-xs"
            >
              <Plus size={14} />
              <span>Thêm địa điểm</span>
            </button>
          </div>
        </div>

        {/* Places Table */}
        <div className="overflow-x-auto rounded-xl border border-slate-200/80">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-500 font-bold text-[11px] uppercase tracking-wider">
                <th className="p-3.5 pl-4">Địa điểm</th>
                <th className="p-3.5">Danh mục</th>
                <th className="p-3.5">Tỉnh / Thành</th>
                <th className="p-3.5">Trạng thái</th>
                <th className="p-3.5">Đánh giá</th>
                <th className="p-3.5 text-center">Xem chi tiết</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <Loader2 size={24} className="animate-spin text-emerald-600" />
                      <span>Đang tải danh sách địa điểm từ máy chủ...</span>
                    </div>
                  </td>
                </tr>
              ) : placesList.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400 font-medium">
                    Không tìm thấy địa điểm nào phù hợp với bộ lọc.
                  </td>
                </tr>
              ) : (
                placesList.map((p) => {
                  const isPlaceActive =
                    Number(p.statusNum ?? p.status) === 1 ||
                    String(p.status || "").toLowerCase() === "active" ||
                    p.status === "Công khai" ||
                    p.status === "Đang hiển thị" ||
                    p.status === "Đã duyệt";

                  return (
                    <tr key={p.id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="p-3.5 pl-4 font-bold text-slate-900">
                        <div className="flex items-center gap-3">
                          <img
                            src={p.img || p.thumbnailUrl || "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=600&h=400&fit=crop"}
                            className="w-10 h-10 rounded-lg object-cover border border-slate-200 shrink-0"
                            alt=""
                          />
                          <div>
                            <div className="font-bold text-slate-900">{p.name}</div>
                            <div className="text-[11px] text-slate-400 font-normal truncate max-w-xs">
                              {p.location || p.address}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="p-3.5 text-slate-700 font-medium">
                        {p.category || p.categoryName || "Nhà hàng & Quán ăn"}
                      </td>
                      <td className="p-3.5 text-slate-700 font-medium">{p.province}</td>
                      <td className="p-3.5">
                        <span
                          className={`inline-flex items-center justify-center px-3.5 py-1 rounded-xl text-xs font-bold border transition-colors ${isPlaceActive
                            ? "bg-[#e6fcf5] text-[#087f5b] border-[#63e6be]"
                            : "bg-slate-100 text-slate-700 border-slate-300"
                            }`}
                        >
                          {isPlaceActive ? "Công khai" : "Tạm ẩn"}
                        </span>
                      </td>
                      <td className="p-3.5">
                        <div className="flex items-center gap-1 font-bold text-amber-900">
                          <Star size={13} className="fill-amber-400 text-amber-400" />
                          <span>{p.rating || 4.8}</span>
                        </div>
                      </td>
                      <td className="p-3.5 text-center" onClick={(e) => e.stopPropagation()}>
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedPlaceId(p.id);
                            navigate(`/admin/places/${p.id}`);
                          }}
                          className="px-2.5 py-1 text-xs font-semibold text-emerald-700 hover:bg-emerald-50 rounded-lg transition-colors cursor-pointer"
                        >
                          Chi tiết →
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Bar (Driven by Server Meta) */}
        {pagination && pagination.totalElements > 0 && (
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-3 px-1 border-t border-slate-100 text-xs text-slate-500 font-medium">
            <div>
              Hiển thị <strong>{placesList.length}</strong> / <strong>{pagination.totalElements}</strong> địa điểm (Trang <strong>{pagination.page}</strong> / {pagination.totalPages || 1})
            </div>

            {pagination.totalPages > 1 && (
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  disabled={pagination.page <= 1 || isLoading}
                  onClick={() => onPageChange?.(pagination.page - 1)}
                  className="px-3 py-1.5 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed font-bold text-slate-700 transition-colors flex items-center gap-1 cursor-pointer"
                >
                  <ChevronLeft size={14} />
                  <span>Trước</span>
                </button>

                <div className="flex items-center gap-1">
                  {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
                    let pNum = pagination.page - 2 + i;
                    if (pagination.page <= 3) {
                      pNum = i + 1;
                    } else if (pagination.page >= pagination.totalPages - 2) {
                      pNum = pagination.totalPages - 4 + i;
                    }
                    if (pNum < 1 || pNum > pagination.totalPages) return null;

                    return (
                      <button
                        key={pNum}
                        type="button"
                        disabled={isLoading}
                        onClick={() => onPageChange?.(pNum)}
                        className={`w-7 h-7 rounded-xl font-bold text-xs transition-colors flex items-center justify-center cursor-pointer ${
                          pagination.page === pNum
                            ? "bg-emerald-700 text-white shadow-xs"
                            : "bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200"
                        }`}
                      >
                        {pNum}
                      </button>
                    );
                  })}
                </div>

                <button
                  type="button"
                  disabled={pagination.page >= pagination.totalPages || isLoading}
                  onClick={() => onPageChange?.(pagination.page + 1)}
                  className="px-3 py-1.5 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed font-bold text-slate-700 transition-colors flex items-center gap-1 cursor-pointer"
                >
                  <span>Sau</span>
                  <ChevronRight size={14} />
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default PlacesTab;
