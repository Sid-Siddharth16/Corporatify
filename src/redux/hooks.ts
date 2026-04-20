import { useDispatch, useSelector, type TypedUseSelectorHook } from 'react-redux';
import type { AppDispatch, RootState } from './store';

/**
 * Typed dispatch hook avoids repeating AppDispatch imports in UI components.
 */
export const useAppDispatch = () => useDispatch<AppDispatch>();
/**
 * Typed selector hook provides safe autocomplete for Redux root state.
 */
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;
