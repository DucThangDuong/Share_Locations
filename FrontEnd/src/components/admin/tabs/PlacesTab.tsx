import React, { useMemo, useState, useEffect, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Search, Plus, Star, ChevronLeft, ChevronRight, Loader2, X, ImageIcon, ArrowUpDown, ArrowUp, ArrowDown } from "lucide-react";
import { PlaceDetailEditor } from "./PlaceDetailEditor";
import { AddPlaceView } from "./AddPlaceView";
import { geographyService } from "@/services/geographyService";
import { placeService } from "@/services/placeService";
import { adminService, extractList } from "@/services/adminService";
import type { ProvinceDto } from "@/types/models/geography.model";
import { CustomSelect } from "@/components/common/CustomSelect";

interface PlacesTabProps {
  placesList: any[];
  isLoading?: boolean;
  pagination?: {
    page: number;
    pageSize: number;
    totalElements: number;
    totalPages: number;
  };
  onPageChange?: (page: number) => void;
  onFilterChange?: (filters: {
    keyword?: string;
    province?: string;
    provinceId?: number;
    category?: string;
    categoryId?: number;
    status?: any;
    sortBy?: string;
    sortOrder?: "asc" | "desc";
    page?: number;
    pageSize?: number;
  }) => void;
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
  setIsAddPlaceModalOpen?: (v: boolean) => void;
  handleTogglePlaceStatus?: (id: number) => void;
  handleUpdatePlace?: (updatedPlace: any) => void;
  handleDeletePlace?: (id: number) => Promise<void> | void;
  onPlaceCreated?: (newPlace: any) => void;
  showToast?: (msg: string) => void;
}

