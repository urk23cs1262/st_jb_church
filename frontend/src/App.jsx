import { Suspense, lazy } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './context/AuthContext';
import { NotificationProvider } from './context/NotificationContext';

import './i18n';
import PageLoader from './components/common/Loader';
import Layout from './components/common/Layout';
import ScrollToTop from './components/common/ScrollToTop';

// Lazy-loaded pages
const Home = lazy(() => import('./pages/public/Home'));
const About = lazy(() => import('./pages/public/About'));
const Priests = lazy(() => import('./pages/public/Priests'));
const MassTimings = lazy(() => import('./pages/public/MassTimings'));
const Events = lazy(() => import('./pages/public/Events'));
const Gallery = lazy(() => import('./pages/public/Gallery'));
const LiveStream = lazy(() => import('./pages/public/LiveStream'));
const Contact = lazy(() => import('./pages/public/Contact'));
const Donate = lazy(() => import('./pages/public/Donate'));
const BibleVerse = lazy(() => import('./pages/public/BibleVerse'));
const PrayerRequests = lazy(() => import('./pages/public/PrayerRequests'));
const Announcements = lazy(() => import('./pages/public/Announcements'));
const Rosary = lazy(() => import('./pages/public/Rosary'));
const CatholicCalendar = lazy(() => import('./pages/public/CatholicCalendar'));
const FAQ = lazy(() => import('./pages/public/FAQ'));
const ParishCouncil = lazy(() => import('./pages/public/ParishCouncil'));
const NearbyParishes = lazy(() => import('./pages/public/NearbyParishes'));


import AdminLayout from './components/admin/AdminLayout';

// Auth & Security pages
const Login = lazy(() => import('./pages/auth/Login'));
const Register = lazy(() => import('./pages/auth/Register'));
const ReportUnauthorized = lazy(() => import('./pages/security/ReportUnauthorized'));

// User dashboard
const UserDashboard = lazy(() => import('./pages/user/Dashboard'));
const UserBooking = lazy(() => import('./pages/user/Booking'));
const UserDocuments = lazy(() => import('./pages/user/Documents'));
const UserTickets = lazy(() => import('./pages/user/Tickets'));
const UserProfile = lazy(() => import('./pages/user/Profile'));
const UserSettings = lazy(() => import('./pages/user/Settings'));
const UserNotifications = lazy(() => import('./pages/user/Notifications'));


// Admin dashboard
const AdminDashboard = lazy(() => import('./pages/admin/Dashboard'));
const AdminUsers = lazy(() => import('./pages/admin/Users'));
const AdminPriests = lazy(() => import('./pages/admin/Priests'));
const AdminEvents = lazy(() => import('./pages/admin/Events'));
const AdminGallery = lazy(() => import('./pages/admin/GalleryAdmin'));
const AdminAnnouncements = lazy(() => import('./pages/admin/Announcements'));
const AdminBookings = lazy(() => import('./pages/admin/Bookings'));
const AdminDocuments = lazy(() => import('./pages/admin/Documents'));
const AdminDonations = lazy(() => import('./pages/admin/Donations'));
const AdminTickets = lazy(() => import('./pages/admin/Tickets'));
const AdminPrayers = lazy(() => import('./pages/admin/Prayers'));
const AdminSettings = lazy(() => import('./pages/admin/Settings'));
const AdminWhatsApp = lazy(() => import('./pages/admin/WhatsApp'));
const AdminNotifications = lazy(() => import('./pages/admin/Notifications'));

// Route guards
const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();
  const location = useLocation();
  if (loading) return <PageLoader />;
  if (!isAuthenticated) {
    const fullPath = location.pathname + location.search + location.hash;
    sessionStorage.setItem("redirectAfterLogin", fullPath);
    return <Navigate to={`/login?redirect=${encodeURIComponent(fullPath)}`} replace />;
  }
  return children;
};

