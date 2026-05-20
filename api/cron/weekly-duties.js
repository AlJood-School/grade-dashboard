/**
 * Cron Job: Weekly Duties Scheduler
 * Schedule: 0 14 * * 0 (Sunday 6pm UAE = Sunday 14:00 UTC)
 * Purpose: Generate duty notifications for next week's schedule
 */

export default async function handler(req, res) {
  // Verify request is from Vercel Cron (or allow for development)
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret && req.headers.authorization !== `Bearer ${cronSecret}`) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const SUPABASE_URL = process.env.SUPABASE_URL;
  const SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY;

  const headers = {
    'apikey': SERVICE_KEY,
    'Authorization': `Bearer ${SERVICE_KEY}`,
    'Content-Type': 'application/json',
    'Prefer': 'return=representation'
  };

  try {
    // Calculate next Sunday
    const today = new Date();
    const daysUntilSunday = (7 - today.getDay()) % 7 || 7;
    const nextSunday = new Date(today);
    nextSunday.setDate(today.getDate() + daysUntilSunday);
    const weekStart = nextSunday.toISOString().split('T')[0];

    console.log(`[weekly-duties] Looking for schedules with week_start = ${weekStart}`);

    // Fetch schedules for next week
    const schedulesRes = await fetch(
      `${SUPABASE_URL}/rest/v1/schedules?week_start=eq.${weekStart}&select=*`,
      { headers }
    );

    if (!schedulesRes.ok) {
      const err = await schedulesRes.text();
      throw new Error(`Failed to fetch schedules: ${err}`);
    }

    const schedules = await schedulesRes.json();
    console.log(`[weekly-duties] Found ${schedules.length} schedules for week ${weekStart}`);

    if (schedules.length === 0) {
      return res.status(200).json({
        success: true,
        message: 'No schedules found for next week',
        notifications_created: 0
      });
    }

    // Build notifications array
    const notifications = schedules.map((schedule) => {
      // Format duty day label (Arabic)
      const dayNames = {
        0: 'الأحد',
        1: 'الاثنين',
        2: 'الثلاثاء',
        3: 'الأربعاء',
        4: 'الخميس',
        5: 'الجمعة',
        6: 'السبت'
      };

      const dutyDate = schedule.duty_date
        ? new Date(schedule.duty_date).toLocaleDateString('ar-AE', {
            day: 'numeric',
            month: 'long'
          })
        : 'غير محدد';

      const dayLabel = schedule.day_of_week !== undefined
        ? (dayNames[schedule.day_of_week] || 'يوم غير محدد')
        : 'يوم غير محدد';

      const location = schedule.location || 'موقع غير محدد';

      return {
        staff_id: schedule.staff_id,
        type: 'duty',
        title: 'تذكير: مناوبة الأسبوع القادم',
        message: `لديكِ مناوبة ${dayLabel} ${dutyDate} — الموقع: ${location}`,
        is_read: false,
        created_at: new Date().toISOString()
      };
    });

    // Insert notifications into Supabase
    const insertRes = await fetch(
      `${SUPABASE_URL}/rest/v1/notifications`,
      {
        method: 'POST',
        headers,
        body: JSON.stringify(notifications)
      }
    );

    if (!insertRes.ok) {
      const err = await insertRes.text();
      throw new Error(`Failed to insert notifications: ${err}`);
    }

    const inserted = await insertRes.json();
    const count = Array.isArray(inserted) ? inserted.length : notifications.length;

    console.log(`[weekly-duties] Created ${count} notifications`);

    return res.status(200).json({
      success: true,
      notifications_created: count,
      week_start: weekStart
    });

  } catch (error) {
    console.error('[weekly-duties] Error:', error);
    return res.status(500).json({ success: false, error: error.message });
  }
}
