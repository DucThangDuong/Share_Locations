import React, { useState, useEffect, useRef } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  Mail,
  Lock,
  Eye,
  EyeOff,
  ArrowRight,
  ArrowLeft,
  KeyRound,
  CheckCircle2,
  Clock,
  RotateCcw,
  Loader2,
  ShieldCheck
} from 'lucide-react'
import { authService } from '@/services/authService'
import { AxiosError } from 'axios'
import type { ApiErrorResponse } from '@/types/auth'

type ForgotStep = 'email' | 'otp' | 'new-password' | 'success'

const OTP_INITIAL_TIME = 360 // 6 minutes in seconds

export const ForgotPasswordPage: React.FC = () => {
  const navigate = useNavigate()

  // Multi-step state
  const [step, setStep] = useState<ForgotStep>('email')
  const [email, setEmail] = useState('')

  // Step 2 OTP State
  const [otp, setOtp] = useState<string[]>(['', '', '', '', '', ''])
  const [timeLeft, setTimeLeft] = useState<number>(OTP_INITIAL_TIME)
  const [isTimerActive, setIsTimerActive] = useState(false)
  const [resendCooldown, setResendCooldown] = useState(0)
  const [resetToken, setResetToken] = useState('')
  const otpInputsRef = useRef<(HTMLInputElement | null)[]>([])

  // Step 3 Password State
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)

  // Status & Feedback State
  const [loading, setLoading] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')

  // Auto redirect countdown on success
  const [redirectCount, setRedirectCount] = useState(5)

  // Timer countdown for OTP (6 minutes)
  useEffect(() => {
    let timer: ReturnType<typeof setInterval>
    if (isTimerActive && timeLeft > 0) {
      timer = setInterval(() => {
        setTimeLeft((prev) => prev - 1)
      }, 1000)
    } else if (timeLeft === 0) {
      setIsTimerActive(false)
    }
    return () => clearInterval(timer)
  }, [isTimerActive, timeLeft])

  // Timer for resend cooldown (30s)
  useEffect(() => {
    let timer: ReturnType<typeof setInterval>
    if (resendCooldown > 0) {
      timer = setInterval(() => {
        setResendCooldown((prev) => prev - 1)
      }, 1000)
    }
    return () => clearInterval(timer)
  }, [resendCooldown])

  // Redirect countdown on success step
  useEffect(() => {
    let timer: ReturnType<typeof setInterval>
    if (step === 'success' && redirectCount > 0) {
      timer = setInterval(() => {
        setRedirectCount((prev) => prev - 1)
      }, 1000)
    } else if (step === 'success' && redirectCount === 0) {
      navigate('/login')
    }
    return () => clearInterval(timer)
  }, [step, redirectCount, navigate])

  // Focus first OTP input when reaching OTP step
  useEffect(() => {
    if (step === 'otp') {
      setTimeout(() => {
        otpInputsRef.current[0]?.focus()
      }, 100)
    }
  }, [step])

  // Format seconds to mm:ss
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  // Helper to extract API error message
  const extractErrorMessage = (err: unknown, defaultMsg: string) => {
    const axiosError = err as AxiosError<ApiErrorResponse>
    const errorData = axiosError.response?.data
    if (errorData?.errors && errorData.errors.length > 0) {
      return errorData.errors.map((e) => e.message).join(' • ')
    }
    if (errorData?.message) {
      return errorData.message
    }
    if (axiosError.message) {
      return axiosError.message
    }
    return defaultMsg
  }

  // ===================== STEP 1: SEND EMAIL =====================
  const handleSendEmail = async (e?: React.FormEvent, isResend: boolean = false) => {
    if (e) e.preventDefault()
    const targetEmail = email.trim()
    if (!targetEmail || loading) return

    setErrorMessage('')
    setLoading(true)

    try {
      await authService.forgotPassword(targetEmail)
      setTimeLeft(OTP_INITIAL_TIME)
      setIsTimerActive(true)
      setResendCooldown(30)
      if (!isResend) {
        setStep('otp')
      }
    } catch (err: any) {
      setErrorMessage(
        extractErrorMessage(
          err,
          'Không tìm thấy tài khoản với email này. Vui lòng kiểm tra lại.'
        )
      )
    } finally {
      setLoading(false)
    }
  }

  // ===================== STEP 2: OTP INPUT HANDLERS =====================
  const handleOtpChange = (index: number, value: string) => {
    // Only accept numeric characters
    const cleanValue = value.replace(/\D/g, '')
    if (!cleanValue && value !== '') return

    const newOtp = [...otp]
    newOtp[index] = cleanValue.slice(-1) // Take last typed digit
    setOtp(newOtp)
    setErrorMessage('')

    // Auto-focus next input box
    if (cleanValue && index < 5) {
      otpInputsRef.current[index + 1]?.focus()
    }
  }

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace') {
      if (!otp[index] && index > 0) {
        // If current is empty, focus previous and clear it
        const newOtp = [...otp]
        newOtp[index - 1] = ''
        setOtp(newOtp)
        otpInputsRef.current[index - 1]?.focus()
      } else {
        const newOtp = [...otp]
        newOtp[index] = ''
        setOtp(newOtp)
      }
    } else if (e.key === 'ArrowLeft' && index > 0) {
      otpInputsRef.current[index - 1]?.focus()
    } else if (e.key === 'ArrowRight' && index < 5) {
      otpInputsRef.current[index + 1]?.focus()
    }
  }

  const handleOtpPaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault()
    const pastedData = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6)
    if (!pastedData) return

    const newOtp = [...otp]
    for (let i = 0; i < pastedData.length; i++) {
      newOtp[i] = pastedData[i]
    }
    setOtp(newOtp)
    setErrorMessage('')

    // Focus on the next empty input or last input
    const nextEmptyIndex = Math.min(pastedData.length, 5)
    otpInputsRef.current[nextEmptyIndex]?.focus()
  }

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault()
    const fullOtp = otp.join('')
    if (fullOtp.length !== 6 || loading) {
      setErrorMessage('Vui lòng nhập đủ 6 chữ số mã xác thực.')
      return
    }

    if (timeLeft === 0) {
      setErrorMessage('Mã xác thực đã hết hạn (quá 6 phút). Vui lòng nhấn gửi lại mã mới.')
      return
    }

    setErrorMessage('')
    setLoading(true)

    try {
      const res = await authService.verifyResetOtp(email.trim(), fullOtp)
      if (res?.data?.resetToken) {
        setResetToken(res.data.resetToken)
      }
      setStep('new-password')
    } catch (err: any) {
      setErrorMessage(
        extractErrorMessage(
          err,
          'Mã xác thực không chính xác hoặc đã hết hạn. Vui lòng kiểm tra lại.'
        )
      )
    } finally {
      setLoading(false)
    }
  }

  // ===================== STEP 3: RESET PASSWORD =====================
  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrorMessage('')

    if (!resetToken) {
      setErrorMessage('Phiên làm việc không hợp lệ hoặc đã hết hạn. Vui lòng thực hiện lại từ đầu.')
      return
    }

    if (newPassword.length < 6) {
      setErrorMessage('Mật khẩu mới phải có ít nhất 6 ký tự.')
      return
    }

    if (newPassword !== confirmPassword) {
      setErrorMessage('Mật khẩu xác nhận không khớp.')
      return
    }

    setLoading(true)

    try {
      await authService.resetPassword({
        resetToken,
        newPassword,
        confirmPassword
      })
      setStep('success')
    } catch (err) {
      setErrorMessage(
        extractErrorMessage(
          err,
          'Không thể đặt lại mật khẩu lúc này. Vui lòng thử lại sau.'
        )
      )
    } finally {
      setLoading(false)
    }
  }

  // Password strength helper
  const getPasswordStrength = (pass: string) => {
    if (!pass) return { score: 0, label: '', color: '' }
    let score = 0
    if (pass.length >= 6) score += 1
    if (pass.length >= 8) score += 1
    if (/[A-Z]/.test(pass) && /[a-z]/.test(pass)) score += 1
    if (/\d/.test(pass)) score += 1
    if (/[^A-Za-z0-9]/.test(pass)) score += 1

    if (score <= 2) return { score: 1, label: 'Yếu', color: 'bg-rose-500 text-rose-600' }
    if (score <= 3) return { score: 2, label: 'Trung bình', color: 'bg-amber-500 text-amber-600' }
    return { score: 3, label: 'Mạnh', color: 'bg-emerald-600 text-emerald-600' }
  }

  const passStrength = getPasswordStrength(newPassword)

  return (
    <div
      className="min-h-screen flex justify-center items-center bg-cover bg-center bg-fixed p-4 sm:p-6 relative overflow-hidden"
      style={{
        backgroundImage: `linear-gradient(rgba(6, 40, 30, 0.45), rgba(6, 40, 30, 0.7)), url('https://images.unsplash.com/photo-1528127269322-539801943592?q=80&w=1920&auto=format&fit=crop')`
      }}
    >
      <div className="w-full max-w-[460px] glass-card p-7 sm:p-9 rounded-3xl animate-in fade-in zoom-in-95 duration-200 relative z-10 border border-white/70 shadow-2xl">
        {/* Brand Header */}
        <div className="text-center mb-6 space-y-1.5">
          <Link to="/" className="inline-flex items-center gap-1.5 group mb-1">
            <span className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900">
              LangThang<span className="text-emerald-700">.</span>
            </span>
          </Link>

          {/* Stepper Progress Indicator */}
          {step !== 'success' && (
            <div className="pt-2 pb-1 flex items-center justify-center gap-2">
              {/* Step 1 Pill */}
              <div
                className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold transition-all ${step === 'email'
                  ? 'bg-emerald-800 text-white shadow-xs ring-2 ring-emerald-800/20'
                  : 'bg-emerald-100 text-emerald-800'
                  }`}
              >
                <span>1</span>
                <span>Email</span>
              </div>

              <div className="w-4 h-0.5 bg-slate-200 rounded-full" />

              {/* Step 2 Pill */}
              <div
                className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold transition-all ${step === 'otp'
                  ? 'bg-emerald-800 text-white shadow-xs ring-2 ring-emerald-800/20'
                  : step === 'new-password'
                    ? 'bg-emerald-100 text-emerald-800'
                    : 'bg-slate-100 text-slate-400'
                  }`}
              >
                <span>2</span>
                <span>Mã OTP</span>
              </div>

              <div className="w-4 h-0.5 bg-slate-200 rounded-full" />

              {/* Step 3 Pill */}
              <div
                className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold transition-all ${step === 'new-password'
                  ? 'bg-emerald-800 text-white shadow-xs ring-2 ring-emerald-800/20'
                  : 'bg-slate-100 text-slate-400'
                  }`}
              >
                <span>3</span>
                <span>Mật khẩu</span>
              </div>
            </div>
          )}
        </div>

        {/* Global Feedback Banner */}
        {errorMessage && (
          <div className="mb-4 p-3 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium leading-relaxed animate-in fade-in flex items-start gap-2">
            <span className="shrink-0 text-rose-500 font-bold">•</span>
            <span>{errorMessage}</span>
          </div>
        )}

        {/* ===================== STEP 1: EMAIL INPUT ===================== */}
        {step === 'email' && (
          <div className="space-y-4 animate-in fade-in duration-150">
            <div className="text-center space-y-1">
              <h1 className="text-xl sm:text-2xl text-slate-900 font-black tracking-tight">
                Quên mật khẩu?
              </h1>
              <p className="text-slate-600 text-xs sm:text-sm leading-relaxed">
                Nhập email của bạn để hệ thống kiểm tra và gửi mã xác minh 6 số.
              </p>
            </div>

            <form onSubmit={(e) => handleSendEmail(e, false)} className="space-y-4 pt-1">
              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1.5" htmlFor="forgot-email">
                  Địa chỉ Email <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <input
                    id="forgot-email"
                    type="email"
                    required
                    autoFocus
                    value={email}
                    disabled={loading}
                    onChange={(e) => {
                      setEmail(e.target.value)
                      setErrorMessage('')
                    }}
                    placeholder="name@example.com"
                    className="w-full h-11 pl-10 pr-4 rounded-xl border border-slate-200 bg-white/95 text-slate-900 text-xs sm:text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-700/20 focus:border-emerald-700 focus:bg-white transition-all disabled:opacity-50"
                  />
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading || !email.trim()}
                className="w-full h-12 bg-gradient-to-r from-emerald-800 to-emerald-700 hover:from-emerald-900 hover:to-emerald-800 active:scale-[0.99] disabled:opacity-60 text-white rounded-xl text-sm font-bold shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer mt-2"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Đang kiểm tra & gửi mã...</span>
                  </>
                ) : (
                  <>
                    <span>Gửi mã xác nhận</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>

            <div className="pt-2 text-center">
              <Link
                to="/login"
                className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-600 hover:text-emerald-800 transition-colors"
              >
                <ArrowLeft size={14} />
                <span>Quay lại trang Đăng nhập</span>
              </Link>
            </div>
          </div>
        )}

        {/* ===================== STEP 2: 6-DIGIT OTP & 6-MINUTE TIMER ===================== */}
        {step === 'otp' && (
          <div className="space-y-4 animate-in fade-in duration-150">
            <div className="text-center space-y-1">
              <div className="w-12 h-12 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 flex items-center justify-center mx-auto mb-2 shadow-2xs">
                <ShieldCheck size={24} />
              </div>
              <h1 className="text-xl sm:text-2xl text-slate-900 font-black tracking-tight">
                Xác thực mã 6 số
              </h1>
              <p className="text-slate-600 text-xs leading-relaxed">
                Mã xác thực gồm 6 chữ số đã được gửi tới:
                <br />
                <strong className="text-slate-900 font-bold">{email}</strong>
              </p>
            </div>

            <form onSubmit={handleVerifyOtp} className="space-y-4 pt-1">
              {/* 6 Digit Input Boxes */}
              <div className="space-y-2">
                <label className="block text-center text-xs font-bold text-slate-700">
                  Nhập mã xác thực (OTP)
                </label>
                <div className="flex justify-center items-center gap-1.5 sm:gap-2">
                  {otp.map((digit, idx) => (
                    <input
                      key={idx}
                      ref={(el) => {
                        otpInputsRef.current[idx] = el
                      }}
                      type="text"
                      inputMode="numeric"
                      maxLength={1}
                      value={digit}
                      disabled={loading}
                      onChange={(e) => handleOtpChange(idx, e.target.value)}
                      onKeyDown={(e) => handleOtpKeyDown(idx, e)}
                      onPaste={handleOtpPaste}
                      className="w-10 h-12 sm:w-12 sm:h-14 text-center text-lg sm:text-xl font-black rounded-xl border border-slate-200 bg-white/95 text-slate-900 focus:outline-none focus:border-emerald-700 focus:ring-2 focus:ring-emerald-700/20 focus:bg-white transition-all shadow-2xs disabled:opacity-50"
                    />
                  ))}
                </div>
              </div>

              {/* 6-Minute Countdown Timer Box */}
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-2xl flex items-center justify-between gap-2 text-xs">
                <div className="flex items-center gap-1.5">
                  <Clock
                    size={15}
                    className={
                      timeLeft === 0
                        ? 'text-rose-500'
                        : timeLeft < 60
                          ? 'text-amber-500 animate-pulse'
                          : 'text-emerald-700'
                    }
                  />
                  <span className="text-slate-600 font-medium">Thời hạn còn lại:</span>
                  <span
                    className={`font-mono font-black ${timeLeft === 0
                      ? 'text-rose-600'
                      : timeLeft < 60
                        ? 'text-amber-600'
                        : 'text-emerald-800'
                      }`}
                  >
                    {formatTime(timeLeft)}
                  </span>
                </div>

                <button
                  type="button"
                  disabled={loading || resendCooldown > 0}
                  onClick={() => handleSendEmail(undefined, true)}
                  className="px-2.5 py-1 text-xs font-bold text-emerald-800 hover:text-emerald-900 hover:bg-emerald-50 rounded-lg transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1 shrink-0"
                >
                  <RotateCcw size={12} className={loading ? 'animate-spin' : ''} />
                  <span>
                    {resendCooldown > 0 ? `Gửi lại (${resendCooldown}s)` : 'Gửi lại mã'}
                  </span>
                </button>
              </div>

              {timeLeft === 0 && (
                <div className="text-center text-xs text-rose-600 font-medium bg-rose-50 p-2 rounded-xl border border-rose-200">
                  Mã 6 số đã hết hạn 6 phút. Vui lòng bấm <strong>Gửi lại mã</strong> để nhận mã mới.
                </div>
              )}

              <button
                type="submit"
                disabled={loading || otp.join('').length !== 6 || timeLeft === 0}
                className="w-full h-12 bg-gradient-to-r from-emerald-800 to-emerald-700 hover:from-emerald-900 hover:to-emerald-800 active:scale-[0.99] disabled:opacity-50 text-white rounded-xl text-sm font-bold shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer mt-2"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Đang xác thực...</span>
                  </>
                ) : (
                  <>
                    <span>Xác nhận mã OTP</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>

            <div className="pt-2 flex items-center justify-between text-xs font-bold text-slate-500">
              <button
                type="button"
                onClick={() => {
                  setStep('email')
                  setOtp(['', '', '', '', '', ''])
                  setErrorMessage('')
                }}
                className="hover:text-emerald-800 transition-colors cursor-pointer flex items-center gap-1"
              >
                <ArrowLeft size={13} />
                <span>Quay lại</span>
              </button>

              <Link to="/login" className="hover:text-emerald-800 transition-colors">
                Hủy
              </Link>
            </div>
          </div>
        )}

        {/* ===================== STEP 3: NEW PASSWORD ===================== */}
        {step === 'new-password' && (
          <div className="space-y-4 animate-in fade-in duration-150">
            <div className="text-center space-y-1">
              <div className="w-12 h-12 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 flex items-center justify-center mx-auto mb-2 shadow-2xs">
                <KeyRound size={24} />
              </div>
              <h1 className="text-xl sm:text-2xl text-slate-900 font-black tracking-tight">
                Đặt lại mật khẩu mới
              </h1>
              <p className="text-slate-600 text-xs leading-relaxed">
                Tạo mật khẩu mới an toàn để đăng nhập vào tài khoản của bạn.
              </p>
            </div>

            <form onSubmit={handleResetPassword} className="space-y-3.5 pt-1">
              {/* New Password */}
              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1.5" htmlFor="new-pass">
                  Mật khẩu mới <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <input
                    id="new-pass"
                    type={showNewPassword ? 'text' : 'password'}
                    required
                    autoFocus
                    value={newPassword}
                    disabled={loading}
                    onChange={(e) => {
                      setNewPassword(e.target.value)
                      setErrorMessage('')
                    }}
                    placeholder="Tối thiểu 6 ký tự"
                    className="w-full h-11 pl-10 pr-11 rounded-xl border border-slate-200 bg-white/95 text-slate-900 text-xs sm:text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-700/20 focus:border-emerald-700 focus:bg-white transition-all disabled:opacity-50"
                  />
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                  <button
                    type="button"
                    tabIndex={-1}
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    className="absolute right-3 top-3 text-slate-400 hover:text-slate-700 cursor-pointer p-0.5"
                  >
                    {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>

                {/* Password strength visual indicator */}
                {newPassword && (
                  <div className="mt-1.5 space-y-1">
                    <div className="flex gap-1 h-1 w-full bg-slate-200 rounded-full overflow-hidden">
                      <div
                        className={`h-full transition-all ${passStrength.score >= 1 ? passStrength.color.split(' ')[0] : 'bg-transparent'
                          }`}
                        style={{ width: '33.33%' }}
                      />
                      <div
                        className={`h-full transition-all ${passStrength.score >= 2 ? passStrength.color.split(' ')[0] : 'bg-transparent'
                          }`}
                        style={{ width: '33.33%' }}
                      />
                      <div
                        className={`h-full transition-all ${passStrength.score >= 3 ? passStrength.color.split(' ')[0] : 'bg-transparent'
                          }`}
                        style={{ width: '33.33%' }}
                      />
                    </div>
                    <div className="flex justify-between items-center text-[10px]">
                      <span className="text-slate-500">Độ mạnh mật khẩu:</span>
                      <span className={`font-bold ${passStrength.color.split(' ')[1]}`}>
                        {passStrength.label}
                      </span>
                    </div>
                  </div>
                )}
              </div>

              {/* Confirm Password */}
              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1.5" htmlFor="confirm-pass">
                  Xác nhận mật khẩu mới <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <input
                    id="confirm-pass"
                    type={showConfirmPassword ? 'text' : 'password'}
                    required
                    value={confirmPassword}
                    disabled={loading}
                    onChange={(e) => {
                      setConfirmPassword(e.target.value)
                      setErrorMessage('')
                    }}
                    placeholder="Nhập lại mật khẩu mới"
                    className="w-full h-11 pl-10 pr-11 rounded-xl border border-slate-200 bg-white/95 text-slate-900 text-xs sm:text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-700/20 focus:border-emerald-700 focus:bg-white transition-all disabled:opacity-50"
                  />
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                  <button
                    type="button"
                    tabIndex={-1}
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-3 text-slate-400 hover:text-slate-700 cursor-pointer p-0.5"
                  >
                    {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>

                {confirmPassword && (
                  <p
                    className={`text-[11px] font-semibold mt-1 ${newPassword === confirmPassword ? 'text-emerald-600' : 'text-rose-500'
                      }`}
                  >
                    {newPassword === confirmPassword
                      ? '✓ Mật khẩu xác nhận khớp'
                      : '✗ Mật khẩu xác nhận chưa khớp'}
                  </p>
                )}
              </div>

              <button
                type="submit"
                disabled={
                  loading ||
                  !newPassword ||
                  newPassword.length < 6 ||
                  newPassword !== confirmPassword
                }
                className="w-full h-12 bg-gradient-to-r from-emerald-800 to-emerald-700 hover:from-emerald-900 hover:to-emerald-800 active:scale-[0.99] disabled:opacity-50 text-white rounded-xl text-sm font-bold shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer mt-3"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Đang cập nhật mật khẩu...</span>
                  </>
                ) : (
                  <>
                    <span>Cập nhật mật khẩu mới</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>
          </div>
        )}

        {/* ===================== STEP 4: SUCCESS SCREEN ===================== */}
        {step === 'success' && (
          <div className="text-center space-y-4 py-3 animate-in fade-in zoom-in-95 duration-200">
            <div className="w-16 h-16 rounded-full bg-emerald-50 border-2 border-emerald-300 text-emerald-600 flex items-center justify-center mx-auto shadow-lg animate-bounce">
              <CheckCircle2 size={36} />
            </div>

            <div className="space-y-1.5">
              <h1 className="text-2xl text-slate-900 font-black tracking-tight">
                Đổi mật khẩu thành công!
              </h1>
              <p className="text-slate-600 text-xs sm:text-sm leading-relaxed">
                Mật khẩu của bạn đã được cập nhật an toàn. Bây giờ bạn có thể đăng nhập bằng mật khẩu mới.
              </p>
            </div>

            <div className="p-3 bg-emerald-50/70 border border-emerald-200 rounded-2xl text-xs text-emerald-800 font-semibold">
              Tự động chuyển hướng về trang Đăng nhập sau{' '}
              <strong className="text-emerald-950 font-black text-sm">{redirectCount}s</strong>...
            </div>

            <button
              type="button"
              onClick={() => navigate('/login')}
              className="w-full h-12 bg-gradient-to-r from-emerald-800 to-emerald-700 hover:from-emerald-900 hover:to-emerald-800 text-white rounded-xl text-sm font-bold shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <span>Đăng nhập ngay</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Footer info */}
        <p className="text-center text-xs text-slate-500 pt-4 mt-4 border-t border-slate-200/70">
          Cần hỗ trợ?{' '}
          <a
            href="mailto:support@langthang.vn"
            className="font-bold text-emerald-800 hover:text-emerald-950 transition-colors"
          >
            support@langthang.vn
          </a>
        </p>
      </div>
    </div>
  )
}

export default ForgotPasswordPage
