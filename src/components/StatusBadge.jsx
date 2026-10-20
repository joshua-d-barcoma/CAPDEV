export function StatusBadge({ status }) {
  const tone = String(status)
    .toLowerCase()
    .replace(/[^a-z]+/g, '-')
    .replace(/^-|-$/g, '');
  return <span className={`status-badge status-${tone}`}>{status}</span>;
}
