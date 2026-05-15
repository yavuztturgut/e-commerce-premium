import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { notify } from '../components/Notify';
import FormField from '../components/ui/FormField';
import '../css/Auth.css';

const LoginPage = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [show2FA, setShow2FA] = useState(false);
    const [twoFactorCode, setTwoFactorCode] = useState('');
    const [rememberDevice, setRememberDevice] = useState(false);
    const [error, setError] = useState('');
    const [fieldErrors, setFieldErrors] = useState({});
    const [loading, setLoading] = useState(false);
    
    const { login, verify2FA } = useAuth();
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        const nextErrors = {};

        if (!show2FA) {
            if (!email.trim()) nextErrors.email = 'E-posta adresinizi girin.';
            else if (!/^\S+@\S+\.\S+$/.test(email)) nextErrors.email = 'Geçerli bir e-posta adresi girin.';
            if (!password) nextErrors.password = 'Şifrenizi girin.';
        } else if (twoFactorCode.length !== 6) {
            nextErrors.twoFactorCode = '6 haneli doğrulama kodunu girin.';
        }

        setFieldErrors(nextErrors);
        if (Object.keys(nextErrors).length > 0) return;

        setLoading(true);

        if (!show2FA) {
            // First step: Login with email/password
            const res = await login(email, password);
            if (res.success) {
                if (res.twoFactorRequired) {
                    setShow2FA(true);
                    notify.info('Doğrulama kodu e-postanıza gönderildi.');
                } else {
                    notify.success(`Hoş geldin!`);
                    navigate('/');
                }
            } else {
                setError(res.message);
            }
        } else {
            // Second step: Verify 2FA code
            const res = await verify2FA(email, twoFactorCode, rememberDevice);
            if (res.success) {
                notify.success(`Doğrulama başarılı. Hoş geldin!`);
                navigate('/');
            } else {
                setError(res.message);
            }
        }
        setLoading(false);
    };

    return (
        <div className="auth-container">
            <h2>{show2FA ? 'E-posta Doğrulama' : 'Giriş Yap'}</h2>
            <p className="auth-subtitle">
                {show2FA 
                    ? `${email} adresine gönderilen 6 haneli kodu girin.` 
                    : 'Hesabınıza erişmek için bilgilerinizi girin.'
                }
            </p>
            
            {error && <div className="error-message">{error}</div>}
            
            <form className="auth-form" onSubmit={handleSubmit}>
                {!show2FA ? (
                    <>
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
                    </>
                ) : (
                    <>
                    <FormField label="Doğrulama Kodu" error={fieldErrors.twoFactorCode}>
                        <input
                            type="text"
                            value={twoFactorCode}
                            onChange={(e) => {
                                setTwoFactorCode(e.target.value.replace(/\D/g, '').slice(0, 6));
                                setFieldErrors((current) => ({ ...current, twoFactorCode: '' }));
                            }}
                            required
                            placeholder="000000"
                            className="two-factor-input"
                            autoFocus
                        />
                    </FormField>
                    <label className="trusted-device-control">
                        <input
                            type="checkbox"
                            checked={rememberDevice}
                            onChange={(e) => setRememberDevice(e.target.checked)}
                        />
                        <span>Bu cihazı 30 gün hatırla</span>
                    </label>
                    </>
                )}
                
                <button type="submit" className="auth-button" disabled={loading}>
                    {loading ? 'İşleniyor...' : (show2FA ? 'Doğrula ve Giriş Yap' : 'Giriş Yap')}
                </button>
            </form>

            <p className="auth-switch">
                {show2FA ? (
                    <span onClick={() => setShow2FA(false)}>← Giriş ekranına dön</span>
                ) : (
                    <>Hesabın yok mu? <span onClick={() => navigate('/register')}>Kayıt Ol</span></>
                )}
            </p>
        </div>
    );
};

export default LoginPage;
