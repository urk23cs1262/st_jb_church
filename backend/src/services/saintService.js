const axios = require('axios');
const cheerio = require('cheerio');
const cron = require('node-cron');

let dailySaint = null;
let retryTimeout = null;

const ST_JOHN_DE_BRITTO = {
  name: "St. John de Britto",
  nameTa: "புனித ஜான் டி பிரி்ட்டோ (அருள் ஆனந்தர்)",
  description: "St. John de Britto, also known as Arul Anandar, was a Portuguese Jesuit missionary and martyr. He was the first European to adopt the dress and lifestyle of a Pandarasamy (Hindu ascetic) to preach the Gospel in Tamil Nadu. He traveled extensively across the Madurai Mission, converting thousands to Christianity. He was arrested, tortured, and eventually beheaded for his faith in Kalayarkoil in 1693.",
  descriptionTa: "புனித அருளானந்தர் (ஜான் டி பிரி்ட்டோ) ஒரு போர்த்துகீசிய இயேசு சபை துறவி மற்றும் தியாகி ஆவார். இவர் தமிழ்நாட்டில் நற்செய்தியைப் போதிப்பதற்காக ஒரு இந்து சன்னியாசியின் ஆடை மற்றும் வாழ்க்கை முறையை ஏற்றுக்கொண்ட முதல் ஐரோப்பியர் ஆவார். மதுரை தூதுக்குழுவின் கீழ் விரிவாகப் பயணம் செய்து, ஆயிரக்கணக்கானோரை கிறிஸ்தவ விசுவாசத்திற்கு ஈர்த்தார். தனது விசுவாசத்திற்காகக் கைது செய்யப்பட்டு, சித்திரவதைக்கு உட்படுத்தப்பட்டு, இறுதியாக 1693 இல் கலையார்கோவிலில் மறைசாட்சியாக உயிர் நீத்தார்.",
  image: "https://upload.wikimedia.org/wikipedia/commons/thumb/b/bf/St._John_De_Britto.jpg/500px-St._John_De_Britto.jpg",
  feastDay: "February 4",
  link: "https://www.catholic.org/saints/saint.php?saint_id=4025",
  updatedAt: new Date()
};

