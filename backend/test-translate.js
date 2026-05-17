const axios = require('axios');
const text = 'First Reading: Acts 15: 22-31';
const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=en&tl=ta&dt=t&q=${encodeURIComponent(text)}`;
axios.get(url).then(res => {
  console.log(res.data[0][0][0]);
}).catch(err => console.error(err.message));
