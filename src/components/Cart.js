import React from 'react';
import { useNavigate } from "react-router-dom";
import { X, ShoppingBag, CreditCard, Minus, Plus } from 'lucide-react';
import '../css/Cart.css';

function Cart({ cartItems, isOpen, toggleCart, addToCart, decreaseCartItem, removeFromCart }) {
    const navigate = useNavigate();
    const safeCart = cartItems || [];
    const itemCount = safeCart.reduce((total, item) => total + Number(item.quantity || 1), 0);

    const totalPrice = safeCart.reduce((total, item) => {
        return total + (Number(item.price) * Number(item.quantity || 1));
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
                    <h4>Sepetiniz ({itemCount})</h4>
                    <button className="cart-close-btn" onClick={toggleCart}><X size={20} /></button>
                </div>

                {safeCart.length === 0 ? (
                    <div className="empty-cart-msg">
                        <span className="empty-icon"><ShoppingBag size={48} strokeWidth={1.5} /></span>
                        Sepetinizde henüz ürün yok.
                    </div>
                ) : (
                    <>
                        <ul className="cart-items-list">
                            {safeCart.map((item) => (
                                <li key={item.id} className="cart-item">
                                    <img
                                        src={item.api_featured_image || item.image_link}
                                        alt={item.name}
                                        className="cart-item-img"
                                        onError={(e) => { e.target.src = "https://via.placeholder.com/50" }}
                                    />
                                    <div className="cart-item-details">
                                        <span className="item-title">{item.name}</span>
                                        <div className="item-quantity-controls">
                                            <button type="button" onClick={() => decreaseCartItem(item.id)} aria-label="Adet azalt">
                                                <Minus size={14} />
                                            </button>
                                            <span>{item.quantity || 1}</span>
                                            <button type="button" onClick={() => addToCart(item)} aria-label="Adet artır">
                                                <Plus size={14} />
                                            </button>
                                        </div>
                                        <span className="item-price">₺{Number(item.price).toFixed(2)}</span>
                                    </div>
                                    <button
                                        className="remove-btn"
                                        onClick={() => removeFromCart(item.id)}
                                        title="Sil"
                                    >
                                        <X size={16} />
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
                            Ödemeye Geç <CreditCard size={18} className="btn-icon-right" />
                        </button>
                    </>
                )}
            </div>
        </>
    );
}

export default Cart;
