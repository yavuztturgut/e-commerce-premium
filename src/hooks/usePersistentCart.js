import { useEffect, useRef, useState } from 'react';

const getCartStorageKey = (user) => {
    return user?.id ? `cerenAdenCart:user:${user.id}` : 'cerenAdenCart:guest';
};

const readCartFromStorage = (storageKey) => {
    try {
        const storedCart = localStorage.getItem(storageKey);
        return storedCart ? JSON.parse(storedCart) : [];
    } catch (err) {
        console.error('Sepet verisi okunamadı:', err);
        return [];
    }
};

export const usePersistentCart = (user) => {
    const cartStorageKey = getCartStorageKey(user);
    const skipNextCartPersist = useRef(true);
    const [cart, setCart] = useState(() => readCartFromStorage(cartStorageKey));
    const [isCartOpen, setIsCartOpen] = useState(false);

    useEffect(() => {
        setIsCartOpen(false);
        setCart(readCartFromStorage(cartStorageKey));
        skipNextCartPersist.current = true;
    }, [cartStorageKey]);

    useEffect(() => {
        if (skipNextCartPersist.current) {
            skipNextCartPersist.current = false;
            return;
        }

        localStorage.setItem(cartStorageKey, JSON.stringify(cart));
    }, [cart, cartStorageKey]);

    const addToCart = (productToAdd) => {
        setCart((currentCart) => [...currentCart, productToAdd]);
    };

    const removeFromCart = (indexToRemove) => {
        setCart((currentCart) => {
            const updatedCart = currentCart.filter((_, index) => index !== indexToRemove);
            if (updatedCart.length === 0) setIsCartOpen(false);
            return updatedCart;
        });
    };

    const clearCart = () => {
        setCart([]);
        localStorage.removeItem(cartStorageKey);
    };

    const toggleCart = () => setIsCartOpen((isOpen) => !isOpen);

    return {
        cart,
        isCartOpen,
        addToCart,
        removeFromCart,
        clearCart,
        toggleCart
    };
};
