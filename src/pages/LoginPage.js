import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { notify } from '../components/Notify';
import '../css/Auth.css';

const LoginPage = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const { login } = useAuth();
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        const res = await login(email, password);
        if (res.success) {
            notify.success(`Hoş geldin!`);
            navigate('/');
        } else {
            setError(res.message);
        }
    };

    return (
        <div className="auth-container">
            <h2>Giriş Yap</h2>
            {error && <div className="error-message">{error}</div>}
            <form className="auth-form" onSubmit={handleSubmit}>
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
                <button type="submit" className="auth-button">Giriş Yap</button>
            </form>
            <p className="auth-switch">
                Hesabın yok mu? <span onClick={() => navigate('/register')}>Kayıt Ol</span>
            </p>
        </div>
    );
};

export default LoginPage;
