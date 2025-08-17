const nodemailer = require('nodemailer');

// Email transporter configuration
const createTransporter = () => {
  // Check if email configuration is available
  if (!process.env.SMTP_HOST || !process.env.SMTP_USER || !process.env.SMTP_PASS) {
    console.warn('Email configuration not found. Emails will not be sent.');
    return null;
  }

  return nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: process.env.SMTP_PORT,
    secure: process.env.SMTP_SECURE === 'true',
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });
};

// Base email template
const getBaseTemplate = (content, title = "Notification") => {
  return `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${title}</title>
        <style>
            body { font-family: Manrope, Arial, sans-serif; line-height: 1.6; margin: 0; padding: 0; background-color: #f4f4f4; }
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

// Send welcome email
const sendWelcomeEmail = async (user) => {
  try {
    const transporter = createTransporter();
    
    if (!transporter) {
      console.log(`Welcome email would be sent to ${user.email} (email not configured)`);
      return;
    }
    
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
        <a href="${process.env.APP_URL}/onboarding" class="button">Complete Setup</a>
      </p>
      
      <p>If you have any questions, our support team is here to help. Just reply to this email!</p>
      
      <p>Best regards,<br>The TaskGroove Team</p>
    `;

    const mailOptions = {
      from: `"TaskGroove" <${process.env.FROM_EMAIL}>`,
      to: user.email,
      subject: "Welcome to TaskGroove! 🚀",
      html: getBaseTemplate(content, "Welcome to TaskGroove")
    };

    await transporter.sendMail(mailOptions);
    console.log(`Welcome email sent to ${user.email}`);
  } catch (error) {
    console.error('Error sending welcome email:', error);
  }
};

// Send email verification
const sendEmailVerification = async (user, token) => {
  try {
    const transporter = createTransporter();
    
    if (!transporter) {
      console.log(`Verification email would be sent to ${user.email} (email not configured)`);
      return;
    }
    
    // For mobile apps, point directly to API endpoint
    const verificationUrl = `${process.env.API_URL || 'http://localhost:3020'}/api/users/verify-email?token=${token}`;
    
    const content = `
      <h2>Verify Your Email Address</h2>
      <p>Hi ${user.name},</p>
      <p>Please click the button below to verify your email address:</p>
      
      <p>
        <a href="${verificationUrl}" class="button">Verify Email Address</a>
      </p>
      
      <p>If the button doesn't work, you can copy and paste this link into your browser:</p>
      <p style="word-break: break-all; color: #6c757d;">${verificationUrl}</p>
      
      <p>This verification link will expire in 24 hours.</p>
      
      <p>If you didn't create an account with us, please ignore this email.</p>
    `;

    const mailOptions = {
      from: `"TaskGroove" <${process.env.FROM_EMAIL}>`,
      to: user.email,
      subject: "Verify Your Email Address",
      html: getBaseTemplate(content, "Email Verification")
    };

    await transporter.sendMail(mailOptions);
    console.log(`Verification email sent to ${user.email}`);
  } catch (error) {
    console.error('Error sending verification email:', error);
  }
};

// Send password reset email
const sendPasswordResetEmail = async (user, resetToken) => {
  try {
    const transporter = createTransporter();
    
    if (!transporter) {
      console.log(`Password reset email would be sent to ${user.email} (email not configured)`);
      return;
    }
    
    const resetUrl = `${process.env.APP_URL}/reset-password?token=${resetToken}`;
    
    const content = `
      <h2>Password Reset Request</h2>
      <p>Hi ${user.name},</p>
      <p>We received a request to reset your password. Click the button below to set a new password:</p>
      
      <p>
        <a href="${resetUrl}" class="button">Reset Password</a>
      </p>
      
      <p>If the button doesn't work, you can copy and paste this link into your browser:</p>
      <p style="word-break: break-all; color: #6c757d;">${resetUrl}</p>
      
      <div class="alert alert-warning">
        <strong>Security Note:</strong> This link will expire in 10 minutes for your security.
      </div>
      
      <p>If you didn't request a password reset, please ignore this email. Your password will remain unchanged.</p>
    `;

    const mailOptions = {
      from: `"TaskGroove" <${process.env.FROM_EMAIL}>`,
      to: user.email,
      subject: "Password Reset Request",
      html: getBaseTemplate(content, "Password Reset")
    };

    await transporter.sendMail(mailOptions);
    console.log(`Password reset email sent to ${user.email}`);
  } catch (error) {
    console.error('Error sending password reset email:', error);
  }
};

