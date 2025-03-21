import React, { useState, useContext } from 'react';
import { Container, Row, Col, Nav, Tab, Card, Alert } from 'react-bootstrap';
import { FaUserCog, FaBell, FaShieldAlt, FaUser } from 'react-icons/fa';
import NotificationSettings from '../components/profile/NotificationSettings';

const Settings = () => {
  const [activeKey, setActiveKey] = useState('notifications');

  // Style pour les liens de navigation
  const navLinkStyle = {
    color: '#212529', // Noir
    fontWeight: 'normal'
  };

  // Style pour le lien actif
  const activeNavLinkStyle = {
    ...navLinkStyle,
    fontWeight: 'bold'
  };

  return (
    <Container fluid className="py-4">
      {/* Style intégré pour forcer la couleur noire sur les liens */}
      <style>
        {`
          .nav-link-black, .nav-link-black:hover, .nav-link-black:focus, .nav-link-black:active {
            color: #000000 !important;
          }
          .nav-link-black.active, .nav-link-black.active:hover, .nav-link-black.active:focus {
            color: #ffffff !important;
          }
        `}
      </style>
      <h2 className="mb-4">Paramètres</h2>
      
      <Row>
        <Col md={3} lg={2} className="mb-4">
          <Card className="shadow-sm">
            <Card.Header className="bg-light text-dark">
              <h5 className="mb-0 d-flex align-items-center">
                <FaUserCog className="me-2" /> Paramètres
              </h5>
            </Card.Header>
            <Card.Body className="p-0">
              <Nav variant="pills" className="flex-column" activeKey={activeKey} onSelect={(k) => setActiveKey(k)}>
                <Nav.Item>
                  <Nav.Link 
                    eventKey="notifications" 
                    className="d-flex align-items-center nav-link-black" 
                    style={activeKey === 'notifications' ? activeNavLinkStyle : navLinkStyle}
                  >
                    <FaBell className="me-2" /> Notifications
                  </Nav.Link>
                </Nav.Item>
                <Nav.Item>
                  <Nav.Link 
                    eventKey="security" 
                    className="d-flex align-items-center nav-link-black" 
                    style={activeKey === 'security' ? activeNavLinkStyle : navLinkStyle}
                  >
                    <FaShieldAlt className="me-2" /> Sécurité
                  </Nav.Link>
                </Nav.Item>
                <Nav.Item>
                  <Nav.Link 
                    href="/profile"
                    className="d-flex align-items-center nav-link-black" 
                    style={navLinkStyle}
                  >
                    <FaUser className="me-2" /> Mon profil
                  </Nav.Link>
                </Nav.Item>
              </Nav>
            </Card.Body>
          </Card>
        </Col>
        
        <Col md={9} lg={10}>
          <Tab.Content>
            <Tab.Pane eventKey="notifications" active={activeKey === 'notifications'}>
              <NotificationSettings />
            </Tab.Pane>
            
            <Tab.Pane eventKey="security" active={activeKey === 'security'}>
              <Card className="shadow-sm">
                <Card.Header className="bg-light text-dark">
                  <h5 className="mb-0">Sécurité</h5>
                </Card.Header>
                <Card.Body>
                  <div className="mb-4">
                    <h6 className="mb-3">Changement de mot de passe</h6>
                    <p>Pour changer votre mot de passe, veuillez accéder à votre page de profil.</p>
                    <a href="/profile" className="btn btn-outline-primary">
                      Accéder au profil
                    </a>
                  </div>
                  
                  <div className="mb-4">
                    <h6 className="mb-3">Sessions actives</h6>
                    <Alert variant="warning">
                      Cette fonctionnalité sera disponible prochainement. Vous pourrez voir toutes vos sessions actives et les déconnecter à distance.
                    </Alert>
                  </div>
                </Card.Body>
              </Card>
            </Tab.Pane>
          </Tab.Content>
        </Col>
      </Row>
    </Container>
  );
};

export default Settings; 