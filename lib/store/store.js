import { configureStore } from '@reduxjs/toolkit';
import locationReducer from './features/locationSlice';
import authReducer from './features/authSlice';
import newsReducer from './features/newsSlice';
import wardDataReducer from './features/wardDataSlice';

export const store = configureStore({
    reducer: {
        location: locationReducer,
        auth: authReducer,
        news: newsReducer,
        wardData: wardDataReducer,
    },
});