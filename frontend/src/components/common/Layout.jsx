import { Outlet } from 'react-router-dom';
import Navbar from './Navbar';
import Footer from './Footer';
import VideoAdWidget from './VideoAdWidget';
import BirthdayCelebration from './BirthdayCelebration';

export default function Layout() {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <BirthdayCelebration />
      <main className="flex-1">
        <Outlet />
      </main>
      <Footer />
      <VideoAdWidget />
    </div>
  );
}
