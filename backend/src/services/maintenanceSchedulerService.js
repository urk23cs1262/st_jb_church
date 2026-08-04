const MaintenanceSetting = require('../models/MaintenanceSetting');

const checkMaintenanceSchedule = async () => {
  try {
    const settings = await MaintenanceSetting.findOne({ key: 'site_maintenance' });
    if (!settings) {
      return;
    }

    const now = new Date();
    const schedulerEnabled = settings.scheduler && settings.scheduler.isEnabled;
    const scheduledStart = schedulerEnabled && settings.scheduler.scheduledStart ? new Date(settings.scheduler.scheduledStart) : null;
    const scheduledEnd = schedulerEnabled && settings.scheduler.scheduledEnd ? new Date(settings.scheduler.scheduledEnd) : null;
    const expectedCompletion = settings.expectedCompletion ? new Date(settings.expectedCompletion) : null;

    // 1. Auto Start Maintenance
    if (scheduledStart && now >= scheduledStart && (!scheduledEnd || now < scheduledEnd)) {
      if (!settings.isEnabled) {
        settings.isEnabled = true;
        settings.history.push({
          enabledBy: 'Automated Scheduler',
          reason: 'Scheduled Maintenance Auto-Start',
          category: settings.category || 'Scheduled Update',
          startTime: now,
          triggerType: 'Scheduled'
        });
        await settings.save();
        console.log('⏰ Scheduled Maintenance automatically ENABLED at:', now.toISOString());
      }
    }

    // 2. Auto End Maintenance (countdown timer finished OR scheduled end time reached)
    const isScheduledEndReached = scheduledEnd && now >= scheduledEnd;
    const isCountdownFinished = expectedCompletion && now >= expectedCompletion;

    if (settings.isEnabled && (isScheduledEndReached || isCountdownFinished)) {
      settings.isEnabled = false;
      settings.isEmergency = false;
      if (settings.scheduler) settings.scheduler.isEnabled = false; // Reset scheduler once completed

      if (settings.history && settings.history.length > 0) {
        const lastLog = settings.history[settings.history.length - 1];
        if (!lastLog.endTime) {
          lastLog.endTime = now;
          const startMs = new Date(lastLog.startTime).getTime();
          lastLog.durationMinutes = Math.max(1, Math.round((now.getTime() - startMs) / (1000 * 60)));
        }
      }

      await settings.save();
      console.log('✅ Scheduled Maintenance automatically COMPLETED & DISABLED at:', now.toISOString());

      // Dispatch Mail & SMS notifications informing parishioners that website is LIVE!
      try {
        const { dispatchWebsiteLiveNotices } = require('../controllers/maintenanceController');
        await dispatchWebsiteLiveNotices(settings);
      } catch (noticeErr) {
        console.error('Error dispatching live notices from scheduler:', noticeErr.message);
      }
    }
  } catch (err) {
    console.error('Error running maintenance scheduler check:', err.message);
  }
};

// Run check every 60 seconds
setInterval(checkMaintenanceSchedule, 60 * 1000);

module.exports = { checkMaintenanceSchedule };

