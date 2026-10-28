import React, { useState, useEffect, useMemo } from "react";
import {
  FileText,
  X,
  Loader2,
  Check,
  Terminal,
  Copy,
  Layers,
  ArrowRight,
} from "lucide-react";
import type { AdminAuditLogDetail } from "@/types/admin.types";
import { adminService } from "@/services/adminService";
import {
  getActionMeta,
  getBadgeStyle,
  formatDateTime,
} from "@/components/admin/tabs/AuditLogsTab";

export interface AuditLogDetailModalProps {
  logId: number | null;
  onClose: () => void;
  fallbackLog?: any;
}

export const AuditLogDetailModal: React.FC<AuditLogDetailModalProps> = ({
  logId,
  onClose,
  fallbackLog,
}) => {
  const [detailLog, setDetailLog] = useState<AdminAuditLogDetail | null>(null);
  const [isDetailLoading, setIsDetailLoading] = useState(false);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  useEffect(() => {
    if (logId === null) {
      setDetailLog(null);
      return;
    }

    let active = true;
    setIsDetailLoading(true);
    if (fallbackLog) {
      setDetailLog(fallbackLog);
    } else {
      setDetailLog(null);
    }

    adminService
      .getAuditLogDetail(logId)
      .then((res: any) => {
        if (!active) return;
        const logData = res?.data || res;
        setDetailLog(logData);
      })
      .catch((err) => {
        console.error("Lỗi khi tải chi tiết kiểm toán:", err);
        if (active && fallbackLog) {
          setDetailLog({
            ...fallbackLog,
            oldDataJSON: null,
            newDataJSON: null,
            metadataJSON: null,
            requestId: "",
            userAgent: "",
          });
        }
      })
      .finally(() => {
        if (active) setIsDetailLoading(false);
      });

    return () => {
      active = false;
    };
  }, [logId, fallbackLog]);

  const handleCopyText = (text: string, key: string) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const parsedOldData = useMemo(() => {
    if (!detailLog?.oldDataJSON) return null;
    try {
      return typeof detailLog.oldDataJSON === "string"
        ? JSON.parse(detailLog.oldDataJSON)
        : detailLog.oldDataJSON;
    } catch {
      return detailLog.oldDataJSON;
    }
  }, [detailLog?.oldDataJSON]);

  const parsedNewData = useMemo(() => {
    if (!detailLog?.newDataJSON) return null;
    try {
      return typeof detailLog.newDataJSON === "string"
        ? JSON.parse(detailLog.newDataJSON)
        : detailLog.newDataJSON;
    } catch {
      return detailLog.newDataJSON;
    }
  }, [detailLog?.newDataJSON]);

  const parsedMetadata = useMemo(() => {
    if (!detailLog?.metadataJSON) return null;
    try {
      return typeof detailLog.metadataJSON === "string"
        ? JSON.parse(detailLog.metadataJSON)
        : detailLog.metadataJSON;
    } catch {
      return detailLog.metadataJSON;
    }
  }, [detailLog?.metadataJSON]);

  if (logId === null) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div
        className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-4 sm:p-5 border-b border-slate-200 flex items-center justify-between bg-slate-50/80">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-slate-900 text-white flex items-center justify-center font-bold">
              <FileText size={16} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-sm text-slate-900">
                  Chi tiết kiểm toán #{logId}
                </h3>
                {detailLog && (
                  <span
                    className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold border ${getBadgeStyle(
                      getActionMeta(detailLog.actionType, detailLog.actionTypeName, detailLog.targetTable).color
                    )}`}
                  >
                    {getActionMeta(detailLog.actionType, detailLog.actionTypeName, detailLog.targetTable).label}
                  </span>
                )}
              </div>
              <p className="text-[11px] text-slate-400">
                Đối soát dữ liệu trước và sau thao tác của quản trị viên
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-800 flex items-center justify-center transition-colors cursor-pointer"
          >
            <X size={16} />
          </button>
        </div>

        <div className="p-4 sm:p-6 overflow-y-auto space-y-5 text-xs">
          {isDetailLoading && !detailLog ? (
            <div className="p-16 flex flex-col items-center justify-center gap-2 text-slate-400">
              <Loader2 size={24} className="animate-spin text-emerald-600" />
              <p className="font-semibold text-xs text-slate-500">
                Đang tải chi tiết bản ghi kiểm toán...
              </p>
            </div>
          ) : detailLog ? (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80">
                  <div className="text-[10px] font-semibold text-slate-400 uppercase">
                    Quản trị viên thực hiện
                  </div>
                  <div className="font-bold text-slate-900 mt-0.5">{detailLog.adminName}</div>
                  <div className="text-[10px] text-slate-500 font-mono mt-0.5">
                    Role: {detailLog.actorRoleCode} (ID: #{detailLog.adminId})
                  </div>
                </div>

                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80">
                  <div className="text-[10px] font-semibold text-slate-400 uppercase">
                    Mục tiêu tác động
                  </div>
                  <div className="font-bold text-slate-900 mt-0.5 truncate" title={detailLog.targetName}>
                    {detailLog.targetName}
                  </div>
                  <div className="text-[10px] text-slate-500 font-mono mt-0.5">
                    {detailLog.targetTable} • ID #{detailLog.targetId}
                  </div>
                </div>

                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80">
                  <div className="text-[10px] font-semibold text-slate-400 uppercase">
                    Thời gian &amp; IP
                  </div>
                  <div className="font-mono text-slate-900 font-semibold mt-0.5">
                    {formatDateTime(detailLog.createdAt)}
                  </div>
                  <div className="text-[10px] text-slate-500 font-mono mt-0.5">
                    IP: {detailLog.ipAddress || "—"}
                  </div>
                </div>

                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80">
                  <div className="text-[10px] font-semibold text-slate-400 uppercase">
                    Trạng thái thao tác
                  </div>
                  <div className="font-bold text-emerald-700 mt-0.5 flex items-center gap-1">
                    <Check size={13} className="text-emerald-600" />
                    <span>{detailLog.actionStatusText || "Thành công"}</span>
                  </div>
                  <div className="text-[10px] text-slate-500 font-mono mt-0.5">
                    Code: {detailLog.actionStatus}
                  </div>
                </div>
              </div>

              <div className="p-3.5 bg-blue-50/60 rounded-xl border border-blue-200/80 space-y-1">
                <div className="font-bold text-blue-900 text-xs flex items-center gap-1.5">
                  <FileText size={13} className="text-blue-700" />
                  <span>Lý do / Nội dung thao tác:</span>
                </div>
                <p className="text-blue-950 font-medium leading-relaxed">
                  {detailLog.reason || "Không có ghi chú lý do."}
                </p>
              </div>

              <div className="p-3.5 bg-slate-900 text-slate-200 rounded-xl font-mono text-[11px] space-y-2">
                <div className="flex items-center justify-between text-slate-400 border-b border-slate-800 pb-1.5">
                  <span className="flex items-center gap-1.5 font-bold text-slate-300">
                    <Terminal size={12} className="text-emerald-400" />
                    <span>Thông tin kỹ thuật (System Trace)</span>
                  </span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-[10px]">
                  <div>
                    <span className="text-slate-400">Request ID: </span>
                    <span className="text-amber-300 font-semibold">
                      {detailLog.requestId || "N/A"}
                    </span>
                    {detailLog.requestId && (
                      <button
                        type="button"
                        onClick={() => handleCopyText(detailLog.requestId, "reqId")}
                        className="ml-2 text-slate-400 hover:text-white inline-flex items-center cursor-pointer"
                        title="Sao chép RequestId"
                      >
                        {copiedKey === "reqId" ? <Check size={11} className="text-emerald-400" /> : <Copy size={11} />}
                      </button>
                    )}
                  </div>
                  <div>
                    <span className="text-slate-400">Client IP: </span>
                    <span className="text-slate-100">{detailLog.ipAddress || "N/A"}</span>
                  </div>
                  <div className="col-span-full">
                    <span className="text-slate-400">User Agent: </span>
                    <span className="text-slate-300 break-all">{detailLog.userAgent || "N/A"}</span>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <h4 className="font-bold text-slate-900 text-xs flex items-center gap-1.5">
                  <Layers size={14} className="text-slate-600" />
                  <span>So sánh biến động dữ liệu (Data Diff)</span>
                </h4>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="rounded-xl border border-rose-200 bg-rose-50/40 p-3.5 space-y-2">
                    <div className="flex items-center justify-between font-bold text-rose-800 text-xs border-b border-rose-200 pb-1.5">
                      <span>Dữ liệu trước thay đổi (Old Data)</span>
                      {detailLog.oldDataJSON && (
                        <button
                          type="button"
                          onClick={() => handleCopyText(detailLog.oldDataJSON || "", "oldJson")}
                          className="text-rose-600 hover:text-rose-800 flex items-center gap-1 text-[10px] cursor-pointer"
                        >
                          {copiedKey === "oldJson" ? <Check size={11} /> : <Copy size={11} />}
                          <span>Copy JSON</span>
                        </button>
                      )}
                    </div>

                    {detailLog.oldDataJSON ? (
                      <pre className="p-3 bg-white/80 rounded-lg border border-rose-100 text-[11px] font-mono text-slate-800 overflow-x-auto max-h-60 leading-relaxed whitespace-pre-wrap break-all">
                        {typeof parsedOldData === "object"
                          ? JSON.stringify(parsedOldData, null, 2)
                          : detailLog.oldDataJSON}
                      </pre>
                    ) : (
                      <div className="p-6 text-center text-slate-400 italic text-[11px]">
                        Không có dữ liệu cũ (Thao tác tạo mới hoặc không có snapshot trước đó)
                      </div>
                    )}
                  </div>

                  <div className="rounded-xl border border-emerald-200 bg-emerald-50/40 p-3.5 space-y-2">
                    <div className="flex items-center justify-between font-bold text-emerald-800 text-xs border-b border-emerald-200 pb-1.5">
                      <span className="flex items-center gap-1">
                        <span>Dữ liệu sau thay đổi (New Data)</span>
                        <ArrowRight size={12} className="text-emerald-600" />
                      </span>
                      {detailLog.newDataJSON && (
                        <button
                          type="button"
                          onClick={() => handleCopyText(detailLog.newDataJSON || "", "newJson")}
                          className="text-emerald-600 hover:text-emerald-800 flex items-center gap-1 text-[10px] cursor-pointer"
                        >
                          {copiedKey === "newJson" ? <Check size={11} /> : <Copy size={11} />}
                          <span>Copy JSON</span>
                        </button>
                      )}
                    </div>

                    {detailLog.newDataJSON ? (
                      <pre className="p-3 bg-white/80 rounded-lg border border-emerald-100 text-[11px] font-mono text-slate-800 overflow-x-auto max-h-60 leading-relaxed whitespace-pre-wrap break-all">
                        {typeof parsedNewData === "object"
                          ? JSON.stringify(parsedNewData, null, 2)
                          : detailLog.newDataJSON}
                      </pre>
                    ) : (
                      <div className="p-6 text-center text-slate-400 italic text-[11px]">
                        Không có dữ liệu mới (Thao tác xóa hoặc không cập nhật payload mới)
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {detailLog.metadataJSON && (
                <div className="rounded-xl border border-slate-200 bg-slate-50 p-3.5 space-y-1.5">
                  <div className="font-bold text-slate-800 text-xs">
                    Metadata bổ sung (MetadataJSON)
                  </div>
                  <pre className="p-2.5 bg-white rounded-lg border border-slate-200 text-[11px] font-mono text-slate-700 overflow-x-auto max-h-40 whitespace-pre-wrap">
                    {typeof parsedMetadata === "object"
                      ? JSON.stringify(parsedMetadata, null, 2)
                      : detailLog.metadataJSON}
                  </pre>
                </div>
              )}
            </>
          ) : (
            <div className="p-8 text-center text-slate-400">
              Không tìm thấy chi tiết bản ghi.
            </div>
          )}
        </div>

        <div className="p-3.5 sm:p-4 bg-slate-50 border-t border-slate-200 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl border border-slate-300 hover:bg-slate-100 text-slate-700 font-bold text-xs transition-colors cursor-pointer"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
};
