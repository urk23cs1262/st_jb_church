import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { FiX, FiExternalLink, FiInfo } from 'react-icons/fi';
import { useTranslation } from 'react-i18next';
import api from '../../services/api';

const FALLBACK_SAINT = {
  name: "St. John de Britto",
  description: "St. John de Britto (Arul Anandar) was a Portuguese Jesuit missionary and martyr who embraced Tamil culture and gave his life for his faith in 1693.",
  image: "https://upload.wikimedia.org/wikipedia/commons/thumb/b/bf/St._John_De_Britto.jpg/500px-St._John_De_Britto.jpg",
  link: "https://www.catholic.org/saints/saint.php?saint_id=4025"
};

export default function DailySaintTicker() {
  const { t, i18n } = useTranslation();
  const [saint, setSaint] = useState(FALLBACK_SAINT);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    api.get('/daily-saint')
      .then(res => {
        if (res.data.saint) setSaint(res.data.saint);
      })
      .catch(err => {
        console.error('Daily Saint Error, using fallback:', err);
        setSaint(FALLBACK_SAINT);
      });
  }, []);


  useEffect(() => {
    if (!showModal) return;

    const scrollY = window.scrollY;

    document.body.style.position = 'fixed';
    document.body.style.top = `-${scrollY}px`;
    document.body.style.left = '0';
    document.body.style.right = '0';
    document.body.style.width = '100%';
    document.body.style.overflow = 'hidden';

    return () => {
      document.body.style.position = '';
      document.body.style.top = '';
      document.body.style.left = '';
      document.body.style.right = '';
      document.body.style.width = '';
      document.body.style.overflow = '';

      window.scrollTo(0, scrollY);
    };
  }, [showModal]);

  if (!saint) return null;

  const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;
  const tickerDuration = isMobile ? 20 : 20;

  return (
    <>
      <div className="bg-church-gold/10 border-b border-church-gold/20 py-2 overflow-hidden relative">
        <div className="max-w-7xl mx-auto px-4 flex items-center">
          <button
            onClick={() => setShowModal(true)}
            className="flex-shrink-0 bg-church-gold text-white text-[10px] font-bold px-2 py-1 rounded mr-2 z-10 flex items-center gap-1 hover:bg-church-gold/90 transition-colors cursor-pointer uppercase tracking-wider"
          >
            <FiInfo className="text-xs" /> {t('home.dailySaintTitle', 'SAINT OF THE DAY')}
          </button>

          <div className="relative flex-1 overflow-hidden h-6">
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: '-100%' }}
              transition={{
                duration: tickerDuration,
                repeat: Infinity,
                ease: "linear"
              }}
              className="whitespace-nowrap absolute"
            >
              <button
                onClick={() => setShowModal(true)}
                className="text-white font-semibold hover:text-church-gold transition-colors flex items-center gap-2 cursor-pointer"
              >
                ✝️ {t('home.todaysSaint', "Today's Saint")}: <span className="font-bold">{saint.name}</span> — {saint.description.slice(0, 80)}... <span className="text-church-gold italic text-sm">({t('common.clickForDetails', 'Click for details')} →)</span>
              </button>
            </motion.div>
          </div>
        </div>
      </div>

      {createPortal(
        <AnimatePresence>
          {showModal && (
            <>
              {/* BACKDROP */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setShowModal(false)}
                className="fixed inset-0 bg-black/50 backdrop-blur-md z-[99998]"
              />

              {/* MODAL */}
              <div className="fixed inset-0 z-[99999]">
                <div className="absolute inset-0 flex items-center justify-center p-4">
                  <motion.div
                    initial={{ opacity: 0, scale: 0.92 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.92 }}
                    transition={{
                      duration: 0.25,
                      ease: "easeOut"
                    }}
                    className="
                      relative
                      w-full
                      max-w-5xl
                      bg-white
                      rounded-3xl
                      shadow-[0_20px_80px_rgba(0,0,0,0.5)]
                      overflow-hidden
                      max-h-[90vh]
                      md:max-h-[90vh]
                      md:h-[400px]
                      flex flex-col
                    "
                  >
                    {/* CLOSE */}
                    <button
                      onClick={() => setShowModal(false)}
                      className="
                        absolute
                        top-4
                        right-4
                        z-50
                        w-11
                        h-11
                        rounded-full
                        bg-white/90
                        hover:bg-white
                        shadow-lg
                        flex
                        items-center
                        justify-center
                        transition-all
                      "
                    >
                      <FiX className="text-2xl text-gray-700" />
                    </button>

                    <div className="flex flex-col md:flex-row flex-1 overflow-y-auto md:overflow-hidden">
                      {/* IMAGE */}
                      {saint.image && (
                        <div className="w-full md:w-1/2 relative h-[250px] sm:h-[300px] md:h-full flex-shrink-0">
                          <img
                            src={saint.image}
                            alt={saint.name}
                            className="absolute inset-0 w-full h-full object-cover"
                          />

                          <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />

                          <div className="absolute bottom-8 left-8 text-white">
                            <p className="text-church-gold uppercase tracking-[0.35em] text-sm mb-3">
                              {t('home.dailySaintTitle', 'Saint of the Day')}
                            </p>

                            <h2 className="text-4xl md:text-5xl font-bold font-display leading-tight">
                              {saint.name}
                            </h2>
                          </div>
                        </div>
                      )}

                      {/* CONTENT */}
                      <div className="flex-1 p-6 md:p-10 overflow-y-visible md:overflow-y-auto">
                        <div className="mb-6">
                          <p className="text-xs uppercase tracking-[0.3em] text-gray-400 font-bold mb-2">
                            {t('booking.feastDay', 'Feast Day')}
                          </p>

                          <p className="text-2xl font-bold text-church-gold capitalize">
                            {new Date().toLocaleDateString(i18n.language === 'ta' ? 'ta-IN' : 'en-GB', {
                              weekday: 'long',
                              day: 'numeric',
                              month: 'long',
                              year: 'numeric'
                            })}
                          </p>
                        </div>

                        <div className="text-gray-600 leading-relaxed text-lg mb-4">
                          <p>{saint.description}</p>
                        </div>

                        <a
                          href={saint.link}
                          target="_blank"
                          rel="noreferrer"
                          className="
                            flex
                            items-center
                            justify-center
                            gap-3
                            py-3
                            rounded-2xl
                            bg-church-royal-blue
                            text-white
                            font-bold
                            text-lg
                            hover:bg-church-royal-blue/90
                            transition-all
                            shadow-xl
                          "
                        >
                          <FiExternalLink />
                          {t('common.readFullHistory', 'Read Full History')}
                        </a>
                      </div>
                    </div>
                  </motion.div>
                </div>
              </div>
            </>
          )}
        </AnimatePresence>,
        document.body
      )}
    </>
  );
}
