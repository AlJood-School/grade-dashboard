/**
 * Cron Job: Weekly Report
 * Schedule: 0 6 * * 5 (Friday 10am UAE = 06:00 UTC)
 * Purpose: Aggregate last week's stats and store in reports table
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
    // Calculate last week's Monday–Friday range
    const today = new Date();
    const dayOfWeek = today.getDay(); // 0=Sun, 5=Fri

    // Last Monday (go back to last week's Monday)
    const lastMonday = new Date(today);
    lastMonday.setDate(today.getDate() - dayOfWeek - 4); // Friday - 4 = Monday
    // Actually: today is Friday (day 5), last Monday is 4 days ago
    // Let's compute properly:
    // Days since last Monday = dayOfWeek + (dayOfWeek >= 1 ? -1 : 6)
    // Simpler: get ISO week start (Monday) of the previous week
    const daysToLastMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1; // days since this week's Monday
    const thisMonday = new Date(today);
    thisMonday.setDate(today.getDate() - daysToLastMonday);

    const lastWeekMonday = new Date(thisMonday);
    lastWeekMonday.setDate(thisMonday.getDate() - 7);

    const lastWeekFriday = new Date(lastWeekMonday);
    lastWeekFriday.setDate(lastWeekMonday.getDate() + 4);

    const weekStart = lastWeekMonday.toISOString().split('T')[0];
    const weekEnd = lastWeekFriday.toISOString().split('T')[0];

    console.log(`[weekly-report] Generating report for ${weekStart} → ${weekEnd}`);

    // Helper: fetch count from a table with optional date filter
    async function fetchCount(table, dateField, startDate, endDate) {
      const url = `${SUPABASE_URL}/rest/v1/${table}?${dateField}=gte.${startDate}&${dateField}=lte.${endDate}&select=id`;
      const countHeaders = { ...headers, 'Prefer': 'count=exact', 'Range': '0-0' };
      const r = await fetch(url, { headers: countHeaders });
      const countHeader = r.headers.get('content-range');
      if (countHeader) {
        const match = countHeader.match(/\/(\d+)$/);
        return match ? parseInt(match[1], 10) : 0;
      }
      // Fallback: count from body
      if (r.ok) {
        const data = await r.json();
        return Array.isArray(data) ? data.length : 0;
      }
      return 0;
    }

    // Gather stats in parallel
    const [
      absencesCount,
      dutiesCount,
      substitutionsCount,
      worksheetsCount,
      incidentsCount
    ] = await Promise.all([
      fetchCount('staff_attendance', 'date', weekStart, weekEnd),
      fetchCount('duties', 'duty_date', weekStart, weekEnd),
      fetchCount('substitutions', 'date', weekStart, weekEnd),
      fetchCount('worksheets', 'created_at', weekStart, weekEnd),
      fetchCount('behavior_incidents', 'incident_date', weekStart, weekEnd)
    ]);

    console.log(`[weekly-report] Stats — absences:${absencesCount}, duties:${dutiesCount}, subs:${substitutionsCount}, worksheets:${worksheetsCount}, incidents:${incidentsCount}`);

    // Build report record
    const report = {
      type: 'weekly',
      week_start: weekStart,
      week_end: weekEnd,
      data: {
        absences: absencesCount,
        duties: dutiesCount,
        substitutions: substitutionsCount,
        worksheets_submitted: worksheetsCount,
        behavior_incidents: incidentsCount,
        generated_at: new Date().toISOString()
      },
      created_at: new Date().toISOString()
    };

    // Insert report into Supabase
    const insertRes = await fetch(
      `${SUPABASE_URL}/rest/v1/reports`,
      {
        method: 'POST',
        headers,
        body: JSON.stringify(report)
      }
    );

    if (!insertRes.ok) {
      const err = await insertRes.text();
      throw new Error(`Failed to insert report: ${err}`);
    }

    const inserted = await insertRes.json();
    const reportId = Array.isArray(inserted) && inserted[0] ? inserted[0].id : null;

    console.log(`[weekly-report] Report created with id: ${reportId}`);

    return res.status(200).json({
      success: true,
      report_id: reportId,
      week_start: weekStart,
      week_end: weekEnd,
      stats: report.data
    });

  } catch (error) {
    console.error('[weekly-report] Error:', error);
    return res.status(500).json({ success: false, error: error.message });
  }
}
