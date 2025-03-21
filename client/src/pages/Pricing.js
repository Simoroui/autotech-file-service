import React from 'react';
import { Container, Row, Col, Card, Table, Badge, Button } from 'react-bootstrap';
import { Link } from 'react-router-dom';

const Pricing = () => {
  // Données de tarification
  const pricingData = [
    { id: 1, name: 'Stage 1', credits: 50, description: 'Optimisation de base pour les performances du moteur' },
    { id: 2, name: 'Stage 2', credits: 75, description: 'Optimisation intermédiaire avec modifications du turbo' },
    { id: 3, name: 'Stage Sur mesure', credits: 100, description: 'Optimisation avancée et personnalisée pour performances maximales' },
    { id: 4, name: 'Arrêt DPF/FAP', credits: 25, description: 'Désactivation du filtre à particules diesel' },
    { id: 5, name: 'Arrêt OPF/GPF', credits: 25, description: 'Désactivation du filtre à particules essence' },
    { id: 6, name: 'Arrêt catalyseur (lambda off)', credits: 25, description: 'Désactivation du catalyseur et des sondes lambda' },
    { id: 7, name: 'Activation Pop&Bang', credits: 25, description: "Activation des détonations à l'échappement" },
    { id: 8, name: 'Arrêt AdBlue', credits: 25, description: 'Désactivation du système AdBlue' },
    { id: 9, name: 'Blocage/retrait EGR', credits: 25, description: 'Désactivation de la vanne EGR' },
    { id: 10, name: 'Retrait code DTC / P', credits: 15, description: 'Suppression des codes défaut' },
    { id: 11, name: 'Vmax (suppression du limiteur de vitesse)', credits: 25, description: 'Suppression de la limitation de vitesse' },
    { id: 12, name: 'Start/Stop system off', credits: 15, description: 'Désactivation du système Start/Stop' }
  ];

  return (
    <Container fluid className="py-4">
      <h1 className="mb-4">Tarification</h1>
      
      <Row className="mb-4">
        <Col lg={12}>
          <Card className="shadow-sm">
            <Card.Header className="bg-light text-dark">
              <h3 className="mb-0">Services individuels</h3>
            </Card.Header>
            <Card.Body>
              <Table responsive striped hover>
                <thead>
                  <tr>
                    <th>Service</th>
                    <th>Description</th>
                    <th className="text-center">Prix (Crédits)</th>
                  </tr>
                </thead>
                <tbody>
                  {pricingData.map(service => (
                    <tr key={service.id}>
                      <td><strong>{service.name}</strong></td>
                      <td>{service.description}</td>
                      <td className="text-center">
                        <Badge bg="danger" pill className="px-3 py-2">
                          {service.credits} crédits
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            </Card.Body>
          </Card>
        </Col>
      </Row>
      
      <Row className="mt-4">
        <Col lg={12}>
          <Card className="shadow-sm bg-light">
            <Card.Body className="p-4">
              <h4>Comment acheter des crédits ?</h4>
              <p>
                Vous pouvez acheter des crédits en cliquant sur le lien "Acheter des crédits" dans le menu latéral. 
                Nous proposons différentes options d'achat avec des tarifs dégressifs pour les achats en volume.
              </p>
              <p className="mb-3">
                Pour toute question concernant nos tarifs ou pour obtenir un devis personnalisé, 
                n'hésitez pas à contacter notre équipe de support technique.
              </p>
              <div className="text-center">
                <Button as={Link} to="/buy-credits" variant="danger" size="lg" className="px-4">
                  <i className="fas fa-credit-card me-2"></i>
                  Acheter des crédits
                </Button>
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
};

export default Pricing; 