/**
 * Public user profile shape exposed to UI and Redux state.
 */
export type AuthUser = {
  id: string;
  name: string;
  email: string;
};

/**
 * Internal persisted user shape stored in localStorage.
 * Password is kept only for frontend-only simulation.
 */
export type StoredAuthUser = AuthUser & {
  password: string;
};

/**
 * Payload collected from the login form submission.
 */
export type LoginPayload = {
  email: string;
  password: string;
  rememberMe: boolean;
};

/**
 * Payload collected from the signup form submission.
 */
export type SignupPayload = {
  name: string;
  email: string;
  password: string;
  rememberMe: boolean;
};

/**
 * Redux-managed auth slice state.
 */
export type AuthState = {
  user: AuthUser | null;
  isAuthenticated: boolean;
};
