import React from 'react';
import { toast } from 'react-toastify';
import { Check, XCircle } from 'lucide-react';

export const notify = {
    success: (message) => {
        toast.success(message, {
            className: 'pembe-toast',
            progressClassName: 'pembe-progress',
            icon: () => <Check size={20} color="#e91e63" />
        });
    },
    error: (message) => {
        toast.error(message, {
            className: 'hata-toast',
            icon: () => <XCircle size={20} color="#ef4444" />
        });
    }
};
