import React, { useContext } from 'react';
import { Link } from 'react-router-dom';
import { Navbar as BootstrapNavbar, Nav, Container, Button, NavDropdown } from 'react-bootstrap';
import AuthContext from '../../context/auth/authContext';
import NotificationBell from './NotificationBell';
import { FaUserCog, FaCog } from 'react-icons/fa';

const Navbar = () => {
  const authContext = useContext(AuthContext);
  const { isAuthenticated, logout, user } = authContext;

  const onLogout = () => {
    logout();
  };

  const authLinks = (
    <Nav className="ms-auto">
      {user && (
        <Nav.Item className="d-flex align-items-center me-3">
          <span className="text-light">
            Bienvenue, {user.name} | Crédits: {user.credits}
          </span>
        </Nav.Item>
      )}
      <Nav.Item className="d-flex align-items-center me-3">
        <NotificationBell />
      </Nav.Item>
      <Nav.Item>
        <Link to="/dashboard" className="nav-link">
          Tableau de bord
        </Link>
      </Nav.Item>
      <Nav.Item>
        <Link to="/upload" className="nav-link">
          Envoyer un fichier
        </Link>
      </Nav.Item>
      
      <NavDropdown title={<span><FaUserCog className="me-1" /> Compte</span>} align="end">
        <NavDropdown.Item as={Link} to="/profile">
          Profil
        </NavDropdown.Item>
        <NavDropdown.Item as={Link} to="/settings">
          Paramètres
        </NavDropdown.Item>
        {user && user.role === 'admin' && (
          <>
            <NavDropdown.Divider />
            <NavDropdown.Item as={Link} to="/admin/settings">
              <FaCog className="me-1" /> Paramètres administrateur
            </NavDropdown.Item>
          </>
        )}
      </NavDropdown>
      
      {user && user.role === 'admin' && (
        <Nav.Item>
          <Link to="/admin" className="nav-link">
            Administration
          </Link>
        </Nav.Item>
      )}
      <Nav.Item>
        <Button variant="outline-light" onClick={onLogout}>
          Déconnexion
        </Button>
      </Nav.Item>
    </Nav>
  );

  const guestLinks = (
    <Nav className="ms-auto">
      <Nav.Item>
        <Link to="/register" className="nav-link">
          S'inscrire
        </Link>
      </Nav.Item>
      <Nav.Item>
        <Link to="/login" className="nav-link">
          Se connecter
        </Link>
      </Nav.Item>
    </Nav>
  );

  return (
    <BootstrapNavbar bg="dark" variant="dark" expand="lg" className="w-100">
      <Container fluid>
        <Link to="/" className="navbar-brand d-flex align-items-center">
          <img 
            src="/Logo-H.png" 
            alt="Autotech Logo" 
            height="40" 
            className="me-2" 
          />
          <strong>File Service</strong>
        </Link>
        <BootstrapNavbar.Toggle aria-controls="basic-navbar-nav" />
        <BootstrapNavbar.Collapse id="basic-navbar-nav">
          {isAuthenticated ? authLinks : guestLinks}
        </BootstrapNavbar.Collapse>
      </Container>
    </BootstrapNavbar>
  );
};

export default Navbar; 