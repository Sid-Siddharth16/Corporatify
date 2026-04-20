import { useEffect, useRef, useState } from 'react';
import type { ChangeEvent, FormEvent } from 'react';
import { jwtDecode } from 'jwt-decode';

/**
 * Represents all controlled values used by the login form.
 */
export type LoginFormState = {
  email: string;
  password: string;
  rememberMe: boolean;
};

/**
 * Tracks per-field validation messages in a predictable shape for the login UI.
 */
export type LoginFormErrors = {
  email: string;
  password: string;
};

/**
 * Represents the user fields we rely on from the Google identity token payload.
 */
type GoogleJwtPayload = {
  email?: string;
  email_verified?: boolean;
  name?: string;
  picture?: string;
  sub?: string;
};

/**
 * Represents normalized Google user profile data used by the login UI.
 */
export type GoogleUserProfile = {
  id: string;
  email: string;
  name: string;
  picture?: string;
};

/**
 * Represents credential payload returned by Google Identity Services callback.
 */
type GoogleCredentialResponse = {
  credential?: string;
};

/**
 * Represents the minimal Google Identity Services API used by this module.
 */
type GoogleIdentityApi = {
  accounts: {
    id: {
      initialize: (config: {
        client_id: string;
        callback: (response: GoogleCredentialResponse) => void;
      }) => void;
      renderButton: (
        parent: HTMLElement,
        options: {
          theme?: 'outline' | 'filled_blue' | 'filled_black';
          size?: 'large' | 'medium' | 'small';
          shape?: 'rectangular' | 'pill' | 'circle' | 'square';
          text?: 'signin_with' | 'signup_with' | 'continue_with' | 'signin';
          width?: number;
        },
      ) => void;
    };
  };
};

declare global {
  interface Window {
    google?: GoogleIdentityApi;
  }
}

/**
 * Exposes minimal state and handlers for a simple progressive login flow.
 */
type UseLoginFormReturn = {
  formState: LoginFormState;
  formErrors: LoginFormErrors;
  googleUser: GoogleUserProfile | null;
  googleAuthError: string;
  googleButtonContainerRef: React.RefObject<HTMLDivElement | null>;
  isEmailValid: boolean;
  shouldShowPasswordField: boolean;
  isPasswordValid: boolean;
  isFormValid: boolean;
  handleEmailChange: (event: ChangeEvent<HTMLInputElement>) => void;
  handlePasswordChange: (event: ChangeEvent<HTMLInputElement>) => void;
  handleRememberMeChange: (event: ChangeEvent<HTMLInputElement>) => void;
  handleSubmit: (event: FormEvent<HTMLFormElement>) => void;
};

/**
 * Allows the login hook caller to react to successful Google authentication.
 */
type UseLoginFormOptions = {
  onGoogleLoginSuccess?: (userProfile: GoogleUserProfile) => void;
};

/**
 * Centralizes strong password requirements so they stay consistent in validation and UI copy.
 */
const PASSWORD_REQUIREMENTS_DESCRIPTION =
  '8-64 chars, uppercase, lowercase, number, and special character.';

/**
 * Validates a single email field and returns a user-friendly error string.
 * @param email Raw email string from input state.
 * @returns Empty string when valid, otherwise a specific validation message.
 */
const validateEmail = (email: string): string => {
  const normalizedEmail = email.trim();

  if (!normalizedEmail) {
    return 'Email is required.';
  }

  if (normalizedEmail.length > 254) {
    return 'Email cannot exceed 254 characters.';
  }

  if (normalizedEmail.includes(' ')) {
    return 'Email cannot contain spaces.';
  }

  const emailParts = normalizedEmail.split('@');
  if (emailParts.length !== 2 || emailParts[0].length > 64) {
    return 'Enter a valid email address.';
  }

  const emailPattern = /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/;
  if (!emailPattern.test(normalizedEmail)) {
    return 'Enter a valid email address.';
  }

  return '';
};

