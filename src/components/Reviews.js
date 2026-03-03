import React, { useState, useEffect, useContext } from 'react';
import { ShopContext } from '../context/ShopContext';
import { notify } from './Notify';
import '../css/Reviews.css';

const Reviews = ({ productId }) => {
    const { refetchProducts } = useContext(ShopContext);
    const [reviews, setReviews] = useState([]);
    const [name, setName] = useState('');
    const [comment, setComment] = useState('');
    const [rating, setRating] = useState(0);
    const [hover, setHover] = useState(0);

    const fetchReviews = async () => {
        try {
            const response = await fetch(`http://localhost:5000/api/products/${productId}/reviews`);
            const data = await response.json();
            // DB formatını UI formatına çeviriyoruz
            const mappedReviews = data.map(r => ({
                id: r.ReviewID,
                productId: r.ProductID,
                name: r.UserName,
                rating: r.Rating,
                comment: r.Comment,
                date: new Date(r.CreatedAt).toLocaleDateString('tr-TR')
            }));
            setReviews(mappedReviews);
        } catch (err) {
            console.error('Yorumlar yüklenemedi:', err);
        }
    };

    useEffect(() => {
        fetchReviews();
    }, [productId]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (rating === 0) return notify.error('Lütfen puan veriniz! ⭐');
        if (!name.trim() || !comment.trim()) return notify.error('Lütfen tüm alanları doldurun.');

        try {
            const response = await fetch('http://localhost:5000/api/reviews', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    productId,
                    userName: name,
                    rating,
                    comment
                })
            });

            if (response.ok) {
                setName('');
                setComment('');
                setRating(0);
                notify.success('Yorumunuz için teşekkürler! 💖');
                fetchReviews(); // Listeyi güncelle
                refetchProducts(); // Ürün genel puanını güncelle (Anasayfa vb.)
            }
        } catch (err) {
            notify.error('Yorum kaydedilemedi.');
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
                        <span key={i} className={i < Math.round(averageRating) ? "star filled" : "star"}>★</span>
                    ))}
                </div>
            </div>

            <form onSubmit={handleSubmit} className="review-form">
                <h4>Yorum Yap</h4>

                <div className="star-rating-input">
                    {[...Array(5)].map((_, index) => {
                        const ratingValue = index + 1;
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
                                    style={{ color: ratingValue <= (hover || rating) ? "#fbbf24" : "#e0e0e0" }}
                                    onMouseEnter={() => setHover(ratingValue)}
                                    onMouseLeave={() => setHover(0)}
                                >
                                    ★
                                </span>
                            </label>
                        );
                    })}
                </div>

                <input
                    type="text"
                    placeholder="Adınız"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="review-input"
                />
                <textarea
                    placeholder="Bu ürün hakkında ne düşünüyorsunuz?"
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    className="review-textarea"
                ></textarea>

                <button type="submit" className="submit-review-btn">GÖNDER</button>
            </form>

            <div className="reviews-list">
                {reviews.length === 0 ? (
                    <p className="no-reviews">Henüz yorum yapılmamış. İlk yorumu sen yap! ✨</p>
                ) : (
                    reviews.map((rev) => (
                        <div key={rev.id} className="review-item">
                            <div className="review-header">
                                <span className="reviewer-name">{rev.name}</span>
                                <span className="review-date">{rev.date}</span>
                            </div>
                            <div className="review-stars">
                                {[...Array(5)].map((_, i) => (
                                    <span key={i} style={{ color: i < rev.rating ? "#fbbf24" : "#e0e0e0" }}>★</span>
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
