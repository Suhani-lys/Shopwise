/**
 * ShopWise Automated Notification Service
 * Manages transactional email delivery via Nodemailer and persistent in-app notifications.
 */

const nodemailer = require('nodemailer');
const { NotificationDAL } = require('../models/schema');

class NotificationService {
  constructor() {
    this.transporter = null;
  }

  /**
   * Checks whether real email credentials are configured in environment variables
   */
  isEmailConfigured() {
    const user = process.env.SMTP_USER || process.env.EMAIL_USER;
    const pass = process.env.SMTP_PASS || process.env.EMAIL_PASS;
    const host = process.env.SMTP_HOST;
    const service = process.env.SMTP_SERVICE;

    if (!user || !pass) return false;
    if (user.includes('your_') || pass.includes('your_')) return false;
    return Boolean(host || service);
  }

  /**
   * Returns current notification configuration status diagnostics
   */
  getStatus() {
    const configured = this.isEmailConfigured();
    const missing = [];
    if (!process.env.SMTP_USER && !process.env.EMAIL_USER) missing.push('SMTP_USER');
    if (!process.env.SMTP_PASS && !process.env.EMAIL_PASS) missing.push('SMTP_PASS');
    if (!process.env.SMTP_HOST && !process.env.SMTP_SERVICE) missing.push('SMTP_HOST or SMTP_SERVICE');

    return {
      service: 'email_and_in_app',
      emailConfigured: configured,
      inAppConfigured: true, // Always persistent via MongoDB Atlas
      missingCredentials: missing,
      fromAddress: process.env.EMAIL_FROM || process.env.SMTP_USER || 'alerts@shopwise.in',
      message: configured
        ? 'SMTP email notification service is configured and ready.'
        : 'SMTP credentials missing in server/.env. Alerts will trigger in-app notifications only.'
    };
  }

