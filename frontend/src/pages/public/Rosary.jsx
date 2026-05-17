import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { GiCrucifix } from 'react-icons/gi';
import { FiVolume2, FiBookOpen } from 'react-icons/fi';
import PageHero from '../../components/common/PageHero';
import defaultRosaryAudio from '../../assets/rosary.mp3';
import api, { UPLOADS_URL } from '../../services/api';

const PRAYERS = {
  EN: {
    SIGN_OF_CROSS: "In the name of the Father, and of the Son, and of the Holy Spirit. Amen.",
    APOSTLES_CREED: "I believe in God, the Father Almighty, Creator of heaven and earth, and in Jesus Christ, His only Son, our Lord, who was conceived by the Holy Spirit, born of the Virgin Mary, suffered under Pontius Pilate, was crucified, died and was buried; He descended into hell; on the third day He rose again from the dead; He ascended into heaven, and is seated at the right hand of God the Father Almighty; from there He will come to judge the living and the dead. I believe in the Holy Spirit, the holy catholic Church, the communion of saints, the forgiveness of sins, the resurrection of the body, and life everlasting. Amen.",
    OUR_FATHER: "Our Father, who art in heaven, hallowed be thy name; thy kingdom come, thy will be done on earth as it is in heaven. Give us this day our daily bread; and forgive us our trespasses as we forgive those who trespass against us; and lead us not into temptation, but deliver us from evil. Amen.",
    HAIL_MARY: "Hail Mary, full of grace, the Lord is with thee. Blessed art thou among women, and blessed is the fruit of thy womb, Jesus. Holy Mary, Mother of God, pray for us sinners, now and at the hour of our death. Amen.",
    GLORY_BE: "Glory be to the Father, and to the Son, and to the Holy Spirit. As it was in the beginning, is now, and ever shall be, world without end. Amen.",
    FATIMA_PRAYER: "O my Jesus, forgive us our sins, save us from the fires of hell, lead all souls to Heaven, especially those who have most need of Your mercy. Amen.",
    HAIL_HOLY_QUEEN: "Hail, Holy Queen, Mother of Mercy, our life, our sweetness and our hope! To thee do we cry, poor banished children of Eve; to thee do we send up our sighs, mourning and weeping in this valley of tears. Turn then, most gracious advocate, thine eyes of mercy toward us, and after this our exile, show unto us the blessed fruit of thy womb, Jesus. O clement, O loving, O sweet Virgin Mary! Pray for us, O Holy Mother of God, that we may be made worthy of the promises of Christ. Amen."
  },
  TA: {
    SIGN_OF_CROSS: "தந்தை, மகன், தூய ஆவியாரின் பெயராலே. ஆமென்.",
    APOSTLES_CREED: "விண்ணகத்தையும் மண்ணகத்தையும் படைத்த எல்லாம் வல்ல தந்தையாகிய இறைவனை நம்புகிறேன். அவருடைய ஒரே மகனாகிய நம் ஆண்டவர் இயேசு கிறிஸ்துவை நம்புகிறேன். இவர் தூய ஆவியால் கருவாகி கன்னி மரியாவிடமிருந்து பிறந்தார். போஞ்சு பிலாத்தின் அதிகாரத்தில் பாடுபட்டு, சிலுவையில் அறையப்பட்டு, இறந்து அடக்கம் செய்யப்பட்டார். பாதாளத்தில் இறங்கி, மூன்றாம் நாள் இறந்தோரிடமிருந்து உயிர்த்தெழுந்தார். விண்ணகத்திற்கு எழுந்தருளி, எல்லாம் வல்ல தந்தையாகிய இறைவனின் வலப்பக்கத்தில் வீற்றிருக்கிறார். அங்கிருந்து வாழ்வோருக்கும் இறந்தோருக்கும் தீர்ப்பு வழங்க வருவார். தூய ஆவியாரை நம்புகிறேன். புனித கத்தோலிக்க திருச்சபையை நம்புகிறேன். புனிதர்களின் உறவு முறையை நம்புகிறேன். பாவ மன்னிப்பை நம்புகிறேன். உடலின் உயிர்ப்பை நம்புகிறேன். நிலை வாழ்வை நம்புகிறேன். ஆமென்.",
    OUR_FATHER: "விண்ணுலகில் இருக்கிற எங்கள் தந்தையே, உமது பெயர் தூயது எனப் போற்றப்பெறுக! உமது ஆட்சி வருக! உமது திருவுளம் விண்ணுலகில் நிறைவேறுவது போல மண்ணுலகிலும் நிறைவேறுக! எங்கள் அன்றாட உணவை இன்று எங்களுக்குத் தாரும். எங்களுக்கு எதிராகக் குற்றம் செய்வோரை நாங்கள் மன்னிப்பது போல எங்கள் குற்றங்களை மன்னியும். எங்களைச் சோதனைக்கு உட்படுத்தாதேயும், தீமையிலிருந்து எங்களை விடுவித்தருளும். ஆமென்.",
    HAIL_MARY: "அருள் நிறைந்த மரியே வாழ்க! ஆண்டவர் உம்முடனே. பெண்களுக்குள் ஆசி பெற்றவர் நீரே, உம்முடைய திருவயிற்றின் கனியாகிய இயேசுவும் ஆசி பெற்றவரே. புனித மரியே, இறைவனின் தாயே, பாவிகளாய் இருக்கிற எங்களுக்காக இப்பொழுதும் எங்கள் இறப்பின் வேளையிலும் வேண்டிக்கொள்ளும். ஆமென்.",
    GLORY_BE: "தந்தைக்கும் மகனுக்கும் தூய ஆவியாருக்கும் ஆட்சிமை உண்டாவதாக. தொடக்கத்தில் இருந்தது போல இப்பொழுதும் எப்பொழுதும் என்றென்றும் இருப்பதாக. ஆமென்.",
    FATIMA_PRAYER: "ஓ என் இயேசுவே! எங்கள் பாவங்களைப் பொறுத்தருளும். எங்களை நரக நெருப்பிலிருந்து மீட்டருளும். எல்லாரையும் விண்ணுலகப் பாதையில் நடத்தியருளும். சிறப்பாக உமது இரக்கம் யாருக்கு அதிகம் தேவையோ அவர்களுக்கு உதவி புரியும். ஆமென்.",
    HAIL_HOLY_QUEEN: "சலேவே இராக்கினி, கருணையின் மாதாவே, எங்கள் வாழ்வே, எங்கள் இனிமையே, எங்கள் தஞ்சமே வாழ்க! பரதேசிகளாயிருக்கிற நாங்கள் ஏவையின் மக்கள், உம்மை நோக்கிக் கூப்பிடுகிறோம். இந்த அழுகை பள்ளத்தாக்கிலிருந்து உம்மை நோக்கிப் பெருமூச்சு விடுகிறோம். ஆதலால் எங்களுக்காகப் பரிந்து பேசும் வழக்கிறீயே, உம்முடைய கருணையுள்ள கண்களை எங்கள் பேரில் திருப்பியருளும். இதன்றியே இந்தப்பரதேசம் முடிந்த பிறகு, உம்முடைய திருவயிற்றின் ஆசி பெற்ற கனியாகிய இயேசுவை எங்களுக்குக் காட்டியருளும். கிருபாகரியே, தயாபரியே, இனிய கன்னி மரியாயே! ஆமென்."
  }
};

