import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const AdminProtection = ({ children }) => {
  const { isAuthenticated, isAdmin, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0f171e] flex flex-col items-center justify-center text-white">
        <div className="w-12 h-12 border-4 border-[#00a8e1] border-t-transparent rounded-full animate-spin mb-4"></div>
        <p className="text-gray-400 text-sm tracking-wider uppercase font-semibold">Verifying Admin Credentials...</p>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (!isAdmin) {
    return <Navigate to="/home" replace />;
  }

  return children;
};

export default AdminProtection;
