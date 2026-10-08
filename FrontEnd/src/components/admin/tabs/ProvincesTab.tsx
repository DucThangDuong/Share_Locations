import React, { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  MapPin,
  Search,
  Plus,
  CheckCircle2,
  XCircle,
  RefreshCw,
  Star,
  Utensils,
  AlertTriangle,
  Users,
  ChevronLeft,
  ChevronRight,
  Globe,
  ArrowLeft,
  Save,
  Upload,
} from "lucide-react";
import { adminService, extractList } from "@/services/adminService";
import { CustomSelect } from "@/components/common/CustomSelect";
import type {
  AdminGeographyProvinceItem,
  AdminGeographyRegionItem,
} from "@/types/admin.types";

interface ProvincesTabProps {
  showToast?: (msg: string) => void;
}

export const ProvincesTab: React.FC<ProvincesTabProps> = ({ showToast }) => {
  const navigate = useNavigate();
  const location = useLocation();

  const [activeSubTab, setActiveSubTab] = useState<"provinces" | "regions">("provinces");

  // Regions State
  const [regions, setRegions] = useState<AdminGeographyRegionItem[]>([]);
  const [isRegionsLoading, setIsRegionsLoading] = useState(false);

  // Provinces State
  const [provinces, setProvinces] = useState<AdminGeographyProvinceItem[]>([]);
  const [isProvincesLoading, setIsProvincesLoading] = useState(false);
  const [provinceFilters, setProvinceFilters] = useState<{
    regionId?: number;
    status?: number;
    featured?: boolean;
    keyword?: string;
    page: number;
    pageSize: number;
  }>({
    regionId: undefined,
    status: undefined,
    featured: undefined,
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

  // Dedicated Detail View State (Replacing Modals with Page Editors)
  const [detailView, setDetailView] = useState<{
    type: "province" | "region";
    mode: "create" | "edit";
    id?: number;
  } | null>(null);

  const [provinceForm, setProvinceForm] = useState({
    regionId: 1,
    name: "",
    slug: "",
    tagline: "",
    description: "",
    imageUrl: "",
    featured: false,
    displayOrder: 1,
    status: 1,
  });
  const [provinceImageFile, setProvinceImageFile] = useState<File | null>(null);
  const [provincePreviewUrl, setProvincePreviewUrl] = useState<string>("");
  const [isSubmittingProvince, setIsSubmittingProvince] = useState(false);

  const [regionForm, setRegionForm] = useState({
    name: "",
    slug: "",
    tagline: "",
    description: "",
    imageUrl: "",
    orderIndex: 1,
    status: 1,
  });
  const [regionImageFile, setRegionImageFile] = useState<File | null>(null);
  const [regionPreviewUrl, setRegionPreviewUrl] = useState<string>("");
  const [isSubmittingRegion, setIsSubmittingRegion] = useState(false);

  const [statusConfirm, setStatusConfirm] = useState<{
    isOpen: boolean;
    type: "province" | "region";
    id: number;
    name: string;
    targetStatus: number;
    reason: string;
  }>({
    isOpen: false,
    type: "province",
    id: 0,
    name: "",
    targetStatus: 1,
    reason: "",
  });

  const notify = (msg: string) => {
    if (showToast) showToast(msg);
    else alert(msg);
  };

  const handleSelectProvinceFile = (e: React.ChangeEvent<HTMLInputElement>) => {
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
    setProvinceImageFile(file);
    setProvincePreviewUrl(URL.createObjectURL(file));
    e.target.value = "";
  };

  const handleClearProvinceImage = () => {
    setProvinceImageFile(null);
    setProvincePreviewUrl("");
    setProvinceForm((prev) => ({ ...prev, imageUrl: "" }));
  };

  const handleSelectRegionFile = (e: React.ChangeEvent<HTMLInputElement>) => {
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
    setRegionImageFile(file);
    setRegionPreviewUrl(URL.createObjectURL(file));
    e.target.value = "";
  };

  const handleClearRegionFile = () => {
    setRegionImageFile(null);
    setRegionPreviewUrl("");
    setRegionForm((prev) => ({ ...prev, imageUrl: "" }));
  };

  // Sync with URL Sub-route if any e.g. /admin/provinces/new or /admin/provinces/25
  useEffect(() => {
    const pathMatch = location.pathname.match(/\/admin\/provinces\/(new|\d+)/i);
    if (pathMatch) {
      const param = pathMatch[1];
      if (param === "new") {
        setDetailView({ type: "province", mode: "create" });
        setProvinceForm({
          regionId: regions[0]?.id || 1,
          name: "",
          slug: "",
          tagline: "",
          description: "",
          imageUrl: "",
          featured: false,
          displayOrder: provinces.length + 1,
          status: 1,
        });
        setProvinceImageFile(null);
        setProvincePreviewUrl("");
      } else {
        const provId = Number(param);
        const found = provinces.find((p) => p.id === provId);
        setDetailView({ type: "province", mode: "edit", id: provId });
        setProvinceImageFile(null);
        setProvincePreviewUrl("");
        if (found) {
          setProvinceForm({
            regionId: found.regionId || regions[0]?.id || 1,
            name: found.name,
            slug: found.slug || generateSlug(found.name),
            tagline: found.tagline || "",
            description: found.description || "",
            imageUrl: found.imageUrl || "",
            featured: Boolean(found.featured),
            displayOrder: found.displayOrder ?? 1,
            status: found.status ?? 1,
          });
        }
        // Fetch fresh detail data from BE
        adminService
          .getGeographyProvince(provId)
          .then((res: any) => {
            const d = res?.data || res;
            if (d && d.name) {
              setProvinceForm({
                regionId: d.regionId || regions[0]?.id || 1,
                name: d.name,
                slug: d.slug || generateSlug(d.name),
                tagline: d.tagline || "",
                description: d.description || "",
                imageUrl: d.imageUrl || "",
                featured: Boolean(d.featured),
                displayOrder: d.displayOrder ?? 1,
                status: d.status ?? 1,
              });
            }
          })
          .catch(() => {});
      }
    }
  }, [location.pathname, provinces.length, regions.length]);

  // 1. Fetch Regions
  const fetchRegions = async () => {
    setIsRegionsLoading(true);
    try {
      const res: any = await adminService.getGeographyRegions();
      const list = extractList<AdminGeographyRegionItem>(res?.data || res);
      setRegions(list);
    } catch {
      setRegions([]);
    } finally {
      setIsRegionsLoading(false);
    }
  };

  // 2. Fetch Provinces with Filters & Pagination
  const fetchProvinces = async () => {
    setIsProvincesLoading(true);
    try {
      const cleanParams: any = {
        page: provinceFilters.page,
        pageSize: provinceFilters.pageSize,
      };
      if (provinceFilters.regionId) cleanParams.regionId = provinceFilters.regionId;
      if (provinceFilters.status !== undefined && provinceFilters.status !== null) {
        cleanParams.status = provinceFilters.status;
      }
      if (provinceFilters.featured !== undefined && provinceFilters.featured !== null) {
        cleanParams.featured = provinceFilters.featured;
      }
      if (provinceFilters.keyword?.trim()) {
        cleanParams.keyword = provinceFilters.keyword.trim();
      }

      const res: any = await adminService.getGeographyProvinces(cleanParams);
      const list = extractList<AdminGeographyProvinceItem>(res?.data || res);
      setProvinces(list);

      const pag = res?.pagination || res?.meta || {};
      const totalCount = Number(pag.totalCount ?? pag.totalElements ?? pag.total ?? list.length);
      const pageSize = Number(pag.pageSize ?? pag.size ?? provinceFilters.pageSize);
      const pageIndex = Number(pag.pageIndex ?? pag.page ?? provinceFilters.page);
      const totalPages = Number(pag.totalPages ?? Math.max(1, Math.ceil(totalCount / pageSize)));

      setPagination({
        pageIndex,
        pageSize,
        totalCount,
        totalPages,
      });
    } catch {
      setProvinces([]);
    } finally {
      setIsProvincesLoading(false);
    }
  };

  useEffect(() => {
    fetchRegions();
  }, []);

  useEffect(() => {
    fetchProvinces();
  }, [
    provinceFilters.page,
    provinceFilters.regionId,
    provinceFilters.status,
    provinceFilters.featured,
  ]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setProvinceFilters((prev) => ({ ...prev, page: 1 }));
    fetchProvinces();
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

  // Open Detail View for Province
  const handleOpenProvinceDetail = (prov?: AdminGeographyProvinceItem) => {
    setProvinceImageFile(null);
    setProvincePreviewUrl("");
    if (prov) {
      setDetailView({ type: "province", mode: "edit", id: prov.id });
      setProvinceForm({
        regionId: prov.regionId || regions[0]?.id || 1,
        name: prov.name,
        slug: prov.slug || generateSlug(prov.name),
        tagline: prov.tagline || "",
        description: prov.description || "",
        imageUrl: prov.imageUrl || "",
        featured: Boolean(prov.featured),
        displayOrder: prov.displayOrder ?? 1,
        status: prov.status ?? 1,
      });
      navigate(`/admin/provinces/${prov.id}`);
      adminService
        .getGeographyProvince(prov.id)
        .then((res: any) => {
          const d = res?.data || res;
          if (d && d.name) {
            setProvinceForm({
              regionId: d.regionId || regions[0]?.id || 1,
              name: d.name,
              slug: d.slug || generateSlug(d.name),
              tagline: d.tagline || "",
              description: d.description || "",
              imageUrl: d.imageUrl || "",
              featured: Boolean(d.featured),
              displayOrder: d.displayOrder ?? 1,
              status: d.status ?? 1,
            });
          }
        })
        .catch(() => {});
    } else {
      setDetailView({ type: "province", mode: "create" });
      setProvinceForm({
        regionId: regions[0]?.id || 1,
        name: "",
        slug: "",
        tagline: "",
        description: "",
        imageUrl: "",
        featured: false,
        displayOrder: provinces.length + 1,
        status: 1,
      });
      navigate("/admin/provinces/new");
    }
  };

  // Open Detail View for Region
  const handleOpenRegionDetail = (reg?: AdminGeographyRegionItem) => {
    setRegionImageFile(null);
    setRegionPreviewUrl("");
    if (reg) {
      setDetailView({ type: "region", mode: "edit", id: reg.id });
      setRegionForm({
        name: reg.name,
        slug: reg.slug || generateSlug(reg.name),
        tagline: reg.tagline || "",
        description: reg.description || "",
        imageUrl: reg.imageUrl || "",
        orderIndex: reg.orderIndex ?? 1,
        status: reg.status ?? 1,
      });
    } else {
      setDetailView({ type: "region", mode: "create" });
      setRegionForm({
        name: "",
        slug: "",
        tagline: "",
        description: "",
        imageUrl: "",
        orderIndex: regions.length + 1,
        status: 1,
      });
    }
  };

  const handleBackToList = () => {
    setDetailView(null);
    setProvinceImageFile(null);
    setProvincePreviewUrl("");
    setRegionImageFile(null);
    setRegionPreviewUrl("");
    navigate("/admin/provinces");
  };

  // Save Province using multipart/form-data for Azure Blob storage
  const handleSaveProvince = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!provinceForm.name.trim()) {
      notify("Vui lòng nhập tên tỉnh / thành phố!");
      return;
    }

    setIsSubmittingProvince(true);
    try {
      const formData = new FormData();
      formData.append("regionId", String(provinceForm.regionId));
      formData.append("name", provinceForm.name.trim());
      const slugVal = provinceForm.slug.trim() || generateSlug(provinceForm.name);
      if (slugVal) formData.append("slug", slugVal);
      if (provinceForm.tagline?.trim()) formData.append("tagline", provinceForm.tagline.trim());
      if (provinceForm.description?.trim()) formData.append("description", provinceForm.description.trim());
      formData.append("featured", String(provinceForm.featured));
      formData.append("status", String(provinceForm.status));
      if (provinceForm.imageUrl) formData.append("imageUrl", provinceForm.imageUrl);

      if (provinceImageFile) {
        formData.append("image", provinceImageFile);
      }

      if (detailView?.mode === "edit" && detailView.id) {
        await adminService.updateGeographyProvince(detailView.id, formData);
        notify("Cập nhật tỉnh / thành phố thành công!");
      } else {
        await adminService.createGeographyProvince(formData);
        notify("Thêm mới tỉnh / thành phố thành công!");
      }
      handleBackToList();
      fetchProvinces();
    } catch (err: any) {
      const msg = err?.response?.data?.message || err?.message || "Có lỗi xảy ra khi lưu tỉnh/thành phố.";
      notify(msg);
    } finally {
      setIsSubmittingProvince(false);
    }
  };

  // Save Region using multipart/form-data for Azure Blob storage
  const handleSaveRegion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!regionForm.name.trim()) {
      notify("Vui lòng nhập tên vùng / miền!");
      return;
    }

    setIsSubmittingRegion(true);
    try {
      const formData = new FormData();
      formData.append("name", regionForm.name.trim());
      const slugVal = regionForm.slug.trim() || generateSlug(regionForm.name);
      if (slugVal) formData.append("slug", slugVal);
      if (regionForm.tagline?.trim()) formData.append("tagline", regionForm.tagline.trim());
      if (regionForm.description?.trim()) formData.append("description", regionForm.description.trim());
      formData.append("status", String(regionForm.status));
      if (regionForm.imageUrl) formData.append("imageUrl", regionForm.imageUrl);

      if (regionImageFile) {
        formData.append("image", regionImageFile);
      }

      if (detailView?.mode === "edit" && detailView.id) {
        await adminService.updateGeographyRegion(detailView.id, formData);
        notify("Cập nhật vùng / miền thành công!");
      } else {
        await adminService.createGeographyRegion(formData);
        notify("Tạo mới vùng / miền thành công!");
      }
      setDetailView(null);
      setRegionImageFile(null);
      setRegionPreviewUrl("");
      fetchRegions();
    } catch (err: any) {
      const msg = err?.response?.data?.message || err?.message || "Có lỗi xảy ra khi lưu vùng/miền.";
      notify(msg);
    } finally {
      setIsSubmittingRegion(false);
    }
  };

  // Toggle Status
  const handleExecuteStatusToggle = async () => {
    const { type, id, targetStatus, reason } = statusConfirm;
    try {
      if (type === "province") {
        await adminService.updateGeographyProvinceStatus(id, targetStatus, reason || undefined);
        notify(`Đã chuyển trạng thái tỉnh sang ${targetStatus === 1 ? "Hoạt động" : "Tạm ẩn"}.`);
        fetchProvinces();
      } else {
        await adminService.updateGeographyRegionStatus(id, targetStatus, reason || undefined);
        notify(`Đã chuyển trạng thái vùng sang ${targetStatus === 1 ? "Hoạt động" : "Tạm ẩn"}.`);
        fetchRegions();
      }
      setStatusConfirm((prev) => ({ ...prev, isOpen: false }));
    } catch (err: any) {
      const msg = err?.response?.data?.message || err?.message || "Lỗi khi cập nhật trạng thái.";
      notify(msg);
    }
  };

  if (detailView?.type === "province") {
    const isEdit = detailView.mode === "edit";
    const currentProv = isEdit ? provinces.find((p) => p.id === detailView.id) : null;
    const activeProvincePreview = provincePreviewUrl || provinceForm.imageUrl;

    return (
      <div className="space-y-4 animate-in fade-in duration-150 text-xs">
        {/* Top Navigation Bar */}
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
                <span>{isEdit ? `Chi tiết Tỉnh / Thành: ${currentProv?.name || ""}` : "Thêm mới Tỉnh / Thành phố"}</span>
              </div>
              <p className="text-[11px] text-slate-400">
                {isEdit ? "Cập nhật thông tin quy hoạch, hình ảnh và trạng thái số hóa địa phương" : "Đăng ký tỉnh/thành phố mới vào hệ thống bản đồ số"}
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
              form="province-detail-form"
              disabled={isSubmittingProvince}
              className="flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl transition-all shadow-sm shadow-emerald-600/20 cursor-pointer disabled:opacity-50"
            >
              <Save size={15} />
              <span>{isSubmittingProvince ? "Đang lưu..." : isEdit ? "Lưu thay đổi" : "Thêm tỉnh thành"}</span>
            </button>
          </div>
        </div>

        {/* Main Form Content */}
        <form id="province-detail-form" onSubmit={handleSaveProvince} className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Left Column: Form Info */}
          <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-2xs space-y-4">
            <h3 className="font-bold text-slate-900 text-sm border-b border-slate-100 pb-3">
              Thông tin địa lý
            </h3>

            <div>
              <label className="block text-slate-700 font-bold mb-1.5">Vùng / Miền trực thuộc *</label>
              <CustomSelect
                value={provinceForm.regionId}
                onChange={(val) => setProvinceForm({ ...provinceForm, regionId: Number(val) })}
                options={regions.map((r) => ({ value: r.id, label: r.name }))}
                size="md"
              />
            </div>

            <div>
              <label className="block text-slate-700 font-bold mb-1.5">Tên Tỉnh / Thành phố *</label>
              <input
                type="text"
                placeholder="Ví dụ: Lâm Đồng, Đà Nẵng, Hà Nội..."
                value={provinceForm.name}
                onChange={(e) => {
                  const val = e.target.value;
                  setProvinceForm({
                    ...provinceForm,
                    name: val,
                    slug: isEdit ? provinceForm.slug : generateSlug(val),
                  });
                }}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 font-medium"
                required
              />
            </div>

            <div>
              <label className="block text-slate-700 font-bold mb-1.5">Đường dẫn thân thiện (Slug)</label>
              <input
                type="text"
                placeholder="lam-dong"
                value={provinceForm.slug}
                onChange={(e) => setProvinceForm({ ...provinceForm, slug: e.target.value })}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="block text-slate-700 font-bold mb-1.5">Khẩu hiệu du lịch (Tagline)</label>
              <input
                type="text"
                placeholder="Ví dụ: Thành phố ngàn hoa và xứ sở sương mù"
                value={provinceForm.tagline}
                onChange={(e) => setProvinceForm({ ...provinceForm, tagline: e.target.value })}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="block text-slate-700 font-bold mb-1.5">Mô tả tổng quan địa phương</label>
              <textarea
                rows={4}
                placeholder="Giới thiệu văn hóa, danh lam thắng cảnh, vị trí địa lý..."
                value={provinceForm.description}
                onChange={(e) => setProvinceForm({ ...provinceForm, description: e.target.value })}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 resize-none leading-relaxed"
              />
            </div>

            <div>
              <label className="block text-slate-700 font-bold mb-1.5">Ảnh bìa / Thắng cảnh biểu trưng</label>
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
                <label className="flex items-center gap-2 px-4 py-2.5 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-emerald-800 rounded-xl font-bold text-xs transition-colors cursor-pointer shadow-2xs">
                  <Upload size={16} className="text-emerald-600" />
                  <span>{provinceImageFile ? "Đã chọn ảnh mới" : "Tải ảnh lên"}</span>
                  <input
                    type="file"
                    accept="image/png,image/jpeg,image/jpg,image/webp"
                    onChange={handleSelectProvinceFile}
                    className="hidden"
                  />
                </label>
                {activeProvincePreview && (
                  <button
                    type="button"
                    onClick={handleClearProvinceImage}
                    className="px-3 py-2 text-xs font-semibold text-rose-600 hover:bg-rose-50 rounded-xl transition-colors cursor-pointer"
                  >
                    Gỡ ảnh
                  </button>
                )}
              </div>
              <p className="text-[10px] text-slate-400 mt-1.5">
                Định dạng hỗ trợ: JPG, PNG, WEBP (tối đa 10 MB). Ảnh sẽ được tự động lưu trữ trên Azure Blob Storage.
              </p>
            </div>
          </div>

          {/* Right Column: Settings & Stats */}
          <div className="space-y-4">
            <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-2xs space-y-4">
              <h4 className="font-bold text-slate-900 text-xs border-b border-slate-100 pb-2">
                Trạng thái &amp; Phân loại
              </h4>

              <div>
                <label className="block text-slate-600 font-medium mb-1.5">Trạng thái phát hành</label>
                <CustomSelect
                  value={provinceForm.status}
                  onChange={(val) => setProvinceForm({ ...provinceForm, status: Number(val) })}
                  options={[
                    { value: 1, label: "Hoạt động" },
                    { value: 2, label: "Tạm ẩn" },
                  ]}
                  size="md"
                />
              </div>

              <div className="pt-2">
                <label className="flex items-center gap-2 cursor-pointer bg-amber-50/60 p-3 rounded-xl border border-amber-200">
                  <input
                    type="checkbox"
                    checked={provinceForm.featured}
                    onChange={(e) => setProvinceForm({ ...provinceForm, featured: e.target.checked })}
                    className="w-4 h-4 rounded text-amber-600 focus:ring-amber-500 border-amber-300"
                  />
                  <span className="font-bold text-amber-900 text-xs">⭐ Đặt làm tỉnh du lịch trọng điểm</span>
                </label>
              </div>

              {/* Cover Preview Box */}
              <div className="pt-2">
                <span className="block text-slate-500 text-[11px] font-bold mb-1.5">Hình ảnh biểu trưng:</span>
                <div className="h-32 rounded-xl bg-slate-100 border border-slate-200 overflow-hidden flex items-center justify-center">
                  {activeProvincePreview ? (
                    <img src={activeProvincePreview} alt="Preview" className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-xs text-slate-400 font-medium">Chưa có ảnh</span>
                  )}
                </div>
              </div>
            </div>

            {isEdit && currentProv && (
              <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-2xs space-y-3">
                <h4 className="font-bold text-slate-900 text-xs border-b border-slate-100 pb-2">
                  Dữ liệu số hóa địa phương
                </h4>
                <div className="space-y-2 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500 flex items-center gap-1.5">
                      <MapPin size={13} className="text-emerald-500" />
                      Địa điểm đã số hóa:
                    </span>
                    <span className="font-bold text-slate-800">{currentProv.placeCount ?? 0}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500 flex items-center gap-1.5">
                      <Utensils size={13} className="text-amber-500" />
                      Món ăn đặc sản:
                    </span>
                    <span className="font-bold text-slate-800">{currentProv.foodCount ?? 0}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500 flex items-center gap-1.5">
                      <Users size={13} className="text-purple-500" />
                      Admin phụ trách:
                    </span>
                    <span className="font-bold text-slate-800">{currentProv.assignedAdminsCount ?? 0}</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </form>
      </div>
    );
  }

  // =========================================================================
  // VIEW: REGION DETAIL EDITOR
  // =========================================================================
  if (detailView?.type === "region") {
    const isEdit = detailView.mode === "edit";
    const currentReg = isEdit ? regions.find((r) => r.id === detailView.id) : null;
    const activeRegionPreview = regionPreviewUrl || regionForm.imageUrl;

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
                <Globe size={16} className="text-emerald-600" />
                <span>{isEdit ? `Chi tiết Vùng / Miền: ${currentReg?.name || ""}` : "Thêm mới Vùng / Miền"}</span>
              </div>
              <p className="text-[11px] text-slate-400">
                {isEdit ? "Cập nhật phân vùng địa lý và khẩu hiệu" : "Thiết lập phân vùng địa lý mới"}
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
              form="region-detail-form"
              disabled={isSubmittingRegion}
              className="flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl transition-all shadow-sm shadow-emerald-600/20 cursor-pointer disabled:opacity-50"
            >
              <Save size={15} />
              <span>{isSubmittingRegion ? "Đang lưu..." : isEdit ? "Lưu thay đổi" : "Tạo vùng mới"}</span>
            </button>
          </div>
        </div>

        <form id="region-detail-form" onSubmit={handleSaveRegion} className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-2xs space-y-4">
            <h3 className="font-bold text-slate-900 text-sm border-b border-slate-100 pb-3">
              Thông tin Vùng / Miền
            </h3>

            <div>
              <label className="block text-slate-700 font-bold mb-1.5">Tên Vùng / Miền *</label>
              <input
                type="text"
                placeholder="Ví dụ: Tây Nguyên, Miền Tây Nam Bộ..."
                value={regionForm.name}
                onChange={(e) => {
                  const val = e.target.value;
                  setRegionForm({
                    ...regionForm,
                    name: val,
                    slug: isEdit ? regionForm.slug : generateSlug(val),
                  });
                }}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 font-medium"
                required
              />
            </div>

            <div>
              <label className="block text-slate-700 font-bold mb-1.5">Đường dẫn thân thiện (Slug)</label>
              <input
                type="text"
                placeholder="tay-nguyen"
                value={regionForm.slug}
                onChange={(e) => setRegionForm({ ...regionForm, slug: e.target.value })}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="block text-slate-700 font-bold mb-1.5">Khẩu hiệu (Tagline)</label>
              <input
                type="text"
                placeholder="Ví dụ: Vùng đất của cồng chiêng và cafe"
                value={regionForm.tagline}
                onChange={(e) => setRegionForm({ ...regionForm, tagline: e.target.value })}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="block text-slate-700 font-bold mb-1.5">Mô tả chi tiết</label>
              <textarea
                rows={3}
                placeholder="Bao gồm các tỉnh Kon Tum, Gia Lai, Đắk Lắk..."
                value={regionForm.description}
                onChange={(e) => setRegionForm({ ...regionForm, description: e.target.value })}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 resize-none"
              />
            </div>

            <div>
              <label className="block text-slate-700 font-bold mb-1.5">Ảnh bìa phân vùng</label>
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
                <label className="flex items-center gap-2 px-4 py-2.5 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-emerald-800 rounded-xl font-bold text-xs transition-colors cursor-pointer shadow-2xs">
                  <Upload size={16} className="text-emerald-600" />
                  <span>{regionImageFile ? "Đã chọn ảnh mới" : "Tải ảnh lên"}</span>
                  <input
                    type="file"
                    accept="image/png,image/jpeg,image/jpg,image/webp"
                    onChange={handleSelectRegionFile}
                    className="hidden"
                  />
                </label>
                {activeRegionPreview && (
                  <button
                    type="button"
                    onClick={handleClearRegionFile}
                    className="px-3 py-2 text-xs font-semibold text-rose-600 hover:bg-rose-50 rounded-xl transition-colors cursor-pointer"
                  >
                    Gỡ ảnh
                  </button>
                )}
              </div>
              <p className="text-[10px] text-slate-400 mt-1.5">
                Định dạng hỗ trợ: JPG, PNG, WEBP (tối đa 10 MB). Ảnh sẽ được tự động lưu trữ trên Azure Blob Storage.
              </p>
            </div>
          </div>

          <div className="space-y-4">
            <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-2xs space-y-4">
              <h4 className="font-bold text-slate-900 text-xs border-b border-slate-100 pb-2">
                Trạng thái
              </h4>

              <div>
                <label className="block text-slate-600 font-medium mb-1.5">Trạng thái phát hành</label>
                <CustomSelect
                  value={regionForm.status}
                  onChange={(val) => setRegionForm({ ...regionForm, status: Number(val) })}
                  options={[
                    { value: 1, label: "Hoạt động" },
                    { value: 2, label: "Tạm ẩn" },
                  ]}
                  size="md"
                />
              </div>

              <div className="pt-2">
                <span className="block text-slate-500 text-[11px] font-bold mb-1.5">Ảnh bìa:</span>
                <div className="h-32 rounded-xl bg-slate-100 border border-slate-200 overflow-hidden flex items-center justify-center">
                  {activeRegionPreview ? (
                    <img src={activeRegionPreview} alt="Preview" className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-xs text-slate-400 font-medium">Chưa có ảnh</span>
                  )}
                </div>
              </div>
            </div>

            {isEdit && currentReg && (
              <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-2xs space-y-3">
                <h4 className="font-bold text-slate-900 text-xs border-b border-slate-100 pb-2">
                  Tỉnh thành trực thuộc
                </h4>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-500">Số tỉnh/thành:</span>
                  <span className="font-bold text-slate-800">{currentReg.totalProvinces ?? 0}</span>
                </div>
              </div>
            )}
          </div>
        </form>
      </div>
    );
  }

  // =========================================================================
  // VIEW: LIST VIEW (DEFAULT)
  // =========================================================================
  return (
    <div className="space-y-4 animate-in fade-in duration-150 text-xs">
      {/* Sub-tab Navigation */}
      <div className="flex items-center justify-between bg-white px-4 py-2.5 rounded-2xl border border-slate-200/80 shadow-2xs">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveSubTab("provinces")}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl font-bold transition-all cursor-pointer ${activeSubTab === "provinces"
              ? "bg-emerald-600 text-white shadow-sm shadow-emerald-600/20"
              : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
              }`}
          >
            <span>Tỉnh / Thành phố ({pagination.totalCount || provinces.length})</span>
          </button>

          <button
            onClick={() => setActiveSubTab("regions")}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl font-bold transition-all cursor-pointer ${activeSubTab === "regions"
              ? "bg-emerald-600 text-white shadow-sm shadow-emerald-600/20"
              : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
              }`}
          >
            <span>Vùng / Miền ({regions.length})</span>
          </button>
        </div>

        <div className="hidden sm:flex items-center gap-2">
          <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold bg-slate-100 text-slate-700 border border-slate-200">
            Tổng: {pagination.totalCount || provinces.length} tỉnh thành
          </span>
        </div>
      </div>

      {/* 1. PROVINCES LIST */}
      {activeSubTab === "provinces" && (
        <div className="space-y-4">
          <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-2xs flex flex-col lg:flex-row items-center justify-between gap-3">
            <form onSubmit={handleSearchSubmit} className="flex flex-1 flex-wrap items-center gap-2 w-full">
              <div className="relative flex-1 min-w-[200px]">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={15} />
                <input
                  type="text"
                  placeholder="Tìm theo tên tỉnh, tagline..."
                  value={provinceFilters.keyword}
                  onChange={(e) => setProvinceFilters((prev) => ({ ...prev, keyword: e.target.value }))}
                  className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                />
              </div>

              <CustomSelect
                value={provinceFilters.regionId ?? ""}
                onChange={(val) =>
                  setProvinceFilters((prev) => ({
                    ...prev,
                    regionId: val ? Number(val) : undefined,
                    page: 1,
                  }))
                }
                options={[
                  { value: "", label: "Tất cả Vùng / Miền" },
                  ...regions.map((reg) => ({ value: reg.id, label: reg.name })),
                ]}
                size="sm"
                className="min-w-[150px] shrink-0"
              />

              <CustomSelect
                value={provinceFilters.featured === undefined ? "" : String(provinceFilters.featured)}
                onChange={(val) =>
                  setProvinceFilters((prev) => ({
                    ...prev,
                    featured: val === "" ? undefined : val === "true",
                    page: 1,
                  }))
                }
                options={[
                  { value: "", label: "Tất cả phân loại" },
                  { value: "true", label: "⭐ Trọng điểm du lịch" },
                  { value: "false", label: "Tỉnh thành thông thường" },
                ]}
                size="sm"
                className="min-w-[150px] shrink-0"
              />

              <CustomSelect
                value={provinceFilters.status !== undefined && provinceFilters.status !== null ? String(provinceFilters.status) : ""}
                onChange={(val) =>
                  setProvinceFilters((prev) => ({
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
                onClick={() => fetchProvinces()}
                className="p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
                title="Làm mới"
              >
                <RefreshCw size={16} className={isProvincesLoading ? "animate-spin text-emerald-600" : ""} />
              </button>

              <button
                onClick={() => handleOpenProvinceDetail()}
                className="flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl transition-all shadow-sm shadow-emerald-600/20 cursor-pointer shrink-0"
              >
                <Plus size={16} />
                <span>Thêm tỉnh / thành</span>
              </button>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-2xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-500 font-bold text-[11px] uppercase tracking-wider">
                    <th className="p-3.5 pl-4">Tỉnh / Thành</th>
                    <th className="p-3.5">Vùng miền</th>
                    <th className="p-3.5 text-center">Trọng điểm</th>
                    <th className="p-3.5 text-center">Dữ liệu liên kết</th>
                    <th className="p-3.5">Trạng thái</th>
                    <th className="p-3.5 pr-4 text-center">Xem chi tiết</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium">
                  {provinces.map((prov) => {
                    const isActive = prov.status === 1;
                    return (
                      <tr
                        key={prov.id}
                        onClick={() => handleOpenProvinceDetail(prov)}
                        className="hover:bg-slate-50/80 transition-colors cursor-pointer group"
                      >
                        <td className="p-3.5 pl-4">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center text-slate-700 shrink-0 border border-slate-200 overflow-hidden">
                              {prov.imageUrl ? (
                                <img src={prov.imageUrl} alt={prov.name} className="w-full h-full object-cover" />
                              ) : (
                                <MapPin size={16} className="text-slate-400" />
                              )}
                            </div>
                            <div>
                              <div className="font-bold text-slate-900 text-xs group-hover:text-emerald-600 transition-colors">
                                {prov.name}
                              </div>
                              {prov.tagline && (
                                <div className="text-[11px] text-slate-500 truncate max-w-xs mt-0.5">
                                  {prov.tagline}
                                </div>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="p-3.5">
                          <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-[11px] font-bold bg-slate-100 text-slate-700 border border-slate-200">
                            {prov.regionName || "Vùng chung"}
                          </span>
                        </td>
                        <td className="p-3.5 text-center">
                          {prov.featured ? (
                            <span className="text-amber-500 font-bold flex items-center justify-center gap-1">
                              <Star size={14} className="fill-amber-400 text-amber-400" />
                              <span>Có</span>
                            </span>
                          ) : (
                            <span className="text-slate-400">Không</span>
                          )}
                        </td>
                        <td className="p-3.5 text-center">
                          <div className="inline-flex items-center gap-3 text-[11px] text-slate-600">
                            <span title="Địa điểm đã số hóa" className="flex items-center gap-1 font-bold text-slate-800">
                              <MapPin size={12} className="text-emerald-500" />
                              {prov.placeCount ?? 0}
                            </span>
                            <span title="Món ăn đặc sản" className="flex items-center gap-1">
                              <Utensils size={12} className="text-amber-500" />
                              {prov.foodCount ?? 0}
                            </span>
                            <span title="Admin phụ trách" className="flex items-center gap-1">
                              <Users size={12} className="text-purple-500" />
                              {prov.assignedAdminsCount ?? 0}
                            </span>
                          </div>
                        </td>
                        <td className="p-3.5" onClick={(e) => e.stopPropagation()}>
                          <button
                            onClick={() =>
                              setStatusConfirm({
                                isOpen: true,
                                type: "province",
                                id: prov.id,
                                name: prov.name,
                                targetStatus: isActive ? 2 : 1,
                                reason: "",
                              })
                            }
                            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold transition-all cursor-pointer ${isActive
                              ? "bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100"
                              : "bg-slate-100 text-slate-500 border border-slate-200 hover:bg-slate-200"
                              }`}
                            title="Bấm để chuyển trạng thái"
                          >
                            {isActive ? <CheckCircle2 size={12} /> : <XCircle size={12} />}
                            <span>{prov.statusName || (isActive ? "Hoạt động" : "Tạm ẩn")}</span>
                          </button>
                        </td>
                        <td className="p-3.5 text-center" onClick={(e) => e.stopPropagation()}>
                          <button
                            type="button"
                            onClick={() => handleOpenProvinceDetail(prov)}
                            className="px-2.5 py-1 text-xs font-semibold text-emerald-700 hover:bg-emerald-50 rounded-lg transition-colors cursor-pointer"
                          >
                            Chi tiết →
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                  {provinces.length === 0 && !isProvincesLoading && (
                    <tr>
                      <td colSpan={6} className="p-10 text-center text-slate-400">
                        Không tìm thấy tỉnh thành nào phù hợp.
                      </td>
                    </tr>
                  )}
                  {isProvincesLoading && (
                    <tr>
                      <td colSpan={6} className="p-10 text-center text-slate-400">
                        <RefreshCw size={20} className="animate-spin mx-auto text-emerald-600 mb-2" />
                        Đang tải danh sách tỉnh thành...
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
                  <span className="font-bold text-slate-900">{pagination.totalCount}</span> tỉnh / thành)
                </div>
                <div className="flex items-center gap-1.5">
                  <button
                    disabled={pagination.pageIndex <= 1}
                    onClick={() => setProvinceFilters((prev) => ({ ...prev, page: prev.page - 1 }))}
                    className="p-1.5 border border-slate-200 rounded-lg hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                  >
                    <ChevronLeft size={16} />
                  </button>
                  <button
                    disabled={pagination.pageIndex >= pagination.totalPages}
                    onClick={() => setProvinceFilters((prev) => ({ ...prev, page: prev.page + 1 }))}
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

      {/* 2. REGIONS LIST */}
      {activeSubTab === "regions" && (
        <div className="space-y-4">
          <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-2xs flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="font-bold text-slate-800">Danh sách các Vùng / Miền địa lý</span>
              <span className="text-[11px] text-slate-400">({regions.length} phân vùng)</span>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => fetchRegions()}
                className="p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
                title="Làm mới"
              >
                <RefreshCw size={16} className={isRegionsLoading ? "animate-spin text-emerald-600" : ""} />
              </button>

              <button
                onClick={() => handleOpenRegionDetail()}
                className="flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl transition-all shadow-sm shadow-emerald-600/20 cursor-pointer"
              >
                <Plus size={16} />
                <span>Thêm vùng / miền mới</span>
              </button>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-2xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-500 font-bold text-[11px] uppercase tracking-wider">
                    <th className="p-3.5 pl-4">Vùng / Miền</th>
                    <th className="p-3.5">Tỉnh / Thành trực thuộc</th>
                    <th className="p-3.5">Trạng thái</th>
                    <th className="p-3.5 pr-4 text-center">Xem chi tiết</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium">
                  {regions.map((reg) => {
                    const isActive = reg.status === 1;
                    return (
                      <tr
                        key={reg.id}
                        onClick={() => handleOpenRegionDetail(reg)}
                        className="hover:bg-slate-50/80 transition-colors cursor-pointer group"
                      >
                        <td className="p-3.5 pl-4">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0 border border-emerald-100 overflow-hidden">
                              {reg.imageUrl ? (
                                <img src={reg.imageUrl} alt={reg.name} className="w-full h-full object-cover" />
                              ) : (
                                <Globe size={18} />
                              )}
                            </div>
                            <div>
                              <div className="font-bold text-slate-900 text-xs group-hover:text-emerald-600 transition-colors">
                                {reg.name}
                              </div>
                              {reg.tagline && (
                                <div className="text-[11px] text-slate-500 truncate max-w-xs mt-0.5">
                                  {reg.tagline}
                                </div>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="p-3.5">
                          <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-[11px] font-bold bg-slate-100 text-slate-700 border border-slate-200">
                            {reg.activeProvinces ?? 0} / {reg.totalProvinces ?? 0} tỉnh thành
                          </span>
                        </td>
                        <td className="p-3.5" onClick={(e) => e.stopPropagation()}>
                          <button
                            onClick={() =>
                              setStatusConfirm({
                                isOpen: true,
                                type: "region",
                                id: reg.id,
                                name: reg.name,
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
                            <span>{reg.statusName || (isActive ? "Hoạt động" : "Tạm ẩn")}</span>
                          </button>
                        </td>
                        <td className="p-3.5 text-center" onClick={(e) => e.stopPropagation()}>
                          <button
                            type="button"
                            onClick={() => handleOpenRegionDetail(reg)}
                            className="px-2.5 py-1 text-xs font-semibold text-emerald-700 hover:bg-emerald-50 rounded-lg transition-colors cursor-pointer"
                          >
                            Chi tiết →
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                  {regions.length === 0 && !isRegionsLoading && (
                    <tr>
                      <td colSpan={4} className="p-10 text-center text-slate-400">
                        Chưa có phân vùng địa lý nào được tạo.
                      </td>
                    </tr>
                  )}
                  {isRegionsLoading && (
                    <tr>
                      <td colSpan={4} className="p-10 text-center text-slate-400">
                        <RefreshCw size={20} className="animate-spin mx-auto text-emerald-600 mb-2" />
                        Đang tải danh sách vùng miền...
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
                Xác nhận {statusConfirm.targetStatus === 1 ? "kích hoạt" : "tạm ẩn"} {statusConfirm.type === "province" ? "tỉnh thành" : "vùng miền"}?
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

export default ProvincesTab;
