import React, { useState, useEffect, useContext } from 'react';
import { Container, Row, Col, Card, ListGroup, Button, Spinner, Badge } from 'react-bootstrap';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import AuthContext from '../context/auth/authContext';

const NotificationsPage = () => {
  const authContext = useContext(AuthContext);
  const { isAuthenticated, user } = authContext;
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    
    fetchNotifications();
  }, [isAuthenticated, navigate]);

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const res = await axios.get('/api/notifications');
      setNotifications(res.data);
      setLoading(false);
    } catch (err) {
      console.error('Erreur lors du chargement des notifications:', err);
      setError('Impossible de charger les notifications. Veuillez réessayer plus tard.');
      setLoading(false);
    }
  };

  const markAsRead = async (id) => {
    try {
      await axios.put(`/api/notifications/read/${id}`);
      setNotifications(
        notifications.map(notif => 
          notif._id === id ? { ...notif, read: true } : notif
        )
      );
    } catch (err) {
      console.error('Erreur lors du marquage de la notification:', err);
    }
  };

  const markAllAsRead = async () => {
    try {
      await axios.put('/api/notifications/read-all');
      setNotifications(
        notifications.map(notif => ({ ...notif, read: true }))
      );
    } catch (err) {
      console.error('Erreur lors du marquage des notifications:', err);
    }
  };

  const deleteNotification = async (id) => {
    try {
      await axios.delete(`/api/notifications/${id}`);
      setNotifications(
        notifications.filter(notif => notif._id !== id)
      );
    } catch (err) {
      console.error('Erreur lors de la suppression de la notification:', err);
    }
  };

  const deleteAllNotifications = async () => {
    try {
      await axios.delete('/api/notifications');
      setNotifications([]);
    } catch (err) {
      console.error('Erreur lors de la suppression des notifications:', err);
    }
  };

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

  const getNotificationTypeDetails = (type) => {
    switch (type) {
      case 'status_update':
        return { 
          icon: '🔄',
          bg: 'info',
          label: 'Mise à jour de statut' 
        };
      case 'message':
        return { 
          icon: '💬',
          bg: 'primary',
          label: 'Nouveau message' 
        };
      case 'credit_update':
        return { 
          icon: '💰',
          bg: 'success',
          label: 'Mise à jour de crédit' 
        };
      case 'file_assignment':
        return { 
          icon: '📋',
          bg: 'warning',
          label: 'Assignation de fichier' 
        };
      case 'system':
        return { 
          icon: '⚙️',
          bg: 'secondary',
          label: 'Notification système' 
        };
      default:
        return { 
          icon: '🔔',
          bg: 'light',
          label: 'Notification' 
        };
    }
  };

  return (
    <Container className="py-4">
      <Row className="mb-4">
        <Col>
          <Link to="/dashboard" className="btn btn-outline-secondary mb-3">
            <i className="fas fa-arrow-left me-2"></i> Retour au tableau de bord
          </Link>
          <h2>Mes notifications</h2>
        </Col>
        <Col xs="auto" className="d-flex align-items-end">
          {notifications.length > 0 && (
            <div className="d-flex gap-2">
              <Button 
                variant="outline-primary" 
                onClick={markAllAsRead}
                disabled={loading || !notifications.some(n => !n.read)}
              >
                <i className="fas fa-check-double me-2"></i> Tout marquer comme lu
              </Button>
              <Button 
                variant="outline-danger" 
                onClick={deleteAllNotifications}
                disabled={loading || notifications.length === 0}
              >
                <i className="fas fa-trash me-2"></i> Supprimer tout
              </Button>
            </div>
          )}
        </Col>
      </Row>

      <Card className="shadow-sm">
        <Card.Body>
          {loading ? (
            <div className="text-center p-5">
              <Spinner animation="border" variant="primary" />
              <p className="mt-3">Chargement des notifications...</p>
            </div>
          ) : error ? (
            <div className="text-center text-danger p-5">
              <i className="fas fa-exclamation-circle fa-3x mb-3"></i>
              <p>{error}</p>
            </div>
          ) : notifications.length === 0 ? (
            <div className="text-center text-muted p-5">
              <i className="fas fa-bell-slash fa-3x mb-3"></i>
              <p>Vous n'avez aucune notification</p>
            </div>
          ) : (
            <ListGroup variant="flush">
              {notifications.map(notification => {
                const { icon, bg, label } = getNotificationTypeDetails(notification.type);
                return (
                  <ListGroup.Item 
                    key={notification._id}
                    className={`border-bottom py-3 ${!notification.read ? 'bg-light border-start border-3 border-primary' : ''}`}
                  >
                    <Row>
                      <Col xs="auto" className="pe-0">
                        <div className={`d-flex align-items-center justify-content-center bg-${bg} text-dark rounded-circle`} style={{ width: '40px', height: '40px' }}>
                          {icon}
                        </div>
                      </Col>
                      <Col>
                        <div className="d-flex justify-content-between align-items-start">
                          <div>
                            <Badge bg={bg} className="mb-2">{label}</Badge>
                            {!notification.read && (
                              <Badge bg="danger" className="ms-2">Nouveau</Badge>
                            )}
                            <p className="mb-1">{notification.message}</p>
                            <small className="text-muted">
                              {formatDate(notification.createdAt)}
                            </small>
                          </div>
                          <div className="d-flex gap-2">
                            {!notification.read && (
                              <Button 
                                variant="outline-primary" 
                                size="sm"
                                onClick={() => markAsRead(notification._id)}
                              >
                                <i className="fas fa-check"></i>
                              </Button>
                            )}
                            {notification.fileId && (
                              <Button 
                                variant="outline-secondary" 
                                size="sm"
                                onClick={() => navigate(`/files/${notification.fileId}`)}
                              >
                                <i className="fas fa-eye me-1"></i> Voir le fichier
                              </Button>
                            )}
                            <Button 
                              variant="outline-danger" 
                              size="sm"
                              onClick={() => deleteNotification(notification._id)}
                            >
                              <i className="fas fa-trash"></i>
                            </Button>
                          </div>
                        </div>
                      </Col>
                    </Row>
                  </ListGroup.Item>
                );
              })}
            </ListGroup>
          )}
        </Card.Body>
      </Card>
    </Container>
  );
};

export default NotificationsPage; 