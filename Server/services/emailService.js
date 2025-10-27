/**
 * Email Service for sending notifications
 * Uses nodemailer to send emails via SMTP
 */
const nodemailer = require('nodemailer');

// Create reusable transporter
const createTransporter = () => {
  return nodemailer.createTransporter({
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: process.env.SMTP_PORT || 587,
    secure: false, // true for 465, false for other ports
    auth: {
      user: process.env.EMAIL_ADDRESS,
      pass: process.env.EMAIL_PASSWORD
    }
  });
};

/**
 * Send welcome email to new users
 * @param {string} email - Recipient email address
 * @param {string} name - Recipient name
 */
const sendWelcomeEmail = async (email, name) => {
  try {
    const transporter = createTransporter();

    const mailOptions = {
      from: `"FindersNotKeepers" <${process.env.EMAIL_ADDRESS}>`,
      to: email,
      subject: 'Welcome to FindersNotKeepers!',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background-color: #4CAF50; color: white; padding: 20px; text-align: center; }
            .content { background-color: #f9f9f9; padding: 30px; border-radius: 5px; margin-top: 20px; }
            .button { display: inline-block; padding: 12px 30px; background-color: #4CAF50; color: white; text-decoration: none; border-radius: 5px; margin-top: 20px; }
            .footer { text-align: center; margin-top: 30px; color: #777; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Welcome to FindersNotKeepers!</h1>
            </div>
            <div class="content">
              <h2>Hi ${name},</h2>
              <p>Thank you for creating an account with FindersNotKeepers!</p>
              <p>You've successfully signed up using your Google account. You can now:</p>
              <ul>
                <li>Report lost items</li>
                <li>Browse found items</li>
                <li>Connect with other users</li>
                <li>Manage your listings</li>
              </ul>
              <p>Get started by exploring our platform and helping reunite lost items with their owners!</p>
              <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/listings" class="button">Browse Listings</a>
            </div>
            <div class="footer">
              <p>This email was sent from FindersNotKeepers</p>
              <p>If you didn't create this account, please ignore this email.</p>
            </div>
          </div>
        </body>
        </html>
      `,
      text: `
        Hi ${name},

        Thank you for creating an account with FindersNotKeepers!

        You've successfully signed up using your Google account. You can now:
        - Report lost items
        - Browse found items
        - Connect with other users
        - Manage your listings

        Get started by visiting: ${process.env.FRONTEND_URL || 'http://localhost:3000'}/listings

        If you didn't create this account, please ignore this email.

        Best regards,
        FindersNotKeepers Team
      `
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('Welcome email sent successfully:', info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('Error sending welcome email:', error);
    throw error;
  }
};

/**
 * Send login notification email
 * @param {string} email - Recipient email address
 * @param {string} name - Recipient name
 */
const sendLoginNotification = async (email, name) => {
  try {
    const transporter = createTransporter();

    const mailOptions = {
      from: `"FindersNotKeepers" <${process.env.EMAIL_ADDRESS}>`,
      to: email,
      subject: 'New Login to Your Account',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background-color: #2196F3; color: white; padding: 20px; text-align: center; }
            .content { background-color: #f9f9f9; padding: 30px; border-radius: 5px; margin-top: 20px; }
            .footer { text-align: center; margin-top: 30px; color: #777; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Account Login Notification</h1>
            </div>
            <div class="content">
              <h2>Hi ${name},</h2>
              <p>You've successfully logged into your FindersNotKeepers account using Google.</p>
              <p><strong>Login Time:</strong> ${new Date().toLocaleString()}</p>
              <p>If this wasn't you, please secure your account immediately by changing your password.</p>
            </div>
            <div class="footer">
              <p>This is an automated notification from FindersNotKeepers</p>
            </div>
          </div>
        </body>
        </html>
      `,
      text: `
        Hi ${name},

        You've successfully logged into your FindersNotKeepers account using Google.

        Login Time: ${new Date().toLocaleString()}

        If this wasn't you, please secure your account immediately.

        Best regards,
        FindersNotKeepers Team
      `
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('Login notification email sent successfully:', info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('Error sending login notification email:', error);
    throw error;
  }
};

module.exports = {
  sendWelcomeEmail,
  sendLoginNotification
};
