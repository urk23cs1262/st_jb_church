import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiX, FiMaximize2, FiChevronLeft } from 'react-icons/fi';

export default function VideoAdWidget() {
  const [isOpen, setIsOpen] = useState(true);
  const [isMaximized, setIsMaximized] = useState(false);
  const videoId = "i1dEoV-p03k";

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-0 z-[40] bg-white rounded-l-xl shadow-2xl border-y-2 border-l-2 border-gray-200 pl-3 pr-2 py-3 flex items-center justify-center text-church-royal-blue hover:bg-gray-50 transition-all hover:-translate-x-1"
        title="Open Video"
      >
        <FiChevronLeft className="text-2xl" />
      </button>
    );
  }

  if (isMaximized) {
    return (
      <div className="fixed inset-0 z-[100] bg-black/80 flex items-center justify-center p-4 backdrop-blur-sm">
        <div className="relative w-full max-w-4xl aspect-video bg-black rounded-xl overflow-hidden shadow-2xl">
          <button 
            onClick={() => setIsMaximized(false)}
            className="absolute top-4 right-4 z-10 w-10 h-10 bg-white/20 hover:bg-white/40 rounded-full flex items-center justify-center text-white transition-colors"
          >
            <FiX className="text-xl" />
          </button>
          <iframe 
            className="w-full h-full"
            src={`https://www.youtube.com/embed/${videoId}?autoplay=1`} 
            title="YouTube video player" 
            frameBorder="0" 
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
            allowFullScreen>
          </iframe>
        </div>
      </div>
    );
  }

  return (
    <AnimatePresence>
      <motion.div 
        initial={{ opacity: 0, y: 50, scale: 0.9 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
        className="fixed bottom-6 right-6 z-50 w-64 md:w-80 shadow-2xl rounded-xl overflow-hidden cursor-pointer border-2 border-church-gold"
        onClick={() => setIsMaximized(true)}
      >
        <button 
          onClick={(e) => { e.stopPropagation(); setIsOpen(false); }}
          className="absolute top-2 right-2 z-10 w-6 h-6 bg-black/50 hover:bg-black/80 rounded-full flex items-center justify-center text-white transition-colors"
        >
          <FiX className="text-sm" />
        </button>
        <div className="absolute inset-0 z-0 bg-black/20 group-hover:bg-transparent transition-colors flex items-center justify-center pointer-events-none">
          <FiMaximize2 className="text-white text-3xl opacity-0 group-hover:opacity-100 transition-opacity" />
        </div>
        <div className="aspect-video bg-black pointer-events-none">
          <iframe 
            className="w-full h-full pointer-events-none"
            src={`https://www.youtube.com/embed/${videoId}?autoplay=1&mute=1&controls=0`} 
            title="YouTube video player" 
            frameBorder="0" 
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture">
          </iframe>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
