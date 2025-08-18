const nodemailer = require('nodemailer');

// Email transporter configuration optimized for Gmail
const createTransporter = () => {
  // Check if email configuration is available
  if (!process.env.SMTP_HOST || !process.env.SMTP_USER || !process.env.SMTP_PASS) {
    console.warn('Email configuration not found. Emails will not be sent.');
    return null;
  }

  // Basic configuration
  const config = {
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS, // Use App Password for Gmail
    },
    // Optimized connection settings
    connectionTimeout: 30000, // 30 seconds
    greetingTimeout: 30000, // 30 seconds
    socketTimeout: 30000, // 30 seconds
    
    // Disable connection pooling for better reliability
    pool: false,
    
    // TLS settings
    tls: {
      rejectUnauthorized: true,
      minVersion: 'TLSv1.2',
    },
    
    debug: process.env.NODE_ENV === 'development',
    logger: process.env.NODE_ENV === 'development'
  };

  // Gmail-specific configuration
  if (process.env.SMTP_HOST === 'smtp.gmail.com') {
    config.service = 'gmail';
  } else {
    // For other SMTP providers
    config.host = process.env.SMTP_HOST;
    config.port = parseInt(process.env.SMTP_PORT) || 587;
    config.secure = process.env.SMTP_SECURE === 'true';
    config.requireTLS = true;
  }

  return nodemailer.createTransport(config);
};

// Simplified retry logic with exponential backoff
const sendEmailWithRetry = async (transporter, mailOptions, maxRetries = 3) => {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(`📧 Email attempt ${attempt}/${maxRetries} to ${mailOptions.to}`);
      
      const result = await transporter.sendMail(mailOptions);
      console.log(`✅ Email sent successfully to ${mailOptions.to} on attempt ${attempt}`);
      return result;
      
    } catch (error) {
      console.error(`❌ Email attempt ${attempt} failed:`, error.message);
      
      // If this is the last attempt, throw the error
      if (attempt === maxRetries) {
        throw error;
      }
      
      // Wait before retrying with exponential backoff
      const delay = Math.min(2000 * Math.pow(2, attempt - 1), 15000); // Max 15 seconds
      console.log(`⏳ Retrying email in ${delay}ms...`);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
};

// Improved queue system with better error handling
class EmailQueue {
  constructor() {
    this.queue = [];
    this.processing = false;
    this.maxRetries = 3; // Reduced from 7 to avoid spam
    this.retryDelay = 30000; // 30 seconds between queue retries
  }

  async add(emailData) {
    this.queue.push({
      ...emailData,
      id: Date.now() + Math.random(),
      attempts: 0,
      addedAt: new Date()
    });
    
    console.log(`📨 Email queued for ${emailData.to}: ${emailData.subject}`);
    
    if (!this.processing) {
      // Small delay to batch multiple emails
      setTimeout(() => this.process(), 1000);
    }
  }

  async process() {
    if (this.processing || this.queue.length === 0) {
      return;
    }

    this.processing = true;
    console.log(`🔄 Processing email queue: ${this.queue.length} emails pending`);

    while (this.queue.length > 0) {
      const emailData = this.queue.shift();
      
      try {
        await this.sendEmail(emailData);
        console.log(`✅ Email delivered: ${emailData.to}`);
      } catch (error) {
        emailData.attempts++;
        console.error(`❌ Failed to send email to ${emailData.to} (attempt ${emailData.attempts}):`, error.message);
        
        if (emailData.attempts < this.maxRetries) {
          console.log(`🔄 Re-queuing email for retry: ${emailData.to}`);
          setTimeout(() => {
            this.queue.push(emailData);
            if (!this.processing) {
              this.process();
            }
          }, this.retryDelay);
        } else {
          console.error(`💀 Max retries exceeded for email to ${emailData.to}. Giving up.`);
        }
      }
      
      // Delay between emails to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 2000)); // 2 seconds
    }

    this.processing = false;
    console.log(`✅ Email queue processing completed`);
  }

  async sendEmail(emailData) {
    const transporter = createTransporter();
    if (!transporter) {
      throw new Error('Email transporter not configured');
    }

    const mailOptions = {
      from: `"${process.env.FROM_NAME || 'TaskGroove'}" <${process.env.FROM_EMAIL || process.env.SMTP_USER}>`,
      to: emailData.to,
      subject: emailData.subject,
      html: emailData.html
    };

    return await sendEmailWithRetry(transporter, mailOptions, 2); // 2 attempts per queue item
  }

  // Get queue status
  getStatus() {
    return {
      pending: this.queue.length,
      processing: this.processing,
      maxRetries: this.maxRetries
    };
  }
}

