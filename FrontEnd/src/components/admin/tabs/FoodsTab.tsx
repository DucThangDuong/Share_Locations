import React, { useState, useRef, useEffect, useMemo } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import {
  Search,
  Plus,
  ArrowLeft,
  Eye,
  EyeOff,
  Trash2,
  DollarSign,
  MapPin,
  Save,
  FileText,
  UploadCloud,
  CheckCircle2,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  Loader2,
  X,
  ImageIcon,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  RefreshCw,
  Store,
} from "lucide-react";
import type { AdminFoodItem } from "@/types/admin.types";
import { adminService, extractList } from "@/services/adminService";
import { geographyService, type ProvinceDto } from "@/services/geographyService";
import apiClient from "@/services/apiClient";
import { CustomSelect } from "@/components/common/CustomSelect";

export interface AdminFoodPlaceDto {
  id: number;
  name: string;
  coverImageUrl?: string;
}

interface FoodsTabProps {
  foodsList: AdminFoodItem[];
  setFoodsList?: React.Dispatch<React.SetStateAction<AdminFoodItem[]>>;
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
    provinceId?: number;
    status?: string;
    sortBy?: string;
    sortOrder?: "asc" | "desc";
    page?: number;
    pageSize?: number;
  }) => void;
  addAuditLog?: (
    action: string,
    targetName: string,
    details: string,
    type: "approve" | "reject" | "resolve" | "hide" | "edit" | "create"
  ) => void;
  showToast?: (msg: string) => void;
}

export const resolveFoodPlaces = (food?: Partial<AdminFoodItem> | null): AdminFoodPlaceDto[] => {
  if (!food) return [];
  const f = food as any;
  const rawList = f.places || f.Places || f.suggestedPlaces || f.SuggestedPlaces;
  if (!Array.isArray(rawList)) return [];
  return rawList.map((p: any) => ({
    id: Number(p.id ?? p.Id ?? p.placeId ?? p.PlaceId ?? 0),
    name: p.name ?? p.Name ?? "",
    coverImageUrl:
      p.coverImageUrl ??
      p.CoverImageUrl ??
      p.coverImg ??
      p.CoverImg ??
      p.imageUrl ??
      p.ImageUrl ??
      "",
  }));
};

export const resolvePlacesCount = (food?: Partial<AdminFoodItem> | null): number => {
  if (!food) return 0;
  const f = food as any;
  const placesList = resolveFoodPlaces(food);
  if (placesList.length > 0) return placesList.length;
  const explicitCount = f.placesCount ?? f.PlacesCount ?? f.placeCount ?? f.suggestedPlacesCount;
  return typeof explicitCount === "number" && explicitCount >= 0 ? explicitCount : 0;
};

const formatThousandDigits = (rawDigits: string): string => {
  const digits = String(rawDigits || "").replace(/\D/g, "");
  if (!digits) return "";
  return Number(digits).toLocaleString("vi-VN");
};

const parseThousandDigits = (formatted: string): string => {
  return String(formatted || "").replace(/\D/g, "");
};

