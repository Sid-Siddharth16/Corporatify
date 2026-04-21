import { useMemo, useState, type ChangeEvent, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { GoogleLogin, type CredentialResponse } from '@react-oauth/google';
import { jwtDecode } from 'jwt-decode';
import Input from '../../components/input';
import { corporatifyLogo } from '../../common/images';
import { useAppDispatch } from '../../redux/hooks';
import { loginUser, loginWithGoogleUser } from './service/authService';
import { login } from './slice';
import type { GoogleAuthProfile, LoginPayload } from './types';
import './login.scss';

type LoginErrors = {
  email: string;
  password: string;
};

type GoogleJwtPayload = {
  email?: string;
  email_verified?: boolean;
  name?: string;
  picture?: string;
  sub?: string;
};

/**
 * Validates login form fields and returns user-facing error messages.
 * @param payload Controlled login form values.
 * @returns Per-field validation messages.
 */
const validateLogin = (payload: LoginPayload): LoginErrors => {
  const nextErrors: LoginErrors = { email: '', password: '' };
  const normalizedEmail = payload.email.trim();

  if (!normalizedEmail) {
    nextErrors.email = 'Email is required.';
  } else if (!/^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/.test(normalizedEmail)) {
    nextErrors.email = 'Enter a valid email address.';
  }

  if (!payload.password) {
    nextErrors.password = 'Password is required.';
  } else if (payload.password.length < 8) {
    nextErrors.password = 'Password must be at least 8 characters.';
  }

  return nextErrors;
};

/**
 * Login screen for existing users with remember-me and password visibility toggle.
 * @returns Full login page for frontend-only authentication flow.
 */
function LoginPage() {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  // Stores controlled field values to provide instant validation and UX feedback.
  const [formState, setFormState] = useState<LoginPayload>({
    email: '',
    password: '',
    rememberMe: true,
  });
  // Stores field-level validation messages so users know exactly what to fix.
  const [formErrors, setFormErrors] = useState<LoginErrors>({ email: '', password: '' });
  // Controls eye button behavior so users can verify passwords before submit.
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  // Shows loading feedback on submit button to prevent accidental double submissions.
  const [isSubmitting, setIsSubmitting] = useState(false);
  // Stores Google auth runtime issues for clear inline feedback.
  const [googleAuthError, setGoogleAuthError] = useState('');

  /**
   * Updates string form fields in a generic, reusable way.
   * @param field Field name to update.
   * @param value Next string value from input.
   */
  const updateTextField = (field: 'email' | 'password', value: string) => {
    setFormState((previousState) => ({ ...previousState, [field]: value }));
    // Clears stale error as soon as user edits the field again.
    setFormErrors((previousErrors) => ({ ...previousErrors, [field]: '' }));
  };

  /**
   * Handles login form submission and dispatches authenticated session into Redux.
   * @param event Native form submit event.
   */
  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const nextErrors = validateLogin(formState);
    setFormErrors(nextErrors);
    if (nextErrors.email || nextErrors.password) {
      return;
    }

    setIsSubmitting(true);
    try {
      // Small delay keeps loading state visible, making successful login feel intentional.
      await new Promise((resolve) => window.setTimeout(resolve, 450));
      const authenticatedUser = loginUser(formState);
      dispatch(login(authenticatedUser));
      toast.success(`Welcome back, ${authenticatedUser.name}!`);
      navigate('/dashboard', { replace: true });
    } catch (error) {
      const readableError = error instanceof Error ? error.message : 'Unable to login right now.';
      toast.error(readableError);
    } finally {
      setIsSubmitting(false);
    }
  };

  const isFormComplete = useMemo(
    () => Boolean(formState.email.trim()) && Boolean(formState.password.trim()),
    [formState.email, formState.password],
  );

  /**
   * Handles Google token callback and logs user into the same Redux/localStorage flow.
   * @param credentialResponse Credential payload from `GoogleLogin` component.
   */
  const handleGoogleSuccess = (credentialResponse: CredentialResponse) => {
    if (!credentialResponse.credential) {
      setGoogleAuthError('Google login failed. Missing identity token.');
      console.error('Google OAuth error: credential missing in success callback.');
      return;
    }
    try {
      const decodedToken = jwtDecode<GoogleJwtPayload>(credentialResponse.credential);
      if (!decodedToken.email || !decodedToken.name || !decodedToken.sub) {
        setGoogleAuthError('Google login failed. Incomplete profile information received.');
        console.error('Google OAuth error: decoded token missing required profile fields.', decodedToken);
        return;
      }
      if (!decodedToken.email_verified) {
        setGoogleAuthError('Please verify your Google email before signing in.');
        console.error('Google OAuth error: email is not verified for decoded profile.', decodedToken.email);
        return;
      }
      const googleProfile: GoogleAuthProfile = {
        id: decodedToken.sub,
        email: decodedToken.email,
        name: decodedToken.name,
        picture: decodedToken.picture,
      };
      const authenticatedUser = loginWithGoogleUser(googleProfile, formState.rememberMe);
      dispatch(login(authenticatedUser));
      setGoogleAuthError('');
      toast.success(`Signed in with Google as ${authenticatedUser.name}.`);
      navigate('/dashboard', { replace: true });
    } catch (error) {
      setGoogleAuthError('Google login failed. Unable to validate identity token.');
      console.error('Google OAuth error: failed to decode/validate credential.', error);
    }
  };

  return (
    <main className="login-page">
      <section className="login-layout" aria-label="Login panel and branding banner">
        <article className="login-panel">
          <header className="login-panel__header">

            <h1 className="login-panel__title">Welcome Back</h1>
            <p className="login-panel__subtitle">Log in to continue your corporate rage workflow.</p>
          </header>

          <form className="login-form" onSubmit={handleSubmit}>
            <Input
              id="email"
              name="email"
              label="Email"
              type="email"
              labelClassName="login-form__label"
              inputClassName={`login-form__input ${formErrors.email ? 'login-form__input--error' : ''}`}
              errorClassName="login-form__error-message"
              value={formState.email}
              onChange={(event: ChangeEvent<HTMLInputElement>) => updateTextField('email', event.target.value)}
              autoComplete="email"
              placeholder="you@corporate.com"
              errorMessage={formErrors.email}
              required
            />

            <Input
              id="password"
              name="password"
              label="Password"
              type={isPasswordVisible ? 'text' : 'password'}
              labelClassName="login-form__label"
              inputClassName={`login-form__input login-form__input--with-toggle ${formErrors.password ? 'login-form__input--error' : ''
                }`}
              errorClassName="login-form__error-message"
              value={formState.password}
              onChange={(event: ChangeEvent<HTMLInputElement>) => updateTextField('password', event.target.value)}
              autoComplete="current-password"
              placeholder="Enter your password"
              errorMessage={formErrors.password}
              required
              trailingContent={
                <button
                  type="button"
                  className="login-form__password-toggle"
                  aria-label={isPasswordVisible ? 'Hide password' : 'Show password'}
                  aria-pressed={isPasswordVisible}
                  onClick={() => setIsPasswordVisible((previousVisibility) => !previousVisibility)}
                >
                  <svg className="login-form__password-toggle-icon" viewBox="0 0 24 24" aria-hidden="true">
                    <path d="M12 5c-5.3 0-9.6 3.6-11 7 1.4 3.4 5.7 7 11 7s9.6-3.6 11-7c-1.4-3.4-5.7-7-11-7Zm0 11.2A4.2 4.2 0 1 1 12 7.8a4.2 4.2 0 0 1 0 8.4Z" />
                    <circle cx="12" cy="12" r="2.2" />
                  </svg>
                </button>
              }
            />

            <div className="login-form__row">
              <label className="login-form__checkbox">
                <input
                  type="checkbox"
                  checked={formState.rememberMe}
                  onChange={(event) =>
                    setFormState((previousState) => ({ ...previousState, rememberMe: event.target.checked }))
                  }
                />
                Remember me
              </label>
            </div>

            <button type="submit" className="login-form__submit" disabled={isSubmitting || !isFormComplete}>
              {isSubmitting ? 'Signing in...' : 'Sign In'}
            </button>
          </form>

          <p className="login-form__switch">
            New to Corporatify? <Link to="/signup">Create account</Link>
          </p>
          {/* Uses `GoogleLogin` only (no manual GIS initialize) to prevent duplicate initialization calls. */}
          <div className="login-social">
            <div className="login-social__google-container">
              <GoogleLogin
                onSuccess={handleGoogleSuccess}
                onError={() => {
                  setGoogleAuthError('Google login failed. Please try again.');
                  console.error('Google OAuth error: onError callback fired.');
                }}
                theme="outline"
                shape="rectangular"
                text="continue_with"
                size="large"
              />
            </div>
          </div>
          {googleAuthError ? (
            <p className="login-form__error-message" role="alert">
              {googleAuthError}
            </p>
          ) : null}
        </article>

        <img src={corporatifyLogo} alt="Corporatify Logo" className="login-panel__brand-logo" />
      </section>
    </main>
  );
}

export default LoginPage;
