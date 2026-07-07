import React, { useState, useContext, useEffect, useCallback } from 'react';
import { PlusCircle, Package, Edit, TrendingUp, Users, ShoppingBag, DollarSign, LayoutDashboard, Calendar, X, ImagePlus, Search, SlidersHorizontal } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import DatePicker, { registerLocale } from "react-datepicker";
import { tr } from 'date-fns/locale/tr';
import { subDays } from 'date-fns';
import "react-datepicker/dist/react-datepicker.css";
import '../css/AdminPanel.css';
import { notify } from "./Notify";
import { ShopContext } from '../context/ShopContext';
import { useAuth } from '../context/AuthContext';
import Swal from 'sweetalert2';
import apiClient from '../api/apiClient';
import Drawer from './ui/Drawer';
import Modal from './ui/Modal';
import FormField from './ui/FormField';
import { EmptyState, ErrorState, Skeleton } from './ui/StateViews';

registerLocale('tr', tr);

const categoryLabelsById = {
    1: 'makeup',
    2: 'skincare',
    3: 'accessories',
    4: 'fragrance'
};

const mapProductForAdmin = (product) => ({
    ...product,
    id: product.ProductID,
    name: product.Name,
    price: product.Price,
    image_link: product.ImageLink,
    api_featured_image: product.ImageLink,
    product_type: product.ProductType,
    description: product.Description,
    rating: product.Rating,
    stock: Number(product.Stock) || 0,
    isActive: product.IsActive === undefined || product.IsActive === null ? true : Boolean(product.IsActive),
    deletedAt: product.DeletedAt,
    reviewCount: product.ReviewCount || 0,
    category: categoryLabelsById[product.CategoryID] || 'makeup'
});

