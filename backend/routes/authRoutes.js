const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { sql, poolPromise } = require('../db');
const authMiddleware = require('../authMiddleware');
const { send2FACode } = require('../emailService');

const router = express.Router();
const TRUSTED_DEVICE_COOKIE = 'trusted_device';
const TRUSTED_DEVICE_MAX_AGE_SECONDS = 60 * 60 * 24 * 30;
const jwtSecret = process.env.JWT_SECRET || 'your_jwt_secret';
const twoFactorRequests = new Map();
const TWO_FACTOR_LIMIT = 3;
const TWO_FACTOR_WINDOW_MS = 10 * 60 * 1000;

const cleanup2FALimits = (now) => {
    for (const [key, attempts] of twoFactorRequests.entries()) {
        const activeAttempts = attempts.filter((time) => now - time < TWO_FACTOR_WINDOW_MS);
        if (activeAttempts.length) twoFactorRequests.set(key, activeAttempts);
        else twoFactorRequests.delete(key);
    }
};

const consume2FALimit = (email, ip) => {
    const now = Date.now();
    if (twoFactorRequests.size > 1000) cleanup2FALimits(now);

    const key = `${email.toLowerCase()}:${ip}`;
    const attempts = (twoFactorRequests.get(key) || []).filter((time) => now - time < TWO_FACTOR_WINDOW_MS);

    if (attempts.length >= TWO_FACTOR_LIMIT) return false;

    attempts.push(now);
    twoFactorRequests.set(key, attempts);
    return true;
};

const toUserDto = (user) => ({
    id: user.UserID,
    fullName: user.FullName,
    email: user.Email,
    role: user.Role
});

const createAuthToken = (user) => jwt.sign(
    { userId: user.UserID, role: user.Role },
    jwtSecret,
    { expiresIn: '1d' }
);

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

const getTrustedDevicePayload = (req) => {
    const trustedDeviceToken = parseCookies(req.headers.cookie)[TRUSTED_DEVICE_COOKIE];
    if (!trustedDeviceToken) return null;

    try {
        const payload = jwt.verify(trustedDeviceToken, jwtSecret);
        if (payload.type !== 'trusted-device') return null;
        return payload;
    } catch (err) {
        return null;
    }
};

const setTrustedDeviceCookie = (res, user) => {
    const trustedDeviceToken = jwt.sign(
        {
            type: 'trusted-device',
            userId: user.UserID,
            email: user.Email
        },
        jwtSecret,
        { expiresIn: `${TRUSTED_DEVICE_MAX_AGE_SECONDS}s` }
    );
    const secureFlag = process.env.NODE_ENV === 'production' ? '; Secure' : '';

    res.setHeader(
        'Set-Cookie',
        `${TRUSTED_DEVICE_COOKIE}=${encodeURIComponent(trustedDeviceToken)}; HttpOnly; Path=/api/auth; Max-Age=${TRUSTED_DEVICE_MAX_AGE_SECONDS}; SameSite=Lax${secureFlag}`
    );
};

