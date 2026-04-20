import { useMemo, useState, type ChangeEvent, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import Input from '../../components/input';
import { corporatifyLogo } from '../../common/images';
import { useAppDispatch } from '../../redux/hooks';
import { signupUser } from '../login/service/authService';
import { signup } from '../login/slice';
import type { SignupPayload } from '../login/types';
import './signup.scss';

type SignupFormState = SignupPayload & {
  confirmPassword: string;
};

type SignupErrors = {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
};

/**
 * Validates signup form state and returns detailed user-facing errors.
 * @param payload Signup form values including confirm password.
 * @returns Per-field validation map.
 */
const validateSignup = (payload: SignupFormState): SignupErrors => {
  const nextErrors: SignupErrors = {
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
  };

  if (!payload.name.trim()) {
    nextErrors.name = 'Name is required.';
  }

  if (!payload.email.trim()) {
    nextErrors.email = 'Email is required.';
  } else if (!/^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/.test(payload.email.trim())) {
    nextErrors.email = 'Enter a valid email address.';
  }

  if (!payload.password) {
    nextErrors.password = 'Password is required.';
  } else if (payload.password.length < 8) {
    nextErrors.password = 'Password must be at least 8 characters.';
  }

  if (!payload.confirmPassword) {
    nextErrors.confirmPassword = 'Please confirm your password.';
  } else if (payload.confirmPassword !== payload.password) {
    nextErrors.confirmPassword = 'Passwords do not match.';
  }

  return nextErrors;
};

/**
 * Signup page for creating local frontend-only user accounts.
 * @returns Full signup form with validation, loading states, and success flow.
 */
function SignupPage() {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  // Keeps all signup fields controlled for deterministic validation behavior.
  const [formState, setFormState] = useState<SignupFormState>({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    rememberMe: true,
  });
  // Stores field-specific errors to help users recover quickly.
  const [formErrors, setFormErrors] = useState<SignupErrors>({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  // Controls password and confirm-password visibility toggles.
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const [isConfirmPasswordVisible, setIsConfirmPasswordVisible] = useState(false);
  // Drives button loading state while signup request is being simulated.
  const [isSubmitting, setIsSubmitting] = useState(false);

  /**
   * Updates one text field and clears only that field's stale error message.
   * @param field Field name to update.
   * @param value New input value.
   */
  const updateTextField = (field: 'name' | 'email' | 'password' | 'confirmPassword', value: string) => {
    setFormState((previousState) => ({ ...previousState, [field]: value }));
    setFormErrors((previousErrors) => ({ ...previousErrors, [field]: '' }));
  };

  /**
   * Handles signup submission, account creation, Redux update, and redirect.
   * @param event Native form submit event.
   */
  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const nextErrors = validateSignup(formState);
    setFormErrors(nextErrors);
    if (Object.values(nextErrors).some(Boolean)) {
      return;
    }

    setIsSubmitting(true);
    try {
      // Simulates realistic async latency so loading state is visible in UI.
      await new Promise((resolve) => window.setTimeout(resolve, 550));
      const createdUser = signupUser({
        name: formState.name,
        email: formState.email,
        password: formState.password,
        rememberMe: formState.rememberMe,
      });
      dispatch(signup(createdUser));
      toast.success('Account created successfully!');
      navigate('/dashboard', { replace: true });
    } catch (error) {
      const readableError = error instanceof Error ? error.message : 'Signup failed. Please try again.';
      toast.error(readableError);
    } finally {
      setIsSubmitting(false);
    }
  };

  const isFormComplete = useMemo(
    () =>
      Boolean(formState.name.trim()) &&
      Boolean(formState.email.trim()) &&
      Boolean(formState.password.trim()) &&
      Boolean(formState.confirmPassword.trim()),
    [formState.confirmPassword, formState.email, formState.name, formState.password],
  );

  return (
    <main className="signup-page">
      <section className="signup-layout" aria-label="Signup panel and branding banner">
        <article className="signup-panel">
          <header className="signup-panel__header">
            {/* Matches login flow by placing brand mark at the top of the form header. */}
            <h1 className="signup-panel__title">Create Account</h1>
            <p className="signup-panel__subtitle">Convert your corporate rage into professional output in seconds.</p>
          </header>

          <form className="signup-form" onSubmit={handleSubmit}>
            <Input
              id="name"
              name="name"
              label="Name"
              type="text"
              labelClassName="signup-form__label"
              inputClassName={`signup-form__input ${formErrors.name ? 'signup-form__input--error' : ''}`}
              errorClassName="signup-form__error-message"
              value={formState.name}
              onChange={(event: ChangeEvent<HTMLInputElement>) => updateTextField('name', event.target.value)}
              placeholder="Your full name"
              autoComplete="name"
              errorMessage={formErrors.name}
              required
            />

            <Input
              id="email"
              name="email"
              label="Email"
              type="email"
              labelClassName="signup-form__label"
              inputClassName={`signup-form__input ${formErrors.email ? 'signup-form__input--error' : ''}`}
              errorClassName="signup-form__error-message"
              value={formState.email}
              onChange={(event: ChangeEvent<HTMLInputElement>) => updateTextField('email', event.target.value)}
              placeholder="abc@example.com"
              autoComplete="new-email"
              errorMessage={formErrors.email}
              required
            />

            <Input
              id="password"
              name="password"
              label="Password"
              type={isPasswordVisible ? 'text' : 'password'}
              labelClassName="signup-form__label"
              inputClassName={`signup-form__input signup-form__input--with-toggle ${
                formErrors.password ? 'signup-form__input--error' : ''
              }`}
              errorClassName="signup-form__error-message"
              value={formState.password}
              onChange={(event: ChangeEvent<HTMLInputElement>) => updateTextField('password', event.target.value)}
              placeholder="At least 8 characters"
              autoComplete="new-password"
              errorMessage={formErrors.password}
              required
              trailingContent={
                <button
                type="button"
                className="signup-form__password-toggle"
                aria-label={isPasswordVisible ? 'Hide password' : 'Show password'}
                aria-pressed={isPasswordVisible}
                onClick={() => setIsPasswordVisible((previousVisibility) => !previousVisibility)}
                >
                  <svg className="signup-form__password-toggle-icon" viewBox="0 0 24 24" aria-hidden="true">
                    <path d="M12 5c-5.3 0-9.6 3.6-11 7 1.4 3.4 5.7 7 11 7s9.6-3.6 11-7c-1.4-3.4-5.7-7-11-7Zm0 11.2A4.2 4.2 0 1 1 12 7.8a4.2 4.2 0 0 1 0 8.4Z" />
                    <circle cx="12" cy="12" r="2.2" />
                  </svg>
                </button>
              }
            />

            <Input
              id="confirm-password"
              name="confirm-password"
              label="Confirm Password"
              type={isConfirmPasswordVisible ? 'text' : 'password'}
              labelClassName="signup-form__label"
              inputClassName={`signup-form__input signup-form__input--with-toggle ${
                formErrors.confirmPassword ? 'signup-form__input--error' : ''
              }`}
              errorClassName="signup-form__error-message"
              value={formState.confirmPassword}
              onChange={(event: ChangeEvent<HTMLInputElement>) => updateTextField('confirmPassword', event.target.value)}
              placeholder="Repeat your password"
              autoComplete="new-password"
              errorMessage={formErrors.confirmPassword}
              required
              trailingContent={
                <button
                type="button"
                className="signup-form__password-toggle"
                aria-label={isConfirmPasswordVisible ? 'Hide confirm password' : 'Show confirm password'}
                aria-pressed={isConfirmPasswordVisible}
                  onClick={() => setIsConfirmPasswordVisible((previousVisibility) => !previousVisibility)}
                  >
                  <svg className="signup-form__password-toggle-icon" viewBox="0 0 24 24" aria-hidden="true">
                    <path d="M12 5c-5.3 0-9.6 3.6-11 7 1.4 3.4 5.7 7 11 7s9.6-3.6 11-7c-1.4-3.4-5.7-7-11-7Zm0 11.2A4.2 4.2 0 1 1 12 7.8a4.2 4.2 0 0 1 0 8.4Z" />
                    <circle cx="12" cy="12" r="2.2" />
                  </svg>
                </button>
              }
            />

            <div className="signup-form__row">
              <label className="signup-form__checkbox">
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

            <button type="submit" className="signup-form__submit" disabled={isSubmitting || !isFormComplete}>
              {isSubmitting ? 'Creating account...' : 'Sign Up'}
            </button>
          </form>

          <p className="signup-form__switch">
            Already have an account? <Link to="/login">Login here</Link>
          </p>  
        </article>

        <img src={corporatifyLogo} alt="Corporatify Logo" className="signup-panel__brand-logo" />
      </section>
    </main>
  );
}

export default SignupPage;
