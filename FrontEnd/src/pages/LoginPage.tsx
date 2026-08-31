import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '@/context/AuthContext'
import { GoogleLogin, type CredentialResponse } from '@react-oauth/google'
import { AxiosError } from 'axios'
import type { ApiErrorResponse } from '@/types/auth'
import { Loader2 } from 'lucide-react'

export const LoginPage: React.FC = () => {
  const { login, googleLogin } = useAuth()
  const navigate = useNavigate()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
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
      if (axiosError.response?.data?.message) {
        setErrorMessage(axiosError.response.data.message)
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
      className="min-h-screen flex justify-center items-center bg-cover bg-center bg-fixed p-5"
      style={{
        backgroundImage: `linear-gradient(rgba(10, 20, 10, 0.35), rgba(10, 20, 10, 0.55)), url('https://images.unsplash.com/photo-1528127269322-539801943592?q=80&w=1920&auto=format&fit=crop')`
      }}
    >
      <div className="w-full max-w-[420px] bg-white/80 backdrop-blur-md border border-white/60 p-8 sm:p-9 rounded-3xl shadow-2xl animate-in fade-in zoom-in-95 duration-200">
        <div className="text-center mb-6">
          <Link
            to="/"
            className="inline-block font-serif text-3xl font-bold italic text-secondary-container mb-1 tracking-tight"
          >
            LangThang<span className="text-primary-container">.</span>
          </Link>
          <h1 className="font-serif text-2xl text-slate-900 font-bold mb-1">
            Chào mừng trở lại!
          </h1>
          <p className="text-slate-500 text-xs sm:text-sm">
            Đăng nhập để viết tiếp hành trình của bạn.
          </p>
        </div>

        {errorMessage && (
          <div className="mb-4 p-3 rounded-xl bg-red-50/90 border border-red-200 text-red-700 text-xs font-medium leading-relaxed">
            {errorMessage}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-800 mb-1.5" htmlFor="email">
              Email
            </label>
            <input
              id="email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Nhập địa chỉ email"
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 bg-white/90 text-slate-900 text-xs sm:text-sm focus:outline-hidden focus:ring-2 focus:ring-primary-container/20 focus:border-primary-container focus:bg-white transition-all"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-800 mb-1.5" htmlFor="password">
              Mật khẩu
            </label>
            <input
              id="password"
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Nhập mật khẩu"
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 bg-white/90 text-slate-900 text-xs sm:text-sm focus:outline-hidden focus:ring-2 focus:ring-primary-container/20 focus:border-primary-container focus:bg-white transition-all"
            />
          </div>

          <div className="flex justify-between items-center text-xs pt-1">
            <label className="flex items-center gap-1.5 text-slate-600 font-medium cursor-pointer">
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="w-3.5 h-3.5 accent-primary-container rounded cursor-pointer"
              />
              Ghi nhớ tôi
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
            className="w-full py-3 bg-primary-container hover:bg-primary-hover disabled:opacity-70 text-white rounded-xl text-sm font-semibold shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            {loading && <Loader2 className="w-4 h-4 animate-spin" />}
            <span>Đăng nhập</span>
          </button>
        </form>

        <div className="flex items-center my-4 text-[11px] font-bold text-slate-400 tracking-wider">
          <div className="flex-1 border-b border-slate-300"></div>
          <span className="px-3">HOẶC ĐĂNG NHẬP BẰNG</span>
          <div className="flex-1 border-b border-slate-300"></div>
        </div>

        <div className="flex justify-center w-full mb-4">
          <div className="w-full flex justify-center [&>div]:w-full [&>div>iframe]:!w-full [&>div>iframe]:!rounded-xl">
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

        <p className="text-center text-xs text-slate-500">
          Chưa có tài khoản?{' '}
          <Link to="/register" className="font-bold text-primary-container hover:text-secondary-container transition-colors">
            Đăng ký ngay
          </Link>
        </p>
      </div>
    </div>
  )
}
