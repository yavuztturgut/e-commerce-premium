import React, { createContext, useState, useEffect, useRef } from "react";
import { notify } from "../components/Notify";
import { useQuery } from '@tanstack/react-query';

export const ShopContext = createContext();

export const ShopProvider = ({ children }) => {
    const { data: remoteProducts, isLoading: loading } = useQuery({
        queryKey: ['maybellineProducts'],
        queryFn: async () => {
            const res = await fetch("https://makeup-api.herokuapp.com/api/v1/products.json?brand=maybelline");
            const data = await res.json();
            return data.map((item) => ({
                ...item,
                price: Number(item.price) || 10,
                stock: 20,
                category: 'makeup'
            }));
        },
        staleTime: 1000 * 60 * 10,
    });

    const [products, setProducts] = useState([]);
    const [cart, setCart] = useState([]);
    const [isCartOpen, setIsCartOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState("");
    const [theme, setTheme] = useState(localStorage.getItem("cerenAdenTheme") || "light");

    const [favorites, setFavorites] = useState(() => {
        const saved = localStorage.getItem("favorites");
        return saved ? JSON.parse(saved) : [];
    });
    const isNotifying = useRef(false);

    useEffect(() => {
        if (remoteProducts) {
            localStorage.setItem("cerenAdenProducts", JSON.stringify(remoteProducts));
            setProducts(remoteProducts);
        }
    }, [remoteProducts]);

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
        const updatedProducts = products.map((p) => {
            if (p.id === productToAdd.id) return { ...p, stock: (p.stock || 20) - 1 };
            return p;
        });
        setProducts(updatedProducts);
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

    const addNewProduct = (newProduct) => {
        const productWithId = { ...newProduct, id: Date.now() };
        const updatedList = [productWithId, ...products];
        setProducts(updatedList);
        localStorage.setItem("cerenAdenProducts", JSON.stringify(updatedList));
        notify.success("Ürün eklendi! ✨");
    };

    const deleteProduct = (id) => {
        const updatedList = products.filter(p => p.id !== id);
        setProducts(updatedList);
        localStorage.setItem("cerenAdenProducts", JSON.stringify(updatedList));
        notify.error("Ürün silindi.");
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
        products, cart, isCartOpen, loading, searchTerm,
        setSearchTerm, addToCart, removeFromCart, toggleCart, clearCart,
        addNewProduct, deleteProduct, theme, toggleTheme, favorites, toggleFavorite, isFavorite
    };

    return <ShopContext.Provider value={values}>{children}</ShopContext.Provider>;
};
