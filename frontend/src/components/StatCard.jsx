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
  clock: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3.5 2" />
    </>
  ),
  flag: <path d="M5 21V4m0 1h13l-2.5 4L18 13H5" />,
  capability: <path d="m12 3 9 9-9 9-9-9 9-9Z" />,
  sparkle: (
    <>
      <path d="m12 3 1.9 5.8L20 11l-6.1 2.2L12 19l-2-5.8L4 11l6-2.2L12 3Z" />
      <path d="m19 14 .9 2.1L22 17l-2.1.9L19 20l-.9-2.1L16 17l2.1-.9L19 14Z" />
    </>
  ),
  'arrow-up-right': (
    <>
      <path d="M7 17 17 7M8 7h9v9" />
      <path d="M5 5v14h14" opacity=".45" />
    </>
  ),
  layers: (
    <>
      <path d="m12 3 9 5-9 5-9-5 9-5Z" />
      <path d="m3 12 9 5 9-5M3 16l9 5 9-5" />
    </>
  ),
  clipboard: (
    <>
      <rect x="5" y="5" width="14" height="16" rx="2" />
      <path d="M9 5.5V4a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v1.5M9 11h6m-6 4h6" />
    </>
  ),
};

export function StatCard({ label, value, detail, icon = '•', tone = 'purple' }) {
  const iconName = {
    '◷': 'clock',
    '⚑': 'flag',
    '!': 'alert',
    '✓': 'check',
    '✦': 'sparkle',
    '↗': 'arrow-up-right',
    '◇': 'capability',
    '▣': 'layers',
    '📋': 'clipboard',
  }[icon] ?? icon;

  return (
    <article className="stat-card">
      <span className={`stat-icon ${tone}`} aria-hidden="true">
        {CARD_ICONS[iconName] ? (
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.9"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            {CARD_ICONS[iconName]}
          </svg>
        ) : (
          iconName
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
