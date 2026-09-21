import React from "react";
import type { GroupedReport, AdminReportItem } from "@/types/admin.types";
import { X, UserCheck } from "lucide-react";

interface ModerationDrawerProps {
  activeReportGroup: GroupedReport | null;
  selectedReportInDrawer: AdminReportItem | null;
  setSelectedReportIdInDrawer: (id: number) => void;
  drawerDecisionTab: "accept" | "dismiss";
  setDrawerDecisionTab: (tab: "accept" | "dismiss") => void;
  drawerActionTaken: string;
  setDrawerActionTaken: (action: string) => void;
  drawerResolutionNote: string;
  setDrawerResolutionNote: (note: string) => void;
  drawerDismissReason: string;
  setDrawerDismissReason: (reason: string) => void;
  drawerAutoCloseDuplicates: boolean;
  setDrawerAutoCloseDuplicates: (v: boolean) => void;
  drawerAutoNotifyReporters: boolean;
  setDrawerAutoNotifyReporters: (v: boolean) => void;
  drawerAutoRecalculateRating: boolean;
  setDrawerAutoRecalculateRating: (v: boolean) => void;
  handleConfirmDrawerResolution: () => void;
  handleAssignToMe: (groupKey: string) => void;
  onClose: () => void;
}

export const ModerationDrawer: React.FC<ModerationDrawerProps> = ({
  activeReportGroup,
  selectedReportInDrawer,
  setSelectedReportIdInDrawer,
  drawerDecisionTab,
  setDrawerDecisionTab,
  drawerActionTaken,
  setDrawerActionTaken,
  drawerResolutionNote,
  setDrawerResolutionNote,
  drawerDismissReason,
  setDrawerDismissReason,
  drawerAutoCloseDuplicates,
  setDrawerAutoCloseDuplicates,
  drawerAutoNotifyReporters,
  setDrawerAutoNotifyReporters,
  drawerAutoRecalculateRating,
  setDrawerAutoRecalculateRating,
  handleConfirmDrawerResolution,
  handleAssignToMe,
  onClose,
}) => {
  if (!activeReportGroup) return null;

  const currentReport = selectedReportInDrawer || activeReportGroup.reportsList[0];

  return (
    <div className="fixed inset-0 bg-slate-950/45 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 z-50 animate-in fade-in duration-150">
      <div className="bg-white rounded-2xl w-full max-w-5xl max-h-[90vh] shadow-2xl border border-slate-200/90 flex flex-col overflow-hidden text-xs">
        {/* Header */}
        <div className="p-4 px-6 bg-white border-b border-slate-100 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="space-y-0.5">
              <div className="flex items-center gap-2 text-[11px] font-medium text-slate-500">
                <span>Kiểm duyệt phản ánh</span>
                <span className="text-slate-300">•</span>
                <span className="font-mono text-slate-500">#{activeReportGroup.targetId}</span>
                <span className="text-slate-300">•</span>
                <span className="text-slate-700 font-semibold">
                  {activeReportGroup.targetType === "place" && "Địa điểm"}
                  {activeReportGroup.targetType === "review" && "Đánh giá"}
                  {activeReportGroup.targetType === "blog" && "Bài viết"}
                  {activeReportGroup.targetType === "photo" && "Hình ảnh"}
                  {activeReportGroup.targetType === "comment" && "Bình luận"}
                </span>
                <span className="text-slate-300">•</span>
                <span
                  className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                    activeReportGroup.highestPriority === "urgent"
                      ? "bg-rose-50 text-rose-700 border border-rose-200"
                      : activeReportGroup.highestPriority === "high"
                      ? "bg-amber-50 text-amber-700 border border-amber-200"
                      : "bg-slate-100 text-slate-700 border border-slate-200"
                  }`}
                >
                  <span
                    className={`w-1.5 h-1.5 rounded-full ${
                      activeReportGroup.highestPriority === "urgent"
                        ? "bg-rose-500"
                        : activeReportGroup.highestPriority === "high"
                        ? "bg-amber-500"
                        : "bg-slate-400"
                    }`}
                  />
                  {activeReportGroup.highestPriority === "urgent"
                    ? "Khẩn cấp"
                    : activeReportGroup.highestPriority === "high"
                    ? "Ưu tiên cao"
                    : "Bình thường"}
                </span>
              </div>
              <h2 className="text-base font-bold text-slate-900 tracking-tight">
                {activeReportGroup.targetTitle}
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {!activeReportGroup.assignedAdminId ? (
              <button
                onClick={() => handleAssignToMe(activeReportGroup.groupKey)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900 text-white font-semibold hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <UserCheck size={13} />
                <span>Nhận xử lý</span>
              </button>
            ) : (
              <span className="text-slate-500 text-[11px] bg-slate-100 px-2.5 py-1 rounded-lg">
                Đang xử lý bởi: <strong className="text-slate-800">{activeReportGroup.assignedAdminName}</strong>
              </span>
            )}

            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
            >
              <X size={17} />
            </button>
          </div>
        </div>

        {/* Content Layout */}
        <div className="flex-1 overflow-y-auto grid grid-cols-1 lg:grid-cols-12 divide-y lg:divide-y-0 lg:divide-x divide-slate-100">
          {/* Left Panel: Target Details & Reports Feed */}
          <div className="lg:col-span-7 p-6 space-y-5 overflow-y-auto">
            {/* Target Content Snapshot */}
            <div className="p-4 rounded-xl bg-slate-50/80 border border-slate-200/80 space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-800 uppercase text-[10px] tracking-wider">
                  Nội dung đối tượng bị phản ánh
                </span>
                {activeReportGroup.targetRating && (
                  <span className="bg-amber-100 text-amber-800 font-bold px-2 py-0.5 rounded-md text-[10px]">
                    ★ {activeReportGroup.targetRating}.0
                  </span>
                )}
              </div>

              {activeReportGroup.targetContent ? (
                <blockquote className="p-3 bg-white rounded-lg border border-slate-200 text-slate-800 italic leading-relaxed">
                  "{activeReportGroup.targetContent}"
                </blockquote>
              ) : (
                <div className="text-slate-600">
                  <p className="font-medium text-slate-900">{activeReportGroup.targetTitle}</p>
                  <p className="text-[11px] text-slate-500 mt-0.5">{activeReportGroup.targetSubtitle}</p>
                </div>
              )}
            </div>

            {/* Reports List for this Group */}
            <div className="space-y-2.5">
              <div className="flex items-center justify-between">
                <h4 className="font-bold text-slate-900 text-xs">
                  Danh sách phản ánh từ cộng đồng ({activeReportGroup.reportsCount})
                </h4>
                <span className="text-[10px] text-slate-400">Chọn phản ánh để đối chiếu chi tiết</span>
              </div>

              <div className="space-y-2">
                {activeReportGroup.reportsList.map((rep) => {
                  const isSelected = (currentReport && currentReport.id === rep.id);
                  return (
                    <div
                      key={rep.id}
                      onClick={() => setSelectedReportIdInDrawer(rep.id)}
                      className={`p-3.5 rounded-xl border transition-all cursor-pointer ${
                        isSelected
                          ? "border-emerald-600 bg-emerald-50/40 shadow-xs"
                          : "border-slate-200/80 bg-white hover:bg-slate-50"
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-bold text-slate-900">{rep.reporterName}</span>
                        <span className="text-[10px] text-slate-400 font-mono">{rep.submittedAt}</span>
                      </div>
                      <p className="text-rose-700 font-semibold text-xs">{rep.reasonContent}</p>
                      {rep.description && (
                        <p className="text-slate-600 text-[11px] mt-1 line-clamp-2">
                          "{rep.description}"
                        </p>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Right Panel: Decision & Moderation Controls */}
          <div className="lg:col-span-5 p-6 bg-slate-50/50 flex flex-col justify-between space-y-4">
            <div className="space-y-4">
              {/* Decision Tabs */}
              <div className="grid grid-cols-2 gap-2 p-1 bg-slate-200/60 rounded-xl">
                <button
                  type="button"
                  onClick={() => setDrawerDecisionTab("accept")}
                  className={`py-2 rounded-lg font-bold text-center transition-all cursor-pointer ${
                    drawerDecisionTab === "accept"
                      ? "bg-rose-600 text-white shadow-xs"
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  Xác nhận vi phạm
                </button>
                <button
                  type="button"
                  onClick={() => setDrawerDecisionTab("dismiss")}
                  className={`py-2 rounded-lg font-bold text-center transition-all cursor-pointer ${
                    drawerDecisionTab === "dismiss"
                      ? "bg-emerald-600 text-white shadow-xs"
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  Bác bỏ báo cáo
                </button>
              </div>

              {drawerDecisionTab === "accept" ? (
                /* Action taken when confirmed */
                <div className="space-y-3">
                  <div>
                    <label className="font-bold text-slate-800 block mb-1.5">
                      Hành động xử lý thực thi:
                    </label>
                    <select
                      value={drawerActionTaken}
                      onChange={(e) => setDrawerActionTaken(e.target.value)}
                      className="w-full p-2.5 rounded-xl border border-slate-300 bg-white font-medium text-slate-800 outline-none focus:border-rose-500"
                    >
                      <option value="hide_target">Tạm ẩn đối tượng khỏi hệ thống</option>
                      <option value="delete_permanently">Xóa vĩnh viễn nội dung vi phạm</option>
                      <option value="warn_user">Gửi cảnh cáo tới chủ tài khoản vi phạm</option>
                      <option value="block_account">Khóa quyền đăng bài tài khoản</option>
                    </select>
                  </div>

                  <div>
                    <label className="font-bold text-slate-800 block mb-1.5">
                      Ghi chú kết luận kiểm duyệt:
                    </label>
                    <textarea
                      rows={3}
                      value={drawerResolutionNote}
                      onChange={(e) => setDrawerResolutionNote(e.target.value)}
                      placeholder="Nêu rõ lý do hoặc bằng chứng vi phạm..."
                      className="w-full p-2.5 rounded-xl border border-slate-300 bg-white text-slate-800 outline-none focus:border-rose-500 resize-none"
                    />
                  </div>

                  {/* Automation checkboxes */}
                  <div className="space-y-2 pt-2 border-t border-slate-200/80">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={drawerAutoCloseDuplicates}
                        onChange={(e) => setDrawerAutoCloseDuplicates(e.target.checked)}
                        className="rounded border-slate-300 text-rose-600 focus:ring-rose-500"
                      />
                      <span className="text-slate-700 font-medium">
                        Tự động đóng tất cả các báo cáo trùng lặp khác
                      </span>
                    </label>

                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={drawerAutoNotifyReporters}
                        onChange={(e) => setDrawerAutoNotifyReporters(e.target.checked)}
                        className="rounded border-slate-300 text-rose-600 focus:ring-rose-500"
                      />
                      <span className="text-slate-700 font-medium">
                        Gửi thông báo phản hồi tới người báo cáo
                      </span>
                    </label>

                    {activeReportGroup.targetType === "review" && (
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={drawerAutoRecalculateRating}
                          onChange={(e) => setDrawerAutoRecalculateRating(e.target.checked)}
                          className="rounded border-slate-300 text-rose-600 focus:ring-rose-500"
                        />
                        <span className="text-slate-700 font-medium">
                          Tính toán lại điểm đánh giá trung bình cho địa điểm
                        </span>
                      </label>
                    )}
                  </div>
                </div>
              ) : (
                /* Dismiss Form */
                <div className="space-y-3">
                  <div>
                    <label className="font-bold text-slate-800 block mb-1.5">
                      Lý do bác bỏ phản ánh:
                    </label>
                    <select
                      value={drawerDismissReason}
                      onChange={(e) => setDrawerDismissReason(e.target.value)}
                      className="w-full p-2.5 rounded-xl border border-slate-300 bg-white font-medium text-slate-800 outline-none focus:border-emerald-500"
                    >
                      <option value="NO_VIOLATION">Nội dung hợp lệ, không vi phạm điều khoản</option>
                      <option value="INSUFFICIENT_EVIDENCE">Không đủ bằng chứng xác thực</option>
                      <option value="SPAM_ABUSE">Báo cáo sai mục đích hoặc quấy rối</option>
                      <option value="OTHER">Lý do nghiệp vụ khác</option>
                    </select>
                  </div>

                  <div>
                    <label className="font-bold text-slate-800 block mb-1.5">
                      Giải trình bác bỏ:
                    </label>
                    <textarea
                      rows={4}
                      value={drawerResolutionNote}
                      onChange={(e) => setDrawerResolutionNote(e.target.value)}
                      placeholder="Ghi chú chi tiết lý do bác bỏ để lưu hồ sơ kiểm toán..."
                      className="w-full p-2.5 rounded-xl border border-slate-300 bg-white text-slate-800 outline-none focus:border-emerald-500 resize-none"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Confirm button */}
            <div className="pt-4 border-t border-slate-200">
              <button
                type="button"
                onClick={handleConfirmDrawerResolution}
                className={`w-full py-2.5 rounded-xl font-bold text-white transition-all cursor-pointer shadow-md ${
                  drawerDecisionTab === "accept"
                    ? "bg-rose-600 hover:bg-rose-700 shadow-rose-600/20"
                    : "bg-emerald-600 hover:bg-emerald-700 shadow-emerald-600/20"
                }`}
              >
                {drawerDecisionTab === "accept"
                  ? "Xác nhận & Thi hành xử lý"
                  : "Hoàn tất bác bỏ phản ánh"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ModerationDrawer;
