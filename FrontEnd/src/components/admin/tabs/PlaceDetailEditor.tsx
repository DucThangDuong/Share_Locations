import React, { useState, useEffect, useRef, useMemo } from "react";
import {
  MapPin,
  Clock,
  DollarSign,
  CheckCircle2,
  Trash2,
  AlertCircle,
  Navigation,
  Eye,
  EyeOff,
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
  RotateCcw,
  MessageSquare,
} from "lucide-react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import { catalogService } from "@/services/catalogService";
import { geographyService } from "@/services/geographyService";
import { adminService } from "@/services/adminService";
import { PlaceAdminReviews } from "./PlaceAdminReviews";
import type { PlaceTypeDto } from "@/types/models/place.model";
import type { ProvinceDto } from "@/types/models/geography.model";

interface PlaceDetailEditorProps {
  place: any;
  onBack: () => void;
  onSave: (updatedPlace: any) => void;
  onToggleStatus?: (id: number) => void;
}

interface PlaceFormSnapshot {
  name: string;
  categoryId: number;
  provinceId: number;
  provinceName: string;
  address: string;
  phone: string;
  website: string;
  lat: string;
  lng: string;
  is24Hours: boolean;
  openTime: string;
  closeTime: string;
  isFree: boolean;
  minPrice: string;
  maxPrice: string;
  description: string;
  statusNum: number;
  images: string[];
  mediaItems: { id?: number; url: string }[];
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

const buildInitialSnapshot = (place: any): PlaceFormSnapshot => {
  const isVis =
    place?.status === 1 ||
    place?.status === "1" ||
    place?.statusNum === 1 ||
    String(place?.status || "").toLowerCase() === "active" ||
    String(place?.status || "").toLowerCase() === "approved" ||
    place?.status === "Đã duyệt";

  let catId = 1;
  if (place?.categoryId) {
    catId = place.categoryId;
  } else {
    const found = DEFAULT_CATEGORIES.find(
      (c) => c.name === place?.category || c.name === place?.categoryName
    );
    if (found) catId = found.id;
  }

  let provId = 1;
  if (place?.provinceId) {
    provId = place.provinceId;
  } else {
    const found = DEFAULT_PROVINCES.find((p) => p.name === place?.province);
    if (found) provId = found.id;
  }

  const provName = place?.province || "Đà Nẵng";
  const addr = place?.location || place?.address || "";
  const ph = place?.phone || "";
  const web = place?.website || "";

  let latVal = "16.054407";
  if (place?.latitude) latVal = String(place.latitude);
  else if (place?.lat) latVal = String(place.lat);

  let lngVal = "108.202167";
  if (place?.longitude) lngVal = String(place.longitude);
  else if (place?.lng) lngVal = String(place.lng);

  const h = (place?.hours || "").toLowerCase();
  const is24 = h.includes("24/7") || h.includes("24h") || h.includes("cả ngày");
  const openMatch = (place?.hours || "").match(/(\d{1,2}:\d{2})/);
  const openT = openMatch ? openMatch[1] : "07:00";
  const closeMatches = (place?.hours || "").match(/(\d{1,2}:\d{2})/g);
  const closeT = closeMatches && closeMatches.length > 1 ? closeMatches[1] : "22:00";

  const priceLower = (place?.price || "").toLowerCase();
  const freeVal = priceLower.includes("miễn phí") || (place?.minPrice === 0 && place?.maxPrice === 0);

  let minP = "35000";
  if (place?.minPrice !== undefined) {
    minP = String(place.minPrice);
  } else {
    const match = (place?.price || "").match(/\d+([.,]\d+)?/);
    if (match) {
      const numStr = match[0].replace(/[.,]/g, "");
      minP = numStr.length < 5 ? `${numStr}000` : numStr;
    }
  }

  let maxP = "75000";
  if (place?.maxPrice !== undefined) {
    maxP = String(place.maxPrice);
  } else {
    const matches = (place?.price || "").match(/\d+([.,]\d+)?/g);
    if (matches && matches.length > 1) {
      const numStr = matches[1].replace(/[.,]/g, "");
      maxP = numStr.length < 5 ? `${numStr}000` : numStr;
    }
  }

  const desc =
    place?.description ||
    place?.desc ||
    "Địa điểm ẩm thực và du lịch đặc sắc với không gian rộng rãi, chất lượng dịch vụ chuyên nghiệp và phong vị chuẩn địa phương.";

  let media: { id?: number; url: string }[] = [];
  if (Array.isArray(place?.media) && place.media.length > 0) {
    media = place.media.map((m: any) => ({ id: m.id, url: m.url || m.imageUrl || "" })).filter((m: any) => m.url);
  } else if (Array.isArray(place?.images) && place.images.length > 0) {
    media = place.images.map((img: any) => (typeof img === "string" ? { url: img } : { id: img.id, url: img.url || "" }));
  } else if (Array.isArray(place?.mediaUrls) && place.mediaUrls.length > 0) {
    media = place.mediaUrls.map((url: string) => ({ url }));
  } else {
    const fallbackCover = place?.coverImageUrl || place?.coverImg || place?.thumbnailUrl || place?.img || "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=800&h=600&fit=crop";
    media = [{ url: fallbackCover }];
  }

  let imgs: string[] = [];
  if (Array.isArray(place?.images) && place.images.length > 0) imgs = place.images;
  else if (Array.isArray(place?.mediaUrls) && place.mediaUrls.length > 0) imgs = place.mediaUrls;
  else if (place?.coverImageUrl) imgs = [place.coverImageUrl];
  else if (place?.img) imgs = [place.img];
  else if (place?.thumbnailUrl) imgs = [place.thumbnailUrl];
  else imgs = [
    "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=800&h=600&fit=crop",
    "https://images.unsplash.com/photo-1541544741938-0af808871cc0?w=800&h=600&fit=crop",
  ];

  return {
    name: place?.name || "",
    categoryId: catId,
    provinceId: provId,
    provinceName: provName,
    address: addr,
    phone: ph,
    website: web,
    lat: latVal,
    lng: lngVal,
    is24Hours: is24,
    openTime: openT,
    closeTime: closeT,
    isFree: freeVal,
    minPrice: minP,
    maxPrice: maxP,
    description: desc,
    statusNum: isVis ? 1 : 0,
    images: imgs,
    mediaItems: media,
  };
};

export const PlaceDetailEditor: React.FC<PlaceDetailEditorProps> = ({
  place,
  onBack,
  onSave,
  onToggleStatus,
}) => {
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccessMsg, setSaveSuccessMsg] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  const [categories, setCategories] = useState<PlaceTypeDto[]>(DEFAULT_CATEGORIES);
  const [provinces, setProvinces] = useState<ProvinceDto[]>(DEFAULT_PROVINCES);

