/**
 * Cron Job: Daily Substitutions
 * Schedule: 0 3 * * 1-5 (Mon–Fri 7am UAE = 03:00 UTC)
 * Purpose: Auto-assign substitutes for absent staff today
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
    const today = new Date().toISOString().split('T')[0];
    console.log(`[daily-substitutions] Processing substitutions for ${today}`);

    // 1. Fetch today's absences
    const absencesRes = await fetch(
      `${SUPABASE_URL}/rest/v1/staff_attendance?date=eq.${today}&status=eq.absent&select=*`,
      { headers }
    );

    if (!absencesRes.ok) {
      const err = await absencesRes.text();
      throw new Error(`Failed to fetch absences: ${err}`);
    }

    const absences = await absencesRes.json();
    console.log(`[daily-substitutions] Found ${absences.length} absences today`);

    if (absences.length === 0) {
      return res.status(200).json({
        success: true,
        message: 'No absences today',
        substitutions: []
      });
    }

    // 2. Fetch staff who are on duty today (to exclude them)
    const dutiesRes = await fetch(
      `${SUPABASE_URL}/rest/v1/duties?duty_date=eq.${today}&select=staff_id`,
      { headers }
    );
    const duties = dutiesRes.ok ? await dutiesRes.json() : [];
    const staffOnDuty = new Set(duties.map((d) => d.staff_id));

    // 3. Get IDs of absent staff
    const absentStaffIds = absences.map((a) => a.staff_id);

    // 4. Fetch available staff (not exempt from substitution)
    const availableRes = await fetch(
      `${SUPABASE_URL}/rest/v1/staff?exempt_from_substitution=eq.false&select=id,name`,
      { headers }
    );

    if (!availableRes.ok) {
      const err = await availableRes.text();
      throw new Error(`Failed to fetch available staff: ${err}`);
    }

    const allStaff = await availableRes.json();

    // Filter: not absent, not on duty
    const availableStaff = allStaff.filter(
      (s) => !absentStaffIds.includes(s.id) && !staffOnDuty.has(s.id)
    );

    console.log(`[daily-substitutions] ${availableStaff.length} staff available for substitution`);

    const substitutionRecords = [];
    const notificationRecords = [];
    let availableIndex = 0;

    for (const absence of absences) {
      if (availableIndex >= availableStaff.length) {
        console.warn('[daily-substitutions] Not enough available staff for all absences');
        break;
      }

      const substitute = availableStaff[availableIndex++];

      substitutionRecords.push({
        absent_staff_id: absence.staff_id,
        substitute_staff_id: substitute.id,
        date: today,
        created_at: new Date().toISOString()
      });

      notificationRecords.push({
        staff_id: substitute.id,
        type: 'substitution',
        title: 'تكليف احتياط اليوم',
        message: `لديكِ احتياط اليوم ${today} نيابةً عن إحدى المعلمات الغائبة`,
        is_read: false,
        created_at: new Date().toISOString()
      });
    }

    // 5. Insert substitution records
    if (substitutionRecords.length > 0) {
      const subInsertRes = await fetch(
        `${SUPABASE_URL}/rest/v1/substitutions`,
        {
          method: 'POST',
          headers,
          body: JSON.stringify(substitutionRecords)
        }
      );

      if (!subInsertRes.ok) {
        const err = await subInsertRes.text();
        throw new Error(`Failed to insert substitutions: ${err}`);
      }
    }

    // 6. Insert notifications
    if (notificationRecords.length > 0) {
      const notifInsertRes = await fetch(
        `${SUPABASE_URL}/rest/v1/notifications`,
        {
          method: 'POST',
          headers,
          body: JSON.stringify(notificationRecords)
        }
      );

      if (!notifInsertRes.ok) {
        const err = await notifInsertRes.text();
        console.warn('[daily-substitutions] Failed to insert notifications:', await notifInsertRes.text());
      }
    }

    console.log(`[daily-substitutions] Created ${substitutionRecords.length} substitution(s)`);

    return res.status(200).json({
      success: true,
      date: today,
      substitutions: substitutionRecords,
      notifications_created: notificationRecords.length
    });

  } catch (error) {
    console.error('[daily-substitutions] Error:', error);
    return res.status(500).json({ success: false, error: error.message });
  }
}
