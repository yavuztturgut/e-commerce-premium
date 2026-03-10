import React, { createContext, useState, useEffect, useRef } from "react";
import { notify } from "../components/Notify";
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import { useAuth } from "./AuthContext";


export const ShopContext = createContext();

export const ShopProvider = ({ children }) => {
    const { token: authToken } = useAuth();

    // Fetch products logic
    const fetchProducts = async () => {
        const response = await fetch('http://localhost:5000/api/products');
        if (!response.ok) throw new Error('API hatası');

        const data = await response.json();

        const categoryReverseMap = {
            1: 'makeup',
            2: 'skincare',
            3: 'accessories',
            4: 'fragrance'
        };

        const mappedData = data.map(p => ({
            ...p,
            id: p.ProductID,
            name: p.Name,
            price: p.Price,
            image_link: p.ImageLink,
            api_featured_image: p.ImageLink,
            product_type: p.ProductType,
            description: p.Description,
            rating: p.Rating,
            category: categoryReverseMap[p.CategoryID] || 'makeup'
        }));

        localStorage.setItem('cerenAdenProducts', JSON.stringify(mappedData));
        return mappedData;
    };

    const { data: products = [], isLoading, refetch } = useQuery({
        queryKey: ['products'],
        queryFn: fetchProducts,
        staleTime: 1000 * 60 * 30,
        retry: 2
    });

    const [cart, setCart] = useState(() => {
        const localCart = localStorage.getItem("cerenAdenCart");
        return localCart ? JSON.parse(localCart) : [];
    });
    const [isCartOpen, setIsCartOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState("");
    const [theme, setTheme] = useState(localStorage.getItem("cerenAdenTheme") || "light");
    const [favorites, setFavorites] = useState([]);
    const isNotifying = useRef(false);

    // Fetch favorites from backend if logged in
    const fetchFavorites = async () => {
        if (!authToken) {
            setFavorites([]);
            return;
        }

        try {
            const res = await axios.get('http://localhost:5000/api/favorites', {
                headers: { Authorization: `Bearer ${authToken}` }
            });

            // Map backend favorites to frontend format
            const categoryReverseMap = { 1: 'makeup', 2: 'skincare', 3: 'accessories', 4: 'fragrance' };
            const mappedFavorites = res.data.map(p => ({
                ...p,
                id: p.ProductID,
                name: p.Name,
                price: p.Price,
                image_link: p.ImageLink,
                api_featured_image: p.ImageLink,
                product_type: p.ProductType,
                description: p.Description,
                rating: p.Rating,
                category: categoryReverseMap[p.CategoryID] || 'makeup'
            }));
            setFavorites(mappedFavorites);
        } catch (err) {
            console.error('Favoriler yüklenemedi:', err);
        }
    };

    useEffect(() => {
        fetchFavorites();
    }, [authToken]); // Run whenever token changes

    // LocalStorage sync for theme and products
    useEffect(() => {
        if (products.length > 0) {
            localStorage.setItem("cerenAdenProducts", JSON.stringify(products));
        }
    }, [products]);


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

    const addToCart = (productToAdd) => {
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

    const toggleFavorite = async (product) => {
        if (!authToken) {
            notify.error("Lütfen önce giriş yapın! 🔑");
            return;
        }

        const isExist = favorites.find((f) => f.id === product.id);
        try {
            if (isExist) {
                await axios.delete(`http://localhost:5000/api/favorites/${product.id}`, {
                    headers: { Authorization: `Bearer ${authToken}` }
                });
                setFavorites(favorites.filter((f) => f.id !== product.id));
                notify.error("Favorilerden çıkarıldı. 💔");
            } else {
                await axios.post('http://localhost:5000/api/favorites', { productId: product.id }, {
                    headers: { Authorization: `Bearer ${authToken}` }
                });

                setFavorites([...favorites, product]);
                notify.success("Favorilere eklendi! ❤️");
            }
        } catch (err) {
            notify.error(err.response?.data?.message || "Bir hata oluştu.");
        }
    };

    const isFavorite = (productId) => {
        return favorites.some((f) => f.id === productId);
    };

    const addNewProduct = async (productData) => {
        if (!authToken) return false;
        try {
            const response = await axios.post('http://localhost:5000/api/products', {
                name: productData.name,
                brand: 'CerenAden',
                price: productData.price,
                imageLink: productData.image_link,
                description: productData.description,
                productType: productData.product_type,
                rating: 5,
                stock: 100,
                categoryId: productData.category === 'makeup' ? 1
                    : productData.category === 'skincare' ? 2
                        : 3
            }, {
                headers: { Authorization: `Bearer ${authToken}` }
            });


            if (response.status === 201) {
                notify.success("Ürün başarıyla eklendi! 🛍️");
                refetch();
                return true;
            }
        } catch (err) {
            notify.error(err.response?.data?.message || "Ürün eklenemedi.");
            return false;
        }
    };

    const updateProduct = async (id, productData) => {
        if (!authToken) return false;
        try {
            const response = await axios.put(`http://localhost:5000/api/products/${id}`, {
                name: productData.name,
                brand: 'CerenAden',
                price: productData.price,
                imageLink: productData.image_link,
                description: productData.description,
                productType: productData.product_type,
                rating: productData.rating || 5,
                stock: 100,
                categoryId: productData.category === 'makeup' ? 1
                    : productData.category === 'skincare' ? 2
                        : 3
            }, {
                headers: { Authorization: `Bearer ${authToken}` }
            });


            if (response.status === 200) {
                notify.success("Ürün güncellendi! ✅");
                refetch();
                return true;
            }
        } catch (err) {
            notify.error(err.response?.data?.message || "Güncelleme başarısız.");
            return false;
        }
    };

    const deleteProduct = async (id) => {
        if (!authToken) return false;
        try {
            const response = await axios.delete(`http://localhost:5000/api/products/${id}`, {
                headers: { Authorization: `Bearer ${authToken}` }
            });


            if (response.status === 200) {
                refetch();
                return true;
            }
        } catch (err) {
            notify.error(err.response?.data?.message || "Ürün silinemedi.");
            return false;
        }
    };

    const values = {
        products, cart, isCartOpen, loading: isLoading, searchTerm,
        setSearchTerm, addToCart, removeFromCart, toggleCart, clearCart,
        addNewProduct, deleteProduct, updateProduct,
        theme, toggleTheme, favorites, toggleFavorite, isFavorite,
        refetchProducts: refetch,
        fetchFavorites
    };

    return <ShopContext.Provider value={values}>{children}</ShopContext.Provider>;
};
