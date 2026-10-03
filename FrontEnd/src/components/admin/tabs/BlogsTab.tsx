import React, { useState, useRef, useEffect, useMemo } from "react";
import {
  BookOpen,
  Search,
  ArrowLeft,
  Eye,
  EyeOff,
  Trash2,
  Heart,
  Save,
  FileText,
  UploadCloud,
  CheckCircle2,
  AlertCircle,
  Link as LinkIcon,
  Sparkles,
  BarChart3,
  ChevronLeft,
  ChevronRight,
  Loader2,
  X,
} from "lucide-react";
import type { AdminBlogItem } from "@/types/admin.types";
import { adminService } from "@/services/adminService";
import { blogService } from "@/services/blogService";
import { BlogTableOfContents } from "@/components/blog/BlogTableOfContents";
import {
  convertRawContentToHtml,
  extractHeadingsAndProcessHtml,
} from "@/utils/contentConverter";

interface BlogsTabProps {
  blogsList: AdminBlogItem[];
  setBlogsList?: React.Dispatch<React.SetStateAction<AdminBlogItem[]>>;
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
    category?: string;
    status?: string;
    page?: number;
    pageSize?: number;
  }) => void;
  addAuditLog?: (
    action: string,
    targetName: string,
    details: string,
    type: "approve" | "reject" | "resolve" | "hide" | "edit" | "create"
  ) => void;
  showToast?: (msg: string) => void;
}

const CATEGORY_OPTIONS = [
  "Lịch trình ăn uống",
  "Check-in & Sống ảo",
  "Văn hóa ẩm thực",
  "Kinh nghiệm du lịch",
  "Cẩm nang tự túc",
  "Phượt & Khám phá",
  "Đặc sản vùng miền",
  "Mẹo & Kinh nghiệm",
];