router.post('/register', async (req, res) => {
    try {
        const { fullName, email, password } = req.body;
        const pool = await poolPromise;

        const userCheck = await pool.request()
            .input('email', sql.NVarChar, email)
            .query('SELECT * FROM Users WHERE Email = @email');

        if (userCheck.recordset.length > 0) {
            return res.status(400).json({ message: 'Bu email zaten kayıtlı.' });
        }

        const salt = await bcrypt.genSalt(10);
        const passwordHash = await bcrypt.hash(password, salt);

        await pool.request()
            .input('fullName', sql.NVarChar, fullName)
            .input('email', sql.NVarChar, email)
            .input('passwordHash', sql.NVarChar, passwordHash)
            .query('INSERT INTO Users (FullName, Email, PasswordHash) VALUES (@fullName, @email, @passwordHash)');

        res.status(201).json({ message: 'Kayıt başarılı!' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        const pool = await poolPromise;

        const result = await pool.request()
            .input('email', sql.NVarChar, email)
            .query('SELECT * FROM Users WHERE Email = @email');

        const user = result.recordset[0];
        if (!user) {
            return res.status(400).json({ message: 'Geçersiz email veya şifre.' });
        }

        const isMatch = await bcrypt.compare(password, user.PasswordHash);
        if (!isMatch) {
            return res.status(400).json({ message: 'Geçersiz email veya şifre.' });
        }

        const trustedDevice = getTrustedDevicePayload(req);
        if (trustedDevice?.userId === user.UserID && trustedDevice?.email === user.Email) {
            await pool.request()
                .input('email', sql.NVarChar, email)
                .query('UPDATE Users SET TwoFactorCode = NULL, TwoFactorExpiry = NULL WHERE Email = @email');

            return res.json({
                token: createAuthToken(user),
                user: toUserDto(user),
                trustedDevice: true
            });
        }

        if (!consume2FALimit(email, req.ip)) {
            return res.status(429).json({
                message: 'Cok fazla dogrulama kodu istendi. Lutfen 10 dakika sonra tekrar deneyin.'
            });
        }

        const twoFactorCode = Math.floor(100000 + Math.random() * 900000).toString();
        const twoFactorExpiry = new Date(Date.now() + 5 * 60000);

        await pool.request()
            .input('email', sql.NVarChar, email)
            .input('code', sql.NVarChar, twoFactorCode)
            .input('expiry', sql.DateTime, twoFactorExpiry)
            .query('UPDATE Users SET TwoFactorCode = @code, TwoFactorExpiry = @expiry WHERE Email = @email');

        send2FACode(email, twoFactorCode).catch((err) => {
            console.error(`[AUTH LOG] 2FA email failed for ${email}:`, err.message);
        });

        res.json({
            twoFactorRequired: true,
            email,
            message: 'Doğrulama kodu e-posta adresinize gönderildi.'
        });
    } catch (err) {
        console.error(`[AUTH LOG] Login failed for ${req.body.email}:`, err.message);
        res.status(500).json({
            message: 'Giriş işlemi sırasında hata oluştu: ' + err.message,
            error: err.message
        });
    }
});

router.post('/verify-2fa', async (req, res) => {
    try {
        const { email, code, rememberDevice } = req.body;
        const pool = await poolPromise;

        const result = await pool.request()
            .input('email', sql.NVarChar, email)
            .query('SELECT * FROM Users WHERE Email = @email');

        const user = result.recordset[0];
        if (!user || user.TwoFactorCode !== code) {
            return res.status(400).json({ message: 'Geçersiz doğrulama kodu.' });
        }

        if (new Date() > new Date(user.TwoFactorExpiry)) {
            return res.status(400).json({ message: 'Doğrulama kodunun süresi dolmuş.' });
        }

        await pool.request()
            .input('email', sql.NVarChar, email)
            .query('UPDATE Users SET TwoFactorCode = NULL, TwoFactorExpiry = NULL WHERE Email = @email');

        if (rememberDevice) {
            setTrustedDeviceCookie(res, user);
        }

        const token = createAuthToken(user);

        res.json({ token, user: toUserDto(user) });
    } catch (err) {
        console.error(`[AUTH LOG] 2FA verification failed for ${req.body.email}:`, err.message);
        res.status(500).json({
            message: 'Doğrulama sırasında hata oluştu: ' + err.message,
            error: err.message
        });
    }
});

router.post('/logout', (req, res) => {
    res.setHeader(
        'Set-Cookie',
        `${TRUSTED_DEVICE_COOKIE}=; HttpOnly; Path=/api/auth; Max-Age=0; SameSite=Lax`
    );
    res.json({ message: 'Çıkış yapıldı.' });
});

router.get('/me', authMiddleware, async (req, res) => {
    try {
        const pool = await poolPromise;
        const result = await pool.request()
            .input('userId', sql.Int, req.user.userId)
            .query('SELECT UserID, FullName, Email, Role FROM Users WHERE UserID = @userId');

        const user = result.recordset[0];
        if (!user) {
            return res.status(404).json({ message: 'Kullanıcı bulunamadı.' });
        }

        res.json({ user: toUserDto(user) });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.put('/profile', authMiddleware, async (req, res) => {
    try {
        const { fullName, email, currentPassword, password } = req.body;
        const userId = req.user.userId;
        const pool = await poolPromise;

        if (password) {
            if (!currentPassword) {
                return res.status(400).json({ message: 'Yeni şifre için mevcut şifrenizi girin.' });
            }

            const currentUser = await pool.request()
                .input('userId', sql.Int, userId)
                .query('SELECT PasswordHash FROM Users WHERE UserID = @userId');

            if (currentUser.recordset.length === 0) {
                return res.status(404).json({ message: 'Kullanıcı bulunamadı.' });
            }

            const isCurrentPasswordValid = await bcrypt.compare(currentPassword, currentUser.recordset[0].PasswordHash);
            if (!isCurrentPasswordValid) {
                return res.status(400).json({ message: 'Mevcut şifre hatalı.' });
            }
        }

        let query = 'UPDATE Users SET FullName = @fullName, Email = @email';
        const request = pool.request()
            .input('userId', sql.Int, userId)
            .input('fullName', sql.NVarChar, fullName)
            .input('email', sql.NVarChar, email);

        if (password) {
            const salt = await bcrypt.genSalt(10);
            const passwordHash = await bcrypt.hash(password, salt);
            query += ', PasswordHash = @passwordHash';
            request.input('passwordHash', sql.NVarChar, passwordHash);
        }

        query += ' WHERE UserID = @userId';
        await request.query(query);

        const updatedUser = await pool.request()
            .input('userId', sql.Int, userId)
            .query('SELECT UserID, FullName, Email, Role FROM Users WHERE UserID = @userId');

        res.json({
            message: 'Profil başarıyla güncellendi.',
            user: toUserDto(updatedUser.recordset[0])
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
