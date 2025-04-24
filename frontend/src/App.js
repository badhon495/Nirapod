import React from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import Login from './pages/Login';
import Signup from './pages/Signup';
import Home from './pages/Home';
import Navbar from './components/Navbar';
import FAQ from './pages/FAQ';
import Contact from './pages/Contact';
import Complain from './pages/Complain';

function App() {
  const location = useLocation();
  const hideNavbar = location.pathname === '/login' || location.pathname === '/signup' || location.pathname === '/faq' || location.pathname === '/contact' || location.pathname === '/complain';

  return (
    <>
      {!hideNavbar && <Navbar />}
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/complain" element={<Complain />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/faq" element={<FAQ />} />
        <Route path="/home" element={<Home />} />
        <Route path="/contact" element={<Contact />} />
        <Route path="/" element={<Navigate to="/login" />} />
      </Routes>
    </>
  );
}

export default App;
