import React, { useState, useEffect } from 'react';
import { Card, Form, Button, Alert, Spinner } from 'react-bootstrap';
import axios from 'axios';

const NotificationSettings = () => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [preferences, setPreferences] = useState({
    fileStatusUpdates: true,
    newFeatures: true,
    promotions: false,
    emailFrequency: 'immediate'
  });

  useEffect(() => {
    const fetchPreferences = async () => {
      try {
        const res = await axios.get('/api/users/me');
        if (res.data.notificationPreferences) {
          setPreferences(res.data.notificationPreferences);
        }
        setLoading(false);
      } catch (err) {
        setError('Erreur lors du chargement des préférences de notification');
        setLoading(false);
      }
    };

    fetchPreferences();
  }, []);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setPreferences({
      ...preferences,
      [name]: type === 'checkbox' ? checked : value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setSuccess(false);

    try {
      await axios.put('/api/users/notification-preferences', preferences);
      setSuccess(true);
      setSaving(false);
      
      // Masquer le message de succès après 3 secondes
      setTimeout(() => {
        setSuccess(false);
      }, 3000);
    } catch (err) {
      setError(err.response?.data?.message || 'Erreur lors de la mise à jour des préférences');
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="text-center my-4">
        <Spinner animation="border" variant="danger" />
        <p className="mt-2">Chargement des préférences...</p>
      </div>
    );
  }

  return (
    <Card className="shadow-sm">
      <Card.Header className="bg-light text-dark">
        <h5 className="mb-0">Préférences de notification</h5>
      </Card.Header>
      <Card.Body>
        {error && <Alert variant="danger">{error}</Alert>}
        {success && <Alert variant="success">Préférences mises à jour avec succès</Alert>}
        
        <Form onSubmit={handleSubmit}>
          <Form.Group className="mb-3">
            <Form.Label className="fw-bold">Notifications par email</Form.Label>
            <div className="mb-2">
              <Form.Check
                type="checkbox"
                id="fileStatusUpdates"
                name="fileStatusUpdates"
                label="Mises à jour de statut des fichiers"
                checked={preferences.fileStatusUpdates}
                onChange={handleChange}
              />
              <small className="text-muted d-block ms-4">
                Recevez des notifications lorsque le statut de vos fichiers change
              </small>
            </div>
            
            <div className="mb-2">
              <Form.Check
                type="checkbox"
                id="newFeatures"
                name="newFeatures"
                label="Nouvelles fonctionnalités et mises à jour"
                checked={preferences.newFeatures}
                onChange={handleChange}
              />
              <small className="text-muted d-block ms-4">
                Soyez informé des nouvelles fonctionnalités et améliorations de la plateforme
              </small>
            </div>
            
            <div className="mb-2">
              <Form.Check
                type="checkbox"
                id="promotions"
                name="promotions"
                label="Offres promotionnelles"
                checked={preferences.promotions}
                onChange={handleChange}
              />
              <small className="text-muted d-block ms-4">
                Recevez des offres spéciales et des promotions sur nos services
              </small>
            </div>
          </Form.Group>
          
          <Form.Group className="mb-4">
            <Form.Label className="fw-bold">Fréquence des emails récapitulatifs</Form.Label>
            <Form.Select
              name="emailFrequency"
              value={preferences.emailFrequency}
              onChange={handleChange}
            >
              <option value="immediate">Immédiat (pour chaque événement)</option>
              <option value="daily">Résumé quotidien</option>
              <option value="weekly">Résumé hebdomadaire</option>
            </Form.Select>
            <small className="text-muted">
              Choisissez à quelle fréquence vous souhaitez recevoir les notifications par email
            </small>
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
                'Enregistrer les préférences'
              )}
            </Button>
          </div>
        </Form>
      </Card.Body>
    </Card>
  );
};

export default NotificationSettings; 