const AdminRoute = ({ children }) => {
  const { isAuthenticated, isAdmin, loading } = useAuth();
  const location = useLocation();
  if (loading) return <PageLoader />;
  if (!isAuthenticated) {
    const fullPath = location.pathname + location.search + location.hash;
    sessionStorage.setItem("redirectAfterLogin", fullPath);
    return <Navigate to={`/login?redirect=${encodeURIComponent(fullPath)}`} replace />;
  }
  if (!isAdmin) return <Navigate to="/dashboard" replace />;
  return children;
};

function AppRoutes() {
  return (
    <BrowserRouter>
      <ScrollToTop />
      <Suspense fallback={<PageLoader />}>
        <Routes>
          {/* Public routes with layout */}
          <Route element={<Layout />}>
            <Route path="/" element={<Home />} />
            <Route path="/about" element={<About />} />
            <Route path="/priests" element={<Priests />} />
            <Route path="/mass-timings" element={<MassTimings />} />
            <Route path="/events" element={<Events />} />
            <Route path="/gallery" element={<Gallery />} />
            <Route path="/live" element={<LiveStream />} />
            <Route path="/contact" element={<Contact />} />
            <Route path="/donate" element={<Donate />} />
            <Route path="/bible-verse" element={<BibleVerse />} />
            <Route path="/prayer-requests" element={<PrayerRequests />} />
            <Route path="/announcements" element={<Announcements />} />
            <Route path="/rosary" element={<Rosary />} />
            <Route path="/calendar" element={<CatholicCalendar />} />
            <Route path="/faq" element={<FAQ />} />
            <Route path="/parish-council" element={<ParishCouncil />} />
            <Route path="/nearby-parishes" element={<NearbyParishes />} />

            {/* User dashboard routes */}
            <Route path="/dashboard" element={<ProtectedRoute><UserDashboard /></ProtectedRoute>} />
            <Route path="/dashboard/booking" element={<ProtectedRoute><UserBooking /></ProtectedRoute>} />
            <Route path="/dashboard/documents" element={<ProtectedRoute><UserDocuments /></ProtectedRoute>} />
            <Route path="/dashboard/tickets" element={<ProtectedRoute><UserTickets /></ProtectedRoute>} />
            <Route path="/dashboard/settings" element={<ProtectedRoute><UserSettings /></ProtectedRoute>} />
            <Route path="/dashboard/profile" element={<ProtectedRoute><UserSettings /></ProtectedRoute>} />
            <Route path="/dashboard/notifications" element={<ProtectedRoute><UserNotifications /></ProtectedRoute>} />

          </Route>

          {/* Auth & Security routes */}
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/security/report-unauthorized" element={<ReportUnauthorized />} />

          {/* Admin dashboard routes */}
          <Route path="/admin" element={<AdminRoute><AdminLayout /></AdminRoute>}>
            <Route index element={<AdminDashboard />} />
            <Route path="users" element={<AdminUsers />} />
            <Route path="priests" element={<AdminPriests />} />
            <Route path="events" element={<AdminEvents />} />
            <Route path="gallery" element={<AdminGallery />} />
            <Route path="announcements" element={<AdminAnnouncements />} />
            <Route path="bookings" element={<AdminBookings />} />
            <Route path="documents" element={<AdminDocuments />} />
            <Route path="donations" element={<AdminDonations />} />
            <Route path="tickets" element={<AdminTickets />} />
            <Route path="prayers" element={<AdminPrayers />} />
            <Route path="settings" element={<AdminSettings />} />
            <Route path="whatsapp" element={<AdminWhatsApp />} />
            <Route path="notifications" element={<AdminNotifications />} />
          </Route>

          {/* 404 */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <NotificationProvider>
        <AppRoutes />
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 4000,
            style: { background: '#1e3a8a', color: '#fff', borderRadius: '12px' },
            success: { iconTheme: { primary: '#d4a017', secondary: '#fff' } },
          }}
        />
      </NotificationProvider>
    </AuthProvider>
  );
}
