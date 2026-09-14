import React, { useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useAuth } from '@/context/AuthContext'
import {
  SettingsSidebar,
  ProfileSettingsTab,
  SecuritySettingsTab,
  PreferencesSettingsTab,
  type SettingsTab
} from '@/components/settings'

export const SettingsPage: React.FC = () => {
  const { isAuthenticated, isLoading: isAuthLoading } = useAuth()
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()

  const tabParam = searchParams.get('tab') as SettingsTab | null
  const activeTab: SettingsTab = tabParam === 'security' || tabParam === 'preferences' ? tabParam : 'profile'

  const handleTabChange = (tab: SettingsTab) => {
    const nextParams = new URLSearchParams()
    if (tab !== 'profile') {
      nextParams.set('tab', tab)
    }
    setSearchParams(nextParams, { replace: true })
  }

  useEffect(() => {
    if (!isAuthLoading && !isAuthenticated) {
      navigate('/login')
    }
  }, [isAuthenticated, isAuthLoading, navigate])

  if (isAuthLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="w-8 h-8 border-3 border-emerald-700 border-t-transparent rounded-full animate-spin"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50/70 pb-20">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 pt-8">
          <div className="lg:col-span-4 space-y-3">
            <SettingsSidebar activeTab={activeTab} onTabChange={handleTabChange} />
          </div>

          <div className="lg:col-span-8">
            <div className="bg-white rounded-2xl p-6 sm:p-8 border border-slate-200/80 shadow-2xs">
              {activeTab === 'profile' && <ProfileSettingsTab />}
              {activeTab === 'security' && <SecuritySettingsTab />}
              {activeTab === 'preferences' && <PreferencesSettingsTab />}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default SettingsPage
