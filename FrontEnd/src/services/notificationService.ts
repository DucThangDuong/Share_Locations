import { apiClient } from './apiClient';
import type { NotificationPagedResult } from '@/types/notification.types';

export const notificationService = {
  getNotifications: async (
    page = 1,
    pageSize = 20,
    unreadOnly?: boolean
  ): Promise<NotificationPagedResult> => {
    const res = await apiClient.get('/api/notifications', {
      params: { page, pageSize, unreadOnly: unreadOnly ? true : undefined }
    });
    return res.data?.data ?? {
      items: [],
      totalCount: 0,
      unreadCount: 0,
      page,
      pageSize,
      totalPages: 0,
      hasNextPage: false
    };
  },

  getUnreadCount: async (): Promise<number> => {
    const res = await apiClient.get('/api/notifications/unread-count');
    return res.data?.data ?? 0;
  },

  markAsRead: async (id: number): Promise<boolean> => {
    const res = await apiClient.put(`/api/notifications/${id}/read`);
    return res.data?.data ?? true;
  },

  markAllAsRead: async (): Promise<number> => {
    const res = await apiClient.put('/api/notifications/read-all');
    return res.data?.data ?? 0;
  },

  deleteNotification: async (id: number): Promise<boolean> => {
    const res = await apiClient.delete(`/api/notifications/${id}`);
    return res.data?.data ?? true;
  }
};

export default notificationService;
