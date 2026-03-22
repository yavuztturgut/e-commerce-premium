import React from 'react';
import { useNavigate } from "react-router-dom";
import '../css/Cart.css';

function Cart({ cartItems, isOpen, toggleCart, removeFromCart }) {
    const navigate = useNavigate();
    const safeCart = cartItems || [];

    const totalPrice = safeCart.reduce((total, item) => {
        return total + Number(item.price);
    }, 0);

    return (
        <>
            {/* Overlay */}
            <div
                className={`cart-overlay ${isOpen ? 'active' : ''}`}
                onClick={toggleCart}
            ></div>

            {/* Side Panel */}
            <div className={`cart-panel ${isOpen ? 'active' : ''}`}>
                <div className="cart-header">
                    <h4>Sepetiniz ({safeCart.length})</h4>
                    <button className="cart-close-btn" onClick={toggleCart}>✕</button>
                </div>

                {safeCart.length === 0 ? (
                    <div className="empty-cart-msg">
                        <span className="empty-icon">🛍️</span>
                        Sepetinizde henüz ürün yok.
                    </div>
                ) : (
                    <>
                        <ul className="cart-items-list">
                            {safeCart.map((item, index) => (
                                <li key={index} className="cart-item">
                                    <img
                                        src={item.api_featured_image || item.image_link}
                                        alt={item.name}
                                        className="cart-item-img"
                                        onError={(e) => { e.target.src = "https://via.placeholder.com/50" }}
                                    />
                                    <div className="cart-item-details">
                                        <span className="item-title">{item.name}</span>
                                        <span className="item-price">₺{Number(item.price).toFixed(2)}</span>
                                    </div>
                                    <button
                                        className="remove-btn"
                                        onClick={() => removeFromCart(index)}
                                        title="Sil"
                                    >
                                        ✕
                                    </button>
                                </li>
                            ))}
                        </ul>

                        <div className="cart-footer">
                            <span className="total-text">Toplam</span>
                            <span className="total-amount">₺{totalPrice.toFixed(2)}</span>
                        </div>
                        <button
                            className="checkout-btn"
                            onClick={() => {
                                toggleCart();
                                navigate('/checkout');
                            }}
                        >
                            Ödemeye Geç 💳
                        </button>
                    </>
                )}
            </div>
        </>
    );
}

export default Cart;
