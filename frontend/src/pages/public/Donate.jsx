import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { FiHeart, FiUser, FiSmartphone, FiArrowRight, FiCheckCircle, FiCopy, FiInfo, FiDownload, FiLock } from 'react-icons/fi';
import { GiChurch, GiDove, GiCandleLight, GiGreekTemple } from 'react-icons/gi';
import { useState, useEffect, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import PageHero from '../../components/common/PageHero';
import churchLogo from '../../assets/image.png';

const DONATION_TYPES = [
  { id: 'general', label: 'General Offering', icon: <GiDove />, color: 'border-blue-200' },
  { id: 'feast', label: 'Feast Donation', icon: <GiChurch />, color: 'border-rose-200' },
  { id: 'building', label: 'Building Fund', icon: <GiGreekTemple />, color: 'border-indigo-200' },
  { id: 'candle', label: 'Candle Offering', icon: <GiCandleLight />, color: 'border-amber-200' },
];

const UPI_ID = '7639520006@sbi';
const MERCHANT_NAME = "St. John de Britto's Church";

export default function Donate() {
  const { t } = useTranslation();
  const { isAuthenticated, user } = useAuth();
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [selectedType, setSelectedType] = useState('general');
  const [formData, setFormData] = useState(null);
  const [isMobile, setIsMobile] = useState(false);
  const [finalDonation, setFinalDonation] = useState(null);
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);
  const receiptRef = useRef(null);
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm();

  useEffect(() => {
    const checkMobile = () => setIsMobile(/iPhone|iPad|iPod|Android/i.test(navigator.userAgent));
    checkMobile();
  }, []);

  const onDetailsSubmit = (data) => {
    setFormData(data);
    setStep(3);
  };

  const finalizeDonation = async (transactionId = '') => {
    if (!transactionId) {
      toast.error('Please enter the UPI Transaction ID to complete');
      return;
    }

    try {
      const res = await api.post('/donations', { 
        ...formData, 
        type: selectedType, 
        transactionId: transactionId,
        paymentMethod: 'upi'
      });
      setFinalDonation(res.data.donation);
      setStep(4);
      toast.success('Donation recorded successfully!');
    } catch {
      toast.error('Failed to record donation. Please contact the church office.');
    }
  };

  const downloadReceipt = async () => {
    if (!finalDonation || !receiptRef.current) return;

    setIsGeneratingPDF(true);

    try {
      const element = receiptRef.current;

      const canvas = await html2canvas(element, {
        scale: 3,
        useCORS: true,
        backgroundColor: "#ffffff",
        scrollY: -window.scrollY,
      });

      const imgData = canvas.toDataURL("image/png");

      const pdf = new jsPDF("p", "mm", "a4");

      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();

      const imgWidth = pageWidth;

      const imgHeight = (canvas.height * imgWidth) / canvas.width;

      let heightLeft = imgHeight;
      let position = 0;

      // First page
      pdf.addImage(imgData, "PNG", 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;

      // Extra pages if content exceeds
      while (heightLeft > 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, "PNG", 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
      }

      pdf.save(
        `Donation_Receipt_${finalDonation._id.slice(-6).toUpperCase()}.pdf`
      );

      toast.success("Receipt downloaded!");
    } catch (e) {
      console.error(e);
      toast.error("Failed to generate PDF receipt");
    } finally {
      setIsGeneratingPDF(false);
    }
  };

    const trId = `SJBC${Date.now()}`;
    const upiUrl = formData ? `upi://pay?pa=${UPI_ID}&pn=${encodeURIComponent(MERCHANT_NAME)}&am=${formData.amount}&cu=INR&tr=${trId}&tn=${encodeURIComponent(selectedType + ' Offering')}` : '';
    const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(upiUrl)}`;

  const copyUpi = () => {
    navigator.clipboard.writeText(UPI_ID);
    toast.success('UPI ID copied!');
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen pt-10 bg-[#fffdfa]">
        <PageHero title={<>{t('donate.title')}</>} subtitle={<>Support our mission and ministry</>} />
        <div className="max-w-md mx-auto px-4 py-20 text-center">
          <div className="w-20 h-20 bg-gold-100 text-church-gold rounded-full flex items-center justify-center text-4xl mx-auto mb-6">
            <FiLock />
          </div>
          <h2 className="text-2xl font-bold text-church-royal-blue mb-4">Login Required</h2>
          <p className="text-gray-500 mb-8">Please login or register to make a donation and receive your official receipt.</p>
          <Link to={`/login?redirect=/donate`} className="btn-gold w-full justify-center py-4 text-lg shadow-gold">
            Login to Continue
          </Link>
          <p className="mt-4 text-sm text-gray-400">
            Don't have an account? <Link to="/register" className="text-church-gold font-bold">Register Now</Link>
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-10 bg-[#fffdfa]">
      <PageHero title={<>{t('donate.title')}</>} subtitle={<>Support our mission and ministry</>} />

      <section className="py-16">
        <div className="max-w-4xl mx-auto px-4">
          
          {/* Progress bar */}
          <div className="flex items-center justify-between mb-12 relative px-4">
            <div className="absolute top-1/2 left-0 w-full h-0.5 bg-gray-100 -z-10"></div>
            {[1, 2, 3].map(s => (
              <div key={s} className={`w-10 h-10 rounded-full flex items-center justify-center font-bold transition-all duration-300 ${step >= s ? 'bg-church-gold text-white shadow-gold' : 'bg-white text-gray-400 border border-gray-100'}`}>
                {step > s ? <FiCheckCircle /> : s}
              </div>
            ))}
          </div>

          <AnimatePresence mode="wait">
            {/* STEP 1: SELECT TYPE */}
            {step === 1 && (
              <motion.div key="step1" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}>
                <h2 className="text-2xl font-bold text-church-royal-blue text-center mb-8">What are you donating for?</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  {DONATION_TYPES.map(dt => (
                    <button
                      key={dt.id}
                      onClick={() => { setSelectedType(dt.id); setStep(2); }}
                      className={`group p-8 rounded-3xl border-2 bg-white text-left transition-all duration-300 hover:shadow-xl hover:scale-[1.02] flex items-center gap-6 ${selectedType === dt.id ? 'border-church-gold ring-4 ring-gold-100' : 'border-gray-50'}`}
                    >
                      <div className={`w-16 h-16 rounded-2xl flex items-center justify-center text-3xl transition-colors ${selectedType === dt.id ? 'bg-church-gold text-white' : 'bg-gray-50 text-church-royal-blue group-hover:bg-gold-50'}`}>
                        {dt.icon}
                      </div>
                      <div>
                        <p className="font-bold text-lg text-gray-800">{dt.label}</p>
                        <p className="text-sm text-gray-400 mt-1">Tap to select this purpose</p>
                      </div>
                    </button>
                  ))}
                </div>
              </motion.div>
            )}

            {/* STEP 2: DETAILS FORM */}
            {step === 2 && (
              <motion.div key="step2" initial={{ opacity: 0, x: 50 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -50 }} className="max-w-md mx-auto">
                <button onClick={() => setStep(1)} className="text-church-gold text-sm font-semibold mb-4 flex items-center gap-1">← Change Purpose</button>
                <div className="glass-card p-8 border border-gray-100">
                  <h2 className="text-xl font-bold text-church-royal-blue mb-6 flex items-center gap-2">
                    <FiUser className="text-church-gold" /> Donor Details
                  </h2>
                  <form onSubmit={handleSubmit(onDetailsSubmit)} className="space-y-5">
                    <div>
                      <label className="church-label">Donor Name</label>
                      <input {...register('donorName')} defaultValue={user?.name} className="church-input" placeholder="Your Name" />
                    </div>
                    <div>
                      <label className="church-label">Amount (₹) *</label>
                      <input {...register('amount', { required: true, min: 1 })} type="number" className="church-input" placeholder="e.g. 500" />
                      {errors.amount && <p className="text-red-500 text-xs mt-1">Please enter a valid amount</p>}
                    </div>
                    <div>
                      <label className="church-label">Special Intention (Optional)</label>
                      <textarea {...register('note')} rows={3} className="church-input resize-none" placeholder="Any prayer request or intention..." />
                    </div>
                    <button type="submit" className="btn-gold w-full justify-center py-4 text-base shadow-gold">
                      Proceed to Pay <FiArrowRight />
                    </button>
                  </form>
                </div>
              </motion.div>
            )}

            {/* STEP 3: PAYMENT */}
            {step === 3 && (
              <motion.div key="step3" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="max-w-md mx-auto text-center">
                <div className="glass-card p-8 border border-gold-200">
                  <div className="bg-gold-50 inline-block px-4 py-1 rounded-full text-church-gold text-xs font-bold mb-4">
                    ₹{formData?.amount} for {DONATION_TYPES.find(t => t.id === selectedType)?.label}
                  </div>
                  
                  <div className="space-y-6">
                    <h2 className="text-xl font-bold text-church-royal-blue mb-2">Payment Details</h2>
                    
                    {/* QR Code Section */}
                    <div className="bg-white p-6 rounded-3xl border-4 border-gold-300 shadow-gold mx-auto inline-block">
                       <img src={qrUrl} alt="UPI QR Code" className="w-56 h-56" />
                    </div>
                    
                    <div className="mt-4">
                      <p className="text-xs text-gray-400 mb-2">UPI ID: <span className="font-mono font-bold text-church-royal-blue">{UPI_ID}</span></p>
                      <button onClick={copyUpi} className="flex items-center gap-2 mx-auto text-church-gold text-xs font-bold bg-gold-50 px-3 py-1.5 rounded-lg border border-gold-200 hover:bg-gold-100 transition-colors">
                        <FiCopy /> COPY UPI ID
                      </button>
                    </div>

                    {isMobile && (
                      <div className="pt-4">
                        <a href={upiUrl} className="flex items-center justify-center gap-3 bg-[#1e3a8a] text-white w-full py-4 rounded-2xl font-bold shadow-lg hover:scale-[1.02] transition-all">
                           Open UPI Apps
                        </a>
                        
                        {/* Troubleshooting Box */}
                        <div className="mt-6 p-4 bg-red-50 border border-red-100 rounded-2xl text-left">
                          <p className="text-xs font-bold text-red-600 mb-2 flex items-center gap-1">
                            <FiInfo /> Payment failing?
                          </p>
                          <ul className="text-[10px] text-red-500 space-y-1 list-disc pl-3">
                            <li>If apps show "Risk Alert", try <b>Scanning the QR</b> or <b>Copying the UPI ID</b> manually.</li>
                            <li>Banks often block the first payment to a new contact for 24 hours.</li>
                            <li>Try a smaller amount (e.g. ₹1) first to "verify" the connection.</li>
                          </ul>
                        </div>
                      </div>
                    )}

                    <div className="mt-10 pt-6 border-t border-gray-100 text-left">
                      <label className="church-label flex items-center gap-2">
                        Enter UPI Transaction ID *
                        <div className="group relative">
                          <FiInfo className="text-gray-400 cursor-help" />
                          <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-48 p-2 bg-gray-800 text-white text-[10px] rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                            Please enter the 12-digit transaction ID from your payment app.
                          </div>
                        </div>
                      </label>
                      <div className="flex gap-2">
                         <input id="tid" className="church-input" placeholder="e.g. 4123..." />
                         <button onClick={() => finalizeDonation(document.getElementById('tid').value)} className="bg-church-gold text-white px-4 rounded-xl font-bold hover:bg-gold-600 transition-colors">Submit</button>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {/* STEP 4: THANK YOU & RECEIPT */}
            {step === 4 && (
              <motion.div key="step4" initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} className="text-center py-10">
                {!finalDonation ? (
                   <div className="py-20 flex flex-col items-center">
                     <div className="w-12 h-12 border-4 border-church-gold border-t-transparent rounded-full animate-spin mb-4" />
                     <p className="text-gray-500">Finalizing your donation...</p>
                   </div>
                ) : (
                  <>
                    <div className="w-24 h-24 bg-green-100 text-green-500 rounded-full flex items-center justify-center text-5xl mx-auto mb-6 shadow-xl">
                      <FiCheckCircle />
                    </div>
                    <h2 className="text-3xl font-bold text-church-royal-blue mb-3">God Bless You!</h2>
                    <p className="text-gray-500 max-w-sm mx-auto mb-10">
                      Your offering has been recorded. Thank you for your generosity in supporting St. John de Britto's Church.
                    </p>
                    
                    <div className="flex flex-col sm:flex-row gap-4 justify-center">
                      <button 
                        onClick={downloadReceipt} 
                        disabled={isGeneratingPDF}
                        className="btn-gold px-8 py-4 rounded-2xl flex items-center gap-2 justify-center"
                      >
                        {isGeneratingPDF ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <FiDownload />}
                        Download the Receipt
                      </button>
                      <button onClick={() => { setStep(1); setFormData(null); setFinalDonation(null); }} className="px-8 py-4 rounded-2xl border-2 border-gray-100 text-gray-600 font-bold hover:bg-gray-50 transition-all">
                        Donate Again
                      </button>
                    </div>

                    {/* HIDDEN RECEIPT TEMPLATE */}
                    <div className="fixed left-[-9999px] top-0">
                      <div ref={receiptRef} style={{ width: '800px', margin: 'auto', background: '#ffffff', padding: '35px', fontFamily: 'Arial, sans-serif', color: '#222' }}>
                        
                        {/* Top Date */}
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', marginBottom: '20px' }}>
                          <div>{new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' })}, {new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true })}</div>
                          <div>SJBC-{finalDonation?._id?.toString().slice(-6).toUpperCase() || 'XXXXXX'}</div>
                        </div>

                        {/* Header */}
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '2px solid #e5e5e5', paddingBottom: '15px' }}>
                          <div style={{ display: 'flex', gap: '15px', alignItems: 'center' }}>
                            <img src={churchLogo} style={{ width: '70px', height: '70px', objectFit: 'contain' }} alt="Logo" />
                            <div style={{ textAlign: 'left' }}>
                              <h1 style={{ margin: 0, fontSize: '30px', color: '#1e3a8a' }}>ST. JOHN DE BRITTO'S CHURCH</h1>
                              <h2 style={{ margin: '5px 0', fontSize: '18px', color: '#b8860b', fontWeight: 'normal' }}>புனித அருளானந்தர் தேவாலயம்</h2>
                              <p style={{ margin: 0, fontSize: '13px', color: '#555' }}>Murthi Nagar, Kalayarkoil, Tamil Nadu 630551, India.</p>
                            </div>
                          </div>
                          <div style={{ fontSize: '32px', fontWeight: 'bold' }}>Receipt</div>
                        </div>

                        {/* Details */}
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '30px', fontSize: '16px' }}>
                          <div style={{ flex: 1 }}>
                            <div style={{ display: 'flex', marginBottom: '10px' }}>
                              <div style={{ width: '150px', fontWeight: 'bold' }}>Receipt No :</div>
                              <div>SJBC-{new Date().getFullYear()}-{finalDonation?._id?.toString().slice(-6).toUpperCase() || 'XXXXXX'}</div>
                            </div>
                            <div style={{ display: 'flex', marginBottom: '10px' }}>
                              <div style={{ width: '150px', fontWeight: 'bold' }}>Name :</div>
                              <div>{finalDonation?.donorName || user?.name || 'N/A'}</div>
                            </div>
                            <div style={{ display: 'flex', marginBottom: '10px' }}>
                              <div style={{ width: '150px', fontWeight: 'bold' }}>Donation Type :</div>
                              <div>{DONATION_TYPES.find(t => t.id === selectedType)?.label || 'Donation'}</div>
                            </div>
                            <div style={{ display: 'flex', marginBottom: '10px' }}>
                              <div style={{ width: '150px', fontWeight: 'bold' }}>Purpose :</div>
                              <div>{DONATION_TYPES.find(t => t.id === selectedType)?.label || 'Donation'} Offering</div>
                            </div>
                          </div>
                          <div style={{ flex: 1, paddingLeft: '20px' }}>
                            <div style={{ display: 'flex', marginBottom: '10px' }}>
                              <div style={{ width: '150px', fontWeight: 'bold' }}>Receipt Date :</div>
                              <div>{new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' })}</div>
                            </div>
                            <div style={{ display: 'flex', marginBottom: '10px' }}>
                              <div style={{ width: '150px', fontWeight: 'bold' }}>Total Paid :</div>
                              <div>INR. {(finalDonation?.amount || 0).toFixed(2)}</div>
                            </div>
                            <div style={{ display: 'flex', marginBottom: '10px' }}>
                              <div style={{ width: '150px', fontWeight: 'bold' }}>Payment Method :</div>
                              <div>UPI</div>
                            </div>
                            <div style={{ display: 'flex', marginBottom: '10px' }}>
                              <div style={{ width: '150px', fontWeight: 'bold' }}>UPI Ref No :</div>
                              <div>{finalDonation?.transactionId || 'N/A'}</div>
                            </div>
                          </div>
                        </div>

                        {/* Table */}
                        <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '30px', fontSize: '15px' }}>
                          <thead>
                            <tr>
                              <th style={{ background: '#f3f4f6', textAlign: 'left', padding: '14px', border: '1px solid #ddd' }}>Donation Description</th>
                              <th style={{ background: '#f3f4f6', textAlign: 'left', padding: '14px', border: '1px solid #ddd' }}>Amount Paid</th>
                            </tr>
                          </thead>
                          <tbody>
                            <tr>
                              <td style={{ padding: '14px', border: '1px solid #ddd' }}>{DONATION_TYPES.find(t => t.id === selectedType)?.label || 'Donation'} Donation</td>
                              <td style={{ padding: '14px', border: '1px solid #ddd' }}>₹{(finalDonation?.amount || 0).toFixed(2)}</td>
                            </tr>
                          </tbody>
                        </table>

                        {/* Message */}
                        <div style={{ marginTop: '30px', border: '1px solid #ddd', padding: '18px', background: '#fafafa', lineHeight: '1.8' }}>
                          <strong style={{ display: 'block', marginBottom: '10px' }}>Message / Intention :</strong>
                          “{finalDonation?.note || 'Prayers for family blessings'}”
                        </div>

                        {/* Thank You */}
                        <div style={{ marginTop: '40px', textAlign: 'center', lineHeight: '1.9', fontSize: '15px' }}>
                          Thank you for your generous contribution<br />
                          towards the ministry and mission of<br />
                          <strong>St. John de Britto's Church.</strong><br /><br />
                          May God bless you abundantly.
                        </div>

                        {/* Footer */}
                        <div style={{ marginTop: '45px', textAlign: 'center', fontSize: '14px', lineHeight: '1.8', color: '#555' }}>
                          Contact Details :<br />
                          Parish Office Phone : +91 96291 95484 <br />
                          Parish Office Email : [EMAIL_ADDRESS] <br />
                          Parish Office Website : www.stjohnchurch.com
                        </div>

                        {/* Signature */}
                        <div style={{ marginTop: '40px', textAlign: 'center', fontSize: '24px', fontWeight: 'bold' }}>
                          Computer Generated Receipt. <span style={{ color: 'red' }}>SIGNATURE NOT REQUIRED</span>
                        </div>
                      </div>
                    </div>
                  </>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </section>
    </div>
  );
}
