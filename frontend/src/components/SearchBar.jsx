export default function SearchBar({ value, onChange, isLoading = false, maxLength = 100 }) {
  return (
    <div className="searchbar" role="search">
      <svg className="searchbar__icon" viewBox="0 0 24 24" width="20" height="20" aria-hidden="true">
        <path
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          d="M11 19a8 8 0 1 1 5.3-14 8 8 0 0 1-5.3 14zm10 2-4.3-4.3"
        />
      </svg>
      <input
        className="searchbar__input"
        type="text"
        inputMode="search"
        autoComplete="off"
        spellCheck="false"
        placeholder="Search by name or department…"
        aria-label="Search employees by name or department"
        maxLength={maxLength}
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
      {isLoading && <span className="spinner" aria-hidden="true" />}
      {value && (
        <button type="button" className="searchbar__clear" aria-label="Clear search" onClick={() => onChange('')}>
          ×
        </button>
      )}
    </div>
  );
}