function AdminPanel() {
    const { addNewProduct, deleteProduct, deactivateProduct, activateProduct, updateProduct, theme } = useContext(ShopContext);
    const { user } = useAuth();

    const [activeTab, setActiveTab] = useState('dashboard');
    const [stats, setStats] = useState(null);
    const [loadingStats, setLoadingStats] = useState(true);
    // Tarih aralığını localStorage'dan yükle veya varsayılan (7 gün) yap
    const [dateRange, setDateRange] = useState(() => {
        const saved = localStorage.getItem('adminDateRange');
        if (saved) {
            try {
                const parsed = JSON.parse(saved);
                return {
                    start: new Date(parsed.start),
                    end: new Date(parsed.end)
                };
            } catch (e) {
                localStorage.removeItem('adminDateRange');
            }
        }
        return {
            start: subDays(new Date(), 7),
            end: new Date()
        };
    });

    // Tarih değiştiğinde localStorage'a kaydet
    useEffect(() => {
        localStorage.setItem('adminDateRange', JSON.stringify(dateRange));
    }, [dateRange]);

    const [editingProduct, setEditingProduct] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isCreateDrawerOpen, setIsCreateDrawerOpen] = useState(false);
    const [adminProducts, setAdminProducts] = useState([]);
    const [formData, setFormData] = useState({
        name: '', price: '', category: 'makeup', product_type: 'lipstick',
        description: '', image_link: '', stock: 20
    });
    const [uploadingImageTarget, setUploadingImageTarget] = useState(null);
    const [productSearchTerm, setProductSearchTerm] = useState('');
    const [productCategoryFilter, setProductCategoryFilter] = useState('all');
    const [productTypeFilter, setProductTypeFilter] = useState('all');
    const [createErrors, setCreateErrors] = useState({});
    const [editErrors, setEditErrors] = useState({});
    const [editingStockId, setEditingStockId] = useState(null);
    const [stockDraft, setStockDraft] = useState('');
    const [savingStockId, setSavingStockId] = useState(null);

    const formatDate = (date) => {
        if (!date) return '';
        const d = new Date(date);
        return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    };

    useEffect(() => {
        const fetchStats = async () => {
            if (!user) return;
            try {
                setLoadingStats(true);
                const res = await apiClient.get('/api/admin/stats', {
                    params: {
                        startDate: formatDate(dateRange.start),
                        endDate: formatDate(dateRange.end)
                    }
                });
                setStats(res.data);
            } catch (err) {
                setStats(null);
            } finally {
                setLoadingStats(false);
            }
        };

        if (activeTab === 'dashboard') {
            fetchStats();
        }
    }, [user, activeTab, dateRange]);

    const COLORS = ['#e91e63', '#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#6366f1'];

    const fetchAdminProducts = useCallback(async () => {
        if (!user) return;
        try {
            const response = await apiClient.get('/api/products/admin/all');
            setAdminProducts(response.data.map(mapProductForAdmin));
        } catch (err) {
            setAdminProducts([]);
        }
    }, [user]);

    useEffect(() => {
        if (activeTab === 'products') {
            fetchAdminProducts();
        }
    }, [activeTab, fetchAdminProducts]);

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

    const categoryLabels = {
        makeup: 'Makyaj',
        skincare: 'Cilt Bakımı',
        accessories: 'Aksesuar'
    };

    const getProductTypeLabel = (category, productType) => {
        const option = categoryOptions[category]?.find((item) => item.value === productType);
        return option?.label || productType || 'Tür yok';
    };

    const productTypeFilterOptions = (() => {
        if (productCategoryFilter !== 'all') {
            return categoryOptions[productCategoryFilter] || [];
        }

        const uniqueTypes = new Map();
        adminProducts.forEach((product) => {
            if (!product.product_type) return;
            uniqueTypes.set(product.product_type, {
                value: product.product_type,
                label: getProductTypeLabel(product.category, product.product_type)
            });
        });

        return Array.from(uniqueTypes.values()).sort((a, b) => a.label.localeCompare(b.label, 'tr'));
    })();

    const normalizedSearch = productSearchTerm.trim().toLocaleLowerCase('tr-TR');
    const filteredProducts = adminProducts.filter((product) => {
        const category = product.category || '';
        const productType = product.product_type || '';
        const name = product.name?.toLocaleLowerCase('tr-TR') || '';
        const categoryLabel = categoryLabels[category]?.toLocaleLowerCase('tr-TR') || '';
        const typeLabel = getProductTypeLabel(category, productType).toLocaleLowerCase('tr-TR');

        const matchesSearch = !normalizedSearch
            || name.includes(normalizedSearch)
            || categoryLabel.includes(normalizedSearch)
            || typeLabel.includes(normalizedSearch);
        const matchesCategory = productCategoryFilter === 'all' || category === productCategoryFilter;
        const matchesType = productTypeFilter === 'all' || productType === productTypeFilter;

        return matchesSearch && matchesCategory && matchesType;
    });

    useEffect(() => {
        setProductTypeFilter('all');
    }, [productCategoryFilter]);

    const validateProductForm = (productData) => {
        const errors = {};
        if (!productData.name?.trim()) errors.name = 'Ürün adı zorunlu.';
        if (!productData.price || Number(productData.price) <= 0) errors.price = 'Geçerli bir fiyat girin.';
        if (!Number.isInteger(Number(productData.stock)) || Number(productData.stock) < 0) errors.stock = 'Stok 0 veya daha büyük tam sayı olmalı.';
        if (!productData.category) errors.category = 'Kategori seçin.';
        if (!productData.product_type) errors.product_type = 'Ürün türü seçin.';
        if (productData.image_link && !/^https?:\/\//i.test(productData.image_link)) {
            errors.image_link = 'URL http:// veya https:// ile başlamalı.';
        }
        return errors;
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setCreateErrors((current) => ({ ...current, [name]: '' }));
        if (name === 'category') {
            const firstOptionOfNewCategory = categoryOptions[value][0].value;
            setFormData({ ...formData, [name]: value, product_type: firstOptionOfNewCategory });
        } else {
            setFormData({ ...formData, [name]: value });
        }
    };

    const resetProductForm = () => {
        setFormData({
            name: '', price: '', category: 'makeup', product_type: 'lipstick',
            description: '', image_link: '', stock: 20
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        const errors = validateProductForm(formData);
        setCreateErrors(errors);
        if (Object.keys(errors).length > 0) return;

        const productToSend = {
            ...formData, id: Date.now(), price: parseFloat(formData.price)
        };

        const success = await addNewProduct(productToSend);
        if (success) {
            fetchAdminProducts();
            resetProductForm();
            setIsCreateDrawerOpen(false);
        }
    };

    const readFileAsDataUrl = (file) => new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = () => reject(new Error('Resim okunamadı.'));
        reader.readAsDataURL(file);
    });

    const handleImageFileChange = async (e, target) => {
        const file = e.target.files?.[0];
        e.target.value = '';
        if (!file) return;

        if (!file.type.startsWith('image/')) {
            notify.error('Lütfen geçerli bir resim dosyası seçin.');
            return;
        }

        if (file.size > 5 * 1024 * 1024) {
            notify.error('Resim boyutu en fazla 5 MB olmalı.');
            return;
        }

        try {
            setUploadingImageTarget(target);
            const dataUrl = await readFileAsDataUrl(file);
            const response = await apiClient.post('/api/products/upload-image', {
                fileName: file.name,
                dataUrl
            });

            if (target === 'edit') {
                setEditingProduct((current) => ({ ...current, image_link: response.data.imageUrl }));
            } else {
                setFormData((current) => ({ ...current, image_link: response.data.imageUrl }));
            }
            notify.success('Resim yüklendi.');
        } catch (err) {
            notify.error(err.response?.data?.message || 'Resim yüklenemedi.');
        } finally {
            setUploadingImageTarget(null);
        }
    };

    const handleEditClick = (product) => {
        setEditingProduct({ ...product });
        setIsModalOpen(true);
    };

    const handleUpdateSubmit = async (e) => {
        e.preventDefault();
        const errors = validateProductForm(editingProduct);
        setEditErrors(errors);
        if (Object.keys(errors).length > 0) return;

        const success = await updateProduct(editingProduct.id, editingProduct);
        if (success) {
            fetchAdminProducts();
            setIsModalOpen(false);
        }
    };

    const handleEditChange = (e) => {
        const { name, value } = e.target;
        setEditErrors((current) => ({ ...current, [name]: '' }));
        if (name === 'category') {
            const firstOptionOfNewCategory = categoryOptions[value][0].value;
            setEditingProduct({ ...editingProduct, [name]: value, product_type: firstOptionOfNewCategory });
        } else {
            setEditingProduct({ ...editingProduct, [name]: value });
        }
    };

    const startStockEdit = (product) => {
        setEditingStockId(product.id);
        setStockDraft(String(Number(product.stock) || 0));
    };

    const cancelStockEdit = () => {
        setEditingStockId(null);
        setStockDraft('');
    };

    const saveStockEdit = async (product) => {
        const nextStock = Number(stockDraft);
        if (!Number.isInteger(nextStock) || nextStock < 0) {
            notify.error('Stok 0 veya daha büyük tam sayı olmalı.');
            setStockDraft(String(Number(product.stock) || 0));
            return;
        }

        if (nextStock === Number(product.stock || 0)) {
            cancelStockEdit();
            return;
        }

        setSavingStockId(product.id);
        const success = await updateProduct(product.id, { ...product, stock: nextStock });
        if (success) {
            setAdminProducts((current) => current.map((item) => (
                item.id === product.id ? { ...item, stock: nextStock } : item
            )));
            fetchAdminProducts();
        }
        setSavingStockId(null);
        cancelStockEdit();
    };

    const handleDeactivateClick = (product) => {
        const isDarkMode = theme === 'dark';
        Swal.fire({
            title: 'Emin misiniz?',
            text: "Bu ürün mağazada görünmeyecek ama sipariş geçmişi korunacak.",
            icon: 'warning',
            showCancelButton: true,
            cancelButtonText: 'Vazgeç',
            confirmButtonText: 'Pasife Al',
            reverseButtons: true,
            background: isDarkMode ? '#16213e' : '#ffffff',
            color: isDarkMode ? '#e2e8f0' : '#1a1a2e',
            iconColor: '#9ca3af',
            confirmButtonColor: '#9ca3af',
            cancelButtonColor: '#e5e7eb',
            customClass: {
                cancelButton: 'swal-soft-cancel'
            },
        }).then(async (result) => {
            if (result.isConfirmed) {
                const success = await deactivateProduct(product.id);
                if (success) fetchAdminProducts();
            }
        });
    };

    const handleActivateClick = async (product) => {
        const success = await activateProduct(product.id);
        if (success) fetchAdminProducts();
    };

    const handleDeleteClick = (product) => {
        const isDarkMode = theme === 'dark';
        Swal.fire({
            title: 'Ürün silinsin mi?',
            text: "Bu işlem geri alınamaz. Ürün sipariş geçmişinde kullanıldıysa sistem silmeye izin vermez.",
            icon: 'warning',
            showCancelButton: true,
            cancelButtonText: 'Vazgeç',
            confirmButtonText: 'Sil',
            reverseButtons: true,
            background: isDarkMode ? '#16213e' : '#ffffff',
            color: isDarkMode ? '#e2e8f0' : '#1a1a2e',
            iconColor: '#ef4444',
            confirmButtonColor: '#ef4444',
            cancelButtonColor: '#e5e7eb',
            customClass: {
                cancelButton: 'swal-soft-cancel'
            },
        }).then(async (result) => {
            if (result.isConfirmed) {
                const success = await deleteProduct(product.id);
                if (!success) return;
                fetchAdminProducts();
                Swal.fire({
                    title: 'Silindi!',
                    text: 'Ürün kökten silindi.',
                    icon: 'success',
                    confirmButtonColor: '#e91e63',
                    background: isDarkMode ? '#16213e' : '#ffffff',
                    color: isDarkMode ? '#e2e8f0' : '#1a1a2e'
                });
            }
        });
    };

    const renderImagePreview = (imageUrl, altText = 'Ürün önizleme', target = 'create') => (
        <label className={`product-image-preview ${imageUrl ? '' : 'is-empty'}`}>
            {imageUrl ? (
                <img
                    src={imageUrl}
                    alt={altText}
                    onError={(e) => {
                        e.currentTarget.style.display = 'none';
                        e.currentTarget.parentElement.classList.add('is-empty');
                    }}
                />
            ) : null}
            <div className="image-preview-empty">
                <ImagePlus size={18} />
                <span>{uploadingImageTarget === target ? 'Yükleniyor' : 'Resim seç'}</span>
            </div>
            <input
                type="file"
                accept="image/png,image/jpeg,image/webp,image/gif"
                onChange={(e) => handleImageFileChange(e, target)}
                disabled={uploadingImageTarget === target}
            />
        </label>
    );

    return (
        <div className="admin-container">
            <div className="admin-toolbar">
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

                {activeTab === 'dashboard' && (
                    <div className="dashboard-filters">
                        <div className="date-picker-group premium-datepicker">
                            <Calendar size={18} className="calendar-icon" />
                            <div className="datepicker-input-wrapper">
                                <DatePicker
                                    selected={dateRange.start}
                                    onChange={(date) => {
                                        if (date > dateRange.end) {
                                            setDateRange({ start: date, end: date });
                                        } else {
                                            setDateRange({ ...dateRange, start: date });
                                        }
                                    }}
                                    selectsStart
                                    startDate={dateRange.start}
                                    endDate={dateRange.end}
                                    maxDate={dateRange.end}
                                    dateFormat="dd.MM.yyyy"
                                    locale="tr"
                                    className="custom-datepicker"
                                />
                                <span className="datepicker-sep">-</span>
                                <DatePicker
                                    selected={dateRange.end}
                                    onChange={(date) => setDateRange({...dateRange, end: date})}
                                    selectsEnd
                                    startDate={dateRange.start}
                                    endDate={dateRange.end}
                                    minDate={dateRange.start}
                                    dateFormat="dd.MM.yyyy"
                                    locale="tr"
                                    className="custom-datepicker"
                                />
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {activeTab === 'dashboard' ? (
                <div className="dashboard-grid">
                    {loadingStats ? (
                        <div className="loading-stats">
                            <Skeleton lines={4} />
                        </div>
                    ) : !stats ? (
                        <ErrorState
                            title="Dashboard verileri alınamadı"
                            description="Tarih aralığını değiştirip tekrar deneyebilirsiniz."
                        />
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
                                    <div className="chart-header">
                                        <h3><TrendingUp size={20} /> Satış Trendi</h3>
                                        <span className="chart-period">
                                            {dateRange.start.toLocaleDateString('tr-TR')} - {dateRange.end.toLocaleDateString('tr-TR')}
                                        </span>
                                    </div>
                                    <div className="chart-container-wrapper">
                                        <ResponsiveContainer width="100%" height={300}>
                                            <AreaChart data={stats?.revenueData}>
                                                <defs>
                                                    <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                                                        <stop offset="5%" stopColor="#e91e63" stopOpacity={0.3}/>
                                                        <stop offset="95%" stopColor="#e91e63" stopOpacity={0}/>
                                                    </linearGradient>
                                                </defs>
                                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border-color)" />
                                                <XAxis 
                                                    dataKey="date" 
                                                    axisLine={false}
                                                    tickLine={false}
                                                    tick={{fill: 'var(--text-muted)', fontSize: 11}}
                                                    dy={10}
                                                />
                                                <YAxis 
                                                    axisLine={false}
                                                    tickLine={false}
                                                    tick={{fill: 'var(--text-muted)', fontSize: 11}}
                                                />
                                                <Tooltip 
                                                    contentStyle={{ 
                                                        backgroundColor: 'var(--card-bg)', 
                                                        borderRadius: '12px',
                                                        border: '1px solid var(--border-color)',
                                                        boxShadow: 'var(--shadow-lg)'
                                                    }} 
                                                />
                                                <Area 
                                                    type="monotone" 
                                                    dataKey="revenue" 
                                                    stroke="#e91e63" 
                                                    strokeWidth={3} 
                                                    fillOpacity={1} 
                                                    fill="url(#colorRev)" 
                                                    dot={false}
                                                    activeDot={{ r: 6, strokeWidth: 0, fill: '#e91e63' }}
                                                />
                                            </AreaChart>
                                        </ResponsiveContainer>
                                    </div>
                                </div>

                                <div className="chart-card category-chart">
                                    <h3>Kategori Dağılımı</h3>
                                    <div className="chart-container-wrapper pie-wrapper">
                                        <ResponsiveContainer width="100%" height="100%">
                                            <PieChart>
                                                <Pie
                                                    data={stats?.categoryData}
                                                    innerRadius={70}
                                                    outerRadius={90}
                                                    paddingAngle={8}
                                                    dataKey="value"
                                                    stroke="none"
                                                >
                                                    {stats?.categoryData?.map((entry, index) => (
                                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                                    ))}
                                                </Pie>
                                                <Tooltip 
                                                    contentStyle={{ 
                                                        backgroundColor: 'var(--card-bg)', 
                                                        borderRadius: '12px',
                                                        border: '1px solid var(--border-color)'
                                                    }} 
                                                />
                                            </PieChart>
                                        </ResponsiveContainer>
                                        <div className="pie-center-label">
                                            <span className="label-count">{stats?.kpis?.totalProducts || 0}</span>
                                            <span className="label-text">Toplam</span>
                                        </div>
                                    </div>
                                    <div className="custom-legend">
                                        {stats?.categoryData?.map((entry, index) => (
                                            <div key={index} className="legend-item">
                                                <span className="legend-color" style={{ backgroundColor: COLORS[index % COLORS.length] }}></span>
                                                <span className="legend-name">{entry.name}</span>
                                                <span className="legend-value">{entry.value}</span>
                                            </div>
                                        ))}
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
                <div className="admin-content products-admin-content">
                    <div className="admin-section list-section">
                        <button className="new-product-btn products-top-action" onClick={() => setIsCreateDrawerOpen(true)}>
                            <PlusCircle size={18} /> Yeni Ürün
                        </button>
                        <h2><Package size={24} className="section-icon" /> Ürünler ({filteredProducts.length})</h2>
                        <div className="product-admin-filters">
                            <div className="product-search-field">
                                <Search size={17} />
                                <input
                                    type="search"
                                    value={productSearchTerm}
                                    onChange={(e) => setProductSearchTerm(e.target.value)}
                                    placeholder="Ürün adı veya tür ara"
                                />
                            </div>
                            <div className="product-filter-field">
                                <SlidersHorizontal size={16} />
                                <select
                                    value={productCategoryFilter}
                                    onChange={(e) => setProductCategoryFilter(e.target.value)}
                                >
                                    <option value="all">Tüm kategoriler</option>
                                    <option value="makeup">Makyaj</option>
                                    <option value="skincare">Cilt Bakımı</option>
                                    <option value="accessories">Aksesuar</option>
                                </select>
                            </div>
                            <div className="product-filter-field">
                                <select
                                    value={productTypeFilter}
                                    onChange={(e) => setProductTypeFilter(e.target.value)}
                                >
                                    <option value="all">Tüm türler</option>
                                    {productTypeFilterOptions.map((option) => (
                                        <option key={option.value} value={option.value}>
                                            {option.label}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </div>
                        <div className="product-table-wrapper">
                            <table className="product-table">
                                <thead>
                                    <tr>
                                        <th>Resim</th>
                                        <th>Ad / Kategori</th>
                                        <th>Fiyat</th>
                                        <th>Stok</th>
                                        <th>Durum</th>
                                        <th>İşlem</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredProducts.map((p) => (
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
                                                <div className="product-name-cell">{p.name || "İsimsiz"}</div>
                                                <div className="product-meta-cell">
                                                    <span className="product-category-pill">{categoryLabels[p.category] || p.category || 'Kategori yok'}</span>
                                                    <span className="product-type-pill">{getProductTypeLabel(p.category, p.product_type)}</span>
                                                </div>
                                            </td>
                                            <td>
                                                <span className="product-price-cell">₺{Number(p.price).toFixed(2)}</span>
                                            </td>
                                            <td>
                                                {editingStockId === p.id ? (
                                                    <input
                                                        className="stock-inline-input"
                                                        type="number"
                                                        min="0"
                                                        step="1"
                                                        value={stockDraft}
                                                        autoFocus
                                                        disabled={savingStockId === p.id}
                                                        onChange={(e) => setStockDraft(e.target.value)}
                                                        onBlur={(e) => {
                                                            if (e.currentTarget.dataset.cancelled === 'true') return;
                                                            saveStockEdit(p);
                                                        }}
                                                        onKeyDown={(e) => {
                                                            if (e.key === 'Enter') e.currentTarget.blur();
                                                            if (e.key === 'Escape') {
                                                                e.currentTarget.dataset.cancelled = 'true';
                                                                cancelStockEdit();
                                                            }
                                                        }}
                                                    />
                                                ) : (
                                                    <button
                                                        type="button"
                                                        className={`stock-cell stock-edit-trigger ${Number(p.stock) <= 0 ? 'is-empty' : ''}`}
                                                        onClick={() => startStockEdit(p)}
                                                        title="Stok düzenle"
                                                    >
                                                        {Number(p.stock) || 0}
                                                    </button>
                                                )}
                                            </td>
                                            <td>
                                                <span className={`product-status-pill ${p.isActive ? 'is-active' : 'is-passive'}`}>
                                                    {p.isActive ? 'Aktif' : 'Pasif'}
                                                </span>
                                            </td>
                                            <td>
                                                <div className="action-btns">
                                                    <button className="edit-btn-small" onClick={() => handleEditClick(p)}>Düzenle</button>
                                                    {p.isActive ? (
                                                        <button className="passive-btn" onClick={() => handleDeactivateClick(p)}>Pasife Al</button>
                                                    ) : (
                                                        <button className="activate-btn" onClick={() => handleActivateClick(p)}>Aktif Et</button>
                                                    )}
                                                    <button className="delete-btn" onClick={() => handleDeleteClick(p)}>Sil</button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                    {filteredProducts.length === 0 && (
                                        <tr>
                                            <td colSpan="6" className="product-empty-row">
                                                <EmptyState
                                                    icon={<Package size={34} />}
                                                    title="Ürün bulunamadı"
                                                    description="Arama veya filtre seçimini değiştirerek tekrar deneyin."
                                                />
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            )}

            <Drawer
                isOpen={isCreateDrawerOpen}
                onClose={() => setIsCreateDrawerOpen(false)}
                ariaLabel="Yeni ürün"
            >
                        <div className="drawer-header">
                            <div>
                                <h2><PlusCircle size={22} className="section-icon" /> Yeni Ürün</h2>
                                <p>Mağazaya eklenecek ürün bilgilerini girin.</p>
                            </div>
                            <button className="drawer-close-btn" onClick={() => setIsCreateDrawerOpen(false)} aria-label="Kapat">
                                <X size={20} />
                            </button>
                        </div>

                        <form className="drawer-form" onSubmit={handleSubmit}>
                            <FormField label="Ürün Adı" error={createErrors.name} required>
                                <input type="text" name="name" placeholder="Ürün adı" value={formData.name} onChange={handleChange} />
                            </FormField>

                            <div className="drawer-grid">
                                <FormField label="Fiyat" error={createErrors.price} required>
                                    <input type="number" name="price" placeholder="0.00" value={formData.price} onChange={handleChange} />
                                </FormField>
                                <FormField label="Stok" error={createErrors.stock} required>
                                    <input type="number" name="stock" min="0" step="1" placeholder="20" value={formData.stock} onChange={handleChange} />
                                </FormField>
                            </div>

                            <div className="drawer-grid">
                                <FormField label="Kategori" error={createErrors.category} required>
                                    <select name="category" value={formData.category} onChange={handleChange}>
                                        <option value="makeup">Makyaj</option>
                                        <option value="skincare">Cilt Bakımı</option>
                                        <option value="accessories">Aksesuar</option>
                                    </select>
                                </FormField>
                            </div>

                            <FormField label="Ürün Türü" error={createErrors.product_type} required>
                                <select name="product_type" value={formData.product_type} onChange={handleChange}>
                                    {categoryOptions[formData.category].map((option) => (
                                        <option key={option.value} value={option.value}>
                                            {option.label}
                                        </option>
                                    ))}
                                </select>
                            </FormField>

                            <FormField label="Resim URL" error={createErrors.image_link}>
                                <div className="image-field-layout">
                                    <div className="image-field-controls">
                                        <input type="text" name="image_link" placeholder="https://..." value={formData.image_link} onChange={handleChange} />
                                    </div>
                                    {renderImagePreview(formData.image_link, formData.name || 'Yeni urun', 'create')}
                                </div>
                            </FormField>

                            <FormField label="Açıklama">
                                <textarea name="description" placeholder="Kısa ürün açıklaması" value={formData.description} onChange={handleChange} rows="4"></textarea>
                            </FormField>

                            <div className="drawer-actions">
                                <button type="button" className="cancel-btn" onClick={() => setIsCreateDrawerOpen(false)}>
                                    Vazgeç
                                </button>
                                <button type="submit" className="save-btn">
                                    Mağazaya Ekle
                                </button>
                            </div>
                        </form>
            </Drawer>

            {/* Edit Modal */}
            {editingProduct && (
            <Modal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                panelClassName="modal-content admin-section"
                ariaLabel="Ürün düzenle"
            >
                        <button className="modal-close-x" onClick={() => setIsModalOpen(false)}>&times;</button>
                        <h2><Edit size={24} className="section-icon" /> Ürünü Düzenle</h2>
                        <form onSubmit={handleUpdateSubmit}>
                            <FormField label="Ürün Adı" error={editErrors.name} required>
                                <input
                                    type="text"
                                    name="name"
                                    value={editingProduct.name}
                                    onChange={handleEditChange}
                                />
                            </FormField>

                            <div className="row">
                                <FormField label="Fiyat (₺)" error={editErrors.price} className="flex-1" required>
                                    <input
                                        type="number"
                                        name="price"
                                        value={editingProduct.price}
                                        onChange={handleEditChange}
                                    />
                                </FormField>
                                <FormField label="Stok" error={editErrors.stock} className="flex-1" required>
                                    <input
                                        type="number"
                                        min="0"
                                        step="1"
                                        name="stock"
                                        value={editingProduct.stock}
                                        onChange={handleEditChange}
                                    />
                                </FormField>
                            </div>

                            <div className="row">
                                <FormField label="Kategori" error={editErrors.category} className="flex-1" required>
                                    <select
                                        name="category"
                                        value={editingProduct.category}
                                        onChange={handleEditChange}
                                    >
                                        <option value="makeup">Makyaj</option>
                                        <option value="skincare">Cilt Bakımı</option>
                                        <option value="accessories">Aksesuar</option>
                                    </select>
                                </FormField>
                                <FormField label="Ürün Türü" error={editErrors.product_type} className="flex-1" required>
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
                                </FormField>
                            </div>

                            <FormField label="Resim URL" error={editErrors.image_link}>
                                <div className="image-field-layout">
                                    <div className="image-field-controls">
                                        <input
                                            type="text"
                                            name="image_link"
                                            value={editingProduct.image_link}
                                            onChange={handleEditChange}
                                        />
                                    </div>
                                    {renderImagePreview(editingProduct.image_link, editingProduct.name || 'Urun', 'edit')}
                                </div>
                            </FormField>

                            <FormField label="Açıklama">
                                <textarea
                                    name="description"
                                    value={editingProduct.description}
                                    onChange={handleEditChange}
                                    rows="4"
                                ></textarea>
                            </FormField>

                            <div className="modal-actions">
                                <button type="button" className="cancel-btn" onClick={() => setIsModalOpen(false)}>
                                    Vazgeç
                                </button>
                                <button type="submit" className="save-btn">
                                    Değişiklikleri Kaydet
                                </button>
                            </div>
                        </form>
            </Modal>
            )}
        </div>
    );
}

export default AdminPanel;
