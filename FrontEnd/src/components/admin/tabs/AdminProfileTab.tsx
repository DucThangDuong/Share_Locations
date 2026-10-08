import React, { useState, useEffect, useMemo } from "react";
import {
  MapPin,
  Layers,
  Loader2,
  AlertCircle,
  Compass,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { adminService, extractList } from "@/services/adminService";
import { isUserSystemAdmin } from "@/utils/authUtils";
import type {
  AdminAssignmentInfo,
  AdminUserDetail,
  AdminCatalogCategoryItem,
  AdminGeographyProvinceItem,
  AdminGeographyRegionItem,
} from "@/types/admin.types";

interface AdminProfileTabProps {
  currentAdminInfo?: AdminAssignmentInfo;
  onNavigateTab?: (tab: string) => void;
  showToast?: (msg: string) => void;
}

export const AdminProfileTab: React.FC<AdminProfileTabProps> = () => {
  const { user } = useAuth();
  const isSystemAdmin = isUserSystemAdmin();

  const [adminDetail, setAdminDetail] = useState<AdminUserDetail | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Catalogs
  const [allProvinces, setAllProvinces] = useState<AdminGeographyProvinceItem[]>([]);
  const [allCategories, setAllCategories] = useState<AdminCatalogCategoryItem[]>([]);
  const [allRegions, setAllRegions] = useState<AdminGeographyRegionItem[]>([]);

  useEffect(() => {
    const fetchAdminData = async () => {
      setIsLoading(true);
      const currentUserId = user?.id ? Number(user.id) : null;

      try {
        if (currentUserId) {
          const detailRes = await adminService.getUserDetail(currentUserId);
          const detailData = ((detailRes?.data || detailRes) as unknown) as AdminUserDetail;
          if (detailData && detailData.userId) {
            setAdminDetail(detailData);
          }
        }

        // Fetch Catalogs to display friendly names and region info
        const [provRes, catRes, regRes] = await Promise.allSettled([
          adminService.getGeographyProvinces({ pageSize: 100 }),
          adminService.getCatalogCategories({ pageSize: 100 }),
          adminService.getGeographyRegions(),
        ]);

        if (provRes.status === "fulfilled") {
          setAllProvinces(extractList<AdminGeographyProvinceItem>(provRes.value?.data || provRes.value));
        }
        if (catRes.status === "fulfilled") {
          setAllCategories(extractList<AdminCatalogCategoryItem>(catRes.value?.data || catRes.value));
        }
        if (regRes.status === "fulfilled") {
          setAllRegions(extractList<AdminGeographyRegionItem>(regRes.value?.data || regRes.value));
        }
      } catch (err) {
        console.warn("Failed to fetch admin scope details:", err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchAdminData();
  }, [user?.id]);

  // Map assigned category names
  const assignedCategories = useMemo(() => {
    if (isSystemAdmin) {
      return allCategories.map((c) => ({
        id: c.id,
        name: c.name,
        slug: c.slug,
      }));
    }

    const scopes = adminDetail?.categoryScopes || [];
    if (scopes.length === 0) return [];
    return scopes.map((s) => {
      const found = allCategories.find((c) => c.id === s.categoryId);
      return {
        id: s.categoryId,
        name: s.categoryName || found?.name || `Danh mục #${s.categoryId}`,
        slug: found?.slug,
      };
    });
  }, [adminDetail?.categoryScopes, allCategories, isSystemAdmin]);

  // Map assigned province names with region info
  const assignedProvinces = useMemo(() => {
    if (isSystemAdmin) {
      return allProvinces.map((p) => ({
        id: p.id,
        name: p.name,
        regionName: p.regionName || "",
      }));
    }

    const scopes = adminDetail?.provinceScopes || [];
    if (scopes.length === 0) return [];
    return scopes.map((s) => {
      const found = allProvinces.find((p) => p.id === s.provinceId);
      return {
        id: s.provinceId,
        name: s.provinceName || found?.name || `Tỉnh #${s.provinceId}`,
        regionName: found?.regionName || "",
      };
    });
  }, [adminDetail?.provinceScopes, allProvinces, isSystemAdmin]);

  // Map assigned region names
  const assignedRegions = useMemo(() => {
    if (isSystemAdmin) {
      return allRegions.map((r) => ({
        id: r.id,
        name: r.name,
      }));
    }

    const scopes = adminDetail?.regionScopes || [];
    if (scopes.length === 0) return [];
    return scopes.map((s) => {
      const found = allRegions.find((r) => r.id === s.regionId);
      return {
        id: s.regionId,
        name: s.regionName || found?.name || `Vùng #${s.regionId}`,
      };
    });
  }, [adminDetail?.regionScopes, allRegions, isSystemAdmin]);

  return (
    <div className="space-y-6 pb-12 font-sans max-w-5xl mx-auto">
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/90 shadow-xs space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-100">
          <div className="flex items-center gap-3.5">
            <div>
              <h2 className="text-lg sm:text-xl font-black text-slate-900 tracking-tight">
                Phạm vi điều hành
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                {isSystemAdmin
                  ? "Bạn sở hữu quyền điều hành tối cao trên toàn bộ các tỉnh thành và danh mục hệ thống"
                  : "Khu vực địa lý và danh mục do Admin tổng chỉ định cho bạn quản lý"}
              </p>
            </div>
          </div>
        </div>
        {/* Content Body */}
        {isLoading ? (
          <div className="py-16 flex flex-col items-center justify-center gap-2.5 text-slate-400 text-xs font-medium">
            <Loader2 className="w-6 h-6 animate-spin text-emerald-600" />
            <span>Đang tải thông tin phạm vi điều hành...</span>
          </div>
        ) : (
          <div className="space-y-8">
            {/* 1. Vùng miền & Tỉnh thành phụ trách */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-sm font-bold text-slate-800">
                  <MapPin className="w-4 h-4 text-emerald-600" />
                  <span>Vùng miền &amp; Tỉnh thành phụ trách</span>
                </div>
                <span className="text-xs font-semibold text-slate-400">
                  {assignedProvinces.length + assignedRegions.length} địa bàn
                </span>
              </div>

              {assignedProvinces.length === 0 && assignedRegions.length === 0 ? (
                <div className="p-6 rounded-2xl bg-slate-50 border border-slate-200/80 text-center">
                  <AlertCircle className="w-6 h-6 text-slate-400 mx-auto mb-2" />
                  <p className="text-xs font-bold text-slate-700">Chưa được phân công địa bàn cụ thể</p>
                  <p className="text-[11px] text-slate-400 mt-1">
                    Vui lòng liên hệ Admin Tổng để được chỉ định các khu vực và tỉnh thành quản lý.
                  </p>
                </div>
              ) : (
                <div className="flex flex-wrap gap-2.5">
                  {/* Region Scopes */}
                  {assignedRegions.map((reg) => (
                    <div
                      key={`reg-${reg.id}`}
                      className="inline-flex items-center gap-2 px-3.5 py-2 rounded-2xl bg-emerald-50/80 border border-emerald-200/90 text-emerald-950 text-xs font-bold shadow-2xs hover:bg-emerald-100/70 transition-colors"
                    >
                      <Compass className="w-3.5 h-3.5 text-emerald-700 shrink-0" />
                      <span>Khu vực: {reg.name}</span>
                    </div>
                  ))}

                  {/* Province Scopes */}
                  {assignedProvinces.map((prov) => (
                    <div
                      key={`prov-${prov.id}`}
                      className="inline-flex items-center gap-2 px-3.5 py-2 rounded-2xl bg-white border border-slate-200/90 text-slate-800 text-xs font-semibold shadow-2xs hover:border-emerald-300 hover:bg-slate-50/60 transition-all"
                    >
                      <MapPin className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                      <span className="font-bold text-slate-900">{prov.name}</span>
                      {prov.regionName && (
                        <span className="text-[11px] text-slate-400 font-normal">
                          ({prov.regionName})
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* 2. Danh mục trải nghiệm phụ trách */}
            <div className="space-y-4 pt-6 border-t border-slate-100">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-sm font-bold text-slate-800">
                  <Layers className="w-4 h-4 text-purple-600" />
                  <span>Danh mục trải nghiệm phụ trách</span>
                </div>
                <span className="text-xs font-semibold text-slate-400">
                  {assignedCategories.length} danh mục
                </span>
              </div>

              {assignedCategories.length === 0 ? (
                <div className="p-6 rounded-2xl bg-slate-50 border border-slate-200/80 text-center">
                  <AlertCircle className="w-6 h-6 text-slate-400 mx-auto mb-2" />
                  <p className="text-xs font-bold text-slate-700">Chưa được phân công danh mục cụ thể</p>
                  <p className="text-[11px] text-slate-400 mt-1">
                    Vui lòng liên hệ Admin Tổng để được phân quyền danh mục chuyên trách.
                  </p>
                </div>
              ) : (
                <div className="flex flex-wrap gap-2.5">
                  {assignedCategories.map((cat) => (
                    <div
                      key={`cat-${cat.id}`}
                      className="inline-flex items-center gap-2 px-3.5 py-2 rounded-2xl bg-purple-50/70 border border-purple-200/80 text-purple-950 text-xs font-bold shadow-2xs hover:bg-purple-100/70 transition-colors"
                    >
                      <Layers className="w-3.5 h-3.5 text-purple-700 shrink-0" />
                      <span>{cat.name}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminProfileTab;

