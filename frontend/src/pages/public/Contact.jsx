import churchLogo from '../../assets/image.png';
import api from '../../services/api';
import { useState } from 'react';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import { FiMapPin, FiPhone, FiMail, FiClock, FiSend } from 'react-icons/fi';
import { FaWhatsapp } from 'react-icons/fa';
import { GiChurch } from 'react-icons/gi';
import PageHero from '../../components/common/PageHero';

export default function Contact() {
  const { t } = useTranslation();
  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm();

  const onSubmit = async (data) => {
    try {
      await api.post('/tickets', {
        subject: data.subject,
        message: data.message,
        category: 'enquiry',
        priority: 'medium'
      });
      toast.success('Message sent! We will get back to you soon.');
      reset();
    } catch (e) {
      toast.error(e.response?.data?.message || 'Failed to send message');
    }
  };

  return (
    <div className="min-h-screen pt-10 bg-church-cream ">
      <PageHero title={<>{t('nav.contact')}</>} subtitle={<>Get In Touch</>} />

      <section className="py-16">
        <div className="max-w-6xl mx-auto px-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            {/* Info */}
            <motion.div initial={{ opacity: 0, x: -30 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }}>
              <h2 className="section-title mb-8">Church Information</h2>
              <div className="space-y-5 mb-8">
                {[
                  { icon: <FiMapPin />, title: 'Address', content: 'RJWM+XQ4, Murthi Nagar, Kalayarkoil, Tamil Nadu 630551, India' },
                  { icon: <FiPhone />, title: 'Phone', content: '+91 04577 XXXXXX', link: 'tel:+9104577' },
                  { icon: <FiMail />, title: 'Email', content: 'sjdbchurch@gmail.com', link: 'mailto:sjdbchurch@gmail.com' },
                  { icon: <FiClock />, title: 'Office Hours', content: 'Monday – Saturday: 9:00 AM – 5:00 PM\nClosed on Sundays and public holidays' },
                ].map((item, i) => (
                  <div key={i} className="flex items-start gap-4">
                    <div className="w-10 h-10 rounded-xl bg-church-gradient flex items-center justify-center flex-shrink-0 shadow-gold">
                      <span className="text-white">{item.icon}</span>
                    </div>
                    <div>
                      <p className="font-semibold text-gray-800  text-sm">{item.title}</p>
                      {item.link ? (
                        <a href={item.link} className="text-church-gold hover:underline text-sm">{item.content}</a>
                      ) : (
                        <p className="text-gray-500  text-sm whitespace-pre-line">{item.content}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {/* WhatsApp */}
              <a href="https://wa.me/7639520006?text=Hello%20St.%20John%20de%20Britto's%20Church" target="_blank" rel="noreferrer"
                className="flex items-center gap-3 bg-green-500 text-white px-6 py-4 rounded-2xl hover:bg-green-600 transition-all shadow-lg mb-6 font-semibold">
                <FaWhatsapp className="text-2xl" /> Chat with us on WhatsApp
              </a>

              {/* Google Maps */}
              <div className="rounded-2xl overflow-hidden shadow-card border border-gray-100 ">
                <iframe
                  title="St. John de Britto's Church Location"
                  width="100%" height="320"
                  style={{ border: 0 }}
                  loading="lazy"
                  src="https://maps.google.com/maps?q=St.+John+de+Britto+Church,+Kalayarkoil,+Tamil+Nadu+630551&t=&z=16&ie=UTF8&iwloc=&output=embed"
                />

              </div>
            </motion.div>

            {/* Contact form */}
            <motion.div initial={{ opacity: 0, x: 30 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }}>
              <h2 className="section-title mb-8">Send Us a Message</h2>
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-5 glass-card p-8">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="church-label">Your Name *</label>
                    <input {...register('name', { required: true })} className="church-input" placeholder="John Paul" />
                    {errors.name && <p className="text-red-500 text-xs mt-1">Required</p>}
                  </div>
                  <div>
                    <label className="church-label">Phone</label>
                    <input {...register('phone')} className="church-input" placeholder="+91 98765 XXXXX" />
                  </div>
                </div>
                <div>
                  <label className="church-label">Email *</label>
                  <input {...register('email', { required: true, pattern: /^\S+@\S+$/i })} className="church-input" placeholder="you@example.com" />
                  {errors.email && <p className="text-red-500 text-xs mt-1">Valid email required</p>}
                </div>
                <div>
                  <label className="church-label">Subject *</label>
                  <input {...register('subject', { required: true })} className="church-input" placeholder="How can we help you?" />
                </div>
                <div>
                  <label className="church-label">Message *</label>
                  <textarea {...register('message', { required: true })} rows={5} className="church-input resize-none" placeholder="Your message here..." />
                  {errors.message && <p className="text-red-500 text-xs mt-1">Required</p>}
                </div>
                <button type="submit" disabled={isSubmitting} className="btn-gold w-full justify-center py-4 text-base">
                  {isSubmitting ? <span className="animate-spin">⏳</span> : <FiSend />}
                  {isSubmitting ? 'Sending...' : 'Send Message'}
                </button>
              </form>
            </motion.div>
          </div>
        </div>
      </section>
    </div>
  );
}
