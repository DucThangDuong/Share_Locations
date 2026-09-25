import React, { useEffect, useState, useCallback } from 'react'
import { Star, Loader2, ChevronDown } from 'lucide-react'
import { userService } from '@/services/userService'
import { UserProfileReviewCard } from '../UserProfileReviewCard'
import type { UserReviewItem } from '@/types/models/userProfile.model'

interface UserProfileReviewsTabProps {
  userId: number | string
  authorName: string
  authorAvatar?: string | null
  onImageClick?: (imageUrl: string) => void
  showToast?: (message: string) => void
}

const PAGE_SIZE = 5

export const UserProfileReviewsTab: React.FC<UserProfileReviewsTabProps> = ({
  userId,
  authorName,
  authorAvatar,
  onImageClick,
  showToast
}) => {
  const [reviews, setReviews] = useState<UserReviewItem[]>([])
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(false)

  const parseReviewData = useCallback((data: any) => {
    if (!data) return { items: [] as UserReviewItem[], hasMoreItems: false }

    if (Array.isArray(data)) {
      return {
        items: data as UserReviewItem[],
        hasMoreItems: data.length >= PAGE_SIZE
      }
    }

    const items: UserReviewItem[] = Array.isArray(data.items) ? data.items : []
    const totalCount = typeof data.totalCount === 'number' ? data.totalCount : undefined
    const totalPages = typeof data.totalPages === 'number' ? data.totalPages : undefined
    const currentPage = typeof data.page === 'number' ? data.page : 1

    let hasMoreItems = false
    if (totalPages !== undefined) {
      hasMoreItems = currentPage < totalPages
    } else if (totalCount !== undefined) {
      hasMoreItems = currentPage * PAGE_SIZE < totalCount
    } else {
      hasMoreItems = items.length >= PAGE_SIZE
    }

    return { items, hasMoreItems }
  }, [])

  useEffect(() => {
    let isMounted = true
    const fetchInitialReviews = async () => {
      setLoading(true)
      setPage(1)
      try {
        const res = await userService.getUserPublicReviews(userId, {
          page: 1,
          pageSize: PAGE_SIZE
        })
        if (isMounted && res?.data) {
          const { items, hasMoreItems } = parseReviewData(res.data)
          setReviews(items)
          setHasMore(hasMoreItems)
        }
      } catch (err) {
        console.error('Failed to load reviews:', err)
      } finally {
        if (isMounted) setLoading(false)
      }
    }

    fetchInitialReviews()
    return () => {
      isMounted = false
    }
  }, [userId, parseReviewData])

  const handleLoadMore = async () => {
    if (loadingMore || !hasMore) return
    setLoadingMore(true)
    const nextPage = page + 1
    try {
      const res = await userService.getUserPublicReviews(userId, {
        page: nextPage,
        pageSize: PAGE_SIZE
      })
      if (res?.data) {
        const { items, hasMoreItems } = parseReviewData(res.data)
        if (items.length > 0) {
          setReviews((prev) => [...prev, ...items])
          setPage(nextPage)
          setHasMore(hasMoreItems)
        } else {
          setHasMore(false)
        }
      } else {
        setHasMore(false)
      }
    } catch (err) {
      console.error('Failed to load more reviews:', err)
      showToast?.('Không thể tải thêm đánh giá lúc này.')
    } finally {
      setLoadingMore(false)
    }
  }

  if (loading) {
    return (
      <div className="bg-white rounded-3xl p-12 flex flex-col items-center justify-center border border-slate-200/90 shadow-2xs">
        <Loader2 className="w-8 h-8 text-emerald-600 animate-spin mb-2" />
        <span className="text-xs text-slate-500 font-medium">Đang tải danh sách đánh giá...</span>
      </div>
    )
  }

  if (reviews.length === 0) {
    return (
      <div className="bg-white rounded-2xl p-8 text-center border border-slate-200">
        <Star className="w-10 h-10 text-slate-300 mx-auto mb-2" />
        <div className="text-sm font-bold text-slate-800">Chưa có đánh giá nào</div>
        <p className="text-xs text-slate-500 mt-1">Người dùng chưa viết đánh giá địa điểm nào.</p>
      </div>
    )
  }

  return (
    <div className="space-y-5">
      {reviews.map((rev, idx) => (
        <UserProfileReviewCard
          key={`rev-${rev.id}-${idx}`}
          review={{
            ...rev,
            authorName,
            authorAvatar
          }}
          onImageClick={onImageClick}
          showToast={showToast}
        />
      ))}

      {hasMore && (
        <div className="pt-3 pb-2 flex justify-center">
          <button
            type="button"
            onClick={handleLoadMore}
            disabled={loadingMore}
            className="inline-flex items-center gap-2 px-6 py-2.5 rounded-full border border-slate-200 bg-white hover:bg-slate-50 active:bg-slate-100 text-slate-700 hover:text-emerald-700 font-semibold text-sm shadow-2xs hover:shadow-xs transition-all cursor-pointer disabled:opacity-70 disabled:cursor-not-allowed group"
          >
            {loadingMore ? (
              <>
                <Loader2 className="w-4 h-4 text-emerald-600 animate-spin" />
                <span>Đang tải thêm...</span>
              </>
            ) : (
              <>
                <span>Xem tiếp</span>
                <ChevronDown
                  size={16}
                  className="text-slate-400 group-hover:text-emerald-600 group-hover:translate-y-0.5 transition-all"
                />
              </>
            )}
          </button>
        </div>
      )}
    </div>
  )
}

