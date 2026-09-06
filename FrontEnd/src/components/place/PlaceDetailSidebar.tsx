import { Link } from 'react-router-dom'
import { Clock, Phone, Globe, ExternalLink, MapPin, Compass } from 'lucide-react'
import { PlaceDetailMap } from './PlaceDetailMap'
import type { PlaceDetailDto } from '@/types/models/place.model'

interface PlaceDetailSidebarProps {
  place: PlaceDetailDto
}

export const PlaceDetailSidebar = ({ place }: PlaceDetailSidebarProps) => {
  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-lg border border-gray-200/80 shadow-2xs space-y-5 sticky top-20">
        <h3 className="font-bold text-gray-900 text-base pb-3 border-b border-gray-100">
          Thông tin liên hệ & Vị trí
        </h3>

        <div className="space-y-4 text-xs sm:text-sm">
          {place.openingHours && (
            <div className="flex items-start gap-3">
              <Clock className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <div>
                <div className="font-semibold text-gray-900">Giờ hoạt động</div>
                <div className="text-gray-600 mt-0.5">{place.openingHours}</div>
              </div>
            </div>
          )}

          {place.phoneNumber && (
            <div className="flex items-start gap-3">
              <Phone className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <div>
                <div className="font-semibold text-gray-900">Số điện thoại</div>
                <a
                  href={`tel:${place.phoneNumber}`}
                  className="text-emerald-600 hover:underline mt-0.5 block font-medium"
                >
                  {place.phoneNumber}
                </a>
              </div>
            </div>
          )}

          {place.website && (
            <div className="flex items-start gap-3">
              <Globe className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <div>
                <div className="font-semibold text-gray-900">Trang thông tin</div>
                <a
                  href={place.website}
                  target="_blank"
                  rel="noreferrer"
                  className="text-emerald-600 hover:underline text-xs flex items-center gap-1 mt-0.5"
                >
                  <span className="truncate max-w-[200px]">{place.website.replace('https://', '')}</span>
                  <ExternalLink className="w-3 h-3 shrink-0" />
                </a>
              </div>
            </div>
          )}
        </div>

        <div className="pt-4 border-t border-gray-100 space-y-2.5">
          <div className="text-xs font-semibold text-gray-700 flex items-center justify-between">
            <span className="flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-emerald-600" />
              <span>Vị trí trên bản đồ</span>
            </span>
            <Link
              to={`/map?keyword=${encodeURIComponent(place.name)}`}
              className="text-emerald-600 hover:underline text-2xs font-semibold"
            >
              Xem toàn bộ bản đồ
            </Link>
          </div>

          <PlaceDetailMap place={place} />

          <div className="flex items-center justify-between text-xs text-gray-500 pt-0.5">
            <span className="truncate pr-2">{place.address}</span>
            <a
              href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(place.name + ' ' + place.address)}`}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1 text-emerald-600 hover:underline shrink-0 font-medium"
            >
              <span>Chỉ đường</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        </div>

        <div className="pt-2">
          <Link
            to="/itineraries"
            className="w-full flex items-center justify-center gap-2 py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-sm rounded-lg shadow-xs transition-colors text-center"
          >
            <Compass className="w-4 h-4" />
            <span>Xem lịch trình gợi ý đến đây</span>
          </Link>
        </div>
      </div>
    </div>
  )
}
