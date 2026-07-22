import { useState, useEffect, useRef, useMemo } from 'react';
import { Link, useSearchParams } from 'react-router-dom';

import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../../context/AuthContext';
import { useNotifications } from '../../context/NotificationContext';
import { FiUser, FiCalendar, FiFileText, FiMessageSquare, FiBell, FiEdit, FiSettings, FiDownload, FiCheckCircle, FiX, FiInfo, FiShield } from 'react-icons/fi';

import { FaDonate } from "react-icons/fa";
import { GiChurch, GiCrucifix, GiPrayer, GiHeartBottle } from 'react-icons/gi';
import api, { UPLOADS_URL, getMediaUrl } from '../../services/api';

import { SectionLoader } from '../../components/common/Loader';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import toast from 'react-hot-toast';
import churchLogo from '../../assets/image.png';
import PendingApprovalModal from '../../components/user/PendingApprovalModal';

const DONATION_TYPES = [
  { id: 'general', label: 'General Offering' },
  { id: 'feast', label: 'Feast Donation' },
  { id: 'building', label: 'Building Fund' },
  { id: 'candle', label: 'Candle Offering' },
];

export default function UserDashboard() {
  const { user } = useAuth();
  const { notifications, unreadCount, markRead } = useNotifications();
  const [searchParams] = useSearchParams();
  const [bookings, setBookings] = useState([]);
  const [documents, setDocuments] = useState([]);
  const [tickets, setTickets] = useState([]);
  const [donations, setDonations] = useState([]);
  const [pendingRequests, setPendingRequests] = useState([]);
  const [selectedPendingRequest, setSelectedPendingRequest] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);
  const [viewingDonation, setViewingDonation] = useState(null);
  const receiptRef = useRef(null);

  useEffect(() => {
    Promise.all([
      api.get('/bookings/my').then(r => setBookings(r.data.bookings || [])),
      api.get('/documents/my').then(r => setDocuments(r.data.documents || [])),
      api.get('/tickets/my').then(r => setTickets(r.data.tickets || [])),
      api.get('/donations/my').then(r => setDonations(r.data.donations || [])),
      api.get('/permission-requests/user/pending').then(r => {
        const reqs = r.data.requests || [];
        setPendingRequests(reqs);

        // Check if coming from email link with requestId
        const targetReqId = searchParams.get('requestId');
        if (targetReqId) {
          const match = reqs.find(req => req._id === targetReqId);
          if (match) setSelectedPendingRequest(match);
        }
      }).catch(() => {}),
    ]).finally(() => setLoading(false));
  }, [searchParams]);

  const activePendingRequests = useMemo(() => {
    const map = new Map();
    (pendingRequests || []).forEach(req => {
      if (req.status === 'pending' && !map.has(req._id)) {
        map.set(req._id, req);
      }
    });
    return Array.from(map.values());
  }, [pendingRequests]);



  const downloadReceipt = async (donation) => {
    setIsGeneratingPDF(true);

    // Ensure the receipt is rendered for html2canvas
    // We use the viewingDonation state or a separate hidden div
    // Since we want to download without necessarily opening the modal, we'll use a hidden template

    setTimeout(async () => {
      try {
        const element = receiptRef.current;
        if (!element) throw new Error('Receipt template not found');

        const canvas = await html2canvas(element, {
          scale: 3,
          useCORS: true,
          backgroundColor: "#ffffff",
        });

        const imgData = canvas.toDataURL("image/png");
        const pdf = new jsPDF("p", "mm", "a4");
        const pageWidth = pdf.internal.pageSize.getWidth();
        const pageHeight = pdf.internal.pageSize.getHeight();
        const imgWidth = pageWidth;
        const imgHeight = (canvas.height * imgWidth) / canvas.width;

        let heightLeft = imgHeight;
        let position = 0;

        pdf.addImage(imgData, "PNG", 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;

        while (heightLeft > 0) {
          position = heightLeft - imgHeight;
          pdf.addPage();
          pdf.addImage(imgData, "PNG", 0, position, imgWidth, imgHeight);
          heightLeft -= pageHeight;
        }

        pdf.save(`Donation_Receipt_${donation._id.slice(-6).toUpperCase()}.pdf`);
        toast.success("Receipt downloaded!");
      } catch (e) {
        console.error(e);
        toast.error("Failed to generate PDF receipt");
      } finally {
        setIsGeneratingPDF(false);
      }
    }, 500);
  };

  const forceFileDownload = async (e, fileUrl, type) => {
    e.preventDefault();
    try {
      toast.loading("Starting download...", { id: "download" });
      const response = await fetch(fileUrl);
      const blob = await response.blob();
      const blobUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = blobUrl;
      const ext = fileUrl.split('.').pop() || 'pdf';
      link.download = `${type?.replace('_', '-')}-document.${ext}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(blobUrl);
      toast.success("Download complete", { id: "download" });
    } catch (err) {
      toast.error("Download failed, opening directly.", { id: "download" });
      window.open(fileUrl, '_blank');
    }
  };

  const QUICK_ACTIONS = [
    { icon: <FiCalendar />, label: 'Book a Mass', path: '/dashboard/booking', color: 'bg-blue-500' },
    { icon: <FiFileText />, label: 'Request Document', path: '/dashboard/documents', color: 'bg-green-500' },
    { icon: <FiMessageSquare />, label: 'Raise a Ticket', path: '/dashboard/tickets', color: 'bg-purple-500' },
    { icon: <GiPrayer />, label: 'Prayer Request', path: '/prayer-requests', color: 'bg-amber-500' },
  ];

  if (loading) return <div className="min-h-screen pt-20 flex items-center justify-center"><SectionLoader /></div>;

  return (
    <div className="min-h-screen pt-24 bg-church-cream ">
      {/* Header */}
      <div className="bg-gray-600 py-6 sm:py-10 md:py-12">
        <div className="max-w-6xl mx-auto px-4">
          <div className="flex flex-row items-center justify-between gap-3 sm:gap-6 md:gap-8">
            <div className="flex items-center gap-3 sm:gap-5 min-w-0 flex-1">
              <div className="w-12 h-12 sm:w-20 sm:h-20 md:w-28 md:h-28 rounded-full bg-church-gold flex items-center justify-center shadow-gold-lg flex-shrink-0 ring-2 md:ring-4 ring-white/20">
                {user?.profilePhoto ? (
                  <img
                    src={getMediaUrl(user.profilePhoto)}
                    alt="profile"
                    className="w-full h-full object-cover rounded-full"
                  />
                ) : (

                  <span className="text-white text-lg sm:text-3xl md:text-4xl font-bold">{user?.name?.[0]?.toUpperCase()}</span>
                )}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-gold-400 text-[10px] sm:text-sm md:text-lg font-medium tracking-wide">Welcome back</p>
                <h1 className="text-white font-display text-base sm:text-2xl md:text-4xl lg:text-5xl font-extrabold tracking-tight truncate my-0.5 md:my-1">{user?.name}</h1>
                <p className="text-gray-200 text-[10px] sm:text-xs md:text-lg font-medium truncate">
                  {user?.phone} {user?.parishMemberId ? `• ID: ${user.parishMemberId}` : ''}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2.5 sm:gap-3 flex-shrink-0">
              <Link
                to="/dashboard/notifications"
                className="btn-outline-gold text-xs sm:text-sm md:text-base py-1.5 px-2.5 sm:py-2.5 sm:px-5 md:py-3 md:px-6 shadow-md border border-church-gold/60 rounded-xl whitespace-nowrap relative flex items-center gap-2"
                title="Notifications"
              >
                <div className="relative flex items-center justify-center">
                  <FiBell className="text-base sm:text-xl" />
                  {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1.5 w-2.5 h-2.5 bg-red-500 rounded-full animate-pulse ring-2 ring-gray-600" />
                  )}
                </div>
                <span>Notifications</span>
                {unreadCount > 0 && (
                  <span className="bg-red-500 text-white text-[10px] sm:text-xs font-black px-1.5 py-0.5 rounded-full ml-0.5 shadow-sm">
                    {unreadCount}
                  </span>
                )}
              </Link>
              <Link to="/dashboard/settings" className="btn-outline-gold text-xs sm:text-sm md:text-base py-1.5 px-2.5 sm:py-2.5 sm:px-5 md:py-3 md:px-6 shadow-md border border-church-gold/60 rounded-xl whitespace-nowrap flex items-center gap-2">
                <FiSettings className="text-xs sm:text-sm md:text-lg" /> Settings
              </Link>
            </div>
          </div>
        </div>
      </div>


      <div className="max-w-6xl mx-auto px-4 py-10">
        {/* Pending Settings Change Request Banner */}
        {activePendingRequests.length > 0 && (
          <div className="space-y-4 mb-8">
            {activePendingRequests.map(req => (
              <motion.div key={req._id} initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="bg-amber-50 border-2 border-church-gold rounded-2xl p-4 sm:p-5 shadow-lg flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-start sm:items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-church-gold text-white flex items-center justify-center font-bold flex-shrink-0 shadow-sm">
                    <FiShield className="text-xl" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-bold text-gray-900 text-sm sm:text-base">Settings Change Approval Required</h3>
                      <span className="bg-amber-200 text-amber-900 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase">1 Action Required</span>
                    </div>
                    <p className="text-xs sm:text-sm text-gray-700 mt-0.5">
                      <span className="font-bold">{req.adminId?.name || 'Administrator'}</span> requested changes to your account settings.
                    </p>
                    {req.reason && <p className="text-xs text-amber-800 italic mt-1">"{req.reason}"</p>}
                  </div>
                </div>

                <button
                  onClick={() => {
                    setSelectedPendingRequest(req);
                    const notif = notifications.find(n => n.relatedId === req._id || n.relatedModel === 'PermissionRequest' || n.title?.includes('Settings'));
                    if (notif && !notif.isRead) {
                      markRead(notif._id);
                    }
                  }}
                  className="btn-gold px-4 py-2 text-xs sm:text-sm whitespace-nowrap self-start sm:self-auto flex items-center gap-1.5 shadow-gold"
                >
                  <FiShield /> Review Request
                </button>
              </motion.div>
            ))}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content Area */}
          <div className="lg:col-span-2 space-y-10">
            {/* Quick Actions for Desktop Integration */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {QUICK_ACTIONS.map((qa, i) => (
                <Link key={i} to={qa.path} className={`${qa.color} text-white flex flex-col items-center gap-2 p-5 rounded-2xl hover:scale-105 transition-all duration-300 shadow-card`}>
                  <span className="text-2xl">{qa.icon}</span>
                  <span className="text-[10px] font-bold uppercase tracking-wider">{qa.label}</span>
                </Link>
              ))}
            </div>


            {/* My Mass Bookings */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-display text-xl font-bold text-church-royal-blue ">My Mass Bookings</h2>
                <Link to="/dashboard/booking" className="text-church-gold text-sm hover:underline font-bold">+ New Booking</Link>
              </div>
              <div className="space-y-3">
                {bookings.length === 0 ? (
                  <div className="church-card text-center py-10 opacity-60">
                    <GiChurch className="text-4xl text-gray-300 mx-auto mb-2" />
                    <p className="text-gray-400 text-sm italic">No active bookings</p>
                  </div>
                ) : (
                  bookings.slice(0, 3).map((b, i) => (
                    <motion.div key={b._id} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.05 }} className="church-card flex items-center gap-4">
                      <div className="min-w-12 h-12 rounded-xl bg-church-gradient flex flex-col items-center justify-center">
                        <span className="text-white font-bold text-sm">{new Date(b.massDate).getDate()}</span>
                        <span className="text-gold-300 text-[10px] font-bold uppercase">{new Date(b.massDate).toLocaleString('default', { month: 'short' })}</span>
                      </div>
                      <div className="flex-1">
                        <p className="font-bold text-gray-800 text-sm capitalize">{b.intentionType?.replace('_', ' ')}</p>
                        <p className="text-gray-400 text-[11px] font-medium">{b.intentionFor || b.familyName}</p>
                      </div>
                      <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase ${b.status === 'approved' ? 'bg-green-100 text-green-600' : b.status === 'rejected' ? 'bg-red-100 text-red-600' : 'bg-gold-100 text-church-gold'}`}>{b.status}</span>
                    </motion.div>
                  ))
                )}
              </div>
            </div>

            {/* My Donation History */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-display text-xl font-bold text-church-royal-blue ">My Donations</h2>
                <Link to="/donate" className="text-church-gold text-sm hover:underline font-bold">+ Make Donation</Link>
              </div>
              <div className="space-y-3">
                {donations.length === 0 ? (
                  <div className="church-card text-center py-10 opacity-60">
                    <FaDonate className="text-4xl text-gray-300 mx-auto mb-2" />
                    <p className="text-gray-400 text-sm italic">No donations recorded yet</p>
                  </div>
                ) : (
                  donations.map((d, i) => (
                    <motion.div
                      key={d._id}
                      onClick={() => setViewingDonation(d)}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.05 }}
                      className="church-card group cursor-pointer hover:border-church-gold hover:shadow-lg transition-all flex items-center gap-4 border-l-4 border-church-gold/30"
                    >
                      <div className="w-12 h-12 rounded-xl bg-gold-50 text-church-gold flex items-center justify-center text-2xl group-hover:bg-church-gold group-hover:text-white transition-colors">
                        <FaDonate />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <p className="font-bold text-gray-800 text-base">₹{d.amount}</p>
                          <span className="text-[9px] bg-blue-50 text-church-royal-blue px-2 py-0.5 rounded-full font-bold uppercase tracking-wider">{DONATION_TYPES.find(t => t.id === d.type)?.label || 'General'}</span>
                          <span className={`text-[9px] px-2 py-0.5 rounded-full font-bold uppercase ${d.status === 'verified' ? 'bg-green-50 text-green-600' :
                              d.status === 'rejected' ? 'bg-red-50 text-red-600' :
                                'bg-gold-50 text-church-gold'
                            }`}>
                            {d.status || 'pending'}
                          </span>
                        </div>
                        <p className="text-gray-400 text-[11px] font-medium">{new Date(d.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })} • {d.transactionId?.slice(0, 10)}...</p>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-church-gold text-[10px] font-bold opacity-0 group-hover:opacity-100 transition-opacity">View Details →</span>
                        <FiInfo className="text-gray-300 group-hover:text-church-gold transition-colors" />
                      </div>
                    </motion.div>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* Right Sidebar Area */}
          <div className="space-y-6">

            {/* My Documents */}
            <div className="glass-card p-6 border border-gray-100">
              <div className="flex items-center justify-between mb-5">
                <h2 className="font-display text-lg font-bold text-church-royal-blue flex items-center gap-2"><FiFileText className="text-church-gold" /> Documents</h2>
                <Link to="/dashboard/documents" className="text-church-gold text-[10px] font-bold hover:underline uppercase tracking-tighter">Request</Link>
              </div>
              <div className="space-y-3">
                {documents.slice(0, 3).map((d, i) => (
                  <div key={d._id} className="p-3 rounded-xl bg-white border border-gray-100 shadow-sm">
                    <div className="flex justify-between items-start mb-2">
                      <p className="text-xs font-bold text-gray-800 capitalize">{d.type?.replace('_', ' ')}</p>
                      <span className={`text-[8px] font-black uppercase px-2 py-0.5 rounded-full ${d.status === 'approved' ? 'bg-green-100 text-green-600' : 'bg-gold-100 text-church-gold'}`}>{d.status}</span>
                    </div>
                    <div className="flex justify-between items-center mt-3">
                      <p className="text-[10px] text-gray-400 font-medium">{new Date(d.createdAt).toLocaleDateString()}</p>
                      {d.status === 'approved' && d.uploadedFile && (
                        <button onClick={(e) => forceFileDownload(e, d.uploadedFile.startsWith('http') ? d.uploadedFile : `${UPLOADS_URL.replace('/uploads', '')}${d.uploadedFile.startsWith('/') ? '' : '/'}${d.uploadedFile}`, d.type)} className="flex items-center gap-1 text-church-gold text-[10px] font-bold hover:underline">
                          <FiDownload /> Get File
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* DONATION DETAILS MODAL */}
      <AnimatePresence>
        {viewingDonation && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setViewingDonation(null)} className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
            <motion.div initial={{ scale: 0.9, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.9, opacity: 0, y: 20 }} className="relative bg-white w-full max-w-lg rounded-3xl overflow-hidden shadow-2xl">

              {/* Modal Header */}
              <div className="bg-church-royal-blue p-8 text-white">
                <div className="flex justify-between items-start mb-6">
                  <div className="w-14 h-14 bg-white/10 rounded-2xl flex items-center justify-center text-3xl">
                    <FaDonate className="text-church-gold" />
                  </div>
                  <button onClick={() => setViewingDonation(null)} className="p-2 hover:bg-white/10 rounded-full transition-colors">
                    <FiX size={24} />
                  </button>
                </div>
                <h3 className="text-2xl font-bold font-display">Donation Details</h3>
                <p className="text-blue-200 text-sm mt-1">Ref: SJBC-{viewingDonation._id.slice(-6).toUpperCase()}</p>
              </div>

              {/* Modal Content */}
              <div className="p-8 space-y-6">
                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <p className="text-gray-400 text-[10px] font-bold uppercase tracking-widest mb-1">Amount Paid</p>
                    <p className="text-2xl font-black text-church-royal-blue">₹{viewingDonation.amount}</p>
                  </div>
                  <div>
                    <p className="text-gray-400 text-[10px] font-bold uppercase tracking-widest mb-1">Status</p>
                    <div className="flex items-center gap-2 text-green-500 font-bold">
                      <FiCheckCircle /> Recorded
                    </div>
                  </div>
                </div>

                <div className="space-y-4 pt-4 border-t border-gray-50">
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-gray-400">Purpose:</span>
                    <span className="font-bold text-gray-700">{DONATION_TYPES.find(t => t.id === viewingDonation.type)?.label || 'General Offering'}</span>
                  </div>
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-gray-400">Date:</span>
                    <span className="font-bold text-gray-700">{new Date(viewingDonation.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' })}</span>
                  </div>
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-gray-400">Transaction ID:</span>
                    <span className="font-mono text-xs font-bold text-church-gold">{viewingDonation.transactionId || 'Manual Entry'}</span>
                  </div>
                  {viewingDonation.note && (
                    <div className="pt-4 mt-4 border-t border-gray-50">
                      <p className="text-gray-400 text-[10px] font-bold uppercase tracking-widest mb-2">Message / Intention</p>
                      <p className="italic text-gray-600 text-sm bg-gray-50 p-4 rounded-2xl">"{viewingDonation.note}"</p>
                    </div>
                  )}
                </div>

                {/* Download Button */}
                <button
                  onClick={() => downloadReceipt(viewingDonation)}
                  disabled={isGeneratingPDF}
                  className="btn-gold w-full justify-center py-4 text-base shadow-gold-lg mt-4"
                >
                  {isGeneratingPDF ? (
                    <div className="flex items-center gap-2">
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Generating PDF...
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <FiDownload /> Download Official Receipt
                    </div>
                  )}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* HIDDEN RECEIPT TEMPLATE FOR PDF GENERATION (Always uses viewingDonation if active, or just stays hidden) */}
      <div className="fixed left-[-9999px] top-0">
        <div ref={receiptRef} style={{ width: '800px', margin: 'auto', background: '#ffffff', padding: '35px', fontFamily: 'Arial, sans-serif', color: '#222' }}>
          {viewingDonation && (
            <>
              {/* Top Date */}
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', marginBottom: '20px' }}>
                <div>{new Date(viewingDonation.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' })}, {new Date(viewingDonation.createdAt).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true })}</div>
                <div>SJBC-{viewingDonation._id.slice(-6).toUpperCase()}</div>
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
                    <div>SJBC-{new Date(viewingDonation.createdAt).getFullYear()}-{viewingDonation._id.slice(-6).toUpperCase()}</div>
                  </div>
                  <div style={{ display: 'flex', marginBottom: '10px' }}>
                    <div style={{ width: '150px', fontWeight: 'bold' }}>Name :</div>
                    <div>{viewingDonation.donorName || user?.name || 'N/A'}</div>
                  </div>
                  <div style={{ display: 'flex', marginBottom: '10px' }}>
                    <div style={{ width: '150px', fontWeight: 'bold' }}>Donation Type :</div>
                    <div>{DONATION_TYPES.find(t => t.id === viewingDonation.type)?.label || 'Donation'}</div>
                  </div>
                  <div style={{ display: 'flex', marginBottom: '10px' }}>
                    <div style={{ width: '150px', fontWeight: 'bold' }}>Purpose :</div>
                    <div>{DONATION_TYPES.find(t => t.id === viewingDonation.type)?.label || 'Donation'} Offering</div>
                  </div>
                </div>
                <div style={{ flex: 1, paddingLeft: '20px' }}>
                  <div style={{ display: 'flex', marginBottom: '10px' }}>
                    <div style={{ width: '150px', fontWeight: 'bold' }}>Receipt Date :</div>
                    <div>{new Date(viewingDonation.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' })}</div>
                  </div>
                  <div style={{ display: 'flex', marginBottom: '10px' }}>
                    <div style={{ width: '150px', fontWeight: 'bold' }}>Total Paid :</div>
                    <div>INR. {(viewingDonation.amount || 0).toFixed(2)}</div>
                  </div>
                  <div style={{ display: 'flex', marginBottom: '10px' }}>
                    <div style={{ width: '150px', fontWeight: 'bold' }}>Payment Method :</div>
                    <div>UPI</div>
                  </div>
                  <div style={{ display: 'flex', marginBottom: '10px' }}>
                    <div style={{ width: '150px', fontWeight: 'bold' }}>UPI Ref No :</div>
                    <div>{viewingDonation.transactionId || 'N/A'}</div>
                  </div>
                  <div style={{ display: 'flex', marginBottom: '10px' }}>
                    <div style={{ width: '150px', fontWeight: 'bold' }}>Status :</div>
                    <div style={{
                      fontWeight: 'bold',
                      color: viewingDonation.status === 'verified' ? '#16a34a' : viewingDonation.status === 'rejected' ? '#dc2626' : '#b45309',
                      textTransform: 'uppercase'
                    }}>
                      {viewingDonation.status || 'pending'}
                    </div>
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
                    <td style={{ padding: '14px', border: '1px solid #ddd' }}>{DONATION_TYPES.find(t => t.id === viewingDonation.type)?.label || 'Donation'} Donation</td>
                    <td style={{ padding: '14px', border: '1px solid #ddd' }}>₹{(viewingDonation.amount || 0).toFixed(2)}</td>
                  </tr>
                </tbody>
              </table>

              {/* Message */}
              <div style={{ marginTop: '30px', border: '1px solid #ddd', padding: '18px', background: '#fafafa', lineHeight: '1.8' }}>
                <strong style={{ display: 'block', marginBottom: '10px' }}>Message / Intention :</strong>
                “{viewingDonation.note || 'Prayers for family blessings'}”
              </div>

              {/* Thank You */}
              <div style={{ marginTop: '40px', textAlign: 'center', lineHeight: '1.9', fontSize: '15px' }}>
                Thank you for your generous contribution<br />
                towards the ministry and mission of<br />
                <strong>St. John de Britto\'s Church.</strong><br /><br />
                May God bless you abundantly.
              </div>

              {/* Footer */}
              <div style={{ marginTop: '45px', textAlign: 'center', fontSize: '14px', lineHeight: '1.8', color: '#555' }}>
                Contact Details :<br />
                Parish Office Phone : +91 96291 95484 <br />
                Parish Office Email : sjdbchurch@gmail.com <br />
                Parish Office Website : www.stjohnchurch.com
              </div>

              {/* Signature */}
              <div style={{ marginTop: '40px', textAlign: 'center', fontSize: '24px', fontWeight: 'bold' }}>
                Computer Generated Receipt. <span style={{ color: 'red' }}>SIGNATURE NOT REQUIRED</span>
              </div>
            </>
          )}
        </div>
      </div>

      {selectedPendingRequest && (
        <PendingApprovalModal
          request={selectedPendingRequest}
          onClose={() => setSelectedPendingRequest(null)}
          onResponded={(reqId) => setPendingRequests(prev => prev.filter(r => r._id !== reqId))}
        />
      )}
    </div>
  );
}

