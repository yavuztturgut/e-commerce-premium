const categoryReverseMap = {
    1: 'makeup',
    2: 'skincare',
    3: 'accessories',
    4: 'fragrance'
};

export const toCategoryId = (category) => {
    if (category === 'makeup') return 1;
    if (category === 'skincare') return 2;
    if (category === 'fragrance') return 4;
    return 3;
};

export const mapProductFromApi = (product) => ({
    ...product,
    id: product.ProductID,
    name: product.Name,
    price: product.Price,
    image_link: product.ImageLink,
    api_featured_image: product.ImageLink,
    product_type: product.ProductType,
    description: product.Description,
    rating: product.Rating,
    reviewCount: product.ReviewCount || 0,
    category: categoryReverseMap[product.CategoryID] || 'makeup'
});
