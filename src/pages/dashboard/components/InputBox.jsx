import ToneSelector from './ToneSelector';

/**
 * Renders the input panel used to collect raw text and conversion options.
 * @param {Object} props Component props.
 * @param {string} props.inputValue Current user input text.
 * @param {(value: string) => void} props.onInputChange Input update callback.
 * @param {'Polite'|'Very Polite'|'Passive Aggressive'} props.tone Selected tone value.
 * @param {(tone: 'Polite'|'Very Polite'|'Passive Aggressive') => void} props.onToneChange Tone update callback.
 * @param {() => void} props.onConvert Convert button click callback.
 * @param {boolean} props.isLoading Whether conversion is currently in progress.
 * @returns {JSX.Element} Input section card.
 */
function InputBox({ inputValue, onInputChange, tone, onToneChange, onConvert, isLoading }) {
  return (
    <article className="dashboard-panel" aria-label="Input section">
      <h2 className="dashboard-panel__title">Input</h2>
      {/* Lets users provide raw/casual text that will be transformed by the model. */}
      <textarea
        className="dashboard-textarea"
        value={inputValue}
        onChange={(event) => onInputChange(event.target.value)}
        placeholder="Type your casual or frustrated message..."
      />
      <ToneSelector value={tone} onChange={onToneChange} />
      {/* Uses required loading label and prevents duplicate requests while API call is active. */}
      <button type="button" className="dashboard-button dashboard-button--primary" onClick={onConvert} disabled={isLoading}>
        {isLoading ? 'Sanitizing your thoughts...' : 'Convert'}
      </button>
    </article>
  );
}

export default InputBox;
