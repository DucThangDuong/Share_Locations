import React, { useState, useEffect } from "react";
import type { AdminMainTab } from "@/types/admin.types";
import {
  LayoutDashboard,
  MapPin,
  MessageSquare,
  ShieldAlert,
  ClipboardCheck,
  Utensils,
  FolderHeart,
  BookOpen,
  Layers,
  LogOut,
  PanelLeftClose,
  PanelLeftOpen,
  ChevronDown,
} from "lucide-react";

interface AdminSidebarProps {
  isSidebarOpen: boolean;
  setIsSidebarOpen: (v: boolean) => void;
  mainTab: AdminMainTab;
  setMainTab: (tab: AdminMainTab) => void;
  setSelectedPlaceId: (id: number | null) => void;
  pendingPlacesCount: number;
  pendingProposalsCount: number;
  reportedReviewsCount: number;
  pendingReportsCount: number;
  placeReportsCount?: number;
  reviewReportsCount?: number;
  commentReportsCount?: number;
  blogReportsCount?: number;
  reportTargetTypeFilter?: "all" | "place" | "review" | "comment" | "blog" | "photo";
  setReportTargetTypeFilter?: (v: "all" | "place" | "review" | "comment" | "blog" | "photo") => void;
  foodsCount: number;
  blogsCount: number;
  auditLogsCount: number;
  onBackToUserView: () => void;
}

