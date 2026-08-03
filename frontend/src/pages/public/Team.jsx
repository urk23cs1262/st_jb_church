import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import { 
  FiMail, FiPhone, FiSearch, FiUser, FiHeart, FiShield, 
  FiUsers, FiClock, FiMessageSquare, FiExternalLink, FiChevronRight,
  FiFacebook, FiInstagram, FiLinkedin, FiAward, FiMusic
} from 'react-icons/fi';
import { GiChurch, GiCrossedSwords, GiCrucifix, GiMusicalNotes } from 'react-icons/gi';
import api, { getMediaUrl } from '../../services/api';
import PageHero from '../../components/common/PageHero';
import { SectionLoader } from '../../components/common/Loader';

const DEPARTMENTS = [
  { id: 'All', label: 'All Members', icon: <FiUsers /> },
  { id: 'Leadership', label: 'Church Leadership', icon: <GiCrucifix /> },
  { id: 'Administration', label: 'Administrative Team', icon: <FiShield /> },
  { id: 'Ministries', label: 'Ministry Leaders', icon: <FiHeart /> },
  // { id: 'Choir Team', label: 'Choir Team', icon: <FiMusic /> },
  // { id: 'St. Vincent de Paul Sabai', label: 'St. Vincent de Paul Sabai', icon: <FiHeart /> },
  { id: 'Parish Council', label: 'Parish Council', icon: <GiChurch /> },
  { id: 'Volunteers', label: 'Volunteers', icon: <FiAward /> }
];

const VOLUNTEER_MINISTRIES = [
  { name: 'Hospitality', desc: 'Greeting parishioners, ushering Mass, and welcoming visitors.', icon: '🤝' },
  { name: 'Decoration & Altar', desc: 'Decorating sanctuary for feasts, flower arrangements, and vestments.', icon: '🌸' },
  { name: 'Media & Tech Team', desc: 'Live streaming Mass, sound management, website & social media.', icon: '🎥' },
  { name: 'Social Service & Outreach', desc: 'Helping the needy, food drives, medical camps, and community support.', icon: '✝️' },
  { name: 'Prayer Groups & Novenas', desc: 'Organizing rosary circles, adoration hours, and intercessory prayer.', icon: '🙏' },
  { name: 'Event Management', desc: 'Feast celebrations, cultural programs, processions, and youth meets.', icon: '🎉' }
];

