import React from 'react';
import { Container, Row, Col, Card, Button } from 'react-bootstrap';
import { Link } from 'react-router-dom';

const Home = () => {
  return (
    <>
      {/* Section Hero */}
      <div className="hero-section bg-dark text-white py-5">
        <Container>
          <Row className="align-items-center">
            <Col lg={6} className="mb-5 mb-lg-0">
              <h1 className="display-3 fw-bold mb-4">
                <span className="text-danger">Optimisez</span> les performances de votre véhicule
              </h1>
              <p className="lead mb-4">
                Autotech File Service est la plateforme professionnelle de reprogrammation moteur qui vous permet d'améliorer la puissance, le couple et l'efficacité de votre véhicule.
              </p>
              <div className="d-grid gap-2 d-md-flex justify-content-md-start">
                <Link to="/register">
                  <Button variant="danger" size="lg" className="px-4 me-md-2">
                    Commencer maintenant
                  </Button>
                </Link>
                <Link to="/login">
                  <Button variant="outline-light" size="lg" className="px-4">
                    Se connecter
                  </Button>
                </Link>
              </div>
            </Col>
            <Col lg={6}>
              <div className="hero-image-container position-relative">
                <div className="hero-image-bg bg-danger position-absolute rounded-circle" style={{ width: '300px', height: '300px', top: '50px', right: '50px', opacity: '0.2', zIndex: '1' }}></div>
                <img
                  src="https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1000&q=80"
                  alt="Voiture de sport"
                  className="img-fluid rounded shadow-lg position-relative"
                  style={{ zIndex: '2' }}
                />
                <div className="stats-card bg-white text-dark p-3 rounded shadow position-absolute" style={{ bottom: '30px', left: '20px', zIndex: '3' }}>
                  <div className="d-flex align-items-center">
                    <div className="stats-icon bg-danger text-white rounded-circle d-flex align-items-center justify-content-center me-3" style={{ width: '50px', height: '50px' }}>
                      <i className="fas fa-tachometer-alt fa-lg"></i>
                    </div>
                    <div>
                      <h5 className="mb-0">Jusqu'à +30%</h5>
                      <p className="mb-0 text-muted">de puissance</p>
                    </div>
                  </div>
                </div>
              </div>
            </Col>
          </Row>
        </Container>
      </div>

      {/* Séparateur avec vague */}
      <div className="wave-separator">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1440 100">
          <path fill="#212529" fillOpacity="1" d="M0,64L80,69.3C160,75,320,85,480,80C640,75,800,53,960,42.7C1120,32,1280,32,1360,32L1440,32L1440,0L1360,0C1280,0,1120,0,960,0C800,0,640,0,480,0C320,0,160,0,80,0L0,0Z"></path>
        </svg>
      </div>

      <Container className="py-5">
        <h2 className="text-center mb-5">Nos services</h2>
        <Row className="mb-5">
          <Col md={4} className="mb-4">
            <Card className="h-100 shadow-sm">
              <Card.Body>
                <div className="text-center mb-3">
                  <i className="fas fa-tachometer-alt fa-3x text-danger"></i>
                </div>
                <Card.Title className="text-center">Augmentation de puissance</Card.Title>
                <Card.Text>
                  Optimisez la puissance et le couple de votre moteur pour une expérience de conduite améliorée.
                </Card.Text>
              </Card.Body>
            </Card>
          </Col>
          <Col md={4} className="mb-4">
            <Card className="h-100 shadow-sm">
              <Card.Body>
                <div className="text-center mb-3">
                  <i className="fas fa-gas-pump fa-3x text-danger"></i>
                </div>
                <Card.Title className="text-center">Économie de carburant</Card.Title>
                <Card.Text>
                  Réduisez votre consommation de carburant grâce à une reprogrammation optimisée.
                </Card.Text>
              </Card.Body>
            </Card>
          </Col>
          <Col md={4} className="mb-4">
            <Card className="h-100 shadow-sm">
              <Card.Body>
                <div className="text-center mb-3">
                  <i className="fas fa-cogs fa-3x text-danger"></i>
                </div>
                <Card.Title className="text-center">Personnalisation</Card.Title>
                <Card.Text>
                  Adaptez votre véhicule à vos besoins spécifiques avec nos options de personnalisation.
                </Card.Text>
              </Card.Body>
            </Card>
          </Col>
        </Row>

        <h2 className="text-center mb-4">Comment ça marche</h2>
        <Row className="mb-5">
          <Col md={3} className="mb-4">
            <Card className="h-100 shadow-sm">
              <Card.Body className="text-center">
                <div className="rounded-circle bg-danger text-white d-flex align-items-center justify-content-center mx-auto mb-3" style={{ width: '60px', height: '60px' }}>
                  <h3 className="m-0">1</h3>
                </div>
                <Card.Title>Inscription</Card.Title>
                <Card.Text>
                  Créez votre compte et achetez des crédits.
                </Card.Text>
              </Card.Body>
            </Card>
          </Col>
          <Col md={3} className="mb-4">
            <Card className="h-100 shadow-sm">
              <Card.Body className="text-center">
                <div className="rounded-circle bg-danger text-white d-flex align-items-center justify-content-center mx-auto mb-3" style={{ width: '60px', height: '60px' }}>
                  <h3 className="m-0">2</h3>
                </div>
                <Card.Title>Envoi du fichier</Card.Title>
                <Card.Text>
                  Envoyez votre fichier ECU original avec vos spécifications.
                </Card.Text>
              </Card.Body>
            </Card>
          </Col>
          <Col md={3} className="mb-4">
            <Card className="h-100 shadow-sm">
              <Card.Body className="text-center">
                <div className="rounded-circle bg-danger text-white d-flex align-items-center justify-content-center mx-auto mb-3" style={{ width: '60px', height: '60px' }}>
                  <h3 className="m-0">3</h3>
                </div>
                <Card.Title>Traitement</Card.Title>
                <Card.Text>
                  Nos experts traitent votre fichier selon vos besoins.
                </Card.Text>
              </Card.Body>
            </Card>
          </Col>
          <Col md={3} className="mb-4">
            <Card className="h-100 shadow-sm">
              <Card.Body className="text-center">
                <div className="rounded-circle bg-danger text-white d-flex align-items-center justify-content-center mx-auto mb-3" style={{ width: '60px', height: '60px' }}>
                  <h3 className="m-0">4</h3>
                </div>
                <Card.Title>Téléchargement</Card.Title>
                <Card.Text>
                  Téléchargez votre fichier optimisé et installez-le.
                </Card.Text>
              </Card.Body>
            </Card>
          </Col>
        </Row>
      </Container>
    </>
  );
};

export default Home; 