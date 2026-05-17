const axios = require('axios');
const cheerio = require('cheerio');

axios.get('https://www.catholicgallery.org/mass-reading/080526/').then(resp => {
  const $ = cheerio.load(resp.data);
  let count = 0;
  $('.entry-content').find('p, h2, h3, h4').each((_, el) => {
    if (count < 15) {
      console.log(`[${el.tagName}]`, $(el).text().trim());
      count++;
    }
  });
}).catch(e => console.error(e.message));
