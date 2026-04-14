const nodemailer = require('nodemailer');
require('dotenv').config();

const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT),
    secure: process.env.SMTP_SECURE === 'true',
    auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
    },
});

const send2FACode = async (email, code) => {
    const mailOptions = {
        from: process.env.SMTP_FROM,
        to: email,
        subject: 'Giriş Doğrulama Kodu - CerenAden Shop',
        html: `
            <div style="font-family: Arial, sans-serif; padding: 20px; color: #333;">
                <h2 style="color: #4a90e2;">Giriş Doğrulama</h2>
                <p>Merhaba,</p>
                <p>Hesabınıza giriş yapabilmek için aşağıdaki 6 haneli doğrulama kodunu kullanın:</p>
                <div style="background: #f4f4f4; padding: 15px; font-size: 24px; font-weight: bold; text-align: center; letter-spacing: 5px; margin: 20px 0;">
                    ${code}
                </div>
                <p>Bu kod 5 dakika boyunca geçerlidir. Güvenliğiniz için bu kodu kimseyle paylaşmayın.</p>
                <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;">
                <p style="font-size: 12px; color: #888;">Eğer bu girişi siz yapmadıysanız lütfen şifrenizi değiştirin.</p>
            </div>
        `,
    };

    try {
        await transporter.sendMail(mailOptions);
        console.log(`[EMAIL LOG] ✅ 2FA code successfully sent to: ${email}`);
    } catch (error) {
        console.error(`[EMAIL LOG] ❌ Failed to send email to ${email}. Error:`, error.message);
        throw new Error('E-posta gönderilemedi: ' + error.message);
    }
};

module.exports = { send2FACode };
