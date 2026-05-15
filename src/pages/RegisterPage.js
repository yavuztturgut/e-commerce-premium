import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import '../css/Auth.css';

import { notify } from '../components/Notify';
import FormField from '../components/ui/FormField';

const RegisterPage = () => {
    const [fullName, setFullName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [fieldErrors, setFieldErrors] = useState({});
    const { register } = useAuth();
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        const nextErrors = {};
        if (!fullName.trim()) nextErrors.fullName = 'Ad soyad alanı zorunlu.';
        if (!email.trim()) nextErrors.email = 'E-posta alanı zorunlu.';
        else if (!/^\S+@\S+\.\S+$/.test(email)) nextErrors.email = 'Geçerli bir e-posta adresi girin.';
        if (password.length < 6) nextErrors.password = 'Şifre en az 6 karakter olmalı.';

        setFieldErrors(nextErrors);
        if (Object.keys(nextErrors).length > 0) return;

        const res = await register(fullName, email, password);
        if (res.success) {
            notify.success('Kayıt başarılı! Giriş yapabilirsiniz.');
            navigate('/login');
        } else {
            setError(res.message);
        }
    };

    return (
        <div className="auth-container">
            <h2>Kayıt Ol</h2>
            {error && <div className="error-message">{error}</div>}
            <form className="auth-form" onSubmit={handleSubmit}>
                <FormField label="Ad Soyad" error={fieldErrors.fullName}>
                    <input
                        type="text"
                        value={fullName}
                        onChange={(e) => {
                            setFullName(e.target.value);
                            setFieldErrors((current) => ({ ...current, fullName: '' }));
                        }}
                        required
                        placeholder="Adınız Soyadınız"
                    />
                </FormField>
                <FormField label="E-posta" error={fieldErrors.email}>
                    <input
                        type="email"
                        value={email}
                        onChange={(e) => {
                            setEmail(e.target.value);
                            setFieldErrors((current) => ({ ...current, email: '' }));
                        }}
                        required
                        placeholder="orn@email.com"
                    />
                </FormField>
                <FormField label="Şifre" error={fieldErrors.password}>
                    <input
                        type="password"
                        value={password}
                        onChange={(e) => {
                            setPassword(e.target.value);
                            setFieldErrors((current) => ({ ...current, password: '' }));
                        }}
                        required
                        placeholder="••••••••"
                    />
                </FormField>
                <button type="submit" className="auth-button">Kayıt Ol</button>
            </form>
            <p className="auth-switch">
                Zaten hesabın var mı? <span onClick={() => navigate('/login')}>Giriş Yap</span>
            </p>
        </div>
    );
};

export default RegisterPage;
