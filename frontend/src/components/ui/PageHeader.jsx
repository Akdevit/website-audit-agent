export default function PageHeader({ eyebrow, title, description, action }) {
  return (
    <div className="page-heading">
      <div>
        {eyebrow && (
          <p className="mb-2 text-xs font-medium uppercase tracking-[0.12em] text-muted">
            {eyebrow}
          </p>
        )}
        <h1 className="page-title">
          {title}
        </h1>
        <p className="page-description">
          {description}
        </p>
      </div>
      {action}
    </div>
  );
}
