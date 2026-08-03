import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Navbar from './Navbar';
import Footer from './Footer';
import VideoAdWidget from './VideoAdWidget';
import BirthdayCelebration from './BirthdayCelebration';

export default function Layout() {
  // Shared state: is the video ad widget in its open (visible) state?
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
    </div>
  );
}
