import React from 'react'
import { CUISINE_ITEMS } from '@/services/travelDataService'
import { Utensils } from 'lucide-react'

export const CuisineSection: React.FC = () => {
  return (
    <section id="amthuc" className="bg-white rounded-3xl p-6 sm:p-10 shadow-xs border border-surface-variant scroll-mt-20">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-8 gap-4">
        <div>
          <span className="text-xs font-bold text-secondary-container uppercase tracking-widest bg-secondary-container/10 px-3.5 py-1 rounded-full inline-flex items-center gap-1.5 mb-2.5">
            <Utensils className="w-3 h-3" /> Hương vị bản địa
          </span>
          <h2 className="text-3xl md:text-4xl text-primary-container font-extrabold tracking-tight mb-2">
            Ẩm thực 3 miền
          </h2>
          <p className="text-slate-500 text-xs sm:text-sm max-w-xl">
            Mỗi món ăn là một câu chuyện văn hóa, hòa quyện giữa tinh hoa đất trời và bàn tay khéo léo của người Việt.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {CUISINE_ITEMS.map((item) => (
          <div
            key={item.id}
            className="group rounded-2xl overflow-hidden border border-surface-variant bg-surface hover-lift transition-all duration-300 flex flex-col justify-between"
          >
            <div className="relative aspect-4/3 overflow-hidden bg-slate-100">
              <img
                src={item.imageUrl}
                alt={item.name}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                loading="lazy"
              />
              <span className="absolute bottom-3 left-3 bg-black/60 backdrop-blur-xs text-white text-[11px] font-semibold px-2.5 py-1 rounded-full">
                {item.origin}
              </span>
            </div>

            <div className="p-5 flex-1 flex flex-col justify-between">
              <div>
                <h3 className="text-base font-bold text-slate-900 mb-2 group-hover:text-primary-container transition-colors tracking-tight">
                  {item.name}
                </h3>
                <p className="text-xs text-slate-600 leading-relaxed line-clamp-3 font-normal">
                  {item.description}
                </p>
              </div>

              <div className="mt-4 pt-3 border-t border-surface-variant flex items-center justify-between text-xs text-slate-500">
                <span className="text-emerald-700 font-semibold">Đặc sản truyền thống</span>
                <span className="text-secondary-container font-semibold group-hover:underline cursor-pointer">
                  Khám phá thêm →
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}
