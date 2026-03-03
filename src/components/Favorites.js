import React, { useContext } from 'react';
import { ShopContext } from '../context/ShopContext';
import { useNavigate } from 'react-router-dom';
import '../css/ProductList.css';

function Favorites() {
    const { favorites, addToCart } = useContext(ShopContext);
    const navigate = useNavigate();

    if (favorites.length === 0) {
        return (
            <div className="no-result" style={{ textAlign: 'center', marginTop: '80px' }}>
                <div style={{ fontSize: '4rem', marginBottom: '16px' }}>💔</div>
                <h2 style={{ fontFamily: 'Poppins, sans-serif', marginBottom: '12px' }}>Henüz favori ürününüz yok</h2>
                <p>Beğendiğiniz ürünlerin üzerindeki kalbe tıklayarak buraya ekleyebilirsiniz.</p>
            </div>
        );
    }

    return (
        <div className="product-container">
            <h2 style={{
                marginLeft: '20px',
                fontFamily: 'Poppins, sans-serif',
                fontSize: '1.5rem',
                fontWeight: '600',
                background: 'var(--gradient-primary)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
                marginBottom: '24px'
            }}>
                Favorilerim ({favorites.length}) ❤️
            </h2>

            <div className="product-grid">
                {favorites.map((product) => (
                    <div
                        key={product.id}
                        className="product-card"
                        onClick={() => navigate(`/product/${product.id}`)}
                    >
                        <div className="image-container">
                            <img
                                src={product.api_featured_image || product.image_link}
                                alt={product.name}
                                className="product-image"
                                loading="lazy"
                                onError={(e) => { e.target.src = "https://via.placeholder.com/300x300?text=CerenAden" }}
                            />
                        </div>

                        <div className="product-info">
                            <h3 className="product-title">{product.name}</h3>
                            <p className="product-price">
                                ${Number(product.price).toFixed(2)}
                            </p>

                            <button
                                className="add-btn"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    addToCart(product);
                                }}
                            >
                                Sepete Ekle
                            </button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}

export default Favorites;
