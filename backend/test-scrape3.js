const axios = require('axios');
const cheerio = require('cheerio');
axios.get('https://www.catholicgallery.org/mass-reading/060526/').then(resp => {
  const $ = cheerio.load(resp.data);
  console.log('Lect:', $('.cgLect').text().trim());
  console.log('H2s:', $('.entry-content h2').map((_, el) => $(el).text().trim()).get());
}).catch(e => console.error(e.message));