  // Form Fields
  const [name, setName] = useState(place?.name || "");
  const [categoryId, setCategoryId] = useState<number>(() => {
    if (place?.categoryId) return place.categoryId;
    const found = DEFAULT_CATEGORIES.find(
      (c) => c.name === place?.category || c.name === place?.categoryName
    );
    return found ? found.id : 1;
  });

  const [provinceId, setProvinceId] = useState<number>(() => {
    if (place?.provinceId) return place.provinceId;
    const found = DEFAULT_PROVINCES.find((p) => p.name === place?.province);
    return found ? found.id : 1;
  });

  const [provinceName, setProvinceName] = useState(place?.province || "Đà Nẵng");
  const [address, setAddress] = useState(place?.location || place?.address || "");
  const [phone, setPhone] = useState(place?.phone || "");
  const [website, setWebsite] = useState(place?.website || "");

  // Coordinates
  const [lat, setLat] = useState<string>(() => {
    if (place?.latitude) return String(place.latitude);
    if (place?.lat) return String(place.lat);
    return "16.054407";
  });
  const [lng, setLng] = useState<string>(() => {
    if (place?.longitude) return String(place.longitude);
    if (place?.lng) return String(place.lng);
    return "108.202167";
  });
  const [isLocating, setIsLocating] = useState(false);

  // Operating Hours
  const [is24Hours, setIs24Hours] = useState(() => {
    const h = (place?.hours || "").toLowerCase();
    return h.includes("24/7") || h.includes("24h") || h.includes("cả ngày");
  });
  const [openTime, setOpenTime] = useState(() => {
    const h = place?.hours || "";
    const match = h.match(/(\d{1,2}:\d{2})/);
    return match ? match[1] : "07:00";
  });
  const [closeTime, setCloseTime] = useState(() => {
    const h = place?.hours || "";
    const matches = h.match(/(\d{1,2}:\d{2})/g);
    return matches && matches.length > 1 ? matches[1] : "22:00";
  });

