import { configureStore } from '@reduxjs/toolkit';
import locationReducer from './features/locationSlice';
import authReducer from './features/authSlice';
import newsReducer from './features/newsSlice';

export const store = configureStore({
    reducer: {
        location: locationReducer,
        auth: authReducer,
        news: newsReducer,
    },
});