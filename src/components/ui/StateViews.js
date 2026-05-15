const EmptyState = ({ icon, title, description, action }) => (
    <div className="ui-state-view">
        {icon && <div className="ui-state-icon">{icon}</div>}
        <h3>{title}</h3>
        {description && <p>{description}</p>}
        {action}
    </div>
);

const ErrorState = ({ title = 'Bir şey ters gitti', description, action }) => (
    <div className="ui-state-view ui-error-state">
        <h3>{title}</h3>
        {description && <p>{description}</p>}
        {action}
    </div>
);

const Skeleton = ({ lines = 3, className = '' }) => (
    <div className={`ui-skeleton ${className}`.trim()} aria-hidden="true">
        {Array.from({ length: lines }).map((_, index) => (
            <span key={index} style={{ width: `${Math.max(42, 100 - index * 14)}%` }} />
        ))}
    </div>
);

export { EmptyState, ErrorState, Skeleton };
