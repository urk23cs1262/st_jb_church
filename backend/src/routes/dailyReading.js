const express = require('express');
const axios = require('axios');
const cheerio = require('cheerio');

const router = express.Router();

// =====================================
// SIMPLE IN-MEMORY CACHE
// =====================================
const cache = {};

// =====================================
// GENERATE CATHOLIC GALLERY URL
// FORMAT: DDMMYY
// Example:
// 2026-05-08 -> 080526
// =====================================
function generateURL(dateStr) {
  const [year, month, day] = dateStr.split('-');

  const dd = String(day).padStart(2, '0');
  const mm = String(month).padStart(2, '0');
  const yy = String(year).slice(-2);

  return `https://www.catholicgallery.org/mass-reading/${dd}${mm}${yy}/`;
}

// =====================================
// CLEAN TEXT
// =====================================
function cleanText(text) {
  return text
    .replace(/\r/g, '')
    .replace(/\t/g, ' ')
    .replace(/\s+/g, ' ')
    
    // REMOVE ONLY THIS TEXT
    .replace(
      'New: Download our Official Catholic Gallery App for Android & iOS',
      ''
    )

    .trim();
}

// =====================================
// FETCH DAILY READING
// =====================================
async function fetchDailyReading(dateStr) {
  const url = generateURL(dateStr);

  const response = await axios.get(url, {
    timeout: 15000,
    headers: {
      'User-Agent':
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120 Safari/537.36',
      Accept:
        'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
    },
  });

  const $ = cheerio.load(response.data);

  // =====================================
  // PAGE TITLE
  // =====================================
  const title = cleanText(
    $('h1.entry-title, .entry-title, h1').first().text()
  );

  // =====================================
  // MAIN CONTENT
  // =====================================
  const content = $('.entry-content').first();

  const sections = [];

  let currentSection = null;

  // =====================================
  // LOOP THROUGH CONTENT ELEMENTS
  // =====================================
  content.children().each((_, el) => {
    const tag = el.tagName?.toLowerCase();

    const text = cleanText($(el).text());

    // SKIP EMPTY TEXT
    if (!text) return;

    // =====================================
    // DETECT SECTION HEADINGS
    // =====================================
    const isHeading =
      ['h2', 'h3', 'h4'].includes(tag) ||

      /^(first reading|second reading|responsorial psalm|psalm|alleluia|gospel|reading|acclamation)/i.test(
        text
      ) ||

      (
        tag === 'p' &&
        $(el).find('strong').length > 0 &&
        text.length < 200
      );

    // =====================================
    // CREATE NEW SECTION
    // =====================================
    if (isHeading) {

      // SAVE PREVIOUS SECTION
      if (currentSection) {
        sections.push(currentSection);
      }

      currentSection = {
        heading: text,
        paragraphs: [],
      };

    } else {

      // =====================================
      // ADD CONTENT PARAGRAPH
      // =====================================
      if (!currentSection) {
        currentSection = {
          heading: '',
          paragraphs: [],
        };
      }

      currentSection.paragraphs.push(text);
    }
  });

  // =====================================
  // PUSH LAST SECTION
  // =====================================
  if (
    currentSection &&
    (currentSection.heading || currentSection.paragraphs.length)
  ) {
    sections.push(currentSection);
  }

  // =====================================
  // LITURGICAL DAY
  // =====================================
  let liturgicalDay = '';
  const firstH2 = cleanText($('.entry-content h2').first().text());
  if (firstH2 && !/^(first reading|second reading|gospel|psalm|alleluia)/i.test(firstH2)) {
    liturgicalDay = firstH2;
  }

  // =====================================
  // CLEAN SECTIONS & REMOVE GARBAGE
  // =====================================
  const cleanedSections = sections.map(section => {
    // Filter out garbage paragraphs (ads, calendar, footer text)
    if (section.paragraphs) {
      let filteredParagraphs = section.paragraphs.filter(p => {
        const text = p.toLowerCase();
        if (text.includes('adslot_')) return false;
        if (text.includes('adsbygoogle')) return false;
        if (text.includes('the readings on this page are taken from')) return false;
        if (text.includes('◄') || text.includes('►')) return false;
        if (/sun\s*\d+\s*mon/.test(text)) return false;
        if (text.includes('archive 2026') || text.includes('archive 2027')) return false;
        return true;
      });

      // Split squashed verses into individual strings
      let splitVerses = [];
      filteredParagraphs.forEach(p => {
        // Split BEFORE a number like " 12 ", " 12a ", " 1 ", followed by a Capital letter
        const parts = p.split(/(?=(?:^|\s)\d{1,3}[a-z]?\s+[A-Z"'])/);
        parts.forEach(part => {
          const trimmed = part.trim();
          if (trimmed) splitVerses.push(trimmed);
        });
      });

      section.paragraphs = splitVerses;
    }
    return section;
  }).filter((section) => {
    // Exclude the liturgical day itself from the sections list
    if (section.heading === liturgicalDay) return false;
    
    // Valid sections MUST have a heading (e.g. "First Reading", "Gospel")
    // This removes the squashed summary text block that appears at the top without a heading
    if (!section.heading || section.heading.trim() === '') return false;

    // Valid sections must also have text paragraphs
    if (!section.paragraphs || section.paragraphs.length === 0) return false;

    return true;
  });

  // =====================================
  // LECTIONARY
  // =====================================
  const lectionary = cleanText(
    $('.cgLect').first().text()
  );

  // =====================================
  // RAW TEXT FALLBACK
  // =====================================
  const rawText = cleanText(
    content.text()
  ).substring(0, 15000);

  // =====================================
  // RETURN JSON
  // =====================================
  return {
    success: true,
    date: dateStr,
    title,
    liturgicalDay,
    lectionary,
    sections: cleanedSections,
    rawText,
    sourceUrl: url,
    fetchedAt: new Date().toISOString(),
  };
}

// =====================================
// TRANSLATION HELPER (GOOGLE TRANSLATE)
// =====================================
async function translateToTamil(text) {
  if (!text) return '';
  try {
    const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=en&tl=ta&dt=t&q=${encodeURIComponent(text)}`;
    const res = await axios.get(url);
    return res.data[0].map(x => x[0]).join('');
  } catch (error) {
    console.error('Translation error:', error.message);
    return text; // fallback to English
  }
}

async function translateReadingData(data) {
  const translated = JSON.parse(JSON.stringify(data));
  
  if (translated.title) translated.title = await translateToTamil(translated.title);
  if (translated.liturgicalDay) translated.liturgicalDay = await translateToTamil(translated.liturgicalDay);
  if (translated.lectionary) translated.lectionary = await translateToTamil(translated.lectionary);

  for (const section of translated.sections) {
    if (section.heading) {
      section.heading = await translateToTamil(section.heading);
    }
    if (section.paragraphs && section.paragraphs.length > 0) {
      for (let i = 0; i < section.paragraphs.length; i++) {
        section.paragraphs[i] = await translateToTamil(section.paragraphs[i]);
      }
    }
  }
  return translated;
}

// =====================================
// API ROUTE
// GET:
// /api/daily-reading
// /api/daily-reading?date=2026-05-08
// =====================================
router.get('/', async (req, res) => {
  try {

    // =====================================
    // TODAY DATE
    // =====================================
    const now = new Date();

    const todayKey = [
      now.getFullYear(),
      String(now.getMonth() + 1).padStart(2, '0'),
      String(now.getDate()).padStart(2, '0'),
    ].join('-');

    // =====================================
    // GET QUERY DATE
    // =====================================
    const dateStr = req.query.date || todayKey;

    const lang = req.query.lang || 'en';
    const cacheKey = lang === 'ta' ? `${dateStr}-ta` : dateStr;

    // =====================================
    // RETURN CACHE IF EXISTS
    // =====================================
    if (cache[cacheKey]) {
      return res.json({
        success: true,
        cached: true,
        data: cache[cacheKey],
      });
    }

    // =====================================
    // FETCH READING (Always fetch English first)
    // =====================================
    let data;
    if (cache[dateStr]) {
      data = cache[dateStr];
    } else {
      data = await fetchDailyReading(dateStr);
      cache[dateStr] = data; // Cache English version
    }

    // =====================================
    // TRANSLATE IF REQUESTED
    // =====================================
    let responseData = data;
    if (lang === 'ta') {
      responseData = await translateReadingData(data);
      cache[cacheKey] = responseData; // Cache Tamil version
    }

    // =====================================
    // RETURN RESPONSE
    // =====================================
    res.json({
      success: true,
      cached: false,
      data: responseData,
    });

  } catch (error) {

    console.error(
      'Catholic Gallery Fetch Error:',
      error.message
    );

    res.status(500).json({
      success: false,
      message: 'Failed to fetch Catholic daily readings',
      error: error.message,
    });
  }
});

module.exports = router;