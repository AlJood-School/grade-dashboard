/**
 * ══════════════════════════════════════════════════════════════════
 *  platform-news.js  v2.0
 *  محرك الأخبار الذكي — Realtime + Vibration + Acknowledgment
 *  © 2026 NAFAS FOR ARTIFICIAL INTELLIGENCE · CN-6573712
 *
 *  الاستخدام: أضف <div id="eduos-news-panel"></div> ثم EduOSNews.init()
 *
 *  الجديد في v2:
 *   ✅ Supabase Realtime — ظهور فوري بلا تحديث الصفحة
 *   ✅ بنر طوارئ عاجل يعلو الشاشة كاملة
 *   ✅ اهتزاز: single / triple / continuous
 *   ✅ زر استلمت — يوقف الاهتزاز ويُسجَّل في DB
 *   ✅ SMS fallback للطوارئ الحرجة
 *   ✅ إعلانات الصف من المعلم/ة
 *   ✅ A-D Framework integration
 * ══════════════════════════════════════════════════════════════════
 */

window.EduOSNews = (() => {
  'use strict';

  const SB_URL  = 'https://zuyizaiugpmhmeycqton.supabase.co';
  const SB_ANON = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inp1eWl6YWl1Z3BtaG1leWNxdG9uIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MTU1MjI4MDAsImV4cCI6MjAzMTA5ODgwMH0.Vf4uGJDwvAg1V3n0h1OAtW35A1FMKbEXRaGzFxXfx48';
  const FN_URL  = `${SB_URL}/functions/v1/smart-news-engine`;

  // ── Vibration controller ────────────────────────────────────
  let _vibInterval = null;

  function vibrate(level) {
    if (!navigator.vibrate) return;
    stopVibration();
    if (level === 'single')     navigator.vibrate([300]);
    if (level === 'triple')     navigator.vibrate([300, 100, 300, 100, 300]);
    if (level === 'continuous') {
      navigator.vibrate([500, 300]);
      _vibInterval = setInterval(() => navigator.vibrate([500, 300]), 2000);
    }
  }

  function stopVibration() {
    if (_vibInterval) { clearInterval(_vibInterval); _vibInterval = null; }
    if (navigator.vibrate) navigator.vibrate(0);
  }

  // ── Sound alert ────────────────────────────────────────────
  function playAlert(level) {
    try {
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      const oscillator = ctx.createOscillator();
      const gain = ctx.createGain();
      oscillator.connect(gain);
      gain.connect(ctx.destination);
      oscillator.frequency.value = level === 'continuous' ? 880 : 660;
      oscillator.type = 'sine';
      gain.gain.setValueAtTime(0.3, ctx.currentTime);
      oscillator.start();
      if (level === 'continuous') {
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 2);
        oscillator.stop(ctx.currentTime + 2);
      } else {
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.8);
        oscillator.stop(ctx.currentTime + 0.8);
      }
    } catch (e) { /* audio blocked */ }
  }

  // ── Get current user ────────────────────────────────────────
  function getUser() {
    try { return JSON.parse(sessionStorage.getItem('edoos_user') || '{}'); }
    catch { return {}; }
  }

  // ── EMERGENCY BANNER ────────────────────────────────────────
  const _activeEmergencies = new Set();

  function showEmergencyBanner(item) {
    if (_activeEmergencies.has(item.id)) return;
    _activeEmergencies.add(item.id);

    // Vibrate + sound
    vibrate(item.vibration_level || 'triple');
    playAlert(item.vibration_level || 'triple');

    // Inject keyframe animation
    if (!document.getElementById('eduos-emergency-css')) {
      const style = document.createElement('style');
      style.id = 'eduos-emergency-css';
      style.textContent = `
        @keyframes eduos-flash { 0%,100%{opacity:1} 50%{opacity:.7} }
        @keyframes eduos-slidein { from{transform:translateY(-100%)} to{transform:translateY(0)} }
        @keyframes eduos-pulse-border { 0%,100%{box-shadow:0 0 0 0 rgba(220,38,38,.6)} 50%{box-shadow:0 0 0 12px rgba(220,38,38,0)} }
      `;
      document.head.appendChild(style);
    }

    const banner = document.createElement('div');
    banner.id = `eduos-emergency-${item.id}`;
    banner.dir = 'rtl';
    banner.style.cssText = `
      position:fixed;top:0;left:0;right:0;z-index:999999;
      background:linear-gradient(135deg,#991B1B,#DC2626);
      color:white;padding:0;
      animation:eduos-slidein .4s ease,eduos-flash 1.5s infinite;
      font-family:'Tajawal',Arial,sans-serif;
      box-shadow:0 4px 20px rgba(0,0,0,.5);
    `;
    banner.innerHTML = `
      <div style="display:flex;align-items:center;gap:16px;padding:14px 20px;flex-wrap:wrap;">
        <div style="
          background:rgba(255,255,255,.2);border-radius:50%;
          width:44px;height:44px;display:flex;align-items:center;justify-content:center;
          font-size:22px;flex-shrink:0;animation:eduos-pulse-border 1s infinite;
        ">🚨</div>
        <div style="flex:1;min-width:200px;">
          <div style="font-size:13px;opacity:.85;margin-bottom:2px;">
            🔴 تنبيه طارئ عاجل
            ${item.source_name ? `· ${item.source_name}` : ''}
          </div>
          <div style="font-size:16px;font-weight:700;line-height:1.4;">${item.title}</div>
          ${item.content ? `<div style="font-size:13px;opacity:.9;margin-top:4px;">${item.content}</div>` : ''}
        </div>
        <div style="display:flex;gap:10px;flex-shrink:0;align-items:center;">
          ${item.requires_ack ? `
          <button onclick="EduOSNews.acknowledge('${item.id}','${item.type || 'news'}')"
            style="
              background:white;color:#DC2626;border:none;border-radius:8px;
              padding:10px 20px;font-size:14px;font-weight:700;cursor:pointer;
              font-family:'Tajawal',Arial,sans-serif;
            ">✅ استلمت</button>` : ''}
          <button onclick="EduOSNews.dismissBanner('${item.id}')"
            style="
              background:rgba(255,255,255,.15);color:white;border:1px solid rgba(255,255,255,.3);
              border-radius:8px;padding:10px 16px;font-size:13px;cursor:pointer;
              font-family:'Tajawal',Arial,sans-serif;
            ">✕</button>
        </div>
      </div>
    `;

    document.body.insertBefore(banner, document.body.firstChild);

    // Push page content down
    document.body.style.marginTop = (banner.offsetHeight + 4) + 'px';
  }

  // ── SUPABASE REALTIME ────────────────────────────────────────
  let _realtimeConn = null;

  function initRealtime(user) {
    if (typeof window.supabase !== 'undefined') {
      _startRealtime(window.supabase, user);
      return;
    }

    // Load Supabase JS if not present
    const script = document.createElement('script');
    script.src = 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/dist/umd/supabase.min.js';
    script.onload = () => {
      const sbClient = window.supabase.createClient(SB_URL, SB_ANON);
      _startRealtime(sbClient, user);
    };
    document.head.appendChild(script);
  }

  function _startRealtime(sbClient, user) {
    if (_realtimeConn) { sbClient.removeChannel(_realtimeConn); }

    _realtimeConn = sbClient.channel('eduos-news-live')
      // Watch education_news inserts
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'education_news',
      }, payload => {
        const item = payload.new;
        if (!item.is_active) return;

        // Check if this role should see it
        const allowed = ROLE_AUDIENCE[user.role] || ['all'];
        const itemAud = item.audience || ['all'];
        const shouldSee = itemAud.some(a => allowed.includes(a));
        if (!shouldSee) return;

        // Emergency → banner immediately
        if (item.category === 'emergency' || item.severity === 'high') {
          showEmergencyBanner({
            id: item.id, type: 'news',
            title: item.title_ar,
            content: item['content_' + user.role] || item.body_ar,
            source_name: item.source_name,
            vibration_level: item.vibration_level || 'triple',
            requires_ack: item.requires_ack,
          });
        }

        // Add to news panel without reload
        _prependNewsItem(item, user.role);
        _showLiveToast(`📰 خبر جديد: ${item.title_ar?.substring(0, 60)}...`);
      })
      // Watch class_announcements inserts
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'class_announcements',
      }, payload => {
        const item = payload.new;
        if (!item.is_active) return;

        // Check if user's class is in item.class_ids
        if (user.class_id && !item.class_ids?.includes(user.class_id)) return;

        if (item.severity === 'high') {
          showEmergencyBanner({
            id: item.id, type: 'class_ann',
            title: item.title_ar,
            content: item.body_ar,
            source_name: item.teacher_name,
            vibration_level: item.vibration_level || 'single',
            requires_ack: item.requires_ack,
          });
        } else {
          _showLiveToast(`📢 ${item.teacher_name || 'معلم/ة'}: ${item.title_ar?.substring(0, 50)}`);
        }

        _prependNewsItem({ ...item, category: item.ann_type, source_name: item.teacher_name }, user.role);
      })
      .subscribe();
  }

  const ROLE_AUDIENCE = {
    principal: ['all','staff','principal','teacher','secretary','security','nurse','technician'],
    admin: ['all','staff','principal'], teacher: ['all','staff','teacher'],
    security: ['all','staff','security'], nurse: ['all','staff','nurse'],
    technician: ['all','staff','technician'], secretary: ['all','staff','secretary'],
    observer: ['all','staff','principal'], parent: ['all','parent'], student: ['all','student'],
    specialist: ['all','staff','teacher'], social_worker: ['all','staff'],
  };

  // ── Live toast notification ────────────────────────────────
  function _showLiveToast(msg) {
    const t = document.createElement('div');
    t.dir = 'rtl';
    t.style.cssText = `
      position:fixed;bottom:24px;right:24px;z-index:99998;
      background:#1F2937;color:white;padding:12px 20px;border-radius:12px;
      font-family:'Tajawal',Arial,sans-serif;font-size:14px;
      box-shadow:0 4px 16px rgba(0,0,0,.3);
      animation:eduos-slidein .3s ease;max-width:340px;
    `;
    t.textContent = msg;
    document.body.appendChild(t);
    setTimeout(() => t.remove(), 4500);
  }

  // ── Prepend new item to panel ──────────────────────────────
  function _prependNewsItem(item, role) {
    const container = document.getElementById('eduos-news-items');
    if (!container) return;

    const mapped = {
      id: item.id, type: item.source_type === 'internal' || item.ann_type ? 'class' : 'official',
      category: item.category || item.ann_type || 'academic',
      severity: item.severity || 'normal',
      source_name: item.source_name, title: item.title_ar, body: item.body_ar,
      content: item['content_' + role] || item.body_ar,
      published_at: item.created_at || new Date().toISOString(),
      vibration_level: item.vibration_level, requires_ack: item.requires_ack,
    };

    const div = document.createElement('div');
    div.innerHTML = renderItem(mapped);
    div.firstElementChild.style.animation = 'eduos-slidein .4s ease';
    div.firstElementChild.style.borderColor = '#22D3EE';
    container.insertBefore(div.firstElementChild, container.firstChild);

    // Remove "no news" placeholder if exists
    const placeholder = container.querySelector('.no-news-placeholder');
    if (placeholder) placeholder.remove();
  }

  // ── Category metadata ────────────────────────────────────
  const CATEGORY_META = {
    emergency:   { icon: '🚨', label: 'طوارئ',             color: '#DC2626', bg: '#FEF2F2' },
    decision:    { icon: '📋', label: 'قرارات رسمية',      color: '#7C3AED', bg: '#F5F3FF' },
    curriculum:  { icon: '📚', label: 'مناهج وكتب',        color: '#0369A1', bg: '#EFF6FF' },
    calendar:    { icon: '🗓️', label: 'تقويم وإجازات',   color: '#065F46', bg: '#ECFDF5' },
    exam:        { icon: '📝', label: 'اختبارات',           color: '#B45309', bg: '#FFFBEB' },
    quiz:        { icon: '❓', label: 'اختبار قصير',        color: '#EA580C', bg: '#FFF7ED' },
    homework:    { icon: '📓', label: 'واجب منزلي',         color: '#1D4ED8', bg: '#EFF6FF' },
    activity:    { icon: '🎨', label: 'نشاط',               color: '#7C3AED', bg: '#F5F3FF' },
    absence:     { icon: '⚠️', label: 'غياب المعلم/ة',    color: '#D97706', bg: '#FFFBEB' },
    survey:      { icon: '📊', label: 'استبيان',            color: '#0891B2', bg: '#ECFEFF' },
    teacher_dev: { icon: '👩‍🏫', label: 'تطوير معلمين',   color: '#6D28D9', bg: '#EDE9FE' },
    academic:    { icon: '🎓', label: 'مستجدات أكاديمية',  color: '#1D4ED8', bg: '#EFF6FF' },
    competition: { icon: '🏆', label: 'مسابقات',            color: '#047857', bg: '#ECFDF5' },
    general:     { icon: '📌', label: 'إعلان',              color: '#374151', bg: '#F9FAFB' },
  };

  function formatDate(iso) {
    if (!iso) return '';
    return new Date(iso).toLocaleDateString('ar-AE', {
      weekday: 'short', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit',
    });
  }

  function renderItem(item) {
    const meta = CATEGORY_META[item.category] || CATEGORY_META.academic;
    const isEmergency = item.category === 'emergency' || item.severity === 'high';

    return `
      <div style="
        background:white;
        border:1px solid ${isEmergency ? '#FCA5A5' : '#E5E7EB'};
        border-right:4px solid ${meta.color};
        border-radius:10px;padding:14px 16px;
        margin-bottom:8px;
        ${isEmergency ? 'box-shadow:0 2px 12px rgba(220,38,38,.15);' : ''}
        transition:box-shadow .15s;
      "
      onmouseover="this.style.boxShadow='0 2px 10px rgba(0,0,0,.08)'"
      onmouseout="this.style.boxShadow='${isEmergency ? '0 2px 12px rgba(220,38,38,.15)' : 'none'}'">

        <div style="display:flex;justify-content:space-between;align-items:flex-start;gap:8px;flex-wrap:wrap;">
          <div style="flex:1;">
            <div style="display:flex;align-items:center;gap:6px;margin-bottom:6px;flex-wrap:wrap;">
              <span style="
                background:${meta.bg};color:${meta.color};
                font-size:11px;font-weight:700;padding:2px 10px;border-radius:20px;
                font-family:'Tajawal',Arial,sans-serif;
              ">${meta.icon} ${meta.label}</span>
              ${item.severity === 'high' ? `<span style="background:#FEE2E2;color:#DC2626;font-size:11px;font-weight:700;padding:2px 10px;border-radius:20px;font-family:'Tajawal',Arial,sans-serif;">🔴 عاجل</span>` : ''}
              ${item.severity === 'medium' ? `<span style="background:#FEF3C7;color:#D97706;font-size:11px;padding:2px 8px;border-radius:20px;font-family:'Tajawal',Arial,sans-serif;">⚠️ مهم</span>` : ''}
            </div>
            <div style="font-size:15px;font-weight:700;color:#111827;font-family:'Tajawal',Arial,sans-serif;line-height:1.5;margin-bottom:6px;">
              ${item.title || ''}
            </div>
            ${item.content ? `<div style="font-size:13px;color:#374151;font-family:'Tajawal',Arial,sans-serif;line-height:1.7;">${item.content}</div>` : ''}
          </div>
        </div>

        <div style="display:flex;justify-content:space-between;align-items:center;margin-top:10px;padding-top:8px;border-top:1px solid #F3F4F6;flex-wrap:wrap;gap:6px;">
          <span style="font-size:11px;color:#9CA3AF;font-family:'Tajawal',Arial,sans-serif;">
            📌 ${item.source_name || 'مصدر رسمي'}
          </span>
          <div style="display:flex;gap:8px;align-items:center;">
            ${item.requires_ack ? `
            <button onclick="EduOSNews.acknowledge('${item.id}','${item.type || 'news'}')"
              style="background:#D1FAE5;color:#065F46;border:none;border-radius:6px;
                padding:4px 12px;font-size:12px;cursor:pointer;font-family:'Tajawal',Arial,sans-serif;">
              ✅ استلمت
            </button>` : ''}
            <span style="font-size:11px;color:#9CA3AF;font-family:'Tajawal',Arial,sans-serif;">
              ${formatDate(item.published_at)}
            </span>
          </div>
        </div>
      </div>
    `;
  }

  function renderSkeleton() {
    return `<style>@keyframes pulse{0%,100%{opacity:1}50%{opacity:.5}}</style>` +
      Array(3).fill(0).map(() => `
        <div style="background:#F9FAFB;border-radius:10px;padding:16px;margin-bottom:10px;animation:pulse 1.5s infinite;">
          <div style="height:14px;background:#E5E7EB;border-radius:4px;margin-bottom:8px;width:30%;"></div>
          <div style="height:16px;background:#E5E7EB;border-radius:4px;margin-bottom:8px;width:70%;"></div>
          <div style="height:12px;background:#E5E7EB;border-radius:4px;width:90%;"></div>
        </div>
      `).join('');
  }

  function buildPanel() {
    return `
      <div dir="rtl" style="
        background:white;border-radius:14px;
        border:1px solid #E5E7EB;
        box-shadow:0 1px 4px rgba(0,0,0,.06);
        padding:20px;font-family:'Tajawal',Arial,sans-serif;
      ">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px;">
          <div style="display:flex;align-items:center;gap:10px;">
            <div style="
              width:38px;height:38px;border-radius:10px;
              background:linear-gradient(135deg,#6C3DD6,#22D3EE);
              display:flex;align-items:center;justify-content:center;font-size:18px;
            ">📰</div>
            <div>
              <div style="font-size:16px;font-weight:700;color:#111827;">أخبار التعليم</div>
              <div style="font-size:11px;color:#9CA3AF;">مباشر من المصادر الرسمية</div>
            </div>
          </div>
          <div style="display:flex;gap:8px;align-items:center;">
            <div id="eduos-news-live-indicator" style="
              width:8px;height:8px;border-radius:50%;background:#10B981;
              box-shadow:0 0 0 2px rgba(16,185,129,.3);display:none;
            " title="متصل بالوقت الفعلي"></div>
            <button onclick="EduOSNews.refresh()" style="
              background:#F3F4F6;border:none;border-radius:8px;
              padding:6px 14px;font-size:12px;color:#374151;cursor:pointer;
              font-family:'Tajawal',Arial,sans-serif;
            ">🔄 تحديث</button>
          </div>
        </div>
        <div id="eduos-news-items" style="max-height:70vh;overflow-y:auto;padding-left:2px;">
          ${renderSkeleton()}
        </div>
      </div>
    `;
  }

  async function loadNews() {
    const user = getUser();
    if (!user.role) return;
    const container = document.getElementById('eduos-news-items');
    if (!container) return;

    try {
      const resp = await fetch(FN_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${SB_ANON}` },
        body: JSON.stringify({
          action: 'fetch', role: user.role,
          school_id: user.school_id || null,
          class_id: user.class_id || null,
          limit: 20,
        }),
      });
      const data = await resp.json();
      if (!data.ok || !data.news?.length) {
        container.innerHTML = `<div class="no-news-placeholder" dir="rtl" style="text-align:center;padding:32px;color:#6B7280;font-size:15px;font-family:'Tajawal',Arial,sans-serif;">📰 لا توجد أخبار جديدة حالياً</div>`;
        return;
      }

      // Group: emergencies first, then by time
      const sorted = data.news.sort((a, b) => {
        if (a.category === 'emergency' && b.category !== 'emergency') return -1;
        if (b.category === 'emergency' && a.category !== 'emergency') return 1;
        if (a.severity === 'high' && b.severity !== 'high') return -1;
        if (b.severity === 'high' && a.severity !== 'high') return 1;
        return new Date(b.published_at).getTime() - new Date(a.published_at).getTime();
      });

      container.innerHTML = sorted.map(item => renderItem(item)).join('');

      // Show emergency banners for unacknowledged high-severity
      for (const item of data.news) {
        if ((item.category === 'emergency' || item.severity === 'high') && item.requires_ack) {
          showEmergencyBanner(item);
        }
      }

    } catch (err) {
      container.innerHTML = `<div dir="rtl" style="color:#DC2626;font-size:13px;padding:12px;font-family:'Tajawal',Arial,sans-serif;">تعذّر تحميل الأخبار — حاول لاحقاً</div>`;
    }
  }

  let _refreshTimer = null;

  // ── Public API ───────────────────────────────────────────────
  return {
    init(containerId = 'eduos-news-panel') {
      const el = document.getElementById(containerId);
      if (!el) return;
      el.innerHTML = buildPanel();
      loadNews();

      // Start Realtime
      const user = getUser();
      if (user.role) {
        initRealtime(user);
        const indicator = document.getElementById('eduos-news-live-indicator');
        if (indicator) indicator.style.display = 'block';
      }

      // Auto-refresh every 30 min as fallback
      if (_refreshTimer) clearInterval(_refreshTimer);
      _refreshTimer = setInterval(loadNews, 30 * 60 * 1000);
    },

    refresh() {
      loadNews();
    },

    dismissBanner(newsId) {
      const banner = document.getElementById(`eduos-emergency-${newsId}`);
      if (banner) {
        banner.remove();
        document.body.style.marginTop = '';
      }
      stopVibration();
      _activeEmergencies.delete(newsId);
    },

    async acknowledge(itemId, type = 'news') {
      const user = getUser();
      stopVibration();

      // Remove banner
      this.dismissBanner(itemId);

      // Mark in DB
      try {
        await fetch(FN_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${SB_ANON}` },
          body: JSON.stringify({
            action: 'acknowledge',
            [type === 'news' ? 'news_id' : 'ann_id']: itemId,
            user_role: user.role,
            user_name: user.name || user.email || 'مستخدم/ة',
            school_id: user.school_id,
          }),
        });

        // Visual feedback on button
        const btn = document.querySelector(`[onclick*="acknowledge('${itemId}'"]`);
        if (btn) {
          btn.textContent = '✅ تم التسجيل';
          btn.style.background = '#D1FAE5';
          btn.disabled = true;
        }
      } catch (e) { console.warn('[EduOSNews] ack error:', e); }
    },

    // Teacher: post class announcement
    async postClassAnn(annData) {
      const user = getUser();
      if (user.role !== 'teacher' && user.role !== 'principal' && user.role !== 'admin') {
        alert('غير مصرح — هذه الميزة للمعلمين/ات فقط');
        return;
      }

      // A-D Level B: show confirm
      const confirm = await _adConfirm('B',
        `نشر إعلان "${annData.title_ar}" للصف ${annData.class_ids?.join('، ')}؟`
      );
      if (!confirm) return;

      const resp = await fetch(FN_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${SB_ANON}` },
        body: JSON.stringify({
          action: 'post_class_ann',
          role: user.role,
          user_name: user.name,
          school_id: user.school_id,
          ...annData,
        }),
      });
      return await resp.json();
    },
  };

  function _adConfirm(level, message) {
    return new Promise(resolve => {
      const overlay = document.createElement('div');
      overlay.style.cssText = `
        position:fixed;inset:0;z-index:999997;
        background:rgba(0,0,0,.5);display:flex;align-items:center;justify-content:center;
      `;
      overlay.innerHTML = `
        <div dir="rtl" style="
          background:white;border-radius:16px;padding:28px 24px;max-width:380px;width:90%;
          font-family:'Tajawal',Arial,sans-serif;text-align:center;
        ">
          <div style="font-size:28px;margin-bottom:12px;">📢</div>
          <div style="font-size:11px;color:#6B7280;margin-bottom:8px;">مستوى الصلاحية: ${level}</div>
          <div style="font-size:16px;font-weight:600;color:#111827;margin-bottom:20px;">${message}</div>
          <div style="display:flex;gap:10px;justify-content:center;">
            <button onclick="this.closest('.ad-modal').dataset.result='yes'"
              style="background:#6C3DD6;color:white;border:none;border-radius:8px;padding:10px 24px;font-size:14px;cursor:pointer;font-family:'Tajawal',Arial,sans-serif;">
              ✅ تأكيد
            </button>
            <button onclick="this.closest('.ad-modal').dataset.result='no'"
              style="background:#F3F4F6;color:#374151;border:none;border-radius:8px;padding:10px 24px;font-size:14px;cursor:pointer;font-family:'Tajawal',Arial,sans-serif;">
              إلغاء
            </button>
          </div>
        </div>
      `;
      overlay.querySelector('div').classList.add('ad-modal');
      document.body.appendChild(overlay);

      const observer = new MutationObserver(() => {
        const modal = overlay.querySelector('.ad-modal');
        if (modal?.dataset.result) {
          observer.disconnect();
          overlay.remove();
          resolve(modal.dataset.result === 'yes');
        }
      });
      observer.observe(overlay.querySelector('.ad-modal'), { attributes: true });
    });
  }

})();
