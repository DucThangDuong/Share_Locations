import React, { useState, useEffect, useRef } from "react";
import {
  MapPin,
  Clock,
  DollarSign,
  CheckCircle2,
  Trash2,
  AlertCircle,
  Navigation,
  Check,
  ShieldCheck,
  Eye,
  FileText,
  Image as ImageIcon,
  UploadCloud,
  Star,
  ChevronLeft,
  ChevronRight,
  ArrowLeft,
  Save,
  Globe,
  Phone,
  Link as LinkIcon,
  X,
  User,
  MessageSquareQuote,
} from "lucide-react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import { catalogService } from "@/services/catalogService";
import { geographyService } from "@/services/geographyService";
import type { PlaceTypeDto } from "@/types/models/place.model";
import type { ProvinceDto } from "@/types/models/geography.model";
import type { AdminProposalItem } from "@/types/admin.types";

interface ProposalDetailEditorProps {
  proposal: AdminProposalItem;
  onBack: () => void;
  onSave: (updatedProposal: AdminProposalItem) => void;
  onApprove: (proposal: AdminProposalItem) => void;
  onReject: (proposal: AdminProposalItem) => void;
}

const DEFAULT_CATEGORIES: PlaceTypeDto[] = [
  { id: 1, name: "Nhà hàng & Quán ăn" },
  { id: 2, name: "Cà phê & Trà sữa" },
  { id: 3, name: "Địa điểm tham quan" },
  { id: 4, name: "Khách sạn & Homestay" },
  { id: 5, name: "Giải trí & Trải nghiệm" },
  { id: 6, name: "Mua sắm & Đặc sản" },
];

const DEFAULT_PROVINCES: ProvinceDto[] = [
  { id: 1, name: "Đà Nẵng", regionId: 2, regionName: "Miền Trung", featured: true, displayOrder: 1, placeCount: 150 },
  { id: 2, name: "Quảng Nam", regionId: 2, regionName: "Miền Trung", featured: false, displayOrder: 2, placeCount: 95 },
  { id: 3, name: "Thừa Thiên Huế", regionId: 2, regionName: "Miền Trung", featured: false, displayOrder: 3, placeCount: 80 },
  { id: 4, name: "Khánh Hòa", regionId: 3, regionName: "Nam Trung Bộ", featured: true, displayOrder: 4, placeCount: 110 },
  { id: 5, name: "Lâm Đồng", regionId: 3, regionName: "Tây Nguyên", featured: true, displayOrder: 5, placeCount: 130 },
  { id: 6, name: "Hà Nội", regionId: 1, regionName: "Miền Bắc", featured: true, displayOrder: 6, placeCount: 220 },
  { id: 7, name: "TP. Hồ Chí Minh", regionId: 4, regionName: "Miền Nam", featured: true, displayOrder: 7, placeCount: 260 },
];

