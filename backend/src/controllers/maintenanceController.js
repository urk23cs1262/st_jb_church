const MaintenanceSetting = require('../models/MaintenanceSetting');
const User = require('../models/User');
const Notification = require('../models/Notification');
const { sendMail } = require('../config/mailer');
const { sendSMS } = require('../config/twilio');

// Helper to get or create singleton MaintenanceSetting document
const getOrCreateSettings = async () => {
  let settings = await MaintenanceSetting.findOne({ key: 'site_maintenance' });
  if (!settings) {
    settings = await MaintenanceSetting.create({ key: 'site_maintenance' });
  }
  return settings;
};

// GET /api/maintenance/status — Public maintenance status
const getPublicStatus = async (req, res) => {
  try {
    const settings = await getOrCreateSettings();

    // Check if countdown timer has expired to automatically end maintenance mode
    if (settings.isEnabled && settings.expectedCompletion && new Date(settings.expectedCompletion).getTime() <= Date.now()) {
      settings.isEnabled = false;
      settings.isEmergency = false;

      if (settings.history && settings.history.length > 0) {
        const lastLog = settings.history[settings.history.length - 1];
        if (!lastLog.endTime) {
          lastLog.endTime = new Date();
          const startMs = new Date(lastLog.startTime).getTime();
          const endMs = lastLog.endTime.getTime();
          lastLog.durationMinutes = Math.max(1, Math.round((endMs - startMs) / (1000 * 60)));
        }
      }

      await settings.save();

      // Automatically dispatch Mail & SMS/In-App notifications informing users that website is LIVE!
      dispatchWebsiteLiveNotices(settings);
    }

    res.json({
      success: true,
      isEnabled: settings.isEnabled,
      isEmergency: settings.isEmergency,
      emergencyReason: settings.emergencyReason,
      title: settings.title,
      message: settings.message,
      category: settings.category,
      expectedCompletion: settings.expectedCompletion,
      showCountdown: settings.showCountdown,
      contactPhone: settings.contactPhone,
      contactEmail: settings.contactEmail,
      socialLinks: settings.socialLinks,
      mediaUrl: settings.mediaUrl,
      mediaType: settings.mediaType,
      noticeBanner: settings.noticeBanner,
      scheduler: settings.scheduler,
      allowAdminLogin: settings.allowAdminLogin,
      allowTechTeam: settings.allowTechTeam,
      allowContentEditors: settings.allowContentEditors,
      allowPublic: settings.allowPublic
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// GET /api/maintenance/settings — Admin/Tech team settings view
const getMaintenanceSettings = async (req, res) => {
  try {
    const settings = await getOrCreateSettings();
    res.json({ success: true, settings });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// Helper to automatically dispatch email and in-app/SMS notifications when maintenance is enabled or emergency triggered
const dispatchAutomaticMaintenanceNotices = async (settings, isEmergency = false) => {
  try {
    const formattedCompletion = settings.expectedCompletion
      ? new Date(settings.expectedCompletion).toLocaleString('en-US', { day: 'numeric', month: 'short', year: 'numeric', hour: 'numeric', minute: '2-digit', hour12: true })
      : 'Shortly';

    let countdownText = '';
    if (settings.expectedCompletion) {
      const diffMs = new Date(settings.expectedCompletion).getTime() - Date.now();
      if (diffMs > 0) {
        const totalMinutes = Math.floor(diffMs / (1000 * 60));
        const hours = Math.floor(totalMinutes / 60);
        const minutes = totalMinutes % 60;
        if (hours > 0) {
          countdownText = `${hours} hrs ${minutes} mins`;
        } else {
          countdownText = `${minutes} mins`;
        }
      }
    }

    const countdownBadge = countdownText ? `⏳ Estimated Time: ${countdownText}` : '⏳ Work In Progress';

    const subject = isEmergency 
      ? `🚨 EMERGENCY NOTICE: St. John de Britto's Church Website Temporary Shutdown`
      : settings.notificationTemplate?.emailSubject || `St. John de Britto's Church Website Maintenance Notice`;

    const bodyText = isEmergency
      ? `Dear Parishioner,\n\nOur church website has been temporarily locked due to emergency maintenance: ${settings.emergencyReason || settings.message}\n\nExpected completion: ${formattedCompletion} (${countdownBadge})\n\nWe apologize for any inconvenience.`
      : settings.notificationTemplate?.emailBody
        ? settings.notificationTemplate.emailBody.replace(/\{EXPECTED_COMPLETION\}/g, `${formattedCompletion} (${countdownBadge})`)
        : `Dear Parishioner,\n\nOur website is currently undergoing maintenance. ${settings.message}\n\nExpected completion: ${formattedCompletion} (${countdownBadge})`;

    const smsMessage = isEmergency
      ? `🚨 Emergency Shutdown: Website locked. Expected completion: ${formattedCompletion} (${countdownBadge}).`
      : `🚧 Website Maintenance Notice: ${settings.message} Expected completion: ${formattedCompletion} (${countdownBadge}).`;

    // Get all registered users
    const users = await User.find({ isActive: { $ne: false } }).select('name email phone role');

    let emailSent = 0;
    let notifSent = 0;

    // 1. Dispatch Email to users with email
    for (const u of users) {
      if (u.email) {
        try {
          await sendMail({
            to: u.email,
            subject,
            text: bodyText,
            html: `
              <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden;">
                <div style="background-color: ${isEmergency ? '#dc2626' : '#1e3a8a'}; color: #ffffff; padding: 24px; text-align: center;">
                  <h1 style="margin: 0; font-size: 20px;">St. John de Britto's Church</h1>
                  <p style="margin: 4px 0 0 0; color: #f59e0b; font-size: 13px; font-weight: bold;">Kalayarkoil — Official Notice</p>
                </div>
                <div style="padding: 24px; color: #1e293b; line-height: 1.6;">
                  <div style="background-color: ${isEmergency ? '#fef2f2' : '#fef3c7'}; border-left: 4px solid ${isEmergency ? '#dc2626' : '#d97706'}; padding: 12px; margin-bottom: 20px; border-radius: 4px;">
                    <strong style="color: ${isEmergency ? '#991b1b' : '#92400e'};">${isEmergency ? '🚨 Emergency Website Shutdown' : '🚧 Website Maintenance Notice'}</strong>
                  </div>
                  
                  <!-- Digital Countdown Box -->
                  <div style="background-color: #0f172a; color: #fbbf24; padding: 16px; border-radius: 8px; text-align: center; font-family: monospace; font-size: 18px; font-weight: bold; letter-spacing: 1px; margin: 16px 0;">
                    ${countdownBadge.toUpperCase()}
                    <div style="font-size: 11px; font-weight: normal; color: #94a3b8; margin-top: 4px; font-family: Arial, sans-serif;">
                      Expected Completion: ${formattedCompletion}
                    </div>
                  </div>

                  <pre style="font-family: inherit; white-space: pre-wrap; margin: 0; font-size: 14px;">${bodyText}</pre>
                </div>
              </div>
            `
          });
          emailSent++;
        } catch (e) {
          console.error(`Automatic email notice error for ${u.email}:`, e.message);
        }
      }

      // 2. In-App / SMS Notification with Countdown
      try {
        await Notification.create({
          userId: u._id,
          title: isEmergency ? '🚨 Emergency Maintenance Shutdown' : '🚧 Website Maintenance Notice',
          message: smsMessage,
          type: 'announcement',
          link: '/maintenance'
        });
        notifSent++;
      } catch (e) {}
    }

    // Update counts on last history entry
    if (settings.history && settings.history.length > 0) {
      const lastLog = settings.history[settings.history.length - 1];
      lastLog.emailSentCount = (lastLog.emailSentCount || 0) + emailSent;
      lastLog.smsSentCount = (lastLog.smsSentCount || 0) + notifSent;
    }
  } catch (err) {
    console.error('Automatic maintenance notice dispatch error:', err);
  }
};

// Helper to automatically dispatch email and in-app/SMS notifications when maintenance ends & website goes LIVE
const dispatchWebsiteLiveNotices = async (settings) => {
  try {
    const siteUrl = process.env.CLIENT_URL || 'http://localhost:5174';
    const subject = `🎉 St. John de Britto's Church Website is Now LIVE!`;

    const bodyText = `Dear Parishioner,\n\nOur church website maintenance is complete! The portal is now fully online and available for live access.\n\nThank you for your patience and prayers.\n\nVisit Website: ${siteUrl}`;

    const smsMessage = `🎉 Website Maintenance Complete! St. John de Britto's Church portal is now LIVE. Welcome back! ${siteUrl}`;

    // Get all registered users
    const users = await User.find({ isActive: { $ne: false } }).select('name email phone role');

    let emailSent = 0;
    let smsSent = 0;
    let notifSent = 0;

    // Dispatch Email, SMS, and In-App notification to all users
    for (const u of users) {
      // 1. Dispatch Email to users with email
      if (u.email) {
        try {
          await sendMail({
            to: u.email,
            subject,
            text: bodyText,
            html: `
              <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden;">
                <div style="background-color: #059669; color: #ffffff; padding: 24px; text-align: center;">
                  <h1 style="margin: 0; font-size: 20px;">St. John de Britto's Church</h1>
                  <p style="margin: 4px 0 0 0; color: #a7f3d0; font-size: 13px; font-weight: bold;">Kalayarkoil — Official Portal</p>
                </div>
                <div style="padding: 24px; color: #1e293b; line-height: 1.6;">
                  <div style="background-color: #ecfdf5; border-left: 4px solid #10b981; padding: 12px; margin-bottom: 20px; border-radius: 4px;">
                    <strong style="color: #065f46;">🎉 Maintenance Complete — Website is Live!</strong>
                  </div>

                  <p style="font-size: 14px; margin: 0 0 16px 0;">Dear Parishioner,</p>
                  <p style="font-size: 14px; margin: 0 0 16px 0;">Our church website maintenance is finished! All online services, Mass schedules, announcements, and booking features are fully operational.</p>
                  
                  <div style="text-align: center; margin: 24px 0;">
                    <a href="${siteUrl}" style="background-color: #059669; color: #ffffff; text-decoration: none; padding: 12px 28px; border-radius: 8px; font-weight: bold; font-size: 14px; display: inline-block;">
                      Access Parish Portal Now →
                    </a>
                  </div>

                  <div style="margin-top: 24px; padding-top: 16px; border-top: 1px solid #e2e8f0; font-size: 12px; color: #64748b; text-align: center;">
                    Thank you for your patience and ongoing support.
                  </div>
                </div>
              </div>
            `
          });
          emailSent++;
        } catch (e) {
          console.error(`Automatic live email notice error for ${u.email}:`, e.message);
        }
      }

      // 2. Dispatch SMS to users with phone
      if (u.phone) {
        try {
          let formattedPhone = u.phone.trim();
          if (formattedPhone.length === 10 && !formattedPhone.startsWith('+')) {
            formattedPhone = `+91${formattedPhone}`;
          } else if (!formattedPhone.startsWith('+')) {
            formattedPhone = `+${formattedPhone}`;
          }
          await sendSMS(formattedPhone, smsMessage);
          smsSent++;
        } catch (e) {
          console.error(`Automatic live SMS notice error for ${u.phone}:`, e.message);
        }
      }

      // 3. In-App Notification
      try {
        await Notification.create({
          userId: u._id,
          title: '🎉 Website Maintenance Complete — Now LIVE!',
          message: smsMessage,
          type: 'announcement',
          link: '/'
        });
        notifSent++;
      } catch (e) {}
    }

    // Update counts on last history entry if available
    if (settings && settings.history && settings.history.length > 0) {
      const lastLog = settings.history[settings.history.length - 1];
      lastLog.emailSentCount = (lastLog.emailSentCount || 0) + emailSent;
      lastLog.smsSentCount = (lastLog.smsSentCount || 0) + smsSent;
    }

    console.log(`🎉 Website LIVE notices dispatched! (Emails: ${emailSent}, SMS: ${smsSent}, Notifications: ${notifSent})`);
  } catch (err) {
    console.error('Automatic website live notice dispatch error:', err);
  }
};

// POST /api/maintenance/toggle — Toggle maintenance mode ON/OFF
const toggleMaintenanceMode = async (req, res) => {
  try {
    const { isEnabled, reason, category } = req.body;
    const settings = await getOrCreateSettings();

    const previousState = settings.isEnabled;
    settings.isEnabled = Boolean(isEnabled);

    if (!isEnabled) {
      settings.isEmergency = false;
      settings.emergencyReason = '';

      // Close open audit log entry
      if (settings.history && settings.history.length > 0) {
        const lastLog = settings.history[settings.history.length - 1];
        if (!lastLog.endTime) {
          lastLog.endTime = new Date();
          const startMs = new Date(lastLog.startTime).getTime();
          const endMs = lastLog.endTime.getTime();
          lastLog.durationMinutes = Math.max(1, Math.round((endMs - startMs) / (1000 * 60)));
        }
      }

      // Automatically dispatch email & in-app/SMS notices to all users informing that Website is LIVE!
      if (previousState) {
        dispatchWebsiteLiveNotices(settings);
      }
    } else {
      // Create new audit log entry
      const logEntry = {
        enabledBy: req.user ? req.user.name || req.user.email : 'Admin',
        enabledById: req.user ? req.user._id : null,
        reason: reason || 'Scheduled System Maintenance',
        category: category || settings.category || 'Scheduled Update',
        startTime: new Date(),
        ipAddress: req.ip || req.headers['x-forwarded-for'] || '127.0.0.1',
        triggerType: 'Manual'
      };
      settings.history.push(logEntry);

      // Automatically dispatch email & in-app/SMS notifications to all users
      dispatchAutomaticMaintenanceNotices(settings, false);
    }

    await settings.save();

    res.json({
      success: true,
      message: `Maintenance Mode is now ${settings.isEnabled ? 'ENABLED 🚧 (Users notified via Mail & SMS)' : 'DISABLED ✅'}`,
      settings
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// POST /api/maintenance/emergency — Trigger Emergency Shutdown
const triggerEmergencyShutdown = async (req, res) => {
  try {
    const { reason, category } = req.body;
    const settings = await getOrCreateSettings();

    settings.isEnabled = true;
    settings.isEmergency = true;
    settings.emergencyReason = reason || 'Emergency System Crash / Critical Vulnerability Mitigated';
    settings.title = 'EMERGENCY MAINTENANCE IN PROGRESS';
    settings.message = 'The website has been temporarily locked by the Technical Team due to an emergency system event. We are working swiftly to restore normal operation.';
    settings.category = category || 'Emergency Fix';
    settings.expectedCompletion = new Date(Date.now() + 1 * 60 * 60 * 1000); // Default +1 hour

    // Create Emergency Audit Log Entry
    const logEntry = {
      enabledBy: req.user ? req.user.name || req.user.email : 'System Admin',
      enabledById: req.user ? req.user._id : null,
      reason: settings.emergencyReason,
      category: 'Emergency Fix',
      startTime: new Date(),
      ipAddress: req.ip || req.headers['x-forwarded-for'] || '127.0.0.1',
      triggerType: 'Emergency'
    };
    settings.history.push(logEntry);

    // Automatically dispatch emergency email & in-app/SMS notifications to all users
    dispatchAutomaticMaintenanceNotices(settings, true);

    await settings.save();

    res.json({
      success: true,
      message: '🚨 Emergency Shutdown Activated! Users automatically notified via Mail & SMS.',
      settings
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// Helper to automatically dispatch email and SMS notices when a Maintenance Schedule is saved
const dispatchScheduledMaintenanceNotice = async (settings) => {
  try {
    const fromStr = settings.scheduler?.scheduledStart || settings.noticeBanner?.scheduledStartTime;
    const toStr = settings.scheduler?.scheduledEnd || settings.noticeBanner?.scheduledEndTime || settings.expectedCompletion;

    const format12H = (dateVal) => {
      if (!dateVal) return 'TBA';
      const d = new Date(dateVal);
      if (isNaN(d.getTime())) return 'TBA';
      return d.toLocaleString('en-US', { day: 'numeric', month: 'short', year: 'numeric', hour: 'numeric', minute: '2-digit', hour12: true });
    };

    const formattedStart = format12H(fromStr);
    const formattedEnd = format12H(toStr);

    const subject = `📅 SCHEDULED MAINTENANCE NOTICE: St. John de Britto's Church Website`;

    const bodyText = `Dear Parishioner,\n\nPlease be informed that scheduled website maintenance is planned for our church portal.\n\n📅 Scheduled Start: ${formattedStart}\n⏰ Expected Completion: ${formattedEnd}\n\nNotice Details: ${settings.message || 'Scheduled system maintenance and performance upgrade.'}\n\nThank you for your patience and support.`;

    const smsMessage = `📅 Scheduled Maintenance Alert: St. John de Britto Church website maintenance scheduled from ${formattedStart} to ${formattedEnd}. Details: ${settings.message || 'System Maintenance'}`;

    // Get all active registered users
    const users = await User.find({ isActive: { $ne: false } }).select('name email phone role');

    let emailSent = 0;
    let notifSent = 0;

    for (const u of users) {
      if (u.email) {
        try {
          await sendMail({
            to: u.email,
            subject,
            text: bodyText,
            html: `
              <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden;">
                <div style="background-color: #1e3a8a; color: #ffffff; padding: 24px; text-align: center;">
                  <h1 style="margin: 0; font-size: 20px;">St. John de Britto's Church</h1>
                  <p style="margin: 4px 0 0 0; color: #f59e0b; font-size: 13px; font-weight: bold;">Kalayarkoil — Scheduled Maintenance Notice</p>
                </div>
                <div style="padding: 24px; color: #1e293b; line-height: 1.6;">
                  <div style="background-color: #fef3c7; border-left: 4px solid #f59e0b; padding: 12px; margin-bottom: 20px; border-radius: 4px;">
                    <strong style="color: #92400e;">📅 Upcoming Scheduled Maintenance</strong>
                  </div>

                  <p style="font-size: 14px; margin: 0 0 16px 0;">Dear Parishioner,</p>
                  <p style="font-size: 14px; margin: 0 0 16px 0;">Our church website is scheduled for system maintenance and updates during the time window listed below:</p>

                  <div style="background-color: #f8fafc; border: 1px solid #cbd5e1; border-radius: 8px; padding: 16px; margin-bottom: 20px;">
                    <p style="margin: 0 0 8px 0; font-size: 14px; font-weight: bold; color: #1e3a8a;">⏰ Maintenance Window Details:</p>
                    <p style="margin: 0 0 6px 0; font-size: 13px;"><strong>• Scheduled Start:</strong> ${formattedStart}</p>
                    <p style="margin: 0 0 6px 0; font-size: 13px;"><strong>• Scheduled Completion:</strong> ${formattedEnd}</p>
                    <p style="margin: 0; font-size: 13px;"><strong>• Details:</strong> ${settings.message || 'Scheduled system maintenance'}</p>
                  </div>

                  <p style="font-size: 13px; color: #64748b; margin: 0;">During this period, some portal features may be temporarily offline. We appreciate your understanding.</p>
                </div>
              </div>
            `
          });
          emailSent++;
        } catch (e) {
          console.error(`Scheduled maintenance email error for ${u.email}:`, e.message);
        }
      }

      try {
        await Ticket.create({
          ticketId: `MAINT-SCHED-${Date.now()}-${Math.floor(Math.random()*1000)}`,
          user: u._id,
          subject: `📅 Scheduled Maintenance Notice`,
          category: 'General Inquiry',
          priority: 'Low',
          status: 'Closed',
          description: smsMessage,
          messages: [{
            sender: u._id,
            senderModel: 'User',
            text: smsMessage,
            createdAt: new Date()
          }]
        });
        notifSent++;
      } catch (e) {}
    }

    console.log(`📅 Scheduled maintenance notice dispatched! (Emails: ${emailSent}, Notifications: ${notifSent})`);
  } catch (err) {
    console.error('Scheduled maintenance notice dispatch error:', err);
  }
};

// PUT /api/maintenance/settings — Update maintenance configuration
const updateMaintenanceSettings = async (req, res) => {
  try {
    const settings = await getOrCreateSettings();

    const allowedFields = [
      'title', 'message', 'category', 'expectedCompletion', 'showCountdown',
      'allowAdminLogin', 'allowTechTeam', 'allowContentEditors', 'allowPublic',
      'contactPhone', 'contactEmail', 'socialLinks', 'mediaUrl', 'mediaType',
      'noticeBanner', 'scheduler', 'notificationTemplate'
    ];

    allowedFields.forEach(field => {
      if (req.body[field] !== undefined) {
        settings[field] = req.body[field];
      }
    });

    await settings.save();

    // Automatically dispatch scheduled maintenance notice emails if scheduler is enabled
    if (settings.scheduler?.isEnabled) {
      dispatchScheduledMaintenanceNotice(settings);
    }

    res.json({
      success: true,
      message: 'Maintenance settings saved successfully',
      settings
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// POST /api/maintenance/notify — Send maintenance email/SMS/push notifications
const sendMaintenanceNotices = async (req, res) => {
  try {
    const { channels, recipients, emailSubject, emailBody, smsBody } = req.body;
    const settings = await getOrCreateSettings();

    // Determine target users based on recipient checkboxes
    let userQuery = {};
    if (recipients.includes('all')) {
      userQuery = {};
    } else {
      const roleConditions = [];
      if (recipients.includes('members')) roleConditions.push({ memberStatus: 'Active' });
      if (recipients.includes('leaders')) roleConditions.push({ familyRole: 'Head' });
      if (recipients.includes('techTeam')) roleConditions.push({ role: { $in: ['admin', 'priest', 'staff'] } });

      if (roleConditions.length > 0) {
        userQuery = { $or: roleConditions };
      }
    }

    const targetUsers = await User.find(userQuery).select('name email phone role');

    let emailSuccessCount = 0;
    let smsSuccessCount = 0;

    const formattedCompletion = settings.expectedCompletion
      ? new Date(settings.expectedCompletion).toLocaleString('en-GB', { dateStyle: 'medium', timeStyle: 'short' })
      : 'Shortly';

    const finalEmailSubject = emailSubject || settings.notificationTemplate.emailSubject;
    const rawEmailBody = emailBody || settings.notificationTemplate.emailBody;
    const finalEmailBody = rawEmailBody.replace(/\{EXPECTED_COMPLETION\}/g, formattedCompletion);

    const rawSmsBody = smsBody || settings.notificationTemplate.smsBody;
    const finalSmsBody = rawSmsBody.replace(/\{EXPECTED_COMPLETION\}/g, formattedCompletion);

    // 1. Dispatch Emails
    if (channels.email && targetUsers.length > 0) {
      for (const u of targetUsers) {
        if (u.email) {
          try {
            await sendMail({
              to: u.email,
              subject: finalEmailSubject,
              text: finalEmailBody,
              html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden;">
                  <div style="background-color: #1e3a8a; color: #ffffff; padding: 24px; text-align: center;">
                    <h1 style="margin: 0; font-size: 20px;">St. John de Britto's Church</h1>
                    <p style="margin: 4px 0 0 0; color: #f59e0b; font-size: 13px; font-weight: bold;">Kalayarkoil — Official Notice</p>
                  </div>
                  <div style="padding: 24px; color: #1e293b; line-height: 1.6;">
                    <div style="background-color: #fef3c7; border-left: 4px solid #d97706; padding: 12px; margin-bottom: 20px; border-radius: 4px;">
                      <strong style="color: #92400e;">🚧 Website Maintenance Notice</strong>
                    </div>
                    <pre style="font-family: inherit; white-space: pre-wrap; margin: 0; font-size: 14px;">${finalEmailBody}</pre>
                    <div style="margin-top: 24px; padding-top: 16px; border-top: 1px solid #e2e8f0; font-size: 12px; color: #64748b;">
                      <strong>Expected Completion:</strong> ${formattedCompletion}
                    </div>
                  </div>
                </div>
              `
            });
            emailSuccessCount++;
          } catch (e) {
            console.error(`Email dispatch error for ${u.email}:`, e.message);
          }
        }
      }
    }

    // 2. Dispatch SMS / Push (Logged into Notification DB)
    if (channels.sms || channels.push) {
      smsSuccessCount = targetUsers.length;
      const notifications = targetUsers.map(u => ({
        userId: u._id,
        title: '🚧 Church Website Maintenance Notice',
        message: finalSmsBody,
        type: 'announcement',
        priority: 'high',
        icon: '🚧'
      }));
      await Notification.insertMany(notifications);
    }

    // Update numbers in latest audit log if active
    if (settings.history && settings.history.length > 0) {
      const currentLog = settings.history[settings.history.length - 1];
      currentLog.emailSentCount = (currentLog.emailSentCount || 0) + emailSuccessCount;
      currentLog.smsSentCount = (currentLog.smsSentCount || 0) + smsSuccessCount;
      await settings.save();
    }

    res.json({
      success: true,
      message: `Notifications dispatched successfully! (${emailSuccessCount} Email, ${smsSuccessCount} In-App/SMS)`,
      stats: {
        totalTargets: targetUsers.length,
        emailSuccessCount,
        smsSuccessCount
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// GET /api/maintenance/history — Fetch maintenance logs & analytics
const getMaintenanceHistory = async (req, res) => {
  try {
    const settings = await getOrCreateSettings();
    res.json({
      success: true,
      history: (settings.history || []).reverse(),
      analytics: {
        accessAttemptsCount: settings.accessAttemptsCount || 0,
        totalMaintenanceSessions: settings.history ? settings.history.length : 0
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// POST /api/maintenance/track-attempt — Track public access attempt during maintenance
const trackAccessAttempt = async (req, res) => {
  try {
    const settings = await getOrCreateSettings();
    settings.accessAttemptsCount = (settings.accessAttemptsCount || 0) + 1;
    await settings.save();
    res.json({ success: true, count: settings.accessAttemptsCount });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

module.exports = {
  getPublicStatus,
  getMaintenanceSettings,
  toggleMaintenanceMode,
  triggerEmergencyShutdown,
  updateMaintenanceSettings,
  sendMaintenanceNotices,
  getMaintenanceHistory,
  trackAccessAttempt,
  dispatchWebsiteLiveNotices
};
