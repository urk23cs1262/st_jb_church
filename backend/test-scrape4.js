const axios = require('axios');
const cheerio = require('cheerio');
axios.get('http://localhost:5000/api/daily-reading?date=2026-05-08').then(resp => {
  console.log(resp.data.data.liturgicalDay);
}).catch(e => console.error(e.message));