  // Price
  const [isFree, setIsFree] = useState(() => {
    const p = (place?.price || "").toLowerCase();
    return p.includes("miễn phí") || place?.minPrice === 0 && place?.maxPrice === 0;
  });
  const [minPrice, setMinPrice] = useState(() => {
    if (place?.minPrice !== undefined) return String(place.minPrice);
    const p = place?.price || "";
    const match = p.match(/\d+([.,]\d+)?/);
    if (match) {
      const numStr = match[0].replace(/[.,]/g, "");
      return numStr.length < 5 ? `${numStr}000` : numStr;
    }
    return "35000";
  });
  const [maxPrice, setMaxPrice] = useState(() => {
    if (place?.maxPrice !== undefined) return String(place.maxPrice);
    const p = place?.price || "";
    const matches = p.match(/\d+([.,]\d+)?/g);
    if (matches && matches.length > 1) {
      const numStr = matches[1].replace(/[.,]/g, "");
      return numStr.length < 5 ? `${numStr}000` : numStr;
    }
    return "75000";
  });

  // Description
  const [description, setDescription] = useState(
    place?.description ||
    place?.desc ||
    "Địa điểm ẩm thực và du lịch đặc sắc với không gian rộng rãi, chất lượng dịch vụ chuyên nghiệp và phong vị chuẩn địa phương."
  );

  // Images & Media State
  const [mediaItems, setMediaItems] = useState<{ id?: number; url: string }[]>(() => {
    if (Array.isArray(place?.media) && place.media.length > 0) {
      return place.media.map((m: any) => ({ id: m.id, url: m.url || m.imageUrl || "" })).filter((m: any) => m.url);
    }
    if (Array.isArray(place?.images) && place.images.length > 0) {
      return place.images.map((img: any) => (typeof img === "string" ? { url: img } : { id: img.id, url: img.url || "" }));
    }
    if (Array.isArray(place?.mediaUrls) && place.mediaUrls.length > 0) {
      return place.mediaUrls.map((url: string) => ({ url }));
    }
    const fallbackCover = place?.coverImageUrl || place?.coverImg || place?.thumbnailUrl || place?.img || "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=800&h=600&fit=crop";
    return [{ url: fallbackCover }];
  });

  const [images, setImages] = useState<string[]>(() => {
    if (Array.isArray(place?.images) && place.images.length > 0) return place.images;
    if (Array.isArray(place?.mediaUrls) && place.mediaUrls.length > 0) return place.mediaUrls;
    if (place?.coverImageUrl) return [place.coverImageUrl];
    if (place?.img) return [place.img];
    if (place?.thumbnailUrl) return [place.thumbnailUrl];
    return [
      "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=800&h=600&fit=crop",
      "https://images.unsplash.com/photo-1541544741938-0af808871cc0?w=800&h=600&fit=crop",
    ];
  });
  const [activePreviewImgIndex, setActivePreviewImgIndex] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [isUploadingImages, setIsUploadingImages] = useState(false);
  const [isTogglingStatus, setIsTogglingStatus] = useState(false);

  // Moderation / Status fields (1: visible / active, 0: hidden / suspended)
  const [statusNum, setStatusNum] = useState<number>(() => {
    const isVis =
      place?.status === 1 ||
      place?.status === "1" ||
      place?.statusNum === 1 ||
      String(place?.status || "").toLowerCase() === "active" ||
      String(place?.status || "").toLowerCase() === "approved" ||
      place?.status === "Đã duyệt";
    return isVis ? 1 : 0;
  });
  const rating = place?.rating;

  // Active Editor Tab ('info' for place info/media, 'reviews' for reviews & comments management)
  const [activeEditorTab, setActiveEditorTab] = useState<"info" | "reviews">("info");
  const [reviewsCount, setReviewsCount] = useState<number>(
    place?.reviewCount || place?.reviewsCount || (Array.isArray(place?.reviews) ? place.reviews.length : 0)
  );

  // Initial snapshot to track dirty changes
  const [initialSnapshot, setInitialSnapshot] = useState<PlaceFormSnapshot>(() =>
    buildInitialSnapshot(place)
  );

