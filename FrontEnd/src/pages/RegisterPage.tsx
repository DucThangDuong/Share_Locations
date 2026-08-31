import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '@/context/AuthContext'
import { AxiosError } from 'axios'
import type { ApiErrorResponse } from '@/types/auth'
import { Loader2 } from 'lucide-react'

export const RegisterPage: React.FC = () => {
  const { register } = useAuth()
  const navigate = useNavigate()

  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [agreeTerms, setAgreeTerms] = useState(true)
  const [loading, setLoading] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')
  const [successMessage, setSuccessMessage] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrorMessage('')
    setSuccessMessage('')

    if (password !== confirmPassword) {
      setErrorMessage('Mật khẩu xác nhận không khớp.')
      return
    }

    if (!agreeTerms) {
      setErrorMessage('Vui lòng đồng ý với Điều khoản sử dụng.')
      return
    }

    setLoading(true)

    try {
      await register({ fullName, email, password })
      setSuccessMessage('Đăng ký tài khoản thành công! Đang chuyển đến trang đăng nhập...')
      setTimeout(() => {
        navigate('/login')
      }, 1500)
    } catch (err) {
      const axiosError = err as AxiosError<ApiErrorResponse>
      if (axiosError.response?.data?.message) {
        setErrorMessage(axiosError.response.data.message)
      } else if (axiosError.message) {
        setErrorMessage(axiosError.message)
      } else {
        setErrorMessage('Đăng ký thất bại. Vui lòng kiểm tra lại thông tin.')
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div
      className="min-h-screen flex justify-center items-center bg-cover bg-center bg-fixed p-5"
      style={{
        backgroundImage: `linear-gradient(rgba(10, 20, 10, 0.35), rgba(10, 20, 10, 0.55)), url('https://images.unsplash.com/photo-1528127269322-539801943592?q=80&w=1920&auto=format&fit=crop')`
      }}
    >
      <div className="w-full max-w-[460px] bg-white/80 backdrop-blur-md border border-white/60 p-7 sm:p-9 rounded-3xl shadow-2xl animate-in fade-in zoom-in-95 duration-200">
        <div className="text-center mb-5">
          <Link
            to="/"
            className="inline-block font-serif text-3xl font-bold italic text-secondary-container mb-1 tracking-tight"
          >
            LangThang<span className="text-primary-container">.</span>
          </Link>
          <h1 className="font-serif text-2xl text-slate-900 font-bold mb-1">
            Tạo tài khoản mới
          </h1>
          <p className="text-slate-500 text-xs sm:text-sm">
            Tham gia cộng đồng yêu xê dịch Lang Thang.
          </p>
        </div>

        {errorMessage && (
          <div className="mb-4 p-3 rounded-xl bg-red-50/90 border border-red-200 text-red-700 text-xs font-medium leading-relaxed">
            {errorMessage}
          </div>
        )}

        {successMessage && (
          <div className="mb-4 p-3 rounded-xl bg-emerald-50/90 border border-emerald-200 text-emerald-700 text-xs font-medium leading-relaxed">
            {successMessage}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="block text-xs font-bold text-slate-800 mb-1" htmlFor="fullname">
              Họ và tên
            </label>
            <input
              id="fullname"
              type="text"
              required
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="Nhập họ và tên đầy đủ"
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 bg-white/90 text-slate-900 text-xs sm:text-sm focus:outline-hidden focus:ring-2 focus:ring-primary-container/20 focus:border-primary-container focus:bg-white transition-all"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-800 mb-1" htmlFor="reg-email">
              Email
            </label>
            <input
              id="reg-email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Nhập địa chỉ email"
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 bg-white/90 text-slate-900 text-xs sm:text-sm focus:outline-hidden focus:ring-2 focus:ring-primary-container/20 focus:border-primary-container focus:bg-white transition-all"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-800 mb-1" htmlFor="reg-password">
              Mật khẩu
            </label>
            <input
              id="reg-password"
              type="password"
              required
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Nhập mật khẩu (tối thiểu 6 ký tự)"
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 bg-white/90 text-slate-900 text-xs sm:text-sm focus:outline-hidden focus:ring-2 focus:ring-primary-container/20 focus:border-primary-container focus:bg-white transition-all"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-800 mb-1" htmlFor="confirm-password">
              Nhập lại mật khẩu
            </label>
            <input
              id="confirm-password"
              type="password"
              required
              minLength={6}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Nhập lại mật khẩu"
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 bg-white/90 text-slate-900 text-xs sm:text-sm focus:outline-hidden focus:ring-2 focus:ring-primary-container/20 focus:border-primary-container focus:bg-white transition-all"
            />
          </div>

          <div className="flex items-center text-xs pt-1">
            <label className="flex items-center gap-1.5 text-slate-600 font-medium cursor-pointer">
              <input
                type="checkbox"
                checked={agreeTerms}
                onChange={(e) => setAgreeTerms(e.target.checked)}
                className="w-3.5 h-3.5 accent-primary-container rounded cursor-pointer"
              />
              Đồng ý với{' '}
              <a href="#terms" className="font-bold text-primary-container hover:text-secondary-container underline">
                Điều khoản dịch vụ
              </a>
            </label>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-primary-container hover:bg-primary-hover disabled:opacity-70 text-white rounded-xl text-sm font-semibold shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer mt-3"
          >
            {loading && <Loader2 className="w-4 h-4 animate-spin" />}
            <span>Đăng ký tài khoản</span>
          </button>
        </form>

        <p className="text-center text-xs text-slate-500 mt-5 pt-4 border-t border-slate-200/80">
          Đã có tài khoản?{' '}
          <Link to="/login" className="font-bold text-primary-container hover:text-secondary-container transition-colors">
            Đăng nhập
          </Link>
        </p>
      </div>
    </div>
  )
}