export const ProposalDetailEditor: React.FC<ProposalDetailEditorProps> = ({
  proposal,
  onBack,
  onSave,
  onApprove,
  onReject,
}) => {
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccessMsg, setSaveSuccessMsg] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  const [categories, setCategories] = useState<PlaceTypeDto[]>(DEFAULT_CATEGORIES);
  const [provinces, setProvinces] = useState<ProvinceDto[]>(DEFAULT_PROVINCES);

  // Form Fields
  const [placeName, setPlaceName] = useState(
    proposal.proposedData.name || proposal.placeName || ""
  );

  const [categoryId, setCategoryId] = useState<number>(() => {
    const targetCat = proposal.proposedData.category || proposal.category;
    const found = DEFAULT_CATEGORIES.find((c) => c.name === targetCat);
    return found ? found.id : 1;
  });

  const [provinceId, setProvinceId] = useState<number>(() => {
    const found = DEFAULT_PROVINCES.find((p) => p.name === proposal.province);
    return found ? found.id : 1;
  });

  const [provinceName, setProvinceName] = useState(proposal.province || "Đà Nẵng");
  const [address, setAddress] = useState(proposal.proposedData.address || "");
  const [phone, setPhone] = useState(proposal.proposedData.phone || "");
  const [website, setWebsite] = useState("https://langthang.vn");

  // Coordinates
  const [lat, setLat] = useState("16.054407");
  const [lng, setLng] = useState("108.202167");
  const [isLocating, setIsLocating] = useState(false);

  // Operating Hours
  const [is24Hours, setIs24Hours] = useState(() => {
    const h = (proposal.proposedData.hours || "").toLowerCase();
    return h.includes("24/7") || h.includes("24h") || h.includes("cả ngày");
  });
  const [openTime, setOpenTime] = useState(() => {
    const h = proposal.proposedData.hours || "";
    const match = h.match(/(\d{1,2}:\d{2})/);
    return match ? match[1] : "07:30";
  });
  const [closeTime, setCloseTime] = useState(() => {
    const h = proposal.proposedData.hours || "";
    const matches = h.match(/(\d{1,2}:\d{2})/g);
    return matches && matches.length > 1 ? matches[1] : "22:00";
  });

  // Price
  const [isFree, setIsFree] = useState(() => {
    const p = (proposal.proposedData.price || "").toLowerCase();
    return p.includes("miễn phí");
  });
  const [minPrice, setMinPrice] = useState(() => {
    const p = proposal.proposedData.price || "";
    const match = p.match(/\d+([.,]\d+)?/);
    if (match) {
      const numStr = match[0].replace(/[.,]/g, "");
      return numStr.length < 5 ? `${numStr}000` : numStr;
    }
    return "35000";
  });
  const [maxPrice, setMaxPrice] = useState(() => {
    const p = proposal.proposedData.price || "";
    const matches = p.match(/\d+([.,]\d+)?/g);
    if (matches && matches.length > 1) {
      const numStr = matches[1].replace(/[.,]/g, "");
      return numStr.length < 5 ? `${numStr}000` : numStr;
    }
    return "90000";
  });

  // Description & Note
  const [description, setDescription] = useState(
    proposal.proposedData.description ||
      "Địa điểm ẩm thực và trải nghiệm được người dùng đề xuất đóng góp vào bản đồ du lịch LangThang."
  );
  const [contributorNote, setContributorNote] = useState(proposal.note || "");

  // Images
  const [images, setImages] = useState<string[]>(() => {
    if (proposal.proposedData.imageUrl) return [proposal.proposedData.imageUrl];
    return [
      "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=800&h=600&fit=crop",
      "https://images.unsplash.com/photo-1541544741938-0af808871cc0?w=800&h=600&fit=crop",
    ];
  });
  const [newImageUrl, setNewImageUrl] = useState("");
  const [activePreviewImgIndex, setActivePreviewImgIndex] = useState(0);
  const [isDragging, setIsDragging] = useState(false);

  // Status (0: Pending, 1: Approved, 2: Rejected)
  const [status, setStatus] = useState<0 | 1 | 2>(proposal.status);

  // Refs
  const fileInputRef = useRef<HTMLInputElement>(null);
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<mapboxgl.Map | null>(null);
  const markerRef = useRef<mapboxgl.Marker | null>(null);

  const mapboxToken =
    (import.meta.env.VITE_MAPBOX_ACCESS_TOKEN as string | undefined)?.trim() ||
    "pk.eyJ1IjoibGFuZ3RoYW5nLXZuIiwiYSI6ImNtODFhYmNkZTAxMzAya3B0eGZjcHB0ZmoifQ.placeholder";

  useEffect(() => {
    const loadMetadata = async () => {
      try {
        const [catRes, provRes] = await Promise.all([
          catalogService.getPlaceTypes(),
          geographyService.getProvinces(),
        ]);
        if (catRes.success && catRes.data && catRes.data.length > 0) {
          setCategories(catRes.data);
        }
        if (provRes.success && provRes.data && provRes.data.length > 0) {
          setProvinces(provRes.data);
        }
      } catch {
        // Fallback already assigned in defaults
      }
    };
    loadMetadata();
  }, []);

  // Mapbox initialization
  useEffect(() => {
    if (!mapContainerRef.current) return;

    try {
      mapboxgl.accessToken = mapboxToken;

      const parsedLat = parseFloat(lat) || 16.0544;
      const parsedLng = parseFloat(lng) || 108.2022;

      const map = new mapboxgl.Map({
        container: mapContainerRef.current,
        style: "mapbox://styles/mapbox/streets-v12",
        center: [parsedLng, parsedLat],
        zoom: 13,
      });

      map.addControl(new mapboxgl.NavigationControl({ showCompass: false }), "top-right");

      const marker = new mapboxgl.Marker({ draggable: true, color: "#047857" })
        .setLngLat([parsedLng, parsedLat])
        .addTo(map);

      marker.on("dragend", () => {
        const lngLat = marker.getLngLat();
        setLng(lngLat.lng.toFixed(6));
        setLat(lngLat.lat.toFixed(6));
      });

      map.on("click", (e) => {
        const newLng = e.lngLat.lng.toFixed(6);
        const newLat = e.lngLat.lat.toFixed(6);
        setLng(newLng);
        setLat(newLat);
        marker.setLngLat([e.lngLat.lng, e.lngLat.lat]);
      });

      mapInstanceRef.current = map;
      markerRef.current = marker;

      return () => {
        marker.remove();
        map.remove();
      };
    } catch {
      // Mapbox load fallback
    }
  }, []);

  const updateMapPosition = (newLatStr: string, newLngStr: string) => {
    const pLat = parseFloat(newLatStr);
    const pLng = parseFloat(newLngStr);
    if (isNaN(pLat) || isNaN(pLng)) return;

    if (markerRef.current) {
      markerRef.current.setLngLat([pLng, pLat]);
    }
    if (mapInstanceRef.current) {
      mapInstanceRef.current.flyTo({ center: [pLng, pLat], zoom: 14, duration: 800 });
    }
  };

  const handleGetGPSLocation = () => {
    if (!navigator.geolocation) {
      setErrorMsg("Trình duyệt không hỗ trợ định vị GPS.");
      return;
    }

    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const currentLat = pos.coords.latitude.toFixed(6);
        const currentLng = pos.coords.longitude.toFixed(6);
        setLat(currentLat);
        setLng(currentLng);
        updateMapPosition(currentLat, currentLng);
        setIsLocating(false);
      },
      () => {
        setIsLocating(false);
        setErrorMsg("Không thể lấy vị trí GPS. Vui lòng cho phép quyền truy cập vị trí trên trình duyệt.");
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  // Image Management
  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;
    const files = Array.from(e.target.files);
    files.forEach((file) => {
      const reader = new FileReader();
      reader.onload = () => {
        if (typeof reader.result === "string") {
          setImages((prev) => [...prev, reader.result as string]);
        }
      };
      reader.readAsDataURL(file);
    });
  };

  const handleDropFiles = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (!e.dataTransfer.files) return;
    const files = Array.from(e.dataTransfer.files);
    files.forEach((file) => {
      if (file.type.startsWith("image/")) {
        const reader = new FileReader();
        reader.onload = () => {
          if (typeof reader.result === "string") {
            setImages((prev) => [...prev, reader.result as string]);
          }
        };
        reader.readAsDataURL(file);
      }
    });
  };

  const handleAddImageUrl = () => {
    if (!newImageUrl.trim()) return;
    setImages((prev) => [...prev, newImageUrl.trim()]);
    setNewImageUrl("");
  };

  const handleRemoveImage = (index: number) => {
    setImages((prev) => {
      const next = prev.filter((_, idx) => idx !== index);
      if (activePreviewImgIndex >= next.length) {
        setActivePreviewImgIndex(Math.max(0, next.length - 1));
      }
      return next;
    });
  };

  const handleSetCoverImage = (index: number) => {
    if (index === 0) return;
    setImages((prev) => {
      const selected = prev[index];
      const others = prev.filter((_, idx) => idx !== index);
      return [selected, ...others];
    });
    setActivePreviewImgIndex(0);
  };

  // Handle Save
  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");
    setSaveSuccessMsg("");

    if (!placeName.trim()) {
      setErrorMsg("Vui lòng nhập tên địa điểm đề xuất.");
      return;
    }
    if (!address.trim()) {
      setErrorMsg("Vui lòng nhập địa chỉ cụ thể của địa điểm.");
      return;
    }

    setIsSaving(true);

    const currentCat = categories.find((c) => c.id === categoryId);
    const currentProv = provinces.find((p) => p.id === provinceId);

    const priceFormatted = isFree
      ? "Miễn phí vé"
      : `${parseInt(minPrice || "0", 10).toLocaleString("vi-VN")}đ – ${parseInt(
          maxPrice || "0",
          10
        ).toLocaleString("vi-VN")}đ`;

    const hoursFormatted = is24Hours ? "Mở cửa cả ngày (24/7)" : `${openTime} – ${closeTime}`;

    const updatedProposal: AdminProposalItem = {
      ...proposal,
      placeName: placeName.trim(),
      category: currentCat?.name || proposal.category,
      province: currentProv?.name || provinceName,
      status,
      note: contributorNote.trim(),
      proposedData: {
        ...proposal.proposedData,
        name: placeName.trim(),
        address: address.trim(),
        hours: hoursFormatted,
        phone: phone.trim(),
        category: currentCat?.name || proposal.category,
        price: priceFormatted,
        description: description.trim(),
        imageUrl: images[0] || proposal.proposedData.imageUrl,
      },
    };

    setTimeout(() => {
      onSave(updatedProposal);
      setIsSaving(false);
      setSaveSuccessMsg("Đã lưu các chỉnh sửa thông tin đề xuất thành công!");
      setTimeout(() => setSaveSuccessMsg(""), 4000);
    }, 400);
  };

  const currentCategoryName =
    categories.find((c) => c.id === categoryId)?.name || proposal.category || "Danh mục";
  const currentProvinceName =
    provinces.find((p) => p.id === provinceId)?.name || provinceName;

  return (
    <div className="space-y-6 animate-in fade-in duration-200 text-xs font-sans pb-16">
      {/* Top Header / Back Navigation & Quick Action Controls */}
      <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/80 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onBack}
            className="p-2 sm:px-3 sm:py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
            title="Quay lại danh sách đề xuất"
          >
            <ArrowLeft size={15} />
            <span className="hidden sm:inline">Quay lại đề xuất</span>
          </button>

          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base sm:text-lg font-bold text-slate-900 truncate max-w-md">
                {placeName || proposal.placeName}
              </h2>
              <span
                className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                  status === 0
                    ? "bg-amber-100 text-amber-800"
                    : status === 1
                    ? "bg-emerald-100 text-emerald-800"
                    : "bg-rose-100 text-rose-800"
                }`}
              >
                {status === 0 ? "Chờ duyệt" : status === 1 ? "Đã chấp nhận" : "Đã từ chối"}
              </span>
            </div>
            <p className="text-[11px] text-slate-400 mt-0.5">
              Đề xuất #{proposal.id} • Người gửi: <strong className="text-slate-600">{proposal.proposedBy}</strong> ({proposal.submittedAt})
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2 flex-wrap">
          {status === 0 && (
            <>
              <button
                type="button"
                onClick={() => {
                  onReject(proposal);
                  setStatus(2);
                }}
                className="flex items-center gap-1.5 px-3 py-2 border border-slate-200 hover:bg-rose-50 hover:border-rose-200 text-rose-700 font-bold rounded-xl cursor-pointer transition-colors"
              >
                <X size={14} />
                <span>Từ chối</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  onApprove(proposal);
                  setStatus(1);
                }}
                className="flex items-center gap-1.5 px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl cursor-pointer shadow-xs transition-colors"
              >
                <Check size={14} />
                <span>Chấp nhận & Duyệt</span>
              </button>
            </>
          )}

          <button
            type="button"
            onClick={handleFormSubmit}
            disabled={isSaving}
            className="flex items-center gap-1.5 px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white font-bold rounded-xl cursor-pointer shadow-xs transition-colors disabled:opacity-50"
          >
            {isSaving ? (
              <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <Save size={14} />
            )}
            <span>{isSaving ? "Đang lưu..." : "Lưu chỉnh sửa"}</span>
          </button>
        </div>
      </div>

      {/* Notifications */}
      {errorMsg && (
        <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium flex items-center gap-2 animate-in fade-in">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {saveSuccessMsg && (
        <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center gap-2 animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
          <span>{saveSuccessMsg}</span>
        </div>
      )}

      {/* Main Grid Layout - 12 Columns */}
      <form onSubmit={handleFormSubmit}>
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left Column (8 cols): All Form Sections */}
          <div className="lg:col-span-8 space-y-6">
            {/* Section 1: Basic Information */}
            <div className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200/80 shadow-xs space-y-5">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-3">
                <FileText className="w-4 h-4 text-emerald-700" />
                <span>1. Thông tin cơ bản & Phân loại đề xuất</span>
              </h3>

              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-800 mb-1.5">
                    Tên địa điểm đề xuất <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    placeholder="Ví dụ: Cà phê Trứng Giảng, Mì Quảng Bếp Trang..."
                    value={placeName}
                    onChange={(e) => setPlaceName(e.target.value)}
                    className="w-full px-4 py-3 rounded-2xl bg-slate-50/80 border border-slate-200 text-xs sm:text-sm text-slate-900 focus:outline-none focus:bg-white focus:border-emerald-700 transition-all font-semibold"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-800 mb-1.5">
                      Danh mục / Thể loại <span className="text-rose-500">*</span>
                    </label>
                    <select
                      value={categoryId}
                      onChange={(e) => setCategoryId(Number(e.target.value))}
                      className="w-full px-3.5 py-3 rounded-2xl bg-slate-50/80 border border-slate-200 text-xs font-medium text-slate-900 focus:outline-none focus:bg-white focus:border-emerald-700 cursor-pointer"
                    >
                      {categories.map((cat) => (
                        <option key={cat.id} value={cat.id}>
                          {cat.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-800 mb-1.5">
                      Tỉnh / Thành phố <span className="text-rose-500">*</span>
                    </label>
                    <select
                      value={provinceId}
                      onChange={(e) => {
                        const newProvId = Number(e.target.value);
                        setProvinceId(newProvId);
                        const prov = provinces.find((p) => p.id === newProvId);
                        if (prov) setProvinceName(prov.name);
                      }}
                      className="w-full px-3.5 py-3 rounded-2xl bg-slate-50/80 border border-slate-200 text-xs font-medium text-slate-900 focus:outline-none focus:bg-white focus:border-emerald-700 cursor-pointer"
                    >
                      {provinces.map((prov) => (
                        <option key={prov.id} value={prov.id}>
                          {prov.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-800 mb-1.5">
                    Địa chỉ chi tiết <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    placeholder="Số nhà, tên đường, phường/xã, quận/huyện..."
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    className="w-full px-4 py-3 rounded-2xl bg-slate-50/80 border border-slate-200 text-xs text-slate-900 focus:outline-none focus:bg-white focus:border-emerald-700 font-medium"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-800 mb-1.5 flex items-center gap-1.5">
                      <Phone className="w-3.5 h-3.5 text-slate-500" />
                      <span>Số điện thoại liên hệ</span>
                    </label>
                    <input
                      type="text"
                      placeholder="Ví dụ: 0905 123 456 / 0236 3888 999"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="w-full px-4 py-3 rounded-2xl bg-slate-50/80 border border-slate-200 text-xs text-slate-900 focus:outline-none focus:bg-white focus:border-emerald-700"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-800 mb-1.5 flex items-center gap-1.5">
                      <Globe className="w-3.5 h-3.5 text-slate-500" />
                      <span>Website / Fanpage</span>
                    </label>
                    <input
                      type="text"
                      placeholder="https://facebook.com/... hoặc https://..."
                      value={website}
                      onChange={(e) => setWebsite(e.target.value)}
                      className="w-full px-4 py-3 rounded-2xl bg-slate-50/80 border border-slate-200 text-xs text-slate-900 focus:outline-none focus:bg-white focus:border-emerald-700"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Section 2: Interactive Map & Coordinates */}
            <div className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200/80 shadow-xs space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-emerald-700" />
                  <span>2. Vị trí trên bản đồ & Tọa độ GPS</span>
                </h3>

                <button
                  type="button"
                  onClick={handleGetGPSLocation}
                  disabled={isLocating}
                  className="text-xs font-bold text-emerald-700 hover:text-emerald-800 transition-colors flex items-center gap-1.5 cursor-pointer disabled:opacity-50 self-start sm:self-auto bg-emerald-50 px-3 py-1.5 rounded-full border border-emerald-200/70"
                >
                  <Navigation className="w-3.5 h-3.5" />
                  <span>{isLocating ? "Đang lấy tọa độ GPS..." : "Lấy vị trí GPS của tôi"}</span>
                </button>
              </div>

              <p className="text-xs text-slate-500">
                Click chuột vào bất kỳ vị trí nào trên bản đồ hoặc kéo thả ghim màu xanh lá để cập nhật tọa độ chính xác.
              </p>

              <div className="relative rounded-2xl overflow-hidden border border-slate-200 bg-slate-100 h-72 sm:h-80 w-full shadow-inner">
                <div ref={mapContainerRef} className="w-full h-full" />

                <div className="absolute bottom-3 left-3 bg-slate-900/85 backdrop-blur-md text-white text-[11px] font-mono px-3 py-1.5 rounded-xl flex items-center gap-2 shadow-lg border border-slate-700 z-10">
                  <MapPin className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  <span>Lat: {lat} | Lng: {lng}</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 pt-1">
                <div>
                  <label className="block text-[11px] text-slate-500 mb-1 font-medium">Vĩ độ (Latitude)</label>
                  <input
                    type="text"
                    value={lat}
                    onChange={(e) => {
                      setLat(e.target.value);
                      updateMapPosition(e.target.value, lng);
                    }}
                    className="w-full p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-mono text-slate-800 focus:outline-none focus:bg-white focus:border-emerald-700 font-semibold"
                  />
                </div>
                <div>
                  <label className="block text-[11px] text-slate-500 mb-1 font-medium">Kinh độ (Longitude)</label>
                  <input
                    type="text"
                    value={lng}
                    onChange={(e) => {
                      setLng(e.target.value);
                      updateMapPosition(lat, e.target.value);
                    }}
                    className="w-full p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-mono text-slate-800 focus:outline-none focus:bg-white focus:border-emerald-700 font-semibold"
                  />
                </div>
              </div>
            </div>

            {/* Section 3: Operating Hours, Price & Contributor Note */}
            <div className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200/80 shadow-xs space-y-5">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-3">
                <Clock className="w-4 h-4 text-emerald-700" />
                <span>3. Giờ hoạt động, Chi phí & Ghi chú từ người gửi</span>
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div className="p-4 rounded-2xl bg-slate-50/80 border border-slate-200/80 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-emerald-700" />
                      Giờ mở cửa
                    </span>
                    <label className="flex items-center gap-1.5 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={is24Hours}
                        onChange={(e) => setIs24Hours(e.target.checked)}
                        className="rounded text-emerald-700 focus:ring-emerald-700"
                      />
                      <span className="text-xs text-slate-700 font-semibold">Mở 24/7</span>
                    </label>
                  </div>

                  {!is24Hours ? (
                    <div className="grid grid-cols-2 gap-2.5 pt-1">
                      <div>
                        <span className="text-[10px] text-slate-500 font-medium">Mở cửa</span>
                        <input
                          type="time"
                          value={openTime}
                          onChange={(e) => setOpenTime(e.target.value)}
                          className="w-full p-2 mt-1 rounded-xl bg-white border border-slate-200 text-xs text-slate-900 focus:outline-none focus:border-emerald-700 cursor-pointer font-medium"
                        />
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-500 font-medium">Đóng cửa</span>
                        <input
                          type="time"
                          value={closeTime}
                          onChange={(e) => setCloseTime(e.target.value)}
                          className="w-full p-2 mt-1 rounded-xl bg-white border border-slate-200 text-xs text-slate-900 focus:outline-none focus:border-emerald-700 cursor-pointer font-medium"
                        />
                      </div>
                    </div>
                  ) : (
                    <div className="text-xs text-emerald-800 bg-emerald-50 p-2.5 rounded-xl font-medium">
                      Địa điểm đón khách liên tục cả ngày lẫn đêm.
                    </div>
                  )}
                </div>

                <div className="p-4 rounded-2xl bg-slate-50/80 border border-slate-200/80 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                      <DollarSign className="w-3.5 h-3.5 text-emerald-700" />
                      Khung giá đề xuất (VNĐ)
                    </span>
                    <label className="flex items-center gap-1.5 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={isFree}
                        onChange={(e) => setIsFree(e.target.checked)}
                        className="rounded text-emerald-700 focus:ring-emerald-700"
                      />
                      <span className="text-xs text-slate-700 font-semibold">Miễn phí vé</span>
                    </label>
                  </div>

                  {!isFree ? (
                    <div className="grid grid-cols-2 gap-2.5 pt-1">
                      <div>
                        <span className="text-[10px] text-slate-500 font-medium">Giá tối thiểu</span>
                        <input
                          type="number"
                          value={minPrice}
                          onChange={(e) => setMinPrice(e.target.value)}
                          placeholder="35000"
                          className="w-full p-2 mt-1 rounded-xl bg-white border border-slate-200 text-xs text-slate-900 focus:outline-none focus:border-emerald-700 font-medium"
                        />
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-500 font-medium">Giá tối đa</span>
                        <input
                          type="number"
                          value={maxPrice}
                          onChange={(e) => setMaxPrice(e.target.value)}
                          placeholder="90000"
                          className="w-full p-2 mt-1 rounded-xl bg-white border border-slate-200 text-xs text-slate-900 focus:outline-none focus:border-emerald-700 font-medium"
                        />
                      </div>
                    </div>
                  ) : (
                    <div className="text-xs text-emerald-800 bg-emerald-50 p-2.5 rounded-xl font-medium">
                      Địa điểm không thu phí tham quan hoặc vé vào cửa.
                    </div>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1.5">
                  Mô tả chi tiết địa điểm <span className="text-rose-500">*</span>
                </label>
                <textarea
                  rows={3}
                  placeholder="Mô tả về không gian, đặc trưng món ăn, view chụp ảnh..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full p-3.5 rounded-2xl bg-slate-50/80 border border-slate-200 text-xs sm:text-sm text-slate-900 focus:outline-none focus:bg-white focus:border-emerald-700 leading-relaxed"
                />
              </div>

              {/* Contributor Note Box */}
              <div className="p-4 rounded-2xl bg-amber-50/70 border border-amber-200/80 space-y-2">
                <label className="block text-xs font-bold text-amber-900 flex items-center gap-1.5">
                  <MessageSquareQuote className="w-4 h-4 text-amber-600" />
                  <span>Ghi chú của người gửi đề xuất ({proposal.proposedBy})</span>
                </label>
                <textarea
                  rows={2}
                  placeholder="Ghi chú thêm từ người đóng góp..."
                  value={contributorNote}
                  onChange={(e) => setContributorNote(e.target.value)}
                  className="w-full p-3 rounded-xl bg-white border border-amber-200 text-xs text-slate-800 focus:outline-none focus:border-amber-500 leading-relaxed font-medium"
                />
              </div>
            </div>

            {/* Section 4: Image Gallery & Uploads */}
            <div className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200/80 shadow-xs space-y-4">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-3">
                <ImageIcon className="w-4 h-4 text-emerald-700" />
                <span>4. Hình ảnh do người dùng đính kèm</span>
              </h3>

              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                multiple
                onChange={handleFileInputChange}
                className="hidden"
              />

              <div
                onClick={() => fileInputRef.current?.click()}
                onDragOver={(e) => {
                  e.preventDefault();
                  setIsDragging(true);
                }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={handleDropFiles}
                className={`p-6 border-2 border-dashed rounded-2xl text-center cursor-pointer transition-all flex flex-col items-center justify-center gap-2.5 ${
                  isDragging
                    ? "border-emerald-600 bg-emerald-50/80 text-emerald-800 ring-2 ring-emerald-500/30"
                    : "border-slate-300 hover:border-emerald-600 hover:bg-slate-50 text-slate-600"
                }`}
              >
                <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-700 flex items-center justify-center shadow-xs">
                  <UploadCloud className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-xs sm:text-sm font-bold text-slate-800">
                    Bổ sung ảnh từ thiết bị (Click hoặc kéo thả ảnh vào đây)
                  </p>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    Hỗ trợ định dạng JPG, PNG, WEBP, JPEG
                  </p>
                </div>
              </div>

              {/* Quick URL Adder */}
              <div className="flex items-center gap-2 pt-1">
                <div className="relative flex-1">
                  <LinkIcon className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Hoặc thêm URL ảnh đính kèm (https://...)..."
                    value={newImageUrl}
                    onChange={(e) => setNewImageUrl(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        handleAddImageUrl();
                      }
                    }}
                    className="w-full pl-8 pr-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-800 focus:outline-none focus:bg-white focus:border-emerald-700"
                  />
                </div>
                <button
                  type="button"
                  onClick={handleAddImageUrl}
                  className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs cursor-pointer transition-colors"
                >
                  Thêm URL
                </button>
              </div>

              <div className="space-y-4 pt-2">
                <div>
                  <span className="text-xs font-bold text-slate-700 mb-2 block">
                    Danh sách hình ảnh ({images.length})
                  </span>
                  {images.length > 0 ? (
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                      {images.map((img, idx) => (
                        <div
                          key={idx}
                          className="relative aspect-4/3 rounded-2xl overflow-hidden bg-slate-100 border border-slate-200 group shadow-2xs"
                        >
                          <img
                            src={img}
                            alt={`Ảnh ${idx + 1}`}
                            className="w-full h-full object-cover"
                          />
                          {idx === 0 ? (
                            <span className="absolute top-2 left-2 px-2 py-0.5 rounded-md bg-emerald-800/90 backdrop-blur-xs text-white text-[10px] font-bold shadow-xs">
                              Ảnh bìa chính
                            </span>
                          ) : (
                            <button
                              type="button"
                              onClick={() => handleSetCoverImage(idx)}
                              className="absolute top-2 left-2 px-2 py-0.5 rounded-md bg-slate-900/70 hover:bg-emerald-700 text-white text-[10px] font-semibold transition-colors cursor-pointer opacity-0 group-hover:opacity-100 shadow-xs"
                            >
                              Đặt làm ảnh bìa
                            </button>
                          )}

                          <button
                            type="button"
                            onClick={() => handleRemoveImage(idx)}
                            className="absolute top-2 right-2 p-1.5 rounded-full bg-black/60 hover:bg-rose-600 text-white transition-colors cursor-pointer opacity-0 group-hover:opacity-100 shadow-xs"
                            title="Xóa ảnh này"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="p-4 rounded-2xl bg-slate-50 border border-dashed border-slate-200 text-center text-xs text-slate-400">
                      Chưa có ảnh nào được thêm. Hãy chọn hoặc kéo thả ảnh vào khung phía trên.
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Bottom Action Card */}
            <div className="p-6 bg-white rounded-3xl border border-slate-200/80 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="text-xs text-slate-500">
                Sau khi phê duyệt, địa điểm sẽ tự động được đưa vào danh sách quản lý và hiển thị công khai trên ứng dụng.
              </div>

              <div className="flex items-center gap-2.5 w-full sm:w-auto">
                <button
                  type="button"
                  onClick={onBack}
                  className="flex-1 sm:flex-none px-5 py-3 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold cursor-pointer transition-all text-center"
                >
                  Quay lại
                </button>

                <button
                  type="submit"
                  disabled={isSaving}
                  className="flex-1 sm:flex-none px-7 py-3 rounded-2xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs sm:text-sm font-bold flex items-center justify-center gap-2 cursor-pointer transition-all shadow-md disabled:opacity-50"
                >
                  {isSaving ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Đang lưu...</span>
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4" />
                      <span>Lưu thông tin đề xuất</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* Right Column (4 cols, sticky): Live Preview Card & Contributor Meta */}
          <div className="lg:col-span-4 space-y-6 sticky top-6">
            {/* Live Preview Card */}
            <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <Eye className="w-4 h-4 text-emerald-700" />
                  <span>Bản xem trước trực tiếp</span>
                </h3>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200/60">
                  Live Sync
                </span>
              </div>

              {/* Discovery Card Component Replica */}
              <div className="group flex flex-col select-none bg-white rounded-2xl border border-slate-200/80 p-3 shadow-2xs space-y-3">
                {images.length > 0 ? (
                  <div className="relative aspect-square w-full rounded-xl overflow-hidden bg-slate-100">
                    <img
                      src={images[activePreviewImgIndex] || images[0]}
                      alt={placeName || "Bản xem trước"}
                      className="w-full h-full object-cover transition-opacity duration-300"
                    />
                    <div className="absolute inset-0 bg-white/0 group-hover:bg-white/10 transition-colors duration-300 pointer-events-none" />

                    {images.length > 1 && (
                      <>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setActivePreviewImgIndex((prev) =>
                              prev === 0 ? images.length - 1 : prev - 1
                            );
                          }}
                          aria-label="Ảnh trước"
                          className="absolute left-2.5 top-1/2 -translate-y-1/2 w-7 h-7 rounded-full bg-slate-900/60 hover:bg-slate-900/85 text-white flex items-center justify-center transition-all opacity-85 hover:opacity-100 z-10 cursor-pointer"
                        >
                          <ChevronLeft className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setActivePreviewImgIndex((prev) =>
                              prev === images.length - 1 ? 0 : prev + 1
                            );
                          }}
                          aria-label="Ảnh sau"
                          className="absolute right-2.5 top-1/2 -translate-y-1/2 w-7 h-7 rounded-full bg-slate-900/60 hover:bg-slate-900/85 text-white flex items-center justify-center transition-all opacity-85 hover:opacity-100 z-10 cursor-pointer"
                        >
                          <ChevronRight className="w-4 h-4" />
                        </button>

                        <div className="absolute bottom-2.5 right-2.5 px-2 py-0.5 rounded-full bg-slate-950/70 backdrop-blur-xs text-[10px] font-bold text-white z-10">
                          {activePreviewImgIndex + 1}/{images.length}
                        </div>
                      </>
                    )}
                  </div>
                ) : (
                  <div className="relative aspect-square w-full rounded-xl overflow-hidden bg-slate-200 animate-pulse flex flex-col items-center justify-center text-slate-400 gap-2 border border-slate-200/80">
                    <div className="w-12 h-12 rounded-2xl bg-slate-300/80 flex items-center justify-center text-slate-400">
                      <ImageIcon className="w-6 h-6" />
                    </div>
                    <span className="text-xs font-medium text-slate-500">Chưa có ảnh</span>
                    <span className="text-[10px] text-slate-400">Tải ảnh lên để xem trước</span>
                  </div>
                )}

                <div className="space-y-2 pt-1">
                  <h4 className="font-bold text-[15px] sm:text-base text-slate-900 group-hover:text-emerald-900 transition-colors line-clamp-2 leading-snug tracking-tight">
                    {placeName.trim() || "Tên địa điểm"}
                  </h4>

                  <div className="flex items-center gap-1.5 text-xs text-slate-900 font-bold">
                    <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400 shrink-0" />
                    <span>5.0</span>
                    <span className="text-slate-400 font-normal">·</span>
                    <span className="text-slate-500 font-normal">{currentCategoryName}</span>
                  </div>

                  <div className="flex items-center gap-1 text-xs text-slate-500">
                    <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span className="truncate">
                      {address.trim() ? `${address.trim()}, ${currentProvinceName}` : currentProvinceName}
                    </span>
                  </div>

                  <p className="text-xs text-slate-600 line-clamp-2 font-normal leading-relaxed">
                    {description.trim() || "Mô tả về địa điểm sẽ cập nhật trực tiếp tại đây..."}
                  </p>

                  <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
                    <span>{is24Hours ? "Mở cửa 24/7" : `${openTime} - ${closeTime}`}</span>
                    <span className="font-bold text-emerald-800">
                      {isFree
                        ? "Miễn phí"
                        : `${parseInt(minPrice || "0", 10).toLocaleString("vi-VN")} đ`}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Contributor Profile & Moderation Card */}
            <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs space-y-4">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-3">
                <User className="w-4 h-4 text-emerald-700" />
                <span>Hồ sơ người đóng góp</span>
              </h3>

              <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-2xl border border-slate-200/80">
                {proposal.userAvatar ? (
                  <img
                    src={proposal.userAvatar}
                    className="w-10 h-10 rounded-full object-cover border border-slate-200"
                    alt=""
                  />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-slate-200 flex items-center justify-center text-slate-600 font-bold">
                    {proposal.proposedBy.charAt(0)}
                  </div>
                )}
                <div>
                  <div className="font-bold text-slate-900">{proposal.proposedBy}</div>
                  <div className="text-[11px] text-slate-400">
                    Đã gửi: {proposal.submittedAt}
                  </div>
                </div>
              </div>

              <div className="space-y-2 text-xs">
                <div className="flex items-center justify-between p-2.5 bg-slate-50/60 rounded-xl">
                  <span className="text-slate-500">Loại đề xuất:</span>
                  <span className="font-bold text-slate-800">
                    {proposal.type === "new_place"
                      ? "Thêm địa điểm mới"
                      : proposal.type === "update_info"
                      ? "Cập nhật thông tin"
                      : "Sửa lỗi sai"}
                  </span>
                </div>
                <div className="flex items-center justify-between p-2.5 bg-slate-50/60 rounded-xl">
                  <span className="text-slate-500">Điểm thưởng dự kiến:</span>
                  <span className="font-bold text-emerald-700">+100 điểm cống hiến</span>
                </div>
              </div>

              <div className="pt-2 border-t border-slate-100">
                <h4 className="text-[11px] font-bold text-slate-700 mb-2 flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Tiêu chuẩn duyệt đề xuất:</span>
                </h4>
                <ul className="space-y-1.5 text-[11px] text-slate-500">
                  <li className="flex items-center gap-2">
                    <Check className="w-3 h-3 text-emerald-600 shrink-0" />
                    <span>Địa điểm có thật, vị trí ghim map chuẩn</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-3 h-3 text-emerald-600 shrink-0" />
                    <span>Hình ảnh chụp thực tế rõ ràng sắc nét</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-3 h-3 text-emerald-600 shrink-0" />
                    <span>Không trùng lặp với địa điểm đã có</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
};

export default ProposalDetailEditor;