// Create global email queue instance
const emailQueue = new EmailQueue();

// Base email template (unchanged)
const getBaseTemplate = (content, title = "Notification") => {
  return `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${title}</title>
        <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; margin: 0; padding: 0; background-color: #f4f4f4; }
            .container { max-width: 600px; margin: 0 auto; background-color: #ffffff; }
            .header { background-color: #007bff; color: #ffffff; padding: 20px; text-align: center; }
            .content { padding: 30px; }
            .footer { background-color: #f8f9fa; padding: 20px; text-align: center; font-size: 12px; color: #6c757d; }
            .button { display: inline-block; padding: 12px 24px; background-color: #007bff; color: #ffffff; text-decoration: none; border-radius: 4px; margin: 10px 0; }
            .alert { padding: 12px; margin: 16px 0; border-radius: 4px; }
            .alert-success { background-color: #d4edda; border-color: #c3e6cb; color: #155724; }
            .alert-warning { background-color: #fff3cd; border-color: #ffeaa7; color: #856404; }
            .alert-danger { background-color: #f8d7da; border-color: #f5c6cb; color: #721c24; }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1>TaskGroove</h1>
            </div>
            <div class="content">
                ${content}
            </div>
            <div class="footer">
                <p>This email was sent from TaskGroove. If you didn't expect this email, please ignore it.</p>
                <p>You can update your email preferences in your account settings.</p>
            </div>
        </div>
    </body>
    </html>
  `;
};

// Send welcome email (simplified)
const sendWelcomeEmail = async (user) => {
  try {
    const content = `
      <h2>Welcome to TaskGroove, ${user.name}! 🎉</h2>
      <p>We're excited to have you on board. Your productivity journey starts now!</p>
      
      <div class="alert alert-success">
        <strong>What's next?</strong>
        <ul>
          <li>Complete your profile setup</li>
          <li>Set your working hours and preferences</li>
          <li>Create your first task or project</li>
          <li>Explore our productivity features</li>
        </ul>
      </div>
      
      <p>
        <a href="${process.env.APP_URL || 'http://localhost:3000'}/onboarding" class="button">Complete Setup</a>
      </p>
      
      <p>If you have any questions, our support team is here to help!</p>
      
      <p>Best regards,<br>The TaskGroove Team</p>
    `;

    await emailQueue.add({
      to: user.email,
      subject: "Welcome to TaskGroove! 🚀",
      html: getBaseTemplate(content, "Welcome to TaskGroove")
    });
    
  } catch (error) {
    console.error('❌ Error queuing welcome email:', error);
  }
};

// Send email verification (simplified)
const sendEmailVerification = async (user, token) => {
  try {
    const verificationUrl = `${process.env.API_URL || 'http://localhost:5000'}/api/auth/verify-email?token=${token}`;
    
    const content = `
      <h2>Verify Your Email Address</h2>
      <p>Hi ${user.name},</p>
      <p>Please click the button below to verify your email address:</p>
      
      <p>
        <a href="${verificationUrl}" class="button">Verify Email Address</a>
      </p>
      
      <p>If the button doesn't work, copy and paste this link:</p>
      <p style="word-break: break-all; color: #6c757d; font-size: 12px;">${verificationUrl}</p>
      
      <p>This verification link will expire in 24 hours.</p>
    `;

    await emailQueue.add({
      to: user.email,
      subject: "Verify Your Email Address",
      html: getBaseTemplate(content, "Email Verification")
    });
    
  } catch (error) {
    console.error('❌ Error queuing verification email:', error);
  }
};

// Keep other email functions unchanged...
const sendPasswordResetEmail = async (user, resetToken) => {
  try {
    const resetUrl = `${process.env.APP_URL}/reset-password?token=${resetToken}`;
    
    const content = `
      <h2>Password Reset Request</h2>
      <p>Hi ${user.name},</p>
      <p>Click the button below to reset your password:</p>
      
      <p>
        <a href="${resetUrl}" class="button">Reset Password</a>
      </p>
      
      <div class="alert alert-warning">
        <strong>Security Note:</strong> This link expires in 10 minutes.
      </div>
    `;

    await emailQueue.add({
      to: user.email,
      subject: "Password Reset Request",
      html: getBaseTemplate(content, "Password Reset")
    });
    
  } catch (error) {
    console.error('❌ Error queuing password reset email:', error);
    throw error;
  }
};

// Export functions
module.exports = {
  sendWelcomeEmail,
  sendEmailVerification,
  sendPasswordResetEmail,
  getEmailQueueStatus: () => emailQueue.getStatus(),
  processEmailQueue: () => emailQueue.process()
};