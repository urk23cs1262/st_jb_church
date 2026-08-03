const fs = require('fs');
const path = require('path');

// Path to JSON files
const downloadPath = 'C:\\Users\\Admin\\Downloads\\daily-verses-400.json';
const assetPath = 'c:\\Users\\Admin\\Documents\\rc - new cluade\\frontend\\src\\assets\\daily-verses-400.json';
const defaultDataPath = 'c:\\Users\\Admin\\Documents\\rc - new cluade\\backend\\src\\data\\defaultVerses.js';

// Category classification rules based on keywords & reference patterns
function categorizeVerse(ref, en, ta) {
  const text = `${ref} ${en}`.toLowerCase();
  
  if (text.includes('love') || text.includes('loved') || text.includes('charity')) return 'Love';
  if (text.includes('peace') || text.includes('quiet') || text.includes('be still')) return 'Peace';
  if (text.includes('trust') || text.includes('shepherd') || text.includes('rely') || text.includes('confidence')) return 'Trust';
  if (text.includes('strength') || text.includes('strengthen') || text.includes('fortress') || text.includes('mighty') || text.includes('all things through christ')) return 'Strength';
  if (text.includes('courage') || text.includes('afraid') || text.includes('fear not') || text.includes('bold') || text.includes('timid')) return 'Courage';
  if (text.includes('hope') || text.includes('future') || text.includes('anchor') || text.includes('wait for the lord')) return 'Hope';
  if (text.includes('faith') || text.includes('believe') || text.includes('believes') || text.includes('conviction')) return 'Faith';
  if (text.includes('praise') || text.includes('sing') || text.includes('glory') || text.includes('exalt') || text.includes('worship') || text.includes('bless the lord')) return 'Praise & Worship';
  if (text.includes('comfort') || text.includes('weary') || text.includes('burden') || text.includes('heal') || text.includes('brokenhearted') || text.includes('tears')) return 'Comfort & Healing';
  if (text.includes('prayer') || text.includes('ask') || text.includes('seek') || text.includes('knock') || text.includes('call on me') || text.includes('petition')) return 'Prayer';
  if (text.includes('bless') || text.includes('blessed') || text.includes('reward') || text.includes('prosper')) return 'Blessing';
  if (text.includes('grace') || text.includes('mercy') || text.includes('gift of god') || text.includes('forgive') || text.includes('confess')) return 'Grace & Forgiveness';
  if (text.includes('wisdom') || text.includes('understanding') || text.includes('heart') || text.includes('knowledge') || text.includes('lamp')) return 'Wisdom & Guidance';
  if (text.includes('light') || text.includes('shine') || text.includes('world') || text.includes('witness')) return 'Light & Witness';
  if (text.includes('salvation') || text.includes('saved') || text.includes('redeemer') || text.includes('cross') || text.includes('eternal life')) return 'Salvation & Life';
  if (text.includes('joy') || text.includes('rejoice') || text.includes('glad') || text.includes('delight')) return 'Joy';
  if (text.includes('protection') || text.includes('refuge') || text.includes('shield') || text.includes('rock') || text.includes('dwelling') || text.includes('shadow')) return 'Protection & Refuge';
  if (text.includes('persevere') || text.includes('endure') || text.includes('patient') || text.includes('weary in well doing') || text.includes('stand firm')) return 'Perseverance';
  if (text.includes('give') || text.includes('giver') || text.includes('generous') || text.includes('tithe')) return 'Generosity';
  if (text.includes('creation') || text.includes('beginning') || text.includes('maker') || text.includes('heaven and earth')) return 'Creation';

  // Fallback by Bible book/section
  if (ref.startsWith('Psalm')) return 'Comfort & Refuge';
  if (ref.startsWith('Proverbs')) return 'Wisdom';
  if (ref.startsWith('Isaiah')) return 'Hope & Promise';
  if (ref.startsWith('John') || ref.startsWith('Matthew') || ref.startsWith('Luke') || ref.startsWith('Mark')) return 'Gospel & Grace';
  if (ref.startsWith('Romans') || ref.startsWith('Ephesians') || ref.startsWith('Philippians') || ref.startsWith('Colossians')) return 'Faith & Life';

  return 'General';
}

function run() {
  console.log('📖 Categorizing verses in JSON files...');

  let fileContent = '';
  if (fs.existsSync(downloadPath)) {
    fileContent = fs.readFileSync(downloadPath, 'utf8');
  } else if (fs.existsSync(assetPath)) {
    fileContent = fs.readFileSync(assetPath, 'utf8');
  } else {
    console.error('File not found!');
    process.exit(1);
  }

  const data = JSON.parse(fileContent);
  const verses = Array.isArray(data) ? data : (data.verses || []);

  const categorizedVerses = verses.map((v, index) => {
    const day = v.day || v.id || (index + 1);
    const ref = v.ref || v.reference || '';
    const en = v.en || v.verseTextEn || v.english || '';
    const ta = v.ta || v.verseTextTa || v.tamil || '';
    const category = categorizeVerse(ref, en, ta);

    return {
      day,
      id: day,
      ref,
      category,
      en,
      ta,
      verseTextEn: en,
      verseTextTa: ta
    };
  });

  console.log(`✅ Categorized ${categorizedVerses.length} verses successfully!`);

  // Write clean formatted JSON structure to Downloads and frontend assets
  const outputJson = JSON.stringify({ verses: categorizedVerses }, null, 2);
  
  if (fs.existsSync(downloadPath)) {
    fs.writeFileSync(downloadPath, outputJson, 'utf8');
    console.log(`Saved updated JSON to ${downloadPath}`);
  }
  
  if (fs.existsSync(assetPath)) {
    fs.writeFileSync(assetPath, outputJson, 'utf8');
    console.log(`Saved updated JSON to ${assetPath}`);
  } else {
    fs.mkdirSync(path.dirname(assetPath), { recursive: true });
    fs.writeFileSync(assetPath, outputJson, 'utf8');
    console.log(`Saved updated JSON to ${assetPath}`);
  }

  // Update backend default dataset
  const jsData = `const DEFAULT_VERSES = ${JSON.stringify(categorizedVerses.map(v => ({
    id: v.id,
    ref: v.ref,
    category: v.category,
    verseTextEn: v.en,
    verseTextTa: v.ta
  })), null, 2)};\n\nmodule.exports = DEFAULT_VERSES;\n`;
  
  fs.writeFileSync(defaultDataPath, jsData, 'utf8');
  console.log(`Saved updated defaultVerses dataset to ${defaultDataPath}`);
}

run();
