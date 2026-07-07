const jwt = require('jsonwebtoken');

const AUTH_COOKIE = 'auth_token';
const AUTH_COOKIE_MAX_AGE_SECONDS = 60 * 60 * 24;
const TRUSTED_DEVICE_COOKIE = 'trusted_device';
const TRUSTED_DEVICE_MAX_AGE_SECONDS = 60 * 60 * 24 * 30;

const getJwtSecret = () => {
    if (!process.env.JWT_SECRET) {
        throw new Error('JWT_SECRET environment variable is required');
    }
    return process.env.JWT_SECRET;
};

const parseCookies = (cookieHeader = '') => cookieHeader
    .split(';')
    .map((cookie) => cookie.trim())
    .filter(Boolean)
    .reduce((cookies, cookie) => {
        const separatorIndex = cookie.indexOf('=');
        if (separatorIndex === -1) return cookies;

        const key = cookie.slice(0, separatorIndex);
        const value = cookie.slice(separatorIndex + 1);
        cookies[key] = decodeURIComponent(value);
        return cookies;
    }, {});

const cookieOptions = (maxAgeSeconds, path = '/') => ({
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path,
    maxAge: maxAgeSeconds * 1000
});

const clearCookieOptions = (path = '/') => ({
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path
});

const signAuthToken = (user) => jwt.sign(
    { userId: user.UserID, role: user.Role },
    getJwtSecret(),
    { expiresIn: '1d' }
);

module.exports = {
    AUTH_COOKIE,
    AUTH_COOKIE_MAX_AGE_SECONDS,
    TRUSTED_DEVICE_COOKIE,
    TRUSTED_DEVICE_MAX_AGE_SECONDS,
    clearCookieOptions,
    cookieOptions,
    getJwtSecret,
    parseCookies,
    signAuthToken
};
