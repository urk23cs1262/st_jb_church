const axios = require('axios');
const cheerio = require('cheerio');
const cron = require('node-cron');

let dailySaint = null;

async function fetchDailySaint() {
  try {
    const response = await axios.get('https://www.franciscanmedia.org/saint-of-the-day/', {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7',
        'Accept-Language': 'en-US,en;q=0.9',
        'Cache-Control': 'no-cache',
        'Pragma': 'no-cache',
        'Referer': 'https://www.google.com/'
      }
    });
    
    const html = response.data;
    const $ = cheerio.load(html);

    let name = $('article h2').first().text().trim() || $('h2').first().text().trim();
    
    // Fallback if h2 is not found or is generic
    if (!name || name.toLowerCase() === 'saint of the day') {
      name = $('h1').first().text().trim();
    }
    const description = $('article p').first().text().trim();
    const image = $('article img').first().attr('src');
    
    // Better feast day detection
    let feastDay = $('.feast-day').first().text().replace('Feast Day:', '').trim();
    if (!feastDay) {
      // Fallback: use current date formatted like "May 10"
      feastDay = new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric' });
    }

    dailySaint = {
      name,
      description,
      image,
      feastDay,
      link: 'https://www.franciscanmedia.org/saint-of-the-day/',
      updatedAt: new Date()
    };

    console.log('✨ Saint of the Day updated:', name);
  } catch (error) {
    console.error('❌ Error fetching daily saint:', error.message);
  }
}

// Initial fetch
fetchDailySaint();

// Schedule for 12:00 AM daily
cron.schedule('0 0 * * *', () => {
  console.log('⏰ Scheduling daily saint update...');
  fetchDailySaint();
});

const getDailySaint = () => dailySaint;

module.exports = { getDailySaint, fetchDailySaint };