export default function Team() {
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedDept, setSelectedDept] = useState('All');
  const [search, setSearch] = useState('');

  useEffect(() => {
    fetchTeam();
  }, []);

  const fetchTeam = async () => {
    try {
      setLoading(true);
      const res = await api.get('/team');
      setMembers(res.data.members || []);
    } catch (err) {
      console.error('Failed to load team members:', err);
    } finally {
      setLoading(false);
    }
  };

  const filteredMembers = useMemo(() => {
    return members.filter(m => {
      const matchDept = selectedDept === 'All' || m.department === selectedDept;
      const matchSearch = !search || 
        m.name.toLowerCase().includes(search.toLowerCase()) || 
        m.role.toLowerCase().includes(search.toLowerCase()) ||
        (m.description && m.description.toLowerCase().includes(search.toLowerCase()));
      return matchDept && matchSearch;
    });
  }, [members, selectedDept, search]);

  const leadershipMembers = useMemo(() => members.filter(m => m.department === 'Leadership'), [members]);
  const adminMembers = useMemo(() => members.filter(m => m.department === 'Administration'), [members]);
  const ministryMembers = useMemo(() => members.filter(m => m.department === 'Ministries'), [members]);
  const choirMembers = useMemo(() => members.filter(m => m.department === 'Choir Team'), [members]);
  const vdpMembers = useMemo(() => members.filter(m => m.department === 'St. Vincent de Paul Sabai'), [members]);
  const councilMembers = useMemo(() => members.filter(m => m.department === 'Parish Council'), [members]);

  return (
    <div className="min-h-screen bg-church-cream pb-10 pt-10">
      {/* Hero Section */}
      <PageHero 
        title="Meet Our Team" 
        subtitle="Serving God and our church community with faith, love, and dedication."
        badge="PARISH LEADERSHIP & MINISTRIES"
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-10">
        
        {/* Search & Department Filters */}
        <div className="bg-white rounded-2xl p-4 sm:p-6 shadow-xl border border-gold-200/60 mb-12">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            
            {/* Department Filter Tabs */}
            <div className="flex items-center gap-2 overflow-x-auto w-full pb-2.5 scrollbar-thin scrollbar-thumb-amber-300 snap-x">
              {DEPARTMENTS.map(dept => (
                <button
                  key={dept.id}
                  onClick={() => setSelectedDept(dept.id)}
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold whitespace-nowrap transition-all duration-200 flex-shrink-0 snap-start ${
                    selectedDept === dept.id
                      ? 'bg-church-gold text-white shadow-gold'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200 hover:text-gray-900'
                  }`}
                >
                  <span>{dept.icon}</span>
                  <span>{dept.label}</span>
                </button>
              ))}
            </div>

            {/* Search Input */}
            {/* <div className="relative w-full md:w-72 flex-shrink-0">
              <FiSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search team by name or role..."
                className="church-input pl-10 pr-4 py-2.5 text-xs sm:text-sm w-full"
              />
            </div> */}
          </div>
        </div>

        {loading ? (
          <SectionLoader />
        ) : (
          <div className="space-y-16">

            {/* 1. CHURCH LEADERSHIP SECTION */}
            {(selectedDept === 'All' || selectedDept === 'Leadership') && (
              <section>
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 rounded-xl bg-church-royal-blue text-church-gold flex items-center justify-center text-xl shadow-md">
                    <GiCrucifix />
                  </div>
                  <div>
                    <h2 className="font-display text-2xl sm:text-3xl font-bold text-church-royal-blue">Church Leadership</h2>
                    <p className="text-gray-500 text-xs sm:text-sm">Guiding our spiritual growth and pastoral care</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  {(selectedDept === 'Leadership' ? filteredMembers : leadershipMembers).map(member => (
                    <motion.div
                      key={member._id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="bg-white rounded-3xl p-6 shadow-xl border-2 border-church-gold/30 hover:border-church-gold transition-all flex flex-col sm:flex-row items-center sm:items-start gap-6 group"
                    >
                      {/* Photo */}
                      <div className="relative w-32 h-32 sm:w-36 sm:h-36 rounded-2xl overflow-hidden bg-church-royal-blue/10 flex-shrink-0 border-2 border-church-gold/50 shadow-md">
                        {member.image ? (
                          <img 
                            src={getMediaUrl(member.image)} 
                            alt={member.name}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                            loading="lazy"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center bg-church-royal-blue text-white font-bold text-4xl">
                            {member.name?.[0]}
                          </div>
                        )}
                        {member.badge && (
                          <span className="absolute bottom-2 left-2 right-2 bg-church-gold text-white text-[10px] font-extrabold uppercase py-0.5 px-2 rounded-full text-center shadow">
                            {member.badge}
                          </span>
                        )}
                      </div>

                      {/* Details */}
                      <div className="flex-1 text-center sm:text-left">
                        <h3 className="font-display text-xl sm:text-2xl font-bold text-church-royal-blue">{member.name}</h3>
                        <p className="text-church-gold font-semibold text-sm mb-2">{member.role}</p>
                        
                        <p className="text-gray-600 text-xs sm:text-sm italic mb-4 leading-relaxed bg-amber-50/60 p-3 rounded-xl border border-amber-100">
                          "{member.description || 'Serving our parish community with faith, hope, and charity.'}"
                        </p>

                        <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2.5 pt-1">
                          {member.email && (
                            <a href={`mailto:${member.email}`} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gray-100 hover:bg-church-gold hover:text-white text-gray-700 text-xs font-bold transition-all shadow-xs">
                              <FiMail /> {member.email}
                            </a>
                          )}
                          {member.phone && (
                            <a href={`tel:${member.phone}`} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gray-100 hover:bg-church-gold hover:text-white text-gray-700 text-xs font-bold transition-all shadow-xs">
                              <FiPhone /> {member.phone}
                            </a>
                          )}
                          <Link to="/contact" className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-church-royal-blue text-white text-xs font-bold hover:bg-blue-900 transition-all shadow-sm">
                            <FiMessageSquare /> Contact
                          </Link>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </section>
            )}

            {/* 2. ADMINISTRATIVE TEAM SECTION */}
            {(selectedDept === 'All' || selectedDept === 'Administration') && (
              <section>
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 rounded-xl bg-church-royal-blue text-church-gold flex items-center justify-center text-xl shadow-md">
                    <FiShield />
                  </div>
                  <div>
                    <h2 className="font-display text-2xl sm:text-3xl font-bold text-church-royal-blue">Administrative Team</h2>
                    <p className="text-gray-500 text-xs sm:text-sm">Managing parish operations, records, and office support</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {(selectedDept === 'Administration' ? filteredMembers : adminMembers).map(member => (
                    <motion.div
                      key={member._id}
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="bg-white rounded-2xl p-5 shadow-lg border border-gray-100 hover:shadow-xl transition-all flex flex-col justify-between"
                    >
                      <div>
                        <div className="flex items-center gap-4 mb-4">
                          <div className="w-16 h-16 rounded-xl overflow-hidden bg-church-gold/10 border border-church-gold/40 flex-shrink-0">
                            {member.image ? (
                              <img src={getMediaUrl(member.image)} alt={member.name} className="w-full h-full object-cover" loading="lazy" />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center bg-church-gold text-white font-bold text-xl">
                                {member.name?.[0]}
                              </div>
                            )}
                          </div>
                          <div>
                            <span className="text-[10px] font-bold uppercase tracking-wider text-church-gold bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
                              {member.badge || 'Staff'}
                            </span>
                            <h3 className="font-bold text-gray-900 text-base mt-1">{member.name}</h3>
                            <p className="text-xs text-gray-500 font-medium">{member.role}</p>
                          </div>
                        </div>

                        <p className="text-gray-600 text-xs leading-relaxed mb-4">
                          {member.description || 'Handles daily parish operations, office administration, and record keeping.'}
                        </p>
                      </div>

                      <div className="pt-3 border-t border-gray-100 flex items-center justify-between gap-2">
                        {member.email ? (
                          <a href={`mailto:${member.email}`} className="text-xs text-church-royal-blue font-bold hover:underline flex items-center gap-1">
                            <FiMail /> Email Staff
                          </a>
                        ) : <span />}

                        <Link to="/contact" className="btn-outline-gold text-xs px-3 py-1.5 flex items-center gap-1">
                          <FiMessageSquare /> Contact
                        </Link>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </section>
            )}

            {/* 3. MINISTRY LEADERS SECTION */}
            {(selectedDept === 'All' || selectedDept === 'Ministries') && (
              <section>
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 rounded-xl bg-church-royal-blue text-church-gold flex items-center justify-center text-xl shadow-md">
                    <FiHeart />
                  </div>
                  <div>
                    <h2 className="font-display text-2xl sm:text-3xl font-bold text-church-royal-blue">Ministry Leaders</h2>
                    <p className="text-gray-500 text-xs sm:text-sm">Directing parish groups, music, youth, and spiritual activities</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                  {(selectedDept === 'Ministries' ? filteredMembers : ministryMembers).map(member => (
                    <motion.div
                      key={member._id}
                      initial={{ opacity: 0, y: 15 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="bg-white rounded-2xl p-5 shadow-md border border-gray-100 hover:shadow-xl hover:border-church-gold/50 transition-all flex flex-col justify-between"
                    >
                      <div>
                        <div className="relative w-full h-36 rounded-xl overflow-hidden bg-gray-100 mb-4">
                          {member.image ? (
                            <img src={getMediaUrl(member.image)} alt={member.name} className="w-full h-full object-cover" loading="lazy" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center bg-church-royal-blue text-white font-bold text-3xl">
                              {member.name?.[0]}
                            </div>
                          )}
                          {member.badge && (
                            <span className="absolute top-2 right-2 bg-church-royal-blue/90 text-church-gold text-[10px] font-bold px-2 py-0.5 rounded-full border border-church-gold/40">
                              {member.badge}
                            </span>
                          )}
                        </div>

                        <h3 className="font-bold text-gray-900 text-base">{member.name}</h3>
                        <p className="text-xs text-church-gold font-bold mb-2">{member.role}</p>
                        <p className="text-gray-600 text-xs leading-relaxed mb-4">
                          {member.description}
                        </p>
                      </div>

                      <div className="pt-3 border-t border-gray-100 flex items-center justify-between text-xs">
                        <span className="text-gray-400 font-medium">Parish Ministry</span>
                        <Link to="/contact" className="text-church-royal-blue font-bold hover:underline flex items-center gap-1">
                          Message <FiChevronRight />
                        </Link>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </section>
            )}

            {/* 4. CHOIR TEAM SECTION */}
            {(selectedDept === 'All' || selectedDept === 'Choir Team') && (
              <section>
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 rounded-xl bg-purple-900 text-purple-300 flex items-center justify-center text-xl shadow-md">
                    <FiMusic />
                  </div>
                  <div>
                    <h2 className="font-display text-2xl sm:text-3xl font-bold text-church-royal-blue">Choir Team & Musicians</h2>
                    <p className="text-gray-500 text-xs sm:text-sm">Leading liturgical music, organ, keyboard, guitars, and parish choir singing</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                  {(selectedDept === 'Choir Team' ? filteredMembers : choirMembers).map(member => (
                    <motion.div
                      key={member._id}
                      initial={{ opacity: 0, y: 15 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="bg-white rounded-2xl p-5 shadow-md border border-purple-100 hover:shadow-xl hover:border-purple-300 transition-all flex flex-col justify-between"
                    >
                      <div>
                        <div className="relative w-full h-36 rounded-xl overflow-hidden bg-purple-50 mb-4">
                          {member.image ? (
                            <img src={getMediaUrl(member.image)} alt={member.name} className="w-full h-full object-cover" loading="lazy" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center bg-purple-900 text-white font-bold text-3xl">
                              {member.name?.[0]}
                            </div>
                          )}
                          {member.badge && (
                            <span className="absolute top-2 right-2 bg-purple-900/90 text-purple-200 text-[10px] font-bold px-2 py-0.5 rounded-full border border-purple-400/40">
                              🎼 {member.badge}
                            </span>
                          )}
                        </div>

                        <h3 className="font-bold text-gray-900 text-base">{member.name}</h3>
                        <p className="text-xs text-purple-700 font-bold mb-2">{member.role}</p>
                        <p className="text-gray-600 text-xs leading-relaxed mb-4">
                          {member.description}
                        </p>
                      </div>

                      <div className="pt-3 border-t border-gray-100 flex items-center justify-between text-xs">
                        <span className="text-purple-600 font-bold">Liturgical Choir</span>
                        <Link to="/contact" className="text-church-royal-blue font-bold hover:underline flex items-center gap-1">
                          Contact <FiChevronRight />
                        </Link>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </section>
            )}

            {/* 5. ST. VINCENT DE PAUL SABAI SECTION */}
            {(selectedDept === 'All' || selectedDept === 'St. Vincent de Paul Sabai') && (
              <section>
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 rounded-xl bg-amber-800 text-amber-300 flex items-center justify-center text-xl shadow-md">
                    <FiHeart />
                  </div>
                  <div>
                    <h2 className="font-display text-2xl sm:text-3xl font-bold text-church-royal-blue">
                      St. Vincent de Paul Sabai (வின்சென்ட் தே போல் சபை)
                    </h2>
                    <p className="text-gray-500 text-xs sm:text-sm">Providing charitable assistance, education aid, and food support to the poor</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                  {(selectedDept === 'St. Vincent de Paul Sabai' ? filteredMembers : vdpMembers).map(member => (
                    <motion.div
                      key={member._id}
                      initial={{ opacity: 0, y: 15 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="bg-white rounded-2xl p-5 shadow-md border border-amber-200/60 hover:shadow-xl hover:border-amber-400 transition-all flex flex-col justify-between"
                    >
                      <div>
                        <div className="relative w-full h-36 rounded-xl overflow-hidden bg-amber-50 mb-4">
                          {member.image ? (
                            <img src={getMediaUrl(member.image)} alt={member.name} className="w-full h-full object-cover" loading="lazy" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center bg-amber-800 text-white font-bold text-3xl">
                              {member.name?.[0]}
                            </div>
                          )}
                          {member.badge && (
                            <span className="absolute top-2 right-2 bg-amber-900/90 text-amber-200 text-[10px] font-bold px-2 py-0.5 rounded-full border border-amber-400/40">
                              ✝️ {member.badge}
                            </span>
                          )}
                        </div>

                        <h3 className="font-bold text-gray-900 text-base">{member.name}</h3>
                        <p className="text-xs text-amber-800 font-bold mb-2">{member.role}</p>
                        <p className="text-gray-600 text-xs leading-relaxed mb-4">
                          {member.description}
                        </p>
                      </div>

                      <div className="pt-3 border-t border-gray-100 flex items-center justify-between text-xs">
                        <span className="text-amber-800 font-bold">Charity Sabai</span>
                        <Link to="/contact" className="text-church-royal-blue font-bold hover:underline flex items-center gap-1">
                          Contact <FiChevronRight />
                        </Link>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </section>
            )}

            {/* 4. PARISH COUNCIL SECTION */}
            {(selectedDept === 'All' || selectedDept === 'Parish Council') && (
              <section>
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 rounded-xl bg-church-royal-blue text-church-gold flex items-center justify-center text-xl shadow-md">
                    <GiChurch />
                  </div>
                  <div>
                    <h2 className="font-display text-2xl sm:text-3xl font-bold text-church-royal-blue">Parish Council</h2>
                    <p className="text-gray-500 text-xs sm:text-sm">Elected parish representatives and executive office bearers</p>
                  </div>
                </div>

                <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="bg-church-royal-blue text-white text-xs uppercase tracking-wider">
                          <th className="py-3.5 px-5">Member Name</th>
                          <th className="py-3.5 px-5">Position / Executive Role</th>
                          <th className="py-3.5 px-5">Department / Responsibility</th>
                          <th className="py-3.5 px-5 text-right">Contact Info</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100 text-xs sm:text-sm">
                        {(selectedDept === 'Parish Council' ? filteredMembers : councilMembers).map((m, idx) => (
                          <tr key={m._id} className={idx % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'}>
                            <td className="py-3.5 px-5 font-bold text-gray-900 flex items-center gap-3">
                              <div className="w-8 h-8 rounded-full bg-amber-100 text-amber-900 font-bold flex items-center justify-center text-xs flex-shrink-0">
                                {m.name?.[0]}
                              </div>
                              <span>{m.name}</span>
                            </td>
                            <td className="py-3.5 px-5 text-church-gold font-bold">{m.role}</td>
                            <td className="py-3.5 px-5 text-gray-600">{m.description || 'Parish Governance & Advisory'}</td>
                            <td className="py-3.5 px-5 text-right">
                              {m.email ? (
                                <a href={`mailto:${m.email}`} className="text-church-royal-blue hover:underline font-medium">
                                  {m.email}
                                </a>
                              ) : <span className="text-gray-400">Via Office</span>}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </section>
            )}

            {/* 5. VOLUNTEERS SECTION */}
            {(selectedDept === 'All' || selectedDept === 'Volunteers') && (
              <section>
                <div className="bg-gradient-to-r from-church-royal-blue to-blue-900 text-white rounded-3xl p-6 sm:p-10 shadow-2xl relative overflow-hidden">
                  <div className="relative z-10">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
                      <div>
                        <span className="bg-church-gold/20 text-church-gold border border-church-gold/40 text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider">
                          Community Service
                        </span>
                        <h2 className="font-display text-2xl sm:text-4xl font-extrabold text-white mt-2">
                          Volunteers & Faithful Servants
                        </h2>
                        <p className="text-gray-200 text-xs sm:text-sm mt-1 max-w-2xl">
                          More than <strong>50+ active volunteers</strong> faithfully serve in various parish ministries and community outreach programs every week.
                        </p>
                      </div>

                      <Link to="/contact" className="btn-gold py-3 px-6 text-xs sm:text-sm font-bold shadow-gold whitespace-nowrap self-start sm:self-auto">
                        Become a Volunteer
                      </Link>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                      {VOLUNTEER_MINISTRIES.map((v, i) => (
                        <div key={i} className="bg-white/10 backdrop-blur-md border border-white/15 rounded-2xl p-4 hover:bg-white/20 transition-all">
                          <div className="text-2xl mb-2">{v.icon}</div>
                          <h3 className="font-bold text-church-gold text-base mb-1">{v.name}</h3>
                          <p className="text-gray-200 text-xs leading-relaxed">{v.desc}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </section>
            )}

            {/* 6. CONTACT THE TEAM CARD */}
            <section className="bg-white rounded-3xl p-6 sm:p-10 shadow-xl border border-gold-200/70">
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
                <div className="lg:col-span-8">
                  <span className="text-church-gold font-bold text-xs uppercase tracking-wider">NEED ASSISTANCE?</span>
                  <h2 className="font-display text-2xl sm:text-3xl font-extrabold text-church-royal-blue mt-1 mb-3">
                    Contact the Parish Office & Team
                  </h2>
                  <p className="text-gray-600 text-xs sm:text-sm leading-relaxed mb-6">
                    Our parish office and ministry leaders are always available to help you with Mass intentions, sacraments, certificates, or spiritual guidance.
                  </p>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
                    <div className="bg-amber-50 p-4 rounded-2xl border border-amber-200">
                      <p className="text-gray-500 font-medium">Official Email:</p>
                      <p className="font-bold text-church-royal-blue text-sm mt-0.5">support@sjdbchurch.org</p>
                    </div>
                    <div className="bg-amber-50 p-4 rounded-2xl border border-amber-200">
                      <p className="text-gray-500 font-medium">Parish Office Phone:</p>
                      <p className="font-bold text-church-royal-blue text-sm mt-0.5">+91 98765 43210</p>
                    </div>
                    <div className="bg-amber-50 p-4 rounded-2xl border border-amber-200">
                      <p className="text-gray-500 font-medium">Office Hours:</p>
                      <p className="font-bold text-church-royal-blue text-sm mt-0.5">Mon–Sat: 9:00 AM – 5:00 PM</p>
                    </div>
                  </div>
                </div>

                <div className="lg:col-span-4 flex flex-col items-center justify-center text-center p-6 bg-church-cream rounded-2xl border border-gold-300/50">
                  <GiChurch className="text-5xl text-church-gold mb-3" />
                  <h3 className="font-bold text-church-royal-blue text-base">Visit Our Parish</h3>
                  <p className="text-gray-500 text-xs my-2">St. John de Britto's Church, Kalayarkoil, Sivagangai District</p>
                  <Link to="/contact" className="btn-gold w-full py-2.5 text-xs font-bold shadow-md mt-2">
                    Open Contact Page & Directions
                  </Link>
                </div>
              </div>
            </section>

          </div>
        )}
      </div>
    </div>
  );
}
