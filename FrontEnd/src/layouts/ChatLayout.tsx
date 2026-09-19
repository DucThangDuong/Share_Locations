import React from 'react'
import { Outlet } from 'react-router-dom'
import { Header } from '@/components/common/Header'

export const ChatLayout: React.FC = () => {
  return (
    <div className="h-dvh w-screen overflow-hidden flex flex-col bg-[#F0F2F5] text-[#050505]">
      <Header />
      <div className="flex-1 min-h-0 overflow-hidden relative">
        <Outlet />
      </div>
    </div>
  )
}

export default ChatLayout
