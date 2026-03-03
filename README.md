# 🚀 E-Commerce Premium Project

Modern bir alışveriş deneyimi sunan, React tabanlı, full-stack bir e-ticaret platformu. Bu proje, hem kullanıcı dostu bir arayüze hem de güçlü bir yönetim paneline (Admin Panel) sahip kapsamlı bir çözüm sunar.

![E-Commerce Hero](ecommerce_hero_banner_1772548412453.png)

## 🏗️ Proje Mimarisi

Bu uygulama iki ana bölümden oluşmaktadır:
- **Frontend:** React 19 ve modern UI kütüphaneleri kullanılarak geliştirildi.
- **Backend:** Node.js, Express ve MSSQL veritabanı ile yönetilen sağlam bir API.

### 🖼️ Öne Çıkan Özellikler

- **Gelişmiş Ürün Listeleme:** Kategorilere ayrılmış ve skor sistemine (Rating) sahip ürünler.
- **Dinamik Sepet Yönetimi:** Ürün ekleme, adet güncelleme ve sepet tutarı hesaplama.
- **Favori Sistemi:** Beğenilen ürünleri kaydetme özelliği.
- **Ödeme Süreci (Checkout):** Adım adım sipariş tamamlama akışı.
- **Ürün Değerlendirme:** Yorum ve yıldız puanı verme sistemi.
- **Yönetim Paneli (Admin):** Ürün ekleme, sipariş takibi ve kullanıcı izleme.
- **Responsive Tasarım:** Mobil, tablet ve masaüstü cihazlarla tam uyumlu.
- **Premium UI/UX:** Glassmorphism etkileri, şık kaydırıcılar (Swiper) ve tatlı bildirimler (SweetAlert2).

---

## 🛠️ Kullanılan Teknolojiler

### Frontend
- **React 19:** En güncel React sürümü.
- **React Router Dom (v7):** Gelişmiş yönlendirme.
- **TanStack React Query:** Güçlü veri yakalama (fetch) ve önbellekleme.
- **Swiper:** Modern ürün ve banner slider'ları.
- **SweetAlert2 & React Toastify:** Şık bildirim ve kullanıcı etkileşimleri.
- **Vanilla CSS:** Özelleştirilmiş, hızlı ve temiz bir tasarım sistemi.

### Backend
- **Node.js & Express:** Hızlı ve esnek API yapısı.
- **MSSQL (Tedious):** Kurumsal seviye veritabanı yönetimi.
- **Dotenv:** Güvenli çevresel değişken yönetimi.
- **CORS:** Güvenli kökenler arası kaynak paylaşımı.

---

## 🚀 Kurulum ve Çalıştırma

### 1. Depoyu Klonlayın
```bash
git clone https://github.com/yavuztturgut/e-commerce-premium.git
cd e-commerce-premium
```

### 2. Backend Kurulumu
```bash
cd backend
npm install
```
`.env` dosyanızı yapılandırın (MSSQL bağlantı bilgilerini ekleyin):
```env
DB_USER=your_user
DB_PASSWORD=your_password
DB_SERVER=your_server
DB_DATABASE=your_db
PORT=5000
```
Sunucuyu başlatın:
```bash
npm start
```

### 3. Frontend Kurulumu
```bash
cd ..
npm install
npm start
```

Uygulama varsayılan olarak `http://localhost:3000` adresinde çalışacaktır.

---

## 📂 Proje Yapısı

```text
├── backend/            # Express Sunucusu ve Veritabanı Mantığı
│   ├── db.js           # MSSQL Bağlantı Yapılandırması
│   ├── server.js       # API Rotaları ve Ana Sunucu
│   └── migrate.js      # Veritabanı Migrasyon Yazıları
├── public/             # Statik Varlıklar
└── src/                # React Kaynak Kodları
    ├── components/     # Yeniden Kullanılabilir Bileşenler
    ├── context/        # Global State (ShopContext)
    ├── css/            # Estetik Stil Dosyaları
    ├── pages/          # Ana Sayfalar
    └── assets/         # Görseller ve Semboller
```

---

## 🤝 Katkıda Bulunun

Katkı vermek isterseniz lütfen bir `Pull Request` açın veya bir `Issue` oluşturun. Her türlü iyileştirme önerisine açığız!

---

## 📜 Lisans

Bu proje MIT Lisansı ile lisanslanmıştır.

---

*Geliştiren: [Yavuz Turgut](https://github.com/yavuztturgut)*
