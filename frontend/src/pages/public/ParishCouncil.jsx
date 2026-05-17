import churchLogo from '../../assets/image.png';
import { motion } from 'framer-motion';
import { GiChurch } from 'react-icons/gi';
import PageHero from '../../components/common/PageHero';

const COUNCIL_MEMBERS = [
  { role: 'Parish Priest', name: 'Rev. Fr. Parish Priest', note: 'Ex-officio President' },
  { role: 'President', name: 'Mr. A. Xavier', phone: '+91 98765 XXXXX' },
  { role: 'Vice President', name: 'Mr. B. Raj', phone: '+91 87654 XXXXX' },
  { role: 'Secretary', name: 'Mrs. C. Mary', phone: '+91 76543 XXXXX' },
  { role: 'Treasurer', name: 'Mr. D. Peter', phone: '+91 65432 XXXXX' },
  { role: 'Women Wing', name: 'Mrs. E. Rose', phone: '+91 54321 XXXXX' },
  { role: 'Youth Wing', name: 'Mr. F. John', phone: '+91 43210 XXXXX' },
  { role: 'Catechism Head', name: 'Mrs. G. Elizabeth', phone: '+91 32109 XXXXX' },
];

export default function ParishCouncil() {
  return (
    <div className="min-h-screen pt-20 bg-church-cream ">
      <PageHero title={<>Parish Council</>} subtitle={<>Parish Governance</>} />
      <section className="py-16">
        <div className="max-w-4xl mx-auto px-4">
          <p className="text-center text-gray-600  mb-12 max-w-2xl mx-auto">
            The Parish Council is the governing body of St. John de Britto's Church, working alongside the Parish Priest to serve the spiritual and temporal needs of the parish community.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            {COUNCIL_MEMBERS.map((m, i) => (
              <motion.div key={i} initial={{ opacity: 0, y: 15 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.06 }} className="church-card flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-church-gradient flex items-center justify-center flex-shrink-0 shadow-gold">
                  <span className="text-white font-bold">{m.name[0]}</span>
                </div>
                <div>
                  <p className="font-semibold text-gray-800 ">{m.name}</p>
                  <p className="text-church-gold text-sm font-medium">{m.role}</p>
                  {m.note && <p className="text-xs text-gray-400">{m.note}</p>}
                  {m.phone && <p className="text-xs text-gray-400">{m.phone}</p>}
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
