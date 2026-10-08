import React, { useState, useEffect, useRef } from "react";
import {
  MapPin,
  Clock,
  DollarSign,
  CheckCircle2,
  AlertCircle,
  Check,
  ShieldCheck,
  Eye,
  FileText,
  Image as ImageIcon,
  Star,
  ChevronLeft,
  ChevronRight,
  ArrowLeft,
  Globe,
  Phone,
  X,
  User,
  Loader2,
  MessageSquare,
  AlertTriangle,
} from "lucide-react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import { catalogService } from "@/services/catalogService";
import { geographyService } from "@/services/geographyService";
import type { PlaceTypeDto } from "@/types/models/place.model";
import type { ProvinceDto } from "@/types/models/geography.model";
import type { AdminProposalItem } from "@/types/admin.types";
import { adminService, extractList } from "@/services/adminService";

interface ProposalDetailEditorProps {
  proposal: AdminProposalItem;
  onBack: () => void;
  onSave?: (updatedProposal: AdminProposalItem) => void;
  onApprove: (proposal: AdminProposalItem, adminNotes?: string) => void;
  onReject: (proposal: AdminProposalItem, reason: string) => void;
}

export const ProposalDetailEditor: React.FC<ProposalDetailEditorProps> = ({
  proposal,
  onBack,
  onApprove,
  onReject,
}) => {
  const [isApproving, setIsApproving] = useState(false);
  const [isRejecting, setIsRejecting] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const [categories, setCategories] = useState<PlaceTypeDto[]>([]);
  const [provinces, setProvinces] = useState<ProvinceDto[]>([]);

  // Proposer Info
  const [proposer, setProposer] = useState<{
    id?: number;
    name?: string;
    email?: string;
    avatarUrl?: string;
  }>(() => ({
    name: proposal.proposerName || proposal.proposedBy || proposal.proposer?.name || "Người dùng",
    avatarUrl: proposal.proposerAvatar || proposal.userAvatar || proposal.proposer?.avatarUrl || "",
    email: proposal.proposer?.email || "",
  }));

  // Moderation text inputs
  const [adminNotesInput, setAdminNotesInput] = useState("");
  const [rejectReasonInput, setRejectReasonInput] = useState("");

  // Stored notes from DB (support both adminNote/AdminNote and rejectReason/RejectReason)
  const initialAdminNote =
    proposal.adminNote ||
    proposal.adminNotes ||
    (proposal as any).AdminNote ||
    (proposal as any).AdminNotes ||
    "";
  const initialRejectReason =
    proposal.rejectReason ||
    proposal.rejectionReason ||
    (proposal as any).RejectReason ||
    (proposal as any).RejectionReason ||
    (proposal.status === 2 ? initialAdminNote : "") ||
    "";

  const [adminNotes, setAdminNotes] = useState(initialAdminNote);
  const [rejectionReason, setRejectionReason] = useState(initialRejectReason);

  // Status (0: Pending, 1: Approved, 2: Rejected)
  const [status, setStatus] = useState<0 | 1 | 2>(proposal.status);

  // Proposal Read-only Data
  const [placeName, setPlaceName] = useState(
    proposal.placeData?.name || proposal.proposedData?.name || proposal.placeName || ""
  );

  const [categoryId, setCategoryId] = useState<number>(() => {
    return proposal.placeData?.categoryId || 0;
  });

  const [provinceId, setProvinceId] = useState<number>(() => {
    return proposal.placeData?.provinceId || 0;
  });

  const [provinceName, setProvinceName] = useState(proposal.placeData?.provinceName || proposal.province || "");
  const [address, setAddress] = useState(proposal.placeData?.address || proposal.proposedData?.address || "");
  const [phone, setPhone] = useState(proposal.placeData?.phone || proposal.proposedData?.phone || "");
  const [website, setWebsite] = useState(proposal.placeData?.website || "");

  // Coordinates
  const [lat, setLat] = useState(String(proposal.placeData?.latitude || ""));
  const [lng, setLng] = useState(String(proposal.placeData?.longitude || ""));

  // Operating Hours
  const [is24Hours, setIs24Hours] = useState(() => {
    const h = (proposal.placeData?.openingHours || proposal.proposedData?.hours || "").toLowerCase();
    return h.includes("24/7") || h.includes("24h") || h.includes("cả ngày");
  });
  const [openTime, setOpenTime] = useState(() => {
    const h = proposal.placeData?.openingHours || proposal.proposedData?.hours || "";
    const match = h.match(/(\d{1,2}:\d{2})/);
    return match ? match[1] : "07:30";
  });
  const [closeTime, setCloseTime] = useState(() => {
    const h = proposal.placeData?.openingHours || proposal.proposedData?.hours || "";
    const matches = h.match(/(\d{1,2}:\d{2})/g);
    return matches && matches.length > 1 ? matches[1] : "22:00";
  });

  // Price
  const [isFree, setIsFree] = useState(() => {
    if (proposal.placeData?.isFree !== undefined) return proposal.placeData.isFree;
    const p = (proposal.proposedData?.price || "").toLowerCase();
    return p.includes("miễn phí");
  });
  const [minPrice, setMinPrice] = useState(() => {
    if (proposal.placeData?.minPrice !== undefined) return String(proposal.placeData.minPrice);
    const p = proposal.proposedData?.price || "";
    const match = p.match(/\d+([.,]\d+)?/);
    if (match) {
      const numStr = match[0].replace(/[.,]/g, "");
      return numStr.length < 5 ? `${numStr}000` : numStr;
    }
    return "0";
  });
  const [maxPrice, setMaxPrice] = useState(() => {
    if (proposal.placeData?.maxPrice !== undefined) return String(proposal.placeData.maxPrice);
    const p = proposal.proposedData?.price || "";
    const matches = p.match(/\d+([.,]\d+)?/g);
    if (matches && matches.length > 1) {
      const numStr = matches[1].replace(/[.,]/g, "");
      return numStr.length < 5 ? `${numStr}000` : numStr;
    }
    return "0";
  });

  // Description & Note
  const [description, setDescription] = useState(
    proposal.placeData?.description ||
    proposal.proposedData?.description ||
    ""
  );
  const contributorNote = proposal.note;

  // Images
  const [images, setImages] = useState<string[]>(() => {
    let list: string[] = [];
    if (Array.isArray(proposal.placeData?.images) && proposal.placeData.images.length > 0) {
      list = proposal.placeData.images.filter(Boolean);
    } else if (Array.isArray(proposal.placeData?.mediaUrls) && proposal.placeData.mediaUrls.length > 0) {
      list = proposal.placeData.mediaUrls.filter(Boolean);
    }
    const cover =
      proposal.placeData?.coverImg ||
      proposal.coverImg ||
      proposal.proposedData?.imageUrl ||
      proposal.proposedData?.coverImg ||
      "";
    if (cover && !list.includes(cover)) {
      list = [cover, ...list];
    }
    const unique = Array.from(new Set(list.filter(Boolean)));
    if (unique.length > 0) return unique;
    if (proposal.coverImg) return [proposal.coverImg];
    return [];
  });
  const [activePreviewImgIndex, setActivePreviewImgIndex] = useState(0);

  // Map Refs
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<mapboxgl.Map | null>(null);
  const markerRef = useRef<mapboxgl.Marker | null>(null);

  const mapboxToken =
    (import.meta.env.VITE_MAPBOX_ACCESS_TOKEN as string | undefined)?.trim() ||
    "pk.eyJ1IjoibGFuZ3RoYW5nLXZuIiwiYSI6ImNtODFhYmNkZTAxMzAya3B0eGZjcHB0ZmoifQ.placeholder";

  // Fetch full Proposal Details from GET /api/admin/proposals/{id} (AdminProposalDetailDto)
  useEffect(() => {
    if (!proposal?.id) return;
    let mounted = true;
    const fetchProposalDetail = async () => {
      try {
        const res = await adminService.getProposal(proposal.id);
        const data = (res as any)?.data || res;
        if (mounted && data) {
          const newStatus =
            data.status !== undefined
              ? Number(data.status)
              : data.Status !== undefined
                ? Number(data.Status)
                : undefined;
          if (newStatus !== undefined && (newStatus === 0 || newStatus === 1 || newStatus === 2)) {
            setStatus(newStatus as 0 | 1 | 2);
          }

          const rawAdminNote =
            data.adminNote ??
            data.AdminNote ??
            data.adminNotes ??
            data.AdminNotes ??
            proposal.adminNote ??
            proposal.adminNotes ??
            "";

          const rawRejectReason =
            data.rejectReason ??
            data.RejectReason ??
            data.rejectionReason ??
            data.RejectionReason ??
            proposal.rejectReason ??
            proposal.rejectionReason ??
            "";

          // If proposal was rejected, admin note or reject reason can contain the rejection explanation
          const finalRejectReason = rawRejectReason || rawAdminNote;
          // If proposal was approved, admin note contains the approval note
          const finalAdminNote = rawAdminNote || rawRejectReason;

          if (finalAdminNote) {
            setAdminNotes(finalAdminNote);
            setAdminNotesInput(finalAdminNote);
          }
          if (finalRejectReason) {
            setRejectionReason(finalRejectReason);
            setRejectReasonInput(finalRejectReason);
          }

          const propObj = data.proposer || data.Proposer;
          if (propObj) {
            setProposer({
              id: propObj.id || propObj.Id,
              name: propObj.name || propObj.Name || propObj.fullName || propObj.FullName || proposal.proposerName || proposal.proposedBy || "Người dùng",
              email: propObj.email || propObj.Email || "",
              avatarUrl: propObj.avatarUrl || propObj.AvatarUrl || propObj.avatar || propObj.Avatar || proposal.proposerAvatar || proposal.userAvatar || "",
            });
          }

          const pData = data.placeData || data.PlaceData || data.proposedData || data;
          if (pData) {
            const pName = pData.name || pData.Name || pData.placeName || pData.PlaceName;
            if (pName) setPlaceName(pName);

            const cId = pData.categoryId || pData.CategoryId;
            if (cId) setCategoryId(Number(cId));

            const prId = pData.provinceId || pData.ProvinceId;
            if (prId) setProvinceId(Number(prId));

            const pProvName = pData.provinceName || pData.ProvinceName || pData.province || pData.Province;
            if (pProvName) setProvinceName(pProvName);

            const pAddr = pData.address || pData.Address || pData.location || pData.Location;
            if (pAddr) setAddress(pAddr);

            const pPhone = pData.phone || pData.Phone;
            if (pPhone) setPhone(pPhone);

            const pWeb = pData.website || pData.Website;
            if (pWeb) setWebsite(pWeb);

            const pLat = pData.latitude || pData.Latitude;
            const pLng = pData.longitude || pData.Longitude;
            if (pLat) {
              setLat(String(pLat));
              if (pLng) {
                setLng(String(pLng));
                updateMapPosition(String(pLat), String(pLng));
              }
            }

            const pIsFree = pData.isFree !== undefined ? pData.isFree : pData.IsFree;
            if (pIsFree !== undefined) {
              setIsFree(Boolean(pIsFree));
            }

            const pMinP = pData.minPrice !== undefined ? pData.minPrice : pData.MinPrice;
            if (pMinP !== undefined) {
              setMinPrice(String(pMinP));
            }

            const pMaxP = pData.maxPrice !== undefined ? pData.maxPrice : pData.MaxPrice;
            if (pMaxP !== undefined) {
              setMaxPrice(String(pMaxP));
            }

            const pHours = pData.openingHours || pData.OpeningHours || pData.hours || pData.Hours;
            if (pHours) {
              const is24 = pHours.toLowerCase().includes("24/7") || pHours.toLowerCase().includes("24h") || pHours.toLowerCase().includes("cả ngày");
              setIs24Hours(is24);
              const matches = pHours.match(/(\d{1,2}:\d{2})/g);
              if (matches && matches[0]) setOpenTime(matches[0]);
              if (matches && matches[1]) setCloseTime(matches[1]);
            }

            const pDesc = pData.description || pData.Description || pData.desc || pData.Desc;
            if (pDesc) setDescription(pDesc);

            // Images
            const cover = pData.coverImg || pData.CoverImg || pData.coverImageUrl || pData.CoverImageUrl || pData.imageUrl || pData.ImageUrl || "";
            let imgs: string[] = [];
            const rawImgs = pData.images || pData.Images;
            const rawMedia = pData.mediaUrls || pData.MediaUrls;
            if (Array.isArray(rawImgs) && rawImgs.length > 0) {
              imgs = rawImgs.filter(Boolean);
            } else if (Array.isArray(rawMedia) && rawMedia.length > 0) {
              imgs = rawMedia.filter(Boolean);
            }
            if (cover && !imgs.includes(cover)) {
              imgs = [cover, ...imgs];
            }
            imgs = Array.from(new Set(imgs.filter(Boolean)));
            if (imgs.length > 0) {
              setImages(imgs);
            }
          }
        }
      } catch (err) {
        console.warn("Could not load fresh proposal detail:", err);
      }
    };
    fetchProposalDetail();
    return () => {
      mounted = false;
    };
  }, [proposal?.id]);

  // Load Categories & Provinces
  useEffect(() => {
    const loadMetadata = async () => {
      try {
        const [catRes, provRes] = await Promise.all([
          catalogService.getPlaceTypes(),
          geographyService.getProvinces(),
        ]);
        const catList = extractList<PlaceTypeDto>(catRes);
        if (catList.length > 0) {
          setCategories(catList);
        } else if (catRes?.data && Array.isArray(catRes.data)) {
          setCategories(catRes.data);
        }

        const provList = extractList<ProvinceDto>(provRes);
        if (provList.length > 0) {
          setProvinces(provList);
        } else if (provRes?.data && Array.isArray(provRes.data)) {
          setProvinces(provRes.data);
        }
      } catch (err) {
        console.warn("Could not load categories or provinces:", err);
      }
    };
    loadMetadata();
  }, []);

  // Mapbox initialization (Read-only view)
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

      const marker = new mapboxgl.Marker({ draggable: false, color: "#047857" })
        .setLngLat([parsedLng, parsedLat])
        .addTo(map);

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

  // Actions: Approve & Reject Handlers
  const handleApproveSubmit = async () => {
    setErrorMsg("");
    setIsApproving(true);
    try {
      const finalNotes = adminNotesInput.trim();
      await onApprove(proposal, finalNotes);
      setAdminNotes(finalNotes);
      setStatus(1);
    } catch (err: any) {
      setErrorMsg(err?.message || "Không thể phê duyệt đề xuất. Vui lòng thử lại.");
    } finally {
      setIsApproving(false);
    }
  };

  const handleRejectSubmit = async () => {
    setErrorMsg("");
    if (!rejectReasonInput.trim()) {
      setErrorMsg("Vui lòng nhập hoặc chọn lý do từ chối trước khi xác nhận.");
      return;
    }
    setIsRejecting(true);
    try {
      const finalReason = rejectReasonInput.trim();
      await onReject(proposal, finalReason);
      setRejectionReason(finalReason);
      setStatus(2);
    } catch (err: any) {
      setErrorMsg(err?.message || "Không thể từ chối đề xuất. Vui lòng thử lại.");
    } finally {
      setIsRejecting(false);
    }
  };

  const currentCategoryName =
    categories.find((c) => c.id === categoryId)?.name || proposal.category || "Danh mục";
  const currentProvinceName =
    provinces.find((p) => p.id === provinceId)?.name || provinceName;

  return (
    <div className="space-y-6 animate-in fade-in duration-200 text-xs font-sans pb-16">
      {/* Top Header / Back Navigation Only (NO Action Buttons here as requested) */}
      <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/80 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onBack}
            className="w-9 h-9 sm:w-10 sm:h-10 rounded-2xl bg-white border border-slate-200/80 hover:bg-slate-50 text-slate-600 hover:text-slate-900 flex items-center justify-center transition-colors cursor-pointer shadow-2xs shrink-0"
            title="Quay lại danh sách đề xuất"
            aria-label="Quay lại"
          >
            <ArrowLeft size={18} />
          </button>

          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base sm:text-lg font-bold text-slate-900 truncate max-w-md">
                {placeName || proposal.placeName}
              </h2>
              <span
                className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold ${status === 0
                  ? "bg-amber-100 text-amber-800 border border-amber-200"
                  : status === 1
                    ? "bg-emerald-100 text-emerald-800 border border-emerald-200"
                    : "bg-rose-100 text-rose-800 border border-rose-200"
                  }`}
              >
                {status === 0 ? "Chờ duyệt" : status === 1 ? "Đã chấp nhận" : "Đã từ chối"}
              </span>
            </div>
            <p className="text-[11px] text-slate-400 mt-0.5">
              Đề xuất #{proposal.id} • Người gửi: <strong className="text-slate-600">{proposer.name || proposal.proposedBy}</strong> ({proposal.submittedAt ? new Date(proposal.submittedAt).toLocaleString("vi-VN") : "Gần đây"})
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-[11px] font-medium text-slate-500 bg-slate-100 px-3 py-1.5 rounded-xl border border-slate-200">
            Chế độ: <strong>Xem &amp; Kiểm duyệt</strong>
          </span>
        </div>
      </div>

      {/* Error Alert */}
      {errorMsg && (
        <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium flex items-center gap-2 animate-in fade-in">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Main Grid Layout - 12 Columns */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column (8 cols): Read-Only Proposal Details */}
        <div className="lg:col-span-8 space-y-6">
          {/* Section 1: Basic Information (Read-only) */}
          <div className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200/80 shadow-xs space-y-5">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-3">
              <FileText className="w-4 h-4 text-emerald-700" />
              <span>1. Thông tin cơ bản &amp; Phân loại đề xuất</span>
            </h3>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Tên địa điểm đề xuất:
                </label>
                <div className="w-full px-4 py-2.5 rounded-2xl bg-slate-50 border border-slate-200 text-xs sm:text-sm text-slate-900 font-bold">
                  {placeName || "--"}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Danh mục / Thể loại:
                  </label>
                  <div className="w-full px-3.5 py-2.5 rounded-2xl bg-slate-50 border border-slate-200 text-xs font-semibold text-teal-900 flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-teal-500" />
                    <span>{currentCategoryName}</span>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Tỉnh / Thành phố:
                  </label>
                  <div className="w-full px-3.5 py-2.5 rounded-2xl bg-slate-50 border border-slate-200 text-xs font-semibold text-amber-900 flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-amber-500" />
                    <span>{currentProvinceName}</span>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Địa chỉ chi tiết:
                </label>
                <div className="w-full px-4 py-2.5 rounded-2xl bg-slate-50 border border-slate-200 text-xs text-slate-800 font-medium">
                  {address || "Chưa có địa chỉ chi tiết"}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1.5">
                    <Phone className="w-3.5 h-3.5 text-slate-400" />
                    <span>Số điện thoại liên hệ:</span>
                  </label>
                  <div className="w-full px-4 py-2.5 rounded-2xl bg-slate-50 border border-slate-200 text-xs text-slate-800 font-medium">
                    {phone || "Không có số điện thoại"}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1.5">
                    <Globe className="w-3.5 h-3.5 text-slate-400" />
                    <span>Website / Fanpage:</span>
                  </label>
                  <div className="w-full px-4 py-2.5 rounded-2xl bg-slate-50 border border-slate-200 text-xs text-slate-800 font-medium truncate">
                    {website ? (
                      <a href={website} target="_blank" rel="noreferrer" className="text-emerald-700 hover:underline">
                        {website}
                      </a>
                    ) : (
                      "Không có liên kết"
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Section 2: Interactive Map & Coordinates (Read-only) */}
          <div className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200/80 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <MapPin className="w-4 h-4 text-emerald-700" />
                <span>2. Vị trí trên bản đồ &amp; Tọa độ GPS</span>
              </h3>
              <span className="text-[11px] text-slate-400 font-mono">
                Lat: {lat} | Lng: {lng}
              </span>
            </div>

            <div className="relative rounded-2xl overflow-hidden border border-slate-200 bg-slate-100 h-64 sm:h-72 w-full shadow-inner">
              <div ref={mapContainerRef} className="w-full h-full" />

              <div className="absolute bottom-3 left-3 bg-slate-900/85 backdrop-blur-md text-white text-[11px] font-mono px-3 py-1.5 rounded-xl flex items-center gap-2 shadow-lg border border-slate-700 z-10">
                <MapPin className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <span>Lat: {lat} | Lng: {lng}</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 pt-1">
              <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200">
                <span className="block text-[10px] text-slate-400 font-medium">Vĩ độ (Latitude)</span>
                <span className="font-mono text-xs font-bold text-slate-800">{lat}</span>
              </div>
              <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200">
                <span className="block text-[10px] text-slate-400 font-medium">Kinh độ (Longitude)</span>
                <span className="font-mono text-xs font-bold text-slate-800">{lng}</span>
              </div>
            </div>
          </div>

          {/* Section 3: Operating Hours, Price & Description (Read-only) */}
          <div className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200/80 shadow-xs space-y-5">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-3">
              <Clock className="w-4 h-4 text-emerald-700" />
              <span>3. Giờ hoạt động, Chi phí &amp; Mô tả</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
                <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-emerald-700" />
                  Giờ mở cửa
                </span>
                <div className="text-xs font-bold text-slate-900 bg-white p-2.5 rounded-xl border border-slate-200/80">
                  {is24Hours ? "Mở cửa liên tục 24/7" : `${openTime} – ${closeTime}`}
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
                <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                  <DollarSign className="w-3.5 h-3.5 text-emerald-700" />
                  Khung giá đề xuất
                </span>
                <div className="text-xs font-bold text-slate-900 bg-white p-2.5 rounded-xl border border-slate-200/80">
                  {isFree
                    ? "Miễn phí vé vào cổng"
                    : `${parseInt(minPrice || "0", 10).toLocaleString("vi-VN")} đ – ${parseInt(maxPrice || "0", 10).toLocaleString("vi-VN")} đ`}
                </div>
              </div>
            </div>

            {contributorNote && (
              <div className="p-4 rounded-2xl bg-amber-50/70 border border-amber-200 space-y-1">
                <span className="text-xs font-bold text-amber-900 flex items-center gap-1.5">
                  <MessageSquare size={13} className="text-amber-700" />
                  Ghi chú từ người gửi:
                </span>
                <p className="text-xs text-amber-800 leading-relaxed italic">{contributorNote}</p>
              </div>
            )}

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Mô tả chi tiết địa điểm:
              </label>
              <div className="w-full p-4 rounded-2xl bg-slate-50 border border-slate-200 text-xs text-slate-800 leading-relaxed">
                {description || "Chưa có mô tả chi tiết."}
              </div>
            </div>
          </div>

          {/* Section 4: Image Gallery Only (NO upload / dropzone, NO delete/cover button) */}
          <div className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200/80 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <ImageIcon className="w-4 h-4 text-emerald-700" />
                <span>4. Hình ảnh do người dùng đính kèm ({images.length})</span>
              </h3>
              <span className="text-[11px] text-slate-400">
                Nhấn vào ảnh để xem ở khung xem trước
              </span>
            </div>

            {images.length > 0 ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {images.map((img, idx) => (
                  <div
                    key={idx}
                    onClick={() => setActivePreviewImgIndex(idx)}
                    className={`relative aspect-4/3 rounded-2xl overflow-hidden bg-slate-100 border transition-all cursor-pointer group shadow-2xs ${activePreviewImgIndex === idx
                      ? "border-emerald-600 ring-2 ring-emerald-500/30"
                      : "border-slate-200 hover:border-slate-300"
                      }`}
                  >
                    <img
                      src={img}
                      alt={`Ảnh đề xuất ${idx + 1}`}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    {idx === 0 ? (
                      <span className="absolute top-2 left-2 px-2 py-0.5 rounded-md bg-emerald-800/90 backdrop-blur-xs text-white text-[10px] font-bold shadow-xs">
                        Ảnh bìa chính
                      </span>
                    ) : (
                      <span className="absolute top-2 left-2 px-1.5 py-0.5 rounded-md bg-slate-900/60 backdrop-blur-xs text-white text-[10px] font-medium">
                        #{idx + 1}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-8 rounded-2xl bg-slate-50 border border-dashed border-slate-200 text-center text-xs text-slate-400">
                Người dùng không đính kèm hình ảnh nào trong đề xuất này.
              </div>
            )}
          </div>

          {/* Moderation Actions (Đơn giản, gọn gàng, chuẩn Admin) */}
          <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-2xs space-y-4">
            {status === 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {/* 1. KHUNG CHẤP NHẬN & DUYỆT */}
                <div className="space-y-2.5">
                  <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                    <Check size={14} className="text-emerald-600" />
                    <span>Ghi chú phê duyệt:</span>
                  </label>
                  <textarea
                    rows={3}
                    value={adminNotesInput}
                    onChange={(e) => setAdminNotesInput(e.target.value)}
                    placeholder="Nhập ghi chú duyệt..."
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 placeholder-slate-400 outline-none focus:border-emerald-600 focus:bg-white transition-all font-medium"
                  />
                  <button
                    type="button"
                    disabled={isApproving || isRejecting}
                    onClick={handleApproveSubmit}
                    className="w-full py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-2xs transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
                  >
                    {isApproving ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} strokeWidth={2.5} />}
                    <span>Chấp nhận</span>
                  </button>
                </div>

                {/* 2. KHUNG TỪ CHỐI ĐỀ XUẤT */}
                <div className="space-y-2.5">
                  <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                    <X size={14} className="text-rose-600" />
                    <span>Lý do từ chối:</span>
                  </label>
                  <textarea
                    rows={3}
                    value={rejectReasonInput}
                    onChange={(e) => setRejectReasonInput(e.target.value)}
                    placeholder="Nhập lý do từ chối cụ thể..."
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 placeholder-slate-400 outline-none focus:border-rose-600 focus:bg-white transition-all font-medium"
                  />
                  <button
                    type="button"
                    disabled={isApproving || isRejecting}
                    onClick={handleRejectSubmit}
                    className="w-full py-2.5 px-4 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-xl shadow-2xs transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
                  >
                    {isRejecting ? <Loader2 size={14} className="animate-spin" /> : <X size={14} strokeWidth={2.5} />}
                    <span>Từ chối</span>
                  </button>
                </div>
              </div>
            ) : status === 1 ? (
              /* Đã duyệt */
              <div className="p-4 bg-emerald-50/70 border border-emerald-200 rounded-xl space-y-2">
                <div className="flex items-center gap-2 text-emerald-900 font-bold text-xs">
                  <CheckCircle2 size={16} className="text-emerald-600 shrink-0" />
                  <span>Đề xuất này đã được phê duyệt</span>
                </div>
                {adminNotes || rejectionReason ? (
                  <div className="text-xs text-slate-700 pl-6 space-y-1">
                    <span className="font-semibold text-slate-500 text-[11px] block">Lý do / Ghi chú chấp nhận:</span>
                    <p className="text-slate-800 bg-white p-2.5 rounded-lg border border-emerald-200/60 font-medium">
                      {adminNotes || rejectionReason}
                    </p>
                  </div>
                ) : (
                  <p className="text-[11px] text-emerald-700 pl-6 font-medium">Không có ghi chú thêm.</p>
                )}
              </div>
            ) : (
              /* Đã từ chối */
              <div className="p-4 bg-rose-50/70 border border-rose-200 rounded-xl space-y-2">
                <div className="flex items-center gap-2 text-rose-900 font-bold text-xs">
                  <AlertTriangle size={16} className="text-rose-600 shrink-0" />
                  <span>Đề xuất này đã bị từ chối</span>
                </div>
                {rejectionReason || adminNotes ? (
                  <div className="text-xs text-slate-700 pl-6 space-y-1">
                    <span className="font-semibold text-slate-500 text-[11px] block">Lý do từ chối:</span>
                    <p className="text-slate-800 bg-white p-2.5 rounded-lg border border-rose-200/60 font-medium">
                      {rejectionReason || adminNotes}
                    </p>
                  </div>
                ) : (
                  <p className="text-[11px] text-rose-700 pl-6 font-medium">Không có lý do cụ thể được ghi lại.</p>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Right Column (4 cols): Live Discovery Preview Card & Contributor Profile */}
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

            {/* Discovery Card Replica */}
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
                  {description.trim() || "Mô tả về địa điểm..."}
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

          {/* Contributor Profile & Moderation Guidelines */}
          <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs space-y-4">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-3">
              <User className="w-4 h-4 text-emerald-700" />
              <span>Hồ sơ người đóng góp</span>
            </h3>

            <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-2xl border border-slate-200/80">
              {proposer.avatarUrl ? (
                <img
                  src={proposer.avatarUrl}
                  className="w-10 h-10 rounded-full object-cover border border-slate-200"
                  alt=""
                />
              ) : (
                <div className="w-10 h-10 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold text-sm">
                  {(proposer.name || proposal.proposedBy || "U").charAt(0).toUpperCase()}
                </div>
              )}
              <div className="overflow-hidden">
                <div className="font-bold text-slate-900 truncate">{proposer.name || proposal.proposedBy}</div>
                {proposer.email && (
                  <div className="text-[11px] text-slate-500 truncate">{proposer.email}</div>
                )}
                <div className="text-[10px] text-slate-400 mt-0.5">
                  Đã gửi: {proposal.submittedAt ? new Date(proposal.submittedAt).toLocaleString("vi-VN") : "Gần đây"}
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
    </div>
  );
};

export default ProposalDetailEditor;
