import React, { useState, useEffect, useContext, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { ShopContext } from '../context/ShopContext';
import { notify } from './Notify';
import '../css/Checkout.css';

const Checkout = () => {
    const { cart, clearCart, products, addToCart } = useContext(ShopContext);
    const navigate = useNavigate();
    const isNotifying = useRef(false);

    const [step, setStep] = useState(1);
    const [showConfetti, setShowConfetti] = useState(false);
    const [formData, setFormData] = useState({
        fullName: '', address: '', city: '', zip: '',
        cardName: '', cardNumber: '', expDate: '', cvc: ''
    });
    const [recommendations, setRecommendations] = useState([]);

    useEffect(() => {
        if (cart.length === 0 && step !== 3) {
            navigate('/');
            if (!isNotifying.current) {
                isNotifying.current = true;
                notify.error("Sepetiniz boş olduğu için anasayfaya yönlendirildiniz.");
                setTimeout(() => isNotifying.current = false, 2000);
            }
        }
    }, [cart, navigate, step]);

    // Recommendations Logic
    useEffect(() => {
        if (products.length > 0 && recommendations.length === 0) {
            // Pick 3 random products that are not already in cart
            const cartIds = cart.map(item => item.id);
            const filtered = products.filter(p => !cartIds.includes(p.id));
            const shuffled = [...filtered].sort(() => 0.5 - Math.random());
            setRecommendations(shuffled.slice(0, 6));
        }
    }, [products, cart, recommendations.length]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        if (name === 'cardNumber') {
            const formatted = value.replace(/\D/g, '').replace(/(.{4})/g, '$1 ').trim();
            setFormData({ ...formData, [name]: formatted.substring(0, 19) });
        } else {
            setFormData({ ...formData, [name]: value });
        }
    };

    const handleNext = () => {
        if (step === 1) {
            if (!formData.fullName || !formData.address || !formData.city) {
                if (!isNotifying.current) {
                    isNotifying.current = true;
                    notify.error("Lütfen adres bilgilerini doldurun!");
                    setTimeout(() => { isNotifying.current = false; }, 2000);
                }
                return;
            }
        }
        setStep(step + 1);
    };

    const handleBack = () => setStep(step - 1);

    const handlePlaceOrder = () => {
        if (!formData.cardNumber || !formData.cvc) {
            if (!isNotifying.current) {
                isNotifying.current = true;
                notify.error("Kart bilgileri eksik!");
                setTimeout(() => { isNotifying.current = false; }, 2000);
            }
            return;
        }
        setStep(3);
        setShowConfetti(true);
        clearCart();
        window.scrollTo({ top: 0, behavior: 'smooth' });
        setTimeout(() => setShowConfetti(false), 4000);
        setTimeout(() => { navigate('/'); }, 5000);
    };

    // Confetti particles
    const confettiColors = ['#e91e63', '#9c27b0', '#7c3aed', '#f59e0b', '#10b981', '#3b82f6'];
    const confettiPieces = showConfetti ? Array.from({ length: 40 }, (_, i) => ({
        id: i,
        left: Math.random() * 100,
        delay: Math.random() * 2,
        color: confettiColors[i % confettiColors.length],
        size: Math.random() * 8 + 6,
    })) : [];

    const renderAddressStep = () => (
        <div className="checkout-form-content">
            <h3>📍 Teslimat Adresi</h3>
            <div className="form-group">
                <label>Ad Soyad</label>
                <input type="text" name="fullName" value={formData.fullName} onChange={handleChange} placeholder="Örn: Ceren Yılmaz" />
            </div>
            <div className="form-group">
                <label>Adres</label>
                <input type="text" name="address" value={formData.address} onChange={handleChange} placeholder="Mahalle, Sokak, Apt No..." />
            </div>
            <div className="row">
                <div className="col form-group">
                    <label>Şehir</label>
                    <input type="text" name="city" value={formData.city} onChange={handleChange} />
                </div>
                <div className="col form-group">
                    <label>Posta Kodu</label>
                    <input type="text" name="zip" value={formData.zip} onChange={handleChange} />
                </div>
            </div>
            <div className="action-buttons">
                <div></div>
                <button className="btn-primary" onClick={handleNext}>Devam Et →</button>
            </div>
        </div>
    );

    const renderPaymentStep = () => (
        <div className="checkout-form-content">
            <h3>💳 Kart Bilgileri</h3>

            <div className="credit-card-preview">
                <div className="card-chip"></div>
                <div className="card-number-display">
                    {formData.cardNumber || '•••• •••• •••• ••••'}
                </div>
                <div className="card-bottom">
                    <div>
                        <div className="card-label">Kart Sahibi</div>
                        <div className="card-value">{formData.cardName || 'AD SOYAD'}</div>
                    </div>
                    <div>
                        <div className="card-label">SKT</div>
                        <div className="card-value">{formData.expDate || 'MM/YY'}</div>
                    </div>
                </div>
            </div>

            <div className="form-group">
                <label>Kart Numarası</label>
                <input type="text" name="cardNumber" value={formData.cardNumber} onChange={handleChange} placeholder="0000 0000 0000 0000" maxLength="19" />
            </div>
            <div className="form-group">
                <label>Kart Üzerindeki İsim</label>
                <input type="text" name="cardName" value={formData.cardName} onChange={handleChange} placeholder="Örn: CEREN YILMAZ" />
            </div>
            <div className="row">
                <div className="col form-group">
                    <label>Son Kullanma (Ay/Yıl)</label>
                    <input type="text" name="expDate" value={formData.expDate} onChange={handleChange} placeholder="12/25" maxLength="5" />
                </div>
                <div className="col form-group">
                    <label>CVC</label>
                    <input type="text" name="cvc" value={formData.cvc} onChange={handleChange} placeholder="123" maxLength="3" />
                </div>
            </div>

            <div className="action-buttons">
                <button className="btn-secondary" onClick={handleBack}>← Geri</button>
                <button className="btn-primary" onClick={handlePlaceOrder}>Siparişi Tamamla ({cart.reduce((a, b) => a + Number(b.price), 0).toFixed(2)}₺)</button>
            </div>
        </div>
    );

    const renderSuccessStep = () => (
        <div className="success-screen">
            <div className="check-icon">🎉</div>
            <h2>Siparişiniz Alındı!</h2>
            <p>Teşekkürler {formData.fullName}. Siparişin hazırlanıyor.</p>
            <p>Ana sayfaya yönlendiriliyorsunuz...</p>
            <button className="btn-primary" onClick={() => navigate('/')} style={{ marginTop: '20px' }}>Ana Sayfaya Dön</button>
        </div>
    );

    return (
        <div className="checkout-page-wrapper">
            <div className={`checkout-main-container ${step === 3 ? 'success-layout' : ''}`}>
                {/* Confetti */}
                {showConfetti && (
                    <div className="confetti-container">
                        {confettiPieces.map((piece) => (
                            <div
                                key={piece.id}
                                className="confetti-piece"
                                style={{
                                    left: `${piece.left}%`,
                                    animationDelay: `${piece.delay}s`,
                                    backgroundColor: piece.color,
                                    width: `${piece.size}px`,
                                    height: `${piece.size}px`,
                                }}
                            ></div>
                        ))}
                    </div>
                )}

                {step !== 3 && (
                    <div className="checkout-sidebar">
                        <div className="recommendations-box">
                            <h4>✨ <span>Bunları da Sevebilirsiniz</span></h4>
                            <p className="rec-subtitle">Sepetinize eklemek isteyebileceğiniz öneriler:</p>
                            <div className="rec-list">
                                {recommendations.map(p => (
                                    <div key={p.id} className="rec-item">
                                        <div className="rec-img" onClick={() => navigate(`/product/${p.id}`)}>
                                            <img src={p.api_featured_image || p.image_link} alt={p.name} />
                                        </div>
                                        <div className="rec-info">
                                            <h5 onClick={() => navigate(`/product/${p.id}`)}>{p.name}</h5>
                                            <div className="rec-bottom">
                                                <span>₺{Number(p.price).toFixed(2)}</span>
                                                <button onClick={() => addToCart(p)}>Ekle +</button>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                )}

                <div className="checkout-form-container">
                    <div className="steps-indicator">
                        <div className={`step ${step >= 1 ? 'active' : ''}`}>
                            <div className="step-circle">1</div>
                            <span>Adres</span>
                        </div>
                        <div className={`step ${step >= 2 ? 'active' : ''}`}>
                            <div className="step-circle">2</div>
                            <span>Ödeme</span>
                        </div>
                        <div className={`step ${step >= 3 ? 'active' : ''}`}>
                            <div className="step-circle">3</div>
                            <span>Onay</span>
                        </div>
                    </div>

                    <div className="checkout-step-renderer">
                        {step === 1 && renderAddressStep()}
                        {step === 2 && renderPaymentStep()}
                        {step === 3 && renderSuccessStep()}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Checkout;
