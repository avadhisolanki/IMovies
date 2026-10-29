import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import {
  Film,
  Search,
  Bookmark,
  Ticket,
  User as UserIcon,
  LogOut,
  Shield,
  Menu,
  X,
  MapPin,
  ChevronDown,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import { searchMovies } from '../services/tmdb';
import TMDBConfigModal from './TMDBConfigModal';

const Navbar = () => {
  const { user, isAuthenticated, isAdmin, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [selectedCity, setSelectedCity] = useState('Mumbai');
  const [showCityMenu, setShowCityMenu] = useState(false);
  const [showTMDBModal, setShowTMDBModal] = useState(false);

  const searchRef = useRef(null);
  const userMenuRef = useRef(null);

  const cities = ['Mumbai', 'Delhi NCR', 'Bengaluru', 'Hyderabad', 'Chennai', 'Kolkata'];

  // Handle live search using TMDB API with local fallback
  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      setIsSearching(false);
      return;
    }

    const timer = setTimeout(async () => {
      try {
        setIsSearching(true);
        const results = await searchMovies(searchQuery);
        setSearchResults(results.slice(0, 6));
      } catch (err) {
        console.error('Search error:', err);
      } finally {
        setIsSearching(false);
      }
    }, 250);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Click outside listener for dropdowns
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (searchRef.current && !searchRef.current.contains(e.target)) {
        setSearchResults([]);
      }
      if (userMenuRef.current && !userMenuRef.current.contains(e.target)) {
        setShowUserMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelectMovie = (movieId) => {
    setSearchQuery('');
    setSearchResults([]);
    navigate(`/moviedetails/${movieId}`);
  };

  const handleLogout = () => {
    logout();
    setShowUserMenu(false);
    navigate('/landing');
  };

  const isActive = (path) => location.pathname === path;

  return (
    <header className="sticky top-0 z-50 bg-[#0f171e]/95 backdrop-blur-md border-b border-[#253241] transition-all">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-4">
          
          {/* Logo & Prime Badge */}
          <div className="flex items-center gap-6">
            <Link to={isAuthenticated ? '/home' : '/landing'} className="flex items-center gap-2 group">
              <div className="w-9 h-9 rounded-lg bg-gradient-to-tr from-[#00a8e1] to-[#00d0ff] flex items-center justify-center text-white shadow-prime-glow">
                <Film className="w-5 h-5 text-black font-black" />
              </div>
              <div className="flex flex-col">
                <span className="text-xl font-extrabold tracking-tight text-white flex items-center">
                  iMovies
                  <span className="ml-1 text-[10px] font-bold tracking-widest uppercase bg-[#00a8e1]/20 text-[#00a8e1] px-1.5 py-0.5 rounded border border-[#00a8e1]/40">
                    PRIME
                  </span>
                </span>
                <span className="text-[10px] tracking-wider text-gray-400 font-medium -mt-1">
                  Cinema Booking
                </span>
              </div>
            </Link>

            {/* Desktop Navigation Links */}
            {isAuthenticated && (
              <nav className="hidden md:flex items-center space-x-1 lg:space-x-3 text-sm font-medium">
                <Link
                  to="/home"
                  className={`px-3 py-2 rounded-md transition-colors ${
                    isActive('/home')
                      ? 'text-white bg-[#1a242f] font-semibold border-b-2 border-[#00a8e1]'
                      : 'text-gray-300 hover:text-white hover:bg-[#1a242f]/60'
                  }`}
                >
                  Home
                </Link>
                <Link
                  to="/watchlist"
                  className={`px-3 py-2 rounded-md transition-colors flex items-center gap-1.5 ${
                    isActive('/watchlist')
                      ? 'text-white bg-[#1a242f] font-semibold border-b-2 border-[#00a8e1]'
                      : 'text-gray-300 hover:text-white hover:bg-[#1a242f]/60'
                  }`}
                >
                  <Bookmark className="w-4 h-4 text-[#00a8e1]" />
                  Watchlist
                </Link>
                <Link
                  to="/bookings"
                  className={`px-3 py-2 rounded-md transition-colors flex items-center gap-1.5 ${
                    isActive('/bookings')
                      ? 'text-white bg-[#1a242f] font-semibold border-b-2 border-[#00a8e1]'
                      : 'text-gray-300 hover:text-white hover:bg-[#1a242f]/60'
                  }`}
                >
                  <Ticket className="w-4 h-4 text-[#00a8e1]" />
                  My Bookings
                </Link>
                {isAdmin && (
                  <Link
                    to="/admin"
                    className={`px-3 py-2 rounded-md transition-colors flex items-center gap-1.5 text-amber-400 hover:text-amber-300 ${
                      isActive('/admin')
                        ? 'bg-amber-500/10 border-b-2 border-amber-400 font-semibold'
                        : 'hover:bg-amber-500/10'
                    }`}
                  >
                    <Shield className="w-4 h-4" />
                    Admin Portal
                  </Link>
                )}
              </nav>
            )}
          </div>

          {/* Center Search Bar */}
          {isAuthenticated && (
            <div ref={searchRef} className="relative flex-1 max-w-md hidden sm:block">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search movies, genres, or stars..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-[#1a242f] text-white text-sm pl-10 pr-4 py-2 rounded-md border border-[#2c3b4d] focus:outline-none focus:border-[#00a8e1] focus:ring-1 focus:ring-[#00a8e1] placeholder-gray-400 transition"
                />
                <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-2.5 pointer-events-none" />
                {isSearching && (
                  <div className="absolute right-3 top-2.5 w-4 h-4 border-2 border-[#00a8e1] border-t-transparent rounded-full animate-spin"></div>
                )}
              </div>

              {/* Search dropdown results */}
              {searchResults.length > 0 && (
                <div className="absolute top-full left-0 right-0 mt-1.5 bg-[#1a242f] border border-[#2c3b4d] rounded-lg shadow-2xl overflow-hidden z-50 divide-y divide-[#253241]">
                  {searchResults.map((movie) => (
                    <div
                      key={movie._id}
                      onClick={() => handleSelectMovie(movie._id)}
                      className="flex items-center gap-3 p-2.5 hover:bg-[#253241] cursor-pointer transition"
                    >
                      <img
                        src={movie.posterUrl}
                        alt={movie.movieName}
                        className="w-10 h-14 object-cover rounded shadow"
                      />
                      <div className="flex-1 min-w-0">
                        <h4 className="text-sm font-semibold text-white truncate">{movie.movieName}</h4>
                        <p className="text-xs text-gray-400 truncate">
                          {movie.genres?.join(', ')} • {movie.language}
                        </p>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="text-[11px] font-bold text-amber-400 bg-amber-400/10 px-1.5 py-0.2 rounded">
                            ★ {movie.rating}
                          </span>
                          <span className="text-[11px] text-gray-400">{movie.duration}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Right Header: Location + Profile / Auth */}
          <div className="flex items-center gap-2.5">
            
            {/* TMDB v3 API Status Pill */}
            <button
              onClick={() => setShowTMDBModal(true)}
              className="flex items-center gap-1.5 text-xs text-gray-300 hover:text-white bg-[#1a242f] hover:bg-[#253241] px-2.5 py-1.5 rounded-md border border-[#2c3b4d] hover:border-[#01b4e4] transition group shadow-sm"
              title="TMDB API v3 Integration Settings"
            >
              <span className="w-2 h-2 rounded-full bg-[#01b4e4] animate-pulse"></span>
              <span className="font-black text-[#01b4e4] text-[11px] tracking-wide">TMDB</span>
              <span className="text-[10px] text-gray-400 font-semibold group-hover:text-gray-300">v3 Live</span>
            </button>

            {/* City Selector */}
            <div className="relative hidden lg:block">
              <button
                onClick={() => setShowCityMenu(!showCityMenu)}
                className="flex items-center gap-1.5 text-xs text-gray-300 hover:text-white bg-[#1a242f] px-3 py-1.5 rounded-md border border-[#2c3b4d]"
              >
                <MapPin className="w-3.5 h-3.5 text-[#00a8e1]" />
                <span>{selectedCity}</span>
                <ChevronDown className="w-3 h-3 text-gray-400" />
              </button>

              {showCityMenu && (
                <div className="absolute right-0 mt-1 w-36 bg-[#1a242f] border border-[#2c3b4d] rounded-md shadow-xl py-1 z-50">
                  {cities.map((city) => (
                    <button
                      key={city}
                      onClick={() => {
                        setSelectedCity(city);
                        setShowCityMenu(false);
                      }}
                      className={`w-full text-left px-3 py-1.5 text-xs ${
                        selectedCity === city
                          ? 'text-[#00a8e1] font-semibold bg-[#253241]'
                          : 'text-gray-300 hover:bg-[#253241] hover:text-white'
                      }`}
                    >
                      {city}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {isAuthenticated ? (
              <div ref={userMenuRef} className="relative">
                <button
                  onClick={() => setShowUserMenu(!showUserMenu)}
                  className="flex items-center gap-2 p-1.5 rounded-lg hover:bg-[#1a242f] transition text-left"
                >
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#00a8e1] to-[#005577] flex items-center justify-center text-white font-bold text-xs ring-2 ring-[#00a8e1]/50 shadow">
                    {user?.username ? user.username.charAt(0).toUpperCase() : 'U'}
                  </div>
                  <div className="hidden xl:flex flex-col">
                    <span className="text-xs font-semibold text-white leading-tight">
                      {user?.username || 'Prime Member'}
                    </span>
                    <span className="text-[10px] text-[#00a8e1] font-medium leading-tight capitalize">
                      {user?.role === 'admin' ? 'Cinema Admin' : 'Prime Member'}
                    </span>
                  </div>
                  <ChevronDown className="w-3.5 h-3.5 text-gray-400 hidden xl:block" />
                </button>

                {/* Dropdown Menu */}
                {showUserMenu && (
                  <div className="absolute right-0 mt-2 w-56 bg-[#1a242f] border border-[#2c3b4d] rounded-lg shadow-2xl py-2 z-50 divide-y divide-[#253241]">
                    <div className="px-4 py-2.5">
                      <p className="text-xs text-gray-400">Signed in as</p>
                      <p className="text-sm font-bold text-white truncate">{user?.username}</p>
                      <p className="text-xs text-gray-400 truncate">{user?.email}</p>
                    </div>

                    <div className="py-1">
                      <Link
                        to="/watchlist"
                        onClick={() => setShowUserMenu(false)}
                        className="flex items-center gap-2.5 px-4 py-2 text-sm text-gray-300 hover:text-white hover:bg-[#253241]"
                      >
                        <Bookmark className="w-4 h-4 text-[#00a8e1]" />
                        Watchlist
                      </Link>
                      <Link
                        to="/bookings"
                        onClick={() => setShowUserMenu(false)}
                        className="flex items-center gap-2.5 px-4 py-2 text-sm text-gray-300 hover:text-white hover:bg-[#253241]"
                      >
                        <Ticket className="w-4 h-4 text-[#00a8e1]" />
                        My Bookings & Tickets
                      </Link>
                      {isAdmin && (
                        <Link
                          to="/admin"
                          onClick={() => setShowUserMenu(false)}
                          className="flex items-center gap-2.5 px-4 py-2 text-sm text-amber-400 hover:text-amber-300 hover:bg-[#253241]"
                        >
                          <Shield className="w-4 h-4 text-amber-400" />
                          Admin Console
                        </Link>
                      )}
                    </div>

                    <div className="py-1">
                      <button
                        onClick={handleLogout}
                        className="w-full flex items-center gap-2.5 px-4 py-2 text-sm text-red-400 hover:text-red-300 hover:bg-[#253241] text-left"
                      >
                        <LogOut className="w-4 h-4" />
                        Sign Out
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Link
                  to="/login"
                  className="text-xs font-semibold text-gray-200 hover:text-white px-3 py-1.5 rounded-md hover:bg-[#1a242f] transition"
                >
                  Sign In
                </Link>
                <Link
                  to="/register"
                  className="text-xs font-bold bg-[#00a8e1] hover:bg-[#0082b3] text-black px-4 py-1.5 rounded-md transition shadow-prime-glow"
                >
                  Join Prime Cinema
                </Link>
              </div>
            )}

            {/* Mobile menu button */}
            {isAuthenticated && (
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="md:hidden p-2 rounded-md text-gray-400 hover:text-white hover:bg-[#1a242f]"
              >
                {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && isAuthenticated && (
        <div className="md:hidden bg-[#0f171e] border-b border-[#253241] px-4 pt-2 pb-4 space-y-2">
          {/* Mobile Search */}
          <div className="relative mb-3">
            <input
              type="text"
              placeholder="Search movies..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-[#1a242f] text-white text-sm pl-9 pr-4 py-2 rounded border border-[#2c3b4d] focus:outline-none focus:border-[#00a8e1]"
            />
            <Search className="w-4 h-4 text-gray-400 absolute left-3 top-2.5" />
          </div>

          <Link
            to="/home"
            onClick={() => setMobileMenuOpen(false)}
            className="block px-3 py-2 rounded text-base font-medium text-gray-200 hover:bg-[#1a242f]"
          >
            Home
          </Link>
          <Link
            to="/watchlist"
            onClick={() => setMobileMenuOpen(false)}
            className="block px-3 py-2 rounded text-base font-medium text-gray-200 hover:bg-[#1a242f]"
          >
            Watchlist
          </Link>
          <Link
            to="/bookings"
            onClick={() => setMobileMenuOpen(false)}
            className="block px-3 py-2 rounded text-base font-medium text-gray-200 hover:bg-[#1a242f]"
          >
            My Bookings
          </Link>
          {isAdmin && (
            <Link
              to="/admin"
              onClick={() => setMobileMenuOpen(false)}
              className="block px-3 py-2 rounded text-base font-medium text-amber-400 hover:bg-[#1a242f]"
            >
              Admin Dashboard
            </Link>
          )}
          <button
            onClick={handleLogout}
            className="w-full text-left px-3 py-2 rounded text-base font-medium text-red-400 hover:bg-[#1a242f]"
          >
            Sign Out
          </button>
        </div>
      )}

      {/* TMDB v3 API Configuration Modal */}
      <TMDBConfigModal
        isOpen={showTMDBModal}
        onClose={() => setShowTMDBModal(false)}
        onKeyUpdated={() => {
          window.location.reload();
        }}
      />
    </header>
  );
};

export default Navbar;
