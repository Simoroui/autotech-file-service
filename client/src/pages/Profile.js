import React, { useState, useEffect, useRef } from 'react';
import { Container, Row, Col, Card, Form, Button, Alert, Spinner, Tabs, Tab, Image, OverlayTrigger, Tooltip } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { FaCamera, FaUpload } from 'react-icons/fa';
import NotificationSettings from '../components/profile/NotificationSettings';

// Style personnalisé pour les onglets avec texte noir
const tabStyle = {
  color: 'black',
  fontWeight: 'bold'
};

const Profile = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [photoSuccess, setPhotoSuccess] = useState(false);
  const fileInputRef = useRef(null);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const res = await axios.get('/api/users/me');
        setUser(res.data);
        setFormData({
          ...formData,
          name: res.data.name,
          email: res.data.email
        });
        setLoading(false);
      } catch (err) {
        setError('Erreur lors du chargement du profil');
        setLoading(false);
      }
    };

    fetchUser();
  }, []);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validation
    if (formData.newPassword && formData.newPassword !== formData.confirmPassword) {
      setError('Les mots de passe ne correspondent pas');
      return;
    }
    
    setSaving(true);
    setError(null);
    setSuccess(false);
    
    try {
      const updateData = {
        name: formData.name,
        email: formData.email
      };
      
      // Ajouter les mots de passe seulement s'ils sont fournis
      if (formData.currentPassword && formData.newPassword) {
        updateData.currentPassword = formData.currentPassword;
        updateData.newPassword = formData.newPassword;
      }
      
      const res = await axios.put('/api/users/profile', updateData);
      setUser(res.data);
      setSuccess(true);
      
      // Réinitialiser les champs de mot de passe
      setFormData({
        ...formData,
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      });
      
      setSaving(false);
      
      // Masquer le message de succès après 3 secondes
      setTimeout(() => {
        setSuccess(false);
      }, 3000);
    } catch (err) {
      setError(err.response?.data?.message || 'Erreur lors de la mise à jour du profil');
      setSaving(false);
    }
  };

  const handlePhotoUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Vérification du type de fichier
    const validTypes = ['image/jpeg', 'image/png', 'image/jpg'];
    if (!validTypes.includes(file.type)) {
      setError('Veuillez sélectionner une image au format JPG ou PNG');
      return;
    }

    // Vérification de la taille du fichier (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      setError('La taille de l\'image ne doit pas dépasser 2MB');
      return;
    }

    const formData = new FormData();
    formData.append('profilePhoto', file);

    setUploadingPhoto(true);
    setError(null);
    setPhotoSuccess(false);

    try {
      const res = await axios.post('/api/users/profile-photo', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      
      // Mettre à jour l'user avec la nouvelle photo
      setUser({
        ...user,
        photoUrl: res.data.photoUrl
      });
      
      setPhotoSuccess(true);
      setUploadingPhoto(false);
      
      // Masquer le message de succès après 3 secondes
      setTimeout(() => {
        setPhotoSuccess(false);
      }, 3000);
    } catch (err) {
      setError(err.response?.data?.message || 'Erreur lors du téléchargement de la photo');
      setUploadingPhoto(false);
    }
  };

  const triggerFileInput = () => {
    fileInputRef.current.click();
  };

  if (loading) {
    return (
      <Container className="py-5">
        <div className="text-center">
          <Spinner animation="border" variant="danger" />
          <p className="mt-3">Chargement du profil...</p>
        </div>
      </Container>
    );
  }

  return (
    <Container className="py-5">
      <h1 className="mb-4">Mon profil</h1>
      
      {error && <Alert variant="danger">{error}</Alert>}
      {photoSuccess && <Alert variant="success">Photo de profil mise à jour avec succès</Alert>}
      
      <Row>
        <Col lg={4} className="mb-4">
          <Card className="shadow-sm mb-4">
            <Card.Header className="bg-dark text-white">
              <h5 className="mb-0">Informations utilisateur</h5>
            </Card.Header>
            <Card.Body className="text-center">
              <div className="mb-3 position-relative">
                {user?.photoUrl ? (
                  <Image 
                    src={user.photoUrl} 
                    roundedCircle 
                    className="mx-auto" 
                    style={{ width: '100px', height: '100px', objectFit: 'cover' }} 
                  />
                ) : (
                  <div 
                    className="avatar-placeholder bg-danger text-white rounded-circle d-flex align-items-center justify-content-center mx-auto" 
                    style={{ width: '100px', height: '100px', fontSize: '2rem' }}
                  >
                    {user?.name?.charAt(0).toUpperCase() || 'U'}
                  </div>
                )}
                
                <OverlayTrigger
                  placement="bottom"
                  overlay={<Tooltip>Changer la photo de profil</Tooltip>}
                >
                  <Button 
                    variant="dark" 
                    size="sm" 
                    className="position-absolute bottom-0 end-0 translate-middle-x rounded-circle" 
                    style={{ width: '32px', height: '32px', padding: '0' }}
                    onClick={triggerFileInput}
                    disabled={uploadingPhoto}
                  >
                    {uploadingPhoto ? (
                      <Spinner animation="border" size="sm" />
                    ) : (
                      <FaCamera />
                    )}
                  </Button>
                </OverlayTrigger>
                
                <input 
                  type="file" 
                  ref={fileInputRef} 
                  className="d-none" 
                  accept="image/jpeg,image/png,image/jpg" 
                  onChange={handlePhotoUpload}
                />
              </div>
              
              <h4>{user?.name}</h4>
              <p className="text-muted">{user?.email}</p>
              <div className="d-flex justify-content-center">
                <div className="px-3 border-end">
                  <h5>{user?.credits || 0}</h5>
                  <small className="text-muted">Crédits</small>
                </div>
                <div className="px-3">
                  <h5>{user?.role === 'admin' ? 'Administrateur' : user?.role === 'expert' ? 'Expert' : 'Utilisateur'}</h5>
                  <small className="text-muted">Rôle</small>
                </div>
              </div>
            </Card.Body>
          </Card>
          
          <Card className="shadow-sm">
            <Card.Header className="bg-dark text-white">
              <h5 className="mb-0">Actions</h5>
            </Card.Header>
            <Card.Body>
              <div className="d-grid gap-2">
                <Button variant="outline-danger" onClick={() => navigate('/dashboard')}>
                  <i className="fas fa-tachometer-alt me-2"></i> Tableau de bord
                </Button>
                <Button variant="outline-danger" onClick={() => navigate('/upload')}>
                  <i className="fas fa-upload me-2"></i> Envoyer un fichier
                </Button>
              </div>
            </Card.Body>
          </Card>
        </Col>
        
        <Col lg={8}>
          <Tabs defaultActiveKey="account" className="mb-4">
            <Tab eventKey="account" title={<span style={tabStyle}>Compte</span>}>
              <Card className="shadow-sm">
                <Card.Header className="bg-dark text-white">
                  <h5 className="mb-0">Modifier mon profil</h5>
                </Card.Header>
                <Card.Body>
                  {error && <Alert variant="danger">{error}</Alert>}
                  {success && <Alert variant="success">Profil mis à jour avec succès</Alert>}
                  
                  <Form onSubmit={handleSubmit}>
                    <Form.Group className="mb-3">
                      <Form.Label>Nom</Form.Label>
                      <Form.Control
                        type="text"
                        name="name"
                        value={formData.name}
                        onChange={handleChange}
                        required
                      />
                    </Form.Group>
                    
                    <Form.Group className="mb-3">
                      <Form.Label>Email</Form.Label>
                      <Form.Control
                        type="email"
                        name="email"
                        value={formData.email}
                        onChange={handleChange}
                        required
                      />
                    </Form.Group>
                    
                    <hr className="my-4" />
                    
                    <h6 className="mb-3">Changer de mot de passe</h6>
                    
                    <Form.Group className="mb-3">
                      <Form.Label>Mot de passe actuel</Form.Label>
                      <Form.Control
                        type="password"
                        name="currentPassword"
                        value={formData.currentPassword}
                        onChange={handleChange}
                      />
                    </Form.Group>
                    
                    <Form.Group className="mb-3">
                      <Form.Label>Nouveau mot de passe</Form.Label>
                      <Form.Control
                        type="password"
                        name="newPassword"
                        value={formData.newPassword}
                        onChange={handleChange}
                      />
                    </Form.Group>
                    
                    <Form.Group className="mb-4">
                      <Form.Label>Confirmer le nouveau mot de passe</Form.Label>
                      <Form.Control
                        type="password"
                        name="confirmPassword"
                        value={formData.confirmPassword}
                        onChange={handleChange}
                      />
                    </Form.Group>
                    
                    <div className="d-grid">
                      <Button 
                        variant="danger" 
                        type="submit" 
                        disabled={saving}
                      >
                        {saving ? (
                          <>
                            <Spinner
                              as="span"
                              animation="border"
                              size="sm"
                              role="status"
                              aria-hidden="true"
                              className="me-2"
                            />
                            Enregistrement...
                          </>
                        ) : (
                          'Enregistrer les modifications'
                        )}
                      </Button>
                    </div>
                  </Form>
                </Card.Body>
              </Card>
            </Tab>
            
            <Tab eventKey="notifications" title={<span style={tabStyle}>Notifications</span>}>
              <NotificationSettings />
            </Tab>
            
            <Tab eventKey="billing" title={<span style={tabStyle}>Détails de facturation</span>}>
              <Card className="shadow-sm">
                <Card.Header className="bg-dark text-white">
                  <h5 className="mb-0">Informations de facturation</h5>
                </Card.Header>
                <Card.Body>
                  <Form>
                    <Form.Group className="mb-3">
                      <Form.Label>Nom / Raison sociale</Form.Label>
                      <Form.Control
                        type="text"
                        placeholder="Entrez le nom ou la raison sociale"
                      />
                    </Form.Group>
                    
                    <Form.Group className="mb-3">
                      <Form.Label>Numéro TVA (si applicable)</Form.Label>
                      <Form.Control
                        type="text"
                        placeholder="Entrez votre numéro de TVA"
                      />
                    </Form.Group>
                    
                    <Form.Group className="mb-3">
                      <Form.Label>Adresse de facturation</Form.Label>
                      <Form.Control
                        as="textarea"
                        rows={2}
                        placeholder="Entrez votre adresse complète"
                      />
                    </Form.Group>
                    
                    <Form.Group className="mb-3">
                      <Form.Label>Ville</Form.Label>
                      <Form.Control
                        type="text"
                        placeholder="Entrez votre ville"
                      />
                    </Form.Group>
                    
                    <Row>
                      <Col md={6}>
                        <Form.Group className="mb-3">
                          <Form.Label>Code postal</Form.Label>
                          <Form.Control
                            type="text"
                            placeholder="Entrez votre code postal"
                          />
                        </Form.Group>
                      </Col>
                      <Col md={6}>
                        <Form.Group className="mb-3">
                          <Form.Label>Pays</Form.Label>
                          <Form.Control
                            as="select"
                            defaultValue="Tunisie"
                          >
                            <option value="Tunisie">Tunisie</option>
                            <option value="France">France</option>
                            <option value="Algérie">Algérie</option>
                            <option value="Maroc">Maroc</option>
                            <option value="Autre">Autre</option>
                          </Form.Control>
                        </Form.Group>
                      </Col>
                    </Row>
                    
                    <hr className="my-4" />
                    
                    <h6 className="mb-3">Méthode de paiement par défaut</h6>
                    
                    <Form.Group className="mb-3">
                      <Form.Check
                        type="radio"
                        label="Carte bancaire"
                        name="paymentMethod"
                        id="card"
                        defaultChecked
                      />
                      <Form.Check
                        type="radio"
                        label="PayPal"
                        name="paymentMethod"
                        id="paypal"
                      />
                      <Form.Check
                        type="radio"
                        label="Virement bancaire"
                        name="paymentMethod"
                        id="transfer"
                      />
                    </Form.Group>
                    
                    <div className="d-grid">
                      <Button variant="danger">
                        Enregistrer les informations de facturation
                      </Button>
                    </div>
                  </Form>
                </Card.Body>
              </Card>
            </Tab>
          </Tabs>
        </Col>
      </Row>
    </Container>
  );
};

export default Profile; 