import { useState } from 'react'
import { UtensilsCrossed, ChevronLeft, ChevronRight, X } from 'lucide-react'
import type { FoodItemDto } from '@/types/models/place.model'

interface PlaceDetailFoodsProps {
  foods: FoodItemDto[]
}

export const PlaceDetailFoods = ({ foods }: PlaceDetailFoodsProps) => {
  const [lightboxFood, setLightboxFood] = useState<FoodItemDto | null>(null)
  const [lightboxIdx, setLightboxIdx] = useState(0)

  if (!foods || foods.length === 0) return null

  const openLightbox = (food: FoodItemDto, idx: number) => {
    setLightboxFood(food)
    setLightboxIdx(idx)
  }

  const closeLightbox = () => {
    setLightboxFood(null)
    setLightboxIdx(0)
  }

  const lightboxImages = lightboxFood?.mediaUrls?.length
    ? lightboxFood.mediaUrls
    : lightboxFood?.imageUrl
      ? [lightboxFood.imageUrl]
      : []

  return (
    <>
      <div className="bg-white p-6 sm:p-7 rounded-lg border border-gray-200/80 shadow-2xs">
        <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2 mb-5">
          <span>Món ăn nổi bật</span>
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {foods.map((food) => {
            const allImages = food.mediaUrls?.length
              ? food.mediaUrls
              : food.imageUrl
                ? [food.imageUrl]
                : []

            return (
              <div
                key={food.id}
                className="group relative flex gap-4 p-3.5 rounded-xl border border-gray-100 bg-gray-50/50 hover:bg-white hover:border-gray-200 hover:shadow-sm transition-all duration-200"
              >
                {/* Thumbnail */}
                {allImages.length > 0 ? (
                  <div
                    className="relative w-24 h-24 sm:w-28 sm:h-28 rounded-lg overflow-hidden shrink-0 cursor-pointer"
                    onClick={() => openLightbox(food, 0)}
                  >
                    <img
                      src={allImages[0]}
                      alt={food.name}
                      className="w-full h-full object-cover transition-all duration-300"
                      loading="lazy"
                    />
                    <div className="absolute inset-0 bg-white/0 group-hover:bg-white/20 transition-colors duration-200 pointer-events-none" />
                    {allImages.length > 1 && (
                      <div className="absolute bottom-1.5 right-1.5 px-1.5 py-0.5 bg-black/60 text-white text-[10px] font-semibold rounded-md backdrop-blur-sm">
                        +{allImages.length - 1} ảnh
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-lg bg-orange-50 flex items-center justify-center shrink-0">
                    <UtensilsCrossed className="w-8 h-8 text-orange-200" />
                  </div>
                )}

                {/* Content */}
                <div className="flex flex-col justify-center min-w-0 flex-1">
                  <h3 className="text-sm sm:text-base font-bold text-gray-900 truncate">
                    {food.name}
                  </h3>

                  {food.description && (
                    <p className="text-xs sm:text-sm text-gray-500 mt-1 line-clamp-2 leading-relaxed">
                      {food.description}
                    </p>
                  )}

                  {food.priceRange && (
                    <div className="mt-2">
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold bg-orange-50 text-orange-700 rounded-lg border border-orange-100">
                        {food.priceRange}
                      </span>
                    </div>
                  )}

                  {!food.priceRange && (food.minPrice || food.maxPrice) && (
                    <div className="mt-2">
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold bg-orange-50 text-orange-700 rounded-lg border border-orange-100">
                        {food.minPrice && food.maxPrice
                          ? `${food.minPrice.toLocaleString('vi-VN')}đ - ${food.maxPrice.toLocaleString('vi-VN')}đ`
                          : food.minPrice
                            ? `Từ ${food.minPrice.toLocaleString('vi-VN')}đ`
                            : `Đến ${food.maxPrice!.toLocaleString('vi-VN')}đ`}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Lightbox */}
      {lightboxFood && lightboxImages.length > 0 && (
        <div
          className="fixed inset-0 z-[60] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={closeLightbox}
        >
          <div
            className="relative max-w-3xl w-full"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close */}
            <button
              onClick={closeLightbox}
              className="absolute -top-12 right-0 p-2 text-white/70 hover:text-white transition-colors cursor-pointer"
            >
              <X className="w-6 h-6" />
            </button>

            {/* Title */}
            <div className="absolute -top-12 left-0 text-white font-semibold text-lg truncate max-w-[60%]">
              {lightboxFood.name}
            </div>

            {/* Image */}
            <div className="relative rounded-xl overflow-hidden bg-black">
              <img
                src={lightboxImages[lightboxIdx]}
                alt={`${lightboxFood.name} - Ảnh ${lightboxIdx + 1}`}
                className="w-full max-h-[75vh] object-contain"
              />

              {/* Prev / Next */}
              {lightboxImages.length > 1 && (
                <>
                  <button
                    onClick={() => setLightboxIdx((prev) => (prev - 1 + lightboxImages.length) % lightboxImages.length)}
                    className="absolute left-3 top-1/2 -translate-y-1/2 p-2 bg-black/50 hover:bg-black/70 text-white rounded-full transition-colors cursor-pointer"
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() => setLightboxIdx((prev) => (prev + 1) % lightboxImages.length)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 p-2 bg-black/50 hover:bg-black/70 text-white rounded-full transition-colors cursor-pointer"
                  >
                    <ChevronRight className="w-5 h-5" />
                  </button>
                </>
              )}

              {/* Counter */}
              {lightboxImages.length > 1 && (
                <div className="absolute bottom-3 left-1/2 -translate-x-1/2 px-3 py-1 bg-black/60 text-white text-xs font-medium rounded-full backdrop-blur-sm">
                  {lightboxIdx + 1} / {lightboxImages.length}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  )
}
