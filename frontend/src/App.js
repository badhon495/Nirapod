import React, { useEffect } from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import axios from 'axios';
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
import ComplaintList from './pages/ComplaintList';
import ComplaintDetails from './pages/ComplaintDetails';
import Investigate from './pages/Investigate';
import Notifications from './pages/Notifications';

function App() {
  const location = useLocation();

  useEffect(() => {
    // Only check category if not on login/signup/faq/contact/complain
    const publicPaths = ['/login', '/signup', '/faq', '/contact', '/complain'];
    if (publicPaths.includes(location.pathname)) return;
    // Get identifier from localStorage (set after login)
    const identifier = localStorage.getItem('nirapod_identifier');
    if (!identifier) return;
    // Try to fetch user by phone or NID
    axios.get(`/api/user/by-identifier?value=${encodeURIComponent(identifier)}`)
      .catch(() => {});
  }, [location.pathname]);

  const hideNavbar = location.pathname === '/login' || location.pathname === '/signup' || location.pathname === '/faq' || location.pathname === '/contact' || location.pathname === '/complain';

  return (
    <div style={{ minHeight: '100vh' }}>
      {!hideNavbar && <Navbar />}
      <main style={{ marginTop: '60px' }}>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/CreateComplain" element={<CreateComplain />} />
          <Route path="/ReachOut" element={<ReachOut />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/faq" element={<FAQ />} />
          <Route path="/home" element={<Home />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/Level" element={<Level />} />
          <Route path="/tracker" element={<Tracker />} />
          <Route path="/complains" element={<ComplaintList />} />
          <Route path="/complaint/:id" element={<ComplaintDetails />} />
          <Route path="/investigate" element={<Investigate />} />
          <Route path="/notifications" element={<Notifications />} />
          <Route path="/" element={<Navigate to="/login" />} />
        </Routes>
      </main>
    </div>
  );
}

export default App;
