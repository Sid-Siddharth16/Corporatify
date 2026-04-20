import { configureStore } from '@reduxjs/toolkit';
import authReducer from '../pages/login/slice';

/**
 * Global Redux store that currently hosts auth state and scales for future slices.
 */
export const store = configureStore({
  reducer: {
    auth: authReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
