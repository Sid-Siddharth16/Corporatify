import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import type { AuthState, AuthUser } from './types';

/**
 * Auth state starts unauthenticated until a stored session is restored.
 */
const initialState: AuthState = {
  user: null,
  isAuthenticated: false,
};

/**
 * Central auth state manager for login/signup/logout session transitions.
 */
const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    /**
     * Stores logged-in user details and marks session authenticated.
     * @param state Current auth state draft.
     * @param action User payload from successful login flow.
     */
    login: (state, action: PayloadAction<AuthUser>) => {
      state.user = action.payload;
      state.isAuthenticated = true;
    },
    /**
     * Stores newly signed-up user and authenticates immediately.
     * @param state Current auth state draft.
     * @param action User payload from successful signup flow.
     */
    signup: (state, action: PayloadAction<AuthUser>) => {
      state.user = action.payload;
      state.isAuthenticated = true;
    },
    /**
     * Clears active auth session from Redux state.
     * @param state Current auth state draft.
     */
    logout: (state) => {
      state.user = null;
      state.isAuthenticated = false;
    },
    /**
     * Restores an existing stored session during app bootstrap.
     * @param state Current auth state draft.
     * @param action Persisted user or null when no session exists.
     */
    hydrateSession: (state, action: PayloadAction<AuthUser | null>) => {
      state.user = action.payload;
      state.isAuthenticated = Boolean(action.payload);
    },
  },
});

export const { login, signup, logout, hydrateSession } = authSlice.actions;
export default authSlice.reducer;
