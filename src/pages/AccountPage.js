import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { Package, Calendar, CreditCard, ChevronRight, User, Mail, MapPin } from 'lucide-react';
import '../css/AccountPage.css';
import Spinner from '../components/Spinner';

const AccountPage = () => {
    const { user, token } = useAuth();
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);

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

    if (loading) return <Spinner fullPage={true} text="Hesap bilgileri yükleniyor..." />;

    return (
        <div className="account-page-container">
            <div className="account-header">
                <h1>Hesabım</h1>
                <p>Profil bilgilerini ve sipariş geçmişini buradan yönetebilirsin.</p>
            </div>

            <div className="account-grid">
                <section className="profile-section">
                    <div className="section-card">
                        <div className="card-header">
                            <User size={20} />
                            <h3>Profil Bilgileri</h3>
                        </div>
                        <div className="profile-info">
                            <div className="info-item">
                                <label><User size={16} /> Ad Soyad</label>
                                <span>{user?.fullName}</span>
                            </div>
                            <div className="info-item">
                                <label><Mail size={16} /> E-posta</label>
                                <span>{user?.email}</span>
                            </div>
                            <div className="info-item">
                                <label><MapPin size={16} /> Üyelik Tipi</label>
                                <span>{user?.role === 'admin' ? 'Yönetici' : 'Standart Üye'}</span>
                            </div>
                        </div>
                    </div>
                </section>

                <section className="orders-section">
                    <div className="section-card">
                        <div className="card-header">
                            <Package size={20} />
                            <h3>Geçmiş Siparişlerim</h3>
                        </div>
                        
                        {orders.length === 0 ? (
                            <div className="empty-orders">
                                <Package size={48} />
                                <p>Henüz bir siparişiniz bulunmuyor.</p>
                            </div>
                        ) : (
                            <div className="orders-table-wrapper">
                                <table className="orders-table">
                                    <thead>
                                        <tr>
                                            <th>Sipariş No</th>
                                            <th>Tarih</th>
                                            <th>Tutar</th>
                                            <th>Ürün Sayısı</th>
                                            <th>Durum</th>
                                            <th></th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {orders.map(order => (
                                            <tr key={order.OrderID}>
                                                <td className="order-id">#{order.OrderID}</td>
                                                <td>
                                                    <div className="date-cell">
                                                        <Calendar size={14} />
                                                        {new Date(order.OrderDate).toLocaleDateString('tr-TR')}
                                                    </div>
                                                </td>
                                                <td className="amount-cell">
                                                    <CreditCard size={14} />
                                                    {Number(order.TotalAmount).toFixed(2)}₺
                                                </td>
                                                <td>{order.ItemCount} Ürün</td>
                                                <td>
                                                    <span className={`status-badge ${order.Status.toLowerCase().replace('ı', 'i')}`}>
                                                        {order.Status}
                                                    </span>
                                                </td>
                                                <td className="actions">
                                                    <button className="view-details-btn">
                                                        Detay <ChevronRight size={16} />
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                </section>
            </div>
        </div>
    );
};

export default AccountPage;
