import React, { Suspense, lazy } from 'react'
import { BrowserRouter, Routes, Route, Navigate, useNavigate, useSearchParams } from 'react-router-dom'
import { GoogleOAuthProvider } from '@react-oauth/google'
import { AuthProvider } from '@/context/AuthContext'
import { ChatProvider } from '@/context/ChatContext'
import { MainLayout } from '@/layouts/MainLayout'
import { ChatLayout } from '@/layouts/ChatLayout'

const HomePage = lazy(() => import('@/pages/HomePage').then((m) => ({ default: m.HomePage })))
const ExplorePage = lazy(() => import('@/pages/ExplorePage').then((m) => ({ default: m.ExplorePage })))
const PlaceDetailPage = lazy(() => import('@/pages/PlaceDetailPage').then((m) => ({ default: m.PlaceDetailPage })))
const MapPage = lazy(() => import('@/pages/MapPage').then((m) => ({ default: m.MapPage })))
const ItineraryPage = lazy(() => import('@/pages/ItineraryPage').then((m) => ({ default: m.ItineraryPage })))
const BlogPage = lazy(() => import('@/pages/BlogPage').then((m) => ({ default: m.BlogPage })))
const LoginPage = lazy(() => import('@/pages/LoginPage').then((m) => ({ default: m.LoginPage })))
const RegisterPage = lazy(() => import('@/pages/RegisterPage').then((m) => ({ default: m.RegisterPage })))
const SettingsPage = lazy(() => import('@/pages/SettingsPage').then((m) => ({ default: m.SettingsPage })))
const ProposePlacePage = lazy(() => import('@/pages/ProposePlacePage').then((m) => ({ default: m.ProposePlacePage })))
const RegionPage = lazy(() => import('@/pages/RegionPage').then((m) => ({ default: m.RegionPage })))
const ProvincePage = lazy(() => import('@/pages/ProvincePage').then((m) => ({ default: m.ProvincePage })))
const NotFoundPage = lazy(() => import('@/pages/NotFoundPage').then((m) => ({ default: m.NotFoundPage })))
const AdminPage = lazy(() => import('@/pages/AdminPage').then((m) => ({ default: m.AdminPage })))
const ChatPage = lazy(() => import('@/pages/ChatPage'))

const ChatRoute: React.FC = () => {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const conversationId = searchParams.get('conversation') || undefined

  return (
    <ChatPage
      initialConversationId={conversationId}
      onBack={() => navigate(-1)}
      onSelectPlace={(placeId) => navigate(`/places/${placeId}`)}
      onViewTripDetail={(tripId) => navigate(`/itinerary/${tripId}`)}
    />
  )
}

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || ''

const PageLoadingFallback = () => (
  <div className="min-h-[60vh] flex items-center justify-center">
    <div className="w-8 h-8 border-3 border-emerald-600 border-t-transparent rounded-full animate-spin"></div>
  </div>
)

export const App: React.FC = () => {
  return (
    <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
      <AuthProvider>
        <ChatProvider>
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
                <Route path="itinerary" element={<ItineraryPage />} />
                <Route path="itinerary/my-trips" element={<ItineraryPage />} />
                <Route path="itinerary/:id" element={<ItineraryPage />} />
                <Route path="my-trips" element={<ItineraryPage />} />
                <Route path="itineraries" element={<ItineraryPage />} />
                <Route path="hanh-trinh" element={<ItineraryPage />} />
                <Route path="blog" element={<BlogPage />} />
                <Route path="blog/:id" element={<BlogPage />} />
                <Route path="cam-nang" element={<BlogPage />} />
                <Route path="cam-nang/:id" element={<BlogPage />} />
                <Route path="regions" element={<RegionPage />} />
                <Route path="regions/:regionSlug" element={<RegionPage />} />
                <Route path="mien" element={<RegionPage />} />
                <Route path="mien/:regionSlug" element={<RegionPage />} />
                <Route path="provinces" element={<ProvincePage />} />
                <Route path="provinces/:provinceId" element={<ProvincePage />} />
                <Route path="province" element={<ProvincePage />} />
                <Route path="province/:provinceId" element={<ProvincePage />} />
                <Route path="tinh-thanh" element={<ProvincePage />} />
                <Route path="tinh-thanh/:provinceId" element={<ProvincePage />} />
                <Route path="tinh/:provinceId" element={<ProvincePage />} />
                <Route path="propose-place" element={<ProposePlacePage />} />
                <Route path="de-xuat" element={<ProposePlacePage />} />
                <Route path="de-xuat-dia-diem" element={<ProposePlacePage />} />
                <Route path="profile" element={<Navigate to="/settings" replace />} />
                <Route path="settings" element={<SettingsPage />} />
                <Route path="cai-dat" element={<SettingsPage />} />
                <Route path="*" element={<NotFoundPage />} />
              </Route>

              {/* Dedicated Chat Layout without Footer */}
              <Route path="/chat" element={<ChatLayout />}>
                <Route index element={<ChatRoute />} />
              </Route>

              <Route path="/login" element={<LoginPage />} />
              <Route path="/register" element={<RegisterPage />} />
              <Route path="/admin" element={<AdminPage />} />
              <Route path="/admin/*" element={<AdminPage />} />
            </Routes>
          </Suspense>
        </BrowserRouter>
        </ChatProvider>
      </AuthProvider>
    </GoogleOAuthProvider>
  )
}

export default App
