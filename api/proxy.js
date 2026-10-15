/**
 * EduOS — retire the unsigned, generic database write proxy.
 * Sensitive operations belong in authenticated, operation-specific functions.
 * No request-supplied role, timestamp, table, query or payload is authority.
 * © 2026 NAFAS FOR ARTIFICIAL INTELLIGENCE — CN-6573712
 */
export default function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('Vary', 'Origin');
  // Do not grant cross-school CORS access or touch a database/audit table.
  if (req.method === 'OPTIONS') return res.status(204).end();
  return res.status(410).json({
    error: 'UNSIGNED_PROXY_RETIRED',
    message: 'هذا الوسيط غير الموثّق متوقف. استخدم الخدمة المحددة للعملية بعد التحقق من الهوية والصلاحية.'
  });
}
