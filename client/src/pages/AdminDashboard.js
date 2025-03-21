import React, { useState, useEffect, useContext } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import AuthContext from '../context/auth/authContext';
import { Card, Row, Col, Badge, Table, Alert, Spinner } from 'react-bootstrap';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend } from 'chart.js';
import { Line } from 'react-chartjs-2';

// Enregistrer les composants ChartJS nécessaires
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

// Définir le theme graphique personnalisé
ChartJS.defaults.font.family = '"Poppins", "Helvetica Neue", Arial, sans-serif';
ChartJS.defaults.color = '#495057';
ChartJS.defaults.scale.grid.color = 'rgba(0, 0, 0, 0.05)';

// Composants de statistiques
const StatCard = ({ title, value, icon, color }) => {
  return (
    <div className={`card border-left-${color} shadow h-100 py-2`}>
      <div className="card-body">
        <div className="row no-gutters align-items-center">
          <div className="col mr-2">
            <div className={`text-xs font-weight-bold text-${color} text-uppercase mb-1`}>
              {title}
            </div>
            <div className="h5 mb-0 font-weight-bold text-gray-800">{value}</div>
          </div>
          <div className="col-auto">
            <i className={`fas ${icon} fa-2x text-gray-300`}></i>
          </div>
        </div>
      </div>
    </div>
  );
};

