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
        return <CheckCircle className="h-5 w-5 text-green-600" />;
      case 'error':
        return <XCircle className="h-5 w-5 text-red-600" />;
      case 'warning':
        return <AlertCircle className="h-5 w-5 text-yellow-600" />;
      case 'info':
        return <Info className="h-5 w-5 text-blue-600" />;
      default:
        return <Info className="h-5 w-5 text-gray-600" />;
    }
  };

  const getStyles = () => {
    switch (type) {
      case 'success':
        return 'bg-green-50 border-green-200 text-green-800';
      case 'error':
        return 'bg-red-50 border-red-200 text-red-800';
      case 'warning':
        return 'bg-yellow-50 border-yellow-200 text-yellow-800';
      case 'info':
        return 'bg-blue-50 border-blue-200 text-blue-800';
      default:
        return 'bg-gray-50 border-gray-200 text-gray-800';
    }
  };

  return (
    <div
      className={`p-4 border rounded-lg shadow-sm animate-slideInDown ${getStyles()}`}
      role="alert"
      aria-live={type === 'error' ? 'assertive' : 'polite'}
    >
      <div className="flex items-start gap-3">
        {getIcon()}
        <div className="flex-1 min-w-0">
          <div className="font-medium">{title}</div>
          {message && (
            <div className="text-sm mt-1 opacity-90">{message}</div>
          )}
        </div>
        <button
          onClick={() => onDismiss(id)}
          className="text-current opacity-60 hover:opacity-100 transition-opacity p-1"
          aria-label="Tutup notifikasi"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
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
    switch (position) {
      case 'top-right':
        return 'top-4 right-4';
      case 'top-left':
        return 'top-4 left-4';
      case 'bottom-right':
        return 'bottom-4 right-4';
      case 'bottom-left':
        return 'bottom-4 left-4';
      case 'top-center':
        return 'top-4 left-1/2 transform -translate-x-1/2';
      default:
        return 'top-4 right-4';
    }
  };

  if (notifications.length === 0) return null;

  return (
    <div className={`fixed z-50 space-y-2 w-full max-w-sm ${getPositionStyles()}`}>
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
