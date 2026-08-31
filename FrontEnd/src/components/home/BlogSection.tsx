import React from 'react'
import { BLOG_ITEMS } from '@/services/travelDataService'
import { BookOpen, ArrowRight } from 'lucide-react'

export const BlogSection: React.FC = () => {
  return (
    <section id="blog" className="scroll-mt-20">
      <div className="flex justify-between items-end mb-8 border-b border-surface-variant pb-3">
        <div>
          <span className="text-xs font-bold text-secondary-container uppercase tracking-widest bg-secondary-container/10 px-3.5 py-1 rounded-full inline-flex items-center gap-1.5 mb-2.5">
            <BookOpen className="w-3 h-3" /> Góc chia sẻ
          </span>
          <h2 className="text-3xl md:text-4xl text-primary-container font-extrabold tracking-tight">
            Blog trải nghiệm
          </h2>
        </div>
        <a
          href="#blog"
          className="text-xs sm:text-sm font-semibold text-primary-container hover:text-secondary-container transition-colors flex items-center gap-1"
        >
          Xem tất cả bài viết <ArrowRight className="w-4 h-4" />
        </a>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {BLOG_ITEMS.map((item) => (
          <article
            key={item.id}
            className="bg-white rounded-3xl overflow-hidden border border-surface-variant shadow-xs hover-lift transition-all duration-300 flex flex-col justify-between group cursor-pointer"
          >
            <div className="relative aspect-16/10 overflow-hidden bg-slate-100">
              <img
                src={item.imageUrl}
                alt={item.title}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                loading="lazy"
              />
              <span className="absolute top-4 left-4 bg-white/90 backdrop-blur-xs text-slate-800 text-[11px] font-bold px-2.5 py-1 rounded-full shadow-xs">
                {item.category}
              </span>
            </div>

            <div className="p-6 flex-1 flex flex-col justify-between space-y-4">
              <div>
                <h3 className="text-base font-bold text-slate-900 group-hover:text-primary-container transition-colors leading-snug tracking-tight">
                  {item.title}
                </h3>
                <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed mt-2 font-normal">
                  {item.summary}
                </p>
              </div>

              <div className="pt-4 border-t border-surface-variant flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <img
                    src={item.authorAvatar}
                    alt={item.authorName}
                    className="w-7 h-7 rounded-full object-cover border border-slate-200"
                  />
                  <span className="text-xs font-semibold text-slate-700">{item.authorName}</span>
                </div>
                <div className="text-[11px] text-slate-400">
                  {item.publishedAt} • {item.readTime}
                </div>
              </div>
            </div>
          </article>
        ))}
      </div>
    </section>
  )
}
