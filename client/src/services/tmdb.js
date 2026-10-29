import axios from 'axios';
import api from './api.js';

const env = (typeof import.meta !== 'undefined' && import.meta.env) ? import.meta.env : (typeof process !== 'undefined' ? process.env : {});

const DEFAULT_API_KEY = '4e44d9029b1270a757cddc766a1bcb63';
const TMDB_BASE_URL = env.VITE_TMDB_BASE_URL || 'https://api.themoviedb.org/3';
export const TMDB_IMAGE_BASE = env.VITE_TMDB_IMAGE_BASE || 'https://image.tmdb.org/t/p';

// TMDB Standard Genre Map
export const TMDB_GENRES = [
  { id: 28, name: 'Action' },
  { id: 12, name: 'Adventure' },
  { id: 16, name: 'Animation' },
  { id: 35, name: 'Comedy' },
  { id: 80, name: 'Crime' },
  { id: 99, name: 'Documentary' },
  { id: 18, name: 'Drama' },
  { id: 10751, name: 'Family' },
  { id: 14, name: 'Fantasy' },
  { id: 36, name: 'History' },
  { id: 27, name: 'Horror' },
  { id: 10402, name: 'Music' },
  { id: 9648, name: 'Mystery' },
  { id: 10749, name: 'Romance' },
  { id: 878, name: 'Sci-Fi' },
  { id: 53, name: 'Thriller' },
  { id: 10752, name: 'War' },
  { id: 37, name: 'Western' },
];

const genreMap = TMDB_GENRES.reduce((acc, g) => {
  acc[g.id] = g.name;
  return acc;
}, {});

// Retrieve active API key (Environment or localStorage or default)
export const getTMDBApiKey = () => {
  if (typeof localStorage !== 'undefined') {
    const localKey = localStorage.getItem('imovies_tmdb_key');
    if (localKey && localKey.trim()) return localKey.trim();
  }
  const envKey = env.VITE_TMDB_API_KEY;
  if (envKey && envKey.trim()) return envKey.trim();
  return DEFAULT_API_KEY;
};

// Set custom API key
export const setTMDBApiKey = (key) => {
  if (typeof localStorage !== 'undefined') {
    if (key) {
      localStorage.setItem('imovies_tmdb_key', key.trim());
    } else {
      localStorage.removeItem('imovies_tmdb_key');
    }
  }
};

// Helper to construct image URLs
export const getPosterUrl = (posterPath, size = 'w500') => {
  if (!posterPath) {
    return 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=600&auto=format&fit=crop&q=80';
  }
  if (posterPath.startsWith('http')) return posterPath;
  return `${TMDB_IMAGE_BASE}/${size}${posterPath}`;
};

export const getBackdropUrl = (backdropPath, size = 'original') => {
  if (!backdropPath) {
    return 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=1600&auto=format&fit=crop&q=80';
  }
  if (backdropPath.startsWith('http')) return backdropPath;
  return `${TMDB_IMAGE_BASE}/${size}${backdropPath}`;
};

export const getProfileUrl = (profilePath, size = 'w185') => {
  if (!profilePath) {
    return 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300&auto=format&fit=crop&q=80';
  }
  if (profilePath.startsWith('http')) return profilePath;
  return `${TMDB_IMAGE_BASE}/${size}${profilePath}`;
};

// Extract best YouTube trailer from TMDB videos array
export const extractTrailerUrl = (videos) => {
  if (!videos || !videos.results || videos.results.length === 0) return '';
  const trailer =
    videos.results.find(
      (v) => v.site === 'YouTube' && (v.type === 'Trailer' || v.type === 'Teaser') && v.official
    ) ||
    videos.results.find((v) => v.site === 'YouTube' && v.type === 'Trailer') ||
    videos.results.find((v) => v.site === 'YouTube');

  return trailer ? `https://www.youtube.com/watch?v=${trailer.key}` : '';
};

// Normalize TMDB raw movie or local movie into unified iMovies model
export const normalizeMovie = (item) => {
  if (!item) return null;

  const id = item.id || item._id;
  const title = item.title || item.movieName || item.name || 'Untitled Feature';
  const overview = item.overview || item.description || 'No overview summary available.';
  const rating = Number(item.vote_average ?? item.rating ?? 8.0);
  const releaseDate = item.release_date || item.releaseDate || '2024-01-01';
  const runtime = item.runtime || (item.duration ? parseInt(item.duration, 10) : 120);

  // Genres resolution
  let genres = [];
  if (Array.isArray(item.genres) && item.genres.length > 0) {
    genres = item.genres.map((g) => (typeof g === 'string' ? g : g.name));
  } else if (Array.isArray(item.genre_ids) && item.genre_ids.length > 0) {
    genres = item.genre_ids.map((gid) => genreMap[gid] || 'Cinema').filter(Boolean);
  } else {
    genres = ['Drama', 'Action'];
  }

  // Cast resolution
  let cast = [];
  if (item.credits && Array.isArray(item.credits.cast)) {
    cast = item.credits.cast.slice(0, 8).map((c) => ({
      name: c.name,
      character: c.character || 'Lead Role',
      profileUrl: c.profile_path ? getProfileUrl(c.profile_path, 'w185') : null,
    }));
  } else if (Array.isArray(item.cast)) {
    cast = item.cast.map((c) =>
      typeof c === 'string'
        ? { name: c, character: 'Starring', profileUrl: null }
        : {
            name: c.name || 'Actor',
            character: c.character || 'Cast',
            profileUrl: c.profileUrl ? getProfileUrl(c.profileUrl, 'w185') : null,
          }
    );
  }

  // Certification
  let certification = item.certification || 'U/A 13+';
  if (item.adult) certification = 'A 18+';

  return {
    _id: String(id),
    id: id,
    movieName: title,
    title: title,
    description: overview,
    overview: overview,
    genres: genres,
    releaseDate: releaseDate,
    release_date: releaseDate,
    language: (item.original_language || item.language || 'English').toUpperCase(),
    duration: runtime ? `${runtime} min` : '120 min',
    runtime: runtime,
    certification: certification,
    posterUrl: getPosterUrl(item.poster_path || item.posterUrl),
    backdropUrl: getBackdropUrl(item.backdrop_path || item.backdropUrl),
    poster_path: item.poster_path,
    backdrop_path: item.backdrop_path,
    rating: Number(rating.toFixed(1)),
    vote_average: Number(rating.toFixed(1)),
    vote_count: item.vote_count || 1250,
    cast: cast,
    trailerUrl: extractTrailerUrl(item.videos) || item.trailerUrl || '',
    featured: Boolean(item.featured || rating >= 8.2),
    source: item.poster_path ? 'tmdb' : 'local',
  };
};

