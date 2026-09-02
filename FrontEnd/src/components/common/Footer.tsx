import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import { Mail, Send, CheckCircle2 } from 'lucide-react'

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
    <footer className="bg-primary text-slate-300 pt-16 pb-10 relative overflow-hidden mt-auto">
      <div className="absolute top-0 right-0 -mt-20 -mr-20 w-80 h-80 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute bottom-0 left-0 -mb-20 -ml-20 w-80 h-80 bg-amber-500/10 rounded-full blur-3xl pointer-events-none"></div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-10 pb-6">
          <div className="col-span-1 md:col-span-4 lg:col-span-5 space-y-4">
            <Link to="/" className="flex items-center gap-2 group">
              <span className="text-2xl font-extrabold text-white tracking-tight">
                LangThang<span className="text-secondary-container">.</span>
              </span>
            </Link>
            <p className="text-xs text-slate-300/80 max-w-sm leading-relaxed font-normal">
              Khám phá Việt Nam theo cách của bạn. Tìm điểm đến, lưu địa chỉ ẩm thực bản địa, tham khảo lịch trình thực tế và lưu giữ từng khoảnh khắc đáng nhớ.
            </p>
            <div className="flex items-center gap-3 pt-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-400">
                #LangThangVietnam
              </span>
            </div>
          </div>

          <div className="col-span-1 md:col-span-2 lg:col-span-2 space-y-3">
            <h3 className="text-white font-bold text-sm tracking-wide">Khám phá</h3>
            <ul className="space-y-2.5 text-xs text-slate-300/80">
              <li><Link className="hover:text-amber-400 transition-colors" to="/">Trang chủ</Link></li>
              <li><a className="hover:text-amber-400 transition-colors" href="/#diadiem">Địa điểm 3 miền</a></li>
              <li><a className="hover:text-amber-400 transition-colors" href="/#amthuc">Ẩm thực đặc sản</a></li>
              <li><a className="hover:text-amber-400 transition-colors" href="/#hanhtrinh">Hành trình du lịch</a></li>
            </ul>
          </div>

          <div className="col-span-1 md:col-span-2 lg:col-span-2 space-y-3">
            <h3 className="text-white font-bold text-sm tracking-wide">Cộng đồng</h3>
            <ul className="space-y-2.5 text-xs text-slate-300/80">
              <li><a className="hover:text-amber-400 transition-colors" href="/#blog">Bài viết chia sẻ</a></li>
              <li><a className="hover:text-amber-400 transition-colors" href="#guidelines">Quy chuẩn đánh giá</a></li>
              <li><a className="hover:text-amber-400 transition-colors" href="#terms">Điều khoản sử dụng</a></li>
              <li><a className="hover:text-amber-400 transition-colors" href="#privacy">Chính sách bảo mật</a></li>
            </ul>
          </div>

          <div className="col-span-1 md:col-span-4 lg:col-span-3 space-y-3">
            <h3 className="text-white font-bold text-sm tracking-wide">Bản tin LangThang</h3>
            <p className="text-xs text-slate-300/80 leading-relaxed font-normal">
              Nhận gợi ý điểm đến hoang sơ và quán ngon địa phương mỗi tuần.
            </p>
            {subscribed ? (
              <div className="text-xs bg-emerald-900/60 border border-emerald-500/40 text-emerald-200 px-3.5 py-2.5 rounded-2xl flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>Cảm ơn bạn đã đăng ký nhận tin!</span>
              </div>
            ) : (
              <form className="relative flex items-center" onSubmit={handleSubscribe}>
                <div className="relative w-full">
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Nhập email của bạn..."
                    className="w-full h-10 bg-emerald-950/60 border border-emerald-800/80 rounded-full pl-9 pr-24 text-xs text-white placeholder:text-slate-400 focus:outline-hidden focus:border-secondary-container focus:ring-2 focus:ring-secondary-container/20 transition-all"
                  />
                  <Mail className="w-3.5 h-3.5 text-slate-400 absolute left-3.5 top-3.5" />
                  <button
                    type="submit"
                    className="absolute right-1 top-1 bottom-1 px-3.5 bg-secondary-container hover:bg-secondary-hover text-white rounded-full text-xs font-semibold flex items-center gap-1 active-press transition-all cursor-pointer"
                  >
                    <span>Gửi</span>
                    <Send className="w-3 h-3" />
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      </div>
    </footer>
  )
}
