import { createContext, useContext, type ReactNode } from 'react';
import { useNotifications } from '../hooks/useNotifications';

type NotificationContextType = ReturnType<typeof useNotifications> | null;

const NotificationContext = createContext<NotificationContextType>(null);

interface NotificationProviderProps {
  children: ReactNode;
}

export const NotificationProvider = ({ children }: NotificationProviderProps) => {
  const notifications = useNotifications();

  return (
    <NotificationContext.Provider value={notifications}>
      {children}
    </NotificationContext.Provider>
  );
};

// eslint-disable-next-line react-refresh/only-export-components
export const useNotificationContext = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotificationContext must be used within a NotificationProvider');
  }
  return context;
};
