import React, { useEffect, Suspense, lazy } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import PersistentNavbar from './components/PersistentNavbar';
import PageLayout from './components/PageLayout';
import PageLoader from './components/PageLoader';
import performanceOptimizer from './utils/PerformanceOptimizer';
import './styles/performance.css'; // Import performance optimizations

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
const PostComments = lazy(() => import('./pages/PostComments'));
const PostPhotos = lazy(() => import('./pages/PostPhotos'));
const Investigate = lazy(() => import('./pages/Investigate'));
const Profile = lazy(() => import('./pages/Profile'));
const Notifications = lazy(() => import('./pages/Notifications'));
const LiveChat = lazy(() => import('./pages/LiveChat'));
const AdminHome = lazy(() => import('./pages/AdminHome'));
const ReportList = lazy(() => import('./pages/ReportList'));
const AddAdmin = lazy(() => import('./pages/AddAdmin'));

// Optimized Loading component with performance focus
const LoadingSpinner = () => (
  <PageLoader message="Loading page..." size="medium" />
);

function App() {
  // Initialize performance optimizations
  useEffect(() => {
    performanceOptimizer.setupPerformanceMonitoring();
    
    // Add optimized text class to body
    document.body.classList.add('optimized-text');
    
    // Preload critical fonts for better performance
    const fontLink = document.createElement('link');
    fontLink.rel = 'preload';
    fontLink.href = 'https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap';
    fontLink.as = 'style';
    fontLink.crossOrigin = 'anonymous';
    document.head.appendChild(fontLink);
    
    return () => {
      // Cleanup on unmount
      performanceOptimizer.performMemoryCleanup();
    };
  }, []);

  return (
    <AuthProvider>
      {/* Persistent Navbar - Stays consistent across all pages */}
      <PersistentNavbar />
      
      <PageLayout>
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
            <Route path="/post/:trackingId/comments" element={
              <ProtectedRoute>
                <PostComments />
              </ProtectedRoute>
            } />
            <Route path="/post/:trackingId/photos" element={
              <ProtectedRoute>
                <PostPhotos />
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
      </PageLayout>
    </AuthProvider>
  );
}

export default App;
