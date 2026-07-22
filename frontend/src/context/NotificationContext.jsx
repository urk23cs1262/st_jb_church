import { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import api from '../services/api';
import { useAuth } from './AuthContext';

const NotificationContext = createContext(null);

export const NotificationProvider = ({ children }) => {
  const { isAuthenticated, isAdmin } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [adminNotifications, setAdminNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [adminUnreadCount, setAdminUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const pollInterval = useRef(null);

  const fetchUserNotifications = useCallback(async () => {
    try {
      const res = await api.get('/notifications');
      setNotifications(res.data.notifications || []);
      const count = (res.data.notifications || []).filter(n => !n.isRead).length;
      setUnreadCount(count);
    } catch { /* silent */ }
  }, []);

  const fetchAdminNotifications = useCallback(async () => {
    try {
      const res = await api.get('/notifications/admin');
      setAdminNotifications(res.data.notifications || []);
      const count = (res.data.notifications || []).filter(n => !n.isRead).length;
      setAdminUnreadCount(count);
    } catch { /* silent */ }
  }, []);

  const refetch = useCallback(async () => {
    if (!isAuthenticated) return;
    setLoading(true);
    try {
      await fetchUserNotifications();
      if (isAdmin) await fetchAdminNotifications();
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated, isAdmin, fetchUserNotifications, fetchAdminNotifications]);

  // Initial load + polling every 60 seconds
  useEffect(() => {
    if (!isAuthenticated) {
      setNotifications([]);
      setAdminNotifications([]);
      setUnreadCount(0);
      setAdminUnreadCount(0);
      if (pollInterval.current) clearInterval(pollInterval.current);
      return;
    }

    refetch();
    pollInterval.current = setInterval(refetch, 60000);
    return () => clearInterval(pollInterval.current);
  }, [isAuthenticated, refetch]);

  const markRead = async (id) => {
    try {
      await api.put(`/notifications/${id}/read`);
      setNotifications(prev => prev.map(n => n._id === id ? { ...n, isRead: true } : n));
      setAdminNotifications(prev => prev.map(n => n._id === id ? { ...n, isRead: true } : n));
      setUnreadCount(prev => Math.max(0, prev - 1));
      setAdminUnreadCount(prev => Math.max(0, prev - 1));
    } catch { /* silent */ }
  };

  const markAllRead = async () => {
    try {
      await api.put('/notifications/read-all');
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
      setUnreadCount(0);
    } catch { /* silent */ }
  };

  const markAllAdminRead = async () => {
    try {
      await api.put('/notifications/admin/read-all');
      setAdminNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
      setAdminUnreadCount(0);
    } catch { /* silent */ }
  };

  const deleteNotification = async (id) => {
    try {
      await api.delete(`/notifications/${id}`);
      const notif = notifications.find(n => n._id === id) || adminNotifications.find(n => n._id === id);
      setNotifications(prev => prev.filter(n => n._id !== id));
      setAdminNotifications(prev => prev.filter(n => n._id !== id));
      if (notif && !notif.isRead) {
        setUnreadCount(prev => Math.max(0, prev - 1));
      }
    } catch { /* silent */ }
  };

  const deleteAll = async () => {
    try {
      await api.delete('/notifications/delete-all');
      setNotifications(prev => prev.filter(n => n.isPinned));
      setUnreadCount(0);
    } catch { /* silent */ }
  };

  const togglePin = async (id) => {
    try {
      const res = await api.put(`/notifications/${id}/pin`);
      setNotifications(prev => prev.map(n => n._id === id ? { ...n, isPinned: res.data.isPinned } : n));
      setAdminNotifications(prev => prev.map(n => n._id === id ? { ...n, isPinned: res.data.isPinned } : n));
    } catch { /* silent */ }
  };

  return (
    <NotificationContext.Provider value={{
      notifications,
      adminNotifications,
      unreadCount,
      adminUnreadCount,
      loading,
      markRead,
      markAllRead,
      markAllAdminRead,
      deleteNotification,
      deleteAll,
      togglePin,
      refetch,
    }}>
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotifications = () => {
  const ctx = useContext(NotificationContext);
  if (!ctx) throw new Error('useNotifications must be used within NotificationProvider');
  return ctx;
};
