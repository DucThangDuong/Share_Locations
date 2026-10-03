import React, { useState, useEffect, useMemo, useCallback, useRef } from "react";
import {
  Search,
  Plus,
  Trash2,
  ArrowUp,
  ArrowDown,
  RotateCcw,
  Loader2,
  UtensilsCrossed,
  MapPin,
  DollarSign,
  Check,
  X,
  ChevronLeft,
  ChevronRight,
  ImageIcon
} from "lucide-react";
import { adminService, extractList } from "@/services/adminService";
import { geographyService, type ProvinceDto } from "@/services/geographyService";
import type { AdminFoodItem } from "@/types/admin.types";

export interface AdminPlaceFoodDto {
  id: number;
  name: string;
  minPrice?: number | null;
  maxPrice?: number | null;
  coverImg?: string | null;
  coverImageUrl?: string | null;
  description?: string | null;
  desc?: string | null;
  status?: string;
  statusNum?: number;
  province?: string;
  provinceId?: number;
  specialtyType?: string;
}

interface PlaceAdminFoodsProps {
  placeId: number;
  placeName: string;
  placeProvinceId?: number;
  placeProvinceName?: string;
  associatedFoods?: AdminPlaceFoodDto[];
  onAssociatedFoodsChange?: (foods: AdminPlaceFoodDto[]) => void;
  onFoodsChange?: (foods: AdminPlaceFoodDto[]) => void;
  isLoadingAssociatedFoods?: boolean;
  initialFoods?: AdminPlaceFoodDto[];
  onFoodsCountChange?: (count: number) => void;
  showToast?: (msg: string) => void;
}

