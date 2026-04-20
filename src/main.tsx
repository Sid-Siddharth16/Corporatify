import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { Provider } from 'react-redux';
import { BrowserRouter } from 'react-router-dom';
import './index.css';
import App from './App.tsx';
import { store } from './redux/store';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    {/* Provider exposes global auth state so route guards and pages stay synchronized. */}
    <Provider store={store}>
      {/* BrowserRouter enables declarative auth-aware route protection. */}
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </Provider>
  </StrictMode>,
);
