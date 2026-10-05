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


const DEFAULT_FOOD_COVER =
  "https://images.unsplash.com/photo-1541544741938-0af808871cc0?w=600&h=400&fit=crop";

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
  const [selectedStatus, setSelectedStatus] = useState<string>("all");
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [totalElements, setTotalElements] = useState<number>(0);
  const [provincesList, setProvincesList] = useState<ProvinceDto[]>([]);
  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

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
          coverImg: f.coverImg || f.CoverImg || f.coverImageUrl || f.CoverImageUrl || f.imageUrl || f.ImageUrl || DEFAULT_FOOD_COVER,
          coverImageUrl: f.coverImg || f.CoverImg || f.coverImageUrl || f.CoverImageUrl || f.imageUrl || f.ImageUrl || DEFAULT_FOOD_COVER,
          description: f.description ?? f.Description ?? f.desc ?? f.Desc ?? "",
          desc: f.description ?? f.Description ?? f.desc ?? f.Desc ?? "",
          status: f.status ?? f.Status ?? "active",
          statusNum: f.statusNum ?? f.StatusNum ?? 1,
          province: f.province || f.Province || f.provinceName || placeProvinceName || "",
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

  // Fetch available foods for picker (matching FoodsTab and AdminPage API logic)
  const fetchAvailableFoods = useCallback(async () => {
    setIsLoadingAvailableFoods(true);
    try {
      const cleanParams: any = {
        page: currentPage,
        pageSize: 10,
      };
      if (searchKeyword.trim()) {
        cleanParams.keyword = searchKeyword.trim();
      }
      if (selectedProvince !== "all") {
        cleanParams.province = selectedProvince;
      }
      if (selectedStatus !== "all") {
        cleanParams.status = selectedStatus;
      }

      const res = await adminService.getFoods(cleanParams);

      const rawItems = extractList(res?.data || res);
      const mapped: AdminFoodItem[] = rawItems.map((item: any) => ({
        ...item,
        id: Number(item.id ?? item.Id),
        name: item.name || item.Name || "Món ăn",
        province: item.provinceName || item.province || item.Province || "",
        provinceName: item.provinceName || item.province || item.Province || "",
        provinceId: item.provinceId ?? item.ProvinceId,
        specialtyType: item.specialtyType || item.SpecialtyType || item.category || "Món đặc sản",
        desc: item.desc || item.Desc || item.description || item.Description || "",
        description: item.desc || item.Desc || item.description || item.Description || "",
        historyInfo: item.historyInfo || item.HistoryInfo || "",
        status: String(item.status || item.Status || "active").toLowerCase(),
        statusNum: item.statusNum ?? item.StatusNum ?? (item.status === "hidden" ? 3 : 1),
        coverImg:
          item.coverImg ||
          item.CoverImg ||
          item.img ||
          item.image ||
          item.imageUrl ||
          item.ImageUrl ||
          DEFAULT_FOOD_COVER,
        minPrice: item.minPrice ? Number(item.minPrice) : (item.MinPrice ? Number(item.MinPrice) : 0),
        maxPrice: item.maxPrice ? Number(item.maxPrice) : (item.MaxPrice ? Number(item.MaxPrice) : 0),
        priceRange:
          item.priceRange ||
          (item.minPrice
            ? `${Number(item.minPrice).toLocaleString("vi-VN")}đ – ${Number(
              item.maxPrice || item.minPrice
            ).toLocaleString("vi-VN")}đ`
            : ""),
        createdAt: item.createdAt || "",
      }));

      setAvailableFoods(mapped);

      const meta = (res as any)?.meta || (res as any)?.pagination || {};
      const total = Number(
        meta.totalElements ??
        meta.totalCount ??
        meta.total ??
        (res as any)?.totalElements ??
        (res as any)?.totalCount ??
        (res as any)?.total ??
        (res as any)?.data?.totalElements ??
        (res as any)?.data?.totalCount ??
        (res as any)?.data?.total ??
        mapped.length
      );
      setTotalElements(total);

      const computedTotalPages = Number(
        meta.totalPages ??
        (res as any)?.totalPages ??
        (res as any)?.data?.totalPages ??
        Math.max(1, Math.ceil(total / 10))
      );
      setTotalPages(Math.max(1, computedTotalPages));
    } catch (err: any) {
      console.error("Error fetching available foods:", err);
      setAvailableFoods([]);
      setTotalElements(0);
      setTotalPages(1);
    } finally {
      setIsLoadingAvailableFoods(false);
    }
  }, [currentPage, searchKeyword, selectedProvince, selectedStatus]);

  useEffect(() => {
    fetchAvailableFoods();
  }, [fetchAvailableFoods]);

  // Set of linked Food IDs for instant check
  const associatedFoodIds = useMemo(() => {
    return new Set(associatedFoods.map((f) => f.id));
  }, [associatedFoods]);


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

  // Handlers for search & filters matching FoodsTab
  const handleSearchChange = (val: string) => {
    setSearchInput(val);
    if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
    debounceTimerRef.current = setTimeout(() => {
      setSearchKeyword(val.trim());
      setCurrentPage(1);
    }, 300);
  };

  const handleProvinceChange = (val: string) => {
    setSelectedProvince(val);
    setCurrentPage(1);
  };

  const handleStatusChange = (val: string) => {
    setSelectedStatus(val);
    setCurrentPage(1);
  };

  const handleResetFilters = () => {
    if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
    setSearchInput("");
    setSearchKeyword("");
    setSelectedProvince("all");
    setSelectedStatus("all");
    setCurrentPage(1);
  };

  const formatPrice = (price?: number | null) => {
    if (!price && price !== 0) return "Liên hệ";
    return new Intl.NumberFormat("vi-VN").format(price) + "đ";
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200 text-xs font-sans">
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
              <p className="text-xs text-slate-500 mt-0.5">
                Quản lý và liên kết các món ăn, ẩm thực địa phương đặc trưng cho địa điểm này.
              </p>
            </div>
          </div>
        </div>
      </div>

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
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                Hãy tìm kiếm và thêm món ăn từ danh sách bên dưới để hiển thị trên trang chi tiết địa điểm.
              </p>
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
                          {isHidden ? "Tạm ẩn" : "Công khai"}
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

      <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-2xs space-y-4">
        {/* Search & Filter Controls (Matching FoodsTab) */}
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="relative flex-1 min-w-[240px]">
            <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Tìm kiếm theo tên món ăn, đặc sản, tỉnh thành..."
              value={searchInput}
              onChange={(e) => handleSearchChange(e.target.value)}
              className="w-full pl-9 pr-8 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-medium text-slate-800 placeholder:text-slate-400 focus:bg-white outline-none focus:border-emerald-500 transition-colors"
            />
            {searchInput && (
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
            <select
              value={selectedProvince}
              onChange={(e) => handleProvinceChange(e.target.value)}
              className="px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 font-medium text-slate-800 outline-none focus:border-emerald-500 cursor-pointer text-xs"
            >
              <option value="all">Tất cả tỉnh thành</option>
              {provincesList.map((prov) => (
                <option key={prov.id || prov.name} value={prov.name}>
                  {prov.name}
                </option>
              ))}
            </select>

            <select
              value={selectedStatus}
              onChange={(e) => handleStatusChange(e.target.value)}
              className="px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 font-medium text-slate-800 outline-none focus:border-emerald-500 cursor-pointer text-xs"
            >
              <option value="all">Tất cả trạng thái</option>
              <option value="active">Đang công khai</option>
              <option value="hidden">Đang tạm ẩn</option>
            </select>

            <button
              type="button"
              onClick={handleResetFilters}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-bold cursor-pointer transition-all text-xs"
            >
              <RotateCcw size={13} />
              <span>Đặt lại</span>
            </button>
          </div>
        </div>

        {/* Foods Table (Layout Matching FoodsTab) */}
        <div className="overflow-x-auto rounded-xl border border-slate-200/80">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-500 font-bold text-[11px] uppercase tracking-wider">
                <th className="p-3.5 pl-4">Món ăn / Đặc sản</th>
                <th className="p-3.5">Tỉnh / Thành</th>
                <th className="p-3.5">Khoảng giá</th>
                <th className="p-3.5">Trạng thái</th>
                <th className="p-3.5 text-right pr-4">Hành động</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {availableFoods.map((food) => {
                const isAdded = associatedFoodIds.has(food.id);
                const isHidden = food.status === "hidden" || food.statusNum === 3;
                const minP = food.minPrice ? food.minPrice.toLocaleString("vi-VN") : "0";
                const maxP = food.maxPrice ? food.maxPrice.toLocaleString("vi-VN") : "";
                const priceText = (food.minPrice || food.maxPrice)
                  ? `${minP}đ${maxP ? ` – ${maxP}đ` : ""}`
                  : "Liên hệ";
                const cover =
                  food.coverImg ||
                  food.imageUrl ||
                  "https://images.unsplash.com/photo-1541544741938-0af808871cc0?w=600&h=400&fit=crop";

                return (
                  <tr
                    key={food.id}
                    className={`hover:bg-slate-50/60 transition-colors group ${isAdded ? "bg-emerald-50/30" : ""
                      }`}
                  >
                    {/* Food Image & Name */}
                    <td className="p-3.5 pl-4 font-bold text-slate-900">
                      <div className="flex items-center gap-3">
                        <img
                          src={cover}
                          className="w-10 h-10 rounded-lg object-cover border border-slate-200 shrink-0"
                          alt={food.name}
                          onError={(e) => {
                            (e.target as HTMLImageElement).src =
                              "https://images.unsplash.com/photo-1541544741938-0af808871cc0?w=600&h=400&fit=crop";
                          }}
                        />
                        <div>
                          <div className="font-bold text-slate-900 group-hover:text-emerald-700 transition-colors text-xs">
                            {food.name}
                          </div>
                          <div className="text-[11px] text-slate-400 font-normal truncate max-w-xs">
                            {food.specialtyType || food.desc || food.description || "Món đặc sản"}
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Province */}
                    <td className="p-3.5 text-slate-700 font-medium text-xs">
                      {food.province || "Toàn quốc"}
                    </td>

                    {/* Price Range */}
                    <td className="p-3.5 font-bold text-emerald-800 text-xs">
                      {priceText}
                    </td>

                    {/* Status */}
                    <td className="p-3.5">
                      <span
                        className={`inline-flex items-center justify-center px-3.5 py-1 rounded-xl text-xs font-bold border transition-colors ${isHidden
                            ? "bg-slate-100 text-slate-700 border-slate-300"
                            : "bg-[#e6fcf5] text-[#087f5b] border-[#63e6be]"
                          }`}
                      >
                        {isHidden ? "Tạm ẩn" : "Công khai"}
                      </span>
                    </td>

                    {/* Action Buttons */}
                    <td className="p-3.5 text-right pr-4">
                      {isAdded ? (
                        <button
                          type="button"
                          onClick={() => handleRemoveFoodFromPlace(food.id, food.name)}
                          className="px-3 py-1.5 rounded-xl font-bold text-xs bg-emerald-100 text-emerald-800 border border-emerald-300 hover:bg-rose-50 hover:text-rose-700 hover:border-rose-200 transition-colors inline-flex items-center gap-1 cursor-pointer"
                          title="Bấm để gỡ món ăn khỏi địa điểm"
                        >
                          <Check size={13} />
                          <span>Đã liên kết</span>
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => handleAddFoodToPlace(food)}
                          className="px-3.5 py-1.5 rounded-xl font-bold text-xs bg-emerald-800 hover:bg-emerald-900 text-white transition-all inline-flex items-center gap-1 cursor-pointer shadow-2xs"
                        >
                          <Plus size={13} />
                          <span>Thêm vào địa điểm</span>
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          {isLoadingAvailableFoods ? (
            <div className="p-12 text-center text-slate-400">
              <div className="flex flex-col items-center justify-center gap-2">
                <Loader2 size={24} className="animate-spin text-emerald-600" />
                <span className="text-xs">Đang tải danh sách món ăn từ máy chủ...</span>
              </div>
            </div>
          ) : availableFoods.length === 0 ? (
            <div className="p-8 text-center text-slate-400 font-medium text-xs">
              Không tìm thấy món ăn đặc sản nào phù hợp với bộ lọc.
            </div>
          ) : null}
        </div>

        {/* Pagination Bar (Matching FoodsTab) */}
        {totalElements > 0 && (
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-3 px-1 border-t border-slate-100 text-xs text-slate-500 font-medium">
            <div>
              Hiển thị <strong>{availableFoods.length}</strong> / <strong>{totalElements}</strong> món ăn (Trang <strong>{currentPage}</strong> / {totalPages || 1})
            </div>

            {totalPages > 1 && (
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  disabled={currentPage <= 1 || isLoadingAvailableFoods}
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  className="px-3 py-1.5 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed font-bold text-slate-700 transition-colors flex items-center gap-1 cursor-pointer text-xs"
                >
                  <ChevronLeft size={14} />
                  <span>Trước</span>
                </button>

                <div className="flex items-center gap-1">
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    let pNum = currentPage - 2 + i;
                    if (currentPage <= 3) {
                      pNum = i + 1;
                    } else if (currentPage >= totalPages - 2) {
                      pNum = totalPages - 4 + i;
                    }
                    if (pNum < 1 || pNum > totalPages) return null;
                    const isActive = pNum === currentPage;
                    return (
                      <button
                        key={pNum}
                        type="button"
                        onClick={() => setCurrentPage(pNum)}
                        className={`w-7 h-7 rounded-full text-xs font-bold transition-colors cursor-pointer flex items-center justify-center ${isActive
                            ? "bg-[#087f5b] text-white shadow-xs"
                            : "text-slate-600 hover:bg-slate-100"
                          }`}
                      >
                        {pNum}
                      </button>
                    );
                  })}
                </div>

                <button
                  type="button"
                  disabled={currentPage >= totalPages || isLoadingAvailableFoods}
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  className="px-3 py-1.5 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed font-bold text-slate-700 transition-colors flex items-center gap-1 cursor-pointer text-xs"
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

export default PlaceAdminFoods;
