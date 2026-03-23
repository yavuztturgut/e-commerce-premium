import React from 'react';
import { Link } from 'react-router-dom';
import { Instagram, Twitter, Facebook, Music2, MapPin, Mail, Phone, Clock, Heart } from 'lucide-react';
import '../css/Footer.css';

function Footer() {
    return (
        <footer className="site-footer">
            <div className="footer-content">
                {/* Brand Column */}
                <div className="footer-col footer-brand">
                    <Link to="/" style={{ textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                        <span className="brand-name">CERENADEN</span>
                        <span className="brand-suffix">SHOP</span>
                    </Link>
                    <p className="footer-desc">
                        Premium kozmetik ve güzellik ürünlerinde en kaliteli seçenekleri uygun fiyatlarla sunuyoruz. Güzelliğinize değer katıyoruz.
                    </p>
                    <div className="footer-social">
                        <button className="social-btn" title="Instagram"><Instagram size={18} /></button>
                        <button className="social-btn" title="Twitter"><Twitter size={18} /></button>
                        <button className="social-btn" title="Facebook"><Facebook size={18} /></button>
                        <button className="social-btn" title="TikTok"><Music2 size={18} /></button>
                    </div>
                </div>

                {/* Quick Links */}
                <div className="footer-col">
                    <h3>Hızlı Linkler</h3>
                    <ul className="footer-links">
                        <li><Link to="/">Ana Sayfa</Link></li>
                        <li><Link to="/category/makeup">Makyaj</Link></li>
                        <li><Link to="/category/skincare">Cilt Bakımı</Link></li>
                        <li><Link to="/category/accessories">Aksesuar</Link></li>
                        <li><Link to="/favorites">Favorilerim</Link></li>
                    </ul>
                </div>

                {/* Categories */}
                <div className="footer-col">
                    <h3>Kategoriler</h3>
                    <ul className="footer-links">
                        <li><Link to="/category/makeup">Ruj</Link></li>
                        <li><Link to="/category/makeup">Fondöten</Link></li>
                        <li><Link to="/category/makeup">Maskara</Link></li>
                        <li><Link to="/category/skincare">Nemlendirici</Link></li>
                        <li><Link to="/category/skincare">Serum</Link></li>
                    </ul>
                </div>

                {/* Contact */}
                <div className="footer-col">
                    <h3>İletişim</h3>
                    <div className="footer-contact-item">
                        <MapPin size={18} />
                        <span>İstanbul, Türkiye</span>
                    </div>
                    <div className="footer-contact-item">
                        <Mail size={18} />
                        <span>info@cerenaden.com</span>
                    </div>
                    <div className="footer-contact-item">
                        <Phone size={18} />
                        <span>+90 555 000 00 00</span>
                    </div>
                    <div className="footer-contact-item">
                        <Clock size={18} />
                        <span>Pzt-Cmt: 09:00 - 20:00</span>
                    </div>
                </div>
            </div>

            <div className="footer-bottom">
                <span className="footer-copyright">© 2026 CerenAden Shop. Tüm hakları saklıdır.</span>
                <span className="footer-badge">Made with <Heart size={12} fill="#ff4d4d" color="#ff4d4d" /> in İstanbul</span>
            </div>
        </footer>
    );
}

export default Footer;
