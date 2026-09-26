import React from 'react'
import { Link } from 'react-router-dom'
import {
  Calendar,
  Clock,
  Eye,
  ArrowRight
} from 'lucide-react'
import type { UserBlogItem } from '@/types/models/userProfile.model'

interface UserProfileBlogCardProps {
  blog: UserBlogItem
}

export const UserProfileBlogCard: React.FC<UserProfileBlogCardProps> = ({ blog }) => {
  const coverImage =
    blog.coverImageUrl ||
    'https://images.unsplash.com/photo-1488646953014-85cb44e25828?w=600&h=350&fit=crop'

  return (
    <div className="bg-white rounded-2xl overflow-hidden border border-slate-200/90 shadow-2xs hover:shadow-md transition-all group flex flex-col sm:flex-row">
      <div className="relative w-full sm:w-48 md:w-56 h-44 sm:h-auto shrink-0 overflow-hidden bg-slate-100">
        <img
          src={coverImage}
          alt={blog.title}
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-white/0 group-hover:bg-white/15 transition-colors duration-300 pointer-events-none" />
        {blog.categoryName && (
          <div className="absolute top-2.5 left-2.5 bg-black/60 backdrop-blur-md text-white px-2.5 py-1 rounded-full text-xs font-semibold">
            {blog.categoryName}
          </div>
        )}
      </div>

      <div className="p-4 sm:p-5 flex-1 flex flex-col justify-between">
        <div>
          <div className="flex items-center gap-3 text-xs text-slate-500 font-medium mb-2">
            <span className="flex items-center gap-1">
              <Calendar size={12} />
              {new Date(blog.createdAt).toLocaleDateString('vi-VN')}
            </span>
            <span className="flex items-center gap-1">
              <Clock size={12} />
              {blog.readTimeMinutes || 5} phút đọc
            </span>
            <span className="flex items-center gap-1">
              <Eye size={12} />
              {blog.viewCount || 0} lượt xem
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
          <Link
            to={`/blog/${blog.id}`}
            className="inline-flex items-center gap-1 text-xs font-bold text-emerald-700 hover:text-emerald-800 group-hover:translate-x-0.5 transition-all"
          >
            <span>Đọc bài viết</span>
            <ArrowRight size={14} />
          </Link>
        </div>
      </div>
    </div>
  )
}
