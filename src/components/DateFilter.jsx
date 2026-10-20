import { useEffect, useMemo, useRef, useState } from 'react';
import {
  formatDateKey,
  getCalendarDates,
  getDatePresetRange,
  getDateRangeLabel,
  shiftCalendarMonth,
  toDateKey,
} from '../utils/dateFilters.js';

const PRESETS = ['Today', 'Yesterday', 'Last week', 'Last month', 'Last quarter'];
const WEEKDAYS = ['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su'];

function CalendarIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <rect x="3" y="5" width="18" height="16" rx="2" />
      <path d="M7 3v4m10-4v4M3 10h18" />
    </svg>
  );
}

export function DateFilter({ label, value, onChange, alignRight = false }) {
  const [open, setOpen] = useState(false);
  const [draftRange, setDraftRange] = useState(value);
  const [visibleMonth, setVisibleMonth] = useState(() => {
    const initialDate = value?.start ? new Date(`${value.start}T00:00:00`) : new Date();
    return new Date(initialDate.getFullYear(), initialDate.getMonth(), 1);
  });
  const containerRef = useRef(null);
  const calendarDates = useMemo(() => getCalendarDates(visibleMonth), [visibleMonth]);
  const monthLabel = new Intl.DateTimeFormat('en', { month: 'long', year: 'numeric' }).format(
    visibleMonth,
  );
  const selectedLabel = getDateRangeLabel(value);

  useEffect(() => {
    if (!open) return undefined;

    function closeOnOutsideClick(event) {
      if (!containerRef.current?.contains(event.target)) setOpen(false);
    }
    function closeOnEscape(event) {
      if (event.key === 'Escape') setOpen(false);
    }

    document.addEventListener('pointerdown', closeOnOutsideClick);
    document.addEventListener('keydown', closeOnEscape);
    return () => {
      document.removeEventListener('pointerdown', closeOnOutsideClick);
      document.removeEventListener('keydown', closeOnEscape);
    };
  }, [open]);

  function toggleOpen() {
    if (!open) {
      setDraftRange(value);
      const initialDate = value?.start ? new Date(`${value.start}T00:00:00`) : new Date();
      setVisibleMonth(new Date(initialDate.getFullYear(), initialDate.getMonth(), 1));
    }
    setOpen((current) => !current);
  }

  function chooseCalendarDate(date) {
    const dateKey = toDateKey(date);
    if (date.getMonth() !== visibleMonth.getMonth()) {
      setVisibleMonth(new Date(date.getFullYear(), date.getMonth(), 1));
    }
    if (!draftRange?.start || draftRange.end || dateKey < draftRange.start) {
      setDraftRange({ start: dateKey, end: '' });
      return;
    }
    setDraftRange({ start: draftRange.start, end: dateKey });
  }

  function choosePreset(preset) {
    const range = getDatePresetRange(preset);
    setDraftRange(range);
    const startDate = new Date(`${range.start}T00:00:00`);
    setVisibleMonth(new Date(startDate.getFullYear(), startDate.getMonth(), 1));
  }

  function confirmSelection() {
    if (draftRange?.start) {
      onChange({ start: draftRange.start, end: draftRange.end || draftRange.start });
    }
    setOpen(false);
  }

  function resetSelection(event) {
    event.stopPropagation();
    setDraftRange(null);
    onChange(null);
    setOpen(false);
  }

  return (
    <div className={`date-filter-control${alignRight ? ' align-right' : ''}`} ref={containerRef}>
      <button
        type="button"
        className={`date-filter-button${open ? ' is-open' : ''}`}
        aria-label={`${label}${selectedLabel ? `: ${selectedLabel}` : ''}`}
        aria-expanded={open}
        aria-haspopup="dialog"
        onClick={toggleOpen}
      >
        <CalendarIcon />
        <span>{selectedLabel || label}</span>
        <span className="date-filter-chevron" aria-hidden="true">
          {open ? '⌃' : '⌄'}
        </span>
      </button>
      {open && (
        <section className="date-filter-popover" role="dialog" aria-label={`${label} date range`}>
          <nav className="date-filter-presets" aria-label="Quick date ranges">
            {PRESETS.map((preset) => (
              <button type="button" key={preset} onClick={() => choosePreset(preset)}>
                {preset}
              </button>
            ))}
            <button className="date-filter-reset" type="button" onClick={resetSelection}>
              Reset
            </button>
          </nav>
          <div className="date-filter-calendar">
            <header className="date-calendar-header">
              <strong>{monthLabel}</strong>
              <div>
                <button
                  type="button"
                  aria-label="Previous month"
                  onClick={() => setVisibleMonth((month) => shiftCalendarMonth(month, -1))}
                >
                  ‹
                </button>
                <button
                  type="button"
                  aria-label="Next month"
                  onClick={() => setVisibleMonth((month) => shiftCalendarMonth(month, 1))}
                >
                  ›
                </button>
              </div>
            </header>
            <div className="date-calendar-grid">
              {WEEKDAYS.map((weekday) => (
                <span className="date-calendar-weekday" key={weekday}>
                  {weekday}
                </span>
              ))}
              {calendarDates.map((date) => {
                const dateKey = toDateKey(date);
                const inVisibleMonth = date.getMonth() === visibleMonth.getMonth();
                const inSelectedRange =
                  draftRange?.start &&
                  draftRange?.end &&
                  dateKey >= draftRange.start &&
                  dateKey <= draftRange.end;
                const isSelected = dateKey === draftRange?.start || dateKey === draftRange?.end;

                return (
                  <button
                    className={[
                      'date-calendar-day',
                      !inVisibleMonth && 'outside-month',
                      inSelectedRange && 'in-range',
                      isSelected && 'selected',
                    ]
                      .filter(Boolean)
                      .join(' ')}
                    type="button"
                    key={dateKey}
                    aria-label={formatDateKey(dateKey, {
                      weekday: 'long',
                      month: 'long',
                      day: 'numeric',
                      year: 'numeric',
                    })}
                    aria-pressed={isSelected}
                    onClick={() => chooseCalendarDate(date)}
                  >
                    {date.getDate()}
                  </button>
                );
              })}
            </div>
            <footer className="date-calendar-footer">
              <button
                type="button"
                className="date-filter-confirm"
                disabled={!draftRange?.start}
                onClick={confirmSelection}
              >
                Confirm
              </button>
            </footer>
          </div>
        </section>
      )}
    </div>
  );
}