const FALLBACK_SAINTS = [
  {
    name: "St. Sebastian",
    nameTa: "புனித செபஸ்தியான்",
    description: "St. Sebastian was an early Christian saint and martyr who was killed during the Diocletianic Persecution of Christians. He was originally a captain in the Praetorian Guard under Emperor Diocletian, who was unaware of his faith. When discovered, Sebastian was tied to a tree and shot with arrows, but miraculously survived and was nursed back to health by St. Irene. After recovering, he went to confront the Emperor about his cruelty and was subsequently beaten to death.",
    descriptionTa: "புனித செபஸ்தியான் ஒரு ஆரம்பகால கிறிஸ்தவ புனிதர் மற்றும் தியாகி ஆவார், இவர் ரோமானிய பேரரசர் தியோகிளீசியனின் கிறிஸ்தவ துன்புறுத்தலின் போது கொல்லப்பட்டார். இவர் பேரரசர் தியோகிளீசியனின் கீழ் பிரிட்டோரியன் காவலர்களின் தளபதியாக பணியாற்றினார். இவர் கிறிஸ்தவர் என்பது கண்டறியப்பட்டதும், ஒரு மரத்தில் கட்டப்பட்டு அம்புகளால் எய்யப்பட்டார். எனினும், இவர் அற்புதமாக உயிர் பிழைத்தார். பின்னர் மீண்டும் பேரரசரைச் சந்தித்து அவரது கொடுமைகளைக் கண்டித்ததால், அடித்துக் கொல்லப்பட்டார்.",
    image: "https://upload.wikimedia.org/wikipedia/commons/thumb/1/1a/Sandro_Botticelli_-_St_Sebastian_-_WGA2757.jpg/500px-Sandro_Botticelli_-_St_Sebastian_-_WGA2757.jpg",
    feastDay: "January 20",
    link: "https://www.catholic.org/saints/saint.php?saint_id=103",
    updatedAt: new Date()
  },
  {
    name: "St. Valentine",
    nameTa: "புனித வாலண்டைன்",
    description: "St. Valentine was a 3rd-century Roman priest and physician who ministered to persecuted Christians during the reign of Emperor Claudius II. He secretly performed Christian weddings for Roman soldiers who were forbidden to marry, as the Emperor believed married men made poor soldiers. Valentine was eventually arrested for his faith, imprisoned, and sentenced to execution. Before his martyrdom on February 14, he is said to have healed the blind daughter of his jailer and written her a farewell note signed 'From your Valentine.'",
    descriptionTa: "புனித வாலண்டைன் 3-ஆம் நூற்றாண்டைச் சேர்ந்த ரோமானிய குரு மற்றும் மருத்துவர் ஆவார், இவர் பேரரசர் கிளாடியஸ் ஆட்சிக் காலத்தில் கிறிஸ்தவர்களுக்குத் தொண்டாற்றினார். திருமணம் செய்யத் தடை விதிக்கப்பட்டிருந்த ரோமானிய வீரர்களுக்கு இவர் இரகசியமாகத் திருமணங்களை நடத்தி வைத்தார். இதனால் கைது செய்யப்பட்டு, சிறையில் அடைக்கப்பட்டு, மரண தண்டனை விதிக்கப்பட்டார். தனது தியாகத்திற்கு முன், அவர் தனது சிறைக்காவலரின் பார்வையில்லாத மகளைக் குணப்படுத்தி, 'உமது வாலண்டைனிடமிருந்து' என்று கையொப்பமிட்ட விடைபெறும் கடிதத்தை எழுதினார்.",
    image: "https://upload.wikimedia.org/wikipedia/commons/thumb/f/f1/Saint_Valentine_icon.jpg/500px-Saint_Valentine_icon.jpg",
    feastDay: "February 14",
    link: "https://www.catholic.org/saints/saint.php?saint_id=159",
    updatedAt: new Date()
  },
  {
    name: "St. Joseph",
    nameTa: "புனித யோசேப்பு",
    description: "St. Joseph was the spouse of the Blessed Virgin Mary and the foster-father of Jesus Christ. As a descendant of King David, he lived a humble life as a carpenter in Nazareth, earning a livelihood through honest and manual labor. Scripture describes him as a 'just man' who obeyed the promptings of God delivered through angelic dreams. He protected the Holy Family during the flight into Egypt and raised Jesus with paternal devotion. He is revered as the patron saint of the universal Church, workers, and a happy death.",
    descriptionTa: "புனித யோசேப்பு தூய கன்னி மரியாவின் கணவரும், இயேசு கிறிஸ்துவின் வளர்ப்புத் தந்தையும் ஆவார். தாவீது அரசரின் வம்சாவளியைச் சேர்ந்த இவர், நாசரேத்தில் ஒரு தச்சராக எளிய வாழ்க்கை வாழ்ந்தார். திருவிவிலியம் இவரை ஒரு 'நேர்மையான மனிதர்' என்று விவரிக்கிறது. தேவ தூதரின் கனவுகள் வழியாகக் கிடைத்த கடவுளின் வழிகாட்டுதலுக்கு இவர் கீழ்ப்படிந்தார். எகிப்திற்குத் தப்பி ஓடியபோது திருக்குகுடும்பத்தைப் பாதுகாத்து, இயேசுவைத் தந்தைக்குரிய அன்போடு வளர்த்தார். இவர் உலகளாவிய திருச்சபை, தொழிலாளர்கள் மற்றும் நல்மரணத்தின் பாதுகாவலராகப் போற்றப்படுகிறார்.",
    image: "https://upload.wikimedia.org/wikipedia/commons/thumb/d/d3/Guido_Reni_-_Saint_Joseph_with_the_Infant_Jesus_-_Google_Art_Project.jpg/500px-Guido_Reni_-_Saint_Joseph_with_the_Infant_Jesus_-_Google_Art_Project.jpg",
    feastDay: "March 19",
    link: "https://www.catholic.org/saints/saint.php?saint_id=4",
    updatedAt: new Date()
  },
  {
    name: "St. George",
    nameTa: "புனித கீவர்க்கீஸ் (கியார்கியா)",
    description: "St. George was a soldier of Cappadocian Greek origin and a member of the Praetorian Guard for Roman Emperor Diocletian. He refused to participate in the persecution of Christians and openly declared his faith. For this, George was subjected to horrific tortures but refused to recant. He was eventually beheaded in Nicomedia in the year 303. His legendary combat with a dragon represents the victory of Christian faith over evil, making him one of the most venerated military saints in Christianity.",
    descriptionTa: "புனித கீவர்க்கீஸ் கப்பதோக்கிய கிரேக்க வம்சாவளியைச் சேர்ந்த ரோமானிய இராணுவ வீரர் ஆவார், இவர் பேரரசர் தியோகிளீசியனின் பிரிட்டோரியன் காவலில் உறுப்பினராக இருந்தார். கிறிஸ்தவர்களைத் துன்புறுத்துவதில் பங்கேற்க மறுத்து, தனது கிறிஸ்தவ விசுவாசத்தை வெளிப்படையாக அறிவித்தார். இதற்காகக் கொடூரமான சித்திரவதைகளுக்கு ஆளாக்கப்பட்டார். இறுதியாக கி.பி 303 இல் நிகோமீடியாவில் தலை துண்டிக்கப்பட்டார். அவர் ஒரு நச்சுப்பாம்பை (அரக்கனை) வென்ற புகழ்பெற்ற கதை, தீமைக்கு எதிரான விசுவாசத்தின் வெற்றியைக் குறிக்கிறது.",
    image: "https://upload.wikimedia.org/wikipedia/commons/thumb/e/e0/Raphael_-_Saint_George_and_the_Dragon_-_National_Gallery_of_Art.jpg/500px-Raphael_-_Saint_George_and_the_Dragon_-_National_Gallery_of_Art.jpg",
    feastDay: "April 23",
    link: "https://www.catholic.org/saints/saint.php?saint_id=275",
    updatedAt: new Date()
  },
  {
    name: "St. Rita of Cascia",
    nameTa: "புனித ரீட்டா",
    description: "St. Rita of Cascia was an Italian widow and Augustinian nun known for her piety, patience, and extraordinary endurance during a difficult marriage. After the tragic deaths of her abusive husband and two sons, she entered the Augustinian convent in Cascia. Rita became famous for her deep contemplative prayer and mystical experiences, including receiving a partial stigmata on her forehead resembling a thorn from Christ's crown. She is widely turned to as the patron saint of impossible causes, broken marriages, and desperate situations.",
    descriptionTa: "புனித ரீட்டா இத்தாலிய விதவை மற்றும் அகஸ்டினிய கன்னியாஸ்திரி ஆவார், இவர் தனது பக்தி, பொறுமை மற்றும் கடினமான திருமண வாழ்க்கையில் காட்டிய சகிப்புத்தன்மைக்காக அறியப்பட்டவர். தனது கணவர் மற்றும் இரண்டு மகன்களின் மரணத்திற்குப் பிறகு, அவர் காசியாவில் உள்ள அகஸ்டினிய மடத்தில் சேர்ந்தார். ரீட்டா தனது ஆழமான தியான செபம் மற்றும் கிறிஸ்துவுக்கு இணையான நெற்றியில் ஏற்பட்ட முள் காயத்தின் தழும்புகளுக்காகப் புகழ்பெற்றார். இவர் முடியாத காரியங்கள், உடைந்த திருமணங்கள் மற்றும் அவநம்பிக்கையான சூழ்நிலைகளின் பாதுகாவலராகப் போற்றப்படுகிறார்.",
    image: "https://upload.wikimedia.org/wikipedia/commons/thumb/b/b4/St_Rita.jpg/500px-St_Rita.jpg",
    feastDay: "May 22",
    link: "https://www.catholic.org/saints/saint.php?saint_id=205",
    updatedAt: new Date()
  },
  {
    name: "St. Anthony of Padua",
    nameTa: "புனித பதுவை அந்தோணியார்",
    description: "St. Anthony of Padua was a Portuguese Catholic priest and Franciscan friar, celebrated for his exceptional knowledge of scripture and powerful preaching. He traveled extensively in Italy and France, converting many and earning the title 'Hammer of Heretics.' Anthony had a profound love for the poor, and miracles were frequently attributed to his intercession during his lifetime. The Child Jesus famously appeared to him in a mystical vision, which is why he is traditionally depicted holding the Christ Child. He is globally sought after for finding lost articles and helping the needy.",
    descriptionTa: "புனித பதுவை அந்தோணியார் போர்த்துகீசிய கத்தோலிக்க குருவும் பிரான்சிஸ்கன் சபைத் துறவியும் ஆவார், இவர் தனது ஆழமான விவிலிய அறிவு மற்றும் சக்திவாய்ந்த போதனைக்காகப் புகழ்பெற்றவர். இவர் இத்தாலி மற்றும் பிரான்சில் பயணம் செய்து பலரை நல்வழிப்படுத்தினார். ஏழைகள் மீது மிகுந்த அன்பு கொண்டிருந்த இவர், வாழ்நாளில் பல புதுமைகளைச் செய்தார். குழந்தை இயேசு இவருக்குக் காட்சியாகத் தோன்றியதால், பாரம்பரியமாக இவர் குழந்தை இயேசுவை ஏந்தியவாறு சித்தரிக்கப்படுகிறார். இவர் தொலைந்த பொருட்களைக் கண்டறியவும், ஏழைகளுக்கு உதவவும் உலகளவில் வேண்டப்படுகிறார்.",
    image: "https://upload.wikimedia.org/wikipedia/commons/thumb/c/ca/Saint_Anthony_of_Padua_holding_the_Infant_Christ.jpg/500px-Saint_Anthony_of_Padua_holding_the_Infant_Christ.jpg",
    feastDay: "June 13",
    link: "https://www.catholic.org/saints/saint.php?saint_id=24",
    updatedAt: new Date()
  },
  {
    name: "St. Thomas the Apostle",
    nameTa: "புனித தோமா திருத்தூதர்",
    description: "St. Thomas was one of the Twelve Apostles of Jesus Christ, best known for his initial disbelief in Jesus' resurrection, demanding to touch His wounds. Upon seeing the risen Lord, he uttered the profound confession of faith: 'My Lord and my God.' Following Pentecost, Thomas traveled East to spread the Gospel, eventually arriving in India in 52 AD. He established several Christian communities along the Malabar Coast (now Kerala) before being martyred near Chennai. He is venerated as the Apostle of India.",
    descriptionTa: "புனித தோமா இயேசு கிறிஸ்துவின் பன்னிரண்டு திருத்தூதர்களில் ஒருவர். இயேசுவின் உயிர்த்தெழுதலைத் தொடக்கத்தில் நம்ப மறுத்து, அவருடைய காயங்களைத் தொட வேண்டும் என்று கேட்டதால் இவர் அறியப்படுகிறார். உயிர்த்தெழுந்த ஆண்டவரைக் கண்டதும், 'என் ஆண்டவரே, என் கடவுளே!' என்று விசுவாச அறிக்கை செய்தார். பெந்தகோஸ்து விழாவுக்குப் பிறகு, நற்செய்தியைப் பரப்ப கிழக்கே பயணம் செய்து கி.பி 52 இல் இந்தியா வந்தடைந்தார். சென்னைக்கு அருகில் மறைசாட்சியாக உயிர் நீப்பதற்கு முன் மலபார் கடற்கரையில் பல கிறிஸ்தவ சமூகங்களை நிறுவினார். இவர் இந்தியாவின் திருத்தூதராகப் போற்றப்படுகிறார்.",
    image: "https://upload.wikimedia.org/wikipedia/commons/thumb/d/d1/Rubens_Saint_Thomas.jpg/500px-Rubens_Saint_Thomas.jpg",
    feastDay: "July 3",
    link: "https://www.catholic.org/saints/saint.php?saint_id=410",
    updatedAt: new Date()
  },
  {
    name: "St. Alphonsus Liguori",
    nameTa: "புனித அல்போன்ஸ் லிகோரி",
    description: "St. Alphonsus Liguori was an Italian Catholic bishop, theologian, spiritual writer, and the founder of the Congregation of the Most Holy Redeemer (Redemptorists). Known for his pastoral approach and moral theology, he wrote major works on spiritual life, including the famous 'Glories of Mary.' He sought to make the sacrament of reconciliation accessible and compassionate for all. He was declared a Doctor of the Church for his immense contributions to moral theology and spiritual writing.",
    descriptionTa: "புனித அல்போன்ஸ் லிகோரி ஒரு இத்தாலிய கத்தோலிக்க ஆயர், ஆன்மீக எழுத்தாளர் மற்றும் மீட்பர் சபையை (ரெடெம்ப்டரிஸ்டுகள்) நிறுவியவர் ஆவார். இவர் கத்தோலிக்க திருச்சபையின் சிறந்த ஒழுக்கநெறி இறையியலாளர்களில் ஒருவராகக் கருதப்படுகிறார். இவர் ஆன்மீக வாழ்க்கை குறித்து 'மரியாவின் மகிமைகள்' போன்ற பல புகழ்பெற்ற நூல்களை எழுதினார். ஒப்புரவு அருட்சாதனத்தை அனைவருக்கும் எளியதாகவும் இரக்கமுள்ளதாகவும் மாற்ற முயன்றார். ஒழுக்கநெறி இறையியலுக்கு ஆற்றிய பங்களிப்புகளுக்காக இவர் திருச்சபையின் மறைவல்லுநராக அறிவிக்கப்பட்டார்.",
    image: "https://upload.wikimedia.org/wikipedia/commons/thumb/5/52/Sant%27Alfonso_Maria_de%27_Liguori.jpg/500px-Sant%27Alfonso_Maria_de%27_Liguori.jpg",
    feastDay: "August 1",
    link: "https://www.catholic.org/saints/saint.php?saint_id=1284",
    updatedAt: new Date()
  },
  {
    name: "St. Vincent de Paul",
    nameTa: "புனித வின்சென்ட் தே பவுல்",
    description: "St. Vincent de Paul was a French Catholic priest who dedicated his entire life to serving the poor, the sick, and marginalized. He founded the Congregation of the Mission (Vincentians) to train priests and preach to rural populations. Alongside St. Louise de Marillac, he established the Daughters of Charity, the first non-cloistered community of religious women dedicated to active charity. Vincent was renowned for his practical compassion, organizational skill, and humility, becoming a universal patron of charitable societies.",
    descriptionTa: "புனித வின்சென்ட் தே பவுல் ஏழைகளுக்கும், நோயாளிகளுக்கும், நலிவடைந்தோருக்கும் சேவை செய்யத் தன் வாழ்நாளை அர்ப்பணித்த பிரெஞ்சு கத்தோலிக்க குரு ஆவார். இவர் கிராமப்புற மக்களுக்குப் போதிக்க வின்சென்டியன் சபையை நிறுவினார். புனித லூயிஸ் டி மரிலாக் என்பவரோடு இணைந்து, தொண்டுப் பணிகளுக்காக அர்ப்பணிக்கப்பட்ட 'அன்பின் புதல்விகள்' என்ற சபையை நிறுவினார். இவரது நடைமுறை இரக்கம், நிறுவனத் திறன் மற்றும் எளிமைக்காகப் புகழ்பெற்ற இவர், அனைத்து தொண்டு நிறுவனங்களின் உலகளாவிய பாதுகாவலராக விளக்குகிறார்.",
    image: "https://upload.wikimedia.org/wikipedia/commons/thumb/d/d3/Saint_Vincent_de_Paul_by_Simon_de_Vlieger.jpg/500px-Saint_Vincent_de_Paul_by_Simon_de_Vlieger.jpg",
    feastDay: "September 27",
    link: "https://www.catholic.org/saints/saint.php?saint_id=326",
    updatedAt: new Date()
  },
  {
    name: "St. Therese of Lisieux",
    nameTa: "புனித குழந்தை இயேசு தெரசா",
    description: "St. Therese of Lisieux, also known as 'The Little Flower,' was a French Carmelite nun who died at the young age of 24. She developed the spiritual path of 'The Little Way,' which emphasizes doing ordinary actions with extraordinary love. Her autobiography, 'Story of a Soul,' became a global bestseller and inspired millions with its simplicity and depth. Despite never leaving her convent as a missionary, she was named the co-patroness of missions and declared a Doctor of the Church by Pope John Paul II.",
    descriptionTa: "புனித குழந்தை இயேசு தெரசா 'சின்ன மலர்' என்று அழைக்கப்படும் பிரெஞ்சு கார்மேல் சபைத் துறவி ஆவார். இவர் தனது 24-ஆம் வயதில் இறைவனடி சேர்ந்தார். சாதாரண காரியங்களை அசாதாரண அன்போடு செய்வதை வலியுறுத்தும் 'சிறு வழி' என்ற ஆன்மீக வழியைக் கண்டறிந்தார். இவரது சுயசரிதையான 'ஒரு ஆன்மாவின் கதை' உலகளவில் பல மில்லியன் மக்களை ஈர்த்தது. இவர் ஒருபோதும் மடம் விட்டு வெளியே செல்லாத போதிலும், மறைபரப்புப் பணிகளின் உலகளாவிய பாதுகாவலியாக அறிவிக்கப்பட்டு திருச்சபையின் மறைவல்லுநராக உயர்த்தப்பட்டார்.",
    image: "https://upload.wikimedia.org/wikipedia/commons/thumb/a/ae/Th%C3%A9r%C3%A8se_de_Lisieux_1896.jpg/500px-Th%C3%A9r%C3%A8se_de_Lisieux_1896.jpg",
    feastDay: "October 1",
    link: "https://www.catholic.org/saints/saint.php?saint_id=105",
    updatedAt: new Date()
  },
  {
    name: "St. Martin de Porres",
    nameTa: "புனித மார்ட்டின் டி போரஸ்",
    description: "St. Martin de Porres was a lay brother of the Dominican Order in Lima, Peru. Facing racial discrimination due to his mixed heritage, he responded with humility, piety, and boundless charity. He established orphanages, distributed alms, and cared for the sick of all backgrounds, including slaves and indigenous peoples. Martin was gifted with extraordinary spiritual charisms, including healing, bi-location, and a unique harmony with animals. He is the patron saint of mixed-race people, barbers, and social justice.",
    descriptionTa: "புனித மார்ட்டின் டி போரஸ் பெரு நாட்டின் லீமா நகரில் டோமினிகன் சபையின் சகோதரர் ஆவார். தனது இனப் பின்னணி காரணமாகப் பல பாகுபாடுகளை எதிர்கொண்ட போதிலும், இவர் எளிமை, பக்தி மற்றும் எல்லையற்ற தொண்டு மகோன்னதத்தோடு பதிலளித்தார். அனாதை இல்லங்களை நிறுவி, ஏழைகளுக்கும் நோயாளிகளுக்கும், அடிமைகளுக்கும் பாகுபாடின்றி உதவினார். குணப்படுத்துதல், ஒரே நேரத்தில் இரு இடங்களில் தோன்றுதல் மற்றும் விலங்குகளுடன் இணக்கமாக இருத்தல் போன்ற ஆன்மீகக் கொடைகளைப் பெற்றிருந்தார். இவர் சமூக நீதி மற்றும் முடிதிருத்துவோரின் பாதுகாவலர் ஆவார்.",
    image: "https://upload.wikimedia.org/wikipedia/commons/thumb/c/c2/San_Martin_de_Porres.jpg/500px-San_Martin_de_Porres.jpg",
    feastDay: "November 3",
    link: "https://www.catholic.org/saints/saint.php?saint_id=156",
    updatedAt: new Date()
  },
  {
    name: "St. Francis Xavier",
    nameTa: "புனித பிரான்சிஸ் சவேரியார்",
    description: "St. Francis Xavier was a Spanish Basque Jesuit missionary who was a co-founder of the Society of Jesus (Jesuits). He led an extensive mission in Asia, traveling through India, Malacca, the Moluccas, and Japan, converting hundreds of thousands to Christianity. He adopted local languages and customs to effectively share the Gospel. Xavier died on Shangchuan Island while waiting for permission to enter China. He is revered as the patron saint of Catholic missions and the Apostle of the East.",
    descriptionTa: "புனித பிரான்சிஸ் சவேரியார் இயேசு சபையின் (ஜேசுட்ஸ்) இணை நிறுவனரான ஸ்பானிய கத்தோலிக்க மிஷனரி ஆவார். இந்தியா, மலாக்கா, ஜப்பான் உள்ளிட்ட ஆசிய நாடுகளில் விரிவான நற்செய்திப் பணிகளை மேற்கொண்டு, பல்லாயிரக்கணக்கானோரை கிறிஸ்தவ விசுவாசத்திற்கு ஈர்த்தார். நற்செய்தியைப் பகிர்ந்து கொள்ள உள்ளூர் மொழிகளையும் பழக்கவழக்கங்களையும் கற்றுக்கொண்டார். சீனாவுக்குள் நுழையக் காத்திருந்தபோது சங்சுவான் தீவில் உயிர் நீத்தார். இவர் மறைபரப்புப் பணிகளின் உலகளாவிய பாதுகாவலராகப் போற்றப்படுகிறார்.",
    image: "https://upload.wikimedia.org/wikipedia/commons/thumb/4/41/StFrancisXavier.jpg/500px-StFrancisXavier.jpg",
    feastDay: "December 3",
    link: "https://www.catholic.org/saints/saint.php?saint_id=423",
    updatedAt: new Date()
  }
];

