/**
 * Cron Job: Database Backup Logger
 * Schedule: 0 1 */3 * * (Every 3 days at 5am UAE = 01:00 UTC)
 * Purpose: Log table counts as a lightweight backup record in Supabase
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
    const backupDate = new Date().toISOString().split('T')[0];
    console.log(`[backup] Starting backup log for ${backupDate}`);

    // Helper: fetch last 100 records and return count
    async function fetchTableCount(table) {
      try {
        const countHeaders = {
          ...headers,
          'Prefer': 'count=exact',
          'Range': '0-0'
        };
        const r = await fetch(
          `${SUPABASE_URL}/rest/v1/${table}?select=id&order=created_at.desc&limit=100`,
          { headers: countHeaders }
        );
        const contentRange = r.headers.get('content-range');
        if (contentRange) {
          const match = contentRange.match(/\/(\d+)$/);
          return match ? parseInt(match[1], 10) : 0;
        }
        if (r.ok) {
          const data = await r.json();
          return Array.isArray(data) ? data.length : 0;
        }
        return 0;
      } catch (e) {
        console.warn(`[backup] Could not fetch count for table ${table}:`, e.message);
        return null;
      }
    }

    // Main tables to check
    const mainTables = ['staff', 'students', 'worksheets', 'behavior_incidents'];

    // Fetch counts in parallel
    const counts = await Promise.all(mainTables.map((t) => fetchTableCount(t)));

    const tableCounts = {};
    mainTables.forEach((table, i) => {
      if (counts[i] !== null) {
        tableCounts[table] = counts[i];
      }
    });

    console.log(`[backup] Table counts:`, tableCounts);

    // Build backup record
    const backupRecord = {
      type: 'backup',
      data: {
        backup_date: backupDate,
        tables: tableCounts,
        status: 'completed',
        generated_at: new Date().toISOString()
      },
      created_at: new Date().toISOString()
    };

    // Insert backup log into reports table
    const insertRes = await fetch(
      `${SUPABASE_URL}/rest/v1/reports`,
      {
        method: 'POST',
        headers,
        body: JSON.stringify(backupRecord)
      }
    );

    if (!insertRes.ok) {
      const err = await insertRes.text();
      throw new Error(`Failed to insert backup record: ${err}`);
    }

    const inserted = await insertRes.json();
    const recordId = Array.isArray(inserted) && inserted[0] ? inserted[0].id : null;

    console.log(`[backup] Backup log created with id: ${recordId}`);

    return res.status(200).json({
      success: true,
      backup_logged: true,
      record_id: recordId,
      backup_date: backupDate,
      table_counts: tableCounts
    });

  } catch (error) {
    console.error('[backup] Error:', error);
    return res.status(500).json({ success: false, error: error.message });
  }
}
