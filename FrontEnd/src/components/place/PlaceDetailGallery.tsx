import { useState } from 'react'
import { Camera, ChevronLeft, ChevronRight, X } from 'lucide-react'

interface PlaceDetailGalleryProps {
  images: string[]
  placeName: string
}

export const PlaceDetailGallery = ({ images, placeName }: PlaceDetailGalleryProps) => {
  const [isLightboxOpen, setIsLightboxOpen] = useState(false)
  const [activeImageIndex, setActiveImageIndex] = useState(0)

  if (!images || images.length === 0) {
    return (
      <div className="relative rounded-lg overflow-hidden h-48 sm:h-64 my-4 bg-slate-100 border border-slate-200 flex flex-col items-center justify-center text-slate-400 gap-2">
        <Camera className="w-10 h-10 text-slate-300" />
        <span className="text-sm font-medium text-slate-500">Chưa có hình ảnh nào cho địa điểm này</span>
      </div>
    )
  }

  return (
    <>
      <div className="relative rounded-lg overflow-hidden grid grid-cols-1 md:grid-cols-4 gap-2 h-[340px] sm:h-[420px] md:h-[460px] my-4 shadow-sm bg-gray-100">
        <div
          onClick={() => { setActiveImageIndex(0); setIsLightboxOpen(true) }}
          className="md:col-span-2 md:row-span-2 relative cursor-pointer group overflow-hidden"
        >
          <img
            src={images[0]}
            alt={placeName}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
          <div className="absolute inset-0 bg-black/10 group-hover:bg-transparent transition-colors" />
        </div>

        {images.slice(1, 5).map((img, idx) => (
          <div
            key={idx}
            onClick={() => { setActiveImageIndex(idx + 1); setIsLightboxOpen(true) }}
            className="hidden md:block relative cursor-pointer group overflow-hidden h-full"
          >
            <img
              src={img}
              alt={`${placeName} - ảnh ${idx + 2}`}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            />
            <div className="absolute inset-0 bg-black/10 group-hover:bg-transparent transition-colors" />
          </div>
        ))}
      </div>

      {isLightboxOpen && (
        <div className="fixed inset-0 z-50 bg-black/90 flex flex-col items-center justify-between p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-6xl flex items-center justify-between text-white py-2">
            <span className="text-sm font-medium">
              Ảnh {activeImageIndex + 1} / {images.length}
            </span>
            <button
              onClick={() => setIsLightboxOpen(false)}
              className="p-2 text-gray-400 hover:text-white rounded-lg transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          <div className="relative flex-1 flex items-center justify-center w-full max-w-5xl my-auto">
            <img
              src={images[activeImageIndex]}
              alt={placeName}
              className="max-h-[75vh] max-w-full object-contain rounded-lg shadow-2xl"
            />
            {images.length > 1 && (
              <>
                <button
                  onClick={() => setActiveImageIndex((prev) => (prev > 0 ? prev - 1 : images.length - 1))}
                  className="absolute left-2 top-1/2 -translate-y-1/2 p-3 bg-black/50 hover:bg-black/80 text-white rounded-full transition-colors"
                >
                  <ChevronLeft className="w-6 h-6" />
                </button>
                <button
                  onClick={() => setActiveImageIndex((prev) => (prev < images.length - 1 ? prev + 1 : 0))}
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-3 bg-black/50 hover:bg-black/80 text-white rounded-full transition-colors"
                >
                  <ChevronRight className="w-6 h-6" />
                </button>
              </>
            )}
          </div>

          <div className="w-full max-w-4xl py-4 overflow-x-auto flex items-center justify-center gap-2">
            {images.map((img, idx) => (
              <img
                key={idx}
                src={img}
                alt=""
                onClick={() => setActiveImageIndex(idx)}
                className={`w-16 h-12 object-cover rounded cursor-pointer transition-all ${idx === activeImageIndex ? 'border-2 border-emerald-500 scale-105' : 'opacity-50 hover:opacity-100'
                  }`}
              />
            ))}
          </div>
        </div>
      )}
    </>
  )
}
