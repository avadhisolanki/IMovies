import React, { useState } from 'react';
import { X, Key, CheckCircle, AlertCircle, RefreshCw, Film, ExternalLink } from 'lucide-react';
import { getTMDBApiKey, setTMDBApiKey, fetchNowPlaying } from '../services/tmdb';
import { toast } from 'react-toastify';

const TMDBConfigModal = ({ isOpen, onClose, onKeyUpdated }) => {
  const [apiKey, setApiKey] = useState(getTMDBApiKey());
  const [testing, setTesting] = useState(false);
  const [status, setStatus] = useState(null); // 'success' | 'error' | null

  if (!isOpen) return null;

  const handleSave = async () => {
    if (!apiKey.trim()) {
      toast.warning('Please enter a valid TMDB v3 API Key');
      return;
    }

    try {
      setTesting(true);
      setTMDBApiKey(apiKey.trim());
      const testResults = await fetchNowPlaying(1);
      if (testResults && testResults.length > 0) {
        setStatus('success');
        toast.success('TMDB API Key verified & saved!');
        if (onKeyUpdated) onKeyUpdated();
        setTimeout(onClose, 1000);
      } else {
        setStatus('error');
        toast.error('TMDB API responded with empty results. Check the key.');
      }
    } catch (err) {
      setStatus('error');
      toast.error('Failed to connect to TMDB API: ' + err.message);
    } finally {
      setTesting(false);
    }
  };

  const handleReset = () => {
    setTMDBApiKey(null);
    const def = getTMDBApiKey();
    setApiKey(def);
    toast.info('Reset to default TMDB demonstration key');
    if (onKeyUpdated) onKeyUpdated();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-lg bg-[#1a242f] rounded-2xl overflow-hidden border border-[#2c3b4d] shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between p-4 bg-[#151c24] border-b border-[#253241]">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-[#01b4e4] to-[#90cea1] flex items-center justify-center text-black font-black shadow">
              <Film className="w-5 h-5 text-black" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                TMDB (The Movie Database) v3 Integration
              </h3>
              <p className="text-[11px] text-gray-400">Live API Key & Cinema Feed Settings</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-full text-gray-400 hover:text-white hover:bg-[#253241]"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-4">
          <div className="bg-[#151c24] p-3.5 rounded-xl border border-[#253241] flex items-start gap-3">
            <Key className="w-5 h-5 text-[#00a8e1] flex-shrink-0 mt-0.5" />
            <div className="text-xs text-gray-300 space-y-1">
              <p className="font-semibold text-white">Official TMDB v3 Endpoints Active:</p>
              <ul className="text-[11px] text-gray-400 list-disc list-inside space-y-0.5">
                <li><code>/trending/movie/week</code> (Hero Carousel & Billboard)</li>
                <li><code>/movie/now_playing</code> (Now Showing In Theatres)</li>
                <li><code>/movie/{'{movie_id}'}?append_to_response=credits,videos</code></li>
                <li><code>/search/movie</code> (Real-time live autocomplete)</li>
                <li><code>/discover/movie</code> (Genre, Year & Language filtering)</li>
              </ul>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-gray-300 mb-1.5">
              TMDB v3 API Key
            </label>
            <input
              type="text"
              value={apiKey}
              onChange={(e) => {
                setApiKey(e.target.value);
                setStatus(null);
              }}
              placeholder="Enter your 32-character TMDB API key"
              className="w-full bg-[#151c24] text-white text-xs p-3 rounded-lg border border-[#2c3b4d] focus:outline-none focus:border-[#00a8e1] font-mono"
            />
          </div>

          {status === 'success' && (
            <div className="flex items-center gap-2 text-xs text-emerald-400 bg-emerald-950/40 border border-emerald-800/40 p-2.5 rounded-lg">
              <CheckCircle className="w-4 h-4" />
              <span>Connection active: Successfully streaming live data from TMDB!</span>
            </div>
          )}

          {status === 'error' && (
            <div className="flex items-center gap-2 text-xs text-red-400 bg-red-950/40 border border-red-800/40 p-2.5 rounded-lg">
              <AlertCircle className="w-4 h-4" />
              <span>Failed to reach TMDB with this key. Check key or internet connection.</span>
            </div>
          )}

          {/* Action buttons */}
          <div className="flex items-center justify-between pt-2">
            <button
              type="button"
              onClick={handleReset}
              className="text-xs text-gray-400 hover:text-white underline cursor-pointer"
            >
              Reset to Default Key
            </button>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleSave}
                disabled={testing}
                className="flex items-center gap-1.5 bg-[#00a8e1] hover:bg-[#0082b3] text-black font-extrabold text-xs px-4 py-2.5 rounded-lg transition shadow-prime-glow disabled:opacity-50 cursor-pointer"
              >
                {testing ? (
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <CheckCircle className="w-3.5 h-3.5" />
                )}
                Save & Verify Key
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TMDBConfigModal;
