import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Table, Button, Badge, Form, InputGroup, Spinner, Alert } from 'react-bootstrap';
import axios from 'axios';

const Invoices = () => {
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filter, setFilter] = useState('all');
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [downloadLoading, setDownloadLoading] = useState(false);

  // Récupérer les factures réelles depuis l'API
  useEffect(() => {
    const fetchInvoices = async () => {
      try {
        const res = await axios.get('/api/invoices');
        setInvoices(res.data);
        setLoading(false);
      } catch (err) {
        setError('Erreur lors du chargement des factures. Veuillez réessayer plus tard.');
        setLoading(false);
        console.error('Erreur lors du chargement des factures:', err);
      }
    };

    fetchInvoices();
  }, []);

  // Filtrer les factures en fonction du terme de recherche et du filtre
  const filteredInvoices = invoices.filter(invoice => {
    const matchesSearch = invoice.id?.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          invoice.date?.includes(searchTerm);
    
    if (filter === 'all') return matchesSearch;
    if (filter === 'paid') return matchesSearch && invoice.status === 'paid';
    if (filter === 'pending') return matchesSearch && invoice.status === 'pending';
    
    return matchesSearch;
  });

  // Fonction pour afficher le statut avec un badge coloré
  const renderStatus = (status) => {
    if (status === 'paid') return <Badge bg="success">Payée</Badge>;
    if (status === 'pending') return <Badge bg="warning">En attente</Badge>;
    if (status === 'cancelled') return <Badge bg="danger">Annulée</Badge>;
    return <Badge bg="secondary">{status}</Badge>;
  };

  // Fonction pour afficher la méthode de paiement
  const renderPaymentMethod = (method) => {
    if (method === 'card') return <><i className="fas fa-credit-card me-1"></i> Carte bancaire</>;
    if (method === 'paypal') return <><i className="fab fa-paypal me-1"></i> PayPal</>;
    if (method === 'transfer') return <><i className="fas fa-university me-1"></i> Virement bancaire</>;
    return method;
  };

  // Fonction pour ouvrir le détail d'une facture
  const openInvoiceDetail = (invoice) => {
    setSelectedInvoice(invoice);
  };

  // Fonction pour télécharger une facture
  const downloadInvoice = async (invoiceId) => {
    setDownloadLoading(true);
    
    try {
      const response = await axios.get(`/api/invoices/${invoiceId}/download`, {
        responseType: 'blob'
      });
      
      // Créer un URL pour le blob
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `facture-${invoiceId}.pdf`);
      document.body.appendChild(link);
      link.click();
      
      // Nettoyer
      window.URL.revokeObjectURL(url);
      document.body.removeChild(link);
      setDownloadLoading(false);
    } catch (err) {
      console.error('Erreur lors du téléchargement de la facture:', err);
      setError('Erreur lors du téléchargement de la facture. Veuillez réessayer plus tard.');
      setDownloadLoading(false);
    }
  };

  // Fonction pour fermer le détail d'une facture
  const closeInvoiceDetail = () => {
    setSelectedInvoice(null);
  };

  // Formater la date en format français
  const formatDate = (dateString) => {
    if (!dateString) return '';
    const options = { year: 'numeric', month: 'long', day: 'numeric' };
    return new Date(dateString).toLocaleDateString('fr-FR', options);
  };

  if (loading) {
    return (
      <Container className="py-5">
        <div className="text-center">
          <Spinner animation="border" variant="danger" />
          <p className="mt-3">Chargement des factures...</p>
        </div>
      </Container>
    );
  }

  return (
    <Container fluid className="py-4">
      <h1 className="mb-4">Mes factures</h1>
      
      {error && <Alert variant="danger">{error}</Alert>}
      
      {invoices.length === 0 && !loading && !error ? (
        <Alert variant="info">
          Vous n'avez pas encore de factures. Elles apparaîtront ici lorsque vous achèterez des crédits.
        </Alert>
      ) : (
        <Row>
          <Col lg={selectedInvoice ? 7 : 12}>
            <Card className="shadow-sm mb-4">
              <Card.Header className="bg-dark text-white d-flex justify-content-between align-items-center">
                <h3 className="mb-0">Historique de facturation</h3>
              </Card.Header>
              <Card.Body>
                <Row className="mb-3">
                  <Col md={6}>
                    <InputGroup>
                      <InputGroup.Text>
                        <i className="fas fa-search"></i>
                      </InputGroup.Text>
                      <Form.Control
                        placeholder="Rechercher une facture..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                      />
                    </InputGroup>
                  </Col>
                  <Col md={6}>
                    <Form.Select 
                      value={filter}
                      onChange={(e) => setFilter(e.target.value)}
                    >
                      <option value="all">Toutes les factures</option>
                      <option value="paid">Factures payées</option>
                      <option value="pending">Factures en attente</option>
                    </Form.Select>
                  </Col>
                </Row>
                
                {filteredInvoices.length === 0 ? (
                  <Alert variant="info">
                    Aucune facture trouvée correspondant à vos critères de recherche.
                  </Alert>
                ) : (
                  <Table responsive hover className="align-middle">
                    <thead>
                      <tr>
                        <th>N° Facture</th>
                        <th>Date</th>
                        <th>Montant</th>
                        <th>Statut</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredInvoices.map(invoice => (
                        <tr key={invoice.id} className={selectedInvoice?.id === invoice.id ? 'table-active' : ''}>
                          <td>{invoice.id}</td>
                          <td>{formatDate(invoice.date)}</td>
                          <td>{invoice.amount} DT ht</td>
                          <td>{renderStatus(invoice.status)}</td>
                          <td>
                            <Button
                              variant="outline-secondary"
                              size="sm"
                              className="me-2"
                              onClick={() => openInvoiceDetail(invoice)}
                            >
                              <i className="fas fa-eye"></i>
                            </Button>
                            <Button
                              variant="outline-danger"
                              size="sm"
                              onClick={() => downloadInvoice(invoice.id)}
                              disabled={downloadLoading}
                            >
                              {downloadLoading ? (
                                <Spinner animation="border" size="sm" />
                              ) : (
                                <i className="fas fa-download"></i>
                              )}
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </Table>
                )}
              </Card.Body>
            </Card>
          </Col>
          
          {selectedInvoice && (
            <Col lg={5}>
              <Card className="shadow-sm">
                <Card.Header className="bg-dark text-white d-flex justify-content-between align-items-center">
                  <h3 className="mb-0">Détail de la facture</h3>
                  <Button variant="light" size="sm" onClick={closeInvoiceDetail}>
                    <i className="fas fa-times"></i>
                  </Button>
                </Card.Header>
                <Card.Body>
                  <Row className="mb-4">
                    <Col>
                      <h5>Facture {selectedInvoice.id}</h5>
                      <p className="text-muted mb-0">Date: {formatDate(selectedInvoice.date)}</p>
                      <p className="text-muted mb-0">Statut: {renderStatus(selectedInvoice.status)}</p>
                      <p className="text-muted">Méthode de paiement: {renderPaymentMethod(selectedInvoice.paymentMethod)}</p>
                    </Col>
                  </Row>
                  
                  <Table bordered className="mb-4">
                    <thead className="table-light">
                      <tr>
                        <th>Produit</th>
                        <th className="text-center">Qté</th>
                        <th className="text-end">Prix</th>
                        <th className="text-end">Total</th>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedInvoice.items?.map((item, index) => (
                        <tr key={index}>
                          <td>{item.name}</td>
                          <td className="text-center">{item.quantity}</td>
                          <td className="text-end">{item.price} DT ht</td>
                          <td className="text-end">{item.total} DT ht</td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot>
                      <tr className="fw-bold">
                        <td colSpan="3" className="text-end">Total:</td>
                        <td className="text-end">{selectedInvoice.amount} DT ht</td>
                      </tr>
                    </tfoot>
                  </Table>
                  
                  <div className="d-grid">
                    <Button 
                      variant="danger" 
                      onClick={() => downloadInvoice(selectedInvoice.id)}
                      disabled={downloadLoading}
                    >
                      {downloadLoading ? (
                        <>
                          <Spinner as="span" animation="border" size="sm" role="status" aria-hidden="true" className="me-2" />
                          Téléchargement...
                        </>
                      ) : (
                        <>
                          <i className="fas fa-file-pdf me-2"></i>
                          Télécharger la facture (PDF)
                        </>
                      )}
                    </Button>
                  </div>
                </Card.Body>
              </Card>
            </Col>
          )}
        </Row>
      )}
    </Container>
  );
};

export default Invoices; 