export const FoodsTab: React.FC<FoodsTabProps> = ({
  foodsList = [],
  setFoodsList,
  isLoading = false,
  pagination = {
    page: 1,
    pageSize: 10,
    totalElements: foodsList.length,
    totalPages: 1,
  },
  onPageChange,
  onFilterChange,
  addAuditLog,
  showToast,
}) => {
  const navigate = useNavigate();
  const location = useLocation();

  const [selectedFoodId, setSelectedFoodId] = useState<number | null>(null);
  const [isCreatingFood, setIsCreatingFood] = useState(false);
  const [foodSearchText, setFoodSearchText] = useState(() => {
    const params = new URLSearchParams(location.search);
    return params.get("keyword") || params.get("search") || "";
  });
  const [foodFilterProvince, setFoodFilterProvince] = useState(() => {
    const params = new URLSearchParams(location.search);
    return params.get("provinceId") || params.get("province") || "all";
  });
  const [foodFilterStatus, setFoodFilterStatus] = useState(() => {
    const params = new URLSearchParams(location.search);
    return params.get("status") || "all";
  });
  const [provincesList, setProvincesList] = useState<ProvinceDto[]>([]);
  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  type SortField = "name" | "price" | "updatedAt" | null;
  type SortOrder = "asc" | "desc";
  const [sortField, setSortField] = useState<SortField>(() => {
    const params = new URLSearchParams(location.search);
    return (params.get("sortBy") as SortField) || null;
  });
  const [sortOrder, setSortOrder] = useState<SortOrder>(() => {
    const params = new URLSearchParams(location.search);
    return (params.get("sortOrder") as SortOrder) || "desc";
  });

  const updateUrlParams = (updates: {
    keyword?: string;
    provinceId?: number | string | null;
    status?: string | null;
    sortBy?: string | null;
    sortOrder?: string | null;
    page?: number | null;
  }) => {
    const params = new URLSearchParams(location.search);

    const merged = {
      keyword: updates.keyword !== undefined ? updates.keyword : foodSearchText,
      provinceId: updates.provinceId !== undefined ? updates.provinceId : foodFilterProvince,
      status: updates.status !== undefined ? updates.status : foodFilterStatus,
      sortBy: updates.sortBy !== undefined ? updates.sortBy : sortField,
      sortOrder: updates.sortOrder !== undefined ? updates.sortOrder : sortOrder,
      page: updates.page !== undefined ? updates.page : pagination.page,
    };

    if (merged.keyword?.trim()) {
      params.set("keyword", merged.keyword.trim());
    } else {
      params.delete("keyword");
      params.delete("search");
    }

    if (merged.provinceId && merged.provinceId !== "all") {
      params.set("provinceId", String(merged.provinceId));
      params.delete("province");
    } else {
      params.delete("provinceId");
      params.delete("province");
    }

    if (merged.status && merged.status !== "all") {
      params.set("status", String(merged.status));
    } else {
      params.delete("status");
    }

    if (merged.sortBy) {
      params.set("sortBy", merged.sortBy);
      params.set("sortOrder", merged.sortOrder || "desc");
    } else {
      params.delete("sortBy");
      params.delete("sortOrder");
    }

    if (merged.page && merged.page > 1) {
      params.set("page", String(merged.page));
    } else {
      params.delete("page");
    }

    const qs = params.toString();
    const newPath = `/admin/foods${qs ? `?${qs}` : ""}`;
    if (location.pathname + location.search !== newPath) {
      navigate(newPath, { replace: true });
    }
  };

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const urlProv = params.get("provinceId") || params.get("province") || "all";
    const urlStat = params.get("status") || "all";
    const urlKw = params.get("keyword") || params.get("search") || "";
    const urlSortBy = (params.get("sortBy") as SortField) || null;
    const urlSortOrder = (params.get("sortOrder") as SortOrder) || "desc";

    if (urlProv !== foodFilterProvince) {
      setFoodFilterProvince(urlProv);
    }
    if (urlStat !== foodFilterStatus) {
      setFoodFilterStatus(urlStat);
    }
    if (urlKw !== foodSearchText) {
      setFoodSearchText(urlKw);
    }
    if (urlSortBy !== sortField) {
      setSortField(urlSortBy);
    }
    if (urlSortOrder !== sortOrder) {
      setSortOrder(urlSortOrder);
    }
  }, [location.search]);

  const handleSort = (field: "name" | "price" | "updatedAt") => {
    let nextOrder: SortOrder = "desc";
    let nextField: SortField = field;
    if (sortField === field) {
      if (sortOrder === "desc") {
        nextOrder = "asc";
      } else {
        nextField = null;
      }
    } else {
      nextOrder = field === "name" ? "asc" : "desc";
    }
    setSortField(nextField);
    setSortOrder(nextOrder);
    updateUrlParams({
      sortBy: nextField || null,
      sortOrder: nextField ? nextOrder : null,
      page: 1,
    });
    onFilterChange?.({
      sortBy: nextField || undefined,
      sortOrder: nextField ? nextOrder : undefined,
      page: 1,
    });
  };

  const renderSortIcon = (field: "name" | "price" | "updatedAt") => {
    if (sortField !== field) {
      return <ArrowUpDown size={12} className="text-slate-300 group-hover:text-slate-500 transition-colors" />;
    }
    return sortOrder === "asc" ? (
      <ArrowUp size={12} className="text-emerald-700" />
    ) : (
      <ArrowDown size={12} className="text-emerald-700" />
    );
  };

  const formatUpdatedDate = (food: any) => {
    const rawDate = food.updatedAt || food.updatedDate || food.createdAt || food.createdDate;
    const author = food.updatedBy || food.createdBy || food.author || "Admin";
    if (!rawDate) return { dateStr: "20/10/2026", author };
    const d = new Date(rawDate);
    if (isNaN(d.getTime())) return { dateStr: String(rawDate), author };
    const day = String(d.getDate()).padStart(2, "0");
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const year = d.getFullYear();
    return { dateStr: `${day}/${month}/${year}`, author };
  };

  useEffect(() => {
    geographyService
      .getProvinces()
      .then((res: any) => {
        const list = extractList<ProvinceDto>(res?.data || res);
        if (list.length > 0) {
          setProvincesList(list);
        }
      })
      .catch(() => { });
  }, []);

  const provinceOptions = useMemo(() => [
    { value: "all", label: "Tất cả tỉnh thành" },
    ...provincesList.map((p: any) => ({
      value: String(p.id ?? p.provinceId ?? p.name),
      label: p.name || p.provinceName || String(p),
    })),
  ], [provincesList]);

  const selectedProvinceValue = useMemo(() => {
    if (!foodFilterProvince || foodFilterProvince === "all") return "all";
    const byId = provincesList.find((p: any) => String(p.id ?? p.provinceId) === String(foodFilterProvince));
    if (byId) return String(byId.id ?? (byId as any).provinceId);
    const byName = provincesList.find(
      (p: any) =>
        (p.name || "").toLowerCase() === String(foodFilterProvince).toLowerCase() ||
        (p.name || "").toLowerCase().includes(String(foodFilterProvince).toLowerCase())
    );
    if (byName) return String(byName.id ?? (byName as any).provinceId);
    return String(foodFilterProvince);
  }, [foodFilterProvince, provincesList]);

  const currentFood = selectedFoodId ? foodsList.find((f) => f.id === selectedFoodId) : null;

  const filteredFoods = useMemo(() => {
    if (onFilterChange) {
      return foodsList;
    }
    return foodsList.filter((f) => {
      if (foodFilterProvince !== "all") {
        const provObj = provincesList.find((p: any) => String(p.id ?? p.provinceId) === String(foodFilterProvince));
        const cleanFilter = (provObj?.name || foodFilterProvince).replace(/^(tỉnh|thành phố|tp\.?)\s+/i, "").toLowerCase();
        const fProv = String(f.province || (f as any).provinceName || "").replace(/^(tỉnh|thành phố|tp\.?)\s+/i, "").toLowerCase();
        const matchId = f.provinceId && String(f.provinceId) === String(foodFilterProvince);
        const matchName = fProv.includes(cleanFilter) || cleanFilter.includes(fProv);
        if (!matchId && !matchName) return false;
      }
      if (foodFilterStatus !== "all") {
        const isHidden = f.status === "hidden" || f.statusNum === 3;
        if (foodFilterStatus === "active" && isHidden) return false;
        if (foodFilterStatus === "hidden" && !isHidden) return false;
      }
      if (foodSearchText.trim()) {
        const q = foodSearchText.toLowerCase();
        const matchName = (f.name || "").toLowerCase().includes(q);
        const matchProv = (f.province || "").toLowerCase().includes(q);
        const matchDesc = (f.desc || f.description || "").toLowerCase().includes(q);
        if (!matchName && !matchProv && !matchDesc) return false;
      }
      return true;
    });
  }, [foodsList, onFilterChange, foodFilterProvince, foodFilterStatus, foodSearchText, provincesList]);

  const sortedFoods = useMemo(() => {
    if (!sortField) return filteredFoods;
    return [...filteredFoods].sort((a, b) => {
      if (sortField === "name") {
        const nameA = String(a.name || "").trim().toLowerCase();
        const nameB = String(b.name || "").trim().toLowerCase();
        return sortOrder === "asc"
          ? nameA.localeCompare(nameB, "vi")
          : nameB.localeCompare(nameA, "vi");
      }
      if (sortField === "price") {
        const pA = Number(a.minPrice || a.price || 0);
        const pB = Number(b.minPrice || b.price || 0);
        return sortOrder === "asc" ? pA - pB : pB - pA;
      }
      if (sortField === "updatedAt") {
        const timeA = new Date(a.updatedAt || a.createdAt || 0).getTime();
        const timeB = new Date(b.updatedAt || b.createdAt || 0).getTime();
        return sortOrder === "asc" ? timeA - timeB : timeB - timeA;
      }
      return 0;
    });
  }, [filteredFoods, sortField, sortOrder]);

  const handleToggleHideFood = async (foodId: number) => {
    if (!setFoodsList) return;
    const food = foodsList.find((item) => item.id === foodId);
    if (!food) return;
    await adminService.updateFoodStatus(foodId, food.status === "hidden" ? "active" : "hidden");
    setFoodsList((prev) =>
      prev.map((f) => {
        if (f.id === foodId) {
          const isCurrentlyHidden = f.status === "hidden" || f.statusNum === 3;
          const nextStatus = isCurrentlyHidden ? "active" : "hidden";
          const nextStatusNum = isCurrentlyHidden ? 1 : 3;
          if (addAuditLog) {
            addAuditLog(
              isCurrentlyHidden ? "Khôi phục món ăn" : "Tạm ẩn món ăn",
              f.name,
              `Cập nhật trạng thái hiển thị món đặc sản ${f.name}`,
              "hide"
            );
          }
          if (showToast) {
            showToast(`Đã ${isCurrentlyHidden ? "hiện lại" : "tạm ẩn"} món "${f.name}".`);
          }
          return { ...f, status: nextStatus, statusNum: nextStatusNum };
        }
        return f;
      })
    );
  };

  const handleDeleteFood = async (foodId: number) => {
    const food = foodsList.find((f) => f.id === foodId);
    if (!window.confirm(`Bạn có chắc chắn muốn xóa món đặc sản "${food?.name || foodId}"?`)) return;
    await adminService.deleteFood(foodId);
    if (setFoodsList) {
      setFoodsList((prev) => prev.filter((f) => f.id !== foodId));
    }
    if (addAuditLog && food) {
      addAuditLog("Xóa món ăn đặc sản", food.name, "Xóa món khỏi hệ thống", "hide");
    }
    if (showToast) {
      showToast(`Đã xóa món ăn thành công.`);
    }
    if (selectedFoodId === foodId) {
      setSelectedFoodId(null);
    }
  };

  const handleSaveFood = async (updatedFood: AdminFoodItem) => {
    if (setFoodsList) {
      setFoodsList((prev) =>
        prev.map((f) => (f.id === updatedFood.id ? { ...f, ...updatedFood } : f))
      );
    }
    if (addAuditLog) {
      addAuditLog("Cập nhật thông tin món ăn", updatedFood.name, `Chỉnh sửa thông tin đặc sản ${updatedFood.name}`, "edit");
    }
    if (showToast) {
      showToast(`Đã cập nhật món "${updatedFood.name}".`);
    }
  };

  if (isCreatingFood) {
    return (
      <FoodDetailEditor
        isCreateMode={true}
        provincesList={provincesList}
        onBack={() => setIsCreatingFood(false)}
        onSave={async (createdFood) => {
          if (setFoodsList) {
            setFoodsList((prev) => [createdFood, ...prev]);
          }
          if (addAuditLog) {
            addAuditLog("Thêm món ăn đặc sản mới", createdFood.name, "Số hóa món đặc sản vùng miền", "create");
          }
          if (showToast) {
            showToast(`Đã thêm món "${createdFood.name}" thành công.`);
          }
          setIsCreatingFood(false);
        }}
      />
    );
  }

  if (selectedFoodId && currentFood) {
    return (
      <FoodDetailEditor
        food={currentFood}
        provincesList={provincesList}
        onBack={() => setSelectedFoodId(null)}
        onSave={handleSaveFood}
        onToggleStatus={() => handleToggleHideFood(currentFood.id)}
        onDelete={() => handleDeleteFood(currentFood.id)}
      />
    );
  }

  const handleSearchChange = (val: string) => {
    setFoodSearchText(val);
    if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
    debounceTimerRef.current = setTimeout(() => {
      updateUrlParams({ keyword: val, page: 1 });
      onFilterChange?.({ keyword: val, page: 1 });
    }, 350);
  };

  const handleProvinceChange = (val: string) => {
    setFoodFilterProvince(val);
    const provObj = provincesList.find((p: any) => String(p.id ?? p.provinceId) === String(val) || p.name === val);
    const pId = val !== "all" && !isNaN(Number(val)) ? Number(val) : (provObj ? (provObj.id ?? (provObj as any).provinceId) : undefined);
    const pName = provObj ? provObj.name : (val !== "all" ? val : undefined);

    updateUrlParams({ provinceId: val === "all" ? null : (pId ?? val), page: 1 });
    onFilterChange?.({
      provinceId: pId,
      province: pName,
      page: 1,
    });
  };

  const handleStatusChange = (val: string) => {
    setFoodFilterStatus(val);
    updateUrlParams({ status: val === "all" ? null : val, page: 1 });
    onFilterChange?.({ status: val, page: 1 });
  };

  const handlePageChange = (pNum: number) => {
    updateUrlParams({ page: pNum });
    onPageChange?.(pNum);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-150 text-xs font-sans">
      <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-2xs space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="relative flex-1 min-w-[240px]">
            <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Tìm kiếm theo tên món ăn, đặc sản, tỉnh thành..."
              value={foodSearchText}
              onChange={(e) => handleSearchChange(e.target.value)}
              className="w-full pl-9 pr-8 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-medium text-slate-800 placeholder:text-slate-400 focus:bg-white outline-none focus:border-emerald-500"
            />
            {foodSearchText && (
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
            <CustomSelect
              value={selectedProvinceValue}
              onChange={(val) => handleProvinceChange(val)}
              options={provinceOptions}
              size="sm"
              className="min-w-[140px]"
            />

            <CustomSelect
              value={foodFilterStatus}
              onChange={(val) => handleStatusChange(val)}
              options={[
                { value: "all", label: "Tất cả trạng thái" },
                { value: "active", label: "Đang công khai" },
                { value: "hidden", label: "Đang tạm ẩn" },
              ]}
              size="sm"
              className="min-w-[130px]"
            />

            <button
              type="button"
              onClick={() => {
                setSelectedFoodId(null);
                setIsCreatingFood(true);
              }}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold cursor-pointer transition-all shadow-sm shadow-emerald-600/20"
            >
              <Plus size={14} />
              <span>Thêm món ăn</span>
            </button>
          </div>
        </div>

        <div className="overflow-x-auto rounded-xl border border-slate-200/80">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-500 font-bold text-[11px] uppercase tracking-wider">
                <th className="p-3.5 pl-4">
                  <button
                    type="button"
                    onClick={() => handleSort("name")}
                    className="group inline-flex items-center gap-1.5 uppercase tracking-wider hover:text-slate-900 transition-colors cursor-pointer select-none"
                    title="Sắp xếp theo tên món ăn"
                  >
                    <span>MÓN ĂN / ĐẶC SẢN</span>
                    {renderSortIcon("name")}
                  </button>
                </th>
                <th className="p-3.5 uppercase tracking-wider">TỈNH / THÀNH</th>
                <th className="p-3.5">
                  <button
                    type="button"
                    onClick={() => handleSort("price")}
                    className="group inline-flex items-center gap-1.5 uppercase tracking-wider hover:text-slate-900 transition-colors cursor-pointer select-none"
                    title="Sắp xếp theo giá"
                  >
                    <span>KHOẢNG GIÁ</span>
                    {renderSortIcon("price")}
                  </button>
                </th>
                <th className="p-3.5 uppercase tracking-wider">TRẠNG THÁI</th>
                <th className="p-3.5">
                  <button
                    type="button"
                    onClick={() => handleSort("updatedAt")}
                    className="group inline-flex items-center gap-1.5 uppercase tracking-wider hover:text-slate-900 transition-colors cursor-pointer select-none"
                    title="Sắp xếp theo thời gian cập nhật"
                  >
                    <span>CẬP NHẬT</span>
                    {renderSortIcon("updatedAt")}
                  </button>
                </th>
                <th className="p-3.5 text-center uppercase tracking-wider">XEM CHI TIẾT</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {sortedFoods.map((food) => {
                const isHidden = food.status === "hidden" || food.statusNum === 3;
                const minP = food.minPrice ? food.minPrice.toLocaleString("vi-VN") : "";
                const maxP = food.maxPrice ? food.maxPrice.toLocaleString("vi-VN") : "";
                const priceText = (food.minPrice || food.maxPrice)
                  ? `${minP || "0"}đ${maxP ? ` – ${maxP}đ` : ""}`
                  : "Liên hệ";
                const cover = food.coverImg || food.imageUrl || "";

                return (
                  <tr
                    key={food.id}
                    className="hover:bg-slate-50/60 transition-colors group cursor-pointer"
                    onClick={() => setSelectedFoodId(food.id)}
                  >
                    <td className="p-3.5 pl-4 font-bold text-slate-900">
                      <div className="flex items-center gap-3">
                        {cover ? (
                          <img
                            src={cover}
                            className="w-10 h-10 rounded-lg object-cover border border-slate-200 shrink-0"
                            alt=""
                            onError={(e) => {
                              const target = e.target as HTMLImageElement;
                              target.style.display = "none";
                              const sibling = target.nextElementSibling as HTMLElement | null;
                              if (sibling) sibling.style.display = "flex";
                            }}
                          />
                        ) : null}
                        <div
                          className={`w-10 h-10 rounded-lg bg-slate-100 border border-slate-200 items-center justify-center text-slate-400 shrink-0 ${cover ? "hidden" : "flex"
                            }`}
                          title="Không có hình ảnh"
                        >
                          <ImageIcon size={14} className="text-slate-300" />
                        </div>
                        <div>
                          <div className="font-bold text-slate-900 group-hover:text-emerald-700 transition-colors">
                            {food.name || "--"}
                          </div>
                          {(food.desc || food.description) && (
                            <div className="text-[11px] text-slate-400 font-normal truncate max-w-xs mt-0.5">
                              {food.desc || food.description}
                            </div>
                          )}
                        </div>
                      </div>
                    </td>

                    <td className="p-3.5 text-slate-700 font-medium">{food.province || (food as any)?.provinceName || "--"}</td>

                    <td className="p-3.5 font-bold text-emerald-800">{priceText}</td>

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

                    <td className="p-3.5 whitespace-nowrap text-[11px]">
                      {(() => {
                        const info = formatUpdatedDate(food);
                        return (
                          <div className="flex items-center gap-1.5">
                            <span className="font-semibold text-slate-800">{info.dateStr}</span>
                          </div>
                        );
                      })()}
                    </td>

                    <td className="p-3.5 text-center" onClick={(e) => e.stopPropagation()}>
                      <button
                        onClick={() => setSelectedFoodId(food.id)}
                        className="px-2.5 py-1 text-xs font-semibold text-emerald-700 hover:bg-emerald-50 rounded-lg transition-colors cursor-pointer"
                      >
                        Chi tiết →
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          {isLoading ? (
            <div className="p-12 text-center text-slate-400">
              <div className="flex flex-col items-center justify-center gap-2">
                <Loader2 size={24} className="animate-spin text-emerald-600" />
                <span>Đang tải danh sách món ăn từ máy chủ...</span>
              </div>
            </div>
          ) : sortedFoods.length === 0 ? (
            <div className="p-8 text-center text-slate-400 font-medium">
              Không tìm thấy món ăn đặc sản nào phù hợp với bộ lọc.
            </div>
          ) : null}
        </div>

        {pagination && pagination.totalElements > 0 && (
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-3 px-1 border-t border-slate-100 text-xs text-slate-500 font-medium">
            <div>
              Hiển thị <strong>{sortedFoods.length}</strong> / <strong>{pagination.totalElements}</strong> món ăn (Trang <strong>{pagination.page}</strong> / {pagination.totalPages || 1})
            </div>

            {pagination.totalPages > 1 && (
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  disabled={pagination.page <= 1 || isLoading}
                  onClick={() => handlePageChange(pagination.page - 1)}
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
                        onClick={() => handlePageChange(pNum)}
                        className={`w-7 h-7 rounded-xl font-bold text-xs transition-colors flex items-center justify-center cursor-pointer ${pagination.page === pNum
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
                  onClick={() => handlePageChange(pagination.page + 1)}
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

/* ── DETAIL & EDIT VIEW FOR FOOD (SUPPORTING AZURE BLOB FILE UPLOAD & CREATE MODE) ── */
interface FoodDetailEditorProps {
  food?: AdminFoodItem;
  isCreateMode?: boolean;
  provincesList?: ProvinceDto[];
  onBack: () => void;
  onSave: (food: AdminFoodItem) => Promise<void> | void;
  onToggleStatus?: () => void;
  onDelete?: () => void;
}

const FoodDetailEditor: React.FC<FoodDetailEditorProps> = ({
  food,
  isCreateMode = false,
  provincesList = [],
  onBack,
  onSave,
  onToggleStatus,
  onDelete,
}) => {
  const [name, setName] = useState(food?.name || "");
  const [province, setProvince] = useState(food?.province || (food as any)?.provinceName || "");
  const [provinceId, setProvinceId] = useState<number | undefined>(food?.provinceId);
  const [minPrice, setMinPrice] = useState(
    food?.minPrice !== undefined && food?.minPrice !== null && food.minPrice > 0
      ? String(food.minPrice)
      : ""
  );
  const [maxPrice, setMaxPrice] = useState(
    food?.maxPrice !== undefined && food?.maxPrice !== null && food.maxPrice > 0
      ? String(food.maxPrice)
      : ""
  );
  const [coverImg, setCoverImg] = useState(food?.coverImg || food?.imageUrl || "");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [desc, setDesc] = useState(food?.desc || food?.description || "");
  const [historyInfo, setHistoryInfo] = useState(food?.historyInfo || "");
  const [status, setStatus] = useState<"active" | "hidden">(
    food?.status || (food?.statusNum === 3 ? "hidden" : "active")
  );
  const [servingPlaces, setServingPlaces] = useState<AdminFoodPlaceDto[]>(() =>
    isCreateMode ? [] : resolveFoodPlaces(food)
  );
  const [isLoadingPlaces, setIsLoadingPlaces] = useState(false);

  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccessMsg, setSaveSuccessMsg] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const placesCount = isCreateMode
    ? 0
    : Math.max(resolvePlacesCount(food), servingPlaces.length);

  useEffect(() => {
    if (isCreateMode || !food) return;

    const initialPlaces = resolveFoodPlaces(food);
    if (initialPlaces.length > 0) {
      setServingPlaces(initialPlaces);
      return;
    }

    let cancelled = false;
    const loadServingPlaces = async () => {
      setIsLoadingPlaces(true);
      try {
        const adminRes: any = await adminService.getFoods({
          keyword: food.name,
          pageSize: 20,
        });
        const adminFoods = extractList<any>(adminRes?.data || adminRes);
        const matchedAdminFood = adminFoods.find(
          (item: any) => Number(item.id ?? item.Id) === Number(food.id)
        );
        const fromAdmin = resolveFoodPlaces(matchedAdminFood);
        if (fromAdmin.length > 0) {
          if (!cancelled) setServingPlaces(fromAdmin);
          return;
        }

        const pubRes = await apiClient.get<any>("/api/foods", {
          params: { keyword: food.name, pageSize: 20 },
        });
        const pubFoods = extractList<any>(pubRes.data?.data || pubRes.data);
        const matchedPubFood = pubFoods.find(
          (item: any) => Number(item.id ?? item.Id) === Number(food.id)
        );
        const rawSuggested =
          matchedPubFood?.suggestedPlaces || matchedPubFood?.SuggestedPlaces || [];

        if (Array.isArray(rawSuggested) && rawSuggested.length > 0) {
          const enriched = await Promise.all(
            rawSuggested.map(async (sp: any) => {
              const pid = Number(sp.placeId ?? sp.PlaceId ?? sp.id ?? sp.Id ?? 0);
              const pName = sp.name ?? sp.Name ?? "";
              let img = sp.coverImageUrl ?? sp.CoverImageUrl ?? sp.imageUrl ?? "";
              if (!img && pid > 0) {
                try {
                  const pDetail: any = await adminService.getPlace(pid);
                  const pData = pDetail?.data || pDetail;
                  img =
                    pData?.coverImageUrl ||
                    pData?.coverImg ||
                    pData?.primaryImageUrl ||
                    (Array.isArray(pData?.media) && pData.media[0]?.url) ||
                    "";
                } catch {
                }
              }
              return {
                id: pid,
                name: pName,
                coverImageUrl: img,
              };
            })
          );
          if (!cancelled) setServingPlaces(enriched);
        }
      } catch {
      } finally {
        if (!cancelled) setIsLoadingPlaces(false);
      }
    };

    loadServingPlaces();
    return () => {
      cancelled = true;
    };
  }, [food, isCreateMode]);

  useEffect(() => {
    if (provincesList && provincesList.length > 0) {
      if (provinceId) {
        const matched = provincesList.find((p) => p.id === provinceId);
        if (matched && !province) {
          setProvince(matched.name);
        }
      } else if (province) {
        const matched = provincesList.find(
          (p) => p.name.toLowerCase() === province.toLowerCase()
        );
        if (matched) {
          setProvinceId(matched.id);
        }
      }
    }
  }, [provincesList, province, provinceId]);

  const handleProvinceChange = (selectedVal: string) => {
    if (provincesList && provincesList.length > 0) {
      const matched = provincesList.find(
        (p) => String(p.id) === selectedVal || p.name.toLowerCase() === selectedVal.toLowerCase()
      );
      if (matched) {
        setProvinceId(matched.id);
        setProvince(matched.name);
        return;
      }
    }
    setProvince(selectedVal);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    const file = e.target.files[0];

    if (file.size > 10 * 1024 * 1024) {
      setErrorMsg("Dung lượng ảnh vượt quá giới hạn cho phép (tối đa 10MB).");
      return;
    }

    const allowedTypes = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
    if (!allowedTypes.includes(file.type.toLowerCase())) {
      setErrorMsg("Định dạng ảnh không hợp lệ. Vui lòng chọn tệp .jpg, .jpeg, .png hoặc .webp.");
      return;
    }

    setImageFile(file);
    setErrorMsg("");
    const previewUrl = URL.createObjectURL(file);
    setCoverImg(previewUrl);
  };

  const handleClearImage = (e: React.MouseEvent) => {
    e.stopPropagation();
    setImageFile(null);
    setCoverImg("");
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");
    setSaveSuccessMsg("");

    if (!name.trim()) {
      setErrorMsg("Vui lòng nhập tên món ăn đặc sản.");
      return;
    }

    const minVal = parseInt(minPrice, 10) || 0;
    const maxVal = parseInt(maxPrice, 10) || 0;
    if (minVal > 0 && maxVal > 0 && minVal > maxVal) {
      setErrorMsg("Mức giá tối thiểu không được lớn hơn mức giá tối đa.");
      return;
    }

    setIsSaving(true);

    try {
      let serverCoverImg = coverImg && !coverImg.startsWith("blob:") ? coverImg : "";
      if (imageFile) {
        try {
          const uploadRes = await adminService.uploadPlaceImages([imageFile]);
          if (uploadRes && uploadRes.length > 0) {
            serverCoverImg = uploadRes[0];
          }
        } catch {
        }
      }

      const jsonPayload = {
        name: name.trim(),
        provinceId: provinceId ? Number(provinceId) : null,
        minPrice: minVal > 0 ? minVal : null,
        maxPrice: maxVal > 0 ? maxVal : null,
        coverImg: serverCoverImg || (coverImg.startsWith("blob:") ? "" : coverImg),
        desc: desc.trim() || null,
        historyInfo: historyInfo.trim() || null,
        status: status || "active",
      };

      const formData = new FormData();
      formData.append("name", name.trim());
      if (provinceId) {
        formData.append("provinceId", String(provinceId));
      }
      if (minPrice) {
        formData.append("minPrice", String(minVal));
      }
      if (maxPrice) {
        formData.append("maxPrice", String(maxVal));
      }
      if (desc.trim()) {
        formData.append("desc", desc.trim());
      }
      if (historyInfo.trim()) {
        formData.append("historyInfo", historyInfo.trim());
      }
      if (status) {
        formData.append("status", status);
      }
      if (imageFile) {
        formData.append("image", imageFile);
      } else if (serverCoverImg) {
        formData.append("coverImg", serverCoverImg);
      }

      if (isCreateMode) {
        let res: any;
        try {
          res = await adminService.createFood(jsonPayload);
        } catch {
          res = await adminService.createFood(formData);
        }

        const createdId = typeof res?.data === "number" ? res.data : res?.data?.id || Date.now();
        const finalImg =
          res?.data?.coverImg ||
          res?.coverImg ||
          serverCoverImg ||
          (coverImg.startsWith("blob:") ? "" : coverImg);

        const newFood: AdminFoodItem = {
          id: createdId,
          name: name.trim(),
          province,
          provinceId: provinceId ? Number(provinceId) : undefined,
          minPrice: minVal,
          maxPrice: maxVal,
          coverImg: finalImg,
          imageUrl: finalImg,
          desc: desc.trim(),
          description: desc.trim(),
          historyInfo: historyInfo.trim(),
          status,
          statusNum: status === "active" ? 1 : 3,
          placesCount: 0,
        };

        await onSave(newFood);
      } else if (food) {
        let res: any;
        try {
          res = await adminService.updateFood(food.id, jsonPayload);
        } catch (updateErr: any) {
          if (updateErr?.response?.status === 415) {
            res = await adminService.updateFood(food.id, formData);
          } else {
            throw updateErr;
          }
        }

        const finalImg = res?.data?.coverImg || res?.coverImg || serverCoverImg || coverImg;

        const updatedFood: AdminFoodItem = {
          ...food,
          name: name.trim(),
          province,
          provinceId: provinceId ? Number(provinceId) : undefined,
          minPrice: minVal,
          maxPrice: maxVal,
          coverImg: finalImg,
          imageUrl: finalImg,
          desc: desc.trim(),
          description: desc.trim(),
          historyInfo: historyInfo.trim(),
          status,
          statusNum: status === "active" ? 1 : 3,
        };

        await onSave(updatedFood);
        setCoverImg(finalImg);
        setImageFile(null);
        setSaveSuccessMsg("Đã lưu thông tin món ăn & cập nhật tỉnh thành thành công!");
        setTimeout(() => setSaveSuccessMsg(""), 5000);
      }
    } catch (err: any) {
      const msg =
        err?.response?.data?.message ||
        err?.message ||
        (isCreateMode
          ? "Có lỗi xảy ra khi tạo món ăn mới. Vui lòng kiểm tra lại."
          : "Có lỗi xảy ra khi cập nhật món ăn. Vui lòng kiểm tra lại.");
      setErrorMsg(msg);
    } finally {
      setIsSaving(false);
    }
  };

  const isHidden = status === "hidden";
  const formattedPrice = `${(parseInt(minPrice, 10) || 0).toLocaleString("vi-VN")} đ – ${(
    parseInt(maxPrice, 10) || 0
  ).toLocaleString("vi-VN")} đ`;

  return (
    <div className="space-y-6 animate-in fade-in duration-200 text-xs font-sans pb-16">
      <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/80 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onBack}
            className="w-9 h-9 sm:w-10 sm:h-10 rounded-2xl bg-white border border-slate-200/80 hover:bg-slate-50 text-slate-600 hover:text-slate-900 flex items-center justify-center transition-colors cursor-pointer shadow-2xs shrink-0"
            title="Quay lại danh sách món ăn"
            aria-label="Quay lại"
          >
            <ArrowLeft size={18} />
          </button>

          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base sm:text-lg font-bold text-slate-900 truncate max-w-md">
                {isCreateMode ? name || "Thêm món ăn / Đặc sản mới" : name || food?.name}
              </h2>
              <span
                className={`inline-flex items-center justify-center px-3.5 py-1 rounded-xl text-xs font-bold border transition-colors ${isCreateMode
                    ? "bg-emerald-100 text-emerald-800 border-emerald-300"
                    : isHidden
                      ? "bg-slate-100 text-slate-700 border-slate-300"
                      : "bg-[#e6fcf5] text-[#087f5b] border-[#63e6be]"
                  }`}
              >
                {isCreateMode ? "Món mới" : isHidden ? "Tạm ẩn" : "Công khai"}
              </span>
            </div>
            <p className="text-[11px] text-slate-400 mt-0.5">
              {isCreateMode
                ? "Nhập thông tin chi tiết và tải ảnh đại diện để thêm món ăn đặc sản vào hệ thống"
                : `Mã đặc sản #${food?.id} • Tỉnh thành: ${province} • Có tại ${placesCount} địa điểm`}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {!isCreateMode && onToggleStatus && (
            <button
              type="button"
              onClick={() => {
                onToggleStatus();
                setStatus((prev: string) => (prev === "active" ? "hidden" : "active"));
              }}
              className={`flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-xl cursor-pointer transition-colors ${isHidden
                  ? "bg-emerald-600 hover:bg-emerald-700 text-white font-bold shadow-xs"
                  : "bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200"
                }`}
              title={isHidden ? "Công khai món ăn lên hệ thống" : "Tạm ẩn món ăn khỏi hệ thống"}
            >
              {isHidden ? <Eye size={14} /> : <EyeOff size={14} />}
              <span>{isHidden ? "Công khai món ăn" : "Tạm ẩn món ăn"}</span>
            </button>
          )}

          {!isCreateMode && onDelete && (
            <button
              type="button"
              onClick={onDelete}
              className="flex items-center gap-1.5 px-3 py-2 border border-rose-200 text-rose-600 hover:bg-rose-50 font-bold rounded-xl cursor-pointer transition-colors"
            >
              <Trash2 size={14} />
              <span>Xóa món ăn</span>
            </button>
          )}

          <button
            type="button"
            onClick={handleFormSubmit}
            disabled={isSaving}
            className="flex items-center gap-1.5 px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white font-bold rounded-xl cursor-pointer shadow-xs transition-colors disabled:opacity-50"
          >
            {isSaving ? (
              <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <Save size={14} />
            )}
            <span>{isSaving ? "Đang lưu..." : isCreateMode ? "Tạo món ăn mới" : "Lưu thay đổi"}</span>
          </button>
        </div>
      </div>

      {errorMsg && (
        <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium flex items-center gap-2 animate-in fade-in">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {saveSuccessMsg && (
        <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center gap-2 animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
          <span>{saveSuccessMsg}</span>
        </div>
      )}

      <form onSubmit={handleFormSubmit}>
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          <div className="lg:col-span-8 space-y-6">
            <div className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200/80 shadow-xs space-y-5">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-3">
                <FileText className="w-4 h-4 text-emerald-700" />
                <span>1. Thông tin món ăn & Đặc sản</span>
              </h3>

              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-800 mb-1.5">
                    Tên món ăn đặc sản <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    placeholder="Ví dụ: Mì Quảng Ếch, Cao Lầu Hội An, Bún Bò Huế..."
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full px-4 py-3 rounded-2xl bg-slate-50/80 border border-slate-200 text-xs sm:text-sm text-slate-900 focus:outline-none focus:bg-white focus:border-emerald-700 transition-all font-semibold"
                  />
                </div>

                <div>
                  <CustomSelect
                    label="Tỉnh / Thành phố đặc trưng *"
                    value={provinceId ? String(provinceId) : province}
                    onChange={(val) => handleProvinceChange(val)}
                    placeholder="-- Chọn Tỉnh / Thành phố --"
                    options={provincesList.map((p) => ({
                      value: String(p.id),
                      label: p.name,
                    }))}
                    size="md"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-800 mb-1.5">
                    Mô tả chi tiết
                  </label>
                  <textarea
                    rows={4}
                    placeholder="Mô tả hương vị, nguyên liệu đặc trưng, cách chế biến và cảm nhận khi thưởng thức món ăn này..."
                    value={desc}
                    onChange={(e) => setDesc(e.target.value)}
                    className="w-full p-3.5 rounded-2xl bg-slate-50/80 border border-slate-200 text-xs sm:text-sm text-slate-900 focus:outline-none focus:bg-white focus:border-emerald-700 leading-relaxed"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-800 mb-1.5 flex items-center gap-1.5">
                    <span>Nguồn gốc, lịch sử và văn hóa truyền thống</span>
                  </label>
                  <textarea
                    rows={3}
                    placeholder="Nguồn gốc hình thành, câu chuyện lịch sử hoặc nét đẹp văn hóa gắn liền với món ăn đặc sản..."
                    value={historyInfo}
                    onChange={(e) => setHistoryInfo(e.target.value)}
                    className="w-full p-3.5 rounded-2xl bg-slate-50/80 border border-slate-200 text-xs sm:text-sm text-slate-900 focus:outline-none focus:bg-white focus:border-emerald-700 leading-relaxed"
                  />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200/80 shadow-xs space-y-5">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-3">
                <DollarSign className="w-4 h-4 text-emerald-700" />
                <span>2. Khoảng giá trung bình (VNĐ)</span>
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-800 mb-1.5">
                    Giá tối thiểu (VNĐ)
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      inputMode="numeric"
                      value={formatThousandDigits(minPrice)}
                      onChange={(e) => setMinPrice(parseThousandDigits(e.target.value))}
                      placeholder="30.000"
                      className="w-full pl-4 pr-10 py-3 rounded-2xl bg-slate-50/80 border border-slate-200 text-xs font-semibold text-slate-900 focus:outline-none focus:bg-white focus:border-emerald-700 font-mono"
                    />
                    <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400 select-none pointer-events-none">
                      đ
                    </span>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-800 mb-1.5">
                    Giá tối đa (VNĐ)
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      inputMode="numeric"
                      value={formatThousandDigits(maxPrice)}
                      onChange={(e) => setMaxPrice(parseThousandDigits(e.target.value))}
                      placeholder="70.000"
                      className="w-full pl-4 pr-10 py-3 rounded-2xl bg-slate-50/80 border border-slate-200 text-xs font-semibold text-slate-900 focus:outline-none focus:bg-white focus:border-emerald-700 font-mono"
                    />
                    <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400 select-none pointer-events-none">
                      đ
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200/80 shadow-xs space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <UploadCloud className="w-4 h-4 text-emerald-700" />
                  <span>3. Hình ảnh món ăn đại diện</span>
                </h3>
                <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-md">
                  Tối đa 10MB
                </span>
              </div>

              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                onChange={handleFileUpload}
                className="hidden"
              />

              {coverImg ? (
                <div className="w-full p-4 border-2 border-dashed border-emerald-300 bg-emerald-50/20 rounded-2xl flex flex-col sm:flex-row items-center gap-4">
                  <div className="w-full sm:w-44 aspect-4/3 rounded-xl overflow-hidden bg-slate-100 border border-slate-200 shrink-0">
                    <img
                      src={coverImg}
                      alt={name || "Ảnh món ăn"}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="flex-1 min-w-0 space-y-3 text-center sm:text-left">
                    <div>
                      <p className="text-xs font-bold text-slate-800 truncate">
                        {imageFile ? `Ảnh mới đã chọn: ${imageFile.name}` : "Ảnh đại diện hiện tại của món ăn"}
                      </p>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        {imageFile
                          ? `Kích thước: ${(imageFile.size / 1024).toFixed(0)} KB • ${imageFile.type}`
                          : "Hỗ trợ định dạng JPG, PNG, WEBP (tối đa 10MB)"}
                      </p>
                    </div>
                    <div className="flex items-center justify-center sm:justify-start gap-2 flex-wrap">
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white border border-slate-200 hover:border-emerald-600 text-slate-700 hover:text-emerald-700 font-bold text-xs transition-colors cursor-pointer shadow-2xs"
                      >
                        <RefreshCw size={13} />
                        <span>Thay đổi ảnh</span>
                      </button>
                      <button
                        type="button"
                        onClick={handleClearImage}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white border border-rose-200 hover:bg-rose-50 text-rose-600 font-bold text-xs transition-colors cursor-pointer shadow-2xs"
                      >
                        <Trash2 size={13} />
                        <span>Xóa ảnh</span>
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full p-6 border-2 border-dashed border-slate-300 hover:border-emerald-600 hover:bg-slate-50 rounded-2xl text-center cursor-pointer transition-all flex flex-col items-center justify-center gap-2"
                >
                  <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center shadow-2xs">
                    <UploadCloud className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-800">
                      Tải ảnh mới từ máy tính (Click để chọn ảnh)
                    </p>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      Định dạng JPG, PNG, WEBP
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="lg:col-span-4 space-y-6 sticky top-6">
            <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <Eye className="w-4 h-4 text-emerald-700" />
                  <span>Bản xem trước trực tiếp</span>
                </h3>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200/60">
                  Live Preview
                </span>
              </div>

              <div className="group flex flex-col select-none bg-white rounded-2xl border border-slate-200/80 p-3 shadow-2xs space-y-3">
                <div className="relative aspect-4/3 w-full rounded-xl overflow-hidden bg-slate-100 flex items-center justify-center">
                  {coverImg ? (
                    <img
                      src={coverImg}
                      alt={name || "Món ăn"}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  ) : (
                    <div className="flex flex-col items-center justify-center text-slate-400 gap-1">
                      <ImageIcon size={24} className="text-slate-300" />
                      <span className="text-[10px] font-medium text-slate-400">Chưa có ảnh</span>
                    </div>
                  )}
                </div>

                <div className="space-y-1.5 pt-1">
                  <div className="flex items-center justify-between gap-2">
                    <h4 className="font-bold text-sm sm:text-base text-slate-900 line-clamp-1">
                      {name.trim() || "--"}
                    </h4>
                    {formattedPrice && (
                      <span className="font-bold text-emerald-800 text-xs shrink-0">{formattedPrice}</span>
                    )}
                  </div>

                  <div className="flex items-center justify-between text-xs text-slate-500">
                    {province ? (
                      <div className="flex items-center gap-1">
                        <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span>{province}</span>
                      </div>
                    ) : (
                      <span />
                    )}
                    {!isCreateMode && (
                      <span className="text-[11px] font-semibold text-emerald-700">
                        Có tại {placesCount} địa điểm
                      </span>
                    )}
                  </div>

                  {desc.trim() && (
                    <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed font-normal">
                      {desc.trim()}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {!isCreateMode && (
              <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs space-y-3.5">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                    <Store className="w-4 h-4 text-emerald-700" />
                    <span>Danh sách địa điểm phục vụ</span>
                  </h3>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200/60">
                    {placesCount} địa điểm
                  </span>
                </div>

                {isLoadingPlaces ? (
                  <div className="py-4 flex items-center justify-center gap-2 text-slate-400 text-xs">
                    <Loader2 size={16} className="animate-spin text-emerald-600" />
                    <span>Đang tải địa điểm...</span>
                  </div>
                ) : servingPlaces.length > 0 ? (
                  <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
                    {servingPlaces.map((place) => (
                      <div
                        key={place.id}
                        className="p-2.5 rounded-xl bg-slate-50/80 border border-slate-200/80 flex items-center gap-3"
                      >
                        {place.coverImageUrl ? (
                          <img
                            src={place.coverImageUrl}
                            alt={place.name}
                            className="w-10 h-10 rounded-lg object-cover border border-slate-200 shrink-0"
                            onError={(e) => {
                              const target = e.target as HTMLImageElement;
                              target.style.display = "none";
                              const sibling = target.nextElementSibling as HTMLElement | null;
                              if (sibling) sibling.style.display = "flex";
                            }}
                          />
                        ) : null}
                        <div
                          className={`w-10 h-10 rounded-lg bg-slate-100 border border-slate-200 items-center justify-center text-slate-400 shrink-0 ${place.coverImageUrl ? "hidden" : "flex"
                            }`}
                        >
                          <ImageIcon size={14} className="text-slate-300" />
                        </div>
                        <div className="font-bold text-slate-800 text-xs truncate flex-1">
                          {place.name}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-slate-500">
                    Chưa có địa điểm nào liên kết phục vụ món ăn này.
                  </p>
                )}
              </div>
            )}
          </div>
        </div>
      </form>
    </div>
  );
};

export default FoodsTab;
