import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { CheckCircle2, AlertCircle } from 'lucide-react'
import { placeService } from '@/services/placeService'
import { ReportModal } from '@/components/common/ReportModal'
import { useAuth } from '@/context/AuthContext'
import { PlaceDetailGallery } from '@/components/place/PlaceDetailGallery'
import { PlaceDetailOverview } from '@/components/place/PlaceDetailOverview'
import { PlaceDetailReviews } from '@/components/place/PlaceDetailReviews'
import { PlaceDetailSidebar } from '@/components/place/PlaceDetailSidebar'
import type { PlaceDetailDto, ReviewItemDto } from '@/types/models/place.model'

export const PlaceDetailPage = () => {
  const { id } = useParams<{ id: string }>()
  const { isAuthenticated } = useAuth()
  const [place, setPlace] = useState<PlaceDetailDto | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isSaved, setIsSaved] = useState(false)
  const [isReportOpen, setIsReportOpen] = useState(false)
  const [showShareToast, setShowShareToast] = useState(false)
  const [reviewsList, setReviewsList] = useState<ReviewItemDto[]>([])
  const [ratingBreakdown, setRatingBreakdown] = useState<Record<string, number>>({
    '5': 0,
    '4': 0,
    '3': 0,
    '2': 0,
    '1': 0
  })

  useEffect(() => {
    window.scrollTo(0, 0)
    const fetchPlaceData = async () => {
      if (!id) return
      setLoading(true)
      setError(null)
      try {
        const placeRes = await placeService.getPlaceById(id)
        if (placeRes.success && placeRes.data) {
          setPlace(placeRes.data)
        } else {
          setError(placeRes.message || 'Không tìm thấy thông tin địa điểm.')
        }

        const reviewsRes = await placeService.getPlaceReviews(id)
        if (reviewsRes.success && reviewsRes.data) {
          setReviewsList(reviewsRes.data.items || [])
          if (reviewsRes.data.ratingBreakdown) {
            setRatingBreakdown(reviewsRes.data.ratingBreakdown)
          }
        }
      } catch {
        setError('Đã xảy ra lỗi khi tải thông tin địa điểm từ máy chủ.')
      } finally {
        setLoading(false)
      }
    }
    fetchPlaceData()
  }, [id])

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href)
    setShowShareToast(true)
    setTimeout(() => setShowShareToast(false), 2500)
  }

  const handleToggleSave = async () => {
    if (!id || !isAuthenticated) {
      alert('Vui lòng đăng nhập để lưu địa điểm yêu thích.')
      return
    }
    try {
      if (isSaved) {
        await placeService.unsavePlace(id)
        setIsSaved(false)
      } else {
        await placeService.savePlace(id)
        setIsSaved(true)
      }
    } catch {
      setIsSaved(!isSaved)
    }
  }

  const handleReviewAdded = (newReview: ReviewItemDto) => {
    setReviewsList((prev) => [newReview, ...prev])
    setRatingBreakdown((prev) => {
      const starKey = newReview.rating.toString()
      return {
        ...prev,
        [starKey]: (prev[starKey] || 0) + 1
      }
    })
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50/50 pb-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 space-y-6 animate-pulse">
          <div className="h-6 w-1/3 bg-gray-200 rounded-lg" />
          <div className="h-10 w-2/3 bg-gray-200 rounded-lg" />
          <div className="h-96 w-full bg-gray-200 rounded-lg" />
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-6">
              <div className="h-48 bg-gray-200 rounded-lg" />
              <div className="h-64 bg-gray-200 rounded-lg" />
            </div>
            <div className="h-96 bg-gray-200 rounded-lg" />
          </div>
        </div>
      </div>
    )
  }

  if (error || !place) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center p-6 text-center">
        <div className="w-16 h-16 bg-rose-100 text-rose-600 rounded-lg flex items-center justify-center mb-4">
          <AlertCircle className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-bold text-gray-900 mb-2">Không thể tải thông tin địa điểm</h2>
        <p className="text-sm text-gray-500 max-w-md mb-6">{error || 'Địa điểm không tồn tại hoặc đã bị gỡ bỏ.'}</p>
        <Link
          to="/explore"
          className="px-5 py-2.5 bg-emerald-600 text-white text-sm font-semibold rounded-lg shadow-xs hover:bg-emerald-700 transition-colors"
        >
          Quay lại trang Khám phá
        </Link>
      </div>
    )
  }

  const images = place.mediaUrls && place.mediaUrls.length > 0
    ? place.mediaUrls
    : place.thumbnailUrl
      ? [place.thumbnailUrl]
      : []

  const totalReviews = place.reviewCount || reviewsList.length || 0

  return (
    <div className="min-h-screen bg-gray-50/50 pb-20">
      {showShareToast && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2 px-4 py-3 bg-gray-900 text-white text-sm font-medium rounded-lg shadow-xl animate-in slide-in-from-bottom-5">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>Đã sao chép liên kết vào bộ nhớ tạm!</span>
        </div>
      )}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6">
        <PlaceDetailGallery images={images} placeName={place.name} />

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mt-8">
          <div className="lg:col-span-2 space-y-8">
            <PlaceDetailOverview
              place={place}
              totalReviews={totalReviews}
              isSaved={isSaved}
              onToggleSave={handleToggleSave}
              onShare={handleShare}
              onOpenReport={() => setIsReportOpen(true)}
            />

            <PlaceDetailReviews
              placeId={place.id}
              reviews={reviewsList}
              ratingBreakdown={ratingBreakdown}
              avgRating={place.avgRating}
              isAuthenticated={isAuthenticated}
              onReviewAdded={handleReviewAdded}
            />
          </div>

          <PlaceDetailSidebar place={place} />
        </div>
      </div>

      <ReportModal
        isOpen={isReportOpen}
        onClose={() => setIsReportOpen(false)}
        placeId={place.id}
        placeName={place.name}
      />
    </div>
  )
}
