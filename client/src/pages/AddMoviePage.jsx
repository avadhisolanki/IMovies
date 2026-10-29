import React, { useState, useEffect } from 'react';
import { Film, Plus, Trash2, ArrowLeft, Star, Image, Video } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../services/api';
import { toast } from 'react-toastify';

const AddMoviePage = () => {
  const navigate = useNavigate();

  const [movieName, setMovieName] = useState('');
  const [description, setDescription] = useState('');
  const [genres, setGenres] = useState('Sci-Fi, Action, Drama');
  const [releaseDate, setReleaseDate] = useState(new Date().toISOString().split('T')[0]);
  const [language, setLanguage] = useState('English');
  const [duration, setDuration] = useState('150 min');
  const [certification, setCertification] = useState('U/A 13+');
  const [posterUrl, setPosterUrl] = useState('');
  const [backdropUrl, setBackdropUrl] = useState('');
  const [trailerUrl, setTrailerUrl] = useState('');
  const [cast, setCast] = useState('');
  const [rating, setRating] = useState(8.5);
  const [featured, setFeatured] = useState(false);

  const [existingMovies, setExistingMovies] = useState([]);
  const [submitting, setSubmitting] = useState(false);

  const fetchMovies = async () => {
    try {
      const res = await api.get('/movie');
      if (res.data && res.data.movies) {
        setExistingMovies(res.data.movies);
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchMovies();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!movieName || !description || !genres || !releaseDate || !language || !duration) {
      toast.warning('Please complete all required movie fields');
      return;
    }

    try {
      setSubmitting(true);
      const res = await api.post('/movie', {
        movieName,
        description,
        genres,
        releaseDate,
        language,
        duration,
        certification,
        posterUrl: posterUrl || 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=600&auto=format&fit=crop&q=80',
        backdropUrl: backdropUrl || 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=1600&auto=format&fit=crop&q=80',
        trailerUrl,
        cast,
        rating: Number(rating),
        featured,
      });

      if (res.data && res.data.success) {
        toast.success('Movie created successfully!');
        setMovieName('');
        setDescription('');
        setPosterUrl('');
        setBackdropUrl('');
        setTrailerUrl('');
        setCast('');
        fetchMovies();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to add movie');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this movie from the platform?')) return;
    try {
      await api.delete(`/movie/${id}`);
      toast.info('Movie deleted');
      fetchMovies();
    } catch (err) {
      toast.error('Failed to delete movie');
    }
  };

  return (
    <div className="min-h-screen bg-[#0f171e] text-white pb-20 pt-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#253241] pb-6">
          <div className="flex items-center gap-4">
            <Link
              to="/admin"
              className="p-2 rounded-lg bg-[#1a242f] hover:bg-[#253241] text-gray-300 hover:text-white transition"
            >
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div>
              <span className="text-xs font-bold uppercase tracking-widest text-[#00a8e1]">
                ADMINISTRATIVE CATALOG
              </span>
              <h1 className="text-2xl sm:text-3xl font-black text-white">Add New Theatrical Movie</h1>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Add Form */}
          <div className="lg:col-span-2 bg-[#1a242f] rounded-2xl border border-[#2c3b4d] p-6 shadow-xl">
            <h2 className="text-base font-bold text-white mb-6 flex items-center gap-2">
              <Film className="w-5 h-5 text-[#00a8e1]" />
              Movie Specifications
            </h2>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold uppercase tracking-wider text-gray-300 block mb-1">
                    Movie Title *
                  </label>
                  <input
                    type="text"
                    required
                    value={movieName}
                    onChange={(e) => setMovieName(e.target.value)}
                    placeholder="e.g. Inception"
                    className="w-full bg-[#151c24] text-white text-xs p-3 rounded-lg border border-[#2c3b4d] focus:outline-none focus:border-[#00a8e1]"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold uppercase tracking-wider text-gray-300 block mb-1">
                    Genres (Comma separated) *
                  </label>
                  <input
                    type="text"
                    required
                    value={genres}
                    onChange={(e) => setGenres(e.target.value)}
                    placeholder="Action, Sci-Fi, Thriller"
                    className="w-full bg-[#151c24] text-white text-xs p-3 rounded-lg border border-[#2c3b4d] focus:outline-none focus:border-[#00a8e1]"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-gray-300 block mb-1">
                  Synopsis / Description *
                </label>
                <textarea
                  rows="3"
                  required
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Enter detailed plot summary..."
                  className="w-full bg-[#151c24] text-white text-xs p-3 rounded-lg border border-[#2c3b4d] focus:outline-none focus:border-[#00a8e1]"
                ></textarea>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div>
                  <label className="text-xs font-bold uppercase tracking-wider text-gray-300 block mb-1">
                    Language *
                  </label>
                  <input
                    type="text"
                    required
                    value={language}
                    onChange={(e) => setLanguage(e.target.value)}
                    placeholder="English"
                    className="w-full bg-[#151c24] text-white text-xs p-3 rounded-lg border border-[#2c3b4d] focus:outline-none focus:border-[#00a8e1]"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold uppercase tracking-wider text-gray-300 block mb-1">
                    Duration *
                  </label>
                  <input
                    type="text"
                    required
                    value={duration}
                    onChange={(e) => setDuration(e.target.value)}
                    placeholder="148 min"
                    className="w-full bg-[#151c24] text-white text-xs p-3 rounded-lg border border-[#2c3b4d] focus:outline-none focus:border-[#00a8e1]"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold uppercase tracking-wider text-gray-300 block mb-1">
                    Rating (IMDb)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    min="1"
                    max="10"
                    value={rating}
                    onChange={(e) => setRating(e.target.value)}
                    className="w-full bg-[#151c24] text-white text-xs p-3 rounded-lg border border-[#2c3b4d] focus:outline-none focus:border-[#00a8e1]"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold uppercase tracking-wider text-gray-300 block mb-1">
                    Certification
                  </label>
                  <select
                    value={certification}
                    onChange={(e) => setCertification(e.target.value)}
                    className="w-full bg-[#151c24] text-white text-xs p-3 rounded-lg border border-[#2c3b4d] focus:outline-none focus:border-[#00a8e1]"
                  >
                    <option value="U">U (Universal)</option>
                    <option value="U/A 13+">U/A 13+</option>
                    <option value="U/A 16+">U/A 16+</option>
                    <option value="A 18+">A 18+</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold uppercase tracking-wider text-gray-300 block mb-1">
                    Release Date *
                  </label>
                  <input
                    type="date"
                    required
                    value={releaseDate}
                    onChange={(e) => setReleaseDate(e.target.value)}
                    className="w-full bg-[#151c24] text-white text-xs p-3 rounded-lg border border-[#2c3b4d] focus:outline-none focus:border-[#00a8e1]"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold uppercase tracking-wider text-gray-300 block mb-1">
                    Cast Members (Comma separated)
                  </label>
                  <input
                    type="text"
                    value={cast}
                    onChange={(e) => setCast(e.target.value)}
                    placeholder="Leonardo DiCaprio, Tom Hardy"
                    className="w-full bg-[#151c24] text-white text-xs p-3 rounded-lg border border-[#2c3b4d] focus:outline-none focus:border-[#00a8e1]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="text-xs font-bold uppercase tracking-wider text-gray-300 block mb-1">
                    Poster Image URL
                  </label>
                  <input
                    type="url"
                    value={posterUrl}
                    onChange={(e) => setPosterUrl(e.target.value)}
                    placeholder="https://..."
                    className="w-full bg-[#151c24] text-white text-xs p-3 rounded-lg border border-[#2c3b4d] focus:outline-none focus:border-[#00a8e1]"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold uppercase tracking-wider text-gray-300 block mb-1">
                    Backdrop Image URL
                  </label>
                  <input
                    type="url"
                    value={backdropUrl}
                    onChange={(e) => setBackdropUrl(e.target.value)}
                    placeholder="https://..."
                    className="w-full bg-[#151c24] text-white text-xs p-3 rounded-lg border border-[#2c3b4d] focus:outline-none focus:border-[#00a8e1]"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold uppercase tracking-wider text-gray-300 block mb-1">
                    YouTube Trailer URL
                  </label>
                  <input
                    type="url"
                    value={trailerUrl}
                    onChange={(e) => setTrailerUrl(e.target.value)}
                    placeholder="https://youtube.com/watch?v=..."
                    className="w-full bg-[#151c24] text-white text-xs p-3 rounded-lg border border-[#2c3b4d] focus:outline-none focus:border-[#00a8e1]"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2 pt-2">
                <input
                  type="checkbox"
                  id="featuredCheck"
                  checked={featured}
                  onChange={(e) => setFeatured(e.target.checked)}
                  className="w-4 h-4 accent-[#00a8e1] rounded cursor-pointer"
                />
                <label htmlFor="featuredCheck" className="text-xs text-gray-300 cursor-pointer font-semibold">
                  Feature in Amazon Prime Hero Carousel Billboard
                </label>
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full flex items-center justify-center gap-2 bg-[#00a8e1] hover:bg-[#0082b3] text-black font-extrabold text-sm py-3 rounded-xl transition shadow-prime-glow mt-4"
              >
                <Plus className="w-4 h-4" />
                Publish Movie to Catalog
              </button>
            </form>
          </div>

          {/* Existing Movies List */}
          <div className="bg-[#1a242f] rounded-2xl border border-[#2c3b4d] p-6 shadow-xl h-fit">
            <h2 className="text-base font-bold text-white mb-4">
              Current Catalog ({existingMovies.length})
            </h2>

            <div className="space-y-3 max-h-[600px] overflow-y-auto pr-1">
              {existingMovies.map((m) => (
                <div
                  key={m._id}
                  className="flex items-center justify-between p-3 bg-[#151c24] rounded-xl border border-[#253241]"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <img
                      src={m.posterUrl}
                      alt={m.movieName}
                      className="w-10 h-14 object-cover rounded shadow"
                    />
                    <div className="min-w-0">
                      <h4 className="text-xs font-bold text-white truncate">{m.movieName}</h4>
                      <p className="text-[10px] text-gray-400">{m.language} • {m.duration}</p>
                      <span className="text-[10px] font-bold text-amber-400">★ {m.rating}</span>
                    </div>
                  </div>

                  <button
                    onClick={() => handleDelete(m._id)}
                    className="p-1.5 text-red-400 hover:text-red-300 hover:bg-red-950/40 rounded transition"
                    title="Delete Movie"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>

        </div>

      </div>
    </div>
  );
};

export default AddMoviePage;
