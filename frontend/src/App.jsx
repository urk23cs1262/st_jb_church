import { Suspense, lazy } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './context/AuthContext';

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

// Auth pages
const Login = lazy(() => import('./pages/auth/Login'));
const Register = lazy(() => import('./pages/auth/Register'));

// User dashboard
const UserDashboard = lazy(() => import('./pages/user/Dashboard'));
const UserBooking = lazy(() => import('./pages/user/Booking'));
const UserDocuments = lazy(() => import('./pages/user/Documents'));
const UserTickets = lazy(() => import('./pages/user/Tickets'));
const UserProfile = lazy(() => import('./pages/user/Profile'));

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
const AdminRegistrations = lazy(() => import('./pages/admin/Registrations'));
const AdminPrayers = lazy(() => import('./pages/admin/Prayers'));

// Route guards
const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();
  if (loading) return <PageLoader />;
  return isAuthenticated ? children : <Navigate to="/login" replace />;
};

const AdminRoute = ({ children }) => {
  const { isAuthenticated, isAdmin, loading } = useAuth();
  if (loading) return <PageLoader />;
  if (!isAuthenticated) return <Navigate to="/login" replace />;
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
            {/* User dashboard routes */}
            <Route path="/dashboard" element={<ProtectedRoute><UserDashboard /></ProtectedRoute>} />
            <Route path="/dashboard/booking" element={<ProtectedRoute><UserBooking /></ProtectedRoute>} />
            <Route path="/dashboard/documents" element={<ProtectedRoute><UserDocuments /></ProtectedRoute>} />
            <Route path="/dashboard/tickets" element={<ProtectedRoute><UserTickets /></ProtectedRoute>} />
            <Route path="/dashboard/profile" element={<ProtectedRoute><UserProfile /></ProtectedRoute>} />
          </Route>

          {/* Auth routes */}
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />

          {/* Admin dashboard routes */}
          <Route path="/admin" element={<AdminRoute><AdminDashboard /></AdminRoute>} />
          <Route path="/admin/users" element={<AdminRoute><AdminUsers /></AdminRoute>} />
          <Route path="/admin/priests" element={<AdminRoute><AdminPriests /></AdminRoute>} />
          <Route path="/admin/events" element={<AdminRoute><AdminEvents /></AdminRoute>} />
          <Route path="/admin/gallery" element={<AdminRoute><AdminGallery /></AdminRoute>} />
          <Route path="/admin/announcements" element={<AdminRoute><AdminAnnouncements /></AdminRoute>} />
          <Route path="/admin/bookings" element={<AdminRoute><AdminBookings /></AdminRoute>} />
          <Route path="/admin/documents" element={<AdminRoute><AdminDocuments /></AdminRoute>} />
          <Route path="/admin/donations" element={<AdminRoute><AdminDonations /></AdminRoute>} />
          <Route path="/admin/tickets" element={<AdminRoute><AdminTickets /></AdminRoute>} />
          <Route path="/admin/registrations" element={<AdminRoute><AdminRegistrations /></AdminRoute>} />
          <Route path="/admin/prayers" element={<AdminRoute><AdminPrayers /></AdminRoute>} />

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
      <AppRoutes />
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 4000,
          style: { background: '#1e3a8a', color: '#fff', borderRadius: '12px' },
          success: { iconTheme: { primary: '#d4a017', secondary: '#fff' } },
        }}
      />
    </AuthProvider>
  );
}
