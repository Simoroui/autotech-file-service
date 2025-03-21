import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Table, Button, Badge, Form, InputGroup, Spinner, Alert, Tabs, Tab } from 'react-bootstrap';
import axios from 'axios';

const AdminInvoices = () => {
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filter, setFilter] = useState('all');
  const [userFilter, setUserFilter] = useState('all');
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [downloadLoading, setDownloadLoading] = useState(false);
  const [users, setUsers] = useState([]);
  const [statistics, setStatistics] = useState({
    totalRevenue: 0,
    invoiceCount: 0,
    paidCount: 0,
    pendingCount: 0
  });

  // Récupérer les factures et les données statistiques réelles depuis l'API
  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await axios.get('/api/admin/invoices');
        setInvoices(res.data.invoices);
        setUsers(res.data.users);
        
        // Mettre à jour les statistiques avec les données réelles
        setStatistics({
          totalRevenue: res.data.statistics.totalRevenue,
          invoiceCount: res.data.statistics.invoiceCount,
          paidCount: res.data.statistics.paidCount,
          pendingCount: res.data.statistics.pendingCount
        });
        
        setLoading(false);
      } catch (err) {
        setError('Erreur lors du chargement des factures. Veuillez réessayer plus tard.');
        setLoading(false);
        console.error('Erreur lors du chargement des factures:', err);
      }
    };

    fetchData();
  }, []);

  // Filtrer les factures en fonction du terme de recherche et des filtres
  const filteredInvoices = invoices.filter(invoice => {
    const matchesSearch = 
      invoice.id?.toLowerCase().includes(searchTerm.toLowerCase()) || 
      invoice.userName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      invoice.userEmail?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      invoice.date?.includes(searchTerm);
    
    const matchesStatus = filter === 'all' || invoice.status === filter;
    const matchesUser = userFilter === 'all' || invoice.userId === userFilter;
    
    return matchesSearch && matchesStatus && matchesUser;
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
      const response = await axios.get(`/api/admin/invoices/${invoiceId}/download`, {
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

  // Fonction pour marquer une facture comme payée
  const markAsPaid = async (invoiceId) => {
    try {
      await axios.put(`/api/admin/invoices/${invoiceId}/status`, { status: 'paid' });
      
      // Mettre à jour l'état local après confirmation du serveur
      setInvoices(invoices.map(inv => 
        inv.id === invoiceId ? { ...inv, status: 'paid' } : inv
      ));
      
      if (selectedInvoice && selectedInvoice.id === invoiceId) {
        setSelectedInvoice({ ...selectedInvoice, status: 'paid' });
      }
      
      // Mettre à jour les statistiques
      setStatistics({
        ...statistics,
        paidCount: statistics.paidCount + 1,
        pendingCount: statistics.pendingCount - 1
      });
      
      // Afficher un message de confirmation
      alert(`La facture ${invoiceId} a été marquée comme payée`);
    } catch (err) {
      console.error('Erreur lors de la mise à jour du statut:', err);
      setError('Erreur lors de la mise à jour du statut. Veuillez réessayer plus tard.');
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

  // Fonction pour exporter toutes les factures en CSV
  const exportCSV = async () => {
    try {
      const response = await axios.get('/api/admin/invoices/export', {
        responseType: 'blob'
      });
      
      // Créer un URL pour le blob
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `factures-export-${new Date().toISOString().slice(0, 10)}.csv`);
      document.body.appendChild(link);
      link.click();
      
      // Nettoyer
      window.URL.revokeObjectURL(url);
      document.body.removeChild(link);
    } catch (err) {
      console.error('Erreur lors de l\'exportation des factures:', err);
      setError('Erreur lors de l\'exportation des factures. Veuillez réessayer plus tard.');
    }
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
      <h1 className="mb-4">Gestion des factures</h1>
      
      {error && <Alert variant="danger">{error}</Alert>}
      
      <Tabs defaultActiveKey="invoices" className="mb-4">
        <Tab eventKey="invoices" title="Factures">
          <Row>
            <Col lg={selectedInvoice ? 7 : 12}>
              <Card className="shadow-sm mb-4">
                <Card.Header className="bg-light text-dark">
                  <div className="d-flex justify-content-between align-items-center">
                    <h3 className="mb-0">Liste des factures</h3>
                    <div>
                      <Button variant="light" size="sm" className="me-2" onClick={exportCSV}>
                        <i className="fas fa-file-export me-1"></i> Exporter CSV
                      </Button>
                    </div>
                  </div>
                </Card.Header>
                <Card.Body>
                  <Row className="mb-3">
                    <Col md={4}>
                      <InputGroup>
                        <InputGroup.Text>
                          <i className="fas fa-search"></i>
                        </InputGroup.Text>
                        <Form.Control
                          placeholder="Rechercher..."
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                        />
                      </InputGroup>
                    </Col>
                    <Col md={4}>
                      <Form.Select 
                        value={userFilter}
                        onChange={(e) => setUserFilter(e.target.value)}
                      >
                        <option value="all">Tous les clients</option>
                        {users.map(user => (
                          <option key={user.id} value={user.id}>{user.name}</option>
                        ))}
                      </Form.Select>
                    </Col>
                    <Col md={4}>
                      <Form.Select 
                        value={filter}
                        onChange={(e) => setFilter(e.target.value)}
                      >
                        <option value="all">Tous les statuts</option>
                        <option value="paid">Payées</option>
                        <option value="pending">En attente</option>
                        <option value="cancelled">Annulées</option>
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
                          <th>Client</th>
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
                            <td>
                              <div>{invoice.userName}</div>
                              <small className="text-muted">{invoice.userEmail}</small>
                            </td>
                            <td>{invoice.amount} DT ht</td>
                            <td>{renderStatus(invoice.status)}</td>
                            <td>
                              <Button
                                variant="outline-secondary"
                                size="sm"
                                className="me-1"
                                onClick={() => openInvoiceDetail(invoice)}
                              >
                                <i className="fas fa-eye"></i>
                              </Button>
                              <Button
                                variant="outline-danger"
                                size="sm"
                                className="me-1"
                                onClick={() => downloadInvoice(invoice.id)}
                                disabled={downloadLoading}
                              >
                                {downloadLoading ? (
                                  <Spinner animation="border" size="sm" />
                                ) : (
                                  <i className="fas fa-download"></i>
                                )}
                              </Button>
                              {invoice.status === 'pending' && (
                                <Button
                                  variant="outline-success"
                                  size="sm"
                                  onClick={() => markAsPaid(invoice.id)}
                                >
                                  <i className="fas fa-check"></i>
                                </Button>
                              )}
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
                  <Card.Header className="bg-light text-dark d-flex justify-content-between align-items-center">
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
                        <p className="text-muted mb-0">Client: {selectedInvoice.userName}</p>
                        <p className="text-muted">Email: {selectedInvoice.userEmail}</p>
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
                    
                    <div className="d-grid gap-2">
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
                      
                      {selectedInvoice.status === 'pending' && (
                        <Button 
                          variant="success" 
                          onClick={() => markAsPaid(selectedInvoice.id)}
                        >
                          <i className="fas fa-check me-2"></i>
                          Marquer comme payée
                        </Button>
                      )}
                    </div>
                  </Card.Body>
                </Card>
              </Col>
            )}
          </Row>
        </Tab>
        
        <Tab eventKey="stats" title="Statistiques">
          <Card className="shadow-sm">
            <Card.Header className="bg-light text-dark">
              <h3 className="mb-0">Statistiques de facturation</h3>
            </Card.Header>
            <Card.Body>
              <Row>
                <Col md={3} className="mb-4">
                  <Card className="bg-primary text-dark">
                    <Card.Body className="text-center py-4">
                      <h1>{statistics.invoiceCount}</h1>
                      <h5>Factures totales</h5>
                    </Card.Body>
                  </Card>
                </Col>
                
                <Col md={3} className="mb-4">
                  <Card className="bg-success text-dark">
                    <Card.Body className="text-center py-4">
                      <h1>{statistics.paidCount}</h1>
                      <h5>Factures payées</h5>
                    </Card.Body>
                  </Card>
                </Col>
                
                <Col md={3} className="mb-4">
                  <Card className="bg-warning text-dark">
                    <Card.Body className="text-center py-4">
                      <h1>{statistics.pendingCount}</h1>
                      <h5>Factures en attente</h5>
                    </Card.Body>
                  </Card>
                </Col>
                
                <Col md={3} className="mb-4">
                  <Card className="bg-danger text-dark">
                    <Card.Body className="text-center py-4">
                      <h1>{statistics.totalRevenue.toLocaleString('fr-FR')} DT</h1>
                      <h5>Revenus totaux</h5>
                    </Card.Body>
                  </Card>
                </Col>
              </Row>
              
              <p className="text-muted mt-3">
                * Les statistiques sont calculées en temps réel sur la base des factures enregistrées dans le système.
              </p>
            </Card.Body>
          </Card>
        </Tab>
      </Tabs>
    </Container>
  );
};

export default AdminInvoices; 