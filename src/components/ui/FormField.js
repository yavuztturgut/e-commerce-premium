const FormField = ({
    label,
    error,
    children,
    className = '',
    labelClassName = '',
    required = false
}) => (
    <div className={`form-group ui-form-field ${error ? 'has-error' : ''} ${className}`.trim()}>
        {label && (
            <label className={labelClassName}>
                {label}
                {required && <span className="ui-required-mark"> *</span>}
            </label>
        )}
        {children}
        {error && <span className="ui-field-error">{error}</span>}
    </div>
);

export default FormField;
