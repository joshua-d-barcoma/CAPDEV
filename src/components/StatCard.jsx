const CARD_ICONS = {
  people: (
    <>
      <circle cx="9" cy="8" r="3" />
      <path d="M3.5 19v-1.5a5.5 5.5 0 0 1 11 0V19" />
      <path d="M16 5.4a3 3 0 0 1 0 5.8M18 14a5 5 0 0 1 2.5 4.3V19" />
    </>
  ),
  check: <path d="m5 12 4.5 4.5L19 7" />,
  alert: (
    <>
      <path d="M12 3 2.8 20h18.4L12 3Z" />
      <path d="M12 9v4m0 3h.01" />
    </>
  ),
  flag: <path d="M5 21V4m0 1h13l-2.5 4L18 13H5" />,
  capability: <path d="m12 3 9 9-9 9-9-9 9-9Z" />,
};

export function StatCard({ label, value, detail, icon = '•', tone = 'purple' }) {
  return (
    <article className="stat-card">
      <span className={`stat-icon ${tone}`} aria-hidden="true">
        {CARD_ICONS[icon] ? (
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            {CARD_ICONS[icon]}
          </svg>
        ) : (
          icon
        )}
      </span>
      <div className="stat-content">
        <span className="stat-label">{label}</span>
        <strong>{value}</strong>
        {detail && <span className="stat-detail">{detail}</span>}
      </div>
    </article>
  );
}
