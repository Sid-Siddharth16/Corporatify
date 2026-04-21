import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { GoogleOAuthProvider } from '@react-oauth/google';
import { Provider } from 'react-redux';
import { BrowserRouter } from 'react-router-dom';
import './index.css';
import App from './App.tsx';
import { store } from './redux/store';




createRoot(document.getElementById('root')!).render(
  <StrictMode>
    {/* Provider exposes global auth state so route guards and pages stay synchronized. */}
    <Provider store={store}>
      {/* GoogleOAuthProvider is initialized once at app root to avoid duplicate GIS initialization warnings. */}
      <GoogleOAuthProvider clientId={import.meta.env.VITE_GOOGLE_CLIENT_ID}>
        {/* BrowserRouter enables declarative auth-aware route protection. */}
        <BrowserRouter>
          <App />
        </BrowserRouter>
      </GoogleOAuthProvider>
    </Provider>
  </StrictMode>,
);
