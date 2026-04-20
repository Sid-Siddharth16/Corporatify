import { useLoginForm } from './helper';
import Input from '../../components/input';
import './login.scss';
import { corporatifyLogo } from '../../common/images';

type LoginPageProps = {
  onGoogleLoginSuccess?: Parameters<typeof useLoginForm>[0]['onGoogleLoginSuccess'];
};

/**
 * Renders the main authentication screen for sign-in.
 * @param onGoogleLoginSuccess Optional callback fired after a verified Google sign-in.
 * @returns A styled login page with email/password inputs and social actions.
 */
function LoginPage({ onGoogleLoginSuccess }: LoginPageProps) {
  // Logic is moved to a reusable hook so this component stays focused on structure and styling.
  const {
    formState,
    formErrors,
    shouldShowPasswordField,
    isFormValid,
    googleUser,
    googleAuthError,
    googleButtonContainerRef,
    handleEmailChange,
    handlePasswordChange,
    handleRememberMeChange,
    handleSubmit,
  } = useLoginForm({ onGoogleLoginSuccess });

  return (
    <main className="login-page">
      {/* Shell creates the requested two-panel structure: authentication on left, banner image on right. */}
      <section className="login-layout" aria-label="Sign in to your account">
        {/* Left panel keeps interactive controls grouped for clear keyboard and screen-reader flow. */}
        <article className="login-panel">
          <header className="login-panel__header">
            {/* Compact brand row mirrors the screenshot's minimal logo + name treatment. */}
            <div className="login-panel__brand" aria-hidden="true">
              {/* Uses the uploaded logo asset while constraining dimensions to keep the form balanced. */}
              <img src={corporatifyLogo} alt="Corporatify Logo" className="login-panel__brand-logo" />
            </div>
          </header>

          <form className="login-form" onSubmit={handleSubmit}>
            {/* Shared Input component preserves consistency across forms and keeps logic in helper.ts. */}
            <Input
              id="email"
              name="email"
              label="Email"
              type="email"
              labelClassName="login-form__label"
              inputClassName={`login-form__input ${formErrors.email ? 'login-form__input--error' : ''}`}
              errorClassName="login-form__error-message"
              value={formState.email}
              onChange={handleEmailChange}
              placeholder="Enter your email"
              autoComplete="email"
              errorMessage={formErrors.email}
              required
            />

            {/* Password group appears only when email is valid, preserving the existing progressive UX logic. */}
            <div className={`login-password-step ${shouldShowPasswordField ? 'login-password-step--visible' : ''}`}>
              <Input
                id="password"
                name="password"
                label="Password"
                type="password"
                labelClassName="login-form__label"
                inputClassName={`login-form__input ${formErrors.password ? 'login-form__input--error' : ''}`}
                errorClassName="login-form__error-message"
                value={formState.password}
                onChange={handlePasswordChange}
                placeholder="••••••••"
                autoComplete="current-password"
                minLength={8}
                errorMessage={formErrors.password}
                required={shouldShowPasswordField}
              />

              <div className="login-form__row">
                {/* Uses helper-controlled rememberMe state directly so checkbox value is no longer inverted. */}
                <label className="login-form__checkbox">
                  <input type="checkbox" checked={formState.rememberMe} onChange={handleRememberMeChange} />
                  Remember me
                </label>
                <button type="button" className="login-form__link-button">
                  Forgot Password
                </button>
              </div>

              <button type="submit" className="login-form__submit" disabled={!isFormValid}>
                Sign In
              </button>
            </div>
          </form>

          <div className="login-divider" aria-hidden="true">
            <span>or</span>
          </div>

          {/* Container is required because Google script renders an iframe button into this node. */}
          <div className="login-social">
            <div className="login-social__google-container" ref={googleButtonContainerRef} />
          </div>

          {/* Inline status keeps auth feedback visible without disrupting the form layout. */}
          {googleAuthError ? (
            <p className="login-form__error-message" role="alert">
              {googleAuthError}
            </p>
          ) : null}
          {googleUser ? (
            <p className="login-panel__status">
              Signed in as <strong>{googleUser.name}</strong> ({googleUser.email})
            </p>
          ) : null}
        </article>

        {/* Right banner intentionally uses a dummy photo while preserving the requested visual composition. */}
        <aside className="login-banner" aria-hidden="true">
          <div className="login-banner__overlay" />
          <p className="login-banner__title">Aespa</p>
          <div className="login-banner__caption">
            <p className="login-banner__name">Karina</p>
            <p className="login-banner__text">a stylish placeholder profile for your authentication layout preview.</p>
          </div>
        </aside>
      </section>
    </main>
  );
}

export default LoginPage;

