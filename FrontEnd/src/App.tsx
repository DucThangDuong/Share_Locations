import React, { Suspense, lazy } from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { GoogleOAuthProvider } from '@react-oauth/google'
import { AuthProvider } from '@/context/AuthContext'
import { MainLayout } from '@/layouts/MainLayout'

const HomePage = lazy(() => import('@/pages/HomePage').then((m) => ({ default: m.HomePage })))
const ExplorePage = lazy(() => import('@/pages/ExplorePage').then((m) => ({ default: m.ExplorePage })))
const PlaceDetailPage = lazy(() => import('@/pages/PlaceDetailPage').then((m) => ({ default: m.PlaceDetailPage })))
const MapPage = lazy(() => import('@/pages/MapPage').then((m) => ({ default: m.MapPage })))
const FoodPage = lazy(() => import('@/pages/FoodPage').then((m) => ({ default: m.FoodPage })))
const ItineraryPage = lazy(() => import('@/pages/ItineraryPage').then((m) => ({ default: m.ItineraryPage })))
const BlogPage = lazy(() => import('@/pages/BlogPage').then((m) => ({ default: m.BlogPage })))
const LoginPage = lazy(() => import('@/pages/LoginPage').then((m) => ({ default: m.LoginPage })))
const RegisterPage = lazy(() => import('@/pages/RegisterPage').then((m) => ({ default: m.RegisterPage })))
const ProfilePage = lazy(() => import('@/pages/ProfilePage').then((m) => ({ default: m.ProfilePage })))
const NotFoundPage = lazy(() => import('@/pages/NotFoundPage').then((m) => ({ default: m.NotFoundPage })))

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || 'dummy-client-id.apps.googleusercontent.com'

const PageLoadingFallback = () => (
  <div className="min-h-[60vh] flex items-center justify-center">
    <div className="w-8 h-8 border-3 border-emerald-600 border-t-transparent rounded-full animate-spin"></div>
  </div>
)

export const App: React.FC = () => {
  return (
    <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
      <AuthProvider>
        <BrowserRouter>
          <Suspense fallback={<PageLoadingFallback />}>
            <Routes>
              <Route path="/" element={<MainLayout />}>
                <Route index element={<HomePage />} />
                <Route path="explore" element={<ExplorePage />} />
                <Route path="diadiem" element={<ExplorePage />} />
                <Route path="places/:id" element={<PlaceDetailPage />} />
                <Route path="dia-diem/:id" element={<PlaceDetailPage />} />
                <Route path="map" element={<MapPage />} />
                <Route path="ban-do" element={<MapPage />} />
                <Route path="food" element={<FoodPage />} />
                <Route path="am-thuc" element={<FoodPage />} />
                <Route path="itineraries" element={<ItineraryPage />} />
                <Route path="hanh-trinh" element={<ItineraryPage />} />
                <Route path="blog" element={<BlogPage />} />
                <Route path="cam-nang" element={<BlogPage />} />
                <Route path="profile" element={<ProfilePage />} />
                <Route path="*" element={<NotFoundPage />} />
              </Route>

              <Route path="/login" element={<LoginPage />} />
              <Route path="/register" element={<RegisterPage />} />
            </Routes>
          </Suspense>
        </BrowserRouter>
      </AuthProvider>
    </GoogleOAuthProvider>
  )
}

export default App
