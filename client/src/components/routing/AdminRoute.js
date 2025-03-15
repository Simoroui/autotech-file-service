import React, { useContext, useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import AuthContext from '../../context/auth/authContext';
import DashboardLayout from '../layout/DashboardLayout';

const AdminRoute = ({ children }) => {
  const authContext = useContext(AuthContext);
  const { isAuthenticated, loading, user, loadUser } = authContext;

  useEffect(() => {
    loadUser();
    // eslint-disable-next-line
  }, []);

  if (loading) {
    return <div className="d-flex justify-content-center">
      <div className="spinner-border" role="status">
        <span className="visually-hidden">Chargement...</span>
      </div>
    </div>;
  }

  // Vérifier si l'utilisateur est authentifié et a le rôle d'administrateur
  if (!isAuthenticated || !user || user.role !== 'admin') {
    return <Navigate to="/dashboard" />;
  }

  return <DashboardLayout>{children}</DashboardLayout>;
};

export default AdminRoute; 