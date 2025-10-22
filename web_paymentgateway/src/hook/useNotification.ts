import { useState, useCallback } from 'react';

export type NotificationType = 'success' | 'error' | 'warning' | 'info';

interface NotificationState {
  isVisible: boolean;
  type: NotificationType;
  message: string;
}

export function useNotification() {
  const [notification, setNotification] = useState<NotificationState>({
    isVisible: false,
    type: 'success',
    message: '',
  });

  const showNotification = useCallback((type: NotificationType, message: string) => {
    setNotification({
      isVisible: true,
      type,
      message,
    });
  }, []);

  const hideNotification = useCallback(() => {
    setNotification(prev => ({ ...prev, isVisible: false }));
  }, []);

  return {
    notification,
    showNotification,
    hideNotification,
  };
}