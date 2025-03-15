import axios from 'axios';

const setAuthToken = token => {
  console.log('setAuthToken appelé avec token:', token ? 'Token présent' : 'Pas de token');
  
  if (token) {
    axios.defaults.headers.common['x-auth-token'] = token;
    console.log('Token ajouté aux en-têtes par défaut d\'axios');
  } else {
    delete axios.defaults.headers.common['x-auth-token'];
    console.log('Token supprimé des en-têtes par défaut d\'axios');
  }
};

export default setAuthToken; 