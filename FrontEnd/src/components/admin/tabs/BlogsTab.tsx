import React, { useState, useRef, useEffect, useMemo } from "react";
import {
  BookOpen,
  Search,
  Plus,
  ArrowLeft,
  Eye,
  EyeOff,
  Trash2,
  Heart,
  Clock,
  Save,
  FileText,
  UploadCloud,
  CheckCircle2,
  AlertCircle,
  X,
  Link as LinkIcon,
  Sparkles,
  BarChart3,
  Edit3,
  BookMarked,
  ShieldCheck,
  Calendar,
  User,
} from "lucide-react";
import type { AdminBlogItem } from "@/types/admin.types";
import { adminService } from "@/services/adminService";
import { BlogTableOfContents } from "@/components/blog/BlogTableOfContents";
import {
  convertRawContentToHtml,
  extractHeadingsAndProcessHtml,
} from "@/utils/contentConverter";

interface BlogsTabProps {
  blogsList: AdminBlogItem[];
  setBlogsList?: React.Dispatch<React.SetStateAction<AdminBlogItem[]>>;
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
  blogsList,
  setBlogsList,
  addAuditLog,
  showToast,
}) => {
  const [selectedBlogId, setSelectedBlogId] = useState<number | null>(null);
  const [blogSearchText, setBlogSearchText] = useState("");
  const [blogFilterCategory, setBlogFilterCategory] = useState("all");
  const [blogFilterStatus, setBlogFilterStatus] = useState("all");

  // Add Blog Modal State
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newBlogForm, setNewBlogForm] = useState({
    title: "",
    authorName: "Ban Biên Tập LangThang",
    authorAvatar:
      "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=80&h=80&fit=crop",
    category: "Lịch trình ăn uống",
    readTime: "5 phút đọc",
    coverImg:
      "https://images.unsplash.com/photo-1505474975305-453b4ac9b972?w=600&h=400&fit=crop",
    summary: "",
    content: "",
    status: "published" as "published" | "draft" | "hidden",
  });

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

  const handleAddBlogSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newBlogForm.title.trim()) {
      alert("Vui lòng nhập tiêu đề bài viết.");
      return;
    }

    const todayStr = new Intl.DateTimeFormat("vi-VN").format(new Date());

    const response = await adminService.createBlog({
      title: newBlogForm.title.trim(),
      content: newBlogForm.content.trim(),
      coverImg: newBlogForm.coverImg.trim(),
      status: newBlogForm.status,
    });
    const newBlog: AdminBlogItem = {
      id: response.data,
      title: newBlogForm.title.trim(),
      authorName: newBlogForm.authorName.trim() || "Ban Biên Tập LangThang",
      authorAvatar:
        newBlogForm.authorAvatar.trim() ||
        "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=80&h=80&fit=crop",
      category: newBlogForm.category,
      publishedAt: todayStr,
      views: 0,
      likes: 0,
      status: newBlogForm.status,
      coverImg:
        newBlogForm.coverImg.trim() ||
        "https://images.unsplash.com/photo-1505474975305-453b4ac9b972?w=600&h=400&fit=crop",
      readTime: newBlogForm.readTime.trim() || "5 phút đọc",
      summary:
        newBlogForm.summary.trim() ||
        "Bài viết chia sẻ cẩm nang và kinh nghiệm du lịch hữu ích.",
      content:
        newBlogForm.content.trim() ||
        "Nội dung chi tiết của bài viết đang được cập nhật...",
    };

    if (setBlogsList) {
      setBlogsList((prev) => [newBlog, ...prev]);
    }
    if (addAuditLog) {
      addAuditLog(
        "Tạo bài viết cẩm nang mới",
        newBlog.title,
        "Đăng tải bài viết chia sẻ cẩm nang du lịch",
        "create"
      );
    }
    if (showToast) {
      showToast(`Đã xuất bản bài viết "${newBlog.title}" thành công.`);
    }

    setIsAddModalOpen(false);
    setNewBlogForm({
      title: "",
      authorName: "Ban Biên Tập LangThang",
      authorAvatar:
        "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=80&h=80&fit=crop",
      category: "Lịch trình ăn uống",
      readTime: "5 phút đọc",
      coverImg:
        "https://images.unsplash.com/photo-1505474975305-453b4ac9b972?w=600&h=400&fit=crop",
      summary: "",
      content: "",
      status: "published",
    });
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
              onChange={(e) => setBlogSearchText(e.target.value)}
              className="w-full pl-9 pr-4 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-medium text-slate-800 placeholder:text-slate-400 focus:bg-white outline-none focus:border-emerald-500"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <select
              value={blogFilterCategory}
              onChange={(e) => setBlogFilterCategory(e.target.value)}
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
              onChange={(e) => setBlogFilterStatus(e.target.value)}
              className="px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 font-medium text-slate-800 outline-none focus:border-emerald-500 cursor-pointer"
            >
              <option value="all">Tất cả trạng thái</option>
              <option value="published">Đang công khai</option>
              <option value="hidden">Đang tạm ẩn</option>
              <option value="draft">Bản nháp</option>
            </select>

            <button
              onClick={() => setIsAddModalOpen(true)}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold cursor-pointer transition-all shadow-sm shadow-emerald-600/20"
            >
              <Plus size={14} />
              <span>Thêm bài viết</span>
            </button>
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
                            {blog.readTime && (
                              <span className="text-[10px] text-slate-400 font-normal flex items-center gap-1">
                                <Clock size={10} />
                                {blog.readTime}
                              </span>
                            )}
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
                        className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          isHidden
                            ? "bg-slate-100 text-slate-600"
                            : isDraft
                            ? "bg-blue-100 text-blue-800"
                            : "bg-emerald-100 text-emerald-800"
                        }`}
                      >
                        {isHidden
                          ? "Đang tạm ẩn"
                          : isDraft
                          ? "Bản nháp"
                          : "Đang công khai"}
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
                          className={`p-1.5 rounded-lg border transition-colors cursor-pointer ${
                            isHidden
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

          {filteredBlogs.length === 0 && (
            <div className="p-8 text-center text-slate-400">
              Không tìm thấy bài viết cẩm nang nào phù hợp với bộ lọc.
            </div>
          )}
        </div>
      </div>

      {/* Add Blog Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 space-y-5 shadow-2xl border border-slate-200 animate-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-emerald-700" />
                <h3 className="font-bold text-base text-slate-900">
                  Thêm bài viết / Cẩm nang du lịch
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsAddModalOpen(false)}
                className="p-1 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100 cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleAddBlogSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-800 mb-1">
                  Tiêu đề bài viết <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder="Ví dụ: Hành trình 48 giờ ăn sập Đà Nẵng..."
                  value={newBlogForm.title}
                  onChange={(e) =>
                    setNewBlogForm({ ...newBlogForm, title: e.target.value })
                  }
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-900 focus:bg-white focus:border-emerald-600 outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-800 mb-1">
                    Chủ đề / Danh mục
                  </label>
                  <select
                    value={newBlogForm.category}
                    onChange={(e) =>
                      setNewBlogForm({
                        ...newBlogForm,
                        category: e.target.value,
                      })
                    }
                    className="w-full px-3 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-medium text-slate-900 focus:bg-white focus:border-emerald-600 outline-none cursor-pointer"
                  >
                    {CATEGORY_OPTIONS.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-800 mb-1">
                    Thời gian đọc dự kiến
                  </label>
                  <input
                    type="text"
                    placeholder="5 phút đọc"
                    value={newBlogForm.readTime}
                    onChange={(e) =>
                      setNewBlogForm({
                        ...newBlogForm,
                        readTime: e.target.value,
                      })
                    }
                    className="w-full px-3 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-900 focus:bg-white focus:border-emerald-600 outline-none font-medium"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-800 mb-1">
                    Tên tác giả
                  </label>
                  <input
                    type="text"
                    placeholder="Ban Biên Tập LangThang"
                    value={newBlogForm.authorName}
                    onChange={(e) =>
                      setNewBlogForm({
                        ...newBlogForm,
                        authorName: e.target.value,
                      })
                    }
                    className="w-full px-3 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-900 focus:bg-white focus:border-emerald-600 outline-none font-medium"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-800 mb-1">
                    Trạng thái ban đầu
                  </label>
                  <select
                    value={newBlogForm.status}
                    onChange={(e) =>
                      setNewBlogForm({
                        ...newBlogForm,
                        status: e.target.value as any,
                      })
                    }
                    className="w-full px-3 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-medium text-slate-900 focus:bg-white focus:border-emerald-600 outline-none cursor-pointer"
                  >
                    <option value="published">Đang công khai</option>
                    <option value="draft">Bản nháp</option>
                    <option value="hidden">Đang tạm ẩn</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-800 mb-1">
                  URL ảnh bìa đại diện
                </label>
                <input
                  type="text"
                  placeholder="https://images.unsplash.com/..."
                  value={newBlogForm.coverImg}
                  onChange={(e) =>
                    setNewBlogForm({ ...newBlogForm, coverImg: e.target.value })
                  }
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-900 focus:bg-white focus:border-emerald-600 outline-none"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-800 mb-1">
                  Tóm tắt / Sapo bài viết
                </label>
                <textarea
                  rows={2}
                  placeholder="Đoạn văn ngắn giới thiệu thu hút độc giả..."
                  value={newBlogForm.summary}
                  onChange={(e) =>
                    setNewBlogForm({ ...newBlogForm, summary: e.target.value })
                  }
                  className="w-full p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-900 focus:bg-white focus:border-emerald-600 outline-none leading-relaxed"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl text-slate-600 hover:bg-slate-100 font-bold cursor-pointer"
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold shadow-sm cursor-pointer"
                >
                  Tạo bài viết
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
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
    blog.publishedAt || "18/09/2026"
  );
  const [views, setViews] = useState(String(blog.views || 0));
  const [likes, setLikes] = useState(String(blog.likes || 0));
  const [coverImg, setCoverImg] = useState(
    blog.coverImg ||
      "https://images.unsplash.com/photo-1505474975305-453b4ac9b972?w=600&h=400&fit=crop"
  );
  const [summary, setSummary] = useState(blog.summary || "");
  const [content, setContent] = useState(blog.content || "");
  const [status, setStatus] = useState<"published" | "draft" | "hidden">(
    blog.status || "published"
  );

  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccessMsg, setSaveSuccessMsg] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [readProgress, setReadProgress] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

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

    let html = "";
    // If raw content is plain text with markdown or list indicators, format nicely
    if (!raw.startsWith("<") && !raw.startsWith("{")) {
      const blocks = raw.split(/\n\s*\n/);
      html = blocks
        .map((block) => {
          const trimmed = block.trim();
          if (trimmed.startsWith("### ")) {
            return `<h3 class="font-bold text-slate-900 text-lg sm:text-xl mt-6 mb-2 tracking-tight">${trimmed.replace(
              /^###\s+/,
              ""
            )}</h3>`;
          }
          if (trimmed.startsWith("## ")) {
            return `<h2 class="font-bold text-slate-900 text-xl sm:text-2xl mt-8 mb-3 tracking-tight">${trimmed.replace(
              /^##\s+/,
              ""
            )}</h2>`;
          }
          if (trimmed.startsWith("# ")) {
            return `<h2 class="font-bold text-slate-900 text-2xl sm:text-3xl mt-8 mb-3 tracking-tight">${trimmed.replace(
              /^#\s+/,
              ""
            )}</h2>`;
          }
          if (
            /^(Ngày \d+:|Buổi (sáng|trưa|chiều|tối):|\d+\.\s+)/i.test(trimmed)
          ) {
            const firstLineEnd = trimmed.indexOf("\n");
            if (firstLineEnd !== -1) {
              const heading = trimmed.slice(0, firstLineEnd);
              const rest = trimmed.slice(firstLineEnd + 1);
              return `<h3 class="font-bold text-slate-900 text-lg sm:text-xl mt-6 mb-2 tracking-tight">${heading}</h3><p class="leading-relaxed text-slate-700 my-3 text-base sm:text-lg">${rest.replace(
                /\n/g,
                "<br/>"
              )}</p>`;
            }
            return `<h3 class="font-bold text-slate-900 text-lg sm:text-xl mt-6 mb-2 tracking-tight">${trimmed}</h3>`;
          }
          return `<p class="leading-relaxed text-slate-700 my-3 text-base sm:text-lg">${trimmed.replace(
            /\n/g,
            "<br/>"
          )}</p>`;
        })
        .join("");
    } else {
      html = convertRawContentToHtml(raw);
    }

    return extractHeadingsAndProcessHtml(html);
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

      {/* Top Admin Navigation & Toolbar Header */}
      <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/80 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-4 sticky top-4 z-40 backdrop-blur-md bg-white/95">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onBack}
            className="p-2 sm:px-3 sm:py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold flex items-center gap-1.5 transition-colors cursor-pointer shrink-0"
            title="Quay lại danh sách bài viết"
          >
            <ArrowLeft size={15} />
            <span className="hidden sm:inline">Quay lại danh sách</span>
          </button>

          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h2 className="text-base sm:text-lg font-bold text-slate-900 truncate max-w-xs sm:max-w-md">
                {title || blog.title}
              </h2>
              <span
                className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold shrink-0 ${
                  isHidden
                    ? "bg-slate-200 text-slate-700"
                    : isDraft
                    ? "bg-blue-100 text-blue-800"
                    : "bg-emerald-100 text-emerald-800"
                }`}
              >
                {isHidden
                  ? "Đang tạm ẩn"
                  : isDraft
                  ? "Bản nháp"
                  : "Đang công khai"}
              </span>
            </div>
            <p className="text-[11px] text-slate-400 mt-0.5 truncate">
              Mã bài viết #{blog.id} • {category} • {authorName} • {publishedAt}
            </p>
          </div>
        </div>

        {/* View Mode Switcher & Admin Action Buttons */}
        <div className="flex items-center gap-2 flex-wrap justify-end">
          {/* Mode Switcher Tabs */}
          <div className="flex items-center p-1 bg-slate-100 rounded-xl border border-slate-200/60">
            <button
              type="button"
              onClick={() => setActiveMode("reader")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-bold text-xs transition-all cursor-pointer ${
                activeMode === "reader"
                  ? "bg-white text-emerald-800 shadow-2xs"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <BookMarked size={13} />
              <span>Giao diện đọc</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveMode("editor")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-bold text-xs transition-all cursor-pointer ${
                activeMode === "editor"
                  ? "bg-white text-emerald-800 shadow-2xs"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <Edit3 size={13} />
              <span>Chỉnh sửa</span>
            </button>
          </div>

          <button
            type="button"
            onClick={() => {
              onToggleStatus();
              setStatus((prev) => (prev === "published" ? "hidden" : "published"));
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
              {/* Category & Date & Title Header */}
              <div className="space-y-4">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 text-emerald-800 text-xs font-bold">
                  <span>{category || "Cẩm nang du lịch"}</span>
                  {publishedAt && (
                    <>
                      <span>•</span>
                      <span>{publishedAt}</span>
                    </>
                  )}
                </div>

                <h1 className="text-2xl sm:text-4xl lg:text-5xl font-extrabold text-slate-900 leading-tight tracking-tight">
                  {title}
                </h1>

                {summary && (
                  <p className="text-base sm:text-lg text-slate-600 leading-relaxed font-normal">
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
                      Tác giả chia sẻ • Thành viên cộng đồng
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3 text-xs font-semibold text-slate-500 flex-wrap">
                  <span className="flex items-center gap-1 text-slate-600">
                    <Clock size={14} /> {readTime || "5 phút đọc"}
                  </span>
                  <span>•</span>
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
                      Tác giả chia sẻ • Thành viên cộng đồng LangThang
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

            {/* Right Column (4 cols Sticky): Table of Contents & Admin Moderation Card */}
            <aside className="lg:col-span-4 space-y-6 sticky top-24">
              {/* Table of Contents (Matching BlogTableOfContents from BlogReaderView) */}
              {extractedHeadings && extractedHeadings.length > 0 && (
                <BlogTableOfContents
                  headings={extractedHeadings}
                  onScrollToSection={scrollToSection}
                />
              )}

              {/* Admin Moderation Card */}
              <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-2xs space-y-4 text-xs">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-emerald-700" />
                    <span>Quản trị &amp; Xuất bản</span>
                  </h3>
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      isHidden
                        ? "bg-slate-100 text-slate-700"
                        : isDraft
                        ? "bg-blue-100 text-blue-800"
                        : "bg-emerald-100 text-emerald-800"
                    }`}
                  >
                    {isHidden
                      ? "Đang tạm ẩn"
                      : isDraft
                      ? "Bản nháp"
                      : "Công khai"}
                  </span>
                </div>

                <div className="space-y-3">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                      Chế độ hiển thị
                    </label>
                    <select
                      value={status}
                      onChange={(e) => {
                        const nextVal = e.target.value as "published" | "draft" | "hidden";
                        setStatus(nextVal);
                        onSave({ ...blog, status: nextVal });
                      }}
                      className="w-full p-2.5 rounded-xl border border-slate-200 bg-slate-50 font-semibold text-slate-800 outline-none focus:border-emerald-600 cursor-pointer"
                    >
                      <option value="published">Đang công khai trên trang cẩm nang</option>
                      <option value="draft">Bản nháp (Chưa xuất bản)</option>
                      <option value="hidden">Đang tạm ẩn khỏi cộng đồng</option>
                    </select>
                  </div>

                  <button
                    type="button"
                    onClick={() => setActiveMode("editor")}
                    className="w-full py-2.5 px-4 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 font-bold rounded-xl transition-colors flex items-center justify-center gap-2 cursor-pointer border border-emerald-200/80"
                  >
                    <Edit3 size={14} />
                    <span>Mở biên tập viên chỉnh sửa bài</span>
                  </button>
                </div>

                <div className="pt-3 border-t border-slate-100 space-y-2 text-slate-500 text-[11px]">
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-1 text-slate-400">
                      <Calendar size={12} /> Ngày xuất bản:
                    </span>
                    <span className="font-semibold text-slate-700">{publishedAt}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-1 text-slate-400">
                      <User size={12} /> Tác giả:
                    </span>
                    <span className="font-semibold text-slate-700">{authorName}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-1 text-slate-400">
                      <Eye size={12} /> Lượt xem:
                    </span>
                    <span className="font-mono font-bold text-slate-800">
                      {(parseInt(views, 10) || 0).toLocaleString("vi-VN")}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-1 text-slate-400">
                      <Heart size={12} className="text-rose-500" /> Lượt thích:
                    </span>
                    <span className="font-mono font-bold text-slate-800">
                      {(parseInt(likes, 10) || 0).toLocaleString("vi-VN")}
                    </span>
                  </div>
                </div>
              </div>
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
                    {readTime && (
                      <span className="absolute bottom-2 right-2 px-2 py-0.5 rounded-md bg-slate-950/70 backdrop-blur-xs text-white text-[10px] font-medium flex items-center gap-1">
                        <Clock size={10} />
                        {readTime}
                      </span>
                    )}
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
