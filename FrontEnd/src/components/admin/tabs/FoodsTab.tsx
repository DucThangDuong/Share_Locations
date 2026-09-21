import React, { useState, useRef } from "react";
import {
  Utensils,
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
  X,
  Link as LinkIcon,
  Sparkles,
} from "lucide-react";
import type { AdminFoodItem } from "@/types/admin.types";
import { adminService } from "@/services/adminService";

interface FoodsTabProps {
  foodsList: AdminFoodItem[];
  setFoodsList?: React.Dispatch<React.SetStateAction<AdminFoodItem[]>>;
  addAuditLog?: (
    action: string,
    targetName: string,
    details: string,
    type: "approve" | "reject" | "resolve" | "hide" | "edit" | "create"
  ) => void;
  showToast?: (msg: string) => void;
}

const PROVINCE_OPTIONS = [
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
  foodsList,
  setFoodsList,
  addAuditLog,
  showToast,
}) => {
  const [selectedFoodId, setSelectedFoodId] = useState<number | null>(null);
  const [foodSearchText, setFoodSearchText] = useState("");
  const [foodFilterProvince, setFoodFilterProvince] = useState("all");
  const [foodFilterStatus, setFoodFilterStatus] = useState("all");

  // Add Food Modal state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newFoodForm, setNewFoodForm] = useState({
    name: "",
    province: "Đà Nẵng",
    specialtyType: "Món nước đặc sản",
    minPrice: "35000",
    maxPrice: "65000",
    coverImg: "https://images.unsplash.com/photo-1541544741938-0af808871cc0?w=600&h=400&fit=crop",
    desc: "",
  });

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
    await adminService.updateFood(updatedFood.id, updatedFood);
    if (setFoodsList) {
      setFoodsList((prev) =>
        prev.map((f) => (f.id === updatedFood.id ? { ...f, ...updatedFood } : f))
      );
    }
    if (addAuditLog) {
      addAuditLog("Cập nhật thông tin món ăn", updatedFood.name, "Chỉnh sửa thông tin đặc sản", "edit");
    }
    if (showToast) {
      showToast(`Đã cập nhật món "${updatedFood.name}".`);
    }
  };

  const handleAddFoodSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFoodForm.name.trim()) {
      alert("Vui lòng nhập tên món ăn.");
      return;
    }

    const response = await adminService.createFood({
      name: newFoodForm.name.trim(),
      desc: newFoodForm.desc.trim(),
      coverImg: newFoodForm.coverImg.trim(),
      minPrice: parseInt(newFoodForm.minPrice, 10) || 30000,
      maxPrice: parseInt(newFoodForm.maxPrice, 10) || 60000,
      status: "active",
      provinceId: undefined,
    });
    const newFood: AdminFoodItem = {
      id: response.data,
      name: newFoodForm.name.trim(),
      province: newFoodForm.province,
      specialtyType: newFoodForm.specialtyType,
      minPrice: parseInt(newFoodForm.minPrice, 10) || 30000,
      maxPrice: parseInt(newFoodForm.maxPrice, 10) || 60000,
      coverImg:
        newFoodForm.coverImg.trim() ||
        "https://images.unsplash.com/photo-1541544741938-0af808871cc0?w=600&h=400&fit=crop",
      imageUrl:
        newFoodForm.coverImg.trim() ||
        "https://images.unsplash.com/photo-1541544741938-0af808871cc0?w=600&h=400&fit=crop",
      desc: newFoodForm.desc.trim() || "Món ăn đặc sản địa phương đặc sắc.",
      status: "active",
      statusNum: 1,
      placesCount: 1,
    };

    if (setFoodsList) {
      setFoodsList((prev) => [newFood, ...prev]);
    }
    if (addAuditLog) {
      addAuditLog("Thêm món ăn đặc sản mới", newFood.name, "Số hóa món đặc sản vùng miền", "create");
    }
    if (showToast) {
      showToast(`Đã thêm món "${newFood.name}" thành công.`);
    }

    setIsAddModalOpen(false);
    setNewFoodForm({
      name: "",
      province: "Đà Nẵng",
      specialtyType: "Món nước đặc sản",
      minPrice: "35000",
      maxPrice: "65000",
      coverImg: "https://images.unsplash.com/photo-1541544741938-0af808871cc0?w=600&h=400&fit=crop",
      desc: "",
    });
  };

  // If a food item is selected, render full FoodDetailEditor
  if (selectedFoodId && currentFood) {
    return (
      <FoodDetailEditor
        food={currentFood}
        onBack={() => setSelectedFoodId(null)}
        onSave={handleSaveFood}
        onToggleStatus={() => handleToggleHideFood(currentFood.id)}
        onDelete={() => handleDeleteFood(currentFood.id)}
      />
    );
  }

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
              onChange={(e) => setFoodSearchText(e.target.value)}
              className="w-full pl-9 pr-4 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-medium text-slate-800 placeholder:text-slate-400 focus:bg-white outline-none focus:border-emerald-500"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <select
              value={foodFilterProvince}
              onChange={(e) => setFoodFilterProvince(e.target.value)}
              className="px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 font-medium text-slate-800 outline-none focus:border-emerald-500 cursor-pointer"
            >
              <option value="all">Tất cả tỉnh thành</option>
              {PROVINCE_OPTIONS.map((prov) => (
                <option key={prov} value={prov}>
                  {prov}
                </option>
              ))}
            </select>

            <select
              value={foodFilterStatus}
              onChange={(e) => setFoodFilterStatus(e.target.value)}
              className="px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 font-medium text-slate-800 outline-none focus:border-emerald-500 cursor-pointer"
            >
              <option value="all">Tất cả trạng thái</option>
              <option value="active">Đang công khai</option>
              <option value="hidden">Đang tạm ẩn</option>
            </select>

            <button
              onClick={() => setIsAddModalOpen(true)}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold cursor-pointer transition-all shadow-sm shadow-emerald-600/20"
            >
              <Plus size={14} />
              <span>Thêm món ăn</span>
            </button>
          </div>
        </div>

        {/* Foods Table (Minimalist Row-by-Row Layout matching PlacesTab) */}
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
                        className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          isHidden
                            ? "bg-slate-100 text-slate-600"
                            : "bg-emerald-100 text-emerald-800"
                        }`}
                      >
                        {isHidden ? "Đang tạm ẩn" : "Đang công khai"}
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
                          className={`p-1.5 rounded-lg border transition-colors cursor-pointer ${
                            isHidden
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

          {filteredFoods.length === 0 && (
            <div className="p-8 text-center text-slate-400">
              Không tìm thấy món ăn đặc sản nào phù hợp với bộ lọc.
            </div>
          )}
        </div>
      </div>

      {/* Add Food Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 space-y-5 shadow-2xl border border-slate-200 animate-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <Utensils className="w-5 h-5 text-emerald-700" />
                <h3 className="font-bold text-base text-slate-900">Thêm món ăn / Đặc sản mới</h3>
              </div>
              <button
                type="button"
                onClick={() => setIsAddModalOpen(false)}
                className="p-1 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100 cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleAddFoodSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-800 mb-1">
                  Tên món ăn đặc sản <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder="Ví dụ: Mì Quảng Ếch, Bánh Xèo Tôm Nhảy..."
                  value={newFoodForm.name}
                  onChange={(e) => setNewFoodForm({ ...newFoodForm, name: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-900 focus:bg-white focus:border-emerald-600 outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-800 mb-1">Tỉnh / Thành phố</label>
                  <select
                    value={newFoodForm.province}
                    onChange={(e) => setNewFoodForm({ ...newFoodForm, province: e.target.value })}
                    className="w-full px-3 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-medium text-slate-900 focus:bg-white focus:border-emerald-600 outline-none cursor-pointer"
                  >
                    {PROVINCE_OPTIONS.map((p) => (
                      <option key={p} value={p}>
                        {p}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-800 mb-1">Phân loại đặc sản</label>
                  <select
                    value={newFoodForm.specialtyType}
                    onChange={(e) =>
                      setNewFoodForm({ ...newFoodForm, specialtyType: e.target.value })
                    }
                    className="w-full px-3 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-medium text-slate-900 focus:bg-white focus:border-emerald-600 outline-none cursor-pointer"
                  >
                    {SPECIALTY_TYPES.map((t) => (
                      <option key={t} value={t}>
                        {t}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-800 mb-1">Giá tối thiểu (VNĐ)</label>
                  <input
                    type="number"
                    value={newFoodForm.minPrice}
                    onChange={(e) =>
                      setNewFoodForm({ ...newFoodForm, minPrice: e.target.value })
                    }
                    className="w-full px-3 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-900 focus:bg-white focus:border-emerald-600 outline-none font-medium"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-800 mb-1">Giá tối đa (VNĐ)</label>
                  <input
                    type="number"
                    value={newFoodForm.maxPrice}
                    onChange={(e) =>
                      setNewFoodForm({ ...newFoodForm, maxPrice: e.target.value })
                    }
                    className="w-full px-3 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-900 focus:bg-white focus:border-emerald-600 outline-none font-medium"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-800 mb-1">URL hình ảnh món ăn</label>
                <input
                  type="text"
                  placeholder="https://images.unsplash.com/..."
                  value={newFoodForm.coverImg}
                  onChange={(e) => setNewFoodForm({ ...newFoodForm, coverImg: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-900 focus:bg-white focus:border-emerald-600 outline-none"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-800 mb-1">Mô tả món ăn</label>
                <textarea
                  rows={3}
                  placeholder="Chia sẻ hương vị, nguồn gốc, cách thưởng thức đặc sản..."
                  value={newFoodForm.desc}
                  onChange={(e) => setNewFoodForm({ ...newFoodForm, desc: e.target.value })}
                  className="w-full p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-900 focus:bg-white focus:border-emerald-600 outline-none leading-relaxed"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl text-slate-600 hover:bg-slate-100 font-bold cursor-pointer"
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold shadow-sm cursor-pointer"
                >
                  Tạo món ăn mới
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

/* ── DETAIL & EDIT VIEW FOR FOOD (MATCHING ProposePlacePage & PlaceDetailEditor) ── */
interface FoodDetailEditorProps {
  food: AdminFoodItem;
  onBack: () => void;
  onSave: (updatedFood: AdminFoodItem) => void;
  onToggleStatus: () => void;
  onDelete: () => void;
}

const FoodDetailEditor: React.FC<FoodDetailEditorProps> = ({
  food,
  onBack,
  onSave,
  onToggleStatus,
  onDelete,
}) => {
  const [name, setName] = useState(food.name || "");
  const [province, setProvince] = useState(food.province || "Đà Nẵng");
  const [specialtyType, setSpecialtyType] = useState(
    food.specialtyType || "Món nước đặc sản"
  );
  const [minPrice, setMinPrice] = useState(String(food.minPrice || 35000));
  const [maxPrice, setMaxPrice] = useState(String(food.maxPrice || 65000));
  const [coverImg, setCoverImg] = useState(
    food.coverImg ||
      food.imageUrl ||
      "https://images.unsplash.com/photo-1541544741938-0af808871cc0?w=600&h=400&fit=crop"
  );
  const [desc, setDesc] = useState(food.desc || food.description || "");
  const [status, setStatus] = useState<"active" | "hidden">(
    food.status || (food.statusNum === 3 ? "hidden" : "active")
  );

  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccessMsg, setSaveSuccessMsg] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    const file = e.target.files[0];
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") {
        setCoverImg(reader.result);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");

    if (!name.trim()) {
      setErrorMsg("Vui lòng nhập tên món ăn đặc sản.");
      return;
    }

    setIsSaving(true);

    const updatedFood: AdminFoodItem = {
      ...food,
      name: name.trim(),
      province,
      specialtyType,
      minPrice: parseInt(minPrice, 10) || 0,
      maxPrice: parseInt(maxPrice, 10) || 0,
      coverImg,
      imageUrl: coverImg,
      desc: desc.trim(),
      description: desc.trim(),
      status,
      statusNum: status === "active" ? 1 : 3,
    };

    setTimeout(() => {
      onSave(updatedFood);
      setIsSaving(false);
      setSaveSuccessMsg("Đã lưu chỉnh sửa thông tin món ăn thành công!");
      setTimeout(() => setSaveSuccessMsg(""), 4000);
    }, 400);
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
            <span className="hidden sm:inline">Quay lại danh sách</span>
          </button>

          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base sm:text-lg font-bold text-slate-900 truncate max-w-md">
                {name || food.name}
              </h2>
              <span
                className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                  isHidden ? "bg-slate-200 text-slate-700" : "bg-emerald-100 text-emerald-800"
                }`}
              >
                {isHidden ? "Đang tạm ẩn" : "Đang công khai"}
              </span>
            </div>
            <p className="text-[11px] text-slate-400 mt-0.5">
              Mã đặc sản #{food.id} • Tỉnh thành: {province} • Phân loại: {specialtyType}
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2 flex-wrap">
          <button
            type="button"
            onClick={() => {
              onToggleStatus();
              setStatus((prev) => (prev === "active" ? "hidden" : "active"));
            }}
            className="flex items-center gap-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl cursor-pointer transition-colors"
          >
            {isHidden ? <Eye size={14} /> : <EyeOff size={14} />}
            <span>{isHidden ? "Hiện lại trên web" : "Tạm ẩn món ăn"}</span>
          </button>

          <button
            type="button"
            onClick={onDelete}
            className="flex items-center gap-1.5 px-3 py-2 border border-rose-200 text-rose-600 hover:bg-rose-50 font-bold rounded-xl cursor-pointer transition-colors"
          >
            <Trash2 size={14} />
            <span>Xóa món ăn</span>
          </button>

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
            <span>{isSaving ? "Đang lưu..." : "Lưu thay đổi"}</span>
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
                      value={province}
                      onChange={(e) => setProvince(e.target.value)}
                      className="w-full px-3.5 py-3 rounded-2xl bg-slate-50/80 border border-slate-200 text-xs font-medium text-slate-900 focus:outline-none focus:bg-white focus:border-emerald-700 cursor-pointer"
                    >
                      {PROVINCE_OPTIONS.map((p) => (
                        <option key={p} value={p}>
                          {p}
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

            {/* Section 3: Image Management */}
            <div className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200/80 shadow-xs space-y-4">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-3">
                <UploadCloud className="w-4 h-4 text-emerald-700" />
                <span>3. Hình ảnh món ăn đại diện</span>
              </h3>

              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileUpload}
                className="hidden"
              />

              <div className="grid grid-cols-1 sm:grid-cols-12 gap-4 items-center">
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="sm:col-span-8 p-6 border-2 border-dashed border-slate-300 hover:border-emerald-600 rounded-2xl text-center cursor-pointer transition-all flex flex-col items-center justify-center gap-2 hover:bg-slate-50"
                >
                  <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center shadow-2xs">
                    <UploadCloud className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-800">
                      Tải ảnh mới từ máy tính (Click để chọn ảnh)
                    </p>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      Định dạng JPG, PNG, WEBP độ phân giải cao
                    </p>
                  </div>
                </div>

                <div className="sm:col-span-4 aspect-4/3 rounded-2xl overflow-hidden bg-slate-100 border border-slate-200 relative group shadow-2xs">
                  <img src={coverImg} alt={name} className="w-full h-full object-cover" />
                  <span className="absolute bottom-2 left-2 px-2 py-0.5 rounded-md bg-slate-950/70 text-white text-[10px] font-bold">
                    Ảnh hiện tại
                  </span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center gap-1.5">
                  <LinkIcon className="w-3.5 h-3.5 text-slate-400" />
                  <span>Hoặc dán URL hình ảnh trực tuyến</span>
                </label>
                <input
                  type="text"
                  placeholder="https://..."
                  value={coverImg}
                  onChange={(e) => setCoverImg(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-900 focus:outline-none focus:bg-white focus:border-emerald-700"
                />
              </div>
            </div>

            {/* Bottom Action Bar */}
            <div className="p-6 bg-white rounded-3xl border border-slate-200/80 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="text-xs text-slate-500">
                Thông tin chỉnh sửa sẽ được lưu trực tiếp vào danh mục Ẩm thực & Đặc sản hệ thống.
              </div>

              <div className="flex items-center gap-2.5 w-full sm:w-auto">
                <button
                  type="button"
                  onClick={onBack}
                  className="flex-1 sm:flex-none px-5 py-3 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold cursor-pointer transition-all text-center"
                >
                  Quay lại
                </button>

                <button
                  type="submit"
                  disabled={isSaving}
                  className="flex-1 sm:flex-none px-7 py-3 rounded-2xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs sm:text-sm font-bold flex items-center justify-center gap-2 cursor-pointer transition-all shadow-md disabled:opacity-50"
                >
                  {isSaving ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Đang lưu...</span>
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4" />
                      <span>Lưu thông tin món ăn</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* Right Column (4 cols, sticky): Live Preview Card */}
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

            {/* Quick Status Control */}
            <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs space-y-3.5">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-3">
                <Sparkles className="w-4 h-4 text-emerald-700" />
                <span>Trạng thái hiển thị</span>
              </h3>

              <div className="space-y-2 text-xs">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    Chế độ phát hành
                  </label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value as "active" | "hidden")}
                    className="w-full p-2.5 rounded-xl border border-slate-200 bg-slate-50 font-semibold text-slate-800 outline-none focus:border-emerald-600 cursor-pointer"
                  >
                    <option value="active">Đang công khai (Hiển thị cho người dùng)</option>
                    <option value="hidden">Đang tạm ẩn (Ẩn khỏi trang ẩm thực)</option>
                  </select>
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
