import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Sparkles, ArrowRight } from 'lucide-react'
import { catalogService } from '@/services/catalogService'
import type { CollectionDto } from '@/types/models/place.model'

export const FeaturedCollectionsSection: React.FC = () => {
  const [collections, setCollections] = useState<CollectionDto[]>([])

  useEffect(() => {
    const loadFeaturedCollections = async () => {
      try {
        const res = await catalogService.getFeaturedCollections(3)
        if (res.success && res.data && res.data.length > 0) {
          setCollections(res.data)
        }
      } catch {
      }
    }
    loadFeaturedCollections()
  }, [])

  const defaultCollections = [
    {
      id: 1,
      title: 'Săn mây đại ngàn Tây Bắc',
      subtitle: 'Chinh phục những cung đèo hùng vĩ và biển mây bồng bềnh Sa Pa, Hà Giang, Tà Xùa.',
      tag: 'Cung đường phượt',
      region: 'Miền Bắc',
      placesCount: '24 địa điểm',
      image: 'https://images.unsplash.com/photo-1570641963303-92ce4845ed4c?w=900&h=600&fit=crop&auto=format'
    },
    {
      id: 2,
      title: 'Hành trình Di sản Cố đô & Phố cổ',
      subtitle: 'Đắm chìm trong nét rêu phong trầm mặc của Đại Nội Huế và đêm hoa đăng lung linh Hội An.',
      tag: 'Di sản UNESCO',
      region: 'Miền Trung',
      placesCount: '32 địa điểm',
      image: 'https://images.unsplash.com/photo-1559592413-7cec4d0cae2b?w=900&h=600&fit=crop&auto=format'
    },
    {
      id: 3,
      title: 'Thiên đường Biển đảo & Hoàng hôn',
      subtitle: 'Thả mình vào làn nước ngọc bích Phú Quốc, ngắm rạn san hô kỳ ảo và bãi cát trắng mịn.',
      tag: 'Nghỉ dưỡng nhiệt đới',
      region: 'Miền Nam',
      placesCount: '18 địa điểm',
      image: 'https://images.unsplash.com/photo-1518509562904-e7ef99cdcc86?w=900&h=600&fit=crop&auto=format'
    }
  ]

  const items = collections.length > 0
    ? collections.map((col, idx) => ({
        id: col.id,
        title: col.title,
        subtitle: col.description || 'Khám phá bộ sưu tập những điểm đến được yêu thích nhất.',
        tag: 'Bộ sưu tập tuyển chọn',
        region: idx === 0 ? 'Miền Bắc' : idx === 1 ? 'Miền Trung' : 'Miền Nam',
        placesCount: `${col.placeCount || 12} địa điểm`,
        image: col.coverUrl || defaultCollections[idx % defaultCollections.length].image
      }))
    : defaultCollections

  return (
    <section className="py-16 bg-slate-50 border-b border-slate-200/60">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-10">
          <div>
            <div className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-secondary-container mb-1.5">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Gợi ý độc quyền</span>
            </div>
            <h2 className="text-2xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
              Bộ sưu tập điểm đến nổi bật
            </h2>
          </div>

          <Link
            to="/explore"
            className="inline-flex items-center gap-2 text-xs sm:text-sm font-bold text-primary hover:text-primary-hover transition-colors"
          >
            <span>Xem tất cả bộ sưu tập</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {items.map((col) => (
            <Link
              key={col.id}
              to={`/explore?region=${encodeURIComponent(col.region)}`}
              className="group relative h-[380px] rounded-3xl overflow-hidden transition-all duration-300 flex flex-col justify-end p-6 border border-slate-200/60"
            >
              <img
                src={col.image}
                alt={col.title}
                className="absolute inset-0 w-full h-full object-cover"
                loading="lazy"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950/95 via-slate-950/40 to-transparent"></div>
              <div className="absolute inset-0 bg-white/0 group-hover:bg-white/15 transition-colors duration-300 pointer-events-none z-10"></div>

              <div className="relative z-10 space-y-2.5">
                <div className="flex items-center gap-2">
                  <span className="px-3 py-1 rounded-full bg-secondary-container text-slate-950 text-[10px] font-black tracking-wider uppercase">
                    {col.tag}
                  </span>
                  <span className="px-2.5 py-1 rounded-full bg-white/20 backdrop-blur-md text-white text-[10px] font-bold">
                    {col.placesCount}
                  </span>
                </div>

                <h3 className="text-xl font-extrabold text-white tracking-tight leading-snug group-hover:text-emerald-300 transition-colors">
                  {col.title}
                </h3>

                <p className="text-xs text-slate-200/90 line-clamp-2 leading-relaxed font-normal">
                  {col.subtitle}
                </p>

                <div className="pt-2 flex items-center gap-1.5 text-xs font-bold text-white group-hover:translate-x-1 transition-transform">
                  <span>Khám phá ngay</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  )
}
