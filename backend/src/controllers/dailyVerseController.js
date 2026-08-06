const DailyVerse = require('../models/DailyVerse');
const DEFAULT_VERSES = require('../data/defaultVerses');
const axios = require('axios');

// Helper to compute Day of Year (1 - 366)
function getDayOfYear(date = new Date()) {
  const start = new Date(date.getFullYear(), 0, 0);
  return Math.floor((date - start) / 86400000);
}

// Helper to drop stale legacy date_1 index from MongoDB
async function dropLegacyIndexes() {
  try {
    await DailyVerse.collection.dropIndex('date_1');
    console.log('🧹 Dropped legacy date_1 index on dailyverses collection');
  } catch (e) {
    // Ignore if index doesn't exist
  }
}

// Seed default dataset if collection is empty
async function ensureDefaultVerses() {
  await dropLegacyIndexes();
  const count = await DailyVerse.countDocuments();
  if (count === 0) {
    console.log('📖 Seeding default Daily Bible Verses dataset...');
    await DailyVerse.insertMany(DEFAULT_VERSES);
  }
}

// Helper to get today date string e.g. "2026-08-06"
function getTodayDateStr() {
  const d = new Date();
  return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
}

// Helper to fetch today's verse data
const getTodayVerseData = async () => {
  await ensureDefaultVerses();
  const total = await DailyVerse.countDocuments();
  const dayOfYear = getDayOfYear();
  const todayDateStr = getTodayDateStr();

  let verse = null;

  // Check if admin override exists for today
  try {
    const SiteSettings = require('../models/SiteSettings');
    const overrideSetting = await SiteSettings.findOne({ key: 'today_verse_override' }).lean();
    if (overrideSetting && overrideSetting.value) {
      const parsed = JSON.parse(overrideSetting.value);
      if (parsed && (parsed.date === todayDateStr || parsed.date === 'manual' || parsed.persistent !== false)) {
        if (parsed.verseMongoId) {
          verse = await DailyVerse.findById(parsed.verseMongoId);
        }
        if (!verse && parsed.id) {
          verse = await DailyVerse.findOne({ id: Number(parsed.id) });
        }
      }
    }
  } catch (e) {
    // Ignore parse error
  }

  if (!verse) {
    const targetId = total > 0 ? (((dayOfYear - 1) % total) + 1) : 1;
    verse = await DailyVerse.findOne({ id: targetId });
    if (!verse) {
      verse = await DailyVerse.findOne();
    }
  }

  // Dynamic fetch if English text is missing
  if (verse && !verse.verseTextEn) {
    try {
      const encoded = encodeURIComponent(verse.ref);
      const apiRes = await axios.get(`https://bible-api.com/${encoded}?translation=kjv`, { timeout: 6000 });
      if (apiRes.data && apiRes.data.text) {
        verse.verseTextEn = apiRes.data.text.trim().replace(/\n/g, ' ');
        await verse.save();
      }
    } catch (err) {
      console.warn(`⚠️ Could not auto-fetch text for ${verse.ref}:`, err.message);
    }
  }

  return {
    id: verse?.id || 1,
    ref: verse?.ref || 'John 3:16',
    reference: verse?.ref || 'John 3:16',
    english: verse?.verseTextEn || 'For God so loved the world...',
    verseTextEn: verse?.verseTextEn || 'For God so loved the world...',
    tamil: verse?.verseTextTa || '',
    verseTextTa: verse?.verseTextTa || '',
    category: verse?.category || 'General',
    dayOfYear,
    totalVerses: total
  };
};

// GET /api/daily-verse or GET /api/site-settings/daily-verses/today (Public)
const getTodayVerse = async (req, res) => {
  try {
    const data = await getTodayVerseData();
    res.json({
      success: true,
      ...data
    });
  } catch (err) {
    console.error('Failed to get today verse:', err);
    res.status(500).json({ success: false, message: err.message });
  }
};

