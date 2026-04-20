/**
 * Renders a controlled tone dropdown so users can choose rewrite style.
 * @param {Object} props Component props.
 * @param {'Polite'|'Very Polite'|'Passive Aggressive'} props.value Currently selected tone.
 * @param {(tone: 'Polite'|'Very Polite'|'Passive Aggressive') => void} props.onChange Tone change callback.
 * @returns {JSX.Element} Tone selector UI.
 */
function ToneSelector({ value, onChange }) {
  return (
    <div className="dashboard-field">
      <label className="dashboard-label" htmlFor="tone-selector">
        Tone
      </label>
      {/* Restricts tone choices to the three options required by product specs. */}
      <select
        id="tone-selector"
        className="dashboard-select"
        value={value}
        onChange={(event) => onChange(event.target.value)}
      >
        <option value="Polite">Polite</option>
        <option value="Very Polite">Very Polite</option>
        <option value="Passive Aggressive">Passive Aggressive</option>
      </select>
    </div>
  );
}

export default ToneSelector;
