import React, { useState, useContext } from 'react';
import { Container, Row, Col, Card, Button, Form, Alert, InputGroup, Spinner } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import AuthContext from '../context/auth/authContext';

const BuyCredits = () => {
  const [selectedPack, setSelectedPack] = useState(null);
  const [paymentMethod, setPaymentMethod] = useState('card');
  const [showSuccess, setShowSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [invoiceId, setInvoiceId] = useState(null);
  const navigate = useNavigate();
  const authContext = useContext(AuthContext);
  const [quantities, setQuantities] = useState({
    1: 1,
    2: 1,
    3: 1,
    4: 1,
    5: 1
  });

  const creditPacks = [
    { id: 1, credits: 1, price: 8, popular: false },
    { id: 2, credits: 25, price: 190, popular: false },
    { id: 3, credits: 50, price: 370, popular: true },
    { id: 4, credits: 100, price: 720, popular: false },
    { id: 5, credits: 1000, price: 7000, popular: false }
  ];

  const handlePackSelect = (packId) => {
    setSelectedPack(packId);
    setError(null);
  };

  const handleQuantityChange = (packId, newQuantity) => {
    if (newQuantity > 0 && newQuantity <= 10) {
      setQuantities({
        ...quantities,
        [packId]: newQuantity
      });
    }
  };

  const handlePaymentMethodChange = (e) => {
    setPaymentMethod(e.target.value);
  };

  const getTotalPrice = () => {
    if (!selectedPack) return 0;
    const pack = creditPacks.find(p => p.id === selectedPack);
    return pack.price * quantities[selectedPack];
  };

  const getTotalCredits = () => {
    if (!selectedPack) return 0;
    const pack = creditPacks.find(p => p.id === selectedPack);
    return pack.credits * quantities[selectedPack];
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!selectedPack) {
      setError('Veuillez sélectionner un pack de crédits');
      return;
    }

    setLoading(true);
    setError(null);
    
    try {
      const selectedPackData = creditPacks.find(p => p.id === selectedPack);
      
      // Préparer les données pour la création de facture
      const purchaseData = {
        packId: selectedPack,
        quantity: quantities[selectedPack],
        totalPrice: getTotalPrice(),
        totalCredits: getTotalCredits(),
        paymentMethod: paymentMethod,
        items: [{
          name: `Pack ${selectedPackData.credits} crédit${selectedPackData.credits > 1 ? 's' : ''}`,
          quantity: quantities[selectedPack],
          price: selectedPackData.price,
          total: selectedPackData.price * quantities[selectedPack]
        }]
      };
      
      // Appel API pour créer l'achat et générer la facture
      const res = await axios.post('/api/credits/purchase', purchaseData);
      
      // Mettre à jour le nombre de crédits de l'utilisateur
      authContext.loadUser();
      
      setInvoiceId(res.data.invoiceId);
      setShowSuccess(true);
      setLoading(false);
      
      // Rediriger vers la page de facture après 3 secondes
      setTimeout(() => {
        navigate(`/invoices`);
      }, 3000);
    } catch (err) {
      console.error('Erreur lors de l\'achat de crédits:', err);
      setError(err.response?.data?.msg || 'Une erreur est survenue lors de l\'achat. Veuillez réessayer.');
      setLoading(false);
    }
  };

  return (
    <Container fluid className="py-4">
      <h1 className="mb-4">Acheter des crédits</h1>
      
      {error && (
        <Alert variant="danger" className="mb-4">
          <Alert.Heading>Erreur</Alert.Heading>
          <p>{error}</p>
        </Alert>
      )}
      
      {showSuccess && (
        <Alert variant="success" className="mb-4">
          <Alert.Heading>Achat réussi !</Alert.Heading>
          <p>Vos crédits ont été ajoutés à votre compte et votre facture a été générée.</p>
          <p>Vous allez être redirigé vers la page de vos factures dans quelques instants...</p>
          <div className="d-flex justify-content-end">
            <Button variant="outline-success" onClick={() => navigate('/invoices')}>
              Voir mes factures
            </Button>
          </div>
        </Alert>
      )}
      
      <Row className="mb-4">
        <Col lg={8}>
          <Card className="shadow-sm mb-4">
            <Card.Header className="bg-dark text-white">
              <h3 className="mb-0">Choisissez votre pack</h3>
            </Card.Header>
            <Card.Body>
              <Row>
                {creditPacks.map(pack => (
                  <Col md={4} key={pack.id} className="mb-4">
                    <Card 
                      className={`h-100 ${selectedPack === pack.id ? 'border-danger' : ''} ${pack.popular ? 'border-warning' : ''}`}
                      onClick={() => handlePackSelect(pack.id)}
                      style={{ cursor: 'pointer', transition: 'all 0.2s ease' }}
                    >
                      <Card.Header className={`text-center py-3 ${pack.popular ? 'bg-warning' : (selectedPack === pack.id ? 'bg-danger text-white' : '')}`}>
                        {pack.popular && <div className="ribbon">Populaire</div>}
                        <h4 className="mb-0">{pack.credits} crédit{pack.credits > 1 ? 's' : ''}</h4>
                      </Card.Header>
                      <Card.Body className="text-center">
                        <h2 className="text-danger mb-0">{pack.price} DT ht</h2>
                        <p className="text-muted">{(pack.price / pack.credits).toFixed(2)} DT ht par crédit</p>
                        {pack.credits > 1 && (
                          <p className="text-success fw-bold">
                            {Math.round((1 - (pack.price / pack.credits) / 8) * 100)}% d'économie
                          </p>
                        )}
                        
                        <InputGroup className="mt-3">
                          <Button 
                            variant="outline-secondary" 
                            onClick={(e) => {
                              e.stopPropagation();
                              handleQuantityChange(pack.id, quantities[pack.id] - 1);
                            }}
                          >
                            -
                          </Button>
                          <Form.Control 
                            className="text-center"
                            value={quantities[pack.id]}
                            readOnly
                            onClick={(e) => e.stopPropagation()}
                          />
                          <Button 
                            variant="outline-secondary" 
                            onClick={(e) => {
                              e.stopPropagation();
                              handleQuantityChange(pack.id, quantities[pack.id] + 1);
                            }}
                          >
                            +
                          </Button>
                        </InputGroup>
                      </Card.Body>
                      <Card.Footer className="bg-light text-center">
                        <Button 
                          variant={selectedPack === pack.id ? "danger" : "outline-danger"} 
                          onClick={() => handlePackSelect(pack.id)}
                        >
                          Sélectionner
                        </Button>
                      </Card.Footer>
                    </Card>
                  </Col>
                ))}
              </Row>
            </Card.Body>
          </Card>
        </Col>
        
        <Col lg={4}>
          <Card className="shadow-sm">
            <Card.Header className="bg-dark text-white">
              <h3 className="mb-0">Paiement</h3>
            </Card.Header>
            <Card.Body>
              {selectedPack && (
                <div className="mb-4 p-3 bg-light rounded">
                  <h5>Récapitulatif de commande</h5>
                  <div className="d-flex justify-content-between align-items-center">
                    <span>Pack sélectionné:</span>
                    <span>{creditPacks.find(p => p.id === selectedPack)?.credits} crédits</span>
                  </div>
                  <div className="d-flex justify-content-between align-items-center">
                    <span>Quantité:</span>
                    <span>{quantities[selectedPack]}</span>
                  </div>
                  <div className="d-flex justify-content-between align-items-center">
                    <span>Prix unitaire:</span>
                    <span>{creditPacks.find(p => p.id === selectedPack)?.price} DT ht</span>
                  </div>
                  <hr />
                  <div className="d-flex justify-content-between align-items-center fw-bold">
                    <span>Total:</span>
                    <span>{getTotalPrice()} DT ht ({getTotalCredits()} crédits)</span>
                  </div>
                </div>
              )}
              
              <Form onSubmit={handleSubmit}>
                <Form.Group className="mb-3">
                  <Form.Label>Méthode de paiement</Form.Label>
                  <Form.Select 
                    value={paymentMethod} 
                    onChange={handlePaymentMethodChange}
                    disabled={loading}
                  >
                    <option value="card">Carte bancaire</option>
                    <option value="paypal">PayPal</option>
                    <option value="transfer">Virement bancaire</option>
                  </Form.Select>
                </Form.Group>
                
                {paymentMethod === 'card' && (
                  <>
                    <Form.Group className="mb-3">
                      <Form.Label>Numéro de carte</Form.Label>
                      <Form.Control type="text" placeholder="XXXX XXXX XXXX XXXX" disabled={loading} />
                    </Form.Group>
                    
                    <Row>
                      <Col>
                        <Form.Group className="mb-3">
                          <Form.Label>Date d'expiration</Form.Label>
                          <Form.Control type="text" placeholder="MM/AA" disabled={loading} />
                        </Form.Group>
                      </Col>
                      <Col>
                        <Form.Group className="mb-3">
                          <Form.Label>CVV</Form.Label>
                          <Form.Control type="text" placeholder="XXX" disabled={loading} />
                        </Form.Group>
                      </Col>
                    </Row>
                  </>
                )}
                
                {paymentMethod === 'paypal' && (
                  <div className="text-center my-4">
                    <p>Vous serez redirigé vers PayPal pour finaliser votre paiement.</p>
                    <i className="fab fa-paypal fa-3x text-primary"></i>
                  </div>
                )}
                
                {paymentMethod === 'transfer' && (
                  <div className="my-3">
                    <p>Détails pour le virement bancaire :</p>
                    <p><strong>IBAN :</strong> FR76 XXXX XXXX XXXX XXXX XXXX XXX</p>
                    <p><strong>BIC :</strong> XXXXXXXX</p>
                    <p><strong>Banque :</strong> Banque Exemple</p>
                    <p className="mb-0"><small>Veuillez indiquer votre identifiant utilisateur en référence du virement.</small></p>
                  </div>
                )}
                
                <div className="d-grid gap-2 mt-4">
                  <Button 
                    variant="danger" 
                    size="lg" 
                    type="submit" 
                    disabled={!selectedPack || loading}
                  >
                    {loading ? (
                      <>
                        <Spinner animation="border" size="sm" className="me-2" />
                        Traitement en cours...
                      </>
                    ) : (
                      selectedPack 
                        ? `Payer ${getTotalPrice()} DT ht` 
                        : 'Sélectionnez un pack'
                    )}
                  </Button>
                </div>
              </Form>
            </Card.Body>
          </Card>
        </Col>
      </Row>
      
      <Row>
        <Col lg={12}>
          <Card className="shadow-sm bg-light">
            <Card.Body className="p-4">
              <h4>Questions fréquentes</h4>
              
              <div className="mt-3">
                <h5>Comment utiliser mes crédits ?</h5>
                <p>
                  Les crédits sont utilisés automatiquement lorsque vous envoyez un fichier pour traitement.
                  Le nombre de crédits nécessaires dépend du type de service que vous sélectionnez.
                </p>
              </div>
              
              <div className="mt-3">
                <h5>Les crédits expirent-ils ?</h5>
                <p>
                  Non, vos crédits n'expirent jamais et restent disponibles sur votre compte jusqu'à leur utilisation.
                </p>
              </div>
              
              <div className="mt-3">
                <h5>Puis-je obtenir une facture ?</h5>
                <p>
                  Oui, une facture est automatiquement générée pour chaque achat de crédits. 
                  Vous pouvez les consulter et les télécharger dans la section "Facturation" de votre compte.
                </p>
              </div>
              
              <div className="mt-3">
                <h5>Comment fonctionne le paiement ?</h5>
                <p>
                  Nous proposons plusieurs méthodes de paiement : carte bancaire, PayPal, et virement bancaire.
                  Pour les virements bancaires, vos crédits seront ajoutés à votre compte une fois le paiement confirmé par notre équipe.
                </p>
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
};

export default BuyCredits; 