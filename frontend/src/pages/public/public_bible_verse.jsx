import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { GiSpellBook, GiCrucifix } from 'react-icons/gi';
import { FiChevronLeft, FiChevronRight, FiExternalLink, FiShare2, FiCalendar, FiRefreshCw, FiHome, FiType, FiImage, FiDownload } from 'react-icons/fi';
import { FaWhatsapp } from 'react-icons/fa';
import toast from 'react-hot-toast';
import * as htmlToImage from 'html-to-image';
import downloadjs from 'downloadjs';
import PageHero from '../../components/common/common_page_hero';
import api from '../../services/api';


// ── Date helpers — always use LOCAL time, never UTC ────────────────────────
function localDateKey(date = new Date()) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function addDays(dateStr, n) {
  const [y, m, d] = dateStr.split('-').map(Number);
  const dt = new Date(y, m - 1, d); // local midnight — no UTC shift
  dt.setDate(dt.getDate() + n);
  return localDateKey(dt);
}

function formatDisplay(dateStr) {
  const [y, m, d] = dateStr.split('-').map(Number);
  return new Date(y, m - 1, d).toLocaleDateString('en-IN', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
  });
}

// ── Section colour chips ───────────────────────────────────────────────────
const sectionColor = (heading = '') => {
  const h = heading.toLowerCase();
  if (h.includes('first reading')) return 'bg-blue-600';
  if (h.includes('second reading')) return 'bg-indigo-600';
  if (h.includes('psalm')) return 'bg-purple-600';
  if (h.includes('alleluia') || h.includes('acclamation')) return 'bg-amber-500';
  if (h.includes('gospel')) return 'bg-church-maroon';
  return 'bg-church-royal-blue';
};

