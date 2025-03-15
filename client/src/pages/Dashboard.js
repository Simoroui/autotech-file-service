import React, { useContext, useEffect, useState } from 'react';
import { Container, Row, Col, Card, Table, Badge, Button, Form, Modal, Alert, InputGroup, Dropdown } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import axios from 'axios';
import AuthContext from '../context/auth/authContext';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, BarElement, Title, Tooltip, Legend, ArcElement } from 'chart.js';
import { Line } from 'react-chartjs-2';

// Enregistrer les composants ChartJS nécessaires
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
);

// Définir le theme graphique personnalisé
ChartJS.defaults.font.family = '"Poppins", "Helvetica Neue", Arial, sans-serif';
ChartJS.defaults.color = '#495057';
ChartJS.defaults.scale.grid.color = 'rgba(0, 0, 0, 0.05)';

const Dashboard = () => {
  const authContext = useContext(AuthContext);
  const { user, loadUser } = authContext;

  const [files, setFiles] = useState([]);
  const [filteredFiles, setFilteredFiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [weeklyStats, setWeeklyStats] = useState(null);
  
  // États pour le filtrage et le tri
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sortField, setSortField] = useState('createdAt');
  const [sortDirection, setSortDirection] = useState('desc');
  
  // États pour la modal d'ajout de crédits
  const [showCreditsModal, setShowCreditsModal] = useState(false);
  const [creditsAmount, setCreditsAmount] = useState(100);
  const [creditsMessage, setCreditsMessage] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        // Récupérer les fichiers
        const filesRes = await axios.get('/api/ecu-files');
        setFiles(filesRes.data);
        setFilteredFiles(filesRes.data);
        
        // Récupérer les statistiques hebdomadaires (fichiers et crédits)
        const statsRes = await axios.get('/api/auth/weekly-stats');
        
        if (statsRes.data) {
          // Formater les données pour le graphique
          const days = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi', 'Dimanche'];
          
          // Créer un dégradé pour la ligne des fichiers
          const ctx = document.createElement('canvas').getContext('2d');
          const gradientFiles = ctx.createLinearGradient(0, 0, 0, 150);
          gradientFiles.addColorStop(0, 'rgba(220, 53, 69, 0.8)');
          gradientFiles.addColorStop(1, 'rgba(220, 53, 69, 0.1)');
          
          // Créer un dégradé pour la ligne des crédits achetés
          const gradientCredits = ctx.createLinearGradient(0, 0, 0, 150);
          gradientCredits.addColorStop(0, 'rgba(32, 201, 151, 0.8)');
          gradientCredits.addColorStop(1, 'rgba(32, 201, 151, 0.1)');
          
          // Créer un dégradé pour la ligne des crédits disponibles
          const gradientAvailable = ctx.createLinearGradient(0, 0, 0, 150);
          gradientAvailable.addColorStop(0, 'rgba(13, 110, 253, 0.8)');
          gradientAvailable.addColorStop(1, 'rgba(13, 110, 253, 0.1)');
          
          // Utiliser les données de l'API
          setWeeklyStats({
            labels: days,
            datasets: [
              {
                label: 'Fichiers envoyés',
                data: statsRes.data.filesSent,
                fill: {
                  target: 'origin',
                  above: gradientFiles
                },
                backgroundColor: 'rgba(220, 53, 69, 0.7)',
                borderColor: 'rgba(220, 53, 69, 1)',
                borderWidth: 3,
                tension: 0.4,
                pointBackgroundColor: '#fff',
                pointBorderColor: 'rgba(220, 53, 69, 1)',
                pointBorderWidth: 2,
                pointRadius: 4,
                pointHoverRadius: 6,
                pointHoverBackgroundColor: 'rgba(220, 53, 69, 1)',
                pointHoverBorderColor: '#fff',
                pointHoverBorderWidth: 2,
                pointShadowBlur: 10,
                pointShadowColor: 'rgba(220, 53, 69, 0.5)',
                yAxisID: 'y'
              },
              {
                label: 'Crédits achetés',
                data: statsRes.data.creditsBought,
                fill: {
                  target: 'origin',
                  above: gradientCredits
                },
                backgroundColor: 'rgba(32, 201, 151, 0.7)',
                borderColor: 'rgba(32, 201, 151, 1)',
                borderWidth: 3,
                tension: 0.4,
                pointBackgroundColor: '#fff',
                pointBorderColor: 'rgba(32, 201, 151, 1)',
                pointBorderWidth: 2,
                pointRadius: 4,
                pointHoverRadius: 6,
                pointHoverBackgroundColor: 'rgba(32, 201, 151, 1)',
                pointHoverBorderColor: '#fff',
                pointHoverBorderWidth: 2,
                pointShadowBlur: 10,
                pointShadowColor: 'rgba(32, 201, 151, 0.5)',
                yAxisID: 'y1'
              },
              {
                label: 'Crédits disponibles',
                data: statsRes.data.creditsAvailable,
                fill: false,
                backgroundColor: 'rgba(13, 110, 253, 0.7)',
                borderColor: 'rgba(13, 110, 253, 1)',
                borderWidth: 3,
                tension: 0.4,
                pointBackgroundColor: '#fff',
                pointBorderColor: 'rgba(13, 110, 253, 1)',
                pointBorderWidth: 2,
                pointRadius: 4,
                pointHoverRadius: 6,
                pointHoverBackgroundColor: 'rgba(13, 110, 253, 1)',
                pointHoverBorderColor: '#fff',
                pointHoverBorderWidth: 2,
                pointShadowBlur: 10,
                pointShadowColor: 'rgba(13, 110, 253, 0.5)',
                yAxisID: 'y1'
              }
            ]
          });
        } else {
          // Fallback en cas d'erreur ou de données manquantes
          generateEmptyStats();
        }
        
        setLoading(false);
      } catch (err) {
        console.error('Erreur lors du chargement des données:', err);
        setError('Erreur lors du chargement des fichiers');
        
        // En cas d'erreur, générer des stats vides
        generateEmptyStats();
        
        setLoading(false);
      }
    };

    fetchData();
  }, []);
  
  // Fonction pour générer des stats vides en cas d'erreur
  const generateEmptyStats = () => {
    const days = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi', 'Dimanche'];
    
    // Créer un dégradé pour la ligne des fichiers
    const ctx = document.createElement('canvas').getContext('2d');
    const gradientFiles = ctx.createLinearGradient(0, 0, 0, 150);
    gradientFiles.addColorStop(0, 'rgba(220, 53, 69, 0.8)');
    gradientFiles.addColorStop(1, 'rgba(220, 53, 69, 0.1)');
    
    // Créer un dégradé pour la ligne des crédits achetés
    const gradientCredits = ctx.createLinearGradient(0, 0, 0, 150);
    gradientCredits.addColorStop(0, 'rgba(32, 201, 151, 0.8)');
    gradientCredits.addColorStop(1, 'rgba(32, 201, 151, 0.1)');
    
    // Créer un dégradé pour la ligne des crédits disponibles
    const gradientAvailable = ctx.createLinearGradient(0, 0, 0, 150);
    gradientAvailable.addColorStop(0, 'rgba(13, 110, 253, 0.8)');
    gradientAvailable.addColorStop(1, 'rgba(13, 110, 253, 0.1)');
    
    setWeeklyStats({
      labels: days,
      datasets: [
        {
          label: 'Fichiers envoyés',
          data: [0, 0, 0, 0, 0, 0, 0],
          fill: {
            target: 'origin',
            above: gradientFiles
          },
          backgroundColor: 'rgba(220, 53, 69, 0.7)',
          borderColor: 'rgba(220, 53, 69, 1)',
          borderWidth: 3,
          tension: 0.4,
          pointBackgroundColor: '#fff',
          pointBorderColor: 'rgba(220, 53, 69, 1)',
          pointBorderWidth: 2,
          pointRadius: 4,
          pointHoverRadius: 6,
          pointHoverBackgroundColor: 'rgba(220, 53, 69, 1)',
          pointHoverBorderColor: '#fff',
          pointHoverBorderWidth: 2,
          pointShadowBlur: 10,
          pointShadowColor: 'rgba(220, 53, 69, 0.5)',
          yAxisID: 'y'
        },
        {
          label: 'Crédits achetés',
          data: [0, 0, 0, 0, 0, 0, 0],
          fill: {
            target: 'origin',
            above: gradientCredits
          },
          backgroundColor: 'rgba(32, 201, 151, 0.7)',
          borderColor: 'rgba(32, 201, 151, 1)',
          borderWidth: 3,
          tension: 0.4,
          pointBackgroundColor: '#fff',
          pointBorderColor: 'rgba(32, 201, 151, 1)',
          pointBorderWidth: 2,
          pointRadius: 4,
          pointHoverRadius: 6,
          pointHoverBackgroundColor: 'rgba(32, 201, 151, 1)',
          pointHoverBorderColor: '#fff',
          pointHoverBorderWidth: 2,
          pointShadowBlur: 10,
          pointShadowColor: 'rgba(32, 201, 151, 0.5)',
          yAxisID: 'y1'
        },
        {
          label: 'Crédits disponibles',
          data: [0, 0, 0, 0, 0, 0, 0],
          fill: false,
          backgroundColor: 'rgba(13, 110, 253, 0.7)',
          borderColor: 'rgba(13, 110, 253, 1)',
          borderWidth: 3,
          tension: 0.4,
          pointBackgroundColor: '#fff',
          pointBorderColor: 'rgba(13, 110, 253, 1)',
          pointBorderWidth: 2,
          pointRadius: 4,
          pointHoverRadius: 6,
          pointHoverBackgroundColor: 'rgba(13, 110, 253, 1)',
          pointHoverBorderColor: '#fff',
          pointHoverBorderWidth: 2,
          pointShadowBlur: 10,
          pointShadowColor: 'rgba(13, 110, 253, 0.5)',
          yAxisID: 'y1'
        }
      ]
    });
  };

  // Effet pour filtrer et trier les fichiers
  useEffect(() => {
    let result = [...files];
    
    // Filtrage par terme de recherche
    if (searchTerm) {
      result = result.filter(file => 
        `${file.vehicleInfo.manufacturer} ${file.vehicleInfo.model} ${file.vehicleInfo.engine}`
          .toLowerCase()
          .includes(searchTerm.toLowerCase())
      );
    }
    
    // Filtrage par statut
    if (statusFilter !== 'all') {
      result = result.filter(file => file.status === statusFilter);
    }
    
    // Tri des résultats
    result.sort((a, b) => {
      let fieldA, fieldB;
      
      // Déterminer les champs à comparer en fonction du champ de tri
      switch (sortField) {
        case 'vehicle':
          fieldA = `${a.vehicleInfo.manufacturer} ${a.vehicleInfo.model}`.toLowerCase();
          fieldB = `${b.vehicleInfo.manufacturer} ${b.vehicleInfo.model}`.toLowerCase();
          break;
        case 'credits':
          fieldA = a.totalCredits;
          fieldB = b.totalCredits;
          break;
        case 'status':
          fieldA = a.status;
          fieldB = b.status;
          break;
        case 'createdAt':
        default:
          fieldA = new Date(a.createdAt);
          fieldB = new Date(b.createdAt);
          break;
      }
      
      // Tri ascendant ou descendant
      if (sortDirection === 'asc') {
        return fieldA > fieldB ? 1 : -1;
      } else {
        return fieldA < fieldB ? 1 : -1;
      }
    });
    
    setFilteredFiles(result);
  }, [files, searchTerm, statusFilter, sortField, sortDirection]);

  const getStatusBadge = (status) => {
    switch (status) {
      case 'pending':
        return <Badge bg="warning">En attente</Badge>;
      case 'processing':
        return <Badge bg="info">En cours</Badge>;
      case 'completed':
        return <Badge bg="success">Terminé</Badge>;
      default:
        return <Badge bg="secondary">Inconnu</Badge>;
    }
  };

  // Fonction pour changer le tri
  const handleSort = (field) => {
    if (sortField === field) {
      // Si on clique sur le même champ, on inverse la direction
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      // Sinon, on change le champ et on met la direction par défaut (desc)
      setSortField(field);
      setSortDirection('desc');
    }
  };

  // Fonction pour ajouter des crédits
  const handleAddCredits = async () => {
    try {
      const res = await axios.post('/api/auth/add-credits', { credits: creditsAmount });
      setCreditsMessage({ type: 'success', text: res.data.message });
      
      // Recharger les informations de l'utilisateur pour mettre à jour les crédits affichés
      loadUser();
      
      // Fermer la modal après 2 secondes
      setTimeout(() => {
        setShowCreditsModal(false);
        setCreditsMessage(null);
      }, 2000);
    } catch (err) {
      setCreditsMessage({ 
        type: 'danger', 
        text: err.response?.data?.message || 'Erreur lors de l\'ajout des crédits' 
      });
    }
  };

  if (loading) {
    return (
      <div className="d-flex justify-content-center">
        <div className="spinner-border text-danger" role="status">
          <span className="visually-hidden">Chargement...</span>
        </div>
      </div>
    );
  }

  return (
    <>
      <h1 className="mb-4">Tableau de bord</h1>
      <Card className="shadow-sm mb-4">
        <Card.Body>
          <Row>
            <Col md={8}>
              <h5>Bienvenue, {user && user.name}</h5>
              <p className="text-muted">Voici un aperçu de vos fichiers et de votre compte.</p>
            </Col>
            <Col md={4} className="text-md-end">
              <div className="d-grid gap-2 d-md-flex justify-content-md-end">
                <Link to="/upload">
                  <Button variant="danger">
                    <i className="fas fa-upload me-2"></i> Envoyer un fichier
                  </Button>
                </Link>
              </div>
            </Col>
          </Row>
        </Card.Body>
      </Card>

      <Row className="mb-4">
        <Col md={4} className="mb-4 mb-md-0">
          <Card className="shadow-sm h-100">
            <Card.Header className="bg-dark text-white">
              <h5 className="mb-0">Informations du compte</h5>
            </Card.Header>
            <Card.Body>
              <p>
                <strong>Nom :</strong> {user && user.name}
              </p>
              <p>
                <strong>Email :</strong> {user && user.email}
              </p>
              <p>
                <strong>Crédits disponibles :</strong>{' '}
                <span className="badge bg-success">{user && user.credits}</span>
              </p>
              <p>
                <strong>Membre depuis :</strong>{' '}
                {user && new Date(user.createdAt).toLocaleDateString()}
              </p>
              <div className="d-grid">
                <Button variant="outline-danger" onClick={() => setShowCreditsModal(true)}>
                  Acheter des crédits
                </Button>
              </div>
            </Card.Body>
          </Card>
        </Col>
        <Col md={8}>
          <Card className="shadow-sm">
            <Card.Header className="bg-dark text-white">
              <h5 className="mb-0">Statistiques</h5>
            </Card.Header>
            <Card.Body>
              <Row>
                <Col md={3} className="text-center mb-3 mb-md-0">
                  <h2 className="text-danger">{files.length}</h2>
                  <p className="text-muted">Fichiers totaux</p>
                </Col>
                <Col md={3} className="text-center mb-3 mb-md-0">
                  <h2 className="text-danger">
                    {files.filter((file) => file.status === 'completed').length}
                  </h2>
                  <p className="text-muted">Fichiers terminés</p>
                </Col>
                <Col md={3} className="text-center mb-3 mb-md-0">
                  <h2 className="text-danger">
                    {files.filter((file) => file.status === 'pending').length}
                  </h2>
                  <p className="text-muted">En attente</p>
                </Col>
                <Col md={3} className="text-center">
                  <h2 className="text-danger">
                    {files.filter((file) => file.status === 'rejected').length}
                  </h2>
                  <p className="text-muted">Fichiers rejetés</p>
                </Col>
              </Row>
            </Card.Body>
          </Card>
          
          <Card className="shadow-sm mt-4">
            <Card.Header className="bg-dark text-white d-flex justify-content-between align-items-center">
              <h5 className="mb-0">Dernier fichier envoyé</h5>
              <Link to="/history" className="btn btn-sm btn-outline-light">
                Voir tous
              </Link>
            </Card.Header>
            <Card.Body className="p-3">
              {files.length === 0 ? (
                <div className="text-center py-3">
                  <p className="mb-0">Aucun fichier n'a été envoyé pour le moment.</p>
                </div>
              ) : (
                <>
                  {/* Récupérer le dernier fichier (le plus récent) */}
                  {files.length > 0 && (() => {
                    // Trier les fichiers par date (du plus récent au plus ancien)
                    const sortedFiles = [...files].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
                    const lastFile = sortedFiles[0];
                    
                    return (
                      <div className="d-flex flex-column flex-md-row align-items-start">
                        <div className="flex-grow-1">
                          <h6 className="mb-1 text-dark">
                            <i className="fas fa-file-alt me-2 text-danger"></i>
                            {lastFile.filename || 'Fichier ECU'}
                          </h6>
                          <div className="d-flex flex-wrap gap-3 mb-2">
                            <div>
                              <small className="text-muted d-block">Véhicule</small>
                              <span className="fw-semibold">
                                {lastFile.vehicleInfo?.manufacturer} {lastFile.vehicleInfo?.model}
                              </span>
                            </div>
                            <div>
                              <small className="text-muted d-block">Moteur</small>
                              <span className="fw-semibold">{lastFile.vehicleInfo?.engine || 'Non spécifié'}</span>
                            </div>
                            <div>
                              <small className="text-muted d-block">Crédits</small>
                              <span className="fw-semibold text-danger">{lastFile.totalCredits || '0'}</span>
                            </div>
                            <div>
                              <small className="text-muted d-block">Date d'envoi</small>
                              <span className="fw-semibold">
                                {new Date(lastFile.createdAt).toLocaleDateString('fr-FR', {
                                  day: '2-digit',
                                  month: '2-digit',
                                  year: 'numeric',
                                  hour: '2-digit',
                                  minute: '2-digit'
                                })}
                              </span>
                            </div>
                          </div>
                          <div className="d-flex align-items-center gap-3 mt-2">
                            <div>
                              <small className="text-muted d-block">Statut</small>
                              <div>
                                {lastFile.status === 'pending' && (
                                  <Badge bg="warning">En attente</Badge>
                                )}
                                {lastFile.status === 'processing' && (
                                  <Badge bg="info">En cours</Badge>
                                )}
                                {lastFile.status === 'completed' && (
                                  <Badge bg="success">Terminé</Badge>
                                )}
                                {lastFile.status === 'rejected' && (
                                  <Badge bg="danger">Rejeté</Badge>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                        <div className="ms-md-auto mt-3 mt-md-0">
                          <Link to={`/files/${lastFile._id}`}>
                            <Button variant="outline-dark" size="sm">
                              <i className="fas fa-eye me-1"></i> Détails
                            </Button>
                          </Link>
                        </div>
                      </div>
                    );
                  })()}
                </>
              )}
            </Card.Body>
          </Card>
        </Col>
      </Row>

      <Row>
        <Col>
          <Card className="shadow-sm">
            <Card.Header className="bg-dark text-white d-flex justify-content-between align-items-center">
              <h5 className="mb-0">Activité hebdomadaire</h5>
              <Link to="/history" className="btn btn-sm btn-outline-light">
                Historique complet
              </Link>
            </Card.Header>
            <Card.Body className="p-3">
              {files.length === 0 ? (
                <div className="text-center py-4">
                  <p className="mb-3">Vous n'avez pas encore envoyé de fichiers.</p>
                  <Link to="/upload">
                    <Button variant="danger">Envoyer votre premier fichier</Button>
                  </Link>
                </div>
              ) : (
                <>
                  <div className="p-0">
                    {weeklyStats && (
                      <div style={{ width: '100%' }}>
                        <div style={{ height: '200px', width: '100%', maxWidth: '100%', margin: '0 auto' }}>
                          <Line 
                            data={weeklyStats}
                            options={{
                              responsive: true,
                              maintainAspectRatio: true,
                              aspectRatio: 8,
                              plugins: {
                                legend: {
                                  display: true,
                                  position: 'top',
                                  labels: {
                                    usePointStyle: true,
                                    padding: 15,
                                    boxWidth: 8,
                                    font: {
                                      size: 11
                                    }
                                  }
                                },
                                tooltip: {
                                  backgroundColor: 'rgba(33, 37, 41, 0.9)',
                                  titleFont: {
                                    size: 14,
                                    weight: 'bold'
                                  },
                                  bodyFont: {
                                    size: 13
                                  },
                                  padding: 12,
                                  cornerRadius: 6,
                                  caretSize: 6,
                                  displayColors: true,
                                  callbacks: {
                                    title: function(context) {
                                      return context[0].label;
                                    },
                                    label: function(context) {
                                      if (context.dataset.label === 'Fichiers envoyés') {
                                        return `${context.formattedValue} fichier(s) envoyé(s)`;
                                      } else if (context.dataset.label === 'Crédits achetés') {
                                        return `${context.formattedValue} crédit(s) achetés`;
                                      } else {
                                        return `${context.formattedValue} crédit(s) disponibles`;
                                      }
                                    }
                                  }
                                },
                                title: {
                                  display: true,
                                  text: 'Activité hebdomadaire',
                                  color: '#495057',
                                  font: {
                                    size: 16,
                                    weight: 'normal'
                                  },
                                  padding: {
                                    top: 0,
                                    bottom: 15
                                  }
                                }
                              },
                              scales: {
                                y: {
                                  type: 'linear',
                                  display: true,
                                  position: 'left',
                                  title: {
                                    display: true,
                                    text: 'Fichiers',
                                    color: 'rgba(220, 53, 69, 0.8)'
                                  },
                                  beginAtZero: true,
                                  ticks: {
                                    precision: 0,
                                    stepSize: 1,
                                    font: {
                                      size: 11
                                    },
                                    color: 'rgba(220, 53, 69, 0.8)'
                                  },
                                  grid: {
                                    drawBorder: false,
                                    color: 'rgba(0, 0, 0, 0.05)'
                                  }
                                },
                                y1: {
                                  type: 'linear',
                                  display: true,
                                  position: 'right',
                                  title: {
                                    display: true,
                                    text: 'Crédits',
                                    color: 'rgba(32, 201, 151, 0.8)'
                                  },
                                  grid: {
                                    drawOnChartArea: false
                                  },
                                  beginAtZero: true,
                                  ticks: {
                                    precision: 0,
                                    font: {
                                      size: 11
                                    },
                                    color: 'rgba(32, 201, 151, 0.8)'
                                  }
                                },
                                x: {
                                  grid: {
                                    display: false
                                  },
                                  ticks: {
                                    font: {
                                      size: 11
                                    }
                                  }
                                }
                              },
                              layout: {
                                padding: 0
                              },
                              elements: {
                                line: {
                                  borderJoinStyle: 'round'
                                }
                              },
                              animation: {
                                duration: 1500,
                                easing: 'easeOutQuart'
                              }
                            }}
                          />
                        </div>
                      </div>
                    )}
                  </div>
                </>
              )}
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Modal pour ajouter des crédits */}
      <Modal show={showCreditsModal} onHide={() => setShowCreditsModal(false)}>
        <Modal.Header closeButton className="bg-dark text-white">
          <Modal.Title>Ajouter des crédits</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {creditsMessage && (
            <Alert variant={creditsMessage.type}>{creditsMessage.text}</Alert>
          )}
          <Form>
            <Form.Group className="mb-3">
              <Form.Label>Nombre de crédits à ajouter</Form.Label>
              <Form.Control
                type="number"
                value={creditsAmount}
                onChange={(e) => setCreditsAmount(e.target.value)}
                min="1"
              />
              <Form.Text className="text-muted">
                Pour les besoins de test, vous pouvez ajouter autant de crédits que nécessaire.
              </Form.Text>
            </Form.Group>
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowCreditsModal(false)}>
            Annuler
          </Button>
          <Button variant="danger" onClick={handleAddCredits}>
            Ajouter des crédits
          </Button>
        </Modal.Footer>
      </Modal>
    </>
  );
};

export default Dashboard; 