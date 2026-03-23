const jwt = require('jsonwebtoken');

const authMiddleware = (req, res, next) => {
    let token = req.header('Authorization');

    if (!token) {
        return res.status(401).json({ message: 'No token, authorization denied' });
    }

    // Handle "Bearer " prefix
    if (token.startsWith('Bearer ')) {
        token = token.slice(7).trim();
    }

    console.log('🔑 [AUTH] Extracted token (first 20):', token.substring(0, 20));
    console.log('🔑 [AUTH] JWT_SECRET used:', process.env.JWT_SECRET ? process.env.JWT_SECRET.substring(0, 5) + '...' : 'FALLBACK: your_jwt_secret');

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your_jwt_secret');
        console.log('✅ [AUTH] Token verified for user:', decoded.userId, 'role:', decoded.role);
        req.user = decoded;
        next();
    } catch (err) {
        console.error('❌ [AUTH] Token verification failed:', err.message);
        res.status(401).json({ message: 'Token is not valid' });
    }
};

module.exports = authMiddleware;