// ── Main component ─────────────────────────────────────────────────────────
export default function BibleVerse() {
  const { i18n } = useTranslation();
  const isTamil = i18n.language === 'ta';
  const dateInputRef = useRef(null);

  // Daily verse from API (same source as admin dashboard)
  const [dailyVerseData, setDailyVerseData] = useState(null);
  const [verseLoading, setVerseLoading] = useState(true);

  useEffect(() => {
    api.get('/daily-verse')
      .then(res => {
        if (res.data.success) setDailyVerseData(res.data);
      })
      .catch(e => console.error('Failed to load daily verse:', e))
      .finally(() => setVerseLoading(false));
  }, []);

  // Normalise to a single shape used throughout the JSX
  const verse = dailyVerseData
    ? {
        ref: dailyVerseData.reference,
        en: dailyVerseData.english,
        ta: dailyVerseData.tamil || dailyVerseData.english,
        category: dailyVerseData.category
      }
    : null;

  // Catholic Gallery live readings
  const today = localDateKey();
  const [date, setDate] = useState(today);
  const [reading, setReading] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Local language state specifically for the reading
  const [readingLang, setReadingLang] = useState(isTamil ? 'ta' : 'en');

  // Sync with global language if it changes
  useEffect(() => {
    setReadingLang(isTamil ? 'ta' : 'en');
  }, [isTamil]);

  const fetchReading = async (d, lang) => {
    setLoading(true);
    setError(null);
    setReading(null);
    try {
      const res = await api.get(`/daily-reading?date=${d}&lang=${lang}`);
      if (res.data.success) setReading(res.data.data);
      else setError(res.data.message || 'Failed to load reading');
    } catch {
      setError('Unable to connect to server');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchReading(date, readingLang); }, [date, readingLang]);

  const isToday = date === today;
  const goToPrev = () => setDate(prev => addDays(prev, -1));
  const goToNext = () => {
    const next = addDays(date, 1);
    if (next <= today) setDate(next);
  };
  const goToday = () => setDate(today);

  const verseCardRef = useRef(null);

  const shareVerse = () => {
    if (!verse) return;
    let text = `📖 *Daily Verse / தினசரி விவிலிய வசனம்*\n\n`;
    if (verse.en) {
      text += `"${verse.en}"\n`;
    }
    if (verse.ta && verse.ta !== verse.en) {
      text += `\n"${verse.ta}"\n`;
    }
    text += `\n— ${verse.ref}`;
    window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`, '_blank');
  };

  const downloadVerseImage = async () => {
    if (!verseCardRef.current) return;
    try {
      toast.loading('Generating image...', { id: 'img-gen' });
      const dataUrl = await htmlToImage.toPng(verseCardRef.current, { quality: 0.95, cacheBust: true });
      downloadjs(dataUrl, 'daily-verse.png');
      toast.success('Image downloaded!', { id: 'img-gen' });
    } catch (err) {
      console.error(err);
      toast.error('Failed to generate image', { id: 'img-gen' });
    }
  };



  const shareReading = async () => {
    const url = reading?.sourceUrl || 'https://www.catholicgallery.org/';
    const text = `📖 Catholic Daily Mass Reading — ${formatDisplay(date)}\n${url}`;
    if (navigator.share) {
      try {
        await navigator.share({ title: 'Daily Mass Reading', text, url });
      } catch (err) {
        // User probably cancelled the share dialogue, fallback to clipboard
        navigator.clipboard.writeText(url);
        toast.success('Link copied to clipboard!');
      }
    } else {
      navigator.clipboard.writeText(url);
      toast.success('Link copied to clipboard!');
    }
  };

  const whatsappReading = () => {
    if (!reading) return;

    let text = `📖 *${reading.title || 'Daily Mass Reading'}*\n📅 ${formatDisplay(date)}\n`;
    if (reading.liturgicalDay) text += `⛪ ${reading.liturgicalDay}\n`;
    if (reading.lectionary) text += `📜 ${reading.lectionary}\n`;
    text += `\n`;

    if (reading.sections && reading.sections.length > 0) {
      reading.sections.forEach(section => {
        if (section.heading) {
          text += `*${section.heading}*\n`;
        }
        if (section.paragraphs && section.paragraphs.length > 0) {
          section.paragraphs.forEach(p => {
            text += `${p}\n`;
          });
        }
        text += `\n`; // gap after completion
      });
    } else if (reading.rawText) {
      text += `${reading.rawText}\n\n`;
    }

    window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(text.trim())}`, '_blank');
  };

  return (
    <div className="min-h-screen pt-10 bg-church-cream">
      <PageHero title={<>Daily Mass Readings</>} subtitle={<>God's Word</>} />

      <section className="py-16">
        <div className="max-w-4xl mx-auto px-4">

          {/* ── Featured Daily Verse (from /daily-verse API) ──────────── */}
          <motion.div
            key="daily-verse"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="mb-14 relative"
          >
            {/* The actual element to capture as image */}
            <div ref={verseCardRef} className="glass-card p-10 text-center relative overflow-hidden bg-white">
              <GiSpellBook className="text-church-gold/10 text-[200px] absolute -right-10 -top-10 pointer-events-none" />
              <div className="relative z-10">
                <p className="section-subtitle mb-2">Daily Bible Verse</p>

                {verseLoading ? (
                  /* Loading skeleton */
                  <div className="space-y-3 animate-pulse py-4">
                    <div className="h-4 bg-gray-200 rounded-full w-3/4 mx-auto" />
                    <div className="h-4 bg-gray-200 rounded-full w-5/6 mx-auto" />
                    <div className="h-4 bg-gray-200 rounded-full w-2/3 mx-auto" />
                    <div className="h-5 bg-amber-100 rounded-full w-1/3 mx-auto mt-4" />
                  </div>
                ) : verse ? (
                  <>
                    {verse.category && (
                      <span className="inline-block bg-amber-100 text-amber-900 border border-amber-300/80 font-bold text-xs px-3.5 py-1 rounded-full mb-4 shadow-xs">
                        {verse.category}
                      </span>
                    )}
                    {verse.en && (
                      <blockquote className="text-2xl md:text-3xl text-gray-800 font-serif italic leading-relaxed mb-4">
                        "{verse.en}"
                      </blockquote>
                    )}
                    {verse.ta && verse.ta !== verse.en && (
                      <p className="text-xl md:text-2xl text-church-royal-blue font-tamil font-bold italic mb-6 leading-relaxed">
                        "{verse.ta}"
                      </p>
                    )}
                    <p className="text-church-gold font-bold text-lg">— {verse.ref}</p>
                  </>
                ) : (
                  <p className="text-gray-400 italic py-6">No verse available for today.</p>
                )}
              </div>
            </div>

            {verse && !verseLoading && (
              <div className="flex gap-3 justify-center mt-4 flex-wrap relative z-20">
                {/* Share Button (Direct to WhatsApp) */}
                <button onClick={shareVerse} className="btn-gold text-sm flex items-center gap-2">
                  <FaWhatsapp className="text-lg" /> Share
                </button>

                {/* Download Image Button */}
                <button
                  onClick={downloadVerseImage}
                  className="btn-gold text-sm flex items-center gap-2"
                  title="Download as Image"
                >
                  <FiDownload /> Download
                </button>
              </div>
            )}
          </motion.div>

          {/* ── Section header ────────────────────────────────────────── */}
          <div className="mb-6 flex flex-col md:flex-row md:items-end justify-between gap-4">
            <div>
              {/* <p className="section-subtitle mb-1">Catholic Gallery</p> */}
              <h2 className="section-title">Daily Mass Readings</h2>
            </div>

            {/* Action Buttons */}
                <div className="flex items-center gap-2 px-5 py-2.5">
                  <button onClick={whatsappReading} className="btn-gold"><FaWhatsapp /> WhatsApp</button>
                  {/* <button onClick={shareReading} className="btn-outline-gold hover:shadow-gold transition-all"><FiShare2 /> Share</button> */}
                  <button onClick={() => fetchReading(date, readingLang)} className="btn-outline-gold hover:shadow-gold transition-all">
                    <FiRefreshCw className={loading ? "animate-spin" : ""} /> Refresh
                  </button>
                </div>

            {/* Translate Button */}
            <button
              onClick={() => setReadingLang(prev => prev === 'en' ? 'ta' : 'en')}
              className="flex items-center gap-2 px-5 py-2.5 bg-white/60 hover:bg-white rounded-full text-sm font-bold text-church-royal-blue shadow-sm transition-all border border-blue-200 hover:shadow-md"
            >
              <FiRefreshCw className={loading ? "animate-spin text-church-gold" : "text-church-gold"} />
              {readingLang === 'en' ? 'தமிழில் காண்க' : 'View in English'}
            </button>
          </div>

          {/* ── Date Navigator ────────────────────────────────────────── */}
          <div className="glass-card p-4 mb-8">
            <div className="flex items-center justify-between">
              {/* Prev */}
              <button
                onClick={goToPrev}
                className="w-10 h-10 rounded-full bg-church-gradient text-white flex items-center justify-center hover:scale-110 transition-transform shadow-gold flex-shrink-0"
              >
                <FiChevronLeft className="text-xl" />
              </button>

              {/* Date label */}
              <div className="text-center px-3">
                <div
                  onClick={() => dateInputRef.current?.showPicker()}
                  className="relative flex items-center gap-2 justify-center text-church-gold font-semibold text-sm md:text-base cursor-pointer hover:bg-yellow-50 px-3 py-1.5 rounded-lg transition-colors group"
                >
                  <FiCalendar className="group-hover:scale-110 transition-transform" />
                  <span>{formatDisplay(date)}</span>
                  <input
                    ref={dateInputRef}
                    type="date"
                    value={date}
                    max={today}
                    onChange={(e) => {
                      if (e.target.value) setDate(e.target.value);
                    }}
                    className="absolute bottom-0 left-1/2 w-0 h-0 opacity-0 pointer-events-none"
                    title="Select a date"
                  />
                </div>
                {/* Today badge + go-to-today link */}
                <div className="flex items-center justify-center gap-3 mt-1">
                  {isToday
                    ? <span className="text-xs font-bold text-green-600 bg-green-100 px-2 py-0.5 rounded-full">Today</span>
                    : (
                      <button
                        onClick={goToday}
                        className="text-xs text-church-gold hover:underline flex items-center gap-1"
                      >
                        <FiHome className="text-xs" /> Go to Today
                      </button>
                    )
                  }
                </div>
              </div>

              {/* Next */}
              <button
                onClick={goToNext}
                disabled={isToday}
                className={`w-10 h-10 rounded-full flex items-center justify-center transition-all flex-shrink-0 ${isToday
                  ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                  : 'bg-church-gradient text-white hover:scale-110 shadow-gold'
                  }`}
              >
                <FiChevronRight className="text-xl" />
              </button>
            </div>
          </div>

          {/* ── Reading Content ───────────────────────────────────────── */}
          <AnimatePresence mode="wait">

            {/* Loading */}
            {loading && (
              <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                className="glass-card p-16 text-center">
                <GiCrucifix className="text-church-gold text-5xl mx-auto mb-4 animate-pulse" />
                <p className="text-gray-500 text-lg">Loading Mass readings…</p>
                <p className="text-gray-400 text-sm mt-1">Fetching from Catholic Gallery</p>
              </motion.div>
            )}

            {/* Error */}
            {error && !loading && (
              <motion.div key="error" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                className="glass-card p-10 text-center">
                <GiSpellBook className="text-gray-300 text-5xl mx-auto mb-4" />
                <p className="text-gray-500 mb-2">{error}</p>
                <p className="text-gray-400 text-sm mb-6">Could not fetch readings for this date.</p>
                <div className="flex gap-3 justify-center flex-wrap">
                  <button onClick={() => fetchReading(date)} className="btn-gold"><FiRefreshCw /> Try Again</button>
                  <a href="https://www.catholicgallery.org/mass-reading/" target="_blank" rel="noreferrer" className="btn-outline-gold">
                    <FiExternalLink /> Open Catholic Gallery
                  </a>
                </div>
              </motion.div>
            )}

            {/* Success */}
            {reading && !loading && (
              <motion.div key={date} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>

                {/* Page Title Banner */}
                {reading.title && (
                  <div className="bg-church-royal-blue text-white rounded-2xl px-6 py-4 mb-6 text-center shadow-royal">
                    <p className="font-semibold text-lg md:text-xl leading-relaxed">{reading.title}</p>
                    {(reading.liturgicalDay || reading.lectionary) && (
                      <div className="mt-2 pt-2 border-t border-white/20 text-sm text-blue-100 flex flex-col md:flex-row justify-center items-center gap-1 md:gap-4 font-medium">
                        {reading.liturgicalDay && <span>{reading.liturgicalDay}</span>}
                        {reading.liturgicalDay && reading.lectionary && <span className="hidden md:inline text-blue-300">•</span>}
                        {reading.lectionary && <span>{reading.lectionary}</span>}
                      </div>
                    )}
                  </div>
                )}

                {/* Reading Sections with verse content */}
                {reading.sections?.length > 0 ? (
                  <div className="space-y-6">
                    {reading.sections.map((section, i) => (
                      <motion.div key={i} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.07 }} className="glass-card p-6">

                        {/* Section heading */}
                        {section.heading && (
                          <div className="flex items-start gap-3 mb-4 pb-3 border-b border-gray-100">
                            <div className={`w-8 h-8 rounded-full ${sectionColor(section.heading)} flex items-center justify-center flex-shrink-0 shadow-gold`}>
                              <GiCrucifix className="text-white text-xs" />
                            </div>
                            <h3 className="font-bold text-church-royal-blue text-base md:text-lg leading-snug">{section.heading}</h3>
                          </div>
                        )}

                        {/* Verse / reading paragraphs */}
                        {section.paragraphs?.length > 0 ? (
                          <div className="space-y-2 pl-11">
                            {section.paragraphs.map((p, j) => (
                              <p key={j} className="text-gray-700 leading-relaxed text-sm md:text-base">{p}</p>
                            ))}
                          </div>
                        ) : (
                          <p className="text-gray-400 text-sm pl-11 italic">No text content available for this section.</p>
                        )}
                      </motion.div>
                    ))}
                  </div>
                ) : reading.rawText ? (
                  <div className="glass-card p-6">
                    <p className="text-gray-700 leading-relaxed text-sm whitespace-pre-line">{reading.rawText}</p>
                  </div>
                ) : (
                  <div className="glass-card p-10 text-center">
                    <GiSpellBook className="text-church-gold text-5xl mx-auto mb-4" />
                    <p className="text-gray-500">No reading content found for this date.</p>
                  </div>
                )}

                
              </motion.div>
            )}

          </AnimatePresence>
        </div>
      </section>
    </div>
  );
}
