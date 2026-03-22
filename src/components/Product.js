import React, { useState, useEffect, useContext } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import '../css/ProductList.css';
import '../css/Product.css';
import Spinner from "./Spinner";
import { ShopContext } from '../context/ShopContext';
import Reviews from './Reviews';

function Product() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [product, setProduct] = useState(null);
    const [loading, setLoading] = useState(true);
    const { products: allProducts, addToCart, toggleFavorite, isFavorite } = useContext(ShopContext);

    useEffect(() => {
        window.scrollTo({ top: 0, behavior: 'smooth' });

        // Önce Context'teki güncel listeye bakalım (Puan değişimlerini anlık yakalar)
        let foundProduct = allProducts.find(p => p.id === Number(id));

        // Eğer henüz context yüklenmediyse localStorage'dan geçici olarak alalım
        if (!foundProduct) {
            const storedData = localStorage.getItem('cerenAdenProducts');
            if (storedData) {
                const products = JSON.parse(storedData);
                foundProduct = products.find(p => p.id === Number(id));
            }
        }

        if (foundProduct) {
            setProduct(foundProduct);
        }

        // Eğer ürünler yüklendiyse ve hala bulunamadıysa loading'i kapat
        if (allProducts.length > 0) {
            setLoading(false);
        }
    }, [id, allProducts]);

    if (loading) return <div className="loading-msg"><Spinner fullPage={true} text="Ürün getiriliyor..." /></div>;
    if (!product) return <div className="error-msg">Ürün bulunamadı.</div>;

    const isFav = isFavorite(product.id);

    const relatedProducts = allProducts
        .filter(p => p.category === product.category && p.id !== product.id)
        .sort(() => 0.5 - Math.random())
        .slice(0, 4);

    return (
        <div className="product-detail-container">
            <button onClick={() => navigate(-1)} className="back-btn">
                ← Geri Dön
            </button>

            <div className="product-detail-card">
                <div className="product-image-section">
                    <img
                        src={product.api_featured_image || product.image_link}
                        alt={product.name}
                        className="main-img"
                        loading="lazy"
                        onError={(e) => { e.target.src = "https://via.placeholder.com/400x400?text=No+Image" }}
                    />

                    {product.product_colors && product.product_colors.length > 0 && (
                        <div className="thumbnails-container">
                            {product.product_colors.slice(0, 8).map((color, i) => (
                                <div
                                    key={i}
                                    className="thumb-img"
                                    style={{ backgroundColor: color.hex_value }}
                                    title={color.colour_name}
                                ></div>
                            ))}
                        </div>
                    )}
                </div>

                <div className="product-info-section">
                    <span className="detail-category">
                        {product.product_type ? product.product_type.replace('_', ' ') : product.product_type}
                    </span>
                    <h1 className="detail-title">{product.name}</h1>

                    <div className="detail-rating">
                        <div className="stars-wrapper">
                            {[...Array(5)].map((_, i) => (
                                <span
                                    key={i}
                                    className={product.rating != null && i < Math.round(Number(product.rating)) ? "star filled" : "star"}
                                >★</span>
                            ))}
                        </div>
                        <span className="rating-number">
                            {product.rating != null ? `(${Number(product.rating).toFixed(1)} / 5)` : 'Henüz yorum yok'}
                        </span>
                    </div>

                    <p className="detail-desc">{product.description}</p>

                    <div className="price-container">
                        <span className="current-price">₺{Number(product.price).toFixed(2)}</span>
                    </div>

                    <div className="product-actions">
                        <button
                            onClick={() => addToCart(product)}
                            className="add-btn detail-add-btn"
                            disabled={product.stock === 0}
                        >
                            Sepete Ekle
                        </button>

                        <button
                            className={`fav-btn ${isFav ? 'active' : ''}`}
                            onClick={() => toggleFavorite(product)}
                        >
                            {isFav ? '❤️' : '🤍'}
                        </button>
                    </div>
                </div>
            </div>

            <Reviews productId={product.id} />

            {relatedProducts.length > 0 && (
                <div className="related-products-section">
                    <h3 className="related-title">Bunları da Beğenebilirsiniz ✨</h3>
                    <div className="related-grid">
                        {relatedProducts.map((relProduct) => (
                            <div
                                key={relProduct.id}
                                className="related-card"
                                onClick={() => navigate(`/product/${relProduct.id}`)}
                            >
                                <img
                                    src={relProduct.api_featured_image || relProduct.image_link}
                                    alt={relProduct.name}
                                    className="related-img"
                                    loading="lazy"
                                    onError={(e) => { e.target.src = "https://via.placeholder.com/200?text=CerenAden" }}
                                />
                                <div className="related-info">
                                    <h4 className="related-name">
                                        {relProduct.name.length > 20 ? relProduct.name.substring(0, 20) + '...' : relProduct.name}
                                    </h4>
                                    <span className="related-price">₺{Number(relProduct.price).toFixed(2)}</span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}

export default Product;
