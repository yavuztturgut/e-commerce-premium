import React, { useState, useEffect, useContext } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ShopContext } from '../context/ShopContext';
import '../css/ProductList.css';

function ProductList() {
    const navigate = useNavigate();
    const { categoryName } = useParams();
    const { products, addToCart, searchTerm, setSearchTerm, loading, isFavorite, toggleFavorite } = useContext(ShopContext);

    const [selectedType, setSelectedType] = useState("Tümü");
    const [sortType, setSortType] = useState("default");

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
        const priceA = Number(a.price) || 0;
        const priceB = Number(b.price) || 0;
        const nameA = a.name ? a.name.toLowerCase() : "";
        const nameB = b.name ? b.name.toLowerCase() : "";
        const ratingA = Number(a.rating) || 0;
        const ratingB = Number(b.rating) || 0;

        if (sortType === 'default') return b.id - a.id;
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
                                    className={`card-fav-btn ${isFavorite(product.id) ? 'active' : ''}`}
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        toggleFavorite(product);
                                    }}
                                    title={isFavorite(product.id) ? "Favorilerden Çıkar" : "Favorilere Ekle"}
                                >
                                    {isFavorite(product.id) ? '❤️' : '🤍'}
                                </button>
                            </div>

                            <div className="product-info">
                                <h3 className="product-title">{product.name}</h3>

                                <div className="card-rating">
                                    <div className="stars-wrapper">
                                        {[...Array(5)].map((_, i) => (
                                            <span
                                                key={i}
                                                className={i < Math.round(Number(product.rating || 0)) ? "star filled" : "star"}
                                            >★</span>
                                        ))}
                                    </div>
                                    <span className="rating-number">({Number(product.rating || 0).toFixed(1)})</span>
                                </div>

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
                    );
                })}
            </div>

            {sortedProducts.length === 0 && (
                <div className="no-result">
                    <h3>Sonuç Bulunamadı 😔</h3>
                    <p>Farklı bir arama terimi veya alt kategori deneyebilirsiniz.</p>
                </div>
            )}
        </div>
    );
}

export default ProductList;
