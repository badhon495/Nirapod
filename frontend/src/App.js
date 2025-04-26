import React, { useEffect, useState } from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import Login from './pages/Login';
import Signup from './pages/Signup';
import Home from './pages/Home';
import Navbar from './components/Navbar';
import FAQ from './pages/FAQ';
import Contact from './pages/Contact';
import ReachOut from './pages/ReachOut';
import Complain from './pages/complain';
import Level from './pages/Level';
import Tracker from './pages/Tracker';
import UpdateProfile from './pages/UpdateProfile';

function App() {
  const location = useLocation();
  const [userCategory, setUserCategory] = useState(null);

  useEffect(() => {
    // Only check category if not on login/signup/faq/contact/complain
    const publicPaths = ['/login', '/signup', '/faq', '/contact', '/complain'];
    if (publicPaths.includes(location.pathname)) return;
    // Get identifier from localStorage (set after login)
    const identifier = localStorage.getItem('nirapod_identifier');
    if (!identifier) return;
    // Try to fetch user by phone or NID
    axios.get(`/api/user/by-identifier?value=${encodeURIComponent(identifier)}`)
      .then(res => {
        setUserCategory(res.data.categories);
      })
      .catch(() => setUserCategory(null));
  }, [location.pathname]);

  const hideNavbar = ['/login', '/signup', '/faq', '/contact', '/complain', '/update-profile'].includes(location.pathname);

  return (
    <>
      {!hideNavbar && <Navbar />}
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/Complain" element={<Complain />} />
        <Route path="/ReachOut" element={<ReachOut />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/faq" element={<FAQ />} />
        <Route path="/home" element={<Home />} />
        <Route path="/contact" element={<Contact />} />
        <Route path="/Level" element={<Level />} />
        <Route path="/tracker" element={<Tracker />} />
        <Route path="/update-profile" element={<UpdateProfile />} />
        <Route path="/" element={<Navigate to="/login" />} />
      </Routes>
    </>
  );
}

export default App;
