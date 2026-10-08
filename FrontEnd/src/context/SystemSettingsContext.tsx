import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import adminService from '@/services/adminService';
import { SYSTEM_SETTING_KEYS, DEFAULT_SYSTEM_SETTINGS } from '@/constants/systemSettings';

export interface SystemSettingsContextType {
  settings: Record<string, string>;
  isLoading: boolean;
  getSetting: (key: string, fallback?: string) => string;
  defaultUserAvatar: string;
  defaultGroupAvatar: string;
  homeHeroImage: string;
  heroBannerUrl: string;
  siteName: string;
  siteHotline: string;
  siteEmail: string;
  isMaintenanceMode: boolean;
  maxUploadPhotos: number;
  maxUploadSizeMb: number;
  blacklistWords: string[];
  refreshSettings: () => Promise<void>;
}

const STORAGE_KEY = 'app_system_settings_cache';

const SystemSettingsContext = createContext<SystemSettingsContextType | undefined>(undefined);

export const SystemSettingsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [settings, setSettings] = useState<Record<string, string>>(() => {
    try {
      const cached = localStorage.getItem(STORAGE_KEY);
      if (cached) {
        return { ...DEFAULT_SYSTEM_SETTINGS, ...JSON.parse(cached) };
      }
    } catch {
      // Ignore localStorage parse error
    }
    return DEFAULT_SYSTEM_SETTINGS;
  });

  const [isLoading, setIsLoading] = useState(false);

  const fetchSettings = useCallback(async () => {
    try {
      setIsLoading(true);
      const res: any = await adminService.getSystemSettings();
      const rawData = res?.data || res;
      const list = Array.isArray(rawData) ? rawData : (rawData?.items || []);

      if (Array.isArray(list) && list.length > 0) {
        const mapped: Record<string, string> = {};
        list.forEach((item: any) => {
          if (item && item.settingKey) {
            mapped[item.settingKey] = item.settingValue ?? '';
          }
        });

        setSettings((prev) => {
          const next = { ...prev, ...mapped };
          try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
          } catch {
            // Ignore storage write error
          }
          return next;
        });
      }
    } catch {
      // Keep existing settings / defaults on error
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  const getSetting = useCallback(
    (key: string, fallback = '') => {
      return settings[key] || DEFAULT_SYSTEM_SETTINGS[key] || fallback;
    },
    [settings]
  );

  const heroImage =
    settings[SYSTEM_SETTING_KEYS.HOME_HERO_IMAGE] ||
    DEFAULT_SYSTEM_SETTINGS[SYSTEM_SETTING_KEYS.HOME_HERO_IMAGE];

  const userAvatar =
    settings[SYSTEM_SETTING_KEYS.DEFAULT_USER_AVATAR] ||
    DEFAULT_SYSTEM_SETTINGS[SYSTEM_SETTING_KEYS.DEFAULT_USER_AVATAR];

  const groupAvatar =
    settings[SYSTEM_SETTING_KEYS.DEFAULT_GROUP_AVATAR] ||
    DEFAULT_SYSTEM_SETTINGS[SYSTEM_SETTING_KEYS.DEFAULT_GROUP_AVATAR];

  const siteName =
    settings[SYSTEM_SETTING_KEYS.SITE_NAME] ||
    DEFAULT_SYSTEM_SETTINGS[SYSTEM_SETTING_KEYS.SITE_NAME];

  const siteHotline =
    settings[SYSTEM_SETTING_KEYS.SITE_HOTLINE] ||
    DEFAULT_SYSTEM_SETTINGS[SYSTEM_SETTING_KEYS.SITE_HOTLINE];

  const siteEmail =
    settings[SYSTEM_SETTING_KEYS.SITE_EMAIL] ||
    DEFAULT_SYSTEM_SETTINGS[SYSTEM_SETTING_KEYS.SITE_EMAIL];

  const isMaintenanceMode =
    (settings[SYSTEM_SETTING_KEYS.MAINTENANCE_MODE] ??
      DEFAULT_SYSTEM_SETTINGS[SYSTEM_SETTING_KEYS.MAINTENANCE_MODE]) === '1';

  const maxUploadPhotos = parseInt(
    settings[SYSTEM_SETTING_KEYS.MAX_UPLOAD_PHOTOS] ||
      DEFAULT_SYSTEM_SETTINGS[SYSTEM_SETTING_KEYS.MAX_UPLOAD_PHOTOS] ||
      '10',
    10
  );

  const maxUploadSizeMb = parseInt(
    settings[SYSTEM_SETTING_KEYS.MAX_UPLOAD_SIZE_MB] ||
      DEFAULT_SYSTEM_SETTINGS[SYSTEM_SETTING_KEYS.MAX_UPLOAD_SIZE_MB] ||
      '5',
    10
  );

  const blacklistWords = (
    settings[SYSTEM_SETTING_KEYS.BLACKLIST_WORDS] ||
    DEFAULT_SYSTEM_SETTINGS[SYSTEM_SETTING_KEYS.BLACKLIST_WORDS] ||
    ''
  )
    .split(',')
    .map((w) => w.trim())
    .filter(Boolean);

  const value: SystemSettingsContextType = {
    settings,
    isLoading,
    getSetting,
    defaultUserAvatar: userAvatar,
    defaultGroupAvatar: groupAvatar,
    homeHeroImage: heroImage,
    heroBannerUrl: heroImage,
    siteName,
    siteHotline,
    siteEmail,
    isMaintenanceMode,
    maxUploadPhotos,
    maxUploadSizeMb,
    blacklistWords,
    refreshSettings: fetchSettings,
  };

  return (
    <SystemSettingsContext.Provider value={value}>
      {children}
    </SystemSettingsContext.Provider>
  );
};

export const useSystemSettings = (): SystemSettingsContextType => {
  const context = useContext(SystemSettingsContext);
  if (!context) {
    throw new Error('useSystemSettings must be used within a SystemSettingsProvider');
  }
  return context;
};