  /**
   * Lazily initializes and returns the SMTP transporter
   */
  getTransporter() {
    if (this.transporter) return this.transporter;
    if (!this.isEmailConfigured()) return null;

    const user = process.env.SMTP_USER || process.env.EMAIL_USER;
    const pass = process.env.SMTP_PASS || process.env.EMAIL_PASS;

    if (process.env.SMTP_SERVICE) {
      this.transporter = nodemailer.createTransport({
        service: process.env.SMTP_SERVICE,
        auth: { user, pass }
      });
    } else {
      this.transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: Number(process.env.SMTP_PORT || 587),
        secure: process.env.SMTP_SECURE === 'true',
        auth: { user, pass },
        tls: { rejectUnauthorized: process.env.SMTP_IGNORE_TLS !== 'true' }
      });
    }

    return this.transporter;
  }

  /**
   * Dispatches transactional email when a verified price drop target is reached
   */
  async sendPriceDropEmail(params = {}) {
    const {
      to,
      productName,
      productUrl,
      store,
      previousPrice,
      currentPrice,
      targetPrice,
      currency = 'INR',
      verifiedAt = new Date()
    } = params;

    if (!this.isEmailConfigured()) {
      return {
        success: false,
        status: 'unconfigured',
        message: 'SMTP credentials unconfigured in server/.env. Alert saved and in-app notification delivered.'
      };
    }

    const transporter = this.getTransporter();
    if (!transporter) {
      return {
        success: false,
        status: 'unconfigured',
        message: 'SMTP transporter initialization skipped.'
      };
    }

    const fromAddress = process.env.EMAIL_FROM || `"ShopWise Alerts" <${process.env.SMTP_USER}>`;
    const formatPrice = (p) => p !== undefined && p !== null ? `₹${Number(p).toLocaleString('en-IN')}` : 'N/A';
    const savings = targetPrice && currentPrice ? Math.max(0, targetPrice - currentPrice) : 0;
    const dateFormatted = new Date(verifiedAt).toLocaleString('en-IN', {
      timeZone: 'Asia/Kolkata',
      dateStyle: 'medium',
      timeStyle: 'short'
    });

    const subject = `🎉 Price Drop Alert: ${productName} hit your target of ${formatPrice(targetPrice)}!`;

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #F8F9FD; margin: 0; padding: 24px; color: #1E293B; }
          .container { max-width: 600px; margin: 0 auto; background: #FFFFFF; border-radius: 16px; overflow: hidden; border: 1px solid #E2E8F0; box-shadow: 0 4px 20px rgba(0,0,0,0.06); }
          .header { background: linear-gradient(135deg, #7C3AED 0%, #6366F1 100%); padding: 32px 24px; text-align: center; color: #FFFFFF; }
          .header h1 { margin: 0; font-size: 24px; font-weight: 700; letter-spacing: -0.5px; }
          .header p { margin: 6px 0 0 0; opacity: 0.9; font-size: 14px; }
          .content { padding: 32px 28px; }
          .badge { display: inline-block; background-color: #ECFDF5; color: #059669; font-size: 12px; font-weight: 700; padding: 4px 10px; border-radius: 20px; border: 1px solid #A7F3D0; margin-bottom: 16px; }
          .product-title { font-size: 20px; font-weight: 700; margin: 0 0 16px 0; color: #0F172A; line-height: 1.4; }
          .price-matrix { background-color: #F8FAFC; border: 1px solid #E2E8F0; border-radius: 12px; padding: 20px; margin: 20px 0; display: table; width: 100%; box-sizing: border-box; }
          .price-col { display: table-cell; width: 33.33%; text-align: center; vertical-align: middle; }
          .price-label { font-size: 12px; text-transform: uppercase; color: #64748B; font-weight: 600; margin-bottom: 4px; }
          .price-val { font-size: 18px; font-weight: 700; color: #0F172A; }
          .price-val.current { color: #059669; font-size: 22px; }
          .cta-wrap { text-align: center; margin: 32px 0 16px 0; }
          .btn-cta { display: inline-block; background: #7C3AED; color: #FFFFFF; text-decoration: none; font-weight: 700; font-size: 16px; padding: 14px 32px; border-radius: 10px; box-shadow: 0 4px 12px rgba(124, 58, 237, 0.3); }
          .footer { background: #F1F5F9; padding: 20px; text-align: center; font-size: 12px; color: #64748B; border-top: 1px solid #E2E8F0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>ShopWise Price Drop Detected</h1>
            <p>Smart real-time shopping comparison across Indian retailers</p>
          </div>
          <div class="content">
            <span class="badge">TARGET PRICE REACHED</span>
            <h2 class="product-title">${productName}</h2>
            <p style="margin: 0 0 12px 0; color: #475569; font-size: 14px;">
              Good news! Our automated price monitor just verified that this item is now selling at or below your target price on <strong>${store}</strong>.
            </p>

            <div class="price-matrix">
              <div class="price-col">
                <div class="price-label">Previous</div>
                <div class="price-val">${formatPrice(previousPrice)}</div>
              </div>
              <div class="price-col" style="border-left: 1px solid #CBD5E1; border-right: 1px solid #CBD5E1;">
                <div class="price-label">Your Target</div>
                <div class="price-val">${formatPrice(targetPrice)}</div>
              </div>
              <div class="price-col">
                <div class="price-label">Live Price</div>
                <div class="price-val current">${formatPrice(currentPrice)}</div>
              </div>
            </div>

            ${savings > 0 ? `<p style="text-align: center; color: #059669; font-weight: 600; font-size: 15px; margin: 0 0 24px 0;">🎉 You save an additional ${formatPrice(savings)} below your target price!</p>` : ''}

            <div class="cta-wrap">
              <a href="${productUrl}" class="btn-cta" target="_blank" rel="noopener noreferrer">View Deal on ${store} &rarr;</a>
            </div>

            <p style="font-size: 12px; color: #94A3B8; text-align: center; margin-top: 24px;">
              Verified live on: ${dateFormatted} via ShopWise Live Multi-Store Tracking Engine.
            </p>
          </div>
          <div class="footer">
            You received this email because you created a personalized price drop alert on ShopWise.<br/>
            &copy; ${new Date().getFullYear()} ShopWise India. All rights reserved.
          </div>
        </div>
      </body>
      </html>
    `;

    try {
      const info = await transporter.sendMail({
        from: fromAddress,
        to,
        subject,
        html
      });
      return {
        success: true,
        status: 'sent',
        messageId: info.messageId,
        sentAt: new Date().toISOString()
      };
    } catch (error) {
      console.error('[NotificationService Email Error]', error.message);
      return {
        success: false,
        status: 'failed',
        error: error.message
      };
    }
  }

  /**
   * Persists an In-App Notification directly in MongoDB Atlas
   */
  async createInAppNotification(params = {}) {
    const {
      userId,
      userEmail,
      alertId,
      productId,
      productName,
      productImage,
      productUrl,
      store,
      targetPrice,
      currentPrice
    } = params;

    const savings = targetPrice && currentPrice ? Math.max(0, targetPrice - currentPrice) : 0;
    const formatPrice = (p) => p !== undefined && p !== null ? `₹${Number(p).toLocaleString('en-IN')}` : '';

    const notif = {
      id: `notif-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      userId: userId || null,
      userEmail: (userEmail || '').trim().toLowerCase(),
      alertId: alertId || null,
      productId,
      productName,
      productImage,
      productUrl,
      store: store || 'Online Store',
      targetPrice: Number(targetPrice || 0),
      currentPrice: Number(currentPrice || 0),
      savingsAmount: savings,
      type: 'price_drop',
      title: `Price Drop: ${productName}`,
      message: `${productName} dropped to ${formatPrice(currentPrice)} on ${store}! Target: ${formatPrice(targetPrice)}.`,
      read: false,
      createdAt: new Date()
    };

    try {
      return await NotificationDAL.create(notif);
    } catch (err) {
      console.warn('[NotificationService In-App Error]', err.message);
      return notif;
    }
  }

  /**
   * Orchestrates both Email and In-App notifications upon verified price drop trigger
   */
  async dispatchPriceDropTrigger(params = {}) {
    const {
      alert,
      product,
      latestPrice,
      store = alert.selectedStore || 'Online Store'
    } = params;

    // 1. Deliver in-app notification (guaranteed persistence)
    const inApp = await this.createInAppNotification({
      userId: alert.userId,
      userEmail: alert.userEmail,
      alertId: alert.id,
      productId: alert.productId,
      productName: alert.productName,
      productImage: alert.productImage,
      productUrl: alert.productUrl || product?.url || product?.offers?.[0]?.url,
      store,
      targetPrice: alert.targetPrice,
      currentPrice: latestPrice
    });

    // 2. Deliver transactional email if SMTP is configured
    const emailResult = await this.sendPriceDropEmail({
      to: alert.userEmail,
      productName: alert.productName,
      productUrl: alert.productUrl || product?.url || product?.offers?.[0]?.url,
      store,
      previousPrice: alert.currentLowestPrice || alert.initialPrice || latestPrice,
      currentPrice: latestPrice,
      targetPrice: alert.targetPrice,
      verifiedAt: new Date()
    });

    return {
      inApp,
      email: emailResult
    };
  }
}

// Export singleton instance
const notificationService = new NotificationService();
module.exports = notificationService;
