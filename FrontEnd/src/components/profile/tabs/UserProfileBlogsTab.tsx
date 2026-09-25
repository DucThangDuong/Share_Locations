import React, { useEffect, useState } from 'react'
import { BookOpen, Loader2 } from 'lucide-react'
import { userService } from '@/services/userService'
import { UserProfileBlogCard } from '../UserProfileBlogCard'
import type { UserBlogItem } from '@/types/models/userProfile.model'

interface UserProfileBlogsTabProps {
  userId: number | string
}

export const UserProfileBlogsTab: React.FC<UserProfileBlogsTabProps> = ({ userId }) => {
  const [blogs, setBlogs] = useState<UserBlogItem[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let isMounted = true
    const fetchBlogs = async () => {
      setLoading(true)
      try {
        const res = await userService.getUserPublicBlogs(userId, { pageSize: 15 })
        if (isMounted && res?.data) {
          const list = Array.isArray(res.data) ? res.data : (res.data as any).items || []
          setBlogs(list)
        }
      } catch (err) {
        console.error('Failed to load blogs:', err)
      } finally {
        if (isMounted) setLoading(false)
      }
    }

    fetchBlogs()
    return () => {
      isMounted = false
    }
  }, [userId])

  if (loading) {
    return (
      <div className="bg-white rounded-3xl p-12 flex flex-col items-center justify-center border border-slate-200/90 shadow-2xs">
        <Loader2 className="w-8 h-8 text-emerald-600 animate-spin mb-2" />
        <span className="text-xs text-slate-500 font-medium">Đang tải bài viết...</span>
      </div>
    )
  }

  if (blogs.length === 0) {
    return (
      <div className="bg-white rounded-2xl p-8 text-center border border-slate-200">
        <BookOpen className="w-10 h-10 text-slate-300 mx-auto mb-2" />
        <div className="text-sm font-bold text-slate-800">Chưa có bài viết nào</div>
        <p className="text-xs text-slate-500 mt-1">Người dùng chưa đăng bài viết chia sẻ nào.</p>
      </div>
    )
  }

  return (
    <div className="space-y-5">
      {blogs.map((blog) => (
        <UserProfileBlogCard key={`blog-${blog.id}`} blog={blog} />
      ))}
    </div>
  )
}
