import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { CheckCircle2, AlertCircle } from 'lucide-react'
import { placeService } from '@/services/placeService'
import { userService } from '@/services/userService'
import { ReportModal } from '@/components/common/ReportModal'
import { SharePlaceModal } from '@/components/place/SharePlaceModal'
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
  const [isShareOpen, setIsShareOpen] = useState(false)
  const [shareToastMsg, setShareToastMsg] = useState<string | null>(null)
  const [reviewsList, setReviewsList] = useState<ReviewItemDto[]>([])
  const [reviewPage, setReviewPage] = useState(1)
  const [totalReviewsCount, setTotalReviewsCount] = useState(0)
  const [loadingMoreReviews, setLoadingMoreReviews] = useState(false)
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
      setReviewPage(1)
      try {
        const placeRes = await placeService.getPlaceById(id)
        if (placeRes.success && placeRes.data) {
          setPlace(placeRes.data)
          if (isAuthenticated) {
            userService.recordAccessHistory(Number(id)).catch(() => {})
            userService.getMyFavorites({ targetType: 1, pageSize: 100 }).then((favRes) => {
              if (favRes.success && favRes.data) {
                const items = Array.isArray(favRes.data) ? favRes.data : (favRes.data.items || [])
                const isFav = items.some((f) => f.targetId === Number(id))
                setIsSaved(isFav)
              }
            }).catch(() => {})
          }
          try {
            const stored = JSON.parse(localStorage.getItem('langthang_recent_visited') || '[]')
            const item = {
              id: placeRes.data.id,
              name: placeRes.data.name,
              province: placeRes.data.provinceName,
              category: placeRes.data.categoryName,
              rating: placeRes.data.avgRating,
              coverUrl: placeRes.data.thumbnailUrl || placeRes.data.mediaUrls?.[0],
              visitedAt: 'Vừa xong'
            }
            const filtered = stored.filter((s: { id: number | string }) => String(s.id) !== String(item.id))
            const updated = [item, ...filtered].slice(0, 10)
            localStorage.setItem('langthang_recent_visited', JSON.stringify(updated))
            window.dispatchEvent(new Event('storage'))
          } catch {
          }
        } else {
          setError(placeRes.message || 'Không tìm thấy thông tin địa điểm.')
        }

        const reviewsRes = await placeService.getPlaceReviews(id, { page: 1, pageSize: 10 })
        if (reviewsRes.success && reviewsRes.data) {
          setReviewsList(reviewsRes.data.items || [])
          setTotalReviewsCount(
            reviewsRes.data.totalReviews ??
              placeRes?.data?.reviewCount ??
              (reviewsRes.data.items || []).length
          )
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
  }, [id, isAuthenticated])

  const handleLoadMoreReviews = async () => {
    if (loadingMoreReviews || !id) return
    const nextPage = reviewPage + 1
    setLoadingMoreReviews(true)
    try {
      const res = await placeService.getPlaceReviews(id, { page: nextPage, pageSize: 10 })
      if (res.success && res.data && res.data.items) {
        setReviewsList((prev) => {
          const existingIds = new Set(prev.map((r) => r.id))
          const newItems = (res.data.items || []).filter((r) => !existingIds.has(r.id))
          return [...prev, ...newItems]
        })
        setReviewPage(nextPage)
        if (res.data.totalReviews !== undefined) {
          setTotalReviewsCount(res.data.totalReviews)
        }
      }
    } catch (err) {
      console.error('Lỗi khi tải thêm đánh giá:', err)
    } finally {
      setLoadingMoreReviews(false)
    }
  }

  const handleShare = () => {
    setIsShareOpen(true)
  }

  const handleToggleSave = async () => {
    if (!id || !isAuthenticated) {
      alert('Vui lòng đăng nhập để lưu địa điểm yêu thích.')
      return
    }
    const targetId = Number(id)
    try {
      if (isSaved) {
        await userService.removeFavorite(1, targetId)
        setIsSaved(false)
      } else {
        await userService.addFavorite(1, targetId)
        setIsSaved(true)
      }
    } catch {
      setIsSaved(!isSaved)
    }
  }

  const handleReviewAdded = (newReview: ReviewItemDto) => {
    setReviewsList((prev) => [newReview, ...prev])
    setTotalReviewsCount((prev) => prev + 1)
    setRatingBreakdown((prev) => {
      const starKey = newReview.rating.toString()
      return {
        ...prev,
        [starKey]: (prev[starKey] || 0) + 1
      }
    })
  }

  const handleReviewUpdated = (updatedReview: ReviewItemDto) => {
    setReviewsList((prev) =>
      prev.map((r) => (String(r.id) === String(updatedReview.id) ? { ...r, ...updatedReview } : r))
    )
  }

  const handleReviewDeleted = (deletedReviewId: number) => {
    const target = reviewsList.find((r) => r.id === deletedReviewId)
    setReviewsList((prev) => prev.filter((r) => r.id !== deletedReviewId))
    setTotalReviewsCount((prev) => Math.max(0, prev - 1))
    if (target) {
      setRatingBreakdown((prev) => {
        const starKey = target.rating.toString()
        return {
          ...prev,
          [starKey]: Math.max(0, (prev[starKey] || 0) - 1)
        }
      })
    }
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

  const totalReviews = totalReviewsCount || place.reviewCount || reviewsList.length || 0

  return (
    <div className="min-h-screen bg-gray-50/50 pb-20">
      {shareToastMsg && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2 px-4 py-3 bg-gray-900 text-white text-sm font-medium rounded-xl shadow-xl animate-in slide-in-from-bottom-5">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>{shareToastMsg}</span>
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
              totalReviews={totalReviews}
              ratingBreakdown={ratingBreakdown}
              avgRating={place.avgRating}
              isAuthenticated={isAuthenticated}
              hasMore={reviewsList.length < totalReviews}
              isLoadingMore={loadingMoreReviews}
              onLoadMore={handleLoadMoreReviews}
              onReviewAdded={handleReviewAdded}
              onReviewUpdated={handleReviewUpdated}
              onReviewDeleted={handleReviewDeleted}
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

      <SharePlaceModal
        isOpen={isShareOpen}
        onClose={() => setIsShareOpen(false)}
        place={place}
        onToast={(msg) => {
          setShareToastMsg(msg)
          setTimeout(() => setShareToastMsg(null), 3000)
        }}
      />
    </div>
  )
}
