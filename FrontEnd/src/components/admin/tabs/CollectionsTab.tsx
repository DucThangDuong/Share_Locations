import React, { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import {
  FolderHeart,
  Plus,
  Trash2,
  Pencil,
  Check,
  X,
  ChevronDown,
  ChevronUp,
  MapPin,
  Star,
  Search,
  ArrowUp,
  ArrowDown,
  ExternalLink,
  Loader2,
  SlidersHorizontal,
  ArrowLeft,
  RotateCcw,
  LayoutGrid,
  List,
  ChevronLeft,
  ChevronRight,
  Eye,
  EyeOff,
  Image as ImageIcon,
  Save
} from "lucide-react";
import {
  adminService,
  extractList,
  type AdminCollectionSummary,
  type AdminCollectionPlaceDetail,
  type UpdateCollectionPlacesRequest,
  type CreateCollectionRequest
} from "@/services/adminService";
import { placeService } from "@/services/placeService";
import { geographyService } from "@/services/geographyService";
import { getDayTheme } from "@/utils/itineraryStyles";
import type { ProvinceDto } from "@/types/models/geography.model";
import type {
  PlaceSummaryDto,
  LookupItemDto,
  RegionLookupDto
} from "@/types/models/place.model";

interface CollectionsTabProps {
  showToast?: (msg: string) => void;
}

const DEFAULT_PROVINCES: ProvinceDto[] = [
  { id: 1, name: "TP Hà Nội", regionId: 1, regionName: "Miền Bắc", featured: true, displayOrder: 1, placeCount: 220 },
  { id: 27, name: "TP Hồ Chí Minh", regionId: 4, regionName: "Miền Nam", featured: true, displayOrder: 2, placeCount: 260 },
  { id: 25, name: "Tỉnh Lâm Đồng", regionId: 3, regionName: "Tây Nguyên", featured: true, displayOrder: 3, placeCount: 130 },
  { id: 2, name: "Đà Nẵng", regionId: 2, regionName: "Miền Trung", featured: true, displayOrder: 4, placeCount: 150 },
  { id: 4, name: "Khánh Hòa", regionId: 3, regionName: "Nam Trung Bộ", featured: true, displayOrder: 5, placeCount: 110 },
  { id: 3, name: "Quảng Nam", regionId: 2, regionName: "Miền Trung", featured: false, displayOrder: 6, placeCount: 95 }
];

export const CollectionsTab: React.FC<CollectionsTabProps> = ({ showToast }) => {
  const navigate = useNavigate();
  const location = useLocation();

  const getIdFromUrl = useCallback((): number | "new" | null => {
    // 1. Path checking: e.g. /admin/collections/123 or /admin/collections/new
    const pathParts = location.pathname.replace(/\/+$/, "").split("/");
    const colIndex = pathParts.indexOf("collections");
    if (colIndex !== -1 && pathParts[colIndex + 1]) {
      const sub = pathParts[colIndex + 1];
      if (sub === "new") return "new";
      const parsed = Number(sub);
      if (!isNaN(parsed) && parsed > 0) return parsed;
    }

    // 2. Query param checking: e.g. ?id=123 or ?collectionId=123
    const params = new URLSearchParams(location.search);
    const queryId = params.get("id") || params.get("collectionId");
    if (queryId === "new") return "new";
    if (queryId) {
      const parsed = Number(queryId);
      if (!isNaN(parsed) && parsed > 0) return parsed;
    }

    return null;
  }, [location.pathname, location.search]);

  const [activeCollectionId, setActiveCollectionIdState] = useState<number | "new" | null>(getIdFromUrl);

  const setActiveCollectionId = useCallback(
    (id: number | "new" | null) => {
      setActiveCollectionIdState(id);
      if (id === null) {
        if (location.pathname !== "/admin/collections") {
          navigate("/admin/collections");
        }
      } else if (id === "new") {
        const targetPath = "/admin/collections/new";
        if (location.pathname !== targetPath) {
          navigate(targetPath);
        }
      } else {
        const targetPath = `/admin/collections/${id}`;
        if (location.pathname !== targetPath) {
          navigate(targetPath);
        }
      }
    },
    [navigate, location.pathname]
  );

  useEffect(() => {
    const fromUrl = getIdFromUrl();
    if (fromUrl !== activeCollectionId) {
      setActiveCollectionIdState(fromUrl);
    }
  }, [getIdFromUrl, activeCollectionId]);

  const [draftCollection, setDraftCollection] = useState<AdminCollectionSummary>({
    id: 0,
    title: "Bộ sưu tập mới",
    description: "",
    provinceId: null,
    provinceName: "Toàn quốc",
    isFeatured: false,
    displayOrder: 1,
    status: 1,
    placeCount: 0
  });

  // Collections state
  const [collections, setCollections] = useState<AdminCollectionSummary[]>([]);
  const [collectionPlaces, setCollectionPlaces] = useState<AdminCollectionPlaceDetail[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isLoadingPlaces, setIsLoadingPlaces] = useState<boolean>(false);
  const [isSavingPlaces, setIsSavingPlaces] = useState<boolean>(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState<boolean>(false);

  // List View Filters
  const [searchCatalogQuery, setSearchCatalogQuery] = useState("");
  const [selectedProvinceCatalog, setSelectedProvinceCatalog] = useState<string>("all");

  // Provinces & Filter Options
  const [provinces, setProvinces] = useState<ProvinceDto[]>(DEFAULT_PROVINCES);
  const [filterCategories, setFilterCategories] = useState<LookupItemDto[]>([]);
  const [filterRegions, setFilterRegions] = useState<RegionLookupDto[]>([]);

  // Detail / Place Search & Filter State
  const [searchInput, setSearchInput] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategoryIds, setSelectedCategoryIds] = useState<number[]>([]);
  const [selectedProvinceIds, setSelectedProvinceIds] = useState<number[]>([]);
  const [selectedMinRating, setSelectedMinRating] = useState<number>(0);
  const [openRegionAccordion, setOpenRegionAccordion] = useState<Record<string, boolean>>({});
  const [searchPlacesResult, setSearchPlacesResult] = useState<PlaceSummaryDto[]>([]);
  const [searchTotalElements, setSearchTotalElements] = useState<number>(0);
  const [searchTotalPages, setSearchTotalPages] = useState<number>(1);
  const [searchCurrentPage, setSearchCurrentPage] = useState<number>(1);
  const [isSearchingPlaces, setIsSearchingPlaces] = useState<boolean>(false);
  const [searchPlacesViewMode, setSearchPlacesViewMode] = useState<"grid" | "list">("grid");

  // Inline editing in Detail Toolbar
  const [isInlineEditingTitle, setIsInlineEditingTitle] = useState<boolean>(false);
  const [inlineTitleValue, setInlineTitleValue] = useState<string>("");
  const [isInlineEditingDescription, setIsInlineEditingDescription] = useState<boolean>(false);
  const [inlineDescriptionValue, setInlineDescriptionValue] = useState<string>("");

  const showToastRef = useRef(showToast);
  showToastRef.current = showToast;

  const notify = useCallback(
    (msg: string) => {
      if (showToastRef.current) {
        showToastRef.current(msg);
      } else {
        alert(msg);
      }
    },
    [] // stable forever — no deps
  );

  // 1. Fetch Collections from API (/api/admin/collections)
  const fetchCollections = useCallback(async () => {
    setIsLoading(true);
    try {
      const res: any = await adminService.getCollections();
      const rawList = extractList<AdminCollectionSummary>(res?.data ?? res);

      const mapped: AdminCollectionSummary[] = rawList.map((col: any, idx: number) => ({
        id: col.id ?? idx + 1,
        provinceId: col.provinceId ?? col.province?.id ?? null,
        provinceName: col.provinceName ?? col.province?.name ?? "Toàn quốc",
        title: col.title || col.name || `Bộ sưu tập #${idx + 1}`,
        description: col.description || null,
        coverUrl: col.coverUrl || null,
        isFeatured: Boolean(col.isFeatured ?? col.featured),
        displayOrder: Number(col.displayOrder ?? idx + 1),
        status: Number(col.status ?? 1),
        placeCount: Number(col.placeCount ?? col.places?.length ?? 0)
      }));

      setCollections(mapped);
    } catch {
      notify("Không thể tải danh sách bộ sưu tập từ máy chủ.");
    } finally {
      setIsLoading(false);
    }
  }, [notify]);

  useEffect(() => {
    fetchCollections();

    // Fetch Provinces
    geographyService
      .getProvinces()
      .then((res) => {
        if (res.data && res.data.length > 0) {
          setProvinces(res.data);
        }
      })
      .catch(() => { });

    // Fetch Filter Options (Categories & Regions)
    placeService
      .getFilterOptions()
      .then((res) => {
        if (res.success && res.data) {
          setFilterCategories(res.data.categories || []);
          setFilterRegions(res.data.regions || []);
        }
      })
      .catch(() => { });
  }, [fetchCollections]);

  // Active Collection (from server collections list or draft)
  const activeCollection = useMemo(() => {
    if (activeCollectionId === null) return null;
    if (activeCollectionId === "new") return draftCollection;
    return collections.find((c) => c.id === activeCollectionId) || null;
  }, [collections, activeCollectionId, draftCollection]);

  // 2. Fetch Places of Active Collection (/api/admin/collections/{collectionId}/places)
  const fetchActiveCollectionPlaces = useCallback(async (colId: number) => {
    setIsLoadingPlaces(true);
    try {
      const res: any = await adminService.getCollectionPlaces(colId);
      const detailData = res?.data ?? res;
      const rawPlaces = Array.isArray(detailData?.places)
        ? detailData.places
        : extractList<AdminCollectionPlaceDetail>(detailData);

      const mapped: AdminCollectionPlaceDetail[] = rawPlaces.map((p: any, idx: number) => ({
        id: p.id ?? p.placeId ?? idx + 1,
        name: p.name || p.placeName || "Địa điểm chưa đặt tên",
        description: p.description || p.summary || null,
        categoryName: p.categoryName || p.category || null,
        provinceName: p.provinceName || p.province || null,
        address: p.address || p.location || null,
        avgRating: Number(p.avgRating ?? p.rating ?? 5),
        reviewCount: Number(p.reviewCount ?? p.reviewsCount ?? 0),
        displayOrder: Number(p.displayOrder ?? idx + 1),
        coverUrl: p.coverUrl || p.image || p.thumbnailUrl || null,
        isActive: p.isActive !== undefined ? Boolean(p.isActive) : true
      }));

      // Sort by displayOrder
      mapped.sort((a, b) => a.displayOrder - b.displayOrder);

      setCollectionPlaces(mapped);

      // Update placeCount, description, and metadata in collections summary
      setCollections((prev) => {
        const exists = prev.some((c) => c.id === colId);
        if (exists) {
          return prev.map((c) =>
            c.id === colId
              ? {
                ...c,
                placeCount: detailData?.placeCount ?? mapped.length,
                description: detailData?.description !== undefined ? detailData.description : c.description,
                title: detailData?.title || c.title,
                provinceId: detailData?.provinceId !== undefined ? detailData.provinceId : c.provinceId,
                provinceName: detailData?.provinceName || c.provinceName,
                coverUrl: detailData?.coverUrl || c.coverUrl,
                status: detailData?.status !== undefined ? Number(detailData.status) : c.status,
                isFeatured: detailData?.isFeatured !== undefined ? Boolean(detailData.isFeatured) : c.isFeatured
              }
              : c
          );
        } else {
          return [
            ...prev,
            {
              id: colId,
              title: detailData?.title || `Bộ sưu tập #${colId}`,
              description: detailData?.description || null,
              provinceId: detailData?.provinceId !== undefined ? detailData.provinceId : null,
              provinceName: detailData?.provinceName || "Toàn quốc",
              coverUrl: detailData?.coverUrl || null,
              isFeatured: detailData?.isFeatured !== undefined ? Boolean(detailData.isFeatured) : false,
              displayOrder: Number(detailData?.displayOrder ?? 1),
              status: detailData?.status !== undefined ? Number(detailData.status) : 1,
              placeCount: detailData?.placeCount ?? mapped.length
            }
          ];
        }
      });

      if (detailData?.description !== undefined) {
        setInlineDescriptionValue(detailData.description || "");
      }
      if (detailData?.title) {
        setInlineTitleValue(detailData.title);
      }
    } catch {
      setCollectionPlaces([]);
      notify("Không thể tải danh sách địa điểm của bộ sưu tập.");
    } finally {
      setIsLoadingPlaces(false);
    }
  }, [notify]);

  useEffect(() => {
    if (typeof activeCollectionId === "number" && activeCollectionId > 0) {
      fetchActiveCollectionPlaces(activeCollectionId);
      setIsInlineEditingTitle(false);
      setIsInlineEditingDescription(false);
    } else if (activeCollectionId === null) {
      setCollectionPlaces([]);
      setIsInlineEditingTitle(false);
      setIsInlineEditingDescription(false);
    }
  }, [activeCollectionId, fetchActiveCollectionPlaces]);

  // Fetch Places for Place Search & Filter in Detail View (/api/places)
  const fetchPlacesForPicker = useCallback(async () => {
    if (activeCollectionId === null) return;
    setIsSearchingPlaces(true);
    try {
      const res = await placeService.searchPlaces({
        keyword: searchQuery.trim() || undefined,
        categoryIds: selectedCategoryIds.length > 0 ? selectedCategoryIds : undefined,
        provinceIds: selectedProvinceIds.length > 0 ? selectedProvinceIds : undefined,
        minRating: selectedMinRating > 0 ? selectedMinRating : undefined,
        page: searchCurrentPage,
        pageSize: 9
      });

      if (res.success && res.data) {
        setSearchPlacesResult(res.data);
        if (res.meta) {
          setSearchTotalElements(res.meta.totalElements);
          setSearchTotalPages(res.meta.totalPages);
        }
      } else {
        setSearchPlacesResult([]);
        setSearchTotalElements(0);
        setSearchTotalPages(1);
      }
    } catch {
      setSearchPlacesResult([]);
      setSearchTotalElements(0);
      setSearchTotalPages(1);
    } finally {
      setIsSearchingPlaces(false);
    }
  }, [
    activeCollectionId,
    searchQuery,
    selectedCategoryIds,
    selectedProvinceIds,
    selectedMinRating,
    searchCurrentPage
  ]);

  useEffect(() => {
    if (activeCollectionId !== null) {
      fetchPlacesForPicker();
    }
  }, [activeCollectionId, fetchPlacesForPicker]);

  // Search Submit Handler in Detail View
  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSearchQuery(searchInput);
    setSearchCurrentPage(1);
  };

  // Reset Filters in Detail View
  const handleResetDetailFilters = () => {
    setSearchInput("");
    setSearchQuery("");
    setSelectedCategoryIds([]);
    setSelectedProvinceIds([]);
    setSelectedMinRating(0);
    setSearchCurrentPage(1);
  };

  // Category Toggle
  const handleCategoryToggle = (catId: number) => {
    setSelectedCategoryIds((prev) =>
      prev.includes(catId) ? prev.filter((id) => id !== catId) : [...prev, catId]
    );
    setSearchCurrentPage(1);
  };

  // Province Toggle
  const handleProvinceToggle = (provId: number) => {
    setSelectedProvinceIds((prev) =>
      prev.includes(provId) ? prev.filter((id) => id !== provId) : [...prev, provId]
    );
    setSearchCurrentPage(1);
  };

  // Toggle Region Accordion
  const toggleRegionAccordion = (regionKey: string) => {
    setOpenRegionAccordion((prev) => ({
      ...prev,
      [regionKey]: !prev[regionKey]
    }));
  };

  // Open Draft Editor (No API call until user clicks Save)
  const handleCreateNewCollection = () => {
    const defaultTitle = `Bộ sưu tập mới #${collections.length + 1}`;
    const defaultProvId = provinces && provinces.length > 0 ? provinces[0].id : null;
    const selectedProv = provinces.find((p) => p.id === defaultProvId);
    const newDraft: AdminCollectionSummary = {
      id: 0,
      title: defaultTitle,
      description: "",
      provinceId: defaultProvId,
      provinceName: selectedProv?.name || "Toàn quốc",
      isFeatured: false,
      displayOrder: collections.length + 1,
      status: 1,
      placeCount: 0
    };

    setDraftCollection(newDraft);
    setActiveCollectionId("new");
    setCollectionPlaces([]);
    setInlineTitleValue(defaultTitle);
    setInlineDescriptionValue("");
    setIsInlineEditingTitle(true);
    setIsInlineEditingDescription(false);
    setHasUnsavedChanges(true);
    notify(`Đang tạo "${defaultTitle}". Hãy đặt tên, thêm mô tả, chọn địa điểm và bấm "Tạo & Lưu bộ sưu tập".`);
  };

  // Delete Collection
  const handleDeleteCollection = async (e: React.MouseEvent, id: number, title: string) => {
    e.stopPropagation();
    if (activeCollectionId === "new" || id === 0) {
      setActiveCollectionId(null);
      setCollectionPlaces([]);
      setHasUnsavedChanges(false);
      notify("Đã hủy tạo bộ sưu tập mới.");
      return;
    }

    try {
      await adminService.deleteCollection(id);
    } catch {
      // Optimistic delete
    }

    setCollections((prev) => prev.filter((c) => c.id !== id));
    if (activeCollectionId === id) {
      setActiveCollectionId(null);
    }
    notify(`Đã xóa bộ sưu tập "${title}".`);
  };

  // 3. Add Place to Current Collection (Thêm tạm thời vào danh sách giao diện)
  const handleAddPlaceToCollection = (place: PlaceSummaryDto) => {
    if (activeCollectionId === null) return;

    if (collectionPlaces.some((p) => Number(p.id) === Number(place.id))) {
      notify("Địa điểm này đã có trong bộ sưu tập.");
      return;
    }

    const nextDisplayOrder = collectionPlaces.length + 1;
    const newPlaceItem: AdminCollectionPlaceDetail = {
      id: Number(place.id),
      name: place.name || "Địa điểm chưa đặt tên",
      categoryName: place.categoryName || place.placeTypeName || null,
      provinceName: place.provinceName || place.regionName || null,
      address: place.address || null,
      avgRating: Number(place.avgRating || 5),
      reviewCount: Number(place.reviewCount || 0),
      displayOrder: nextDisplayOrder,
      coverUrl: place.thumbnailUrl || (Array.isArray(place.mediaUrls) && place.mediaUrls.length > 0 ? place.mediaUrls[0] : null)
    };

    // Cập nhật state danh sách ngay lập tức
    const nextPlaces = [...collectionPlaces, newPlaceItem];
    setCollectionPlaces(nextPlaces);
    setHasUnsavedChanges(true);

    if (activeCollectionId === "new") {
      setDraftCollection((prev) => ({ ...prev, placeCount: nextPlaces.length }));
    } else {
      setCollections((prev) =>
        prev.map((c) => (c.id === activeCollectionId ? { ...c, placeCount: nextPlaces.length } : c))
      );
    }

    notify(`Đã thêm "${newPlaceItem.name}" vào danh sách.`);
  };

  // 4. Save Collection (Tạo mới nếu "new" hoặc cập nhật địa điểm nếu đã có)
  const handleSaveCollectionPlaces = async () => {
    if (activeCollectionId === null || isSavingPlaces || !activeCollection) return;
    setIsSavingPlaces(true);
    try {
      const placesList = collectionPlaces.map((p, idx) => ({
        placeId: Number(p.id),
        displayOrder: idx + 1
      }));

      const finalTitle = inlineTitleValue.trim() || activeCollection.title.trim() || "Bộ sưu tập mới";
      const finalDesc = isInlineEditingDescription ? inlineDescriptionValue.trim() : (activeCollection.description?.trim() || inlineDescriptionValue.trim() || null);

      if (activeCollectionId === "new") {
        // ── TẠO MỚI BỘ SƯU TẬP TRÊN SERVER (POST /api/admin/collections) ──
        const createPayload: CreateCollectionRequest = {
          title: finalTitle,
          name: finalTitle,
          description: finalDesc,
          provinceId: activeCollection.provinceId || null,
          isFeatured: Boolean(activeCollection.isFeatured),
          featured: Boolean(activeCollection.isFeatured),
          displayOrder: activeCollection.displayOrder || collections.length + 1,
          status: activeCollection.status ?? 1,
          places: placesList,
          placeIds: placesList.map((p) => p.placeId)
        };

        const res: any = await adminService.createCollection(createPayload);
        const resData = res?.data !== undefined ? res.data : res;

        let createdId: number | null = null;
        if (typeof resData === "number") {
          createdId = resData;
        } else if (resData?.id) {
          createdId = Number(resData.id);
        } else if (resData?.collectionId) {
          createdId = Number(resData.collectionId);
        } else if (res?.id) {
          createdId = Number(res.id);
        }

        if (!createdId) {
          const fetchRes: any = await adminService.getCollections();
          const list = extractList<AdminCollectionSummary>(fetchRes?.data ?? fetchRes);
          const match = list.find((c: any) => (c.title || c.name) === createPayload.title) || list[0];
          if (match && match.id) {
            createdId = Number(match.id);
          }
        }

        if (!createdId) {
          throw new Error("Không thể xác định ID bộ sưu tập từ máy chủ.");
        }

        // Lưu danh sách địa điểm theo đúng DTO backend (đồng bộ kép đảm bảo an toàn)
        if (placesList.length > 0 || finalDesc) {
          try {
            await adminService.updateCollectionPlaces(createdId, {
              collectionId: createdId,
              title: finalTitle,
              description: finalDesc,
              provinceId: createPayload.provinceId ?? null,
              places: placesList,
              replaceExisting: true
            });
          } catch {
            // ignore
          }
        }

        setIsInlineEditingTitle(false);
        setIsInlineEditingDescription(false);
        setHasUnsavedChanges(false);
        setCollectionPlaces([]);
        notify(`Đã tạo và lưu bộ sưu tập "${finalTitle}" thành công!`);
        setActiveCollectionId(null);
        await fetchCollections();
      } else {
        // ── CẬP NHẬT ĐỊA ĐIỂM & THÔNG TIN BỘ SƯU TẬP ĐÃ CÓ ──
        const payload: UpdateCollectionPlacesRequest = {
          collectionId: activeCollectionId,
          title: finalTitle,
          description: finalDesc,
          provinceId: activeCollection.provinceId ?? null,
          places: placesList,
          replaceExisting: true
        };

        await adminService.updateCollectionPlaces(activeCollectionId, payload);
        setIsInlineEditingTitle(false);
        setIsInlineEditingDescription(false);
        setHasUnsavedChanges(false);
        setCollectionPlaces([]);
        notify("Đã lưu danh sách địa điểm và thông tin bộ sưu tập thành công!");
        setActiveCollectionId(null);
        await fetchCollections();
      }
    } catch (err: any) {
      console.error("Error saving collection places:", err);
      const errMsg =
        err?.response?.data?.message ||
        err?.response?.data?.title ||
        (typeof err?.response?.data === "string" ? err.response.data : null) ||
        err?.message ||
        "Lỗi khi lưu bộ sưu tập. Vui lòng thử lại.";
      notify(errMsg);
    } finally {
      setIsSavingPlaces(false);
    }
  };

  // Remove Place from Collection
  const handleRemovePlaceFromCollection = (placeId: number, name: string) => {
    if (activeCollectionId === null) return;

    const remaining = collectionPlaces.filter((p) => Number(p.id) !== Number(placeId));
    const reindexed = remaining.map((p, idx) => ({ ...p, displayOrder: idx + 1 }));

    setCollectionPlaces(reindexed);
    setHasUnsavedChanges(true);

    if (activeCollectionId === "new") {
      setDraftCollection((prev) => ({ ...prev, placeCount: reindexed.length }));
    } else {
      setCollections((prev) =>
        prev.map((c) => (c.id === activeCollectionId ? { ...c, placeCount: reindexed.length } : c))
      );
    }

    notify(`Đã xóa "${name}" khỏi danh sách tạm. Nhấn "Lưu thay đổi" để cập nhật.`);
  };

  // Reorder Places in Current Collection
  const handleReorderPlace = (placeIdx: number, direction: "up" | "down") => {
    if (activeCollectionId === null) return;

    const targetIdx = direction === "up" ? placeIdx - 1 : placeIdx + 1;
    if (targetIdx < 0 || targetIdx >= collectionPlaces.length) return;

    const newPlaces = [...collectionPlaces];
    const temp = newPlaces[placeIdx];
    newPlaces[placeIdx] = newPlaces[targetIdx];
    newPlaces[targetIdx] = temp;

    // Re-assign displayOrder 1..N
    const reindexed = newPlaces.map((p, idx) => ({ ...p, displayOrder: idx + 1 }));
    setCollectionPlaces(reindexed);
    setHasUnsavedChanges(true);
  };

  const handleSaveInlineTitle = () => {
    if (!inlineTitleValue.trim()) {
      notify("Tên bộ sưu tập không được để trống.");
      return;
    }

    const trimmed = inlineTitleValue.trim();

    if (activeCollectionId === "new") {
      setDraftCollection((prev) => ({ ...prev, title: trimmed }));
      setIsInlineEditingTitle(false);
      setHasUnsavedChanges(true);
      notify("Đã cập nhật tên bộ sưu tập.");
      return;
    }

    if (typeof activeCollectionId === "number") {
      setCollections((prev) =>
        prev.map((c) => (c.id === activeCollectionId ? { ...c, title: trimmed } : c))
      );
      setHasUnsavedChanges(true);
    }

    setIsInlineEditingTitle(false);
    notify("Đã cập nhật tên bộ sưu tập. Nhấn \"Lưu thay đổi\" để hoàn tất.");
  };

  // Inline Description Save (Cập nhật mô tả cục bộ & đánh dấu có thay đổi)
  const handleSaveInlineDescription = () => {
    const trimmed = inlineDescriptionValue.trim();

    if (activeCollectionId === "new") {
      setDraftCollection((prev) => ({ ...prev, description: trimmed }));
      setIsInlineEditingDescription(false);
      setHasUnsavedChanges(true);
      notify("Đã cập nhật mô tả bộ sưu tập.");
      return;
    }

    if (typeof activeCollectionId === "number") {
      setCollections((prev) =>
        prev.map((c) => (c.id === activeCollectionId ? { ...c, description: trimmed } : c))
      );
      setHasUnsavedChanges(true);
    }

    setIsInlineEditingDescription(false);
    notify("Đã cập nhật mô tả bộ sưu tập. Nhấn \"Lưu thay đổi\" để hoàn tất.");
  };

  // Discard all unsaved changes
  const handleDiscardChanges = async () => {
    if (activeCollectionId === "new") {
      setActiveCollectionId(null);
      setCollectionPlaces([]);
      setHasUnsavedChanges(false);
      notify("Đã hủy tạo bộ sưu tập mới.");
      return;
    }

    if (typeof activeCollectionId === "number") {
      setIsInlineEditingTitle(false);
      setIsInlineEditingDescription(false);
      await fetchActiveCollectionPlaces(activeCollectionId);
      await fetchCollections();
      const current = collections.find((c) => c.id === activeCollectionId);
      if (current) {
        setInlineTitleValue(current.title || "");
        setInlineDescriptionValue(current.description || "");
      }
      setHasUnsavedChanges(false);
      notify("Đã hủy tất cả các thay đổi chưa lưu.");
    }
  };

  const handleToggleCollectionStatus = async (targetId?: number, reason?: string) => {
    const id = targetId ?? (typeof activeCollectionId === "number" ? activeCollectionId : undefined);
    if (!id) return;
    const target = collections.find((c) => c.id === id);
    if (!target) return;
    const nextStatus = target.status === 1 ? 0 : 1;

    setCollections((prev) =>
      prev.map((c) => (c.id === id ? { ...c, status: nextStatus } : c))
    );

    try {
      await adminService.updateCollectionStatus(id, nextStatus, reason);
      notify(`Đã chuyển trạng thái BST "${target.title}" sang "${nextStatus === 1 ? "Đang hoạt động" : "Tạm ẩn"}".`);
    } catch {
      setCollections((prev) =>
        prev.map((c) => (c.id === id ? { ...c, status: target.status } : c))
      );
      notify("Lỗi khi cập nhật trạng thái bộ sưu tập trên máy chủ.");
    }
  };

  // Filtered Collections in Catalog View
  const filteredCollections = useMemo(() => {
    return collections.filter((c) => {
      const q = searchCatalogQuery.toLowerCase().trim();
      const matchesSearch =
        !q ||
        c.title.toLowerCase().includes(q) ||
        c.provinceName?.toLowerCase().includes(q);

      const matchesProvince =
        selectedProvinceCatalog === "all" ||
        String(c.provinceId) === String(selectedProvinceCatalog) ||
        c.provinceName?.toLowerCase().includes(selectedProvinceCatalog.toLowerCase());

      return matchesSearch && matchesProvince;
    });
  }, [collections, searchCatalogQuery, selectedProvinceCatalog]);

  if (activeCollection) {
    const isCreatingNew = activeCollectionId === "new";
    const colTheme = getDayTheme(
      isCreatingNew
        ? collections.length
        : collections.findIndex((c) => c.id === activeCollection.id)
    );
    const collectionPlaceIds = new Set(collectionPlaces.map((p) => Number(p.id)));

    return (
      <div className="space-y-6 animate-in fade-in duration-150 text-xs">
        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/90 shadow-2xs space-y-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0 flex-1">
              <button
                type="button"
                onClick={() => {
                  setActiveCollectionId(null);
                  setCollectionPlaces([]);
                  setHasUnsavedChanges(false);
                }}
                className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors cursor-pointer flex items-center gap-1.5 font-bold shrink-0"
                title="Quay lại danh sách bộ sưu tập"
              >
                <ArrowLeft size={16} />
                <span className="hidden sm:inline">Quay lại</span>
              </button>
              <div className="min-w-0 flex-1">
                {isInlineEditingTitle ? (
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={inlineTitleValue}
                      onChange={(e) => setInlineTitleValue(e.target.value)}
                      placeholder="Nhập tên bộ sưu tập..."
                      className="px-3 py-1 text-sm font-extrabold text-slate-900 bg-slate-50 border border-emerald-500 rounded-lg outline-none focus:bg-white w-full max-w-md"
                      autoFocus
                      onKeyDown={(e) => {
                        if (e.key === "Enter") handleSaveInlineTitle();
                        if (e.key === "Escape") setIsInlineEditingTitle(false);
                      }}
                    />
                    <button
                      type="button"
                      onClick={handleSaveInlineTitle}
                      className="p-1.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg transition-colors cursor-pointer"
                    >
                      <Check size={14} />
                    </button>
                    {!isCreatingNew && (
                      <button
                        type="button"
                        onClick={() => setIsInlineEditingTitle(false)}
                        className="p-1.5 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-lg transition-colors cursor-pointer"
                      >
                        <X size={14} />
                      </button>
                    )}
                  </div>
                ) : (
                  <div className="flex items-center gap-2 flex-wrap">
                    <h2 className="text-base sm:text-lg font-extrabold text-slate-900 truncate">
                      {activeCollection.title}
                    </h2>
                    <button
                      type="button"
                      onClick={() => {
                        setInlineTitleValue(activeCollection.title);
                        setIsInlineEditingTitle(true);
                      }}
                      className="p-1 text-slate-400 hover:text-emerald-700 hover:bg-emerald-50 rounded-lg transition-colors cursor-pointer"
                      title="Sửa tên nhanh"
                    >
                      <Pencil size={12} />
                    </button>
                  </div>
                )}

                {/* Description View & Edit */}
                {isInlineEditingDescription ? (
                  <div className="mt-2 flex items-start gap-2 max-w-xl">
                    <textarea
                      rows={2}
                      value={inlineDescriptionValue}
                      onChange={(e) => {
                        setInlineDescriptionValue(e.target.value);
                        if (activeCollectionId === "new") {
                          setDraftCollection((prev) => ({ ...prev, description: e.target.value }));
                        }
                        setHasUnsavedChanges(true);
                      }}
                      placeholder="Nhập mô tả bộ sưu tập..."
                      className="px-3 py-1.5 text-xs text-slate-800 bg-slate-50 border border-emerald-500 rounded-lg outline-none focus:bg-white w-full resize-y min-h-[44px]"
                      autoFocus={!isInlineEditingTitle}
                    />
                    <div className="flex flex-col gap-1 shrink-0">
                      <button
                        type="button"
                        onClick={handleSaveInlineDescription}
                        className="p-1.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg transition-colors cursor-pointer"
                        title="Lưu mô tả"
                      >
                        <Check size={14} />
                      </button>
                      {!isCreatingNew && (
                        <button
                          type="button"
                          onClick={() => {
                            setInlineDescriptionValue(activeCollection.description || "");
                            setIsInlineEditingDescription(false);
                          }}
                          className="p-1.5 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-lg transition-colors cursor-pointer"
                          title="Hủy"
                        >
                          <X size={14} />
                        </button>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="flex items-start gap-2 mt-1 max-w-2xl group/desc">
                    {activeCollection.description ? (
                      <p className="text-xs text-slate-600 leading-relaxed">
                        {activeCollection.description}
                      </p>
                    ) : (
                      <p className="text-xs text-slate-400 italic">
                        {isCreatingNew ? "Chưa nhập mô tả cho bộ sưu tập." : "Chưa có mô tả cho bộ sưu tập này."}
                      </p>
                    )}
                    <button
                      type="button"
                      onClick={() => {
                        setInlineDescriptionValue(activeCollection.description || "");
                        setIsInlineEditingDescription(true);
                      }}
                      className="p-1 text-slate-400 hover:text-emerald-700 hover:bg-emerald-50 rounded-lg transition-colors cursor-pointer shrink-0"
                      title="Chỉnh sửa mô tả"
                    >
                      <Pencil size={11} />
                    </button>
                  </div>
                )}

                <div className="flex items-center gap-2 text-slate-500 font-medium mt-1 flex-wrap">
                  <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-800 border border-emerald-200 text-[10px] font-bold">
                    <MapPin size={10} />
                    <select
                      value={activeCollection.provinceId ?? ""}
                      onChange={(e) => {
                        const newProvId = e.target.value ? Number(e.target.value) : null;
                        const provObj = provinces.find((p) => p.id === newProvId);
                        const newProvName = provObj ? provObj.name : "Toàn quốc";

                        if (activeCollectionId === "new") {
                          setDraftCollection((prev) => ({
                            ...prev,
                            provinceId: newProvId,
                            provinceName: newProvName
                          }));
                          setHasUnsavedChanges(true);
                          return;
                        }

                        if (typeof activeCollectionId === "number") {
                          setCollections((prev) =>
                            prev.map((c) =>
                              c.id === activeCollection.id
                                ? { ...c, provinceId: newProvId, provinceName: newProvName }
                                : c
                            )
                          );
                          setHasUnsavedChanges(true);
                          notify(`Đã chọn tỉnh/thành "${newProvName}". Nhấn "Lưu thay đổi" để hoàn tất.`);
                        }
                      }}
                      className="bg-transparent text-emerald-800 font-bold outline-none cursor-pointer pr-1"
                    >
                      <option value="">Toàn quốc / Chung</option>
                      {provinces.map((prov) => (
                        <option key={prov.id} value={prov.id}>
                          {prov.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleToggleCollectionStatus(activeCollection.id)}
                    className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md text-[10px] font-bold border transition-colors cursor-pointer ${
                      activeCollection.status === 1
                        ? "bg-emerald-50 text-emerald-800 border-emerald-200 hover:bg-emerald-100"
                        : "bg-slate-100 text-slate-500 border-slate-200 hover:bg-slate-200"
                    }`}
                    title={activeCollection.status === 1 ? "Bấm để chuyển sang Tạm ẩn" : "Bấm để chuyển sang Đang hoạt động"}
                  >
                    {activeCollection.status === 1 ? <Eye size={11} /> : <EyeOff size={11} />}
                    <span>{activeCollection.status === 1 ? "Đang hoạt động" : "Tạm ẩn"}</span>
                  </button>

                  <span className="text-slate-300">•</span>
                  <span>Thứ tự: <strong className="text-slate-800">#{activeCollection.displayOrder}</strong></span>
                  <span className="text-slate-300">•</span>
                  <span><strong className="text-emerald-800">{collectionPlaces.length}</strong> địa điểm đã chọn</span>
                </div>
              </div>
            </div>

            {/* Header Right Actions */}
            <div className="flex items-center gap-2 shrink-0 flex-wrap">
              {/* Nút Hủy thay đổi khi có thay đổi chưa lưu (chế độ chỉnh sửa) */}
              {hasUnsavedChanges && !isCreatingNew && (
                <button
                  type="button"
                  onClick={handleDiscardChanges}
                  className="px-3.5 py-2.5 rounded-xl font-bold transition-all flex items-center gap-1.5 cursor-pointer bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 text-xs shadow-2xs"
                  title="Hủy bỏ tất cả các thay đổi vừa chỉnh sửa và khôi phục lại ban đầu"
                >
                  <RotateCcw size={14} />
                  <span>Hủy thay đổi</span>
                </button>
              )}

              {/* Nút Hủy tạo khi ở chế độ tạo mới */}
              {isCreatingNew && (
                <button
                  type="button"
                  onClick={() => {
                    setActiveCollectionId(null);
                    setCollectionPlaces([]);
                    setHasUnsavedChanges(false);
                  }}
                  className="px-3.5 py-2.5 rounded-xl font-bold transition-all flex items-center gap-1.5 cursor-pointer bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 text-xs shadow-2xs"
                  title="Hủy tạo bộ sưu tập mới"
                >
                  <X size={14} />
                  <span>Hủy</span>
                </button>
              )}

              {/* Nút Lưu thay đổi / Tạo bộ sưu tập */}
              <button
                type="button"
                disabled={isSavingPlaces || (!hasUnsavedChanges && !isCreatingNew)}
                onClick={handleSaveCollectionPlaces}
                className={`px-4 py-2.5 rounded-xl font-extrabold transition-all flex items-center gap-2 text-xs ${hasUnsavedChanges || isCreatingNew
                  ? "bg-emerald-800 hover:bg-emerald-900 text-white shadow-sm ring-2 ring-emerald-400/50 cursor-pointer"
                  : "bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed shadow-none"
                  }`}
                title={
                  isCreatingNew
                    ? "Tạo và lưu bộ sưu tập lên hệ thống"
                    : hasUnsavedChanges
                      ? "Lưu các thay đổi vào bộ sưu tập"
                      : "Chưa có thay đổi nào để lưu"
                }
              >
                {isSavingPlaces ? (
                  <Loader2 size={15} className="animate-spin" />
                ) : (
                  <Save size={15} />
                )}
                <span>
                  {isSavingPlaces
                    ? "Đang lưu..."
                    : isCreatingNew
                      ? "Tạo bộ sưu tập"
                      : "Lưu thay đổi"}
                </span>
              </button>

              <button
                type="button"
                onClick={(e) => handleDeleteCollection(e, activeCollection.id, activeCollection.title)}
                className="p-2.5 text-rose-600 hover:bg-rose-50 rounded-xl transition-colors cursor-pointer border border-rose-200"
                title={isCreatingNew ? "Hủy tạo bộ sưu tập" : "Xóa bộ sưu tập này"}
              >
                <Trash2 size={16} />
              </button>
            </div>
          </div>
        </div>

        {/* ── CURRENT COLLECTION STOPS / TIMELINE SECTION ── */}
        <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs overflow-hidden">
          <div className="p-4 sm:p-5 bg-slate-50/80 border-b border-slate-200 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <div>
                <h3 className="font-extrabold text-sm text-slate-900">
                  Địa điểm trong Bộ sưu tập này
                </h3>
              </div>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              <div className="text-[11px] font-bold text-slate-600 bg-white px-3 py-1.5 rounded-xl border border-slate-200 shadow-2xs">
                Tổng cộng: <strong className="text-emerald-800">{collectionPlaces.length}</strong> địa điểm
              </div>
            </div>
          </div>

          <div className="p-4 space-y-2.5">
            {isLoadingPlaces ? (
              <div className="py-12 flex flex-col items-center justify-center text-slate-400 gap-2 bg-slate-50/50 rounded-xl">
                <Loader2 size={24} className="animate-spin text-emerald-800" />
                <span className="text-xs">Đang tải danh sách địa điểm của bộ sưu tập...</span>
              </div>
            ) : collectionPlaces.length === 0 ? (
              <div className="py-10 text-center bg-slate-50/50 rounded-xl border border-dashed border-slate-200 p-4 space-y-2">
                <MapPin size={32} className="text-slate-300 mx-auto" />
                <div className="text-xs font-bold text-slate-700">Bộ sưu tập chưa có địa điểm nào</div>
                <p className="text-[11px] text-slate-400 max-w-sm mx-auto">
                  Sử dụng bộ lọc và ô tìm kiếm phía dưới để chọn các địa điểm phù hợp và bấm <strong>"+ Thêm vào BST"</strong>.
                </p>
              </div>
            ) : (
              collectionPlaces.map((place, pIdx) => {

                return (
                  <div
                    key={place.id}
                    className="p-3 sm:p-3.5 rounded-xl border border-slate-200/90 bg-white hover:border-emerald-400 hover:shadow-xs transition-all flex items-center justify-between gap-3 text-xs"
                  >
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      {/* Order Circle */}
                      <div
                        className={`w-6 h-6 rounded-lg ${colTheme.badgeBg} text-white font-extrabold text-xs flex items-center justify-center shrink-0 shadow-2xs`}
                      >
                        {place.displayOrder || pIdx + 1}
                      </div>

                      {/* Thumbnail */}
                      {place.coverUrl ? (
                        <img
                          src={place.coverUrl}
                          alt={place.name}
                          className="w-12 h-12 rounded-xl object-cover shrink-0 border border-slate-200"
                          onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            target.style.display = "none";
                            const sibling = target.nextElementSibling as HTMLElement | null;
                            if (sibling) sibling.style.display = "flex";
                          }}
                        />
                      ) : null}
                      <div
                        className={`w-12 h-12 rounded-xl bg-slate-100 border border-slate-200 shrink-0 items-center justify-center text-slate-400 flex-col gap-0.5 ${place.coverUrl ? "hidden" : "flex"
                          }`}
                        title="Chưa có hình ảnh"
                      >
                        <ImageIcon size={14} className="text-slate-300" />
                        <span className="text-[8px] font-semibold text-slate-400 leading-tight">Không ảnh</span>
                      </div>

                      {/* Place Info */}
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <Link
                            to={`/places/${place.id}`}
                            target="_blank"
                            rel="noreferrer"
                            className="font-extrabold text-slate-900 text-xs sm:text-sm hover:text-emerald-800 transition-colors flex items-center gap-1"
                          >
                            <span>{place.name}</span>
                            <ExternalLink size={11} className="text-slate-400" />
                          </Link>

                          {place.categoryName && (
                            <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-slate-100 text-slate-700 border border-slate-200">
                              {place.categoryName}
                            </span>
                          )}

                          {place.provinceName && (
                            <span className="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200">
                              {place.provinceName}
                            </span>
                          )}
                        </div>

                        {place.description && (
                          <p className="text-[11px] text-slate-600 line-clamp-2 mt-1 leading-relaxed bg-slate-50/80 px-2 py-1 rounded-md border border-slate-100 font-normal">
                            {place.description}
                          </p>
                        )}

                        <div className="flex items-center gap-2 text-[11px] text-slate-500 mt-1 flex-wrap">
                          {place.address && (
                            <span className="text-slate-400 truncate max-w-xs sm:max-w-md flex items-center gap-1">
                              <span className="truncate">{place.address}</span>
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Place Actions */}
                    <div className="flex items-center gap-1.5 shrink-0">
                      {/* Move Up/Down */}
                      <div className="flex items-center bg-slate-100 rounded-lg p-0.5 border border-slate-200">
                        <button
                          type="button"
                          disabled={pIdx === 0 || isSavingPlaces}
                          onClick={() => handleReorderPlace(pIdx, "up")}
                          className="p-1 text-slate-600 hover:text-slate-900 hover:bg-white rounded transition-colors disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
                          title="Đưa lên trên"
                        >
                          <ArrowUp size={12} />
                        </button>
                        <button
                          type="button"
                          disabled={pIdx === collectionPlaces.length - 1 || isSavingPlaces}
                          onClick={() => handleReorderPlace(pIdx, "down")}
                          className="p-1 text-slate-600 hover:text-slate-900 hover:bg-white rounded transition-colors disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
                          title="Đưa xuống dưới"
                        >
                          <ArrowDown size={12} />
                        </button>
                      </div>

                      {/* Remove */}
                      <button
                        type="button"
                        onClick={() => handleRemovePlaceFromCollection(place.id, place.name)}
                        className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                        title="Xóa khỏi bộ sưu tập"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* ───────────────────────────────────────────────────────────── */}
        {/* ── PLACE DISCOVERY & FILTER SECTION (LIKE USER SCREENSHOT) ── */}
        {/* ───────────────────────────────────────────────────────────── */}
        <div className="space-y-4 pt-2">
          {/* Top Search Bar */}
          <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/90 shadow-2xs">
            <form onSubmit={handleSearchSubmit} className="flex items-center gap-3">
              <div className="relative flex-1">
                <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Tìm kiếm theo tên địa điểm, món ăn, trải nghiệm..."
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  className="w-full pl-11 pr-10 py-2.5 bg-slate-50 focus:bg-white border border-slate-200 focus:border-emerald-600 rounded-xl text-xs text-slate-800 placeholder:text-slate-400 outline-none transition-all font-medium"
                />
                {searchInput && (
                  <button
                    type="button"
                    onClick={() => {
                      setSearchInput("");
                      setSearchQuery("");
                      setSearchCurrentPage(1);
                    }}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                  >
                    <X size={14} />
                  </button>
                )}
              </div>

              <button
                type="submit"
                className="px-6 py-2.5 bg-emerald-800 hover:bg-emerald-900 text-white font-extrabold rounded-xl transition-all flex items-center gap-1.5 cursor-pointer shadow-xs shrink-0"
              >
                <Search size={14} />
                <span>Tìm kiếm</span>
              </button>
            </form>
          </div>

          {/* 2-Column Filter and Place Results Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 sm:gap-6 items-start">
            {/* ── LEFT SIDEBAR: BỘ LỌC TÌM KIẾM ── */}
            <div className="lg:col-span-1 bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/90 shadow-2xs space-y-5">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2 font-extrabold text-sm text-slate-900">
                  <SlidersHorizontal size={16} className="text-emerald-800" />
                  <span>Bộ lọc tìm kiếm</span>
                </div>
                {(selectedCategoryIds.length > 0 || selectedProvinceIds.length > 0 || selectedMinRating > 0 || searchQuery) && (
                  <button
                    type="button"
                    onClick={handleResetDetailFilters}
                    className="text-[11px] font-bold text-emerald-800 hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    <RotateCcw size={11} />
                    <span>Đặt lại</span>
                  </button>
                )}
              </div>

              {/* 1. DANH MỤC TRẢI NGHIỆM */}
              <div className="space-y-2.5">
                <div className="text-[11px] font-extrabold text-slate-500 uppercase tracking-wider">
                  DANH MỤC TRẢI NGHIỆM
                </div>

                <div className="space-y-1.5 max-h-60 overflow-y-auto pr-1">
                  {/* Tất cả danh mục */}
                  <label
                    onClick={() => {
                      setSelectedCategoryIds([]);
                      setSearchCurrentPage(1);
                    }}
                    className={`flex items-center gap-2.5 p-2 rounded-xl border transition-all cursor-pointer ${selectedCategoryIds.length === 0
                      ? "bg-emerald-50 text-emerald-900 border-emerald-300 font-bold"
                      : "bg-white text-slate-700 border-transparent hover:bg-slate-50"
                      }`}
                  >
                    <div
                      className={`w-4 h-4 rounded flex items-center justify-center border ${selectedCategoryIds.length === 0
                        ? "bg-emerald-700 border-emerald-700 text-white"
                        : "border-slate-300 bg-white"
                        }`}
                    >
                      {selectedCategoryIds.length === 0 && <Check size={11} strokeWidth={3} />}
                    </div>
                    <span className="text-xs">Tất cả danh mục</span>
                  </label>

                  {/* Danh mục con */}
                  {filterCategories.map((cat) => {
                    const isChecked = selectedCategoryIds.includes(cat.id);
                    return (
                      <label
                        key={cat.id}
                        onClick={() => handleCategoryToggle(cat.id)}
                        className={`flex items-center gap-2.5 p-2 rounded-xl border transition-all cursor-pointer ${isChecked
                          ? "bg-emerald-50 text-emerald-900 border-emerald-300 font-bold"
                          : "bg-white text-slate-700 border-transparent hover:bg-slate-50"
                          }`}
                      >
                        <div
                          className={`w-4 h-4 rounded flex items-center justify-center border ${isChecked
                            ? "bg-emerald-700 border-emerald-700 text-white"
                            : "border-slate-300 bg-white"
                            }`}
                        >
                          {isChecked && <Check size={11} strokeWidth={3} />}
                        </div>
                        <span className="text-xs truncate">{cat.name}</span>
                      </label>
                    );
                  })}
                </div>
              </div>

              {/* 2. VÙNG MIỀN & TỈNH THÀNH */}
              <div className="space-y-2.5 pt-3 border-t border-slate-100">
                <div className="text-[11px] font-extrabold text-slate-500 uppercase tracking-wider">
                  VÙNG MIỀN &amp; TỈNH THÀNH
                </div>

                <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                  {filterRegions.map((region) => {
                    const isOpen = openRegionAccordion[region.id] ?? true;
                    return (
                      <div key={region.id} className="rounded-xl border border-slate-200/80 overflow-hidden bg-slate-50/40">
                        <button
                          type="button"
                          onClick={() => toggleRegionAccordion(String(region.id))}
                          className="w-full p-2.5 text-left font-bold text-xs text-slate-800 flex items-center justify-between hover:bg-slate-100/80 transition-colors"
                        >
                          <span>{region.name}</span>
                          {isOpen ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                        </button>

                        {isOpen && region.provinces && (
                          <div className="p-2 pt-0 space-y-1 bg-white border-t border-slate-100">
                            {region.provinces.map((prov) => {
                              const isChecked = selectedProvinceIds.includes(prov.id);
                              return (
                                <label
                                  key={prov.id}
                                  onClick={() => handleProvinceToggle(prov.id)}
                                  className={`flex items-center gap-2 p-1.5 rounded-lg text-xs transition-colors cursor-pointer ${isChecked
                                    ? "bg-emerald-50 text-emerald-900 font-bold"
                                    : "text-slate-600 hover:bg-slate-50"
                                    }`}
                                >
                                  <div
                                    className={`w-3.5 h-3.5 rounded flex items-center justify-center border ${isChecked
                                      ? "bg-emerald-700 border-emerald-700 text-white"
                                      : "border-slate-300 bg-white"
                                      }`}
                                  >
                                    {isChecked && <Check size={10} strokeWidth={3} />}
                                  </div>
                                  <span className="truncate">{prov.name}</span>
                                </label>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* 3. MỨC ĐÁNH GIÁ (RATING) */}
              <div className="space-y-2.5 pt-3 border-t border-slate-100">
                <div className="text-[11px] font-extrabold text-slate-500 uppercase tracking-wider">
                  ĐÁNH GIÁ TỐI THIỂU
                </div>
                <div className="grid grid-cols-3 gap-1.5">
                  {[
                    { label: "Tất cả", val: 0 },
                    { label: "★ 4.0+", val: 4 },
                    { label: "★ 4.5+", val: 4.5 }
                  ].map((r) => (
                    <button
                      key={r.val}
                      type="button"
                      onClick={() => {
                        setSelectedMinRating(r.val);
                        setSearchCurrentPage(1);
                      }}
                      className={`py-1.5 px-2 rounded-lg text-xs font-bold border transition-colors cursor-pointer text-center ${selectedMinRating === r.val
                        ? "bg-emerald-800 text-white border-emerald-800 shadow-2xs"
                        : "bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100"
                        }`}
                    >
                      {r.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* ── RIGHT MAIN CONTENT: KẾT QUẢ TÌM KIẾM ĐỊA ĐIỂM ── */}
            <div className="lg:col-span-3 space-y-4">
              {/* Header Bar */}
              <div className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-2xs flex items-center justify-between gap-3">
                <div className="text-xs font-medium text-slate-500">
                  Tìm thấy <strong className="text-slate-900 font-extrabold">{searchTotalElements}</strong> địa điểm
                </div>

                <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl border border-slate-200">
                  <button
                    type="button"
                    onClick={() => setSearchPlacesViewMode("grid")}
                    className={`p-1.5 rounded-lg transition-colors cursor-pointer ${searchPlacesViewMode === "grid"
                      ? "bg-white text-slate-900 shadow-2xs font-bold"
                      : "text-slate-400 hover:text-slate-700"
                      }`}
                    title="Dạng lưới"
                  >
                    <LayoutGrid size={15} />
                  </button>
                  <button
                    type="button"
                    onClick={() => setSearchPlacesViewMode("list")}
                    className={`p-1.5 rounded-lg transition-colors cursor-pointer ${searchPlacesViewMode === "list"
                      ? "bg-white text-slate-900 shadow-2xs font-bold"
                      : "text-slate-400 hover:text-slate-700"
                      }`}
                    title="Dạng danh sách"
                  >
                    <List size={15} />
                  </button>
                </div>
              </div>

              {/* Places List / Grid */}
              {isSearchingPlaces ? (
                <div className="py-20 flex flex-col items-center justify-center text-slate-400 gap-2 bg-white rounded-2xl border border-slate-200">
                  <Loader2 size={26} className="animate-spin text-emerald-800" />
                  <span className="text-xs font-medium">Đang tìm kiếm danh sách địa điểm...</span>
                </div>
              ) : searchPlacesResult.length === 0 ? (
                <div className="py-16 text-center text-slate-400 bg-white rounded-2xl border border-slate-200 p-6 flex flex-col items-center gap-2">
                  <MapPin size={36} className="text-slate-300" />
                  <p className="text-sm font-bold text-slate-800">Không tìm thấy địa điểm nào phù hợp</p>
                  <p className="text-xs text-slate-500 max-w-sm">
                    Thử bỏ bớt bộ lọc danh mục, tỉnh thành hoặc tìm kiếm với từ khóa khác.
                  </p>
                  <button
                    type="button"
                    onClick={handleResetDetailFilters}
                    className="mt-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs transition-colors cursor-pointer"
                  >
                    Xóa tất cả bộ lọc
                  </button>
                </div>
              ) : searchPlacesViewMode === "grid" ? (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                  {searchPlacesResult.map((place) => {
                    const isInCollection = collectionPlaceIds.has(Number(place.id));
                    const rawThumbnail =
                      place.thumbnailUrl ||
                      (Array.isArray(place.mediaUrls) && place.mediaUrls.length > 0 ? place.mediaUrls[0] : "") ||
                      "";

                    return (
                      <div
                        key={place.id}
                        className={`bg-white rounded-2xl border overflow-hidden transition-all flex flex-col ${isInCollection
                          ? "border-emerald-300 ring-1 ring-emerald-200 shadow-2xs"
                          : "border-slate-200 hover:border-slate-300 hover:shadow-xs"
                          }`}
                      >
                        {/* Image Header */}
                        <div className="relative h-44 w-full bg-slate-100 overflow-hidden group flex items-center justify-center">
                          {rawThumbnail ? (
                            <img
                              src={rawThumbnail}
                              alt={place.name}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                              onError={(e) => {
                                const target = e.target as HTMLImageElement;
                                target.style.display = "none";
                                const parent = target.parentElement;
                                if (parent) {
                                  const fallback = parent.querySelector(".grid-img-fallback") as HTMLElement | null;
                                  if (fallback) fallback.style.display = "flex";
                                }
                              }}
                            />
                          ) : null}

                          <div
                            className={`grid-img-fallback absolute inset-0 items-center justify-center flex-col bg-slate-100 text-slate-400 gap-1.5 ${rawThumbnail ? "hidden" : "flex"
                              }`}
                          >
                            <ImageIcon size={28} className="text-slate-300" />
                            <span className="text-[11px] font-semibold text-slate-400">Chưa có hình ảnh</span>
                          </div>

                          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent pointer-events-none" />

                          {/* Location & Rating Badge */}
                          <div className="absolute bottom-2.5 left-2.5 right-2.5 flex items-center justify-between text-white text-[11px] font-bold z-10">
                            <span className="flex items-center gap-1 truncate max-w-[170px] drop-shadow-xs">
                              <MapPin size={11} className="text-emerald-400 shrink-0" />
                              <span className="truncate">{place.provinceName || place.regionName || "Việt Nam"}</span>
                            </span>
                            <span className="flex items-center gap-1 bg-black/40 backdrop-blur-xs px-2 py-0.5 rounded-md border border-white/20 shrink-0">
                              <Star size={11} className="fill-amber-400 text-amber-400" />
                              <span>{Number(place.avgRating || 5).toFixed(1)}</span>
                              <span className="text-white/70 font-normal">({place.reviewCount || 0})</span>
                            </span>
                          </div>
                        </div>

                        {/* Card Body */}
                        <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
                          <div>
                            <h4 className="font-extrabold text-sm text-slate-900 line-clamp-1 hover:text-emerald-800 transition-colors">
                              <Link to={`/places/${place.id}`} target="_blank" rel="noreferrer">
                                {place.name}
                              </Link>
                            </h4>
                            <p className="text-[11px] text-slate-500 line-clamp-2 mt-1 leading-relaxed">
                              {place.description || place.address || "Địa điểm hấp dẫn được cộng đồng đánh giá cao."}
                            </p>
                          </div>

                          {/* Card Actions */}
                          <div className="pt-2 border-t border-slate-100">
                            <button
                              type="button"
                              onClick={() => handleAddPlaceToCollection(place)}
                              disabled={isInCollection}
                              className={`w-full py-2 px-3 rounded-xl font-extrabold text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-2xs ${isInCollection
                                ? "bg-emerald-50 text-emerald-800 border border-emerald-200 cursor-default"
                                : "bg-emerald-800 hover:bg-emerald-900 text-white shadow-xs"
                                }`}
                            >
                              {isInCollection ? (
                                <>
                                  <Check size={13} strokeWidth={3} />
                                  <span>Đã thêm</span>
                                </>
                              ) : (
                                <>
                                  <Plus size={13} strokeWidth={2.5} />
                                  <span>Thêm vào</span>
                                </>
                              )}
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                /* List Mode */
                <div className="space-y-2.5">
                  {searchPlacesResult.map((place) => {
                    const isInCollection = collectionPlaceIds.has(Number(place.id));
                    const rawThumbnail =
                      place.thumbnailUrl ||
                      (Array.isArray(place.mediaUrls) && place.mediaUrls.length > 0 ? place.mediaUrls[0] : "") ||
                      "";

                    return (
                      <div
                        key={place.id}
                        className={`p-3.5 bg-white rounded-2xl border transition-all flex items-center justify-between gap-3 ${isInCollection
                          ? "border-emerald-300 ring-1 ring-emerald-200 shadow-2xs"
                          : "border-slate-200 hover:border-slate-300"
                          }`}
                      >
                        {rawThumbnail ? (
                          <img
                            src={rawThumbnail}
                            alt={place.name}
                            className="w-16 h-16 rounded-xl object-cover shrink-0 border border-slate-200"
                            onError={(e) => {
                              const target = e.target as HTMLImageElement;
                              target.style.display = "none";
                              const sibling = target.nextElementSibling as HTMLElement | null;
                              if (sibling) sibling.style.display = "flex";
                            }}
                          />
                        ) : null}
                        <div
                          className={`w-16 h-16 rounded-xl bg-slate-100 border border-slate-200 shrink-0 items-center justify-center text-slate-400 flex-col gap-0.5 ${rawThumbnail ? "hidden" : "flex"
                            }`}
                          title="Chưa có hình ảnh"
                        >
                          <ImageIcon size={18} className="text-slate-300" />
                          <span className="text-[9px] font-medium text-slate-400">Không ảnh</span>
                        </div>

                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h4 className="font-extrabold text-sm text-slate-900 truncate">{place.name}</h4>
                            {place.categoryName && (
                              <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-slate-100 text-slate-700">
                                {place.categoryName}
                              </span>
                            )}
                          </div>

                          <div className="flex items-center gap-2 text-[11px] text-slate-500 mt-1 flex-wrap">
                            <span className="flex items-center gap-1 text-amber-800 font-bold">
                              <Star size={11} className="fill-amber-400 text-amber-400" />
                              <span>{Number(place.avgRating || 5).toFixed(1)}</span>
                              <span className="text-slate-400 font-normal">({place.reviewCount || 0})</span>
                            </span>
                            <span className="text-slate-300">•</span>
                            <span className="text-slate-400 truncate max-w-sm">
                              {place.address || place.provinceName || "Việt Nam"}
                            </span>
                          </div>
                        </div>

                        <div className="shrink-0">
                          <button
                            type="button"
                            onClick={() => handleAddPlaceToCollection(place)}
                            disabled={isInCollection}
                            className={`py-2 px-3.5 rounded-xl font-extrabold text-xs flex items-center gap-1.5 transition-all cursor-pointer shadow-2xs ${isInCollection
                              ? "bg-emerald-50 text-emerald-800 border border-emerald-200 cursor-default"
                              : "bg-emerald-800 hover:bg-emerald-900 text-white shadow-xs"
                              }`}
                          >
                            {isInCollection ? (
                              <>
                                <Check size={13} strokeWidth={3} />
                                <span>Đã thêm</span>
                              </>
                            ) : (
                              <>
                                <Plus size={13} strokeWidth={2.5} />
                                <span>Thêm vào BST</span>
                              </>
                            )}
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Pagination */}
              {searchTotalPages > 1 && (
                <div className="bg-white p-3 rounded-2xl border border-slate-200/90 shadow-2xs flex items-center justify-between gap-3">
                  <button
                    type="button"
                    disabled={searchCurrentPage <= 1}
                    onClick={() => setSearchCurrentPage((p) => Math.max(1, p - 1))}
                    className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer flex items-center gap-1"
                  >
                    <ChevronLeft size={14} />
                    <span>Trang trước</span>
                  </button>

                  <span className="text-xs font-bold text-slate-700">
                    Trang {searchCurrentPage} / {searchTotalPages}
                  </span>

                  <button
                    type="button"
                    disabled={searchCurrentPage >= searchTotalPages}
                    onClick={() => setSearchCurrentPage((p) => Math.min(searchTotalPages, p + 1))}
                    className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer flex items-center gap-1"
                  >
                    <span>Trang sau</span>
                    <ChevronRight size={14} />
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-150 text-xs">
      {/* ── TOOLBAR & FILTER BAR ── */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-2xs space-y-3">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          {/* Search Input */}
          <div className="relative flex-1">
            <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Tìm kiếm bộ sưu tập theo tên, tỉnh thành..."
              value={searchCatalogQuery}
              onChange={(e) => setSearchCatalogQuery(e.target.value)}
              className="w-full pl-9 pr-8 py-2 bg-slate-50 focus:bg-white border border-slate-200 focus:border-emerald-600 rounded-xl text-xs text-slate-800 placeholder:text-slate-400 outline-none transition-all"
            />
            {searchCatalogQuery && (
              <button
                type="button"
                onClick={() => setSearchCatalogQuery("")}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X size={13} />
              </button>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2 flex-wrap">
            <button
              type="button"
              onClick={handleCreateNewCollection}
              className="px-4 py-2 bg-emerald-800 hover:bg-emerald-900 text-white font-bold rounded-xl transition-all flex items-center gap-1.5 cursor-pointer shadow-xs"
            >
              <Plus size={15} strokeWidth={2.5} />
              <span>Tạo bộ sưu tập mới</span>
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="flex items-center justify-between gap-3 pt-2 border-t border-slate-100 flex-wrap">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Tỉnh thành:</span>
            <select
              value={selectedProvinceCatalog}
              onChange={(e) => setSelectedProvinceCatalog(e.target.value)}
              className="px-2.5 py-1 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-700 outline-none cursor-pointer"
            >
              <option value="all">Tất cả tỉnh thành</option>
              {provinces.map((p) => (
                <option key={p.id} value={p.name}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>

          <div className="text-[11px] text-slate-500 font-medium">
            Hiển thị <strong className="text-slate-900">{filteredCollections.length}</strong> bộ sưu tập
          </div>
        </div>
      </div>

      {/* ── COLLECTIONS TABLE VIEW (1 DÒNG NGANG MỖI BỘ SƯU TẬP) ── */}
      {isLoading ? (
        <div className="py-20 flex flex-col items-center justify-center text-slate-400 gap-2 bg-white rounded-2xl border border-slate-200">
          <Loader2 size={28} className="animate-spin text-emerald-800" />
          <span className="text-xs font-medium">Đang tải danh sách bộ sưu tập tuyển chọn...</span>
        </div>
      ) : filteredCollections.length === 0 ? (
        <div className="py-16 text-center text-slate-400 bg-white rounded-2xl border border-slate-200 p-6 flex flex-col items-center gap-2">
          <FolderHeart size={40} className="text-slate-300" />
          <p className="text-sm font-bold text-slate-800">Không tìm thấy bộ sưu tập nào</p>
          <p className="text-xs text-slate-500 max-w-sm">
            Tạo mới các bộ sưu tập địa điểm theo chủ đề để người dùng dễ dàng khám phá trải nghiệm đặc sắc.
          </p>
          <button
            type="button"
            onClick={handleCreateNewCollection}
            className="mt-3 px-4 py-2 text-xs font-bold text-white bg-emerald-800 rounded-xl hover:bg-emerald-900 transition-colors shadow-xs inline-flex items-center gap-1.5 cursor-pointer"
          >
            <Plus size={14} />
            <span>Tạo bộ sưu tập đầu tiên</span>
          </button>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs overflow-hidden">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-500 font-bold text-[11px] uppercase tracking-wider">
                <th className="p-3.5 pl-4 w-12 text-center">STT</th>
                <th className="p-3.5">Bộ sưu tập</th>
                <th className="p-3.5">Tỉnh / Thành</th>
                <th className="p-3.5">Số lượng địa điểm</th>
                <th className="p-3.5">Thứ tự</th>
                <th className="p-3.5">Trạng thái</th>
                <th className="p-3.5 text-right pr-4">Hành động</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredCollections.map((col, idx) => (
                <tr key={col.id} className="hover:bg-slate-50/70 transition-colors group">
                  <td className="p-3.5 pl-4 text-center">
                    <span className="w-6 h-6 rounded-lg bg-slate-100 text-slate-700 font-extrabold text-[11px] inline-flex items-center justify-center">
                      {idx + 1}
                    </span>
                  </td>
                  <td className="p-3.5">
                    <div className="min-w-0">
                      <div className="font-extrabold text-sm text-slate-900 group-hover:text-emerald-800 transition-colors">
                        {col.title}
                      </div>
                      <div className="text-[11px] text-slate-400 mt-0.5">
                        Mã: #{col.id}
                      </div>
                    </div>
                  </td>
                  <td className="p-3.5">
                    <span className="inline-flex items-center gap-1 font-semibold text-slate-700 bg-slate-50 border border-slate-200 px-2.5 py-1 rounded-lg">
                      <MapPin size={11} className="text-emerald-600" />
                      <span>{col.provinceName || "Toàn quốc"}</span>
                    </span>
                  </td>
                  <td className="p-3.5">
                    <span className="font-bold text-slate-800 bg-emerald-50 text-emerald-900 border border-emerald-200 px-2.5 py-1 rounded-lg text-xs">
                      {col.placeCount ?? 0} địa điểm
                    </span>
                  </td>
                  <td className="p-3.5">
                    <span className="font-extrabold text-slate-700 text-xs">
                      {col.displayOrder}
                    </span>
                  </td>
                  <td className="p-3.5">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold ${col.status === 1
                          ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
                          : "bg-slate-100 text-slate-500 border border-slate-200"
                          }`}
                      >
                        {col.status === 1 ? "Hoạt động" : "Tạm ẩn"}
                      </span>
                    </div>
                  </td>
                  <td className="p-3.5 text-right pr-4">
                    <div className="flex items-center justify-end gap-1.5">
                      <button
                        type="button"
                        onClick={() => setActiveCollectionId(col.id)}
                        className="px-3.5 py-1.5 bg-emerald-800 hover:bg-emerald-900 text-white font-bold rounded-xl text-xs transition-all flex items-center gap-1.5 cursor-pointer shadow-2xs"
                        title="Vào giao diện chi tiết & thiết kế địa điểm"
                      >
                        <Eye size={13} />
                        <span>Chi tiết</span>
                      </button>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleToggleCollectionStatus(col.id);
                        }}
                        className={`p-1.5 rounded-lg border transition-all cursor-pointer ${col.status === 1
                          ? "text-slate-400 hover:text-amber-700 hover:bg-amber-50 border-slate-200"
                          : "text-emerald-700 hover:text-emerald-800 hover:bg-emerald-50 border-emerald-200 bg-emerald-50/50"
                          }`}
                        title={col.status === 1 ? "Ẩn bộ sưu tập (Tạm ẩn)" : "Hiện bộ sưu tập (Kích hoạt)"}
                      >
                        {col.status === 1 ? <EyeOff size={13} /> : <Eye size={13} />}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

    </div>
  );
};

export default CollectionsTab;
