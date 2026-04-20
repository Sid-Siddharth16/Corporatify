/**
 * Renders the output panel with read-only text and clipboard action.
 * @param {Object} props Component props.
 * @param {string} props.outputValue Converted professional text.
 * @param {() => void} props.onCopy Copy button click callback.
 * @param {() => void} props.onClearOutput Clears output pane content.
 * @param {() => void} props.onMoveToEditor Moves output text back to input editor.
 * @param {boolean} props.isCopied Clipboard success flag for button label feedback.
 * @returns {JSX.Element} Output section card.
 */
function OutputBox({ outputValue, onCopy, onClearOutput, onMoveToEditor, isCopied }) {
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
      {/* Action group keeps copy/clear/move tools together where users finish the conversion flow. */}
      <div className="dashboard-panel__actions">
        <button
          type="button"
          className="dashboard-button dashboard-button--secondary"
          onClick={onCopy}
          disabled={!outputValue.trim()}
        >
          {isCopied ? 'Copied!' : 'Copy'}
        </button>
        <button
          type="button"
          className="dashboard-button dashboard-button--secondary"
          onClick={onClearOutput}
          disabled={!outputValue.trim()}
        >
          Clear
        </button>
        <button
          type="button"
          className="dashboard-button dashboard-button--secondary"
          onClick={onMoveToEditor}
          disabled={!outputValue.trim()}
        >
          Move to Editor
        </button>
      </div>
    </article>
  );
}

export default OutputBox;
