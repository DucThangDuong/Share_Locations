import React, { useState } from "react";
import { Search, User } from "lucide-react";
import type { AdminProposalItem } from "@/types/admin.types";
import { adminService } from "@/services/adminService";
import { ProposalDetailEditor } from "./ProposalDetailEditor";

interface ProposalsTabProps {
  proposals: AdminProposalItem[];
  proposalStatusFilter: "all" | "0" | "1" | "2";
  setProposalStatusFilter: (status: "all" | "0" | "1" | "2") => void;
  setProposals: React.Dispatch<React.SetStateAction<AdminProposalItem[]>>;
  addAuditLog: (
    action: string,
    targetName: string,
    details: string,
    type: "approve" | "reject" | "resolve" | "hide" | "edit"
  ) => void;
  showToast: (msg: string) => void;
  onApprove?: (id: number) => Promise<void>;
  onReject?: (id: number, reason: string) => Promise<void>;
}

export const ProposalsTab: React.FC<ProposalsTabProps> = ({
  proposals,
  proposalStatusFilter,
  setProposalStatusFilter,
  setProposals,
  addAuditLog,
  showToast,
  onApprove,
  onReject,
}) => {
  const [selectedProposalId, setSelectedProposalId] = useState<number | null>(null);
  const [proposalSearchText, setProposalSearchText] = useState("");
  const [proposalFilterProvince, setProposalFilterProvince] = useState("all");

  const currentProposal = selectedProposalId
    ? proposals.find((p) => p.id === selectedProposalId)
    : null;

  const filteredProposals = proposals.filter((p) => {
    if (proposalFilterProvince !== "all" && p.province !== proposalFilterProvince) return false;
    if (proposalStatusFilter !== "all" && String(p.status) !== proposalStatusFilter) return false;
    if (proposalSearchText.trim()) {
      const q = proposalSearchText.toLowerCase();
      const matchName = (p.placeName || p.proposedData?.name || "").toLowerCase().includes(q);
      const matchLoc = (p.proposedData?.address || p.province || "").toLowerCase().includes(q);
      const matchUser = (p.proposedBy || "").toLowerCase().includes(q);
      if (!matchName && !matchLoc && !matchUser) return false;
    }
    return true;
  });

  const handleApprove = async (proposal: AdminProposalItem) => {
    if (onApprove) await onApprove(proposal.id);
    else await adminService.approveProposal(proposal.id);
    setProposals((prev) =>
      prev.map((p) => (p.id === proposal.id ? { ...p, status: 1 } : p))
    );
    addAuditLog(
      "Duyệt đề xuất người dùng",
      proposal.placeName,
      `Chấp thuận đề xuất từ ${proposal.proposedBy}`,
      "approve"
    );
    showToast(`Đã duyệt đề xuất "${proposal.placeName}".`);
  };

  const handleReject = async (proposal: AdminProposalItem) => {
    if (onReject) await onReject(proposal.id, "Đề xuất không đáp ứng tiêu chí kiểm duyệt.");
    else await adminService.rejectProposal(proposal.id, "Đề xuất không đáp ứng tiêu chí kiểm duyệt.");
    setProposals((prev) =>
      prev.map((p) => (p.id === proposal.id ? { ...p, status: 2 } : p))
    );
    addAuditLog(
      "Từ chối đề xuất người dùng",
      proposal.placeName,
      `Từ chối đề xuất từ ${proposal.proposedBy}`,
      "reject"
    );
    showToast(`Đã từ chối đề xuất "${proposal.placeName}".`);
  };

  const handleSaveProposal = (updatedProposal: AdminProposalItem) => {
    setProposals((prev) =>
      prev.map((p) => (p.id === updatedProposal.id ? updatedProposal : p))
    );
    addAuditLog(
      "Cập nhật thông tin đề xuất",
      updatedProposal.placeName,
      "Chỉnh sửa nội dung dữ liệu đề xuất trước khi phê duyệt",
      "edit"
    );
    showToast(`Đã lưu chỉnh sửa đề xuất "${updatedProposal.placeName}".`);
  };

  if (selectedProposalId && currentProposal) {
    return (
      <ProposalDetailEditor
        proposal={currentProposal}
        onBack={() => setSelectedProposalId(null)}
        onSave={handleSaveProposal}
        onApprove={handleApprove}
        onReject={handleReject}
      />
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-150 text-xs">
      <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-2xs space-y-4">
        {/* Search & Filter Bar (Identical to PlacesTab) */}
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="relative flex-1 min-w-[240px]">
            <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Tìm kiếm theo tên đề xuất, địa chỉ, người gửi..."
              value={proposalSearchText}
              onChange={(e) => setProposalSearchText(e.target.value)}
              className="w-full pl-9 pr-4 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-medium text-slate-800 placeholder:text-slate-400 focus:bg-white outline-none focus:border-emerald-500"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <select
              value={proposalFilterProvince}
              onChange={(e) => setProposalFilterProvince(e.target.value)}
              className="px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 font-medium text-slate-800 outline-none focus:border-emerald-500 cursor-pointer"
            >
              <option value="all">Tất cả tỉnh thành</option>
              <option value="Đà Nẵng">Đà Nẵng</option>
              <option value="Quảng Nam">Quảng Nam</option>
              <option value="Thừa Thiên Huế">Thừa Thiên Huế</option>
              <option value="Khánh Hòa">Khánh Hòa</option>
              <option value="Lâm Đồng">Lâm Đồng</option>
              <option value="Hà Nội">Hà Nội</option>
              <option value="TP. Hồ Chí Minh">TP. Hồ Chí Minh</option>
            </select>

            <select
              value={proposalStatusFilter}
              onChange={(e) => setProposalStatusFilter(e.target.value as any)}
              className="px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 font-medium text-slate-800 outline-none focus:border-emerald-500 cursor-pointer"
            >
              <option value="all">Tất cả trạng thái</option>
              <option value="0">Chờ duyệt</option>
              <option value="1">Đã chấp nhận</option>
              <option value="2">Đã từ chối</option>
            </select>
          </div>
        </div>

        {/* Proposals Table (Minimalist row-by-row layout matching PlacesTab) */}
        <div className="overflow-x-auto rounded-xl border border-slate-200/80">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-500 font-bold text-[11px] uppercase tracking-wider">
                <th className="p-3.5 pl-4">Địa điểm đề xuất</th>
                <th className="p-3.5">Danh mục</th>
                <th className="p-3.5">Tỉnh / Thành</th>
                <th className="p-3.5">Người gửi</th>
                <th className="p-3.5">Trạng thái</th>
                <th className="p-3.5 text-right pr-4">Hành động</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredProposals.map((prop) => {
                const thumb =
                  prop.proposedData?.imageUrl ||
                  "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=600&h=400&fit=crop";
                const displayAddr =
                  prop.proposedData?.address ||
                  (prop.province ? `${prop.province}, Việt Nam` : "Chưa có địa chỉ chi tiết");

                return (
                  <tr
                    key={prop.id}
                    className="hover:bg-slate-50/60 transition-colors group cursor-pointer"
                    onClick={() => setSelectedProposalId(prop.id)}
                  >
                    <td className="p-3.5 pl-4 font-bold text-slate-900">
                      <div className="flex items-center gap-3">
                        <img
                          src={thumb}
                          className="w-10 h-10 rounded-lg object-cover border border-slate-200 shrink-0"
                          alt=""
                        />
                        <div>
                          <div className="font-bold text-slate-900 group-hover:text-emerald-700 transition-colors">
                            {prop.placeName}
                          </div>
                          <div className="text-[11px] text-slate-400 font-normal truncate max-w-xs">
                            {displayAddr}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="p-3.5 text-slate-700 font-medium">
                      {prop.category || prop.proposedData?.category || "Nhà hàng & Quán ăn"}
                    </td>
                    <td className="p-3.5 text-slate-700 font-medium">{prop.province}</td>
                    <td className="p-3.5">
                      <div className="flex items-center gap-2">
                        {prop.userAvatar ? (
                          <img
                            src={prop.userAvatar}
                            className="w-6 h-6 rounded-full object-cover border border-slate-200"
                            alt=""
                          />
                        ) : (
                          <div className="w-6 h-6 rounded-full bg-slate-200 flex items-center justify-center text-slate-500 font-bold text-[10px]">
                            <User size={12} />
                          </div>
                        )}
                        <div>
                          <div className="font-semibold text-slate-800 text-[11px]">
                            {prop.proposedBy}
                          </div>
                          <div className="text-[10px] text-slate-400 font-normal">
                            {prop.submittedAt}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="p-3.5">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          prop.status === 0
                            ? "bg-amber-100 text-amber-800"
                            : prop.status === 1
                            ? "bg-emerald-100 text-emerald-800"
                            : "bg-rose-100 text-rose-800"
                        }`}
                      >
                        {prop.status === 0
                          ? "Chờ duyệt"
                          : prop.status === 1
                          ? "Đã chấp nhận"
                          : "Đã từ chối"}
                      </span>
                    </td>
                    <td className="p-3.5 text-right pr-4" onClick={(e) => e.stopPropagation()}>
                      <button
                        onClick={() => setSelectedProposalId(prop.id)}
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

          {filteredProposals.length === 0 && (
            <div className="p-8 text-center text-slate-400">
              Không tìm thấy đề xuất nào phù hợp với điều kiện tìm kiếm.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProposalsTab;