// Create TMDB axios client
const tmdbClient = axios.create({
  baseURL: TMDB_BASE_URL,
  timeout: 8000,
});

// 1. Fetch Trending Movies (week)
export const fetchTrendingMovies = async (timeWindow = 'week') => {
  try {
    const key = getTMDBApiKey();
    const res = await tmdbClient.get(`/trending/movie/${timeWindow}`, {
      params: { api_key: key },
    });
    if (res.data && res.data.results) {
      return res.data.results.map(normalizeMovie);
    }
    return [];
  } catch (err) {
    console.warn('[TMDB Service] Trending fetch failed, falling back to local catalog:', err.message);
    return fetchFallbackMovies();
  }
};

// 2. Fetch Now Showing in Theatres
export const fetchNowPlaying = async (page = 1, language = 'en-US') => {
  try {
    const key = getTMDBApiKey();
    const res = await tmdbClient.get('/movie/now_playing', {
      params: {
        api_key: key,
        language,
        page,
      },
    });
    if (res.data && res.data.results) {
      return res.data.results.map(normalizeMovie);
    }
    return [];
  } catch (err) {
    console.warn('[TMDB Service] Now Playing fetch failed, falling back to local catalog:', err.message);
    return fetchFallbackMovies();
  }
};

// 3. Fetch Movie Details & Cast & Videos
export const fetchMovieDetails = async (movieId) => {
  try {
    // If it's a numeric TMDB ID
    const key = getTMDBApiKey();
    if (movieId && /^\d+$/.test(String(movieId))) {
      const res = await tmdbClient.get(`/movie/${movieId}`, {
        params: {
          api_key: key,
          append_to_response: 'credits,videos',
        },
      });
      if (res.data) {
        return normalizeMovie(res.data);
      }
    }

    // Try fetching from local database
    const localRes = await api.get(`/movie/${movieId}`);
    if (localRes.data && localRes.data.movie) {
      return normalizeMovie(localRes.data.movie);
    }

    throw new Error('Movie not found');
  } catch (err) {
    console.warn(`[TMDB Service] Failed to fetch movie ${movieId}, attempting fallback:`, err.message);
    // Fallback: search in local database
    try {
      const localMovies = await fetchFallbackMovies();
      const match = localMovies.find(
        (m) => String(m._id) === String(movieId) || String(m.id) === String(movieId)
      );
      if (match) return match;
      return localMovies[0] || null;
    } catch {
      return null;
    }
  }
};

// 4. Search Movies
export const searchMovies = async (query, page = 1) => {
  if (!query || !query.trim()) return [];
  try {
    const key = getTMDBApiKey();
    const res = await tmdbClient.get('/search/movie', {
      params: {
        api_key: key,
        query: query.trim(),
        page,
      },
    });
    if (res.data && res.data.results) {
      return res.data.results.map(normalizeMovie);
    }
    return [];
  } catch (err) {
    console.warn('[TMDB Service] Search failed, searching local movies:', err.message);
    try {
      const local = await api.get(`/movie?search=${encodeURIComponent(query)}`);
      return (local.data?.movies || []).map(normalizeMovie);
    } catch {
      return [];
    }
  }
};

// 5. Discover / Filter by Genre, Language, Year, Sort
export const discoverMovies = async ({
  genreId,
  language,
  year,
  sortBy = 'popularity.desc',
  page = 1,
} = {}) => {
  try {
    const key = getTMDBApiKey();
    const params = {
      api_key: key,
      page,
      sort_by: sortBy,
    };

    if (genreId && genreId !== 'All') {
      params.with_genres = genreId;
    }
    if (language && language !== 'All') {
      params.with_original_language = language.toLowerCase();
    }
    if (year && year !== 'All') {
      params.primary_release_year = year;
    }

    const res = await tmdbClient.get('/discover/movie', { params });
    if (res.data && res.data.results) {
      return res.data.results.map(normalizeMovie);
    }
    return [];
  } catch (err) {
    console.warn('[TMDB Service] Discover failed, falling back:', err.message);
    return fetchFallbackMovies();
  }
};

// 6. Fetch Genres List from TMDB
export const fetchGenres = async () => {
  try {
    const key = getTMDBApiKey();
    const res = await tmdbClient.get('/genre/movie/list', {
      params: { api_key: key, language: 'en-US' },
    });
    return res.data?.genres || TMDB_GENRES;
  } catch {
    return TMDB_GENRES;
  }
};

// Fallback helper to fetch from local REST API
export const fetchFallbackMovies = async () => {
  try {
    const res = await api.get('/movie');
    if (res.data && res.data.movies) {
      return res.data.movies.map(normalizeMovie);
    }
  } catch (e) {
    console.error('[TMDB Service] Fallback fetch failed:', e.message);
  }
  return [];
};
