import React, { useState } from "react";
import {
  FolderHeart,
  Compass,
  Layers,
  History,
  Search,
} from "lucide-react";
import type {
  AdminAuditLog,
  AdminAssignmentInfo,
} from "@/types/admin.types";
import { adminService, extractList } from "@/services/adminService";

export { FoodsTab } from "./FoodsTab";

/* ── TAB 7: COLLECTIONS ── */
export const CollectionsTab: React.FC = () => {
  const [collections, setCollections] = useState<any[]>([]);

  React.useEffect(() => {
    adminService.getCollections().then((res: any) => {
      const items = extractList(res?.data);
      if (items.length > 0) {
        setCollections(items);
      }
    }).catch(() => {});
  }, []);

  return (
    <div className="space-y-6 animate-in fade-in duration-150 text-xs">
      <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-2xs">
        <h2 className="font-bold text-base text-slate-900 tracking-tight flex items-center gap-2">
          <FolderHeart className="text-slate-700" size={18} />
          <span>Bộ sưu tập địa điểm tuyển chọn</span>
        </h2>
        <p className="text-xs text-slate-400 mt-0.5">
          Bộ sưu tập do Ban biên tập định hướng theo chủ đề du lịch và ẩm thực
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {collections.map((col) => (
          <div key={col.id} className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-2xs space-y-3">
            <img src={col.coverImg || col.img || "https://images.unsplash.com/photo-1541544741938-0af808871cc0?w=600&h=400&fit=crop"} alt="" className="w-full h-40 rounded-xl object-cover" />
            <h4 className="font-bold text-sm text-slate-900">{col.name}</h4>
            <span className="text-xs text-slate-500 font-medium block">
              {col.placesCount ?? col.count ?? 0} địa điểm tuyển chọn
            </span>
          </div>
        ))}
        {collections.length === 0 && (
          <div className="col-span-full p-8 text-center text-slate-400 bg-white rounded-2xl border border-dashed border-slate-200">
            Chưa có bộ sưu tập nào được tải từ hệ thống.
          </div>
        )}
      </div>
    </div>
  );
};

