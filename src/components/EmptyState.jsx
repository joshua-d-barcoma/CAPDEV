export function EmptyState({
  title = 'Nothing to show yet',
  description = 'Try changing your filters or check back later.',
}) {
  return (
    <div className="empty-state">
      <strong>{title}</strong>
      <span>{description}</span>
    </div>
  );
}
