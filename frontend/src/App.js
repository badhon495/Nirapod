import React, { useEffect, Suspense, lazy } from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import { AuthProvider } from './contexts/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Navbar from './components/Navbar';

// Lazy load components for better performance
const Login = lazy(() => import('./pages/Login'));
const Signup = lazy(() => import('./pages/Signup'));
const Home = lazy(() => import('./pages/Home'));
const FAQ = lazy(() => import('./pages/FAQ'));
const Contact = lazy(() => import('./pages/Contact'));
const ReachOut = lazy(() => import('./pages/ReachOut'));
const CreateComplain = lazy(() => import('./pages/CreateComplain'));
const Level = lazy(() => import('./pages/Level'));
const Tracker = lazy(() => import('./pages/Tracker'));
const ComplaintList = lazy(() => import('./pages/ComplaintList').then(module => ({ default: module.default })));
const UserComplaintList = lazy(() => import('./pages/ComplaintList').then(module => ({ default: module.UserComplaintList })));
const ComplaintDetails = lazy(() => import('./pages/ComplaintDetails'));
const Investigate = lazy(() => import('./pages/Investigate'));
const Profile = lazy(() => import('./pages/Profile'));
const Notifications = lazy(() => import('./pages/Notifications'));
const LiveChat = lazy(() => import('./pages/LiveChat'));
const AdminHome = lazy(() => import('./pages/AdminHome'));
const ReportList = lazy(() => import('./pages/ReportList'));
const AddAdmin = lazy(() => import('./pages/AddAdmin'));

// Optimized Loading component with skeleton
const LoadingSpinner = () => (
  <div className="loading-container">
    <div className="loading-content">
      <div className="loading-skeleton">
        <div className="skeleton-header"></div>
        <div className="skeleton-body">
          <div className="skeleton-line"></div>
          <div className="skeleton-line"></div>
          <div className="skeleton-line short"></div>
        </div>
      </div>
      <div className="loading-spinner-wrapper">
        <div className="optimized-spinner"></div>
        <span className="loading-text">Loading...</span>
      </div>
    </div>
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
