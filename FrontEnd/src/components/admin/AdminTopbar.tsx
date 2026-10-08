import React, { useState } from "react";
import type { AdminMainTab, AdminAssignmentInfo } from "@/types/admin.types";
import { Bell, Menu } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useNotification } from "@/context/NotificationContext";
import { HeaderNotificationDropdown } from "@/components/notification";
import { getAdminRoleTitle } from "@/utils/authUtils";

interface AdminTopbarProps {
  isSidebarOpen: boolean;
  setIsSidebarOpen: (v: boolean) => void;
  mainTab: AdminMainTab;
  selectedPlaceId?: number | null;
  currentPlaceName?: string;
  searchText?: string;
  setSearchText?: (v: string) => void;
  currentAdminInfo?: AdminAssignmentInfo;
  showToast?: (msg: string) => void;
}

export const AdminTopbar: React.FC<AdminTopbarProps> = ({
  isSidebarOpen,
  setIsSidebarOpen,
  mainTab,
  selectedPlaceId,
  currentPlaceName,
  currentAdminInfo,
}) => {
  const { user } = useAuth();
  const { unreadCount, fetchNotifications } = useNotification();
  const [isNotifOpen, setIsNotifOpen] = useState(false);

  const storedUser = (() => {
    try {
      return JSON.parse(localStorage.getItem("user_info") || "{}");
    } catch {
      return {};
    }
  })();

  const adminName =
    user?.fullName ||
    currentAdminInfo?.adminName ||
    storedUser?.fullName ||
    storedUser?.name ||
    "Quản trị viên";

  const adminAvatar =
    user?.avatarUrl ||
    currentAdminInfo?.avatar ||
    storedUser?.avatarUrl ||
    storedUser?.avatar ||
    null;

  const roleTitle = getAdminRoleTitle();

  return (
    <header className="h-16 bg-white/95 backdrop-blur-md border-b border-slate-200/80 px-4 sm:px-6 flex items-center justify-between sticky top-0 z-20">
      <div className="flex items-center gap-3">
        {/* Mobile menu toggle */}
        <button
          onClick={() => setIsSidebarOpen(!isSidebarOpen)}
          className="p-2 rounded-xl border border-slate-200/80 hover:bg-slate-50 text-slate-600 transition-colors cursor-pointer lg:hidden"
          title="Bật / Tắt menu di động"
        >
          <Menu size={18} />
        </button>

        {/* Clean Breadcrumb */}
        <div className="flex items-center gap-2 text-xs font-medium">
          <span className="text-slate-900 font-bold">
            {mainTab === "dashboard" && "Tổng quan (Dashboard)"}
            {(mainTab === "admin_profile" || (mainTab as any) === "profile") && "Phạm vi điều hành"}
            {mainTab === "users" && "Quản lý Tài khoản & Phân quyền"}
            {mainTab === "places" && (selectedPlaceId ? `Chi tiết: ${currentPlaceName || ""}` : "Quản lý Địa điểm")}
            {mainTab === "proposals" && "Đề xuất đóng góp"}
            {mainTab === "reviews_comments" && "Đánh giá & Bình luận"}
            {mainTab === "reports" && "Báo cáo vi phạm"}
            {mainTab === "foods" && "Ẩm thực"}
            {mainTab === "collections" && "Bộ sưu tập"}
            {mainTab === "blogs" && "Blog & Cẩm nang"}
            {mainTab === "provinces" && "Tỉnh thành & Vùng"}
            {mainTab === "categories" && "Danh mục hệ thống"}
            {mainTab === "settings" && "Cài đặt hệ thống"}
            {mainTab === "notifications_profile" && "Cài đặt hệ thống"}
            {mainTab === "audit_logs" && "Nhật ký kiểm toán"}
          </span>
        </div>
      </div>

      <div className="flex items-center gap-3 sm:gap-4">
        {/* Notifications */}
        <div className="relative">
          <button
            onClick={() => {
              if (!isNotifOpen) {
                fetchNotifications(true);
              }
              setIsNotifOpen(!isNotifOpen);
            }}
            className={`relative p-2 rounded-xl transition-colors cursor-pointer ${
              isNotifOpen
                ? "bg-emerald-100 text-emerald-800"
                : "text-slate-500 hover:text-slate-900 hover:bg-slate-100"
            }`}
            title="Thông báo hệ thống & kiểm duyệt"
            aria-expanded={isNotifOpen}
          >
            <Bell size={18} />
            {unreadCount > 0 && (
              <span className="absolute top-1 right-1 min-w-[16px] h-[16px] px-1 bg-rose-500 text-white rounded-full text-[9px] font-black border-2 border-white flex items-center justify-center shadow-xs">
                {unreadCount > 99 ? "99+" : unreadCount}
              </span>
            )}
          </button>

          {isNotifOpen && (
            <HeaderNotificationDropdown onClose={() => setIsNotifOpen(false)} />
          )}
        </div>

        {/* Admin profile chip */}
        <div className="flex items-center gap-2.5 pl-3 border-l border-slate-200">
          {adminAvatar ? (
            <img
              src={adminAvatar}
              alt={adminName}
              className="w-8 h-8 rounded-full object-cover ring-2 ring-slate-100 shadow-2xs shrink-0"
            />
          ) : (
            <div className="w-8 h-8 rounded-full bg-slate-900 text-white font-bold text-xs flex items-center justify-center ring-2 ring-slate-100 shadow-2xs shrink-0">
              {(adminName || "A").charAt(0).toUpperCase()}
            </div>
          )}
          <div className="leading-tight">
            <span className="font-bold text-xs text-slate-900 block truncate max-w-[130px]">
              {adminName}
            </span>
            <span className="text-[10px] text-emerald-700 font-semibold block">
              {roleTitle}
            </span>
          </div>
        </div>
      </div>
    </header>
  );
};

export default AdminTopbar;
