import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { MdNotifications } from 'react-icons/md';
import { FiFilter } from 'react-icons/fi';
import api from '../../services/api';
import { SectionLoader } from '../../components/common/Loader';
import PageHero from '../../components/common/PageHero';

const TYPES = ['all', 'general', 'feast', 'funeral', 'marriage', 'emergency', 'meeting'];

const typeColors = {
  general: 'badge-blue', feast: 'badge-gold', funeral: 'badge-gray',
  marriage: 'badge-green', emergency: 'badge-red', meeting: 'badge-gold',
};

export default function Announcements() {
  const { t } = useTranslation();
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [type, setType] = useState('all');

  useEffect(() => {
    setLoading(true);
    const params = type !== 'all' ? `?type=${type}` : '';
    api.get(`/announcements${params}`).then(r => setAnnouncements(r.data.announcements || [])).catch(() => {}).finally(() => setLoading(false));
  }, [type]);

  return (
    <div className="min-h-screen pt-20 bg-church-cream ">
      <PageHero title={<>{t('nav.announcements')}</>} subtitle={<>Parish News</>} />

      <section className="py-16">
        <div className="max-w-4xl mx-auto px-4">
          {/* Filters */}
          <div className="flex gap-2 flex-wrap mb-8 items-center">
            <FiFilter className="text-gray-400" />
            {TYPES.map(tp => (
              <button key={tp} onClick={() => setType(tp)} className={`px-4 py-2 rounded-xl text-sm font-semibold capitalize transition-all ${type === tp ? 'bg-church-gold text-white' : 'bg-white  text-gray-500 hover:bg-gold-50'}`}>{tp}</button>
            ))}
          </div>

          {loading ? <SectionLoader /> : announcements.length === 0 ? (
            <div className="text-center py-20 text-gray-400">
              <MdNotifications className="text-6xl mx-auto mb-4 opacity-30" />
              <p>{t('common.noData')}</p>
            </div>
          ) : (
            <div className="space-y-5">
              {announcements.map((ann, i) => (
                <motion.div
                  key={ann._id}
                  initial={{ opacity: 0, y: 15 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.07 }}
                  className={`church-card ${ann.priority === 'urgent' ? 'border-l-4 border-red-500' : ann.priority === 'high' ? 'border-l-4 border-church-gold' : ''}`}
                >
                  <div className="flex items-start justify-between gap-4 mb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-church-gradient flex items-center justify-center flex-shrink-0">
                        <MdNotifications className="text-white" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-800 ">{ann.title}</h3>
                        <p className="text-xs text-gray-400">{new Date(ann.createdAt).toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
                      </div>
                    </div>
                    <div className="flex gap-2 flex-shrink-0">
                      <span className={`badge ${typeColors[ann.type] || 'badge-gray'} capitalize`}>{ann.type}</span>
                      {ann.priority !== 'low' && <span className={`badge ${ann.priority === 'urgent' ? 'badge-red' : ann.priority === 'high' ? 'badge-gold' : 'badge-blue'} capitalize`}>{ann.priority}</span>}
                    </div>
                  </div>
                  <p className="text-gray-600  text-sm leading-relaxed pl-13">{ann.content}</p>
                  {ann.attachment && (
                    <a href={ann.attachment} target="_blank" rel="noreferrer" className="inline-block mt-3 text-church-gold text-sm hover:underline">📎 View Attachment</a>
                  )}
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
