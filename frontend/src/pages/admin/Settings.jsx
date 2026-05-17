import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { FiSettings, FiUpload, FiYoutube, FiMusic, FiImage, FiCheck, FiLoader, FiExternalLink } from 'react-icons/fi';
import { GiCrucifix } from 'react-icons/gi';
import toast from 'react-hot-toast';
import api, { UPLOADS_URL } from '../../services/api';

const SETTING_CARDS = [
  {
    key: 'videoAdId',
    label: 'Video Widget (YouTube)',
    description: 'Paste any YouTube link or just the video ID. The ID will be extracted automatically.',
    icon: <FiYoutube className="text-2xl" />,
    color: 'bg-red-500',
    type: 'text',
    placeholder: 'Paste YouTube URL or Video ID here',
    hint: 'Supports: full URL, share link, or bare ID (e.g. i1dEoV-p03k)'
  },
  {
    key: 'rosaryAudio',
    label: 'Rosary Audio (Tamil MP3)',
    description: 'Upload the Tamil Rosary prayer audio file. This replaces the default bundled audio.',
    icon: <FiMusic className="text-2xl" />,
    color: 'bg-purple-600',
    type: 'file',
    accept: 'audio/*',
    fileLabel: 'Upload MP3 / Audio File'
  },
  {
    key: 'heroImage',
    label: 'Home Page Hero Image',
    description: 'Upload the main header/hero background image shown on the Home page.',
    icon: <FiImage className="text-2xl" />,
    color: 'bg-blue-600',
    type: 'file',
    accept: 'image/*',
    fileLabel: 'Upload Hero Image'
  },
  {
    key: 'stJohnImage',
    label: 'St. John de Britto Image',
    description: 'Upload the image of St. John de Britto shown on the Home page.',
    icon: <GiCrucifix className="text-2xl" />,
    color: 'bg-amber-600',
    type: 'file',
    accept: 'image/*',
    fileLabel: 'Upload Saint Image'
  },
  {
    key: 'priestImage',
    label: 'Parish Priest Image',
    description: 'Upload the photo of the current Parish Priest shown on the Home page.',
    icon: <FiImage className="text-2xl" />,
    color: 'bg-green-600',
    type: 'file',
    accept: 'image/*',
    fileLabel: 'Upload Priest Photo'
  },
];

