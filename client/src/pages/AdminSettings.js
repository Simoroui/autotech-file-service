import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Nav, Tab, Card, Form, Button, Alert, Spinner, Table } from 'react-bootstrap';
import { FaCog, FaServer, FaBell, FaEuroSign, FaPlug, FaSave } from 'react-icons/fa';
// eslint-disable-next-line no-unused-vars
import axios from 'axios';

const AdminSettings = () => {
  const [activeKey, setActiveKey] = useState('system');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  
  const [systemSettings, setSystemSettings] = useState({
    maxFileSize: 20,
    allowedFileTypes: '.bin,.hex,.elf,.zip',
    maxFilesPerUser: 50,
    maintenanceMode: false
  });
  
  const [pricingSettings, setPricingSettings] = useState({
    baseCreditPrice: 5,
    bulkDiscountThreshold: 10,
    bulkDiscountPercent: 15,
    specialOfferActive: false,
    specialOfferDiscount: 20
  });
  
  const [notificationSettings, setNotificationSettings] = useState({
    adminEmailNotifications: true,
    systemAlerts: true,
    userRegistrationNotifications: true,
    fileProcessingErrors: true
  });
  
  const [integrationSettings, setIntegrationSettings] = useState({
    paymentGatewayActive: true,
    emailServiceActive: true,
    analyticsActive: true,
    apiKeysVisible: false
  });

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

  useEffect(() => {
    // Simulation de chargement des données depuis l'API
    const timer = setTimeout(() => {
      setLoading(false);
    }, 1000);
    
    return () => clearTimeout(timer);
  }, []);
  
  const handleSystemChange = (e) => {
    const { name, value, type, checked } = e.target;
    setSystemSettings({
      ...systemSettings,
      [name]: type === 'checkbox' ? checked : value
    });
  };
  
  const handlePricingChange = (e) => {
    const { name, value, type, checked } = e.target;
    setPricingSettings({
      ...pricingSettings,
      [name]: type === 'checkbox' ? checked : type === 'number' ? parseFloat(value) : value
    });
  };
  
  const handleNotificationChange = (e) => {
    const { name, checked } = e.target;
    setNotificationSettings({
      ...notificationSettings,
      [name]: checked
    });
  };
  
  const handleIntegrationChange = (e) => {
    const { name, checked } = e.target;
    setIntegrationSettings({
      ...integrationSettings,
      [name]: checked
    });
  };
  
  const handleSubmit = async (settingType) => {
    setSaving(true);
    setError(null);
    setSuccess(false);
    
    try {
      // Simulation d'enregistrement API
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setSuccess(true);
      setSaving(false);
      
      // Masquer le message de succès après 3 secondes
      setTimeout(() => {
        setSuccess(false);
      }, 3000);
    } catch (err) {
      setError("Une erreur est survenue lors de l'enregistrement des paramètres");
      setSaving(false);
    }
  };
  
  if (loading) {
    return (
      <Container fluid className="py-4">
        <div className="text-center my-5">
          <Spinner animation="border" variant="danger" />
          <p className="mt-3">Chargement des paramètres d'administration...</p>
        </div>
      </Container>
    );
  }

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
      <h2 className="mb-4">Paramètres d'administration</h2>
      
      {success && (
        <Alert variant="success" className="mb-4">
          Les paramètres ont été enregistrés avec succès
        </Alert>
      )}
      
      {error && (
        <Alert variant="danger" className="mb-4">
          {error}
        </Alert>
      )}
      
      <Row>
        <Col md={3} lg={2} className="mb-4">
          <Card className="shadow-sm">
            <Card.Header className="bg-dark text-white">
              <h5 className="mb-0 d-flex align-items-center">
                <FaCog className="me-2" /> Configuration
              </h5>
            </Card.Header>
            <Card.Body className="p-0">
              <Nav variant="pills" className="flex-column" activeKey={activeKey} onSelect={(k) => setActiveKey(k)}>
                <Nav.Item>
                  <Nav.Link 
                    eventKey="system" 
                    className="d-flex align-items-center nav-link-black" 
                    style={activeKey === 'system' ? activeNavLinkStyle : navLinkStyle}
                  >
                    <FaServer className="me-2" /> Système
                  </Nav.Link>
                </Nav.Item>
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
                    eventKey="pricing" 
                    className="d-flex align-items-center nav-link-black" 
                    style={activeKey === 'pricing' ? activeNavLinkStyle : navLinkStyle}
                  >
                    <FaEuroSign className="me-2" /> Tarification
                  </Nav.Link>
                </Nav.Item>
                <Nav.Item>
                  <Nav.Link 
                    eventKey="integrations" 
                    className="d-flex align-items-center nav-link-black" 
                    style={activeKey === 'integrations' ? activeNavLinkStyle : navLinkStyle}
                  >
                    <FaPlug className="me-2" /> Intégrations
                  </Nav.Link>
                </Nav.Item>
              </Nav>
            </Card.Body>
          </Card>
        </Col>
        
        <Col md={9} lg={10}>
          <Tab.Content>
            <Tab.Pane eventKey="system" active={activeKey === 'system'}>
              <Card className="shadow-sm">
                <Card.Header className="bg-dark text-white">
                  <h5 className="mb-0">Paramètres système</h5>
                </Card.Header>
                <Card.Body>
                  <Form>
                    <Row>
                      <Col md={6}>
                        <Form.Group className="mb-3">
                          <Form.Label>Taille maximale des fichiers (MB)</Form.Label>
                          <Form.Control
                            type="number"
                            name="maxFileSize"
                            value={systemSettings.maxFileSize}
                            onChange={handleSystemChange}
                          />
                          <Form.Text className="text-muted">
                            Taille maximale de fichier autorisée en mégaoctets
                          </Form.Text>
                        </Form.Group>
                      </Col>
                      
                      <Col md={6}>
                        <Form.Group className="mb-3">
                          <Form.Label>Nombre maximum de fichiers par utilisateur</Form.Label>
                          <Form.Control
                            type="number"
                            name="maxFilesPerUser"
                            value={systemSettings.maxFilesPerUser}
                            onChange={handleSystemChange}
                          />
                        </Form.Group>
                      </Col>
                    </Row>
                    
                    <Form.Group className="mb-3">
                      <Form.Label>Types de fichiers autorisés</Form.Label>
                      <Form.Control
                        type="text"
                        name="allowedFileTypes"
                        value={systemSettings.allowedFileTypes}
                        onChange={handleSystemChange}
                      />
                      <Form.Text className="text-muted">
                        Séparés par des virgules (.bin,.hex,.elf,etc.)
                      </Form.Text>
                    </Form.Group>
                    
                    <Form.Group className="mb-4">
                      <Form.Check
                        type="switch"
                        id="maintenanceMode"
                        name="maintenanceMode"
                        label="Mode maintenance"
                        checked={systemSettings.maintenanceMode}
                        onChange={handleSystemChange}
                      />
                      <Form.Text className="text-muted">
                        Lorsque activé, seuls les administrateurs peuvent accéder à la plateforme
                      </Form.Text>
                    </Form.Group>
                    
                    <Button 
                      variant="danger" 
                      onClick={() => handleSubmit('system')}
                      disabled={saving}
                      className="d-flex align-items-center"
                    >
                      {saving ? (
                        <>
                          <Spinner size="sm" className="me-2" />
                          Enregistrement...
                        </>
                      ) : (
                        <>
                          <FaSave className="me-2" /> Enregistrer les paramètres système
                        </>
                      )}
                    </Button>
                  </Form>
                </Card.Body>
              </Card>
            </Tab.Pane>
            
            <Tab.Pane eventKey="notifications" active={activeKey === 'notifications'}>
              <Card className="shadow-sm">
                <Card.Header className="bg-dark text-white">
                  <h5 className="mb-0">Paramètres de notification</h5>
                </Card.Header>
                <Card.Body>
                  <Form>
                    <Form.Group className="mb-3">
                      <Form.Label className="fw-bold">Notifications administrateur</Form.Label>
                      <div className="mb-2">
                        <Form.Check
                          type="checkbox"
                          id="adminEmailNotifications"
                          name="adminEmailNotifications"
                          label="Notifications par email"
                          checked={notificationSettings.adminEmailNotifications}
                          onChange={handleNotificationChange}
                        />
                        <Form.Text className="text-muted d-block ms-4">
                          Recevez des emails pour les événements importants du système
                        </Form.Text>
                      </div>
                      
                      <div className="mb-2">
                        <Form.Check
                          type="checkbox"
                          id="systemAlerts"
                          name="systemAlerts"
                          label="Alertes système"
                          checked={notificationSettings.systemAlerts}
                          onChange={handleNotificationChange}
                        />
                        <Form.Text className="text-muted d-block ms-4">
                          Recevez des alertes pour les événements critiques du système
                        </Form.Text>
                      </div>
                      
                      <div className="mb-2">
                        <Form.Check
                          type="checkbox"
                          id="userRegistrationNotifications"
                          name="userRegistrationNotifications"
                          label="Notifications d'inscription utilisateur"
                          checked={notificationSettings.userRegistrationNotifications}
                          onChange={handleNotificationChange}
                        />
                        <Form.Text className="text-muted d-block ms-4">
                          Recevez des notifications lorsqu'un nouvel utilisateur s'inscrit
                        </Form.Text>
                      </div>
                      
                      <div className="mb-2">
                        <Form.Check
                          type="checkbox"
                          id="fileProcessingErrors"
                          name="fileProcessingErrors"
                          label="Erreurs de traitement de fichiers"
                          checked={notificationSettings.fileProcessingErrors}
                          onChange={handleNotificationChange}
                        />
                        <Form.Text className="text-muted d-block ms-4">
                          Recevez des notifications en cas d'erreur lors du traitement des fichiers
                        </Form.Text>
                      </div>
                    </Form.Group>
                    
                    <Button 
                      variant="danger" 
                      onClick={() => handleSubmit('notifications')}
                      disabled={saving}
                      className="d-flex align-items-center"
                    >
                      {saving ? (
                        <>
                          <Spinner size="sm" className="me-2" />
                          Enregistrement...
                        </>
                      ) : (
                        <>
                          <FaSave className="me-2" /> Enregistrer les paramètres de notification
                        </>
                      )}
                    </Button>
                  </Form>
                </Card.Body>
              </Card>
            </Tab.Pane>
            
            <Tab.Pane eventKey="pricing" active={activeKey === 'pricing'}>
              <Card className="shadow-sm">
                <Card.Header className="bg-dark text-white">
                  <h5 className="mb-0">Paramètres de tarification</h5>
                </Card.Header>
                <Card.Body>
                  <Form>
                    <Row>
                      <Col md={6}>
                        <Form.Group className="mb-3">
                          <Form.Label>Prix de base par crédit (€)</Form.Label>
                          <Form.Control
                            type="number"
                            name="baseCreditPrice"
                            value={pricingSettings.baseCreditPrice}
                            onChange={handlePricingChange}
                          />
                        </Form.Group>
                      </Col>
                      
                      <Col md={6}>
                        <Form.Group className="mb-3">
                          <Form.Label>Seuil pour remise en volume</Form.Label>
                          <Form.Control
                            type="number"
                            name="bulkDiscountThreshold"
                            value={pricingSettings.bulkDiscountThreshold}
                            onChange={handlePricingChange}
                          />
                          <Form.Text className="text-muted">
                            Nombre minimum de crédits pour bénéficier d'une remise
                          </Form.Text>
                        </Form.Group>
                      </Col>
                    </Row>
                    
                    <Row>
                      <Col md={6}>
                        <Form.Group className="mb-3">
                          <Form.Label>Pourcentage de remise en volume (%)</Form.Label>
                          <Form.Control
                            type="number"
                            name="bulkDiscountPercent"
                            value={pricingSettings.bulkDiscountPercent}
                            onChange={handlePricingChange}
                          />
                        </Form.Group>
                      </Col>
                      
                      <Col md={6}>
                        <Form.Group className="mb-3">
                          <Form.Label>Pourcentage de remise spéciale (%)</Form.Label>
                          <Form.Control
                            type="number"
                            name="specialOfferDiscount"
                            value={pricingSettings.specialOfferDiscount}
                            onChange={handlePricingChange}
                          />
                        </Form.Group>
                      </Col>
                    </Row>
                    
                    <Form.Group className="mb-4">
                      <Form.Check
                        type="switch"
                        id="specialOfferActive"
                        name="specialOfferActive"
                        label="Offre spéciale active"
                        checked={pricingSettings.specialOfferActive}
                        onChange={handlePricingChange}
                      />
                    </Form.Group>
                    
                    <div className="mb-4">
                      <h6>Aperçu de la tarification</h6>
                      <Table striped bordered hover size="sm" className="mt-2">
                        <thead>
                          <tr>
                            <th>Nombre de crédits</th>
                            <th>Prix unitaire</th>
                            <th>Prix total</th>
                            <th>Économie</th>
                          </tr>
                        </thead>
                        <tbody>
                          <tr>
                            <td>1</td>
                            <td>{pricingSettings.baseCreditPrice.toFixed(2)} €</td>
                            <td>{pricingSettings.baseCreditPrice.toFixed(2)} €</td>
                            <td>-</td>
                          </tr>
                          <tr>
                            <td>5</td>
                            <td>{pricingSettings.baseCreditPrice.toFixed(2)} €</td>
                            <td>{(5 * pricingSettings.baseCreditPrice).toFixed(2)} €</td>
                            <td>-</td>
                          </tr>
                          <tr>
                            <td>{pricingSettings.bulkDiscountThreshold}</td>
                            <td>
                              {(pricingSettings.baseCreditPrice * (1 - pricingSettings.bulkDiscountPercent / 100)).toFixed(2)} €
                            </td>
                            <td>
                              {(pricingSettings.bulkDiscountThreshold * pricingSettings.baseCreditPrice * (1 - pricingSettings.bulkDiscountPercent / 100)).toFixed(2)} €
                            </td>
                            <td className="text-success">
                              {(pricingSettings.bulkDiscountThreshold * pricingSettings.baseCreditPrice * (pricingSettings.bulkDiscountPercent / 100)).toFixed(2)} €
                            </td>
                          </tr>
                        </tbody>
                      </Table>
                    </div>
                    
                    <Button 
                      variant="danger" 
                      onClick={() => handleSubmit('pricing')}
                      disabled={saving}
                      className="d-flex align-items-center"
                    >
                      {saving ? (
                        <>
                          <Spinner size="sm" className="me-2" />
                          Enregistrement...
                        </>
                      ) : (
                        <>
                          <FaSave className="me-2" /> Enregistrer les paramètres de tarification
                        </>
                      )}
                    </Button>
                  </Form>
                </Card.Body>
              </Card>
            </Tab.Pane>
            
            <Tab.Pane eventKey="integrations" active={activeKey === 'integrations'}>
              <Card className="shadow-sm">
                <Card.Header className="bg-dark text-white">
                  <h5 className="mb-0">Intégrations</h5>
                </Card.Header>
                <Card.Body>
                  <Form>
                    <h6 className="mb-3">Services intégrés</h6>
                    
                    <Form.Group className="mb-3">
                      <Form.Check
                        type="switch"
                        id="paymentGatewayActive"
                        name="paymentGatewayActive"
                        label="Passerelle de paiement"
                        checked={integrationSettings.paymentGatewayActive}
                        onChange={handleIntegrationChange}
                      />
                      <Form.Text className="text-muted d-block ms-4">
                        Active le traitement des paiements en ligne
                      </Form.Text>
                    </Form.Group>
                    
                    <Form.Group className="mb-3">
                      <Form.Check
                        type="switch"
                        id="emailServiceActive"
                        name="emailServiceActive"
                        label="Service d'email"
                        checked={integrationSettings.emailServiceActive}
                        onChange={handleIntegrationChange}
                      />
                      <Form.Text className="text-muted d-block ms-4">
                        Active l'envoi d'emails transactionnels et de notifications
                      </Form.Text>
                    </Form.Group>
                    
                    <Form.Group className="mb-3">
                      <Form.Check
                        type="switch"
                        id="analyticsActive"
                        name="analyticsActive"
                        label="Services d'analytique"
                        checked={integrationSettings.analyticsActive}
                        onChange={handleIntegrationChange}
                      />
                      <Form.Text className="text-muted d-block ms-4">
                        Active la collecte de données d'utilisation anonymisées
                      </Form.Text>
                    </Form.Group>
                    
                    <Form.Group className="mb-4">
                      <Form.Check
                        type="switch"
                        id="apiKeysVisible"
                        name="apiKeysVisible"
                        label="Afficher les clés API"
                        checked={integrationSettings.apiKeysVisible}
                        onChange={handleIntegrationChange}
                      />
                    </Form.Group>
                    
                    {integrationSettings.apiKeysVisible && (
                      <div className="mb-4">
                        <Alert variant="warning">
                          <strong>Attention!</strong> Ces clés sont sensibles. Ne les partagez pas.
                        </Alert>
                        
                        <Table bordered size="sm">
                          <thead>
                            <tr>
                              <th>Service</th>
                              <th>Clé API</th>
                              <th>Statut</th>
                            </tr>
                          </thead>
                          <tbody>
                            <tr>
                              <td>Passerelle de paiement</td>
                              <td>
                                <code>sk_test_***************************</code>
                              </td>
                              <td>
                                <span className="badge bg-success">Active</span>
                              </td>
                            </tr>
                            <tr>
                              <td>Service d'email</td>
                              <td>
                                <code>SG.*******************************</code>
                              </td>
                              <td>
                                <span className="badge bg-success">Active</span>
                              </td>
                            </tr>
                            <tr>
                              <td>Analytique</td>
                              <td>
                                <code>UA-*************-*</code>
                              </td>
                              <td>
                                <span className="badge bg-success">Active</span>
                              </td>
                            </tr>
                          </tbody>
                        </Table>
                      </div>
                    )}
                    
                    <Button 
                      variant="danger" 
                      onClick={() => handleSubmit('integrations')}
                      disabled={saving}
                      className="d-flex align-items-center"
                    >
                      {saving ? (
                        <>
                          <Spinner size="sm" className="me-2" />
                          Enregistrement...
                        </>
                      ) : (
                        <>
                          <FaSave className="me-2" /> Enregistrer les paramètres d'intégration
                        </>
                      )}
                    </Button>
                  </Form>
                </Card.Body>
              </Card>
            </Tab.Pane>
          </Tab.Content>
        </Col>
      </Row>
    </Container>
  );
};

export default AdminSettings; 