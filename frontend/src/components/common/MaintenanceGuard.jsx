import { useState, useEffect } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import { FiAlertTriangle, FiX } from 'react-icons/fi';

export default function MaintenanceGuard({ children }) {
  const { user, isAuthenticated, loading: authLoading } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const [maintenance, setMaintenance] = useState(null);
  const [checking, setChecking] = useState(true);
  const [bannerDismissed, setBannerDismissed] = useState(false);

  useEffect(() => {
    let isMounted = true;

    const checkMaintenance = async () => {
      try {
        const res = await api.get('/maintenance/status');
        if (res.data.success && isMounted) {
          setMaintenance(res.data);
        }
      } catch (err) {
        console.error('MaintenanceGuard status check failed:', err);
      } finally {
        if (isMounted) setChecking(false);
      }
    };

    checkMaintenance();

    const interval = setInterval(checkMaintenance, 30 * 1000); // Check every 30s
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [location.pathname]);

  // Determine bypass eligibility
  const userRole = (user?.role || '').toLowerCase();
  const isAdmin = ['admin', 'priest'].includes(userRole);
  const isTechTeam = Boolean(user?.isTechnicalTeam) || (userRole === 'staff');

  const canBypass = isAuthenticated && (
    (isAdmin && maintenance?.allowAdminLogin !== false) ||
    (isTechTeam && maintenance?.allowTechTeam !== false)
  );

  const isExcludedRoute = ['/maintenance', '/login'].includes(location.pathname);

  // Redirect non-tech / non-admin users to /maintenance when active
  useEffect(() => {
    if (!checking && !authLoading && maintenance?.isEnabled) {
      if (!canBypass && !isExcludedRoute) {
        navigate('/maintenance', { replace: true });
      }
    }
  }, [checking, authLoading, maintenance, canBypass, isExcludedRoute, navigate]);

  return children;
}
