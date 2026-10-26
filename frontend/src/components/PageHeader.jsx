export function PageHeader({ eyebrow, title, description, actions, children, className = '' }) {
  return (
    <div className={`page-header ${className}`.trim()}>
      <div className="page-heading">
        {eyebrow && <span className="page-eyebrow">{eyebrow}</span>}
        <h1>{title}</h1>
        {description && <p>{description}</p>}
      </div>
      {(actions || children) && (
        <div className="page-header-actions">
          {actions}
          {children}
        </div>
      )}
    </div>
  );
}
