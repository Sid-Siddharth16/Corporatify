import type { FC } from 'react';

/** Tone options aligned with `ToneSelector` and dashboard helper. */
export type DashboardToneOption = 'Polite' | 'Very Polite' | 'Passive Aggressive';

export type InputBoxProps = {
  inputValue: string;
  onInputChange: (value: string) => void;
  tone: DashboardToneOption;
  onToneChange: (tone: DashboardToneOption) => void;
  onConvert: () => void | Promise<void>;
  isLoading: boolean;
};

/** Declaration for `InputBox.jsx` so TS consumers (e.g. `index.tsx`) type-check cleanly. */
declare const InputBox: FC<InputBoxProps>;
export default InputBox;
