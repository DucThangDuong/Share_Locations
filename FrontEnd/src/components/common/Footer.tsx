import React, { useState } from 'react'
import { Link } from 'react-router-dom'

export const Footer: React.FC = () => {
  const [email, setEmail] = useState('')
  const [subscribed, setSubscribed] = useState(false)

  const handleSubscribe = (e: React.FormEvent) => {
    e.preventDefault()
    if (email.trim()) {
      setSubscribed(true)
      setEmail('')
      setTimeout(() => setSubscribed(false), 4000)
    }
  }

  return (
    <footer className="bg-[#1a3a2a] text-gray-300 pt-12 pb-8 border-t-2 border-secondary-container mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 mb-8 border-b border-[#2d5241] pb-8">
          <div className="col-span-1 md:col-span-4 lg:col-span-5">
            <Link to="/" className="font-serif text-2xl italic text-white font-bold tracking-tight inline-block mb-3">
              LangThang<span className="text-secondary-container">.</span>
            </Link>
            <p className="text-xs text-gray-300 max-w-sm leading-relaxed">
              Khám phá Việt Nam theo cách của bạn. Tìm điểm đến, lưu địa chỉ ăn ngon, đọc blog bản địa và biến mỗi chuyến đi thành một câu chuyện đáng nhớ.
            </p>
          </div>

          <div className="col-span-1 md:col-span-2 lg:col-span-2">
            <h3 className="text-white font-bold mb-3 uppercase tracking-wider text-xs">Khám phá</h3>
            <ul className="space-y-2 text-xs text-gray-300">
              <li><Link className="hover:text-secondary-container transition-colors" to="/">Trang chủ</Link></li>
              <li><a className="hover:text-secondary-container transition-colors" href="/#diadiem">Địa điểm 3 miền</a></li>
              <li><a className="hover:text-secondary-container transition-colors" href="/#amthuc">Ẩm thực đặc sản</a></li>
              <li><a className="hover:text-secondary-container transition-colors" href="/#hanhtrinh">Hành trình du lịch</a></li>
            </ul>
          </div>

          <div className="col-span-1 md:col-span-2 lg:col-span-2">
            <h3 className="text-white font-bold mb-3 uppercase tracking-wider text-xs">Hỗ trợ</h3>
            <ul className="space-y-2 text-xs text-gray-300">
              <li><a className="hover:text-secondary-container transition-colors" href="#about">Về chúng tôi</a></li>
              <li><a className="hover:text-secondary-container transition-colors" href="#contact">Liên hệ</a></li>
              <li><a className="hover:text-secondary-container transition-colors" href="#terms">Điều khoản</a></li>
              <li><a className="hover:text-secondary-container transition-colors" href="#privacy">Bảo mật</a></li>
            </ul>
          </div>

          <div className="col-span-1 md:col-span-4 lg:col-span-3">
            <h3 className="text-white font-bold mb-3 uppercase tracking-wider text-xs">Nhận tin mới</h3>
            <p className="text-xs text-gray-300 mb-3">Nhận gợi ý điểm đến và món ngon mỗi tuần.</p>
            {subscribed ? (
              <div className="text-xs bg-emerald-800/80 text-emerald-200 px-3 py-2 rounded-lg">
                Cảm ơn bạn đã đăng ký nhận tin!
              </div>
            ) : (
              <form className="flex" onSubmit={handleSubscribe}>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Email của bạn..."
                  className="w-full bg-[#2d5241] border border-transparent rounded-l-full px-3 py-1.5 text-xs text-white focus:outline-hidden focus:ring-1 focus:ring-secondary-container placeholder-gray-400"
                />
                <button
                  type="submit"
                  className="bg-secondary-container hover:bg-secondary-hover text-white px-4 py-1.5 rounded-r-full text-xs font-semibold transition-colors shrink-0"
                >
                  Đăng ký
                </button>
              </form>
            )}
          </div>
        </div>

        <div className="flex flex-col sm:flex-row justify-between items-center text-xs text-gray-400 gap-3">
          <p>© {new Date().getFullYear()} LangThang. All rights reserved.</p>
          <p>Thiết kế cho cộng đồng yêu du lịch & ẩm thực Việt Nam.</p>
        </div>
      </div>
    </footer>
  )
}
