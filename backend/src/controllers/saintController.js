const { getDailySaint, fetchDailySaint } = require('../services/saintService');

const getSaint = async (req, res) => {
  try {
    const saint = getDailySaint();
    if (!saint) {
      return res.status(404).json({ success: false, message: 'Saint details not available yet' });
    }
    res.json({ success: true, saint });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

const refreshSaint = async (req, res) => {
  try {
    console.log('🔄 Manually requested Daily Saint sync from Admin Panel...');
    await fetchDailySaint();
    const saint = getDailySaint();
    res.json({ success: true, saint });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

const getSaintStatus = async (req, res) => {
  try {
    const saint = getDailySaint();
    let fetchUrl = 'https://www.catholic.org/saints/sofd.php';
    try {
      const SiteSettings = require('../models/SiteSettings');
      const urlSetting = await SiteSettings.findOne({ key: 'daily_saint_fetch_url' }).lean();
      if (urlSetting && urlSetting.value && urlSetting.value.trim() !== '') {
        fetchUrl = urlSetting.value.trim();
      }
    } catch (e) {}

    res.json({
      success: true,
      currentDate: saint ? saint.date : new Date().toISOString().split('T')[0],
      status: saint ? saint.status : 'Error',
      lastSynced: saint ? saint.lastSynced : null,
      name: saint ? saint.name : 'Unknown',
      link: saint ? saint.link : '',
      sourceUrl: fetchUrl
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

module.exports = { getSaint, refreshSaint, getSaintStatus };
