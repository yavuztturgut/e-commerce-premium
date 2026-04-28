import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { ShopContext } from '../context/ShopContext';
import {
    Package, Calendar, CreditCard, ChevronRight, User,
    Mail, MapPin, LayoutDashboard, Edit, Trash2, Shield, LogOut,
    ShoppingBag, Heart, Star, Clock
} from 'lucide-react';
import '../css/AccountPage.css';
import Spinner from '../components/Spinner';
import { notify } from '../components/Notify';

const AccountPage = () => {
    const { user, token, logout, updateProfile } = useAuth();
    const { favorites } = useContext(ShopContext);
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('dashboard');
    const [editData, setEditData] = useState({ fullName: '', email: '', password: '' });
    const [updating, setUpdating] = useState(false);

    // Address States
    const [addresses, setAddresses] = useState([]);
    const [showAddressModal, setShowAddressModal] = useState(false);
    const [addressForm, setAddressForm] = useState({
        id: null, title: '', fullName: '', addressLine: '', city: '', zip: ''
    });
    const [savingAddress, setSavingAddress] = useState(false);

    useEffect(() => {
        if (user) {
            setEditData({ fullName: user.fullName, email: user.email, password: '' });
        }
    }, [user]);

    useEffect(() => {
        const fetchOrders = async () => {
            try {
                const res = await axios.get('http://localhost:5000/api/orders', {
                    headers: { Authorization: `Bearer ${token}` }
                });
                setOrders(res.data);
            } catch (err) {
                console.error("Siparişler yüklenemedi:", err);
            } finally {
                setLoading(false);
            }
        };

        const fetchAddresses = async () => {
            try {
                const res = await axios.get('http://localhost:5000/api/addresses', {
                    headers: { Authorization: `Bearer ${token}` }
                });
                setAddresses(res.data);
            } catch (err) {
                console.error("Adresler yüklenemedi:", err);
            }
        };

        if (token) {
            fetchOrders();
            fetchAddresses();
        }
    }, [token]);

    const handleSaveAddress = async (e) => {
        e.preventDefault();
        setSavingAddress(true);
        try {
            if (addressForm.id) {
                // Update
                await axios.put(`http://localhost:5000/api/addresses/${addressForm.id}`, addressForm, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                notify.success("Adres başarıyla güncellendi.");
            } else {
                // Create
                await axios.post('http://localhost:5000/api/addresses', addressForm, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                notify.success("Adres başarıyla eklendi.");
            }
            // Refresh list
            const res = await axios.get('http://localhost:5000/api/addresses', {
                headers: { Authorization: `Bearer ${token}` }
            });
            setAddresses(res.data);
            setShowAddressModal(false);
            setAddressForm({ id: null, title: '', fullName: '', addressLine: '', city: '', zip: '' });
        } catch (err) {
            notify.error("Adres kaydedilirken bir hata oluştu.");
        } finally {
            setSavingAddress(false);
        }
    };

    const handleDeleteAddress = async (id) => {
        if (!window.confirm("Bu adresi silmek istediğinize emin misiniz?")) return;
        try {
            await axios.delete(`http://localhost:5000/api/addresses/${id}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setAddresses(addresses.filter(a => a.AddressID !== id));
            notify.success("Adres silindi.");
        } catch (err) {
            notify.error("Adres silinemedi.");
        }
    };

    const openEditModal = (addr) => {
        setAddressForm({
            id: addr.AddressID,
            title: addr.Title,
            fullName: addr.FullName,
            addressLine: addr.AddressLine,
            city: addr.City,
            zip: addr.Zip
        });
        setShowAddressModal(true);
    };

    useEffect(() => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }, [activeTab]);

    if (loading) return <Spinner fullPage={true} text="Hesap bilgileri yükleniyor..." />;

    const totalSpent = orders.reduce((acc, curr) => acc + Number(curr.TotalAmount), 0);

    const renderDashboard = () => (
        <>
            <div className="stats-grid">
                <div className="stat-card">
                    <div className="stat-icon-wrapper orders">
                        <ShoppingBag size={24} />
                    </div>
                    <div className="stat-info">
                        <h4>Sipariş Sayısı</h4>
                        <div className="stat-value">{orders.length}</div>
                    </div>
                </div>
                <div className="stat-card">
                    <div className="stat-icon-wrapper favorites">
                        <Heart size={24} />
                    </div>
                    <div className="stat-info">
                        <h4>Favorilerim</h4>
                        <div className="stat-value">{favorites.length}</div>
                    </div>
                </div>
            </div>

            <div className="recent-orders-section">
                <h3 className="section-title"><Clock size={20} /> Son Siparişler</h3>
                {orders.length === 0 ? (
                    <div className="empty-state">
                        <Package size={48} />
                        <h3>Henüz bir siparişiniz yok</h3>
                        <p>Mağazamızdaki harika ürünlere göz atmaya ne dersiniz?</p>
                        <button className="order-actions-btn" onClick={() => window.location.href = '/'}>Alışverişe Başla</button>
                    </div>
                ) : (
                    <div className="order-cards-list">
                        {orders.slice(0, 3).map(order => (
                            <div key={order.OrderID} className="order-card">
                                <div className="order-card-header">
                                    <div className="order-meta">
                                        <div className="meta-item">
                                            <label>Sipariş No</label>
                                            <span>#{order.OrderID}</span>
                                        </div>
                                        <div className="meta-item">
                                            <label>Tarih</label>
                                            <span>{new Date(order.OrderDate).toLocaleDateString('tr-TR')}</span>
                                        </div>
                                        <div className="meta-item">
                                            <label>Toplam</label>
                                            <span>₺{Number(order.TotalAmount).toFixed(2)}</span>
                                        </div>
                                    </div>
                                    <span className={`status-tag ${order.Status.toLowerCase().replace('ı', 'i')}`}>
                                        {order.Status}
                                    </span>
                                </div>
                                <div className="order-card-body">
                                    <div className="order-info-group">
                                        <div className="info-sub-group">
                                            <label>Teslimat Adresi</label>
                                            <span>{order.Address.substring(0, 40)}...</span>
                                        </div>
                                        <div className="info-sub-group">
                                            <label>Ürün Sayısı</label>
                                            <span>{order.ItemCount} Ürün</span>
                                        </div>
                                    </div>
                                    <button className="order-actions-btn">Detayları Gör</button>
                                </div>
                            </div>
                        ))}
                        {orders.length > 3 && (
                            <button className="view-all-orders-btn" onClick={() => setActiveTab('orders')}>
                                Tüm Siparişleri Gör ({orders.length})
                            </button>
                        )}
                    </div>
                )}
            </div>
        </>
    );

    const renderOrders = () => (
        <div className="orders-full-list">
            <h3 className="section-title"><Package size={20} /> Tüm Siparişlerim</h3>
            <div className="order-cards-list">
                {orders.map(order => (
                    <div key={order.OrderID} className="order-card">
                        <div className="order-card-header">
                            <div className="order-meta">
                                <div className="meta-item">
                                    <label>Sipariş No</label>
                                    <span>#{order.OrderID}</span>
                                </div>
                                <div className="meta-item">
                                    <label>Tarih</label>
                                    <span>{new Date(order.OrderDate).toLocaleDateString('tr-TR')}</span>
                                </div>
                                <div className="meta-item">
                                    <label>Toplam</label>
                                    <span>₺{Number(order.TotalAmount).toFixed(2)}</span>
                                </div>
                            </div>
                            <span className={`status-tag ${order.Status.toLowerCase().replace('ı', 'i')}`}>
                                {order.Status}
                            </span>
                        </div>
                        <div className="order-card-body">
                            <div className="order-info-group">
                                <div className="info-sub-group">
                                    <label>Teslimat Adresi</label>
                                    <span>{order.Address}</span>
                                </div>
                                <div className="info-sub-group">
                                    <label>Şehir</label>
                                    <span>{order.City}</span>
                                </div>
                            </div>
                            <button className="order-actions-btn">Sipariş Detayı</button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );

    const renderProfile = () => (
        <div className="profile-details-section">
            <h3 className="section-title"><User size={20} /> Profil Bilgilerim</h3>
            <div className="stat-card" style={{ width: 'fit-content', minWidth: 'min(100%, 550px)' }}>
                <div className="profile-form">
                    <div className="form-group">
                        <label className="info-label"><User size={16} /> Ad Soyad</label>
                        <input
                            type="text"
                            className="profile-input"
                            value={editData.fullName}
                            onChange={(e) => setEditData({ ...editData, fullName: e.target.value })}
                        />
                    </div>
                    <div className="form-group">
                        <label className="info-label"><Mail size={16} /> E-posta Adresi</label>
                        <input
                            type="email"
                            className="profile-input"
                            value={editData.email}
                            onChange={(e) => setEditData({ ...editData, email: e.target.value })}
                        />
                    </div>
                    <div className="form-group">
                        <label className="info-label"><Shield size={16} /> Yeni Şifre (İsteğe bağlı)</label>
                        <input
                            type="password"
                            className="profile-input"
                            placeholder="••••••••"
                            value={editData.password}
                            onChange={(e) => setEditData({ ...editData, password: e.target.value })}
                        />
                    </div>
                    <div className="form-group" style={{ display: 'grid', alignItems: 'end' }}>
                        <button
                            className="profile-submit-btn"
                            style={{ width: '100%', marginTop: 0 }}
                            disabled={updating}
                            onClick={async () => {
                                setUpdating(true);
                                const res = await updateProfile(editData);
                                if (res.success) {
                                    notify.success(res.message);
                                    setEditData({ ...editData, password: '' });
                                } else {
                                    notify.error(res.message);
                                }
                                setUpdating(false);
                            }}
                        >
                            {updating ? 'Güncelleniyor...' : 'Değişiklikleri Kaydet'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );

    const renderAddresses = () => (
        <div className="addresses-container-card">
            <div className="addresses-header">
                <div className="header-info">
                    <h3 className="section-title"><MapPin size={22} /> Adres Bilgilerim</h3>
                    <p className="section-subtitle">Kayıtlı teslimat adreslerinizi buradan yönetebilir veya yeni bir tane ekleyebilirsiniz.</p>
                </div>
                <button className="add-address-btn" onClick={() => {
                    setAddressForm({ id: null, title: '', fullName: '', addressLine: '', city: '', zip: '' });
                    setShowAddressModal(true);
                }}>
                    <MapPin size={18} /> Yeni Adres Ekle
                </button>
            </div>

            <div className="addresses-content">
                {addresses.length === 0 ? (
                    <div className="empty-state-simple">
                        <MapPin size={48} />
                        <h3>Henüz kayıtlı bir adresiniz yok</h3>
                        <p>Hızlı ödeme yapmak için bir teslimat adresi ekleyebilirsiniz.</p>
                        <button className="btn-save" style={{ width: 'auto', padding: '12px 30px' }} onClick={() => setShowAddressModal(true)}>
                            İlk Adresini Ekle
                        </button>
                    </div>
                ) : (
                    <div className="address-cards-grid">
                        {addresses.map(addr => (
                            <div key={addr.AddressID} className="address-card">
                                <div className="address-card-header">
                                    <div className="address-title-group">
                                        <div className="icon-badge">
                                            <MapPin size={18} />
                                        </div>
                                        <h4>{addr.Title}</h4>
                                    </div>
                                    <div className="address-actions">
                                        <button onClick={() => openEditModal(addr)} title="Düzenle">
                                            <Edit size={16} />
                                        </button>
                                        <button onClick={() => handleDeleteAddress(addr.AddressID)} title="Sil" className="delete">
                                            <Trash2 size={16} />
                                        </button>
                                    </div>
                                </div>
                                <div className="address-card-body">
                                    <span className="user-name">{addr.FullName}</span>
                                    <p className="address-text">{addr.AddressLine}</p>
                                    <div className="city-zip">
                                        <span className="city">{addr.City}</span>
                                        {addr.Zip && <span className="zip-badge">{addr.Zip}</span>}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {showAddressModal && (
                <div className="modal-overlay">
                    <div className="address-modal">
                        <div className="modal-header">
                            <h3>{addressForm.id ? 'Adresi Düzenle' : 'Yeni Adres Ekle'}</h3>
                            <button className="close-modal" onClick={() => setShowAddressModal(false)}>&times;</button>
                        </div>
                        <form onSubmit={handleSaveAddress}>
                            <div className="form-group">
                                <label>Adres Başlığı (Örn: Ev, İş)</label>
                                <input
                                    required
                                    type="text"
                                    className="profile-input"
                                    placeholder="Ev, İş, Okul vb."
                                    value={addressForm.title}
                                    onChange={(e) => setAddressForm({ ...addressForm, title: e.target.value })}
                                />
                            </div>
                            <div className="form-group">
                                <label>Ad Soyad</label>
                                <input
                                    required
                                    type="text"
                                    className="profile-input"
                                    placeholder="Teslim alacak kişinin adı"
                                    value={addressForm.fullName}
                                    onChange={(e) => setAddressForm({ ...addressForm, fullName: e.target.value })}
                                />
                            </div>
                            <div className="form-group">
                                <label>Adres Detayı</label>
                                <textarea
                                    required
                                    className="profile-input"
                                    placeholder="Mahalle, sokak, bina ve kapı numarası..."
                                    style={{ minHeight: '100px', paddingTop: '10px' }}
                                    value={addressForm.addressLine}
                                    onChange={(e) => setAddressForm({ ...addressForm, addressLine: e.target.value })}
                                />
                            </div>
                            <div className="row">
                                <div className="col form-group">
                                    <label>Şehir</label>
                                    <input
                                        required
                                        type="text"
                                        className="profile-input"
                                        placeholder="Şehir seçiniz"
                                        value={addressForm.city}
                                        onChange={(e) => setAddressForm({ ...addressForm, city: e.target.value })}
                                    />
                                </div>
                                <div className="col form-group">
                                    <label>Posta Kodu</label>
                                    <input
                                        type="text"
                                        className="profile-input"
                                        placeholder="00000"
                                        value={addressForm.zip}
                                        onChange={(e) => setAddressForm({ ...addressForm, zip: e.target.value })}
                                    />
                                </div>
                            </div>
                            <div className="modal-buttons">
                                <button type="button" className="btn-cancel" onClick={() => setShowAddressModal(false)}>Vazgeç</button>
                                <button type="submit" className="btn-save" disabled={savingAddress}>
                                    {savingAddress ? 'Kaydediliyor...' : 'Adresi Kaydet'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );

    return (
        <div className="account-page-wrapper">
            <div className="account-layout">
                {/* Sidebar */}
                <aside className="account-sidebar">
                    <div className="sidebar-profile">
                        <div className="profile-avatar">
                            {user?.fullName?.charAt(0).toUpperCase()}
                        </div>
                        <h3>{user?.fullName}</h3>
                        <p>{user?.email}</p>
                    </div>

                    <nav className="sidebar-nav">
                        <button
                            className={`nav-item ${activeTab === 'dashboard' ? 'active' : ''}`}
                            onClick={() => setActiveTab('dashboard')}
                        >
                            <LayoutDashboard size={18} /> Dashboard
                        </button>
                        <button
                            className={`nav-item ${activeTab === 'orders' ? 'active' : ''}`}
                            onClick={() => setActiveTab('orders')}
                        >
                            <Package size={18} /> Siparişlerim
                        </button>
                        <button
                            className={`nav-item ${activeTab === 'profile' ? 'active' : ''}`}
                            onClick={() => setActiveTab('profile')}
                        >
                            <User size={18} /> Profilim
                        </button>
                        <button
                            className={`nav-item ${activeTab === 'addresses' ? 'active' : ''}`}
                            onClick={() => setActiveTab('addresses')}
                        >
                            <MapPin size={18} /> Adreslerim
                        </button>
                        <button
                            className="nav-item logout-item"
                            onClick={() => { logout(); window.location.href = '/'; }}
                        >
                            <LogOut size={18} /> Çıkış Yap
                        </button>
                    </nav>
                </aside>

                {/* Main Content */}
                <main className="account-content">
                    <header className="content-header">
                        <h1>
                            {activeTab === 'dashboard' ? 'Hesap Özeti' :
                                activeTab === 'orders' ? 'Sipariş Geçmişi' : 
                                activeTab === 'addresses' ? 'Adres Bilgilerim' : 'Profil Ayarları'}
                        </h1>
                        <p>
                            {activeTab === 'dashboard' ? `Hoş geldin, ${user?.fullName.split(' ')[0]}! İşte hesabındaki son aktiviteler.` :
                                activeTab === 'orders' ? 'Geçmişten bugüne tüm alışverişlerin burada listelenir.' : 
                                activeTab === 'addresses' ? 'Teslimat adreslerini buradan yönetebilirsin.' : 'Kişisel bilgilerini buradan güncelleyebilirsin.'}
                        </p>
                    </header>

                    {activeTab === 'dashboard' && renderDashboard()}
                    {activeTab === 'orders' && renderOrders()}
                    {activeTab === 'profile' && renderProfile()}
                    {activeTab === 'addresses' && renderAddresses()}
                </main>
            </div>
        </div>
    );
};

export default AccountPage;