const MYSTERIES = [
  {
    name: "Joyful Mysteries (மகிழ்ச்சி நிறை)",
    days: "Monday & Saturday",
    items: [
      { en: "The Annunciation", ta: "கபிரியேல் தூதர் மரியாவுக்குத் தூதுரைத்தது" },
      { en: "The Visitation", ta: "மரியா எலிசபெத்தைச் சந்தித்தது" },
      { en: "The Nativity", ta: "இயேசு பிறந்தது" },
      { en: "The Presentation", ta: "இயேசுவைக் கோவிலில் அர்ப்பணித்தது" },
      { en: "The Finding in the Temple", ta: "காணாமல் போன இயேசுவைக் கோவிலில் கண்டடைந்தது" }
    ]
  },
  {
    name: "Sorrowful Mysteries (துயரம் நிறைந்த)",
    days: "Tuesday & Friday",
    items: [
      { en: "The Agony in the Garden", ta: "இயேசு கெத்சமனி தோட்டத்தில் வேதனைப்பட்டது" },
      { en: "The Scourging at the Pillar", ta: "இயேசு தூணில் கட்டப்பட்டு அடிக்கப்பட்டது" },
      { en: "The Crowning with Thorns", ta: "இயேசுவுக்கு முள்முடி சூட்டியது" },
      { en: "The Carrying of the Cross", ta: "இயேசு சிலுவை சுமந்து சென்றது" },
      { en: "The Crucifixion", ta: "இயேசு சிலுவையில் அறையப்பட்டு இறந்தது" }
    ]
  },
  {
    name: "Glorious Mysteries (மகிமை நிறைந்த)",
    days: "Wednesday & Sunday",
    items: [
      { en: "The Resurrection", ta: "இயேசு உயிர்த்தெழுந்தது" },
      { en: "The Ascension", ta: "இயேசு விண்ணகத்திற்கு எழுந்தருளியது" },
      { en: "The Descent of the Holy Spirit", ta: "தூய ஆவியார் சீடர்கள் மீது இறங்கி வந்தது" },
      { en: "The Assumption", ta: "மரியா விண்ணகத்திற்கு எடுத்துக்கொள்ளப்பட்டது" },
      { en: "The Coronation", ta: "மரியா விண்ணக மண்ணக அரசியாக முடிசூட்டப்பட்டது" }
    ]
  },
  {
    name: "Luminous Mysteries (ஒளி நிறைந்த)",
    days: "Thursday",
    items: [
      { en: "The Baptism of Jesus", ta: "இயேசு யோர்தான் ஆற்றில் திருமுழுக்குப் பெற்றது" },
      { en: "The Wedding at Cana", ta: "கானா ஊர்த் திருமணத்தில் இயேசு தன்னை வெளிப்படுத்தியது" },
      { en: "The Proclamation of the Kingdom", ta: "இயேசு இறையாட்சியைப் பறைசாற்றியது" },
      { en: "The Transfiguration", ta: "இயேசு உருமாறியது" },
      { en: "The Institution of the Eucharist", ta: "இயேசு நற்கருணையை ஏற்படுத்தியது" }
    ]
  }
];

