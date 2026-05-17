const axios = require('axios');
const cheerio = require('cheerio');
axios.get('https://www.tamilcatholicdaily.com/').then(resp => {
  const $ = cheerio.load(resp.data);
  const links = $('a').map((_, el) => $(el).attr('href')).get();
  const dailyLinks = links.filter(l => l && l.includes('dailyverse'));
  console.log([...new Set(dailyLinks)]);
}).catch(e => console.error(e.message));
