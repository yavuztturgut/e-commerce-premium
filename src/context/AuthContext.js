import React, { createContext, useState, useEffect, useContext } from 'react';
import axios from 'axios';


const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [token, setToken] = useState(localStorage.getItem('token'));
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (token && token !== 'undefined') {
            // In a real app, you might want to verify the token with the backend here
            const storedUser = localStorage.getItem('user');
            if (storedUser && storedUser !== 'undefined') {
                try {
                    setUser(JSON.parse(storedUser));
                } catch (err) {
                    console.error('Bozuk kullanıcı verisi:', err);
                    localStorage.removeItem('user');
                }
            }
        } else {
            setLoading(false);
        }
        setLoading(false);
    }, [token]);

    const login = async (email, password) => {
        try {
            const res = await axios.post('http://localhost:5000/api/auth/login', { email, password });
            
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

    const verify2FA = async (email, code) => {
        try {
            const res = await axios.post('http://localhost:5000/api/auth/verify-2fa', { email, code });
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
            await axios.post('http://localhost:5000/api/auth/register', { fullName, email, password });
            return { success: true };

        } catch (err) {
            return { success: false, message: err.response?.data?.message || 'Kayıt başarısız.' };
        }
    };

    const logout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        setToken(null);
        setUser(null);
    };

    const updateProfile = async (updatedUserData) => {
        try {
            const res = await axios.put('http://localhost:5000/api/auth/profile', updatedUserData, {
                headers: { Authorization: `Bearer ${token}` }
            });
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
