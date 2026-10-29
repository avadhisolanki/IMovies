import React, { useState, useEffect } from 'react';
import {
  Film,
  Filter,
  Sparkles,
  Flame,
  Award,
  Globe,
  Calendar,
  SlidersHorizontal,
  RefreshCw,
} from 'lucide-react';
import {
  fetchTrendingMovies,
  fetchNowPlaying,
  discoverMovies,
  TMDB_GENRES,
} from '../services/tmdb';
import HeroBanner from '../components/HeroBanner';
import MovieCarousel from '../components/MovieCarousel';
import MovieCard from '../components/MovieCard';

const HomePage = () => {
  // Main data states
  const [trendingMovies, setTrendingMovies] = useState([]);
  const [nowPlayingMovies, setNowPlayingMovies] = useState([]);
  const [filteredMovies, setFilteredMovies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filtering, setFiltering] = useState(false);

  // Filter criteria
  const [selectedGenreId, setSelectedGenreId] = useState('All');
  const [selectedLanguage, setSelectedLanguage] = useState('All');
  const [selectedYear, setSelectedYear] = useState('All');
  const [selectedSort, setSelectedSort] = useState('popularity.desc');

  const languages = [
    { code: 'All', name: 'All Languages' },
    { code: 'en', name: 'English' },
    { code: 'hi', name: 'Hindi' },
    { code: 'te', name: 'Telugu' },
    { code: 'es', name: 'Spanish' },
    { code: 'ja', name: 'Japanese' },
    { code: 'ko', name: 'Korean' },
    { code: 'fr', name: 'French' },
  ];

  const years = ['All', '2026', '2025', '2024', '2023', '2022', '2020'];

  const sortOptions = [
    { value: 'popularity.desc', label: 'Most Popular' },
    { value: 'vote_average.desc', label: 'Highest Rated' },
    { value: 'primary_release_date.desc', label: 'Newest Releases' },
  ];

  // Initial Fetch: Trending & Now Playing
  useEffect(() => {
    const loadHomeData = async () => {
      try {
        setLoading(true);
        const [trending, nowPlaying] = await Promise.all([
          fetchTrendingMovies('week'),
          fetchNowPlaying(1),
        ]);
        setTrendingMovies(trending);
        setNowPlayingMovies(nowPlaying);
      } catch (err) {
        console.error('Home page load error:', err);
      } finally {
        setLoading(false);
      }
    };

    loadHomeData();
  }, []);

  // Filter effect: triggers discover API when filters are active
  const isFilterActive =
    selectedGenreId !== 'All' ||
    selectedLanguage !== 'All' ||
    selectedYear !== 'All' ||
    selectedSort !== 'popularity.desc';

  useEffect(() => {
    if (!isFilterActive) {
      setFilteredMovies([]);
      return;
    }

    const runDiscover = async () => {
      try {
        setFiltering(true);
        const results = await discoverMovies({
          genreId: selectedGenreId,
          language: selectedLanguage,
          year: selectedYear,
          sortBy: selectedSort,
        });
        setFilteredMovies(results);
      } catch (err) {
        console.error('Discover error:', err);
      } finally {
        setFiltering(false);
      }
    };

    runDiscover();
  }, [selectedGenreId, selectedLanguage, selectedYear, selectedSort, isFilterActive]);

  const handleResetFilters = () => {
    setSelectedGenreId('All');
    setSelectedLanguage('All');
    setSelectedYear('All');
    setSelectedSort('popularity.desc');
  };

  // Genre specific splits for carousel rows
  const actionMovies = nowPlayingMovies
    .concat(trendingMovies)
    .filter((m) => m.genres?.includes('Action'))
    .slice(0, 10);

  const sciFiMovies = nowPlayingMovies
    .concat(trendingMovies)
    .filter((m) => m.genres?.includes('Sci-Fi') || m.genres?.includes('Science Fiction'))
    .slice(0, 10);

  const topRatedMovies = [...trendingMovies]
    .sort((a, b) => (b.rating || 0) - (a.rating || 0))
    .slice(0, 10);

  return (
    <div className="min-h-screen bg-[#0f171e] text-white">
      {/* Featured Hero Billboard Carousel (Rendered when no active filters) */}
      {!isFilterActive && trendingMovies.length > 0 && (
        <HeroBanner movies={trendingMovies} />
      )}

      {/* Multi-Faceted Dynamic Filter Bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 pb-4">
        <div className="bg-[#1a242f]/80 p-4 rounded-2xl border border-[#2c3b4d] backdrop-blur-md shadow-xl space-y-4">
          
          {/* Top Controls: Genre Pills */}
          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-1">
            <span className="text-xs font-bold text-gray-400 uppercase tracking-wider flex items-center gap-1 mr-1 flex-shrink-0">
              <Filter className="w-3.5 h-3.5 text-[#00a8e1]" />
              Genre:
            </span>
            <button
              onClick={() => setSelectedGenreId('All')}
              className={`text-xs px-3.5 py-1.5 rounded-full font-semibold transition whitespace-nowrap flex-shrink-0 ${
                selectedGenreId === 'All'
                  ? 'bg-[#00a8e1] text-black shadow-prime-glow'
                  : 'bg-[#151c24] text-gray-300 hover:text-white hover:bg-[#253241] border border-[#2c3b4d]'
              }`}
            >
              All Genres
            </button>
            {TMDB_GENRES.map((g) => (
              <button
                key={g.id}
                onClick={() => setSelectedGenreId(g.id)}
                className={`text-xs px-3.5 py-1.5 rounded-full font-semibold transition whitespace-nowrap flex-shrink-0 ${
                  selectedGenreId === g.id
                    ? 'bg-[#00a8e1] text-black shadow-prime-glow'
                    : 'bg-[#151c24] text-gray-300 hover:text-white hover:bg-[#253241] border border-[#2c3b4d]'
                }`}
              >
                {g.name}
              </button>
            ))}
          </div>

          {/* Secondary Controls: Language, Year, Sort & Reset */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-[#253241] text-xs">
            <div className="flex flex-wrap items-center gap-4">
              
              {/* Language Filter */}
              <div className="flex items-center gap-1.5">
                <Globe className="w-3.5 h-3.5 text-[#00a8e1]" />
                <span className="text-gray-400 font-semibold">Language:</span>
                <select
                  value={selectedLanguage}
                  onChange={(e) => setSelectedLanguage(e.target.value)}
                  className="bg-[#151c24] text-white text-xs px-2.5 py-1.5 rounded-lg border border-[#2c3b4d] focus:outline-none focus:border-[#00a8e1]"
                >
                  {languages.map((l) => (
                    <option key={l.code} value={l.code}>
                      {l.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Release Year Filter */}
              <div className="flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-purple-400" />
                <span className="text-gray-400 font-semibold">Year:</span>
                <select
                  value={selectedYear}
                  onChange={(e) => setSelectedYear(e.target.value)}
                  className="bg-[#151c24] text-white text-xs px-2.5 py-1.5 rounded-lg border border-[#2c3b4d] focus:outline-none focus:border-[#00a8e1]"
                >
                  {years.map((y) => (
                    <option key={y} value={y}>
                      {y === 'All' ? 'All Years' : y}
                    </option>
                  ))}
                </select>
              </div>

              {/* Sort By Filter */}
              <div className="flex items-center gap-1.5">
                <SlidersHorizontal className="w-3.5 h-3.5 text-amber-400" />
                <span className="text-gray-400 font-semibold">Sort By:</span>
                <select
                  value={selectedSort}
                  onChange={(e) => setSelectedSort(e.target.value)}
                  className="bg-[#151c24] text-white text-xs px-2.5 py-1.5 rounded-lg border border-[#2c3b4d] focus:outline-none focus:border-[#00a8e1]"
                >
                  {sortOptions.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>

            </div>

            {/* Active filter counter and Reset button */}
            {isFilterActive && (
              <button
                onClick={handleResetFilters}
                className="flex items-center gap-1.5 bg-[#253241] hover:bg-[#2c3b4d] text-gray-300 hover:text-white px-3 py-1.5 rounded-lg text-xs font-semibold transition"
              >
                <RefreshCw className="w-3 h-3 text-[#00a8e1]" />
                Reset Filters
              </button>
            )}
          </div>

        </div>
      </div>

      {/* Main Content Area */}
      {loading ? (
        <div className="py-24 flex flex-col items-center justify-center text-white">
          <div className="w-12 h-12 border-4 border-[#00a8e1] border-t-transparent rounded-full animate-spin mb-4"></div>
          <p className="text-xs text-gray-400 uppercase tracking-widest font-bold">
            Streaming Real-Time Theatrical Feeds via TMDB...
          </p>
        </div>
      ) : isFilterActive ? (
        /* Filtered Discovery Grid View */
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight flex items-center gap-2">
                <span>TMDB Discover Results</span>
                <span className="text-xs font-bold text-[#00a8e1] bg-[#00a8e1]/10 px-2.5 py-0.5 rounded-full border border-[#00a8e1]/30">
                  {filtering ? 'Searching...' : `${filteredMovies.length} movies`}
                </span>
              </h2>
              <p className="text-xs text-gray-400 mt-1">
                Displaying real-time global movie releases matching your chosen criteria.
              </p>
            </div>
          </div>

          {filtering ? (
            <div className="py-20 flex flex-col items-center justify-center">
              <div className="w-8 h-8 border-3 border-[#00a8e1] border-t-transparent rounded-full animate-spin mb-3"></div>
              <p className="text-xs text-gray-400">Discovering matching theatrical titles...</p>
            </div>
          ) : filteredMovies.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6">
              {filteredMovies.map((movie) => (
                <MovieCard key={movie._id || movie.id} movie={movie} />
              ))}
            </div>
          ) : (
            <div className="py-16 text-center bg-[#1a242f] rounded-2xl border border-[#2c3b4d] p-8 max-w-lg mx-auto">
              <Film className="w-12 h-12 text-gray-500 mx-auto mb-3" />
              <h3 className="text-base font-bold text-white">No films matching selected filters</h3>
              <p className="text-xs text-gray-400 mt-1">
                Try widening your genre, audio language, or release year filters.
              </p>
              <button
                onClick={handleResetFilters}
                className="mt-4 text-xs font-bold bg-[#00a8e1] hover:bg-[#0082b3] text-black px-4 py-2 rounded-lg transition"
              >
                Reset All Filters
              </button>
            </div>
          )}
        </div>
      ) : (
        /* Prime Video Carousel Layout */
        <div className="space-y-4 pb-12">
          {/* 1. Now Playing in Theatres (TMDB /movie/now_playing) */}
          <MovieCarousel
            title="Now Showing in Theatres"
            subtitle="Current box-office releases available for seat booking"
            badgeText="BOX OFFICE"
            movies={nowPlayingMovies}
          />

          {/* 2. Trending This Week (TMDB /trending/movie/week) */}
          <MovieCarousel
            title="Trending in Prime IMAX"
            subtitle="Most engaged theatrical titles this week"
            badgeText="TRENDING"
            movies={trendingMovies}
          />

          {/* 3. Critically Acclaimed Masterpieces */}
          <MovieCarousel
            title="Critically Acclaimed Masterpieces"
            subtitle="Top rated cinema gems with highest TMDB audience scores"
            badgeText="CRITICS CHOICE"
            movies={topRatedMovies}
          />

          {/* 4. Action & Adventure Blockbusters */}
          {actionMovies.length > 0 && (
            <MovieCarousel
              title="Action & Adrenaline"
              subtitle="High-octane blockbusters in 4K Dolby Atmos"
              badgeText="ACTION"
              movies={actionMovies}
            />
          )}

          {/* 5. Sci-Fi & Cosmic Horizons */}
          {sciFiMovies.length > 0 && (
            <MovieCarousel
              title="Sci-Fi & Cosmic Horizons"
              subtitle="Mind-bending cinematic experiences"
              badgeText="SCI-FI"
              movies={sciFiMovies}
            />
          )}
        </div>
      )}
    </div>
  );
};

export default HomePage;
