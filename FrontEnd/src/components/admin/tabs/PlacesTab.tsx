import React, { useMemo, useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Search, Plus, Star } from "lucide-react";
import { PlaceDetailEditor } from "./PlaceDetailEditor";
import { geographyService } from "@/services/geographyService";
import { catalogService } from "@/services/catalogService";
import type { ProvinceDto } from "@/types/models/geography.model";
import type { PlaceTypeDto } from "@/types/models/place.model";

const DEFAULT_PROVINCES: ProvinceDto[] = [
  { id: 1, name: "Đà Nẵng", regionId: 2, regionName: "Miền Trung", featured: true, displayOrder: 1, placeCount: 150 },
  { id: 2, name: "Quảng Nam", regionId: 2, regionName: "Miền Trung", featured: false, displayOrder: 2, placeCount: 95 },
  { id: 3, name: "Thừa Thiên Huế", regionId: 2, regionName: "Miền Trung", featured: false, displayOrder: 3, placeCount: 80 },
  { id: 4, name: "Khánh Hòa", regionId: 3, regionName: "Nam Trung Bộ", featured: true, displayOrder: 4, placeCount: 110 },
  { id: 5, name: "Lâm Đồng", regionId: 3, regionName: "Tây Nguyên", featured: true, displayOrder: 5, placeCount: 130 },
  { id: 6, name: "Hà Nội", regionId: 1, regionName: "Miền Bắc", featured: true, displayOrder: 6, placeCount: 220 },
  { id: 7, name: "TP. Hồ Chí Minh", regionId: 4, regionName: "Miền Nam", featured: true, displayOrder: 7, placeCount: 260 },
];

const DEFAULT_CATEGORIES: PlaceTypeDto[] = [
  { id: 1, name: "Nhà hàng & Quán ăn" },
  { id: 2, name: "Cà phê & Trà sữa" },
  { id: 3, name: "Địa điểm tham quan" },
  { id: 4, name: "Khách sạn & Homestay" },
  { id: 5, name: "Giải trí & Trải nghiệm" },
  { id: 6, name: "Mua sắm & Đặc sản" },
];

interface PlacesTabProps {
  placesList: any[];
  selectedPlaceId: number | null;
  setSelectedPlaceId: (id: number | null) => void;
  placeSearchText: string;
  setPlaceSearchText: (v: string) => void;
  placeFilterProvince: string;
  setPlaceFilterProvince: (v: string) => void;
  placeFilterCategory?: string;
  setPlaceFilterCategory?: (v: string) => void;
  placeFilterStatus: string;
  setPlaceFilterStatus: (v: string) => void;
  setIsAddPlaceModalOpen: (v: boolean) => void;
  handleTogglePlaceStatus?: (id: number) => void;
  handleUpdatePlace?: (updatedPlace: any) => void;
}

