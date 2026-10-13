import React from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Calendar,
  Eye,
  ArrowRight,
  Image
} from 'lucide-react'
import type { UserBlogItem } from '@/types/models/userProfile.model'

interface UserProfileBlogCardProps {
  blog: UserBlogItem
}

export const UserProfileBlogCard: React.FC<UserProfileBlogCardProps> = ({ blog }) => {
  const navigate = useNavigate()

  const coverImage = blog.coverImageUrl

  const handleOpenBlogDetail = (e?: React.MouseEvent) => {
    e?.stopPropagation()
    e?.preventDefault()
    navigate(`/blog/${blog.id}`)
  }

  return (
    <div
      onClick={handleOpenBlogDetail}
      className="bg-white rounded-2xl overflow-hidden border border-slate-200/90 shadow-2xs hover:shadow-md hover:border-emerald-300 transition-all group flex flex-col sm:flex-row cursor-pointer"
    >
      <div className="relative w-full sm:w-48 md:w-56 h-44 sm:h-auto shrink-0 overflow-hidden bg-slate-100 flex items-center justify-center">
        {coverImage ? (
          <img
            src={coverImage}
            alt={blog.title}
            className="w-full h-full object-cover"
            onError={(e) => {
              const target = e.target as HTMLImageElement;
              target.style.display = 'none';
              const parent = target.parentElement;
              if (parent && !parent.querySelector('.no-img-placeholder')) {
                const fallback = document.createElement('div');
                fallback.className = 'no-img-placeholder w-full h-full min-h-[140px] flex items-center justify-center bg-slate-50 text-slate-300 select-none';
                fallback.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-slate-300"><rect width="18" height="18" x="3" y="3" rx="2" ry="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"/></svg>';
                parent.appendChild(fallback);
              }
            }}
          />
        ) : (
          <div className="w-full h-full min-h-[140px] flex items-center justify-center bg-slate-50 text-slate-300 select-none">
            <Image size={32} className="text-slate-300" />
          </div>
        )}
        <div className="absolute inset-0 bg-white/0 group-hover:bg-white/15 transition-colors duration-300 pointer-events-none" />
      </div>

      <div className="p-4 sm:p-5 flex-1 flex flex-col justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-2.5 text-xs text-slate-500 font-medium mb-2">
            {blog.categoryName && (
              <span className="text-[11px] font-bold text-emerald-800 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-md">
                {blog.categoryName}
              </span>
            )}
            <span className="flex items-center gap-1">
              <Calendar size={12} />
              {new Date(blog.createdAt).toLocaleDateString('vi-VN')}
            </span>

            <span className="flex items-center gap-1">
              <Eye size={12} />
              {(blog.viewCount || 0).toLocaleString('vi-VN')} lượt xem
            </span>
          </div>

          <h3 className="text-base sm:text-lg font-bold text-slate-900 group-hover:text-emerald-700 transition-colors line-clamp-2 mb-2 leading-snug">
            {blog.title}
          </h3>

          {blog.excerpt && (
            <p className="text-slate-600 text-xs sm:text-sm line-clamp-2 leading-relaxed mb-3">
              {blog.excerpt}
            </p>
          )}
        </div>

        <div className="pt-3 border-t border-slate-100 flex items-center justify-end">
          <button
            type="button"
            onClick={handleOpenBlogDetail}
            className="inline-flex items-center gap-1 text-xs font-bold text-emerald-700 hover:text-emerald-800 group-hover:translate-x-0.5 transition-all cursor-pointer"
          >
            <span>Đọc cẩm nang</span>
            <ArrowRight size={14} />
          </button>
        </div>
      </div>
    </div>
  )
}

export default UserProfileBlogCard