export const BlogsTab: React.FC<BlogsTabProps> = ({
  blogsList = [],
  setBlogsList,
  isLoading = false,
  pagination = {
    page: 1,
    pageSize: 10,
    totalElements: blogsList.length,
    totalPages: 1,
  },
  onPageChange,
  onFilterChange,
  addAuditLog,
  showToast,
}) => {
  const [selectedBlogId, setSelectedBlogId] = useState<number | null>(null);
  const [blogSearchText, setBlogSearchText] = useState("");
  const [blogFilterCategory, setBlogFilterCategory] = useState("all");
  const [blogFilterStatus, setBlogFilterStatus] = useState("all");
  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);


  const currentBlog = selectedBlogId
    ? blogsList.find((b) => b.id === selectedBlogId)
    : null;

  // Filter logic
  const filteredBlogs = blogsList.filter((b) => {
    if (blogFilterCategory !== "all" && b.category !== blogFilterCategory)
      return false;
    if (blogFilterStatus !== "all") {
      if (blogFilterStatus === "published" && b.status !== "published")
        return false;
      if (blogFilterStatus === "hidden" && b.status !== "hidden") return false;
      if (blogFilterStatus === "draft" && b.status !== "draft") return false;
    }
    if (blogSearchText.trim()) {
      const q = blogSearchText.toLowerCase();
      const matchTitle = (b.title || "").toLowerCase().includes(q);
      const matchAuthor = (b.authorName || "").toLowerCase().includes(q);
      const matchCat = (b.category || "").toLowerCase().includes(q);
      const matchSummary = (b.summary || "").toLowerCase().includes(q);
      const matchContent = (b.content || "").toLowerCase().includes(q);
      if (
        !matchTitle &&
        !matchAuthor &&
        !matchCat &&
        !matchSummary &&
        !matchContent
      )
        return false;
    }
    return true;
  });

  const handleToggleHideBlog = async (blogId: number) => {
    if (!setBlogsList) return;
    const blog = blogsList.find((item) => item.id === blogId);
    if (!blog) return;
    await adminService.updateBlogStatus(blogId, blog.status === "hidden" ? "published" : "hidden");
    setBlogsList((prev) =>
      prev.map((b) => {
        if (b.id === blogId) {
          const isHidden = b.status === "hidden";
          const nextStatus = isHidden ? "published" : "hidden";
          if (addAuditLog) {
            addAuditLog(
              isHidden ? "Khôi phục bài viết" : "Tạm ẩn bài viết",
              b.title,
              `Cập nhật trạng thái hiển thị cẩm nang: ${b.title}`,
              "hide"
            );
          }
          if (showToast) {
            showToast(
              `Đã ${isHidden ? "công khai lại" : "tạm ẩn"} bài viết "${b.title}".`
            );
          }
          return { ...b, status: nextStatus };
        }
        return b;
      })
    );
  };

  const handleDeleteBlog = async (blogId: number) => {
    const blog = blogsList.find((b) => b.id === blogId);
    if (
      !window.confirm(
        `Bạn có chắc chắn muốn xóa bài viết cẩm nang "${blog?.title || blogId}"?`
      )
    )
      return;
    await adminService.deleteBlog(blogId);
    if (setBlogsList) {
      setBlogsList((prev) => prev.filter((b) => b.id !== blogId));
    }
    if (addAuditLog && blog) {
      addAuditLog(
        "Xóa bài viết cẩm nang",
        blog.title,
        "Xóa vĩnh viễn bài viết khỏi hệ thống",
        "hide"
      );
    }
    if (showToast) {
      showToast(`Đã xóa bài viết thành công.`);
    }
    if (selectedBlogId === blogId) {
      setSelectedBlogId(null);
    }
  };

  const handleSaveBlog = async (updatedBlog: AdminBlogItem) => {
    await adminService.updateBlog(updatedBlog.id, updatedBlog);
    if (setBlogsList) {
      setBlogsList((prev) =>
        prev.map((b) => (b.id === updatedBlog.id ? { ...b, ...updatedBlog } : b))
      );
    }
    if (addAuditLog) {
      addAuditLog(
        "Cập nhật bài viết cẩm nang",
        updatedBlog.title,
        "Chỉnh sửa nội dung & thông tin bài viết",
        "edit"
      );
    }
    if (showToast) {
      showToast(`Đã lưu thay đổi bài viết "${updatedBlog.title}".`);
    }
  };


  // If a blog is selected, render full BlogDetailViewer & Editor
  if (selectedBlogId && currentBlog) {
    return (
      <BlogDetailViewer
        blog={currentBlog}
        onBack={() => setSelectedBlogId(null)}
        onSave={handleSaveBlog}
        onToggleStatus={() => handleToggleHideBlog(currentBlog.id)}
        onDelete={() => handleDeleteBlog(currentBlog.id)}
      />
    );
  }

  const handleSearchChange = (val: string) => {
    setBlogSearchText(val);
    if (onFilterChange) {
      if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
      debounceTimerRef.current = setTimeout(() => {
        onFilterChange({ keyword: val, page: 1 });
      }, 350);
    }
  };

  const handleCategoryChange = (val: string) => {
    setBlogFilterCategory(val);
    onFilterChange?.({ category: val, page: 1 });
  };

  const handleStatusChange = (val: string) => {
    setBlogFilterStatus(val);
    onFilterChange?.({ status: val, page: 1 });
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-150 text-xs font-sans">
      <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-2xs space-y-4">
        {/* Search & Filter Controls */}
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="relative flex-1 min-w-[240px]">
            <Search
              size={14}
              className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
            />
            <input
              type="text"
              placeholder="Tìm kiếm theo tiêu đề, tác giả, danh mục, nội dung..."
              value={blogSearchText}
              onChange={(e) => handleSearchChange(e.target.value)}
              className="w-full pl-9 pr-8 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-medium text-slate-800 placeholder:text-slate-400 focus:bg-white outline-none focus:border-emerald-500"
            />
            {blogSearchText && (
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
            <select
              value={blogFilterCategory}
              onChange={(e) => handleCategoryChange(e.target.value)}
              className="px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 font-medium text-slate-800 outline-none focus:border-emerald-500 cursor-pointer"
            >
              <option value="all">Tất cả danh mục</option>
              {CATEGORY_OPTIONS.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>

            <select
              value={blogFilterStatus}
              onChange={(e) => handleStatusChange(e.target.value)}
              className="px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 font-medium text-slate-800 outline-none focus:border-emerald-500 cursor-pointer"
            >
              <option value="all">Tất cả trạng thái</option>
              <option value="published">Đang công khai</option>
              <option value="hidden">Đang tạm ẩn</option>
              <option value="draft">Bản nháp</option>
            </select>
          </div>
        </div>

        {/* Blogs Table (Minimalist Row-by-Row Layout matching PlacesTab & FoodsTab) */}
        <div className="overflow-x-auto rounded-xl border border-slate-200/80">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-500 font-bold text-[11px] uppercase tracking-wider">
                <th className="p-3.5 pl-4">Bài viết / Cẩm nang</th>
                <th className="p-3.5">Tác giả</th>
                <th className="p-3.5">Lượt xem & Thích</th>
                <th className="p-3.5">Trạng thái</th>
                <th className="p-3.5 text-center">Xem chi tiết</th>
                <th className="p-3.5 text-right pr-4">Hành động</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredBlogs.map((blog) => {
                const isHidden = blog.status === "hidden";
                const isDraft = blog.status === "draft";

                return (
                  <tr
                    key={blog.id}
                    className="hover:bg-slate-50/60 transition-colors group cursor-pointer"
                    onClick={() => setSelectedBlogId(blog.id)}
                  >
                    {/* Blog Cover & Title */}
                    <td className="p-3.5 pl-4 font-bold text-slate-900">
                      <div className="flex items-center gap-3">
                        <img
                          src={
                            blog.coverImg ||
                            "https://images.unsplash.com/photo-1505474975305-453b4ac9b972?w=600&h=400&fit=crop"
                          }
                          className="w-12 h-10 rounded-lg object-cover border border-slate-200 shrink-0"
                          alt=""
                        />
                        <div className="max-w-md">
                          <div className="font-bold text-slate-900 group-hover:text-emerald-700 transition-colors line-clamp-1 text-xs sm:text-sm">
                            {blog.title}
                          </div>
                          <div className="flex items-center gap-2 mt-0.5">
                            <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded">
                              {blog.category}
                            </span>

                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Author & Date */}
                    <td className="p-3.5 text-slate-700 font-medium">
                      <div className="flex items-center gap-2">
                        <img
                          src={
                            blog.authorAvatar ||
                            "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=80&h=80&fit=crop"
                          }
                          alt=""
                          className="w-6 h-6 rounded-full object-cover border border-slate-200 shrink-0"
                        />
                        <div>
                          <div className="font-semibold text-slate-900 text-xs">
                            {blog.authorName}
                          </div>
                          <div className="text-[10px] text-slate-400">
                            {blog.publishedAt}
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Views & Likes */}
                    <td className="p-3.5 text-slate-700 font-medium">
                      <div className="flex items-center gap-3">
                        <span
                          className="flex items-center gap-1 text-slate-600 font-semibold"
                          title="Lượt xem"
                        >
                          <Eye size={13} className="text-slate-400" />
                          <span>{(blog.views || 0).toLocaleString("vi-VN")}</span>
                        </span>
                        <span
                          className="flex items-center gap-1 text-rose-600 font-semibold"
                          title="Lượt thích"
                        >
                          <Heart
                            size={13}
                            className="text-rose-400 fill-rose-100"
                          />
                          <span>{(blog.likes || 0).toLocaleString("vi-VN")}</span>
                        </span>
                      </div>
                    </td>

                    {/* Status */}
                    <td className="p-3.5">
                      <span
                        className={`inline-flex items-center justify-center px-3.5 py-1 rounded-xl text-xs font-bold border transition-colors ${isHidden || isDraft
                          ? "bg-slate-100 text-slate-700 border-slate-300"
                          : "bg-[#e6fcf5] text-[#087f5b] border-[#63e6be]"
                          }`}
                      >
                        {isHidden || isDraft ? "Tạm ẩn" : "Công khai"}
                      </span>
                    </td>

                    {/* View Details */}
                    <td
                      className="p-3.5 text-center"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <button
                        onClick={() => setSelectedBlogId(blog.id)}
                        className="px-2.5 py-1 text-xs font-semibold text-emerald-700 hover:bg-emerald-50 rounded-lg transition-colors cursor-pointer"
                      >
                        Chi tiết →
                      </button>
                    </td>

                    {/* Action Buttons */}
                    <td
                      className="p-3.5 text-right pr-4"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          type="button"
                          onClick={() => handleToggleHideBlog(blog.id)}
                          className={`p-1.5 rounded-lg border transition-colors cursor-pointer ${isHidden
                            ? "border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
                            : "border-slate-200 hover:bg-slate-100 text-slate-600"
                            }`}
                          title={
                            isHidden
                              ? "Công khai lại bài viết"
                              : "Tạm ẩn bài viết"
                          }
                        >
                          {isHidden ? <Eye size={13} /> : <EyeOff size={13} />}
                        </button>

                        <button
                          type="button"
                          onClick={() => handleDeleteBlog(blog.id)}
                          className="p-1.5 rounded-lg border border-rose-200 text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                          title="Xóa bài viết"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          {isLoading ? (
            <div className="p-12 text-center text-slate-400">
              <div className="flex flex-col items-center justify-center gap-2">
                <Loader2 size={24} className="animate-spin text-emerald-600" />
                <span>Đang tải danh sách bài viết từ máy chủ...</span>
              </div>
            </div>
          ) : (onFilterChange ? blogsList.length === 0 : filteredBlogs.length === 0) ? (
            <div className="p-8 text-center text-slate-400 font-medium">
              Không tìm thấy bài viết cẩm nang nào phù hợp với bộ lọc.
            </div>
          ) : null}
        </div>

        {/* Pagination Bar */}
        {pagination && pagination.totalElements > 0 && (
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-3 px-1 border-t border-slate-100 text-xs text-slate-500 font-medium">
            <div>
              Hiển thị <strong>{blogsList.length}</strong> / <strong>{pagination.totalElements}</strong> bài viết (Trang <strong>{pagination.page}</strong> / {pagination.totalPages || 1})
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
                        className={`w-7 h-7 rounded-xl font-bold text-xs transition-colors flex items-center justify-center cursor-pointer ${
                          pagination.page === pNum
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

      {/* Add Blog Modal */}

    </div>
  );
};

/* ── DETAIL VIEWER & EDITOR (MATCHING BlogReaderView.tsx) ── */
interface BlogDetailViewerProps {
  blog: AdminBlogItem;
  onBack: () => void;
  onSave: (updatedBlog: AdminBlogItem) => void;
  onToggleStatus: () => void;
  onDelete: () => void;
}

const BlogDetailViewer: React.FC<BlogDetailViewerProps> = ({
  blog,
  onBack,
  onSave,
  onToggleStatus,
  onDelete,
}) => {
  // Mode: "reader" (exact BlogReaderView layout) or "editor" (form inputs + live preview)
  const [activeMode, setActiveMode] = useState<"reader" | "editor">("reader");

  // State for form and view
  const [title, setTitle] = useState(blog.title || "");
  const [category, setCategory] = useState(
    blog.category || "Lịch trình ăn uống"
  );
  const [readTime, setReadTime] = useState(blog.readTime || "5 phút đọc");
  const [authorName, setAuthorName] = useState(
    blog.authorName || "Ban Biên Tập LangThang"
  );
  const [authorAvatar, setAuthorAvatar] = useState(
    blog.authorAvatar ||
    "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=80&h=80&fit=crop"
  );
  const [publishedAt, setPublishedAt] = useState(
    blog.publishedAt || ""
  );
  const [views, setViews] = useState(String(blog.views || 0));
  const [likes, setLikes] = useState(String(blog.likes || 0));
  const [coverImg, setCoverImg] = useState(
    blog.coverImg ||
    "https://images.unsplash.com/photo-1505474975305-453b4ac9b972?w=600&h=400&fit=crop"
  );
  const [summary, setSummary] = useState(blog.summary || "");
  const [content, setContent] = useState(blog.content || "");
  const [status, setStatus] = useState<"published" | "draft" | "hidden" | "archived">(
    blog.status || "published"
  );

  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccessMsg, setSaveSuccessMsg] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [readProgress, setReadProgress] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Fetch full details if content is missing or for full accuracy
  useEffect(() => {
    if (blog.id) {
      blogService.getBlogDetail(blog.id).then((res) => {
        if (res.success && res.data) {
          const d = res.data;
          if (d.title) setTitle(d.title);
          if (d.category) setCategory(d.category);
          if (d.summary) setSummary(d.summary);
          else if (d.excerpt) setSummary(d.excerpt);
          if (d.content) setContent(d.content);
          if (d.coverImg) setCoverImg(d.coverImg);
          else if (d.coverUrl) setCoverImg(d.coverUrl);
          if (d.authorName) setAuthorName(d.authorName);
          else if (d.author?.name) setAuthorName(d.author.name);
          if (d.authorAvatar) setAuthorAvatar(d.authorAvatar);
          else if (d.author?.avatar) setAuthorAvatar(d.author.avatar);
          if (d.views !== undefined) setViews(String(d.views));
          else if (d.viewCount !== undefined) setViews(String(d.viewCount));
          if (d.likes !== undefined) setLikes(String(d.likes));
          else if (d.likesCount !== undefined) setLikes(String(d.likesCount));
        }
      }).catch(() => { });
    }
  }, [blog.id]);

  // Reading progress scroll tracking
  useEffect(() => {
    const handleScroll = () => {
      const total = document.documentElement.scrollHeight - window.innerHeight;
      if (total > 0) {
        const current = window.scrollY;
        setReadProgress(Math.min(100, Math.round((current / total) * 100)));
      }
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Process HTML and extract Table of Contents (Matching BlogReaderView)
  const { processedHtml, extractedHeadings } = useMemo(() => {
    const raw = content || "";
    if (!raw.trim()) {
      return { processedHtml: "", extractedHeadings: [] };
    }
    const convertedHtml = convertRawContentToHtml(raw);
    return extractHeadingsAndProcessHtml(convertedHtml);
  }, [content]);

  const scrollToSection = (id: string) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    const file = e.target.files[0];
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") {
        setCoverImg(reader.result);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");

    if (!title.trim()) {
      setErrorMsg("Vui lòng nhập tiêu đề bài viết.");
      return;
    }

    setIsSaving(true);

    const updatedBlog: AdminBlogItem = {
      ...blog,
      title: title.trim(),
      category,
      readTime: readTime.trim(),
      authorName: authorName.trim(),
      authorAvatar: authorAvatar.trim(),
      publishedAt: publishedAt.trim(),
      views: parseInt(views, 10) || 0,
      likes: parseInt(likes, 10) || 0,
      coverImg,
      summary: summary.trim(),
      content: content.trim(),
      status,
    };

    setTimeout(() => {
      onSave(updatedBlog);
      setIsSaving(false);
      setSaveSuccessMsg("Đã lưu chỉnh sửa thông tin bài viết thành công!");
      setTimeout(() => setSaveSuccessMsg(""), 4000);
    }, 400);
  };

  const isHidden = status === "hidden";
  const isDraft = status === "draft";

  return (
    <div className="space-y-6 animate-in fade-in duration-200 text-xs font-sans pb-16 relative">
      {/* Top Reading Progress Bar (Matching BlogReaderView) */}
      <div
        className="fixed top-0 left-0 h-1 bg-emerald-600 z-50 transition-all duration-100"
        style={{ width: `${readProgress}%` }}
      />

      {/* Top Admin Navigation & Toolbar Header (Not sticky, scrolls away) */}
      <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/80 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onBack}
            className="p-2 sm:px-3 sm:py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold flex items-center gap-1.5 transition-colors cursor-pointer shrink-0"
            title="Quay lại danh sách bài viết"
          >
            <ArrowLeft size={15} />
            <span className="hidden sm:inline">Quay lại</span>
          </button>

          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h2 className="text-base sm:text-lg font-bold text-slate-900 truncate max-w-xs sm:max-w-md">
                {title || blog.title}
              </h2>
              <span
                className={`inline-flex items-center justify-center px-3.5 py-1 rounded-xl text-xs font-bold border transition-colors shrink-0 ${isHidden || isDraft
                  ? "bg-slate-100 text-slate-700 border-slate-300"
                  : "bg-[#e6fcf5] text-[#087f5b] border-[#63e6be]"
                  }`}
              >
                {isHidden || isDraft ? "Tạm ẩn" : "Công khai"}
              </span>
            </div>
            <p className="text-[11px] text-slate-400 mt-0.5 truncate">
              Mã bài viết #{blog.id}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap justify-end">

          <button
            type="button"
            onClick={() => {
              onToggleStatus();
              setStatus((prev: string) => (prev === "published" ? "hidden" : "published"));
            }}
            className="flex items-center gap-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl cursor-pointer transition-colors"
          >
            {isHidden ? <Eye size={14} /> : <EyeOff size={14} />}
            <span className="hidden sm:inline">
              {isHidden ? "Hiện lại" : "Tạm ẩn"}
            </span>
          </button>

          <button
            type="button"
            onClick={onDelete}
            className="p-2 sm:px-3 sm:py-2 border border-rose-200 text-rose-600 hover:bg-rose-50 font-bold rounded-xl cursor-pointer transition-colors flex items-center gap-1.5"
            title="Xóa bài viết"
          >
            <Trash2 size={14} />
            <span className="hidden sm:inline">Xóa</span>
          </button>

          {activeMode === "editor" && (
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
              <span>{isSaving ? "Đang lưu..." : "Lưu thay đổi"}</span>
            </button>
          )}
        </div>
      </div>

      {/* Alert Notifications */}
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

      {/* ── MODE 1: EXACT BlogReaderView.tsx LAYOUT ── */}
      {activeMode === "reader" && (
        <div className="bg-white rounded-3xl p-6 sm:p-10 border border-slate-200/80 shadow-xs animate-in fade-in duration-150">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
            {/* Left Column (8 cols): Full Article Reader (Matching BlogReaderView.tsx) */}
            <div className="lg:col-span-8 space-y-8 min-w-0">
              {/* Category & Title Header */}
              <div className="space-y-4">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 text-emerald-800 text-xs font-bold">
                  <span>{category || "Cẩm nang du lịch"}</span>
                </div>

                <h1 className="text-2xl sm:text-4xl lg:text-5xl font-extrabold text-slate-900 leading-tight tracking-tight">
                  {title}
                </h1>

                {summary && (
                  <p className="text-base sm:text-lg text-slate-600 leading-relaxed font-normal bg-slate-50 p-4 rounded-2xl border border-slate-200/80">
                    {summary}
                  </p>
                )}
              </div>

              {/* Author & Meta Row */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 py-4 border-y border-slate-200">
                <div className="flex items-center gap-3">
                  {authorAvatar ? (
                    <img
                      src={authorAvatar}
                      alt={authorName}
                      className="w-12 h-12 rounded-full object-cover border border-slate-200"
                    />
                  ) : (
                    <div className="w-12 h-12 rounded-full bg-slate-900 text-white flex items-center justify-center font-bold text-sm">
                      {(authorName || "T").charAt(0).toUpperCase()}
                    </div>
                  )}
                  <div>
                    <h4 className="font-bold text-sm text-slate-900">
                      {authorName || "Ban Biên Tập LangThang"}
                    </h4>
                    <p className="text-xs text-slate-500">
                      Thành viên cộng đồng
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3 text-xs font-semibold text-slate-500 flex-wrap">
                  <span className="flex items-center gap-1 text-slate-600">
                    <Eye size={14} className="text-slate-400" />
                    <span>{(parseInt(views, 10) || 0).toLocaleString("vi-VN")} lượt xem</span>
                  </span>
                  <span>•</span>
                  <span className="flex items-center gap-1 text-rose-600">
                    <Heart size={14} className="text-rose-400 fill-rose-100" />
                    <span>{(parseInt(likes, 10) || 0).toLocaleString("vi-VN")}</span>
                  </span>
                </div>
              </div>

              {/* Hero Cover Image */}
              {coverImg ? (
                <div className="rounded-3xl overflow-hidden shadow-md border border-slate-200 bg-slate-100">
                  <img
                    src={coverImg}
                    alt={title}
                    className="w-full max-h-[480px] object-cover"
                  />
                </div>
              ) : (
                <div className="rounded-3xl overflow-hidden border border-slate-200 bg-gradient-to-br from-emerald-900/10 to-teal-900/20 py-16 flex items-center justify-center text-emerald-800">
                  <BookOpen size={48} />
                </div>
              )}

              {/* Processed Article Body Content */}
              <div className="space-y-8 text-base text-slate-800 leading-relaxed font-normal pt-2">
                {processedHtml ? (
                  <div
                    className="tiptap-content prose prose-slate max-w-none space-y-4"
                    dangerouslySetInnerHTML={{ __html: processedHtml }}
                  />
                ) : (
                  <div className="p-6 text-center text-slate-400 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                    Nội dung bài viết chưa được nhập. Nhấn nút "Chỉnh sửa" để bắt đầu viết nội dung.
                  </div>
                )}
              </div>

              {/* Author Footer Bio Card */}
              <div className="pt-8 border-t border-slate-200 space-y-6">
                <div className="bg-slate-50 rounded-2xl p-6 border border-slate-200 flex flex-col sm:flex-row items-center gap-4">
                  {authorAvatar ? (
                    <img
                      src={authorAvatar}
                      alt={authorName}
                      className="w-16 h-16 rounded-full object-cover border-2 border-white shadow-sm"
                    />
                  ) : (
                    <div className="w-16 h-16 rounded-full bg-slate-900 text-white flex items-center justify-center font-bold text-lg">
                      {(authorName || "T").charAt(0).toUpperCase()}
                    </div>
                  )}
                  <div className="space-y-1 text-center sm:text-left flex-1">
                    <h4 className="font-bold text-base text-slate-900">
                      {authorName || "Ban Biên Tập LangThang"}
                    </h4>
                    <p className="text-xs text-slate-500">
                      Thành viên cộng đồng LangThang
                    </p>
                    <p className="text-xs text-slate-600 pt-1">
                      Bài viết cẩm nang du lịch này đang ở trạng thái{" "}
                      <span className="font-bold text-emerald-800">
                        {isHidden
                          ? "Đang tạm ẩn"
                          : isDraft
                            ? "Bản nháp"
                            : "Đang công khai"}
                      </span>
                      . Quản trị viên có thể chuyển đổi trạng thái hoặc biên tập lại nội dung bất kỳ lúc nào.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column (4 cols Sticky): Table of Contents */}
            <aside className="lg:col-span-4 space-y-6 sticky top-6">
              {/* Table of Contents (Matching BlogTableOfContents from BlogReaderView) */}
              {extractedHeadings && extractedHeadings.length > 0 && (
                <BlogTableOfContents
                  headings={extractedHeadings}
                  onScrollToSection={scrollToSection}
                />
              )}
            </aside>
          </div>
        </div>
      )}

      {/* ── MODE 2: FORM EDITOR & LIVE PREVIEW ── */}
      {activeMode === "editor" && (
        <form onSubmit={handleFormSubmit}>
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* Left Column (8 cols): Form Sections */}
            <div className="lg:col-span-8 space-y-6">
              {/* Section 1: Basic Blog Meta */}
              <div className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200/80 shadow-xs space-y-5">
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-3">
                  <FileText className="w-4 h-4 text-emerald-700" />
                  <span>1. Thông tin bài viết &amp; Chủ đề cẩm nang</span>
                </h3>

                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-800 mb-1.5">
                      Tiêu đề bài viết / Cẩm nang <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      placeholder="Ví dụ: Hành trình 48 giờ ăn sập Đà Nẵng..."
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      className="w-full px-4 py-3 rounded-2xl bg-slate-50/80 border border-slate-200 text-xs sm:text-sm text-slate-900 focus:outline-none focus:bg-white focus:border-emerald-700 transition-all font-semibold"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-800 mb-1.5">
                        Chủ đề / Danh mục cẩm nang <span className="text-rose-500">*</span>
                      </label>
                      <select
                        value={category}
                        onChange={(e) => setCategory(e.target.value)}
                        className="w-full px-3.5 py-3 rounded-2xl bg-slate-50/80 border border-slate-200 text-xs font-medium text-slate-900 focus:outline-none focus:bg-white focus:border-emerald-700 cursor-pointer"
                      >
                        {CATEGORY_OPTIONS.map((cat) => (
                          <option key={cat} value={cat}>
                            {cat}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-800 mb-1.5">
                        Thời gian đọc ước tính
                      </label>
                      <input
                        type="text"
                        placeholder="Ví dụ: 5 phút đọc, 8 phút đọc..."
                        value={readTime}
                        onChange={(e) => setReadTime(e.target.value)}
                        className="w-full px-4 py-3 rounded-2xl bg-slate-50/80 border border-slate-200 text-xs font-medium text-slate-900 focus:outline-none focus:bg-white focus:border-emerald-700"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-800 mb-1.5">
                        Tác giả bài viết
                      </label>
                      <input
                        type="text"
                        value={authorName}
                        onChange={(e) => setAuthorName(e.target.value)}
                        className="w-full px-4 py-3 rounded-2xl bg-slate-50/80 border border-slate-200 text-xs font-medium text-slate-900 focus:outline-none focus:bg-white focus:border-emerald-700"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-800 mb-1.5">
                        URL Avatar tác giả
                      </label>
                      <input
                        type="text"
                        value={authorAvatar}
                        onChange={(e) => setAuthorAvatar(e.target.value)}
                        className="w-full px-4 py-3 rounded-2xl bg-slate-50/80 border border-slate-200 text-xs text-slate-900 focus:outline-none focus:bg-white focus:border-emerald-700"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-800 mb-1.5">
                        Ngày xuất bản
                      </label>
                      <input
                        type="text"
                        value={publishedAt}
                        onChange={(e) => setPublishedAt(e.target.value)}
                        className="w-full px-4 py-3 rounded-2xl bg-slate-50/80 border border-slate-200 text-xs font-medium text-slate-900 focus:outline-none focus:bg-white focus:border-emerald-700"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Section 2: Summary / Sapo */}
              <div className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200/80 shadow-xs space-y-4">
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-3">
                  <Sparkles className="w-4 h-4 text-emerald-700" />
                  <span>2. Tóm tắt &amp; Đoạn mở đầu (Sapo bài viết)</span>
                </h3>

                <div>
                  <label className="block text-xs font-bold text-slate-800 mb-1.5">
                    Nội dung tóm tắt hiển thị ngoài trang chủ &amp; danh sách cẩm nang
                  </label>
                  <textarea
                    rows={3}
                    placeholder="Viết một đoạn tóm tắt hấp dẫn tóm lược nội dung chính của bài viết..."
                    value={summary}
                    onChange={(e) => setSummary(e.target.value)}
                    className="w-full p-3.5 rounded-2xl bg-slate-50/80 border border-slate-200 text-xs sm:text-sm text-slate-900 focus:outline-none focus:bg-white focus:border-emerald-700 leading-relaxed"
                  />
                </div>
              </div>

              {/* Section 3: Cover Image */}
              <div className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200/80 shadow-xs space-y-4">
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-3">
                  <UploadCloud className="w-4 h-4 text-emerald-700" />
                  <span>3. Hình ảnh bìa đại diện (Cover &amp; Banner)</span>
                </h3>

                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleFileUpload}
                  className="hidden"
                />

                <div className="grid grid-cols-1 sm:grid-cols-12 gap-4 items-center">
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    className="sm:col-span-8 p-6 border-2 border-dashed border-slate-300 hover:border-emerald-600 rounded-2xl text-center cursor-pointer transition-all flex flex-col items-center justify-center gap-2 hover:bg-slate-50"
                  >
                    <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center shadow-2xs">
                      <UploadCloud className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-800">
                        Tải ảnh bìa mới từ máy tính (Click để chọn tệp)
                      </p>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        Định dạng JPG, PNG, WEBP độ phân giải cao tỉ lệ 16:9
                      </p>
                    </div>
                  </div>

                  <div className="sm:col-span-4 aspect-video rounded-2xl overflow-hidden bg-slate-100 border border-slate-200 relative group shadow-2xs">
                    <img
                      src={coverImg}
                      alt={title}
                      className="w-full h-full object-cover"
                    />
                    <span className="absolute bottom-2 left-2 px-2 py-0.5 rounded-md bg-slate-950/70 text-white text-[10px] font-bold">
                      Ảnh hiện tại
                    </span>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center gap-1.5">
                    <LinkIcon className="w-3.5 h-3.5 text-slate-400" />
                    <span>Hoặc dán URL hình ảnh trực tuyến</span>
                  </label>
                  <input
                    type="text"
                    placeholder="https://images.unsplash.com/..."
                    value={coverImg}
                    onChange={(e) => setCoverImg(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-900 focus:outline-none focus:bg-white focus:border-emerald-700"
                  />
                </div>
              </div>

              {/* Section 4: Full Content */}
              <div className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200/80 shadow-xs space-y-4">
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-3">
                  <BookOpen className="w-4 h-4 text-emerald-700" />
                  <span>4. Nội dung bài viết chi tiết</span>
                </h3>

                <div>
                  <label className="block text-xs font-bold text-slate-800 mb-1.5">
                    Nội dung đầy đủ bài viết (Có thể phân đoạn bằng tiêu đề Ngày 1:, 1., ## Tiêu đề)
                  </label>
                  <textarea
                    rows={12}
                    placeholder="Nhập nội dung bài viết cẩm nang du lịch, lịch trình chi tiết..."
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    className="w-full p-4 rounded-2xl bg-slate-50/80 border border-slate-200 text-xs sm:text-sm text-slate-900 focus:outline-none focus:bg-white focus:border-emerald-700 leading-relaxed font-sans"
                  />
                </div>
              </div>

              {/* Section 5: Stats */}
              <div className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200/80 shadow-xs space-y-4">
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-3">
                  <BarChart3 className="w-4 h-4 text-emerald-700" />
                  <span>5. Thống kê lượt đọc &amp; tương tác</span>
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-800 mb-1.5 flex items-center gap-1.5">
                      <Eye size={13} className="text-slate-400" />
                      <span>Lượt xem bài viết</span>
                    </label>
                    <input
                      type="number"
                      value={views}
                      onChange={(e) => setViews(e.target.value)}
                      className="w-full px-4 py-3 rounded-2xl bg-slate-50/80 border border-slate-200 text-xs font-semibold text-slate-900 focus:outline-none focus:bg-white focus:border-emerald-700 font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-800 mb-1.5 flex items-center gap-1.5">
                      <Heart size={13} className="text-rose-500" />
                      <span>Lượt yêu thích</span>
                    </label>
                    <input
                      type="number"
                      value={likes}
                      onChange={(e) => setLikes(e.target.value)}
                      className="w-full px-4 py-3 rounded-2xl bg-slate-50/80 border border-slate-200 text-xs font-semibold text-slate-900 focus:outline-none focus:bg-white focus:border-emerald-700 font-mono"
                    />
                  </div>
                </div>
              </div>

              {/* Bottom Action Bar */}
              <div className="p-6 bg-white rounded-3xl border border-slate-200/80 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="text-xs text-slate-500">
                  Mọi thông tin chỉnh sửa sẽ được cập nhật trực tiếp trên trang Cẩm nang &amp; Blog du lịch.
                </div>

                <div className="flex items-center gap-2.5 w-full sm:w-auto">
                  <button
                    type="button"
                    onClick={() => setActiveMode("reader")}
                    className="flex-1 sm:flex-none px-5 py-3 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold cursor-pointer transition-all text-center"
                  >
                    Xem trước trang đọc
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
                        <span>Lưu thông tin bài viết</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>

            {/* Right Column (4 cols, sticky): Live Preview Card */}
            <div className="lg:col-span-4 space-y-6 sticky top-24">
              <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                    <Eye className="w-4 h-4 text-emerald-700" />
                    <span>Xem trước hiển thị (Live Card)</span>
                  </h3>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200/60">
                    Live Preview
                  </span>
                </div>

                {/* Blog Discovery Card Replica */}
                <div className="group flex flex-col select-none bg-white rounded-2xl border border-slate-200/80 p-3 shadow-2xs space-y-3">
                  <div className="relative aspect-video w-full rounded-xl overflow-hidden bg-slate-100">
                    <img
                      src={coverImg}
                      alt={title || "Bài viết"}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    <span className="absolute top-2 left-2 px-2 py-0.5 rounded-md bg-emerald-600/90 backdrop-blur-xs text-white text-[10px] font-bold">
                      {category}
                    </span>

                  </div>

                  <div className="space-y-2 pt-1">
                    <h4 className="font-bold text-sm sm:text-base text-slate-900 line-clamp-2 leading-snug">
                      {title.trim() || "Tiêu đề bài viết cẩm nang"}
                    </h4>

                    <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed font-normal">
                      {summary.trim() ||
                        content.trim() ||
                        "Nội dung tóm tắt của bài viết sẽ được hiển thị tại đây để độc giả theo dõi..."}
                    </p>

                    <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                      <div className="flex items-center gap-2">
                        <img
                          src={authorAvatar}
                          alt=""
                          className="w-5 h-5 rounded-full object-cover border border-slate-200"
                        />
                        <span className="font-medium text-slate-800 text-[11px] truncate max-w-[100px]">
                          {authorName}
                        </span>
                      </div>

                      <div className="flex items-center gap-2.5 text-[11px]">
                        <span className="flex items-center gap-1 text-slate-400">
                          <Eye size={12} />
                          {(parseInt(views, 10) || 0).toLocaleString("vi-VN")}
                        </span>
                        <span className="flex items-center gap-1 text-rose-500">
                          <Heart size={12} className="fill-rose-100" />
                          {(parseInt(likes, 10) || 0).toLocaleString("vi-VN")}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Quick Status Control */}
              <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs space-y-3.5">
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-3">
                  <Sparkles className="w-4 h-4 text-emerald-700" />
                  <span>Trạng thái xuất bản</span>
                </h3>

                <div className="space-y-2 text-xs">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                      Chế độ phát hành
                    </label>
                    <select
                      value={status}
                      onChange={(e) =>
                        setStatus(
                          e.target.value as "published" | "draft" | "hidden"
                        )
                      }
                      className="w-full p-2.5 rounded-xl border border-slate-200 bg-slate-50 font-semibold text-slate-800 outline-none focus:border-emerald-600 cursor-pointer"
                    >
                      <option value="published">
                        Đang công khai (Hiển thị cho tất cả thành viên)
                      </option>
                      <option value="draft">Bản nháp (Lưu tạm, chưa công khai)</option>
                      <option value="hidden">Đang tạm ẩn (Ẩn khỏi danh sách cẩm nang)</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </form>
      )}
    </div>
  );
};

export default BlogsTab;