function getDefaultSaintForDate(date = new Date()) {
  const month = date.getMonth(); // 0-11
  const day = date.getDate();    // 1-31
  
  if (month === 1 && day === 4) {
    return ST_JOHN_DE_BRITTO;
  }
  
  return FALLBACK_SAINTS[month];
}

function splitIntoSentences(text) {
  let temp = text
    .replace(/St\./g, 'St_TEMP_DOT')
    .replace(/St\u00a0/g, 'St_TEMP_SPACE')
    .replace(/Dr\./g, 'Dr_TEMP_DOT')
    .replace(/Mr\./g, 'Mr_TEMP_DOT')
    .replace(/Mrs\./g, 'Mrs_TEMP_DOT')
    .replace(/Fr\./g, 'Fr_TEMP_DOT');
    
  const sentences = temp.match(/[^.!?]+[.!?]+(\s|$)/g) || [temp];
  
  return sentences.map(s => s
    .replace(/St_TEMP_DOT/g, 'St.')
    .replace(/St_TEMP_SPACE/g, 'St.')
    .replace(/Dr_TEMP_DOT/g, 'Dr.')
    .replace(/Mr_TEMP_DOT/g, 'Mr.')
    .replace(/Mrs_TEMP_DOT/g, 'Mrs.')
    .replace(/Fr_TEMP_DOT/g, 'Fr.')
  );
}

