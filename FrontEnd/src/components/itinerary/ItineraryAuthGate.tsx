import { Link } from 'react-router-dom'
import { Lock, LogIn, UserPlus, ShieldCheck, Sparkles } from 'lucide-react'

export const ItineraryAuthGate = () => {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 -mt-6 relative z-10">
      <div className="bg-white p-8 sm:p-12 rounded-lg border border-gray-200 shadow-xl text-center space-y-6">
        <div className="w-16 h-16 bg-emerald-100 text-emerald-700 rounded-lg flex items-center justify-center mx-auto shadow-xs border border-emerald-200">
          <Lock className="w-8 h-8" />
        </div>

        <div className="space-y-2 max-w-lg mx-auto">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-50 text-amber-800 text-xs font-bold rounded-lg border border-amber-200">
            <ShieldCheck className="w-4 h-4 text-amber-600" />
            <span>Nội dung dành riêng cho thành viên</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-gray-900">
            Đăng nhập để mở khóa toàn bộ lịch trình
          </h2>
          <p className="text-sm text-gray-600 leading-relaxed">
            Để xem chi tiết lộ trình từng ngày (Sáng, Trưa, Chiều, Tối), ước tính chi phí, vị trí tọa độ bản đồ và lưu lịch trình vào bộ sưu tập cá nhân, vui lòng đăng nhập vào tài khoản của bạn.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
          <Link
            to="/login"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm rounded-lg shadow-sm transition-colors"
          >
            <LogIn className="w-4 h-4" />
            <span>Đăng nhập ngay</span>
          </Link>
          <Link
            to="/register"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 bg-gray-100 hover:bg-gray-200 text-gray-800 font-bold text-sm rounded-lg transition-colors border border-gray-200"
          >
            <UserPlus className="w-4 h-4" />
            <span>Tạo tài khoản mới</span>
          </Link>
        </div>

        <div className="pt-6 border-t border-gray-100 grid grid-cols-1 sm:grid-cols-3 gap-4 text-left">
          <div className="p-3 bg-gray-50 rounded-lg border border-gray-100">
            <div className="text-xs font-bold text-gray-900 flex items-center gap-1 mb-1">
              <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
              <span>Tiết kiệm thời gian</span>
            </div>
            <div className="text-2xs text-gray-500">Lộ trình được sắp xếp khoa học, tránh đi lại ngược đường.</div>
          </div>
          <div className="p-3 bg-gray-50 rounded-lg border border-gray-100">
            <div className="text-xs font-bold text-gray-900 flex items-center gap-1 mb-1">
              <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
              <span>Dự toán chi phí</span>
            </div>
            <div className="text-2xs text-gray-500">Bảng giá tham khảo chi tiết vé tham quan, ăn uống và khách sạn.</div>
          </div>
          <div className="p-3 bg-gray-50 rounded-lg border border-gray-100">
            <div className="text-xs font-bold text-gray-900 flex items-center gap-1 mb-1">
              <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
              <span>Tùy biến linh hoạt</span>
            </div>
            <div className="text-2xs text-gray-500">Dễ dàng lưu lại và điều chỉnh theo sở thích riêng của bạn.</div>
          </div>
        </div>
      </div>
    </div>
  )
}
