import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '@/context/AuthContext'
import { GoogleLogin, type CredentialResponse } from '@react-oauth/google'
import { AxiosError } from 'axios'
import type { ApiErrorResponse } from '@/types/auth'
import { Loader2, Mail, Lock, Eye, EyeOff, ArrowRight } from 'lucide-react'

export const LoginPage: React.FC = () => {
  const { login, googleLogin } = useAuth()
  const navigate = useNavigate()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [rememberMe, setRememberMe] = useState(true)
  const [loading, setLoading] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrorMessage('')
    setLoading(true)

    try {
      await login({ email, password })
      navigate('/')
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
        setErrorMessage('Đăng nhập thất bại. Vui lòng kiểm tra lại email và mật khẩu.')
      }
    } finally {
      setLoading(false)
    }
  }

  const handleGoogleSuccess = async (credentialResponse: CredentialResponse) => {
    if (credentialResponse.credential) {
      setErrorMessage('')
      setLoading(true)
      try {
        await googleLogin({ idToken: credentialResponse.credential })
        navigate('/')
      } catch (err) {
        const axiosError = err as AxiosError<ApiErrorResponse>
        setErrorMessage(
          axiosError.response?.data?.message ||
          axiosError.message ||
          'Đăng nhập với Google thất bại. Vui lòng thử lại.'
        )
      } finally {
        setLoading(false)
      }
    } else {
      setErrorMessage('Không nhận được thông tin xác thực từ Google.')
    }
  }

  const handleGoogleError = () => {
    setErrorMessage('Đăng nhập với Google không thành công. Vui lòng kiểm tra kết nối mạng hoặc thử lại.')
  }

  return (
    <div
      className="min-h-screen flex justify-center items-center bg-cover bg-center bg-fixed p-4 sm:p-6 relative overflow-hidden"
      style={{
        backgroundImage: `linear-gradient(rgba(6, 40, 30, 0.45), rgba(6, 40, 30, 0.7)), url('https://images.unsplash.com/photo-1528127269322-539801943592?q=80&w=1920&auto=format&fit=crop')`
      }}
    >
      <div className="w-full max-w-[440px] glass-card p-8 sm:p-10 rounded-3xl shadow-2xl animate-in fade-in zoom-in-95 duration-200 relative z-10 border border-white/70">
        <div className="text-center mb-7 space-y-2">
          <Link
            to="/"
            className="inline-flex items-center gap-2 group mb-1"
          >
            <span className="text-3xl font-extrabold tracking-tight text-slate-900">
              LangThang<span className="text-secondary-container">.</span>
            </span>
          </Link>

          <h1 className="text-2xl sm:text-3xl text-slate-900 font-extrabold tracking-tight">
            Chào mừng trở lại!
          </h1>
          <p className="text-slate-600 text-xs sm:text-sm font-normal">
            Đăng nhập để tiếp tục khám phá và chia sẻ trải nghiệm du lịch.
          </p>
        </div>

        {errorMessage && (
          <div className="mb-5 p-3.5 rounded-2xl bg-red-50/95 border border-red-200 text-red-700 text-xs font-medium leading-relaxed animate-in fade-in">
            {errorMessage}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-800 mb-1.5" htmlFor="email">
              Địa chỉ Email
            </label>
            <div className="relative">
              <input
                id="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@example.com"
                className="w-full h-11 pl-10 pr-4 rounded-xl border border-slate-200 bg-white/95 text-slate-900 text-xs sm:text-sm placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-primary-container/20 focus:border-primary-container focus:bg-white transition-all shadow-2xs"
              />
              <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-800 mb-1.5" htmlFor="password">
              Mật khẩu
            </label>
            <div className="relative">
              <input
                id="password"
                type={showPassword ? 'text' : 'password'}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Nhập mật khẩu của bạn"
                className="w-full h-11 pl-10 pr-11 rounded-xl border border-slate-200 bg-white/95 text-slate-900 text-xs sm:text-sm placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-primary-container/20 focus:border-primary-container focus:bg-white transition-all shadow-2xs"
              />
              <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
              <button
                type="button"
                tabIndex={-1}
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-3 text-slate-400 hover:text-slate-700 cursor-pointer p-0.5"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <div className="flex justify-between items-center text-xs pt-1">
            <label className="flex items-center gap-2 text-slate-600 font-medium cursor-pointer">
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="w-4 h-4 accent-primary-container rounded cursor-pointer"
              />
              Ghi nhớ đăng nhập
            </label>
            <a
              href="#forgot"
              onClick={(e) => {
                e.preventDefault()
                alert('Vui lòng liên hệ quản trị viên để khôi phục mật khẩu.')
              }}
              className="font-bold text-primary-container hover:text-secondary-container transition-colors"
            >
              Quên mật khẩu?
            </a>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full h-12 bg-gradient-to-r from-primary-container to-emerald-700 hover:from-primary-hover hover:to-emerald-800 disabled:opacity-70 text-white rounded-xl text-sm font-bold shadow-md hover:shadow-lg active-press transition-all flex items-center justify-center gap-2 cursor-pointer mt-2"
          >
            {loading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <>
                <span>Đăng nhập</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        <div className="flex items-center my-5 text-[11px] font-bold text-slate-400 tracking-wider">
          <div className="flex-1 border-b border-slate-200"></div>
          <span className="px-3 uppercase">Hoặc đăng nhập với</span>
          <div className="flex-1 border-b border-slate-200"></div>
        </div>

        <div className="flex justify-center w-full mb-5">
          <div className="w-full flex justify-center [&>div]:w-full [&>div>iframe]:!w-full [&>div>iframe]:!rounded-full shadow-2xs">
            <GoogleLogin
              onSuccess={handleGoogleSuccess}
              onError={handleGoogleError}
              useOneTap
              shape="pill"
              text="continue_with"
              width="360"
            />
          </div>
        </div>

        <p className="text-center text-xs text-slate-500 pt-3 border-t border-slate-200/70">
          Chưa có tài khoản?{' '}
          <Link to="/register" className="font-bold text-primary-container hover:text-secondary-container transition-colors">
            Đăng ký ngay
          </Link>
        </p>
      </div>
    </div>
  )
}
