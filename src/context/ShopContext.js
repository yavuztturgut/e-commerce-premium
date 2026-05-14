import React, { createContext, useCallback, useRef, useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { notify } from '../components/Notify';
import apiClient, { withAuth } from '../api/apiClient';
import { useAuth } from './AuthContext';
import { usePersistentCart } from '../hooks/usePersistentCart';
import { useThemePreference } from '../hooks/useThemePreference';
import { mapProductFromApi, toCategoryId } from '../utils/productMapper';

export const ShopContext = createContext();

export const ShopProvider = ({ children }) => {
    const { token: authToken, user } = useAuth();
    const isNotifying = useRef(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [favorites, setFavorites] = useState([]);
    const { theme, toggleTheme } = useThemePreference();
    const {
        cart,
        isCartOpen,
        addToCart: addItemToCart,
        decreaseCartItem,
        removeFromCart,
        clearCart,
        toggleCart
    } = usePersistentCart(user);

    const fetchProducts = async () => {
        const response = await apiClient.get('/api/products');
        const mappedData = response.data.map(mapProductFromApi);
        localStorage.setItem('cerenAdenProducts', JSON.stringify(mappedData));
        return mappedData;
    };

    const { data: products = [], isLoading, refetch } = useQuery({
        queryKey: ['products'],
        queryFn: fetchProducts,
        staleTime: 1000 * 60 * 30,
        retry: 2
    });

    const fetchFavorites = useCallback(async () => {
        if (!authToken) {
            setFavorites([]);
            return;
        }

        try {
            const res = await apiClient.get('/api/favorites', withAuth(authToken));
            setFavorites(res.data.map(mapProductFromApi));
        } catch (err) {
            console.error('Favoriler yüklenemedi:', err);
        }
    }, [authToken]);

    useEffect(() => {
        fetchFavorites();
    }, [fetchFavorites]);

    useEffect(() => {
        if (products.length > 0) {
            localStorage.setItem('cerenAdenProducts', JSON.stringify(products));
        }
    }, [products]);

    const addToCart = (productToAdd) => {
        addItemToCart(productToAdd);
        if (!isNotifying.current) {
            isNotifying.current = true;
            notify.success('Ürün sepete eklendi!');
            setTimeout(() => { isNotifying.current = false; }, 2000);
        }
    };

    const toggleFavorite = async (product) => {
        if (!authToken) {
            notify.error('Lütfen önce giriş yapın!');
            return;
        }

        const isExist = favorites.find((f) => f.id === product.id);
        try {
            if (isExist) {
                await apiClient.delete(`/api/favorites/${product.id}`, withAuth(authToken));
                setFavorites(favorites.filter((f) => f.id !== product.id));
                notify.error('Favorilerden çıkarıldı.');
            } else {
                await apiClient.post('/api/favorites', { productId: product.id }, withAuth(authToken));
                setFavorites([...favorites, product]);
                notify.success('Favorilere eklendi!');
            }
        } catch (err) {
            notify.error(err.response?.data?.message || 'Bir hata oluştu.');
        }
    };

    const isFavorite = (productId) => {
        return favorites.some((f) => f.id === productId);
    };

    const productPayloadFromForm = (productData) => ({
        name: productData.name,
        brand: 'CerenAden',
        price: productData.price,
        imageLink: productData.image_link,
        description: productData.description,
        productType: productData.product_type,
        stock: 100,
        categoryId: toCategoryId(productData.category)
    });

    const addNewProduct = async (productData) => {
        if (!authToken) return false;
        try {
            const response = await apiClient.post('/api/products', productPayloadFromForm(productData), withAuth(authToken));
            if (response.status === 201) {
                notify.success('Ürün başarıyla eklendi!');
                refetch();
                return true;
            }
        } catch (err) {
            notify.error(err.response?.data?.message || 'Ürün eklenemedi.');
        }
        return false;
    };

    const updateProduct = async (id, productData) => {
        if (!authToken) return false;
        try {
            const response = await apiClient.put(`/api/products/${id}`, productPayloadFromForm(productData), withAuth(authToken));
            if (response.status === 200) {
                notify.success('Ürün güncellendi!');
                refetch();
                return true;
            }
        } catch (err) {
            notify.error(err.response?.data?.message || 'Güncelleme başarısız.');
        }
        return false;
    };

    const deleteProduct = async (id) => {
        if (!authToken) return false;
        try {
            const response = await apiClient.delete(`/api/products/${id}`, withAuth(authToken));
            if (response.status === 200) {
                refetch();
                return true;
            }
        } catch (err) {
            notify.error(err.response?.data?.message || 'Ürün silinemedi.');
        }
        return false;
    };

    const values = {
        products,
        cart,
        isCartOpen,
        loading: isLoading,
        searchTerm,
        setSearchTerm,
        addToCart,
        decreaseCartItem,
        removeFromCart,
        toggleCart,
        clearCart,
        addNewProduct,
        deleteProduct,
        updateProduct,
        theme,
        toggleTheme,
        favorites,
        toggleFavorite,
        isFavorite,
        refetchProducts: refetch,
        fetchFavorites
    };

    return <ShopContext.Provider value={values}>{children}</ShopContext.Provider>;
};