function extractYouTubeId(input) {
  if (!input) return '';
  // Match youtu.be/ID, ?v=ID, /embed/ID, or bare 11-char ID
  const patterns = [
    /(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/,
    /^([a-zA-Z0-9_-]{11})$/,
  ];
  for (const re of patterns) {
    const m = input.match(re);
    if (m) return m[1];
  }
  // Fallback: strip everything after ? or &
  return input.split(/[?&]/)[0].trim();
}

function SettingCard({ setting, currentValue }) {
  const [textValue, setTextValue] = useState('');
  const [file, setFile] = useState(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const fileRef = useRef(null);

  const extractedId = setting.key === 'videoAdId' ? extractYouTubeId(textValue) : textValue;

  useEffect(() => {
    if (setting.type === 'text' && currentValue) {
      setTextValue(currentValue);
    }
  }, [currentValue, setting.type]);

  const previewUrl = (() => {
    if (file) return URL.createObjectURL(file);
    if (currentValue && setting.type === 'file') {
      return currentValue.startsWith('http')
        ? currentValue
        : `${UPLOADS_URL.replace('/uploads', '')}${currentValue}`;
    }
    return null;
  })();

  const handleSave = async () => {
    setSaving(true);
    try {
      if (setting.type === 'text') {
        if (!textValue.trim()) return toast.error('Please enter a value');
        const valueToSave = setting.key === 'videoAdId' ? extractYouTubeId(textValue) : textValue.trim();
        if (!valueToSave) return toast.error('Could not extract a valid YouTube ID. Please check the URL.');
        await api.post('/settings/text', { key: setting.key, value: valueToSave, label: setting.label });
        setTextValue(valueToSave); // update display to show clean extracted ID
        toast.success(`${setting.label} updated!`);
      } else {
        if (!file) return toast.error('Please select a file first');
        const fd = new FormData();
        fd.append('file', file);
        fd.append('key', setting.key);
        fd.append('label', setting.label);
        await api.post('/settings/file', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
        toast.success(`${setting.label} uploaded!`);
        setFile(null);
        if (fileRef.current) fileRef.current.value = '';
      }
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden"
    >
      <div className={`${setting.color} p-4 flex items-center gap-3 text-white`}>
        <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
          {setting.icon}
        </div>
        <div>
          <p className="font-bold text-base leading-tight">{setting.label}</p>
          <p className="text-white/70 text-xs">{setting.type === 'text' ? 'Text Setting' : 'File Upload'}</p>
        </div>
      </div>

      <div className="p-5 space-y-4">
        <p className="text-gray-500 text-sm">{setting.description}</p>

        {setting.type === 'text' ? (
          <>
            <input
              type="text"
              value={textValue}
              onChange={e => setTextValue(e.target.value)}
              placeholder={setting.placeholder}
              className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-church-gold transition-colors"
            />
            {setting.hint && (
              <p className="text-xs text-gray-400 flex items-center gap-1">
                <FiExternalLink className="flex-shrink-0" /> {setting.hint}
              </p>
            )}
            {textValue && setting.key === 'videoAdId' && extractedId && (
              <>
                {extractedId !== textValue && (
                  <p className="text-xs text-green-600 font-medium flex items-center gap-1">
                    <FiCheck className="flex-shrink-0" /> Extracted ID: <span className="font-mono bg-green-50 px-1 rounded">{extractedId}</span>
                  </p>
                )}
                <div className="aspect-video rounded-xl overflow-hidden border border-gray-100">
                  <iframe
                    key={extractedId}
                    src={`https://www.youtube.com/embed/${extractedId}?mute=1`}
                    className="w-full h-full"
                    title="Preview"
                    frameBorder="0"
                    allow="accelerometer; autoplay"
                  />
                </div>
              </>
            )}
          </>
        ) : (
          <>
            <label
              htmlFor={`file-${setting.key}`}
              className="flex items-center justify-center gap-3 border-2 border-dashed border-gray-200 rounded-xl py-6 cursor-pointer hover:border-church-gold hover:bg-gold-50/50 transition-all text-gray-500"
            >
              <FiUpload className="text-xl" />
              <span className="text-sm font-medium">{file ? file.name : setting.fileLabel}</span>
              <input
                ref={fileRef}
                id={`file-${setting.key}`}
                type="file"
                accept={setting.accept}
                className="hidden"
                onChange={e => setFile(e.target.files[0] || null)}
              />
            </label>

            {/* Preview */}
            {previewUrl && setting.accept?.startsWith('image') && (
              <div className="rounded-xl overflow-hidden border border-gray-100 h-36">
                <img src={previewUrl} alt="Preview" className="w-full h-full object-cover" />
              </div>
            )}
            {previewUrl && setting.accept?.startsWith('audio') && (
              <audio controls src={previewUrl} className="w-full" />
            )}
          </>
        )}

        <button
          onClick={handleSave}
          disabled={saving}
          className={`w-full flex items-center justify-center gap-2 py-2.5 rounded-xl font-bold text-white text-sm transition-all ${saved ? 'bg-green-500' : `${setting.color} hover:brightness-110`} disabled:opacity-60`}
        >
          {saving ? <FiLoader className="animate-spin" /> : saved ? <FiCheck /> : <FiUpload />}
          {saving ? 'Saving...' : saved ? 'Saved!' : 'Save Changes'}
        </button>
      </div>
    </motion.div>
  );
}

export default function AdminSettings() {
  const [currentValues, setCurrentValues] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/settings')
      .then(r => setCurrentValues(r.data.settings || {}))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-1">
          <div className="w-10 h-10 bg-church-gold rounded-xl flex items-center justify-center">
            <FiSettings className="text-white text-xl" />
          </div>
          <h1 className="font-display text-2xl font-bold text-church-royal-blue">Site Settings</h1>
        </div>
        <p className="text-gray-500 text-sm ml-13">Manage website media, videos, and branding files.</p>
      </div>

      <div className="mt-5 mb-5 p-4 bg-amber-50 border border-amber-200 rounded-2xl text-sm text-amber-700">
        <strong>Note:</strong> After updating an image or audio file, users may need to refresh the website to see the new content.
        The Tamil Rosary audio and home page images will update instantly for new visitors.
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-24">
          <FiLoader className="animate-spin text-church-gold text-3xl" />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {SETTING_CARDS.map(s => (
            <SettingCard key={s.key} setting={s} currentValue={currentValues[s.key]} />
          ))}
        </div>
      )}

      
    </div>
  );
}
