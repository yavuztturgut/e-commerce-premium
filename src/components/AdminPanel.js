import React, { useState, useContext } from 'react';
import '../css/AdminPanel.css';
import { notify } from "./Notify";
import { ShopContext } from '../context/ShopContext';
import Swal from 'sweetalert2';

function AdminPanel() {
    const { products, addNewProduct, deleteProduct, theme } = useContext(ShopContext);

    const categoryOptions = {
        makeup: [
            { value: 'lipstick', label: 'Ruj' },
            { value: 'mascara', label: 'Maskara' },
            { value: 'eyeliner', label: 'Eyeliner' },
            { value: 'foundation', label: 'Fondöten' },
            { value: 'blush', label: 'Allık' },
            { value: 'eyeshadow', label: 'Göz Farı' },
            { value: 'nail_polish', label: 'Oje' }
        ],
        skincare: [
            { value: 'cleanser', label: 'Temizleyici (Cleanser)' },
            { value: 'moisturizer', label: 'Nemlendirici' },
            { value: 'sunscreen', label: 'Güneş Kremi' },
            { value: 'serum', label: 'Serum' },
            { value: 'mask', label: 'Yüz Maskesi' },
            { value: 'tonic', label: 'Tonik' }
        ],
        accessories: [
            { value: 'ring', label: 'Yüzük' },
            { value: 'bracelet', label: 'Bileklik' },
            { value: 'necklace', label: 'Kolye' },
            { value: 'hair_clip', label: 'Toka' },
            { value: 'earrings', label: 'Küpe' },
        ]
    };

    const [formData, setFormData] = useState({
        name: '', price: '', category: 'makeup', product_type: 'lipstick',
        description: '', image_link: ''
    });

    const handleChange = (e) => {
        const { name, value } = e.target;
        if (name === 'category') {
            const firstOptionOfNewCategory = categoryOptions[value][0].value;
            setFormData({ ...formData, [name]: value, product_type: firstOptionOfNewCategory });
        } else {
            setFormData({ ...formData, [name]: value });
        }
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!formData.name || !formData.price) return notify.error(`Lütfen isim ve fiyat alanlarını doldurun.`);

        const productToSend = {
            ...formData, id: Date.now(), price: parseFloat(formData.price)
        };

        addNewProduct(productToSend);
        setFormData({
            name: '', price: '', category: 'makeup', product_type: 'lipstick',
            description: '', image_link: ''
        });
    };

    const handleDeleteClick = (id) => {
        const isDarkMode = theme === 'dark';
        Swal.fire({
            title: 'Emin misiniz?',
            text: "Bu ürünü silerseniz geri getiremezsiniz!",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonText: 'Evet, Sil!',
            cancelButtonText: 'Vazgeç',
            background: isDarkMode ? '#16213e' : '#ffffff',
            color: isDarkMode ? '#e2e8f0' : '#1a1a2e',
            iconColor: '#ef4444',
            confirmButtonColor: '#ef4444',
            cancelButtonColor: isDarkMode ? '#4b5563' : '#6b7280',
        }).then((result) => {
            if (result.isConfirmed) {
                deleteProduct(id);
                Swal.fire({
                    title: 'Silindi!',
                    text: 'Ürün mağazadan kaldırıldı.',
                    icon: 'success',
                    confirmButtonColor: '#e91e63',
                    background: isDarkMode ? '#16213e' : '#ffffff',
                    color: isDarkMode ? '#e2e8f0' : '#1a1a2e'
                });
            }
        });
    };

    return (
        <div className="admin-container">
            <h1 className="admin-title">Yönetim Paneli</h1>

            <div className="admin-content">
                <div className="admin-section form-section">
                    <h2>✨ Yeni Ürün Ekle</h2>
                    <form onSubmit={handleSubmit}>
                        <input type="text" name="name" placeholder="Ürün Adı" value={formData.name} onChange={handleChange} />

                        <div className="row">
                            <input type="number" name="price" placeholder="Fiyat" value={formData.price} onChange={handleChange} />
                            <select name="category" value={formData.category} onChange={handleChange}>
                                <option value="makeup">Makyaj</option>
                                <option value="skincare">Cilt Bakımı</option>
                                <option value="accessories">Aksesuar</option>
                            </select>
                        </div>

                        <div className="row">
                            <label>Ürün Türü:</label>
                            <select name="product_type" value={formData.product_type} onChange={handleChange}>
                                {categoryOptions[formData.category].map((option) => (
                                    <option key={option.value} value={option.value}>
                                        {option.label}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <input type="text" name="image_link" placeholder="Resim URL" value={formData.image_link} onChange={handleChange} />
                        <button type="submit" className="save-btn">+ Mağazaya Ekle</button>
                    </form>
                </div>

                <div className="admin-section list-section">
                    <h2>📦 Mevcut Ürünler ({products.length})</h2>
                    <div className="product-table-wrapper">
                        <table className="product-table">
                            <thead>
                                <tr>
                                    <th>Resim</th>
                                    <th>Ad / Kategori</th>
                                    <th>Fiyat</th>
                                    <th>İşlem</th>
                                </tr>
                            </thead>
                            <tbody>
                                {products.map((p) => (
                                    <tr key={p.id}>
                                        <td>
                                            <img
                                                src={p.api_featured_image || p.image_link}
                                                alt="thumb"
                                                className="table-thumb"
                                                onError={(e) => { e.target.src = "https://via.placeholder.com/50" }}
                                            />
                                        </td>
                                        <td>
                                            <div style={{ fontWeight: '600' }}>{p.name ? p.name.substring(0, 18) : "İsimsiz"}...</div>
                                            <div style={{ fontSize: '0.72rem', color: 'var(--primary-color)', fontWeight: '600' }}>
                                                {p.category?.toUpperCase()} - {p.product_type}
                                            </div>
                                        </td>
                                        <td>${Number(p.price).toFixed(2)}</td>
                                        <td>
                                            <button className="delete-btn" onClick={() => handleDeleteClick(p.id)}>Sil</button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default AdminPanel;
