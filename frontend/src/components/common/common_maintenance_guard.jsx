import { useState, useEffect, lazy, Suspense, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { useAuth } from '../../context/context_auth_context';
import api from '../../services/api';
import PageLoader from './common_loader';

// Lazy-load the maintenance page so it isn't bundled unless needed
const MaintenancePage = lazy(() => import('../../pages/public/public_maintenance'));

// Routes that are ALWAYS accessible, even during maintenance
const ALWAYS_ALLOWED = ['/maintenance', '/login'];

// How often to re-poll the maintenance status (ms)
const POLL_INTERVAL = 15_000;

export default function MaintenanceGuard({ children }) {
  const { user, isAuthenticated, loading: authLoading } = useAuth();
  const location = useLocation();

  const [maintenance, setMaintenance] = useState(null);
  const [checking, setChecking] = useState(true);
  const isMounted = useRef(true);

  useEffect(() => {
    isMounted.current = true;

    const checkMaintenance = async () => {
      try {
        const res = await api.get('/maintenance/status');
        if (res.data.success && isMounted.current) {
          setMaintenance(res.data);
        }
      } catch (err) {
        // Fail open — if the server can't be reached, don't block access
        console.warn('MaintenanceGuard: status check failed', err?.message);
        if (isMounted.current) setMaintenance(null);
      } finally {
        if (isMounted.current) setChecking(false);
      }
    };

    // Run immediately on every location change so navigation always re-checks
    setChecking(true);
    checkMaintenance();

    // Also poll every POLL_INTERVAL so live toggle takes effect quickly
    const interval = setInterval(checkMaintenance, POLL_INTERVAL);

    return () => {
      isMounted.current = false;
      clearInterval(interval);
    };
  }, [location.pathname]); // re-check on every navigation

  // ── Show loader while BOTH auth and maintenance status are resolving ───────
  if (checking || authLoading) return <PageLoader />;

  // ── If maintenance is NOT active, everything is normal ────────────────────
  if (!maintenance?.isEnabled) return children;

  // ── Maintenance IS active — check if this route is always allowed ─────────
  const isExcludedRoute = ALWAYS_ALLOWED.includes(location.pathname);
  if (isExcludedRoute) return children;

  // ── Check if the admin allowed public access (e.g. allowPublic flag) ──────
  if (maintenance?.allowPublic === true) return children;

  // ── Determine bypass eligibility for logged-in users ─────────────────────
  const userRole = (user?.role || '').toLowerCase();
  const isAdmin    = ['admin', 'priest'].includes(userRole);
  const isTechTeam = Boolean(user?.isTechnicalTeam) || userRole === 'staff';

  const canBypass =
    isAuthenticated &&
    (
      (isAdmin    && maintenance?.allowAdminLogin !== false) ||
      (isTechTeam && maintenance?.allowTechTeam   !== false)
    );

  // ── Privileged users (admin / tech-team) see the full site ───────────────
  if (canBypass) return children;

  // ── All other users — logged in OR anonymous — see the maintenance page ──
  return (
    <Suspense fallback={<PageLoader />}>
      <MaintenancePage />
    </Suspense>
  );
}
