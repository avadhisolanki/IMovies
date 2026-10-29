import React, { useRef } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import MovieCard from './MovieCard';

const MovieCarousel = ({ title, subtitle, movies = [], badgeText }) => {
  const scrollContainerRef = useRef(null);

  const scroll = (direction) => {
    if (scrollContainerRef.current) {
      const { scrollLeft, clientWidth } = scrollContainerRef.current;
      const scrollAmount = clientWidth * 0.75;
      scrollContainerRef.current.scrollTo({
        left: direction === 'left' ? scrollLeft - scrollAmount : scrollLeft + scrollAmount,
        behavior: 'smooth',
      });
    }
  };

  if (!movies || movies.length === 0) return null;

  return (
    <section className="relative my-8 group/carousel">
      {/* Row Header */}
      <div className="flex items-baseline justify-between mb-3 px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-2.5">
          <h2 className="text-lg sm:text-xl font-bold text-white tracking-tight flex items-center gap-2">
            {title}
            {badgeText && (
              <span className="text-[10px] font-bold uppercase tracking-wider bg-[#00a8e1]/15 text-[#00a8e1] px-2 py-0.5 rounded border border-[#00a8e1]/30">
                {badgeText}
              </span>
            )}
          </h2>
          {subtitle && (
            <span className="text-xs text-gray-400 hidden sm:inline-block">
              — {subtitle}
            </span>
          )}
        </div>
      </div>

      {/* Carousel Track with Smooth Left/Right Arrow Overlays */}
      <div className="relative">
        {/* Left Arrow */}
        <button
          onClick={() => scroll('left')}
          className="absolute -left-2 top-1/2 -translate-y-1/2 z-20 w-10 h-24 bg-black/70 hover:bg-black/90 text-white flex items-center justify-center rounded-r-md opacity-0 group-hover/carousel:opacity-100 transition-all duration-300 backdrop-blur-sm border-r border-y border-gray-700 hover:text-[#00a8e1]"
          aria-label="Scroll left"
        >
          <ChevronLeft className="w-7 h-7" />
        </button>

        {/* Scrollable Container */}
        <div
          ref={scrollContainerRef}
          className="flex gap-4 overflow-x-auto no-scrollbar scroll-smooth px-4 sm:px-6 lg:px-8 py-2"
        >
          {movies.map((movie) => (
            <MovieCard key={movie._id} movie={movie} />
          ))}
        </div>

        {/* Right Arrow */}
        <button
          onClick={() => scroll('right')}
          className="absolute -right-2 top-1/2 -translate-y-1/2 z-20 w-10 h-24 bg-black/70 hover:bg-black/90 text-white flex items-center justify-center rounded-l-md opacity-0 group-hover/carousel:opacity-100 transition-all duration-300 backdrop-blur-sm border-l border-y border-gray-700 hover:text-[#00a8e1]"
          aria-label="Scroll right"
        >
          <ChevronRight className="w-7 h-7" />
        </button>
      </div>
    </section>
  );
};

export default MovieCarousel;
