import React, { createContext, useState, useEffect, useRef } from "react";
import { notify } from "../components/Notify";
import { useQuery } from '@tanstack/react-query';

export const ShopContext = createContext();

export const ShopProvider = ({ children }) => {
    const fetchProducts = async () => {
        const response = await fetch('http://localhost:5000/api/products');
        if (!response.ok) throw new Error('API hatası');
        const data = await response.json();

        // MSSQL'den gelen verileri frontend'in beklediği formata map edelim (opsiyonel ama uyumluluk için iyi olur)
        const categoryReverseMap = {
            1: 'makeup',
            2: 'skincare',
            3: 'accessories',
            4: 'fragrance'
        };

        const mappedData = data.map(p => ({
            ...p,
            id: p.ProductID, // MSSQL'de ProductID idi
            name: p.Name,
            price: p.Price,
            image_link: p.ImageLink,
            api_featured_image: p.ImageLink,
            product_type: p.ProductType,
            description: p.Description,
            rating: p.Rating,
            category: categoryReverseMap[p.CategoryID] || 'makeup' // Kategori eşlemesi eklendi
        }));

        localStorage.setItem('cerenAdenProducts', JSON.stringify(mappedData));
        return mappedData;
    };

    const { data: products = [], isLoading, isError, refetch } = useQuery({
        queryKey: ['products'],
        queryFn: fetchProducts,
        staleTime: 1000 * 60 * 30, // 30 dk
        retry: 2
    });

    const [cart, setCart] = useState([]);
    const [isCartOpen, setIsCartOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState("");
    const [theme, setTheme] = useState(localStorage.getItem("cerenAdenTheme") || "light");

    const [favorites, setFavorites] = useState(() => {
        const saved = localStorage.getItem("favorites");
        return saved ? JSON.parse(saved) : [];
    });
    const isNotifying = useRef(false);

    // LocalStorage sync
    useEffect(() => {
        if (products.length > 0) {
            localStorage.setItem("cerenAdenProducts", JSON.stringify(products));
        }
    }, [products]);

    useEffect(() => {
        const localCart = localStorage.getItem("cerenAdenCart");
        if (localCart) setCart(JSON.parse(localCart));
    }, []);

    const toggleTheme = () => {
        const newTheme = theme === "light" ? "dark" : "light";
        setTheme(newTheme);
        localStorage.setItem("cerenAdenTheme", newTheme);
    };

    useEffect(() => {
        localStorage.setItem("cerenAdenCart", JSON.stringify(cart));
    }, [cart]);

    useEffect(() => {
        document.body.setAttribute("data-theme", theme);
    }, [theme]);

    useEffect(() => {
        localStorage.setItem("favorites", JSON.stringify(favorites));
    }, [favorites]);

    const addToCart = (productToAdd) => {
        // Not: Stock güncellemesi şu an backend'de olmadığı için frontend-only kalabilir 
        // veya QueryClient üzerinden yerel olarak güncellenebilir. Şimdilik sadece sepete ekliyoruz.
        setCart([...cart, productToAdd]);
        if (!isNotifying.current) {
            isNotifying.current = true;
            notify.success("Ürün sepete eklendi! 🌸");
            setTimeout(() => { isNotifying.current = false; }, 2000);
        }
    };

    const removeFromCart = (indexToRemove) => {
        const updatedCart = cart.filter((_, index) => index !== indexToRemove);
        setCart(updatedCart);
        if (updatedCart.length === 0) setIsCartOpen(false);
    };

    const toggleCart = () => setIsCartOpen(!isCartOpen);

    const clearCart = () => {
        setCart([]);
        localStorage.removeItem('cerenAdenCart');
    };

    const addNewProduct = async (newProduct) => {
        try {
            // Frontend kategorilerini DB ID'lerine eşliyoruz
            const categoryMap = {
                'makeup': 1,
                'skincare': 2,
                'accessories': 3,
                'fragrance': 4
            };

            const backendProduct = {
                name: newProduct.name,
                brand: 'CerenAden',
                price: parseFloat(newProduct.price),
                imageLink: newProduct.image_link,
                description: newProduct.description || '',
                productType: newProduct.product_type,
                rating: 0.0,
                stock: 20,
                categoryId: categoryMap[newProduct.category] || 1
            };

            const response = await fetch('http://localhost:5000/api/products', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(backendProduct)
            });
            if (response.ok) {
                refetch();
                notify.success("Ürün veritabanına eklendi! ✨");
            }
        } catch (err) {
            notify.error("Ekleme hatası!");
        }
    };

    const deleteProduct = async (id) => {
        try {
            const response = await fetch(`http://localhost:5000/api/products/${id}`, {
                method: 'DELETE'
            });
            if (response.ok) {
                refetch();
                notify.error("Ürün veritabanından silindi.");
            }
        } catch (err) {
            notify.error("Silme hatası!");
        }
    };

    const updateProduct = async (id, updatedProduct) => {
        try {
            const categoryMap = {
                'makeup': 1,
                'skincare': 2,
                'accessories': 3,
                'fragrance': 4
            };

            const backendProduct = {
                name: updatedProduct.name,
                brand: updatedProduct.brand || 'CerenAden',
                price: parseFloat(updatedProduct.price),
                imageLink: updatedProduct.image_link,
                description: updatedProduct.description || '',
                productType: updatedProduct.product_type,
                rating: updatedProduct.rating || 0,
                stock: updatedProduct.stock || 20,
                categoryId: categoryMap[updatedProduct.category] || 1
            };

            const response = await fetch(`http://localhost:5000/api/products/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(backendProduct)
            });

            if (response.ok) {
                refetch();
                notify.success("Ürün başarıyla güncellendi! ✨");
                return true;
            } else {
                const errorData = await response.json();
                notify.error(`Güncelleme hatası: ${errorData.error || 'Bilinmeyen hata'}`);
                return false;
            }
        } catch (err) {
            notify.error("Sunucuya bağlanılamadı!");
            return false;
        }
    };

    const toggleFavorite = (product) => {
        const isExist = favorites.find((f) => f.id === product.id);
        if (isExist) {
            setFavorites(favorites.filter((f) => f.id !== product.id));
        } else {
            setFavorites([...favorites, product]);
        }
    };

    const isFavorite = (productId) => {
        return favorites.some((f) => f.id === productId);
    };

    const values = {
        products, cart, isCartOpen, loading: isLoading, searchTerm,
        setSearchTerm, addToCart, removeFromCart, toggleCart, clearCart,
        addNewProduct, deleteProduct, updateProduct, theme, toggleTheme, favorites, toggleFavorite, isFavorite,
        refetchProducts: refetch
    };

    return <ShopContext.Provider value={values}>{children}</ShopContext.Provider>;
};
