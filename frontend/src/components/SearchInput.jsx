export function SearchInput({ value, onChange, placeholder = 'Search', label = 'Search' }) {
  return (
    <label className="search-control">
      <span className="search-icon" aria-hidden="true">
        ⌕
      </span>
      <span className="visually-hidden">{label}</span>
      <input
        type="search"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
      />
    </label>
  );
}
