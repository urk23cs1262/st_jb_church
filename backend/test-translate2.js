const axios = require('axios');
const text = 'First Reading\n\n12 This is my commandment\n\n13 Greater love than this';
const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=en&tl=ta&dt=t&q=${encodeURIComponent(text)}`;
axios.get(url).then(res => {
  const result = res.data[0].map(x => x[0]).join('');
  console.log(result);
}).catch(err => console.error(err.message));
