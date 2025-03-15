import React from 'react';
import { Container, Row, Col } from 'react-bootstrap';

const Footer = () => {
  return (
    <footer className="bg-dark text-white py-4 mt-auto w-100">
      <Container fluid>
        <Row>
          <Col md={4} className="mb-3 mb-md-0">
            <h5>Autotech File Service</h5>
            <p className="text-muted">
              Votre partenaire de confiance pour la reprogrammation moteur
            </p>
          </Col>
          <Col md={4} className="mb-3 mb-md-0">
            <h5>Liens rapides</h5>
            <ul className="list-unstyled">
              <li><a href="/" className="text-white">Accueil</a></li>
              <li><a href="/login" className="text-white">Se connecter</a></li>
              <li><a href="/register" className="text-white">S'inscrire</a></li>
            </ul>
          </Col>
          <Col md={4}>
            <h5>Contact</h5>
            <ul className="list-unstyled">
              <li><i className="fas fa-envelope me-2"></i> contact@autotech-file-service.com</li>
              <li><i className="fas fa-phone me-2"></i> +216 50720660</li>
              <li><i className="fas fa-map-marker-alt me-2"></i> 5 Rue Jaber Ben Hayane, Bhar Lazreg, Arrondissement de Sidi Daoud, Tunis, 2046</li>
            </ul>
          </Col>
        </Row>
        <hr className="my-3" />
        <Row>
          <Col className="text-center">
            <p className="mb-0">
              &copy; {new Date().getFullYear()} Autotech File Service. Tous droits réservés.
            </p>
          </Col>
        </Row>
      </Container>
    </footer>
  );
};

export default Footer; 