/* ── TAB 8: PROVINCES ── */
export const ProvincesTab: React.FC = () => {
  const [provinces, setProvinces] = useState<any[]>([]);

  React.useEffect(() => {
    adminService.getCompleteness().then((res: any) => {
      const items = extractList(res?.data);
      if (items.length > 0) {
        setProvinces(items);
      }
    }).catch(() => {});
  }, []);

  return (
    <div className="space-y-6 animate-in fade-in duration-150 text-xs">
      <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-2xs">
        <h2 className="font-bold text-base text-slate-900 tracking-tight flex items-center gap-2">
          <Compass className="text-slate-700" size={18} />
          <span>Tỉnh / Thành trong vùng &amp; Độ hoàn thiện dữ liệu</span>
        </h2>
        <p className="text-xs text-slate-400 mt-0.5">
          Theo dõi độ phủ số hóa địa điểm ẩm thực &amp; danh lam thắng cảnh theo địa bàn
        </p>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-2xs overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-500 font-bold text-[11px] uppercase tracking-wider">
              <th className="p-3.5 pl-4">Tỉnh / Thành</th>
              <th className="p-3.5">Số lượng địa điểm</th>
              <th className="p-3.5">Độ hoàn thiện</th>
              <th className="p-3.5">Trạng thái số hóa</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {provinces.map((prov, i) => {
              const compPercent = prov.completenessPercent ?? parseInt(prov.completeness || "0", 10);
              return (
                <tr key={prov.id || i} className="hover:bg-slate-50/60 transition-colors">
                  <td className="p-3.5 pl-4 font-bold text-slate-900">{prov.name}</td>
                  <td className="p-3.5 text-slate-700 font-medium">{prov.placesCount ?? prov.places ?? 0} địa điểm</td>
                  <td className="p-3.5">
                    <div className="flex items-center gap-2">
                      <div className="w-24 h-2 bg-slate-100 rounded-full overflow-hidden">
                        <div className="h-full bg-emerald-500" style={{ width: `${compPercent}%` }} />
                      </div>
                      <span className="font-bold text-slate-800">{compPercent}%</span>
                    </div>
                  </td>
                  <td className="p-3.5">
                    <span
                      className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        compPercent > 80 ? "bg-emerald-100 text-emerald-800" : "bg-slate-100 text-slate-600"
                      }`}
                    >
                      {compPercent > 80 ? "Đang công khai" : "Đang phát triển"}
                    </span>
                  </td>
                </tr>
              );
            })}
            {provinces.length === 0 && (
              <tr>
                <td colSpan={4} className="p-8 text-center text-slate-400">
                  Chưa có dữ liệu độ hoàn thiện tỉnh thành.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

/* ── TAB 9: BLOGS ── */
export { BlogsTab } from "./BlogsTab";

/* ── TAB 10: CATEGORIES ── */
export const CategoriesTab: React.FC = () => {
  const [categories, setCategories] = useState<any[]>([]);

  React.useEffect(() => {
    adminService.getCategories().then((res: any) => {
      const items = extractList(res?.data);
      if (items.length > 0) {
        setCategories(items);
      }
    }).catch(() => {});
  }, []);

  return (
    <div className="space-y-6 animate-in fade-in duration-150 text-xs">
      <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-2xs">
        <h2 className="font-bold text-base text-slate-900 tracking-tight flex items-center gap-2">
          <Layers className="text-slate-700" size={18} />
          <span>Danh mục &amp; Phân loại hệ thống</span>
        </h2>
        <p className="text-xs text-slate-400 mt-0.5">
          Danh mục định danh các địa điểm trên toàn bộ nền tảng LangThang
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {categories.map((cat, idx) => (
          <div key={cat.id || idx} className="p-4 bg-white rounded-2xl border border-slate-200/80 shadow-2xs space-y-1">
            <div className="flex items-center justify-between">
              <h4 className="font-bold text-sm text-slate-900">{cat.name}</h4>
              <span className="font-bold text-slate-600 bg-slate-100 px-2 py-0.5 rounded-md text-[10px]">
                {cat.count ?? cat.placesCount ?? 0} địa điểm
              </span>
            </div>
            <p className="text-slate-500 text-xs">{cat.desc || cat.slug}</p>
          </div>
        ))}
        {categories.length === 0 && (
          <div className="col-span-full p-8 text-center text-slate-400 bg-white rounded-2xl border border-dashed border-slate-200">
            Chưa có danh mục nào được tải.
          </div>
        )}
      </div>
    </div>
  );
};

/* ── TAB 11: NOTIFICATIONS & PROFILE ── */
export const NotificationsProfileTab: React.FC<{
  currentAdminInfo: AdminAssignmentInfo;
}> = ({ currentAdminInfo }) => {
  return (
    <div className="space-y-6 animate-in fade-in duration-150 text-xs">
      <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-2xs space-y-4">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-full bg-slate-900 text-white font-bold text-xl flex items-center justify-center ring-4 ring-emerald-50 shadow-md">
            {(currentAdminInfo.adminName || "A").charAt(0).toUpperCase()}
          </div>
          <div>
            <h2 className="font-bold text-base text-slate-900">{currentAdminInfo.adminName}</h2>
            <p className="text-xs text-slate-500">Mã nhân sự: ADM-{currentAdminInfo.adminId} • Vai trò: {currentAdminInfo.role}</p>
            <span className="inline-block px-2.5 py-0.5 bg-emerald-50 text-emerald-700 font-bold rounded-full text-[10px] mt-1 border border-emerald-200">
              Quyền hạn kiểm duyệt toàn hệ thống
            </span>
          </div>
        </div>

        <div className="pt-4 border-t border-slate-100 grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
            <h4 className="font-bold text-slate-900 mb-1">Cấu hình thông báo kiểm duyệt</h4>
            <p className="text-slate-500 text-xs leading-relaxed">
              Tự động nhận thông báo qua email khi có báo cáo vi phạm SLA mức khẩn cấp.
            </p>
          </div>
          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
            <h4 className="font-bold text-slate-900 mb-1">Hồ sơ xác thực 2 lớp (2FA)</h4>
            <p className="text-slate-500 text-xs leading-relaxed">
              Bảo mật tài khoản điều phối viên với mã xác thực OTP qua Google Authenticator.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

/* ── TAB: AUDIT LOGS ── */
export const AuditLogsTab: React.FC<{ auditLogs: AdminAuditLog[] }> = ({ auditLogs }) => {
  const [logSearch, setLogSearch] = useState("");

  const filteredLogs = auditLogs.filter((log) => {
    if (!logSearch.trim()) return true;
    const q = logSearch.toLowerCase();
    return (
      log.action.toLowerCase().includes(q) ||
      log.targetName.toLowerCase().includes(q) ||
      log.details.toLowerCase().includes(q) ||
      log.adminName.toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-6 animate-in fade-in duration-150 text-xs">
      <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-2xs flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="font-bold text-base text-slate-900 tracking-tight flex items-center gap-2">
            <History className="text-slate-700" size={18} />
            <span>Nhật ký kiểm toán hệ thống</span>
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Lịch sử lưu vết các thao tác phê duyệt, khóa đối tượng và ban hành quyết định kiểm duyệt
          </p>
        </div>

        <div className="relative w-64">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Tìm theo hành động, nhân sự..."
            value={logSearch}
            onChange={(e) => setLogSearch(e.target.value)}
            className="w-full pl-8.5 pr-3 py-1.5 rounded-xl border border-slate-200 bg-slate-50 text-xs font-medium text-slate-800 outline-none focus:border-emerald-500"
          />
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-2xs overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-500 font-bold text-[11px] uppercase tracking-wider">
              <th className="p-3.5 pl-4">Hành động</th>
              <th className="p-3.5">Đối tượng tác động</th>
              <th className="p-3.5">Chi tiết nghiệp vụ</th>
              <th className="p-3.5">Nhân sự thực hiện</th>
              <th className="p-3.5 text-right pr-4">Thời gian</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filteredLogs.map((l) => (
              <tr key={l.id} className="hover:bg-slate-50/60 transition-colors">
                <td className="p-3.5 pl-4">
                  <span
                    className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold ${l.type === "approve"
                        ? "bg-emerald-100 text-emerald-800"
                        : l.type === "reject"
                          ? "bg-rose-100 text-rose-800"
                          : l.type === "hide"
                            ? "bg-amber-100 text-amber-800"
                            : "bg-slate-100 text-slate-700"
                      }`}
                  >
                    {l.action}
                  </span>
                </td>
                <td className="p-3.5 font-bold text-slate-900">{l.targetName}</td>
                <td className="p-3.5 text-slate-600 max-w-sm leading-relaxed">{l.details}</td>
                <td className="p-3.5 font-semibold text-slate-800">{l.adminName}</td>
                <td className="p-3.5 text-right pr-4 text-slate-400 font-mono text-[11px]">
                  {l.timestamp}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
