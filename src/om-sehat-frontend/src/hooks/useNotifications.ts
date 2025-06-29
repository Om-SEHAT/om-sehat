import { useState } from 'react';
import type { Notification } from '../components/NotificationSystem';

// Hook for managing notifications
export const useNotifications = () => {
  const [notifications, setNotifications] = useState<Notification[]>([]);

  const addNotification = (notification: Omit<Notification, 'id'>) => {
    const id = Date.now().toString() + Math.random().toString(36).substr(2, 9);
    setNotifications(prev => [...prev, { ...notification, id }]);
  };

  const dismissNotification = (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  const clearAll = () => {
    setNotifications([]);
  };

  // Convenience methods
  const showSuccess = (title: string, message?: string, options?: Partial<Notification>) => {
    addNotification({ type: 'success', title, message, ...options });
  };

  const showError = (title: string, message?: string, options?: Partial<Notification>) => {
    addNotification({ type: 'error', title, message, ...options });
  };

  const showWarning = (title: string, message?: string, options?: Partial<Notification>) => {
    addNotification({ type: 'warning', title, message, ...options });
  };

  const showInfo = (title: string, message?: string, options?: Partial<Notification>) => {
    addNotification({ type: 'info', title, message, ...options });
  };

  return {
    notifications,
    addNotification,
    dismissNotification,
    clearAll,
    showSuccess,
    showError,
    showWarning,
    showInfo,
  };
};
