import React, { useReducer } from 'react';
import axios from 'axios';
import AuthContext from './authContext';
import authReducer from './authReducer';
import setAuthToken from '../../utils/setAuthToken';
import {
  REGISTER_SUCCESS,
  REGISTER_FAIL,
  USER_LOADED,
  AUTH_ERROR,
  LOGIN_SUCCESS,
  LOGIN_FAIL,
  LOGOUT,
  CLEAR_ERRORS,
  UPDATE_CREDITS
} from '../types';

const AuthState = props => {
  const initialState = {
    token: localStorage.getItem('token'),
    isAuthenticated: null,
    loading: true,
    user: null,
    error: null
  };

  const [state, dispatch] = useReducer(authReducer, initialState);

  // Charger l'utilisateur
  const loadUser = async () => {
    console.log('loadUser appelé, token dans localStorage:', localStorage.token ? 'Présent' : 'Absent');
    
    if (localStorage.token) {
      setAuthToken(localStorage.token);
    }

    try {
      console.log('Tentative de récupération des données utilisateur...');
      const res = await axios.get('/api/auth');
      console.log('Données utilisateur récupérées avec succès:', res.data);

      dispatch({
        type: USER_LOADED,
        payload: res.data
      });
    } catch (err) {
      console.error('Erreur lors du chargement de l\'utilisateur:', err.response ? err.response.data : err.message);
      dispatch({ type: AUTH_ERROR });
    }
  };

  // Inscrire un utilisateur
  const register = async formData => {
    const config = {
      headers: {
        'Content-Type': 'application/json'
      }
    };

    try {
      const res = await axios.post('/api/auth/register', formData, config);

      dispatch({
        type: REGISTER_SUCCESS,
        payload: res.data
      });

      loadUser();
    } catch (err) {
      dispatch({
        type: REGISTER_FAIL,
        payload: err.response.data.message
      });
    }
  };

  // Connecter un utilisateur
  const login = async formData => {
    const config = {
      headers: {
        'Content-Type': 'application/json'
      }
    };

    try {
      console.log('Tentative de connexion avec:', formData.email);
      console.log('URL de connexion:', '/api/auth/login');
      console.log('Données envoyées:', formData);
      
      // Utiliser l'URL relative pour utiliser le proxy configuré dans package.json
      const res = await axios.post('/api/auth/login', formData, config);
      console.log('Réponse de connexion reçue:', res.data);
      
      // Vérifier que le token est présent dans la réponse
      if (!res.data.token) {
        console.error('Pas de token dans la réponse de connexion');
        throw new Error('Pas de token dans la réponse');
      }
      
      // Stocker le token dans localStorage
      localStorage.setItem('token', res.data.token);
      console.log('Token stocké dans localStorage, longueur:', res.data.token.length);
      
      dispatch({
        type: LOGIN_SUCCESS,
        payload: res.data
      });

      loadUser();
    } catch (err) {
      console.error('Erreur de connexion:', err);
      console.error('Détails de l\'erreur:', err.response ? {
        status: err.response.status,
        statusText: err.response.statusText,
        data: err.response.data
      } : 'Pas de réponse du serveur');
      
      dispatch({
        type: LOGIN_FAIL,
        payload: err.response && err.response.data && err.response.data.message 
          ? err.response.data.message 
          : 'Erreur de connexion - Vérifiez que le serveur est en cours d\'exécution'
      });
    }
  };

  // Déconnecter un utilisateur
  const logout = () => dispatch({ type: LOGOUT });

  // Mettre à jour les crédits de l'utilisateur
  const updateCredits = (credits) => {
    dispatch({
      type: UPDATE_CREDITS,
      payload: credits
    });
  };

  // Effacer les erreurs
  const clearErrors = () => dispatch({ type: CLEAR_ERRORS });

  return (
    <AuthContext.Provider
      value={{
        token: state.token,
        isAuthenticated: state.isAuthenticated,
        loading: state.loading,
        user: state.user,
        error: state.error,
        register,
        loadUser,
        login,
        logout,
        updateCredits,
        clearErrors
      }}
    >
      {props.children}
    </AuthContext.Provider>
  );
};

export default AuthState; 