export const PlacesTab: React.FC<PlacesTabProps> = ({
  placesList,
  selectedPlaceId,
  setSelectedPlaceId,
  placeSearchText,
  setPlaceSearchText,
  placeFilterProvince,
  setPlaceFilterProvince,
  placeFilterCategory: propFilterCategory,
  setPlaceFilterCategory: propSetFilterCategory,
  placeFilterStatus,
  setPlaceFilterStatus,
  setIsAddPlaceModalOpen,
  handleTogglePlaceStatus,
  handleUpdatePlace,
}) => {
  const navigate = useNavigate();
  const location = useLocation();

  const [localCategoryFilter, setLocalCategoryFilter] = useState("all");
  const categoryFilter = propFilterCategory ?? localCategoryFilter;
  const setCategoryFilter = propSetFilterCategory ?? setLocalCategoryFilter;

  const [provinces, setProvinces] = useState<ProvinceDto[]>(DEFAULT_PROVINCES);
  const [categories, setCategories] = useState<PlaceTypeDto[]>(DEFAULT_CATEGORIES);

  useEffect(() => {
    let mounted = true;
    const loadMetadata = async () => {
      try {
        const [provRes, catRes] = await Promise.all([
          geographyService.getProvinces(),
          catalogService.getPlaceTypes(),
        ]);
        if (mounted) {
          if (provRes?.success && Array.isArray(provRes.data) && provRes.data.length > 0) {
            setProvinces(provRes.data);
          }
          if (catRes?.success && Array.isArray(catRes.data) && catRes.data.length > 0) {
            setCategories(catRes.data);
          }
        }
      } catch {
        // Fallback already assigned
      }
    };
    loadMetadata();
    return () => {
      mounted = false;
    };
  }, []);

  // Merge loaded provinces with any provinces present in placesList
  const allProvinces = useMemo(() => {
    const list: { id: string | number; name: string }[] = [...provinces];
    placesList.forEach((p) => {
      const pName = p.provinceName || p.province;
      if (pName && !list.some((pr) => pr.name.toLowerCase() === pName.toLowerCase())) {
        list.push({ id: p.provinceId || pName, name: pName });
      }
    });
    return list;
  }, [provinces, placesList]);

  // Merge loaded categories with any categories present in placesList
  const allCategories = useMemo(() => {
    const list: { id: string | number; name: string }[] = [...categories];
    placesList.forEach((p) => {
      const cName = p.categoryName || p.category;
      if (cName && !list.some((c) => c.name.toLowerCase() === cName.toLowerCase())) {
        list.push({ id: p.categoryId || cName, name: cName });
      }
    });
    return list;
  }, [categories, placesList]);

  const placePathMatch = location.pathname.match(/\/admin\/places\/(\d+)/i);
  const urlPlaceId = placePathMatch ? Number(placePathMatch[1]) : selectedPlaceId;

  const currentPlace = useMemo(() => {
    if (!urlPlaceId) return null;
    return placesList.find((p) => Number(p.id) === urlPlaceId) || null;
  }, [urlPlaceId, placesList]);

  const filteredPlaces = placesList.filter((p) => {
    if (placeFilterProvince !== "all") {
      const pProv = (p.provinceName || p.province || "").toLowerCase();
      const targetProv = placeFilterProvince.toLowerCase();
      const pProvId = String(p.provinceId || "");
      if (pProv !== targetProv && pProvId !== placeFilterProvince) return false;
    }
    if (categoryFilter !== "all") {
      const pCat = (p.categoryName || p.category || "").toLowerCase();
      const targetCat = categoryFilter.toLowerCase();
      const pCatId = String(p.categoryId || "");
      if (pCat !== targetCat && pCatId !== categoryFilter) return false;
    }
    if (placeFilterStatus !== "all") {
      const isPlaceActive =
        Number(p.statusNum ?? p.status) === 1 ||
        String(p.status || "").toLowerCase() === "active" ||
        p.status === "Công khai" ||
        p.status === "Đang hiển thị" ||
        p.status === "Đã duyệt";
      if (placeFilterStatus === "active" && !isPlaceActive) return false;
      if (placeFilterStatus === "hidden" && isPlaceActive) return false;
    }
    if (placeSearchText.trim()) {
      const q = placeSearchText.toLowerCase();
      const matchName = (p.name || "").toLowerCase().includes(q);
      const matchLoc = (p.location || p.address || "").toLowerCase().includes(q);
      if (!matchName && !matchLoc) return false;
    }
    return true;
  });

  if (currentPlace) {
    return (
      <PlaceDetailEditor
        place={currentPlace}
        onBack={() => {
          setSelectedPlaceId(null);
          navigate('/admin/places');
        }}
        onSave={(updatedPlace) => {
          if (handleUpdatePlace) {
            handleUpdatePlace(updatedPlace);
          }
        }}
        onToggleStatus={handleTogglePlaceStatus}
      />
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-150 text-xs">
      <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-2xs space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="relative flex-1 min-w-[240px]">
            <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Tìm kiếm theo tên địa điểm, địa chỉ..."
              value={placeSearchText}
              onChange={(e) => setPlaceSearchText(e.target.value)}
              className="w-full pl-9 pr-4 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-medium text-slate-800 placeholder:text-slate-400 focus:bg-white outline-none focus:border-emerald-500"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Bộ lọc Tỉnh thành */}
            <select
              value={placeFilterProvince}
              onChange={(e) => setPlaceFilterProvince(e.target.value)}
              className="px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 font-medium text-slate-800 outline-none focus:border-emerald-500 text-xs cursor-pointer"
            >
              <option value="all">Tất cả tỉnh thành</option>
              {allProvinces.map((prov) => (
                <option key={prov.id || prov.name} value={prov.name}>
                  {prov.name}
                </option>
              ))}
            </select>

            {/* Bộ lọc Danh mục */}
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 font-medium text-slate-800 outline-none focus:border-emerald-500 text-xs cursor-pointer"
            >
              <option value="all">Tất cả danh mục</option>
              {allCategories.map((cat) => (
                <option key={cat.id || cat.name} value={cat.name}>
                  {cat.name}
                </option>
              ))}
            </select>

            {/* Bộ lọc Trạng thái */}
            <select
              value={placeFilterStatus}
              onChange={(e) => setPlaceFilterStatus(e.target.value)}
              className="px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 font-medium text-slate-800 outline-none focus:border-emerald-500 text-xs cursor-pointer"
            >
              <option value="all">Tất cả trạng thái</option>
              <option value="active">Công khai</option>
              <option value="hidden">Đang ẩn</option>
            </select>

            <button
              onClick={() => setIsAddPlaceModalOpen(true)}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold cursor-pointer transition-all shadow-sm shadow-emerald-600/20 text-xs"
            >
              <Plus size={14} />
              <span>Thêm địa điểm</span>
            </button>
          </div>
        </div>

        {/* Places Table */}
        <div className="overflow-x-auto rounded-xl border border-slate-200/80">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-500 font-bold text-[11px] uppercase tracking-wider">
                <th className="p-3.5 pl-4">Địa điểm</th>
                <th className="p-3.5">Danh mục</th>
                <th className="p-3.5">Tỉnh / Thành</th>
                <th className="p-3.5">Trạng thái</th>
                <th className="p-3.5">Đánh giá</th>
                <th className="p-3.5 text-right pr-4">Hành động</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredPlaces.map((p) => {
                const isPlaceActive =
                  Number(p.statusNum ?? p.status) === 1 ||
                  String(p.status || "").toLowerCase() === "active" ||
                  p.status === "Công khai" ||
                  p.status === "Đang hiển thị" ||
                  p.status === "Đã duyệt";

                return (
                  <tr key={p.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="p-3.5 pl-4 font-bold text-slate-900">
                      <div className="flex items-center gap-3">
                        <img
                          src={p.img || p.thumbnailUrl || "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=600&h=400&fit=crop"}
                          className="w-10 h-10 rounded-lg object-cover border border-slate-200 shrink-0"
                          alt=""
                        />
                        <div>
                          <div className="font-bold text-slate-900">{p.name}</div>
                          <div className="text-[11px] text-slate-400 font-normal truncate max-w-xs">
                            {p.location || p.address}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="p-3.5 text-slate-700 font-medium">
                      {p.category || p.categoryName || "Nhà hàng & Quán ăn"}
                    </td>
                    <td className="p-3.5 text-slate-700 font-medium">{p.province}</td>
                    <td className="p-3.5">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold ${isPlaceActive
                          ? "bg-emerald-100 text-emerald-800"
                          : "bg-slate-100 text-slate-600"
                          }`}
                      >
                        {isPlaceActive ? "Công khai" : "Đang ẩn"}
                      </span>
                    </td>
                    <td className="p-3.5">
                      <div className="flex items-center gap-1 font-bold text-amber-900">
                        <Star size={13} className="fill-amber-400 text-amber-400" />
                        <span>{p.rating || 4.8}</span>
                      </div>
                    </td>
                    <td className="p-3.5 text-right pr-4">
                      <button
                        onClick={() => {
                          setSelectedPlaceId(p.id);
                          navigate(`/admin/places/${p.id}`);
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
        </div>
      </div>
    </div>
  );
};

export default PlacesTab;
