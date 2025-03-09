import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { WalletProvider } from './contexts/WalletContext';
import { RideProvider } from './contexts/RideContext';

// Layouts
import MainLayout from './layouts/MainLayout';

// Pages
import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import WalletPage from './pages/WalletPage';
import RidesPage from './pages/RidesPage';
import ScootyRentalPage from './pages/ScootyRentalPage';
import ProfilePage from './pages/ProfilePage';
import AdminDashboard from './pages/admin/Dashboard';

// Protected Route Component
import ProtectedRoute from './components/ProtectedRoute';
import AdminRoute from './components/AdminRoute';

function App() {
  return (
    <Router>
      <AuthProvider>
        <WalletProvider>
          <RideProvider>
            <Routes>
              <Route path="/login" element={<LoginPage />} />
              <Route path="/register" element={<RegisterPage />} />
              
              <Route path="/" element={
                <ProtectedRoute>
                  <MainLayout />
                </ProtectedRoute>
              }>
                <Route index element={<HomePage />} />
                <Route path="wallet" element={<WalletPage />} />
                <Route path="rides" element={<RidesPage />} />
                <Route path="scooty" element={<ScootyRentalPage />} />
                <Route path="profile" element={<ProfilePage />} />
              </Route>
              
              <Route path="/admin" element={
                <AdminRoute>
                  <MainLayout isAdmin={true} />
                </AdminRoute>
              }>
                <Route index element={<AdminDashboard />} />
              </Route>
            </Routes>
          </RideProvider>
        </WalletProvider>
      </AuthProvider>
    </Router>
  );
}

export default App;