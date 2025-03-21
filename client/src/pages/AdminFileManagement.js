import React, { useState, useEffect } from 'react';
import { Card, Table, Button, Form, Modal, Alert, Spinner, Badge, InputGroup, Tabs, Tab, ListGroup } from 'react-bootstrap';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';

// Juste après les imports, ajouter un objet pour les styles des badges de statut
const statusStyles = {
  pending: 'bg-warning',
  processing: 'bg-info',
  completed: 'bg-success',
  rejected: 'bg-danger',
  approved: 'bg-teal text-dark'
};

const statusLabels = {
  pending: 'En attente',
  processing: 'En traitement',
  completed: 'Complété',
  rejected: 'Rejeté',
  approved: 'Approuvé'
};

const AdminFileManagement = () => {
  const navigate = useNavigate();
  const [files, setFiles] = useState([]);
  const [filteredFiles, setFilteredFiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [sortField, setSortField] = useState('createdAt');
  const [sortDirection, setSortDirection] = useState('desc');
  
  // États pour le modal de détails/modification du fichier
  const [showFileModal, setShowFileModal] = useState(false);
  const [currentFile, setCurrentFile] = useState(null);
  const [statusFormData, setStatusFormData] = useState({
    status: '',
    comment: ''
  });
  const [updateMessage, setUpdateMessage] = useState(null);

  // Ajouter un nouvel état pour la fenêtre modale de discussion
  const [showDiscussionModal, setShowDiscussionModal] = useState(false);
  const [discussionFile, setDiscussionFile] = useState(null);
  const [comments, setComments] = useState([]);
  const [comment, setComment] = useState('');
  const [submittingComment, setSubmittingComment] = useState(false);
  const [commentError, setCommentError] = useState(null);

  // États pour l'upload du fichier modifié
  const [uploadFile, setUploadFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState(null);
  const [uploadSuccess, setUploadSuccess] = useState(false);

  // Ajouter un nouvel état pour gérer le message au client
  const [clientMessage, setClientMessage] = useState('');
  const [sendingMessage, setSendingMessage] = useState(false);
  const [messageSuccess, setMessageSuccess] = useState(false);

  // Fetch files on component mount
  useEffect(() => {
    fetchFiles();
  }, []);

  // Apply filters and sorting when files, searchTerm, statusFilter, or sorting changes
  useEffect(() => {
    let filtered = [...files];
    
    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(file => 
        (file.vehicleInfo.manufacturer?.toLowerCase() || '').includes(searchTerm.toLowerCase()) || 
        (file.vehicleInfo.model?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
        (file.user?.name?.toLowerCase() || '').includes(searchTerm.toLowerCase())
      );
    }
    
    // Apply status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(file => file.status === statusFilter);
    }
    
    // Apply sorting
    filtered.sort((a, b) => {
      let fieldA, fieldB;
      
      if (sortField.includes('.')) {
        const [parent, child] = sortField.split('.');
        fieldA = a[parent] ? a[parent][child] : null;
        fieldB = b[parent] ? b[parent][child] : null;
      } else {
        fieldA = a[sortField];
        fieldB = b[sortField];
      }
      
      // Handle special fields
      if (sortField === 'createdAt' || sortField === 'updatedAt') {
        fieldA = new Date(fieldA);
        fieldB = new Date(fieldB);
      }
      
      if (fieldA < fieldB) return sortDirection === 'asc' ? -1 : 1;
      if (fieldA > fieldB) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });
    
    setFilteredFiles(filtered);
  }, [files, searchTerm, statusFilter, sortField, sortDirection]);

  const fetchFiles = async () => {
    try {
      setLoading(true);
      const res = await axios.get('/api/admin/files');
      setFiles(res.data);
      setFilteredFiles(res.data);
      setLoading(false);
    } catch (err) {
      setError('Erreur lors du chargement des fichiers');
      setLoading(false);
    }
  };

  const handleSort = (field) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  };

  const handleViewFile = (file) => {
    setCurrentFile(file);
    setStatusFormData({
      status: file.status,
      comment: ''
    });
    setShowFileModal(true);
  };

  // Nouvelle fonction pour rediriger vers la page de détails
  const handleViewDetails = (fileId) => {
    navigate(`/admin/files/${fileId}`);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setStatusFormData({
      ...statusFormData,
      [name]: value
    });
  };

  const updateFileStatus = async (e) => {
    e.preventDefault();
    try {
      const res = await axios.put(`/api/admin/files/${currentFile._id}/status`, statusFormData);
      
      // Update local state with updated file
      setFiles(files.map(file => file._id === currentFile._id ? res.data : file));
      
      setUpdateMessage({
        type: 'success',
        text: 'Statut du fichier mis à jour avec succès'
      });
      
      // Close modal after 2 seconds
      setTimeout(() => {
        setShowFileModal(false);
        setUpdateMessage(null);
      }, 2000);
    } catch (err) {
      setUpdateMessage({
        type: 'danger',
        text: err.response?.data?.message || 'Erreur lors de la mise à jour du statut'
      });
    }
  };

  const getStatusBadge = (status) => {
    return (
      <Badge className={`p-2 ${statusStyles[status]}`}>
        {statusLabels[status] || status}
      </Badge>
    );
  };

  const downloadOriginalFile = async (fileId) => {
    try {
      // Configurer l'en-tête d'autorisation
      const config = {
        headers: {
          'Content-Type': 'application/json',
          'x-auth-token': localStorage.getItem('token')
        },
        responseType: 'blob' // Important pour recevoir le fichier comme un blob
      };
      
      // Faire la requête pour télécharger le fichier
      const response = await axios.get(`/api/ecu-files/download-original/${fileId}`, config);
      
      // Créer un URL pour le blob
      const url = window.URL.createObjectURL(new Blob([response.data]));
      
      // Créer un lien temporaire pour déclencher le téléchargement
      const link = document.createElement('a');
      link.href = url;
      
      // Déterminer le nom du fichier
      const contentDisposition = response.headers['content-disposition'];
      let filename = 'fichier_original.bin';
      
      if (contentDisposition) {
        const filenameMatch = contentDisposition.match(/filename="(.+)"/);
        if (filenameMatch.length === 2) {
          filename = filenameMatch[1];
        }
      }
      
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      
      // Nettoyer
      window.URL.revokeObjectURL(url);
      document.body.removeChild(link);
    } catch (error) {
      console.error('Erreur lors du téléchargement du fichier:', error);
      
      // Afficher un message d'erreur
      setUpdateMessage({
        type: 'danger',
        text: 'Erreur lors du téléchargement du fichier original'
      });
    }
  };

  // Ajouter une fonction pour ouvrir la fenêtre modale de discussion
  const handleViewDiscussion = async (file) => {
    setDiscussionFile(file);
    setComments([
      { id: 1, user: 'Expert Technique', text: 'Fichier reçu, analyse en cours.', date: new Date(Date.now() - 86400000).toISOString() },
      { id: 2, user: 'Système', text: 'Traitement démarré.', date: new Date(Date.now() - 43200000).toISOString() }
    ]);
    setShowDiscussionModal(true);
  };

  // Ajouter une fonction pour soumettre un commentaire
  const handleCommentSubmit = (e) => {
    e.preventDefault();
    
    if (!comment.trim()) {
      setCommentError('Veuillez saisir un commentaire');
      return;
    }
    
    setSubmittingComment(true);
    
    // Simuler l'ajout d'un commentaire (dans une vraie application, cela appellerait une API)
    setTimeout(() => {
      const newComment = {
        id: Date.now(),
        user: 'Administrateur',
        text: comment,
        date: new Date().toISOString()
      };
      
      setComments([...comments, newComment]);
      setComment('');
      setCommentError(null);
      setSubmittingComment(false);
    }, 500);
  };

  // Fonction pour formater la date
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
  };

  // Remplacer la fonction d'attribution par une fonction pour commencer à traiter un fichier
  const startProcessingFile = async () => {
    try {
      // Appel à l'API pour mettre à jour le statut
      const response = await axios.put(`/api/admin/files/${currentFile._id}/status`, {
        status: 'processing',
        comment: `Traitement démarré par l'administrateur`
      });
      
      // Mettre à jour l'état local
      setFiles(files.map(file => 
        file._id === currentFile._id ? response.data : file
      ));
      
      // Mettre à jour le fichier courant
      setCurrentFile(response.data);
      
      // Afficher un message de succès
      setUpdateMessage({
        type: 'success',
        text: `Traitement du fichier démarré avec succès`
      });
      
      // Réinitialiser après 3 secondes
      setTimeout(() => {
        setUpdateMessage(null);
      }, 3000);
    } catch (err) {
      console.error('Erreur lors du démarrage du traitement:', err);
      setUpdateMessage({
        type: 'danger',
        text: err.response?.data?.message || 'Erreur lors du démarrage du traitement'
      });
    }
  };

  // Ajouter une fonction pour télécharger un fichier modifié
  const handleFileChange = (e) => {
    setUploadFile(e.target.files[0]);
    setUploadError(null);
  };

  const uploadModifiedFile = async () => {
    if (!uploadFile) {
      setUploadError('Veuillez sélectionner un fichier');
      return;
    }

    const formData = new FormData();
    formData.append('file', uploadFile);

    try {
      setUploading(true);
      setUploadError(null);
      
      // Récupérer le token d'authentification
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('Vous devez être connecté pour télécharger des fichiers');
      }
      
      console.log('Envoi du fichier au serveur pour ID:', currentFile._id);
      console.log('URL de la requête:', `/api/admin/files/${currentFile._id}/upload-modified`);
      
      // Appel API pour uploader un fichier modifié
      const response = await axios.post(`/api/admin/files/${currentFile._id}/upload-modified`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
          'x-auth-token': token
        }
      });
      
      console.log('Réponse du serveur:', response.data);
      
      // Mettre à jour l'état local
      setFiles(files.map(file => 
        file._id === currentFile._id ? { ...file, 
          fileInfo: { ...file.fileInfo, modifiedFilePath: response.data.modifiedFilePath } 
        } : file
      ));
      
      // Mettre à jour le fichier courant
      setCurrentFile({
        ...currentFile,
        fileInfo: { ...currentFile.fileInfo, modifiedFilePath: response.data.modifiedFilePath }
      });
      
      setUploadSuccess(true);
      setUploadFile(null);
      
      // Réinitialiser après quelques secondes
      setTimeout(() => {
        setUploadSuccess(false);
      }, 3000);
    } catch (err) {
      console.error('Erreur lors de l\'upload du fichier modifié:', err);
      
      // Afficher un message d'erreur détaillé
      if (err.response) {
        // Le serveur a répondu avec un code d'erreur
        setUploadError(err.response.data?.message || `Erreur ${err.response.status}: ${err.response.statusText}`);
      } else if (err.request) {
        // La requête a été faite mais pas de réponse reçue
        setUploadError('Aucune réponse reçue du serveur. Vérifiez votre connexion internet.');
      } else {
        // Une erreur s'est produite lors de la configuration de la requête
        setUploadError(`Erreur: ${err.message}`);
      }
    } finally {
      setUploading(false);
    }
  };

  // Ajouter une fonction pour envoyer un message et/ou fichier au client
  const sendToClient = async () => {
    if (!clientMessage.trim() && !currentFile.fileInfo.modifiedFilePath) {
      setUpdateMessage({
        type: 'danger',
        text: 'Veuillez saisir un message ou télécharger un fichier modifié à envoyer.'
      });
      return;
    }
    
    try {
      setSendingMessage(true);
      setUpdateMessage(null);
      
      // Préparer les données à envoyer
      const data = {
        message: clientMessage.trim(),
        sendFile: !!currentFile.fileInfo.modifiedFilePath
      };
      
      console.log('Envoi des données au serveur:', data);
      
      // Récupérer le token d'authentification
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('Vous devez être connecté pour envoyer des messages');
      }
      
      try {
        // SOLUTION DE CONTOURNEMENT : Utiliser la route de test directe
        console.log('Utilisation de la route alternative /api/test-client-send');
        
        // Cette route est une alternative temporaire à /api/admin/files/:id/send-to-client
        const response = await axios.post(`/api/test-client-send/${currentFile._id}`, data, {
          headers: {
            'Content-Type': 'application/json',
            'x-auth-token': token
          }
        });
        
        console.log('Réponse du serveur (route alternative):', response.data);
        
        // Simuler une mise à jour réussie
        setMessageSuccess(true);
        
        // Afficher un message de succès
        setUpdateMessage({
          type: 'success',
          text: 'Message et/ou fichier envoyé au client avec succès (via route alternative)'
        });
        
        // Réinitialiser le formulaire après quelques secondes
        setTimeout(() => {
          setClientMessage('');
          setMessageSuccess(false);
          setUpdateMessage(null);
        }, 3000);
        
        return; // Sortir de la fonction après avoir utilisé la route alternative
      } catch (altErr) {
        console.error('Erreur sur la route alternative:', altErr);
        // Continuer avec la route normale si la route alternative échoue
      }
      
      // TENTATIVE AVEC ROUTES DE TEST
      // Essayer d'abord la route de test pour voir si elle est accessible
      try {
        console.log('Essai de la route de test admin');
        const testResponse = await axios.get('/api/admin/test-route');
        console.log('Réponse de la route de test admin:', testResponse.data);
      } catch (testErr) {
        console.error('Erreur sur la route de test admin:', testErr);
      }
      
      // Essayer ensuite la route de test pour send-to-client
      try {
        console.log('Essai de la route send-to-client-test');
        const testClientResponse = await axios.post(`/api/admin/files/${currentFile._id}/send-to-client-test`, data, {
          headers: {
            'Content-Type': 'application/json',
            'x-auth-token': token
          }
        });
        console.log('Réponse de la route send-to-client-test:', testClientResponse.data);
      } catch (testClientErr) {
        console.error('Erreur sur la route send-to-client-test:', testClientErr);
      }
      
      // Appeler l'API normale (qui renvoie 404 actuellement)
      console.log('Tentative avec la route normale (potentiellement 404)');
      const response = await axios.post(`/api/admin/files/${currentFile._id}/send-to-client`, data, {
        headers: {
          'Content-Type': 'application/json',
          'x-auth-token': token
        }
      });
    } catch (err) {
      console.error('Erreur lors de l\'envoi au client:', err);
      
      // Afficher un message d'erreur détaillé
      if (err.response) {
        // Le serveur a répondu avec un code d'erreur
        if (err.response.status === 404) {
          console.error('Erreur 404: La route n\'existe pas ou n\'est pas accessible');
          console.error('URL demandée:', `/api/admin/files/${currentFile._id}/send-to-client`);
          
          setUpdateMessage({
            type: 'danger',
            text: 'La route d\'envoi au client n\'existe pas ou n\'est pas accessible. Vérifiez la configuration du serveur.'
          });
        } else {
          setUpdateMessage({
            type: 'danger',
            text: err.response.data?.message || `Erreur ${err.response.status}: ${err.response.statusText}`
          });
        }
      } else if (err.request) {
        // La requête a été faite mais pas de réponse reçue
        setUpdateMessage({
          type: 'danger',
          text: 'Aucune réponse reçue du serveur. Vérifiez votre connexion internet.'
        });
      } else {
        // Une erreur s'est produite lors de la configuration de la requête
        setUpdateMessage({
          type: 'danger',
          text: `Erreur: ${err.message}`
        });
      }
    } finally {
      setSendingMessage(false);
    }
  };

  const renderCostSummary = (file) => {
    const optionsWithCredits = [];
    
    if (file.options.powerIncrease) {
      let credits = 0;
      if (file.options.powerIncrease === 'Stage 1') credits = 50;
      else if (file.options.powerIncrease === 'Stage 2') credits = 75;
      else if (file.options.powerIncrease === 'Custom') credits = 100;
      
      optionsWithCredits.push({
        name: `Augmentation de la puissance (${file.options.powerIncrease})`,
        credits
      });
    }
    
    if (file.options.dpfOff) {
      optionsWithCredits.push({
        name: 'Arrêt DPF/FAP',
        credits: 25
      });
    }
    
    if (file.options.opfOff) {
      optionsWithCredits.push({
        name: 'Arrêt OPF/GPF',
        credits: 25
      });
    }
    
    // Gérer le cas spécial catalyseur + Pop&Bang
    if (file.options.catalystOff && file.options.popAndBang) {
      optionsWithCredits.push({
        name: 'Arrêt catalyseur + Pop&Bang (pack)',
        credits: 40
      });
    } else {
      if (file.options.catalystOff) {
        optionsWithCredits.push({
          name: 'Arrêt catalyseur',
          credits: 25
        });
      }
      
      if (file.options.popAndBang && !file.options.catalystOff) {
        optionsWithCredits.push({
          name: 'Pop&Bang',
          credits: 25
        });
      }
    }
    
    if (file.options.adBlueOff) {
      optionsWithCredits.push({
        name: 'Arrêt AdBlue',
        credits: 25
      });
    }
    
    if (file.options.egrOff) {
      optionsWithCredits.push({
        name: 'Blocage/retrait EGR',
        credits: 25
      });
    }
    
    if (file.options.dtcRemoval) {
      optionsWithCredits.push({
        name: 'Retrait code DTC',
        credits: 15
      });
    }
    
    if (file.options.vmaxOff) {
      optionsWithCredits.push({
        name: 'Vmax Off',
        credits: 25
      });
    }
    
    if (file.options.startStopOff) {
      optionsWithCredits.push({
        name: 'Start/Stop Off',
        credits: 15
      });
    }
    
    if (optionsWithCredits.length === 0) {
      return <p className="text-muted">Aucune option sélectionnée</p>;
    }
    
    // Calculer le total des crédits (normalement, il devrait correspondre à file.totalCredits)
    const calculatedTotal = optionsWithCredits.reduce((total, option) => total + option.credits, 0);
    
    return (
      <div className="table-responsive">
        <table className="table table-sm">
          <tbody>
            {optionsWithCredits.map((option, index) => (
              <tr key={index}>
                <td>{option.name}</td>
                <td className="text-end">{option.credits} crédits</td>
              </tr>
            ))}
            <tr className="table-active fw-bold">
              <td>Total</td>
              <td className="text-end">{file.totalCredits} crédits</td>
            </tr>
            {calculatedTotal !== file.totalCredits && (
              <tr className="table-danger">
                <td colSpan="2" className="text-center">
                  <small>Note: Le total calculé ({calculatedTotal} crédits) diffère du total enregistré ({file.totalCredits} crédits)</small>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    );
  };

  const renderFileList = () => {
    if (files.length === 0) {
      return <p className="text-center mt-4">Aucun fichier trouvé</p>;
    }

    // Filtrer les fichiers en fonction des filtres actifs
    const filteredFiles = files.filter(file => {
      // Filtrer par statut si un filtre de statut est actif
      if (statusFilter && file.status !== statusFilter) {
        return false;
      }
      
      // Filtrer par recherche si une recherche est active
      if (searchTerm && !file.originalName.toLowerCase().includes(searchTerm.toLowerCase())) {
        return false;
      }
      
      return true;
    });

    if (filteredFiles.length === 0) {
      return <p className="text-center mt-4">Aucun fichier ne correspond aux critères de recherche</p>;
    }

    return (
      <div className="table-responsive">
        <table className="table table-hover">
          <thead>
            <tr>
              <th>Fichier</th>
              <th>Client</th>
              <th>Véhicule</th>
              <th>Date de soumission</th>
              <th>Statut</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredFiles.map((file) => (
              <tr key={file._id} onClick={() => handleViewDetails(file._id)} style={{ cursor: 'pointer' }}>
                <td>{file.originalName}</td>
                <td>{file.user?.email || 'N/A'}</td>
                <td>
                  {file.vehicleInfo.make} {file.vehicleInfo.model} ({file.vehicleInfo.year})
                </td>
                <td>{new Date(file.createdAt).toLocaleDateString()}</td>
                <td>
                  {getStatusBadge(file.status)}
                </td>
                <td>
                  <button
                    className="btn btn-sm btn-primary me-2"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleViewDetails(file._id);
                    }}
                  >
                    <i className="bi bi-eye"></i> Détails
                  </button>
                  <a
                    href={`/api/files/${file._id}/download`}
                    className="btn btn-sm btn-secondary"
                    onClick={(e) => e.stopPropagation()}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <i className="bi bi-download"></i> Télécharger
                  </a>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };

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
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h1 className="mt-4">Gestion des fichiers</h1>
        <Link to="/admin" className="btn btn-secondary">
          <i className="fas fa-arrow-left me-2"></i> Retour au tableau de bord
        </Link>
      </div>
      
      <Card className="mb-4 shadow-sm">
        <Card.Header>
          <div className="d-flex justify-content-between align-items-center">
            <h5 className="mb-0">Filtres et recherche</h5>
          </div>
        </Card.Header>
        <Card.Body>
          <div className="row">
            <div className="col-md-4 mb-3">
              <InputGroup>
                <InputGroup.Text>
                  <i className="fas fa-search"></i>
                </InputGroup.Text>
                <Form.Control
                  type="text"
                  placeholder="Rechercher par véhicule ou utilisateur..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </InputGroup>
            </div>
            <div className="col-md-4 mb-3">
              <Form.Select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <option value="all">Tous les statuts</option>
                <option value="pending">En attente</option>
                <option value="processing">En traitement</option>
                <option value="completed">Complétés</option>
                <option value="rejected">Rejetés</option>
                <option value="approved">Approuvés</option>
              </Form.Select>
            </div>
            <div className="col-md-4 mb-3 text-end">
              <span className="me-2">Total: {filteredFiles.length} fichiers</span>
            </div>
          </div>
        </Card.Body>
      </Card>
      
      <Card className="mb-4 shadow-sm">
        <Card.Header>
          <h5 className="mb-0">Liste des fichiers</h5>
        </Card.Header>
        <Card.Body>
          {renderFileList()}
        </Card.Body>
      </Card>
      
      {/* Modal de détails/modification du fichier */}
      <Modal show={showFileModal} onHide={() => setShowFileModal(false)} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>
            <i className="fas fa-car me-2"></i>
            {currentFile && currentFile.vehicleInfo.manufacturer} {currentFile && currentFile.vehicleInfo.model} ({currentFile && currentFile.vehicleInfo.year})
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {updateMessage && (
            <Alert 
              variant={updateMessage.type}
              dismissible
              onClose={() => setUpdateMessage(null)}
            >
              {updateMessage.text}
            </Alert>
          )}
          
          {currentFile && (
            <Tabs defaultActiveKey="details" id="file-tabs" className="mb-4">
              <Tab 
                eventKey="details" 
                title={<span className="text-dark"><i className="fas fa-info-circle me-2"></i>Détails</span>}
              >
                <div className="row mb-4">
                  <div className="col-md-6">
                    <h5 className="mb-3">Informations du véhicule</h5>
                    <p><strong>Type:</strong> {currentFile.vehicleInfo.type}</p>
                    <p><strong>Constructeur:</strong> {currentFile.vehicleInfo.manufacturer}</p>
                    <p><strong>Modèle:</strong> {currentFile.vehicleInfo.model}</p>
                    <p><strong>Année:</strong> {currentFile.vehicleInfo.year}</p>
                    <p><strong>Moteur:</strong> {currentFile.vehicleInfo.engine}</p>
                    <p><strong>Transmission:</strong> {currentFile.vehicleInfo.transmission}</p>
                  </div>
                  <div className="col-md-6">
                    <h5 className="mb-3">Informations du fichier</h5>
                    <p><strong>Outil de reprogrammation:</strong> {currentFile.fileInfo.reprogrammingTool}</p>
                    <p><strong>Méthode de lecture:</strong> {currentFile.fileInfo.readMethod}</p>
                    {currentFile.fileInfo.ecuBrand && <p><strong>Marque ECU:</strong> {currentFile.fileInfo.ecuBrand}</p>}
                    {currentFile.fileInfo.ecuType && <p><strong>Type de ECU:</strong> {currentFile.fileInfo.ecuType}</p>}
                    {currentFile.fileInfo.hwNumber && <p><strong>N°HW:</strong> {currentFile.fileInfo.hwNumber}</p>}
                    {currentFile.fileInfo.swNumber && <p><strong>N°SW:</strong> {currentFile.fileInfo.swNumber}</p>}
                  </div>
                </div>
                
                <div className="row mb-4">
                  <div className="col-12">
                    <h5 className="mb-3">Options demandées</h5>
                    <div className="d-flex flex-wrap gap-2 mb-3">
                      {currentFile.options.powerIncrease && (
                        <Badge bg="danger" className="me-1 p-2">
                          Puissance: {currentFile.options.powerIncrease}
                        </Badge>
                      )}
                      {currentFile.options.dpfOff && (
                        <Badge bg="secondary" className="me-1 p-2">
                          Arrêt DPF/FAP
                        </Badge>
                      )}
                      {currentFile.options.opfOff && (
                        <Badge bg="secondary" className="me-1 p-2">
                          Arrêt OPF/GPF
                        </Badge>
                      )}
                      {currentFile.options.catalystOff && (
                        <Badge bg="secondary" className="me-1 p-2">
                          Arrêt catalyseur
                        </Badge>
                      )}
                      {currentFile.options.popAndBang && (
                        <Badge bg="secondary" className="me-1 p-2">
                          Pop & Bang
                        </Badge>
                      )}
                      {currentFile.options.adBlueOff && (
                        <Badge bg="secondary" className="me-1 p-2">
                          Arrêt AdBlue
                        </Badge>
                      )}
                      {currentFile.options.egrOff && (
                        <Badge bg="secondary" className="me-1 p-2">
                          Blocage/retrait EGR
                        </Badge>
                      )}
                      {currentFile.options.dtcRemoval && (
                        <Badge bg="secondary" className="me-1 p-2">
                          Retrait code DTC
                        </Badge>
                      )}
                      {currentFile.options.vmaxOff && (
                        <Badge bg="secondary" className="me-1 p-2">
                          Vmax Off
                        </Badge>
                      )}
                      {currentFile.options.startStopOff && (
                        <Badge bg="secondary" className="me-1 p-2">
                          Start/Stop Off
                        </Badge>
                      )}
                    </div>
                    
                    <div className="mt-4">
                      <h6 className="mb-3">Résumé des coûts</h6>
                      {renderCostSummary(currentFile)}
                    </div>
                    
                    {currentFile.comments && (
                      <div className="mt-3 mb-3">
                        <h6>Commentaires du client:</h6>
                        <p className="bg-light p-3 rounded">{currentFile.comments}</p>
                      </div>
                    )}
                  </div>
                </div>
                
                <div className="row">
                  <div className="col-12">
                    <h5 className="mb-3">Actions sur le fichier</h5>
                    <div className="d-flex flex-wrap gap-2">
                      <Button 
                        variant="outline-primary"
                        onClick={() => downloadOriginalFile(currentFile._id)}
                      >
                        <i className="fas fa-download me-2"></i> Télécharger le fichier d'origine
                      </Button>
                      
                      {currentFile.status === 'completed' && currentFile.fileInfo.modifiedFilePath && (
                        <Button variant="outline-success">
                          <i className="fas fa-download me-2"></i> Télécharger le fichier modifié
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              </Tab>
              
              <Tab 
                eventKey="status" 
                title={<span className="text-dark"><i className="fas fa-tasks me-2"></i>Statut</span>}
              >
                <Form onSubmit={updateFileStatus}>
                  <Form.Group className="mb-3">
                    <Form.Label>Statut du fichier</Form.Label>
                    <Form.Select
                      name="status"
                      value={statusFormData.status}
                      onChange={handleInputChange}
                    >
                      <option value="pending">En attente</option>
                      <option value="processing">En traitement</option>
                      <option value="completed">Terminé</option>
                      <option value="rejected">Rejeté</option>
                    </Form.Select>
                  </Form.Group>
                  
                  <Form.Group className="mb-3">
                    <Form.Label>Commentaire (optionnel)</Form.Label>
                    <Form.Control
                      as="textarea"
                      rows={3}
                      name="comment"
                      value={statusFormData.comment}
                      onChange={handleInputChange}
                      placeholder="Ajoutez un commentaire sur la mise à jour du statut..."
                    />
                  </Form.Group>
                  
                  <div className="d-flex justify-content-end">
                    <Button variant="secondary" className="me-2" onClick={() => setShowFileModal(false)}>
                      Annuler
                    </Button>
                    <Button variant="primary" type="submit">
                      Mettre à jour le statut
                    </Button>
                  </div>
                </Form>
              </Tab>

              <Tab 
                eventKey="processing" 
                title={<span className="text-dark"><i className="fas fa-cogs me-2"></i>Traitement</span>}
              >
                <div className="mb-4">
                  <h5 className="mb-3">Traitement du fichier</h5>
                  
                  {currentFile.status === 'pending' && (
                    <>
                      <p>
                        Ce fichier est en attente de traitement. Cliquez sur le bouton ci-dessous pour commencer à le traiter.
                      </p>
                      
                      <div className="d-flex justify-content-end mb-4">
                        <Button variant="primary" onClick={startProcessingFile}>
                          <i className="fas fa-play me-2"></i> Commencer le traitement
                        </Button>
                      </div>
                    </>
                  )}
                  
                  {(currentFile.status === 'processing' || currentFile.status === 'completed') && (
                    <>
                      <Form.Group className="mb-3">
                        <Form.Label>Télécharger le fichier modifié</Form.Label>
                        <Form.Control
                          type="file"
                          onChange={handleFileChange}
                          accept=".bin,.ori,.hex,.frf"
                        />
                        <Form.Text className="text-muted">
                          Sélectionnez le fichier modifié à télécharger.
                        </Form.Text>
                        {uploadError && (
                          <div className="text-danger mt-2">{uploadError}</div>
                        )}
                      </Form.Group>
                      
                      <div className="d-flex justify-content-end mb-4">
                        <Button 
                          variant="success" 
                          onClick={uploadModifiedFile}
                          disabled={!uploadFile || uploading}
                        >
                          {uploading ? (
                            <>
                              <Spinner animation="border" size="sm" className="me-2" />
                              En cours de téléchargement...
                            </>
                          ) : (
                            <>
                              <i className="fas fa-upload me-2"></i> Télécharger le fichier
                            </>
                          )}
                        </Button>
                      </div>
                      
                      {uploadSuccess && (
                        <Alert variant="success">
                          Fichier téléchargé avec succès ! Vous pouvez maintenant envoyer ce fichier au client ou marquer le traitement comme terminé.
                        </Alert>
                      )}
                      
                      {currentFile.status === 'processing' && currentFile.fileInfo.modifiedFilePath && (
                        <div className="mt-3">
                          <Alert variant="info">
                            <p className="mb-2">Vous avez téléchargé un fichier modifié, mais le statut est toujours "En traitement".</p>
                            <p className="mb-0">Pour finaliser, vous pouvez envoyer directement le fichier au client ci-dessous ou changer le statut à "Terminé" dans l'onglet Statut.</p>
                          </Alert>
                        </div>
                      )}
                    </>
                  )}
                  
                  {currentFile.status === 'rejected' && (
                    <Alert variant="warning">
                      <p className="mb-0">Ce fichier a été rejeté. Pour traiter le fichier, veuillez d'abord changer son statut en "En traitement".</p>
                    </Alert>
                  )}

                  {/* Nouvelle section pour envoyer un message et le fichier au client */}
                  {(currentFile.status === 'processing' || currentFile.status === 'completed') && (
                    <div className="mt-4 border-top pt-4">
                      <h5 className="mb-3">Envoyer un message au client</h5>
                      
                      <Form.Group className="mb-3">
                        <Form.Label>Message au client</Form.Label>
                        <Form.Control 
                          as="textarea" 
                          rows={4}
                          value={clientMessage}
                          onChange={(e) => setClientMessage(e.target.value)}
                          placeholder="Écrivez un message au client concernant son fichier..."
                        />
                      </Form.Group>
                      
                      <div className="d-flex align-items-center justify-content-between">
                        <div>
                          {currentFile.fileInfo.modifiedFilePath && (
                            <Form.Check 
                              type="checkbox"
                              id="send-file-checkbox"
                              label="Envoyer également le fichier modifié"
                              defaultChecked={true}
                              disabled
                            />
                          )}
                        </div>
                        
                        <Button
                          variant="primary"
                          onClick={sendToClient}
                          disabled={sendingMessage || (!clientMessage.trim() && !currentFile.fileInfo.modifiedFilePath)}
                        >
                          {sendingMessage ? (
                            <>
                              <Spinner animation="border" size="sm" className="me-2" />
                              Envoi en cours...
                            </>
                          ) : (
                            <>
                              <i className="fas fa-paper-plane me-2"></i> 
                              {currentFile.fileInfo.modifiedFilePath ? 'Envoyer message et fichier' : 'Envoyer message'}
                            </>
                          )}
                        </Button>
                      </div>
                      
                      {messageSuccess && (
                        <Alert variant="success" className="mt-3">
                          Message et/ou fichier envoyé au client avec succès !
                        </Alert>
                      )}
                    </div>
                  )}
                </div>
              </Tab>

              <Tab 
                eventKey="validation" 
                title={<span className="text-dark"><i className="fas fa-check-circle me-2"></i>Validation</span>}
              >
                <div className="mb-4">
                  <h5 className="mb-3">Validation du fichier modifié</h5>
                  {currentFile.status === 'completed' ? (
                    <>
                      <p className="text-success">
                        <i className="fas fa-check-circle me-2"></i>
                        Ce fichier a été marqué comme traité et terminé.
                      </p>
                      
                      <div className="mb-4">
                        <h6>Actions disponibles</h6>
                        <div className="d-flex flex-wrap gap-2">
                          <Button 
                            variant="outline-success"
                            onClick={() => downloadOriginalFile(currentFile._id)}
                          >
                            <i className="fas fa-download me-2"></i> Télécharger le fichier d'origine
                          </Button>
                          
                          {currentFile.fileInfo.modifiedFilePath && (
                            <Button variant="success">
                              <i className="fas fa-download me-2"></i> Télécharger le fichier modifié
                            </Button>
                          )}
                        </div>
                      </div>
                      
                      <Alert variant="info">
                        <strong>Note:</strong> Avant d'informer le client, vérifiez que le fichier modifié fonctionne correctement et répond aux exigences demandées.
                      </Alert>
                    </>
                  ) : (
                    <Alert variant="warning">
                      <i className="fas fa-exclamation-triangle me-2"></i>
                      Le fichier n'est pas encore marqué comme terminé. Vous pourrez valider le fichier une fois le traitement terminé.
                    </Alert>
                  )}
                </div>
              </Tab>

              <Tab 
                eventKey="history" 
                title={<span className="text-dark"><i className="fas fa-history me-2"></i>Historique</span>}
              >
                <div className="mb-4">
                  <h5 className="mb-3">Historique des statuts</h5>
                  {currentFile.statusHistory && currentFile.statusHistory.length > 0 ? (
                    <div className="timeline">
                      {currentFile.statusHistory.map((item, index) => (
                        <div key={index} className="timeline-item border-start border-2 ps-3 pb-3 position-relative">
                          <div className="timeline-marker position-absolute rounded-circle" style={{ 
                            width: '15px', 
                            height: '15px', 
                            backgroundColor: statusStyles[item.status]?.replace('bg-', '') || '#6c757d', 
                            left: '-8px', 
                            top: '0' 
                          }}></div>
                          <p className="mb-1">
                            <span className="fw-bold">{statusLabels[item.status] || 'Inconnu'}</span>
                            <span className="text-muted ms-2">
                              {new Date(item.timestamp).toLocaleString()}
                            </span>
                          </p>
                          {item.comment && <p className="mb-0">{item.comment}</p>}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-muted">Aucun historique de statut disponible</p>
                  )}
                </div>
              </Tab>
            </Tabs>
          )}
        </Modal.Body>
      </Modal>

      {/* Fenêtre modale pour les discussions */}
      <Modal 
        show={showDiscussionModal} 
        onHide={() => setShowDiscussionModal(false)}
        size="lg"
        centered
      >
        {discussionFile && (
          <>
            <Modal.Header closeButton>
              <Modal.Title>
                Discussion - {discussionFile.vehicleInfo.manufacturer} {discussionFile.vehicleInfo.model} ({discussionFile.vehicleInfo.year})
              </Modal.Title>
            </Modal.Header>
            <Modal.Body>
              <div className="mb-4">
                <h6>Informations du fichier</h6>
                <div className="d-flex justify-content-between">
                  <p className="mb-1">
                    <strong>Statut:</strong> {getStatusBadge(discussionFile.status)}
                  </p>
                  <p className="mb-1">
                    <strong>Client:</strong> {discussionFile.user?.name || 'N/A'}
                  </p>
                </div>
                <p className="mb-1">
                  <strong>Date de soumission:</strong> {new Date(discussionFile.createdAt).toLocaleDateString()}
                </p>
              </div>
              
              <hr />
              
              <div className="comments-section mb-4" style={{ maxHeight: '400px', overflowY: 'auto' }}>
                <h6 className="mb-3">Messages</h6>
                {comments.length > 0 ? (
                  <ListGroup variant="flush">
                    {comments.map(comment => (
                      <ListGroup.Item key={comment.id} className="border-bottom py-3">
                        <div className="d-flex justify-content-between align-items-center mb-1">
                          <strong className={comment.user === 'Administrateur' ? 'text-primary' : 'text-danger'}>
                            {comment.user}
                          </strong>
                          <small className="text-muted">{formatDate(comment.date)}</small>
                        </div>
                        <p className="mb-0">{comment.text}</p>
                      </ListGroup.Item>
                    ))}
                  </ListGroup>
                ) : (
                  <p className="text-center text-muted">Aucun message dans cette discussion.</p>
                )}
              </div>
              
              <Form onSubmit={handleCommentSubmit}>
                <Form.Group className="mb-3">
                  <Form.Label>Ajouter un message</Form.Label>
                  <Form.Control
                    as="textarea"
                    rows={3}
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    placeholder="Écrivez votre message ici..."
                    isInvalid={!!commentError}
                  />
                  {commentError && (
                    <Form.Control.Feedback type="invalid">
                      {commentError}
                    </Form.Control.Feedback>
                  )}
                </Form.Group>
                <div className="d-grid">
                  <Button
                    variant="primary"
                    type="submit"
                    disabled={submittingComment || !comment.trim()}
                  >
                    {submittingComment ? (
                      <>
                        <Spinner animation="border" size="sm" className="me-2" />
                        Envoi en cours...
                      </>
                    ) : (
                      <>
                        <i className="fas fa-paper-plane me-2"></i> Envoyer
                      </>
                    )}
                  </Button>
                </div>
              </Form>
            </Modal.Body>
            <Modal.Footer>
              <Button variant="secondary" onClick={() => setShowDiscussionModal(false)}>
                Fermer
              </Button>
            </Modal.Footer>
          </>
        )}
      </Modal>
    </div>
  );
};

export default AdminFileManagement; 