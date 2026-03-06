import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import '../css/Auth.css';

import { notify } from '../components/Notify';

const RegisterPage = () => {
    const [fullName, setFullName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const { register } = useAuth();
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
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
                <div className="form-group">
                    <label>Ad Soyad</label>
                    <input
                        type="text"
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        required
                        placeholder="Adınız Soyadınız"
                    />
                </div>
                <div className="form-group">
                    <label>E-posta</label>
                    <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        placeholder="orn@email.com"
                    />
                </div>
                <div className="form-group">
                    <label>Şifre</label>
                    <input
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        placeholder="••••••••"
                    />
                </div>
                <button type="submit" className="auth-button">Kayıt Ol</button>
            </form>
            <p className="auth-switch">
                Zaten hesabın var mı? <span onClick={() => navigate('/login')}>Giriş Yap</span>
            </p>
        </div>
    );
};

export default RegisterPage;
