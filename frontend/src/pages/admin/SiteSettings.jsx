import { useState, useEffect, useRef, useMemo } from 'react';
import { motion } from 'framer-motion';
import { FiSettings, FiUpload, FiYoutube, FiMusic, FiImage, FiCheck, FiLoader, FiExternalLink, FiTrash2 } from 'react-icons/fi';
import { GiCrucifix } from 'react-icons/gi';
import toast from 'react-hot-toast';
import api, { UPLOADS_URL } from '../../services/api';
import DailyVersesManager from '../../components/admin/DailyVersesManager';

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
    label: 'Home Page Background Image',
    description: 'Upload the main header/hero background image shown on the Home page.',
    icon: <FiImage className="text-2xl" />,
    color: 'bg-blue-600',
    type: 'file',
    accept: 'image/*',
    fileLabel: 'Upload Background Image'
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
  const patterns = [
    /(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/,
    /^([a-zA-Z0-9_-]{11})$/,
  ];
  for (const re of patterns) {
    const m = input.match(re);
    if (m) return m[1];
  }
  return input.split(/[?&]/)[0].trim();
}

function SettingCard({ setting, currentValue, onValueUpdate }) {
  const [textValue, setTextValue] = useState('');
  const [debouncedValue, setDebouncedValue] = useState('');
  const [file, setFile] = useState(null);
  const [saving, setSaving] = useState(false);
  const [removing, setRemoving] = useState(false);
  const [saved, setSaved] = useState(false);
  const fileRef = useRef(null);

  useEffect(() => {
    if (setting.type === 'text' && currentValue !== undefined) {
      setTextValue(currentValue || '');
      setDebouncedValue(currentValue || '');
    }
  }, [currentValue, setting.type]);

  // Debounce input to prevent typing lag caused by iframe re-rendering
  useEffect(() => {
    if (setting.type !== 'text') return;
    const timer = setTimeout(() => {
      setDebouncedValue(textValue);
    }, 350);
    return () => clearTimeout(timer);
  }, [textValue, setting.type]);

  const extractedId = useMemo(() => {
    return setting.key === 'videoAdId' ? extractYouTubeId(debouncedValue) : debouncedValue;
  }, [debouncedValue, setting.key]);

  const previewUrl = useMemo(() => {
    if (file) return URL.createObjectURL(file);
    if (currentValue && setting.type === 'file') {
      return currentValue.startsWith('http')
        ? currentValue
        : `${UPLOADS_URL.replace('/uploads', '')}${currentValue}`;
    }
    return null;
  }, [file, currentValue, setting.type]);

  const handleSave = async () => {
    setSaving(true);
    try {
      if (setting.type === 'text') {
        if (!textValue.trim()) return toast.error('Please enter a value');
        const valueToSave = setting.key === 'videoAdId' ? extractYouTubeId(textValue) : textValue.trim();
        if (!valueToSave) return toast.error('Could not extract a valid YouTube ID.');
        
        await api.post('/settings/text', { key: setting.key, value: valueToSave, label: setting.label });
        setTextValue(valueToSave);
        setDebouncedValue(valueToSave);
        if (onValueUpdate) onValueUpdate(setting.key, valueToSave);
        toast.success(`${setting.label} updated!`);
      } else {
        if (!file) return toast.error('Please select a file first');
        const fd = new FormData();
        fd.append('file', file);
        fd.append('key', setting.key);
        fd.append('label', setting.label);
        const res = await api.post('/settings/file', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
        toast.success(`${setting.label} uploaded!`);
        if (onValueUpdate && res.data.filePath) onValueUpdate(setting.key, res.data.filePath);
        setFile(null);
        if (fileRef.current) fileRef.current.value = '';
      }
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  const handleRemove = async () => {
    if (!window.confirm(`Are you sure you want to remove ${setting.label}? It will revert to default.`)) return;
    setRemoving(true);
    try {
      await api.delete(`/settings/${setting.key}`);
      setTextValue('');
      setDebouncedValue('');
      setFile(null);
      if (fileRef.current) fileRef.current.value = '';
      if (onValueUpdate) onValueUpdate(setting.key, null);
      toast.success(`${setting.label} removed! Reverted to default.`);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to remove setting');
    } finally {
      setRemoving(false);
    }
  };

  const hasConfiguredValue = Boolean(currentValue || file || (setting.type === 'text' && textValue.trim()));

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden flex flex-col justify-between">
      <div>
        <div className={`${setting.color} p-4 flex items-center justify-between text-white`}>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
              {setting.icon}
            </div>
            <div>
              <p className="font-bold text-base leading-tight">{setting.label}</p>
              <p className="text-white/70 text-xs">{setting.type === 'text' ? 'Text Setting' : 'File Upload'}</p>
            </div>
          </div>
          {hasConfiguredValue && (
            <span className="text-[10px] bg-white/20 text-white font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">
              Customized
            </span>
          )}
        </div>

        <div className="p-5 space-y-4">
          <p className="text-gray-500 text-xs leading-relaxed">{setting.description}</p>

          {setting.type === 'text' ? (
            <>
              <input
                type="text"
                value={textValue}
                onChange={e => setTextValue(e.target.value)}
                placeholder={setting.placeholder}
                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-church-gold transition-colors font-medium text-gray-800"
              />
              {setting.hint && (
                <p className="text-[11px] text-gray-400 flex items-center gap-1">
                  <FiExternalLink className="flex-shrink-0" /> {setting.hint}
                </p>
              )}
              {debouncedValue && setting.key === 'videoAdId' && extractedId && (
                <>
                  <div className="aspect-video rounded-xl overflow-hidden border border-gray-100 bg-black/5">
                    <iframe
                      key={extractedId}
                      src={`https://www.youtube.com/embed/${extractedId}?mute=1`}
                      className="w-full h-full"
                      title="Preview"
                      loading="lazy"
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
                className="flex items-center justify-center gap-3 border-2 border-dashed border-gray-200 rounded-xl py-5 cursor-pointer hover:border-church-gold hover:bg-gold-50/50 transition-all text-gray-500"
              >
                <FiUpload className="text-lg text-church-gold" />
                <span className="text-xs font-semibold text-gray-700">{file ? file.name : setting.fileLabel}</span>
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
                <div className="rounded-xl overflow-hidden border border-gray-100 h-32 bg-gray-50">
                  <img src={previewUrl} alt="Preview" className="w-full h-full object-cover" loading="lazy" />
                </div>
              )}
              {previewUrl && setting.accept?.startsWith('audio') && (
                <audio controls src={previewUrl} className="w-full" />
              )}
            </>
          )}
        </div>
      </div>

      <div className="p-5 pt-0 flex gap-2">
        <button
          onClick={handleSave}
          disabled={saving || removing}
          className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl font-bold text-white text-sm transition-all ${
            saved ? 'bg-green-600' : `${setting.color} hover:brightness-110`
          } disabled:opacity-60 shadow-xs`}
        >
          {saving ? <FiLoader className="animate-spin" /> : saved ? <FiCheck /> : <FiUpload />}
          {saving ? 'Saving...' : saved ? 'Saved!' : 'Save Changes'}
        </button>

        {hasConfiguredValue && (
          <button
            onClick={handleRemove}
            disabled={saving || removing}
            title={`Remove custom ${setting.label}`}
            className="px-3.5 py-2.5 rounded-xl font-bold text-red-600 bg-red-50 hover:bg-red-100 border border-red-200 text-xs flex items-center justify-center gap-1.5 transition-all shadow-xs disabled:opacity-50"
          >
            {removing ? <FiLoader className="animate-spin" /> : <FiTrash2 className="text-base" />}
            <span>Remove</span>
          </button>
        )}
      </div>
    </div>
  );
}

export default function SiteSettings() {
  const [currentValues, setCurrentValues] = useState({});

  useEffect(() => {
    api.get('/settings')
      .then(r => setCurrentValues(r.data.settings || {}))
      .catch(() => {});
  }, []);

  const handleValueUpdate = (key, newValue) => {
    setCurrentValues(prev => ({ ...prev, [key]: newValue }));
  };

  return (
    <div className="p-4 sm:p-6 max-w-6xl mx-auto space-y-8">
      <div>
        <div className="flex items-center gap-3 mb-1">
          <div className="w-10 h-10 bg-church-gold text-white rounded-xl flex items-center justify-center shadow-gold">
            <FiSettings className="text-xl" />
          </div>
          <div>
            <h1 className="font-display text-xl sm:text-2xl font-bold text-church-royal-blue">Site Settings</h1>
            <p className="text-gray-500 text-xs">Manage website media, videos, branding files, and Daily Scripture Verses CMS.</p>
          </div>
        </div>
      </div>

      <div className="p-4 bg-amber-50/90 border border-amber-200 rounded-2xl text-xs text-amber-800 leading-relaxed shadow-xs">
        <strong className="text-amber-950 font-bold">Note:</strong> After updating an image or audio file, users may need to refresh the website to see the new content.
        Removing a custom upload will instantly revert that setting back to default.
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {SETTING_CARDS.map(s => (
          <SettingCard
            key={s.key}
            setting={s}
            currentValue={currentValues[s.key]}
            onValueUpdate={handleValueUpdate}
          />
        ))}
      </div>

      {/* Daily Bible Verses CMS Manager */}
      <DailyVersesManager />
    </div>
  );
}
