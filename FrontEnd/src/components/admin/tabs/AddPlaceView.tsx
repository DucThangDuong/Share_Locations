import React, { useState, useEffect, useRef, useMemo } from "react";
import {
  MapPin,
  Clock,
  DollarSign,
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
  Loader2,
  X,
} from "lucide-react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import { geographyService } from "@/services/geographyService";
import { placeService } from "@/services/placeService";
import { adminService, extractList } from "@/services/adminService";
import { mapboxService, type AddressSuggestion } from "@/services/mapboxService";
import type { ProvinceDto } from "@/types/models/geography.model";

interface ProposalImageItem {
  id: string;
  url: string;
  file?: File;
}

interface AddPlaceViewProps {
  onBack: () => void;
  onPlaceCreated?: (newPlace: any) => void;
  showToast?: (msg: string) => void;
}

export const AddPlaceView: React.FC<AddPlaceViewProps> = ({
  onBack,
  onPlaceCreated,
  showToast,
}) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const [categories, setCategories] = useState<{ id: number; name: string }[]>([]);
  const [provinces, setProvinces] = useState<ProvinceDto[]>([]);

  const [name, setName] = useState("");
  const [categoryId, setCategoryId] = useState<number>(1);
  const [provinceId, setProvinceId] = useState<number>(1);
  const [address, setAddress] = useState("");
  const [phone, setPhone] = useState("");
  const [website, setWebsite] = useState("");
  const [autoApprove, setAutoApprove] = useState(true);

  const [addressSuggestions, setAddressSuggestions] = useState<AddressSuggestion[]>([]);
  const [isSearchingAddress, setIsSearchingAddress] = useState(false);
  const [isSuggestionsOpen, setIsSuggestionsOpen] = useState(false);
  const [isReverseGeocoding, setIsReverseGeocoding] = useState(false);

  const [lat, setLat] = useState("21.028500");
  const [lng, setLng] = useState("105.854200");
  const [isLocating, setIsLocating] = useState(false);

  const [openTime, setOpenTime] = useState("07:30");
  const [closeTime, setCloseTime] = useState("22:00");
  const [is24Hours, setIs24Hours] = useState(false);
  const [isFree, setIsFree] = useState(false);
  const [minPrice, setMinPrice] = useState("35000");
  const [maxPrice, setMaxPrice] = useState("120000");
  const [description, setDescription] = useState("");

  const [imageItems, setImageItems] = useState<ProposalImageItem[]>([]);
  const images = useMemo(() => imageItems.map((item) => item.url), [imageItems]);
  const [activePreviewImgIndex, setActivePreviewImgIndex] = useState(0);
  const [isDragging, setIsDragging] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<mapboxgl.Map | null>(null);
  const markerRef = useRef<mapboxgl.Marker | null>(null);
  const addressContainerRef = useRef<HTMLDivElement>(null);
  const searchDebounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const searchAbortControllerRef = useRef<AbortController | null>(null);
  const reverseAbortControllerRef = useRef<AbortController | null>(null);

  const mapboxToken =
    (import.meta.env.VITE_MAPBOX_ACCESS_TOKEN as string | undefined)?.trim() ||
    "pk.eyJ1IjoibGFuZ3RoYW5nLXZuIiwiYSI6ImNtODFhYmNkZTAxMzAya3B0eGZjcHB0ZmoifQ.placeholder";

  useEffect(() => {
    let isMounted = true;
    const loadMetadata = async () => {
      try {
        const [catRes, provRes, filterRes] = await Promise.allSettled([
          adminService.getCatalogCategories({ pageSize: 100 }),
          geographyService.getProvinces(),
          placeService.getFilterOptions(),
        ]);

        if (isMounted) {
          const catMap = new Map<number, { id: number; name: string }>();

          if (catRes.status === "fulfilled") {
            const list = extractList<any>(catRes.value?.data || catRes.value);
            list.forEach((c: any) => {
              if (c?.id && c?.name) {
                catMap.set(Number(c.id), { id: Number(c.id), name: c.name });
              }
            });
          }

          if (filterRes.status === "fulfilled") {
            const fCats = filterRes.value?.data?.categories || (filterRes.value as any)?.categories || [];
            if (Array.isArray(fCats)) {
              fCats.forEach((c: any) => {
                if (c?.id && c?.name && !catMap.has(Number(c.id))) {
                  catMap.set(Number(c.id), { id: Number(c.id), name: c.name });
                }
              });
            }
          }

          const catList = Array.from(catMap.values());
          if (catList.length > 0) {
            setCategories(catList);
            setCategoryId((prev) => (prev ? prev : catList[0].id));
          }

          if (provRes.status === "fulfilled") {
            const provList = extractList<ProvinceDto>(provRes.value?.data || provRes.value);
            if (provList.length > 0) {
              setProvinces(provList);
              setProvinceId((prev) => (prev ? prev : provList[0].id));
            }
          }
        }
      } catch (err) {
        console.error("Error loading add place metadata:", err);
      }
    };
    loadMetadata();
    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        addressContainerRef.current &&
        !addressContainerRef.current.contains(event.target as Node)
      ) {
        setIsSuggestionsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const handleReverseGeocode = async (targetLng: number, targetLat: number) => {
    if (reverseAbortControllerRef.current) {
      reverseAbortControllerRef.current.abort();
    }
    const controller = new AbortController();
    reverseAbortControllerRef.current = controller;

    setIsReverseGeocoding(true);
    try {
      const result = await mapboxService.reverseGeocode(targetLng, targetLat, mapboxToken, {
        signal: controller.signal,
      });
      if (result && result.fullAddress) {
        setAddress(result.fullAddress);
        const matchedProvId = mapboxService.findMatchingProvinceId(result.fullAddress, provinces);
        if (matchedProvId) {
          setProvinceId(matchedProvId);
        }
      }
    } catch {
    } finally {
      setIsReverseGeocoding(false);
    }
  };

  useEffect(() => {
    if (!mapContainerRef.current) return;

    let map: mapboxgl.Map | null = null;
    let marker: mapboxgl.Marker | null = null;

    try {
      mapboxgl.accessToken = mapboxToken;

      const parsedLat = parseFloat(lat) || 21.0285;
      const parsedLng = parseFloat(lng) || 105.8542;

      map = new mapboxgl.Map({
        container: mapContainerRef.current,
        style: "mapbox://styles/mapbox/streets-v12",
        center: [parsedLng, parsedLat],
        zoom: 13,
      });

      map.addControl(new mapboxgl.NavigationControl({ showCompass: false }), "top-right");

      marker = new mapboxgl.Marker({ draggable: true, color: "#047857" })
        .setLngLat([parsedLng, parsedLat])
        .addTo(map);

      marker.on("dragend", () => {
        if (!marker) return;
        const lngLat = marker.getLngLat();
        const newLng = lngLat.lng.toFixed(6);
        const newLat = lngLat.lat.toFixed(6);
        setLng(newLng);
        setLat(newLat);
        handleReverseGeocode(lngLat.lng, lngLat.lat);
      });

      map.on("click", (e) => {
        const newLng = e.lngLat.lng.toFixed(6);
        const newLat = e.lngLat.lat.toFixed(6);
        setLng(newLng);
        setLat(newLat);
        if (marker) marker.setLngLat([e.lngLat.lng, e.lngLat.lat]);
        handleReverseGeocode(e.lngLat.lng, e.lngLat.lat);
      });

      mapInstanceRef.current = map;
      markerRef.current = marker;

      setTimeout(() => {
        map?.resize();
      }, 200);
    } catch {
    }

    return () => {
      marker?.remove();
      map?.remove();
      mapInstanceRef.current = null;
      markerRef.current = null;
    };
  }, []);

  const updateMapPosition = (newLatStr: string, newLngStr: string, zoomLevel?: number) => {
    const pLat = parseFloat(newLatStr);
    const pLng = parseFloat(newLngStr);
    if (isNaN(pLat) || isNaN(pLng)) return;

    if (markerRef.current) {
      markerRef.current.setLngLat([pLng, pLat]);
    }
    if (mapInstanceRef.current) {
      mapInstanceRef.current.flyTo({
        center: [pLng, pLat],
        zoom: zoomLevel ?? mapInstanceRef.current.getZoom(),
        duration: 800,
      });
    }
  };

  const handleAddressChange = (newVal: string) => {
    setAddress(newVal);

    if (searchDebounceTimerRef.current) {
      clearTimeout(searchDebounceTimerRef.current);
    }

    const query = newVal.trim();
    if (query.length < 2) {
      setAddressSuggestions([]);
      setIsSuggestionsOpen(false);
      setIsSearchingAddress(false);
      return;
    }

    setIsSearchingAddress(true);
    searchDebounceTimerRef.current = setTimeout(async () => {
      if (searchAbortControllerRef.current) {
        searchAbortControllerRef.current.abort();
      }
      const controller = new AbortController();
      searchAbortControllerRef.current = controller;

      try {
        const pLat = parseFloat(lat);
        const pLng = parseFloat(lng);
        const proximity =
          !isNaN(pLat) && !isNaN(pLng) ? ([pLng, pLat] as [number, number]) : undefined;

        const suggestions = await mapboxService.searchAddress(
          query,
          mapboxToken,
          {
            proximity,
            signal: controller.signal,
          }
        );

        setAddressSuggestions(suggestions);
        setIsSuggestionsOpen(suggestions.length > 0);
      } catch {
      } finally {
        setIsSearchingAddress(false);
      }
    }, 280);
  };

  const handleSelectAddressSuggestion = (item: AddressSuggestion) => {
    setAddress(item.fullAddress || item.title);
    setIsSuggestionsOpen(false);

    if (item.center && item.center.length >= 2) {
      const [newLng, newLat] = item.center;
      const latStr = newLat.toFixed(6);
      const lngStr = newLng.toFixed(6);
      setLat(latStr);
      setLng(lngStr);
      updateMapPosition(latStr, lngStr, 15);
    }

    const matchedProvId = mapboxService.findMatchingProvinceId(
      `${item.title} ${item.fullAddress}`,
      provinces
    );
    if (matchedProvId) {
      setProvinceId(matchedProvId);
    }
  };

  const handleGetGPSLocation = () => {
    if (!navigator.geolocation) {
      setErrorMsg("Trình duyệt không hỗ trợ định vị GPS.");
      return;
    }

    setIsLocating(true);
    setErrorMsg("");

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setIsLocating(false);
        const currentLat = pos.coords.latitude.toFixed(6);
        const currentLng = pos.coords.longitude.toFixed(6);
        setLat(currentLat);
        setLng(currentLng);
        updateMapPosition(currentLat, currentLng, 15);
        handleReverseGeocode(pos.coords.longitude, pos.coords.latitude);
      },
      () => {
        setIsLocating(false);
        setErrorMsg("Không thể lấy vị trí hiện tại. Vui lòng cấp quyền truy cập vị trí trong trình duyệt.");
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  const handleFilesSelected = (files: FileList | File[]) => {
    const list = Array.from(files);
    if (list.length === 0) return;

    const newItems: ProposalImageItem[] = list.map((f, i) => ({
      id: `${Date.now()}-${i}`,
      url: URL.createObjectURL(f),
      file: f,
    }));

    setImageItems((prev) => [...prev, ...newItems]);
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      handleFilesSelected(e.target.files);
    }
  };

  const handleDropFiles = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files) {
      handleFilesSelected(e.dataTransfer.files);
    }
  };

  const handleRemoveImage = (index: number) => {
    setImageItems((prev) => {
      const removed = prev[index];
      if (removed && removed.url.startsWith("blob:")) {
        URL.revokeObjectURL(removed.url);
      }
      return prev.filter((_, idx) => idx !== index);
    });
    if (activePreviewImgIndex >= index && activePreviewImgIndex > 0) {
      setActivePreviewImgIndex((prev) => prev - 1);
    }
  };

  const handleSetPrimaryImage = (index: number) => {
    setImageItems((prev) => {
      const selected = prev[index];
      const others = prev.filter((_, idx) => idx !== index);
      return [selected, ...others];
    });
    setActivePreviewImgIndex(0);
  };

  const toBase64 = (file: File): Promise<string> =>
    new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = () => resolve("");
      reader.readAsDataURL(file);
    });

  const handleSubmit = async (e?: React.FormEvent | React.MouseEvent) => {
    if (e) {
      e.preventDefault();
    }
    setErrorMsg("");

    if (!name.trim()) {
      const msg = "Vui lòng nhập tên địa điểm.";
      setErrorMsg(msg);
      showToast?.(msg);
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }
    if (!provinceId || Number(provinceId) <= 0) {
      const msg = "Vui lòng chọn Tỉnh/Thành phố.";
      setErrorMsg(msg);
      showToast?.(msg);
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }
    if (!categoryId || Number(categoryId) <= 0) {
      const msg = "Vui lòng chọn Danh mục địa điểm.";
      setErrorMsg(msg);
      showToast?.(msg);
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }
    if (!address.trim()) {
      const msg = "Vui lòng nhập địa chỉ cụ thể của địa điểm.";
      setErrorMsg(msg);
      showToast?.(msg);
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }

    setIsSubmitting(true);

    try {
      const currentCat = categories.find((c) => c.id === categoryId);
      const currentProv = provinces.find((p) => p.id === provinceId);

      const allPhotos = (
        await Promise.all(
          imageItems.map(async (item) => {
            if (item.file) {
              return await toBase64(item.file);
            }
            if (item.url && !item.url.startsWith("blob:")) {
              return item.url;
            }
            return "";
          })
        )
      ).filter((photo) => Boolean(photo && photo.trim().length > 0));

      const primaryImageUrl = allPhotos[0] || null;

      const hoursFormatted = is24Hours ? "Mở cửa cả ngày (24/7)" : `${openTime} – ${closeTime}`;
      const priceFormatted = isFree
        ? "Miễn phí vé"
        : `${parseInt(minPrice || "0", 10).toLocaleString("vi-VN")}đ – ${parseInt(
          maxPrice || "0",
          10
        ).toLocaleString("vi-VN")}đ`;

      const parsedMinPrice = isFree ? 0 : parseInt(minPrice, 10) || 0;
      const parsedMaxPrice = isFree ? 0 : parseInt(maxPrice, 10) || 0;
      const parsedLat = parseFloat(lat) || 21.0285;
      const parsedLng = parseFloat(lng) || 105.8542;
      let formattedWebsite = website.trim();
      if (formattedWebsite && !formattedWebsite.startsWith("http://") && !formattedWebsite.startsWith("https://")) {
        formattedWebsite = `https://${formattedWebsite}`;
      }

      const jsonPayload: Record<string, any> = {
        name: name.trim(),
        provinceId: Number(provinceId),
        categoryId: Number(categoryId),
        address: address.trim(),
        description: description.trim() || undefined,
        openingHours: hoursFormatted,
        hours: hoursFormatted,
        phone: phone.trim() || undefined,
        website: formattedWebsite || undefined,
        minPrice: parsedMinPrice,
        maxPrice: parsedMaxPrice,
        latitude: parsedLat,
        longitude: parsedLng,
        primaryImageUrl: primaryImageUrl || undefined,
        photos: allPhotos.length > 0 ? allPhotos : undefined,
        autoApprove: autoApprove,
      };

      console.log("[AddPlaceView] Prepared JSON payload:", jsonPayload);

      let res: any;
      const hasRealFiles = imageItems.some((item) => Boolean(item.file));

      if (hasRealFiles) {
        const formData = new FormData();
        formData.append("name", name.trim());
        formData.append("provinceId", String(Number(provinceId)));
        formData.append("categoryId", String(Number(categoryId)));
        formData.append("address", address.trim());
        if (description.trim()) formData.append("description", description.trim());
        formData.append("hours", hoursFormatted);
        if (phone.trim()) formData.append("phone", phone.trim());
        if (formattedWebsite) formData.append("website", formattedWebsite);
        formData.append("minPrice", String(parsedMinPrice));
        formData.append("maxPrice", String(parsedMaxPrice));
        formData.append("latitude", String(parsedLat));
        formData.append("longitude", String(parsedLng));
        formData.append("autoApprove", String(autoApprove));

        let coverAttached = false;
        for (const item of imageItems) {
          if (item.file) {
            if (!coverAttached) {
              formData.append("coverImage", item.file);
              coverAttached = true;
            }
            formData.append("mediaFiles", item.file);
          } else if (item.url && !item.url.startsWith("blob:")) {
            if (!coverAttached) {
              formData.append("primaryImageUrl", item.url);
              coverAttached = true;
            }
            formData.append("photos", item.url);
          }
        }

        console.log("[AddPlaceView] Submitting create place as FormData (direct file attachments)...");
        try {
          res = await adminService.createPlace(formData);
        } catch (formErr: any) {
          if (formErr?.response?.status === 415) {
            console.warn("[AddPlaceView] 415 on FormData, falling back to JSON Base64...");
            res = await adminService.createPlace(jsonPayload);
          } else {
            throw formErr;
          }
        }
      } else {
        console.log("[AddPlaceView] Submitting create place as JSON (application/json):", jsonPayload);
        res = await adminService.createPlace(jsonPayload);
      }
      console.log("[AddPlaceView] Create place response:", res);

      const newPlaceId =
        typeof res === "number"
          ? res
          : (res?.data !== undefined && typeof res.data === "number")
            ? res.data
            : res?.data?.id ?? res?.id ?? Date.now();

      const createdPlace: Record<string, any> = {
        id: newPlaceId,
        ...jsonPayload,
        price: priceFormatted,
        priceLevel: priceFormatted,
        category: currentCat?.name || "Danh mục",
        categoryName: currentCat?.name || "Danh mục",
        province: currentProv?.name || "Việt Nam",
        provinceName: currentProv?.name || "Việt Nam",
        status: autoApprove ? "Công khai" : "Đang ẩn",
        statusNum: autoApprove ? 1 : 0,
        rating: 5.0,
        reviewsCount: 0,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      if (onPlaceCreated) {
        onPlaceCreated(createdPlace);
      }
      if (showToast) {
        showToast(`Đã tạo địa điểm "${createdPlace.name || name.trim()}" thành công.`);
      }

      onBack();
    } catch (err: any) {
      console.error("[AddPlaceView] Lỗi khi thêm địa điểm:", err);
      console.error("[AddPlaceView] Chi tiết lỗi 422 từ server:", err?.response?.data);

      let msg = "Có lỗi xảy ra khi tạo địa điểm. Vui lòng kiểm tra lại thông tin.";
      const errorData = err?.response?.data;

      if (errorData) {
        if (typeof errorData === "string") {
          msg = errorData;
        } else if (errorData.message && typeof errorData.message === "string") {
          msg = errorData.message;
        } else if (errorData.errors) {
          if (Array.isArray(errorData.errors)) {
            msg = errorData.errors
              .map((e: any) =>
                typeof e === "string"
                  ? e
                  : e?.message
                    ? `${e?.field ? e.field + ": " : ""}${e.message}`
                    : JSON.stringify(e)
              )
              .join("; ");
          } else if (typeof errorData.errors === "object") {
            const errorList: string[] = [];
            Object.entries(errorData.errors).forEach(([field, fieldErrors]: [string, any]) => {
              if (Array.isArray(fieldErrors)) {
                errorList.push(`${field}: ${fieldErrors.join(", ")}`);
              } else if (typeof fieldErrors === "string") {
                errorList.push(`${field}: ${fieldErrors}`);
              }
            });
            if (errorList.length > 0) {
              msg = errorList.join(" | ");
            }
          }
        } else if (errorData.title) {
          msg = errorData.title;
        }
      } else if (err?.message) {
        msg = err.message;
      }

      setErrorMsg(msg);
      if (showToast) {
        showToast(msg);
      }
      window.scrollTo({ top: 0, behavior: "smooth" });
    } finally {
      setIsSubmitting(false);
    }
  };

  const currentCategoryName = categories.find((c) => c.id === categoryId)?.name || "Danh mục";
  const currentProvinceName = provinces.find((p) => p.id === provinceId)?.name || "Tỉnh thành";

  return (
    <div className="space-y-6 pb-20 font-sans text-slate-900 animate-in fade-in duration-150">
      {/* Header Bar */}
      <div className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200/80 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onBack}
            className="p-2.5 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors cursor-pointer"
            title="Quay lại danh sách"
          >
            <ArrowLeft size={18} />
          </button>
          <div>
            <div className="flex items-center gap-2.5 flex-wrap">
              <h1 className="text-lg sm:text-xl font-black text-slate-900 tracking-tight">
                Thêm địa điểm
              </h1>
              <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-900 border border-emerald-300 flex items-center gap-1.5 shrink-0 shadow-2xs">
                <ShieldCheck size={13} className="text-emerald-700" />
                <span>Quyền Quản trị viên</span>
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Khởi tạo và công khai trực tiếp địa điểm lên hệ thống bản đồ LangThang
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onBack}
            className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5"
          >
            <span>Quay lại danh sách</span>
          </button>
        </div>
      </div>

      {errorMsg && (
        <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium flex items-center gap-2 animate-in fade-in">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left Column: Form Fields */}
          <div className="lg:col-span-8 space-y-6">
            {/* 1. Thông tin cơ bản */}
            <div className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200/80 shadow-xs space-y-5">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-3">
                <FileText className="w-4 h-4 text-emerald-700" />
                <span>1. Thông tin cơ bản</span>
              </h3>

              <div className="space-y-4">
                <div className="relative">
                  <label className="block text-xs font-bold text-slate-800 mb-1.5">
                    Tên địa điểm <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    placeholder="Ví dụ: Đồi Chè Cầu Đất, Cà phê Mây Lang Thang, Bánh Mì Phượng..."
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full px-4 py-3 rounded-2xl bg-slate-50/80 border border-slate-200 text-xs sm:text-sm text-slate-900 focus:outline-none focus:bg-white focus:border-emerald-700 transition-all font-medium"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-800 mb-1.5">
                      Danh mục <span className="text-rose-500">*</span>
                    </label>
                    <select
                      value={categoryId || ""}
                      onChange={(e) => setCategoryId(Number(e.target.value) || 0)}
                      className="w-full px-3.5 py-3 rounded-2xl bg-slate-50/80 border border-slate-200 text-xs font-medium text-slate-900 focus:outline-none focus:bg-white focus:border-emerald-700 cursor-pointer"
                    >
                      {categories.length === 0 && <option value="">Đang tải danh mục...</option>}
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
                      value={provinceId || ""}
                      onChange={(e) => setProvinceId(Number(e.target.value) || 0)}
                      className="w-full px-3.5 py-3 rounded-2xl bg-slate-50/80 border border-slate-200 text-xs font-medium text-slate-900 focus:outline-none focus:bg-white focus:border-emerald-700 cursor-pointer"
                    >
                      {provinces.length === 0 && <option value="">Đang tải tỉnh thành...</option>}
                      {provinces.map((prov) => (
                        <option key={prov.id} value={prov.id}>
                          {prov.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="relative" ref={addressContainerRef}>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="block text-xs font-bold text-slate-800">
                      Địa chỉ chi tiết <span className="text-rose-500">*</span>
                    </label>
                    {isReverseGeocoding && (
                      <span className="text-[11px] font-semibold text-emerald-700 flex items-center gap-1.5 animate-pulse bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                        <Loader2 className="w-3 h-3 animate-spin" />
                        <span>Đang lấy địa chỉ từ bản đồ...</span>
                      </span>
                    )}
                  </div>

                  <div className="relative">
                    <input
                      type="text"
                      placeholder="Nhập tên đường, địa danh để tìm kiếm gợi ý Mapbox..."
                      value={address}
                      onChange={(e) => handleAddressChange(e.target.value)}
                      onFocus={() => {
                        if (addressSuggestions.length > 0) {
                          setIsSuggestionsOpen(true);
                        }
                      }}
                      className="w-full pl-9 pr-10 py-3 rounded-2xl bg-slate-50/80 border border-slate-200 text-xs text-slate-900 focus:outline-none focus:bg-white focus:border-emerald-700 focus:ring-2 focus:ring-emerald-700/15 transition-all font-medium"
                    />
                    <MapPin className="w-4 h-4 text-emerald-700 absolute left-3 top-3.5 pointer-events-none" />

                    <div className="absolute right-3 top-3 flex items-center gap-1.5">
                      {isSearchingAddress ? (
                        <Loader2 className="w-4 h-4 text-emerald-600 animate-spin" />
                      ) : address ? (
                        <button
                          type="button"
                          onClick={() => {
                            setAddress("");
                            setAddressSuggestions([]);
                            setIsSuggestionsOpen(false);
                          }}
                          className="text-slate-400 hover:text-slate-700 p-0.5 rounded-full hover:bg-slate-200/70 transition-colors cursor-pointer"
                          title="Xóa địa chỉ"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      ) : null}
                    </div>
                  </div>

                  {isSuggestionsOpen && addressSuggestions.length > 0 && (
                    <div className="absolute top-full left-0 right-0 mt-1.5 z-50 bg-white rounded-2xl shadow-xl border border-slate-200/90 overflow-hidden divide-y divide-slate-100 max-h-72 overflow-y-auto animate-in fade-in zoom-in-95 duration-150">
                      {addressSuggestions.map((item) => (
                        <button
                          key={item.id}
                          type="button"
                          onClick={() => handleSelectAddressSuggestion(item)}
                          className="w-full px-3.5 py-2.5 text-left hover:bg-emerald-50/80 transition-colors flex items-start gap-2.5 cursor-pointer group"
                        >
                          <div className="w-6 h-6 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0 mt-0.5 group-hover:bg-emerald-700 group-hover:text-white transition-colors">
                            <MapPin className="w-3.5 h-3.5" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="text-xs font-bold text-slate-800 group-hover:text-emerald-950 truncate">
                              {item.title}
                            </div>
                            <div className="text-[11px] text-slate-500 group-hover:text-emerald-800/80 line-clamp-1">
                              {item.fullAddress}
                            </div>
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-800 mb-1.5">
                      Số điện thoại liên hệ
                    </label>
                    <input
                      type="text"
                      placeholder="Ví dụ: 0263 3838 123"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="w-full px-4 py-3 rounded-2xl bg-slate-50/80 border border-slate-200 text-xs text-slate-900 focus:outline-none focus:bg-white focus:border-emerald-700"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-800 mb-1.5">
                      Website / Fanpage
                    </label>
                    <input
                      type="text"
                      placeholder="https://facebook.com/..."
                      value={website}
                      onChange={(e) => setWebsite(e.target.value)}
                      className="w-full px-4 py-3 rounded-2xl bg-slate-50/80 border border-slate-200 text-xs text-slate-900 focus:outline-none focus:bg-white focus:border-emerald-700"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* 2. Thông tin vị trí */}
            <div className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200/80 shadow-xs space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-emerald-700" />
                  <span>2. Thông tin vị trí</span>
                </h3>

                <button
                  type="button"
                  onClick={handleGetGPSLocation}
                  disabled={isLocating}
                  className="text-xs font-bold text-emerald-700 hover:text-emerald-800 transition-colors flex items-center gap-1.5 cursor-pointer disabled:opacity-50 self-start sm:self-auto bg-emerald-50 px-3 py-1.5 rounded-full border border-emerald-200/70"
                >
                  <Navigation className="w-3.5 h-3.5" />
                  <span>{isLocating ? "Đang lấy tọa độ GPS..." : "Lấy vị trí GPS hiện tại của tôi"}</span>
                </button>
              </div>

              <p className="text-xs text-slate-500">
                Click chuột vào bất kỳ điểm nào trên bản đồ hoặc kéo thả ghim màu xanh lá để tự động cập nhật tọa độ và địa chỉ chi tiết.
              </p>

              <div className="relative rounded-2xl overflow-hidden border border-slate-200 bg-slate-100 h-72 sm:h-80 w-full shadow-inner">
                <div ref={mapContainerRef} className="w-full h-full" />

                {isReverseGeocoding && (
                  <div className="absolute top-3 left-3 bg-emerald-950/85 backdrop-blur-md text-emerald-200 text-[11px] font-medium px-3 py-1.5 rounded-xl flex items-center gap-2 shadow-lg border border-emerald-800 animate-in fade-in">
                    <Loader2 className="w-3.5 h-3.5 animate-spin text-emerald-400" />
                    <span>Đang xác định địa chỉ từ điểm chọn trên bản đồ...</span>
                  </div>
                )}

                <div className="absolute bottom-3 left-3 bg-slate-900/85 backdrop-blur-md text-white text-[11px] font-mono px-3 py-1.5 rounded-xl flex items-center gap-2 shadow-lg border border-slate-700">
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
                    className="w-full p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-mono text-slate-800 focus:outline-none focus:bg-white focus:border-emerald-700"
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
                    className="w-full p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-mono text-slate-800 focus:outline-none focus:bg-white focus:border-emerald-700"
                  />
                </div>
              </div>
            </div>

            {/* 3. Thời gian & Giá cả */}
            <div className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200/80 shadow-xs space-y-5">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-3">
                <Clock className="w-4 h-4 text-emerald-700" />
                <span>3. Thời gian &amp; Giá cả</span>
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
                          className="w-full p-2 mt-1 rounded-xl bg-white border border-slate-200 text-xs text-slate-900 focus:outline-none focus:border-emerald-700"
                        />
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-500 font-medium">Đóng cửa</span>
                        <input
                          type="time"
                          value={closeTime}
                          onChange={(e) => setCloseTime(e.target.value)}
                          className="w-full p-2 mt-1 rounded-xl bg-white border border-slate-200 text-xs text-slate-900 focus:outline-none focus:border-emerald-700"
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
                      Giá vé / Chi phí (VNĐ)
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
                          className="w-full p-2 mt-1 rounded-xl bg-white border border-slate-200 text-xs text-slate-900 focus:outline-none focus:border-emerald-700"
                        />
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-500 font-medium">Giá tối đa</span>
                        <input
                          type="number"
                          value={maxPrice}
                          onChange={(e) => setMaxPrice(e.target.value)}
                          placeholder="120000"
                          className="w-full p-2 mt-1 rounded-xl bg-white border border-slate-200 text-xs text-slate-900 focus:outline-none focus:border-emerald-700"
                        />
                      </div>
                    </div>
                  ) : (
                    <div className="text-xs text-emerald-800 bg-emerald-50 p-2.5 rounded-xl font-medium">
                      Địa điểm không thu phí vé vào cửa.
                    </div>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1.5">
                  Mô tả <span className="text-rose-500">*</span>
                </label>
                <textarea
                  rows={4}
                  placeholder="Chia sẻ lý do nơi này đặc biệt, món ăn nên thử, góc chụp ảnh đẹp hoặc thời điểm lý tưởng để ghé thăm..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full p-3.5 rounded-2xl bg-slate-50/80 border border-slate-200 text-xs sm:text-sm text-slate-900 focus:outline-none focus:bg-white focus:border-emerald-700 leading-relaxed"
                />
              </div>
            </div>

            {/* 4. Hình ảnh địa điểm */}
            <div className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200/80 shadow-xs space-y-4">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-3">
                <ImageIcon className="w-4 h-4 text-emerald-700" />
                <span>4. Hình ảnh địa điểm thực tế <span className="text-rose-500">*</span></span>
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
                className={`p-6 border-2 border-dashed rounded-2xl text-center cursor-pointer transition-all flex flex-col items-center justify-center gap-2.5 ${isDragging
                  ? "border-emerald-600 bg-emerald-50/80 text-emerald-800 ring-2 ring-emerald-500/30"
                  : "border-slate-300 hover:border-emerald-600 hover:bg-slate-50 text-slate-600"
                  }`}
              >
                <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-700 flex items-center justify-center shadow-xs">
                  <UploadCloud className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-xs sm:text-sm font-bold text-slate-800">
                    Tải ảnh từ thiết bị (Click hoặc kéo thả ảnh vào đây)
                  </p>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    Hỗ trợ định dạng JPG, PNG, WEBP, JPEG
                  </p>
                </div>
              </div>

              <div className="space-y-4 pt-2">
                <div>
                  <span className="text-xs font-bold text-slate-700 mb-2 block">
                    Danh sách ảnh ({images.length})
                  </span>
                  {images.length > 0 ? (
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                      {images.map((img, idx) => (
                        <div
                          key={idx}
                          className="relative aspect-4/3 rounded-2xl overflow-hidden bg-slate-100 border border-slate-200 group"
                        >
                          <img
                            src={img}
                            alt={`Ảnh ${idx + 1}`}
                            className="w-full h-full object-cover"
                          />
                          {idx === 0 ? (
                            <span className="absolute top-2 left-2 px-2 py-0.5 rounded-md bg-emerald-800/90 text-white text-[10px] font-bold">
                              Ảnh bìa chính
                            </span>
                          ) : (
                            <button
                              type="button"
                              onClick={() => handleSetPrimaryImage(idx)}
                              className="absolute top-2 left-2 px-2 py-0.5 rounded-md bg-slate-900/75 hover:bg-emerald-700 text-white text-[10px] font-bold opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                              title="Đặt ảnh này làm ảnh bìa"
                            >
                              Đặt làm bìa
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => handleRemoveImage(idx)}
                            className="absolute top-2 right-2 p-1.5 rounded-full bg-black/60 hover:bg-rose-600 text-white transition-colors cursor-pointer opacity-0 group-hover:opacity-100"
                            title="Xóa ảnh này"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="p-4 rounded-2xl bg-slate-50 border border-dashed border-slate-200 text-center text-xs text-slate-400">
                      Chưa có ảnh nào được thêm. Vui lòng tải ít nhất 1 ảnh đại diện.
                    </div>
                  )}
                </div>
              </div>
            </div>


            {/* Bottom actions */}
            <div className="space-y-3">
              {errorMsg && (
                <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium flex items-center gap-2 animate-in fade-in">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{errorMsg}</span>
                </div>
              )}

              <div className="p-6 bg-white rounded-3xl border border-slate-200/80 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="flex items-center gap-2.5 cursor-pointer select-none text-xs text-slate-800 font-bold">
                    <input
                      type="checkbox"
                      checked={autoApprove}
                      onChange={(e) => setAutoApprove(e.target.checked)}
                      className="w-4 h-4 rounded text-emerald-700 focus:ring-emerald-700 cursor-pointer accent-emerald-700"
                    />
                    <span>Tự động duyệt và công khai lên hệ thống (autoApprove)</span>
                  </label>
                  <p className="text-[11px] text-slate-500">
                    {autoApprove
                      ? "Địa điểm sẽ được hiển thị công khai ngay lập tức trên bản đồ và ứng dụng du khách."
                      : "Địa điểm sẽ được lưu ở trạng thái chờ duyệt / ẩn nội bộ."}
                  </p>
                </div>

                <div className="flex items-center gap-3 w-full sm:w-auto">
                  <button
                    type="submit"
                    onClick={(e) => handleSubmit(e)}
                    disabled={isSubmitting}
                    className="w-full sm:w-auto px-8 py-3 rounded-2xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs sm:text-sm font-bold flex items-center justify-center gap-2 cursor-pointer transition-all shadow-md active-press disabled:opacity-50 shrink-0"
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Đang lưu...</span>
                      </>
                    ) : (
                      <>
                        <Check className="w-4 h-4" />
                        <span>Thêm địa điểm</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Live Preview & Guidelines */}
          <div className="lg:col-span-4 space-y-6 sticky top-6">
            {/* Live Preview Card */}
            <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs space-y-4">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-3">
                <Eye className="w-4 h-4 text-emerald-700" />
                <span>Bản xem trước trực tiếp</span>
              </h3>

              <div className="group flex flex-col select-none bg-white rounded-2xl border border-slate-200/80 p-3 shadow-2xs space-y-3">
                {images.length > 0 ? (
                  <div className="relative aspect-square w-full rounded-xl overflow-hidden bg-slate-100">
                    <img
                      src={images[activePreviewImgIndex] || images[0]}
                      alt={name || "Bản xem trước"}
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
                    <span className="text-xs font-medium text-slate-500">Chưa có ảnh địa điểm</span>
                    <span className="text-[10px] text-slate-400">Tải ảnh lên để xem trước</span>
                  </div>
                )}

                <div className="space-y-2 pt-1">
                  <h4 className="font-bold text-[15px] sm:text-base text-slate-900 group-hover:text-emerald-900 transition-colors line-clamp-2 leading-snug tracking-tight">
                    {name.trim() || "Tên địa điểm mới"}
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
                      {isFree ? "Miễn phí" : `${parseInt(minPrice || "0", 10).toLocaleString("vi-VN")} đ`}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Guidelines */}
            <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs space-y-3.5">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-3">
                <ShieldCheck className="w-4 h-4 text-emerald-700" />
                <span>Quy chuẩn số hóa địa điểm</span>
              </h3>

              <ul className="space-y-2.5 text-xs text-slate-600">
                <li className="flex items-start gap-2">
                  <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                  <span>Địa điểm có thật, có vị trí ghim chính xác trên bản đồ vệ tinh.</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                  <span>Hình ảnh chụp thực tế chất lượng cao, không chứa logo chìm.</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                  <span>Cung cấp khoảng giá và khung giờ mở cửa chính xác.</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
};

export default AddPlaceView;
