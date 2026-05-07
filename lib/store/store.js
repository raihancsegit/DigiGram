import { configureStore } from '@reduxjs/toolkit';
import locationReducer from './features/locationSlice';
import authReducer from './features/authSlice';
import newsReducer from './features/newsSlice';
import wardDataReducer from './features/wardDataSlice';

// Helper to load state from localStorage
export const loadState = () => {
  if (typeof window === 'undefined') return undefined;
  try {
    const serializedState = localStorage.getItem('dg_state');
    if (serializedState === null) return undefined;
    return JSON.parse(serializedState);
  } catch (err) {
    return undefined;
  }
};

// Helper to save state to localStorage
const saveState = (state) => {
  try {
    const serializedState = JSON.stringify({
      auth: state.auth,
      wardData: state.wardData,
      location: state.location
    });
    localStorage.setItem('dg_state', serializedState);
  } catch {
    // Ignore write errors
  }
};

const preloadedState = loadState();

export const store = configureStore({
  reducer: {
    location: locationReducer,
    auth: authReducer,
    news: newsReducer,
    wardData: wardDataReducer,
  },
  preloadedState,
});

store.subscribe(() => {
  saveState(store.getState());
});