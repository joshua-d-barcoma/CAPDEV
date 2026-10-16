export function StatCard({ label, value, detail, icon = '•', tone = 'purple' }) {
  return (
    <article className="stat-card">
      <span className={`stat-icon ${tone}`} aria-hidden="true">
        {icon}
      </span>
      <div className="stat-content">
        <span className="stat-label">{label}</span>
        <strong>{value}</strong>
        {detail && <span className="stat-detail">{detail}</span>}
      </div>
    </article>
  );
}
