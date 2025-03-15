import React, { useState, useEffect, useContext, useRef } from 'react';
import { Row, Col, Card, Badge, Button, Alert, Spinner, Form, ListGroup, Tabs, Tab, Modal } from 'react-bootstrap';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import AuthContext from '../../context/auth/authContext';
import './NotificationBell.css';

// Désactiver les notifications Chrome pour empêcher les boucles
if (typeof window !== 'undefined' && 'Notification' in window) {
  // Sauvegarder la fonction Notification originale
  const originalNotification = window.Notification;
  
  // Remplacer la fonction Notification par une version vide qui ne fait rien
  window.Notification = function() {
    console.log('Tentative de notification Chrome interceptée et bloquée.');
    return {
      close: () => {}
    };
  };
  
  // Copier les propriétés statiques
  window.Notification.permission = originalNotification.permission;
  window.Notification.requestPermission = () => {
    console.log('Tentative de demande de permission pour notifications Chrome bloquée.');
    return Promise.resolve('denied');
  };
}

const AdminFileDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [comments, setComments] = useState([]);
  const [comment, setComment] = useState('');
  const [submittingComment, setSubmittingComment] = useState(false);
  const [commentError, setCommentError] = useState(null);
  const pollingIntervalRef = useRef(null); // Référence pour l'intervalle de polling
  const authContext = useContext(AuthContext);
  const { user } = authContext;
  
  // États pour le téléversement de fichier traité
  const [uploadFile, setUploadFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState(null);
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const [fileUploaded, setFileUploaded] = useState(false); // Nouvel état pour indiquer qu'un fichier a été téléversé
  const [downloadError, setDownloadError] = useState(null);
  
  // États pour la gestion du statut
  const [selectedStatus, setSelectedStatus] = useState('');
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [statusUpdateSuccess, setStatusUpdateSuccess] = useState(false);
  const [statusUpdateError, setStatusUpdateError] = useState(null);
  
  // Nouvel état pour le modal de changement de statut après téléchargement
  const [showStatusModal, setShowStatusModal] = useState(false);

  // État pour l'image du commentaire
  const [commentImage, setCommentImage] = useState(null);
  const [commentImagePreview, setCommentImagePreview] = useState(null);
  
  // État pour indiquer qu'il y a des nouveaux messages
  const [hasNewMessages, setHasNewMessages] = useState(false);

  // Ajouter des refs pour suivre les valeurs actuelles utilisées dans l'intervalle
  const commentsRef = useRef([]);
  const loadingRef = useRef(true);
  const errorRef = useRef(null);

  // Mettre à jour les refs lorsque les états changent
  useEffect(() => {
    commentsRef.current = comments;
  }, [comments]);

  useEffect(() => {
    loadingRef.current = loading;
  }, [loading]);

  useEffect(() => {
    errorRef.current = error;
  }, [error]);

  // Ajouter cette fonction pour récupérer les informations d'un utilisateur
  const getUserInfoById = async (userId) => {
    if (!userId) {
      console.log('getUserInfoById: userID est null ou undefined');
      return null;
    }
    
    // S'assurer que userId est une chaîne
    const userIdString = typeof userId === 'object' && userId._id 
      ? userId._id.toString() 
      : typeof userId === 'object' && userId.id 
        ? userId.id.toString() 
        : userId.toString();
    
    console.log(`getUserInfoById: Tentative de récupération des infos pour l'utilisateur ${userIdString}`);
    
    try {
      const config = {
        headers: {
          'Content-Type': 'application/json',
          'x-auth-token': localStorage.getItem('token')
        }
      };
      
      console.log(`getUserInfoById: Appel API GET /api/users/${userIdString}`, config);
      
      // Récupérer les informations de l'utilisateur
      const response = await axios.get(`/api/users/${userIdString}`, config);
      console.log(`Informations utilisateur récupérées pour ${userIdString}:`, response.data);
      
      if (response.data && response.data.name) {
        console.log(`getUserInfoById: Nom d'utilisateur trouvé: "${response.data.name}"`);
      } else {
        console.log(`getUserInfoById: Nom d'utilisateur non trouvé dans la réponse:`, response.data);
      }
      
      return response.data;
    } catch (error) {
      console.error(`Impossible de récupérer les informations pour l'utilisateur ${userIdString}:`, error);
      console.error('Message d\'erreur:', error.message);
      if (error.response) {
        console.error('Réponse d\'erreur:', error.response.status, error.response.data);
      }
      return null;
    }
  };

  // Fonction pour obtenir le libellé du statut - Définition au début du composant pour être disponible partout
  const getStatusLabel = (status) => {
    switch (status) {
      case 'pending':
        return 'En attente';
      case 'processing':
        return 'En cours de traitement';
      case 'completed':
        return 'Terminé';
      case 'rejected':
        return 'Rejeté';
      default:
        return status || 'En attente';
    }
  };

  // Fonction pour récupérer les commentaires avec meilleure gestion d'erreurs
  const fetchComments = async () => {
    try {
      console.log("Vérification de nouveaux commentaires pour l'administrateur...");
      
      if (!id) {
        console.error("Impossible de récupérer les commentaires: ID de fichier manquant");
        return [];
      }
      
      const token = localStorage.getItem('token');
      if (!token) {
        console.error("Impossible de récupérer les commentaires: Token d'authentification manquant");
        return [];
      }
      
      const config = {
        headers: {
          'Content-Type': 'application/json',
          'x-auth-token': token
        }
      };
      
      console.log(`Tentative de récupération des commentaires pour le fichier ${id}...`);
      
      // Essayer d'abord avec la route admin
      try {
        const adminRes = await axios.get(`/api/admin/files/${id}`, config);
        console.log("Réponse de la route admin pour les commentaires:", adminRes.data ? "Données reçues" : "Pas de données");
        
        if (adminRes.data && adminRes.data.discussionComments) {
          return await formatComments(adminRes.data);
        }
      } catch (adminErr) {
        console.log("Échec avec la route admin pour les commentaires, tentative avec la route standard");
      }
      
      // Fallback à la route standard
      const res = await axios.get(`/api/ecu-files/${id}`, config);
      
      if (!res || !res.data) {
        console.log('Aucune donnée de fichier trouvée');
        return [];
      }
      
      if (!res.data.discussionComments) {
        console.log('Aucun commentaire trouvé dans les données');
        return [];
      }
      
      // S'assurer que discussionComments est bien un tableau
      if (!Array.isArray(res.data.discussionComments)) {
        console.error('discussionComments n\'est pas un tableau:', res.data.discussionComments);
        return [];
      }
      
      return await formatComments(res.data);
    } catch (error) {
      console.error('Erreur lors de la récupération des commentaires:', error);
      console.error('Détails de l\'erreur:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status
      });
      return [];
    }
  };
  
  // Nouvelle fonction pour formater les commentaires
  const formatComments = async (data) => {
    if (!data || !data.discussionComments || !Array.isArray(data.discussionComments)) {
      return [];
    }
    
    // Récupérer les images sauvegardées dans le localStorage
    let savedImages = {};
    try {
      savedImages = JSON.parse(localStorage.getItem('savedCommentImages') || '{}');
      console.log('Images sauvegardées trouvées pour admin:', Object.keys(savedImages).length);
    } catch (e) {
      console.error('Erreur lors de la lecture des images sauvegardées pour admin:', e);
    }
    
    // Formatage des commentaires
    const formattedComments = await Promise.all(
      data.discussionComments.map(async (comment) => {
        let userName = 'Utilisateur';
        
        // Déterminer si ce commentaire appartient à l'administrateur actuel
        let isCurrentAdmin = false;
        try {
          isCurrentAdmin = comment.user === user?._id;
        } catch (e) {
          console.error('Erreur lors de la vérification si le commentaire est de l\'admin actuel:', e);
        }
        
        if (isCurrentAdmin) {
          userName = 'Vous';
        } else if (comment.admin || (data && data.adminIds && data.adminIds.includes(comment.user))) {
          // C'est un autre administrateur
          userName = 'Administrateur';
        } else if (comment.expert) {
          userName = 'Expert technique';
        } else {
          // C'est un client
          if (comment.user === data.user) {
            // C'est le propriétaire du fichier
            if (data.clientName) {
              userName = `Client ${data.clientName}`;
            } else {
              userName = 'Client';
            }
          } else {
            // Autre client, récupérer son nom
            console.log(`Récupération des infos pour un autre client: ${comment.user}`);
            const userInfo = await getUserInfoById(comment.user);
            if (userInfo && userInfo.name) {
              userName = `Client ${userInfo.name}`;
              console.log(`Nom de l'autre client trouvé: ${userInfo.name}`);
            } else {
              userName = 'Client';
              console.log(`Aucun nom trouvé pour l'autre client ${comment.user}`);
            }
          }
        }
        
        console.log(`Commentaire formaté - Utilisateur: ${userName}, ID: ${comment.user}`);
        
        // Récupérer le chemin d'image s'il existe
        let imagePath = comment.imagePath;
        
        // Vérifier si nous avons une image sauvegardée pour ce commentaire
        if (savedImages[comment._id]) {
          console.log(`Image restaurée depuis localStorage pour le commentaire admin ${comment._id}: ${savedImages[comment._id]}`);
          imagePath = savedImages[comment._id];
        } else if (imagePath && !imagePath.startsWith('http')) {
          console.log("Correction du chemin d'image admin:", imagePath);
          // Assurez-vous que le chemin commence par un / s'il n'est pas absolu
          imagePath = imagePath.startsWith('/') ? imagePath : `/${imagePath}`;
          console.log("Chemin d'image admin corrigé:", imagePath);
        }
        
        return {
          id: comment._id,
          user: userName,
          text: comment.text,
          date: comment.createdAt,
          imagePath: imagePath, // Utiliser le chemin corrigé ou récupéré
          isCurrentUser: comment.user === user?._id,
          isAdmin: comment.admin || (data.adminIds && data.adminIds.includes(comment.user))
        };
      })
    );
    
    return formattedComments;
  };

  useEffect(() => {
    const fetchFile = async () => {
      try {
        setLoading(true);
        setError(null);
        
        console.log('Tentative de récupération des détails du fichier admin avec id:', id);
        
        // Définir un délai maximum de chargement (20 secondes)
        const timeoutId = setTimeout(() => {
          console.log('Délai de chargement dépassé, annulation du chargement...');
          setLoading(false);
          setError('Le chargement a été annulé car il prenait trop de temps. Vous pouvez toujours voir les détails partiels.');
        }, 20000);
        
        const config = {
          headers: {
            'Content-Type': 'application/json',
            'x-auth-token': localStorage.getItem('token')
          }
        };
        
        console.log('Token utilisé:', localStorage.getItem('token'));
        
        // Essayer d'abord avec la route admin dédiée
        try {
          console.log('Tentative avec la route admin /api/admin/files/:id');
          const res = await axios.get(`/api/admin/files/${id}`, config);
          console.log('Réponse de la route admin:', res.data ? 'Données reçues' : 'Pas de données');
          
          if (res && res.data) {
            clearTimeout(timeoutId); // Nettoyer le timeout si on a une réponse
            processFileData(res.data);
            return;
          }
        } catch (adminErr) {
          console.error('Détails de l\'erreur admin:', adminErr.response?.data || adminErr.message);
          console.log('Échec avec la route admin, tentative avec la route standard:', adminErr.message);
        }
        
        // Fallback à la route standard si la route admin échoue
        try {
          console.log('Tentative avec la route standard /api/ecu-files/:id');
          const res = await axios.get(`/api/ecu-files/${id}`, config);
          console.log('Réponse de la route standard:', res.data ? 'Données reçues' : 'Pas de données');
          
          clearTimeout(timeoutId); // Nettoyer le timeout si on a une réponse
          
          if (!res || !res.data) {
            throw new Error('Données de fichier incomplètes ou manquantes');
          }
          
          processFileData(res.data);
        } catch (stdErr) {
          clearTimeout(timeoutId); // Nettoyer le timeout en cas d'erreur
          console.error('Erreur route standard:', stdErr.message);
          throw stdErr; // propager l'erreur
        }
      } catch (err) {
        console.error('Erreur lors du chargement du fichier:', err);
        console.error('Détails complets de l\'erreur:', {
          message: err.message,
          response: err.response?.data,
          status: err.response?.status
        });
        setError('Erreur lors du chargement des détails du fichier: ' + (err.response?.data?.message || err.message));
        setLoading(false);
      }
    };
    
    // Fonction pour traiter les données du fichier une fois reçues
    const processFileData = async (data) => {
      try {
        console.log('Données du fichier reçues:', data);
        console.log('Traitement des données du fichier');
        
        // Vérifier si les données sont valides
        if (!data || (typeof data === 'object' && Object.keys(data).length === 0)) {
          console.error('Données de fichier vides ou invalides');
          setError('Données de fichier vides ou invalides');
          setLoading(false);
          return;
        }
        
        // Préparer les données du fichier
        const fileData = {
          ...data,
          statusLabel: getStatusLabel(data.status || 'pending')
        };
        
        console.log('Données du fichier traitées:', {
          id: fileData._id,
          status: fileData.status,
          statusLabel: fileData.statusLabel
        });
        
        // Récupérer automatiquement les informations client si elles ne sont pas déjà présentes
        if (fileData.user && !fileData.userName && !fileData.clientName) {
          console.log(`Tentative automatique de récupération des informations du client:`, fileData.user);
          
          // Extraire l'ID utilisateur correctement
          const userId = typeof fileData.user === 'object' && fileData.user._id 
            ? fileData.user._id 
            : typeof fileData.user === 'object' && fileData.user.id 
              ? fileData.user.id 
              : fileData.user;
          
          console.log(`ID utilisateur extrait pour récupération automatique: ${userId}`);
          
          // Appel asynchrone pour récupérer les informations client
          getUserInfoById(userId)
            .then(userInfo => {
              if (userInfo && userInfo.name) {
                console.log(`Informations client récupérées: ${userInfo.name}`);
                setFile(prev => ({
                  ...prev,
                  userName: userInfo.name,
                  clientName: userInfo.name
                }));
              } else {
                // Si la route standard échoue, essayer avec une route admin
                console.log("Tentative avec la route admin...");
                const adminConfig = {
                  headers: {
                    'Content-Type': 'application/json',
                    'x-auth-token': localStorage.getItem('token')
                  }
                };
                
                axios.get(`/api/admin/users/${userId}`, adminConfig)
                  .then(adminResponse => {
                    if (adminResponse.data && adminResponse.data.name) {
                      console.log(`Informations client récupérées via route admin: ${adminResponse.data.name}`);
                      setFile(prev => ({
                        ...prev,
                        userName: adminResponse.data.name,
                        clientName: adminResponse.data.name
                      }));
                    } else {
                      console.error('Aucune information de nom trouvée dans la réponse admin');
                    }
                  })
                  .catch(error => {
                    console.error('Erreur lors de la récupération des informations client via route admin:', error);
                  });
              }
            })
            .catch(error => {
              console.error('Erreur lors de la récupération des informations client:', error);
            });
        }
        
        setFile(fileData);
        
        // Récupérer et formater les commentaires
        fetchComments().then(formattedComments => {
          console.log('Commentaires récupérés:', formattedComments?.length || 0);
          if (formattedComments && formattedComments.length > 0) {
            setComments(formattedComments);
          }
          
          // Initialiser le statut sélectionné avec le statut actuel du fichier
          if (fileData.status) {
            setSelectedStatus(fileData.status);
          }
          
          setLoading(false);
          console.log('Chargement des détails terminé.');
        }).catch(commentErr => {
          console.error('Erreur lors de la récupération des commentaires:', commentErr);
          // Ne pas bloquer l'affichage de la page si les commentaires échouent
          setLoading(false);
          console.log('Chargement des détails terminé malgré l\'erreur des commentaires.');
        });
      } catch (processErr) {
        console.error('Erreur lors du traitement des données:', processErr);
        setError('Erreur lors du traitement des données du fichier');
        setLoading(false);
      }
    };

    fetchFile();
    
    // Commenté: Ne plus demander la permission pour les notifications Chrome
    /*
    if ('Notification' in window && Notification.permission !== 'denied') {
      Notification.requestPermission();
    }
    */
    
    // Configurer un intervalle pour vérifier les nouveaux commentaires toutes les 3 secondes
    pollingIntervalRef.current = setInterval(async () => {
      if (!loadingRef.current && !errorRef.current) {
        try {
          const newComments = await fetchComments();
          if (newComments && newComments.length > 0) {
            // Vérifier s'il y a de nouveaux commentaires par rapport à l'état actuel
            const currentCommentsIds = commentsRef.current.map(c => c.id);
            const hasNewComments = newComments.some(c => !currentCommentsIds.includes(c.id));
            
            if (hasNewComments) {
              console.log("Nouveaux commentaires détectés dans l'interface admin");
              
              // Activer l'indicateur visuel de nouveaux messages
              setHasNewMessages(true);
              
              // Limiter les notifications sonores à une fois toutes les 30 secondes
              const lastSoundNotificationKey = `last_sound_notification_${id}`;
              const lastSoundTime = localStorage.getItem(lastSoundNotificationKey) || 0;
              const currentTime = new Date().getTime();
              
              // Vérifier si au moins 30 secondes se sont écoulées depuis la dernière notification sonore
              if ((currentTime - parseInt(lastSoundTime)) > 30000) {
                // Jouer le son de notification
                const audio = new Audio('/sounds/notification.mp3');
                audio.play().catch(e => console.error("Erreur lors de la lecture du son:", e));
                
                // Mettre à jour le timestamp de la dernière notification sonore
                localStorage.setItem(lastSoundNotificationKey, currentTime.toString());
              }
            }
            
            // Préserver les commentaires temporaires
            const tempComments = commentsRef.current.filter(c => c.temporary);
            setComments([...newComments, ...tempComments]);
          }
        } catch (e) {
          console.error("Erreur lors de la vérification des nouveaux commentaires:", e);
        }
      }
    }, 3000); // Réduire l'intervalle à 3 secondes pour une meilleure réactivité
    
    // Nettoyer l'intervalle lors du démontage du composant
    return () => {
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
        pollingIntervalRef.current = null;
      }
    };
  }, [id]); // eslint-disable-next-line react-hooks/exhaustive-deps

  const handleCommentSubmit = async (e) => {
    e.preventDefault();
    if (!comment.trim() && !commentImage) {
      setCommentError('Veuillez entrer un commentaire ou sélectionner une image');
      return;
    }
    
    setCommentError(null);
    setSubmittingComment(true);
    
    // Créer un commentaire temporaire avec le bon affichage "Administrateur"
    const tempComment = {
      id: `temp-${Date.now()}`,
      user: 'Vous',
      text: comment,
      date: new Date().toISOString(),
      hasImage: !!commentImage,
      isCurrentUser: true,
      temporary: true
    };
    
    // Ajouter immédiatement le commentaire temporaire
    setComments(prevComments => [...prevComments, tempComment]);
    
    // Effacer l'input de commentaire immédiatement pour une meilleure UX
    setComment('');
    
    try {
      // Créer un FormData si on a une image
      let data;
      let config;
      
      if (commentImage) {
        data = new FormData();
        // S'assurer qu'il y a toujours un texte, même vide
        data.append('comment', comment.trim() || "");
        data.append('image', commentImage);
        
        config = {
          headers: {
            'Content-Type': 'multipart/form-data',
            'x-auth-token': localStorage.getItem('token')
          }
        };
      } else {
        data = { comment: tempComment.text };
        config = {
          headers: {
            'Content-Type': 'application/json',
            'x-auth-token': localStorage.getItem('token')
          }
        };
      }
      
      console.log("Envoi du commentaire au serveur:", {
        url: `/api/ecu-files/${id}/comments`,
        hasImage: !!commentImage,
        textLength: (comment.trim() || "").length
      });
      
      const res = await axios.post(`/api/ecu-files/${id}/comments`, data, config);
      
      // Si le serveur a bien reçu le commentaire
      if (res.data && res.data.discussionComments && res.data.discussionComments.length > 0) {
        // Récupérer le dernier commentaire (celui qu'on vient d'ajouter)
        const newComment = res.data.discussionComments[res.data.discussionComments.length - 1];
        
        // Corriger le chemin d'image pour qu'il pointe vers le serveur Express
        let imagePath = newComment.imagePath;
        if (imagePath && !imagePath.startsWith('http')) {
          console.log("Correction du chemin d'image dans la réponse admin:", imagePath);
          // Assurez-vous que le chemin commence par un / s'il n'est pas absolu
          imagePath = imagePath.startsWith('/') ? imagePath : `/${imagePath}`;
          console.log("Chemin d'image admin corrigé:", imagePath);
        }
        
        // Remplacer le commentaire temporaire par le vrai commentaire
        setComments(prevComments => prevComments.map(c => 
          c.id === tempComment.id 
            ? {
                id: newComment._id,
                user: 'Vous', // Garder "Vous" pour l'administrateur actuel
                text: newComment.text,
                date: newComment.createdAt,
                imagePath: imagePath, // Utiliser le chemin corrigé
                isCurrentUser: true
              }
            : c
        ));
        
        // Conserver une copie du commentaire avec l'image dans le localStorage
        if (imagePath) {
          try {
            const savedComments = JSON.parse(localStorage.getItem('savedCommentImages') || '{}');
            savedComments[newComment._id] = imagePath;
            localStorage.setItem('savedCommentImages', JSON.stringify(savedComments));
            console.log(`Image du commentaire admin ${newComment._id} sauvegardée en local`);
          } catch (e) {
            console.error('Erreur lors de la sauvegarde locale de l\'image admin:', e);
          }
        }
      }
      
      // Réinitialiser l'image
      setCommentImage(null);
      setCommentImagePreview(null);
      
      setSubmittingComment(false);
    } catch (error) {
      console.error('Erreur lors de l\'envoi du commentaire (admin):', error);
      
      // En cas d'erreur, supprimer le commentaire temporaire et restaurer le texte
      setComments(prevComments => prevComments.filter(c => c.id !== tempComment.id));
      setComment(tempComment.text); // Restaurer le texte du commentaire dans l'input
      
      setCommentError('Erreur lors de l\'envoi du commentaire. Veuillez réessayer.');
      setSubmittingComment(false);
    }
  };

  // Fonction pour télécharger le fichier original
  const downloadOriginalFile = async () => {
    try {
      setDownloadError(null);
      console.log('Téléchargement du fichier original...');
      
      // Configurer l'en-tête d'autorisation
      const config = {
        headers: {
          'Content-Type': 'application/json',
          'x-auth-token': localStorage.getItem('token')
        },
        responseType: 'blob' // Important pour recevoir le fichier comme un blob
      };
      
      // Faire la requête pour télécharger le fichier
      const response = await axios.get(`/api/ecu-files/download-original/${id}`, config);
      
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
        if (filenameMatch && filenameMatch.length === 2) {
          filename = filenameMatch[1];
        }
      }
      
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      
      // Nettoyer
      window.URL.revokeObjectURL(url);
      document.body.removeChild(link);
      
      // Proposer de changer le statut après le téléchargement
      // Ne proposer que si le statut n'est pas déjà "en cours de traitement" ou "terminé"
      if (file.status === 'pending') {
        // Initialiser le statut sélectionné sur "En cours de traitement"
        setSelectedStatus('processing');
        // Afficher le modal
        setShowStatusModal(true);
      }
    } catch (error) {
      console.error('Erreur lors du téléchargement du fichier:', error);
      setDownloadError('Erreur lors du téléchargement du fichier original: ' + 
        (error.response?.data?.message || error.message));
    }
  };

  // Fonction pour télécharger le fichier modifié
  const downloadModifiedFile = async () => {
    try {
      setDownloadError(null);
      console.log('Téléchargement du fichier modifié...');
      
      if (!file.fileInfo.modifiedFilePath) {
        throw new Error('Aucun fichier modifié n\'est disponible');
      }
      
      // Configurer l'en-tête d'autorisation
      const config = {
        headers: {
          'Content-Type': 'application/json',
          'x-auth-token': localStorage.getItem('token')
        },
        responseType: 'blob' // Important pour recevoir le fichier comme un blob
      };
      
      // Faire la requête pour télécharger le fichier
      const response = await axios.get(`/api/ecu-files/download-modified/${id}`, config);
      
      // Créer un URL pour le blob
      const url = window.URL.createObjectURL(new Blob([response.data]));
      
      // Créer un lien temporaire pour déclencher le téléchargement
      const link = document.createElement('a');
      link.href = url;
      
      // Déterminer le nom du fichier
      const contentDisposition = response.headers['content-disposition'];
      let filename = 'fichier_modifie.bin';
      
      if (contentDisposition) {
        const filenameMatch = contentDisposition.match(/filename="(.+)"/);
        if (filenameMatch && filenameMatch.length === 2) {
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
      console.error('Erreur lors du téléchargement du fichier modifié:', error);
      setDownloadError('Erreur lors du téléchargement du fichier modifié: ' + 
        (error.response?.data?.message || error.message));
    }
  };

  // Fonction pour gérer le changement de fichier à téléverser
  const handleFileChange = (e) => {
    setUploadFile(e.target.files[0]);
    setUploadError(null);
  };

  // Fonction pour téléverser un fichier modifié
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
      
      console.log('Envoi du fichier modifié au serveur pour ID:', id);
      
      // Appel API pour uploader un fichier modifié
      const response = await axios.post(`/api/admin/files/${id}/upload-modified`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
          'x-auth-token': token
        }
      });
      
      console.log('Réponse du serveur:', response.data);
      
      // Mettre à jour le fichier avec le nouveau chemin du fichier modifié
      setFile({
        ...file,
        fileInfo: { 
          ...file.fileInfo, 
          modifiedFilePath: response.data.modifiedFilePath 
        }
      });
      
      setUploadSuccess(true);
      setFileUploaded(true); // Marquer que le fichier a été téléversé (cet état ne changera pas avec le timer)
      setUploadFile(null);
      
      // Réinitialiser seulement le message de succès après quelques secondes
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

  // Fonction pour gérer le changement de statut
  const handleStatusChange = (e) => {
    setSelectedStatus(e.target.value);
    // Réinitialiser les messages
    setStatusUpdateSuccess(false);
    setStatusUpdateError(null);
  };

  // Fonction pour mettre à jour le statut du fichier
  const updateFileStatus = async (e) => {
    if (e) e.preventDefault(); // Rendre le paramètre e optionnel pour permettre l'appel depuis le modal
    
    if (!selectedStatus) {
      setStatusUpdateError('Veuillez sélectionner un statut');
      return;
    }
    
    try {
      setUpdatingStatus(true);
      setStatusUpdateError(null);
      
      const config = {
        headers: {
          'Content-Type': 'application/json',
          'x-auth-token': localStorage.getItem('token')
        }
      };
      
      console.log(`Mise à jour du statut du fichier ${id} vers: ${selectedStatus}`);
      
      // Envoyer la requête de mise à jour
      const response = await axios.put(`/api/admin/files/${id}/status`, 
        { status: selectedStatus }, 
        config
      );
      
      console.log('Réponse mise à jour statut:', response.data);
      
      // Mettre à jour l'état local du fichier
      setFile(prevFile => ({
        ...prevFile,
        status: selectedStatus
      }));
      
      setStatusUpdateSuccess(true);
      
      // Fermer le modal si ouvert
      setShowStatusModal(false);
      
      // Effacer le message de succès après 3 secondes
      setTimeout(() => {
        setStatusUpdateSuccess(false);
      }, 3000);
      
    } catch (error) {
      console.error('Erreur lors de la mise à jour du statut:', error);
      
      if (error.response) {
        setStatusUpdateError(error.response.data?.message || `Erreur ${error.response.status}: ${error.response.statusText}`);
      } else if (error.request) {
        setStatusUpdateError('Aucune réponse reçue du serveur. Vérifiez votre connexion internet.');
      } else {
        setStatusUpdateError(`Erreur: ${error.message}`);
      }
    } finally {
      setUpdatingStatus(false);
    }
  };

  // Fonction pour gérer le changement d'image pour le commentaire
  const handleCommentImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        setCommentError('L\'image est trop volumineuse. La taille maximale est de 5 Mo.');
        return;
      }
      
      setCommentImage(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setCommentImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };
  
  // Fonction pour supprimer l'image d'aperçu du commentaire
  const removeCommentImage = () => {
    setCommentImage(null);
    setCommentImagePreview(null);
  };

  const formatDate = (dateStr) => {
    return new Date(dateStr).toLocaleString();
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'pending':
        return <Badge bg="warning">En attente</Badge>;
      case 'processing':
      case 'in_progress':
        return <Badge bg="info">En cours</Badge>;
      case 'completed':
        return <Badge bg="success">Terminé</Badge>;
      case 'rejected':
        return <Badge bg="danger">Rejeté</Badge>;
      default:
        return <Badge bg="secondary">{status}</Badge>;
    }
  };

  const handleGoBack = () => {
    navigate('/admin/files');
  };

  if (loading) {
    return (
      <div className="text-center p-5">
        <Spinner animation="border" variant="primary" />
        <p className="mt-3">Chargement des détails du fichier...</p>
        <Button variant="danger" onClick={() => setLoading(false)}>
          Annuler le chargement et afficher les détails partiels
        </Button>
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="danger" className="m-3">
        <Alert.Heading>Erreur</Alert.Heading>
        <p>{error}</p>
        <div className="d-flex justify-content-between">
          <Button variant="outline-primary" onClick={handleGoBack}>
            Retour à la liste des fichiers
          </Button>
          <Button variant="outline-danger" onClick={() => window.location.reload()}>
            Rafraîchir la page
          </Button>
        </div>
      </Alert>
    );
  }

  if (!file) {
    return (
      <Alert variant="warning" className="m-3">
        <Alert.Heading>Fichier non trouvé</Alert.Heading>
        <p>Le fichier que vous cherchez n'existe pas ou vous n'avez pas les droits pour y accéder.</p>
        <div className="d-flex justify-content-between">
          <Button variant="outline-primary" onClick={handleGoBack}>
            Retour à la liste des fichiers
          </Button>
          <Button variant="outline-warning" onClick={() => window.location.reload()}>
            Réessayer
          </Button>
        </div>
      </Alert>
    );
  }

  return (
    <div className="container-fluid py-4">
      {/* Modal pour proposer le changement de statut après téléchargement */}
      <Modal show={showStatusModal} onHide={() => setShowStatusModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Modifier le statut du fichier</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <p>Vous venez de télécharger le fichier original. Souhaitez-vous mettre à jour le statut de ce fichier ?</p>
          <Form.Group>
            <Form.Label>Nouveau statut</Form.Label>
            <Form.Select 
              value={selectedStatus} 
              onChange={(e) => setSelectedStatus(e.target.value)}
            >
              <option value="">Sélectionnez un statut</option>
              <option value="pending">En attente</option>
              <option value="processing">En cours de traitement</option>
              <option value="completed">Terminé</option>
              <option value="rejected">Rejeté</option>
            </Form.Select>
          </Form.Group>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowStatusModal(false)}>
            Annuler
          </Button>
          <Button 
            variant="primary" 
            onClick={updateFileStatus}
            disabled={!selectedStatus || updatingStatus}
          >
            {updatingStatus ? (
              <>
                <Spinner animation="border" size="sm" className="me-2" />
                Mise à jour...
              </>
            ) : (
              'Mettre à jour le statut'
            )}
          </Button>
        </Modal.Footer>
      </Modal>

      <Row className="mb-4">
        <Col>
          <Button variant="outline-secondary" onClick={handleGoBack} className="mb-3">
            <i className="fas fa-arrow-left me-2"></i> Retour à la liste des fichiers
          </Button>
          <h2>Détails du fichier</h2>
          <p className="text-muted">
            <i className="fas fa-calendar me-2"></i> Soumis le {new Date(file.createdAt).toLocaleDateString()}
          </p>
        </Col>
      </Row>

      <Row>
        <Col lg={8}>
          <Tabs defaultActiveKey="details" className="mb-4">
            <Tab eventKey="details" title={
              <span className="text-dark">
                <i className="fas fa-info-circle me-2"></i>Détails
              </span>
            }>
              <Card className="shadow-sm mb-4">
                <Card.Header className="bg-dark text-white">
                  <h5 className="mb-0">Informations générales</h5>
                </Card.Header>
                <Card.Body>
                  <Row>
                    <Col md={6}>
                      <p><strong>Statut:</strong> {getStatusBadge(file.status)}</p>
                      <p><strong>Date de soumission:</strong> {formatDate(file.createdAt)}</p>
                      <p><strong>Client:</strong> {file.userName || file.clientName || (
                        <span>
                          Client inconnu 
                          <Button 
                            variant="link" 
                            className="p-0 ms-2" 
                            size="sm" 
                            onClick={async () => {
                              if (file.user) {
                                try {
                                  console.log(`Tentative de récupération des informations du client:`, file.user);
                                  console.log('Données du fichier:', file);
                                  
                                  // Extraire l'ID utilisateur correctement
                                  const userId = typeof file.user === 'object' && file.user._id 
                                    ? file.user._id 
                                    : typeof file.user === 'object' && file.user.id 
                                      ? file.user.id 
                                      : file.user;
                                  
                                  console.log(`ID utilisateur extrait: ${userId}`);
                                  
                                  // Essai avec la route des utilisateurs standard
                                  const userInfo = await getUserInfoById(userId);
                                  
                                  if (userInfo && userInfo.name) {
                                    console.log(`Informations client récupérées: ${userInfo.name}`);
                                    setFile(prev => ({
                                      ...prev,
                                      userName: userInfo.name,
                                      clientName: userInfo.name
                                    }));
                                    alert(`Informations client mises à jour: ${userInfo.name}`);
                                  } else {
                                    // Si la route standard échoue, essayer avec une route admin
                                    console.log("Tentative avec la route admin...");
                                    const adminConfig = {
                                      headers: {
                                        'Content-Type': 'application/json',
                                        'x-auth-token': localStorage.getItem('token')
                                      }
                                    };
                                    
                                    const adminResponse = await axios.get(`/api/admin/users/${userId}`, adminConfig);
                                    
                                    if (adminResponse.data && adminResponse.data.name) {
                                      console.log(`Informations client récupérées via route admin: ${adminResponse.data.name}`);
                                      setFile(prev => ({
                                        ...prev,
                                        userName: adminResponse.data.name,
                                        clientName: adminResponse.data.name
                                      }));
                                      alert(`Informations client mises à jour: ${adminResponse.data.name}`);
                                    } else {
                                      console.error('Aucune information de nom trouvée dans la réponse admin');
                                      alert('Impossible de récupérer le nom du client');
                                    }
                                  }
                                } catch (error) {
                                  console.error('Erreur lors de la récupération des informations client:', error);
                                  alert('Erreur lors de la récupération des informations client');
                                }
                              } else {
                                console.error('ID utilisateur manquant dans les données du fichier');
                                alert('ID client manquant');
                              }
                            }}
                          >
                            <i className="fas fa-sync-alt"></i> Actualiser
                          </Button>
                        </span>
                      )}</p>
                      
                      {/* Informations ECU - Vérification exhaustive de toutes les structures possibles */}
                      {(file.ecuInfo?.ecuType || file.fileInfo?.ecuType || file.ecuType) && (
                        <p><strong>Type d'ECU:</strong> {file.ecuInfo?.ecuType || file.fileInfo?.ecuType || file.ecuType}</p>
                      )}
                      {(file.ecuInfo?.ecuBrand || file.fileInfo?.ecuBrand || file.ecuBrand) && (
                        <p><strong>Marque d'ECU:</strong> {file.ecuInfo?.ecuBrand || file.fileInfo?.ecuBrand || file.ecuBrand}</p>
                      )}
                      {(file.ecuInfo?.softwareNumber || file.fileInfo?.swNumber || file.softwareNumber) && (
                        <p><strong>Numéro de logiciel (SW):</strong> {file.ecuInfo?.softwareNumber || file.fileInfo?.swNumber || file.softwareNumber}</p>
                      )}
                      {(file.ecuInfo?.hardwareNumber || file.fileInfo?.hwNumber || file.hardwareNumber) && (
                        <p><strong>Numéro de matériel (HW):</strong> {file.ecuInfo?.hardwareNumber || file.fileInfo?.hwNumber || file.hardwareNumber}</p>
                      )}
                      
                      {(file.reprogrammingTool || file.fileInfo?.reprogrammingTool) && (
                        <p><strong>Outil de reprogrammation:</strong> {file.reprogrammingTool || file.fileInfo?.reprogrammingTool}</p>
                      )}
                      {(file.readMethod || file.fileInfo?.readMethod) && (
                        <p><strong>Méthode de lecture:</strong> {file.readMethod || file.fileInfo?.readMethod}</p>
                      )}
                    </Col>
                    <Col md={6}>
                      {/* Informations Véhicule - Vérification exhaustive de toutes les structures possibles */}
                      {(file.vehicleInfo?.vehicleType || file.vehicleInfo?.type || file.vehicleType) && (
                        <p><strong>Type de véhicule:</strong> {file.vehicleInfo?.vehicleType || file.vehicleInfo?.type || file.vehicleType}</p>
                      )}
                      
                      {/* Affichage du véhicule (marque, modèle, année) */}
                      {file.vehicleInfo && (
                        <p>
                          <strong>Véhicule:</strong> {file.vehicleInfo.manufacturer || ''} {file.vehicleInfo.model || ''} 
                          {file.vehicleInfo.year ? ` (${file.vehicleInfo.year})` : ''}
                        </p>
                      )}
                      
                      {file.vehicleInfo?.engine && (
                        <p><strong>Moteur:</strong> {file.vehicleInfo.engine}</p>
                      )}
                      
                      <p><strong>Crédits utilisés:</strong> {file.totalCredits || 0}</p>
                      
                      {file.vehicleInfo?.vin && (
                        <p><strong>VIN:</strong> {file.vehicleInfo.vin}</p>
                      )}
                      
                      {file.vehicleInfo?.transmission && (
                        <p><strong>Transmission:</strong> {file.vehicleInfo.transmission}</p>
                      )}
                      
                      {file.vehicleInfo?.power && (
                        <p><strong>Puissance:</strong> {file.vehicleInfo.power} cv</p>
                      )}
                      
                      {file.vehicleInfo?.mileage && (
                        <p><strong>Kilométrage:</strong> {file.vehicleInfo.mileage} km</p>
                      )}
                      
                      {file.vehicleInfo?.licensePlate && (
                        <p><strong>Plaque d'immatriculation:</strong> {file.vehicleInfo.licensePlate}</p>
                      )}
                    </Col>
                  </Row>
                  
                  {file.notes && (
                    <Row className="mt-3">
                      <Col>
                        <h6>Notes du client:</h6>
                        <p className="border p-3 bg-light">{file.notes}</p>
                      </Col>
                    </Row>
                  )}
                  
                  {file.options && (
                    <Row className="mt-3">
                      <Col>
                        <h6>Options demandées:</h6>
                        
                        {/* Affichage de débogage - console uniquement */}
                        {console.log("Toutes les options disponibles:", file.options)}
                        
                        <ul className="list-group">
                          {/* Options spécifiques avec formatage */}
                          {file.options.powerIncrease && (
                            <li className="list-group-item">
                              <i className="fas fa-tachometer-alt me-2 text-primary"></i>
                              Augmentation de puissance: {file.options.powerIncrease}
                            </li>
                          )}
                          {file.options.dpfOff && (
                            <li className="list-group-item">
                              <i className="fas fa-filter me-2 text-danger"></i>
                              DPF/FAP OFF
                            </li>
                          )}
                          {file.options.egrOff && (
                            <li className="list-group-item">
                              <i className="fas fa-wind me-2 text-warning"></i>
                              EGR OFF
                            </li>
                          )}
                          {file.options.speedLimiter && (
                            <li className="list-group-item">
                              <i className="fas fa-tachometer-alt me-2 text-success"></i>
                              Limiteur de vitesse: {file.options.speedLimiter}
                            </li>
                          )}
                          {file.options.adblueOff && (
                            <li className="list-group-item">
                              <i className="fas fa-flask me-2 text-info"></i>
                              AdBlue OFF
                            </li>
                          )}
                          {file.options.dtcOff && (
                            <li className="list-group-item">
                              <i className="fas fa-exclamation-triangle me-2 text-warning"></i>
                              DTC OFF (Suppression des codes défaut)
                            </li>
                          )}
                          {file.options.tvaOff && (
                            <li className="list-group-item">
                              <i className="fas fa-sliders-h me-2 text-secondary"></i>
                              TVA (Throttle Valve Actuator) OFF
                            </li>
                          )}
                          {file.options.flapsOff && (
                            <li className="list-group-item">
                              <i className="fas fa-sliders-h me-2 text-secondary"></i>
                              Flaps OFF
                            </li>
                          )}
                          {file.options.startStopOff && (
                            <li className="list-group-item">
                              <i className="fas fa-power-off me-2 text-danger"></i>
                              Start-Stop OFF
                            </li>
                          )}
                          {file.options.o2Off && (
                            <li className="list-group-item">
                              <i className="fas fa-atom me-2 text-primary"></i>
                              O2 Sensor OFF
                            </li>
                          )}
                          {file.options.lambdaOff && (
                            <li className="list-group-item">
                              <i className="fas fa-atom me-2 text-info"></i>
                              Lambda OFF
                            </li>
                          )}
                          {file.options.immoOff && (
                            <li className="list-group-item">
                              <i className="fas fa-key me-2 text-danger"></i>
                              Immobilisateur OFF
                            </li>
                          )}
                          {file.options.hotStart && (
                            <li className="list-group-item">
                              <i className="fas fa-fire me-2 text-warning"></i>
                              Hot Start
                            </li>
                          )}
                          {file.options.revLimit && (
                            <li className="list-group-item">
                              <i className="fas fa-tachometer-alt me-2 text-danger"></i>
                              Limiteur de régime: {file.options.revLimit}
                            </li>
                          )}
                          {file.options.throttleResponse && (
                            <li className="list-group-item">
                              <i className="fas fa-bolt me-2 text-success"></i>
                              Réponse d'accélération
                            </li>
                          )}
                          {file.options.other && (
                            <li className="list-group-item">
                              <i className="fas fa-cogs me-2 text-secondary"></i>
                              Autres: {file.options.other}
                            </li>
                          )}
                          
                          {/* Affichage dynamique de toutes les options supplémentaires */}
                          {Object.entries(file.options).map(([key, value]) => {
                            const explicitOptions = [
                              'powerIncrease', 'dpfOff', 'egrOff', 'speedLimiter', 'adblueOff', 
                              'dtcOff', 'tvaOff', 'flapsOff', 'startStopOff', 'o2Off', 'lambdaOff',
                              'immoOff', 'hotStart', 'revLimit', 'throttleResponse', 'other'
                            ];
                            
                            if (!explicitOptions.includes(key) && value) {
                              // Formater la clé pour l'affichage
                              const formattedKey = key
                                .replace(/([A-Z])/g, ' $1')
                                .replace(/^./, str => str.toUpperCase());
                                
                              return (
                                <li key={key} className="list-group-item">
                                  <i className="fas fa-check-circle me-2 text-primary"></i>
                                  {formattedKey}: {typeof value === 'boolean' ? 'Oui' : value}
                                </li>
                              );
                            }
                            return null;
                          })}
                        </ul>
                      </Col>
                    </Row>
                  )}
                </Card.Body>
              </Card>
            </Tab>
            
            <Tab eventKey="fichiers" title={
              <span className="text-dark">
                <i className="fas fa-file me-2"></i>Fichiers
              </span>
            }>
              <Card className="shadow-sm mb-4">
                <Card.Header className="bg-dark text-white">
                  <h5 className="mb-0">Gestion des fichiers</h5>
                </Card.Header>
                <Card.Body>
                  <Row className="mb-4">
                    <Col>
                      <h6 className="mb-3">Fichiers disponibles</h6>
                      <ListGroup>
                        <ListGroup.Item className="d-flex justify-content-between align-items-center">
                          <div>
                            <i className="fas fa-file-code me-2 text-primary"></i>
                            Fichier original
                            {file.fileInfo?.originalFilePath && (
                              <div className="text-muted small">
                                {file.fileInfo.originalFilePath.split('/').pop()}
                              </div>
                            )}
                          </div>
                          <Button 
                            variant="outline-primary" 
                            size="sm"
                            onClick={downloadOriginalFile}
                          >
                            <i className="fas fa-download me-1"></i> Télécharger
                          </Button>
                        </ListGroup.Item>
                        
                        {file.fileInfo?.modifiedFilePath && (
                          <ListGroup.Item className="d-flex justify-content-between align-items-center">
                            <div>
                              <i className="fas fa-file-code me-2 text-success"></i>
                              Fichier modifié
                              <div className="text-muted small">
                                {file.fileInfo.modifiedFilePath.split('/').pop()}
                              </div>
                            </div>
                            <Button 
                              variant="outline-success" 
                              size="sm"
                              onClick={downloadModifiedFile}
                            >
                              <i className="fas fa-download me-1"></i> Télécharger
                            </Button>
                          </ListGroup.Item>
                        )}
                      </ListGroup>
                      
                      {downloadError && (
                        <Alert variant="danger" className="mt-3">
                          {downloadError}
                        </Alert>
                      )}
                    </Col>
                  </Row>
                  
                  <Row>
                    <Col>
                      <h6 className="mb-3">Téléverser un fichier traité</h6>
                      <Form.Group className="mb-3">
                        <Form.Control
                          type="file"
                          onChange={handleFileChange}
                          accept=".bin,.ori,.hex,.frf"
                        />
                        <Form.Text className="text-muted">
                          Formats acceptés: .bin, .ori, .hex, .frf - Taille maximale: 10 Mo
                        </Form.Text>
                      </Form.Group>
                      
                      {uploadError && (
                        <Alert variant="danger" className="mb-3">
                          {uploadError}
                        </Alert>
                      )}
                      
                      {uploadSuccess && (
                        <Alert variant="success" className="mb-3">
                          Fichier téléversé avec succès ! Vous pouvez maintenant marquer le traitement comme terminé ou envoyer ce fichier au client.
                        </Alert>
                      )}
                      
                      <div className="d-grid gap-2">
                        <Button 
                          variant="primary"
                          onClick={uploadModifiedFile}
                          disabled={!uploadFile || uploading}
                        >
                          {uploading ? (
                            <>
                              <Spinner animation="border" size="sm" className="me-2" />
                              Téléversement en cours...
                            </>
                          ) : (
                            <>
                              <i className="fas fa-upload me-2"></i> Téléverser le fichier
                            </>
                          )}
                        </Button>
                        
                        {fileUploaded && (
                          <div className="mt-3">
                            <h6>Marquer ce fichier comme traité:</h6>
                            <Row>
                              <Col sm={8}>
                                <Form.Select 
                                  value={selectedStatus} 
                                  onChange={handleStatusChange}
                                  className="mb-2"
                                >
                                  <option value="">Sélectionnez un statut</option>
                                  <option value="pending">En attente</option>
                                  <option value="processing">En cours de traitement</option>
                                  <option value="completed">Terminé</option>
                                  <option value="rejected">Rejeté</option>
                                </Form.Select>
                              </Col>
                              <Col sm={4}>
                                <Button 
                                  variant="success" 
                                  onClick={(e) => updateFileStatus(e)}
                                  disabled={!selectedStatus || updatingStatus}
                                  className="w-100"
                                >
                                  {updatingStatus ? (
                                    <>
                                      <Spinner animation="border" size="sm" className="me-2" />
                                      Mise à jour...
                                    </>
                                  ) : (
                                    <>
                                      <i className="fas fa-check me-2"></i>Actualiser
                                    </>
                                  )}
                                </Button>
                              </Col>
                            </Row>
                            
                            {statusUpdateSuccess && (
                              <Alert variant="success" className="mt-2 mb-0">
                                Le statut a été mis à jour avec succès!
                              </Alert>
                            )}
                            
                            {statusUpdateError && (
                              <Alert variant="danger" className="mt-2 mb-0">
                                {statusUpdateError}
                              </Alert>
                            )}
                          </div>
                        )}
                      </div>
                    </Col>
                  </Row>
                </Card.Body>
              </Card>
            </Tab>

            <Tab eventKey="statut" title={
              <span className="text-dark">
                <i className="fas fa-tasks me-2"></i>Statut
              </span>
            }>
              <Card className="shadow-sm mb-4">
                <Card.Header className="bg-dark text-white">
                  <h5 className="mb-0">Gestion du statut</h5>
                </Card.Header>
                <Card.Body>
                  <p>Statut actuel: {getStatusBadge(file.status)}</p>
                  
                  <Form onSubmit={updateFileStatus}>
                    <Form.Group className="mb-3">
                      <Form.Label>Changer le statut</Form.Label>
                      <Form.Select value={selectedStatus} onChange={handleStatusChange}>
                        <option value="">Sélectionnez un statut</option>
                        <option value="pending">En attente</option>
                        <option value="processing">En cours de traitement</option>
                        <option value="completed">Terminé</option>
                        <option value="rejected">Rejeté</option>
                      </Form.Select>
                    </Form.Group>
                    
                    {statusUpdateError && (
                      <Alert variant="danger" className="mb-3">
                        {statusUpdateError}
                      </Alert>
                    )}
                    
                    {statusUpdateSuccess && (
                      <Alert variant="success" className="mb-3">
                        Le statut a été mis à jour avec succès!
                      </Alert>
                    )}
                    
                    <Button 
                      variant="primary" 
                      type="submit"
                      disabled={updatingStatus || !selectedStatus}
                    >
                      {updatingStatus ? (
                        <>
                          <Spinner animation="border" size="sm" className="me-2" />
                          Mise à jour en cours...
                        </>
                      ) : (
                        'Mettre à jour le statut'
                      )}
                    </Button>
                  </Form>
                </Card.Body>
              </Card>
            </Tab>

            <Tab eventKey="traitement" title={
              <span className="text-dark">
                <i className="fas fa-cogs me-2"></i>Traitement
              </span>
            }>
              <Card className="shadow-sm mb-4">
                <Card.Header className="bg-dark text-white">
                  <h5 className="mb-0">Options de traitement</h5>
                </Card.Header>
                <Card.Body>
                  <p>Options demandées par le client:</p>
                  
                  {file.options ? (
                    <ul>
                      {/* Options spécifiques explicites */}
                      {file.options?.powerIncrease && <li>Augmentation de puissance: {file.options.powerIncrease}</li>}
                      {file.options?.dpfOff && <li>DPF/FAP OFF</li>}
                      {file.options?.egrOff && <li>EGR OFF</li>}
                      {file.options?.speedLimiter && <li>Limiteur de vitesse: {file.options.speedLimiter}</li>}
                      {file.options?.adblueOff && <li>AdBlue OFF</li>}
                      {file.options?.dtcOff && <li>DTC OFF (Suppression des codes défaut)</li>}
                      {file.options?.tvaOff && <li>TVA (Throttle Valve Actuator) OFF</li>}
                      {file.options?.flapsOff && <li>Flaps OFF</li>}
                      {file.options?.startStopOff && <li>Start-Stop OFF</li>}
                      {file.options?.o2Off && <li>O2 Sensor OFF</li>}
                      {file.options?.lambdaOff && <li>Lambda OFF</li>}
                      {file.options?.immoOff && <li>Immobilisateur OFF</li>}
                      {file.options?.hotStart && <li>Hot Start</li>}
                      {file.options?.revLimit && <li>Limiteur de régime: {file.options.revLimit}</li>}
                      {file.options?.throttleResponse && <li>Réponse d'accélération</li>}
                      {file.options?.other && <li>Autres options: {file.options.other}</li>}
                      
                      {/* Affichage dynamique de toutes les options supplémentaires */}
                      {Object.entries(file.options).map(([key, value]) => {
                        const explicitOptions = [
                          'powerIncrease', 'dpfOff', 'egrOff', 'speedLimiter', 'adblueOff', 
                          'dtcOff', 'tvaOff', 'flapsOff', 'startStopOff', 'o2Off', 'lambdaOff',
                          'immoOff', 'hotStart', 'revLimit', 'throttleResponse', 'other'
                        ];
                        
                        if (!explicitOptions.includes(key) && value) {
                          // Formater la clé pour l'affichage
                          const formattedKey = key
                            .replace(/([A-Z])/g, ' $1')
                            .replace(/^./, str => str.toUpperCase());
                            
                          return (
                            <li key={key}>{formattedKey}: {typeof value === 'boolean' ? 'Oui' : value}</li>
                          );
                        }
                        return null;
                      })}
                    </ul>
                  ) : (
                    <p className="text-muted">Aucune option spécifiée</p>
                  )}
                </Card.Body>
              </Card>
            </Tab>

            <Tab eventKey="discussion" title={
              <span className="text-dark">
                <i className="fas fa-comments me-2"></i>Discussion
              </span>
            }>
              <Card className="shadow-sm sticky-top" style={{top: "1rem", maxHeight: "calc(100vh - 2rem)", overflowY: "auto"}}>
                <Card.Header className={`d-flex justify-content-between align-items-center ${hasNewMessages ? 'bg-primary text-white' : 'bg-dark text-white'}`}>
                  <h5 className="mb-0">
                    {hasNewMessages && <i className="fas fa-circle text-warning me-2 fa-xs" style={{animation: "pulse 1s infinite"}}></i>}
                    Discussion avec le client
                  </h5>
                  <span className={`badge ${hasNewMessages ? 'bg-warning text-dark' : 'bg-light text-dark'}`}>
                    {comments.length} message{comments.length !== 1 ? 's' : ''}
                  </span>
                </Card.Header>
                <Card.Body>
                  <div className="comments-section mb-4" style={{ maxHeight: 'calc(100vh - 300px)', overflowY: 'auto' }} onClick={() => setHasNewMessages(false)}>
                    {comments.length > 0 ? (
                      <ListGroup variant="flush">
                        {comments.map((comment, index) => (
                          <ListGroup.Item 
                            key={comment.id || index} 
                            className={`mb-2 rounded shadow-sm ${comment.isCurrentUser ? 'current-user-comment' : ''} ${comment.temporary ? 'temporary-comment' : ''}`}
                            style={{
                              backgroundColor: comment.isCurrentUser ? '#f0f7ff' : // Bleu clair pour admin (current user)
                                              comment.isAdmin ? '#ffffff' : // Blanc pour autres admins
                                              '#f6f9f6', // Vert très clair pour client
                              border: comment.temporary ? '1px dashed #ccc' : '1px solid #e9e9e9',
                              opacity: comment.temporary ? 0.8 : 1
                            }}
                          >
                            <div>
                              <strong style={{
                                color: comment.isCurrentUser ? '#0056b3' : // Bleu foncé pour admin actuel
                                        comment.isAdmin ? '#212529' : // Texte standard pour autres admins
                                        '#28a745' // Vert pour client
                              }}>
                                {comment.user}
                              </strong>
                              <small className="text-muted ms-2">
                                {comment.date && new Date(comment.date).toLocaleString()}
                              </small>
                            </div>
                            <p style={{ whiteSpace: 'pre-wrap', marginTop: '0.5rem', marginBottom: comment.imagePath ? '0.5rem' : '0' }}>
                              {comment.text}
                            </p>
                            
                            {comment.imagePath && (
                              <div className="comment-image-container">
                                <img 
                                  src={comment.imagePath} 
                                  alt="Pièce jointe" 
                                  className="img-fluid rounded mt-2" 
                                  style={{ maxHeight: '200px', cursor: 'pointer' }}
                                  onClick={() => {
                                    // Ouvrir l'image dans un nouvel onglet
                                    window.open(comment.imagePath, '_blank');
                                  }}
                                  onError={(e) => {
                                    console.error(`Erreur de chargement d'image: ${comment.imagePath}`);
                                    e.target.onerror = null;
                                    e.target.style.display = 'none';
                                    e.target.parentNode.innerHTML += '<div class="alert alert-warning mt-2">Impossible de charger l\'image</div>';
                                  }}
                                />
                              </div>
                            )}
                            {comment.hasImage && comment.temporary && (
                              <div className="mb-2">
                                <div className="border p-2 text-center bg-light">
                                  <Spinner animation="border" size="sm" className="me-2" />
                                  Envoi de l'image en cours...
                                </div>
                              </div>
                            )}
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
                      />
                    </Form.Group>
                    
                    <Form.Group className="mb-3">
                      <Form.Label>Ajouter une image (optionnel)</Form.Label>
                      <Form.Control
                        type="file"
                        onChange={handleCommentImageChange}
                        accept="image/jpeg,image/png,image/gif"
                      />
                      <Form.Text className="text-muted">
                        Formats acceptés: jpg, png, gif - Taille maximale: 5 Mo
                      </Form.Text>
                    </Form.Group>
                    
                    {commentImagePreview && (
                      <div className="mb-3 position-relative">
                        <img 
                          src={commentImagePreview} 
                          alt="Aperçu" 
                          style={{ maxWidth: '100%', maxHeight: '200px' }} 
                          className="img-thumbnail"
                        />
                        <Button 
                          variant="danger" 
                          size="sm" 
                          className="position-absolute top-0 end-0 m-1"
                          onClick={removeCommentImage}
                        >
                          <i className="fas fa-times"></i>
                        </Button>
                      </div>
                    )}
                    
                    {commentError && (
                      <Alert variant="danger" className="mb-3">
                        {commentError}
                      </Alert>
                    )}
                    
                    <div className="d-grid">
                      <Button
                        variant="primary"
                        type="submit"
                        disabled={submittingComment || (!comment.trim() && !commentImage)}
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
                </Card.Body>
              </Card>
            </Tab>
          </Tabs>
        </Col>
        
        <Col lg={4}>
          <Card className="shadow-sm sticky-top" style={{top: "1rem", maxHeight: "calc(100vh - 2rem)", overflowY: "auto"}}>
            <Card.Header className={`d-flex justify-content-between align-items-center ${hasNewMessages ? 'bg-primary text-white' : 'bg-dark text-white'}`}>
              <h5 className="mb-0">
                {hasNewMessages && <i className="fas fa-circle text-warning me-2 fa-xs" style={{animation: "pulse 1s infinite"}}></i>}
                Discussion avec le client
              </h5>
              <span className={`badge ${hasNewMessages ? 'bg-warning text-dark' : 'bg-light text-dark'}`}>
                {comments.length} message{comments.length !== 1 ? 's' : ''}
              </span>
            </Card.Header>
            <Card.Body>
              <div className="comments-section mb-4" style={{ maxHeight: 'calc(100vh - 300px)', overflowY: 'auto' }} onClick={() => setHasNewMessages(false)}>
                {comments.length > 0 ? (
                  <ListGroup variant="flush">
                    {comments.map((comment, index) => (
                      <ListGroup.Item 
                        key={comment.id || index} 
                        className={`mb-2 rounded shadow-sm ${comment.isCurrentUser ? 'current-user-comment' : ''} ${comment.temporary ? 'temporary-comment' : ''}`}
                        style={{
                          backgroundColor: comment.isCurrentUser ? '#f0f7ff' : // Bleu clair pour admin (current user)
                                          comment.isAdmin ? '#ffffff' : // Blanc pour autres admins
                                          '#f6f9f6', // Vert très clair pour client
                          border: comment.temporary ? '1px dashed #ccc' : '1px solid #e9e9e9',
                          opacity: comment.temporary ? 0.8 : 1
                        }}
                      >
                        <div>
                          <strong style={{
                            color: comment.isCurrentUser ? '#0056b3' : // Bleu foncé pour admin actuel
                                    comment.isAdmin ? '#212529' : // Texte standard pour autres admins
                                    '#28a745' // Vert pour client
                          }}>
                            {comment.user}
                          </strong>
                          <small className="text-muted ms-2">
                            {comment.date && new Date(comment.date).toLocaleString()}
                          </small>
                        </div>
                        <p style={{ whiteSpace: 'pre-wrap', marginTop: '0.5rem', marginBottom: comment.imagePath ? '0.5rem' : '0' }}>
                          {comment.text}
                        </p>
                        
                        {comment.imagePath && (
                          <div className="comment-image-container">
                            <img 
                              src={comment.imagePath} 
                              alt="Pièce jointe" 
                              className="img-fluid rounded mt-2" 
                              style={{ maxHeight: '200px', cursor: 'pointer' }}
                              onClick={() => {
                                // Ouvrir l'image dans un nouvel onglet
                                window.open(comment.imagePath, '_blank');
                              }}
                              onError={(e) => {
                                console.error(`Erreur de chargement d'image: ${comment.imagePath}`);
                                e.target.onerror = null;
                                e.target.style.display = 'none';
                                e.target.parentNode.innerHTML += '<div class="alert alert-warning mt-2">Impossible de charger l\'image</div>';
                              }}
                            />
                          </div>
                        )}
                        {comment.hasImage && comment.temporary && (
                          <div className="mb-2">
                            <div className="border p-2 text-center bg-light">
                              <Spinner animation="border" size="sm" className="me-2" />
                              Envoi de l'image en cours...
                            </div>
                          </div>
                        )}
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
                  />
                </Form.Group>
                
                <Form.Group className="mb-3">
                  <Form.Label>Ajouter une image (optionnel)</Form.Label>
                  <Form.Control
                    type="file"
                    onChange={handleCommentImageChange}
                    accept="image/jpeg,image/png,image/gif"
                  />
                  <Form.Text className="text-muted">
                    Formats acceptés: jpg, png, gif - Taille maximale: 5 Mo
                  </Form.Text>
                </Form.Group>
                
                {commentImagePreview && (
                  <div className="mb-3 position-relative">
                    <img 
                      src={commentImagePreview} 
                      alt="Aperçu" 
                      style={{ maxWidth: '100%', maxHeight: '200px' }} 
                      className="img-thumbnail"
                    />
                    <Button 
                      variant="danger" 
                      size="sm" 
                      className="position-absolute top-0 end-0 m-1"
                      onClick={removeCommentImage}
                    >
                      <i className="fas fa-times"></i>
                    </Button>
                  </div>
                )}
                
                {commentError && (
                  <Alert variant="danger" className="mb-3">
                    {commentError}
                  </Alert>
                )}
                
                <div className="d-grid">
                  <Button
                    variant="primary"
                    type="submit"
                    disabled={submittingComment || (!comment.trim() && !commentImage)}
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
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default AdminFileDetails; 