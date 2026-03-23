import React, { useState, useContext } from 'react';
import { Link, NavLink } from 'react-router-dom';
import { Heart, ShoppingCart, Sun, Moon, User } from 'lucide-react';
import "../css/Navbar.css";
import Cart from './Cart';
import { ShopContext } from '../context/ShopContext';
import { useAuth } from '../context/AuthContext';

const Navbar = () => {
    const { cart, toggleCart, isCartOpen, removeFromCart, theme, toggleTheme, favorites } = useContext(ShopContext);
    const { user, logout } = useAuth();
    const [isMenuOpen, setIsMenuOpen] = useState(false);

    const toggleMenu = () => setIsMenuOpen(!isMenuOpen);
    const closeMenu = () => setIsMenuOpen(false);

    return (
        <>
            <header className="app-header">
                <Link to="/" className="logo-link" onClick={closeMenu}>
                    <span className="brand-name">CERENADEN</span>
                    <span className="brand-suffix">SHOP</span>
                </Link>

                <div className={`hamburger ${isMenuOpen ? 'active' : ''}`} onClick={toggleMenu}>
                    <span className="bar"></span>
                    <span className="bar"></span>
                    <span className="bar"></span>
                </div>

                <div className={`nav-menu ${isMenuOpen ? 'active' : ''}`}>
                    <div className="nav-links">
                        <NavLink to="/category/makeup" onClick={closeMenu} className={({ isActive }) => isActive ? "active-link" : ""}>Makyaj</NavLink>
                        <NavLink to="/category/skincare" onClick={closeMenu} className={({ isActive }) => isActive ? "active-link" : ""}>Cilt Bakımı</NavLink>
                        <NavLink to="/category/accessories" onClick={closeMenu} className={({ isActive }) => isActive ? "active-link" : ""}>Aksesuar</NavLink>
                    </div>

                    <div className="nav-actions">
                        <Link to="/favorites" className="fav-link-btn" onClick={closeMenu} title="Favorilerim">
                            <Heart size={20} className="nav-icon" /> <span className="fav-count">({favorites.length})</span>
                        </Link>

                        <button className="navbar-cart-btn" onClick={toggleCart}>
                            <ShoppingCart size={20} className="nav-icon" /> <span className="cart-text">Sepetim</span>
                            {cart.length > 0 && <span className="cart-badge">{cart.length}</span>}
                        </button>

                        {user?.role === 'admin' && (
                            <Link to="/admin" className="admin-btn" onClick={closeMenu}>
                                Admin
                            </Link>
                        )}

                        <button onClick={() => { toggleTheme(); closeMenu(); }} className="theme-toggle-btn" title="Tema Değiştir">
                            {theme === 'light' ? <Sun size={20} /> : <Moon size={20} />}
                        </button>

                        {user ? (
                            <div className="user-nav-info">
                                <Link to="/account" className="user-name-link" onClick={closeMenu}>
                                    <span className="user-name"><User size={20} className="nav-icon" /> {user.fullName.split(' ')[0]}</span>
                                </Link>
                                <button onClick={() => { logout(); closeMenu(); window.location.reload(); }} className="logout-btn">Çıkış</button>
                            </div>
                        ) : (
                            <Link to="/login" className="login-btn" onClick={closeMenu}>Giriş Yap</Link>
                        )}
                    </div>
                </div>

                {/* Mobile overlay */}
                <div
                    className={`nav-overlay ${isMenuOpen ? 'active' : ''}`}
                    onClick={closeMenu}
                ></div>
            </header>

            <Cart
                cartItems={cart}
                isOpen={isCartOpen}
                toggleCart={toggleCart}
                removeFromCart={removeFromCart}
            />
        </>
    );
};

export default Navbar;
