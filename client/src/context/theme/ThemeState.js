import React, { useReducer, useEffect } from 'react';
import ThemeContext from './themeContext';
import themeReducer from './themeReducer';
import { TOGGLE_THEME, SET_THEME } from '../types';

const ThemeState = props => {
  // Vérifier la préférence de l'utilisateur dans localStorage
  const getInitialDarkMode = () => {
    // Vérifier localStorage
    const savedTheme = localStorage.getItem('darkMode');
    if (savedTheme !== null) {
      return savedTheme === 'true';
    }
    
    // Si aucune préférence n'est enregistrée, vérifier la préférence du système
    return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
  };

  const initialState = {
    darkMode: getInitialDarkMode()
  };

  const [state, dispatch] = useReducer(themeReducer, initialState);

  // Définir le thème dans le document
  useEffect(() => {
    // Mettre à jour localStorage
    localStorage.setItem('darkMode', state.darkMode);
    
    // Appliquer la classe au body
    if (state.darkMode) {
      document.body.classList.add('dark-mode');
    } else {
      document.body.classList.remove('dark-mode');
    }
  }, [state.darkMode]);
  
  // Basculer le thème
  const toggleTheme = () => {
    dispatch({
      type: TOGGLE_THEME
    });
  };
  
  // Définir un thème spécifique
  const setTheme = (isDark) => {
    dispatch({
      type: SET_THEME,
      payload: isDark
    });
  };

  return (
    <ThemeContext.Provider
      value={{
        darkMode: state.darkMode,
        toggleTheme,
        setTheme
      }}
    >
      {props.children}
    </ThemeContext.Provider>
  );
};

export default ThemeState; 