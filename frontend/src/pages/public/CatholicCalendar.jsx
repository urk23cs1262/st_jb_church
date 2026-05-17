import churchLogo from '../../assets/image.png';
import { motion } from 'framer-motion';
import { GiChurch } from 'react-icons/gi';
import PageHero from '../../components/common/PageHero';

const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];
const FEASTS = [
  { month: 0, day: 1, name: 'Mary, Mother of God' }, { month: 0, day: 6, name: 'Epiphany of the Lord' },
  { month: 1, day: 2, name: 'Presentation of the Lord' }, { month: 1, day: 4, name: 'Feast of St. John de Britto ⭐' },
  { month: 1, day: 11, name: 'Our Lady of Lourdes' }, { month: 2, day: 19, name: 'St. Joseph' },
  { month: 2, day: 25, name: 'Annunciation of the Lord' }, { month: 3, day: 23, name: 'St. George' },
  { month: 4, day: 1, name: 'St. Joseph the Worker' }, { month: 4, day: 13, name: 'Our Lady of Fatima' },
  { month: 5, day: 24, name: 'Birth of St. John the Baptist' }, { month: 5, day: 29, name: 'Sts. Peter & Paul' },
  { month: 6, day: 16, name: 'Our Lady of Mount Carmel' }, { month: 7, day: 15, name: 'Assumption of Mary' },
  { month: 7, day: 28, name: 'St. Augustine' }, { month: 8, day: 8, name: 'Birth of Mary' },
  { month: 9, day: 4, name: 'St. Francis of Assisi' }, { month: 9, day: 7, name: 'Our Lady of the Rosary' },
  { month: 9, day: 18, name: 'St. Luke the Evangelist' }, { month: 10, day: 1, name: 'All Saints Day' },
  { month: 10, day: 2, name: 'All Souls Day' }, { month: 11, day: 8, name: 'Immaculate Conception' },
  { month: 11, day: 25, name: 'Christmas — Birth of Jesus' }, { month: 11, day: 26, name: 'St. Stephen' },
];

export default function CatholicCalendar() {
  const now = new Date();
  return (
    <div className="min-h-screen pt-10 bg-church-cream ">
      <PageHero title={<>Catholic Calendar</>} subtitle={<>Liturgical Year</>} />
      <section className="py-16">
        <div className="max-w-5xl mx-auto px-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {MONTHS.map((month, mi) => {
              const monthFeasts = FEASTS.filter(f => f.month === mi);
              return (
                <motion.div key={mi} initial={{ opacity: 0, y: 15 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: mi * 0.04 }}
                  className={`church-card ${mi === now.getMonth() ? 'border-church-gold shadow-gold' : ''}`}>
                  <h3 className={`font-display text-lg font-bold mb-3 ${mi === now.getMonth() ? 'text-church-gold' : 'text-church-royal-blue '}`}>
                    {mi === now.getMonth() && '📅 '}{month}
                  </h3>
                  {monthFeasts.length === 0 ? <p className="text-gray-400 text-sm">No major feast days</p> : (
                    <ul className="space-y-2">
                      {monthFeasts.map((f, fi) => (
                        <li key={fi} className="flex items-start gap-2 text-sm">
                          <span className={`font-bold flex-shrink-0 ${f.name.includes('⭐') ? 'text-church-gold' : 'text-church-maroon'} w-6`}>{f.day}</span>
                          <span className="text-gray-600 ">{f.name}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>
    </div>
  );
}
