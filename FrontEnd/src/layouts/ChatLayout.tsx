import React from 'react'
import { Outlet } from 'react-router-dom'
import { Header } from '@/components/common/Header'

export const ChatLayout: React.FC = () => {
  return (
    <div className="h-dvh w-screen overflow-hidden flex flex-col bg-slate-50 text-slate-800">
      <Header />
      <div className="flex-1 min-h-0 overflow-hidden relative">
        <Outlet />
      </div>
    </div>
  )
}

export default ChatLayout
