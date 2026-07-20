const axios = require('axios');

// Fallback AI content generator for Catholic Parish Events & Announcements
function generateParishAIContent(type, title) {
  const cleanTitle = title.trim();
  const lowerTitle = cleanTitle.toLowerCase();

  if (type === 'events' || type === 'event') {
    if (lowerTitle.includes('feast') || lowerTitle.includes('novena') || lowerTitle.includes('britto')) {
      return `Join us for the grand celebration of ${cleanTitle} at St. John de Britto's Church, Kalayarkoil! 

We invite all parishioners, families, and devotionals to gather in solemn prayer, Holy Mass, and fellowship. The feast will commence with a special Eucharistic celebration, followed by novena prayers, blessing of the faithful, and community agape.

Mass Schedule & Devotions:
• Holy Mass & Flag Hoisting
• Special Novena Prayers & Adoration
• Procession of the Holy Relic
• Fellowship & Refreshments for all attendees.

Let us come together in unity and faith to receive divine graces through the intercession of St. John de Britto!`;
    }

    if (lowerTitle.includes('youth') || lowerTitle.includes('choir') || lowerTitle.includes('meeting')) {
      return `Calling all members for the ${cleanTitle} at St. John de Britto's Parish Hall!

This gathering will focus on spiritual growth, community outreach, and organizing upcoming parish ministries. All members are encouraged to attend, participate in group discussions, and share their ideas.

Program Highlights:
• Opening Prayer & Scripture Reading
• Interactive Discussion & Planning Session
• Youth / Ministry Initiatives for the upcoming month
• Closing Blessing & Tea Fellowship.

Your presence and active participation strengthen our parish community!`;
    }

    if (lowerTitle.includes('blood') || lowerTitle.includes('medical') || lowerTitle.includes('camp') || lowerTitle.includes('health')) {
      return `St. John de Britto's Church, Kalayarkoil is organizing a ${cleanTitle} to serve our parish and local community.

Medical professionals and volunteers will be available to provide free health consultations, blood donation drives, and awareness sessions.

Event Services:
• Free Doctor Consultation & Health Checkups
• Voluntary Blood Donation Drive
• Essential Medicine Distribution & Guidance

"Amen, I say to you, whatever you did for one of these least brothers of mine, you did for me." (Matthew 25:40). Please register and spread the word to those in need!`;
    }

    return `We warmly invite all parishioners to attend ${cleanTitle} organized at St. John de Britto's Church, Kalayarkoil.

This event offers a wonderful opportunity for our parish family to unite in prayer, reflection, and community fellowship. 

Program Details:
• Opening Prayer & Eucharistic Blessing
• Keynote Address & Guided Spiritual Reflection
• Community Discussions & Activities
• Closing Prayer & Light Fellowship.

Come with your family and friends to share in this blessed gathering!`;
  }

  // Announcements
  if (lowerTitle.includes('mass') || lowerTitle.includes('timing') || lowerTitle.includes('schedule')) {
    return `Special Announcement regarding ${cleanTitle}:

Please take note of the updated Mass schedules and liturgy timings for St. John de Britto's Church, Kalayarkoil. All parishioners are requested to arrive 15 minutes prior to Mass for personal prayer and preparation.

For Mass intentions, special blessings, or confession timings, please contact the Parish Office during working hours.`;
  }

  if (lowerTitle.includes('emergency') || lowerTitle.includes('alert') || lowerTitle.includes('urgent') || lowerTitle.includes('notice')) {
    return `URGENT PARISH NOTICE: ${cleanTitle}

Dear Parishioners, please be informed about ${cleanTitle}. The Parish Administration requests everyone to follow the guidelines provided and stay tuned for further updates.

For urgent inquiries or emergency pastoral assistance, please contact the Parish Priest or Parish Office immediately.`;
  }

  return `Parish Announcement: ${cleanTitle}

The Parish Office of St. John de Britto's Church, Kalayarkoil wishes to inform all parishioners about ${cleanTitle}. 

We kindly request all families to take note of this information and share it within your Anbiyam (Basic Christian Communities). For further details or clarifications, please visit the Parish Office after Sunday Mass.

"May the grace of our Lord Jesus Christ, and the love of God, and the fellowship of the Holy Spirit be with you all." (2 Corinthians 13:14)`;
}

// POST /api/ai/generate-content
exports.generateAIContent = async (req, res) => {
  try {
    const { title, type = 'events', field = 'description' } = req.body;
    if (!title || !title.trim()) {
      return res.status(400).json({ message: 'Title is required for AI content generation.' });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (apiKey) {
      try {
        const prompt = `You are a helpful Catholic Parish Assistant for St. John de Britto's Church, Kalayarkoil.
Generate a warm, inspiring, well-structured, and realistic ${type === 'events' ? 'Event Description' : 'Parish Announcement Content'} based on the following title: "${title.trim()}".
Requirements:
- Written in a welcoming, pastoral, and uplifting tone suitable for a Catholic parish.
- Include key highlights or bullet points where appropriate.
- Include a relevant Bible verse or saintly blessing at the end.
- Maximum 150-200 words. Plain text without markdown header symbols like # or **.`;

        const geminiRes = await axios.post(
          `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
          {
            contents: [{ parts: [{ text: prompt }] }]
          },
          { headers: { 'Content-Type': 'application/json' }, timeout: 10000 }
        );

        const generatedText = geminiRes.data?.candidates?.[0]?.content?.parts?.[0]?.text;
        if (generatedText) {
          return res.json({ success: true, text: generatedText.trim() });
        }
      } catch (geminiError) {
        console.warn('⚠️ Gemini API call failed, falling back to local parish AI model:', geminiError.message);
      }
    }

    // Fallback to local intelligent parish AI generator
    const generatedText = generateParishAIContent(type, title);
    res.json({ success: true, text: generatedText });
  } catch (err) {
    console.error('❌ AI generation error:', err);
    res.status(500).json({ message: err.message || 'AI Generation failed' });
  }
};
