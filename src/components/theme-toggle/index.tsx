import { useEffect, useState } from 'react';
import './theme-toggle.scss';

type ThemeMode = 'light' | 'dark' | 'red';

/**
 * Stores user-selected theme so preference persists across page refreshes.
 */
const THEME_STORAGE_KEY = 'corporatify_theme_mode';

/**
 * Reads saved theme preference and falls back to system preference when unavailable.
 * @returns Initial theme mode used for app rendering.
 */
const getInitialThemeMode = (): ThemeMode => {
  const savedTheme = window.localStorage.getItem(THEME_STORAGE_KEY);
  if (savedTheme === 'light' || savedTheme === 'dark' || savedTheme === 'red') {
    return savedTheme;
  }

  // Defaults to dark so the dashboard opens in the requested black theme until user changes it.
  return 'dark';
};

/**
 * Provides a reusable light/dark toggle control for the dashboard navbar.
 * @returns Theme switch button that updates global app theme.
 */
function ThemeToggle() {
  // Tracks active theme mode for button label and icon state.
  const [themeMode, setThemeMode] = useState<ThemeMode>(() => getInitialThemeMode());

  useEffect(() => {
    // Applies theme globally via root data attribute so all pages can consume the same mode.
    document.documentElement.setAttribute('data-theme', themeMode);
    window.localStorage.setItem(THEME_STORAGE_KEY, themeMode);
  }, [themeMode]);

  /**
   * Toggles between light and dark themes from navbar control.
   */
  const handleToggleTheme = () => {
    // Cycles all supported themes in a predictable order to keep one-button interaction simple.
    setThemeMode((previousMode) => {
      if (previousMode === 'light') {
        return 'dark';
      }
      if (previousMode === 'dark') {
        return 'red';
      }
      return 'light';
    });
  };

  /**
   * Resolves the next theme label for accessibility copy shown in aria/title attributes.
   * @returns Human-readable target theme name the next click will activate.
   */
  const getNextThemeLabel = (): string => {
    if (themeMode === 'light') {
      return 'Dark';
    }
    if (themeMode === 'dark') {
      return 'Red';
    }
    return 'Light';
  };

  /**
   * Returns a compact visual cue for the currently active theme mode.
   * @returns Theme icon shown inside the toggle button.
   */
  const getThemeIcon = (): string => {
    if (themeMode === 'light') {
      return '☀️';
    }
    if (themeMode === 'dark') {
      return '🌙';
    }
    return '🟥';
  };

  return (
    <button
      type="button"
      className="theme-toggle"
      onClick={handleToggleTheme}
      aria-label={`Switch to ${getNextThemeLabel()} mode`}
      title={`Switch to ${getNextThemeLabel()} mode`}
    >
      {/* First chip shows active mode so users always know which palette is currently applied. */}
      <span aria-hidden="true">{getThemeIcon()}</span>
      <span>{themeMode.charAt(0).toUpperCase() + themeMode.slice(1)}</span>
    </button>
  );
}

export default ThemeToggle;
