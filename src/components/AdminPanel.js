import React, { useState, useContext, useEffect } from 'react';
import { PlusCircle, Package, Edit, TrendingUp, Users, ShoppingBag, DollarSign, LayoutDashboard } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import '../css/AdminPanel.css';
import { notify } from "./Notify";
import { ShopContext } from '../context/ShopContext';
import { useAuth } from '../context/AuthContext';
import Swal from 'sweetalert2';
import axios from 'axios';

function AdminPanel() {
    const { products, addNewProduct, deleteProduct, updateProduct, theme } = useContext(ShopContext);
    const { user, token } = useAuth();

    const [activeTab, setActiveTab] = useState('dashboard');
    const [stats, setStats] = useState(null);
    const [loadingStats, setLoadingStats] = useState(true);

    const [editingProduct, setEditingProduct] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [formData, setFormData] = useState({
        name: '', price: '', category: 'makeup', product_type: 'lipstick',
        description: '', image_link: ''
    });

    useEffect(() => {
        const fetchStats = async () => {
            if (!token) return;
            try {
                setLoadingStats(true);
                const res = await axios.get('http://localhost:5000/api/admin/stats', {
                    headers: { Authorization: `Bearer ${token}` }
                });
                setStats(res.data);
            } catch (err) {
                console.error("Dashboard verileri alınamadı:", err);
            } finally {
                setLoadingStats(false);
            }
        };

        if (activeTab === 'dashboard') {
            fetchStats();
        }
    }, [token, activeTab]);

    const COLORS = ['#e91e63', '#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#6366f1'];

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

    const handleEditClick = (product) => {
        setEditingProduct({ ...product });
        setIsModalOpen(true);
    };

    const handleUpdateSubmit = async (e) => {
        e.preventDefault();
        const success = await updateProduct(editingProduct.id, editingProduct);
        if (success) {
            setIsModalOpen(false);
        }
    };

    const handleEditChange = (e) => {
        const { name, value } = e.target;
        if (name === 'category') {
            const firstOptionOfNewCategory = categoryOptions[value][0].value;
            setEditingProduct({ ...editingProduct, [name]: value, product_type: firstOptionOfNewCategory });
        } else {
            setEditingProduct({ ...editingProduct, [name]: value });
        }
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

            <div className="admin-tabs">
                <button 
                    className={`tab-btn ${activeTab === 'dashboard' ? 'active' : ''}`}
                    onClick={() => setActiveTab('dashboard')}
                >
                    <LayoutDashboard size={18} /> Dashboard
                </button>
                <button 
                    className={`tab-btn ${activeTab === 'products' ? 'active' : ''}`}
                    onClick={() => setActiveTab('products')}
                >
                    <Package size={18} /> Ürün Yönetimi
                </button>
            </div>

            {activeTab === 'dashboard' ? (
                <div className="dashboard-grid">
                    {loadingStats ? (
                        <div className="loading-stats">Veriler Hazırlanıyor...</div>
                    ) : (
                        <>
                            <div className="stats-overview">
                                <div className="stat-card">
                                    <div className="stat-icon revenue"><DollarSign size={24} /></div>
                                    <div className="stat-info">
                                        <h3>Toplam Satış</h3>
                                        <div className="stat-value">₺{Number(stats?.kpis?.totalRevenue || 0).toLocaleString('tr-TR')}</div>
                                    </div>
                                </div>
                                <div className="stat-card">
                                    <div className="stat-icon orders"><ShoppingBag size={24} /></div>
                                    <div className="stat-info">
                                        <h3>Siparişler</h3>
                                        <div className="stat-value">{stats?.kpis?.totalOrders || 0}</div>
                                    </div>
                                </div>
                                <div className="stat-card">
                                    <div className="stat-icon users"><Users size={24} /></div>
                                    <div className="stat-info">
                                        <h3>Müşteriler</h3>
                                        <div className="stat-value">{stats?.kpis?.totalUsers || 0}</div>
                                    </div>
                                </div>
                                <div className="stat-card">
                                    <div className="stat-icon products"><Package size={24} /></div>
                                    <div className="stat-info">
                                        <h3>Ürünler</h3>
                                        <div className="stat-value">{stats?.kpis?.totalProducts || 0}</div>
                                    </div>
                                </div>
                            </div>

                            <div className="charts-row">
                                <div className="chart-card revenue-chart">
                                    <h3><TrendingUp size={20} /> Satış Trendi (Son 7 Gün)</h3>
                                    <div style={{ width: '100%', height: 300 }}>
                                        <ResponsiveContainer>
                                            <LineChart data={stats?.revenueData}>
                                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border-color)" />
                                                <XAxis 
                                                    dataKey="date" 
                                                    axisLine={false} 
                                                    tickLine={false} 
                                                    tick={{fill: 'var(--text-muted)', fontSize: 12}}
                                                    dy={10}
                                                />
                                                <YAxis 
                                                    axisLine={false} 
                                                    tickLine={false} 
                                                    tick={{fill: 'var(--text-muted)', fontSize: 12}}
                                                />
                                                <Tooltip 
                                                    contentStyle={{ 
                                                        backgroundColor: 'var(--card-bg)', 
                                                        borderColor: 'var(--border-color)',
                                                        borderRadius: '12px',
                                                        color: 'var(--text-color)' 
                                                    }} 
                                                />
                                                <Line 
                                                    type="monotone" 
                                                    dataKey="revenue" 
                                                    stroke="#e91e63" 
                                                    strokeWidth={3} 
                                                    dot={{ r: 4, fill: '#e91e63' }}
                                                    activeDot={{ r: 6 }}
                                                />
                                            </LineChart>
                                        </ResponsiveContainer>
                                    </div>
                                </div>

                                <div className="chart-card category-chart">
                                    <h3>Kategori Dağılımı</h3>
                                    <div style={{ width: '100%', height: 300 }}>
                                        <ResponsiveContainer>
                                            <PieChart>
                                                <Pie
                                                    data={stats?.categoryData}
                                                    innerRadius={60}
                                                    outerRadius={80}
                                                    paddingAngle={5}
                                                    dataKey="value"
                                                >
                                                    {stats?.categoryData?.map((entry, index) => (
                                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                                    ))}
                                                </Pie>
                                                <Tooltip 
                                                    contentStyle={{ 
                                                        backgroundColor: 'var(--card-bg)', 
                                                        borderColor: 'var(--border-color)',
                                                        borderRadius: '12px'
                                                    }}
                                                />
                                            </PieChart>
                                        </ResponsiveContainer>
                                    </div>
                                </div>
                            </div>

                            <div className="recent-orders-card">
                                <h3>Son Aktiviteler</h3>
                                <div className="product-table-wrapper">
                                    <table className="product-table">
                                        <thead>
                                            <tr>
                                                <th>Müşteri</th>
                                                <th>Tarih</th>
                                                <th>Tutar</th>
                                                <th>Durum</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {stats?.recentOrders?.map((order) => (
                                                <tr key={order.OrderID}>
                                                    <td>{order.customer}</td>
                                                    <td>{new Date(order.OrderDate).toLocaleDateString('tr-TR')}</td>
                                                    <td>₺{order.TotalAmount}</td>
                                                    <td>
                                                        <div className="status-row">
                                                            <span className={`status-dot status-${order.Status.toLowerCase().includes('haz') ? 'pending' : 'completed'}`}></span>
                                                            {order.Status}
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </>
                    )}
                </div>
            ) : (
                <div className="admin-content">
                    <div className="admin-section form-section">
                        <h2><PlusCircle size={24} className="section-icon" /> Yeni Ürün Ekle</h2>
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
                            <textarea name="description" placeholder="Ürün Açıklaması" value={formData.description} onChange={handleChange} rows="3"></textarea>
                            <button type="submit" className="save-btn">+ Mağazaya Ekle</button>
                        </form>
                    </div>

                    <div className="admin-section list-section">
                        <h2><Package size={24} className="section-icon" /> Mevcut Ürünler ({products.length})</h2>
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
                                            <td>₺{Number(p.price).toFixed(2)}</td>
                                            <td>
                                                <div className="action-btns">
                                                    <button className="edit-btn-small" onClick={() => handleEditClick(p)}>Düzenle</button>
                                                    <button className="delete-btn" onClick={() => handleDeleteClick(p.id)}>Sil</button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            )}

            {/* Edit Modal */}
            {isModalOpen && (
                <div className="modal-overlay">
                    <div className="modal-content admin-section">
                        <button className="modal-close-x" onClick={() => setIsModalOpen(false)}>&times;</button>
                        <h2><Edit size={24} className="section-icon" /> Ürünü Düzenle</h2>
                        <form onSubmit={handleUpdateSubmit}>
                            <div className="form-group">
                                <label>Ürün Adı</label>
                                <input
                                    type="text"
                                    name="name"
                                    value={editingProduct.name}
                                    onChange={handleEditChange}
                                />
                            </div>

                            <div className="row">
                                <div className="form-group flex-1">
                                    <label>Fiyat (₺)</label>
                                    <input
                                        type="number"
                                        name="price"
                                        value={editingProduct.price}
                                        onChange={handleEditChange}
                                    />
                                </div>
                                <div className="form-group flex-1">
                                    <label>Kategori</label>
                                    <select
                                        name="category"
                                        value={editingProduct.category}
                                        onChange={handleEditChange}
                                    >
                                        <option value="makeup">Makyaj</option>
                                        <option value="skincare">Cilt Bakımı</option>
                                        <option value="accessories">Aksesuar</option>
                                    </select>
                                </div>
                                <div className="form-group flex-1">
                                    <label>Ürün Türü</label>
                                    <select
                                        name="product_type"
                                        value={editingProduct.product_type}
                                        onChange={handleEditChange}
                                    >
                                        {categoryOptions[editingProduct.category].map((option) => (
                                            <option key={option.value} value={option.value}>
                                                {option.label}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            <div className="form-group">
                                <label>Resim URL</label>
                                <input
                                    type="text"
                                    name="image_link"
                                    value={editingProduct.image_link}
                                    onChange={handleEditChange}
                                />
                            </div>

                            <div className="form-group">
                                <label>Açıklama</label>
                                <textarea
                                    name="description"
                                    value={editingProduct.description}
                                    onChange={handleEditChange}
                                    rows="4"
                                ></textarea>
                            </div>

                            <div className="modal-actions">
                                <button type="button" className="cancel-btn" onClick={() => setIsModalOpen(false)}>
                                    Vazgeç
                                </button>
                                <button type="submit" className="save-btn">
                                    Değişiklikleri Kaydet
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}

export default AdminPanel;
