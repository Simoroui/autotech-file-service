import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Nav, NavDropdown, Badge } from 'react-bootstrap';

const Header = () => {
  const [user, setUser] = useState(null);

  useEffect(() => {
    // Fetch user data
    fetchUser();
  }, []);

  const fetchUser = async () => {
    try {
      const response = await fetch('/api/user');
      const data = await response.json();
      setUser(data);
    } catch (error) {
      console.error('Error fetching user:', error);
    }
  };

  const logout = () => {
    // Implement logout functionality
    console.log('Logging out');
  };

  const authLinks = (
    <>
      <Nav.Link as={Link} to="/dashboard">
        <i className="fas fa-tachometer-alt me-1"></i> Tableau de bord
      </Nav.Link>
      <Nav.Link as={Link} to="/upload">
        <i className="fas fa-upload me-1"></i> Envoyer un fichier
      </Nav.Link>
      <NavDropdown title={
        <span>
          <i className="fas fa-user me-1"></i> {user && user.name}
        </span>
      } id="basic-nav-dropdown">
        <NavDropdown.Item as={Link} to="/profile">
          <i className="fas fa-user-cog me-2"></i> Mon profil
        </NavDropdown.Item>
        <NavDropdown.Divider />
        <NavDropdown.Item onClick={logout}>
          <i className="fas fa-sign-out-alt me-2"></i> Déconnexion
        </NavDropdown.Item>
      </NavDropdown>
      <Nav.Item className="d-flex align-items-center ms-2">
        <Badge bg="danger" className="py-1 px-2">
          <i className="fas fa-coins me-1"></i> {user && user.credits} crédits
        </Badge>
      </Nav.Item>
    </>
  );

  return (
    <Navbar bg="light" expand="lg">
      <Container>
        <Navbar.Brand href="#home">
          <img
            src="/path/to/logo.png"
            width="30"
            height="30"
            className="d-inline-block align-top"
            alt="Logo"
          />
          Autotech File Service
        </Navbar.Brand>
        <Navbar.Toggle aria-controls="basic-navbar-nav" />
        <Navbar.Collapse id="basic-navbar-nav">
          <Nav className="me-auto">
            {authLinks}
          </Nav>
        </Navbar.Collapse>
      </Container>
    </Navbar>
  );
};

export default Header; 