// Send task reminder email
const sendTaskReminderEmail = async (user, tasks) => {
  try {
    if (!user.settings.notifications.email.taskReminders) {
      return; // User has disabled task reminder emails
    }

    const transporter = createTransporter();
    
    if (!transporter) {
      console.log(`Task reminder email would be sent to ${user.email} (email not configured)`);
      return;
    }
    
    const taskList = tasks.map(task => `
      <li>
        <strong>${task.title}</strong>
        ${task.dueDate ? `<br><small>Due: ${new Date(task.dueDate).toLocaleDateString()}</small>` : ''}
      </li>
    `).join('');
    
    const content = `
      <h2>Task Reminders for Today 📅</h2>
      <p>Hi ${user.name},</p>
      <p>You have ${tasks.length} task${tasks.length > 1 ? 's' : ''} scheduled for today:</p>
      
      <ul style="padding-left: 20px;">
        ${taskList}
      </ul>
      
      <p>
        <a href="${process.env.APP_URL}/tasks" class="button">View All Tasks</a>
      </p>
      
      <p>Have a productive day!</p>
    `;

    const mailOptions = {
      from: `"TaskGroove" <${process.env.FROM_EMAIL}>`,
      to: user.email,
      subject: `Task Reminders - ${tasks.length} task${tasks.length > 1 ? 's' : ''} for today`,
      html: getBaseTemplate(content, "Task Reminders")
    };

    await transporter.sendMail(mailOptions);
    console.log(`Task reminder email sent to ${user.email}`);
  } catch (error) {
    console.error('Error sending task reminder email:', error);
  }
};

// Send weekly report email
const sendWeeklyReportEmail = async (user, reportData) => {
  try {
    if (!user.settings.notifications.email.weeklyReports) {
      return;
    }

    const transporter = createTransporter();
    
    if (!transporter) {
      console.log(`Weekly report email would be sent to ${user.email} (email not configured)`);
      return;
    }
    
    const {
      tasksCompleted,
      totalTasks,
      timeTracked,
      productivityScore,
      streakDays,
      achievements
    } = reportData;
    
    const completionRate = totalTasks > 0 ? Math.round((tasksCompleted / totalTasks) * 100) : 0;
    const hours = Math.floor(timeTracked / 60);
    const minutes = timeTracked % 60;
    
    const achievementsList = achievements.length > 0 
      ? achievements.map(achievement => `<li>🏆 ${achievement.name}</li>`).join('')
      : '<li>No new achievements this week</li>';
    
    const content = `
      <h2>Your Weekly Productivity Report 📊</h2>
      <p>Hi ${user.name},</p>
      <p>Here's your productivity summary for this week:</p>
      
      <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
        <h3 style="margin-top: 0;">📈 This Week's Stats</h3>
        <ul style="list-style: none; padding: 0;">
          <li><strong>Tasks Completed:</strong> ${tasksCompleted} out of ${totalTasks} (${completionRate}%)</li>
          <li><strong>Time Tracked:</strong> ${hours}h ${minutes}m</li>
          <li><strong>Productivity Score:</strong> ${productivityScore}/100</li>
          <li><strong>Current Streak:</strong> ${streakDays} day${streakDays !== 1 ? 's' : ''}</li>
        </ul>
      </div>
      
      <h3>🏆 New Achievements</h3>
      <ul>
        ${achievementsList}
      </ul>
      
      <p>
        <a href="${process.env.APP_URL}/analytics" class="button">View Detailed Analytics</a>
      </p>
      
      <p>Keep up the great work!</p>
    `;

    const mailOptions = {
      from: `"TaskGroove" <${process.env.FROM_EMAIL}>`,
      to: user.email,
      subject: "Your Weekly Productivity Report",
      html: getBaseTemplate(content, "Weekly Report")
    };

    await transporter.sendMail(mailOptions);
    console.log(`Weekly report email sent to ${user.email}`);
  } catch (error) {
    console.error('Error sending weekly report email:', error);
  }
};

