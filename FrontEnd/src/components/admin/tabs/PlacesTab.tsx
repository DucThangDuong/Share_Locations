import React from "react";
import { Search, Plus, Star } from "lucide-react";
import { PlaceDetailEditor } from "./PlaceDetailEditor";

interface PlacesTabProps {
  placesList: any[];
  selectedPlaceId: number | null;
  setSelectedPlaceId: (id: number | null) => void;
  placeSearchText: string;
  setPlaceSearchText: (v: string) => void;
  placeFilterProvince: string;
  setPlaceFilterProvince: (v: string) => void;
  placeFilterStatus: string;
  setPlaceFilterStatus: (v: string) => void;
  setIsAddPlaceModalOpen: (v: boolean) => void;
  handleApprovePlace?: (id: number) => void;
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
  placeFilterStatus,
  setPlaceFilterStatus,
  setIsAddPlaceModalOpen,
  handleApprovePlace,
  handleTogglePlaceStatus,
  handleUpdatePlace,
}) => {
  const currentPlace = selectedPlaceId ? placesList.find((p) => p.id === selectedPlaceId) : null;

  const filteredPlaces = placesList.filter((p) => {
    if (placeFilterProvince !== "all" && p.province !== placeFilterProvince) return false;
    if (placeFilterStatus !== "all") {
      if (placeFilterStatus === "active" && p.status !== "Đã duyệt" && p.statusNum !== 1) return false;
      if (placeFilterStatus === "hidden" && p.status !== "Đang ẩn" && p.statusNum !== 3) return false;
    }
    if (placeSearchText.trim()) {
      const q = placeSearchText.toLowerCase();
      const matchName = (p.name || "").toLowerCase().includes(q);
      const matchLoc = (p.location || p.address || "").toLowerCase().includes(q);
      if (!matchName && !matchLoc) return false;
    }
    return true;
  });

  if (selectedPlaceId && currentPlace) {
    return (
      <PlaceDetailEditor
        place={currentPlace}
        onBack={() => setSelectedPlaceId(null)}
        onSave={(updatedPlace) => {
          if (handleUpdatePlace) {
            handleUpdatePlace(updatedPlace);
          }
        }}
        onApprove={handleApprovePlace}
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
            <select
              value={placeFilterProvince}
              onChange={(e) => setPlaceFilterProvince(e.target.value)}
              className="px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 font-medium text-slate-800 outline-none focus:border-emerald-500"
            >
              <option value="all">Tất cả tỉnh thành</option>
              <option value="Đà Nẵng">Đà Nẵng</option>
              <option value="Quảng Nam">Quảng Nam</option>
              <option value="Thừa Thiên Huế">Thừa Thiên Huế</option>
              <option value="Khánh Hòa">Khánh Hòa</option>
              <option value="Lâm Đồng">Lâm Đồng</option>
            </select>

            <select
              value={placeFilterStatus}
              onChange={(e) => setPlaceFilterStatus(e.target.value)}
              className="px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 font-medium text-slate-800 outline-none focus:border-emerald-500"
            >
              <option value="all">Tất cả trạng thái</option>
              <option value="pending">Chờ duyệt</option>
              <option value="active">Đã duyệt (Hoạt động)</option>
              <option value="hidden">Đang ẩn</option>
            </select>

            <button
              onClick={() => setIsAddPlaceModalOpen(true)}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold cursor-pointer transition-all shadow-sm shadow-emerald-600/20"
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
              {filteredPlaces.map((p) => (
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
                      className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold ${p.statusNum === 0
                          ? "bg-amber-100 text-amber-800"
                          : p.statusNum === 3
                            ? "bg-slate-100 text-slate-600"
                            : "bg-emerald-100 text-emerald-800"
                        }`}
                    >
                      {p.status || (p.statusNum === 0 ? "Chờ duyệt" : "Đã duyệt")}
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
                      onClick={() => setSelectedPlaceId(p.id)}
                      className="px-2.5 py-1 text-xs font-semibold text-emerald-700 hover:bg-emerald-50 rounded-lg transition-colors cursor-pointer"
                    >
                      Chi tiết →
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default PlacesTab;
