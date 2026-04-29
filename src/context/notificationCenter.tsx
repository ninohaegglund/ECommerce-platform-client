import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import { getUserNotifications } from '../services/notificationsApi'
import type { NotificationItem } from '../types/notification'

const WELCOME_NOTIFICATION_FLAG_KEY = 'pendingWelcomeNotificationUserId'

type NotificationCenterContextValue = {
  notifications: NotificationItem[]
  unreadCount: number
  isLoading: boolean
  error: string
  refreshNotifications: () => Promise<void>
  markNotificationAsRead: (id: string) => void
  markAllNotificationsAsRead: () => void
}

const NotificationCenterContext = createContext<NotificationCenterContextValue | undefined>(
  undefined,
)

type NotificationCenterProviderProps = {
  userId: string
  children: ReactNode
}

export function NotificationCenterProvider({ userId, children }: NotificationCenterProviderProps) {
  const [notifications, setNotifications] = useState<NotificationItem[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')

  const refreshNotifications = useCallback(async () => {
    if (!userId) {
      setNotifications([])
      setError('')
      return
    }

    setIsLoading(true)
    setError('')

    try {
      const freshNotifications = await getUserNotifications(userId)
      const pendingWelcomeUserId = sessionStorage.getItem(WELCOME_NOTIFICATION_FLAG_KEY)
      const shouldAddWelcome = pendingWelcomeUserId === userId

      setNotifications((current) => {
        const readIds = new Set(
          current.filter((notification) => notification.isRead).map((notification) => notification.id),
        )

        const serverNotifications = freshNotifications.map((notification) => ({
          ...notification,
          isRead: readIds.has(notification.id) ? true : notification.isRead,
        }))

        if (!shouldAddWelcome) {
          return serverNotifications
        }

        const welcomeNotification: NotificationItem = {
          id:
            typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
              ? crypto.randomUUID()
              : `welcome-${Date.now()}`,
          userId,
          title: 'Welcome to NovaCart',
          message: 'Your account is ready. Start exploring products and place your first order.',
          createdAtUtc: new Date().toISOString(),
          isRead: false,
        }

        return [welcomeNotification, ...serverNotifications]
      })

      if (shouldAddWelcome) {
        sessionStorage.removeItem(WELCOME_NOTIFICATION_FLAG_KEY)
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Could not load notifications.'
      setError(message)
    } finally {
      setIsLoading(false)
    }
  }, [userId])

  useEffect(() => {
    void refreshNotifications()
  }, [refreshNotifications])

  const markNotificationAsRead = useCallback((id: string) => {
    setNotifications((current) =>
      current.map((notification) =>
        notification.id === id ? { ...notification, isRead: true } : notification,
      ),
    )
  }, [])

  const markAllNotificationsAsRead = useCallback(() => {
    setNotifications((current) => current.map((notification) => ({ ...notification, isRead: true })))
  }, [])

  const unreadCount = useMemo(
    () => notifications.filter((notification) => !notification.isRead).length,
    [notifications],
  )

  const value = useMemo(
    () => ({
      notifications,
      unreadCount,
      isLoading,
      error,
      refreshNotifications,
      markNotificationAsRead,
      markAllNotificationsAsRead,
    }),
    [
      error,
      isLoading,
      markAllNotificationsAsRead,
      markNotificationAsRead,
      notifications,
      refreshNotifications,
      unreadCount,
    ],
  )

  return (
    <NotificationCenterContext.Provider value={value}>
      {children}
    </NotificationCenterContext.Provider>
  )
}

export function useNotificationCenter() {
  const context = useContext(NotificationCenterContext)

  if (!context) {
    throw new Error('useNotificationCenter must be used within NotificationCenterProvider.')
  }

  return context
}