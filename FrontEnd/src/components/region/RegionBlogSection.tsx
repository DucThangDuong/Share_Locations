import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import { MapPin, Star, Heart, Clock, ArrowRight } from 'lucide-react'
import type { RegionBlogPost } from '@/types/models/region.model'

interface RegionBlogSectionProps {
  posts: RegionBlogPost[]
  regionName: string
}

const BlogVerticalCard: React.FC<{ post: RegionBlogPost }> = ({ post }) => {
  const [isSaved, setIsSaved] = useState(false)

  const handleToggleSave = (e: React.MouseEvent) => {
    e.stopPropagation()
    e.preventDefault()
    setIsSaved(!isSaved)
  }

  return (
    <Link
      to="/blog"
      className="group flex flex-col bg-white rounded-2xl border border-slate-200/90 overflow-hidden shadow-xs hover:shadow-lg transition-all duration-300"
    >
      <div className="relative aspect-4/3 w-full overflow-hidden bg-slate-100">
        <img
          src={post.coverUrl || ''}
          alt={post.title}
          className="w-full h-full object-cover transition-opacity duration-300"
          loading="lazy"
        />
        <div className="absolute inset-0 bg-white/0 group-hover:bg-white/10 transition-colors duration-300 pointer-events-none" />

        <button
          type="button"
          onClick={handleToggleSave}
          aria-label={isSaved ? 'Bỏ lưu bài viết' : 'Lưu bài viết'}
          className="absolute top-3 right-3 w-8 h-8 rounded-full bg-white/95 hover:bg-white text-slate-800 shadow-sm flex items-center justify-center z-10 transition-transform active:scale-95 cursor-pointer"
        >
          <Heart
            className={`w-4 h-4 transition-colors ${
              isSaved ? 'fill-rose-500 text-rose-500' : 'text-slate-800 stroke-[2]'
            }`}
          />
        </button>
      </div>

      <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
        <div className="space-y-2">
          <div className="flex items-center justify-between gap-2 text-xs font-semibold">
            <div className="flex items-center gap-1 text-slate-600 truncate">
              <MapPin className="w-3.5 h-3.5 text-stone-400 shrink-0" />
              <span className="truncate">{post.location || post.category}</span>
            </div>

            <div className="flex items-center gap-1 text-slate-900 font-bold shrink-0">
              <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
              <span>{(post.rating || 5.0).toFixed(1)}</span>
              <span className="text-slate-400 font-normal">({post.reviewCount || 12})</span>
            </div>
          </div>

          <h4 className="font-bold text-[15px] sm:text-base text-slate-900 group-hover:text-emerald-900 transition-colors line-clamp-1 leading-snug tracking-tight">
            {post.title}
          </h4>

          <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">
            {post.excerpt}
          </p>

          {post.tags && post.tags.length > 0 && (
            <div className="flex flex-wrap gap-1.5 pt-1">
              {post.tags.map((tag, idx) => (
                <span
                  key={idx}
                  className="px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-600 text-[11px] font-medium"
                >
                  {tag}
                </span>
              ))}
            </div>
          )}
        </div>

        <div className="pt-2.5 border-t border-slate-100 flex items-center justify-between text-xs">
          <div className="flex items-center gap-1 text-slate-500 text-[11px]">
            <Clock className="w-3.5 h-3.5 text-slate-400" />
            <span>{post.statusOrHours || post.readTime}</span>
          </div>

          <span className="font-bold text-emerald-800 text-xs">
            Miễn phí
          </span>
        </div>
      </div>
    </Link>
  )
}

const BlogFeaturedCard: React.FC<{ post: RegionBlogPost }> = ({ post }) => {
  const [isSaved, setIsSaved] = useState(false)

  const handleToggleSave = (e: React.MouseEvent) => {
    e.stopPropagation()
    e.preventDefault()
    setIsSaved(!isSaved)
  }

  return (
    <Link
      to="/blog"
      className="group rounded-2xl bg-white border border-slate-200/90 overflow-hidden shadow-xs hover:shadow-lg transition-all duration-300 flex flex-col md:flex-row items-stretch mb-6"
    >
      <div className="md:w-5/12 relative aspect-16/10 md:aspect-auto min-h-[220px] md:min-h-[260px] overflow-hidden bg-slate-100 shrink-0">
        <img
          src={post.coverUrl || ''}
          alt={post.title}
          className="w-full h-full object-cover transition-opacity duration-300"
          loading="lazy"
        />
        <div className="absolute inset-0 bg-white/0 group-hover:bg-white/10 transition-colors duration-300 pointer-events-none" />
      </div>

      <div className="md:w-7/12 p-5 sm:p-6 flex flex-col justify-between space-y-4">
        <div className="space-y-2.5">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-600">
              <MapPin className="w-4 h-4 text-stone-400 shrink-0" />
              <span>{post.location || post.category}</span>
            </div>

            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1 text-xs font-bold text-slate-900">
                <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                <span>{(post.rating || 5.0).toFixed(1)}</span>
                <span className="text-slate-400 font-normal">({post.reviewCount || 18})</span>
              </div>

              <button
                type="button"
                onClick={handleToggleSave}
                aria-label={isSaved ? 'Bỏ lưu bài viết' : 'Lưu bài viết'}
                className="w-8 h-8 rounded-full bg-slate-50 hover:bg-slate-100 text-slate-800 flex items-center justify-center transition-all cursor-pointer"
              >
                <Heart
                  className={`w-4 h-4 transition-colors ${
                    isSaved ? 'fill-rose-500 text-rose-500' : 'text-slate-800 stroke-[2]'
                  }`}
                />
              </button>
            </div>
          </div>

          <h3 className="font-bold text-lg sm:text-xl text-slate-900 group-hover:text-emerald-900 transition-colors leading-snug tracking-tight">
            {post.title}
          </h3>

          <p className="text-xs sm:text-sm text-slate-600 leading-relaxed line-clamp-2">
            {post.excerpt}
          </p>

          {post.tags && post.tags.length > 0 && (
            <div className="flex flex-wrap gap-2 pt-1">
              {post.tags.map((tag, idx) => (
                <span
                  key={idx}
                  className="px-3 py-1 rounded-full bg-slate-100 text-slate-600 text-xs font-medium"
                >
                  {tag}
                </span>
              ))}
            </div>
          )}
        </div>

        <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
          <div className="flex items-center gap-1.5 text-slate-500">
            <Clock className="w-4 h-4 text-slate-400" />
            <span>{post.statusOrHours || 'Mở cửa cả ngày'}</span>
          </div>

          <span className="font-extrabold text-emerald-900 text-sm">
            Miễn phí
          </span>
        </div>
      </div>
    </Link>
  )
}

export const RegionBlogSection: React.FC<RegionBlogSectionProps> = ({ posts, regionName }) => {
  if (!posts || posts.length === 0) return null

  const featured = posts[0]
  const otherPosts = posts.slice(1)

  return (
    <section className="space-y-4 my-10">
      <div className="flex items-center justify-between gap-4 border-b border-slate-200/80 pb-3">
        <div>
          <h3 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Cẩm Nang & Kinh Nghiệm {regionName}
          </h3>
        </div>

        <Link
          to="/blog"
          className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-bold text-[#004f32] hover:text-[#003d27] transition-colors"
        >
          <span>Xem tất cả</span>
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>

      {featured && <BlogFeaturedCard post={featured} />}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {otherPosts.map((post) => (
          <BlogVerticalCard key={post.id} post={post} />
        ))}
      </div>
    </section>
  )
}
