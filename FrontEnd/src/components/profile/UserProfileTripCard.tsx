import React from 'react'
import { Link } from 'react-router-dom'
import {
  Calendar,
  MapPin,
  Users,
  Compass,
  ArrowRight
} from 'lucide-react'
import type { UserTripSummaryDto } from '@/types/models/trip.model'

interface UserProfileTripCardProps {
  trip: UserTripSummaryDto
}

export const UserProfileTripCard: React.FC<UserProfileTripCardProps> = ({ trip }) => {
  const coverImage =
    trip.coverImageUrl ||
    'https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?w=600&h=300&fit=crop'

  return (
    <div className="bg-white rounded-2xl overflow-hidden border border-slate-200/90 shadow-2xs hover:shadow-md transition-all group flex flex-col sm:flex-row">
      <div className="relative w-full sm:w-48 md:w-56 h-44 sm:h-auto shrink-0 overflow-hidden bg-slate-100">
        <img
          src={coverImage}
          alt={trip.title}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
        />
        <div className="absolute top-2.5 left-2.5 bg-black/60 backdrop-blur-md text-white px-2.5 py-1 rounded-full text-xs font-semibold flex items-center gap-1">
          <Compass size={12} className="text-amber-400" />
          <span>{trip.durationDays || 1} ngày {trip.nightsCount ? `${trip.nightsCount} đêm` : ''}</span>
        </div>
      </div>

      <div className="p-4 sm:p-5 flex-1 flex flex-col justify-between">
        <div>
          <div className="flex items-center gap-2 text-xs text-slate-500 font-medium mb-1.5">
            {trip.province && (
              <span className="flex items-center gap-1 text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md font-semibold">
                <MapPin size={12} />
                {trip.province}
              </span>
            )}
            {trip.createdAt && (
              <span className="flex items-center gap-1">
                <Calendar size={12} />
                {new Date(trip.createdAt).toLocaleDateString('vi-VN')}
              </span>
            )}
          </div>

          <h3 className="text-base sm:text-lg font-bold text-slate-900 group-hover:text-emerald-700 transition-colors line-clamp-1 mb-1.5">
            {trip.title}
          </h3>

          {trip.description && (
            <p className="text-slate-600 text-xs sm:text-sm line-clamp-2 leading-relaxed mb-3">
              {trip.description}
            </p>
          )}
        </div>

        <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-3 text-slate-500 font-medium">
            <span className="flex items-center gap-1">
              <MapPin size={13} className="text-amber-500" />
              {trip.totalStopsCount || 0} điểm dừng
            </span>
            {trip.membersCount > 0 && (
              <span className="flex items-center gap-1">
                <Users size={13} className="text-blue-500" />
                {trip.membersCount} thành viên
              </span>
            )}
          </div>

          <Link
            to={`/itinerary/${trip.id}`}
            className="inline-flex items-center gap-1 text-emerald-700 font-bold hover:text-emerald-800 group-hover:translate-x-0.5 transition-all"
          >
            <span>Xem hành trình</span>
            <ArrowRight size={14} />
          </Link>
        </div>
      </div>
    </div>
  )
}