export default function Rosary() {
  const [tamilAudioSrc, setTamilAudioSrc] = useState(defaultRosaryAudio);

  useEffect(() => {
    api.get('/settings/rosaryAudio')
      .then(r => {
        if (r.data.value) {
          const src = r.data.value.startsWith('http')
            ? r.data.value
            : `${UPLOADS_URL.replace('/uploads', '')}${r.data.value}`;
          setTamilAudioSrc(src);
        }
      })
      .catch(() => {}); // fall back to bundled audio
  }, []);

  return (
    <div className="min-h-screen pt-20 bg-church-cream">
      <PageHero title={<>The Holy Rosary / புனித ஜெபமாலை</>} subtitle={<>53 Beads of Prayer / 53 மணி செபம்</>} />

      <section className="py-16">
        <div className="max-w-6xl mx-auto px-4">

          {/* Audio Players Section */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-16">
            <motion.div initial={{ opacity: 0, x: -20 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }}>
              <div className="glass-card p-6 h-full border-t-4 border-church-gold text-center shadow-gold-sm">
                <h3 className="font-display text-lg font-bold text-church-royal-blue mb-4 flex items-center justify-center gap-2">
                  <FiVolume2 className="text-church-gold" /> English Audio Guide
                </h3>
                <div className="bg-white/50 p-2 rounded-xl border border-church-gold/10">
                  <audio controls className="w-full h-10">
                    <source src="https://rosaryarmy.com/wp-content/uploads/2025/02/RosaryJoyful-1.mp3" type="audio/mpeg" />
                  </audio>
                </div>
                <p className="text-[10px] text-gray-400 mt-3 italic uppercase tracking-widest">Joyful Mysteries</p>
              </div>
            </motion.div>

            <motion.div initial={{ opacity: 0, x: 20 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }}>
              <div className="glass-card p-6 h-full border-t-4 border-church-maroon text-center shadow-maroon-sm">
                <h3 className="font-display text-lg font-bold text-church-royal-blue mb-4 flex items-center justify-center gap-2 font-tamil">
                  <FiVolume2 className="text-church-maroon" /> தமிழ் ஜெபமாலை ஆடியோ
                </h3>
                <div className="bg-white/50 p-2 rounded-xl border border-church-maroon/10">
                  <audio key={tamilAudioSrc} controls className="w-full h-10">
                    <source src={tamilAudioSrc} type="audio/mpeg" />
                  </audio>
                </div>
                <p className="text-[10px] text-gray-400 mt-3 italic uppercase tracking-widest font-tamil">மகிழ்ச்சி நிறை இரகசியங்கள்</p>
              </div>
            </motion.div>
          </div>

          {/* Mysteries Grid */}
          <div className="mb-16">
            <h2 className="section-title text-center mb-8 flex items-center justify-center gap-3">
              <FiBookOpen className="text-church-gold" /> Mysteries of the Rosary / மறை உண்மைகள்
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {MYSTERIES.map((m, i) => (
                <motion.div key={i} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.1 }} className="church-card p-4 hover:border-church-gold transition-colors">
                  <h3 className="font-display text-base font-bold text-church-royal-blue mb-1 leading-tight">{m.name}</h3>
                  <p className="text-[10px] text-church-gold font-semibold uppercase mb-3">{m.days}</p>
                  <ul className="space-y-2">
                    {m.items.map((item, j) => (
                      <li key={j} className="text-xs text-gray-600 border-l-2 border-church-gold/30 pl-2">
                        <p className="font-medium">{item.en}</p>
                        <p className="font-tamil text-gray-500">{item.ta}</p>
                      </li>
                    ))}
                  </ul>
                </motion.div>
              ))}
            </div>
          </div>

          {/* Detailed Prayer Cards */}
          <div className="space-y-12">
            <div className="text-center">
              <h2 className="section-title">Order of Prayer / செபத்தின் வரிசை</h2>
              <p className="text-gray-500 mt-2">Follow the full text of the prayers in both English and Tamil</p>
            </div>

            {/* Introductory Steps */}
            <div className="grid grid-cols-1 gap-6">
              {[
                { title: "1. Sign of the Cross / சிலுவை அடையாளம்", key: "SIGN_OF_CROSS" },
                { title: "2. Apostles' Creed / நம்பிக்கை அறிக்கை", key: "APOSTLES_CREED" },
                { title: "3. Our Father / பரலோக மந்திரம்", key: "OUR_FATHER" },
                { title: "4. Hail Mary / அருள் நிறைந்த மரியே", key: "HAIL_MARY" },
                { title: "5. Glory Be / திருத்துவப் புகழ்", key: "GLORY_BE" },
                { title: "6. Fatima Prayer / பாத்திமா அன்னை செபம்", key: "FATIMA_PRAYER" },
                { title: "7. Hail Holy Queen / சலேவே இராக்கினி", key: "HAIL_HOLY_QUEEN" }
              ].map((step, i) => (
                <motion.div key={i} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="glass-card overflow-hidden">
                  <div className="bg-church-gradient px-6 py-3 flex items-center justify-between">
                    <h3 className="text-white font-display font-bold text-lg">{step.title}</h3>
                    {step.note && <span className="badge badge-gold">{step.note}</span>}
                  </div>
                  <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div>
                      <p className="text-church-gold text-[10px] font-bold uppercase mb-2">English</p>
                      <p className="text-gray-700 text-sm leading-relaxed italic">{PRAYERS.EN[step.key]}</p>
                    </div>
                    <div className="border-t md:border-t-0 md:border-l border-gray-100 md:pl-8 pt-6 md:pt-0">
                      <p className="text-church-maroon text-[10px] font-bold uppercase mb-2 font-tamil">தமிழ்</p>
                      <p className="text-gray-700 text-sm leading-relaxed font-tamil">{PRAYERS.TA[step.key]}</p>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>

            {/* Bead Visualization Reminder */}
            <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} className="church-card bg-church-royal-blue text-white p-8 text-center border-none shadow-gold-lg">
              <GiCrucifix className="text-gold-400 text-5xl mx-auto mb-4" />
              <h3 className="text-2xl font-display font-bold mb-4">The 53 Beads / 53 மணிகள்</h3>
              <div className="max-w-2xl mx-auto space-y-4 text-gray-200">
                <p>The Rosary consists of 5 decades (10 beads each) + 3 introductory beads, totaling 53 Hail Marys.</p>
                <div className="flex justify-center gap-2 flex-wrap">
                  {[...Array(53)].map((_, i) => (
                    <div key={i} className="w-2 h-2 rounded-full bg-gold-400/50 shadow-sm"></div>
                  ))}
                </div>
                <p className="font-tamil">ஜெபமாலையில் 5 பத்துக்கள் (தலா 10 மணிகள்) + 3 ஆரம்ப மணிகள் உள்ளன, மொத்தம் 53 அருள் நிறைந்த மரியே செபங்கள் உள்ளன.</p>
              </div>
            </motion.div>
          </div>
        </div>
      </section>
    </div>
  );
}
