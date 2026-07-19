/**
 * Bible Verse Service
 * Fetches a daily Bible verse from bible-api.com (free, no key required)
 */
const axios = require('axios');
const DailyVerse = require('../models/DailyVerse');

// Popular verses pool - used as fallback when API fails
const FALLBACK_VERSES = [
  { ref: 'John 3:16', en: 'For God so loved the world, that he gave his only Son, that whoever believes in him should not perish but have eternal life.' },
  { ref: 'Philippians 4:13', en: 'I can do all things through Christ who strengthens me.' },
  { ref: 'Jeremiah 29:11', en: 'For I know the plans I have for you, declares the Lord, plans for welfare and not for evil, to give you a future and a hope.' },
  { ref: 'Psalm 23:1', en: 'The Lord is my shepherd; I shall not want.' },
  { ref: 'Romans 8:28', en: 'And we know that for those who love God all things work together for good, for those who are called according to his purpose.' },
  { ref: 'Proverbs 3:5', en: 'Trust in the Lord with all your heart, and do not lean on your own understanding.' },
  { ref: 'Matthew 6:33', en: 'But seek first the kingdom of God and his righteousness, and all these things will be added to you.' },
  { ref: 'Isaiah 40:31', en: 'But they who wait for the Lord shall renew their strength; they shall mount up with wings like eagles.' },
  { ref: '1 Corinthians 13:4', en: 'Love is patient and kind; love does not envy or boast; it is not arrogant.' },
  { ref: 'Psalm 46:1', en: 'God is our refuge and strength, a very present help in trouble.' },
];

async function fetchDailyVerse() {
  const today = new Date().toISOString().split('T')[0];

  // Check if we already fetched for today
  const existing = await DailyVerse.findOne({ date: today });
  if (existing && existing.verseTextEn) {
    return existing;
  }

  let verseRef = '';
  let verseTextEn = '';

  try {
    // Pick a verse based on day of year for variety
    const dayOfYear = Math.floor((new Date() - new Date(new Date().getFullYear(), 0, 0)) / 86400000);
    const fallback = FALLBACK_VERSES[dayOfYear % FALLBACK_VERSES.length];

    // Try fetching from bible-api.com
    const encoded = encodeURIComponent(fallback.ref);
    const res = await axios.get(`https://bible-api.com/${encoded}?translation=kjv`, { timeout: 8000 });
    if (res.data && res.data.text) {
      verseRef = res.data.reference || fallback.ref;
      verseTextEn = res.data.text.trim().replace(/\n/g, ' ');
    } else {
      throw new Error('Empty response');
    }
  } catch (err) {
    console.warn('⚠️ Bible API failed, using fallback verse:', err.message);
    const dayOfYear = Math.floor((new Date() - new Date(new Date().getFullYear(), 0, 0)) / 86400000);
    const fallback = FALLBACK_VERSES[dayOfYear % FALLBACK_VERSES.length];
    verseRef = fallback.ref;
    verseTextEn = fallback.en;
  }

  // Upsert into DB
  const verse = await DailyVerse.findOneAndUpdate(
    { date: today },
    { date: today, verseRef, verseTextEn, updatedAt: new Date() },
    { upsert: true, new: true }
  );

  console.log(`📖 Daily verse fetched: ${verseRef}`);
  return verse;
}

module.exports = { fetchDailyVerse };
