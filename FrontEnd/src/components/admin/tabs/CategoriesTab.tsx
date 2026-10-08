import React, { useState, useEffect, useMemo } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  Search,
  Plus,
  CheckCircle2,
  XCircle,
  RefreshCw,
  AlertTriangle,
  MapPin,
  FileText,
  Users,
  ChevronLeft,
  ChevronRight,
  ArrowLeft,
  Save,
  Upload,
} from "lucide-react";
import { adminService, extractList } from "@/services/adminService";
import { CustomSelect } from "@/components/common/CustomSelect";
import type {
  AdminCatalogCategoryItem,
  AdminCatalogPlaceTypeItem,
} from "@/types/admin.types";

interface CategoriesTabProps {
  showToast?: (msg: string) => void;
}

export const CategoriesTab: React.FC<CategoriesTabProps> = ({ showToast }) => {
  const navigate = useNavigate();
  const location = useLocation();

  const [activeSubTab, setActiveSubTab] = useState<"categories" | "placeTypes">("categories");

  // Place Types State
  const [placeTypes, setPlaceTypes] = useState<AdminCatalogPlaceTypeItem[]>([]);
  const [isPlaceTypesLoading, setIsPlaceTypesLoading] = useState(false);

  // Categories State
  const [categories, setCategories] = useState<AdminCatalogCategoryItem[]>([]);
  const [isCategoriesLoading, setIsCategoriesLoading] = useState(false);
  const [categoryFilters, setCategoryFilters] = useState<{
    placeTypeId?: number;
    status?: number;
    keyword?: string;
    page: number;
    pageSize: number;
  }>({
    placeTypeId: undefined,
    status: undefined,
    keyword: "",
    page: 1,
    pageSize: 15,
  });
  const [pagination, setPagination] = useState<{
    pageIndex: number;
    pageSize: number;
    totalCount: number;
    totalPages: number;
  }>({
    pageIndex: 1,
    pageSize: 15,
    totalCount: 0,
    totalPages: 1,
  });

  // Detail View State (Replacing Modals with Dedicated Detail Pages)
  const [detailView, setDetailView] = useState<{
    type: "category" | "placeType";
    mode: "create" | "edit";
    id?: number;
  } | null>(null);

  const [categoryForm, setCategoryForm] = useState({
    placeTypeId: 1,
    name: "",
    slug: "",
    imageUrl: "",
    status: 1,
  });
  const [categoryImageFile, setCategoryImageFile] = useState<File | null>(null);
  const [categoryPreviewUrl, setCategoryPreviewUrl] = useState<string>("");
  const [categoryDetailStats, setCategoryDetailStats] = useState<{
    placeCount?: number;
    blogCount?: number;
    proposalCount?: number;
    assignedAdminsCount?: number;
  }>({});
  const [isSubmittingCategory, setIsSubmittingCategory] = useState(false);

  const [placeTypeForm, setPlaceTypeForm] = useState({
    name: "",
    slug: "",
    imageUrl: "",
    status: 1,
  });
  const [placeTypeImageFile, setPlaceTypeImageFile] = useState<File | null>(null);
  const [placeTypePreviewUrl, setPlaceTypePreviewUrl] = useState<string>("");
  const [isSubmittingPlaceType, setIsSubmittingPlaceType] = useState(false);

  const handleSelectCategoryFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      notify("Vui lòng chọn tệp hình ảnh hợp lệ (PNG, JPG, JPEG, WEBP)");
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      notify("Dung lượng ảnh tối đa cho phép là 10 MB!");
      return;
    }
    setCategoryImageFile(file);
    setCategoryPreviewUrl(URL.createObjectURL(file));
    e.target.value = "";
  };

  const handleClearCategoryImage = () => {
    setCategoryImageFile(null);
    setCategoryPreviewUrl("");
    setCategoryForm((prev) => ({ ...prev, imageUrl: "" }));
  };

  const handleSelectPlaceTypeFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      notify("Vui lòng chọn tệp hình ảnh hợp lệ (PNG, JPG, JPEG, WEBP)");
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      notify("Dung lượng ảnh tối đa cho phép là 10 MB!");
      return;
    }
    setPlaceTypeImageFile(file);
    setPlaceTypePreviewUrl(URL.createObjectURL(file));
    e.target.value = "";
  };

  const handleClearPlaceTypeImage = () => {
    setPlaceTypeImageFile(null);
    setPlaceTypePreviewUrl("");
    setPlaceTypeForm((prev) => ({ ...prev, imageUrl: "" }));
  };

  // Status Action Confirmation
  const [statusConfirm, setStatusConfirm] = useState<{
    isOpen: boolean;
    type: "category" | "placeType";
    id: number;
    name: string;
    targetStatus: number;
    reason: string;
  }>({
    isOpen: false,
    type: "category",
    id: 0,
    name: "",
    targetStatus: 1,
    reason: "",
  });

  const notify = (msg: string) => {
    if (showToast) showToast(msg);
    else alert(msg);
  };

  // Sync with URL Sub-route if any e.g. /admin/categories/new or /admin/categories/12
  useEffect(() => {
    const pathMatch = location.pathname.match(/\/admin\/categories\/(new|\d+)/i);
    if (pathMatch) {
      const param = pathMatch[1];
      if (param === "new") {
        setDetailView({ type: "category", mode: "create" });
        setCategoryForm({
          placeTypeId: placeTypes[0]?.id || 1,
          name: "",
          slug: "",
          imageUrl: "",
          status: 1,
        });
        setCategoryImageFile(null);
        setCategoryPreviewUrl("");
        setCategoryDetailStats({});
      } else {
        const catId = Number(param);
        const found = categories.find((c) => c.id === catId);
        setDetailView({ type: "category", mode: "edit", id: catId });
        setCategoryImageFile(null);
        setCategoryPreviewUrl("");
        if (found) {
          setCategoryForm({
            placeTypeId: found.placeTypeId || placeTypes[0]?.id || 1,
            name: found.name,
            slug: found.slug || generateSlug(found.name),
            imageUrl: found.imageUrl || "",
            status: found.status ?? 1,
          });
          setCategoryDetailStats({
            placeCount: found.placeCount ?? 0,
            blogCount: found.blogCount ?? 0,
            proposalCount: found.proposalCount ?? 0,
            assignedAdminsCount: found.assignedAdminsCount ?? 0,
          });
        }
        // Fetch fresh detail data from BE
        adminService
          .getCatalogCategory(catId)
          .then((res: any) => {
            const d = res?.data || res;
            if (d && d.name) {
              setCategoryForm({
                placeTypeId: d.placeTypeId || placeTypes[0]?.id || 1,
                name: d.name,
                slug: d.slug || generateSlug(d.name),
                imageUrl: d.imageUrl || "",
                status: d.status ?? 1,
              });
              setCategoryDetailStats({
                placeCount: d.placeCount ?? 0,
                blogCount: d.blogCount ?? 0,
                proposalCount: d.proposalCount ?? 0,
                assignedAdminsCount: d.assignedAdminsCount ?? 0,
              });
            }
          })
          .catch(() => { });
      }
    }
  }, [location.pathname, categories.length, placeTypes.length]);

  // 1. Fetch Place Types
  const fetchPlaceTypes = async () => {
    setIsPlaceTypesLoading(true);
    try {
      const res: any = await adminService.getCatalogPlaceTypes();
      const list = extractList<AdminCatalogPlaceTypeItem>(res?.data || res);
      setPlaceTypes(list);
    } catch {
      setPlaceTypes([]);
    } finally {
      setIsPlaceTypesLoading(false);
    }
  };

  // 2. Fetch Categories with Filters & Pagination
  const fetchCategories = async () => {
    setIsCategoriesLoading(true);
    try {
      const cleanParams: any = {
        page: categoryFilters.page,
        pageSize: categoryFilters.pageSize,
      };
      if (categoryFilters.placeTypeId) cleanParams.placeTypeId = categoryFilters.placeTypeId;
      if (categoryFilters.status !== undefined && categoryFilters.status !== null) {
        cleanParams.status = categoryFilters.status;
      }
      if (categoryFilters.keyword?.trim()) {
        cleanParams.keyword = categoryFilters.keyword.trim();
      }

      const res: any = await adminService.getCatalogCategories(cleanParams);
      const list = extractList<AdminCatalogCategoryItem>(res?.data || res);
      setCategories(list);

      const pag = res?.pagination || res?.meta || {};
      const totalCount = Number(pag.totalCount ?? pag.totalElements ?? pag.total ?? list.length);
      const pageSize = Number(pag.pageSize ?? pag.size ?? categoryFilters.pageSize);
      const pageIndex = Number(pag.pageIndex ?? pag.page ?? categoryFilters.page);
      const totalPages = Number(pag.totalPages ?? Math.max(1, Math.ceil(totalCount / pageSize)));

      setPagination({
        pageIndex,
        pageSize,
        totalCount,
        totalPages,
      });
    } catch {
      setCategories([]);
    } finally {
      setIsCategoriesLoading(false);
    }
  };

  useEffect(() => {
    fetchPlaceTypes();
  }, []);

  useEffect(() => {
    fetchCategories();
  }, [categoryFilters.page, categoryFilters.placeTypeId, categoryFilters.status]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setCategoryFilters((prev) => ({ ...prev, page: 1 }));
    fetchCategories();
  };

  const generateSlug = (text: string) => {
    return text
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[đĐ]/g, "d")
      .replace(/[^a-z0-9\s-]/g, "")
      .trim()
      .replace(/\s+/g, "-");
  };

  // Open Detail View for Category
  const handleOpenCategoryDetail = async (cat?: AdminCatalogCategoryItem) => {
    setCategoryImageFile(null);
    setCategoryPreviewUrl("");
    if (cat) {
      setDetailView({ type: "category", mode: "edit", id: cat.id });
      setCategoryForm({
        placeTypeId: cat.placeTypeId || placeTypes[0]?.id || 1,
        name: cat.name,
        slug: cat.slug || generateSlug(cat.name),
        imageUrl: cat.imageUrl || "",
        status: cat.status ?? 1,
      });
      setCategoryDetailStats({
        placeCount: cat.placeCount ?? 0,
        blogCount: cat.blogCount ?? 0,
        proposalCount: cat.proposalCount ?? 0,
        assignedAdminsCount: cat.assignedAdminsCount ?? 0,
      });
      navigate(`/admin/categories/${cat.id}`);

      try {
        const detail = await adminService.getCatalogCategory(cat.id);
        const d = (detail as any)?.data || detail;
        if (d && d.name) {
          setCategoryForm({
            placeTypeId: d.placeTypeId || placeTypes[0]?.id || 1,
            name: d.name,
            slug: d.slug || generateSlug(d.name),
            imageUrl: d.imageUrl || "",
            status: d.status ?? 1,
          });
          setCategoryDetailStats({
            placeCount: d.placeCount ?? 0,
            blogCount: d.blogCount ?? 0,
            proposalCount: d.proposalCount ?? 0,
            assignedAdminsCount: d.assignedAdminsCount ?? 0,
          });
        }
      } catch {
        // Keep initial cat stats
      }
    } else {
      setDetailView({ type: "category", mode: "create" });
      setCategoryForm({
        placeTypeId: placeTypes[0]?.id || 1,
        name: "",
        slug: "",
        imageUrl: "",
        status: 1,
      });
      setCategoryDetailStats({});
      navigate("/admin/categories/new");
    }
  };

  // Open Detail View for PlaceType
  const handleOpenPlaceTypeDetail = (pt?: AdminCatalogPlaceTypeItem) => {
    setPlaceTypeImageFile(null);
    setPlaceTypePreviewUrl("");
    if (pt) {
      setDetailView({ type: "placeType", mode: "edit", id: pt.id });
      setPlaceTypeForm({
        name: pt.name,
        slug: pt.slug || generateSlug(pt.name),
        imageUrl: pt.imageUrl || "",
        status: pt.status ?? 1,
      });
    } else {
      setDetailView({ type: "placeType", mode: "create" });
      setPlaceTypeForm({
        name: "",
        slug: "",
        imageUrl: "",
        status: 1,
      });
    }
  };

  const handleBackToList = () => {
    setDetailView(null);
    setCategoryImageFile(null);
    setCategoryPreviewUrl("");
    setPlaceTypeImageFile(null);
    setPlaceTypePreviewUrl("");
    navigate("/admin/categories");
  };

  // Save Category using multipart/form-data for direct Azure Blob upload
  const handleSaveCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!categoryForm.name.trim()) {
      notify("Vui lòng nhập tên danh mục!");
      return;
    }

    setIsSubmittingCategory(true);
    try {
      const formData = new FormData();
      formData.append("name", categoryForm.name.trim());
      formData.append("placeTypeId", String(categoryForm.placeTypeId));
      const slugVal = categoryForm.slug.trim() || generateSlug(categoryForm.name);
      if (slugVal) formData.append("slug", slugVal);
      formData.append("status", String(categoryForm.status));
      if (categoryForm.imageUrl) formData.append("imageUrl", categoryForm.imageUrl);

      if (categoryImageFile) {
        formData.append("image", categoryImageFile);
      }

      if (detailView?.mode === "edit" && detailView.id) {
        await adminService.updateCatalogCategory(detailView.id, formData);
        notify("Cập nhật danh mục thành công!");
      } else {
        await adminService.createCatalogCategory(formData);
        notify("Thêm mới danh mục thành công!");
      }
      handleBackToList();
      fetchCategories();
    } catch (err: any) {
      const msg = err?.response?.data?.message || err?.message || "Có lỗi xảy ra khi lưu danh mục.";
      notify(msg);
    } finally {
      setIsSubmittingCategory(false);
    }
  };

  // Save PlaceType using multipart/form-data for direct Azure Blob upload
  const handleSavePlaceType = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!placeTypeForm.name.trim()) {
      notify("Vui lòng nhập tên loại địa điểm lớn!");
      return;
    }

    setIsSubmittingPlaceType(true);
    try {
      const formData = new FormData();
      formData.append("name", placeTypeForm.name.trim());
      const slugVal = placeTypeForm.slug.trim() || generateSlug(placeTypeForm.name);
      if (slugVal) formData.append("slug", slugVal);
      formData.append("status", String(placeTypeForm.status));
      if (placeTypeForm.imageUrl) formData.append("imageUrl", placeTypeForm.imageUrl);

      if (placeTypeImageFile) {
        formData.append("image", placeTypeImageFile);
      }

      if (detailView?.mode === "edit" && detailView.id) {
        await adminService.updateCatalogPlaceType(detailView.id, formData);
        notify("Cập nhật loại địa điểm thành công!");
      } else {
        await adminService.createCatalogPlaceType(formData);
        notify("Tạo mới loại địa điểm thành công!");
      }
      setDetailView(null);
      setPlaceTypeImageFile(null);
      setPlaceTypePreviewUrl("");
      fetchPlaceTypes();
    } catch (err: any) {
      const msg = err?.response?.data?.message || err?.message || "Có lỗi xảy ra khi lưu loại địa điểm.";
      notify(msg);
    } finally {
      setIsSubmittingPlaceType(false);
    }
  };

  // Toggle Status
  const handleExecuteStatusToggle = async () => {
    const { type, id, targetStatus, reason } = statusConfirm;
    try {
      if (type === "category") {
        await adminService.updateCatalogCategoryStatus(id, targetStatus, reason || undefined);
        notify(`Đã chuyển trạng thái danh mục sang ${targetStatus === 1 ? "Hoạt động" : "Tạm ẩn"}.`);
        fetchCategories();
      } else {
        await adminService.updateCatalogPlaceTypeStatus(id, targetStatus, reason || undefined);
        notify(`Đã chuyển trạng thái loại địa điểm sang ${targetStatus === 1 ? "Hoạt động" : "Tạm ẩn"}.`);
        fetchPlaceTypes();
      }
      setStatusConfirm((prev) => ({ ...prev, isOpen: false }));
    } catch (err: any) {
      const msg = err?.response?.data?.message || err?.message || "Lỗi khi cập nhật trạng thái.";
      notify(msg);
    }
  };

  const categoryStats = useMemo(() => {
    const total = pagination.totalCount || categories.length;
    const active = categories.filter((c) => c.status === 1).length;
    const inactive = categories.filter((c) => c.status === 2).length;
    return { total, active, inactive };
  }, [categories, pagination.totalCount]);

  if (detailView?.type === "category") {
    const isEdit = detailView.mode === "edit";
    const currentCat = isEdit ? categories.find((c) => c.id === detailView.id) : null;
    const activePreview = categoryPreviewUrl || categoryForm.imageUrl;

    return (
      <div className="space-y-4 animate-in fade-in duration-150 text-xs">
        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-2xs flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={handleBackToList}
              className="p-2 rounded-xl text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-colors cursor-pointer"
              title="Quay lại danh sách"
            >
              <ArrowLeft size={18} />
            </button>
            <div>
              <div className="font-bold text-slate-900 text-sm flex items-center gap-2">
                <span>{isEdit ? `Chi tiết Danh mục: ${currentCat?.name || `#${detailView.id}`}` : "Tạo mới danh mục con"}</span>
              </div>
              <p className="text-[11px] text-slate-400">
                {isEdit ? "Chỉnh sửa thông tin, phân loại trực thuộc và trạng thái danh mục" : "Thiết lập danh mục phân loại mới vào hệ thống"}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleBackToList}
              className="px-4 py-2 border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold rounded-xl cursor-pointer"
            >
              Quay lại
            </button>
            <button
              type="submit"
              form="category-detail-form"
              disabled={isSubmittingCategory}
              className="flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl transition-all shadow-sm shadow-emerald-600/20 cursor-pointer disabled:opacity-50"
            >
              <Save size={15} />
              <span>{isSubmittingCategory ? "Đang lưu..." : isEdit ? "Lưu thay đổi" : "Tạo danh mục"}</span>
            </button>
          </div>
        </div>

        {/* Main Form Content */}
        <form id="category-detail-form" onSubmit={handleSaveCategory} className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Left Column: Form Details */}
          <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-2xs space-y-4">
            <h3 className="font-bold text-slate-900 text-sm border-b border-slate-100 pb-3">
              Thông tin danh mục con
            </h3>

            <div>
              <label className="block text-slate-700 font-bold mb-1.5">Danh mục chính</label>
              <CustomSelect
                value={categoryForm.placeTypeId}
                onChange={(val) => setCategoryForm({ ...categoryForm, placeTypeId: Number(val) })}
                options={placeTypes.map((pt) => ({ value: pt.id, label: pt.name }))}
                size="md"
              />
            </div>

            <div>
              <label className="block text-slate-700 font-bold mb-1.5">Tên danh mục con *</label>
              <input
                type="text"
                placeholder="Ví dụ: Quán Cà Phê &amp; Trà Sữa"
                value={categoryForm.name}
                onChange={(e) => {
                  const val = e.target.value;
                  setCategoryForm({
                    ...categoryForm,
                    name: val,
                    slug: isEdit ? categoryForm.slug : generateSlug(val),
                  });
                }}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 font-medium"
                required
              />
            </div>

            <div>
              <label className="block text-slate-700 font-bold mb-1.5">Slug</label>
              <input
                type="text"
                placeholder="quan-ca-phe-tra-sua"
                value={categoryForm.slug}
                onChange={(e) => setCategoryForm({ ...categoryForm, slug: e.target.value })}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="block text-slate-700 font-bold mb-1.5">Ảnh đại diện danh mục</label>
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
                <label className="flex items-center gap-2 px-4 py-2.5 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-emerald-800 rounded-xl font-bold text-xs transition-colors cursor-pointer shadow-2xs">
                  <Upload size={16} className="text-emerald-600" />
                  <span>{categoryImageFile ? "Đã chọn ảnh mới" : "Tải ảnh lên "}</span>
                  <input
                    type="file"
                    accept="image/png,image/jpeg,image/jpg,image/webp"
                    onChange={handleSelectCategoryFile}
                    className="hidden"
                  />
                </label>
                {activePreview && (
                  <button
                    type="button"
                    onClick={handleClearCategoryImage}
                    className="px-3 py-2 text-xs font-semibold text-rose-600 hover:bg-rose-50 rounded-xl transition-colors cursor-pointer"
                  >
                    Gỡ ảnh
                  </button>
                )}
              </div>
              <p className="text-[10px] text-slate-400 mt-1.5">
                Định dạng hỗ trợ: JPG, PNG, WEBP (tối đa 10 MB).
              </p>
            </div>
          </div>

          {/* Right Column: Status & Stats Card */}
          <div className="space-y-4">
            <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-2xs space-y-4">
              <h4 className="font-bold text-slate-900 text-xs border-b border-slate-100 pb-2">
                Trạng thái hiển thị
              </h4>

              <div>
                <CustomSelect
                  value={categoryForm.status}
                  onChange={(val) => setCategoryForm({ ...categoryForm, status: Number(val) })}
                  options={[
                    { value: 1, label: "Hoạt động" },
                    { value: 2, label: "Tạm ẩn" },
                  ]}
                  size="md"
                />
              </div>

              {/* Image Preview Box */}
              <div className="pt-2">
                <span className="block text-slate-500 text-[11px] font-bold mb-1.5">Xem trước hình ảnh:</span>
                <div className="h-32 rounded-xl bg-slate-100 border border-slate-200 overflow-hidden flex items-center justify-center">
                  {activePreview ? (
                    <img src={activePreview} alt="Preview" className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-xs text-slate-400 font-medium">Chưa có ảnh</span>
                  )}
                </div>
              </div>
            </div>

            {isEdit && (
              <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-2xs space-y-3">
                <h4 className="font-bold text-slate-900 text-xs border-b border-slate-100 pb-2">
                  Dữ liệu liên kết trong hệ thống
                </h4>
                <div className="space-y-2 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500 flex items-center gap-1.5">
                      <MapPin size={13} className="text-emerald-500" />
                      Địa điểm liên kết:
                    </span>
                    <span className="font-bold text-slate-800">{categoryDetailStats.placeCount ?? currentCat?.placeCount ?? 0}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500 flex items-center gap-1.5">
                      <FileText size={13} className="text-blue-500" />
                      Bài viết cẩm nang:
                    </span>
                    <span className="font-bold text-slate-800">{categoryDetailStats.blogCount ?? currentCat?.blogCount ?? 0}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500 flex items-center gap-1.5">
                      <FileText size={13} className="text-amber-500" />
                      Đề xuất liên quan:
                    </span>
                    <span className="font-bold text-slate-800">{categoryDetailStats.proposalCount ?? currentCat?.proposalCount ?? 0}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500 flex items-center gap-1.5">
                      <Users size={13} className="text-purple-500" />
                      Admin quản lý:
                    </span>
                    <span className="font-bold text-slate-800">{categoryDetailStats.assignedAdminsCount ?? currentCat?.assignedAdminsCount ?? 0}</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </form>
      </div>
    );
  }
  if (detailView?.type === "placeType") {
    const isEdit = detailView.mode === "edit";
    const currentPt = isEdit ? placeTypes.find((p) => p.id === detailView.id) : null;
    const activePreview = placeTypePreviewUrl || placeTypeForm.imageUrl;

    return (
      <div className="space-y-4 animate-in fade-in duration-150 text-xs">
        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-2xs flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setDetailView(null)}
              className="p-2 rounded-xl text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-colors cursor-pointer"
              title="Quay lại danh sách"
            >
              <ArrowLeft size={18} />
            </button>
            <div>
              <div className="font-bold text-slate-900 text-sm flex items-center gap-2">
                <span>{isEdit ? `Chi tiết danh mục: ${currentPt?.name || `#${detailView.id}`}` : "Tạo mới Danh mục"}</span>
              </div>
              <p className="text-[11px] text-slate-400">
                {isEdit ? "Cập nhật thông tin danh mục" : "Thiết lập danh mục mới"}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setDetailView(null)}
              className="px-4 py-2 border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold rounded-xl cursor-pointer"
            >
              Quay lại
            </button>
            <button
              type="submit"
              form="placetype-detail-form"
              disabled={isSubmittingPlaceType}
              className="flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl transition-all shadow-sm shadow-emerald-600/20 cursor-pointer disabled:opacity-50"
            >
              <Save size={15} />
              <span>{isSubmittingPlaceType ? "Đang lưu..." : isEdit ? "Lưu thay đổi" : "Tạo mới"}</span>
            </button>
          </div>
        </div>

        <form id="placetype-detail-form" onSubmit={handleSavePlaceType} className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-2xs space-y-4">
            <h3 className="font-bold text-slate-900 text-sm border-b border-slate-100 pb-3">
              Thông tin danh mục
            </h3>

            <div>
              <label className="block text-slate-700 font-bold mb-1.5">Tên danh mục *</label>
              <input
                type="text"
                placeholder="Ví dụ: Danh mục"
                value={placeTypeForm.name}
                onChange={(e) => {
                  const val = e.target.value;
                  setPlaceTypeForm({
                    ...placeTypeForm,
                    name: val,
                    slug: isEdit ? placeTypeForm.slug : generateSlug(val),
                  });
                }}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 font-medium"
                required
              />
            </div>

            <div>
              <label className="block text-slate-700 font-bold mb-1.5">Slug</label>
              <input
                type="text"
                placeholder="trai-nghiem-ngoai-troi"
                value={placeTypeForm.slug}
                onChange={(e) => setPlaceTypeForm({ ...placeTypeForm, slug: e.target.value })}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="block text-slate-700 font-bold mb-1.5">Ảnh bìa minh họa</label>
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
                <label className="flex items-center gap-2 px-4 py-2.5 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-emerald-800 rounded-xl font-bold text-xs transition-colors cursor-pointer shadow-2xs">
                  <Upload size={16} className="text-emerald-600" />
                  <span>{placeTypeImageFile ? "Đã chọn ảnh mới" : "Tải ảnh lên"}</span>
                  <input
                    type="file"
                    accept="image/png,image/jpeg,image/jpg,image/webp"
                    onChange={handleSelectPlaceTypeFile}
                    className="hidden"
                  />
                </label>
                {activePreview && (
                  <button
                    type="button"
                    onClick={handleClearPlaceTypeImage}
                    className="px-3 py-2 text-xs font-semibold text-rose-600 hover:bg-rose-50 rounded-xl transition-colors cursor-pointer"
                  >
                    Gỡ ảnh
                  </button>
                )}
              </div>
              <p className="text-[10px] text-slate-400 mt-1.5">
                Định dạng hỗ trợ: JPG, PNG, WEBP (tối đa 10 MB).
              </p>
            </div>
          </div>

          <div className="space-y-4">
            <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-2xs space-y-4">
              <h4 className="font-bold text-slate-900 text-xs border-b border-slate-100 pb-2">
                Trạng thái hoạt động
              </h4>

              <CustomSelect
                value={placeTypeForm.status}
                onChange={(val) => setPlaceTypeForm({ ...placeTypeForm, status: Number(val) })}
                options={[
                  { value: 1, label: "Hoạt động" },
                  { value: 2, label: "Tạm ẩn" },
                ]}
                size="md"
              />

              <div className="pt-2">
                <span className="block text-slate-500 text-[11px] font-bold mb-1.5">Ảnh bìa:</span>
                <div className="h-32 rounded-xl bg-slate-100 border border-slate-200 overflow-hidden flex items-center justify-center">
                  {activePreview ? (
                    <img src={activePreview} alt="Preview" className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-xs text-slate-400 font-medium">Chưa có ảnh</span>
                  )}
                </div>
              </div>
            </div>

            {isEdit && currentPt && (
              <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-2xs space-y-3">
                <h4 className="font-bold text-slate-900 text-xs border-b border-slate-100 pb-2">
                  Danh mục con
                </h4>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-500">Danh mục con trực thuộc:</span>
                  <span className="font-bold text-slate-800">{currentPt.totalCategories ?? 0}</span>
                </div>
              </div>
            )}
          </div>
        </form>
      </div>
    );
  }

  return (
    <div className="space-y-4 animate-in fade-in duration-150 text-xs">
      {/* Sub-tab Navigation */}
      <div className="flex items-center justify-between bg-white px-4 py-2.5 rounded-2xl border border-slate-200/80 shadow-2xs">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveSubTab("categories")}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl font-bold transition-all cursor-pointer ${activeSubTab === "categories"
              ? "bg-emerald-600 text-white shadow-sm shadow-emerald-600/20"
              : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
              }`}
          >
            <span>Danh mục con ({pagination.totalCount || categories.length})</span>
          </button>

          <button
            onClick={() => setActiveSubTab("placeTypes")}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl font-bold transition-all cursor-pointer ${activeSubTab === "placeTypes"
              ? "bg-emerald-600 text-white shadow-sm shadow-emerald-600/20"
              : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
              }`}
          >
            <span>Danh mục ({placeTypes.length})</span>
          </button>
        </div>

        <div className="hidden sm:flex items-center gap-2">
          <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold bg-slate-100 text-slate-700 border border-slate-200">
            Tổng: {categoryStats.total} danh mục
          </span>
          <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
            {categoryStats.active} đang hoạt động
          </span>
        </div>
      </div>

      {/* 1. CATEGORIES LIST */}
      {activeSubTab === "categories" && (
        <div className="space-y-4">
          <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-2xs flex flex-col lg:flex-row items-center justify-between gap-3">
            <form onSubmit={handleSearchSubmit} className="flex flex-1 items-center gap-2 w-full">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={15} />
                <input
                  type="text"
                  placeholder="Tìm kiếm danh mục theo tên, từ khóa..."
                  value={categoryFilters.keyword}
                  onChange={(e) => setCategoryFilters((prev) => ({ ...prev, keyword: e.target.value }))}
                  className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                />
              </div>

              <CustomSelect
                value={categoryFilters.placeTypeId ?? ""}
                onChange={(val) =>
                  setCategoryFilters((prev) => ({
                    ...prev,
                    placeTypeId: val ? Number(val) : undefined,
                    page: 1,
                  }))
                }
                options={[
                  { value: "", label: "Tất cả loại địa điểm" },
                  ...placeTypes.map((pt) => ({ value: pt.id, label: pt.name })),
                ]}
                size="sm"
                className="min-w-[150px] shrink-0"
              />

              <CustomSelect
                value={categoryFilters.status !== undefined && categoryFilters.status !== null ? String(categoryFilters.status) : ""}
                onChange={(val) =>
                  setCategoryFilters((prev) => ({
                    ...prev,
                    status: val !== "" ? Number(val) : undefined,
                    page: 1,
                  }))
                }
                options={[
                  { value: "", label: "Tất cả trạng thái" },
                  { value: "1", label: "Đang hoạt động" },
                  { value: "2", label: "Tạm ẩn" },
                ]}
                size="sm"
                className="min-w-[140px] shrink-0"
              />

              <button
                type="submit"
                className="px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl transition-colors cursor-pointer shrink-0"
              >
                Lọc
              </button>
            </form>

            <div className="flex items-center gap-2 w-full lg:w-auto justify-end">
              <button
                onClick={() => fetchCategories()}
                className="p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
                title="Làm mới"
              >
                <RefreshCw size={16} className={isCategoriesLoading ? "animate-spin text-emerald-600" : ""} />
              </button>

              <button
                onClick={() => handleOpenCategoryDetail()}
                className="flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl transition-all shadow-sm shadow-emerald-600/20 cursor-pointer shrink-0"
              >
                <Plus size={16} />
                <span>Thêm danh mục mới</span>
              </button>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-2xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-500 font-bold text-[11px] uppercase tracking-wider">
                    <th className="p-3.5 pl-4">Danh mục con</th>
                    <th className="p-3.5">Danh mục chính</th>
                    <th className="p-3.5 text-center">Thống kê liên kết</th>
                    <th className="p-3.5">Trạng thái</th>
                    <th className="p-3.5 pr-4 text-center">Xem chi tiết</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium">
                  {categories.map((cat) => {
                    const isActive = cat.status === 1;
                    return (
                      <tr
                        key={cat.id}
                        onClick={() => handleOpenCategoryDetail(cat)}
                        className="hover:bg-slate-50/80 transition-colors cursor-pointer group"
                      >
                        <td className="p-3.5 pl-4">
                          <div className="flex items-center gap-3">
                            {cat.imageUrl && (
                              <img src={cat.imageUrl} alt={cat.name} className="w-9 h-9 rounded-xl object-cover shrink-0 border border-slate-200" />
                            )}
                            <div>
                              <div className="font-bold text-slate-900 text-xs group-hover:text-emerald-600 transition-colors">
                                {cat.name}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="p-3.5">
                          <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-[11px] font-bold bg-slate-100 text-slate-700 border border-slate-200">
                            {cat.placeTypeName || "Trụ cột chung"}
                          </span>
                        </td>
                        <td className="p-3.5 text-center">
                          <div className="inline-flex items-center gap-3 text-[11px] text-slate-600">
                            <span title="Địa điểm liên kết" className="flex items-center gap-1 font-bold text-slate-800">
                              <MapPin size={12} className="text-emerald-500" />
                              {cat.placeCount ?? 0}
                            </span>
                            <span title="Bài viết cẩm nang" className="flex items-center gap-1">
                              <FileText size={12} className="text-blue-500" />
                              {cat.blogCount ?? 0}
                            </span>
                            <span title="Admin phụ trách" className="flex items-center gap-1">
                              <Users size={12} className="text-purple-500" />
                              {cat.assignedAdminsCount ?? 0}
                            </span>
                          </div>
                        </td>
                        <td className="p-3.5" onClick={(e) => e.stopPropagation()}>
                          <button
                            onClick={() =>
                              setStatusConfirm({
                                isOpen: true,
                                type: "category",
                                id: cat.id,
                                name: cat.name,
                                targetStatus: isActive ? 2 : 1,
                                reason: "",
                              })
                            }
                            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold transition-all cursor-pointer ${isActive
                              ? "bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100"
                              : "bg-slate-100 text-slate-500 border border-slate-200 hover:bg-slate-200"
                              }`}
                            title="Bấm để đổi trạng thái"
                          >
                            {isActive ? <CheckCircle2 size={12} /> : <XCircle size={12} />}
                            <span>{cat.statusName || (isActive ? "Hoạt động" : "Tạm ẩn")}</span>
                          </button>
                        </td>
                        <td className="p-3.5 text-center" onClick={(e) => e.stopPropagation()}>
                          <button
                            type="button"
                            onClick={() => handleOpenCategoryDetail(cat)}
                            className="px-2.5 py-1 text-xs font-semibold text-emerald-700 hover:bg-emerald-50 rounded-lg transition-colors cursor-pointer"
                          >
                            Chi tiết →
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                  {categories.length === 0 && !isCategoriesLoading && (
                    <tr>
                      <td colSpan={5} className="p-10 text-center text-slate-400">
                        Không có danh mục nào phù hợp với bộ lọc tìm kiếm.
                      </td>
                    </tr>
                  )}
                  {isCategoriesLoading && (
                    <tr>
                      <td colSpan={5} className="p-10 text-center text-slate-400">
                        <RefreshCw size={20} className="animate-spin mx-auto text-emerald-600 mb-2" />
                        Đang tải danh mục nền tảng...
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {pagination.totalPages > 1 && (
              <div className="p-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                <div>
                  Trang <span className="font-bold text-slate-900">{pagination.pageIndex}</span> /{" "}
                  <span className="font-bold text-slate-900">{pagination.totalPages}</span> (Tổng{" "}
                  <span className="font-bold text-slate-900">{pagination.totalCount}</span> danh mục)
                </div>
                <div className="flex items-center gap-1.5">
                  <button
                    disabled={pagination.pageIndex <= 1}
                    onClick={() => setCategoryFilters((prev) => ({ ...prev, page: prev.page - 1 }))}
                    className="p-1.5 border border-slate-200 rounded-lg hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                  >
                    <ChevronLeft size={16} />
                  </button>
                  <button
                    disabled={pagination.pageIndex >= pagination.totalPages}
                    onClick={() => setCategoryFilters((prev) => ({ ...prev, page: prev.page + 1 }))}
                    className="p-1.5 border border-slate-200 rounded-lg hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                  >
                    <ChevronRight size={16} />
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 2. PLACE TYPES LIST */}
      {activeSubTab === "placeTypes" && (
        <div className="space-y-4">
          <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-2xs flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="font-bold text-slate-800">Danh sách các danh mục</span>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => fetchPlaceTypes()}
                className="p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
                title="Làm mới"
              >
                <RefreshCw size={16} className={isPlaceTypesLoading ? "animate-spin text-emerald-600" : ""} />
              </button>

              <button
                onClick={() => handleOpenPlaceTypeDetail()}
                className="flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl transition-all shadow-sm shadow-emerald-600/20 cursor-pointer"
              >
                <Plus size={16} />
                <span>Thêm danh mục</span>
              </button>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-2xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-500 font-bold text-[11px] uppercase tracking-wider">
                    <th className="p-3.5 pl-4">Trụ cột lớn</th>
                    <th className="p-3.5">Danh mục con trực thuộc</th>
                    <th className="p-3.5">Trạng thái</th>
                    <th className="p-3.5 pr-4 text-center">Xem chi tiết</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium">
                  {placeTypes.map((pt) => {
                    const isActive = pt.status === 1;
                    return (
                      <tr
                        key={pt.id}
                        onClick={() => handleOpenPlaceTypeDetail(pt)}
                        className="hover:bg-slate-50/80 transition-colors cursor-pointer group"
                      >
                        <td className="p-3.5 pl-4">
                          <div className="flex items-center gap-3">
                            {pt.imageUrl && (
                              <img src={pt.imageUrl} alt={pt.name} className="w-9 h-9 rounded-xl object-cover shrink-0 border border-slate-200" />
                            )}
                            <div>
                              <div className="font-bold text-slate-900 text-xs group-hover:text-emerald-600 transition-colors">
                                {pt.name}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="p-3.5">
                          <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-[11px] font-bold bg-slate-100 text-slate-700 border border-slate-200">
                            {pt.activeCategories ?? 0} / {pt.totalCategories ?? 0} đang hoạt động
                          </span>
                        </td>
                        <td className="p-3.5" onClick={(e) => e.stopPropagation()}>
                          <button
                            onClick={() =>
                              setStatusConfirm({
                                isOpen: true,
                                type: "placeType",
                                id: pt.id,
                                name: pt.name,
                                targetStatus: isActive ? 2 : 1,
                                reason: "",
                              })
                            }
                            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold transition-all cursor-pointer ${isActive
                              ? "bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100"
                              : "bg-slate-100 text-slate-500 border border-slate-200 hover:bg-slate-200"
                              }`}
                            title="Bấm để đổi trạng thái"
                          >
                            {isActive ? <CheckCircle2 size={12} /> : <XCircle size={12} />}
                            <span>{pt.statusName || (isActive ? "Hoạt động" : "Tạm ẩn")}</span>
                          </button>
                        </td>
                        <td className="p-3.5 text-center" onClick={(e) => e.stopPropagation()}>
                          <button
                            type="button"
                            onClick={() => handleOpenPlaceTypeDetail(pt)}
                            className="px-2.5 py-1 text-xs font-semibold text-emerald-700 hover:bg-emerald-50 rounded-lg transition-colors cursor-pointer"
                          >
                            Chi tiết →
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                  {placeTypes.length === 0 && !isPlaceTypesLoading && (
                    <tr>
                      <td colSpan={4} className="p-10 text-center text-slate-400">
                        Chưa có loại địa điểm lớn nào được thiết lập.
                      </td>
                    </tr>
                  )}
                  {isPlaceTypesLoading && (
                    <tr>
                      <td colSpan={4} className="p-10 text-center text-slate-400">
                        <RefreshCw size={20} className="animate-spin mx-auto text-emerald-600 mb-2" />
                        Đang tải trụ cột địa điểm...
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* CONFIRMATION: STATUS TOGGLE */}
      {statusConfirm.isOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-5 border border-slate-200 shadow-2xl space-y-4 animate-in zoom-in-95 duration-150">
            <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
              <AlertTriangle size={20} />
            </div>
            <div>
              <h4 className="font-bold text-slate-900 text-sm">
                Xác nhận {statusConfirm.targetStatus === 1 ? "kích hoạt" : "tạm ẩn"} {statusConfirm.type === "category" ? "danh mục" : "loại địa điểm"}?
              </h4>
              <p className="text-xs text-slate-500 mt-1">
                Bạn đang chuyển trạng thái của <b>"{statusConfirm.name}"</b> sang{" "}
                <b>{statusConfirm.targetStatus === 1 ? "Hoạt động" : "Tạm ẩn"}</b>.
              </p>
            </div>

            <div>
              <label className="block text-slate-700 font-bold mb-1">Lý do điều chỉnh (Tùy chọn):</label>
              <textarea
                rows={2}
                placeholder="Nhập lý do tạm ẩn hoặc ghi chú vận hành..."
                value={statusConfirm.reason}
                onChange={(e) => setStatusConfirm({ ...statusConfirm, reason: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 resize-none"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setStatusConfirm((prev) => ({ ...prev, isOpen: false }))}
                className="px-3.5 py-1.5 border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold rounded-xl cursor-pointer"
              >
                Hủy bỏ
              </button>
              <button
                onClick={handleExecuteStatusToggle}
                className="px-3.5 py-1.5 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl cursor-pointer"
              >
                Xác nhận
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CategoriesTab;
