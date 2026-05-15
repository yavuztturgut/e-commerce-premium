import React, { createContext, useState, useEffect, useContext } from 'react';
import apiClient, { withAuth } from '../api/apiClient';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [token, setToken] = useState(localStorage.getItem('token'));
    const [loading, setLoading] = useState(true);

    const clearAuthState = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        setToken(null);
        setUser(null);
    };

    useEffect(() => {
        const interceptor = apiClient.interceptors.response.use(
            (response) => response,
            (error) => {
                if (error.response && error.response.status === 401) {
                    const errorMsg = error.response.data?.message;
                    if (errorMsg === 'Token is not valid' || errorMsg === 'No token, authorization denied') {
                        clearAuthState();
                        window.location.href = '/login';
                    }
                }
                return Promise.reject(error);
            }
        );

        return () => {
            apiClient.interceptors.response.eject(interceptor);
        };
    }, []);

    useEffect(() => {
        const verifyCurrentUser = async () => {
            if (!token || token === 'undefined') {
                clearAuthState();
                setLoading(false);
                return;
            }

            try {
                setLoading(true);
                const res = await apiClient.get('/api/auth/me', withAuth(token));

                const verifiedUser = res.data.user;
                localStorage.setItem('user', JSON.stringify(verifiedUser));
                setUser(verifiedUser);
            } catch (err) {
                clearAuthState();
            } finally {
                setLoading(false);
            }
        };

        verifyCurrentUser();
    }, [token]);

    const login = async (email, password) => {
        try {
            const res = await apiClient.post('/api/auth/login', { email, password });

            if (res.data.twoFactorRequired) {
                return { success: true, twoFactorRequired: true, email: res.data.email };
            }

            const { token, user } = res.data;
            localStorage.setItem('token', token);
            localStorage.setItem('user', JSON.stringify(user));
            setToken(token);
            setUser(user);
            return { success: true };
        } catch (err) {
            const msg = err.response?.data?.message || err.response?.data?.error || 'Giriş başarısız.';
            return { success: false, message: msg };
        }
    };

    const verify2FA = async (email, code, rememberDevice = false) => {
        try {
            const res = await apiClient.post('/api/auth/verify-2fa', { email, code, rememberDevice });
            const { token, user } = res.data;

            localStorage.setItem('token', token);
            localStorage.setItem('user', JSON.stringify(user));
            setToken(token);
            setUser(user);
            return { success: true };
        } catch (err) {
            const msg = err.response?.data?.message || err.response?.data?.error || 'Doğrulama başarısız.';
            return { success: false, message: msg };
        }
    };

    const register = async (fullName, email, password) => {
        try {
            await apiClient.post('/api/auth/register', { fullName, email, password });
            return { success: true };
        } catch (err) {
            return { success: false, message: err.response?.data?.message || 'Kayıt başarısız.' };
        }
    };

    const logout = () => {
        clearAuthState();
    };

    const updateProfile = async (updatedUserData) => {
        try {
            const res = await apiClient.put('/api/auth/profile', updatedUserData, withAuth(token));
            const { user: updatedUser } = res.data;

            localStorage.setItem('user', JSON.stringify(updatedUser));
            setUser(updatedUser);
            return { success: true, message: res.data.message };
        } catch (err) {
            return { success: false, message: err.response?.data?.message || 'Güncelleme başarısız.' };
        }
    };

    return (
        <AuthContext.Provider value={{ user, token, loading, login, verify2FA, register, logout, updateProfile }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);
