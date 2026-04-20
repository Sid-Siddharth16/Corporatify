/**
 * Renders the output panel with read-only text and clipboard action.
 * @param {Object} props Component props.
 * @param {string} props.outputValue Converted professional text.
 * @param {() => void} props.onCopy Copy button click callback.
 * @param {boolean} props.isCopied Clipboard success flag for button label feedback.
 * @returns {JSX.Element} Output section card.
 */
function OutputBox({ outputValue, onCopy, isCopied }) {
  return (
    <article className="dashboard-panel" aria-label="Output section">
      <h2 className="dashboard-panel__title">Output</h2>
      {/* Read-only output prevents accidental edits and keeps conversion result canonical. */}
      <textarea
        className="dashboard-textarea dashboard-textarea--readonly"
        value={outputValue}
        placeholder="Your polished corporate version will appear here..."
        readOnly
      />
      <button
        type="button"
        className="dashboard-button dashboard-button--secondary"
        onClick={onCopy}
        disabled={!outputValue.trim()}
      >
        {isCopied ? 'Copied!' : 'Copy'}
      </button>
    </article>
  );
}

export default OutputBox;
