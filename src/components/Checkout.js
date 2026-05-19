import React, { useState, useEffect, useContext, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { MapPin, CreditCard, PartyPopper, Sparkles, ArrowRight, ArrowLeft } from 'lucide-react';
import apiClient, { withAuth } from '../api/apiClient';
import { ShopContext } from '../context/ShopContext';
import { notify } from './Notify';
import Modal from './ui/Modal';
import '../css/Checkout.css';

const Checkout = () => {
    const { cart, clearCart, products, addToCart } = useContext(ShopContext);
    const navigate = useNavigate();
    const isNotifying = useRef(false);
    const getCartTotal = () => cart.reduce((total, item) => total + (Number(item.price) * Number(item.quantity || 1)), 0);

    const [step, setStep] = useState(1);
    const [showConfetti, setShowConfetti] = useState(false);
    const [formData, setFormData] = useState({
        addressTitle: '', fullName: '', address: '', city: '', zip: '',
        cardName: '', cardNumber: '', expDate: '', cvc: ''
    });
    const [addresses, setAddresses] = useState([]);
    const [selectedAddressId, setSelectedAddressId] = useState(null);
    const [saveNewAddress, setSaveNewAddress] = useState(false);
    const [recommendations, setRecommendations] = useState([]);
    const [showNewAddressModal, setShowNewAddressModal] = useState(false);

    useEffect(() => {
        const fetchAddresses = async () => {
            const token = localStorage.getItem('token');
            if (!token) return;
            
            try {
                const res = await apiClient.get('/api/addresses', withAuth(token));
                setAddresses(res.data);
            } catch (err) {
                setAddresses([]);
            }
        };

        if (cart.length === 0 && step !== 4) {
            navigate('/');
            if (!isNotifying.current) {
                isNotifying.current = true;
                notify.error("Sepetiniz boş olduğu için anasayfaya yönlendirildiniz.");
                setTimeout(() => isNotifying.current = false, 2000);
            }
        } else if (step === 1) {
            fetchAddresses();
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
        } else if (name === 'expDate') {
            const digits = value.replace(/\D/g, '').slice(0, 4);
            const formatted = digits.length > 2 ? `${digits.slice(0, 2)}/${digits.slice(2)}` : digits;
            setFormData({ ...formData, [name]: formatted });
        } else {
            setFormData({ ...formData, [name]: value });
        }
    };

    const handleNext = () => {
        const isExpiryComplete = /^\d{2}\/\d{2}$/.test(formData.expDate);

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
        if (step === 2) {
            if (!formData.cardNumber || !formData.cardName || !isExpiryComplete || !formData.cvc) {
                if (!isNotifying.current) {
                    isNotifying.current = true;
                    notify.error("Lütfen kart bilgilerini doldurun!");
                    setTimeout(() => { isNotifying.current = false; }, 2000);
                }
                return;
            }
        }
        setStep(step + 1);
    };

    const handleBack = () => setStep(step - 1);

    const handleStepClick = (targetStep) => {
        if (targetStep < step && step <= 3) {
            setStep(targetStep);
        }
    };

    const handlePlaceOrder = async () => {
        if (!formData.cardNumber || !formData.cvc) {
            if (!isNotifying.current) {
                isNotifying.current = true;
                notify.error("Kart bilgileri eksik!");
                setTimeout(() => { isNotifying.current = false; }, 2000);
            }
            return;
        }

        try {
            const token = localStorage.getItem('token');
            const totalAmount = getCartTotal();
            
            // If user wants to save this address and it's a new one
            if (saveNewAddress && !selectedAddressId) {
                await apiClient.post('/api/addresses', {
                    title: formData.addressTitle || `Adres ${new Date().toLocaleDateString()}`,
                    fullName: formData.fullName,
                    addressLine: formData.address,
                    city: formData.city,
                    zip: formData.zip
                }, withAuth(token));
            }

            await apiClient.post('/api/orders', {
                items: cart,
                totalAmount: totalAmount,
                address: formData.address,
                city: formData.city,
                zip: formData.zip
            }, withAuth(token));

            setStep(4);
            setShowConfetti(true);
            clearCart();
            window.scrollTo({ top: 0, behavior: 'smooth' });
            setTimeout(() => setShowConfetti(false), 4000);
            setTimeout(() => { navigate('/account'); }, 5000); // Redirect to account instead of home
        } catch (err) {
            notify.error(err.response?.data?.message || err.response?.data?.error || "Sipariş oluşturulurken bir hata oluştu.");
        }
    };

    const handleSelectAddress = (addr) => {
        setSelectedAddressId(addr.AddressID);
        setSaveNewAddress(false);
        setFormData({
            ...formData,
            addressTitle: addr.Title,
            fullName: addr.FullName,
            address: addr.AddressLine,
            city: addr.City,
            zip: addr.Zip
        });
    };

    const handleOpenNewAddress = () => {
        if (selectedAddressId) {
            setFormData(prev => ({ ...prev, addressTitle: '', fullName: '', address: '', city: '', zip: '' }));
        }
        setSelectedAddressId(null);
        setShowNewAddressModal(true);
    };

    const handleConfirmNewAddress = (event) => {
        event.preventDefault();

        if (!formData.addressTitle || !formData.fullName || !formData.address || !formData.city) {
            if (!isNotifying.current) {
                isNotifying.current = true;
                notify.error("Lütfen adres bilgilerini doldurun!");
                setTimeout(() => { isNotifying.current = false; }, 2000);
            }
            return;
        }

        setSelectedAddressId(null);
        setShowNewAddressModal(false);
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

    const renderCardPreview = (className = '') => (
        <div className={`credit-card-preview ${className}`}>
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
                    <div className="card-value">{formatExpiryDate(formData.expDate) || 'MM/YY'}</div>
                </div>
            </div>
        </div>
    );

    const formatExpiryDate = (value) => {
        const digits = String(value || '').replace(/\D/g, '').slice(0, 4);
        if (digits.length <= 2) return digits;
        return `${digits.slice(0, 2)}/${digits.slice(2)}`;
    };

    const maskedCardNumber = formData.cardNumber
        ? `**** **** **** ${formData.cardNumber.replace(/\s/g, '').slice(-4)}`
        : '**** **** **** ----';

    const renderOrderSummaryPanel = ({ showCard = false, showItems = true, actionLabel, onAction }) => (
        <aside className="checkout-summary-panel">
            {showCard && (
                <div className="summary-card-block">
                    <h4>Kart Önizleme</h4>
                    {renderCardPreview('summary-card-preview')}
                </div>
            )}

            {showItems && (
                <div className="summary-section">
                    <h4>Sipariş Özeti</h4>
                    <div className="summary-items">
                        {cart.map(item => (
                            <div key={item.id} className="summary-item">
                                <img src={item.api_featured_image || item.image_link} alt={item.name} />
                                <div>
                                    <span>{item.name}</span>
                                    <small>Adet: {item.quantity || 1}</small>
                                </div>
                                <strong>₺{(Number(item.price) * Number(item.quantity || 1)).toFixed(2)}</strong>
                            </div>
                        ))}
                    </div>
                    <div className="summary-total">
                        <span>Toplam</span>
                        <strong>₺{getCartTotal().toFixed(2)}</strong>
                    </div>
                </div>
            )}

            {actionLabel && (
                <button className="btn-primary summary-action" onClick={onAction}>
                    {actionLabel} <ArrowRight size={18} />
                </button>
            )}
        </aside>
    );

    const renderAddressStep = () => (
        <div className="checkout-form-content">
            <h3><MapPin className="step-title-icon" /> Teslimat Adresi</h3>

            <div className="saved-addresses-selection">
                <label className="section-label">Teslimat adresi seçin</label>
                <div className="address-options-scroll">
                    {addresses.map(addr => (
                        <div
                            key={addr.AddressID}
                            className={`address-option-card ${selectedAddressId === addr.AddressID ? 'selected' : ''}`}
                            onClick={() => handleSelectAddress(addr)}
                        >
                            <div className="option-check"></div>
                            <div className="option-info">
                                <span className="option-title">{addr.Title}</span>
                                <span className="option-name">{addr.FullName}</span>
                                <span className="option-details">{addr.AddressLine}</span>
                                <span className="option-city">{[addr.City, addr.Zip].filter(Boolean).join(' / ')}</span>
                            </div>
                        </div>
                    ))}
                    <div
                        className={`address-option-card ${!selectedAddressId && formData.addressTitle && formData.fullName && formData.address ? 'selected' : ''}`}
                        onClick={handleOpenNewAddress}
                    >
                        <div className="option-check"></div>
                        <div className="option-info">
                            <span className="option-title">Yeni Adres</span>
                            {formData.fullName && !selectedAddressId ? (
                                <>
                                    {formData.addressTitle && <span className="option-name">{formData.addressTitle}</span>}
                                    <span className="option-name">{formData.fullName}</span>
                                    <span className="option-details">{formData.address}</span>
                                    <span className="option-city">{[formData.city, formData.zip].filter(Boolean).join(' / ')}</span>
                                </>
                            ) : (
                                <span className="option-details">Farklı bir teslimat adresi kullan.</span>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            <Modal
                isOpen={showNewAddressModal}
                onClose={() => setShowNewAddressModal(false)}
                panelClassName="checkout-address-modal"
                ariaLabel="Yeni teslimat adresi"
            >
                <div className="modal-header">
                    <h3>Yeni Adres Ekle</h3>
                    <button type="button" className="close-modal" onClick={() => setShowNewAddressModal(false)} aria-label="Kapat">&times;</button>
                </div>
                <form onSubmit={handleConfirmNewAddress}>
                    <div className="checkout-modal-fields">
                        <div className="form-group full-width">
                            <label>Adres Başlığı (Örn: Ev, İş) <span>*</span></label>
                            <input type="text" name="addressTitle" value={formData.addressTitle} onChange={handleChange} placeholder="Ev, İş, Okul vb." />
                        </div>
                        <div className="form-group full-width">
                            <label>Ad Soyad <span>*</span></label>
                            <input type="text" name="fullName" value={formData.fullName} onChange={handleChange} placeholder="Teslim alacak kişinin adı" />
                        </div>
                        <div className="form-group full-width">
                            <label>Adres Detayı <span>*</span></label>
                            <textarea name="address" value={formData.address} onChange={handleChange} placeholder="Mahalle, sokak, bina ve kapı numarası..." />
                        </div>
                        <div className="form-group">
                            <label>Şehir <span>*</span></label>
                            <input type="text" name="city" value={formData.city} onChange={handleChange} />
                        </div>
                        <div className="form-group zip-field">
                            <label>Posta Kodu</label>
                            <input type="text" name="zip" value={formData.zip} onChange={handleChange} />
                        </div>
                    </div>

                    {localStorage.getItem('token') && (
                        <div className="checkout-save-address-option">
                            <input
                                type="checkbox"
                                id="saveAddress"
                                checked={saveNewAddress}
                                onChange={(e) => setSaveNewAddress(e.target.checked)}
                            />
                            <label htmlFor="saveAddress">Bu adresi sonraki alışverişlerim için kaydet</label>
                        </div>
                    )}

                    <div className="checkout-address-actions">
                        <button type="button" className="btn-secondary" onClick={() => setShowNewAddressModal(false)}>Vazgeç</button>
                        <button type="submit" className="btn-primary">Adresi Kullan</button>
                    </div>
                </form>
            </Modal>

            <div className="action-buttons">
                <div></div>
                <button className="btn-primary" onClick={handleNext}>Devam Et <ArrowRight size={18} /></button>
            </div>
        </div>
    );

    const renderPaymentStep = () => (
        <div className="checkout-form-content">
            <div className="checkout-workspace">
                <section className="checkout-primary-panel payment-primary-panel">
                    <div className="panel-title-row">
                        <h3><CreditCard className="step-title-icon" /> Kart Bilgileri</h3>
                    </div>

                    <div className="payment-fields">
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
                    </div>

                </section>

                <div className="payment-preview-column">
                    <button className="btn-secondary panel-back-btn payment-preview-back" onClick={handleBack}><ArrowLeft size={18} /> Geri</button>
                    {renderOrderSummaryPanel({ showCard: true, showItems: false })}
                    <button className="btn-primary payment-preview-action" onClick={handleNext}>
                        Devam Et <ArrowRight size={18} />
                    </button>
                </div>
            </div>
        </div>
    );

    const renderReviewStep = () => (
        <div className="checkout-form-content">
            <div className="checkout-workspace review-workspace">
                <section className="checkout-primary-panel">
                    <div className="review-header-row">
                        <h3><PartyPopper className="step-title-icon" /> Sipariş Onayı</h3>
                        <button className="btn-secondary review-back-btn" onClick={handleBack}><ArrowLeft size={18} /> Geri</button>
                    </div>

                    <div className="confirmation-grid">
                        <div className="review-card review-info-card">
                            <div className="review-info-section">
                                <h4>Teslimat Adresi</h4>
                                <p className="review-name">{formData.fullName}</p>
                                <p>{formData.address}</p>
                                <p className="review-muted">{[formData.city, formData.zip].filter(Boolean).join(' / ')}</p>
                            </div>

                            <div className="review-info-divider"></div>

                            <div className="review-info-section">
                                <h4>Ödeme Bilgileri</h4>
                                <p className="review-name">{formData.cardName}</p>
                                <p>{maskedCardNumber}</p>
                                <p className="review-muted">Son kullanma: {formatExpiryDate(formData.expDate)}</p>
                            </div>
                        </div>

                        <div className="review-card review-summary-card">
                            {renderOrderSummaryPanel({ actionLabel: 'Siparişi Ver', onAction: handlePlaceOrder })}
                        </div>
                    </div>
                </section>
            </div>
        </div>
    );

    const renderSuccessStep = () => (
        <div className="success-screen">
            <div className="check-icon"><PartyPopper size={64} /></div>
            <h2>Siparişiniz Alındı!</h2>
            <p>Teşekkürler {formData.fullName}. Siparişin hazırlanıyor.</p>
            <p>Ana sayfaya yönlendiriliyorsunuz...</p>
            <button className="btn-primary" onClick={() => navigate('/')} style={{ marginTop: '20px' }}>Ana Sayfaya Dön</button>
        </div>
    );

    return (
        <div className="checkout-page-wrapper">
            <div className={`checkout-main-container ${step === 4 ? 'success-layout' : step === 1 ? '' : 'single-layout'}`}>
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

                {step === 1 && (
                    <div className="checkout-sidebar">
                        <div className="recommendations-box">
                            <h4><Sparkles size={20} className="rec-icon" /> <span>Bunları da Sevebilirsiniz</span></h4>
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
                        <button
                            type="button"
                            className={`step ${step >= 1 ? 'active' : ''} ${step > 1 && step <= 3 ? 'clickable' : ''}`}
                            onClick={() => handleStepClick(1)}
                            disabled={!(step > 1 && step <= 3)}
                            aria-current={step === 1 ? 'step' : undefined}
                        >
                            <div className="step-circle">1</div>
                            <span>Adres</span>
                        </button>
                        <button
                            type="button"
                            className={`step ${step >= 2 ? 'active' : ''} ${step > 2 && step <= 3 ? 'clickable' : ''}`}
                            onClick={() => handleStepClick(2)}
                            disabled={!(step > 2 && step <= 3)}
                            aria-current={step === 2 ? 'step' : undefined}
                        >
                            <div className="step-circle">2</div>
                            <span>Ödeme</span>
                        </button>
                        <button
                            type="button"
                            className={`step ${step >= 3 ? 'active' : ''}`}
                            disabled
                            aria-current={step === 3 ? 'step' : undefined}
                        >
                            <div className="step-circle">3</div>
                            <span>Onay</span>
                        </button>
                    </div>

                    <div className="checkout-step-renderer">
                        {step === 1 && renderAddressStep()}
                        {step === 2 && renderPaymentStep()}
                        {step === 3 && renderReviewStep()}
                        {step === 4 && renderSuccessStep()}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Checkout;
