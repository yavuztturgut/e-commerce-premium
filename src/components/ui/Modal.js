import { useEffect } from 'react';

const Modal = ({
    isOpen,
    onClose,
    children,
    className = 'modal-overlay',
    panelClassName = 'modal-content',
    closeOnOverlay = true,
    ariaLabel = 'Modal'
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
                if (closeOnOverlay && event.target === event.currentTarget) onClose?.();
            }}
        >
            <div
                className={panelClassName}
                role="dialog"
                aria-modal="true"
                aria-label={ariaLabel}
                onMouseDown={(event) => event.stopPropagation()}
            >
                {children}
            </div>
        </div>
    );
};

export default Modal;
