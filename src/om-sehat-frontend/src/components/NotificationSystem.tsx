import { useEffect } from 'react';
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
        return <CheckCircle style={{ width: '1.25rem', height: '1.25rem' }} />;
      case 'error':
        return <XCircle style={{ width: '1.25rem', height: '1.25rem' }} />;
      case 'warning':
        return <AlertCircle style={{ width: '1.25rem', height: '1.25rem' }} />;
      case 'info':
        return <Info style={{ width: '1.25rem', height: '1.25rem' }} />;
      default:
        return <Info style={{ width: '1.25rem', height: '1.25rem' }} />;
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
        <X style={{ width: '1rem', height: '1rem' }} />
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
  const containerStyle: React.CSSProperties = {
    position: 'fixed',
    zIndex: 50,
    width: '100%',
    maxWidth: '24rem',
    ...getPositionStyles(position)
  };

  function getPositionStyles(pos: string): React.CSSProperties {
    switch (pos) {
      case 'top-right':
        return { top: '1rem', right: '1rem' };
      case 'top-left':
        return { top: '1rem', left: '1rem' };
      case 'bottom-right':
        return { bottom: '1rem', right: '1rem' };
      case 'bottom-left':
        return { bottom: '1rem', left: '1rem' };
      case 'top-center':
        return { top: '1rem', left: '50%', transform: 'translateX(-50%)' };
      default:
        return { top: '1rem', right: '1rem' };
    }
  }

  if (notifications.length === 0) return null;

  return (
    <div style={containerStyle}>
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



export default NotificationContainer;