import React from 'react'
import { useNavigate } from 'react-router-dom'
import { Bookmark, Store, Utensils, Tag } from 'lucide-react'
import type { FoodItemDto, FoodSuggestedPlaceDto } from '@/types/models/place.model'

interface FoodCardProps {
  food: FoodItemDto
  isSaved: boolean
  onToggleSave: (id: number) => void
}

export const FoodCard: React.FC<FoodCardProps> = ({ food, isSaved, onToggleSave }) => {
  const navigate = useNavigate()
  const priceText = food.priceRange || (food.minPrice ? `${Number(food.minPrice).toLocaleString('vi-VN')}đ` : 'Giá bình dân')

  const handlePlaceClick = (e: React.MouseEvent, place: FoodSuggestedPlaceDto) => {
    e.preventDefault()
    e.stopPropagation()
    if (place.placeId) {
      navigate(`/places/${place.placeId}`)
    } else {
      navigate(`/explore?q=${encodeURIComponent(place.name)}`)
    }
  }

  return (
    <div
      onClick={() => navigate(`/explore?q=${encodeURIComponent(food.name)}`)}
      className="bg-white rounded-lg border border-gray-200 shadow-2xs hover:shadow-md transition-all flex flex-col overflow-hidden group cursor-pointer"
    >
      <div className="relative aspect-[4/3] w-full overflow-hidden bg-gray-100">
        {food.imageUrl ? (
          <img
            src={food.imageUrl}
            alt={food.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-slate-100 text-slate-300">
            <Utensils className="w-10 h-10" />
          </div>
        )}

        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation()
            onToggleSave(food.id)
          }}
          aria-label={isSaved ? 'Bỏ lưu món ăn' : 'Lưu món ăn'}
          className="absolute top-3 right-3 p-2 bg-white/95 backdrop-blur-xs text-gray-700 hover:text-rose-600 rounded-lg shadow-xs transition-colors cursor-pointer z-10"
        >
          <Bookmark className={`w-4 h-4 ${isSaved ? 'fill-rose-500 text-rose-500' : ''}`} />
        </button>
      </div>

      <div className="p-4 sm:p-5 flex-1 flex flex-col justify-between space-y-3.5">
        <div className="space-y-1.5">
          <h3 className="text-base sm:text-lg font-bold text-gray-900 group-hover:text-emerald-700 transition-colors leading-snug">
            {food.name}
          </h3>

          {food.description && (
            <p className="text-xs text-gray-600 leading-relaxed line-clamp-2">
              {food.description}
            </p>
          )}
        </div>

        {food.suggestedPlaces && food.suggestedPlaces.length > 0 && (
          <div className="space-y-2 bg-emerald-50/50 p-3 rounded-lg border border-emerald-100/70">
            <div className="text-[11px] font-bold text-emerald-800 uppercase tracking-wider flex items-center gap-1.5">
              <Store className="w-3.5 h-3.5 text-emerald-700" />
              <span>Quán ngon đề xuất</span>
            </div>
            <div className="space-y-1.5">
              {food.suggestedPlaces.map((place, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={(e) => handlePlaceClick(e, place)}
                  className="w-full text-left flex items-start justify-between gap-2 p-2 rounded-md bg-white hover:bg-emerald-100/60 border border-emerald-100/80 transition-all group/place cursor-pointer active-press shadow-2xs"
                  title={`Xem chi tiết địa điểm ${place.name}`}
                >
                  <div className="min-w-0 flex-1">
                    <div className="font-bold text-xs text-gray-900 group-hover/place:text-emerald-800 line-clamp-1 leading-snug">
                      {place.name}
                    </div>
                    <div className="text-[11px] text-gray-500 line-clamp-1 mt-0.5 font-normal leading-normal">
                      {place.address}
                    </div>
                  </div>
                  <span className="shrink-0 text-[11px] font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200 self-center">
                    ★ {place.rating}
                  </span>
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="pt-2.5 border-t border-gray-100 flex items-center justify-between text-xs">
          <div className="flex items-center gap-1.5 text-slate-500">
            <Tag className="w-3.5 h-3.5 text-slate-400" />
            <span className="font-medium">Mức giá:</span>
          </div>
          <span className="font-bold text-emerald-800 text-xs sm:text-sm">
            {priceText}
          </span>
        </div>
      </div>
    </div>
  )
}
