import React, { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
  MapPin,
  Layers,
  Loader2,
  AlertCircle,
  Compass,
  Utensils,
  Bed,
  Camera,
  ArrowUpRight,
  Sparkles,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { adminService, extractList } from "@/services/adminService";
import { isUserSystemAdmin } from "@/utils/authUtils";
import type {
  AdminAssignmentInfo,
  AdminUserDetail,
  AdminCatalogCategoryItem,
  AdminCatalogPlaceTypeItem,
  AdminGeographyProvinceItem,
  AdminGeographyRegionItem,
} from "@/types/admin.types";

interface AdminProfileTabProps {
  currentAdminInfo?: AdminAssignmentInfo;
  onNavigateTab?: (tab: string) => void;
  showToast?: (msg: string) => void;
}

export const cleanProvinceName = (rawName: string): string => {
  if (!rawName) return "";
  const name = rawName.trim();
  if (/^TP\.?\s*Hồ Chí Minh$/i.test(name) || /^Thành phố Hồ Chí Minh$/i.test(name)) {
    return "TP. Hồ Chí Minh";
  }
  return name.replace(/^(Tỉnh|Thành phố|TP\.?)\s+/i, "").trim();
};

export interface AssignedCategory {
  id: number;
  name: string;
  slug?: string;
  placeCount?: number;
  placeTypeId?: number;
  placeTypeName?: string;
}

export const AdminProfileTab: React.FC<AdminProfileTabProps> = ({
  onNavigateTab,
  showToast,
}) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const isSystemAdmin =
    isUserSystemAdmin() ||
    (typeof user?.role === "string" && (user.role.toUpperCase().includes("ADMIN") || user.role === "3")) ||
    (typeof window !== "undefined" && window.location.search.includes("dev=admin"));

  const [adminDetail, setAdminDetail] = useState<AdminUserDetail | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const [allProvinces, setAllProvinces] = useState<AdminGeographyProvinceItem[]>([]);
  const [allCategories, setAllCategories] = useState<AdminCatalogCategoryItem[]>([]);
  const [allRegions, setAllRegions] = useState<AdminGeographyRegionItem[]>([]);
  const [allPlaceTypes, setAllPlaceTypes] = useState<AdminCatalogPlaceTypeItem[]>([]);

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

        const [provRes, catRes, regRes, typeRes] = await Promise.allSettled([
          adminService.getGeographyProvinces({ pageSize: 100 }),
          adminService.getCatalogCategories({ pageSize: 100 }),
          adminService.getGeographyRegions(),
          adminService.getCatalogPlaceTypes(),
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
        if (typeRes.status === "fulfilled") {
          setAllPlaceTypes(extractList<AdminCatalogPlaceTypeItem>(typeRes.value?.data || typeRes.value));
        }
      } catch (err) {
        console.warn("Failed to fetch admin scope details:", err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchAdminData();
  }, [user?.id]);

  const assignedCategories = useMemo(() => {
    if (isSystemAdmin) {
      return allCategories.map((c) => ({
        id: c.id,
        name: c.name,
        slug: c.slug,
        placeCount: c.placeCount ?? 0,
        placeTypeId: c.placeTypeId,
        placeTypeName: c.placeTypeName,
      }));
    }

    const scopes = adminDetail?.categoryScopes || [];
    return scopes.map((s) => {
      const found = allCategories.find((c) => c.id === s.categoryId);
      return {
        id: s.categoryId,
        name: s.categoryName || found?.name || `Danh mục #${s.categoryId}`,
        slug: found?.slug,
        placeCount: found?.placeCount ?? 0,
        placeTypeId: found?.placeTypeId,
        placeTypeName: found?.placeTypeName,
      };
    });
  }, [adminDetail?.categoryScopes, allCategories, isSystemAdmin]);

  const assignedProvinces = useMemo(() => {
    if (isSystemAdmin) {
      return allProvinces.map((p) => ({
        id: p.id,
        regionId: p.regionId,
        regionName: p.regionName || "",
        name: p.name,
        cleanName: cleanProvinceName(p.name),
        placeCount: p.placeCount ?? 0,
      }));
    }

    const scopes = adminDetail?.provinceScopes || [];
    return scopes.map((s) => {
      const found = allProvinces.find((p) => p.id === s.provinceId);
      const name = s.provinceName || found?.name || `Tỉnh #${s.provinceId}`;
      return {
        id: s.provinceId,
        regionId: found?.regionId || 0,
        regionName: found?.regionName || "",
        name,
        cleanName: cleanProvinceName(name),
        placeCount: found?.placeCount ?? 0,
      };
    });
  }, [adminDetail?.provinceScopes, allProvinces, isSystemAdmin]);

  const provinceColumns = useMemo(() => {
    const badgeStyles = [
      "bg-blue-100 text-blue-800",
      "bg-amber-100 text-amber-800",
      "bg-emerald-100 text-emerald-800",
      "bg-purple-100 text-purple-800",
    ];

    if (allRegions.length > 0) {
      const cols = allRegions.map((region, idx) => ({
        id: `region-${region.id}`,
        name: region.name,
        badgeBg: badgeStyles[idx % badgeStyles.length],
        provinces: assignedProvinces.filter(
          (p) => p.regionId === region.id || (p.regionName && p.regionName.toLowerCase() === region.name.toLowerCase())
        ),
      }));

      const matchedIds = new Set(cols.flatMap((c) => c.provinces.map((p) => p.id)));
      const remaining = assignedProvinces.filter((p) => !matchedIds.has(p.id));
      if (remaining.length > 0) {
        cols.push({
          id: "region-other",
          name: "Khu vực khác",
          badgeBg: "bg-slate-100 text-slate-700",
          provinces: remaining,
        });
      }
      return cols;
    }

    const groupMap = new Map<string, typeof assignedProvinces>();
    assignedProvinces.forEach((prov) => {
      const reg = prov.regionName || "Khu vực khác";
      if (!groupMap.has(reg)) groupMap.set(reg, []);
      groupMap.get(reg)!.push(prov);
    });

    return Array.from(groupMap.entries()).map(([name, provinces], idx) => ({
      id: `region-${idx}`,
      name,
      badgeBg: badgeStyles[idx % badgeStyles.length],
      provinces,
    }));
  }, [allRegions, assignedProvinces]);

  const categoryGroups = useMemo(() => {
    if (allPlaceTypes.length > 0) {
      const groups = allPlaceTypes.map((pt) => {
        const title = pt.name;
        const lower = title.toLowerCase();
        let icon = Camera;
        let iconColor = "text-emerald-600 bg-emerald-50 border-emerald-200";
        let chipHover = "hover:border-emerald-400 hover:bg-emerald-50/80 hover:text-emerald-950";

        if (lower.includes("ăn") || lower.includes("ẩm thực") || lower.includes("uống")) {
          icon = Utensils;
          iconColor = "text-amber-600 bg-amber-50 border-amber-200";
          chipHover = "hover:border-amber-400 hover:bg-amber-50/80 hover:text-amber-950";
        } else if (lower.includes("lưu trú") || lower.includes("khách sạn") || lower.includes("nghỉ")) {
          icon = Bed;
          iconColor = "text-blue-600 bg-blue-50 border-blue-200";
          chipHover = "hover:border-blue-400 hover:bg-blue-50/80 hover:text-blue-950";
        }

        return {
          id: `type-${pt.id}`,
          title: pt.name,
          subtitle: `Các danh mục dịch vụ thuộc ${pt.name}`,
          icon,
          iconColor,
          chipHover,
          categories: assignedCategories.filter(
            (c) => c.placeTypeId === pt.id || (c.placeTypeName && c.placeTypeName.toLowerCase() === pt.name.toLowerCase())
          ),
        };
      });

      const matchedIds = new Set(groups.flatMap((g) => g.categories.map((c) => c.id)));
      const remaining = assignedCategories.filter((c) => !matchedIds.has(c.id));
      if (remaining.length > 0) {
        groups.push({
          id: "type-other",
          title: "Danh mục khác",
          subtitle: "Các dịch vụ & điểm đến khác",
          icon: Layers,
          iconColor: "text-purple-600 bg-purple-50 border-purple-200",
          chipHover: "hover:border-purple-400 hover:bg-purple-50/80 hover:text-purple-950",
          categories: remaining,
        });
      }
      return groups.filter((g) => g.categories.length > 0);
    }
    const map = new Map<string, typeof assignedCategories>();
    assignedCategories.forEach((cat) => {
      const typeName = cat.placeTypeName || "Danh mục chung";
      if (!map.has(typeName)) map.set(typeName, []);
      map.get(typeName)!.push(cat);
    });

    return Array.from(map.entries()).map(([title, categories]) => ({
      id: `type-${title}`,
      title,
      subtitle: `Các dịch vụ thuộc ${title}`,
      icon: Layers,
      iconColor: "text-purple-600 bg-purple-50 border-purple-200",
      chipHover: "hover:border-purple-400 hover:bg-purple-50/80 hover:text-purple-950",
      categories,
    }));
  }, [allPlaceTypes, assignedCategories]);

  const handleSelectProvince = (provinceName: string) => {
    const clean = cleanProvinceName(provinceName);
    navigate(`/admin/places?province=${encodeURIComponent(clean)}`);
    onNavigateTab?.("places");
    showToast?.(`Đã lọc danh sách địa điểm theo tỉnh/thành: ${clean}`);
  };

  const handleSelectCategory = (categoryName: string) => {
    navigate(`/admin/places?category=${encodeURIComponent(categoryName)}`);
    onNavigateTab?.("places");
    showToast?.(`Đã lọc danh sách địa điểm theo danh mục: ${categoryName}`);
  };


  return (
    <div className="space-y-6 pb-12 font-sans max-w-6xl mx-auto animate-in fade-in duration-150">
      <div className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200/90 shadow-2xs space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 border-b border-slate-100">
          <div>
            <h3 className="text-base font-bold text-slate-900 tracking-tight flex items-center gap-2">
              <Compass className="text-emerald-600" size={19} />
              <span>Tỉnh thành quản lý</span>
            </h3>
          </div>
          <span className="text-xs font-bold px-3 py-1 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
            {assignedProvinces.length} địa phương được kích hoạt
          </span>
        </div>

        {isLoading ? (
          <div className="py-12 flex flex-col items-center justify-center gap-2.5 text-slate-400 text-xs font-medium">
            <Loader2 className="w-6 h-6 animate-spin text-emerald-600" />
            <span>Đang tải thông tin địa phương...</span>
          </div>
        ) : assignedProvinces.length === 0 ? (
          <div className="p-8 rounded-2xl bg-slate-50 border border-slate-200/80 text-center">
            <AlertCircle className="w-7 h-7 text-slate-400 mx-auto mb-2" />
            <p className="text-xs font-bold text-slate-700">Chưa được phân công địa bàn quản lý</p>
            <p className="text-[11px] text-slate-400 mt-1">
              Vui lòng liên hệ Admin Tổng để được chỉ định các khu vực phụ trách.
            </p>
          </div>
        ) : (
          /* Lưới 3 Cột theo 3 Miền chuẩn hóa */
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5 items-start">
            {provinceColumns.map((col) => (
              <div
                key={col.id}
                className="p-4 rounded-2xl bg-slate-50/60 border border-slate-200/80 space-y-3.5"
              >
                <div className="flex items-center justify-between pb-2.5 border-b border-slate-200/60">
                  <div className="flex items-center gap-2">
                    <MapPin size={15} className="text-slate-600" />
                    <span className="font-bold text-xs text-slate-900">{col.name}</span>
                  </div>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${col.badgeBg}`}>
                    {col.provinces.length} tỉnh/thành
                  </span>
                </div>

                {col.provinces.length === 0 ? (
                  <p className="text-[11px] text-slate-400 italic py-2">
                    Không có địa phương được phân công
                  </p>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {col.provinces.map((prov) => (
                      <button
                        key={`prov-${prov.id}`}
                        type="button"
                        onClick={() => handleSelectProvince(prov.name)}
                        title={`Bấm để xem danh sách địa điểm tại ${prov.cleanName}`}
                        className="inline-flex items-center justify-between gap-1.5 px-3 py-1.5 rounded-xl bg-white border border-slate-200/90 text-slate-800 text-xs font-semibold shadow-2xs hover:border-emerald-500 hover:bg-emerald-50/70 hover:text-emerald-950 transition-all cursor-pointer group text-left"
                      >
                        <span className="truncate max-w-[130px] font-medium">{prov.cleanName}</span>
                        <span className="text-[10px] font-bold px-1.5 py-0.2 rounded-md bg-slate-100 group-hover:bg-emerald-100 text-slate-600 group-hover:text-emerald-800 transition-colors shrink-0">
                          {prov.placeCount ?? 0}
                        </span>
                        <ArrowUpRight size={11} className="text-slate-300 group-hover:text-emerald-600 opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200/90 shadow-2xs space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 border-b border-slate-100">
          <div>
            <h3 className="text-base font-bold text-slate-900 tracking-tight flex items-center gap-2">
              <Layers className="text-purple-600" size={19} />
              <span>Danh mục dịch vụ</span>
            </h3>
          </div>
          <span className="text-xs font-bold px-3 py-1 rounded-full bg-purple-50 text-purple-700 border border-purple-200">
            {assignedCategories.length} danh mục quản lý
          </span>
        </div>

        {isLoading ? (
          <div className="py-12 flex flex-col items-center justify-center gap-2.5 text-slate-400 text-xs font-medium">
            <Loader2 className="w-6 h-6 animate-spin text-purple-600" />
            <span>Đang tải thông tin danh mục...</span>
          </div>
        ) : assignedCategories.length === 0 ? (
          <div className="p-8 rounded-2xl bg-slate-50 border border-slate-200/80 text-center">
            <AlertCircle className="w-7 h-7 text-slate-400 mx-auto mb-2" />
            <p className="text-xs font-bold text-slate-700">Chưa được phân công danh mục cụ thể</p>
            <p className="text-[11px] text-slate-400 mt-1">
              Vui lòng liên hệ Admin Tổng để được phân quyền danh mục chuyên trách.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5 items-start">
            {categoryGroups.map((group) => {
              const GroupIcon = group.icon;
              return (
                <div
                  key={group.id}
                  className="p-4 rounded-2xl bg-slate-50/60 border border-slate-200/80 space-y-3.5"
                >
                  <div className="flex items-center justify-between pb-2.5 border-b border-slate-200/60">
                    <div className="flex items-center gap-2">
                      <div className={`p-1.5 rounded-lg border ${group.iconColor}`}>
                        <GroupIcon size={14} />
                      </div>
                      <div>
                        <h4 className="font-bold text-xs text-slate-900">{group.title}</h4>
                      </div>
                    </div>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-200/80 text-slate-700">
                      {group.categories.length}
                    </span>
                  </div>

                  <p className="text-[11px] text-slate-400 leading-tight">
                    {group.subtitle}
                  </p>

                  <div className="space-y-2 pt-1">
                    {group.categories.map((cat) => (
                      <button
                        key={`cat-${cat.id}`}
                        type="button"
                        onClick={() => handleSelectCategory(cat.name)}
                        title={`Bấm để xem danh sách địa điểm thuộc ${cat.name}`}
                        className={`w-full flex items-center justify-between gap-2 px-3 py-2 rounded-xl bg-white border border-slate-200/80 text-slate-800 text-xs font-semibold shadow-2xs ${group.chipHover} transition-all cursor-pointer group text-left`}
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <Sparkles size={12} className="text-slate-300 group-hover:text-purple-600 transition-colors shrink-0" />
                          <span className="truncate">{cat.name}</span>
                        </div>
                        <div className="flex items-center gap-1.5 shrink-0">
                          <span className="text-[10px] font-bold px-1.5 py-0.2 rounded-md bg-slate-100 text-slate-600 group-hover:bg-purple-100 group-hover:text-purple-800 transition-colors">
                            {cat.placeCount ?? 0}
                          </span>
                          <ArrowUpRight size={12} className="text-slate-300 group-hover:text-slate-700 transition-colors" />
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminProfileTab;
