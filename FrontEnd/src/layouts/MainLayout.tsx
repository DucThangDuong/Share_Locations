import React from 'react'
import { Outlet, useNavigate } from 'react-router-dom'
import { Header } from '@/components/common/Header'
import { Footer } from '@/components/common/Footer'
import { RecentVisitedFloatingDock } from '@/components/common/RecentVisitedFloatingDock'
import { FloatingChatWidget } from '@/components/chat'

export const MainLayout: React.FC = () => {
  const navigate = useNavigate()

  return (
    <div className="flex flex-col min-h-screen bg-surface text-slate-800">
      <Header />
      <div className="flex-1">
        <Outlet />
      </div>
      <Footer />
      <RecentVisitedFloatingDock />
      <FloatingChatWidget
        onOpenFullChat={(roomId) =>
          navigate(roomId ? `/chat?conversation=${roomId}` : '/chat')
        }
        onSelectPlace={(placeId) => navigate(`/places/${placeId}`)}
      />
    </div>
  )
}
