import React, { useState, useEffect, useContext, useRef } from 'react';
import { Dropdown, Badge, Button, Spinner } from 'react-bootstrap';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import AuthContext from '../../context/auth/authContext';
import './NotificationBell.css';

const NotificationBell = () => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [show, setShow] = useState(false);
  const authContext = useContext(AuthContext);
  const { isAuthenticated, user } = authContext;
  const navigate = useNavigate();
  const dropdownRef = useRef(null);
  const pollingIntervalRef = useRef(null);

  // Récupérer les notifications au démarrage et quand l'utilisateur se connecte
  useEffect(() => {
    if (isAuthenticated) {
      fetchNotifications();
      
      // Configurer un intervalle pour mettre à jour les notifications toutes les 5 secondes
      pollingIntervalRef.current = setInterval(() => {
        fetchNotifications();
      }, 5000);
    }

    // Nettoyer l'intervalle quand le composant est démonté ou quand l'utilisateur se déconnecte
    return () => {
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
      }
    };
  }, [isAuthenticated]);

  const fetchNotifications = async () => {
    try {
      // Ne pas afficher l'indicateur de chargement pendant les actualisations périodiques
      const isInitialLoad = loading;
      if (isInitialLoad) {
        setLoading(true);
      }
      
      const res = await axios.get('/api/notifications');
      
      // Vérifier s'il y a de nouvelles notifications non lues
      const prevUnreadCount = notifications.filter(n => !n.read).length;
      const newUnreadCount = res.data.filter(n => !n.read).length;
      
      // Jouer un son de notification si nous avons de nouvelles notifications
      if (newUnreadCount > prevUnreadCount && notifications.length > 0) {
        try {
          const audio = new Audio('/notification.mp3');
          audio.play().catch(e => console.log('Impossible de jouer le son de notification:', e));
          
          // Afficher une notification de bureau si l'API est disponible
          if ('Notification' in window && Notification.permission === 'granted') {
            new Notification('Nouvelle notification', {
              body: 'Vous avez reçu une nouvelle notification',
              icon: '/favicon.ico'
            });
          } else if ('Notification' in window && Notification.permission !== 'denied') {
            Notification.requestPermission();
          }
        } catch (e) {
          console.error('Erreur lors de la notification sonore:', e);
        }
      }
      
      setNotifications(res.data);
      
      if (isInitialLoad) {
        setLoading(false);
      }
    } catch (err) {
      console.error('Erreur lors du chargement des notifications:', err);
      setError('Erreur de chargement');
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

  const markAllAsRead = async (e) => {
    if (e) e.stopPropagation();
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

  const navigateToFile = (fileId) => {
    navigate(`/files/${fileId}`);
    setShow(false);
  };

  const handleNotificationClick = (notification) => {
    markAsRead(notification._id);
    if (notification.fileId) {
      navigateToFile(notification.fileId);
    }
  };

  const formatRelativeTime = (dateString) => {
    const now = new Date();
    const date = new Date(dateString);
    const diffInSeconds = Math.floor((now - date) / 1000);
    
    if (diffInSeconds < 60) return `Il y a ${diffInSeconds} secondes`;
    if (diffInSeconds < 3600) return `Il y a ${Math.floor(diffInSeconds / 60)} minutes`;
    if (diffInSeconds < 86400) return `Il y a ${Math.floor(diffInSeconds / 3600)} heures`;
    if (diffInSeconds < 604800) return `Il y a ${Math.floor(diffInSeconds / 86400)} jours`;
    
    return date.toLocaleDateString('fr-FR');
  };

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'status_update':
        return <i className="fas fa-sync-alt"></i>;
      case 'message':
        return <i className="fas fa-comment"></i>;
      case 'credit_update':
        return <i className="fas fa-coins"></i>;
      case 'file_assignment':
        return <i className="fas fa-tasks"></i>;
      case 'system':
        return <i className="fas fa-cog"></i>;
      default:
        return <i className="fas fa-bell"></i>;
    }
  };

  // Fonction pour formater le message avec un lien si nécessaire
  const formatNotificationMessage = (notification) => {
    if (notification.fileId && notification.message.includes("Votre fichier est prêt")) {
      return (
        <>
          {notification.message}{' '}
          <span 
            className="notification-link"
            onClick={(e) => {
              e.stopPropagation();
              navigateToFile(notification.fileId);
            }}
          >
            Voir les détails
          </span>
        </>
      );
    }
    return notification.message;
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <Dropdown 
      className="notification-dropdown" 
      show={show}
      onToggle={(nextShow) => setShow(nextShow)}
      ref={dropdownRef}
      align="end"
    >
      <Dropdown.Toggle variant="link" className="notification-bell-toggle px-2 mx-2">
        {unreadCount > 0 ? (
          <>
            <i className="fas fa-bell notification-bell notification-bell-active"></i>
            <Badge pill bg="danger" className="notification-badge">
              {unreadCount > 99 ? '99+' : unreadCount}
            </Badge>
          </>
        ) : (
          <i className="fas fa-bell notification-bell"></i>
        )}
      </Dropdown.Toggle>

      <Dropdown.Menu className="notification-menu">
        <div className="notification-header">
          <h6 className="mb-0">Notifications</h6>
          {unreadCount > 0 && (
            <Button 
              variant="link" 
              size="sm" 
              className="p-0 text-primary" 
              onClick={markAllAsRead}
            >
              Tout marquer comme lu
            </Button>
          )}
        </div>
        <hr className="my-2" />
        <div className="notification-list">
          {loading ? (
            <div className="text-center p-3">
              <Spinner animation="border" size="sm" />
            </div>
          ) : error ? (
            <div className="text-center p-3">
              <small className="text-danger">{error}</small>
            </div>
          ) : notifications.length === 0 ? (
            <div className="text-center p-3">
              <small className="text-muted">Aucune notification</small>
            </div>
          ) : (
            notifications.slice(0, 5).map(notification => (
              <div key={notification._id} className={`notification-item ${!notification.read ? 'unread' : ''}`}>
                <div className="notification-icon">
                  {getNotificationIcon(notification.type)}
                </div>
                <div className="notification-content">
                  <div className="notification-message" onClick={() => handleNotificationClick(notification)}>
                    {formatNotificationMessage(notification)}
                  </div>
                  <div className="notification-time">
                    {formatRelativeTime(notification.createdAt)}
                  </div>
                </div>
                <div className="notification-delete" onClick={(e) => {
                  e.stopPropagation();
                  deleteNotification(notification._id);
                }}>
                  <i className="fas fa-times"></i>
                </div>
              </div>
            ))
          )}
        </div>
        <hr className="my-2" />
        <div className="text-center p-2">
          <Link to="/notifications" className="btn btn-sm btn-outline-primary w-100">
            Voir toutes les notifications
          </Link>
        </div>
      </Dropdown.Menu>
    </Dropdown>
  );
};

export default NotificationBell; 