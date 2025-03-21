import React, { useContext } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ListGroup, Image } from 'react-bootstrap';
import AuthContext from '../../context/auth/authContext';

const Sidebar = () => {
  const location = useLocation();
  const authContext = useContext(AuthContext);
  const { user } = authContext;

  // Vérifier si le lien est actif
  const isActive = (path) => {
    if (path === '/settings' || path === '/admin/settings') {
      return location.pathname === '/settings' || location.pathname === '/admin/settings' ? 'active' : '';
    }
    return location.pathname === path ? 'active' : '';
  };

  const settingsPath = user && user.role === 'admin' ? '/admin/settings' : '/settings';

  return (
    <div className="sidebar bg-dark text-white">
      <div className="sidebar-header p-3 border-bottom border-secondary">
        <div className="d-flex align-items-center">
          {user && (
            <>
              {user.photoUrl ? (
                <Image 
                  src={user.photoUrl} 
                  roundedCircle 
                  width={40} 
                  height={40} 
                  className="me-2" 
                  style={{ objectFit: 'cover' }} 
                />
              ) : (
                <div 
                  className="bg-danger text-dark rounded-circle d-flex align-items-center justify-content-center me-2" 
                  style={{ width: '40px', height: '40px', fontSize: '1.2rem' }}
                >
                  {user.name?.charAt(0).toUpperCase() || 'U'}
                </div>
              )}
              <div>
                <h5 className="mb-0">
                  {user.name}
                </h5>
                <p className="text-light small mb-0">
                  <i className="fas fa-coins me-1 text-warning"></i>
                  {user.credits} crédits
                </p>
              </div>
            </>
          )}
        </div>
      </div>
      <ListGroup variant="flush" className="sidebar-nav">
        <ListGroup.Item className={`sidebar-item ${isActive('/dashboard')}`}>
          <Link to="/dashboard" className="sidebar-link">
            <i className="fas fa-tachometer-alt me-2"></i>
            Tableau de bord
          </Link>
        </ListGroup.Item>
        <ListGroup.Item className={`sidebar-item ${isActive('/upload')}`}>
          <Link to="/upload" className="sidebar-link">
            <i className="fas fa-upload me-2"></i>
            Envoyer un fichier
          </Link>
        </ListGroup.Item>
        <ListGroup.Item className={`sidebar-item ${isActive('/notifications')}`}>
          <Link to="/notifications" className="sidebar-link">
            <i className="fas fa-bell me-2"></i>
            Notifications
          </Link>
        </ListGroup.Item>
        <ListGroup.Item className={`sidebar-item ${isActive('/history')}`}>
          <Link to="/history" className="sidebar-link">
            <i className="fas fa-history me-2"></i>
            Historique
          </Link>
        </ListGroup.Item>
        {user && user.role === 'admin' && (
          <>
            <ListGroup.Item className={`sidebar-item ${isActive('/admin')}`}>
              <Link to="/admin" className="sidebar-link">
                <i className="fas fa-cogs me-2"></i>
                Administration
              </Link>
            </ListGroup.Item>
            <ListGroup.Item className={`sidebar-item ${isActive('/admin/history')}`}>
              <Link to="/admin/history" className="sidebar-link">
                <i className="fas fa-clipboard-list me-2"></i>
                Historique admin
              </Link>
            </ListGroup.Item>
            <ListGroup.Item className={`sidebar-item ${isActive('/admin/invoices')}`}>
              <Link to="/admin/invoices" className="sidebar-link">
                <i className="fas fa-file-invoice-dollar me-2"></i>
                Factures clients
              </Link>
            </ListGroup.Item>
          </>
        )}
        <ListGroup.Item className={`sidebar-item ${isActive('/pricing')}`}>
          <Link to="/pricing" className="sidebar-link">
            <i className="fas fa-tags me-2"></i>
            Tarification
          </Link>
        </ListGroup.Item>
        <ListGroup.Item className={`sidebar-item ${isActive('/invoices')}`}>
          <Link to="/invoices" className="sidebar-link">
            <i className="fas fa-file-invoice me-2"></i>
            Facturation
          </Link>
        </ListGroup.Item>
        <ListGroup.Item className={`sidebar-item ${isActive('/buy-credits')}`}>
          <Link to="/buy-credits" className="sidebar-link">
            <i className="fas fa-credit-card me-2"></i>
            Acheter des crédits
          </Link>
        </ListGroup.Item>
        <ListGroup.Item className={`sidebar-item ${isActive(settingsPath)}`}>
          <Link to={settingsPath} className="sidebar-link">
            <i className="fas fa-cog me-2"></i>
            Paramètres
          </Link>
        </ListGroup.Item>
      </ListGroup>
      <div className="sidebar-footer p-3 mt-auto border-top border-secondary">
        <p className="small mb-0 text-center">
          <i className="fas fa-headset me-1"></i>
          Support technique
        </p>
        <p className="small mb-0 text-center">
          <i className="fas fa-phone me-1"></i>
          11111
        </p>
      </div>
    </div>
  );
};

export default Sidebar; 