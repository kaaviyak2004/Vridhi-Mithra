const nodemailer = require('nodemailer');
require('dotenv').config();

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: parseInt(process.env.SMTP_PORT) || 587,
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS
  }
});

/**
 * Generate a 6-digit OTP
 */
const generateOTP = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

/**
 * Send OTP email for verification
 */
const sendOTPEmail = async (email, otp, name) => {
  const mailOptions = {
    from: `"Vridhi Mitra" <${process.env.SMTP_USER || 'noreply@vridhimitra.com'}>`,
    to: email,
    subject: '🔐 Your Vridhi Mitra Verification Code',
    html: `
      <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 500px; margin: 0 auto; padding: 30px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); border-radius: 16px;">
        <div style="background: white; border-radius: 12px; padding: 40px; text-align: center;">
          <h1 style="color: #1a1a2e; margin: 0 0 8px;">Vridhi Mitra</h1>
          <p style="color: #666; margin: 0 0 30px; font-size: 14px;">AI-Powered Learning Platform</p>
          <p style="color: #333; font-size: 16px;">Hello <strong>${name}</strong>,</p>
          <p style="color: #666; font-size: 14px;">Use the code below to verify your account:</p>
          <div style="background: linear-gradient(135deg, #667eea, #764ba2); border-radius: 12px; padding: 20px; margin: 24px 0;">
            <span style="font-size: 36px; font-weight: bold; letter-spacing: 8px; color: white;">${otp}</span>
          </div>
          <p style="color: #999; font-size: 12px;">This code expires in 10 minutes. Do not share it with anyone.</p>
        </div>
      </div>
    `
  };

  try {
    await transporter.sendMail(mailOptions);
    return true;
  } catch (error) {
    console.error('Email send error:', error.message);
    // In development, log OTP to console if email fails
    if (process.env.NODE_ENV === 'development') {
      console.log(`📧 DEV MODE - OTP for ${email}: ${otp}`);
      return true;
    }
    return false;
  }
};

/**
 * Send a general notification email
 */
const sendNotificationEmail = async (email, subject, htmlContent) => {
  const mailOptions = {
    from: `"Vridhi Mitra" <${process.env.SMTP_USER || 'noreply@vridhimitra.com'}>`,
    to: email,
    subject,
    html: htmlContent
  };

  try {
    await transporter.sendMail(mailOptions);
    return true;
  } catch (error) {
    console.error('Email send error:', error.message);
    return false;
  }
};

module.exports = { generateOTP, sendOTPEmail, sendNotificationEmail };
