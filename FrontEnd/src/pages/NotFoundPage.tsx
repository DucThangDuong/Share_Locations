import React from 'react'
import { Link } from 'react-router-dom'
import { Compass, Home } from 'lucide-react'

export const NotFoundPage: React.FC = () => {
  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center text-center px-4 py-16">
      <div className="w-16 h-16 rounded-3xl bg-secondary-container/10 text-secondary-container flex items-center justify-center mb-4">
        <Compass className="w-8 h-8" />
      </div>
      <h1 className="text-4xl font-extrabold text-slate-900 mb-2">404</h1>
      <p className="text-slate-600 text-sm mb-6">Trang bạn tìm kiếm không tồn tại.</p>
      <Link
        to="/"
        className="px-5 py-2.5 bg-primary-container hover:bg-primary-hover text-white rounded-xl text-xs font-semibold shadow-xs flex items-center gap-2 transition-all"
      >
        <Home className="w-4 h-4" /> Về trang chủ
      </Link>
    </div>
  )
}
