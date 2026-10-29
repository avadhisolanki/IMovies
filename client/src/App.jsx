import React, { lazy, Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import UserProtection from './components/UserProtection';
import AdminProtection from './components/AdminProtection';
import { useAuth } from './context/AuthContext';

// Lazy Loaded Pages
const LandingPage = lazy(() => import('./pages/LandingPage'));
const LoginPage = lazy(() => import('./pages/LoginPage'));
const RegisterPage = lazy(() => import('./pages/RegisterPage'));
const HomePage = lazy(() => import('./pages/HomePage'));
const MovieDetailsPage = lazy(() => import('./pages/MovieDetailsPage'));
const MovieShowsPage = lazy(() => import('./pages/MovieShowsPage'));
const SeatSlugPage = lazy(() => import('./pages/SeatSlugPage'));
const BookingsPage = lazy(() => import('./pages/BookingsPage'));
const WatchlistPage = lazy(() => import('./pages/WatchlistPage'));
const AdminDashboard = lazy(() => import('./pages/AdminDashboard'));
const AddMoviePage = lazy(() => import('./pages/AddMoviePage'));
const AddTheatrePage = lazy(() => import('./pages/AddTheatrePage'));
const AddShowPage = lazy(() => import('./pages/AddShowPage'));
const AdminBookingsPage = lazy(() => import('./pages/AdminBookingsPage'));
const VerifyEmailPage = lazy(() => import('./pages/VerifyEmailPage'));
const ResetPasswordPage = lazy(() => import('./pages/ResetPasswordPage'));

// Fallback loader with Prime Dark aesthetic
const PageLoader = () => (
  <div className="min-h-screen bg-[#0f171e] flex flex-col items-center justify-center text-white">
    <div className="w-12 h-12 border-4 border-[#00a8e1] border-t-transparent rounded-full animate-spin mb-4"></div>
    <p className="text-gray-400 text-xs tracking-widest uppercase font-bold">
      Loading Prime Cinema...
    </p>
  </div>
);

// Root Index Component directing to /home or /landing
const RootRedirect = () => {
  const { isAuthenticated, loading } = useAuth();
  if (loading) return <PageLoader />;
  return isAuthenticated ? <Navigate to="/home" replace /> : <Navigate to="/landing" replace />;
};

function App() {
  return (
    <Router>
      <div className="min-h-screen flex flex-col bg-[#0f171e] text-white">
        <Navbar />

        <main className="flex-1">
          <Suspense fallback={<PageLoader />}>
            <Routes>
              {/* Public Routes */}
              <Route path="/" element={<RootRedirect />} />
              <Route path="/landing" element={<LandingPage />} />
              <Route path="/login" element={<LoginPage />} />
              <Route path="/register" element={<RegisterPage />} />
              <Route path="/verify-email" element={<VerifyEmailPage />} />
              <Route path="/reset-password" element={<ResetPasswordPage />} />

              {/* User Protected Views */}
              <Route
                path="/home"
                element={
                  <UserProtection>
                    <HomePage />
                  </UserProtection>
                }
              />
              <Route
                path="/moviedetails/:movieId"
                element={
                  <UserProtection>
                    <MovieDetailsPage />
                  </UserProtection>
                }
              />
              <Route
                path="/movieshows/:movieId"
                element={
                  <UserProtection>
                    <MovieShowsPage />
                  </UserProtection>
                }
              />
              <Route
                path="/seatslug/:showId"
                element={
                  <UserProtection>
                    <SeatSlugPage />
                  </UserProtection>
                }
              />
              <Route
                path="/bookings"
                element={
                  <UserProtection>
                    <BookingsPage />
                  </UserProtection>
                }
              />
              <Route
                path="/watchlist"
                element={
                  <UserProtection>
                    <WatchlistPage />
                  </UserProtection>
                }
              />

              {/* Admin Protected Views */}
              <Route
                path="/admin"
                element={
                  <AdminProtection>
                    <AdminDashboard />
                  </AdminProtection>
                }
              />
              <Route
                path="/addmovie"
                element={
                  <AdminProtection>
                    <AddMoviePage />
                  </AdminProtection>
                }
              />
              <Route
                path="/addtheatre"
                element={
                  <AdminProtection>
                    <AddTheatrePage />
                  </AdminProtection>
                }
              />
              <Route
                path="/addshow"
                element={
                  <AdminProtection>
                    <AddShowPage />
                  </AdminProtection>
                }
              />
              <Route
                path="/adminbookings"
                element={
                  <AdminProtection>
                    <AdminBookingsPage />
                  </AdminProtection>
                }
              />

              {/* Catch-all redirect */}
              <Route path="*" element={<RootRedirect />} />
            </Routes>
          </Suspense>
        </main>

        <Footer />
      </div>
    </Router>
  );
}

export default App;
