import React from 'react'
import { Outlet } from 'react-router-dom'
import { Header } from '@/components/common/Header'
import { Footer } from '@/components/common/Footer'

export const MainLayout: React.FC = () => {
  return (
    <div className="flex flex-col min-h-screen bg-surface text-slate-800">
      <Header />
      <div className="flex-1">
        <Outlet />
      </div>
      <Footer />
    </div>
  )
}
