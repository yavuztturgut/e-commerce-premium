const jwt = require('jsonwebtoken');

const authMiddleware = (req, res, next) => {
    let token = req.header('Authorization');

    if (!token) {
        return res.status(401).json({ message: 'No token, authorization denied' });
    }

    if (token.startsWith('Bearer ')) {
        token = token.slice(7).trim();
    }

    try {
        req.user = jwt.verify(token, process.env.JWT_SECRET || 'your_jwt_secret');
        next();
    } catch (err) {
        console.error('[AUTH] Token verification failed:', err.message);
        res.status(401).json({ message: 'Token is not valid' });
    }
};

module.exports = authMiddleware;