/**
 * Validates a single password field with common security-focused checks.
 * @param password Raw password string from input state.
 * @param email Current email value to prevent easy-to-guess reused identity fragments.
 * @returns Empty string when valid, otherwise a specific validation message.
 */
const validatePassword = (password: string, email: string): string => {
  if (!password) {
    return 'Password is required.';
  }

  if (password.length < 8 || password.length > 64) {
    return `Password must be ${PASSWORD_REQUIREMENTS_DESCRIPTION}`;
  }

  if (/\s/.test(password)) {
    return 'Password cannot contain spaces.';
  }

  if (!/[a-z]/.test(password)) {
    return 'Password must include at least one lowercase letter.';
  }

  if (!/[A-Z]/.test(password)) {
    return 'Password must include at least one uppercase letter.';
  }

  if (!/\d/.test(password)) {
    return 'Password must include at least one number.';
  }

  if (!/[^A-Za-z0-9]/.test(password)) {
    return 'Password must include at least one special character.';
  }

  // Rejects very common weak patterns that are frequently targeted in credential stuffing attacks.
  if (/(password|123456|qwerty|letmein|admin)/i.test(password)) {
    return 'Password is too common. Choose a stronger password.';
  }

  // Rejects obvious repeated-character patterns such as "AAA111!!!".
  if (/(.)\1{2,}/.test(password)) {
    return 'Password cannot contain 3 or more repeated characters in a row.';
  }

  const emailUsername = email.split('@')[0]?.toLowerCase().trim();
  if (emailUsername && password.toLowerCase().includes(emailUsername)) {
    return 'Password should not contain your email username.';
  }

  return '';
};

/**
 * Manages login form state and interactions.
 * @returns Controlled form values and event handlers for the login UI.
 */
