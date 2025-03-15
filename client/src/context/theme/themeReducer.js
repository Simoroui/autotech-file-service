import { TOGGLE_THEME, SET_THEME } from '../types';

const themeReducer = (state, action) => {
  switch (action.type) {
    case TOGGLE_THEME:
      return {
        ...state,
        darkMode: !state.darkMode
      };
    case SET_THEME:
      return {
        ...state,
        darkMode: action.payload
      };
    default:
      return state;
  }
};

export default themeReducer; 