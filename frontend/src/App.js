import React, { useEffect, Suspense } from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import { AuthProvider } from './contexts/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Login from './pages/Login';
import Signup from './pages/Signup';
import Home from './pages/Home';
import Navbar from './components/Navbar';
import FAQ from './pages/FAQ';
import Contact from './pages/Contact';
import ReachOut from './pages/ReachOut';
import CreateComplain from './pages/CreateComplain';
import Level from './pages/Level';
import Tracker from './pages/Tracker';
import ComplaintList, { UserComplaintList } from './pages/ComplaintList';
import ComplaintDetails from './pages/ComplaintDetails';
import Investigate from './pages/Investigate';
import Profile from './pages/Profile';
import Notifications from './pages/Notifications';
import LiveChat from './pages/LiveChat';
import AdminHome from './pages/AdminHome';
import ReportList from './pages/ReportList';
import AddAdmin from './pages/AddAdmin';

// Loading component for Suspense fallback
const LoadingSpinner = () => (
  <div className="flex items-center justify-center min-h-screen">
    <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
  </div>
);

function App() {
  const location = useLocation();

  const hideNavbar = location.pathname === '/login' || location.pathname === '/signup' || location.pathname === '/faq' || location.pathname === '/contact' || location.pathname === '/complain' || location.pathname === '/ReachOut';

  return (
    <AuthProvider>
      {!hideNavbar && <Navbar />}
      <Suspense fallback={<LoadingSpinner />}>
        <Routes>
          {/* Public Routes */}
          <Route path="/login" element={<Login />} />
          <Route path="/CreateComplain" element={<CreateComplain />} />
          <Route path="/ReachOut" element={<ReachOut />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/faq" element={<FAQ />} />
          <Route path="/contact" element={<Contact />} />
          
          {/* Protected Routes - Regular Users */}
          <Route path="/home" element={
            <ProtectedRoute>
              <Home />
            </ProtectedRoute>
          } />
          <Route path="/Level" element={
            <ProtectedRoute>
              <Level />
            </ProtectedRoute>
          } />
          <Route path="/tracker" element={
            <ProtectedRoute>
              <Tracker />
            </ProtectedRoute>
          } />
          <Route path="/my-complains" element={
            <ProtectedRoute>
              <UserComplaintList />
            </ProtectedRoute>
          } />
          <Route path="/complaint/:id" element={
            <ProtectedRoute>
              <ComplaintDetails />
            </ProtectedRoute>
          } />
          <Route path="/profile" element={
            <ProtectedRoute>
              <Profile />
            </ProtectedRoute>
          } />
          <Route path="/notifications" element={
            <ProtectedRoute>
              <Notifications />
            </ProtectedRoute>
          } />
          <Route path="/livechat" element={
            <ProtectedRoute>
              <LiveChat />
            </ProtectedRoute>
          } />

          {/* Protected Routes - Privileged Users (Police, Fire, City, Animal) */}
          <Route path="/complains" element={
            <ProtectedRoute>
              <ComplaintList />
            </ProtectedRoute>
          } />
          <Route path="/investigate" element={
            <ProtectedRoute>
              <Investigate />
            </ProtectedRoute>
          } />

          {/* Protected Routes - Admin Only */}
          <Route path="/admin" element={
            <ProtectedRoute requiredRole="admin">
              <AdminHome />
            </ProtectedRoute>
          } />
          <Route path="/reports" element={
            <ProtectedRoute requiredRole="admin">
              <ReportList />
            </ProtectedRoute>
          } />
          <Route path="/add-admin" element={
            <ProtectedRoute requiredRole="admin">
              <AddAdmin />
            </ProtectedRoute>
          } />

          {/* Default Routes */}
          <Route path="/" element={<Navigate to="/login" />} />
          {/* Catch-all route for undefined paths */}
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </Suspense>
    </AuthProvider>
  );
}

export default App;
