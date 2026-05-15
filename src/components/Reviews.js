import React, { useState, useEffect, useContext, useCallback } from 'react';
import { Star, Sparkles } from 'lucide-react';
import { ShopContext } from '../context/ShopContext';
import { useAuth } from '../context/AuthContext';
import { notify } from './Notify';
import apiClient, { withAuth } from '../api/apiClient';
import '../css/Reviews.css';

const mapReviewFromApi = (review) => ({
    id: review.ReviewID,
    productId: review.ProductID,
    name: review.UserName,
    rating: review.Rating,
    comment: review.Comment,
    date: new Date(review.CreatedAt).toLocaleDateString('tr-TR')
});

const Reviews = ({ productId }) => {
    const { refetchProducts } = useContext(ShopContext);
    const { user } = useAuth();
    const [reviews, setReviews] = useState([]);
    const [comment, setComment] = useState('');
    const [rating, setRating] = useState(0);
    const [hover, setHover] = useState(0);

    const fetchReviews = useCallback(async () => {
        try {
            const response = await apiClient.get(`/api/products/${productId}/reviews`);
            setReviews(response.data.map(mapReviewFromApi));
        } catch (err) {
            setReviews([]);
        }
    }, [productId]);

    useEffect(() => {
        fetchReviews();
    }, [fetchReviews]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (rating === 0) return notify.error('Lütfen puan veriniz!');
        if (!comment.trim()) return notify.error('Lütfen bir yorum yazın.');

        const token = localStorage.getItem('token');

        try {
            await apiClient.post('/api/reviews', {
                productId,
                rating,
                comment
            }, withAuth(token));

            setComment('');
            setRating(0);
            notify.success('Yorumunuz için teşekkürler!');
            fetchReviews();
            refetchProducts();
        } catch (err) {
            notify.error(err.response?.data?.message || 'Yorum kaydedilemedi.');
        }
    };

    const averageRating = reviews.length > 0
        ? (reviews.reduce((acc, curr) => acc + curr.rating, 0) / reviews.length).toFixed(1)
        : 0;

    return (
        <div className="reviews-container">
            <h3 className="reviews-title">Değerlendirmeler</h3>

            <div className="reviews-summary">
                <div className="average-score">
                    <span className="big-score">{averageRating}</span>
                    <span className="out-of">/ 5</span>
                </div>
                <div className="total-count">{reviews.length} Yorum</div>
                <div className="static-stars">
                    {[...Array(5)].map((_, i) => (
                        <Star
                            key={i}
                            size={16}
                            fill={i < Math.round(averageRating) ? '#fbbf24' : 'transparent'}
                            color={i < Math.round(averageRating) ? '#fbbf24' : '#e0e0e0'}
                        />
                    ))}
                </div>
            </div>

            {user ? (
                <form onSubmit={handleSubmit} className="review-form">
                    <h4>Yorum Yap</h4>

                    <div className="star-rating-input">
                        {[...Array(5)].map((_, index) => {
                            const ratingValue = index + 1;
                            const isFilled = ratingValue <= (hover || rating);
                            return (
                                <label key={index}>
                                    <input
                                        type="radio"
                                        name="rating"
                                        value={ratingValue}
                                        onClick={() => setRating(ratingValue)}
                                    />
                                    <span
                                        className="star-btn"
                                        onMouseEnter={() => setHover(ratingValue)}
                                        onMouseLeave={() => setHover(0)}
                                    >
                                        <Star
                                            size={28}
                                            fill={isFilled ? '#fbbf24' : 'transparent'}
                                            color={isFilled ? '#fbbf24' : '#e0e0e0'}
                                            strokeWidth={1.5}
                                        />
                                    </span>
                                </label>
                            );
                        })}
                    </div>

                    <textarea
                        placeholder="Bu ürün hakkında ne düşünüyorsunuz?"
                        value={comment}
                        onChange={(e) => setComment(e.target.value)}
                        className="review-textarea"
                    ></textarea>

                    <button type="submit" className="submit-review-btn">GÖNDER</button>
                </form>
            ) : (
                <div className="login-to-review">
                    <p>Yorum yapabilmek için lütfen <strong style={{ color: 'var(--primary-color)', cursor: 'pointer' }} onClick={() => window.location.href = '/login'}>Giriş Yapın</strong>.</p>
                </div>
            )}

            <div className="reviews-list">
                {reviews.length === 0 ? (
                    <p className="no-reviews">Henüz yorum yapılmamış. İlk yorumu sen yap! <Sparkles size={18} className="inline-icon" /></p>
                ) : (
                    reviews.map((rev) => (
                        <div key={rev.id} className="review-item">
                            <div className="review-header">
                                <span className="reviewer-name">{rev.name}</span>
                                <span className="review-date">{rev.date}</span>
                            </div>
                            <div className="review-stars">
                                {[...Array(5)].map((_, i) => (
                                    <Star
                                        key={i}
                                        size={14}
                                        fill={i < rev.rating ? '#fbbf24' : 'transparent'}
                                        color={i < rev.rating ? '#fbbf24' : '#e0e0e0'}
                                    />
                                ))}
                            </div>
                            <p className="review-text">{rev.comment}</p>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};

export default Reviews;
