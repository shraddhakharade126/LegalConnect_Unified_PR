import React, { useState, useEffect } from 'react';
import { api } from '../api/index.ts';
import { Lawyer, LegalDomain } from '../types/index.ts';
import { LawyerCard } from '../components/LawyerCard.tsx';
import { BookingModal } from '../components/BookingModal.tsx';
import {
  Search,
  Filter,
  SlidersHorizontal,
  X,
  RotateCcw,
  ShieldCheck,
  MapPin,
  History,
  Clock,
  Sparkles,
} from 'lucide-react';

const RECENT_SEARCHES_KEY = 'legalconnect_recent_searches';
const MAX_RECENT_SEARCHES = 6;

const POPULAR_SEARCH_SUGGESTIONS = [
  'Corporate & Commercial',
  'Intellectual Property',
  'Criminal Defense',
  'Family & Matrimonial',
  'Cyber Law',
];

interface LawyerDirectoryPageProps {
  navigate: (path: string) => void;
  initialParams?: URLSearchParams;
}

export const LawyerDirectoryPage: React.FC<LawyerDirectoryPageProps> = ({
  navigate,
  initialParams,
}) => {
  const [lawyers, setLawyers] = useState<Lawyer[]>([]);
  const [categories, setCategories] = useState<LegalDomain[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [selectedLawyer, setSelectedLawyer] = useState<Lawyer | null>(null);
  const [isBookingOpen, setIsBookingOpen] = useState<boolean>(false);
  const [filterDrawerOpen, setFilterDrawerOpen] = useState<boolean>(false);

  // Filter states
  const [search, setSearch] = useState<string>(initialParams?.get('search') || '');
  const [domain, setDomain] = useState<string>(initialParams?.get('domain') || '');
  const [city, setCity] = useState<string>(initialParams?.get('city') || '');
  const [minExp, setMinExp] = useState<string>('');
  const [maxFee, setMaxFee] = useState<number>(300);
  const [minRating, setMinRating] = useState<string>('');
  const [sort, setSort] = useState<string>('rating');

  // Recent searches state persisted to localStorage
  const [recentSearches, setRecentSearches] = useState<string[]>(() => {
    try {
      const stored = localStorage.getItem(RECENT_SEARCHES_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) return parsed.slice(0, MAX_RECENT_SEARCHES);
      }
    } catch (_err) {
      // Graceful fallback if localStorage is disabled
    }
    return [];
  });

  const saveSearchQuery = (query: string) => {
    const trimmed = query.trim();
    if (!trimmed) return;
    setRecentSearches((prev) => {
      const filtered = prev.filter((item) => item.toLowerCase() !== trimmed.toLowerCase());
      const updated = [trimmed, ...filtered].slice(0, MAX_RECENT_SEARCHES);
      try {
        localStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(updated));
      } catch (_err) {
        // Ignore storage exceptions
      }
      return updated;
    });
  };

  const removeRecentSearch = (queryToRemove: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setRecentSearches((prev) => {
      const updated = prev.filter((item) => item.toLowerCase() !== queryToRemove.toLowerCase());
      try {
        localStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(updated));
      } catch (_err) {
        // Ignore storage exceptions
      }
      return updated;
    });
  };

  const clearAllRecentSearches = () => {
    setRecentSearches([]);
    try {
      localStorage.removeItem(RECENT_SEARCHES_KEY);
    } catch (_err) {
      // Ignore storage exceptions
    }
  };

  useEffect(() => {
    api.getCategories().then((res) => setCategories(res.domains || []));
  }, []);

  const loadLawyers = async (customSearch?: string) => {
    setLoading(true);
    const effectiveSearch = customSearch !== undefined ? customSearch : search;
    try {
      const res = await api.getLawyers({
        search: effectiveSearch.trim() || undefined,
        domain: domain || undefined,
        city: city || undefined,
        minExp: minExp ? Number(minExp) : undefined,
        maxFee: maxFee ? Number(maxFee) : undefined,
        minRating: minRating ? Number(minRating) : undefined,
        sort,
      });
      setLawyers(res.lawyers || []);
    } catch (err) {
      console.error('Error fetching lawyers:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLawyers();
  }, [domain, minExp, maxFee, minRating, sort]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (search.trim()) {
      saveSearchQuery(search.trim());
    }
    loadLawyers();
  };

  const handleSelectRecentSearch = (query: string) => {
    setSearch(query);
    saveSearchQuery(query);
    loadLawyers(query);
  };

  const handleResetFilters = () => {
    setSearch('');
    setDomain('');
    setCity('');
    setMinExp('');
    setMaxFee(300);
    setMinRating('');
    setSort('rating');
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-6 transition-colors">
        <div>
          <h1 className="text-2xl sm:text-3xl font-serif font-bold text-slate-900 dark:text-white">
            Verified Advocate Directory
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            Browse verified counsel across jurisdictions with transparent upfront consultation fees
          </p>
        </div>

        {/* Sort & Mobile Filter Toggle */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => setFilterDrawerOpen(!filterDrawerOpen)}
            className="md:hidden px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-200 flex items-center gap-1.5 bg-white dark:bg-slate-800"
          >
            <SlidersHorizontal className="w-4 h-4" /> Filters
          </button>

          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-500 dark:text-slate-400 hidden sm:inline">Sort by:</span>
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value)}
              className="text-xs font-medium p-2 border border-slate-300 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 outline-none"
            >
              <option value="rating">Highest Rated</option>
              <option value="fee_asc">Consultation Fee: Low to High</option>
              <option value="fee_desc">Consultation Fee: High to Low</option>
              <option value="exp_desc">Court Experience: Most Senior</option>
              <option value="reviews">Most Reviewed</option>
            </select>
          </div>
        </div>
      </div>

      {/* Search Header Bar with Recent Searches */}
      <div className="space-y-2.5">
        <form onSubmit={handleSearchSubmit} className="flex gap-2">
          <div className="flex-1 relative">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by lawyer name, law firm, practice area, court admission, or bar registration number..."
              className="w-full text-xs sm:text-sm pl-10 pr-10 py-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:ring-2 focus:ring-amber-500 outline-none shadow-sm transition-colors"
            />
            <Search className="w-4 h-4 text-slate-400 dark:text-slate-500 absolute left-3.5 top-3.5 pointer-events-none" />
            {search && (
              <button
                type="button"
                onClick={() => {
                  setSearch('');
                  loadLawyers('');
                }}
                className="absolute right-3.5 top-3.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors cursor-pointer"
                title="Clear search"
                aria-label="Clear search input"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
          <button
            type="submit"
            className="px-6 py-3 bg-slate-900 hover:bg-slate-800 dark:bg-amber-500 dark:hover:bg-amber-400 text-amber-400 dark:text-slate-950 text-xs sm:text-sm font-bold rounded-xl shadow-md transition-colors shrink-0 cursor-pointer"
          >
            Search
          </button>
        </form>

        {/* Recent Searches / Suggested Queries Row */}
        <div className="flex flex-wrap items-center justify-between gap-2 px-1 text-xs">
          {recentSearches.length > 0 ? (
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider flex items-center gap-1">
                <History className="w-3.5 h-3.5 text-amber-500" /> Recent Searches:
              </span>
              <div className="flex flex-wrap items-center gap-1.5">
                {recentSearches.map((item) => (
                  <span
                    key={item}
                    className={`inline-flex items-center gap-1.5 pl-2.5 pr-1.5 py-1 rounded-lg text-xs font-medium transition-all group ${
                      search.toLowerCase() === item.toLowerCase()
                        ? 'bg-amber-100 dark:bg-amber-950/70 text-amber-900 dark:text-amber-200 border border-amber-300 dark:border-amber-700/80 shadow-xs'
                        : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 hover:border-amber-400 dark:hover:border-amber-500/60 hover:bg-slate-50 dark:hover:bg-slate-750 shadow-xs'
                    }`}
                  >
                    <button
                      type="button"
                      onClick={() => handleSelectRecentSearch(item)}
                      className="cursor-pointer hover:text-amber-600 dark:hover:text-amber-400 focus:outline-none"
                      title={`Search for "${item}"`}
                    >
                      {item}
                    </button>
                    <button
                      type="button"
                      onClick={(e) => removeRecentSearch(item, e)}
                      className="p-0.5 rounded-full hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors cursor-pointer"
                      title={`Remove "${item}" from recent searches`}
                      aria-label={`Remove "${item}"`}
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}

                <button
                  type="button"
                  onClick={clearAllRecentSearches}
                  className="text-[11px] text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 ml-1 font-medium transition-colors cursor-pointer"
                  title="Clear search history"
                >
                  Clear history
                </button>
              </div>
            </div>
          ) : (
            <div className="flex flex-wrap items-center gap-2 text-slate-500 dark:text-slate-400">
              <span className="text-[11px] font-semibold uppercase tracking-wider flex items-center gap-1 text-slate-400 dark:text-slate-500">
                <Sparkles className="w-3.5 h-3.5 text-amber-500/80" /> Popular Practice Areas:
              </span>
              <div className="flex flex-wrap items-center gap-1.5">
                {POPULAR_SEARCH_SUGGESTIONS.map((item) => (
                  <button
                    key={item}
                    type="button"
                    onClick={() => handleSelectRecentSearch(item)}
                    className="px-2.5 py-1 rounded-lg text-xs font-medium bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:border-amber-400 dark:hover:border-amber-500/60 hover:text-amber-600 dark:hover:text-amber-400 transition-all cursor-pointer shadow-xs"
                  >
                    {item}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Grid: Filters Sidebar + Lawyers Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 items-start">
        {/* Desktop Filters Sidebar */}
        <aside
          className={`md:block bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-6 transition-colors ${
            filterDrawerOpen ? 'block' : 'hidden'
          }`}
        >
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
            <span className="font-bold text-xs uppercase tracking-wider text-slate-900 dark:text-white flex items-center gap-1.5">
              <Filter className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" /> Filter Advocates
            </span>
            <button
              type="button"
              onClick={handleResetFilters}
              className="text-[11px] text-amber-700 dark:text-amber-400 hover:text-amber-800 dark:hover:text-amber-300 flex items-center gap-1 font-medium cursor-pointer"
            >
              <RotateCcw className="w-3 h-3" /> Reset
            </button>
          </div>

          {/* Practice Area / Domain */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">
              Practice Area
            </label>
            <select
              value={domain}
              onChange={(e) => setDomain(e.target.value)}
              className="w-full text-xs p-2.5 border border-slate-300 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 outline-none"
            >
              <option value="">All Practice Areas</option>
              {categories.map((c) => (
                <option key={c._id} value={c.name}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          {/* Jurisdiction / City */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">
              City / State
            </label>
            <div className="relative">
              <input
                type="text"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                onBlur={() => loadLawyers()}
                placeholder="E.g., New York, CA, Chicago"
                className="w-full text-xs p-2.5 pl-8 border border-slate-300 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 outline-none"
              />
              <MapPin className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-3 pointer-events-none" />
            </div>
          </div>

          {/* Experience */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">
              Minimum Court Experience
            </label>
            <div className="space-y-1.5 text-xs text-slate-700 dark:text-slate-300">
              {[
                { label: 'Any experience', value: '' },
                { label: '5+ years experience', value: '5' },
                { label: '10+ years senior counsel', value: '10' },
                { label: '15+ years veteran advocate', value: '15' },
              ].map((opt) => (
                <label key={opt.value} className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="minExp"
                    checked={minExp === opt.value}
                    onChange={() => setMinExp(opt.value)}
                    className="text-amber-600 focus:ring-amber-500"
                  />
                  <span>{opt.label}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Max Consultation Fee */}
          <div>
            <div className="flex items-center justify-between text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">
              <span>Max Fee</span>
              <span className="text-amber-700 dark:text-amber-400 font-bold">${maxFee} / session</span>
            </div>
            <input
              type="range"
              min="50"
              max="350"
              step="10"
              value={maxFee}
              onChange={(e) => setMaxFee(Number(e.target.value))}
              className="w-full accent-amber-500 cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-slate-400 mt-1">
              <span>$50</span>
              <span>$200</span>
              <span>$350+</span>
            </div>
          </div>

          {/* Minimum Rating */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">
              Client Rating
            </label>
            <div className="space-y-1.5 text-xs text-slate-700 dark:text-slate-300">
              {[
                { label: 'All ratings', value: '' },
                { label: '4.5+ Stars', value: '4.5' },
                { label: '4.8+ Stars (Top Rated)', value: '4.8' },
              ].map((opt) => (
                <label key={opt.value} className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="minRating"
                    checked={minRating === opt.value}
                    onChange={() => setMinRating(opt.value)}
                    className="text-amber-600 focus:ring-amber-500"
                  />
                  <span>{opt.label}</span>
                </label>
              ))}
            </div>
          </div>
        </aside>

        {/* Lawyer Cards Results */}
        <main className="md:col-span-3 space-y-4">
          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 px-1">
            <span>
              Showing <strong className="text-slate-900 dark:text-white">{lawyers.length}</strong> verified
              practitioners
            </span>
            <span className="text-emerald-700 dark:text-emerald-400 flex items-center gap-1 font-medium text-[11px]">
              <ShieldCheck className="w-3.5 h-3.5" /> All Advocates Independently Audited
            </span>
          </div>

          {loading ? (
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-12 text-center text-xs text-slate-500 dark:text-slate-400 flex flex-col items-center justify-center gap-3">
              <span className="w-6 h-6 border-2 border-amber-500 border-t-transparent rounded-full animate-spin" />
              <span>Filtering verified advocate registry...</span>
            </div>
          ) : lawyers.length === 0 ? (
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-12 text-center space-y-4">
              <div className="w-12 h-12 rounded-full bg-slate-100 dark:bg-slate-800 mx-auto flex items-center justify-center text-slate-400">
                <Search className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-bold text-slate-900 dark:text-white text-sm">No advocates matched your filters</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto mt-1">
                  Try adjusting your maximum fee threshold, practice area, or location to see more
                  verified counsel.
                </p>
              </div>
              <button
                type="button"
                onClick={handleResetFilters}
                className="px-4 py-2 bg-slate-900 dark:bg-amber-500 text-amber-400 dark:text-slate-950 text-xs font-semibold rounded-xl hover:bg-slate-800 dark:hover:bg-amber-400 cursor-pointer"
              >
                Reset All Filters
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
              {lawyers.map((lawyer) => (
                <LawyerCard
                  key={lawyer._id}
                  lawyer={lawyer}
                  onViewProfile={(id) => navigate(`/lawyer-profile/${id}`)}
                  onBook={(l) => {
                    setSelectedLawyer(l);
                    setIsBookingOpen(true);
                  }}
                />
              ))}
            </div>
          )}
        </main>
      </div>

      {/* Booking Modal */}
      <BookingModal
        lawyer={selectedLawyer}
        isOpen={isBookingOpen}
        onClose={() => setIsBookingOpen(false)}
        onSuccess={(aptId) => {
          setIsBookingOpen(false);
          navigate(`/consultations/${aptId}`);
        }}
      />
    </div>
  );
};
