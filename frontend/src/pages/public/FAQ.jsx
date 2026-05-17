import churchLogo from '../../assets/image.png';
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiChevronDown, FiChevronUp } from 'react-icons/fi';
import { GiChurch } from 'react-icons/gi';
import PageHero from '../../components/common/PageHero';

const FAQS = [
  { q: 'How do I book a Holy Mass?', a: 'You can book a Holy Mass through our Member Portal. Create an account, login, and navigate to "Book a Mass" in your dashboard. Select your preferred date, mass type, and intention.' },
  { q: 'How do I request a baptism certificate?', a: 'Login to your account and go to Dashboard > Request Documents. Select "Baptism Certificate", fill in the required details, and submit. Our office will verify and upload the certificate within 3-5 working days.' },
  { q: 'What are the church office hours?', a: 'Our parish office is open Monday to Saturday from 9:00 AM to 5:00 PM. We are closed on Sundays and public holidays. You can also reach us via phone or email.' },
  { q: 'How can I become a parish member?', a: 'Register on this website and visit the parish office with your proof of residence and baptism certificate. After verification, you will be issued a Parish Member ID.' },
  { q: 'How do I report an emergency or urgent need?', a: 'For urgent pastoral needs (last rites, hospital visits), please call the parish office directly or use the emergency announcement section. For non-urgent matters, use the Contact form or submit a ticket.' },
  { q: 'Can I submit a prayer request anonymously?', a: 'Yes! When submitting a prayer request, you can leave the name field blank and choose to keep your intention private. Private intentions are only seen by the admin.' },
  { q: 'How do I register for an event?', a: 'Navigate to the Events page, find the event you want to attend, and click "Register Now". You need to be logged in to register. You will receive a confirmation notification.' },
  { q: 'Is this website available in Tamil?', a: 'Yes! You can switch between English and Tamil using the language toggle in the navigation bar. Both languages are fully supported throughout the website.' },
];

export default function FAQ() {
  const [open, setOpen] = useState(null);
  return (
    <div className="min-h-screen pt-20 bg-church-cream ">
      <PageHero title={<>Frequently Asked Questions</>} subtitle={<>Help Center</>} />
      <section className="py-16">
        <div className="max-w-3xl mx-auto px-4">
          <div className="space-y-3">
            {FAQS.map((faq, i) => (
              <motion.div key={i} initial={{ opacity: 0, y: 10 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.05 }} className="church-card overflow-hidden">
                <button onClick={() => setOpen(open === i ? null : i)} className="w-full flex items-center justify-between text-left p-1">
                  <h3 className="font-semibold text-gray-800  text-base pr-4">{faq.q}</h3>
                  {open === i ? <FiChevronUp className="text-church-gold flex-shrink-0" /> : <FiChevronDown className="text-gray-400 flex-shrink-0" />}
                </button>
                <AnimatePresence>
                  {open === i && (
                    <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                      <p className="text-gray-600  text-sm leading-relaxed pt-3 border-t border-gray-100  mt-2">{faq.a}</p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
