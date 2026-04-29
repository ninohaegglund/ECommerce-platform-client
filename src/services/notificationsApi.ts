import { request } from './apiClient'
import type { NotificationItem } from '../types/notification'

const NOTIFICATION_API_BASE_URL =
  import.meta.env.VITE_NOTIFICATION_API_URL ?? 'https://localhost:7117'

type NotificationResponse = {
  id?: string
  userId?: string
  title?: string
  subject?: string
  message?: string
  body?: string
  createdAtUtc?: string
  createdAt?: string
  isRead?: boolean
  read?: boolean
}

function normalizeNotification(payload: NotificationResponse): NotificationItem {
  return {
    id:
      payload.id ??
      (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
        ? crypto.randomUUID()
        : `notification-${Date.now()}`),
    userId: payload.userId ?? '',
    title: payload.title ?? payload.subject ?? 'Notification',
    message: payload.message ?? payload.body ?? '',
    createdAtUtc: payload.createdAtUtc ?? payload.createdAt ?? new Date().toISOString(),
    isRead: payload.isRead ?? payload.read ?? false,
  }
}

export async function getUserNotifications(userId: string): Promise<NotificationItem[]> {
  const response = await request<NotificationResponse[]>(
    `/api/notifications/user/${encodeURIComponent(userId)}`,
    { method: 'GET' },
    NOTIFICATION_API_BASE_URL,
  )

  return response.map(normalizeNotification)
}