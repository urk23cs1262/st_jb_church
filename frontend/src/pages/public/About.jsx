import churchLogo from '../../assets/image.png';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { GiChurch, GiCrucifix } from 'react-icons/gi';
import PageHero from '../../components/common/PageHero';

const timeline = [
  { year: '1870s', event: 'Church founded by Jesuit missionaries in Kalayarkoil region' },
  { year: '1900', event: 'Stone church structure built by the local Catholic community' },
  { year: '1952', event: 'Dedicated to St. John de Britto (Arulanandar), the Jesuit martyr' },
  { year: '1980', event: 'Major renovation and expansion of the church hall' },
  { year: '2000', event: 'New altar and stained glass windows installed' },
  { year: '2010', event: 'Community center and catechism hall constructed' },
  { year: '2020', event: 'Digital services introduced for parish management' },
];

export default function About() {
  const { t } = useTranslation();
  return (
    <div className="min-h-screen pt-10 bg-church-cream ">
      {/* Hero */}
      <PageHero title={<>{t('nav.about')}</>} subtitle={<>Our Story</>} description={<>Rich in faith, rooted in history, growing in love</>} />

      {/* Church History */}
      <section className="py-20">
        <div className="max-w-6xl mx-auto px-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center mb-20">
            <motion.div initial={{ opacity: 0, x: -30 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }}>
              <p className="section-subtitle mb-2">Our History</p>
              <h2 className="section-title mb-6">A Church with Deep Roots</h2>
              <div className="space-y-4 text-gray-600 ">
                <p>St. John de Britto's Church, situated in Kalayarkoil, Tamil Nadu, is a beacon of faith in the Sivaganga Diocese. Named after the blessed Jesuit martyr St. John de Britto (Arulanandar), the church has been serving the faithful for over a century.</p>
                <p>The parish draws its inspiration from the life of St. John de Britto, a Portuguese Jesuit who embraced Tamil culture and gave his life for his faith in 1693. Canonized in 1947, he remains the patron of Tamil Catholics.</p>
                <p>Today, the parish encompasses several sub-stations spread across the Kalayarkoil area, serving hundreds of Catholic families with dedication and pastoral care.</p>
              </div>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="glass-card p-8 space-y-6"
            >
              <div>
                <h3 className="font-display text-xl font-bold text-church-royal-blue  mb-2">Mission</h3>
                <p className="text-gray-600  text-sm">To proclaim the Gospel of Jesus Christ, celebrate the sacraments, build a vibrant faith community, and serve the poor and marginalized in the spirit of St. John de Britto.</p>
              </div>
              <div>
                <h3 className="font-display text-xl font-bold text-church-royal-blue  mb-2">Vision</h3>
                <p className="text-gray-600  text-sm">To be a living community of disciples, rooted in the Eucharist, known for our love, justice, and missionary zeal, serving the entire Kalayarkoil region.</p>
              </div>
              <div className="grid grid-cols-2 gap-4 pt-4 border-t border-gray-100 ">
                {[['Diocese', 'Sivaganga Diocese'], ['Parish', 'Kalayarkoil Parish'], ['Sub-stations', '6+ Stations'], ['Founded', '1870s']].map(([k, v]) => (
                  <div key={k}>
                    <p className="text-xs text-gray-400 uppercase">{k}</p>
                    <p className="font-semibold text-gray-800  text-sm">{v}</p>
                  </div>
                ))}
              </div>
            </motion.div>
          </div>

          {/* Patron Saint */}
          <div className="glass-card p-8 md:p-12 mb-20 text-center">
            <GiCrucifix className="text-church-gold text-5xl mx-auto mb-4" />
            <h2 className="section-title mb-4">Our Patron Saint</h2>
            <h3 className="text-2xl font-display text-church-gold font-bold mb-2">St. John de Britto</h3>
            <p className="text-gold-600 font-tamil text-lg mb-4">புனித அருளானந்தர்</p>
            <p className="text-gray-600  max-w-3xl mx-auto leading-relaxed">
              Born on March 1, 1647, in Lisbon, Portugal, St. John de Britto was a Jesuit priest and missionary who worked in Tamil Nadu. Known as "Arulanandar" (Blessed in Grace), he fully embraced Tamil culture, learning the language and adopting the lifestyle of a Brahmin sage. He was martyred on February 4, 1693, at Oriur (near Ramnad) for his faith. Pope Pius XII canonized him on June 22, 1947. His feast day is celebrated on February 4th.
            </p>
          </div>

          {/* Timeline */}
          <div>
            <p className="section-subtitle text-center mb-2">Through the Years</p>
            <h2 className="section-title text-center mb-12">Church Timeline</h2>
            <div className="relative">
              <div className="absolute left-1/2 top-0 bottom-0 w-0.5 bg-gradient-to-b from-church-gold to-church-royal-blue hidden md:block" />
              <div className="space-y-8">
                {timeline.map((item, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, x: i % 2 === 0 ? -30 : 30 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    className={`flex items-center gap-6 ${i % 2 === 0 ? 'md:flex-row' : 'md:flex-row-reverse'}`}
                  >
                    <div className={`flex-1 ${i % 2 === 0 ? 'md:text-right' : 'md:text-left'}`}>
                      <div className="church-card inline-block text-left">
                        <p className="text-church-gold font-bold font-display text-lg">{item.year}</p>
                        <p className="text-gray-600  text-sm">{item.event}</p>
                      </div>
                    </div>
                    <div className="hidden md:flex w-10 h-10 rounded-full bg-church-gradient items-center justify-center flex-shrink-0 shadow-gold z-10">
                      <GiCrucifix className="text-white text-sm" />
                    </div>
                    <div className="flex-1 hidden md:block" />
                  </motion.div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