const AdminDashboard = () => {
  const authContext = useContext(AuthContext);
  const { user } = authContext;

  const [stats, setStats] = useState({
    totalUsers: 0,
    totalFiles: 0,
    pendingFiles: 0,
    completedFiles: 0,
    processingFiles: 0,
    rejectedFiles: 0,
    userStats: {
      adminUsers: 0,
      expertUsers: 0,
      regularUsers: 0
    },
    revenue: 0
  });
  
  const [weeklyStats, setWeeklyStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [recentFiles, setRecentFiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchAdminData = async () => {
      try {
        setLoading(true);
        
        // Récupérer les statistiques
        const statsRes = await axios.get('/api/admin/stats');
        setStats(statsRes.data);
        
        // Récupérer les utilisateurs récents
        const usersRes = await axios.get('/api/admin/users?limit=5');
        setUsers(usersRes.data);
        
        // Récupérer les fichiers récents
        const filesRes = await axios.get('/api/admin/files?limit=5');
        setRecentFiles(filesRes.data);
        
        // Récupérer les statistiques hebdomadaires
        const weeklyStatsRes = await axios.get('/api/admin/weekly-stats');
        
        if (weeklyStatsRes.data) {
          // Formater les données pour le graphique
          const days = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi', 'Dimanche'];
          
          // Créer un dégradé pour la ligne des fichiers
          const ctx = document.createElement('canvas').getContext('2d');
          const gradientFiles = ctx.createLinearGradient(0, 0, 0, 150);
          gradientFiles.addColorStop(0, 'rgba(220, 53, 69, 0.8)');
          gradientFiles.addColorStop(1, 'rgba(220, 53, 69, 0.1)');
          
          // Créer un dégradé pour la ligne des crédits achetés
          const gradientCreditsBought = ctx.createLinearGradient(0, 0, 0, 150);
          gradientCreditsBought.addColorStop(0, 'rgba(32, 201, 151, 0.8)');
          gradientCreditsBought.addColorStop(1, 'rgba(32, 201, 151, 0.1)');
          
          // Créer un dégradé pour la ligne des crédits dépensés
          const gradientCreditsSpent = ctx.createLinearGradient(0, 0, 0, 150);
          gradientCreditsSpent.addColorStop(0, 'rgba(13, 110, 253, 0.8)');
          gradientCreditsSpent.addColorStop(1, 'rgba(13, 110, 253, 0.1)');
          
          // Créer un dégradé pour la ligne des utilisateurs
          const gradientUsers = ctx.createLinearGradient(0, 0, 0, 150);
          gradientUsers.addColorStop(0, 'rgba(255, 193, 7, 0.8)');
          gradientUsers.addColorStop(1, 'rgba(255, 193, 7, 0.1)');
          
          // Créer un dégradé pour la ligne des fichiers rejetés
          const gradientRejected = ctx.createLinearGradient(0, 0, 0, 150);
          gradientRejected.addColorStop(0, 'rgba(108, 117, 125, 0.8)');
          gradientRejected.addColorStop(1, 'rgba(108, 117, 125, 0.1)');
          
          // Utiliser les données de l'API
          setWeeklyStats({
            labels: days,
            datasets: [
              {
                label: 'Fichiers envoyés',
                data: weeklyStatsRes.data.filesSent,
                fill: false,
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
                label: 'Fichiers rejetés',
                data: weeklyStatsRes.data.filesRejected,
                fill: false,
                backgroundColor: 'rgba(108, 117, 125, 0.7)',
                borderColor: 'rgba(108, 117, 125, 1)',
                borderWidth: 3,
                tension: 0.4,
                pointBackgroundColor: '#fff',
                pointBorderColor: 'rgba(108, 117, 125, 1)',
                pointBorderWidth: 2,
                pointRadius: 4,
                pointHoverRadius: 6,
                pointHoverBackgroundColor: 'rgba(108, 117, 125, 1)',
                pointHoverBorderColor: '#fff',
                pointHoverBorderWidth: 2,
                pointShadowBlur: 10,
                pointShadowColor: 'rgba(108, 117, 125, 0.5)',
                yAxisID: 'y'
              },
              {
                label: 'Crédits achetés',
                data: weeklyStatsRes.data.creditsBought,
                fill: false,
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
                label: 'Crédits dépensés',
                data: weeklyStatsRes.data.creditsSpent,
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
              },
              {
                label: 'Total Utilisateurs',
                data: weeklyStatsRes.data.totalUsers,
                fill: false,
                backgroundColor: 'rgba(255, 193, 7, 0.7)',
                borderColor: 'rgba(255, 193, 7, 1)',
                borderWidth: 3,
                tension: 0.4,
                pointBackgroundColor: '#fff',
                pointBorderColor: 'rgba(255, 193, 7, 1)',
                pointBorderWidth: 2,
                pointRadius: 4,
                pointHoverRadius: 6,
                pointHoverBackgroundColor: 'rgba(255, 193, 7, 1)',
                pointHoverBorderColor: '#fff',
                pointHoverBorderWidth: 2,
                pointShadowBlur: 10,
                pointShadowColor: 'rgba(255, 193, 7, 0.5)',
                yAxisID: 'y2'
              }
            ]
          });
        }
        
        setLoading(false);
      } catch (err) {
        console.error('Erreur lors du chargement des données d\'admin:', err);
        setError('Erreur lors du chargement des données d\'administration');
        setLoading(false);
      }
    };
    
    fetchAdminData();
  }, []);

  if (loading) {
    return (
      <div className="d-flex justify-content-center mt-5">
        <Spinner animation="border" variant="primary" />
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="danger" className="mt-3">{error}</Alert>
    );
  }

  return (
    <div className="container-fluid px-4">
      <h1 className="mt-4">Tableau de bord administrateur</h1>
      <p className="lead">Bienvenue, {user && user.name}. Gérez les utilisateurs, fichiers et paramètres du système.</p>
      
      {/* Statistiques */}
      <Row className="mt-4">
        <Col xl={3} md={6} className="mb-4">
          <Card className="border-left-primary h-100 py-2 shadow-sm">
            <Card.Body>
              <Row className="no-gutters align-items-center">
                <Col>
                  <div className="text-xs font-weight-bold text-primary text-uppercase mb-1">
                    Utilisateurs
                  </div>
                  <div className="h5 mb-0 font-weight-bold text-gray-800">{stats.totalUsers}</div>
                </Col>
                <Col xs="auto">
                  <i className="fas fa-users fa-2x text-gray-300"></i>
                </Col>
              </Row>
            </Card.Body>
          </Card>
        </Col>
        
        <Col xl={2} md={6} sm={6} className="mb-4">
          <Card className="border-left-success h-100 py-2 shadow-sm">
            <Card.Body>
              <Row className="no-gutters align-items-center">
                <Col>
                  <div className="text-xs font-weight-bold text-success text-uppercase mb-1">
                    Total des fichiers
                  </div>
                  <div className="h5 mb-0 font-weight-bold text-gray-800">{stats.totalFiles}</div>
                </Col>
                <Col xs="auto">
                  <i className="fas fa-file-alt fa-2x text-gray-300"></i>
                </Col>
              </Row>
            </Card.Body>
          </Card>
        </Col>
        
        <Col xl={2} md={6} sm={6} className="mb-4">
          <Card className="border-left-warning h-100 py-2 shadow-sm">
            <Card.Body>
              <Row className="no-gutters align-items-center">
                <Col>
                  <div className="text-xs font-weight-bold text-warning text-uppercase mb-1">
                    Fichiers en attente
                  </div>
                  <div className="h5 mb-0 font-weight-bold text-gray-800">{stats.pendingFiles}</div>
                </Col>
                <Col xs="auto">
                  <i className="fas fa-clock fa-2x text-gray-300"></i>
                </Col>
              </Row>
            </Card.Body>
          </Card>
        </Col>
        
        <Col xl={2} md={6} sm={6} className="mb-4">
          <Card className="border-left-info h-100 py-2 shadow-sm">
            <Card.Body>
              <Row className="no-gutters align-items-center">
                <Col>
                  <div className="text-xs font-weight-bold text-info text-uppercase mb-1">
                    Fichiers complétés
                  </div>
                  <div className="h5 mb-0 font-weight-bold text-gray-800">{stats.completedFiles}</div>
                </Col>
                <Col xs="auto">
                  <i className="fas fa-check-circle fa-2x text-gray-300"></i>
                </Col>
              </Row>
            </Card.Body>
          </Card>
        </Col>
        
        <Col xl={2} md={6} sm={6} className="mb-4">
          <Card className="border-left-danger h-100 py-2 shadow-sm">
            <Card.Body>
              <Row className="no-gutters align-items-center">
                <Col>
                  <div className="text-xs font-weight-bold text-danger text-uppercase mb-1">
                    Fichiers rejetés
                  </div>
                  <div className="h5 mb-0 font-weight-bold text-gray-800">{stats.rejectedFiles}</div>
                </Col>
                <Col xs="auto">
                  <i className="fas fa-times-circle fa-2x text-gray-300"></i>
                </Col>
              </Row>
            </Card.Body>
          </Card>
        </Col>
      </Row>
      
      {/* Statistiques supplémentaires et Actions rapides */}
      <Row className="mb-4">
        <Col md={4} className="mb-4">
          <Card className="shadow-sm h-100">
            <Card.Header className="bg-light text-dark">
              <h5 className="mb-0">Répartition des utilisateurs</h5>
            </Card.Header>
            <Card.Body>
              <div className="mb-3">
                <div className="d-flex justify-content-between mb-1">
                  <span>Administrateurs</span>
                  <Badge bg="danger">{stats.userStats?.adminUsers || 0}</Badge>
                </div>
                <div className="progress mb-3">
                  <div 
                    className="progress-bar bg-danger" 
                    role="progressbar" 
                    style={{ width: `${stats.totalUsers ? (stats.userStats?.adminUsers / stats.totalUsers) * 100 : 0}%` }}
                    aria-valuenow={stats.userStats?.adminUsers || 0}
                    aria-valuemin="0"
                    aria-valuemax={stats.totalUsers}
                  ></div>
                </div>
                
                <div className="d-flex justify-content-between mb-1">
                  <span>Experts</span>
                  <Badge bg="warning">{stats.userStats?.expertUsers || 0}</Badge>
                </div>
                <div className="progress mb-3">
                  <div 
                    className="progress-bar bg-warning" 
                    role="progressbar" 
                    style={{ width: `${stats.totalUsers ? (stats.userStats?.expertUsers / stats.totalUsers) * 100 : 0}%` }}
                    aria-valuenow={stats.userStats?.expertUsers || 0}
                    aria-valuemin="0"
                    aria-valuemax={stats.totalUsers}
                  ></div>
                </div>
                
                <div className="d-flex justify-content-between mb-1">
                  <span>Utilisateurs standard</span>
                  <Badge bg="primary">{stats.userStats?.regularUsers || 0}</Badge>
                </div>
                <div className="progress">
                  <div 
                    className="progress-bar bg-primary" 
                    role="progressbar" 
                    style={{ width: `${stats.totalUsers ? (stats.userStats?.regularUsers / stats.totalUsers) * 100 : 0}%` }}
                    aria-valuenow={stats.userStats?.regularUsers || 0}
                    aria-valuemin="0"
                    aria-valuemax={stats.totalUsers}
                  ></div>
                </div>
              </div>
            </Card.Body>
            <Card.Footer className="bg-light">
              <Link to="/admin/users" className="btn btn-sm btn-primary">
                Gérer les utilisateurs
              </Link>
            </Card.Footer>
          </Card>
        </Col>
        
        <Col md={4} className="mb-4">
          <Card className="shadow-sm h-100">
            <Card.Header className="bg-light text-dark">
              <h5 className="mb-0">État des fichiers</h5>
            </Card.Header>
            <Card.Body>
              <div className="mb-3">
                <div className="d-flex justify-content-between mb-1">
                  <span>En attente</span>
                  <Badge bg="secondary">{stats.pendingFiles}</Badge>
                </div>
                <div className="progress mb-3">
                  <div 
                    className="progress-bar bg-secondary" 
                    role="progressbar" 
                    style={{ width: `${stats.totalFiles ? (stats.pendingFiles / stats.totalFiles) * 100 : 0}%` }}
                    aria-valuenow={stats.pendingFiles}
                    aria-valuemin="0"
                    aria-valuemax={stats.totalFiles}
                  ></div>
                </div>
                
                <div className="d-flex justify-content-between mb-1">
                  <span>En traitement</span>
                  <Badge bg="warning">{stats.processingFiles}</Badge>
                </div>
                <div className="progress mb-3">
                  <div 
                    className="progress-bar bg-warning" 
                    role="progressbar" 
                    style={{ width: `${stats.totalFiles ? (stats.processingFiles / stats.totalFiles) * 100 : 0}%` }}
                    aria-valuenow={stats.processingFiles}
                    aria-valuemin="0"
                    aria-valuemax={stats.totalFiles}
                  ></div>
                </div>
                
                <div className="d-flex justify-content-between mb-1">
                  <span>Complétés</span>
                  <Badge bg="success">{stats.completedFiles}</Badge>
                </div>
                <div className="progress mb-3">
                  <div 
                    className="progress-bar bg-success" 
                    role="progressbar" 
                    style={{ width: `${stats.totalFiles ? (stats.completedFiles / stats.totalFiles) * 100 : 0}%` }}
                    aria-valuenow={stats.completedFiles}
                    aria-valuemin="0"
                    aria-valuemax={stats.totalFiles}
                  ></div>
                </div>
                
                <div className="d-flex justify-content-between mb-1">
                  <span>Rejetés</span>
                  <Badge bg="danger">{stats.rejectedFiles}</Badge>
                </div>
                <div className="progress">
                  <div 
                    className="progress-bar bg-danger" 
                    role="progressbar" 
                    style={{ width: `${stats.totalFiles ? (stats.rejectedFiles / stats.totalFiles) * 100 : 0}%` }}
                    aria-valuenow={stats.rejectedFiles}
                    aria-valuemin="0"
                    aria-valuemax={stats.totalFiles}
                  ></div>
                </div>
              </div>
            </Card.Body>
            <Card.Footer className="bg-light">
              <Link to="/admin/files" className="btn btn-sm btn-success">
                Gérer les fichiers
              </Link>
            </Card.Footer>
          </Card>
        </Col>
        
        <Col md={4} className="mb-4">
          <Card className="shadow-sm h-100">
            <Card.Header className="bg-light text-dark">
              <h5 className="mb-0">Actions rapides</h5>
            </Card.Header>
            <Card.Body>
              <div className="d-flex flex-column gap-2">
                <Link to="/admin/users" className="btn btn-primary">
                  <i className="fas fa-users me-2"></i> Gérer les utilisateurs
                </Link>
                <Link to="/admin/files" className="btn btn-success">
                  <i className="fas fa-file-alt me-2"></i> Gérer les fichiers
                </Link>
                <Link to="/admin/history" className="btn btn-info">
                  <i className="fas fa-history me-2"></i> Voir l'historique
                </Link>
                <Link to="/admin/settings" className="btn btn-secondary">
                  <i className="fas fa-cog me-2"></i> Paramètres du système
                </Link>
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Graphique d'activité hebdomadaire */}
      <Row className="mb-4">
        <Col>
          <Card className="shadow-sm">
            <Card.Header className="bg-light text-dark d-flex justify-content-between align-items-center">
              <h5 className="mb-0">Activité hebdomadaire</h5>
            </Card.Header>
            <Card.Body className="p-3">
              {!weeklyStats ? (
                <div className="text-center py-4">
                  <p className="mb-0">Aucune donnée disponible pour le moment.</p>
                </div>
              ) : (
                <div className="p-0">
                  <div style={{ width: '100%' }}>
                    <div style={{ height: '350px', width: '100%', maxWidth: '100%', margin: '0 auto' }}>
                      <Line 
                        data={weeklyStats}
                        options={{
                          responsive: true,
                          maintainAspectRatio: false,
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
                                  } else if (context.dataset.label === 'Crédits dépensés') {
                                    return `${context.formattedValue} crédit(s) dépensés`;
                                  } else if (context.dataset.label === 'Total Utilisateurs') {
                                    return `${context.formattedValue} utilisateur(s) total`;
                                  } else if (context.dataset.label === 'Fichiers rejetés') {
                                    return `${context.formattedValue} fichier(s) rejeté(s)`;
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
                            y2: {
                              type: 'linear',
                              display: true,
                              position: 'right',
                              title: {
                                display: true,
                                text: 'Utilisateurs',
                                color: 'rgba(255, 193, 7, 0.8)'
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
                                color: 'rgba(255, 193, 7, 0.8)'
                              },
                              offset: true
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
                            padding: {
                              left: 10,
                              right: 25,
                              top: 25,
                              bottom: 10
                            }
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
                </div>
              )}
            </Card.Body>
          </Card>
        </Col>
      </Row>
      
      {/* Utilisateurs récents et fichiers récents */}
      <Row>
        <Col xl={6} lg={6} className="mb-4">
          <Card className="shadow-sm">
            <Card.Header className="d-flex justify-content-between align-items-center">
              <h5 className="mb-0">Utilisateurs récents</h5>
              <Link to="/admin/users" className="btn btn-sm btn-primary">Voir tous</Link>
            </Card.Header>
            <Card.Body>
              <div className="table-responsive">
                <Table bordered hover>
                  <thead>
                    <tr>
                      <th>Nom</th>
                      <th>Email</th>
                      <th>Rôle</th>
                      <th>Crédits</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.length > 0 ? (
                      users.map(user => (
                        <tr key={user._id}>
                          <td>{user.name}</td>
                          <td>{user.email}</td>
                          <td>
                            <Badge bg={
                              user.role === 'admin' ? 'danger' : 
                              user.role === 'expert' ? 'warning' : 'primary'
                            }>
                              {user.role}
                            </Badge>
                          </td>
                          <td>{user.credits}</td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="4" className="text-center">Aucun utilisateur trouvé</td>
                      </tr>
                    )}
                  </tbody>
                </Table>
              </div>
            </Card.Body>
          </Card>
        </Col>
        
        <Col xl={6} lg={6} className="mb-4">
          <Card className="shadow-sm">
            <Card.Header className="d-flex justify-content-between align-items-center">
              <h5 className="mb-0">Fichiers récents</h5>
              <Link to="/admin/files" className="btn btn-sm btn-success">Voir tous</Link>
            </Card.Header>
            <Card.Body>
              <div className="table-responsive">
                <Table bordered hover>
                  <thead>
                    <tr>
                      <th>Véhicule</th>
                      <th>Utilisateur</th>
                      <th>Statut</th>
                      <th>Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recentFiles.length > 0 ? (
                      recentFiles.map(file => (
                        <tr key={file._id}>
                          <td>{file.vehicleInfo?.manufacturer} {file.vehicleInfo?.model}</td>
                          <td>{file.user?.name}</td>
                          <td>
                            <Badge bg={
                              file.status === 'completed' ? 'success' : 
                              file.status === 'processing' ? 'warning' : 
                              file.status === 'rejected' ? 'danger' : 'secondary'
                            }>
                              {file.status === 'completed' ? 'Complété' : 
                               file.status === 'processing' ? 'En traitement' : 
                               file.status === 'rejected' ? 'Rejeté' : 'En attente'}
                            </Badge>
                          </td>
                          <td>{new Date(file.createdAt).toLocaleDateString()}</td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="4" className="text-center">Aucun fichier trouvé</td>
                      </tr>
                    )}
                  </tbody>
                </Table>
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default AdminDashboard; 