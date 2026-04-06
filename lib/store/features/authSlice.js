import { createSlice } from '@reduxjs/toolkit';

const initialState = {
    user: null, // { role: 'WARD_MEMBER', name: 'মোঃ মেম্বার আলী', unionId: 'dumuria', wardId: 'ward-1' }
    isAuthenticated: false,
};

const authSlice = createSlice({
    name: 'auth',
    initialState,
    reducers: {
        login: (state, action) => {
            state.user = action.payload;
            state.isAuthenticated = true;
        },
        logout: (state) => {
            state.user = null;
            state.isAuthenticated = false;
        },
    },
});

export const { login, logout } = authSlice.actions;
export default authSlice.reducer;
