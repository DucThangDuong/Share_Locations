import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '@/context/AuthContext'
import { AxiosError } from 'axios'
import type { ApiErrorResponse } from '@/types/auth'
import { Loader2, User, Mail, Lock, Eye, EyeOff, ArrowRight, CheckCircle2 } from 'lucide-react'

const PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^a-zA-Z\d]).{8,}$/

export const RegisterPage: React.FC = () => {
  const { register } = useAuth()
  const navigate = useNavigate()

  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [agreeTerms, setAgreeTerms] = useState(true)
  const [loading, setLoading] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')
  const [successMessage, setSuccessMessage] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrorMessage('')
    setSuccessMessage('')

    if (fullName.trim().length < 2 || fullName.trim().length > 50) {
      setErrorMessage('Họ và tên phải từ 2 đến 50 ký tự.')
      return
    }

    if (password.length < 8) {
      setErrorMessage('Mật khẩu phải từ 8 ký tự trở lên.')
      return
    }

    if (!PASSWORD_REGEX.test(password)) {
      setErrorMessage('Mật khẩu phải chứa ít nhất 1 chữ hoa, 1 chữ thường, 1 số và 1 ký tự đặc biệt.')
      return
    }

    if (password !== confirmPassword) {
      setErrorMessage('Mật khẩu xác nhận không khớp.')
      return
    }

    if (!agreeTerms) {
      setErrorMessage('Vui lòng đồng ý với Điều khoản dịch vụ.')
      return
    }

    setLoading(true)

    try {
      await register({ fullName: fullName.trim(), email: email.trim(), password })
      setSuccessMessage('Đăng ký tài khoản thành công! Đang chuyển đến trang đăng nhập...')
      setTimeout(() => {
        navigate('/login')
      }, 1500)
    } catch (err) {
      const axiosError = err as AxiosError<ApiErrorResponse>
      const errorData = axiosError.response?.data
      if (errorData?.errors && errorData.errors.length > 0) {
        setErrorMessage(errorData.errors.map((e) => e.message).join(' • '))
      } else if (errorData?.message) {
        setErrorMessage(errorData.message)
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
      className="min-h-screen flex justify-center items-center bg-cover bg-center bg-fixed p-4 sm:p-6 relative overflow-hidden"
      style={{
        backgroundImage: `linear-gradient(rgba(6, 40, 30, 0.45), rgba(6, 40, 30, 0.7)), url('https://images.unsplash.com/photo-1528127269322-539801943592?q=80&w=1920&auto=format&fit=crop')`
      }}
    >
      <div className="w-full max-w-[480px] glass-card p-8 sm:p-10 rounded-3xl animate-in fade-in zoom-in-95 duration-200 relative z-10 border border-white/70">
        <div className="text-center mb-6 space-y-2">
          <Link
            to="/"
            className="inline-flex items-center gap-2 group mb-1"
          >
            <span className="text-3xl font-extrabold tracking-tight text-slate-900">
              LangThang<span className="text-secondary-container">.</span>
            </span>
          </Link>

          <h1 className="text-2xl sm:text-3xl text-slate-900 font-extrabold tracking-tight">
            Tạo tài khoản mới
          </h1>
          <p className="text-slate-600 text-xs sm:text-sm font-normal">
            Gia nhập cộng đồng yêu du lịch & trải nghiệm bản địa.
          </p>
        </div>

        {errorMessage && (
          <div className="mb-4 p-3.5 rounded-2xl bg-red-50/95 border border-red-200 text-red-700 text-xs font-medium leading-relaxed animate-in fade-in">
            {errorMessage}
          </div>
        )}

        {successMessage && (
          <div className="mb-4 p-3.5 rounded-2xl bg-emerald-50/95 border border-emerald-200 text-emerald-800 text-xs font-medium leading-relaxed flex items-center gap-2 animate-in fade-in">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{successMessage}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-3.5">
          <div>
            <label className="block text-xs font-bold text-slate-800 mb-1" htmlFor="fullname">
              Họ và tên <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <input
                id="fullname"
                type="text"
                required
                maxLength={50}
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Nguyễn Văn A"
                className="w-full h-11 pl-10 pr-4 rounded-xl border border-slate-200 bg-white/95 text-slate-900 text-xs sm:text-sm placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-primary-container/20 focus:border-primary-container focus:bg-white transition-all"
              />
              <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-800 mb-1" htmlFor="reg-email">
              Địa chỉ Email <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <input
                id="reg-email"
                type="email"
                required
                maxLength={100}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@example.com"
                className="w-full h-11 pl-10 pr-4 rounded-xl border border-slate-200 bg-white/95 text-slate-900 text-xs sm:text-sm placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-primary-container/20 focus:border-primary-container focus:bg-white transition-all"
              />
              <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-800 mb-1" htmlFor="reg-password">
                Mật khẩu <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <input
                  id="reg-password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  minLength={8}
                  maxLength={100}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="≥ 8 ký tự (hoa, thường, số, ký tự đb)"
                  className="w-full h-11 pl-9 pr-9 rounded-xl border border-slate-200 bg-white/95 text-slate-900 text-xs focus:outline-hidden focus:ring-2 focus:ring-primary-container/20 focus:border-primary-container focus:bg-white transition-all"
                />
                <Lock className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-3.5" />
                <button
                  type="button"
                  tabIndex={-1}
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-2.5 top-3.5 text-slate-400 hover:text-slate-700 cursor-pointer p-0.5"
                >
                  {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-800 mb-1" htmlFor="confirm-password">
                Nhập lại mật khẩu <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <input
                  id="confirm-password"
                  type={showConfirmPassword ? 'text' : 'password'}
                  required
                  minLength={8}
                  maxLength={100}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Khớp mật khẩu"
                  className="w-full h-11 pl-9 pr-9 rounded-xl border border-slate-200 bg-white/95 text-slate-900 text-xs focus:outline-hidden focus:ring-2 focus:ring-primary-container/20 focus:border-primary-container focus:bg-white transition-all"
                />
                <Lock className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-3.5" />
                <button
                  type="button"
                  tabIndex={-1}
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-2.5 top-3.5 text-slate-400 hover:text-slate-700 cursor-pointer p-0.5"
                >
                  {showConfirmPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>
          </div>

          <div className="flex items-center text-xs pt-1">
            <label className="flex items-center gap-2 text-slate-600 font-medium cursor-pointer">
              <input
                type="checkbox"
                checked={agreeTerms}
                onChange={(e) => setAgreeTerms(e.target.checked)}
                className="w-4 h-4 accent-primary-container rounded cursor-pointer"
              />
              Tôi đồng ý với{' '}
              <a href="#terms" className="font-bold text-primary-container hover:text-secondary-container underline">
                Điều khoản dịch vụ
              </a>
            </label>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full h-12 bg-gradient-to-r from-primary-container to-emerald-700 hover:from-primary-hover hover:to-emerald-800 disabled:opacity-70 text-white rounded-xl text-sm font-bold active-press transition-all flex items-center justify-center gap-2 cursor-pointer mt-3"
          >
            {loading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <>
                <span>Đăng ký tài khoản</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        <p className="text-center text-xs text-slate-500 pt-4 border-t border-slate-200/70 mt-5">
          Đã có tài khoản?{' '}
          <Link to="/login" className="font-bold text-primary-container hover:text-secondary-container transition-colors">
            Đăng nhập ngay
          </Link>
        </p>
      </div>
    </div>
  )
}
