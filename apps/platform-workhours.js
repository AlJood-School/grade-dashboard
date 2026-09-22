/**
 * platform-workhours.js — نظام ساعات العمل الذكي
 * الإصدار: 2.0 — 22 سبتمبر 2026
 *
 * المنطق الذكي (Timeline المتقطع):
 *   - كل مسح QR = نقطة بداية فترة عمل جديدة
 *   - الاستئذان المعتمد = فترة توقف موثقة
 *   - ساعات العمل = مجموع فترات التواجد الفعلي
 *   - تنبيه: إذا انتهى الاستئذان ولم يُسجَّل مسح جديد
 *
 * أوقات الحلقات:
 *   c1 (KG+G1-G4): بدء 7:10 | طوارئ 7:15 | تأخير 7:30
 *   c2 (G5-G8):    بدء 8:00 | طوارئ 8:05 | تأخير 8:15
 */
(function () {
  'use strict';

  var CYCLE = {
    c1: { dutyStart: 7 * 60 + 10, emergencyAt: 7 * 60 + 15, lateAt: 7 * 60 + 30 },
    c2: { dutyStart: 8 * 60,      emergencyAt: 8 * 60 + 5,  lateAt: 8 * 60 + 15 }
  };
  var TARGET_HOURS = 8;

  /* ─── تحديد الحلقة ─── */
  function detectCycle(staffDbId, sbUrl, sbKey) {
    return fetch(sbUrl + '/rest/v1/schedules?teacher_id=eq.' + encodeURIComponent(staffDbId) +
      '&is_active=eq.true&select=grade&limit=200',
      { headers: { apikey: sbKey, Authorization: 'Bearer ' + sbKey } })
      .then(function (r) { return r.json(); })
      .then(function (rows) {
        if (!rows || !rows.length) return 'c1';
        var c2 = rows.filter(function (r) { return ['5','6','7','8'].indexOf(String(r.grade)) !== -1; }).length;
        return c2 > rows.length - c2 ? 'c2' : 'c1';
      }).catch(function () { return 'c1'; });
  }

  /* ─── جلب كل المسحات والاستئذانات ─── */
  function fetchWorkData(staffDbId, sbUrl, sbKey) {
    var nowUAE = new Date(new Date().toLocaleString('en-US', { timeZone: 'Asia/Dubai' }));
    var todayStr = nowUAE.getFullYear() + '-' +
      String(nowUAE.getMonth() + 1).padStart(2, '0') + '-' +
      String(nowUAE.getDate()).padStart(2, '0');
    return Promise.all([
      fetch(sbUrl + '/rest/v1/staff_checkin_log?staff_id=eq.' + encodeURIComponent(staffDbId) +
        '&date=eq.' + todayStr + '&select=scanned_at,within_geofence&order=scanned_at.asc',
        { headers: { apikey: sbKey, Authorization: 'Bearer ' + sbKey } }).then(function (r) { return r.json(); }),
      fetch(sbUrl + '/rest/v1/leave_requests?staff_db_id=eq.' + encodeURIComponent(staffDbId) +
        '&request_date=eq.' + todayStr + '&leave_type=eq.personal&status=in.(approved,pending)' +
        '&select=id,hours,time_from,status&order=time_from.asc',
        { headers: { apikey: sbKey, Authorization: 'Bearer ' + sbKey } }).then(function (r) { return r.json(); })
    ]).then(function (res) {
      return { scans: res[0] || [], leaves: res[1] || [], today: todayStr };
    });
  }

  /* ─── منطق الـ Timeline الذكي ─── */
  function buildTimeline(scans, leaves) {
    var nowUAE = new Date(new Date().toLocaleString('en-US', { timeZone: 'Asia/Dubai' }));
    var todayBase = nowUAE.getFullYear() + '-' + String(nowUAE.getMonth() + 1).padStart(2, '0') + '-' + String(nowUAE.getDate()).padStart(2, '0');

    /* تحويل time_from إلى Date كامل */
    function timeToDate(timeStr) {
      if (!timeStr) return null;
      var parts = timeStr.split(':');
      var d = new Date(nowUAE);
      d.setHours(parseInt(parts[0], 10), parseInt(parts[1], 10), 0, 0);
      return d;
    }

    /* الاستئذانات المعتمدة كنوافذ زمنية */
    var leaveWindows = leaves
      .filter(function (l) { return l.status === 'approved' && l.time_from; })
      .map(function (l) {
        var start = timeToDate(l.time_from);
        var end = start ? new Date(start.getTime() + (l.hours || 0) * 3600000) : null;
        return { start: start, end: end, hours: l.hours, id: l.id };
      })
      .filter(function (lw) { return lw.start && lw.end; });

    /* الاستئذانات المعلقة */
    var pendingLeaves = leaves.filter(function (l) { return l.status === 'pending'; });
    var pendingH = pendingLeaves.reduce(function (s, l) { return s + (l.hours || 0); }, 0);

    var timeline = [];
    var totalWorkMs = 0;
    var firstCheckin = null;
    var lateMinutes = 0;

    /* إذا لا مسحات → لا عمل */
    if (!scans || !scans.length) {
      return {
        timeline: [],
        totalWorkHours: 0,
        firstCheckin: null,
        lateMinutes: 0,
        pendingLeaveH: pendingH,
        needsReturnScan: false,
        expectedCheckout: null
      };
    }

    /* معالجة كل مسح QR بالترتيب */
    for (var i = 0; i < scans.length; i++) {
      var scanTime = new Date(scans[i].scanned_at);
      var scanUAE = new Date(scanTime.toLocaleString('en-US', { timeZone: 'Asia/Dubai' }));

      if (i === 0) {
        firstCheckin = scanUAE;
        /* حساب التأخير */
        // الحلقة تُحدَّد خارجياً — نمرر الـ cycle لاحقاً
      }

      /* الفترة من هذا المسح حتى المسح التالي أو الآن */
      var periodStart = scanUAE;
      var periodEnd;
      if (i < scans.length - 1) {
        periodEnd = new Date(new Date(scans[i + 1].scanned_at).toLocaleString('en-US', { timeZone: 'Asia/Dubai' }));
      } else {
        periodEnd = nowUAE; /* آخر مسح → حتى الآن */
      }

      /* هل يوجد استئذان يتقاطع مع هذه الفترة؟ */
      var leaveInPeriod = leaveWindows.find(function (lw) {
        return lw.start >= periodStart && lw.start < periodEnd;
      });

      if (leaveInPeriod) {
        /* عمل من periodStart حتى بداية الاستئذان */
        var workEnd = leaveInPeriod.start;
        var workMs = workEnd - periodStart;
        if (workMs > 0) {
          totalWorkMs += workMs;
          timeline.push({ type: 'work', from: periodStart, to: workEnd, ms: workMs });
        }
        /* الاستئذان */
        timeline.push({ type: 'leave', from: leaveInPeriod.start, to: leaveInPeriod.end, hours: leaveInPeriod.hours });
        /* إذا كان هذا آخر مسح + انتهى الاستئذان → لا عمل بعده حتى مسح جديد */
        if (i === scans.length - 1 && leaveInPeriod.end <= nowUAE) {
          /* لا عمل حتى يُسجَّل مسح جديد */
        }
      } else {
        /* عمل نظيف من periodStart إلى periodEnd */
        /* لكن: اطرح أي استئذان داخل هذه الفترة (time_from فقط بدون مسح بعده) */
        var leaveInsidePeriod = leaveWindows.find(function (lw) {
          return lw.start >= periodStart && lw.end <= periodEnd;
        });
        if (leaveInsidePeriod && i === scans.length - 1) {
          /* استئذان داخل آخر فترة بدون مسح عودة */
          var w1Ms = leaveInsidePeriod.start - periodStart;
          if (w1Ms > 0) {
            totalWorkMs += w1Ms;
            timeline.push({ type: 'work', from: periodStart, to: leaveInsidePeriod.start, ms: w1Ms });
          }
          timeline.push({ type: 'leave', from: leaveInsidePeriod.start, to: leaveInsidePeriod.end, hours: leaveInsidePeriod.hours });
          /* لا عمل بعد الاستئذان حتى مسح جديد */
        } else {
          var wMs = periodEnd - periodStart;
          if (wMs > 0) {
            totalWorkMs += wMs;
            timeline.push({ type: 'work', from: periodStart, to: periodEnd, ms: wMs });
          }
        }
      }
    }

    /* هل تحتاج مسح عودة؟ */
    var needsReturnScan = leaveWindows.some(function (lw) {
      if (lw.end > nowUAE) return false; /* لم ينتهِ بعد */
      /* هل يوجد مسح بعد نهاية الاستئذان؟ */
      return !scans.some(function (s) {
        var st = new Date(new Date(s.scanned_at).toLocaleString('en-US', { timeZone: 'Asia/Dubai' }));
        return st > lw.end;
      });
    });

    /* الوقت المتوقع للخروج (من أول مسح + 8 ساعات + مجموع الاستئذانات المعتمدة) */
    var totalApprovedLeaveH = leaveWindows.reduce(function (s, lw) { return s + lw.hours; }, 0);
    var expectedCheckout = firstCheckin
      ? new Date(firstCheckin.getTime() + (TARGET_HOURS + totalApprovedLeaveH) * 3600000)
      : null;

    return {
      timeline: timeline,
      totalWorkHours: totalWorkMs / 3600000,
      firstCheckin: firstCheckin,
      lateMinutes: lateMinutes,
      pendingLeaveH: pendingH,
      needsReturnScan: needsReturnScan,
      expectedCheckout: expectedCheckout,
      totalApprovedLeaveH: totalApprovedLeaveH,
      scanCount: scans.length
    };
  }

  /* ─── تنسيق الوقت ─── */
  function fmt(d) {
    if (!d) return '—';
    var uae = new Date(d.toLocaleString('en-US', { timeZone: 'Asia/Dubai' }));
    return String(uae.getHours()).padStart(2, '0') + ':' + String(uae.getMinutes()).padStart(2, '0');
  }
  function fmtDuration(ms) {
    if (!ms || ms <= 0) return '0:00';
    var h = Math.floor(ms / 3600000);
    var m = Math.round((ms % 3600000) / 60000);
    return h + ':' + String(m).padStart(2, '0');
  }

  /* ─── widget ساعات العمل الذكية ─── */
  function buildWorkHoursWidget(containerId, cycle, data) {
    var container = document.getElementById(containerId);
    if (!container) return null;

    var cyc = CYCLE[cycle] || CYCLE.c1;

    function render() {
      var nowUAE = new Date(new Date().toLocaleString('en-US', { timeZone: 'Asia/Dubai' }));
      var nowMin = nowUAE.getHours() * 60 + nowUAE.getMinutes();
      var tl = data.tl;
      var totalWorkH = data.totalWorkHours;
      var pct = Math.min(100, (totalWorkH / TARGET_HOURS) * 100);

      /* حساب التأخير */
      var lateMin = 0;
      if (data.firstCheckin) {
        var ci = new Date(data.firstCheckin.toLocaleString('en-US', { timeZone: 'Asia/Dubai' }));
        var ciMin = ci.getHours() * 60 + ci.getMinutes();
        lateMin = ciMin > cyc.lateAt ? ciMin - cyc.lateAt : 0;
      }

      var barColor = pct >= 100 ? '#16A34A' : pct >= 60 ? '#6C3DD6' : pct >= 30 ? '#F59E0B' : '#EF4444';
      var statusText, statusColor;

      if (!data.firstCheckin) {
        statusText = nowMin >= cyc.emergencyAt ? 'لم تسجّل الدخول' : 'قبل بدء الدوام';
        statusColor = nowMin >= cyc.emergencyAt ? '#EF4444' : '#64748B';
      } else if (totalWorkH >= TARGET_HOURS) {
        statusText = 'اكتمل وقت العمل';
        statusColor = '#16A34A';
      } else if (data.needsReturnScan) {
        statusText = '⚠️ يُرجى مسح الباركود عند عودتك';
        statusColor = '#D97706';
      } else {
        var rem = TARGET_HOURS - totalWorkH;
        statusText = 'متبقٍ ' + fmtDuration(rem * 3600000);
        statusColor = '#6C3DD6';
      }

      /* ── بناء HTML ── */
      var html = '<div style="background:var(--surface,#fff);border:1.5px solid ' +
        (data.needsReturnScan ? '#F59E0B' : 'var(--border,#E2E8F0)') +
        ';border-radius:14px;padding:16px 20px">' +
        '<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:10px">' +
        '<div style="font-size:14px;font-weight:800;color:var(--text,#0F172A)">⏱ ساعات العمل اليومية</div>' +
        '<div style="font-size:12px;font-weight:700;color:' + statusColor + '">' + statusText + '</div>' +
        '</div>' +

        /* شريط التقدم الرئيسي */
        '<div style="background:var(--surface2,#F1F5F9);border-radius:100px;height:12px;margin-bottom:14px;overflow:hidden">' +
        '<div style="height:100%;width:' + pct.toFixed(1) + '%;background:' + barColor + ';border-radius:100px;transition:width .6s ease"></div>' +
        '</div>' +

        /* الأرقام الثلاثة */
        '<div style="display:grid;grid-template-columns:repeat(3,1fr);gap:8px;text-align:center;margin-bottom:14px">' +
        '<div style="background:var(--surface2,#F8FAFC);border-radius:10px;padding:10px 6px">' +
        '<div style="font-size:20px;font-weight:900;color:var(--text)">' + (data.firstCheckin ? fmt(data.firstCheckin) : '—') + '</div>' +
        '<div style="font-size:10px;color:var(--text3,#94A3B8);margin-top:2px">أول دخول</div>' +
        (lateMin > 0 ? '<div style="font-size:10px;color:#EF4444;font-weight:700;margin-top:2px">تأخّر ' + lateMin + ' د</div>' : '<div style="font-size:10px;color:#16A34A;font-weight:700;margin-top:2px">في الوقت</div>') +
        '</div>' +
        '<div style="background:var(--surface2,#F8FAFC);border-radius:10px;padding:10px 6px">' +
        '<div style="font-size:20px;font-weight:900;color:' + barColor + '">' + fmtDuration(totalWorkH * 3600000) + '</div>' +
        '<div style="font-size:10px;color:var(--text3,#94A3B8);margin-top:2px">من 8:00 ساعة</div>' +
        (data.totalApprovedLeaveH > 0 ? '<div style="font-size:10px;color:#F59E0B;font-weight:700;margin-top:2px">استئذان ' + data.totalApprovedLeaveH + 'س</div>' : '') +
        '</div>' +
        '<div style="background:var(--surface2,#F8FAFC);border-radius:10px;padding:10px 6px">' +
        '<div style="font-size:20px;font-weight:900;color:var(--text)">' + (data.expectedCheckout ? fmt(data.expectedCheckout) : '—') + '</div>' +
        '<div style="font-size:10px;color:var(--text3,#94A3B8);margin-top:2px">الخروج المتوقع</div>' +
        (data.scanCount > 1 ? '<div style="font-size:10px;color:#6C3DD6;font-weight:700;margin-top:2px">' + data.scanCount + ' مسحات</div>' : '') +
        '</div>' +
        '</div>' +

        /* Timeline المرئي */
        buildTimelineBar(data.tl, data.firstCheckin) +

        /* تنبيه العودة */
        (data.needsReturnScan ?
          '<div style="background:#FFF7ED;border:1.5px solid #FB923C;border-radius:10px;padding:10px 14px;margin-top:10px;direction:rtl">' +
          '<div style="font-size:13px;font-weight:800;color:#9A3412">⚠️ يُرجى مسح الباركود عند عودتك من الاستئذان</div>' +
          '<div style="font-size:11px;color:#C2410C;margin-top:4px">ساعات العمل موقوفة حتى تسجّلي دخولك</div>' +
          '</div>' : '') +

        /* استئذانات معلقة */
        (data.pendingLeaveH > 0 ?
          '<div style="background:#F0F9FF;border:1px solid #BAE6FD;border-radius:8px;padding:8px 12px;margin-top:8px;font-size:12px;color:#0369A1;direction:rtl">' +
          '⏳ طلب استئذان معلق (' + data.pendingLeaveH + ' ساعة) — بانتظار الاعتماد</div>' : '') +

        '</div>';

      container.innerHTML = html;
    }

    render();
    return setInterval(render, 60000);
  }

  /* ─── شريط Timeline المرئي ─── */
  function buildTimelineBar(tl, firstCheckin) {
    if (!tl || !tl.length || !firstCheckin) return '';

    var totalSpanMs = TARGET_HOURS * 3600000;
    var html = '<div style="margin-top:4px">' +
      '<div style="font-size:11px;color:var(--text3,#94A3B8);margin-bottom:6px;font-weight:600">Timeline اليوم</div>' +
      '<div style="display:flex;border-radius:8px;overflow:hidden;height:22px;position:relative;background:#F1F5F9">';

    var renderedItems = [];

    tl.forEach(function (seg) {
      var offsetMs = seg.from - firstCheckin;
      var widthMs = seg.to - seg.from;
      if (offsetMs < 0) offsetMs = 0;
      var left = Math.min(100, (offsetMs / totalSpanMs) * 100);
      var width = Math.min(100 - left, (widthMs / totalSpanMs) * 100);
      if (width <= 0) return;

      var color = seg.type === 'work' ? '#6C3DD6' : '#F59E0B';
      var title = seg.type === 'work'
        ? 'عمل ' + fmt(seg.from) + '—' + fmt(seg.to)
        : 'استئذان ' + seg.hours + 'س';

      renderedItems.push(
        '<div title="' + title + '" style="position:absolute;height:100%;left:' + left.toFixed(2) + '%;width:' + width.toFixed(2) + '%;background:' + color + ';opacity:0.9"></div>'
      );
    });

    html += renderedItems.join('');

    /* خط "الآن" */
    var nowUAE = new Date(new Date().toLocaleString('en-US', { timeZone: 'Asia/Dubai' }));
    var nowOffset = nowUAE - firstCheckin;
    var nowPct = Math.min(100, (nowOffset / totalSpanMs) * 100);
    html += '<div style="position:absolute;height:100%;left:' + nowPct.toFixed(2) + '%;width:2px;background:#EF4444;z-index:2"></div>';

    html += '</div>' +
      '<div style="display:flex;justify-content:space-between;font-size:10px;color:var(--text3);margin-top:3px">' +
      '<span>' + fmt(firstCheckin) + '</span>' +
      '<span style="color:#EF4444">الآن</span>' +
      '<span>' + (TARGET_HOURS + (tl.filter(function(s){return s.type==='leave';}).reduce(function(a,s){return a+s.hours;},0))) + 'س متوقع</span>' +
      '</div></div>';

    return html;
  }

  /* ─── تحميل بيانات وبناء Widget ─── */
  function initWorkHoursWidget(containerId, staffDbId, sbUrl, sbKey) {
    return Promise.all([
      detectCycle(staffDbId, sbUrl, sbKey),
      fetchWorkData(staffDbId, sbUrl, sbKey)
    ]).then(function (results) {
      var cycle = results[0];
      var workData = results[1];
      var tl = buildTimeline(workData.scans, workData.leaves);

      var cyc = CYCLE[cycle] || CYCLE.c1;
      if (tl.firstCheckin) {
        var ci = new Date(tl.firstCheckin.toLocaleString('en-US', { timeZone: 'Asia/Dubai' }));
        var ciMin = ci.getHours() * 60 + ci.getMinutes();
        tl.lateMinutes = ciMin > cyc.lateAt ? ciMin - cyc.lateAt : 0;
      }

      tl.tl = tl.timeline;
      return buildWorkHoursWidget(containerId, cycle, tl);
    });
  }

  /* ─── حساب أثر الاستئذان قبل الإرسال ─── */
  function calcLeaveImpact(staffDbId, newHours, requestDate, sbUrl, sbKey) {
    var today = requestDate || (function () {
      var n = new Date(new Date().toLocaleString('en-US', { timeZone: 'Asia/Dubai' }));
      return n.getFullYear() + '-' + String(n.getMonth() + 1).padStart(2, '0') + '-' + String(n.getDate()).padStart(2, '0');
    })();
    return Promise.all([
      fetch(sbUrl + '/rest/v1/staff_checkin_log?staff_id=eq.' + encodeURIComponent(staffDbId) +
        '&date=eq.' + today + '&select=scanned_at&order=scanned_at.asc&limit=1',
        { headers: { apikey: sbKey, Authorization: 'Bearer ' + sbKey } }).then(function (r) { return r.json(); }),
      fetch(sbUrl + '/rest/v1/leave_requests?staff_db_id=eq.' + encodeURIComponent(staffDbId) +
        '&request_date=eq.' + today + '&leave_type=eq.personal&status=in.(approved,pending)&select=hours',
        { headers: { apikey: sbKey, Authorization: 'Bearer ' + sbKey } }).then(function (r) { return r.json(); })
    ]).then(function (res) {
      var checkins = res[0] || [];
      var existingH = (res[1] || []).reduce(function (s, l) { return s + (l.hours || 0); }, 0);
      var totalH = existingH + newHours;
      var netWork = Math.max(0, TARGET_HOURS - totalH);
      var checkinTime = checkins[0] ? new Date(checkins[0].scanned_at) : null;
      var expectedCheckout = checkinTime
        ? new Date(checkinTime.getTime() + (TARGET_HOURS + totalH) * 3600000)
        : null;
      return {
        hasCheckin: !!checkinTime,
        checkinTime: checkinTime ? fmt(checkinTime) : null,
        existingH: existingH, newH: newHours, totalLeaveH: totalH,
        netWorkH: netWork, willComplete: totalH === 0,
        expectedCheckout: expectedCheckout ? fmt(expectedCheckout) : null,
        needsWarning: totalH > 0
      };
    });
  }

  /* ─── لوحة الحضور الحي للنائبة/المديرة ─── */
  function buildAttendanceDashboard(containerId, staffList, sbUrl, sbKey) {
    var container = document.getElementById(containerId);
    if (!container) return;
    container.innerHTML = '<div style="padding:20px;text-align:center;color:var(--text3)">⏳ جارٍ تحميل بيانات الحضور...</div>';
    var nowUAE = new Date(new Date().toLocaleString('en-US', { timeZone: 'Asia/Dubai' }));
    var todayStr = nowUAE.getFullYear() + '-' + String(nowUAE.getMonth() + 1).padStart(2, '0') + '-' + String(nowUAE.getDate()).padStart(2, '0');
    var nowMin = nowUAE.getHours() * 60 + nowUAE.getMinutes();

    fetch(sbUrl + '/rest/v1/staff_checkin_log?date=eq.' + todayStr + '&select=staff_id,scanned_at&order=scanned_at.asc',
      { headers: { apikey: sbKey, Authorization: 'Bearer ' + sbKey } })
      .then(function (r) { return r.json(); })
      .then(function (checkins) {
        /* جمع أول + آخر مسح لكل موظف */
        var scanMap = {};
        (checkins || []).forEach(function (c) {
          var id = String(c.staff_id);
          if (!scanMap[id]) scanMap[id] = { first: c.scanned_at, last: c.scanned_at, count: 0 };
          scanMap[id].last = c.scanned_at;
          scanMap[id].count++;
        });

        var present = [], late = [], absent = [];

        staffList.forEach(function (staff) {
          var id = String(staff.staff_db_id);
          var cyc = CYCLE[staff.cycle || 'c1'];
          var scan = scanMap[id];

          if (!scan) {
            if (nowMin >= cyc.emergencyAt) absent.push(staff);
          } else {
            var firstTime = new Date(new Date(scan.first).toLocaleString('en-US', { timeZone: 'Asia/Dubai' }));
            var firstMin = firstTime.getHours() * 60 + firstTime.getMinutes();
            if (firstMin > cyc.lateAt) {
              late.push({ staff: staff, lateMin: firstMin - cyc.lateAt, checkin: fmt(firstTime), scans: scan.count });
            } else {
              present.push({ staff: staff, checkin: fmt(firstTime), scans: scan.count });
            }
          }
        });

        var total = staffList.length;
        var presentCount = present.length + late.length;
        var pct = total > 0 ? Math.round(presentCount / total * 100) : 0;
        var barCol = pct >= 80 ? '#16A34A' : pct >= 50 ? '#F59E0B' : '#EF4444';

        var html = '';
        /* ملخص */
        html += '<div style="display:grid;grid-template-columns:repeat(3,1fr);gap:10px;margin-bottom:14px">' +
          mkStat(present.length, 'حاضرة', '#DCFCE7', '#86EFAC', '#16A34A', '#15803D') +
          mkStat(late.length, 'متأخرة', '#FEF3C7', '#FCD34D', '#D97706', '#B45309') +
          mkStat(absent.length, 'غائبة', '#FEE2E2', '#FCA5A5', '#DC2626', '#B91C1C') +
          '</div>';

        /* شريط نسبة */
        html += '<div style="margin-bottom:14px">' +
          '<div style="display:flex;justify-content:space-between;font-size:11px;color:var(--text3);margin-bottom:4px">' +
          '<span>نسبة الحضور اليوم</span><span style="font-weight:800;color:' + barCol + '">' + pct + '%</span></div>' +
          '<div style="background:#F1F5F9;border-radius:100px;height:10px;overflow:hidden">' +
          '<div style="height:100%;width:' + pct + '%;background:' + barCol + ';border-radius:100px;transition:width .8s"></div>' +
          '</div></div>';

        /* الغائبات */
        if (absent.length) {
          html += '<details open style="background:#FFF1F2;border:1.5px solid #FECDD3;border-radius:12px;padding:12px;margin-bottom:10px">' +
            '<summary style="font-size:13px;font-weight:800;color:#BE123C;cursor:pointer;list-style:none">🔴 غائبات (' + absent.length + ')</summary><div style="margin-top:8px">';
          absent.forEach(function (s) {
            html += '<div style="display:flex;justify-content:space-between;padding:5px 0;border-bottom:1px solid #FECDD3;font-size:13px">' +
              '<span style="color:var(--text);font-weight:600">' + (s.name_ar || s.staff_db_id) + '</span>' +
              '<span style="color:#BE123C;background:#FEE2E2;padding:2px 8px;border-radius:100px;font-size:11px">غائبة</span>' +
              '</div>';
          });
          html += '</div></details>';
        }

        /* المتأخرات */
        if (late.length) {
          html += '<details open style="background:#FFFBEB;border:1.5px solid #FDE68A;border-radius:12px;padding:12px;margin-bottom:10px">' +
            '<summary style="font-size:13px;font-weight:800;color:#92400E;cursor:pointer;list-style:none">🟡 متأخرات (' + late.length + ')</summary><div style="margin-top:8px">';
          late.forEach(function (item) {
            html += '<div style="display:flex;justify-content:space-between;padding:5px 0;border-bottom:1px solid #FDE68A;font-size:13px">' +
              '<span style="color:var(--text);font-weight:600">' + (item.staff.name_ar || item.staff.staff_db_id) + '</span>' +
              '<span>' +
              '<span style="color:#D97706;font-weight:700">' + item.checkin + '</span>' +
              '<span style="background:#FEF3C7;color:#92400E;padding:2px 6px;border-radius:100px;font-size:11px;margin-right:4px">+' + item.lateMin + ' د</span>' +
              (item.scans > 1 ? '<span style="color:#6C3DD6;font-size:10px">' + item.scans + ' مسحات</span>' : '') +
              '</span></div>';
          });
          html += '</div></details>';
        }

        /* الحاضرات */
        if (present.length) {
          html += '<details style="background:#F0FDF4;border:1.5px solid #BBF7D0;border-radius:12px;padding:12px">' +
            '<summary style="font-size:13px;font-weight:800;color:#15803D;cursor:pointer;list-style:none">✅ حاضرات في الوقت (' + present.length + ')</summary><div style="margin-top:8px">';
          present.forEach(function (item) {
            html += '<div style="display:flex;justify-content:space-between;padding:5px 0;border-bottom:1px solid #D1FAE5;font-size:13px">' +
              '<span style="color:var(--text);font-weight:600">' + (item.staff.name_ar || item.staff.staff_db_id) + '</span>' +
              '<span style="color:#16A34A;font-weight:700">' + item.checkin +
              (item.scans > 1 ? ' <span style="color:#6C3DD6;font-size:10px">(' + item.scans + ' مسحات)</span>' : '') + '</span>' +
              '</div>';
          });
          html += '</div></details>';
        }

        if (!staffList.length) html = '<div style="padding:24px;text-align:center;color:var(--text3)">لا بيانات</div>';

        container.innerHTML = html;
      })
      .catch(function () {
        container.innerHTML = '<div style="color:#EF4444;padding:12px">خطأ في تحميل الحضور</div>';
      });
  }

  function mkStat(val, label, bg, bdr, valCol, lblCol) {
    return '<div style="background:' + bg + ';border:1px solid ' + bdr + ';border-radius:12px;padding:12px;text-align:center">' +
      '<div style="font-size:26px;font-weight:900;color:' + valCol + '">' + val + '</div>' +
      '<div style="font-size:11px;color:' + lblCol + ';font-weight:700">' + label + '</div></div>';
  }

  /* ─── التصدير ─── */
  window.EduOSWorkHours = {
    detectCycle: detectCycle,
    fetchWorkData: fetchWorkData,
    buildTimeline: buildTimeline,
    initWorkHoursWidget: initWorkHoursWidget,
    buildAttendanceDashboard: buildAttendanceDashboard,
    calcLeaveImpact: calcLeaveImpact,
    CYCLE: CYCLE,
    TARGET_HOURS: TARGET_HOURS
  };

})();
