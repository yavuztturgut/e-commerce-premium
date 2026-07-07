const jwt = require('jsonwebtoken');
const { AUTH_COOKIE, getJwtSecret, parseCookies } = require('./authCookies');

const authMiddleware = (req, res, next) => {
    const token = parseCookies(req.headers.cookie)[AUTH_COOKIE];

    if (!token) {
        return res.status(401).json({ message: 'Authentication required' });
    }

    try {
        req.user = jwt.verify(token, getJwtSecret());
        next();
    } catch (err) {
        console.error('[AUTH] Token verification failed:', err.message);
        res.status(401).json({ message: 'Authentication required' });
    }
};

module.exports = authMiddleware;
