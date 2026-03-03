import { toast } from 'react-toastify';

export const notify = {
    success: (message) => {
        toast.success(message, {
            className: 'pembe-toast',
            progressClassName: 'pembe-progress',
            icon: () => <span style={{ fontSize: '20px' }}>🌸</span>
        });
    },
    error: (message) => {
        toast.error(message, {
            className: 'hata-toast',
        });
    }
};
