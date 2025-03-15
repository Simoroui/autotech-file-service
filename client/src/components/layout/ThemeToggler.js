import React, { useContext } from 'react';
import ThemeContext from '../../context/theme/themeContext';

const ThemeToggler = () => {
  const themeContext = useContext(ThemeContext);
  const { darkMode, toggleTheme } = themeContext;

  return (
    <button 
      onClick={toggleTheme} 
      className="btn btn-link text-light p-0 d-flex align-items-center"
      aria-label={darkMode ? 'Passer au mode clair' : 'Passer au mode sombre'}
      title={darkMode ? 'Passer au mode clair' : 'Passer au mode sombre'}
    >
      {darkMode ? (
        <i className="fas fa-sun fs-5"></i>
      ) : (
        <i className="fas fa-moon fs-5"></i>
      )}
    </button>
  );
};

export default ThemeToggler; 