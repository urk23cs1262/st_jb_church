const { getDailySaint } = require('../services/saintService');

const getSaint = async (req, res) => {
  try {
    let saint = getDailySaint();
    
    // If for some reason the saint is null (e.g. server just restarted), trigger an immediate fetch
    if (!saint) {
      const { fetchDailySaint } = require('../services/saintService');
      await fetchDailySaint();
      saint = getDailySaint();
    }

    if (!saint) {
      return res.status(404).json({ success: false, message: 'Saint details not available yet' });
    }
    res.json({ success: true, saint });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

module.exports = { getSaint };
