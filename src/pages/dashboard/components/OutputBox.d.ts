import type { FC } from 'react';

export type OutputBoxProps = {
  outputValue: string;
  onCopy: () => void | Promise<void>;
  onClearOutput: () => void;
  onMoveToEditor: () => void;
  isCopied: boolean;
};

/** Declaration for `OutputBox.jsx` so TS consumers (e.g. `index.tsx`) type-check cleanly. */
declare const OutputBox: FC<OutputBoxProps>;
export default OutputBox;
