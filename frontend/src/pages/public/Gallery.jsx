import churchLogo from '../../assets/image.png';
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { FiX, FiChevronLeft, FiChevronRight, FiGrid } from 'react-icons/fi';
import { GiChurch } from 'react-icons/gi';
import api from '../../services/api';
import { SectionLoader } from '../../components/common/Loader';
import PageHero from '../../components/common/PageHero';

const CATEGORIES = ['all', 'church', 'feast', 'events', 'priests', 'community', 'other'];

const DEMO_ITEMS = [
  { _id: '1', title: 'Church Exterior', category: 'church', imageUrl: 'https://images.unsplash.com/photo-1548625149-720754416438?w=800' },
  { _id: '2', title: 'Church Interior', category: 'church', imageUrl: 'https://images.unsplash.com/photo-1544931170-b5dc2e7c2c45?w=800' },
  { _id: '3', title: 'Feast Celebration', category: 'feast', imageUrl: 'https://images.unsplash.com/photo-1560019880-04bc31d9e9b4?w=800' },
  { _id: '4', title: 'Community Prayer', category: 'community', imageUrl: 'https://images.unsplash.com/photo-1609127386264-e2d86f0e4012?w=800' },
  { _id: '5', title: 'Holy Mass', category: 'events', imageUrl: 'https://images.unsplash.com/photo-1514320291840-2e0a9bf2a9ae?w=800' },
  { _id: '6', title: 'Youth Ministry', category: 'community', imageUrl: 'https://images.unsplash.com/photo-1529156069898-49953e39b3ac?w=800' },
];

export default function Gallery() {
  const { t } = useTranslation();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [category, setCategory] = useState('all');
  const [lightbox, setLightbox] = useState(null);

  useEffect(() => {
    const params = category !== 'all' ? `?category=${category}` : '';
    api.get(`/gallery${params}`).then(r => setItems(r.data.items?.length ? r.data.items : DEMO_ITEMS)).catch(() => setItems(DEMO_ITEMS)).finally(() => setLoading(false));
  }, [category]);

  const filtered = category === 'all' ? items : items.filter(i => i.category === category);

  const openLightbox = (idx) => setLightbox(idx);
  const closeLightbox = () => setLightbox(null);
  const prevImg = () => setLightbox(l => (l - 1 + filtered.length) % filtered.length);
  const nextImg = () => setLightbox(l => (l + 1) % filtered.length);

  useEffect(() => {
    const onKey = (e) => { if (lightbox === null) return; if (e.key === 'ArrowLeft') prevImg(); if (e.key === 'ArrowRight') nextImg(); if (e.key === 'Escape') closeLightbox(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [lightbox, filtered.length]);

  return (
    <div className="min-h-screen pt-10 bg-church-cream ">
      <PageHero title={<>{t('nav.gallery')}</>} subtitle={<>Visual Stories</>} />

      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4">
          {/* Filter */}
          <div className="flex gap-2 flex-wrap justify-center mb-10">
            {CATEGORIES.map(c => (
              <button key={c} onClick={() => setCategory(c)} className={`px-4 py-2 rounded-xl text-sm font-semibold capitalize transition-all ${category === c ? 'bg-church-gold text-white shadow-gold' : 'bg-white  text-gray-500 hover:bg-gold-50'}`}>
                {c === 'all' ? <FiGrid className="inline mr-1" /> : null}{c}
              </button>
            ))}
          </div>

          {loading ? <SectionLoader /> : (
            <motion.div layout className="columns-2 sm:columns-3 lg:columns-4 gap-4 space-y-4">
              {filtered.map((item, i) => (
                <motion.div
                  key={item._id}
                  layout
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: i * 0.05 }}
                  onClick={() => openLightbox(i)}
                  className="break-inside-avoid cursor-pointer group rounded-2xl overflow-hidden shadow-card hover:shadow-gold-lg transition-all duration-300"
                >
                  <div className="relative overflow-hidden">
                    <img src={item.imageUrl} alt={item.title} className="w-full object-cover group-hover:scale-110 transition-transform duration-500" />
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-all duration-300 flex items-end">
                      <p className="text-white text-sm font-semibold p-3 translate-y-full group-hover:translate-y-0 transition-transform duration-300">{item.title}</p>
                    </div>
                  </div>
                </motion.div>
              ))}
            </motion.div>
          )}
        </div>
      </section>

      {/* Lightbox */}
      <AnimatePresence>
        {lightbox !== null && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-black/95 flex items-center justify-center"
            onClick={closeLightbox}
          >
            <button onClick={(e) => { e.stopPropagation(); closeLightbox(); }} className="absolute top-4 right-4 text-white bg-white/10 p-2 rounded-full hover:bg-white/20 transition-all">
              <FiX className="text-xl" />
            </button>
            <button onClick={(e) => { e.stopPropagation(); prevImg(); }} className="absolute left-4 text-white bg-white/10 p-3 rounded-full hover:bg-white/20 transition-all">
              <FiChevronLeft className="text-2xl" />
            </button>
            <motion.img
              key={lightbox}
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              src={filtered[lightbox]?.imageUrl}
              alt={filtered[lightbox]?.title}
              className="max-h-[85vh] max-w-[90vw] object-contain rounded-2xl"
              onClick={(e) => e.stopPropagation()}
            />
            <button onClick={(e) => { e.stopPropagation(); nextImg(); }} className="absolute right-4 text-white bg-white/10 p-3 rounded-full hover:bg-white/20 transition-all">
              <FiChevronRight className="text-2xl" />
            </button>
            <p className="absolute bottom-4 text-white text-sm bg-black/50 px-4 py-2 rounded-full">
              {filtered[lightbox]?.title} — {lightbox + 1} / {filtered.length}
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
