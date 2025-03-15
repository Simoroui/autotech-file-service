import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import './darkMode.css';

// Composants
import Navbar from './components/layout/Navbar';
import Footer from './components/layout/Footer';

// Pages
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import FileUpload from './pages/FileUpload';
import FileDetails from './pages/FileDetails';
import FileHistory from './pages/FileHistory';
import NotFound from './pages/NotFound';
import Profile from './pages/Profile';
import Settings from './pages/Settings';
import AdminDashboard from './pages/AdminDashboard';
import AdminUserManagement from './pages/AdminUserManagement';
import AdminFileManagement from './pages/AdminFileManagement';
import AdminSettings from './pages/AdminSettings';
import NotificationsPage from './pages/NotificationsPage';
import AdminFileDetails from './pages/admin/AdminFileDetails';
import AdminFileHistory from './pages/admin/AdminFileHistory';
import Pricing from './pages/Pricing';
import BuyCredits from './pages/BuyCredits';
import Invoices from './pages/Invoices';
import AdminInvoices from './pages/admin/AdminInvoices';

// Context
import AuthState from './context/auth/AuthState';
import ThemeState from './context/theme/ThemeState';
import PrivateRoute from './components/routing/PrivateRoute';
import AdminRoute from './components/routing/AdminRoute';

const App = () => {
  return (
    <AuthState>
      <ThemeState>
        <Router>
          <div className="d-flex flex-column min-vh-100">
            <Navbar />
            <div className="container-fluid p-0 flex-grow-1">
              <ToastContainer position="top-right" autoClose={5000} />
              <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/login" element={<div className="container py-4"><Login /></div>} />
                <Route path="/register" element={<div className="container py-4"><Register /></div>} />
                <Route path="/dashboard" element={<PrivateRoute><Dashboard /></PrivateRoute>} />
                <Route path="/upload" element={<PrivateRoute><FileUpload /></PrivateRoute>} />
                <Route path="/files/:id" element={<PrivateRoute><FileDetails /></PrivateRoute>} />
                <Route path="/history" element={<PrivateRoute><FileHistory /></PrivateRoute>} />
                <Route path="/profile" element={<PrivateRoute><Profile /></PrivateRoute>} />
                <Route path="/settings" element={<PrivateRoute><Settings /></PrivateRoute>} />
                <Route path="/notifications" element={<PrivateRoute><NotificationsPage /></PrivateRoute>} />
                <Route path="/pricing" element={<PrivateRoute><Pricing /></PrivateRoute>} />
                <Route path="/buy-credits" element={<PrivateRoute><BuyCredits /></PrivateRoute>} />
                <Route path="/invoices" element={<PrivateRoute><Invoices /></PrivateRoute>} />
                
                {/* Routes d'administration */}
                <Route path="/admin" element={<AdminRoute><AdminDashboard /></AdminRoute>} />
                <Route path="/admin/users" element={<AdminRoute><AdminUserManagement /></AdminRoute>} />
                <Route path="/admin/files" element={<AdminRoute><AdminFileManagement /></AdminRoute>} />
                <Route path="/admin/files/:id" element={<AdminRoute><AdminFileDetails /></AdminRoute>} />
                <Route path="/admin/history" element={<AdminRoute><AdminFileHistory /></AdminRoute>} />
                <Route path="/admin/settings" element={<AdminRoute><AdminSettings /></AdminRoute>} />
                <Route path="/admin/invoices" element={<AdminRoute><AdminInvoices /></AdminRoute>} />
                
                <Route path="*" element={<div className="container py-4"><NotFound /></div>} />
              </Routes>
            </div>
            <Footer />
          </div>
        </Router>
      </ThemeState>
    </AuthState>
  );
};

export default App; 