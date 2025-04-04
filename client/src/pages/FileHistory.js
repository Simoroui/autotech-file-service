import React, { useState, useEffect, useContext } from 'react';
import { Container, Row, Col, Card, Table, Form, Spinner, Badge, Alert, Pagination } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import axios from 'axios';
import AuthContext from '../context/auth/authContext';
import { FaSortAmountDown, FaSortAmountUp, FaEye, FaClock, FaCar, FaTag, FaCoins } from 'react-icons/fa';

const FileHistory = () => {
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [error, setError] = useState(null);
  const [sortField, setSortField] = useState('date');
  const [sortDirection, setSortDirection] = useState('desc');
  const [currentPage, setCurrentPage] = useState(1);
  const [filesPerPage] = useState(10);
  
  const authContext = useContext(AuthContext);
  const { token, user } = authContext;

  const statusColors = {
    pending: 'warning',
    processing: 'info',
    completed: 'success',
    rejected: 'danger'
  };

  const statusLabels = {
    pending: 'En attente',
    processing: 'En traitement',
    completed: 'Terminé',
    rejected: 'Rejeté'
  };

  useEffect(() => {
    const fetchFiles = async () => {
      try {
        setLoading(true);
        console.log('Récupération des fichiers avec le token:', token?.substring(0, 10) + '...');
        console.log('Utilisateur actuel:', user ? `${user.name} (${user.role})` : 'Non connecté');
        
        if (!token) {
          console.error('Pas de token disponible');
          setError('Authentification requise');
          setLoading(false);
          return;
        }
        
        // Utiliser l'URL complète pour éviter les problèmes de proxy
        const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:5000';
        console.log('URL API utilisée:', `${apiUrl}/api/ecu-files`);
        
        const res = await axios.get(`${apiUrl}/api/ecu-files`, {
          headers: { 'x-auth-token': token }
        });
        
        console.log('Données reçues:', res.data);
        
        if (Array.isArray(res.data)) {
          // Trier les fichiers par date de création (du plus récent au plus ancien par défaut)
          const sortedFiles = res.data.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
          
          console.log(`${sortedFiles.length} fichiers récupérés et triés`);
          setFiles(sortedFiles);
        } else {
          console.error('Format de données inattendu:', res.data);
          setError('Format de données inattendu');
        }
        
        setLoading(false);
      } catch (err) {
        console.error('Erreur lors de la récupération des fichiers:', err);
        console.error('Détails de l\'erreur:', err.response ? err.response.data : 'Pas de réponse du serveur');
        setError('Impossible de récupérer l\'historique des fichiers');
        setLoading(false);
      }
    };

    fetchFiles();
  }, [token, user]);

  // Fonction pour formater la date
  const formatDate = (dateString) => {
    const options = { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    };
    return new Date(dateString).toLocaleDateString('fr-FR', options);
  };

  // Fonction pour trier les fichiers
  const handleSort = (field) => {
    const newDirection = field === sortField && sortDirection === 'asc' ? 'desc' : 'asc';
    setSortField(field);
    setSortDirection(newDirection);
    
    const sortedFiles = [...files].sort((a, b) => {
      if (field === 'date') {
        return newDirection === 'asc' 
          ? new Date(a.createdAt) - new Date(b.createdAt)
          : new Date(b.createdAt) - new Date(a.createdAt);
      } 
      else if (field === 'status') {
        return newDirection === 'asc'
          ? a.status.localeCompare(b.status)
          : b.status.localeCompare(a.status);
      }
      else if (field === 'vehicle') {
        const vehicleA = `${a.vehicleInfo.manufacturer} ${a.vehicleInfo.model}`;
        const vehicleB = `${b.vehicleInfo.manufacturer} ${b.vehicleInfo.model}`;
        return newDirection === 'asc'
          ? vehicleA.localeCompare(vehicleB)
          : vehicleB.localeCompare(vehicleA);
      }
      else if (field === 'credits') {
        const creditsA = a.totalCredits || 0;
        const creditsB = b.totalCredits || 0;
        return newDirection === 'asc'
          ? creditsA - creditsB
          : creditsB - creditsA;
      }
      return 0;
    });
    
    setFiles(sortedFiles);
  };

  // Filtrer les fichiers en fonction du terme de recherche
  const filteredFiles = files.filter(file => {
    const searchTermLower = searchTerm.toLowerCase();
    const vehicleInfo = `${file.vehicleInfo.manufacturer} ${file.vehicleInfo.model} ${file.vehicleInfo.year}`.toLowerCase();
    const fileInfo = `${file.fileInfo.reprogrammingTool} ${file.fileInfo.ecuType || ''}`.toLowerCase();
    
    return vehicleInfo.includes(searchTermLower) || 
           fileInfo.includes(searchTermLower) || 
           file.status.toLowerCase().includes(searchTermLower);
  });

  // Pagination - obtenir les fichiers de la page actuelle
  const indexOfLastFile = currentPage * filesPerPage;
  const indexOfFirstFile = indexOfLastFile - filesPerPage;
  const currentFiles = filteredFiles.slice(indexOfFirstFile, indexOfLastFile);
  const totalPages = Math.ceil(filteredFiles.length / filesPerPage);

  // Changer de page
  const paginate = (pageNumber) => setCurrentPage(pageNumber);

  const getSortIcon = (field) => {
    if (sortField !== field) return null;
    return sortDirection === 'asc' ? <FaSortAmountUp className="ms-1" /> : <FaSortAmountDown className="ms-1" />;
  };

  // Réinitialiser la page à 1 lorsque la recherche change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);

  return (
    <Container fluid className="py-4">
      <Row className="mb-4">
        <Col>
          <h2 className="page-title text-primary">Historique des fichiers</h2>
          <p className="text-muted">Consultez l'historique des fichiers que vous avez envoyés</p>
        </Col>
      </Row>

      <Card className="mb-4 shadow border-0">
        <Card.Header className="bg-white border-bottom-0 pt-4 pb-0">
          <Row className="align-items-center mb-3">
            <Col md={6}>
              <Form.Group className="position-relative">
                <div className="position-absolute" style={{ left: '15px', top: '10px', color: '#aaa' }}>
                  <i className="fas fa-search"></i>
                </div>
                <Form.Control
                  type="text"
                  placeholder="Rechercher par véhicule, outil, ou statut..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="ps-4 rounded-pill border-light bg-light"
                  style={{ height: '45px' }}
                />
              </Form.Group>
            </Col>
          </Row>
        </Card.Header>
        <Card.Body className="px-4 py-0">
          {error && <Alert variant="danger">{error}</Alert>}

          {loading ? (
            <div className="text-center py-5">
              <Spinner animation="border" variant="primary" />
              <p className="mt-3 text-muted">Chargement de l'historique...</p>
            </div>
          ) : (
            <>
              {filteredFiles.length === 0 ? (
                <Alert variant="info" className="rounded-3 my-4">
                  Aucun fichier trouvé. 
                  {searchTerm ? " Essayez de modifier vos critères de recherche." : " Envoyez votre premier fichier pour commencer."}
                </Alert>
              ) : (
                <>
                  <div className="table-responsive">
                    <Table hover className="align-middle custom-table">
                      <thead>
                        <tr className="bg-light">
                          <th onClick={() => handleSort('date')} className="clickable text-nowrap py-3">
                            <FaClock className="me-2 text-secondary" />
                            Date <span className="text-primary">{getSortIcon('date')}</span>
                          </th>
                          <th onClick={() => handleSort('vehicle')} className="clickable text-nowrap py-3">
                            <FaCar className="me-2 text-secondary" />
                            Véhicule <span className="text-primary">{getSortIcon('vehicle')}</span>
                          </th>
                          <th onClick={() => handleSort('status')} className="clickable text-nowrap py-3">
                            <FaTag className="me-2 text-secondary" />
                            Statut <span className="text-primary">{getSortIcon('status')}</span>
                          </th>
                          <th onClick={() => handleSort('credits')} className="clickable text-nowrap py-3">
                            <FaCoins className="me-2 text-secondary" />
                            Crédit <span className="text-primary">{getSortIcon('credits')}</span>
                          </th>
                          <th className="text-center py-3">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {currentFiles.map(file => (
                          <tr key={file._id} className="border-bottom">
                            <td className="py-3">
                              <div className="d-flex flex-column">
                                <span>{formatDate(file.createdAt).split(' à ')[0]}</span>
                                <small className="text-muted">{formatDate(file.createdAt).split(' à ')[1]}</small>
                              </div>
                            </td>
                            <td className="py-3">
                              <div className="d-flex flex-column">
                                <span className="fw-bold">{file.vehicleInfo.manufacturer} {file.vehicleInfo.model}</span>
                                <small className="text-muted">
                                  {file.vehicleInfo.year} - {file.vehicleInfo.engine}
                                </small>
                              </div>
                            </td>
                            <td className="py-3">
                              <Badge bg={statusColors[file.status]} className="px-3 py-2 rounded-pill">
                                {statusLabels[file.status]}
                              </Badge>
                            </td>
                            <td className="py-3">
                              <div className="d-flex align-items-center">
                                <FaCoins className="me-2 text-warning" />
                                <span className="fw-bold">{file.totalCredits || 0}</span>
                              </div>
                            </td>
                            <td className="text-center py-3">
                              <Link to={`/files/${file._id}`} className="btn btn-sm btn-primary rounded-pill px-3 d-flex align-items-center justify-content-center mx-auto" style={{ width: 'fit-content' }}>
                                <FaEye className="me-2" /> Détails
                              </Link>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </Table>
                  </div>
                  
                  {totalPages > 1 && (
                    <div className="d-flex justify-content-center mt-4 mb-3">
                      <Pagination>
                        <Pagination.First 
                          onClick={() => paginate(1)} 
                          disabled={currentPage === 1}
                        />
                        <Pagination.Prev 
                          onClick={() => paginate(currentPage - 1)} 
                          disabled={currentPage === 1}
                        />
                        
                        {[...Array(totalPages).keys()].map(number => {
                          // Limiter l'affichage à 5 pages autour de la page actuelle
                          if (
                            number + 1 === 1 ||
                            number + 1 === totalPages ||
                            (number + 1 >= currentPage - 2 && number + 1 <= currentPage + 2)
                          ) {
                            return (
                              <Pagination.Item
                                key={number + 1}
                                active={number + 1 === currentPage}
                                onClick={() => paginate(number + 1)}
                              >
                                {number + 1}
                              </Pagination.Item>
                            );
                          } else if (
                            (number + 1 === currentPage - 3 && currentPage > 4) ||
                            (number + 1 === currentPage + 3 && currentPage < totalPages - 3)
                          ) {
                            return <Pagination.Ellipsis key={`ellipsis-${number}`} />;
                          }
                          return null;
                        })}
                        
                        <Pagination.Next
                          onClick={() => paginate(currentPage + 1)}
                          disabled={currentPage === totalPages}
                        />
                        <Pagination.Last
                          onClick={() => paginate(totalPages)}
                          disabled={currentPage === totalPages}
                        />
                      </Pagination>
                    </div>
                  )}
                  
                  <div className="d-flex justify-content-between align-items-center px-2 text-muted small mb-3">
                    <div>
                      Affichage de {indexOfFirstFile + 1}-{Math.min(indexOfLastFile, filteredFiles.length)} sur {filteredFiles.length} fichiers
                    </div>
                    <div>
                      Page {currentPage} sur {totalPages}
                    </div>
                  </div>
                </>
              )}
            </>
          )}
        </Card.Body>
      </Card>
    </Container>
  );
};

export default FileHistory; 