import React, { useState, useEffect, useContext, useRef } from 'react';
import { Row, Col, Card, Badge, Button, Alert, Spinner, ProgressBar, Form, ListGroup, Tabs, Tab } from 'react-bootstrap';
import { useParams, Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'react-toastify';
import AuthContext from '../context/auth/authContext';

const FileDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [comment, setComment] = useState('');
  const [comments, setComments] = useState([]);
  const [submittingComment, setSubmittingComment] = useState(false);
  const [commentError, setCommentError] = useState(null);
  const [downloadError, setDownloadError] = useState(null);
  const [forceUpdate, setForceUpdate] = useState(0);
  const [commentImage, setCommentImage] = useState(null);
  const [commentImagePreview, setCommentImagePreview] = useState(null);
  const pollingIntervalRef = useRef(null);
  const lastFileStatusRef = useRef(null); // Référence pour suivre le dernier statut connu
  const fileRef = useRef(null); // Référence pour accéder à l'état du fichier dans l'intervalle
  const hasModifiedFileRef = useRef(false); // Référence pour suivre si un fichier modifié est disponible
  const authContext = useContext(AuthContext);
  const { isAuthenticated, user, token } = authContext;

  // Mettre à jour les refs lorsque l'état du fichier change
  useEffect(() => {
    fileRef.current = file;
    if (file) {
      lastFileStatusRef.current = file.status;
      hasModifiedFileRef.current = !!(file.fileInfo && file.fileInfo.modifiedFilePath);
    }
  }, [file]);

  const fetchComments = async () => {
    try {
      console.log("Vérification de nouveaux commentaires et mises à jour du statut...");
      const config = {
        headers: {
          'Content-Type': 'application/json',
          'x-auth-token': localStorage.getItem('token')
        }
      };
      
      const res = await axios.get(`/api/ecu-files/${id}`, config);
      
      // NOUVELLE FONCTIONNALITÉ: Vérifier si le statut du fichier a changé
      if (fileRef.current && res.data && res.data.status !== lastFileStatusRef.current) {
        console.log(`Statut du fichier mis à jour: ${lastFileStatusRef.current} -> ${res.data.status}`);
        
        // Mettre à jour l'état du fichier avec les nouvelles informations
        setFile(prevFile => ({
          ...prevFile,
          status: res.data.status
        }));
        
        // Afficher une notification toast pour informer l'utilisateur
        const statusLabel = getStatusBadge(res.data.status).props.children;
        toast.info(`Le statut de votre fichier a été mis à jour: ${statusLabel}`);
        
        // Mettre à jour la référence au dernier statut connu
        lastFileStatusRef.current = res.data.status;
      }
      
      // NOUVELLE FONCTIONNALITÉ: Vérifier si un fichier modifié est disponible
      const hasModifiedFile = !!(res.data && res.data.fileInfo && res.data.fileInfo.modifiedFilePath);
      if (hasModifiedFile !== hasModifiedFileRef.current) {
        console.log(`Disponibilité du fichier modifié mise à jour: ${hasModifiedFileRef.current} -> ${hasModifiedFile}`);
        
        if (hasModifiedFile) {
          // Mettre à jour l'état du fichier avec les nouvelles informations
          setFile(prevFile => ({
            ...prevFile,
            fileInfo: {
              ...prevFile.fileInfo,
              modifiedFilePath: res.data.fileInfo.modifiedFilePath
            }
          }));
          
          // Afficher une notification toast pour informer l'utilisateur
          toast.success("Un fichier modifié est maintenant disponible au téléchargement !", {
            autoClose: 10000,  // Reste affiché plus longtemps (10 secondes)
          });
          
          // Jouer un son de notification
          try {
            const audio = new Audio('/notification.mp3');
            audio.play().catch(e => console.log('Impossible de jouer le son de notification:', e));
          } catch (e) {
            console.error('Erreur lors de la notification sonore:', e);
          }
        }
        
        // Mettre à jour la référence
        hasModifiedFileRef.current = hasModifiedFile;
      }
      
      // Journaliser les informations du fichier pour comprendre sa structure
      console.log("Données du fichier reçues:", {
        adminId: res.data.adminId,
        adminIds: res.data.adminIds,
        fileUserId: res.data.user,
        commentCount: res.data.discussionComments?.length || 0,
        hasModifiedFile: hasModifiedFile
      });
      
      if (res.data && res.data.discussionComments) {
        // Récupérer les images sauvegardées dans le localStorage
        let savedImages = {};
        try {
          savedImages = JSON.parse(localStorage.getItem('savedCommentImages') || '{}');
          console.log('Images sauvegardées trouvées:', Object.keys(savedImages).length);
        } catch (e) {
          console.error('Erreur lors de la lecture des images sauvegardées:', e);
        }
        
        // Toujours vérifier s'il y a de nouveaux commentaires, même si le tableau est vide
        const currentCommentsIds = comments.map(c => c.id);
        
        // Rechercher les nouveaux commentaires
        const newComments = res.data.discussionComments.filter(c => !currentCommentsIds.includes(c._id));
        const hasNewComments = newComments.length > 0;
        
        if (hasNewComments) {
          console.log(`${newComments.length} nouveaux commentaires détectés`);
          
          // Jouer un son de notification si nous avons des nouveaux commentaires
          // et ce n'est pas le premier chargement
          if (comments.length > 0) {
            try {
              const audio = new Audio('/notification.mp3');
              audio.play().catch(e => console.log('Impossible de jouer le son de notification:', e));
              
              // Afficher une notification de bureau si l'API est disponible
              if ('Notification' in window && Notification.permission === 'granted') {
                new Notification('Nouveau message', {
                  body: 'Vous avez reçu un nouveau message',
                  icon: '/favicon.ico'
                });
              } else if ('Notification' in window && Notification.permission !== 'denied') {
                Notification.requestPermission();
              }
            } catch (e) {
              console.error('Erreur lors de la notification:', e);
            }
          }
          
          const formattedComments = res.data.discussionComments.map(comment => {
            // Si ce commentaire existe déjà
            const existingComment = comments.find(c => c.id === comment._id);
            if (existingComment && !existingComment.temporary) {
              // Préserver l'image si elle existe dans le commentaire existant
              console.log(`Préservation du commentaire existant: ${existingComment.id}, image: ${existingComment.imagePath ? 'Oui' : 'Non'}`);
              return existingComment;
            }
            
            // Déterminer si ce commentaire appartient à l'utilisateur actuel
            const currentUserId = localStorage.getItem('userId');
            const isCurrentUser = comment.user === currentUserId;
            
            // Déterminer le type d'utilisateur en fonction de l'ID
            let userName = 'Utilisateur';
            let isAdmin = false;
            
            if (isCurrentUser) {
              userName = 'Vous';
            } else {
              // IMPORTANT: Si le commentaire ne vient pas du propriétaire du fichier, c'est un admin
              // Le fichier appartient à l'utilisateur actuel ou à un autre utilisateur
              const fileOwnerId = res.data.user;
              
              if (comment.user !== fileOwnerId) {
                userName = 'Administrateur';
                isAdmin = true;
                console.log("Message identifié comme venant d'un administrateur (non propriétaire):", comment);
              }
              // Autres vérifications pour identifier un administrateur
              else if ((res.data.adminId && res.data.adminId === comment.user) || 
                  (res.data.adminIds && res.data.adminIds.includes(comment.user)) || 
                  comment.admin === true || 
                  comment.role === 'admin') {
                userName = 'Administrateur';
                isAdmin = true;
                console.log("Message identifié comme venant d'un administrateur (autres critères):", comment);
              }
              else if (comment.expert) {
                userName = 'Expert technique';
              }
              
              console.log(`Commentaire de ${comment.user} attribué à "${userName}" (ID Propriétaire: ${fileOwnerId})`);
            }
            
            // Corriger le chemin d'image pour qu'il pointe vers le serveur Express
            let imagePath = comment.imagePath;
            
            // Vérifier si nous avons une image sauvegardée pour ce commentaire
            if (savedImages[comment._id]) {
              console.log(`Image restaurée depuis localStorage pour le commentaire ${comment._id}: ${savedImages[comment._id]}`);
              imagePath = savedImages[comment._id];
            } else if (imagePath && !imagePath.startsWith('http')) {
              console.log("Correction du chemin d'image:", imagePath);
              // Assurez-vous que le chemin commence par un / s'il n'est pas absolu
              imagePath = imagePath.startsWith('/') ? imagePath : `/${imagePath}`;
              console.log("Chemin d'image corrigé:", imagePath);
            }
            
            return {
              id: comment._id,
              user: userName,
              text: comment.text,
              date: comment.createdAt,
              imagePath: imagePath,
              isCurrentUser: isCurrentUser,
              isAdmin: isAdmin
            };
          });
          
          // Mettre à jour les commentaires en préservant les commentaires temporaires
          const tempComments = comments.filter(c => c.temporary);
          setComments([...formattedComments, ...tempComments]);
        }
      }
    } catch (err) {
      console.error('Erreur lors de la vérification des commentaires:', err);
    }
  };

  useEffect(() => {
    const fetchFile = async () => {
      try {
        setLoading(true);
        const config = {
          headers: {
            'Content-Type': 'application/json',
            'x-auth-token': localStorage.getItem('token')
          }
        };
        
        const res = await axios.get(`/api/ecu-files/${id}`, config);
        setFile(res.data);
        
        if (res.data && res.data.discussionComments && res.data.discussionComments.length > 0) {
          // Récupérer l'ID de l'utilisateur actuel du localStorage
          const currentUserId = localStorage.getItem('userId');
          
          const formattedComments = await Promise.all(
            res.data.discussionComments.map(async (comment) => {
              try {
                // Récupérer les informations de l'utilisateur
                const userRes = comment.user && await axios.get(`/api/users/${comment.user}`, config);
                
                // Déterminer le nom à afficher
                const userName = userRes?.data?.name || 
                  (userRes?.data?.role === 'admin' ? 'Administrateur' : 
                   userRes?.data?.role === 'expert' ? 'Expert technique' : 'Utilisateur');
                
                // Vérifier si c'est l'utilisateur actuel
                const isCurrentUser = comment.user === currentUserId;
                const isAdmin = userRes?.data?.role === 'admin';
                
                console.log(`Commentaire chargé: ID=${comment._id}, texte="${comment.text}", image=${comment.imagePath ? 'Oui' : 'Non'}`);
                
                return {
                  id: comment._id,
                  user: isCurrentUser ? 'Vous' : userName,
                  text: comment.text,
                  date: comment.createdAt,
                  imagePath: comment.imagePath, // Ajouter le chemin de l'image
                  isCurrentUser,
                  isAdmin
                };
              } catch (err) {
                console.error('Erreur lors de la récupération des informations utilisateur:', err);
                return {
                  id: comment._id,
                  user: 'Utilisateur',
                  text: comment.text,
                  date: comment.createdAt,
                  imagePath: comment.imagePath // Ajouter le chemin de l'image
                };
              }
            })
          );
          
          setComments(formattedComments);
        } else {
          setComments([]);
        }
        
        setLoading(false);
      } catch (err) {
        console.error('Erreur lors du chargement du fichier:', err);
        setError('Erreur lors du chargement des détails du fichier');
        setLoading(false);
      }
    };

    if (isAuthenticated) {
      fetchFile();
      
      // Demander la permission pour les notifications dès le départ
      if ('Notification' in window && Notification.permission !== 'denied') {
        Notification.requestPermission();
      }
      
      // Réduire l'intervalle à 3 secondes pour une meilleure réactivité
      pollingIntervalRef.current = setInterval(() => {
        fetchComments();
      }, 3000);
    } else {
      setError('Vous devez être connecté pour voir les détails du fichier.');
      setLoading(false);
    }
    
    return () => {
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
      }
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, isAuthenticated]); // Il est important de ne pas inclure fetchComments dans les dépendances pour éviter les boucles infinies

  useEffect(() => {
    const token = localStorage.getItem('token');
    console.log('Token dans localStorage (vérification):', token ? 'Présent' : 'Absent');
    if (token) {
      console.log('Longueur du token:', token.length);
      console.log('Début du token:', token.substring(0, 20) + '...');
    }
  }, []);

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
  
  const getProgressPercentage = (status) => {
    switch (status) {
      case 'pending':
        return 25;
      case 'processing':
        return 75;
      case 'completed':
        return 100;
      default:
        return 0;
    }
  };
  
  const handleCommentSubmit = async (e) => {
    e.preventDefault();
    if (!comment.trim() && !commentImage) {
      setCommentError('Veuillez entrer un commentaire ou sélectionner une image');
      return;
    }
    
    console.log('===========================================');
    console.log('Début soumission de commentaire avec image');
    console.log('Commentaire texte:', comment);
    console.log('Image présente:', commentImage ? 'Oui' : 'Non');
    if (commentImage) {
      console.log('Détails image:', { 
        name: commentImage.name, 
        type: commentImage.type, 
        size: `${Math.round(commentImage.size/1024)} Ko` 
      });
    }
    
    setCommentError(null);
    setSubmittingComment(true);
    
    // Créer un commentaire temporaire avec le bon affichage "Vous"
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
        if (comment.trim()) {
          data.append('comment', tempComment.text);
          console.log('FormData: Ajout du texte du commentaire');
        } else {
          // S'assurer qu'il y a au moins un texte vide pour éviter des problèmes côté serveur
          data.append('comment', '');
          console.log('FormData: Ajout d\'un texte vide car seule l\'image est fournie');
        }
        
        // Vérifier que l'image est valide
        if (commentImage instanceof File && commentImage.size > 0) {
          data.append('image', commentImage);
          console.log('FormData: Ajout de l\'image');
        } else {
          console.error('Image invalide', commentImage);
          throw new Error('Image invalide ou corrompue');
        }
        
        // Afficher le contenu du FormData (pour debug)
        for (let pair of data.entries()) {
          console.log('FormData contient:', pair[0], pair[1] instanceof File ? `[File: ${pair[1].name}]` : pair[1]);
        }
        
        config = {
          headers: {
            // Ne pas spécifier Content-Type pour FormData, le navigateur le fait automatiquement avec la boundary
            // 'Content-Type': 'multipart/form-data',
            'x-auth-token': localStorage.getItem('token')
          },
          // Ajouter un timeout plus long pour l'upload des images
          timeout: 30000
        };
        console.log('Configuration de la requête avec image:', config);
      } else {
        data = { comment: tempComment.text };
        config = {
          headers: {
            'Content-Type': 'application/json',
            'x-auth-token': localStorage.getItem('token')
          }
        };
        console.log('Configuration de la requête texte uniquement:', config);
      }
      
      console.log(`Envoi de la requête à /api/ecu-files/${id}/comments`);
      const res = await axios.post(`/api/ecu-files/${id}/comments`, data, config);
      console.log('Réponse reçue du serveur:', res.status, res.statusText);
      
      // Vérifier si des commentaires existent dans la réponse
      if (res.data && res.data.discussionComments && res.data.discussionComments.length > 0) {
        // Récupérer le dernier commentaire (celui qu'on vient d'ajouter)
        const newComment = res.data.discussionComments[res.data.discussionComments.length - 1];
        console.log('Nouveau commentaire reçu du serveur:', newComment);
        
        // Corriger le chemin d'image pour qu'il pointe vers le serveur Express
        let imagePath = newComment.imagePath;
        if (imagePath && !imagePath.startsWith('http')) {
          console.log("Correction du chemin d'image dans la réponse:", imagePath);
          // Assurez-vous que le chemin commence par un / s'il n'est pas absolu
          imagePath = imagePath.startsWith('/') ? imagePath : `/${imagePath}`;
          console.log("Chemin d'image corrigé:", imagePath);
        }
        
        // Remplacer le commentaire temporaire par le vrai commentaire
        setComments(prevComments => prevComments.map(c => 
          c.id === tempComment.id 
            ? {
                id: newComment._id,
                user: 'Vous', // Garder "Vous" pour indiquer que c'est l'utilisateur actuel
                text: newComment.text,
                date: newComment.createdAt,
                imagePath: imagePath, // Utiliser le chemin corrigé
                isCurrentUser: true,
                imageFixed: true // Marquer ce commentaire pour préserver l'image
              }
            : c
        ));
        
        // Conserver une copie du commentaire avec l'image dans le localStorage
        if (imagePath) {
          try {
            const savedComments = JSON.parse(localStorage.getItem('savedCommentImages') || '{}');
            savedComments[newComment._id] = imagePath;
            localStorage.setItem('savedCommentImages', JSON.stringify(savedComments));
            console.log(`Image du commentaire ${newComment._id} sauvegardée en local`);
          } catch (e) {
            console.error('Erreur lors de la sauvegarde locale de l\'image:', e);
          }
        }
      }
      
      // Réinitialiser l'image
      setCommentImage(null);
      setCommentImagePreview(null);
      
      setSubmittingComment(false);
      console.log('Commentaire ajouté avec succès');
    } catch (error) {
      console.error('Erreur lors de l\'envoi du commentaire:', error);
      let errorMessage = 'Erreur lors de l\'envoi du commentaire. Veuillez réessayer.';
      
      if (error.response) {
        console.error('Détails de l\'erreur:', {
          status: error.response.status,
          statusText: error.response.statusText,
          data: error.response.data
        });
        
        // Message d'erreur personnalisé selon le type d'erreur
        if (error.response.status === 413) {
          errorMessage = 'L\'image est trop volumineuse pour être envoyée. Veuillez utiliser une image plus petite.';
        } else if (error.response.data && error.response.data.message) {
          errorMessage = error.response.data.message;
        }
      } else if (error.request) {
        console.error('Pas de réponse reçue du serveur:', error.request);
        errorMessage = 'Le serveur ne répond pas. Veuillez vérifier votre connexion et réessayer.';
      } else if (error.message) {
        console.error('Message d\'erreur:', error.message);
        errorMessage = error.message;
      }
      
      // En cas d'erreur, supprimer le commentaire temporaire et restaurer le texte
      setComments(prevComments => prevComments.filter(c => c.id !== tempComment.id));
      setComment(tempComment.text); // Restaurer le texte du commentaire dans l'input
      
      setCommentError(errorMessage);
      setSubmittingComment(false);
    }
  };

  // Fonction pour gérer la sélection d'une image pour le commentaire
  const handleCommentImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Vérifier que c'est bien une image
      if (!file.type.startsWith('image/')) {
        setCommentError('Le fichier sélectionné n\'est pas une image');
        return;
      }
      
      // Vérifier la taille (5 Mo max)
      if (file.size > 5 * 1024 * 1024) {
        setCommentError('L\'image est trop volumineuse (5 Mo maximum)');
        return;
      }
      
      setCommentImage(file);
      
      // Créer un aperçu de l'image
      const reader = new FileReader();
      reader.onloadend = () => {
        setCommentImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
      
      setCommentError(null);
    }
  };

  // Fonction pour supprimer l'image sélectionnée
  const removeCommentImage = () => {
    setCommentImage(null);
    setCommentImagePreview(null);
  };

  const handleDownloadOriginal = async () => {
    try {
      setDownloadError(null);
      console.log('Début du téléchargement du fichier original');
      
      if (!file || !file._id) {
        throw new Error('ID du fichier non disponible');
      }
      
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('Utilisateur non authentifié');
      }
      
      console.log(`Tentative de téléchargement pour le fichier ID: ${file._id}`);
      console.log(`Chemin du fichier original:`, file.fileInfo.originalFilePath);
      
      const response = await fetch(`/api/ecu-files/download-original/${file._id}`, {
        headers: {
          'x-auth-token': token
        }
      });
      
      console.log('Statut de la réponse:', response.status);
      console.log('Headers de la réponse:', Object.fromEntries([...response.headers.entries()]));
      
      if (!response.ok) {
        let errorMessage = `Erreur HTTP: ${response.status}`;
        try {
          const errorData = await response.json();
          errorMessage = errorData.message || errorMessage;
        } catch (e) {
          console.error('Impossible de parser la réponse d\'erreur:', e);
        }
        throw new Error(errorMessage);
      }
      
      const contentType = response.headers.get('content-type');
      console.log('Type de contenu:', contentType);
      
      if (contentType && contentType.indexOf('application/json') !== -1) {
        const data = await response.json();
        throw new Error(data.message || 'Format de réponse inattendu');
      }
      
      const blob = await response.blob();
      console.log('Taille du blob:', blob.size);
      
      if (blob.size === 0) {
        throw new Error('Fichier vide reçu');
      }
      
      let filename = 'fichier_original.bin';
      const contentDisposition = response.headers.get('content-disposition');
      if (contentDisposition) {
        const filenameMatch = contentDisposition.match(/filename="(.+)"/);
        if (filenameMatch && filenameMatch[1]) {
          filename = filenameMatch[1];
        }
      }
      console.log('Nom du fichier:', filename);
      
      const downloadUrl = window.URL.createObjectURL(blob);
      
      const a = document.createElement('a');
      a.href = downloadUrl;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      
      setTimeout(() => {
        window.URL.revokeObjectURL(downloadUrl);
        document.body.removeChild(a);
        console.log('Téléchargement terminé et nettoyage effectué');
      }, 1000);
    } catch (err) {
      console.error('Erreur de téléchargement original:', err);
      setDownloadError(`Erreur lors du téléchargement du fichier original: ${err.message}`);
    }
  };

  const handleDownloadModified = async () => {
    try {
      setDownloadError(null);
      console.log('Début du téléchargement du fichier modifié');
      
      // Récupérer le token
      const token = localStorage.getItem('token');
      console.log('Token dans localStorage (téléchargement modifié):', token ? 'Présent' : 'Absent');
      
      if (!token) {
        throw new Error('Vous devez être connecté pour télécharger des fichiers');
      }
      
      // Utiliser fetch au lieu d'un lien direct pour plus de contrôle sur le téléchargement
      console.log(`Tentative de téléchargement via fetch pour le fichier: ${file._id}`);
      
      // Construction de l'URL avec le token dans la requête
      const url = `/api/ecu-files/download-modified-direct/${file._id}?token=${encodeURIComponent(token)}`;
      
      console.log('URL de téléchargement:', url);
      
      // Effectuer la requête avec fetch
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'x-auth-token': token
        }
      });
      
      console.log('Statut de la réponse:', response.status);
      console.log('Headers de la réponse:', Object.fromEntries([...response.headers.entries()]));
      
      if (!response.ok) {
        let errorMessage = `Erreur HTTP: ${response.status}`;
        try {
          const errorData = await response.json();
          errorMessage = errorData.message || errorMessage;
        } catch (e) {
          console.error('Impossible de parser la réponse d\'erreur:', e);
        }
        throw new Error(errorMessage);
      }
      
      const contentType = response.headers.get('content-type');
      console.log('Type de contenu:', contentType);
      
      if (contentType && contentType.indexOf('application/json') !== -1) {
        const data = await response.json();
        throw new Error(data.message || 'Format de réponse inattendu');
      }
      
      // Récupérer le blob
      const blob = await response.blob();
      console.log('Taille du blob:', blob.size);
      
      if (blob.size === 0) {
        throw new Error('Fichier vide reçu');
      }
      
      // Récupérer le nom du fichier à partir des en-têtes
      let filename = 'fichier_modifie.bin';
      const contentDisposition = response.headers.get('content-disposition');
      if (contentDisposition) {
        const filenameMatch = contentDisposition.match(/filename="(.+)"/);
        if (filenameMatch && filenameMatch[1]) {
          filename = filenameMatch[1];
        }
      } else if (file.fileInfo && file.fileInfo.modifiedFilePath) {
        // Utiliser le nom du fichier à partir du chemin stocké
        const pathParts = file.fileInfo.modifiedFilePath.split(/[\/\\]/);
        if (pathParts.length > 0) {
          filename = pathParts[pathParts.length - 1];
        }
      }
      console.log('Nom du fichier:', filename);
      
      // Créer un URL pour le blob et déclencher le téléchargement
      const downloadUrl = window.URL.createObjectURL(blob);
      
      const a = document.createElement('a');
      a.href = downloadUrl;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      
      // Nettoyer après le téléchargement
      setTimeout(() => {
        window.URL.revokeObjectURL(downloadUrl);
        document.body.removeChild(a);
        console.log('Téléchargement terminé et nettoyage effectué');
      }, 1000);
    } catch (err) {
      console.error('Erreur de téléchargement modifié:', err);
      setDownloadError(`Erreur lors du téléchargement du fichier modifié: ${err.message}`);
    }
  };

  const handleDownloadDirectFile = () => {
    try {
      setDownloadError(null);
      console.log('Début du téléchargement direct du fichier spécifique');
      
      const token = localStorage.getItem('token');
      console.log('Token dans localStorage (téléchargement direct):', token ? 'Présent' : 'Absent');
      
      if (!token) {
        throw new Error('Vous devez être connecté pour télécharger des fichiers');
      }
      
      const a = document.createElement('a');
      a.style.display = 'none';
      a.href = `/api/ecu-files/download-direct-file?token=${encodeURIComponent(token)}`;
      a.target = '_blank';
      a.download = 'fichier_specifique.bin';
      
      document.body.appendChild(a);
      a.click();
      
      setTimeout(() => {
        document.body.removeChild(a);
        console.log('Lien de téléchargement direct supprimé');
      }, 1000);
      
      console.log('Lien de téléchargement direct cliqué');
    } catch (err) {
      console.error('Erreur de téléchargement direct:', err);
      setDownloadError(`Erreur lors du téléchargement direct du fichier: ${err.message}`);
    }
  };

  const handleDownloadStatic = () => {
    try {
      setDownloadError(null);
      console.log('Début du téléchargement via URL statique');
      
      const staticUrl = '/uploads/original/1741563488182-BMW_3-serie_2015_(F30-F31-F35-LCI)_18i_(1.5T)_136_hp_Bosch_MEVD17.2.3_OBD_VR lambda off (1).bin';
      
      window.open(staticUrl, '_blank');
      
      console.log('URL statique ouverte');
    } catch (err) {
      console.error('Erreur de téléchargement statique:', err);
      setDownloadError(`Erreur lors du téléchargement statique: ${err.message}`);
    }
  };

  const handleDownloadPublic = () => {
    try {
      setDownloadError(null);
      console.log('Début du téléchargement via fichier public');
      
      if (!file || !file.fileInfo || !file.fileInfo.originalFilePath) {
        throw new Error('Informations du fichier non disponibles');
      }
      
      const originalFileName = file.fileInfo.originalFilePath.split('/').pop();
      console.log('Nom du fichier original:', originalFileName);
      
      const directUrl = `/uploads/original/${originalFileName}`;
      console.log('URL directe:', directUrl);
      
      window.open(directUrl, '_blank');
      
      console.log('URL directe ouverte');
    } catch (err) {
      console.error('Erreur de téléchargement public:', err);
      setDownloadError(`Erreur lors du téléchargement public: ${err.message}`);
    }
  };

  const formatDate = (dateStr) => {
    const date = new Date(dateStr);
    return date.toLocaleString('fr-FR');
  };

  if (loading) {
    return (
      <div className="text-center p-5">
        <Spinner animation="border" variant="primary" />
        <p className="mt-3">Chargement des détails du fichier...</p>
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="danger" className="m-3">
        <Alert.Heading>Erreur</Alert.Heading>
        <p>{error}</p>
      </Alert>
    );
  }

  if (!file) {
    return (
      <Alert variant="warning" className="m-3">
        <Alert.Heading>Fichier non trouvé</Alert.Heading>
        <p>Le fichier que vous cherchez n'existe pas ou vous n'avez pas les droits pour y accéder.</p>
      </Alert>
    );
  }

  return (
    <div className="py-4">
      <Tabs defaultActiveKey="details" className="mb-4">
        <Tab 
          eventKey="details" 
          title={
            <span className="text-dark">
              <i className="fas fa-info-circle me-2"></i>Détails
            </span>
          }
        >
          <Row>
            <Col>
              <Card className="shadow-sm mb-4">
                <Card.Header className="py-3">
                  <div className="d-flex justify-content-between align-items-center">
                    <h5 className="mb-0">Informations sur le fichier</h5>
                    <div>
                      {getStatusBadge(file.status)}
                    </div>
                  </div>
                </Card.Header>
                <Card.Body>
                  <p className="mb-1">
                    <strong>État actuel :</strong> {
                      file.status === 'pending' ? 'En attente' :
                      file.status === 'processing' ? 'En cours de traitement' :
                      file.status === 'completed' ? 'Terminé' : file.status
                    }
                  </p>
                  
                  <ProgressBar 
                    now={getProgressPercentage(file.status)} 
                    variant={
                      file.status === 'pending' ? 'warning' :
                      file.status === 'processing' ? 'info' :
                      file.status === 'completed' ? 'success' : 'secondary'
                    }
                    className="mb-3"
                  />
                  
                  <p className="mb-1">
                    <strong>Date de soumission :</strong> {new Date(file.createdAt).toLocaleString()}
                  </p>
                  <p className="mb-1">
                    <strong>Dernière mise à jour :</strong> {new Date(file.updatedAt).toLocaleString()}
                  </p>
                  <p className="mb-1">
                    <strong>Crédits utilisés :</strong> {file.totalCredits}
                  </p>
                </Card.Body>
              </Card>

              {downloadError && (
                <Alert variant="danger" className="mb-4" dismissible onClose={() => setDownloadError(null)}>
                  {downloadError}
                </Alert>
              )}

              <Row>
                <Col lg={8}>
                  <Tabs 
                    defaultActiveKey="vehicle" 
                    className="mb-4"
                    variant="pills"
                    fill
                  >
                    <Tab 
                      eventKey="vehicle" 
                      title={
                        <span className="text-dark">
                          <i className="fas fa-car me-2"></i>Véhicule
                        </span>
                      }
                    >
                      <Card className="shadow-sm mb-4">
                        <Card.Header className="bg-light text-dark">
                          <h5 className="mb-0">Informations sur le véhicule</h5>
                        </Card.Header>
                        <Card.Body>
                          <Row>
                            <Col md={6}>
                              <p>
                                <strong>Type de véhicule :</strong> {file.vehicleInfo.type}
                              </p>
                              <p>
                                <strong>Constructeur :</strong> {file.vehicleInfo.manufacturer}
                              </p>
                              <p>
                                <strong>Modèle :</strong> {file.vehicleInfo.model}
                              </p>
                              <p>
                                <strong>Année :</strong> {file.vehicleInfo.year}
                              </p>
                            </Col>
                            <Col md={6}>
                              <p>
                                <strong>Moteur :</strong> {file.vehicleInfo.engine}
                              </p>
                              <p>
                                <strong>Boîte de vitesse :</strong> {file.vehicleInfo.transmission}
                              </p>
                              {file.vehicleInfo.mileage && (
                                <p>
                                  <strong>Kilométrage :</strong> {file.vehicleInfo.mileage} km
                                </p>
                              )}
                              {file.vehicleInfo.licensePlate && (
                                <p>
                                  <strong>Plaque d'immatriculation :</strong> {file.vehicleInfo.licensePlate}
                                </p>
                              )}
                              {file.vehicleInfo.vin && (
                                <p>
                                  <strong>VIN :</strong> {file.vehicleInfo.vin}
                                </p>
                              )}
                            </Col>
                          </Row>
                        </Card.Body>
                      </Card>
                    </Tab>
                    
                    <Tab 
                      eventKey="file" 
                      title={
                        <span className="text-dark">
                          <i className="fas fa-microchip me-2"></i>Fichier ECU
                          {file.status === 'completed' && file.fileInfo.modifiedFilePath && (
                            <Badge bg="success" pill className="ms-2" style={{ fontSize: '0.6em', padding: '0.2em 0.4em', verticalAlign: 'top' }}>
                              <i className="fas fa-check"></i>
                            </Badge>
                          )}
                        </span>
                      }
                    >
                      <Card className="shadow-sm mb-4">
                        <Card.Header className="bg-light text-dark">
                          <h5 className="mb-0">Informations sur le fichier</h5>
                        </Card.Header>
                        <Card.Body>
                          <Row>
                            <Col md={6}>
                              <p>
                                <strong>Outil de reprogrammation :</strong>{' '}
                                {file.fileInfo.reprogrammingTool}
                              </p>
                              <p>
                                <strong>Méthode de lecture :</strong> {file.fileInfo.readMethod}
                              </p>
                              {file.fileInfo.ecuBrand && (
                                <p>
                                  <strong>Marque ECU :</strong> {file.fileInfo.ecuBrand}
                                </p>
                              )}
                            </Col>
                            <Col md={6}>
                              {file.fileInfo.ecuType && (
                                <p>
                                  <strong>Type de ECU :</strong> {file.fileInfo.ecuType}
                                </p>
                              )}
                              {file.fileInfo.hwNumber && (
                                <p>
                                  <strong>N°HW :</strong> {file.fileInfo.hwNumber}
                                </p>
                              )}
                              {file.fileInfo.swNumber && (
                                <p>
                                  <strong>N°SW :</strong> {file.fileInfo.swNumber}
                                </p>
                              )}
                            </Col>
                          </Row>
                          
                          <hr />
                          
                          <div className="mt-3">
                            <h6>Fichiers</h6>
                            <ListGroup>
                              <ListGroup.Item className="d-flex justify-content-between align-items-center">
                                <div>
                                  <i className="fas fa-file-code me-2 text-primary"></i>
                                  Fichier original
                                  {file.fileInfo.originalFilePath && (
                                    <div className="text-muted small">
                                      {file.fileInfo.originalFilePath.split('/').pop()}
                                    </div>
                                  )}
                                </div>
                                <div>
                                  <Button 
                                    variant="outline-primary" 
                                    size="sm"
                                    onClick={handleDownloadOriginal}
                                    className="me-2"
                                  >
                                    <i className="fas fa-download me-1"></i> Télécharger
                                  </Button>
                                  <Button 
                                    variant="outline-success" 
                                    size="sm"
                                    onClick={handleDownloadDirectFile}
                                    className="me-2"
                                  >
                                    <i className="fas fa-download me-1"></i> Téléchargement direct
                                  </Button>
                                  <Button 
                                    variant="outline-danger" 
                                    size="sm"
                                    onClick={handleDownloadStatic}
                                    className="me-2"
                                  >
                                    <i className="fas fa-download me-1"></i> Téléchargement statique
                                  </Button>
                                  <Button 
                                    variant="outline-info" 
                                    size="sm"
                                    onClick={handleDownloadPublic}
                                    className="me-2"
                                  >
                                    <i className="fas fa-download me-1"></i> Téléchargement public
                                  </Button>
                                  {file.fileInfo.originalFilePath && (
                                    <a 
                                      href="/public/download-direct.html"
                                      className="btn btn-outline-warning btn-sm me-2"
                                      target="_blank"
                                      rel="noopener noreferrer"
                                    >
                                      <i className="fas fa-download me-1"></i> Lien direct
                                    </a>
                                  )}
                                  <a 
                                    href="/public/download.html"
                                    className="btn btn-outline-secondary btn-sm"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                  >
                                    <i className="fas fa-list me-1"></i> Liste des fichiers
                                  </a>
                                </div>
                              </ListGroup.Item>
                              
                              {file.status === 'completed' && file.fileInfo.modifiedFilePath && (
                                <ListGroup.Item className="d-flex justify-content-between align-items-center">
                                  <div>
                                    <i className="fas fa-file-code me-2 text-success"></i>
                                    Fichier modifié
                                    {file.fileInfo.modifiedFilePath && (
                                      <div className="text-muted small">
                                        {file.fileInfo.modifiedFilePath.split('/').pop()}
                                      </div>
                                    )}
                                  </div>
                                  <Button 
                                    variant="outline-success" 
                                    size="sm"
                                    onClick={handleDownloadModified}
                                  >
                                    <i className="fas fa-download me-1"></i> Télécharger
                                  </Button>
                                </ListGroup.Item>
                              )}
                            </ListGroup>
                          </div>
                        </Card.Body>
                      </Card>
                    </Tab>
                    
                    <Tab 
                      eventKey="options" 
                      title={
                        <span className="text-dark">
                          <i className="fas fa-sliders-h me-2"></i>Options
                        </span>
                      }
                    >
                      <Card className="shadow-sm mb-4">
                        <Card.Header className="bg-light text-dark">
                          <h5 className="mb-0">Options de personnalisation</h5>
                        </Card.Header>
                        <Card.Body>
                          <p>
                            <strong>Augmentation de la puissance :</strong>{' '}
                            {file.options.powerIncrease ? (
                              <Badge bg="danger">{file.options.powerIncrease}</Badge>
                            ) : (
                              <span className="text-muted">Aucune</span>
                            )}
                          </p>

                          <p className="mb-2">
                            <strong>Options supplémentaires :</strong>
                          </p>
                          <div>
                            {file.options.dpfOff && (
                              <Badge bg="secondary" className="me-2 mb-2">
                                Arrêt DPF/FAP
                              </Badge>
                            )}
                            {file.options.opfOff && (
                              <Badge bg="secondary" className="me-2 mb-2">
                                Arrêt OPF/GPF
                              </Badge>
                            )}
                            {file.options.catalystOff && (
                              <Badge bg="secondary" className="me-2 mb-2">
                                Arrêt catalyseur
                              </Badge>
                            )}
                            {file.options.popAndBang && (
                              <Badge bg="secondary" className="me-2 mb-2">
                                Pop&Bang
                              </Badge>
                            )}
                            {file.options.adBlueOff && (
                              <Badge bg="secondary" className="me-2 mb-2">
                                Arrêt AdBlue
                              </Badge>
                            )}
                            {file.options.egrOff && (
                              <Badge bg="secondary" className="me-2 mb-2">
                                Blocage/retrait EGR
                              </Badge>
                            )}
                            {file.options.dtcRemoval && (
                              <Badge bg="secondary" className="me-2 mb-2">
                                Retrait code DTC
                              </Badge>
                            )}
                            {file.options.vmaxOff && (
                              <Badge bg="secondary" className="me-2 mb-2">
                                Vmax Off
                              </Badge>
                            )}
                            {file.options.startStopOff && (
                              <Badge bg="secondary" className="me-2 mb-2">
                                Start/Stop Off
                              </Badge>
                            )}
                            {!file.options.powerIncrease &&
                              !file.options.dpfOff &&
                              !file.options.opfOff &&
                              !file.options.catalystOff &&
                              !file.options.popAndBang &&
                              !file.options.adBlueOff &&
                              !file.options.egrOff &&
                              !file.options.dtcRemoval &&
                              !file.options.vmaxOff &&
                              !file.options.startStopOff && (
                                <span className="text-muted">Aucune option sélectionnée</span>
                              )}
                          </div>

                          {file.comments && (
                            <div className="mt-3">
                              <p className="mb-1">
                                <strong>Commentaires :</strong>
                              </p>
                              <p className="bg-light p-3 rounded">{file.comments}</p>
                            </div>
                          )}
                          
                          <hr />
                          
                          <div className="mt-3">
                            <h6>Résumé des coûts</h6>
                            <table className="table table-sm">
                              <tbody>
                                {file.options.powerIncrease && (
                                  <tr>
                                    <td>Augmentation de puissance ({file.options.powerIncrease})</td>
                                    <td className="text-end">
                                      {file.options.powerIncrease === 'Stage 1' ? '50' : 
                                       file.options.powerIncrease === 'Stage 2' ? '75' : 
                                       file.options.powerIncrease === 'Custom' ? '100' : '0'} crédits
                                    </td>
                                  </tr>
                                )}
                                {file.options.dpfOff && (
                                  <tr>
                                    <td>Arrêt DPF/FAP</td>
                                    <td className="text-end">25 crédits</td>
                                  </tr>
                                )}
                                {file.options.opfOff && (
                                  <tr>
                                    <td>Arrêt OPF/GPF</td>
                                    <td className="text-end">25 crédits</td>
                                  </tr>
                                )}
                                {file.options.catalystOff && file.options.popAndBang && (
                                  <tr>
                                    <td>Arrêt catalyseur + Pop&Bang (pack)</td>
                                    <td className="text-end">40 crédits</td>
                                  </tr>
                                )}
                                {file.options.catalystOff && !file.options.popAndBang && (
                                  <tr>
                                    <td>Arrêt catalyseur</td>
                                    <td className="text-end">25 crédits</td>
                                  </tr>
                                )}
                                {!file.options.catalystOff && file.options.popAndBang && (
                                  <tr>
                                    <td>Pop&Bang</td>
                                    <td className="text-end">25 crédits</td>
                                  </tr>
                                )}
                                {file.options.adBlueOff && (
                                  <tr>
                                    <td>Arrêt AdBlue</td>
                                    <td className="text-end">25 crédits</td>
                                  </tr>
                                )}
                                {file.options.egrOff && (
                                  <tr>
                                    <td>Blocage/retrait EGR</td>
                                    <td className="text-end">25 crédits</td>
                                  </tr>
                                )}
                                {file.options.dtcRemoval && (
                                  <tr>
                                    <td>Retrait code DTC</td>
                                    <td className="text-end">15 crédits</td>
                                  </tr>
                                )}
                                {file.options.vmaxOff && (
                                  <tr>
                                    <td>Vmax Off</td>
                                    <td className="text-end">25 crédits</td>
                                  </tr>
                                )}
                                {file.options.startStopOff && (
                                  <tr>
                                    <td>Start/Stop Off</td>
                                    <td className="text-end">15 crédits</td>
                                  </tr>
                                )}
                                <tr className="table-active fw-bold">
                                  <td>Total</td>
                                  <td className="text-end">{file.totalCredits} crédits</td>
                                </tr>
                              </tbody>
                            </table>
                          </div>
                        </Card.Body>
                      </Card>
                    </Tab>
                  </Tabs>
                </Col>
                
                <Col lg={4}>
                  <Card className="shadow-sm mb-4">
                    <Card.Header className="bg-light text-dark">
                      <h5 className="mb-0">Historique et commentaires</h5>
                    </Card.Header>
                    <Card.Body>
                      <div className="timeline mb-4">
                        {comments.map((comment, index) => (
                          <div key={comment.id} className="timeline-item">
                            <div className="timeline-item-content">
                              <div className="d-flex justify-content-between">
                                <span className={`fw-bold ${comment.isCurrentUser ? 'text-primary' : comment.isAdmin ? 'text-danger' : ''}`}>
                                  {comment.user}
                                </span>
                                <small className="text-muted">{new Date(comment.date).toLocaleString()}</small>
                              </div>
                              {comment.text && <p className="mb-2">{comment.text}</p>}
                              {comment.imagePath && (
                                <div className="mb-2">
                                  <a href={comment.imagePath} target="_blank" rel="noopener noreferrer">
                                    <img 
                                      src={comment.imagePath} 
                                      alt="Image" 
                                      style={{ maxWidth: '100%', maxHeight: '200px' }} 
                                      className="img-thumbnail"
                                    />
                                  </a>
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
                            </div>
                            {index < comments.length - 1 && <div className="timeline-item-separator"></div>}
                          </div>
                        ))}
                      </div>
                      
                      <hr />
                      
                      <h6>Ajouter un commentaire</h6>
                      <Form onSubmit={handleCommentSubmit}>
                        <Form.Group className="mb-3">
                          <Form.Control
                            as="textarea"
                            rows={3}
                            placeholder="Votre commentaire..."
                            value={comment}
                            onChange={(e) => setComment(e.target.value)}
                            isInvalid={!!commentError}
                          />
                          <Form.Control.Feedback type="invalid">
                            {commentError}
                          </Form.Control.Feedback>
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
                              'Envoyer le commentaire'
                            )}
                          </Button>
                        </div>
                      </Form>
                    </Card.Body>
                  </Card>
                  
                  <Card className="shadow-sm">
                    <Card.Header className="bg-light text-dark">
                      <h5 className="mb-0">Actions</h5>
                    </Card.Header>
                    <Card.Body>
                      <div className="d-grid gap-2">
                        {file.status === 'completed' && file.fileInfo.modifiedFilePath && (
                          <Button 
                            variant="success"
                            onClick={handleDownloadModified}
                          >
                            <i className="fas fa-download me-2"></i> Télécharger le fichier modifié
                          </Button>
                        )}
                        <Button variant="outline-primary">
                          <i className="fas fa-envelope me-2"></i> Contacter le support
                        </Button>
                        <Button variant="outline-danger">
                          <i className="fas fa-trash me-2"></i> Supprimer ce fichier
                        </Button>
                      </div>
                    </Card.Body>
                  </Card>
                </Col>
              </Row>
            </Col>
          </Row>
        </Tab>
        
        <Tab eventKey="discussion" title={
          <span className="text-dark">
            <i className="fas fa-comments me-2"></i>Discussion
          </span>
        }>
          <Card className="shadow-sm mb-4">
            <Card.Header className="bg-light">
              <h5 className="mb-0 text-dark">Discussion avec le support technique</h5>
            </Card.Header>
            <Card.Body>
              <div className="comments-section mb-4" style={{ maxHeight: '400px', overflowY: 'auto' }}>
                {comments.length > 0 ? (
                  <ListGroup variant="flush">
                    {comments.map((comment, index) => (
                      <ListGroup.Item 
                        key={comment.id || index} 
                        className={`mb-2 rounded shadow-sm ${comment.isCurrentUser ? 'current-user-comment' : ''} ${comment.temporary ? 'temporary-comment' : ''}`}
                        style={{
                          backgroundColor: comment.isAdmin ? '#f0f7ff' : // Bleu clair pour admin
                                          comment.isCurrentUser ? '#f6f9f6' : // Vert très clair pour utilisateur courant
                                          '#ffffff', // Blanc pour autres utilisateurs
                          border: comment.temporary ? '1px dashed #ccc' : '1px solid #e9e9e9',
                          opacity: comment.temporary ? 0.8 : 1
                        }}
                      >
                        <div>
                          <strong style={{
                            color: comment.isAdmin ? '#0056b3' : // Bleu foncé pour admin
                                    comment.isCurrentUser ? '#28a745' : // Vert pour utilisateur courant
                                    '#212529' // Texte standard pour autres utilisateurs
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
                              alt="Image du commentaire" 
                              className="img-fluid rounded mt-2" 
                              style={{ maxHeight: '200px', cursor: 'pointer' }}
                              onClick={() => {
                                // Ouvrir l'image dans un nouvel onglet
                                window.open(comment.imagePath, '_blank');
                              }}
                              onError={(e) => {
                                console.error(`Erreur de chargement d'image: ${comment.imagePath}`);
                                // Afficher une image par défaut ou un message d'erreur
                                e.target.onerror = null;
                                e.target.style.display = 'none';
                                e.target.parentNode.innerHTML += '<div class="alert alert-warning mt-2">Impossible de charger l\'image</div>';
                              }}
                            />
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
                    required
                  />
                </Form.Group>
                {commentError && (
                  <Alert variant="danger" className="mb-3">
                    {commentError}
                  </Alert>
                )}
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
            </Card.Body>
          </Card>
        </Tab>
      </Tabs>
    </div>
  );
};

export default FileDetails; 