import React, { useState, useEffect, useContext } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Heart, Star, Frown, Search } from 'lucide-react';
import { ShopContext } from '../context/ShopContext';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import '../css/ProductList.css';

function ProductList() {
    const navigate = useNavigate();
    const { categoryName } = useParams();
    const { products, addToCart, searchTerm, setSearchTerm, loading, isFavorite, toggleFavorite } = useContext(ShopContext);
    const { user, token } = useAuth();

    const [selectedType, setSelectedType] = useState("Tümü");
    const [sortType, setSortType] = useState("default");
    const [recommendedTypes, setRecommendedTypes] = useState([]);

    useEffect(() => {
        const fetchRecommendations = async () => {
            if (user && token) {
                try {
                    const res = await axios.get('http://localhost:5000/api/orders/recommendations', {
                        headers: { Authorization: `Bearer ${token}` }
                    });
                    console.log('[FRONTEND DEBUG] Recommendations response:', res.data);
                    console.log('[FRONTEND DEBUG] Types array:', res.data.types);
                    setRecommendedTypes(res.data.types || []);
                } catch (err) {
                    console.error("Öneriler alınamadı:", err);
                }
            } else {
                setRecommendedTypes([]);
            }
        };

        fetchRecommendations();
    }, [user, token]);

    useEffect(() => {
        setSelectedType("Tümü");
    }, [categoryName]);

    // Artık puanları tek tek hesaplamak yerine direkt ürün verisindeki
    // 'rating' alanını kullanacağız (MSSQL'den geliyor)

    if (loading) return <div className="loading-container"><div className="spinner"></div></div>;

    const baseProducts = products.filter(product => {
        if (!categoryName) return true;
        return product.category === categoryName;
    });

    const subCategories = ["Tümü", ...new Set(baseProducts.map(p => p.product_type).filter(Boolean))];

    const filteredProducts = baseProducts.filter(product => {
        const typeMatch = selectedType === "Tümü" ? true : product.product_type === selectedType;
        const searchMatch = product.name.toLowerCase().includes(searchTerm.toLowerCase());
        return typeMatch && searchMatch;
    });

    const sortedProducts = [...filteredProducts].sort((a, b) => {
        // Recommendation Logic: Priority to products in recommendedTypes (case-insensitive)
        const isRecommendedA = recommendedTypes.some(t => t?.toLowerCase() === a.product_type?.toLowerCase());
        const isRecommendedB = recommendedTypes.some(t => t?.toLowerCase() === b.product_type?.toLowerCase());

        if (isRecommendedA && !isRecommendedB) return -1;
        if (!isRecommendedA && isRecommendedB) return 1;

        // If both are recommended or both are not, apply standard sorting
        const priceA = Number(a.price) || 0;
        const priceB = Number(b.price) || 0;
        const nameA = a.name ? a.name.toLowerCase() : "";
        const nameB = b.name ? b.name.toLowerCase() : "";
        const ratingA = Number(a.rating) || 0;
        const ratingB = Number(b.rating) || 0;

        if (sortType === 'default') return (b.id || 0) - (a.id || 0);
        if (sortType === 'rating-desc') return ratingB - ratingA;
        if (sortType === 'rating-asc') return ratingA - ratingB;
        if (sortType === 'price-asc') return priceA - priceB;
        if (sortType === 'price-desc') return priceB - priceA;
        if (sortType === 'name-asc') return nameA.localeCompare(nameB);
        if (sortType === 'name-desc') return nameB.localeCompare(nameA);
        return 0;
    });

    return (
        <div className="product-container">
            <div className="controls-header">
                <div className="search-wrapper">
                    <Search size={18} className="search-icon-svg" />
                    <input
                        type="text"
                        placeholder="Ürün ara..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>

                <div className="sort-wrapper">
                    <select value={sortType} onChange={(e) => setSortType(e.target.value)} className="sort-select">
                        <option value="default">Sıralama Seçiniz</option>
                        <option value="rating-desc">Puan: Yüksekten Düşüğe</option>
                        <option value="rating-asc">Puan: Düşükten Yükseğe</option>
                        <option value="price-asc">Fiyat: Artan</option>
                        <option value="price-desc">Fiyat: Azalan</option>
                        <option value="name-asc">İsim: A-Z</option>
                        <option value="name-desc">İsim: Z-A</option>
                    </select>
                </div>
            </div>

            <div className="category-filter-bar">
                {subCategories.map((type, index) => (
                    <button
                        key={index}
                        className={`filter-btn ${selectedType === type ? 'active' : ''}`}
                        onClick={() => setSelectedType(type)}
                    >
                        {type === "Tümü" ? type : type.replace('_', ' ')}
                    </button>
                ))}
            </div>

            <div className="product-grid">
                {sortedProducts.map((product) => {
                    const isFav = isFavorite(product.id);
                    return (
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
                                <button
                                    className={`card-fav-btn ${isFav ? 'active' : ''}`}
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        toggleFavorite(product);
                                    }}
                                    title={isFav ? "Favorilerden Çıkar" : "Favorilere Ekle"}
                                >
                                    <Heart size={20} fill={isFav ? "var(--primary-color)" : "transparent"} color={isFav ? "var(--primary-color)" : "var(--text-muted)"} />
                                </button>
                                {(() => {
                                    const isRec = recommendedTypes.some(t => t?.toLowerCase() === product.product_type?.toLowerCase());
                                    if (product.product_type === 'serum' || product.product_type === 'Serum') {
                                        console.log(`[BADGE DEBUG] Product: ${product.name}, Type: ${product.product_type}, RecommendedTypes: ${JSON.stringify(recommendedTypes)}, IsRecommended: ${isRec}`);
                                    }
                                    return isRec && (
                                        <div className="recommendation-badge">
                                            Sizin İçin Seçtik
                                        </div>
                                    );
                                })()}
                            </div>

                            <div className="product-info">
                                <h3 className="product-title">{product.name}</h3>

                                <div className="card-rating">
                                    <div className="stars-wrapper">
                                        {[...Array(5)].map((_, i) => (
                                            <Star
                                                key={i}
                                                size={14}
                                                fill={product.rating != null && i < Math.round(Number(product.rating)) ? "#fbbf24" : "transparent"}
                                                color={product.rating != null && i < Math.round(Number(product.rating)) ? "#fbbf24" : "#e0e0e0"}
                                                strokeWidth={2}
                                            />
                                        ))}
                                    </div>
                                    <span className="rating-number">
                                        {product.rating != null ? `(${Number(product.rating).toFixed(1)})` : 'Henüz yorum yok'}
                                    </span>
                                </div>

                                <p className="product-price">
                                    ₺{Number(product.price).toFixed(2)}
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
                    );
                })}
            </div>

            {sortedProducts.length === 0 && (
                <div className="no-result">
                    <Frown size={48} strokeWidth={1.5} />
                    <h3>Sonuç Bulunamadı</h3>
                    <p>Farklı bir arama terimi veya alt kategori deneyebilirsiniz.</p>
                </div>
            )}
        </div>
    );
}

export default ProductList;
