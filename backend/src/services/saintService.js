const axios = require('axios');
const cheerio = require('cheerio');
const cron = require('node-cron');

let dailySaint = null;

async function fetchDailySaint() {
  try {
    console.log('Fetching Saint of the Day from Catholic Online...');
    const response = await axios.get('https://www.catholic.org/saints/sofd.php', {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9',
        'Cache-Control': 'no-cache',
        'Pragma': 'no-cache'
      }
    });
    
    const $ = cheerio.load(response.data);
    
    // Find the first link containing "/saints/saint.php?saint_id="
    let saintLink = null;
    $('a').each((i, el) => {
      const href = $(el).attr('href');
      if (href && href.includes('/saints/saint.php?saint_id=')) {
        saintLink = href;
        return false; // Break loop
      }
    });
    
    if (!saintLink) {
      throw new Error('Could not find Saint of the Day link on Catholic Online index page.');
    }
    
    const absoluteUrl = saintLink.startsWith('http') ? saintLink : `https://www.catholic.org${saintLink}`;
    console.log(`Fetching Saint Detail Page: ${absoluteUrl}`);
    
    const saintRes = await axios.get(absoluteUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      }
    });
    
    const $s = cheerio.load(saintRes.data);
    
    const name = $s('h1').first().text().trim() || 'Saint of the Day';
    
    // Find the high-quality portrait photo, accounting for Catholic Online's lazyload structure (data-src)
    let image = null;
    
    // 1. Look for images specifically matching /files/images/saints/ (the actual portrait folder)
    $s('img').each((i, el) => {
      const src = $s(el).attr('data-src') || $s(el).attr('src');
      if (src && src.includes('/files/images/saints/')) {
        image = src;
        return false;
      }
    });
    
    // 2. Fallback: Search for images with Alt texts naming the saint portrait
    if (!image) {
      $s('img').each((i, el) => {
        const src = $s(el).attr('data-src') || $s(el).attr('src');
        const alt = $s(el).attr('alt') || '';
        if (src && (alt.toLowerCase().includes('image of saint') || alt.toLowerCase().includes('image of st.'))) {
          image = src;
          return false;
        }
      });
    }
    
    // 3. Fallback: General media folders
    if (!image) {
      $s('img').each((i, el) => {
        const src = $s(el).attr('data-src') || $s(el).attr('src');
        if (src && src.includes('files/images/media')) {
          image = src;
          return false;
        }
      });
    }
    
    // Auto-resolve relative image paths if necessary
    if (image && !image.startsWith('http')) {
      image = `https://www.catholic.org${image}`;
    }
    
    // Parse Saint Biography Paragraphs and clean out advertisements and links
    let bio = '';
    $s('div.col-md-8 p, div#content p, article p, div.p-10 p').each((i, el) => {
      const text = $s(el).text().trim();
      if (text && text.length > 50 && 
          !text.includes('Printable Catholic') && 
          !text.includes('Shop St.') && 
          !text.includes('Subscribe') && 
          !text.includes('Donate') && 
          !text.includes('Copyright') && 
          !text.includes('Author and Publisher')) {
        bio += text + ' ';
      }
    });
    
    // Truncate to exactly 2 sentences so it fits perfectly and gives very brief content
    const cleanBio = bio.replace(/\s+/g, ' ').trim();
    const sentences = cleanBio.match(/[^.!?]+[.!?]+(\s|$)/g) || [cleanBio];
    const shortBio = sentences.slice(0, 2).join('').trim();
    const description = sentences.length > 2 ? `${shortBio}...` : shortBio;
    
    // Fetch Feast Day
    let feastDay = '';
    const pageText = $s('body').text();
    const feastMatch = pageText.match(/Feast\s*Day\s*:\s*([A-Za-z]+\s+\d+)/i);
    if (feastMatch) {
      feastDay = feastMatch[1].trim();
    } else {
      // Fallback: format current date like "May 18"
      feastDay = new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric' });
    }
    
    dailySaint = {
      name,
      description,
      image,
      feastDay,
      link: absoluteUrl,
      updatedAt: new Date()
    };
    
    console.log('✨ Saint of the Day updated successfully:', name);
  } catch (error) {
    console.error('❌ Error fetching daily saint from Catholic Online:', error.message);
    
    // Standard Fallback Saint in case of scrape issues to prevent site downtime
    if (!dailySaint) {
      dailySaint = {
        name: "St. John de Britto",
        description: "St. John de Britto, also known as Arul Anandar, was a Portuguese Jesuit missionary and martyr, often called the Portuguese St. Francis Xavier. He preached the Gospel in Madurai, India, adopting Hindu ascetic practices to connect with local people.",
        image: "https://upload.wikimedia.org/wikipedia/commons/thumb/b/bf/St._John_De_Britto.jpg/500px-St._John_De_Britto.jpg",
        feastDay: "February 4",
        link: "https://www.catholic.org/saints/saint.php?saint_id=4025",
        updatedAt: new Date()
      };
    }
  }
}

// Initial fetch on server start
fetchDailySaint();

// Schedule for 12:00 AM IST daily
cron.schedule('0 0 * * *', () => {
  console.log('⏰ Running daily saint of the day update cron job (12:00 AM IST)...');
  fetchDailySaint();
}, {
  timezone: 'Asia/Kolkata'
});

const getDailySaint = () => dailySaint;

module.exports = { getDailySaint, fetchDailySaint };
