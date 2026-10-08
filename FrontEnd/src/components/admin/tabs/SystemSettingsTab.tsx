import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import {
  ShieldAlert,
  Shield,
  Save,
  RefreshCw,
  Plus,
  Trash2,
  CheckCircle2,
  XCircle,
  Sliders,
  ArrowLeft,
  Info,
} from "lucide-react";
import { adminService, extractList } from "@/services/adminService";
import { useSystemSettings } from "@/context/SystemSettingsContext";
import { CustomSelect } from "@/components/common/CustomSelect";
import type {
  AdminReportTypeItem,
  AdminSystemSettingItem,
  AdminAssignmentInfo,
} from "@/types/admin.types";

interface SystemSettingsTabProps {
  currentAdminInfo?: AdminAssignmentInfo;
  showToast?: (msg: string) => void;
}

export const SystemSettingsTab: React.FC<SystemSettingsTabProps> = ({
  showToast,
}) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { refreshSettings } = useSystemSettings();

  const [activeSubTab, setActiveSubTab] = useState<"systemSettings" | "reportTypes">("systemSettings");

  // System Settings State
  const [systemSettings, setSystemSettings] = useState<AdminSystemSettingItem[]>([]);
  const [settingValues, setSettingValues] = useState<Record<string, string>>({});
  const [isSettingsLoading, setIsSettingsLoading] = useState(false);
  const [isSavingBatch, setIsSavingBatch] = useState(false);
  const [selectedGroup, setSelectedGroup] = useState<string>("ALL");

  // Report Types State
  const [reportTypes, setReportTypes] = useState<AdminReportTypeItem[]>([]);
  const [isReportTypesLoading, setIsReportTypesLoading] = useState(false);
  const [reportScopeFilter, setReportScopeFilter] = useState<string>("ALL");

  // Dedicated Detail View State (Replacing Modal with Page Editor)
  const [detailView, setDetailView] = useState<{
    type: "reportType";
    mode: "create" | "edit";
    id?: number;
  } | null>(null);

  const [reportTypeForm, setReportTypeForm] = useState({
    code: "",
    name: "",
    targetScope: "ALL",
    isActive: true,
    displayOrder: 1,
  });
  const [isSubmittingReportType, setIsSubmittingReportType] = useState(false);

  // Delete & Status Confirmations
  const [deleteConfirm, setDeleteConfirm] = useState<{
    isOpen: boolean;
    id: number;
    name: string;
    warningMessage?: string;
  }>({
    isOpen: false,
    id: 0,
    name: "",
  });

  const cleanDisplay = (text?: string) => text ? text.replace(/\s*\([^)]*\)/g, "").trim() : "";

  const notify = (msg: string) => {
    if (showToast) showToast(msg);
    else alert(msg);
  };

  // Sync with URL Sub-route if any e.g. /admin/report-types/new or /admin/report-types/3
  useEffect(() => {
    const reportTypeMatch = location.pathname.match(/\/admin\/report-types\/(new|\d+)/i);
    if (reportTypeMatch) {
      setActiveSubTab("reportTypes");
      const param = reportTypeMatch[1];
      if (param === "new") {
        setDetailView({ type: "reportType", mode: "create" });
        setReportTypeForm({
          code: "",
          name: "",
          targetScope: "CONTENT",
          isActive: true,
          displayOrder: reportTypes.length + 1,
        });
      } else {
        const rtId = Number(param);
        const found = reportTypes.find((rt) => rt.id === rtId);
        setDetailView({ type: "reportType", mode: "edit", id: rtId });
        if (found) {
          setReportTypeForm({
            code: found.code,
            name: found.name,
            targetScope: found.targetScope || "ALL",
            isActive: Boolean(found.isActive),
            displayOrder: found.displayOrder ?? 1,
          });
        }
      }
    } else if (location.pathname.includes("/admin/report-types")) {
      setActiveSubTab("reportTypes");
      setDetailView(null);
    } else if (location.pathname.includes("/admin/settings") || location.pathname.includes("/admin/system-settings")) {
      setActiveSubTab("systemSettings");
      setDetailView(null);
    }
  }, [location.pathname, reportTypes.length]);

  // 1. Fetch System Settings
  const fetchSystemSettings = async () => {
    setIsSettingsLoading(true);
    try {
      const params = selectedGroup !== "ALL" ? { group: selectedGroup } : undefined;
      const res: any = await adminService.getSystemSettings(params);
      const list = extractList<AdminSystemSettingItem>(res?.data || res);
      setSystemSettings(list);

      // Populate form state map
      const initialMap: Record<string, string> = {};
      list.forEach((item) => {
        initialMap[item.settingKey] = item.settingValue;
      });
      setSettingValues(initialMap);
    } catch {
      setSystemSettings([]);
    } finally {
      setIsSettingsLoading(false);
    }
  };

  // 2. Fetch Report Types
  const fetchReportTypes = async () => {
    setIsReportTypesLoading(true);
    try {
      const params = reportScopeFilter !== "ALL" ? { targetScope: reportScopeFilter } : undefined;
      const res: any = await adminService.getReportTypes(params);
      const list = extractList<AdminReportTypeItem>(res?.data || res);
      setReportTypes(list);
    } catch {
      setReportTypes([]);
    } finally {
      setIsReportTypesLoading(false);
    }
  };

  useEffect(() => {
    fetchSystemSettings();
  }, [selectedGroup]);

  useEffect(() => {
    fetchReportTypes();
  }, [reportScopeFilter]);

  // Handle Save Single System Setting
  const handleSaveSingleSetting = async (key: string) => {
    const item = systemSettings.find((s) => s.settingKey === key);
    const value = settingValues[key] ?? "";
    try {
      await adminService.updateSystemSetting(key, {
        settingValue: value,
        description: item?.description,
      });
      notify(`Đã lưu thiết lập '${key}' thành công!`);
      fetchSystemSettings();
      refreshSettings();
    } catch (err: any) {
      const msg = err?.response?.data?.message || err?.message || "Lỗi khi lưu cài đặt.";
      notify(msg);
    }
  };

  // Handle Batch Save All Settings
  const handleSaveAllSettings = async () => {
    setIsSavingBatch(true);
    try {
      await adminService.batchUpdateSystemSettings(settingValues);
      notify("Đã cập nhật đồng loạt toàn bộ cấu hình hệ thống thành công!");
      fetchSystemSettings();
      refreshSettings();
    } catch (err: any) {
      const msg = err?.response?.data?.message || err?.message || "Lỗi khi lưu cài đặt đồng loạt.";
      notify(msg);
    } finally {
      setIsSavingBatch(false);
    }
  };

  // Report Type Detail Navigation Handlers
  const handleOpenReportTypeDetail = (rt?: AdminReportTypeItem) => {
    if (rt) {
      setDetailView({ type: "reportType", mode: "edit", id: rt.id });
      setReportTypeForm({
        code: rt.code,
        name: rt.name,
        targetScope: rt.targetScope || "ALL",
        isActive: Boolean(rt.isActive),
        displayOrder: rt.displayOrder ?? 1,
      });
      navigate(`/admin/report-types/${rt.id}`);
    } else {
      setDetailView({ type: "reportType", mode: "create" });
      setReportTypeForm({
        code: "",
        name: "",
        targetScope: "CONTENT",
        isActive: true,
        displayOrder: reportTypes.length + 1,
      });
      navigate("/admin/report-types/new");
    }
  };

  const handleBackToList = () => {
    setDetailView(null);
    navigate("/admin/report-types");
  };

  const handleSaveReportType = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reportTypeForm.name.trim()) {
      notify("Vui lòng nhập tên lý do báo cáo!");
      return;
    }
    if (!reportTypeForm.code.trim()) {
      notify("Vui lòng nhập mã định danh (Code)!");
      return;
    }

    setIsSubmittingReportType(true);
    try {
      const payload: Partial<AdminReportTypeItem> = {
        code: reportTypeForm.code.trim().toUpperCase(),
        name: reportTypeForm.name.trim(),
        targetScope: reportTypeForm.targetScope,
        isActive: reportTypeForm.isActive,
        displayOrder: Number(reportTypeForm.displayOrder),
      };

      if (detailView?.mode === "edit" && detailView.id) {
        await adminService.updateReportType(detailView.id, payload);
        notify("Cập nhật lý do báo cáo thành công!");
      } else {
        await adminService.createReportType(payload);
        notify("Thêm mới lý do báo cáo thành công!");
      }
      handleBackToList();
      fetchReportTypes();
    } catch (err: any) {
      const msg = err?.response?.data?.message || err?.message || "Lỗi khi lưu lý do báo cáo.";
      notify(msg);
    } finally {
      setIsSubmittingReportType(false);
    }
  };

  const handleToggleReportTypeStatus = async (id: number, currentActive: boolean) => {
    try {
      await adminService.updateReportTypeStatus(id, !currentActive);
      notify(`Đã ${!currentActive ? "bật" : "tắt"} kích hoạt lý do báo cáo.`);
      fetchReportTypes();
    } catch (err: any) {
      const msg = err?.response?.data?.message || err?.message || "Lỗi khi chuyển trạng thái.";
      notify(msg);
    }
  };

  const handleExecuteDeleteReportType = async () => {
    const { id } = deleteConfirm;
    try {
      await adminService.deleteReportType(id);
      notify("Đã xóa lý do báo cáo thành công.");
      setDeleteConfirm((prev) => ({ ...prev, isOpen: false }));
      if (detailView?.type === "reportType" && detailView.id === id) {
        handleBackToList();
      }
      fetchReportTypes();
    } catch (err: any) {
      const msg = err?.response?.data?.message || err?.message || "Không thể xóa lý do báo cáo.";
      notify(msg);
    }
  };

  // =========================================================================
  // RENDER DEDICATED DETAIL VIEW: REPORT TYPE
  // =========================================================================
  if (detailView?.type === "reportType") {
    const isEdit = detailView.mode === "edit";
    const currentRt = isEdit ? reportTypes.find((r) => r.id === detailView.id) : null;

    return (
      <div className="space-y-4 animate-in fade-in duration-150 text-xs">
        {/* Top Header Navigation */}
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
                <ShieldAlert size={16} className="text-emerald-600" />
                <span>{isEdit ? `Chi tiết Lý do vi phạm: ${currentRt?.name || `#${detailView.id}`}` : "Thêm mới Lý do báo cáo vi phạm"}</span>
              </div>
              <p className="text-[11px] text-slate-400">
                {isEdit ? "Điều chỉnh tên hiển thị, phạm vi kiểm duyệt và thứ tự ưu tiên" : "Khai báo lý do vi phạm mới phục vụ kiểm duyệt nội dung và địa điểm"}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="submit"
              form="report-type-detail-form"
              disabled={isSubmittingReportType}
              className="flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl transition-all shadow-sm shadow-emerald-600/20 cursor-pointer disabled:opacity-50"
            >
              <Save size={15} />
              <span>{isSubmittingReportType ? "Đang lưu..." : isEdit ? "Lưu thay đổi" : "Tạo lý do báo cáo"}</span>
            </button>
          </div>
        </div>

        {/* Main Form Content */}
        <form id="report-type-detail-form" onSubmit={handleSaveReportType} className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Left Column: Form Details */}
          <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-2xs space-y-4">
            <h3 className="font-bold text-slate-900 text-sm border-b border-slate-100 pb-3">
              Thông số cấu hình lý do kiểm duyệt
            </h3>

            <div>
              <label className="block text-slate-700 font-bold mb-1.5">Mã định danh hệ thống (Code) *</label>
              <input
                type="text"
                placeholder="Ví dụ: SPAM_ADVERTISING, INAPPROPRIATE_CONTENT, FAKE_LOCATION"
                value={reportTypeForm.code}
                disabled={isEdit}
                onChange={(e) => setReportTypeForm({ ...reportTypeForm, code: e.target.value.toUpperCase() })}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 disabled:opacity-60"
                required
              />
              <p className="text-[10px] text-slate-400 mt-1">
                {isEdit
                  ? "Mã định danh không thể thay đổi sau khi khởi tạo để đảm bảo toàn vẹn dữ liệu ghi nhận vi phạm."
                  : "Mã viết hoa không dấu, phân tách bằng dấu gạch dưới, định danh duy nhất cho loại báo cáo."}
              </p>
            </div>

            <div>
              <label className="block text-slate-700 font-bold mb-1.5">Tên lý do hiển thị cho người dùng &amp; kiểm duyệt viên *</label>
              <input
                type="text"
                placeholder="Ví dụ: Spam quảng cáo, chèo kéo hoặc nội dung vô nghĩa"
                value={reportTypeForm.name}
                onChange={(e) => setReportTypeForm({ ...reportTypeForm, name: e.target.value })}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 font-medium"
                required
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-slate-700 font-bold mb-1.5">Phạm vi áp dụng (Target Scope)</label>
                <CustomSelect
                  value={reportTypeForm.targetScope}
                  onChange={(val) => setReportTypeForm({ ...reportTypeForm, targetScope: val })}
                  options={[
                    { value: "ALL", label: "Toàn bộ nền tảng" },
                    { value: "PLACE", label: "Chỉ áp dụng Địa điểm" },
                    { value: "CONTENT", label: "Chỉ áp dụng Bài viết / Bình luận" },
                  ]}
                  className="w-full"
                />
                <p className="text-[10px] text-slate-400 mt-1">Xác định loại đối tượng mà người dùng có thể chọn lý do này khi gửi báo cáo.</p>
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1.5">Thứ tự hiển thị (Display Order)</label>
                <input
                  type="number"
                  min="1"
                  value={reportTypeForm.displayOrder}
                  onChange={(e) => setReportTypeForm({ ...reportTypeForm, displayOrder: Number(e.target.value) })}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                />
                <p className="text-[10px] text-slate-400 mt-1">Số càng nhỏ sẽ được ưu tiên hiển thị ở vị trí đầu danh sách lựa chọn.</p>
              </div>
            </div>
          </div>

          {/* Right Column: Status & Stats Card */}
          <div className="space-y-4">
            <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-2xs space-y-4">
              <h4 className="font-bold text-slate-900 text-xs border-b border-slate-100 pb-2 flex items-center gap-1.5">
                <Shield size={14} className="text-emerald-600" />
                <span>Trạng thái kích hoạt</span>
              </h4>

              <label className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl border border-slate-200/80 cursor-pointer hover:bg-slate-100/70 transition-colors">
                <input
                  type="checkbox"
                  checked={reportTypeForm.isActive}
                  onChange={(e) => setReportTypeForm({ ...reportTypeForm, isActive: e.target.checked })}
                  className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 border-slate-300"
                />
                <div>
                  <span className="font-bold text-slate-900 text-xs block">
                    {reportTypeForm.isActive ? "Đang áp dụng" : "Vô hiệu hóa"}
                  </span>
                  <span className="text-[10px] text-slate-500 block">
                    {reportTypeForm.isActive
                      ? "Người dùng có thể chọn lý do này trong biểu mẫu gửi báo cáo vi phạm."
                      : "Tạm ẩn lý do này, không cho phép gửi báo cáo mới."}
                  </span>
                </div>
              </label>
            </div>

            {isEdit && currentRt && (
              <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-2xs space-y-3">
                <h4 className="font-bold text-slate-900 text-xs border-b border-slate-100 pb-2 flex items-center gap-1.5">
                  <Info size={14} className="text-blue-600" />
                  <span>Thống kê kiểm toán</span>
                </h4>
                <div className="space-y-2 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500">Mã ID định danh:</span>
                    <span className="font-mono font-bold text-slate-800">#{currentRt.id}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500">Tổng số báo cáo đã ghi nhận:</span>
                    <span className="font-bold text-slate-900 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                      {currentRt.totalReportsCount ?? 0} lượt
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500">Phạm vi văn bản:</span>
                    <span className="font-bold text-emerald-700">
                      {currentRt.targetScopeName || currentRt.targetScope}
                    </span>
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() =>
                      setDeleteConfirm({
                        isOpen: true,
                        id: currentRt.id,
                        name: currentRt.name,
                        warningMessage:
                          currentRt.totalReportsCount && currentRt.totalReportsCount > 0
                            ? `Lý do vi phạm này đã có ${currentRt.totalReportsCount} báo cáo vi phạm liên kết. Hệ thống sẽ chặn xóa để bảo toàn dữ liệu kiểm toán!`
                            : undefined,
                      })
                    }
                    className="w-full py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold rounded-xl transition-colors cursor-pointer text-center"
                  >
                    Xóa lý do vi phạm này
                  </button>
                </div>
              </div>
            )}
          </div>
        </form>

        {/* Delete Confirmation Modal */}
        {deleteConfirm.isOpen && (
          <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl max-w-sm w-full p-5 border border-slate-200 shadow-2xl space-y-4 animate-in zoom-in-95 duration-150">
              <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center">
                <Trash2 size={20} />
              </div>
              <div>
                <h4 className="font-bold text-slate-900 text-sm">
                  Xác nhận xóa lý do báo cáo vi phạm?
                </h4>
                <p className="text-xs text-slate-500 mt-1">
                  Thao tác xóa <b>"{deleteConfirm.name}"</b> không thể hoàn tác.
                </p>
                {deleteConfirm.warningMessage && (
                  <div className="mt-2.5 p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-[11px] leading-relaxed font-semibold">
                    ⚠️ {deleteConfirm.warningMessage}
                  </div>
                )}
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  onClick={() => setDeleteConfirm((prev) => ({ ...prev, isOpen: false }))}
                  className="px-3.5 py-1.5 border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold rounded-xl cursor-pointer"
                >
                  Hủy bỏ
                </button>
                <button
                  onClick={handleExecuteDeleteReportType}
                  className="px-3.5 py-1.5 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl cursor-pointer"
                >
                  Đồng ý xóa
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // =========================================================================
  // MAIN SYSTEM SETTINGS & REPORT TYPES TAB LIST VIEW
  // =========================================================================
  return (
    <div className="space-y-4 animate-in fade-in duration-150 text-xs">
      {/* Sub-tab Navigation */}
      <div className="flex items-center justify-between bg-white px-4 py-2.5 rounded-2xl border border-slate-200/80 shadow-2xs">
        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              setActiveSubTab("systemSettings");
              navigate("/admin/system-settings");
            }}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl font-bold transition-all cursor-pointer ${
              activeSubTab === "systemSettings"
                ? "bg-emerald-600 text-white shadow-sm shadow-emerald-600/20"
                : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
            }`}
          >
            <Sliders size={14} />
            <span>Cài đặt hệ thống ({systemSettings.length})</span>
          </button>

          <button
            onClick={() => {
              setActiveSubTab("reportTypes");
              navigate("/admin/report-types");
            }}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl font-bold transition-all cursor-pointer ${
              activeSubTab === "reportTypes"
                ? "bg-emerald-600 text-white shadow-sm shadow-emerald-600/20"
                : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
            }`}
          >
            <ShieldAlert size={14} />
            <span>Lý do vi phạm ({reportTypes.length})</span>
          </button>
        </div>
      </div>

      {/* 1. SUB-TAB: SYSTEM SETTINGS */}
      {activeSubTab === "systemSettings" && (
        <div className="space-y-4">
          {/* Action Toolbar & Group Filters */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-2xs flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <span className="font-bold text-slate-700">Nhóm thiết lập:</span>
              <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl">
                {[
                  { id: "ALL", label: "Tất cả" },
                  { id: "GENERAL", label: "Cấu hình chung" },
                  { id: "MODERATION", label: "Kiểm duyệt & SLA" },
                  { id: "SECURITY", label: "Bảo mật & Từ cấm" },
                  { id: "MEDIA", label: "Hình ảnh & Media" },
                ].map((g) => (
                  <button
                    key={g.id}
                    onClick={() => setSelectedGroup(g.id)}
                    className={`px-3 py-1 rounded-lg font-bold transition-all cursor-pointer text-xs ${
                      selectedGroup === g.id
                        ? "bg-white text-slate-900 shadow-2xs"
                        : "text-slate-600 hover:text-slate-900"
                    }`}
                  >
                    {g.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => fetchSystemSettings()}
                className="p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
                title="Làm mới"
              >
                <RefreshCw size={16} className={isSettingsLoading ? "animate-spin text-emerald-600" : ""} />
              </button>

              <button
                onClick={handleSaveAllSettings}
                disabled={isSavingBatch || systemSettings.length === 0}
                className="flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl transition-all shadow-sm shadow-emerald-600/20 cursor-pointer disabled:opacity-50"
              >
                <Save size={16} />
                <span>{isSavingBatch ? "Đang lưu đồng loạt..." : "Lưu tất cả thay đổi"}</span>
              </button>
            </div>
          </div>

          {/* Settings Grid / List */}
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-2xs divide-y divide-slate-100 overflow-hidden">
            {systemSettings.map((item) => {
              const val = settingValues[item.settingKey] ?? item.settingValue;
              const isBooleanSetting =
                item.settingKey.startsWith("AUTO_") ||
                item.settingKey.includes("ENABLE") ||
                item.settingKey.includes("MAINTENANCE");

              return (
                <div key={item.id || item.settingKey} className="p-5 hover:bg-slate-50/50 transition-colors">
                  <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                    <div className="space-y-1 md:w-1/3">
                      <div>
                        <span className="font-bold text-slate-900 text-xs">
                          {cleanDisplay(item.settingName || item.settingKey)}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500">{cleanDisplay(item.description)}</p>
                      {item.updatedAt && (
                        <p className="text-[10px] text-slate-400">
                          Cập nhật: {new Date(item.updatedAt).toLocaleString("vi-VN")}{" "}
                          {item.updatedByName ? `bởi ${item.updatedByName}` : ""}
                        </p>
                      )}
                    </div>

                    <div className="flex flex-1 items-center gap-3">
                      {isBooleanSetting ? (
                        <div className="flex items-center gap-3">
                          <button
                            type="button"
                            onClick={() => {
                              const nextVal = val === "1" ? "0" : "1";
                              setSettingValues((prev) => ({ ...prev, [item.settingKey]: nextVal }));
                            }}
                            className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                              val === "1" ? "bg-emerald-600" : "bg-slate-300"
                            }`}
                          >
                            <span
                              className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
                                val === "1" ? "translate-x-5" : "translate-x-0"
                              }`}
                            />
                          </button>
                          <span className="font-bold text-slate-800 text-xs">
                            {val === "1" ? "Bật" : "Tắt"}
                          </span>
                        </div>
                      ) : (
                        <input
                          type="text"
                          value={val}
                          onChange={(e) => {
                            const v = e.target.value;
                            setSettingValues((prev) => ({ ...prev, [item.settingKey]: v }));
                          }}
                          className="flex-1 px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                        />
                      )}

                      <button
                        type="button"
                        onClick={() => handleSaveSingleSetting(item.settingKey)}
                        className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl transition-colors cursor-pointer shrink-0"
                        title="Lưu riêng dòng này"
                      >
                        Lưu
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}

            {systemSettings.length === 0 && !isSettingsLoading && (
              <div className="p-10 text-center text-slate-400">
                Không tìm thấy cấu hình nào thuộc nhóm đã chọn.
              </div>
            )}
            {isSettingsLoading && (
              <div className="p-10 text-center text-slate-400">
                <RefreshCw size={20} className="animate-spin mx-auto text-emerald-600 mb-2" />
                Đang tải cấu hình hệ thống...
              </div>
            )}
          </div>
        </div>
      )}

      {/* 2. SUB-TAB: REPORT TYPES (LÝ DO BÁO CÁO VI PHẠM) */}
      {activeSubTab === "reportTypes" && (
        <div className="space-y-4">
          {/* Action Toolbar & Filters */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-2xs flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <span className="font-bold text-slate-700">Phạm vi áp dụng:</span>
              <CustomSelect
                value={reportScopeFilter}
                onChange={(val) => setReportScopeFilter(val)}
                options={[
                  { value: "ALL", label: "Tất cả phạm vi" },
                  { value: "PLACE", label: "Chỉ áp dụng Địa điểm (PLACE)" },
                  { value: "CONTENT", label: "Chỉ áp dụng Nội dung (CONTENT)" },
                ]}
                className="w-56"
              />
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => fetchReportTypes()}
                className="p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
                title="Làm mới"
              >
                <RefreshCw size={16} className={isReportTypesLoading ? "animate-spin text-emerald-600" : ""} />
              </button>

              <button
                onClick={() => handleOpenReportTypeDetail()}
                className="flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl transition-all shadow-sm shadow-emerald-600/20 cursor-pointer"
              >
                <Plus size={16} />
                <span>Thêm lý do báo cáo mới</span>
              </button>
            </div>
          </div>

          {/* Table */}
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-2xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-500 font-bold text-[11px] uppercase tracking-wider">
                    <th className="p-3.5 pl-4 w-14">ID</th>
                    <th className="p-3.5">Tên lý do vi phạm</th>
                    <th className="p-3.5">Phạm vi áp dụng</th>
                    <th className="p-3.5 text-center">Tổng vi phạm ghi nhận</th>
                    <th className="p-3.5 text-center">Thứ tự</th>
                    <th className="p-3.5">Trạng thái</th>
                    <th className="p-3.5 pr-4 text-center">Xem chi tiết</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium">
                  {reportTypes.map((rt) => {
                    const isActive = Boolean(rt.isActive);
                    return (
                      <tr
                        key={rt.id}
                        onClick={() => handleOpenReportTypeDetail(rt)}
                        className="hover:bg-slate-50/80 transition-colors cursor-pointer group"
                      >
                        <td className="p-3.5 pl-4 text-slate-400 font-mono text-[11px]">#{rt.id}</td>
                        <td className="p-3.5 font-bold text-slate-800 group-hover:text-emerald-600 transition-colors">
                          {rt.name}
                        </td>
                        <td className="p-3.5">
                          <span
                            className={`inline-flex items-center px-2.5 py-1 rounded-lg text-[10px] font-bold ${
                              rt.targetScope === "PLACE"
                                ? "bg-amber-50 text-amber-700 border border-amber-200"
                                : rt.targetScope === "CONTENT"
                                ? "bg-blue-50 text-blue-700 border border-blue-200"
                                : "bg-purple-50 text-purple-700 border border-purple-200"
                            }`}
                          >
                            {rt.targetScopeName ||
                              (rt.targetScope === "PLACE"
                                ? "Địa điểm"
                                : rt.targetScope === "CONTENT"
                                ? "Nội dung & Bài viết"
                                : "Toàn bộ (ALL)")}
                          </span>
                        </td>
                        <td className="p-3.5 text-center font-bold text-slate-800">
                          {rt.totalReportsCount ?? 0} lượt
                        </td>
                        <td className="p-3.5 text-center font-mono font-bold text-slate-600">
                          {rt.displayOrder ?? 1}
                        </td>
                        <td className="p-3.5" onClick={(e) => e.stopPropagation()}>
                          <button
                            onClick={() => handleToggleReportTypeStatus(rt.id, isActive)}
                            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold transition-all cursor-pointer ${
                              isActive
                                ? "bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100"
                                : "bg-slate-100 text-slate-500 border border-slate-200 hover:bg-slate-200"
                            }`}
                            title="Bấm để bật/tắt lý do vi phạm"
                          >
                            {isActive ? <CheckCircle2 size={12} /> : <XCircle size={12} />}
                            <span>{rt.statusName || (isActive ? "Đang áp dụng" : "Vô hiệu hóa")}</span>
                          </button>
                        </td>
                        <td className="p-3.5 text-center" onClick={(e) => e.stopPropagation()}>
                          <button
                            type="button"
                            onClick={() => handleOpenReportTypeDetail(rt)}
                            className="px-2.5 py-1 text-xs font-semibold text-emerald-700 hover:bg-emerald-50 rounded-lg transition-colors cursor-pointer"
                          >
                            Chi tiết →
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                  {reportTypes.length === 0 && !isReportTypesLoading && (
                    <tr>
                      <td colSpan={8} className="p-10 text-center text-slate-400">
                        Chưa có lý do báo cáo vi phạm nào trong danh mục.
                      </td>
                    </tr>
                  )}
                  {isReportTypesLoading && (
                    <tr>
                      <td colSpan={8} className="p-10 text-center text-slate-400">
                        <RefreshCw size={20} className="animate-spin mx-auto text-emerald-600 mb-2" />
                        Đang tải danh mục lý do báo cáo...
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* CONFIRMATION MODAL: SAFE DELETE REPORT TYPE */}
      {deleteConfirm.isOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-5 border border-slate-200 shadow-2xl space-y-4 animate-in zoom-in-95 duration-150">
            <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center">
              <Trash2 size={20} />
            </div>
            <div>
              <h4 className="font-bold text-slate-900 text-sm">
                Xác nhận xóa lý do báo cáo vi phạm?
              </h4>
              <p className="text-xs text-slate-500 mt-1">
                Thao tác xóa <b>"{deleteConfirm.name}"</b> không thể hoàn tác.
              </p>
              {deleteConfirm.warningMessage && (
                <div className="mt-2.5 p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-[11px] leading-relaxed font-semibold">
                  ⚠️ {deleteConfirm.warningMessage}
                </div>
              )}
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setDeleteConfirm((prev) => ({ ...prev, isOpen: false }))}
                className="px-3.5 py-1.5 border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold rounded-xl cursor-pointer"
              >
                Hủy bỏ
              </button>
              <button
                onClick={handleExecuteDeleteReportType}
                className="px-3.5 py-1.5 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl cursor-pointer"
              >
                Đồng ý xóa
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SystemSettingsTab;