  // Check if current form values differ from initialSnapshot
  const hasChanges = useMemo(() => {
    if (!initialSnapshot) return false;
    if (name.trim() !== initialSnapshot.name.trim()) return true;
    if (categoryId !== initialSnapshot.categoryId) return true;
    if (provinceId !== initialSnapshot.provinceId) return true;
    if (address.trim() !== initialSnapshot.address.trim()) return true;
    if (phone.trim() !== initialSnapshot.phone.trim()) return true;
    if (website.trim() !== initialSnapshot.website.trim()) return true;
    if (lat !== initialSnapshot.lat) return true;
    if (lng !== initialSnapshot.lng) return true;
    if (is24Hours !== initialSnapshot.is24Hours) return true;
    if (!is24Hours) {
      if (openTime !== initialSnapshot.openTime) return true;
      if (closeTime !== initialSnapshot.closeTime) return true;
    }
    if (isFree !== initialSnapshot.isFree) return true;
    if (!isFree) {
      if (minPrice !== initialSnapshot.minPrice) return true;
      if (maxPrice !== initialSnapshot.maxPrice) return true;
    }
    if (description.trim() !== initialSnapshot.description.trim()) return true;
    if (statusNum !== initialSnapshot.statusNum) return true;
    if (images.length !== initialSnapshot.images.length) return true;
    for (let i = 0; i < images.length; i++) {
      if (images[i] !== initialSnapshot.images[i]) return true;
    }
    return false;
  }, [
    initialSnapshot,
    name,
    categoryId,
    provinceId,
    address,
    phone,
    website,
    lat,
    lng,
    is24Hours,
    openTime,
    closeTime,
    isFree,
    minPrice,
    maxPrice,
    description,
    statusNum,
    images,
  ]);

  // Handle Cancel / Reset to initialSnapshot
  const handleCancel = () => {
    if (!initialSnapshot) return;
    setName(initialSnapshot.name);
    setCategoryId(initialSnapshot.categoryId);
    setProvinceId(initialSnapshot.provinceId);
    setProvinceName(initialSnapshot.provinceName);
    setAddress(initialSnapshot.address);
    setPhone(initialSnapshot.phone);
    setWebsite(initialSnapshot.website);
    setLat(initialSnapshot.lat);
    setLng(initialSnapshot.lng);
    updateMapPosition(initialSnapshot.lat, initialSnapshot.lng);
    setIs24Hours(initialSnapshot.is24Hours);
    setOpenTime(initialSnapshot.openTime);
    setCloseTime(initialSnapshot.closeTime);
    setIsFree(initialSnapshot.isFree);
    setMinPrice(initialSnapshot.minPrice);
    setMaxPrice(initialSnapshot.maxPrice);
    setDescription(initialSnapshot.description);
    setStatusNum(initialSnapshot.statusNum);
    setImages([...initialSnapshot.images]);
    setMediaItems([...initialSnapshot.mediaItems]);
    setActivePreviewImgIndex(0);
    setErrorMsg("");
    setSaveSuccessMsg("Đã khôi phục dữ liệu ban đầu!");
    setTimeout(() => setSaveSuccessMsg(""), 3000);
  };

  // Refs
  const fileInputRef = useRef<HTMLInputElement>(null);
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<mapboxgl.Map | null>(null);
  const markerRef = useRef<mapboxgl.Marker | null>(null);

  const mapboxToken =
    (import.meta.env.VITE_MAPBOX_ACCESS_TOKEN as string | undefined)?.trim() ||
    "pk.eyJ1IjoibGFuZ3RoYW5nLXZuIiwiYSI6ImNtODFhYmNkZTAxMzAya3B0eGZjcHB0ZmoifQ.placeholder";

  // Load fresh place data from API on open
  useEffect(() => {
    if (!place?.id) return;
    let mounted = true;
    const fetchFreshPlace = async () => {
      try {
        const res = await adminService.getPlace(place.id);
        const pData = (res as any)?.data || res;
        if (mounted && pData) {
          const isVis =
            pData.status === 1 ||
            pData.status === "1" ||
            pData.statusNum === 1 ||
            String(pData.status || "").toLowerCase() === "active" ||
            String(pData.status || "").toLowerCase() === "approved" ||
            pData.status === "Đã duyệt";
          setStatusNum(isVis ? 1 : 0);
          if (pData.name) setName(pData.name);

          const cover = pData.coverImageUrl || pData.coverImg || pData.thumbnailUrl || pData.img || "";
          let media: { id?: number; url: string }[] = [];

          if (Array.isArray(pData.media) && pData.media.length > 0) {
            media = pData.media.map((m: any) => ({
              id: m.id,
              url: m.url || m.imageUrl || "",
            })).filter((m: any) => m.url);
          } else if (Array.isArray(pData.images) && pData.images.length > 0) {
            media = pData.images.map((img: any) => (typeof img === "string" ? { url: img } : { id: img.id, url: img.url || "" }));
          } else if (Array.isArray(pData.mediaUrls) && pData.mediaUrls.length > 0) {
            media = pData.mediaUrls.map((url: string) => ({ url }));
          }

          if (cover && !media.some((m) => m.url === cover)) {
            media = [{ url: cover }, ...media];
          }

          if (media.length > 0) {
            setMediaItems(media);
            setImages(media.map((m) => m.url));
          } else if (cover) {
            setMediaItems([{ url: cover }]);
            setImages([cover]);
          }

          const freshSnapshot = buildInitialSnapshot({
            ...place,
            ...pData,
            statusNum: isVis ? 1 : 0,
            media: media.length > 0 ? media : undefined,
            images: media.length > 0 ? media.map((m) => m.url) : (cover ? [cover] : undefined),
          });
          setInitialSnapshot(freshSnapshot);
        }
      } catch {
        // fallback
      }
    };
    fetchFreshPlace();
    return () => {
      mounted = false;
    };
  }, [place?.id]);