async function translateText(text, targetLang = 'ta') {
  if (!text || text.trim() === '') return '';
  try {
    const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=en&tl=${targetLang}&dt=t&q=${encodeURIComponent(text)}`;
    const response = await axios.get(url, { timeout: 8000 });
    if (response.data && response.data[0]) {
      return response.data[0].map(item => item[0]).join('').trim();
    }
  } catch (error) {
    console.error('Translation error:', error.message);
  }
  return '';
}

async function fetchDailySaint() {
  const today = new Date();
  
  // February 4th is the Patron Saint Feast Day - force override to St. John de Britto
  if (today.getMonth() === 1 && today.getDate() === 4) {
    dailySaint = {
      ...ST_JOHN_DE_BRITTO,
      date: today.toISOString().split('T')[0],
      status: "Synced",
      lastSynced: new Date()
    };
    await saveSaintToDatabase(dailySaint);
    console.log('✨ Saint of the Day forced to Patron Saint St. John de Britto (Feb 4th)');
    return;
  }

  // Load configured fetch URL from SiteSettings
  let fetchUrl = 'https://www.catholic.org/saints/sofd.php';
  try {
    const SiteSettings = require('../models/SiteSettings');
    const urlSetting = await SiteSettings.findOne({ key: 'daily_saint_fetch_url' }).lean();
    if (urlSetting && urlSetting.value && urlSetting.value.trim() !== '') {
      fetchUrl = urlSetting.value.trim();
    }
  } catch (err) {
    console.error('Failed to lookup daily_saint_fetch_url setting:', err.message);
  }

  try {
    console.log(`Fetching Saint of the Day from: ${fetchUrl}`);
    const response = await axios.get(fetchUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9',
        'Cache-Control': 'no-cache',
        'Pragma': 'no-cache'
      },
      timeout: 15000
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
      throw new Error('Could not find Saint of the Day link on index page.');
    }
    
    const absoluteUrl = saintLink.startsWith('http') ? saintLink : `https://www.catholic.org${saintLink}`;
    console.log(`Fetching Saint Detail Page: ${absoluteUrl}`);
    
    const saintRes = await axios.get(absoluteUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      },
      timeout: 15000
    });
    
    const $s = cheerio.load(saintRes.data);
    
    const name = $s('h1').first().text().trim() || 'Saint of the Day';
    
    // Find image
    let image = null;
    $s('img').each((i, el) => {
      const src = $s(el).attr('data-src') || $s(el).attr('src');
      if (src && src.includes('/files/images/saints/')) {
        image = src;
        return false;
      }
    });
    
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
    
    if (!image) {
      $s('img').each((i, el) => {
        const src = $s(el).attr('data-src') || $s(el).attr('src');
        if (src && src.includes('files/images/media')) {
          image = src;
          return false;
        }
      });
    }
    
    if (image && !image.startsWith('http')) {
      image = `https://www.catholic.org${image}`;
    }
    
    // Parse Biography paragraphs
    let bio = '';
    $s('div.col-md-8 p, div#content p, article p, div.p-10 p').each((i, el) => {
      const text = $s(el).text().trim();
      if (text && text.length > 50 && 
          !text.includes('Printable Catholic') && 
          !text.includes('Shop St.') && 
          !text.includes('Subscribe') && 
          !text.includes('Donate') && 
          !text.includes('Copyright') && 
          !text.includes('Author and Publisher') &&
          !text.includes('generous supporters') &&
          !text.includes('Catholic Online School') &&
          !text.includes('gave just $') &&
          !text.includes('Be Courageous') &&
          !text.includes('Tax Identification Number') &&
          !text.includes('tax-deductible') &&
          !text.includes('Not-for-Profit')) {
        bio += text + ' ';
      }
    });
    
    const cleanBio = bio.replace(/\s+/g, ' ').trim();
    const sentences = splitIntoSentences(cleanBio);
    const shortBio = sentences.slice(0, 5).join(' ').trim();
    const description = sentences.length > 5 ? `${shortBio}...` : shortBio;
    
    let feastDay = '';
    const pageText = $s('body').text();
    const feastMatch = pageText.match(/Feast\s*Day\s*:\s*([A-Za-z]+\s+\d+)/i);
    if (feastMatch) {
      feastDay = feastMatch[1].trim();
    } else {
      feastDay = new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric' });
    }

    // Translate to Tamil at scrape-time
    const nameTa = await translateText(name);
    const descriptionTa = await translateText(description);
    
    dailySaint = {
      date: today.toISOString().split('T')[0],
      name,
      nameTa: nameTa || name,
      description,
      descriptionTa: descriptionTa || description,
      image,
      feastDay,
      link: absoluteUrl,
      status: "Synced",
      lastSynced: new Date()
    };
    
    await saveSaintToDatabase(dailySaint);
    console.log('✨ Saint of the Day updated successfully from Catholic Online:', name);
    
    // Clear any retry timeouts since we succeeded
    if (retryTimeout) {
      clearTimeout(retryTimeout);
      retryTimeout = null;
    }
  } catch (error) {
    console.error('❌ Error fetching daily saint from Catholic Online:', error.message);
    
    // Use last cached database/in-memory saint if available, just updating status to Error
    let lastCached = null;
    try {
      const SiteSettings = require('../models/SiteSettings');
      const cacheSetting = await SiteSettings.findOne({ key: 'daily_saint_cache' }).lean();
      if (cacheSetting && cacheSetting.value) {
        lastCached = JSON.parse(cacheSetting.value);
      }
    } catch (e) {}

    if (lastCached) {
      dailySaint = {
        ...lastCached,
        status: "Error",
        lastSynced: lastCached.lastSynced ? new Date(lastCached.lastSynced) : new Date()
      };
    } else {
      // No cache, use month-appropriate fallback
      const fallback = getDefaultSaintForDate(today);
      dailySaint = {
        ...fallback,
        date: today.toISOString().split('T')[0],
        status: "Error",
        lastSynced: new Date()
      };
    }

    await saveSaintToDatabase(dailySaint);
    console.log('ℹ️ Using fallback/cached daily saint:', dailySaint.name);

    // Schedule retry in 30 minutes
    if (!retryTimeout) {
      console.log('⏰ Scheduling retry for daily saint fetch in 30 minutes...');
      retryTimeout = setTimeout(() => {
        retryTimeout = null;
        fetchDailySaint();
      }, 30 * 60 * 1000);
    }
  }
}