export const PlaceAdminFoods: React.FC<PlaceAdminFoodsProps> = ({
  placeId,
  placeName,
  placeProvinceId,
  placeProvinceName,
  associatedFoods: propAssociatedFoods,
  onAssociatedFoodsChange,
  onFoodsChange,
  isLoadingAssociatedFoods: propIsLoading,
  initialFoods,
  onFoodsCountChange,
  showToast,
}) => {
  const actualOnChange = onAssociatedFoodsChange || onFoodsChange;

  const actualOnChangeRef = useRef(actualOnChange);
  actualOnChangeRef.current = actualOnChange;
  const onFoodsCountChangeRef = useRef(onFoodsCountChange);
  onFoodsCountChangeRef.current = onFoodsCountChange;

  // Toast ref for stable notify
  const showToastRef = useRef(showToast);
  showToastRef.current = showToast;
  const notify = useCallback((msg: string) => {
    if (showToastRef.current) showToastRef.current(msg);
  }, []);

  // 1. Associated Foods State (Current Foods in this Place)
  const [localAssociatedFoods, setLocalAssociatedFoods] = useState<AdminPlaceFoodDto[]>(initialFoods || []);
  const [internalLoading, setInternalLoading] = useState(false);

  const associatedFoods = propAssociatedFoods ?? localAssociatedFoods;
  const isLoadingAssociatedFoods = propIsLoading ?? internalLoading;

  const setAssociatedFoods = useCallback(
    (nextList: AdminPlaceFoodDto[]) => {
      if (actualOnChangeRef.current) {
        actualOnChangeRef.current(nextList);
      } else {
        setLocalAssociatedFoods(nextList);
      }
    },
    []
  );

  // 2. Discover / Search Foods State
  const [availableFoods, setAvailableFoods] = useState<AdminFoodItem[]>([]);
  const [isLoadingAvailableFoods, setIsLoadingAvailableFoods] = useState(false);
  const [searchInput, setSearchInput] = useState("");
  const [searchKeyword, setSearchKeyword] = useState("");
  const [selectedProvince, setSelectedProvince] = useState<string>("all");
  const [selectedSpecialtyType, setSelectedSpecialtyType] = useState<string>("all");
  const [selectedStatus, setSelectedStatus] = useState<string>("all");
  const [selectedPriceRange, setSelectedPriceRange] = useState<string>("all");
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [totalElements, setTotalElements] = useState<number>(0);
  const [provincesList, setProvincesList] = useState<ProvinceDto[]>([]);

  // Fetch provinces for filter
  useEffect(() => {
    geographyService
      .getProvinces()
      .then((res) => {
        if (res.data && res.data.length > 0) {
          setProvincesList(res.data);
        }
      })
      .catch(() => { });
  }, []);

  // Load place detail to get initial linked foods (only if not provided via props)
  const fetchPlaceFoods = useCallback(async () => {
    if (!placeId) return;
    setInternalLoading(true);
    try {
      const res = await adminService.getPlace(placeId);
      const placeData = res?.data || res;
      if (placeData) {
        const rawFoods = (placeData as any).foods || (placeData as any).Foods || [];
        const mappedFoods: AdminPlaceFoodDto[] = rawFoods.map((f: any) => ({
          id: Number(f.id ?? f.Id),
          name: f.name ?? f.Name ?? "Món ăn đặc sản",
          minPrice: f.minPrice ?? f.MinPrice ?? null,
          maxPrice: f.maxPrice ?? f.MaxPrice ?? null,
          coverImg: f.coverImg ?? f.CoverImg ?? f.coverImageUrl ?? f.CoverImageUrl ?? "",
          coverImageUrl: f.coverImg ?? f.CoverImg ?? f.coverImageUrl ?? f.CoverImageUrl ?? "",
          description: f.description ?? f.Description ?? f.desc ?? f.Desc ?? "",
          desc: f.description ?? f.Description ?? f.desc ?? f.Desc ?? "",
          status: f.status ?? f.Status ?? "active",
          statusNum: f.statusNum ?? f.StatusNum ?? 1,
          province: f.province ?? f.Province ?? placeProvinceName ?? "",
          provinceId: f.provinceId ?? f.ProvinceId ?? placeProvinceId ?? undefined,
          specialtyType: f.specialtyType ?? f.SpecialtyType ?? ""
        }));
        setAssociatedFoods(mappedFoods);
        onFoodsCountChangeRef.current?.(mappedFoods.length);
      }
    } catch (err: any) {
      console.error("Error loading place foods:", err);
    } finally {
      setInternalLoading(false);
    }
  }, [placeId, placeProvinceId, placeProvinceName, setAssociatedFoods]);

  useEffect(() => {
    // If associatedFoods is passed from parent or already initialized, don't trigger re-fetching
    if (propAssociatedFoods !== undefined) return;
    if (initialFoods && initialFoods.length > 0) return;
    fetchPlaceFoods();
  }, [propAssociatedFoods, initialFoods, fetchPlaceFoods]);

  // Fetch available foods for picker
  const fetchAvailableFoods = useCallback(async () => {
    setIsLoadingAvailableFoods(true);
    try {
      const res = await adminService.getFoods({
        page: currentPage,
        pageSize: 12,
        keyword: searchKeyword || undefined,
        province: selectedProvince !== "all" ? selectedProvince : undefined,
      });

      const rawItems = extractList(res?.data || res);
      const mapped: AdminFoodItem[] = rawItems.map((f: any) => ({
        id: Number(f.id ?? f.Id),
        name: f.name ?? f.Name ?? "Món ăn",
        province: f.province ?? f.Province ?? f.provinceName ?? "",
        provinceId: f.provinceId ?? f.ProvinceId ?? undefined,
        coverImg: f.coverImg ?? f.CoverImg ?? f.imageUrl ?? f.ImageUrl ?? "",
        desc: f.desc ?? f.Desc ?? f.description ?? f.Description ?? "",
        description: f.desc ?? f.Desc ?? f.description ?? f.Description ?? "",
        historyInfo: f.historyInfo ?? f.HistoryInfo ?? "",
        minPrice: f.minPrice ?? f.MinPrice ?? undefined,
        maxPrice: f.maxPrice ?? f.MaxPrice ?? undefined,
        priceRange: f.priceRange ?? f.PriceRange ?? "",
        specialtyType: f.specialtyType ?? f.SpecialtyType ?? "",
        status: f.status ?? f.Status ?? "active",
        statusNum: f.statusNum ?? f.StatusNum ?? 1,
      }));

      setAvailableFoods(mapped);
      if ((res as any)?.total || (res as any)?.data?.total) {
        const total = Number((res as any)?.total || (res as any)?.data?.total || mapped.length);
        setTotalElements(total);
        setTotalPages(Math.ceil(total / 12) || 1);
      } else {
        setTotalElements(mapped.length);
        setTotalPages(1);
      }
    } catch (err: any) {
      console.error("Error fetching available foods:", err);
      setAvailableFoods([]);
    } finally {
      setIsLoadingAvailableFoods(false);
    }
  }, [currentPage, searchKeyword, selectedProvince]);

  useEffect(() => {
    fetchAvailableFoods();
  }, [fetchAvailableFoods]);

  // Set of linked Food IDs for instant check
  const associatedFoodIds = useMemo(() => {
    return new Set(associatedFoods.map((f) => f.id));
  }, [associatedFoods]);

  // Client-side filtering on available foods for specialty type, status, price
  const filteredAvailableFoods = useMemo(() => {
    return availableFoods.filter((f) => {
      // Specialty Type filter
      if (selectedSpecialtyType !== "all") {
        if ((f.specialtyType || "").toLowerCase() !== selectedSpecialtyType.toLowerCase()) {
          return false;
        }
      }

      // Status filter
      if (selectedStatus !== "all") {
        const isHidden = f.status === "hidden" || f.statusNum === 3;
        if (selectedStatus === "active" && isHidden) return false;
        if (selectedStatus === "hidden" && !isHidden) return false;
      }

      // Price filter
      if (selectedPriceRange !== "all") {
        const minP = Number(f.minPrice || 0);
        const maxP = Number(f.maxPrice || minP || 0);
        if (selectedPriceRange === "under_50k" && minP > 50000) return false;
        if (selectedPriceRange === "50k_150k" && (maxP < 50000 || minP > 150000)) return false;
        if (selectedPriceRange === "above_150k" && maxP < 150000) return false;
      }

      return true;
    });
  }, [availableFoods, selectedSpecialtyType, selectedStatus, selectedPriceRange]);

  // Add food to current place
  const handleAddFoodToPlace = (food: AdminFoodItem) => {
    if (associatedFoodIds.has(food.id)) {
      notify(`Món "${food.name}" đã có trong danh sách món ăn của địa điểm.`);
      return;
    }

    const newFoodItem: AdminPlaceFoodDto = {
      id: food.id,
      name: food.name,
      minPrice: food.minPrice ?? null,
      maxPrice: food.maxPrice ?? null,
      coverImg: food.coverImg || food.imageUrl || "",
      coverImageUrl: food.coverImg || food.imageUrl || "",
      description: food.desc || food.description || "",
      desc: food.desc || food.description || "",
      status: food.status || "active",
      statusNum: food.statusNum || 1,
      province: food.province || "",
      provinceId: food.provinceId,
      specialtyType: food.specialtyType || "",
    };

    const nextList = [...associatedFoods, newFoodItem];
    setAssociatedFoods(nextList);
    onFoodsCountChange?.(nextList.length);
    notify(`Đã thêm món "${food.name}". Nhấn nút "Lưu thay đổi" ở phía trên để lưu đồng bộ.`);
  };

  // Remove food from current place
  const handleRemoveFoodFromPlace = (foodId: number, foodName: string) => {
    const nextList = associatedFoods.filter((f) => f.id !== foodId);
    setAssociatedFoods(nextList);
    onFoodsCountChange?.(nextList.length);
    notify(`Đã gỡ món "${foodName}". Nhấn nút "Lưu thay đổi" ở phía trên để lưu.`);
  };

  // Reorder foods
  const handleReorderFood = (index: number, direction: "up" | "down") => {
    if (direction === "up" && index === 0) return;
    if (direction === "down" && index === associatedFoods.length - 1) return;

    const targetIndex = direction === "up" ? index - 1 : index + 1;
    const nextList = [...associatedFoods];
    const temp = nextList[index];
    nextList[index] = nextList[targetIndex];
    nextList[targetIndex] = temp;

    setAssociatedFoods(nextList);
  };

  // Search submit
  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSearchKeyword(searchInput.trim());
    setCurrentPage(1);
  };

  // Reset search filters
  const handleResetFilters = () => {
    setSearchInput("");
    setSearchKeyword("");
    setSelectedProvince("all");
    setSelectedSpecialtyType("all");
    setSelectedStatus("all");
    setSelectedPriceRange("all");
    setCurrentPage(1);
  };

  const formatPrice = (price?: number | null) => {
    if (!price && price !== 0) return "Liên hệ";
    return new Intl.NumberFormat("vi-VN").format(price) + "đ";
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* ── TOP HEADER / SYNCED STATUS ── */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-2xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-800 flex items-center justify-center font-extrabold border border-emerald-200 shadow-2xs shrink-0">
              <UtensilsCrossed size={20} />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-base sm:text-lg font-extrabold text-slate-900">
                  Món ăn Đặc sản của {placeName}
                </h2>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── SECTION 1: CURRENT ASSOCIATED FOODS LIST (LIKE USER SCREENSHOT 2) ── */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs overflow-hidden">
        <div className="p-4 sm:p-5 bg-slate-50/80 border-b border-slate-200 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <h3 className="font-extrabold text-sm text-slate-900">
              Danh sách Món ăn đã liên kết ({associatedFoods.length})
            </h3>
          </div>
          <span className="text-[11px] font-bold text-slate-500">
            Dùng nút mũi tên để sắp xếp thứ tự hiển thị
          </span>
        </div>

        <div className="p-4 space-y-2.5">
          {isLoadingAssociatedFoods ? (
            <div className="py-12 flex flex-col items-center justify-center text-slate-400 gap-2 bg-slate-50/50 rounded-xl">
              <Loader2 size={24} className="animate-spin text-emerald-800" />
              <span className="text-xs">Đang tải danh sách món ăn liên kết...</span>
            </div>
          ) : associatedFoods.length === 0 ? (
            <div className="py-12 text-center bg-slate-50/50 rounded-xl border border-dashed border-slate-200 p-6 space-y-2.5">
              <UtensilsCrossed size={36} className="text-slate-300 mx-auto" />
              <div className="text-sm font-bold text-slate-800">
                Địa điểm này chưa có món ăn đặc sản nào
              </div>
            </div>
          ) : (
            associatedFoods.map((food, fIdx) => {
              const cover = food.coverImg || food.coverImageUrl;
              const isHidden = food.status === "hidden" || food.statusNum === 3;

              return (
                <div
                  key={food.id}
                  className="p-3.5 sm:p-4 rounded-2xl border border-slate-200/90 bg-white hover:border-emerald-400 hover:shadow-xs transition-all flex items-center justify-between gap-3 text-xs"
                >
                  <div className="flex items-center gap-3.5 min-w-0 flex-1">
                    <div className="w-7 h-7 rounded-xl bg-emerald-800 text-white font-extrabold text-xs flex items-center justify-center shrink-0 shadow-2xs">
                      {fIdx + 1}
                    </div>

                    {/* Thumbnail */}
                    {cover ? (
                      <img
                        src={cover}
                        alt={food.name}
                        className="w-12 h-12 rounded-xl object-cover shrink-0 border border-slate-200"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.style.display = "none";
                          const sibling = target.nextElementSibling as HTMLElement | null;
                          if (sibling) sibling.style.display = "flex";
                        }}
                      />
                    ) : null}
                    <div
                      className={`w-12 h-12 rounded-xl bg-slate-100 border border-slate-200 shrink-0 items-center justify-center text-slate-400 flex-col gap-0.5 ${cover ? "hidden" : "flex"
                        }`}
                      title="Chưa có hình ảnh"
                    >
                      <ImageIcon size={14} className="text-slate-300" />
                      <span className="text-[8px] font-semibold text-slate-400 leading-tight">Không ảnh</span>
                    </div>

                    {/* Food Info */}
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-extrabold text-slate-900 text-sm hover:text-emerald-800 transition-colors">
                          {food.name}
                        </span>

                        <span
                          className={`px-2 py-0.5 rounded-md text-[10px] font-bold border transition-colors ${isHidden
                            ? "bg-slate-100 text-slate-700 border-slate-300"
                            : "bg-[#e6fcf5] text-[#087f5b] border-[#63e6be]"
                            }`}
                        >
                          {isHidden ? "Tạm ẩn" : "Hoạt động"}
                        </span>

                        {food.province && (
                          <span className="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200 flex items-center gap-1">
                            <MapPin size={10} />
                            <span>{food.province}</span>
                          </span>
                        )}

                        {food.specialtyType && (
                          <span className="px-2 py-0.5 rounded-md text-[10px] font-medium bg-slate-100 text-slate-700 border border-slate-200">
                            {food.specialtyType}
                          </span>
                        )}
                      </div>

                      {(food.description || food.desc) && (
                        <p className="text-[11px] text-slate-600 line-clamp-1 mt-1 leading-relaxed font-normal">
                          {food.description || food.desc}
                        </p>
                      )}

                      <div className="flex items-center gap-3 text-[11px] text-slate-500 mt-1 font-medium">
                        {(food.minPrice !== null && food.minPrice !== undefined) ||
                          (food.maxPrice !== null && food.maxPrice !== undefined) ? (
                          <span className="text-amber-700 font-bold flex items-center gap-0.5 bg-amber-50 px-2 py-0.5 rounded border border-amber-200/80">
                            <DollarSign size={11} />
                            {food.minPrice ? formatPrice(food.minPrice) : "Từ 0đ"}
                            {food.maxPrice ? ` - ${formatPrice(food.maxPrice)}` : ""}
                          </span>
                        ) : null}
                      </div>
                    </div>
                  </div>

                  {/* Actions: Move Up / Down & Remove */}
                  <div className="flex items-center gap-1.5 shrink-0">
                    <div className="flex items-center bg-slate-100 rounded-lg p-0.5 border border-slate-200">
                      <button
                        type="button"
                        disabled={fIdx === 0}
                        onClick={() => handleReorderFood(fIdx, "up")}
                        className="p-1 text-slate-600 hover:text-slate-900 hover:bg-white rounded transition-colors disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
                        title="Đưa lên trên"
                      >
                        <ArrowUp size={13} />
                      </button>
                      <button
                        type="button"
                        disabled={fIdx === associatedFoods.length - 1}
                        onClick={() => handleReorderFood(fIdx, "down")}
                        className="p-1 text-slate-600 hover:text-slate-900 hover:bg-white rounded transition-colors disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
                        title="Đưa xuống dưới"
                      >
                        <ArrowDown size={13} />
                      </button>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleRemoveFoodFromPlace(food.id, food.name)}
                      className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-colors cursor-pointer border border-transparent hover:border-rose-200"
                      title="Gỡ món ăn khỏi địa điểm"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* ── SECTION 2: FOOD DISCOVERY & FILTER (LIKE COLLECTIONS TAB PICKER) ── */}
      <div className="space-y-4 pt-2">
        {/* Top Search & Filter Bar */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-2xs space-y-4">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h3 className="font-extrabold text-sm text-slate-900">
                Thêm Món ăn Đặc sản vào Địa điểm
              </h3>
            </div>
            <button
              type="button"
              onClick={handleResetFilters}
              className="px-3 py-1.5 text-xs font-bold text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition-all flex items-center gap-1.5 cursor-pointer border border-slate-200"
            >
              <RotateCcw size={13} />
              <span>Đặt lại bộ lọc</span>
            </button>
          </div>

          {/* Search form */}
          <form onSubmit={handleSearchSubmit} className="flex items-center gap-3">
            <div className="relative flex-1">
              <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Tìm kiếm theo tên món ăn, đặc sản, xuất xứ..."
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                className="w-full pl-10 pr-10 py-2.5 bg-slate-50 focus:bg-white border border-slate-200 focus:border-emerald-600 rounded-xl text-xs text-slate-800 placeholder:text-slate-400 outline-none transition-all font-medium"
              />
              {searchInput && (
                <button
                  type="button"
                  onClick={() => {
                    setSearchInput("");
                    setSearchKeyword("");
                    setCurrentPage(1);
                  }}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                >
                  <X size={14} />
                </button>
              )}
            </div>

            <button
              type="submit"
              className="px-5 py-2.5 bg-emerald-800 hover:bg-emerald-900 text-white font-extrabold text-xs rounded-xl transition-all flex items-center gap-1.5 cursor-pointer shadow-xs shrink-0"
            >
              <Search size={14} />
              <span>Tìm kiếm</span>
            </button>
          </form>

          {/* Filter Row: Province, Specialty Type, Price, Status */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-1">
            {/* Province Filter */}
            <div>
              <label className="block text-[11px] font-bold text-slate-600 mb-1">
                Tỉnh / Thành phố
              </label>
              <select
                value={selectedProvince}
                onChange={(e) => {
                  setSelectedProvince(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 outline-none focus:border-emerald-600 cursor-pointer"
              >
                <option value="all">Tất cả Tỉnh thành ({provincesList.length})</option>
                {provincesList.map((p) => (
                  <option key={p.id} value={p.name}>
                    {p.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Price Range Filter */}
            <div>
              <label className="block text-[11px] font-bold text-slate-600 mb-1">
                Mức giá tham khảo
              </label>
              <select
                value={selectedPriceRange}
                onChange={(e) => {
                  setSelectedPriceRange(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 outline-none focus:border-emerald-600 cursor-pointer"
              >
                <option value="all">Tất cả mức giá</option>
                <option value="under_50k">Dưới 50.000đ</option>
                <option value="50k_150k">Từ 50.000đ - 150.000đ</option>
                <option value="above_150k">Trên 150.000đ</option>
              </select>
            </div>

            {/* Status Filter */}
            <div>
              <label className="block text-[11px] font-bold text-slate-600 mb-1">
                Trạng thái duyệt
              </label>
              <select
                value={selectedStatus}
                onChange={(e) => {
                  setSelectedStatus(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 outline-none focus:border-emerald-600 cursor-pointer"
              >
                <option value="all">Tất cả trạng thái</option>
                <option value="active">Đang công khai</option>
                <option value="hidden">Tạm ẩn</option>
              </select>
            </div>
          </div>
        </div>

        {/* Available Foods Results Grid */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-2xs space-y-4">
          <div className="flex items-center justify-between gap-3 pb-3 border-b border-slate-100">
            <span className="text-xs font-extrabold text-slate-800">
              Kết quả tìm kiếm ({filteredAvailableFoods.length} món)
            </span>
          </div>

          {isLoadingAvailableFoods ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5 min-h-[300px]">
              {Array.from({ length: 6 }).map((_, idx) => (
                <div
                  key={idx}
                  className="p-3.5 rounded-2xl border border-slate-200/80 bg-slate-50/50 animate-pulse flex flex-col justify-between gap-3 h-[130px]"
                >
                  <div className="flex items-start gap-3">
                    <div className="w-14 h-14 rounded-xl bg-slate-200/80 shrink-0" />
                    <div className="flex-1 space-y-2">
                      <div className="h-3.5 bg-slate-200/80 rounded w-3/4" />
                      <div className="h-2.5 bg-slate-200/70 rounded w-1/2" />
                      <div className="h-2.5 bg-slate-200/70 rounded w-1/3" />
                    </div>
                  </div>
                  <div className="flex justify-between items-center pt-2 border-t border-slate-100">
                    <div className="h-3 bg-slate-200/80 rounded w-16" />
                    <div className="h-6 bg-slate-200/80 rounded-lg w-20" />
                  </div>
                </div>
              ))}
            </div>
          ) : filteredAvailableFoods.length === 0 ? (
            <div className="py-12 text-center text-slate-400 text-xs space-y-2">
              <p>Không tìm thấy món ăn nào phù hợp với bộ lọc hiện tại.</p>
              <button
                type="button"
                onClick={handleResetFilters}
                className="text-emerald-800 hover:underline font-bold"
              >
                Xóa bộ lọc để xem tất cả món ăn
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
              {filteredAvailableFoods.map((food) => {
                const isAdded = associatedFoodIds.has(food.id);
                const cover = food.coverImg || food.imageUrl;

                return (
                  <div
                    key={food.id}
                    className={`p-3.5 rounded-2xl border transition-all flex flex-col justify-between gap-3 text-xs ${isAdded
                      ? "bg-emerald-50/40 border-emerald-300 ring-1 ring-emerald-400/20"
                      : "bg-white border-slate-200/90 hover:border-slate-300 hover:shadow-2xs"
                      }`}
                  >
                    <div className="flex items-start gap-3">
                      {cover ? (
                        <img
                          src={cover}
                          alt={food.name}
                          className="w-14 h-14 rounded-xl object-cover shrink-0 border border-slate-200"
                          onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            target.style.display = "none";
                            const sibling = target.nextElementSibling as HTMLElement | null;
                            if (sibling) sibling.style.display = "flex";
                          }}
                        />
                      ) : null}
                      <div
                        className={`w-14 h-14 rounded-xl bg-slate-100 border border-slate-200 shrink-0 items-center justify-center text-slate-400 flex-col gap-0.5 ${cover ? "hidden" : "flex"
                          }`}
                      >
                        <ImageIcon size={16} className="text-slate-300" />
                      </div>

                      <div className="min-w-0 flex-1 space-y-1">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <h4 className="font-extrabold text-slate-900 text-xs leading-snug line-clamp-1">
                            {food.name}
                          </h4>
                        </div>

                        <div className="flex items-center gap-1.5 flex-wrap text-[10px]">
                          {food.province && (
                            <span className="px-1.5 py-0.2 rounded bg-emerald-50 text-emerald-800 font-semibold border border-emerald-200">
                              {food.province}
                            </span>
                          )}
                          {food.specialtyType && (
                            <span className="px-1.5 py-0.2 rounded bg-slate-100 text-slate-600 font-medium">
                              {food.specialtyType}
                            </span>
                          )}
                        </div>

                        {(food.minPrice !== undefined || food.maxPrice !== undefined) && (
                          <div className="text-[10px] font-bold text-amber-700">
                            {food.minPrice ? formatPrice(food.minPrice) : "0đ"}
                            {food.maxPrice ? ` - ${formatPrice(food.maxPrice)}` : ""}
                          </div>
                        )}
                      </div>
                    </div>

                    {(food.desc || food.description) && (
                      <p className="text-[11px] text-slate-500 line-clamp-2 leading-relaxed font-normal">
                        {food.desc || food.description}
                      </p>
                    )}

                    <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-2">
                      <span className="text-[10px] font-mono text-slate-400">
                        #{food.id}
                      </span>

                      {isAdded ? (
                        <button
                          type="button"
                          onClick={() => handleRemoveFoodFromPlace(food.id, food.name)}
                          className="px-3 py-1.5 rounded-xl font-bold text-[11px] bg-emerald-100 text-emerald-800 border border-emerald-300 hover:bg-rose-50 hover:text-rose-700 hover:border-rose-200 transition-colors flex items-center gap-1 cursor-pointer"
                          title="Bấm để gỡ món ăn khỏi địa điểm"
                        >
                          <Check size={13} />
                          <span>Đã liên kết</span>
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => handleAddFoodToPlace(food)}
                          className="px-3.5 py-1.5 rounded-xl font-bold text-[11px] bg-emerald-800 hover:bg-emerald-900 text-white transition-all flex items-center gap-1 cursor-pointer shadow-2xs"
                        >
                          <Plus size={13} />
                          <span>Thêm vào địa điểm</span>
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between pt-4 border-t border-slate-100">
              <span className="text-xs text-slate-500 font-medium">
                Trang <strong>{currentPage}</strong> / {totalPages} (Tổng số {totalElements} món ăn)
              </span>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 disabled:opacity-40 disabled:cursor-not-allowed rounded-xl text-xs font-bold text-slate-700 transition-colors cursor-pointer flex items-center gap-1"
                >
                  <ChevronLeft size={14} />
                  <span>Trước</span>
                </button>
                <button
                  type="button"
                  disabled={currentPage >= totalPages}
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 disabled:opacity-40 disabled:cursor-not-allowed rounded-xl text-xs font-bold text-slate-700 transition-colors cursor-pointer flex items-center gap-1"
                >
                  <span>Sau</span>
                  <ChevronRight size={14} />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PlaceAdminFoods;
