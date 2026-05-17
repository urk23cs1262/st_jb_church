import { motion, AnimatePresence } from 'framer-motion';
import { FiX, FiHeadphones } from 'react-icons/fi';
import { Link } from 'react-router-dom';
import { createPortal } from 'react-dom';

export default function RosaryModal({ isOpen, onClose, t, rosaryAudio }) {
  if (!isOpen) return null;

  return createPortal(
    <AnimatePresence>
      <div className="fixed inset-0 z-[9999] flex items-center justify-center px-4 overflow-hidden">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-black/70 backdrop-blur-md"
        />
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          className="relative bg-church-cream w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden border border-church-gold/30"
        >
          <div className="bg-church-royal-blue p-6 text-center text-white relative">
            <button
              onClick={onClose}
              className="absolute top-4 right-4 text-white/70 hover:text-white p-2 rounded-full hover:bg-white/10 transition-all"
            >
              <FiX className="text-xl" />
            </button>
            <div className="w-16 h-16 bg-church-gold rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg rotate-3 group">
              <FiHeadphones className="text-white text-3xl group-hover:scale-110 transition-transform" />
            </div>
            <h3 className="font-display text-2xl font-bold mb-1">
               Rosary Audio
            </h3>
            <p className="text-gold-400/80 text-sm font-tamil">ஜெபமாலை ஆடியோ</p>
          </div>

          <div className="p-8">
            <div className="glass-card p-6 border-t-4 border-church-gold bg-white/50 mb-6">
              <div className="flex items-center justify-center gap-3 mb-6">
                <div className="w-2 h-2 rounded-full bg-church-gold animate-ping" />
                <span className="text-sm font-bold text-church-royal-blue uppercase tracking-widest">Now Playing</span>
              </div>

              <audio
                autoPlay
                controls
                className="w-full h-12 custom-audio-player"
              >
                <source src={rosaryAudio} type="audio/mpeg" />
              </audio>

              <div className="mt-6 flex flex-col items-center gap-1">
                <p className="text-xs text-gray-500 font-medium uppercase tracking-[0.2em]">Tamil Audio Guide</p>
                <p className="text-sm font-tamil text-church-royal-blue font-bold">மகிழ்ச்சி நிறை இரகசியங்கள்</p>
              </div>
            </div>

            <Link
              to="/rosary"
              onClick={onClose}
              className="w-full flex items-center justify-center gap-2 py-4 bg-church-royal-blue text-white rounded-2xl font-bold hover:bg-church-royal-blue/90 transition-all shadow-lg text-center"
            >
              View Full Prayer Guide
            </Link>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>,
    document.body
  );
}