// Send subscription notification email
const sendSubscriptionNotificationEmail = async (user, type, details = {}) => {
  try {
    const transporter = createTransporter();
    
    if (!transporter) {
      console.log(`Subscription notification email would be sent to ${user.email} (email not configured)`);
      return;
    }
    
    let content = '';
    let subject = '';
    
    switch (type) {
      case 'upgraded':
        subject = 'Subscription Upgraded Successfully! 🎉';
        content = `
          <h2>Subscription Upgraded! 🎉</h2>
          <p>Hi ${user.name},</p>
          <p>Your subscription has been successfully upgraded to <strong>${details.plan}</strong>!</p>
          
          <div class="alert alert-success">
            <strong>What's new with your ${details.plan} plan:</strong>
            <ul>
              <li>Increased task and project limits</li>
              <li>Advanced analytics and insights</li>
              <li>Priority customer support</li>
              <li>Enhanced collaboration features</li>
            </ul>
          </div>
          
          <p>
            <a href="${process.env.APP_URL}/subscription" class="button">View Subscription Details</a>
          </p>
        `;
        break;
        
      case 'cancelled':
        subject = 'Subscription Cancelled';
        content = `
          <h2>Subscription Cancelled</h2>
          <p>Hi ${user.name},</p>
          <p>Your subscription has been cancelled. You'll continue to have access to premium features until ${new Date(details.endDate).toLocaleDateString()}.</p>
          
          <p>We're sorry to see you go. If you change your mind, you can reactivate your subscription at any time.</p>
          
          <p>
            <a href="${process.env.APP_URL}/subscription" class="button">Reactivate Subscription</a>
          </p>
        `;
        break;
        
      case 'trial_ending':
        subject = 'Your Trial is Ending Soon';
        content = `
          <h2>Your Trial Ends in ${details.daysLeft} Days</h2>
          <p>Hi ${user.name},</p>
          <p>Your free trial will end on ${new Date(details.endDate).toLocaleDateString()}. Don't lose access to your premium features!</p>
          
          <div class="alert alert-warning">
            <strong>What happens when your trial ends:</strong>
            <ul>
              <li>Your account will switch to the free plan</li>
              <li>Some features will be limited</li>
              <li>Your data will be preserved</li>
            </ul>
          </div>
          
          <p>
            <a href="${process.env.APP_URL}/upgrade" class="button">Upgrade Now</a>
          </p>
        `;
        break;
    }

    const mailOptions = {
      from: `"TaskGroove" <${process.env.FROM_EMAIL}>`,
      to: user.email,
      subject,
      html: getBaseTemplate(content, "Subscription Update")
    };

    await transporter.sendMail(mailOptions);
    console.log(`Subscription notification email sent to ${user.email}`);
  } catch (error) {
    console.error('Error sending subscription notification email:', error);
  }
};

// Send team invitation email
const sendTeamInvitationEmail = async (inviterUser, inviteeEmail, teamName, inviteToken) => {
  try {
    const transporter = createTransporter();
    
    if (!transporter) {
      console.log(`Team invitation email would be sent to ${inviteeEmail} (email not configured)`);
      return;
    }
    
    const inviteUrl = `${process.env.APP_URL}/accept-invite?token=${inviteToken}`;
    
    const content = `
      <h2>You're Invited to Join a Team! 👥</h2>
      <p><strong>${inviterUser.name}</strong> has invited you to join the team "<strong>${teamName}</strong>" on TaskGroove.</p>
      
      <p>
        <a href="${inviteUrl}" class="button">Accept Invitation</a>
      </p>
      
      <p>If the button doesn't work, you can copy and paste this link:</p>
      <p style="word-break: break-all; color: #6c757d;">${inviteUrl}</p>
      
      <p>This invitation will expire in 7 days.</p>
      
      <p>If you don't have a TaskGroove account yet, you'll be able to create one when you accept the invitation.</p>
    `;

    const mailOptions = {
      from: `"TaskGroove" <${process.env.FROM_EMAIL}>`,
      to: inviteeEmail,
      subject: `Invitation to join ${teamName} team`,
      html: getBaseTemplate(content, "Team Invitation")
    };

    await transporter.sendMail(mailOptions);
    console.log(`Team invitation email sent to ${inviteeEmail}`);
  } catch (error) {
    console.error('Error sending team invitation email:', error);
  }
};

module.exports = {
  sendWelcomeEmail,
  sendEmailVerification,
  sendPasswordResetEmail,
  sendTaskReminderEmail,
  sendWeeklyReportEmail,
  sendSubscriptionNotificationEmail,
  sendTeamInvitationEmail
};