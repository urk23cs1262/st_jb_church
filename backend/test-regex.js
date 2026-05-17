const text = '22 Then it pleased the apostles and ancients, with the whole church, to choose men of their own company, and to send to Antioch, with Paul and Barnabas, namely, Judas, who was surnamed Barsabas, and Silas, chief men among the brethren. 23 Writing by their hands: The apostles and ancients, brethren, to the brethren of the Gentiles that are at Antioch, and in Syria and Cilicia, greeting. 24 Forasmuch as we have heard, that some going out from us have troubled you with words, subverting your souls; to whom we gave no commandment: 25 It hath seemed good to us, being assembled together, to choose out men, and to send them unto you, with our well beloved Barnabas and Paul: 26 Men that have given their lives for the name of our Lord Jesus Christ.';
const text2 = 'R. (10a) I will give you thanks among the peoples, O Lord. or R. Alleluia. 8 My heart is ready, O God, my heart is ready: I will Sing, and rehearse a psalm. 9 Arise, O my glory, arise psaltery and harp: I will arise early. R. I will give you thanks among the peoples, O Lord. or R. Alleluia. 10 I will give praise to thee, O Lord, among the people: I will sing a psalm to thee among the nations. 12 Be thou exalted, O God, above the heavens: and thy glory above all the earth. R. I will give you thanks among the peoples, O Lord. or R. Alleluia.';

const splitVerses = (str) => {
  // Regex to match a space, followed by 1-3 digits (optional letter), space, and Capital letter.
  // We use positive lookahead to split BEFORE the verse number.
  // Wait, if we use just lookahead `/(?=\s\d{1,3}[a-z]?\s+[A-Z"'])/`, we might miss the first one if it doesn't have a leading space.
  // Actually, we can split by `/(?=(?:^|\s)\d{1,3}[a-z]?\s+[A-Z"'])/`
  return str.split(/(?=(?:^|\s)\d{1,3}[a-z]?\s+[A-Z"'])/).map(s => s.trim()).filter(Boolean);
};

console.log('Text 1:', splitVerses(text));
console.log('Text 2:', splitVerses(text2));