export const useLoginForm = (options: UseLoginFormOptions = {}): UseLoginFormReturn => {
  // Keep related form fields grouped together for simpler updates and resets.
  const [formState, setFormState] = useState<LoginFormState>({
    email: '',
    password: '',
    rememberMe: true,
  });
  // Stores live validation output so errors are shown immediately while typing.
  const [formErrors, setFormErrors] = useState<LoginFormErrors>({
    email: '',
    password: '',
  });
  // Stores authenticated Google profile details so UI can show signed-in confirmation.
  const [googleUser, setGoogleUser] = useState<GoogleUserProfile | null>(null);
  // Stores Google login failures in a user-friendly message for inline visibility.
  const [googleAuthError, setGoogleAuthError] = useState<string>('');
  // Keeps a stable mount target where GIS renders the Google login button.
  const googleButtonContainerRef = useRef<HTMLDivElement>(null);

  /**
   * Updates email and validates it on each keystroke for inline feedback.
   * @param event Input change event from the email field.
   */
  const handleEmailChange = (event: ChangeEvent<HTMLInputElement>) => {
    const nextEmail = event.target.value;
    const emailError = validateEmail(nextEmail);

    setFormState((previousState) => ({
      ...previousState,
      email: nextEmail,
      // Clears password when email becomes invalid to enforce step-by-step flow.
      password: emailError ? '' : previousState.password,
    }));

    setFormErrors((previousErrors) => ({
      ...previousErrors,
      email: emailError,
      // Hides stale password errors when password field is not active.
      password: emailError ? '' : previousErrors.password,
    }));
  };

  /**
   * Updates password and validates it only after email has passed validation.
   * @param event Input change event from the password field.
   */
  const handlePasswordChange = (event: ChangeEvent<HTMLInputElement>) => {
    const currentEmailError = validateEmail(formState.email);
    if (currentEmailError) {
      return;
    }

    const nextPassword = event.target.value;
    const passwordError = validatePassword(nextPassword, formState.email);

    setFormState((previousState) => ({
      ...previousState,
      password: nextPassword,
    }));

    setFormErrors((previousErrors) => ({
      ...previousErrors,
      password: passwordError,
    }));
  };

  /**
   * Toggles persistent login preference from the remember-me checkbox.
   * @param event Input change event from the remember-me checkbox.
   */
  const handleRememberMeChange = (event: ChangeEvent<HTMLInputElement>) => {
    setFormState((previousState) => ({
      ...previousState,
      rememberMe: event.target.checked,
    }));
  };

  /**
   * Handles Google identity callback, decodes token, and extracts trusted profile fields.
   * @param credentialResponse Credential callback payload from Google Identity Services.
   */
  const handleGoogleSuccess = (credentialResponse: GoogleCredentialResponse) => {
    if (!credentialResponse.credential) {
      setGoogleAuthError('Google login failed. Missing identity token.');
      setGoogleUser(null);
      return;
    }

    try {
      const decodedToken = jwtDecode<GoogleJwtPayload>(credentialResponse.credential);
      // Only proceed when core identity fields are present and verified.
      if (!decodedToken.email || !decodedToken.name || !decodedToken.sub) {
        setGoogleAuthError('Google login failed. Incomplete profile information received.');
        setGoogleUser(null);
        return;
      }

      if (!decodedToken.email_verified) {
        setGoogleAuthError('Please verify your Google email before signing in.');
        setGoogleUser(null);
        return;
      }

      // Builds one normalized profile object so UI and parent-level auth logic stay in sync.
      const nextGoogleUser: GoogleUserProfile = {
        id: decodedToken.sub,
        email: decodedToken.email,
        name: decodedToken.name,
        picture: decodedToken.picture,
      };

      setGoogleUser(nextGoogleUser);
      setGoogleAuthError('');
      // Notifies parent components that authentication is complete and trusted profile data is available.
      options.onGoogleLoginSuccess?.(nextGoogleUser);
    } catch {
      setGoogleAuthError('Google login failed. Unable to validate identity token.');
      setGoogleUser(null);
    }
  };

  useEffect(() => {
    const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID?.trim();
    const buttonContainer = googleButtonContainerRef.current;

    // Avoid silent failures by surfacing missing client id immediately in UI.
    if (!clientId) {
      setGoogleAuthError('Google Client ID is missing. Set VITE_GOOGLE_CLIENT_ID in .env.');
      return;
    }

    if (!buttonContainer) {
      return;
    }

    // Initializes only when GIS script is available on window.
    if (!window.google?.accounts?.id) {
      setGoogleAuthError('Google Sign-In is not available right now. Please refresh.');
      return;
    }

    buttonContainer.innerHTML = '';
    window.google.accounts.id.initialize({
      client_id: clientId,
      callback: handleGoogleSuccess,
    });
    window.google.accounts.id.renderButton(buttonContainer, {
      theme: 'outline',
      size: 'large',
      shape: 'rectangular',
      text: 'continue_with',
      width: 360,
    });
    setGoogleAuthError('');
  }, []);

  /**
   * Prevents page reload and handles current placeholder sign-in behavior.
   * @param event Native form submit event.
   */
  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const emailError = validateEmail(formState.email);
    const passwordError = validatePassword(formState.password, formState.email);
    const hasValidationErrors = Boolean(emailError) || Boolean(passwordError);

    // Ensures submit always reflects the latest validation state.
    setFormErrors({
      email: emailError,
      password: passwordError,
    });

    if (hasValidationErrors) {
      return;
    }

    // Keeps behavior unchanged while auth API integration is still pending.
    window.alert(`Welcome back, ${formState.email.trim() || 'User'}!`);
  };

  // Drives progressive reveal: password appears only when email is currently valid.
  const isEmailValid = !validateEmail(formState.email);
  const shouldShowPasswordField = isEmailValid;
  const isPasswordValid = shouldShowPasswordField && !validatePassword(formState.password, formState.email);
  // Keeps CTA inactive until both fields satisfy validation.
  const isFormValid = isEmailValid && isPasswordValid;

  return {
    formState,
    formErrors,
    googleUser,
    googleAuthError,
    googleButtonContainerRef,
    isEmailValid,
    shouldShowPasswordField,
    isPasswordValid,
    isFormValid,
    handleEmailChange,
    handlePasswordChange,
    handleRememberMeChange,
    handleSubmit,
  };
};
