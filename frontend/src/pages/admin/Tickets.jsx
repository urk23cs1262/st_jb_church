import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { FiCheck, FiMessageSquare, FiSend } from 'react-icons/fi';
import api from '../../services/api';
import { SectionLoader } from '../../components/common/Loader';
import { useAuth } from '../../context/AuthContext';

const STATUS_COLORS = { open: 'badge-blue', in_progress: 'badge-gold', resolved: 'badge-green', closed: 'badge-gray' };

export default function AdminTickets() {
  const { user } = useAuth();
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState('open');
  const [active, setActive] = useState(null);
  const [replyText, setReplyText] = useState('');

  useEffect(() => {
    setLoading(true);
    api.get(`/tickets?status=${status}&limit=50`).then(r => setTickets(r.data.tickets || [])).finally(() => setLoading(false));
  }, [status]);

  const sendReply = async () => {
    if (!replyText.trim()) return;
    try {
      const res = await api.post(`/tickets/${active._id}/reply`, { message: replyText, from: 'admin' });
      setActive(res.data.ticket);
      setTickets(prev => prev.map(t => t._id === res.data.ticket._id ? res.data.ticket : t));
      setReplyText('');
    } catch { toast.error('Failed'); }
  };

  const updateStatus = async (id, newStatus) => {
    try {
      await api.put(`/tickets/${id}/status`, { status: newStatus });
      setTickets(prev => prev.map(t => t._id === id ? { ...t, status: newStatus } : t));
      if (active?._id === id) setActive(prev => ({ ...prev, status: newStatus }));
      toast.success('Status updated');
    } catch { toast.error('Failed'); }
  };

  return (
    <div className="w-full">
      <div className="p-6 flex gap-6" style={{ height: 'calc(100vh - 80px)' }}>
        {/* Ticket list */}
        <div className="w-80 flex-shrink-0 flex flex-col gap-3">
          <div className="flex gap-2 flex-wrap">
            {['open', 'in_progress', 'resolved', 'closed'].map(s => (
              <button key={s} onClick={() => setStatus(s)} className={`px-3 py-1.5 rounded-xl text-xs font-semibold capitalize transition-all ${status === s ? 'bg-church-gold text-white' : 'bg-white  text-gray-500'}`}>{s.replace('_', ' ')}</button>
            ))}
          </div>
          {loading ? <SectionLoader /> : (
            <div className="space-y-2 overflow-y-auto flex-1">
              {tickets.map((t, i) => (
                <div key={t._id} onClick={() => setActive(t)} className={`church-card cursor-pointer transition-all p-4 ${active?._id === t._id ? 'border-church-gold shadow-gold' : ''}`}>
                  <div className="flex items-start justify-between mb-1">
                    <p className="font-semibold text-gray-800  text-sm truncate flex-1">{t.subject}</p>
                    <span className={`badge ${STATUS_COLORS[t.status]} ml-2 text-xs`}>{t.status?.replace('_', ' ')}</span>
                  </div>
                  <p className="text-gray-400 text-xs">{t.userId?.name} • #{t.ticketNumber}</p>
                  <p className="text-gray-400 text-xs">{t.replies?.length || 0} replies</p>
                </div>
              ))}
              {tickets.length === 0 && <p className="text-center text-gray-400 py-10 text-sm">No {status} tickets</p>}
            </div>
          )}
        </div>

        {/* Thread view */}
        {active ? (
          <div className="flex-1 glass-card p-6 flex flex-col">
            <div className="flex items-center justify-between mb-4 pb-4 border-b border-gray-100 ">
              <div>
                <h2 className="font-bold text-gray-800 ">{active.subject}</h2>
                <p className="text-xs text-gray-400">#{active.ticketNumber} • {active.userId?.name} ({active.userId?.phone})</p>
              </div>
              <div className="flex gap-2">
                {['open', 'in_progress', 'resolved', 'closed'].map(s => (
                  <button key={s} onClick={() => updateStatus(active._id, s)} className={`px-2 py-1 rounded-lg text-xs font-semibold capitalize transition-all ${active.status === s ? 'bg-church-gold text-white' : 'bg-gray-100  text-gray-500'}`}>{s.replace('_', ' ')}</button>
                ))}
              </div>
            </div>
            <div className="flex-1 overflow-y-auto space-y-3 mb-4">
              <div className="bg-blue-50  p-3 rounded-xl">
                <p className="text-xs font-semibold text-blue-600 mb-1">{active.userId?.name}</p>
                <p className="text-sm text-gray-700 ">{active.message}</p>
              </div>
              {active.replies?.map((r, i) => (
                <div key={i} className={`p-3 rounded-xl ${r.from === 'admin' ? 'bg-gold-50  ml-8' : 'bg-blue-50  mr-8'}`}>
                  <p className={`text-xs font-semibold mb-1 ${r.from === 'admin' ? 'text-church-gold' : 'text-blue-600'}`}>{r.from === 'admin' ? 'Parish Office' : active.userId?.name}</p>
                  <p className="text-sm text-gray-700 ">{r.message}</p>
                  <p className="text-xs text-gray-400 mt-1">{new Date(r.timestamp).toLocaleString()}</p>
                </div>
              ))}
            </div>
            {active.status !== 'closed' && (
              <div className="flex gap-2">
                <input value={replyText} onChange={e => setReplyText(e.target.value)} className="church-input flex-1" placeholder="Type admin reply..." onKeyDown={e => e.key === 'Enter' && sendReply()} />
                <button onClick={sendReply} className="btn-gold py-2 px-4"><FiSend /></button>
              </div>
            )}
          </div>
        ) : (
          <div className="flex-1 flex items-center justify-center text-gray-400">
            <div className="text-center">
              <FiMessageSquare className="text-6xl mx-auto mb-3 opacity-30" />
              <p>Select a ticket to view</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
