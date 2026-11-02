import React, { useState, useEffect } from 'react';
import { DistrictProvider, useDistrict } from './context/DistrictContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import { SocketProvider } from './context/SocketContext';
import { api, Movie, Show } from './services/api';
import { Header } from './components/Header';
import { HomePage } from './pages/HomePage';
import { MoviesPage } from './pages/MoviesPage';
import { MovieDetailsPage } from './pages/MovieDetailsPage';
import { TheatresPage } from './pages/TheatresPage';
import { BookingFlowPage } from './pages/BookingFlowPage';
import { CustomerDashboard } from './pages/CustomerDashboard';
import { ManagerDashboard } from './pages/ManagerDashboard';
import { EmployeeDashboard } from './pages/EmployeeDashboard';
import { OffersPage } from './pages/OffersPage';
import { LoginPage } from './pages/LoginPage';
import { AuraAiModal } from './components/AuraAiModal';
import { Sparkles, Film, Heart } from 'lucide-react';

const MainApp: React.FC = () => {
  const { districtId, districtName } = useDistrict();
  const { user, isManager, isEmployee } = useAuth();

  // Navigation page state
  const [currentPage, setCurrentPage] = useState<string>('home');
  const [selectedMovieId, setSelectedMovieId] = useState<string | null>(null);
  const [selectedShowId, setSelectedShowId] = useState<string | null>(null);

  // Login page overlay
  const [showLoginPage, setShowLoginPage] = useState(false);

  // Aura AI Modal state
  const [isAuraAiOpen, setIsAuraAiOpen] = useState(false);
  const [auraCategory, setAuraCategory] = useState<'mood' | 'vibe' | 'travel' | null>(null);

  // Global Filter states
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedLanguage, setSelectedLanguage] = useState('All');
  const [selectedGenre, setSelectedGenre] = useState('All');
  const [selectedExperience, setSelectedExperience] = useState('All');

  // Movies list state
  const [movies, setMovies] = useState<Movie[]>([]);
  const [isLoadingMovies, setIsLoadingMovies] = useState(true);

  // Fetch movies when filters or district changes
  useEffect(() => {
    const fetchMovies = async () => {
      try {
        setIsLoadingMovies(true);
        const res = await api.getMovies({
          district_id: districtId,
          language: selectedLanguage !== 'All' ? selectedLanguage : undefined,
          genre: selectedGenre !== 'All' ? selectedGenre : undefined,
          experience: selectedExperience !== 'All' ? selectedExperience : undefined,
          search: searchTerm.trim() !== '' ? searchTerm : undefined
        });
        setMovies(res.movies || []);
      } catch (err) {
        console.error('Failed to load movies:', err);
      } finally {
        setIsLoadingMovies(false);
      }
    };
    fetchMovies();
  }, [districtId, selectedLanguage, selectedGenre, selectedExperience, searchTerm]);

  // Navigate handler
  const handleNavigate = (page: string, params?: any) => {
    if (page === 'movie-details' && params?.movieId) {
      setSelectedMovieId(params.movieId);
    } else if (page === 'booking-flow' && params?.showId) {
      setSelectedShowId(params.showId);
    }
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Movie actions
  const handleBookMovie = (movie: Movie) => {
    // If movie has shows, go to movie details or direct booking
    handleNavigate('movie-details', { movieId: movie.id });
  };

  const handleViewDetails = (movieId: string) => {
    handleNavigate('movie-details', { movieId });
  };

  const handleSelectShowFromDetails = (show: Show) => {
    setSelectedShowId(show.id);
    setCurrentPage('booking-flow');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleOpenAuraCategory = (cat: 'mood' | 'vibe' | 'travel') => {
    setAuraCategory(cat);
    setIsAuraAiOpen(true);
  };

  const handleLoginSuccess = (role: 'customer' | 'manager' | 'employee') => {
    setShowLoginPage(false);
    if (role === 'manager') {
      handleNavigate('manager-dashboard');
    } else if (role === 'employee') {
      handleNavigate('employee-dashboard');
    } else {
      handleNavigate('home');
    }
  };

  // Login Page Overlay
  if (showLoginPage) {
    return (
      <LoginPage
        onLoginSuccess={handleLoginSuccess}
        onBack={() => setShowLoginPage(false)}
      />
    );
  }

  return (
    <div className="min-h-screen bg-[#080b12] text-gray-100 flex flex-col selection:bg-amber-500 selection:text-black">
      
      {/* Global Header */}
      <Header
        currentPage={currentPage}
        onNavigate={handleNavigate}
        onOpenAuraAi={() => {
          setAuraCategory(null);
          setIsAuraAiOpen(true);
        }}
        onOpenLogin={() => setShowLoginPage(true)}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 pt-6">
        {currentPage === 'home' && (
          <HomePage
            movies={movies}
            isLoading={isLoadingMovies}
            searchTerm={searchTerm}
            onSearchChange={setSearchTerm}
            selectedLanguage={selectedLanguage}
            onLanguageChange={setSelectedLanguage}
            selectedGenre={selectedGenre}
            onGenreChange={setSelectedGenre}
            selectedExperience={selectedExperience}
            onExperienceChange={setSelectedExperience}
            onBookMovie={handleBookMovie}
            onViewDetails={handleViewDetails}
            onOpenAuraAi={() => {
              setAuraCategory(null);
              setIsAuraAiOpen(true);
            }}
            onOpenAuraCategory={handleOpenAuraCategory}
            onNavigate={handleNavigate}
          />
        )}

        {currentPage === 'movies' && (
          <MoviesPage
            movies={movies}
            isLoading={isLoadingMovies}
            searchTerm={searchTerm}
            onSearchChange={setSearchTerm}
            selectedLanguage={selectedLanguage}
            onLanguageChange={setSelectedLanguage}
            selectedGenre={selectedGenre}
            onGenreChange={setSelectedGenre}
            selectedExperience={selectedExperience}
            onExperienceChange={setSelectedExperience}
            onBookMovie={handleBookMovie}
            onViewDetails={handleViewDetails}
          />
        )}

        {currentPage === 'movie-details' && selectedMovieId && (
          <MovieDetailsPage
            movieId={selectedMovieId}
            onBack={() => handleNavigate('home')}
            onSelectShow={handleSelectShowFromDetails}
            onBookTicketsDirect={handleBookMovie}
          />
        )}

        {currentPage === 'theatres' && (
          <TheatresPage
            onSelectTheatre={(theatre) => {
              handleNavigate('movies');
            }}
          />
        )}

        {currentPage === 'booking-flow' && (
          <BookingFlowPage
            initialShowId={selectedShowId || undefined}
            onBack={() => handleNavigate(selectedMovieId ? 'movie-details' : 'home', { movieId: selectedMovieId })}
            onGoToMyBookings={() => handleNavigate('my-bookings')}
          />
        )}

        {(currentPage === 'customer-dashboard' || currentPage === 'my-bookings' || currentPage === 'watchlist') && (
          <CustomerDashboard
            onOpenAuraAi={() => {
              setAuraCategory(null);
              setIsAuraAiOpen(true);
            }}
            onViewMovie={handleViewDetails}
          />
        )}

        {currentPage === 'manager-dashboard' && (
          <ManagerDashboard />
        )}

        {currentPage === 'employee-dashboard' && (
          <EmployeeDashboard />
        )}

        {currentPage === 'offers' && (
          <OffersPage />
        )}
      </main>

      {/* Floating Aura AI Quick Button */}
      <div className="fixed bottom-6 right-6 z-40">
        <button
          onClick={() => {
            setAuraCategory(null);
            setIsAuraAiOpen(true);
          }}
          className="flex items-center space-x-2.5 px-5 py-3 rounded-full bg-gradient-to-r from-purple-600 via-indigo-600 to-cyan-500 text-white font-bold text-xs shadow-2xl shadow-purple-600/40 hover:scale-105 active:scale-95 transition-all border border-white/20"
        >
          <Sparkles className="w-4 h-4 animate-spin" style={{ animationDuration: '6s' }} />
          <span>Aura AI</span>
        </button>
      </div>

      {/* Global Interactive Aura AI Modal */}
      <AuraAiModal
        isOpen={isAuraAiOpen}
        onClose={() => setIsAuraAiOpen(false)}
        initialCategory={auraCategory}
        onBookMovie={(movie) => {
          setIsAuraAiOpen(false);
          handleBookMovie(movie);
        }}
        onViewDetails={(movieId) => {
          setIsAuraAiOpen(false);
          handleViewDetails(movieId);
        }}
      />

      {/* Footer */}
      <footer className="border-t border-white/10 bg-[#06090e] mt-20 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="space-y-1 text-center md:text-left">
            <div className="flex items-center justify-center md:justify-start space-x-2">
              <div className="w-6 h-6 rounded-lg bg-amber-500 flex items-center justify-center text-black font-black text-xs">
                A
              </div>
              <span className="text-base font-extrabold text-white">AI CineAura</span>
            </div>
            <p className="text-xs text-gray-500">
              Stories That Made for You. Commercial Cinema Ticketing & Intelligent Discovery Platform.
            </p>
            <p className="text-[11px] text-gray-600">
              Exclusively serving certified cinemas in Chennai, Chengalpattu, and Kanchipuram.
            </p>
          </div>

          <div className="flex items-center space-x-6 text-xs text-gray-400">
            <button onClick={() => handleNavigate('home')} className="hover:text-white">Home</button>
            <button onClick={() => handleNavigate('movies')} className="hover:text-white">Movies</button>
            <button onClick={() => handleNavigate('theatres')} className="hover:text-white">Theatres</button>
            <button onClick={() => handleNavigate('offers')} className="hover:text-white">Offers</button>
            <button onClick={() => handleNavigate('my-bookings')} className="hover:text-white">My Bookings</button>
          </div>
        </div>
      </footer>

    </div>
  );
};

export const App: React.FC = () => {
  return (
    <AuthProvider>
      <DistrictProvider>
        <SocketProvider>
          <MainApp />
        </SocketProvider>
      </DistrictProvider>
    </AuthProvider>
  );
};

export default App;
