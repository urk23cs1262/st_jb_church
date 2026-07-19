import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Navbar from './Navbar';
import Footer from './Footer';
import VideoAdWidget from './VideoAdWidget';
import WhatsAppWidget from './WhatsAppWidget';
import BirthdayCelebration from './BirthdayCelebration';

export default function Layout() {
  // Shared state: is the video ad widget in its open (visible) state?
  // Passed into VideoAdWidget so it can notify us, and into WhatsAppWidget so it adjusts z-index.
  const [videoAdOpen, setVideoAdOpen] = useState(true);

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <BirthdayCelebration />
      <main className="flex-1">
        <Outlet />
      </main>
      <Footer />

      {/* Video ad — notifies Layout when its open state changes */}
      <VideoAdWidget onOpenChange={setVideoAdOpen} />

      {/* WhatsApp widget — rises above video ad when ad is open */}
      <WhatsAppWidget videoAdOpen={videoAdOpen} />
    </div>
  );
}