export const PlacesTab: React.FC<PlacesTabProps> = ({
  placesList = [],
  isLoading = false,
  pagination = {
    page: 1,
    pageSize: 10,
    totalElements: placesList.length,
    totalPages: 1,
  },
  onPageChange,
  onFilterChange,
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
  setIsAddPlaceModalOpen: _setIsAddPlaceModalOpen,
  handleTogglePlaceStatus,
  handleUpdatePlace,
  handleDeletePlace,
  onPlaceCreated,
  showToast,
}) => {
  const navigate = useNavigate();
  const location = useLocation();

  const [localCategoryFilter, setLocalCategoryFilter] = useState("all");
  const categoryFilter = propFilterCategory ?? localCategoryFilter;
  const setCategoryFilter = propSetFilterCategory ?? setLocalCategoryFilter;

  const [provinces, setProvinces] = useState<ProvinceDto[]>([]);
  const [categories, setCategories] = useState<{ id: string | number; name: string }[]>([]);

  type SortField = "name" | "rating" | "updatedAt" | null;
  type SortOrder = "asc" | "desc";

  const [sortField, setSortField] = useState<SortField>(() => {
    return (new URLSearchParams(window.location.search).get("sortBy") as SortField) || null;
  });
  const [sortOrder, setSortOrder] = useState<SortOrder>(() => {
    return (new URLSearchParams(window.location.search).get("sortOrder") as SortOrder) || "desc";
  });

  const updateUrlParams = (updates: {
    keyword?: string;
    province?: string;
    provinceId?: number | string | null;
    category?: string;
    categoryId?: number | string | null;
    status?: any;
    sortBy?: string | null;
    sortOrder?: "asc" | "desc" | null;
    page?: number;
  }) => {
    const params = new URLSearchParams(location.search);

    const merged = {
      keyword: updates.keyword !== undefined ? updates.keyword : placeSearchText,
      provinceId: updates.provinceId !== undefined ? updates.provinceId : placeFilterProvince,
      categoryId: updates.categoryId !== undefined ? updates.categoryId : categoryFilter,
      status: updates.status !== undefined ? updates.status : placeFilterStatus,
      sortBy: updates.sortBy !== undefined ? updates.sortBy : sortField,
      sortOrder: updates.sortOrder !== undefined ? updates.sortOrder : sortOrder,
      page: updates.page !== undefined ? updates.page : 1,
    };

    if (merged.keyword?.trim()) {
      params.set("keyword", merged.keyword.trim());
    } else {
      params.delete("keyword");
      params.delete("search");
    }

    if (merged.provinceId && merged.provinceId !== "all") {
      params.set("provinceId", String(merged.provinceId));
      params.delete("province");
    } else {
      params.delete("provinceId");
      params.delete("province");
    }

    if (merged.categoryId && merged.categoryId !== "all") {
      params.set("categoryId", String(merged.categoryId));
      params.delete("category");
    } else {
      params.delete("categoryId");
      params.delete("category");
    }

    if (merged.status !== undefined && merged.status !== null && merged.status !== "all") {
      params.set("status", String(merged.status));
    } else {
      params.delete("status");
    }

    if (merged.sortBy) {
      params.set("sortBy", merged.sortBy);
      params.set("sortOrder", merged.sortOrder || "desc");
    } else {
      params.delete("sortBy");
      params.delete("sortOrder");
    }

    if (merged.page && merged.page > 1) {
      params.set("page", String(merged.page));
    } else {
      params.delete("page");
    }

    const qs = params.toString();
    const newPath = `/admin/places${qs ? `?${qs}` : ""}`;
    if (location.pathname + location.search !== newPath) {
      navigate(newPath, { replace: true });
    }
  };

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const urlSort = (params.get("sortBy") as SortField) || null;
    const urlOrder = (params.get("sortOrder") as SortOrder) || "desc";
    setSortField((prev) => (prev !== urlSort ? urlSort : prev));
    setSortOrder((prev) => (prev !== urlOrder ? urlOrder : prev));

    const urlProv = params.get("provinceId") || params.get("province");
    if (urlProv && urlProv !== placeFilterProvince) {
      setPlaceFilterProvince(urlProv);
    }
    const urlCat = params.get("categoryId") || params.get("category");
    if (urlCat && urlCat !== categoryFilter) {
      setCategoryFilter(urlCat);
    }
    const urlStat = params.get("status");
    if (urlStat && urlStat !== placeFilterStatus) {
      setPlaceFilterStatus(urlStat);
    }
    const urlKw = params.get("keyword") || params.get("search");
    if (urlKw !== null && urlKw !== undefined && urlKw !== placeSearchText) {
      setPlaceSearchText(urlKw);
    }
  }, [location.search]);

  const handleSort = (field: "name" | "rating" | "updatedAt") => {
    let nextOrder: SortOrder = "desc";
    let nextField: SortField = field;
    if (sortField === field) {
      if (sortOrder === "desc") {
        nextOrder = "asc";
      } else {
        nextField = null;
      }
    } else {
      nextOrder = field === "name" ? "asc" : "desc";
    }

    setSortField(nextField);
    setSortOrder(nextOrder);
    updateUrlParams({
      sortBy: nextField,
      sortOrder: nextField ? nextOrder : null,
      page: 1,
    });
    onFilterChange?.({
      sortBy: nextField || undefined,
      sortOrder: nextField ? nextOrder : undefined,
      page: 1,
    });
  };

  const matchProvince = (p: any, filterVal: string) => {
    if (!filterVal || filterVal === "all") return true;
    if (String(p.provinceId) === String(filterVal)) return true;
    const pName = String(p.province || p.provinceName || "").trim().toLowerCase();
    const fName = String(filterVal).trim().toLowerCase();
    if (pName === fName) return true;
    if (pName.includes(fName) || fName.includes(pName)) return true;

    const cleanP = pName.replace(/^(tp\.?|thành phố|tỉnh)\s+/i, "").trim();
    const cleanF = fName.replace(/^(tp\.?|thành phố|tỉnh)\s+/i, "").trim();
    return cleanP === cleanF || cleanP.includes(cleanF) || cleanF.includes(cleanP);
  };

  const matchCategory = (p: any, filterVal: string) => {
    if (!filterVal || filterVal === "all") return true;
    if (String(p.categoryId) === String(filterVal)) return true;
    const pCat = String(p.category || p.categoryName || "").trim().toLowerCase();
    const fCat = String(filterVal).trim().toLowerCase();
    return pCat === fCat || pCat.includes(fCat) || fCat.includes(pCat);
  };

  const matchStatus = (p: any, filterVal: string) => {
    if (!filterVal || filterVal === "all") return true;
    const isPlaceActive =
      Number(p.statusNum ?? p.status) === 1 ||
      String(p.status || "").toLowerCase() === "active" ||
      p.status === "Công khai" ||
      p.status === "Đang hiển thị" ||
      p.status === "Đã duyệt";

    if (filterVal === "active" || filterVal === "1") return isPlaceActive;
    if (filterVal === "hidden" || filterVal === "0") return !isPlaceActive;
    return true;
  };

  const filteredPlaces = useMemo(() => {
    return placesList.filter((p) => {
      if (placeSearchText.trim()) {
        const query = placeSearchText.trim().toLowerCase();
        const name = String(p.name || "").toLowerCase();
        const address = String(p.location || p.address || "").toLowerCase();
        const cat = String(p.category || p.categoryName || "").toLowerCase();
        const prov = String(p.province || p.provinceName || "").toLowerCase();
        if (
          !name.includes(query) &&
          !address.includes(query) &&
          !cat.includes(query) &&
          !prov.includes(query)
        ) {
          return false;
        }
      }

      if (placeFilterProvince && placeFilterProvince !== "all") {
        if (!matchProvince(p, placeFilterProvince)) {
          return false;
        }
      }

      if (categoryFilter && categoryFilter !== "all") {
        if (!matchCategory(p, categoryFilter)) {
          return false;
        }
      }

      if (placeFilterStatus && placeFilterStatus !== "all") {
        if (!matchStatus(p, placeFilterStatus)) {
          return false;
        }
      }

      return true;
    });
  }, [placesList, placeSearchText, placeFilterProvince, categoryFilter, placeFilterStatus]);

  const sortedPlaces = useMemo(() => {
    if (!sortField) return filteredPlaces;
    return [...filteredPlaces].sort((a, b) => {
      if (sortField === "name") {
        const nameA = String(a.name || "").trim().toLowerCase();
        const nameB = String(b.name || "").trim().toLowerCase();
        return sortOrder === "asc"
          ? nameA.localeCompare(nameB, "vi")
          : nameB.localeCompare(nameA, "vi");
      }
      if (sortField === "rating") {
        const rA = Number(a.rating ?? a.avgRating ?? 0);
        const rB = Number(b.rating ?? b.avgRating ?? 0);
        return sortOrder === "asc" ? rA - rB : rB - rA;
      }
      if (sortField === "updatedAt") {
        const timeA = new Date(a.updatedAt || a.updatedDate || a.createdAt || a.createdDate || 0).getTime();
        const timeB = new Date(b.updatedAt || b.updatedDate || b.createdAt || b.createdDate || 0).getTime();
        return sortOrder === "asc" ? timeA - timeB : timeB - timeA;
      }
      return 0;
    });
  }, [filteredPlaces, sortField, sortOrder]);

  const renderSortIcon = (field: "name" | "rating" | "updatedAt") => {
    if (sortField !== field) {
      return <ArrowUpDown size={12} className="text-slate-300 group-hover:text-slate-500 transition-colors" />;
    }
    return sortOrder === "asc" ? (
      <ArrowUp size={12} className="text-emerald-700" />
    ) : (
      <ArrowDown size={12} className="text-emerald-700" />
    );
  };

  const formatUpdatedDate = (p: any) => {
    const rawDate = p.updatedAt || p.updatedDate || p.createdAt || p.createdDate;
    const author = p.updatedBy || p.createdBy || p.creatorName || p.author || "Admin";
    if (!rawDate) {
      return { dateStr: "20/10/2026", author };
    }
    const d = new Date(rawDate);
    if (isNaN(d.getTime())) {
      return { dateStr: String(rawDate), author };
    }
    const day = String(d.getDate()).padStart(2, "0");
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const year = d.getFullYear();
    return { dateStr: `${day}/${month}/${year}`, author };
  };

  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const addUniqueCategory = (
    list: { id: string | number; name: string }[],
    item: { id: string | number; name: string }
  ) => {
    if (!item.name) return;
    const normName = item.name.trim().toLowerCase();
    const exists = list.some(
      (c) =>
        String(c.id) === String(item.id) ||
        c.name.trim().toLowerCase() === normName
    );
    if (!exists) {
      list.push(item);
    }
  };

  useEffect(() => {
    let mounted = true;
    const loadMetadata = async () => {
      try {
        const [provRes, catRes, filterRes] = await Promise.allSettled([
          geographyService.getProvinces(),
          adminService.getCatalogCategories({ pageSize: 100 }),
          placeService.getFilterOptions(),
        ]);
        if (mounted) {
          if (provRes.status === "fulfilled") {
            const provList = extractList<ProvinceDto>(provRes.value?.data || provRes.value);
            if (provList.length > 0) {
              setProvinces(provList);
            }
          }

          const catList: { id: string | number; name: string }[] = [];

          if (catRes.status === "fulfilled") {
            const list = extractList<any>(catRes.value?.data || catRes.value);
            list.forEach((c: any) => {
              if (c?.id && c?.name) {
                addUniqueCategory(catList, { id: c.id, name: c.name });
              }
            });
          }

          if (filterRes.status === "fulfilled") {
            const fCats = filterRes.value?.data?.categories || (filterRes.value as any)?.categories || [];
            if (Array.isArray(fCats)) {
              fCats.forEach((c: any) => {
                if (c?.id && c?.name) {
                  addUniqueCategory(catList, { id: c.id, name: c.name });
                }
              });
            }
          }

          if (placesList && placesList.length > 0) {
            placesList.forEach((p) => {
              const cName = p.categoryName || p.category;
              const cId = p.categoryId;
              if (cName) {
                addUniqueCategory(catList, { id: cId || cName, name: cName });
              }
            });
          }

          if (catList.length > 0) {
            setCategories(catList);
          }
        }
      } catch (err) {
        console.error("Error loading places metadata:", err);
      }
    };
    loadMetadata();
    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    if (!placesList || placesList.length === 0) return;
    setCategories((prev) => {
      let changed = false;
      const next = [...prev];
      placesList.forEach((p) => {
        const cName = p.categoryName || p.category;
        const cId = p.categoryId;
        if (!cName) return;
        const normName = cName.trim().toLowerCase();
        const exists = next.some(
          (c) =>
            (cId && String(c.id) === String(cId)) ||
            c.name.trim().toLowerCase() === normName
        );
        if (!exists) {
          next.push({ id: cId || cName, name: cName });
          changed = true;
        }
      });
      return changed ? next : prev;
    });
  }, [placesList]);

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

  const allCategories = useMemo(() => {
    return categories;
  }, [categories]);

  const placePathMatch = location.pathname.match(/\/admin\/places\/(\d+)/i);
  const urlPlaceId = placePathMatch ? Number(placePathMatch[1]) : selectedPlaceId;

  const [detailPlace, setDetailPlace] = useState<any>(null);
  const [isDetailLoading, setIsDetailLoading] = useState(false);

  useEffect(() => {
    if (!urlPlaceId) {
      setDetailPlace(null);
      return;
    }

    const found = placesList.find((p) => Number(p.id) === urlPlaceId);
    if (found) {
      setDetailPlace(found);
      return;
    }

    let active = true;
    setIsDetailLoading(true);
    adminService
      .getPlace(urlPlaceId)
      .then((res: any) => {
        if (!active) return;
        const data = res?.data || res;
        if (data) {
          const isVis =
            data.status === 1 ||
            data.status === "1" ||
            data.statusNum === 1 ||
            String(data.status || "").toLowerCase() === "active" ||
            String(data.status || "").toLowerCase() === "approved" ||
            data.status === "Đang hiển thị" ||
            data.status === "Đã duyệt";
          const formatted = {
            ...data,
            id: data.id || urlPlaceId,
            name: data.name || data.title || "",
            province: data.provinceName || data.province || "",
            provinceName: data.provinceName || data.province || "",
            provinceId: data.provinceId,
            category: data.categoryName || data.category || "",
            categoryName: data.categoryName || data.category || "",
            categoryId: data.categoryId,
            location: data.address || data.location || "",
            address: data.address || data.location || "",
            img: data.coverImg || data.thumbnailUrl || data.img || data.image || "",
            coverImg: data.coverImg || data.thumbnailUrl || data.img || data.image || "",
            rating: Number(data.avgRating ?? data.rating ?? 0),
            avgRating: Number(data.avgRating ?? data.rating ?? 0),
            price: data.priceLevel || data.price || "",
            hours: data.openingHours || data.hours || "",
            latitude: data.latitude ?? data.lat,
            longitude: data.longitude ?? data.lng,
            desc: data.desc || data.description || "",
            status: isVis ? "Đang hiển thị" : "Đang ẩn",
            statusNum: isVis ? 1 : 0,
          };
          setDetailPlace(formatted);
        }
      })
      .catch((err: any) => {
        console.error("Lỗi khi tải chi tiết địa điểm:", err);
      })
      .finally(() => {
        if (active) setIsDetailLoading(false);
      });

    return () => {
      active = false;
    };
  }, [urlPlaceId, placesList]);

  const currentPlace = useMemo(() => {
    if (!urlPlaceId) return null;
    return placesList.find((p) => Number(p.id) === urlPlaceId) || detailPlace;
  }, [urlPlaceId, placesList, detailPlace]);

  const handleSearchChange = (value: string) => {
    setPlaceSearchText(value);
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }
    debounceTimerRef.current = setTimeout(() => {
      updateUrlParams({ keyword: value, page: 1 });
      onFilterChange?.({ keyword: value, page: 1 });
    }, 350);
  };

  const selectedProvinceValue = useMemo(() => {
    if (!placeFilterProvince || placeFilterProvince === "all") return "all";
    if (allProvinces.some((p) => String(p.id) === String(placeFilterProvince))) {
      return String(placeFilterProvince);
    }
    const found = allProvinces.find(
      (p) => p.name.toLowerCase() === String(placeFilterProvince).toLowerCase()
    );
    if (found) return String(found.id);
    return String(placeFilterProvince);
  }, [placeFilterProvince, allProvinces]);

  const selectedCategoryValue = useMemo(() => {
    if (!categoryFilter || categoryFilter === "all") return "all";
    if (allCategories.some((c) => String(c.id) === String(categoryFilter))) {
      return String(categoryFilter);
    }
    const found = allCategories.find(
      (c) => c.name.toLowerCase() === String(categoryFilter).toLowerCase()
    );
    if (found) return String(found.id);
    return String(categoryFilter);
  }, [categoryFilter, allCategories]);

  const selectedStatusValue = useMemo(() => {
    if (!placeFilterStatus || placeFilterStatus === "all") return "all";
    if (String(placeFilterStatus) === "1" || placeFilterStatus === "active") return "1";
    if (String(placeFilterStatus) === "0" || placeFilterStatus === "hidden") return "0";
    return String(placeFilterStatus);
  }, [placeFilterStatus]);

  const handleProvinceChange = (value: string) => {
    setPlaceFilterProvince(value);
    const pId = value === "all" ? undefined : Number(value);
    updateUrlParams({ provinceId: value === "all" ? null : value, page: 1 });
    onFilterChange?.({ provinceId: pId, province: value, page: 1 });
  };

  const handleCategoryChange = (value: string) => {
    setCategoryFilter(value);
    const cId = value === "all" ? undefined : Number(value);
    updateUrlParams({ categoryId: value === "all" ? null : value, page: 1 });
    onFilterChange?.({ categoryId: cId, category: value, page: 1 });
  };

  const handleStatusChange = (value: string) => {
    setPlaceFilterStatus(value);
    const sId = value === "all" ? undefined : Number(value);
    updateUrlParams({ status: value === "all" ? null : value, page: 1 });
    onFilterChange?.({ status: sId, page: 1 });
  };

  const isCreateMode = Boolean(
    location.pathname.match(/\/admin\/places\/(create|new|them-dia-diem)/i)
  );

  if (isCreateMode) {
    return (
      <AddPlaceView
        onBack={() => navigate(`/admin/places${location.search}`)}
        onPlaceCreated={(createdPlace) => {
          if (onPlaceCreated) onPlaceCreated(createdPlace);
          navigate(`/admin/places${location.search}`);
        }}
        showToast={showToast}
      />
    );
  }

  if (urlPlaceId) {
    if (isDetailLoading && !currentPlace) {
      return (
        <div className="bg-white p-16 rounded-3xl border border-slate-200/80 shadow-xs flex flex-col items-center justify-center gap-3">
          <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
          <span className="text-xs text-slate-500 font-medium">Đang tải thông tin địa điểm...</span>
        </div>
      );
    }

    if (currentPlace) {
      return (
        <PlaceDetailEditor
          place={currentPlace}
          onBack={() => {
            setSelectedPlaceId(null);
            navigate(`/admin/places${location.search}`);
          }}
          onSave={async (updatedPlace) => {
            if (handleUpdatePlace) {
              await handleUpdatePlace(updatedPlace);
            }
            setDetailPlace((prev: any) => ({ ...prev, ...updatedPlace }));
          }}
          onToggleStatus={(id) => {
            handleTogglePlaceStatus?.(id);
            setDetailPlace((prev: any) => {
              if (!prev) return prev;
              const nextStatusNum = prev.statusNum === 1 ? 0 : 1;
              return {
                ...prev,
                statusNum: nextStatusNum,
                status: nextStatusNum === 1 ? "Đang hiển thị" : "Đang ẩn",
              };
            });
          }}
          onDelete={async (deletedId) => {
            if (handleDeletePlace) {
              await handleDeletePlace(deletedId);
            }
            setSelectedPlaceId(null);
            navigate(`/admin/places${location.search}`);
          }}
        />
      );
    }
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
              onChange={(e) => handleSearchChange(e.target.value)}
              className="w-full pl-9 pr-8 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-medium text-slate-800 placeholder:text-slate-400 focus:bg-white outline-none focus:border-emerald-500"
            />
            {placeSearchText && (
              <button
                type="button"
                onClick={() => handleSearchChange("")}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X size={14} />
              </button>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <CustomSelect
              value={selectedProvinceValue}
              onChange={(val) => handleProvinceChange(val)}
              options={[
                { value: "all", label: "Tất cả tỉnh thành" },
                ...allProvinces.map((prov) => ({
                  value: String(prov.id),
                  label: prov.name,
                })),
              ]}
              size="sm"
              className="min-w-[140px]"
            />

            <CustomSelect
              value={selectedCategoryValue}
              onChange={(val) => handleCategoryChange(val)}
              options={[
                { value: "all", label: "Tất cả danh mục" },
                ...allCategories.map((cat) => ({
                  value: String(cat.id),
                  label: cat.name,
                })),
              ]}
              size="sm"
              className="min-w-[140px]"
            />

            <CustomSelect
              value={selectedStatusValue}
              onChange={(val) => handleStatusChange(val)}
              options={[
                { value: "all", label: "Tất cả trạng thái" },
                { value: "1", label: "Công khai" },
                { value: "0", label: "Đang ẩn" },
              ]}
              size="sm"
              className="min-w-[130px]"
            />

            <button
              type="button"
              onClick={() => navigate('/admin/places/create')}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold cursor-pointer transition-all shadow-sm shadow-emerald-600/20 text-xs"
            >
              <Plus size={14} />
              <span>Thêm địa điểm</span>
            </button>
          </div>
        </div>

        <div className="overflow-x-auto rounded-xl border border-slate-200/80">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-500 font-bold text-[11px] uppercase tracking-wider">
                <th className="p-3.5 pl-4">
                  <button
                    type="button"
                    onClick={() => handleSort("name")}
                    className="group inline-flex items-center gap-1.5 hover:text-slate-900 transition-colors cursor-pointer select-none"
                    title="Sắp xếp theo tên địa điểm"
                  >
                    <span>Địa điểm</span>
                    {renderSortIcon("name")}
                  </button>
                </th>
                <th className="p-3.5">Danh mục</th>
                <th className="p-3.5">Tỉnh / Thành</th>
                <th className="p-3.5">Trạng thái</th>
                <th className="p-3.5">
                  <button
                    type="button"
                    onClick={() => handleSort("rating")}
                    className="group inline-flex items-center gap-1.5 hover:text-slate-900 transition-colors cursor-pointer select-none"
                    title="Sắp xếp theo đánh giá"
                  >
                    <span>Đánh giá</span>
                    {renderSortIcon("rating")}
                  </button>
                </th>
                <th className="p-3.5">
                  <button
                    type="button"
                    onClick={() => handleSort("updatedAt")}
                    className="group inline-flex items-center gap-1.5 hover:text-slate-900 transition-colors cursor-pointer select-none"
                    title="Sắp xếp theo thời gian cập nhật"
                  >
                    <span>Cập nhật</span>
                    {renderSortIcon("updatedAt")}
                  </button>
                </th>
                <th className="p-3.5 text-center">Xem chi tiết</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {isLoading ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <Loader2 size={24} className="animate-spin text-emerald-600" />
                      <span>Đang tải danh sách địa điểm từ máy chủ...</span>
                    </div>
                  </td>
                </tr>
              ) : sortedPlaces.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400 font-medium">
                    Không tìm thấy địa điểm nào phù hợp với bộ lọc.
                  </td>
                </tr>
              ) : (
                sortedPlaces.map((p) => {
                  const isPlaceActive =
                    Number(p.statusNum ?? p.status) === 1 ||
                    String(p.status || "").toLowerCase() === "active" ||
                    p.status === "Công khai" ||
                    p.status === "Đang hiển thị" ||
                    p.status === "Đã duyệt";

                  const cover = p.img || p.thumbnailUrl || p.coverImg || p.coverImageUrl || "";

                  return (
                    <tr key={p.id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="p-3.5 pl-4 font-bold text-slate-900">
                        <div className="flex items-center gap-3">
                          {cover ? (
                            <img
                              src={cover}
                              className="w-10 h-10 rounded-lg object-cover border border-slate-200 shrink-0"
                              alt=""
                              onError={(e) => {
                                const target = e.target as HTMLImageElement;
                                target.style.display = "none";
                                const sibling = target.nextElementSibling as HTMLElement | null;
                                if (sibling) sibling.style.display = "flex";
                              }}
                            />
                          ) : null}
                          <div
                            className={`w-10 h-10 rounded-lg bg-slate-100 border border-slate-200 items-center justify-center text-slate-400 shrink-0 ${cover ? "hidden" : "flex"
                              }`}
                            title="Không có hình ảnh"
                          >
                            <ImageIcon size={14} className="text-slate-300" />
                          </div>
                          <div>
                            <div className="font-bold text-slate-900">{p.name || "--"}</div>
                            <div className="text-[11px] text-slate-400 font-normal truncate max-w-xs">
                              {p.location || p.address || "--"}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="p-3.5 text-slate-700 font-medium">
                        {p.category || p.categoryName || "--"}
                      </td>
                      <td className="p-3.5 text-slate-700 font-medium">{p.province || p.provinceName || "--"}</td>
                      <td className="p-3.5">
                        <span
                          className={`inline-flex items-center justify-center px-3.5 py-1 rounded-xl text-xs font-bold border transition-colors ${isPlaceActive
                            ? "bg-[#e6fcf5] text-[#087f5b] border-[#63e6be]"
                            : "bg-slate-100 text-slate-700 border-slate-300"
                            }`}
                        >
                          {isPlaceActive ? "Công khai" : "Tạm ẩn"}
                        </span>
                      </td>
                      <td className="p-3.5">
                        <div className="flex items-center gap-1 font-bold text-amber-900">
                          <Star size={13} className="fill-amber-400 text-amber-400" />
                          <span>{p.rating !== undefined && p.rating !== null ? p.rating : "--"}</span>
                        </div>
                      </td>
                      <td className="p-3.5 whitespace-nowrap text-[11px]">
                        {(() => {
                          const info = formatUpdatedDate(p);
                          return (
                            <div className="flex items-center gap-1.5">
                              <span className="font-semibold text-slate-800">{info.dateStr}</span>
                            </div>
                          );
                        })()}
                      </td>
                      <td className="p-3.5 text-center" onClick={(e) => e.stopPropagation()}>
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedPlaceId(p.id);
                            navigate(`/admin/places/${p.id}${location.search}`);
                          }}
                          className="px-2.5 py-1 text-xs font-semibold text-emerald-700 hover:bg-emerald-50 rounded-lg transition-colors cursor-pointer"
                        >
                          Chi tiết →
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {pagination && pagination.totalElements > 0 && (
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-3 px-1 border-t border-slate-100 text-xs text-slate-500 font-medium">
            <div>
              Hiển thị <strong>{sortedPlaces.length}</strong> / <strong>{pagination.totalElements || placesList.length}</strong> địa điểm (Trang <strong>{pagination.page}</strong> / {pagination.totalPages || 1})
            </div>

            {pagination.totalPages > 1 && (
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  disabled={pagination.page <= 1 || isLoading}
                  onClick={() => onPageChange?.(pagination.page - 1)}
                  className="px-3 py-1.5 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed font-bold text-slate-700 transition-colors flex items-center gap-1 cursor-pointer"
                >
                  <ChevronLeft size={14} />
                  <span>Trước</span>
                </button>

                <div className="flex items-center gap-1">
                  {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
                    let pNum = pagination.page - 2 + i;
                    if (pagination.page <= 3) {
                      pNum = i + 1;
                    } else if (pagination.page >= pagination.totalPages - 2) {
                      pNum = pagination.totalPages - 4 + i;
                    }
                    if (pNum < 1 || pNum > pagination.totalPages) return null;

                    return (
                      <button
                        key={pNum}
                        type="button"
                        disabled={isLoading}
                        onClick={() => onPageChange?.(pNum)}
                        className={`w-7 h-7 rounded-xl font-bold text-xs transition-colors flex items-center justify-center cursor-pointer ${pagination.page === pNum
                          ? "bg-emerald-700 text-white shadow-xs"
                          : "bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200"
                          }`}
                      >
                        {pNum}
                      </button>
                    );
                  })}
                </div>

                <button
                  type="button"
                  disabled={pagination.page >= pagination.totalPages || isLoading}
                  onClick={() => onPageChange?.(pagination.page + 1)}
                  className="px-3 py-1.5 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed font-bold text-slate-700 transition-colors flex items-center gap-1 cursor-pointer"
                >
                  <span>Sau</span>
                  <ChevronRight size={14} />
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default PlacesTab;
