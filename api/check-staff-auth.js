// api/check-staff-auth.js
// Vercel serverless function — verifies staff login using service role key
// Called by index.html checkStaffPassword() to bypass RLS on anon key

export default async function handler(req, res) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { username, passwordHash } = req.body || {};
  if (!username || !passwordHash) {
    return res.status(400).json({ error: 'Missing username or passwordHash' });
  }

  const SUPABASE_URL = process.env.SUPABASE_URL || 'https://zuyizaiugpmhmeycqton.supabase.co';
  const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY;

  if (!SUPABASE_SERVICE_KEY) {
    return res.status(500).json({ error: 'Server configuration error' });
  }

  try {
    const url = `${SUPABASE_URL}/rest/v1/staff_passwords?username=eq.${encodeURIComponent(username)}&limit=1`;
    const r = await fetch(url, {
      headers: {
        'apikey': SUPABASE_SERVICE_KEY,
        'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`,
        'Content-Type': 'application/json'
      }
    });

    if (!r.ok) return res.status(200).json(null);
    
    const data = await r.json();
    if (!data || !data.length) return res.status(200).json(null);
    
    const rec = data[0];
    // Only return the record if the hash matches
    if (rec.password_hash !== passwordHash) return res.status(200).json(null);
    
    // Return record without the full hash for security
    return res.status(200).json({
      id: rec.id,
      staff_id: rec.staff_id,
      username: rec.username,
      must_change_password: rec.must_change_password,
      first_login_at: rec.first_login_at,
      last_changed_at: rec.last_changed_at
    });
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
}
