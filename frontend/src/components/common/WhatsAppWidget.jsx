import { motion, AnimatePresence } from 'framer-motion';
import { FiMessageCircle } from 'react-icons/fi';

// Church WhatsApp number — update this to the actual church number
const WHATSAPP_NUMBER = '917639520006'; // Format: country code + number (no +)
const WHATSAPP_MESSAGE = encodeURIComponent('HI\n\n🙏 SJDB Connect\nConnecting Faith & Community');

export default function WhatsAppWidget({ videoAdOpen = false }) {
  // When video ad is open → z-[55] (above ad's z-50)
  // When video ad is closed → z-[35] (below ad's z-40 collapsed state)
  const zIndex = videoAdOpen ? 'z-[55]' : 'z-[35]';

  return (
    <AnimatePresence>
      <motion.div
        key="whatsapp-widget"
        initial={{ opacity: 0, scale: 0.5, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ delay: 0.5, type: 'spring', stiffness: 200, damping: 18 }}
        className={`fixed bottom-6 left-6 ${zIndex} transition-[z-index]`}
      >
        {/* Ripple rings */}
        <span className="absolute inset-0 rounded-full bg-[#25D366] animate-ping opacity-30" />
        <span className="absolute inset-0 rounded-full bg-[#25D366] animate-ping opacity-20 [animation-delay:0.4s]" />

        {/* Main button */}
        <motion.a
          href={`https://wa.me/${WHATSAPP_NUMBER}?text=${WHATSAPP_MESSAGE}`}
          target="_blank"
          rel="noopener noreferrer"
          whileHover={{ scale: 1.12 }}
          whileTap={{ scale: 0.93 }}
          className="relative w-14 h-14 rounded-full bg-[#25D366] shadow-[0_4px_24px_rgba(37,211,102,0.55)] flex items-center justify-center text-white transition-shadow hover:shadow-[0_6px_32px_rgba(37,211,102,0.75)]"
          title="Chat with SJDB Connect 🙏"
          aria-label="Open WhatsApp chat"
        >
          {/* WhatsApp SVG icon */}
          <svg
            viewBox="0 0 32 32"
            className="w-8 h-8 fill-white"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path d="M16.002 2.667C8.638 2.667 2.667 8.638 2.667 16c0 2.352.637 4.654 1.844 6.659L2.667 29.333l6.887-1.804A13.28 13.28 0 0 0 16.002 29.333C23.365 29.333 29.333 23.362 29.333 16S23.365 2.667 16.002 2.667zm0 24.267a11.02 11.02 0 0 1-5.617-1.538l-.402-.24-4.09 1.072 1.09-3.98-.261-.41A10.973 10.973 0 0 1 5.002 16C5.002 9.924 9.925 5 16.002 5S27 9.924 27 16s-4.923 10.934-10.998 10.934zm6.024-8.193c-.33-.165-1.951-.962-2.254-1.072-.303-.11-.524-.165-.744.165-.22.33-.853 1.072-1.046 1.293-.193.22-.386.248-.716.083-.33-.165-1.393-.513-2.653-1.636-.98-.874-1.642-1.955-1.834-2.285-.193-.33-.021-.508.145-.672.15-.148.33-.385.495-.578.165-.193.22-.33.33-.55.11-.22.055-.413-.028-.578-.083-.165-.744-1.793-1.02-2.455-.269-.644-.542-.557-.745-.567l-.634-.011c-.22 0-.578.082-.88.413s-1.155 1.128-1.155 2.75.1183 3.188 1.347 4.482c1.227 1.293 3.5 4.041 8.483 5.516.754.216 1.341.345 1.799.44.756.16 1.444.138 1.988.084.606-.06 1.951-.797 2.226-1.568.276-.77.276-1.43.193-1.568-.082-.137-.303-.22-.634-.385z" />
          </svg>
        </motion.a>

        {/* Tooltip label */}
        <motion.div
          initial={{ opacity: 0, x: -8 }}
          whileHover={{ opacity: 1, x: 0 }}
          className="absolute left-16 top-1/2 -translate-y-1/2 bg-gray-900 text-white text-xs font-semibold px-3 py-1.5 rounded-lg whitespace-nowrap shadow-lg pointer-events-none opacity-0 group-hover:opacity-100"
        >
          Chat with us 🙏
          <span className="absolute right-full top-1/2 -translate-y-1/2 border-4 border-transparent border-r-gray-900" />
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
