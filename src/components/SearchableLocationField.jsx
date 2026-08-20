import React, { useEffect, useRef, useState } from 'react';
import '../css/components/SearchableLocationField.css';

function SearchableLocationField({ label, value, options, onChange }) {
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);
  const containerRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    const close = (event) => {
      if (!containerRef.current?.contains(event.target)) setOpen(false);
    };
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, []);

  const filteredOptions = options.filter((option) => option.toLowerCase().includes(query.toLowerCase())).slice(0, 80);
  const selectOption = (option) => {
    onChange(option);
    setQuery('');
    setOpen(false);
    containerRef.current?.querySelector('.location-search-trigger')?.dispatchEvent(new CustomEvent('change', { bubbles: true, detail: option }));
  };

  return (
    <div ref={containerRef} className="location-search">
      <button type="button" className="location-search-trigger" onClick={() => { setOpen(!open); setQuery(''); }} aria-haspopup="listbox" aria-expanded={open}>
        {value || `Select ${label}`}
        <span aria-hidden="true">▾</span>
      </button>
      {open && (
        <div className="location-search-menu">
          <input
            ref={inputRef}
            type="search"
            value={query}
            placeholder={`Search ${label.toLowerCase()}...`}
            onChange={(event) => setQuery(event.target.value)}
            aria-label={`Search ${label}`}
            autoComplete="off"
            autoFocus
          />
          <div className="location-search-options" role="listbox">
            {filteredOptions.length ? filteredOptions.map((option) => (
              <button key={option} type="button" role="option" aria-selected={option === value} onPointerDown={(event) => { event.preventDefault(); selectOption(option); }}>{option}</button>
            )) : <span className="location-search-empty">No matches found</span>}
          </div>
        </div>
      )}
    </div>
  );
}

export default SearchableLocationField;
