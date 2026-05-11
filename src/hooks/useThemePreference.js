import { useEffect, useState } from 'react';

const getInitialTheme = () => {
    const savedTheme = localStorage.getItem('cerenAdenTheme');
    if (savedTheme) return savedTheme;

    const prefersDark = window.matchMedia?.('(prefers-color-scheme: dark)').matches;
    return prefersDark ? 'dark' : 'light';
};

export const useThemePreference = () => {
    const [theme, setTheme] = useState(getInitialTheme);

    const toggleTheme = () => {
        setTheme((currentTheme) => {
            const newTheme = currentTheme === 'light' ? 'dark' : 'light';
            localStorage.setItem('cerenAdenTheme', newTheme);
            return newTheme;
        });
    };

    useEffect(() => {
        document.body.setAttribute('data-theme', theme);
    }, [theme]);

    useEffect(() => {
        const handleThemeStorageChange = (event) => {
            if (event.key !== 'cerenAdenTheme') return;
            if (event.newValue !== 'light' && event.newValue !== 'dark') return;
            setTheme(event.newValue);
        };

        window.addEventListener('storage', handleThemeStorageChange);
        return () => window.removeEventListener('storage', handleThemeStorageChange);
    }, []);

    return { theme, toggleTheme };
};
