import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { ShopContext } from '../context/ShopContext';
import {
    Package, Calendar, CreditCard, ChevronRight, User,
    Mail, MapPin, LayoutDashboard, Shield, LogOut,
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

        if (token) {
            fetchOrders();
        }
    }, [token]);

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
                <div className="stat-card">
                    <div className="stat-icon-wrapper member">
                        <Star size={24} />
                    </div>
                    <div className="stat-info">
                        <h4>Toplam Harcama</h4>
                        <div className="stat-value">₺{totalSpent.toFixed(2)}</div>
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
                            <button className="nav-item" style={{ justifyContent: 'center' }} onClick={() => setActiveTab('orders')}>
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
                        <button className="nav-item">
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
                                activeTab === 'orders' ? 'Sipariş Geçmişi' : 'Profil Ayarları'}
                        </h1>
                        <p>
                            {activeTab === 'dashboard' ? `Hoş geldin, ${user?.fullName.split(' ')[0]}! İşte hesabındaki son aktiviteler.` :
                                activeTab === 'orders' ? 'Geçmişten bugüne tüm alışverişlerin burada listelenir.' : 'Kişisel bilgilerini buradan güncelleyebilirsin.'}
                        </p>
                    </header>

                    {activeTab === 'dashboard' && renderDashboard()}
                    {activeTab === 'orders' && renderOrders()}
                    {activeTab === 'profile' && renderProfile()}
                </main>
            </div>
        </div>
    );
};

export default AccountPage;
