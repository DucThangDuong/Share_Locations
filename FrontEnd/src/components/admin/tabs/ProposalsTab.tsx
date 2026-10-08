import React, { useState, useMemo, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Search, User, Image as ImageIcon } from "lucide-react";
import type { AdminProposalItem } from "@/types/admin.types";
import { adminService, extractList } from "@/services/adminService";
import { geographyService, type ProvinceDto } from "@/services/geographyService";
import { ProposalDetailEditor } from "./ProposalDetailEditor";
import { CustomSelect } from "@/components/common/CustomSelect";

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
  onApprove?: (id: number, adminNotes?: string) => Promise<void>;
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
  const navigate = useNavigate();
  const location = useLocation();

  const [selectedProposalId, setSelectedProposalId] = useState<number | null>(null);
  const [proposalSearchText, setProposalSearchText] = useState("");
  const [proposalFilterProvince, setProposalFilterProvince] = useState("all");
  const [provinces, setProvinces] = useState<ProvinceDto[]>([]);

  useEffect(() => {
    geographyService.getProvinces().then((res: any) => {
      const items = extractList(res?.data || res);
      if (items.length > 0) setProvinces(items);
    }).catch(() => {});
  }, []);

  // Match /admin/proposals/:id from URL path
  const proposalPathMatch = location.pathname.match(/\/admin\/proposals\/(\d+)/i);
  const urlProposalId = proposalPathMatch ? Number(proposalPathMatch[1]) : selectedProposalId;

  const currentProposal = useMemo(() => {
    if (!urlProposalId) return null;
    return proposals.find((p) => Number(p.id) === urlProposalId) || null;
  }, [urlProposalId, proposals]);

  const filteredProposals = proposals.filter((p) => {
    const prov = p.provinceName || p.province || "";
    if (proposalFilterProvince !== "all" && prov !== proposalFilterProvince) return false;
    if (proposalStatusFilter !== "all" && String(p.status) !== proposalStatusFilter) return false;
    if (proposalSearchText.trim()) {
      const q = proposalSearchText.toLowerCase();
      const matchName = (p.placeName || p.proposedData?.name || "").toLowerCase().includes(q);
      const matchLoc = (p.address || p.proposedData?.address || prov).toLowerCase().includes(q);
      const matchUser = (p.proposerName || p.proposedBy || "").toLowerCase().includes(q);
      if (!matchName && !matchLoc && !matchUser) return false;
    }
    return true;
  });

  const handleApprove = async (proposal: AdminProposalItem, adminNotes?: string) => {
    if (onApprove) await onApprove(proposal.id, adminNotes);
    else await adminService.approveProposal(proposal.id, adminNotes);
    setProposals((prev) =>
      prev.map((p) => (p.id === proposal.id ? { ...p, status: 1, adminNotes } : p))
    );
    addAuditLog(
      "Duyệt đề xuất người dùng",
      proposal.placeName,
      `Chấp thuận đề xuất từ ${proposal.proposerName || proposal.proposedBy}`,
      "approve"
    );
    showToast(`Đã duyệt đề xuất "${proposal.placeName}".`);
  };

  const handleReject = async (proposal: AdminProposalItem, reason: string) => {
    if (onReject) await onReject(proposal.id, reason);
    else await adminService.rejectProposal(proposal.id, reason);
    setProposals((prev) =>
      prev.map((p) => (p.id === proposal.id ? { ...p, status: 2, rejectionReason: reason } : p))
    );
    addAuditLog(
      "Từ chối đề xuất người dùng",
      proposal.placeName,
      `Từ chối đề xuất từ ${proposal.proposerName || proposal.proposedBy}: ${reason}`,
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

  if (currentProposal) {
    return (
      <ProposalDetailEditor
        proposal={currentProposal}
        onBack={() => {
          setSelectedProposalId(null);
          navigate('/admin/proposals');
        }}
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
            <CustomSelect
              value={proposalFilterProvince}
              onChange={(val) => setProposalFilterProvince(val)}
              options={[
                { value: "all", label: "Tất cả tỉnh thành" },
                ...provinces.map((p) => ({ value: p.name, label: p.name })),
              ]}
              size="sm"
              className="min-w-[140px]"
            />

            <CustomSelect
              value={proposalStatusFilter}
              onChange={(val) => setProposalStatusFilter(val as any)}
              options={[
                { value: "all", label: "Tất cả trạng thái" },
                { value: "0", label: "Chờ duyệt" },
                { value: "1", label: "Đã chấp nhận" },
                { value: "2", label: "Đã từ chối" },
              ]}
              size="sm"
              className="min-w-[130px]"
            />
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
                <th className="p-3.5 text-center">Xem chi tiết</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredProposals.map((prop) => {
                const thumb =
                  prop.coverImg ||
                  prop.placeData?.coverImg ||
                  prop.proposedData?.imageUrl ||
                  prop.proposedData?.coverImg ||
                  "";
                const displayAddr =
                  prop.address ||
                  prop.proposedData?.address ||
                  (prop.provinceName || prop.province ? `${prop.provinceName || prop.province}, Việt Nam` : "Chưa có địa chỉ chi tiết");
                const pName = prop.placeName || prop.proposedData?.name || "Địa điểm đề xuất";
                const catName = prop.categoryName || prop.category || prop.proposedData?.category || "Nhà hàng & Quán ăn";
                const provName = prop.provinceName || prop.province || "Toàn quốc";
                const proposerName = prop.proposerName || prop.proposedBy || prop.proposer?.name || "Người dùng";
                const proposerAvatar = prop.proposerAvatar || prop.userAvatar || prop.proposer?.avatarUrl;
                const formattedDate = prop.submittedAt
                  ? new Date(prop.submittedAt).toLocaleDateString("vi-VN", {
                      day: "2-digit",
                      month: "2-digit",
                      year: "numeric",
                    })
                  : "";

                return (
                  <tr
                    key={prop.id}
                    className="hover:bg-slate-50/60 transition-colors group cursor-pointer"
                    onClick={() => {
                      setSelectedProposalId(prop.id);
                      navigate(`/admin/proposals/${prop.id}`);
                    }}
                  >
                    <td className="p-3.5 pl-4 font-bold text-slate-900">
                      <div className="flex items-center gap-3">
                        {thumb ? (
                          <img
                            src={thumb}
                            className="w-10 h-10 rounded-lg object-cover border border-slate-200 shrink-0"
                            alt=""
                          />
                        ) : (
                          <div className="w-10 h-10 rounded-lg bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-400 shrink-0">
                            <ImageIcon size={16} />
                          </div>
                        )}
                        <div>
                          <div className="font-bold text-slate-900 group-hover:text-emerald-700 transition-colors">
                            {pName}
                          </div>
                          <div className="text-[11px] text-slate-400 font-normal truncate max-w-xs">
                            {displayAddr}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="p-3.5 text-slate-700 font-medium">
                      {catName}
                    </td>
                    <td className="p-3.5 text-slate-700 font-medium">{provName}</td>
                    <td className="p-3.5">
                      <div className="flex items-center gap-2">
                        {proposerAvatar ? (
                          <img
                            src={proposerAvatar}
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
                            {proposerName}
                          </div>
                          <div className="text-[10px] text-slate-400 font-normal">
                            {formattedDate || prop.submittedAt}
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
                    <td className="p-3.5 text-center" onClick={(e) => e.stopPropagation()}>
                      <button
                        onClick={() => {
                          setSelectedProposalId(prop.id);
                          navigate(`/admin/proposals/${prop.id}`);
                        }}
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