  // Load Categories & Provinces from API with graceful fallback
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
      // Mapbox load error fallback
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

  // Helper to read file as data url for instant preview and persistent fallback
  const readFileAsDataUrl = (file: File): Promise<string> => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = () => {
        if (typeof reader.result === "string") {
          resolve(reader.result);
        } else {
          resolve(URL.createObjectURL(file));
        }
      };
      reader.onerror = () => {
        resolve(URL.createObjectURL(file));
      };
      reader.readAsDataURL(file);
    });
  };

  const handleUploadFiles = async (files: File[]) => {
    if (!files || files.length === 0) return;

    const localDataUrls = await Promise.all(files.map(readFileAsDataUrl));
    const newLocalMedia = localDataUrls.map((url) => ({ url }));

    setMediaItems((prev) => [...prev, ...newLocalMedia]);
    setImages((prev) => [...prev, ...localDataUrls]);

    setIsUploadingImages(true);
    setErrorMsg("");
    try {
      let newItems: { id?: number; url: string }[] = [];
      if (place?.id) {
        const res = await adminService.uploadPlaceMedia(place.id, files);
        if (Array.isArray(res) && res.length > 0) {
          newItems = res
            .map((m: any) => ({
              id: m.id,
              url: typeof m === "string" ? m : m.url || m.imageUrl || "",
            }))
            .filter((m) => m.url);
        }
      }

      if (newItems.length === 0) {
        const fallbackUrls = await adminService.uploadPlaceImages(files, place?.id);
        newItems = fallbackUrls.map((url) => ({ url }));
      }

      if (newItems.length > 0) {
        const localSet = new Set(localDataUrls);
        setMediaItems((prev) => {
          const kept = prev.filter((m) => !localSet.has(m.url));
          return [...kept, ...newItems];
        });
        setImages((prev) => {
          const kept = prev.filter((url) => !localSet.has(url));
          return [...kept, ...newItems.map((item) => item.url)];
        });
        setSaveSuccessMsg(`Đã tải lên thành công ${newItems.length} ảnh vào bộ sưu tập!`);
        setTimeout(() => setSaveSuccessMsg(""), 3500);
      }
    } catch (err: any) {
      console.warn("Backend upload place media failed, keeping local preview:", err);
      setErrorMsg(
        err?.message
          ? `Đã thêm ${files.length} ảnh vào xem trước. Lưu ý: Lỗi đồng bộ máy chủ (${err.message})`
          : `Đã thêm ${files.length} ảnh vào bộ sưu tập xem trước.`
      );
    } finally {
      setIsUploadingImages(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    const files = Array.from(e.target.files);
    e.target.value = "";
    handleUploadFiles(files);
  };

  const handleDropFiles = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (!e.dataTransfer.files || e.dataTransfer.files.length === 0) return;
    const files = Array.from(e.dataTransfer.files).filter(
      (f) => f.type.startsWith("image/") || /\.(jpe?g|png|webp|gif|bmp|svg|avif)$/i.test(f.name)
    );
    if (files.length > 0) {
      handleUploadFiles(files);
    }
  };

  // 3. Delete Media Endpoint: DELETE /api/admin/places/{id}/media/{mediaId}
  const handleRemoveImage = async (index: number) => {
    const itemToRemove = mediaItems[index];
    if (itemToRemove?.id && place?.id) {
      try {
        await adminService.deletePlaceMedia(place.id, itemToRemove.id);
      } catch (err) {
        console.warn("Lỗi khi xóa media trên Azure/Server:", err);
      }
    }
    setMediaItems((prev) => prev.filter((_, idx) => idx !== index));
    setImages((prev) => {
      const next = prev.filter((_, idx) => idx !== index);
      if (activePreviewImgIndex >= next.length) {
        setActivePreviewImgIndex(Math.max(0, next.length - 1));
      }
      return next;
    });
    setSaveSuccessMsg("Đã xóa ảnh khỏi địa điểm thành công!");
    setTimeout(() => setSaveSuccessMsg(""), 3000);
  };

  const handleSetCoverImage = (index: number) => {
    if (index === 0) return;
    setMediaItems((prev) => {
      const selected = prev[index];
      const others = prev.filter((_, idx) => idx !== index);
      return [selected, ...others];
    });
    setImages((prev) => {
      const selected = prev[index];
      const others = prev.filter((_, idx) => idx !== index);
      return [selected, ...others];
    });
    setActivePreviewImgIndex(0);
    setSaveSuccessMsg("Đã chọn làm ảnh bìa chính!");
    setTimeout(() => setSaveSuccessMsg(""), 3000);
  };

  const handleToggleStatusClick = async () => {
    if (!place?.id) return;
    setIsTogglingStatus(true);
    try {
      const nextStatusNum = statusNum === 1 ? 0 : 1;
      await adminService.updatePlaceStatus(place.id, nextStatusNum);
      if (onToggleStatus) {
        onToggleStatus(place.id);
      }
      setStatusNum(nextStatusNum);
      setSaveSuccessMsg(nextStatusNum === 1 ? "Đã công khai địa điểm thành công!" : "Đã ẩn địa điểm thành công!");
      setTimeout(() => setSaveSuccessMsg(""), 4000);
    } catch (err: any) {
      setErrorMsg(err?.message || "Không thể cập nhật trạng thái địa điểm.");
    } finally {
      setIsTogglingStatus(false);
    }
  };

  // Handle Save
  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");
    setSaveSuccessMsg("");

    if (!name.trim()) {
      setErrorMsg("Vui lòng nhập tên địa điểm.");
      return;
    }
    if (!address.trim()) {
      setErrorMsg("Vui lòng nhập địa chỉ cụ thể của địa điểm.");
      return;
    }

    setIsSaving(true);
    try {
      const currentCat = categories.find((c) => c.id === categoryId);
      const currentProv = provinces.find((p) => p.id === provinceId);

      const priceFormatted = isFree
        ? "Miễn phí vé"
        : `${parseInt(minPrice || "0", 10).toLocaleString("vi-VN")}đ – ${parseInt(
          maxPrice || "0",
          10
        ).toLocaleString("vi-VN")}đ`;

      const hoursFormatted = is24Hours ? "Mở cửa cả ngày (24/7)" : `${openTime} – ${closeTime}`;
      const statusStr = statusNum === 1 ? "Công khai" : "Đang ẩn";

      const updatedPlace = {
        ...place,
        name: name.trim(),
        categoryId,
        category: currentCat?.name || place.category || "Nhà hàng & Quán ăn",
        categoryName: currentCat?.name || place.categoryName || "Nhà hàng & Quán ăn",
        provinceId,
        province: currentProv?.name || provinceName,
        location: address.trim(),
        address: address.trim(),
        phone: phone.trim(),
        website: website.trim(),
        hours: hoursFormatted,
        openTime,
        closeTime,
        is24Hours,
        price: priceFormatted,
        minPrice: isFree ? 0 : parseInt(minPrice, 10) || 0,
        maxPrice: isFree ? 0 : parseInt(maxPrice, 10) || 0,
        isFree,
        latitude: parseFloat(lat) || undefined,
        longitude: parseFloat(lng) || undefined,
        lat,
        lng,
        description: description.trim(),
        desc: description.trim(),
        img: images[0] || place.img,
        coverImg: images[0] || place.coverImg || place.img,
        thumbnailUrl: images[0] || place.thumbnailUrl || place.img,
        images,
        mediaUrls: images,
        photos: images,
        statusNum: statusNum === 1 ? 1 : 0,
        status: statusStr,
        rating: Number(rating) || 4.8,
      };

      if (onSave) {
        await onSave(updatedPlace);
      }
      setInitialSnapshot({
        name: name.trim(),
        categoryId,
        provinceId,
        provinceName: currentProv?.name || provinceName,
        address: address.trim(),
        phone: phone.trim(),
        website: website.trim(),
        lat,
        lng,
        is24Hours,
        openTime,
        closeTime,
        isFree,
        minPrice: minPrice.trim(),
        maxPrice: maxPrice.trim(),
        description: description.trim(),
        statusNum: statusNum === 1 ? 1 : 0,
        images: [...images],
        mediaItems: [...mediaItems],
      });
      setSaveSuccessMsg("Đã lưu các thay đổi của địa điểm thành công!");
      setTimeout(() => setSaveSuccessMsg(""), 4000);
    } catch (err: any) {
      setErrorMsg(err?.message || "Lỗi khi lưu thông tin địa điểm.");
    } finally {
      setIsSaving(false);
    }
  };

  const currentCategoryName = categories.find((c) => c.id === categoryId)?.name || place?.category || "Danh mục";
  const currentProvinceName = provinces.find((p) => p.id === provinceId)?.name || provinceName;

  return (
    <div className="space-y-6 animate-in fade-in duration-200 text-xs font-sans pb-16">
      {/* Top Header / Back Navigation & Quick Actions */}
      <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/80 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onBack}
            className="p-2 sm:px-3 sm:py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
            title="Quay lại danh sách"
          >
            <ArrowLeft size={15} />
            <span className="hidden sm:inline">Quay lại</span>
          </button>

          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base sm:text-lg font-bold text-slate-900 truncate max-w-md">
                {name || place.name}
              </h2>
              <span
                className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold ${statusNum === 1
                  ? "bg-emerald-100 text-emerald-800"
                  : "bg-slate-200 text-slate-700"
                  }`}
              >
                {statusNum === 1 ? "Công khai" : "Đang ẩn"}
              </span>
            </div>
            <p className="text-[11px] text-slate-400 mt-0.5">
              Mã ID: #{place.id} • {currentCategoryName} • {currentProvinceName}
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2 flex-wrap">
          {onToggleStatus && (
            <button
              type="button"
              disabled={isTogglingStatus}
              onClick={handleToggleStatusClick}
              className={`flex items-center gap-1.5 px-3 py-2 disabled:opacity-50 font-semibold rounded-xl cursor-pointer transition-colors ${statusNum === 1
                ? "bg-slate-100 hover:bg-slate-200 text-slate-700"
                : "bg-emerald-600 hover:bg-emerald-700 text-white font-bold shadow-xs"
                }`}
            >
              {statusNum === 1 ? <EyeOff size={14} /> : <Eye size={14} />}
              <span>{statusNum === 1 ? "Ẩn địa điểm" : "Công khai địa điểm"}</span>
            </button>
          )}

          {/* Nút Hủy có dirty tracking */}
          <button
            type="button"
            disabled={!hasChanges || isSaving}
            onClick={handleCancel}
            className={`flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all ${hasChanges
                ? "bg-slate-200 hover:bg-slate-300 text-slate-800 cursor-pointer shadow-2xs border border-slate-300"
                : "bg-slate-100 text-slate-400 cursor-not-allowed opacity-50 border border-slate-200/60"
              }`}
            title={
              hasChanges
                ? "Hủy bỏ các thay đổi và khôi phục dữ liệu ban đầu"
                : "Chưa có thay đổi nào để hủy"
            }
          >
            <RotateCcw size={13} className={hasChanges ? "text-slate-700" : "text-slate-400"} />
            <span>Hủy</span>
          </button>

          {/* Nút Lưu thay đổi */}
          <button
            type="button"
            onClick={handleFormSubmit}
            disabled={isSaving || !hasChanges}
            className={`flex items-center gap-1.5 px-4 py-2.5 rounded-xl font-bold shadow-xs transition-colors ${hasChanges
                ? "bg-emerald-700 hover:bg-emerald-800 text-white cursor-pointer"
                : "bg-emerald-700/50 text-white/80 cursor-not-allowed opacity-60"
              }`}
            title={hasChanges ? "Lưu lại các thay đổi" : "Chưa có thay đổi mới để lưu"}
          >
            {isSaving ? (
              <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <Save size={14} />
            )}
            <span>{isSaving ? "Đang lưu..." : "Lưu thay đổi"}</span>
          </button>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200/80 pb-3">
        <button
          type="button"
          onClick={() => setActiveEditorTab("info")}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs transition-all cursor-pointer ${
            activeEditorTab === "info"
              ? "bg-emerald-700 text-white shadow-xs"
              : "bg-white hover:bg-slate-100 text-slate-600 border border-slate-200"
          }`}
        >
          <FileText className="w-4 h-4" />
          <span>Thông tin & Đa phương tiện</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveEditorTab("reviews")}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs transition-all cursor-pointer ${
            activeEditorTab === "reviews"
              ? "bg-emerald-700 text-white shadow-xs"
              : "bg-white hover:bg-slate-100 text-slate-600 border border-slate-200"
          }`}
        >
          <MessageSquare className="w-4 h-4" />
          <span>Đánh giá & Bình luận</span>
          {reviewsCount > 0 && (
            <span
              className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                activeEditorTab === "reviews"
                  ? "bg-emerald-800 text-white"
                  : "bg-emerald-100 text-emerald-800"
              }`}
            >
              {reviewsCount}
            </span>
          )}
        </button>
      </div>

      {activeEditorTab === "info" ? (
        <>
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
                    <span>1. Thông tin cơ bản & Phân loại</span>
                  </h3>

              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-800 mb-1.5">
                    Tên địa điểm <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    placeholder="Ví dụ: Mì Quảng Ếch Bếp Trang, Cà phê Mây Lang Thang..."
                    value={name}
                    onChange={(e) => setName(e.target.value)}
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
                      placeholder="https://facebook.com/... hoặc https://quanan.vn"
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

            {/* Section 3: Operating Hours & Ticket / Price */}
            <div className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200/80 shadow-xs space-y-5">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-3">
                <Clock className="w-4 h-4 text-emerald-700" />
                <span>3. Thời gian hoạt động & Khung giá dịch vụ</span>
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
                      Giá vé / Mức giá (VNĐ)
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
                          placeholder="75000"
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
                  Mô tả chi tiết & Giới thiệu <span className="text-rose-500">*</span>
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

            {/* Section 4: Image Gallery & Uploads */}
            <div className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200/80 shadow-xs space-y-6">
              <div className="space-y-4">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleFileInputChange}
                  className="hidden"
                />

                <div
                  onClick={() => !isUploadingImages && fileInputRef.current?.click()}
                  onDragOver={(e) => {
                    e.preventDefault();
                    setIsDragging(true);
                  }}
                  onDragLeave={() => setIsDragging(false)}
                  onDrop={handleDropFiles}
                  className={`p-6 border-2 border-dashed rounded-2xl text-center cursor-pointer transition-all flex flex-col items-center justify-center gap-2.5 ${isDragging
                    ? "border-emerald-600 bg-emerald-50/80 text-emerald-800 ring-2 ring-emerald-500/30"
                    : isUploadingImages
                      ? "border-emerald-500 bg-emerald-50/50 cursor-wait"
                      : "border-slate-300 hover:border-emerald-600 hover:bg-slate-50 text-slate-600"
                    }`}
                >
                  <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-700 flex items-center justify-center shadow-xs">
                    {isUploadingImages ? (
                      <div className="w-6 h-6 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <UploadCloud className="w-6 h-6" />
                    )}
                  </div>
                  <div>
                    <p className="text-xs sm:text-sm font-bold text-slate-800">
                      {isUploadingImages
                        ? "Đang nạp ảnh vào bộ sưu tập"
                        : "Thêm nhiều ảnh vào bộ sưu tập"}
                    </p>
                  </div>
                </div>

                <div className="space-y-3 pt-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-700">
                      Bộ sưu tập hình ảnh ({images.length})
                    </span>
                  </div>

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
                              className="absolute top-2 left-2 px-2 py-0.5 rounded-md bg-slate-900/75 hover:bg-emerald-700 text-white text-[10px] font-semibold transition-colors cursor-pointer opacity-0 group-hover:opacity-100 shadow-xs"
                            >
                              Đặt làm ảnh bìa
                            </button>
                          )}

                          <button
                            type="button"
                            onClick={() => handleRemoveImage(idx)}
                            className="absolute top-2 right-2 p-1.5 rounded-full bg-black/60 hover:bg-rose-600 text-white transition-colors cursor-pointer opacity-0 group-hover:opacity-100 shadow-xs"
                            title="Xóa ảnh này khỏi địa điểm"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="p-4 rounded-2xl bg-slate-50 border border-dashed border-slate-200 text-center text-xs text-slate-400">
                      Chưa có ảnh nào trong bộ sưu tập. Hãy chọn hoặc kéo thả ảnh vào khung phía trên.
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Right Column (4 cols, sticky): Live Preview Card & Admin Meta */}
          <div className="lg:col-span-4 space-y-6 sticky top-6">
            {/* Live Preview Card */}
            <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <Eye className="w-4 h-4 text-emerald-700" />
                  <span>Bản xem trước trực tiếp</span>
                </h3>
              </div>

              {/* Discovery Card Component Replica */}
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
                    {name.trim() || "Tên địa điểm"}
                  </h4>

                  <div className="flex items-center gap-1.5 text-xs text-slate-900 font-bold">
                    <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400 shrink-0" />
                    <span>{(Number(rating) || 4.8).toFixed(1)}</span>
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
          </div>
        </div>
      </form>
    </>
  ) : (
    <PlaceAdminReviews
      placeId={Number(place.id)}
      placeName={name || place.name}
      onReviewsCountChange={setReviewsCount}
    />
  )}
</div>
  );
};

export default PlaceDetailEditor;