export const AdminSidebar: React.FC<AdminSidebarProps> = ({
  isSidebarOpen,
  setIsSidebarOpen,
  mainTab,
  setMainTab,
  setSelectedPlaceId,
  pendingPlacesCount,
  pendingProposalsCount,
  reportedReviewsCount,
  pendingReportsCount: _pendingReportsCount,
  placeReportsCount = 0,
  reviewReportsCount = 0,
  commentReportsCount = 0,
  blogReportsCount = 0,
  reportTargetTypeFilter = "all",
  setReportTargetTypeFilter,
  foodsCount,
  blogsCount,
  auditLogsCount: _auditLogsCount,
  onBackToUserView,
}) => {
  const [isReportsDropdownOpen, setIsReportsDropdownOpen] = useState<boolean>(mainTab === "reports");

  useEffect(() => {
    if (mainTab === "reports") {
      setIsReportsDropdownOpen(true);
    }
  }, [mainTab]);
  return (
    <>
      {/* Mobile backdrop */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-30 lg:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      <aside
        className={`${isSidebarOpen ? "w-64 translate-x-0" : "-translate-x-full lg:translate-x-0 lg:w-20"
          } fixed lg:sticky top-0 h-screen bg-white border-r border-slate-200/80 flex flex-col justify-between shrink-0 transition-all duration-300 ease-in-out z-40 select-none shadow-[2px_0_12px_rgba(0,0,0,0.02)]`}
      >
        <div className="flex flex-col h-full overflow-hidden">
          {/* Brand Header & Toggle */}
          <div className="h-16 px-5 flex items-center justify-between shrink-0 border-b border-slate-100">
            <div className="flex items-center gap-3 overflow-hidden">
              {isSidebarOpen && (
                <div className="leading-tight overflow-hidden">
                  <span className="font-extrabold text-base text-slate-900 tracking-tight block">
                    LangThang
                  </span>
                  <span className="text-[10px] text-slate-400 font-medium block">
                    Admin Portal
                  </span>
                </div>
              )}
            </div>

            {/* Desktop Toggle Button */}
            <button
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer shrink-0 hidden lg:block"
              title={isSidebarOpen ? "Thu gọn menu" : "Mở rộng menu"}
            >
              {isSidebarOpen ? <PanelLeftClose size={17} /> : <PanelLeftOpen size={17} />}
            </button>
          </div>

          {/* Navigation Items */}
          <div className="px-3 py-3 space-y-4 flex-1 overflow-y-auto text-xs">
            {/* GROUP 1: CORE MODERATION */}
            <div className="space-y-1">
              {isSidebarOpen && (
                <div className="px-3 pt-1 pb-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  Điều hành &amp; Kiểm duyệt
                </div>
              )}

              {[
                { id: "dashboard", label: "Tổng quan", icon: LayoutDashboard },
                { id: "places", label: "Địa điểm", icon: MapPin, count: pendingPlacesCount, isAlert: pendingPlacesCount > 0 },
                { id: "proposals", label: "Đề xuất đóng góp", icon: ClipboardCheck, count: pendingProposalsCount, isAlert: pendingProposalsCount > 0 },
                { id: "reviews_comments", label: "Đánh giá & Bình luận", icon: MessageSquare, count: reportedReviewsCount, isAlert: reportedReviewsCount > 0 },
              ].map((item) => {
                const IconComp = item.icon;
                const isActive = mainTab === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => {
                      setMainTab(item.id as AdminMainTab);
                      setSelectedPlaceId(null);
                    }}
                    className={`w-full group flex items-center ${isSidebarOpen ? "justify-between px-3" : "justify-center px-0"
                      } py-2 rounded-xl font-semibold transition-all duration-150 cursor-pointer ${isActive
                        ? "bg-emerald-600 text-white font-bold shadow-sm shadow-emerald-600/20"
                        : "text-slate-600 hover:text-slate-900 hover:bg-slate-100/70"
                      }`}
                    title={!isSidebarOpen ? item.label : undefined}
                  >
                    <span className="flex items-center gap-2.5">
                      <IconComp
                        size={17}
                        className={
                          isActive
                            ? "text-white"
                            : "text-slate-400 group-hover:text-slate-600 transition-colors"
                        }
                      />
                      {isSidebarOpen && <span className="truncate text-xs">{item.label}</span>}
                    </span>

                  </button>
                );
              })}

              {/* DROPDOWN: BÁO CÁO VI PHẠM */}
              <div>
                <button
                  onClick={() => {
                    setMainTab("reports");
                    setSelectedPlaceId(null);
                    if (isSidebarOpen) {
                      setIsReportsDropdownOpen((prev) => !prev);
                    }
                  }}
                  className={`w-full group flex items-center ${isSidebarOpen ? "justify-between px-3" : "justify-center px-0"
                    } py-2 rounded-xl font-semibold transition-all duration-150 cursor-pointer ${mainTab === "reports"
                      ? "bg-emerald-600 text-white font-bold shadow-sm shadow-emerald-600/20"
                      : "text-slate-600 hover:text-slate-900 hover:bg-slate-100/70"
                    }`}
                  title={!isSidebarOpen ? "Báo cáo vi phạm" : undefined}
                >
                  <span className="flex items-center gap-2.5">
                    <ShieldAlert
                      size={17}
                      className={
                        mainTab === "reports"
                          ? "text-white"
                          : "text-slate-400 group-hover:text-slate-600 transition-colors"
                      }
                    />
                    {isSidebarOpen && <span className="truncate text-xs">Báo cáo vi phạm</span>}
                  </span>

                  {isSidebarOpen && (
                    <div className="flex items-center gap-1.5 shrink-0">
                      <ChevronDown
                        size={14}
                        className={`transition-transform duration-200 ${isReportsDropdownOpen ? "rotate-180" : ""
                          } ${mainTab === "reports" ? "text-white" : "text-slate-400"}`}
                      />
                    </div>
                  )}
                </button>

                {/* Sub-menu options when expanded */}
                {isSidebarOpen && isReportsDropdownOpen && (
                  <div className="pl-3.5 ml-3.5 border-l-2 border-emerald-100 space-y-0.5 mt-1 animate-in fade-in slide-in-from-top-1 duration-150">
                    {[
                      {
                        id: "place" as const,
                        label: "Báo cáo địa điểm",
                        count: placeReportsCount,
                      },
                      {
                        id: "review" as const,
                        label: "Báo cáo đánh giá",
                        count: reviewReportsCount,
                      },
                      {
                        id: "comment" as const,
                        label: "Báo cáo bình luận",
                        count: commentReportsCount,
                      },
                      {
                        id: "blog" as const,
                        label: "Báo cáo bài viết",
                        count: blogReportsCount,
                      },
                    ].map((sub) => {
                      const isSubActive =
                        mainTab === "reports" && reportTargetTypeFilter === sub.id;

                      return (
                        <button
                          key={sub.id}
                          onClick={() => {
                            setMainTab("reports");
                            setReportTargetTypeFilter?.(sub.id);
                            setSelectedPlaceId(null);
                          }}
                          className={`w-full flex items-center justify-between px-3 py-1.5 rounded-lg text-[11px] transition-all duration-150 cursor-pointer ${isSubActive
                            ? "bg-emerald-50 text-emerald-800 font-bold border border-emerald-200/80 shadow-2xs"
                            : "text-slate-600 hover:text-slate-900 hover:bg-slate-100/70 font-medium"
                            }`}
                        >
                          <span className="truncate">{sub.label}</span>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

            {/* GROUP 2: CONTENT & CATALOG */}
            <div className="space-y-1 pt-1 border-t border-slate-100">
              {isSidebarOpen && (
                <div className="px-3 pt-2 pb-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  Nội dung &amp; Danh mục
                </div>
              )}

              {[
                { id: "foods", label: "Ẩm thực & Đặc sản", icon: Utensils, count: foodsCount },
                { id: "collections", label: "Bộ sưu tập tuyển chọn", icon: FolderHeart },
                { id: "blogs", label: "Blog & Cẩm nang", icon: BookOpen, count: blogsCount },
                { id: "categories", label: "Danh mục hệ thống", icon: Layers },
              ].map((item) => {
                const IconComp = item.icon;
                const isActive = mainTab === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => {
                      setMainTab(item.id as AdminMainTab);
                      setSelectedPlaceId(null);
                    }}
                    className={`w-full group flex items-center ${isSidebarOpen ? "justify-between px-3" : "justify-center px-0"
                      } py-2 rounded-xl font-semibold transition-all duration-150 cursor-pointer ${isActive
                        ? "bg-emerald-600 text-white font-bold shadow-sm shadow-emerald-600/20"
                        : "text-slate-600 hover:text-slate-900 hover:bg-slate-100/70"
                      }`}
                    title={!isSidebarOpen ? item.label : undefined}
                  >
                    <span className="flex items-center gap-2.5">
                      <IconComp
                        size={17}
                        className={
                          isActive
                            ? "text-white"
                            : "text-slate-400 group-hover:text-slate-600 transition-colors"
                        }
                      />
                      {isSidebarOpen && <span className="truncate text-xs">{item.label}</span>}
                    </span>

                    {isSidebarOpen && item.count !== undefined && (
                      <span
                        className={`text-[10px] px-1.5 py-0.2 rounded-full font-medium ${isActive
                          ? "bg-white text-emerald-700"
                          : "bg-slate-100 text-slate-500"
                          }`}
                      >
                        {item.count}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Footer Back to User App */}
          <div className="p-3 border-t border-slate-100 shrink-0">
            <button
              onClick={onBackToUserView}
              className={`w-full flex items-center ${isSidebarOpen ? "justify-start px-3" : "justify-center px-0"
                } py-2 rounded-xl text-xs font-semibold text-slate-600 hover:text-emerald-700 hover:bg-emerald-50 transition-colors cursor-pointer group`}
              title="Về trang người dùng"
            >
              <LogOut size={16} className="text-slate-400 group-hover:text-emerald-600 transition-colors" />
              {isSidebarOpen && <span className="ml-2.5 truncate">Về trang chủ</span>}
            </button>
          </div>
        </div>
      </aside>
    </>
  );
};

export default AdminSidebar;
