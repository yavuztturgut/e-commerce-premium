import { useEffect } from 'react';

const Drawer = ({
    isOpen,
    onClose,
    children,
    className = 'drawer-overlay',
    panelClassName = 'product-drawer',
    ariaLabel = 'Drawer'
}) => {
    useEffect(() => {
        if (!isOpen) return undefined;

        const previousOverflow = document.body.style.overflow;
        document.body.style.overflow = 'hidden';

        const handleKeyDown = (event) => {
            if (event.key === 'Escape') onClose?.();
        };

        document.addEventListener('keydown', handleKeyDown);

        return () => {
            document.body.style.overflow = previousOverflow;
            document.removeEventListener('keydown', handleKeyDown);
        };
    }, [isOpen, onClose]);

    if (!isOpen) return null;

    return (
        <div
            className={className}
            role="presentation"
            onMouseDown={(event) => {
                if (event.target === event.currentTarget) onClose?.();
            }}
        >
            <aside
                className={panelClassName}
                role="dialog"
                aria-modal="true"
                aria-label={ariaLabel}
                onMouseDown={(event) => event.stopPropagation()}
            >
                {children}
            </aside>
        </div>
    );
};

export default Drawer;
