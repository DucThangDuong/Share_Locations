import React from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ArrowRight, ArrowUpRight, BookOpen } from 'lucide-react'
import type { RegionBlogPost } from '@/types/models/region.model'

interface RegionBlogSectionProps {
  posts: RegionBlogPost[]
  regionName: string
}

export const RegionBlogSection: React.FC<RegionBlogSectionProps> = ({ posts, regionName }) => {
  const navigate = useNavigate()

  if (!posts || posts.length === 0) return null

  return (
    <section className="space-y-6 my-12">
      <div className="flex items-center justify-between gap-4 border-b border-slate-200/80 pb-3">
        <div>
          <h3 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Cẩm nang khám phá {regionName}
          </h3>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Gợi ý trải nghiệm, điểm check-in và kinh nghiệm thực tế từ cộng đồng
          </p>
        </div>

        <Link
          to="/blog"
          className="group inline-flex items-center gap-1.5 text-xs sm:text-sm font-bold text-emerald-800 hover:text-emerald-950 transition-colors"
        >
          <span>Xem tất cả bài viết</span>
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {posts.map((post) => (
          <article
            key={post.id}
            onClick={() => navigate(post.id ? `/blog/${post.id}` : '/blog')}
            className="group flex flex-col space-y-3.5 cursor-pointer bg-white rounded-2xl p-4 border border-slate-200/90 hover:border-emerald-600/70 hover:shadow-md transition-all shadow-2xs"
          >
            <div className="relative aspect-16/10 w-full overflow-hidden rounded-xl bg-slate-100 border border-slate-200/60 flex items-center justify-center">
              {post.coverUrl ? (
                <img
                  src={post.coverUrl}
                  alt={post.title}
                  className="w-full h-full object-cover group-hover:scale-102 transition-all duration-300"
                  loading="lazy"
                />
              ) : (
                <BookOpen size={32} className="text-slate-300" />
              )}
            </div>

            <div className="space-y-2.5 flex-1 flex flex-col justify-between">
              <div className="space-y-1.5">
                <div className="flex items-start justify-between gap-2">
                  <h3 className="text-base font-bold text-slate-900 leading-snug group-hover:text-emerald-800 transition-colors line-clamp-2">
                    {post.title}
                  </h3>
                  <ArrowUpRight
                    size={18}
                    className="text-slate-400 group-hover:text-emerald-800 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all shrink-0 mt-0.5"
                  />
                </div>

                {post.excerpt && (
                  <p className="text-slate-600 text-xs leading-relaxed line-clamp-2 font-normal">
                    {post.excerpt}
                  </p>
                )}
              </div>

              <div className="flex items-center justify-between pt-3 border-t border-slate-100">
                <div className="flex items-center gap-2 min-w-0">
                  {post.author?.avatar ? (
                    <img
                      src={post.author.avatar}
                      alt={post.author.name}
                      className="w-6 h-6 rounded-full object-cover border border-slate-200 shrink-0"
                    />
                  ) : (
                    <div className="w-6 h-6 rounded-full bg-slate-900 text-white flex items-center justify-center text-[10px] font-bold shrink-0">
                      {(post.author?.name || 'T').charAt(0).toUpperCase()}
                    </div>
                  )}
                  <span className="font-semibold text-xs text-slate-800 truncate">
                    {post.author?.name || 'Cộng đồng LangThang'}
                  </span>
                </div>

                <span className="text-[11px] text-slate-400 font-medium">
                  {post.readTime || '5 phút đọc'}
                </span>
              </div>
            </div>
          </article>
        ))}
      </div>
    </section>
  )
}

export default RegionBlogSection
