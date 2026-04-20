import type { AuthUser, LoginPayload, SignupPayload, StoredAuthUser } from '../types';

/**
 * Dedicated key for all registered frontend-only auth users.
 */
const USERS_STORAGE_KEY = 'corporatify_auth_users';
/**
 * Dedicated key for long-lived remembered sessions.
 */
const REMEMBERED_SESSION_KEY = 'corporatify_auth_session';
/**
 * Dedicated key for temporary in-tab sessions when remember-me is disabled.
 */
const TEMP_SESSION_KEY = 'corporatify_auth_session_temp';

/**
 * Reads and validates persisted users from localStorage.
 * @returns Array of stored users or an empty list on invalid state.
 */
const readStoredUsers = (): StoredAuthUser[] => {
  try {
    const rawUsers = window.localStorage.getItem(USERS_STORAGE_KEY);
    if (!rawUsers) {
      return [];
    }
    const parsedUsers = JSON.parse(rawUsers) as StoredAuthUser[];
    return Array.isArray(parsedUsers) ? parsedUsers : [];
  } catch {
    return [];
  }
};

/**
 * Persists all registered users to localStorage.
 * @param users Next full list of registered users.
 */
const writeStoredUsers = (users: StoredAuthUser[]): void => {
  window.localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(users));
};

/**
 * Removes password fields before exposing a user to the UI state.
 * @param storedUser Internal stored user with password.
 * @returns Safe user object for Redux and component rendering.
 */
const toPublicUser = (storedUser: StoredAuthUser): AuthUser => ({
  id: storedUser.id,
  name: storedUser.name,
  email: storedUser.email,
});

/**
 * Creates a deterministic normalized email for robust uniqueness checks.
 * @param email Raw input email.
 * @returns Trimmed lowercased email.
 */
const normalizeEmail = (email: string): string => email.trim().toLowerCase();

/**
 * Creates a lightweight local-only user id.
 * @returns String id suitable for frontend persistence.
 */
const createUserId = (): string => `${Date.now()}-${Math.random().toString(16).slice(2, 10)}`;

/**
 * Stores active session in localStorage or sessionStorage based on remember preference.
 * @param user Authenticated user profile.
 * @param rememberMe Whether session should survive browser restarts.
 */
const persistSession = (user: AuthUser, rememberMe: boolean): void => {
  if (rememberMe) {
    window.localStorage.setItem(REMEMBERED_SESSION_KEY, JSON.stringify(user));
    window.sessionStorage.removeItem(TEMP_SESSION_KEY);
    return;
  }
  window.sessionStorage.setItem(TEMP_SESSION_KEY, JSON.stringify(user));
  window.localStorage.removeItem(REMEMBERED_SESSION_KEY);
};

/**
 * Attempts to restore currently authenticated session from storage.
 * @returns Existing session user when available, otherwise null.
 */
export const getPersistedSession = (): AuthUser | null => {
  try {
    const rememberedSession = window.localStorage.getItem(REMEMBERED_SESSION_KEY);
    if (rememberedSession) {
      return JSON.parse(rememberedSession) as AuthUser;
    }
    const tempSession = window.sessionStorage.getItem(TEMP_SESSION_KEY);
    return tempSession ? (JSON.parse(tempSession) as AuthUser) : null;
  } catch {
    return null;
  }
};

/**
 * Registers a brand-new user while enforcing email uniqueness.
 * @param payload Validated signup form payload.
 * @returns Public user that can be stored in Redux auth state.
 * @throws Error when email already exists.
 */
export const signupUser = (payload: SignupPayload): AuthUser => {
  const existingUsers = readStoredUsers();
  const normalizedEmail = normalizeEmail(payload.email);

  const isEmailTaken = existingUsers.some((storedUser) => normalizeEmail(storedUser.email) === normalizedEmail);
  if (isEmailTaken) {
    throw new Error('This email is already registered. Please log in instead.');
  }

  const nextStoredUser: StoredAuthUser = {
    id: createUserId(),
    name: payload.name.trim(),
    email: normalizedEmail,
    password: payload.password,
  };
  writeStoredUsers([nextStoredUser, ...existingUsers]);

  const publicUser = toPublicUser(nextStoredUser);
  persistSession(publicUser, payload.rememberMe);
  return publicUser;
};

/**
 * Authenticates a user against locally persisted records.
 * @param payload Validated login form payload.
 * @returns Authenticated public user profile.
 * @throws Error when credentials are invalid.
 */
export const loginUser = (payload: LoginPayload): AuthUser => {
  const existingUsers = readStoredUsers();
  const normalizedEmail = normalizeEmail(payload.email);
  const matchedUser = existingUsers.find(
    (storedUser) => normalizeEmail(storedUser.email) === normalizedEmail && storedUser.password === payload.password,
  );

  if (!matchedUser) {
    throw new Error('Invalid email or password.');
  }

  const publicUser = toPublicUser(matchedUser);
  persistSession(publicUser, payload.rememberMe);
  return publicUser;
};

/**
 * Clears both remembered and temporary sessions to complete logout flow.
 */
export const clearSession = (): void => {
  window.localStorage.removeItem(REMEMBERED_SESSION_KEY);
  window.sessionStorage.removeItem(TEMP_SESSION_KEY);
};