// GET /api/site-settings/daily-verses (Admin)
const getAllVerses = async (req, res) => {
  try {
    await ensureDefaultVerses();
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const search = req.query.search || '';

    const filter = {};
    if (search) {
      filter.$or = [
        { ref: { $regex: search, $options: 'i' } },
        { category: { $regex: search, $options: 'i' } },
        { verseTextEn: { $regex: search, $options: 'i' } }
      ];
    }

    const total = await DailyVerse.countDocuments(filter);
    const totalCount = await DailyVerse.countDocuments();
    const verses = await DailyVerse.find(filter)
      .sort({ id: 1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean();

    const latestVerse = await DailyVerse.findOne().sort({ updatedAt: -1 }).lean();

    res.json({
      success: true,
      verses,
      total,
      totalCount,
      page,
      pages: Math.ceil(total / limit),
      lastUpdated: latestVerse?.updatedAt || new Date()
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// POST /api/site-settings/daily-verses/upload (Admin)
const uploadVerses = async (req, res) => {
  try {
    let rawItems = [];

    if (req.file) {
      const content = req.file.buffer.toString('utf-8');
      if (req.file.originalname.endsWith('.csv') || req.file.mimetype.includes('csv')) {
        // Parse CSV
        const lines = content.split(/\r?\n/).filter(l => l.trim());
        if (lines.length < 2) {
          return res.status(400).json({ success: false, message: 'CSV file must have headers and data rows' });
        }
        const headers = lines[0].split(',').map(h => h.trim().toLowerCase().replace(/^["']|["']$/g, ''));
        for (let i = 1; i < lines.length; i++) {
          const cols = lines[i].split(',').map(c => c.trim().replace(/^["']|["']$/g, ''));
          if (cols.length >= 2) {
            const obj = {};
            headers.forEach((h, idx) => { obj[h] = cols[idx] || ''; });
            rawItems.push({
              id: Number(obj.id) || i,
              ref: obj.ref || obj.reference || cols[1] || cols[0],
              category: obj.category || 'General',
              verseTextEn: obj.versetexten || obj.english || obj.text || '',
              verseTextTa: obj.versetextta || obj.tamil || ''
            });
          }
        }
      } else {
        // Parse JSON
        const parsed = JSON.parse(content);
        rawItems = Array.isArray(parsed) ? parsed : (parsed.verses || []);
      }
    } else if (req.body.verses) {
      rawItems = Array.isArray(req.body.verses) ? req.body.verses : JSON.parse(req.body.verses);
    } else if (Array.isArray(req.body)) {
      rawItems = req.body;
    }

    if (!rawItems || rawItems.length === 0) {
      return res.status(400).json({ success: false, message: 'No valid verse items found in uploaded file' });
    }

    const cleanVerses = rawItems.map((item, idx) => ({
      id: Number(item.id || item.day) || (idx + 1),
      ref: item.ref || item.reference || `Verse ${idx + 1}`,
      category: item.category || 'General',
      verseTextEn: item.verseTextEn || item.en || item.english || item.text || '',
      verseTextTa: item.verseTextTa || item.ta || item.tamil || ''
    }));

    await dropLegacyIndexes();
    await DailyVerse.deleteMany({});
    const inserted = await DailyVerse.insertMany(cleanVerses);

    res.json({
      success: true,
      count: inserted.length,
      message: `Successfully imported ${inserted.length} daily Bible verses!`
    });
  } catch (err) {
    console.error('Failed to upload verses:', err);
    res.status(500).json({ success: false, message: err.message });
  }
};

// POST /api/site-settings/daily-verses (Admin - Add Single Verse)
const createVerse = async (req, res) => {
  try {
    const { ref, category, verseTextEn, verseTextTa } = req.body;
    if (!ref) return res.status(400).json({ success: false, message: 'Verse reference is required' });

    const maxDoc = await DailyVerse.findOne().sort({ id: -1 }).lean();
    const nextId = (maxDoc?.id || 0) + 1;

    const newVerse = await DailyVerse.create({
      id: nextId,
      ref: ref.trim(),
      category: category ? category.trim() : 'General',
      verseTextEn: verseTextEn ? verseTextEn.trim() : '',
      verseTextTa: verseTextTa ? verseTextTa.trim() : ''
    });

    res.json({ success: true, verse: newVerse, message: 'Verse added successfully' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// PUT /api/site-settings/daily-verses/:id (Admin - Edit Verse)
const updateVerse = async (req, res) => {
  try {
    const { id } = req.params;
    const { ref, category, verseTextEn, verseTextTa } = req.body;

    let verse = await DailyVerse.findOne({ $or: [{ id: Number(id) || -1 }, { _id: id }] });
    if (!verse) {
      return res.status(404).json({ success: false, message: 'Verse not found' });
    }

    if (ref) verse.ref = ref.trim();
    if (category !== undefined) verse.category = category.trim();
    if (verseTextEn !== undefined) verse.verseTextEn = verseTextEn.trim();
    if (verseTextTa !== undefined) verse.verseTextTa = verseTextTa.trim();

    await verse.save();
    res.json({ success: true, verse, message: 'Verse updated successfully' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// DELETE /api/site-settings/daily-verses/:id (Admin - Delete Verse)
const deleteVerse = async (req, res) => {
  try {
    const { id } = req.params;
    const deleted = await DailyVerse.findOneAndDelete({ $or: [{ id: Number(id) || -1 }, { _id: id }] });
    if (!deleted) {
      return res.status(404).json({ success: false, message: 'Verse not found' });
    }
    res.json({ success: true, message: 'Verse deleted successfully' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// GET /api/site-settings/daily-verses/export (Admin)
const exportVerses = async (req, res) => {
  try {
    const format = (req.query.format || 'json').toLowerCase();
    const verses = await DailyVerse.find().sort({ id: 1 }).lean();

    if (format === 'csv') {
      let csv = 'id,ref,category,verseTextEn,verseTextTa\n';
      verses.forEach(v => {
        const ref = `"${(v.ref || '').replace(/"/g, '""')}"`;
        const cat = `"${(v.category || '').replace(/"/g, '""')}"`;
        const en = `"${(v.verseTextEn || '').replace(/"/g, '""')}"`;
        const ta = `"${(v.verseTextTa || '').replace(/"/g, '""')}"`;
        csv += `${v.id},${ref},${cat},${en},${ta}\n`;
      });

      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename=daily_verses.csv');
      return res.send(csv);
    }

    // Default JSON export
    const cleanVerses = verses.map(v => ({
      id: v.id,
      ref: v.ref,
      category: v.category,
      verseTextEn: v.verseTextEn,
      verseTextTa: v.verseTextTa
    }));

    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', 'attachment; filename=daily_verses.json');
    return res.send(JSON.stringify(cleanVerses, null, 2));
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// POST /api/site-settings/daily-verses/reset (Admin)
const resetVerses = async (req, res) => {
  try {
    await dropLegacyIndexes();
    await DailyVerse.deleteMany({});
    const inserted = await DailyVerse.insertMany(DEFAULT_VERSES);
    res.json({
      success: true,
      count: inserted.length,
      message: `Reset complete! ${inserted.length} default daily Bible verses restored.`
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// POST /api/site-settings/daily-verses/change-today or POST /api/daily-verse/change (Admin)
const changeTodayVerse = async (req, res) => {
  try {
    await ensureDefaultVerses();
    const count = await DailyVerse.countDocuments();
    if (count === 0) {
      return res.status(400).json({ success: false, message: 'No verses available in database' });
    }

    const { verseId } = req.body || {};
    let targetVerse = null;

    if (verseId) {
      targetVerse = await DailyVerse.findOne({ $or: [{ id: Number(verseId) || -1 }, { _id: verseId }] });
    }

    if (!targetVerse) {
      const currentToday = await getTodayVerseData();
      const allVerses = await DailyVerse.find().sort({ id: 1 }).lean();
      let currentIndex = allVerses.findIndex(v => v.id === currentToday.id || String(v._id) === String(currentToday.id));
      if (currentIndex === -1) {
        currentIndex = 0;
      }
      const nextIndex = (currentIndex + 1) % allVerses.length;
      targetVerse = allVerses[nextIndex];
    }

    if (!targetVerse) {
      targetVerse = await DailyVerse.findOne();
    }

    const SiteSettings = require('../models/SiteSettings');
    const todayDateStr = getTodayDateStr();

    await SiteSettings.findOneAndUpdate(
      { key: 'today_verse_override' },
      {
        value: JSON.stringify({
          verseMongoId: String(targetVerse._id),
          id: targetVerse.id,
          ref: targetVerse.ref,
          date: todayDateStr
        }),
        label: 'Today Bible Verse Override',
        type: 'text'
      },
      { upsert: true, new: true }
    );

    const updatedData = await getTodayVerseData();

    res.json({
      success: true,
      message: `Today's verse successfully updated to ${targetVerse.ref}`,
      verse: updatedData
    });
  } catch (err) {
    console.error('Failed to change today verse:', err);
    res.status(500).json({ success: false, message: err.message });
  }
};

module.exports = {
  getTodayVerse,
  getTodayVerseData,
  changeTodayVerse,
  getAllVerses,
  uploadVerses,
  createVerse,
  updateVerse,
  deleteVerse,
  exportVerses,
  resetVerses
};