async function saveSaintToDatabase(saintObj) {
  try {
    const SiteSettings = require('../models/SiteSettings');
    await SiteSettings.findOneAndUpdate(
      { key: 'daily_saint_cache' },
      {
        value: JSON.stringify(saintObj),
        label: 'Daily Saint Cache',
        type: 'text'
      },
      { upsert: true, new: true }
    );
  } catch (err) {
    console.error('Failed to save daily saint cache to database:', err.message);
  }
}

async function loadCachedSaint() {
  try {
    const SiteSettings = require('../models/SiteSettings');
    const cacheSetting = await SiteSettings.findOne({ key: 'daily_saint_cache' }).lean();
    if (cacheSetting && cacheSetting.value) {
      dailySaint = JSON.parse(cacheSetting.value);
      // Ensure date objects are parsed correctly
      if (dailySaint.lastSynced) {
        dailySaint.lastSynced = new Date(dailySaint.lastSynced);
      }
      console.log('ℹ️ Loaded daily saint of the day from database cache:', dailySaint.name);
    } else {
      // If no cache, load monthly default initially
      dailySaint = {
        ...getDefaultSaintForDate(new Date()),
        date: new Date().toISOString().split('T')[0],
        status: "Error",
        lastSynced: new Date()
      };
    }
  } catch (err) {
    console.error('Failed to load daily saint cache from database:', err.message);
  }
}

// Immediately load cache from DB on startup, then trigger fetch (avoid blocking startup)
loadCachedSaint().then(() => {
  fetchDailySaint();
});

// Schedule for 12:00 AM IST daily (Asia/Kolkata)
cron.schedule('0 0 * * *', () => {
  console.log('⏰ Running daily saint of the day update cron job (12:00 AM IST)...');
  fetchDailySaint();
}, {
  timezone: 'Asia/Kolkata'
});

const getDailySaint = () => {
  if (!dailySaint) {
    dailySaint = {
      ...getDefaultSaintForDate(new Date()),
      date: new Date().toISOString().split('T')[0],
      status: "Error",
      lastSynced: new Date()
    };
  }
  return dailySaint;
};

module.exports = { getDailySaint, fetchDailySaint };
