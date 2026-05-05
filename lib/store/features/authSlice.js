import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { authService } from '@/lib/services/authService';

const initialState = {
    user: null, // { id, email, role, access_scope_id, first_name, last_name, avatar_url }
    isAuthenticated: false,
    loading: false,
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
        updateUser: (state, action) => {
            if (state.user) {
                state.user = { ...state.user, ...action.payload };
            }
        },
    },
});

export const performLogout = createAsyncThunk(
    'auth/performLogout',
    async (_, { dispatch }) => {
        try {
            await authService.logout();
            dispatch(logout());
            return true;
        } catch (error) {
            console.error("Logout error:", error);
            // Even if supabase logout fails, we should clear local state
            dispatch(logout());
            throw error;
        }
    }
);

export const { login, logout, updateUser } = authSlice.actions;
export default authSlice.reducer;
