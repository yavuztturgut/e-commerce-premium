import { useEffect, useRef, useState } from 'react';

const getCartStorageKey = (user) => {
    return user?.id ? `cerenAdenCart:user:${user.id}` : 'cerenAdenCart:guest';
};

const readCartFromStorage = (storageKey) => {
    try {
        const storedCart = localStorage.getItem(storageKey);
        return storedCart ? normalizeCartItems(JSON.parse(storedCart)) : [];
    } catch (err) {
        return [];
    }
};

const getCartItemId = (item) => item?.id ?? item?.ProductID ?? item?.productId;

const normalizeQuantity = (quantity) => {
    const parsedQuantity = Number(quantity);
    return Number.isFinite(parsedQuantity) && parsedQuantity > 0 ? parsedQuantity : 1;
};

const normalizeCartItems = (items) => {
    if (!Array.isArray(items)) return [];

    const groupedItems = new Map();

    items.forEach((item) => {
        const itemId = getCartItemId(item);
        if (!itemId) return;

        const quantity = normalizeQuantity(item.quantity);
        const existingItem = groupedItems.get(itemId);

        if (existingItem) {
            groupedItems.set(itemId, {
                ...existingItem,
                quantity: existingItem.quantity + quantity
            });
            return;
        }

        groupedItems.set(itemId, {
            ...item,
            quantity
        });
    });

    return Array.from(groupedItems.values());
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

        localStorage.setItem(cartStorageKey, JSON.stringify(normalizeCartItems(cart)));
    }, [cart, cartStorageKey]);

    const addToCart = (productToAdd) => {
        setCart((currentCart) => {
            const productId = getCartItemId(productToAdd);
            if (!productId) return currentCart;

            const existingItem = currentCart.find((item) => getCartItemId(item) === productId);
            if (!existingItem) {
                return [...currentCart, { ...productToAdd, quantity: 1 }];
            }

            return currentCart.map((item) => {
                if (getCartItemId(item) !== productId) return item;
                return {
                    ...item,
                    quantity: normalizeQuantity(item.quantity) + 1
                };
            });
        });
    };

    const decreaseCartItem = (productId) => {
        setCart((currentCart) => {
            const updatedCart = currentCart
                .map((item) => {
                    if (getCartItemId(item) !== productId) return item;
                    return {
                        ...item,
                        quantity: normalizeQuantity(item.quantity) - 1
                    };
                })
                .filter((item) => normalizeQuantity(item.quantity) > 0);

            if (updatedCart.length === 0) setIsCartOpen(false);
            return updatedCart;
        });
    };

    const removeFromCart = (productId) => {
        setCart((currentCart) => {
            const updatedCart = currentCart.filter((item) => getCartItemId(item) !== productId);
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
        decreaseCartItem,
        removeFromCart,
        clearCart,
        toggleCart
    };
};
