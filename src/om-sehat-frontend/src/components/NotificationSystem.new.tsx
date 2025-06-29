import { useState, useEffect } from 'react';
import { CheckCircle, XCircle, AlertCircle, Info, X } from 'lucide-react';

export type NotificationType = 'success' | 'error' | 'warning' | 'info';

export interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  message?: string;
  duration?: number;
  persistent?: boolean;
}

interface NotificationItemProps {
  notification: Notification;
  onDismiss: (id: string) => void;
}

const NotificationItem = ({ notification, onDismiss }: NotificationItemProps) => {
  const { id, type, title, message, duration = 5000, persistent = false } = notification;

  useEffect(() => {
    if (!persistent && duration > 0) {
      const timer = setTimeout(() => {
        onDismiss(id);
      }, duration);

      return () => clearTimeout(timer);
    }
  }, [id, duration, persistent, onDismiss]);

  const getIcon = () => {
    switch (type) {
      case 'success':
        return <CheckCircle className="h-5 w-5" />;
      case 'error':
        return <XCircle className="h-5 w-5" />;
      case 'warning':
        return <AlertCircle className="h-5 w-5" />;
      case 'info':
        return <Info className="h-5 w-5" />;
      default:
        return <Info className="h-5 w-5" />;
    }
  };

  return (
    <div
      className={`notification ${type} animate-slideInDown`}
      role="alert"
      aria-live={type === 'error' ? 'assertive' : 'polite'}
    >
      <div className="notification-icon">
        {getIcon()}
      </div>
      <div className="notification-content">
        <div className="notification-title">{title}</div>
        {message && (
          <div className="notification-message">{message}</div>
        )}
      </div>
      <button
        onClick={() => onDismiss(id)}
        className="notification-close"
        aria-label="Tutup notifikasi"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
};

interface NotificationContainerProps {
  notifications: Notification[];
  onDismiss: (id: string) => void;
  position?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left' | 'top-center';
}

export const NotificationContainer = ({ 
  notifications, 
  onDismiss, 
  position = 'top-right' 
}: NotificationContainerProps) => {
  const getPositionStyles = () => {
    const baseStyles = 'fixed z-50 w-full max-w-sm';
    switch (position) {
      case 'top-right':
        return `${baseStyles} top-4 right-4`;
      case 'top-left':
        return `${baseStyles} top-4 left-4`;
      case 'bottom-right':
        return `${baseStyles} bottom-4 right-4`;
      case 'bottom-left':
        return `${baseStyles} bottom-4 left-4`;
      case 'top-center':
        return `${baseStyles} top-4 left-1/2 transform -translate-x-1/2`;
      default:
        return `${baseStyles} top-4 right-4`;
    }
  };

  if (notifications.length === 0) return null;

  return (
    <div className={getPositionStyles()}>
      {notifications.map((notification) => (
        <NotificationItem
          key={notification.id}
          notification={notification}
          onDismiss={onDismiss}
        />
      ))}
    </div>
  );
};

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

export default NotificationContainer;
