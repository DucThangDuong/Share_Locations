import React, { useState, useRef, useEffect } from "react";
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
  BookOpen,
  ChevronLeft,
  ChevronRight,
  Loader2,
  X,
} from "lucide-react";
import type { AdminFoodItem } from "@/types/admin.types";
import { adminService } from "@/services/adminService";
import { geographyService, type ProvinceDto } from "@/services/geographyService";

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
    status?: string;
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

const DEFAULT_PROVINCES = [
  "Đà Nẵng",
  "Quảng Nam",
  "Thừa Thiên Huế",
  "Khánh Hòa",
  "Lâm Đồng",
  "Hà Nội",
  "TP. Hồ Chí Minh",
  "Bình Định",
  "Kiên Giang",
];

const SPECIALTY_TYPES = [
  "Món nước đặc sản",
  "Đặc sản di sản",
  "Ẩm thực cung đình & dân gian",
  "Ăn vặt & Dân dã",
  "Món bánh truyền thống",
  "Hải sản tươi sống",
  "Đặc sản làm quà",
];

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
  const [selectedFoodId, setSelectedFoodId] = useState<number | null>(null);
  const [isCreatingFood, setIsCreatingFood] = useState(false);
  const [foodSearchText, setFoodSearchText] = useState("");
  const [foodFilterProvince, setFoodFilterProvince] = useState("all");
  const [foodFilterStatus, setFoodFilterStatus] = useState("all");
  const [provincesList, setProvincesList] = useState<ProvinceDto[]>([]);
  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Fetch provinces on mount
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

  const provinceNames = provincesList.length > 0
    ? provincesList.map((p: any) => p.name || p.provinceName || String(p))
    : DEFAULT_PROVINCES;

  const currentFood = selectedFoodId ? foodsList.find((f) => f.id === selectedFoodId) : null;

  // Filter foods
  const filteredFoods = foodsList.filter((f) => {
    if (foodFilterProvince !== "all" && f.province !== foodFilterProvince) return false;
    if (foodFilterStatus !== "all") {
      const isHidden = f.status === "hidden" || f.statusNum === 3;
      if (foodFilterStatus === "active" && isHidden) return false;
      if (foodFilterStatus === "hidden" && !isHidden) return false;
    }
    if (foodSearchText.trim()) {
      const q = foodSearchText.toLowerCase();
      const matchName = (f.name || "").toLowerCase().includes(q);
      const matchProv = (f.province || "").toLowerCase().includes(q);
      const matchType = (f.specialtyType || "").toLowerCase().includes(q);
      const matchDesc = (f.desc || f.description || "").toLowerCase().includes(q);
      if (!matchName && !matchProv && !matchType && !matchDesc) return false;
    }
    return true;
  });

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

  // If create mode is triggered, render FoodDetailEditor in create mode
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

  // If a food item is selected, render full FoodDetailEditor in edit mode
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
    if (onFilterChange) {
      if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
      debounceTimerRef.current = setTimeout(() => {
        onFilterChange({ keyword: val, page: 1 });
      }, 350);
    }
  };

  const handleProvinceChange = (val: string) => {
    setFoodFilterProvince(val);
    onFilterChange?.({ province: val, page: 1 });
  };

  const handleStatusChange = (val: string) => {
    setFoodFilterStatus(val);
    onFilterChange?.({ status: val, page: 1 });
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-150 text-xs font-sans">
      <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-2xs space-y-4">
        {/* Search & Filter Controls (Matching PlacesTab) */}
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
            <select
              value={foodFilterProvince}
              onChange={(e) => handleProvinceChange(e.target.value)}
              className="px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 font-medium text-slate-800 outline-none focus:border-emerald-500 cursor-pointer"
            >
              <option value="all">Tất cả tỉnh thành</option>
              {provinceNames.map((prov: string) => (
                <option key={prov} value={prov}>
                  {prov}
                </option>
              ))}
            </select>

            <select
              value={foodFilterStatus}
              onChange={(e) => handleStatusChange(e.target.value)}
              className="px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 font-medium text-slate-800 outline-none focus:border-emerald-500 cursor-pointer"
            >
              <option value="all">Tất cả trạng thái</option>
              <option value="active">Đang công khai</option>
              <option value="hidden">Đang tạm ẩn</option>
            </select>

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
                <th className="p-3.5 pl-4">Món ăn / Đặc sản</th>
                <th className="p-3.5">Tỉnh / Thành</th>
                <th className="p-3.5">Khoảng giá</th>
                <th className="p-3.5">Trạng thái</th>
                <th className="p-3.5 text-center">Xem chi tiết</th>
                <th className="p-3.5 text-right pr-4">Hành động</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredFoods.map((food) => {
                const isHidden = food.status === "hidden" || food.statusNum === 3;
                const minP = food.minPrice ? food.minPrice.toLocaleString("vi-VN") : "30.000";
                const maxP = food.maxPrice ? food.maxPrice.toLocaleString("vi-VN") : "65.000";
                const priceText = `${minP}đ – ${maxP}đ`;

                return (
                  <tr
                    key={food.id}
                    className="hover:bg-slate-50/60 transition-colors group cursor-pointer"
                    onClick={() => setSelectedFoodId(food.id)}
                  >
                    {/* Food Image & Name */}
                    <td className="p-3.5 pl-4 font-bold text-slate-900">
                      <div className="flex items-center gap-3">
                        <img
                          src={
                            food.coverImg ||
                            food.imageUrl ||
                            "https://images.unsplash.com/photo-1541544741938-0af808871cc0?w=600&h=400&fit=crop"
                          }
                          className="w-10 h-10 rounded-lg object-cover border border-slate-200 shrink-0"
                          alt=""
                        />
                        <div>
                          <div className="font-bold text-slate-900 group-hover:text-emerald-700 transition-colors">
                            {food.name}
                          </div>
                          <div className="text-[11px] text-slate-400 font-normal truncate max-w-xs">
                            {food.specialtyType || food.desc || "Đặc sản ẩm thực địa phương"}
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Province */}
                    <td className="p-3.5 text-slate-700 font-medium">{food.province}</td>

                    {/* Price Range */}
                    <td className="p-3.5 font-bold text-emerald-800">{priceText}</td>

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

                    {/* View Details */}
                    <td className="p-3.5 text-center" onClick={(e) => e.stopPropagation()}>
                      <button
                        onClick={() => setSelectedFoodId(food.id)}
                        className="px-2.5 py-1 text-xs font-semibold text-emerald-700 hover:bg-emerald-50 rounded-lg transition-colors cursor-pointer"
                      >
                        Chi tiết →
                      </button>
                    </td>

                    {/* Action Buttons */}
                    <td className="p-3.5 text-right pr-4" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          type="button"
                          onClick={() => handleToggleHideFood(food.id)}
                          className={`p-1.5 rounded-lg border transition-colors cursor-pointer ${isHidden
                            ? "border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
                            : "border-slate-200 hover:bg-slate-100 text-slate-600"
                            }`}
                          title={isHidden ? "Hiện lại món ăn" : "Tạm ẩn món ăn"}
                        >
                          {isHidden ? <Eye size={13} /> : <EyeOff size={13} />}
                        </button>

                        <button
                          type="button"
                          onClick={() => handleDeleteFood(food.id)}
                          className="p-1.5 rounded-lg border border-rose-200 text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                          title="Xóa món ăn"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
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
          ) : (onFilterChange ? foodsList.length === 0 : filteredFoods.length === 0) ? (
            <div className="p-8 text-center text-slate-400 font-medium">
              Không tìm thấy món ăn đặc sản nào phù hợp với bộ lọc.
            </div>
          ) : null}
        </div>

        {/* Pagination Bar */}
        {pagination && pagination.totalElements > 0 && (
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-3 px-1 border-t border-slate-100 text-xs text-slate-500 font-medium">
            <div>
              Hiển thị <strong>{foodsList.length}</strong> / <strong>{pagination.totalElements}</strong> món ăn (Trang <strong>{pagination.page}</strong> / {pagination.totalPages || 1})
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
  const [province, setProvince] = useState(food?.province || "Đà Nẵng");
  const [provinceId, setProvinceId] = useState<number | undefined>(food?.provinceId);
  const [specialtyType, setSpecialtyType] = useState(
    food?.specialtyType || "Món nước đặc sản"
  );
  const [minPrice, setMinPrice] = useState(String(food?.minPrice || 35000));
  const [maxPrice, setMaxPrice] = useState(String(food?.maxPrice || 65000));
  const [coverImg, setCoverImg] = useState(
    food?.coverImg ||
    food?.imageUrl ||
    "https://images.unsplash.com/photo-1541544741938-0af808871cc0?w=600&h=400&fit=crop"
  );
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [desc, setDesc] = useState(food?.desc || food?.description || "");
  const [historyInfo, setHistoryInfo] = useState(food?.historyInfo || "");
  const [status, setStatus] = useState<"active" | "hidden">(
    food?.status || (food?.statusNum === 3 ? "hidden" : "active")
  );

  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccessMsg, setSaveSuccessMsg] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Initialize provinceId if missing
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

    // Validate size (<= 10MB)
    if (file.size > 10 * 1024 * 1024) {
      setErrorMsg("Dung lượng ảnh vượt quá giới hạn cho phép (tối đa 10MB).");
      return;
    }

    // Validate type (.jpg, .jpeg, .png, .webp)
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
      // 1. Upload new image file if selected
      let serverCoverImg = coverImg && !coverImg.startsWith("blob:") ? coverImg : "";
      if (imageFile) {
        try {
          const uploadRes = await adminService.uploadPlaceImages([imageFile]);
          if (uploadRes && uploadRes.length > 0) {
            serverCoverImg = uploadRes[0];
          }
        } catch {
          // Fallback to existing coverImg
        }
      }

      // 2. Build JSON payload matching backend UpdateAdminFoodInput DTO
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

      // Also prepare fallback FormData in case backend endpoint expects multipart
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
        const finalImg = res?.data?.coverImg || res?.coverImg || serverCoverImg || (coverImg.startsWith("blob:") ? "" : coverImg);

        const newFood: AdminFoodItem = {
          id: createdId,
          name: name.trim(),
          province,
          provinceId: provinceId ? Number(provinceId) : undefined,
          specialtyType,
          minPrice: minVal,
          maxPrice: maxVal,
          coverImg: finalImg,
          imageUrl: finalImg,
          desc: desc.trim() || "Món ăn đặc sản địa phương đặc sắc.",
          description: desc.trim() || "Món ăn đặc sản địa phương đặc sắc.",
          historyInfo: historyInfo.trim(),
          status,
          statusNum: status === "active" ? 1 : 3,
          placesCount: 1,
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
          specialtyType,
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
        (isCreateMode ? "Có lỗi xảy ra khi tạo món ăn mới. Vui lòng kiểm tra lại." : "Có lỗi xảy ra khi cập nhật món ăn. Vui lòng kiểm tra lại.");
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
      {/* Top Header */}
      <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/80 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onBack}
            className="p-2 sm:px-3 sm:py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
            title="Quay lại danh sách món ăn"
          >
            <ArrowLeft size={15} />
            <span className="hidden sm:inline">Quay lại</span>
          </button>

          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base sm:text-lg font-bold text-slate-900 truncate max-w-md">
                {isCreateMode ? (name || "Thêm món ăn / Đặc sản mới") : (name || food?.name)}
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
                : `Mã đặc sản #${food?.id} • Tỉnh thành: ${province}`}
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2 flex-wrap">
          {!isCreateMode && onToggleStatus && (
            <button
              type="button"
              onClick={() => {
                onToggleStatus();
                setStatus((prev: string) => (prev === "active" ? "hidden" : "active"));
              }}
              className="flex items-center gap-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl cursor-pointer transition-colors"
            >
              {isHidden ? <Eye size={14} /> : <EyeOff size={14} />}
              <span>{isHidden ? "Hiện lại trên web" : "Tạm ẩn món ăn"}</span>
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

      {/* Notifications */}
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

      {/* Main Grid Layout - 12 Columns */}
      <form onSubmit={handleFormSubmit}>
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left Column (8 cols): Form Sections */}
          <div className="lg:col-span-8 space-y-6">
            {/* Section 1: Basic Information */}
            <div className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200/80 shadow-xs space-y-5">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-3">
                <FileText className="w-4 h-4 text-emerald-700" />
                <span>1. Thông tin món ăn & Phân loại đặc sản</span>
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

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-800 mb-1.5">
                      Tỉnh / Thành phố đặc trưng <span className="text-rose-500">*</span>
                    </label>
                    <select
                      value={provinceId ? String(provinceId) : province}
                      onChange={(e) => handleProvinceChange(e.target.value)}
                      className="w-full px-3.5 py-3 rounded-2xl bg-slate-50/80 border border-slate-200 text-xs font-medium text-slate-900 focus:outline-none focus:bg-white focus:border-emerald-700 cursor-pointer"
                    >
                      <option value="">-- Chọn Tỉnh / Thành phố --</option>
                      {provincesList && provincesList.length > 0
                        ? provincesList.map((p) => (
                          <option key={p.id} value={p.id}>
                            {p.name}
                          </option>
                        ))
                        : DEFAULT_PROVINCES.map((pName) => (
                          <option key={pName} value={pName}>
                            {pName}
                          </option>
                        ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-800 mb-1.5">
                      Phân loại đặc sản <span className="text-rose-500">*</span>
                    </label>
                    <select
                      value={specialtyType}
                      onChange={(e) => setSpecialtyType(e.target.value)}
                      className="w-full px-3.5 py-3 rounded-2xl bg-slate-50/80 border border-slate-200 text-xs font-medium text-slate-900 focus:outline-none focus:bg-white focus:border-emerald-700 cursor-pointer"
                    >
                      {SPECIALTY_TYPES.map((t) => (
                        <option key={t} value={t}>
                          {t}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-800 mb-1.5">
                    Mô tả chi tiết & Nét đặc trưng của món ăn
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
                    <BookOpen className="w-3.5 h-3.5 text-emerald-700" />
                    <span>Nguồn gốc, lịch sử & văn hóa truyền thống</span>
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

            {/* Section 2: Pricing */}
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
                  <input
                    type="number"
                    value={minPrice}
                    onChange={(e) => setMinPrice(e.target.value)}
                    placeholder="30000"
                    className="w-full px-4 py-3 rounded-2xl bg-slate-50/80 border border-slate-200 text-xs font-semibold text-slate-900 focus:outline-none focus:bg-white focus:border-emerald-700 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-800 mb-1.5">
                    Giá tối đa (VNĐ)
                  </label>
                  <input
                    type="number"
                    value={maxPrice}
                    onChange={(e) => setMaxPrice(e.target.value)}
                    placeholder="70000"
                    className="w-full px-4 py-3 rounded-2xl bg-slate-50/80 border border-slate-200 text-xs font-semibold text-slate-900 focus:outline-none focus:bg-white focus:border-emerald-700 font-mono"
                  />
                </div>
              </div>
            </div>

            {/* Section 3: Image Management (Direct Azure Blob Upload) */}
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

              <div className="space-y-4">
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className={`w-full p-6 border-2 border-dashed rounded-2xl text-center cursor-pointer transition-all flex flex-col items-center justify-center gap-2 ${imageFile
                    ? "border-emerald-600 bg-emerald-50/30"
                    : "border-slate-300 hover:border-emerald-600 hover:bg-slate-50"
                    }`}
                >
                  <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center shadow-2xs">
                    <UploadCloud className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-800">
                      {imageFile
                        ? `Đã chọn tệp: ${imageFile.name}`
                        : "Tải ảnh mới từ máy tính (Click để chọn ảnh)"}
                    </p>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      {imageFile
                        ? `Kích thước: ${(imageFile.size / 1024).toFixed(0)} KB • Định dạng ${imageFile.type}`
                        : "Định dạng JPG, PNG, WEBP"}
                    </p>
                  </div>
                </div>

                {coverImg && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-700">
                        {imageFile ? "Ảnh mới xem trước:" : "Ảnh hiện tại:"}
                      </span>
                      {imageFile && (
                        <button
                          type="button"
                          onClick={() => {
                            setImageFile(null);
                            setCoverImg(food?.coverImg || food?.imageUrl || "");
                          }}
                          className="text-rose-600 hover:text-rose-700 font-bold text-xs hover:underline cursor-pointer"
                        >
                          Hủy chọn ảnh mới
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </div>
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

              {/* Food Discovery Card Replica */}
              <div className="group flex flex-col select-none bg-white rounded-2xl border border-slate-200/80 p-3 shadow-2xs space-y-3">
                <div className="relative aspect-4/3 w-full rounded-xl overflow-hidden bg-slate-100">
                  <img
                    src={coverImg}
                    alt={name || "Món ăn"}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  <span className="absolute top-2 left-2 px-2 py-0.5 rounded-md bg-slate-900/80 backdrop-blur-xs text-white text-[10px] font-bold">
                    {specialtyType}
                  </span>
                </div>

                <div className="space-y-1.5 pt-1">
                  <div className="flex items-center justify-between">
                    <h4 className="font-bold text-sm sm:text-base text-slate-900 line-clamp-1">
                      {name.trim() || "Tên món đặc sản"}
                    </h4>
                    <span className="font-bold text-emerald-800 text-xs">{formattedPrice}</span>
                  </div>

                  <div className="flex items-center gap-1 text-xs text-slate-500">
                    <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span>{province}</span>
                  </div>

                  <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed font-normal">
                    {desc.trim() || "Mô tả về món ăn đặc sản sẽ hiển thị tại đây..."}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
};

export default FoodsTab;
