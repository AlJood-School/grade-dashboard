/**
 * platform-student-state.js
 * © 2026 NAFAS FOR ARTIFICIAL INTELLIGENCE — CN-6573712
 *
 * مكتبة مشتركة لدفع أحداث الطالب/ة من الجود إلى NAFAS student_state
 * تُستدعى من أي صفحة في aljood-portal تحتاج إرسال حدث
 *
 * القرار المعتمد: 28 يونيو 2026
 * v1.1 — استخدام fetch مباشرة بدلاً من supabase-js client
 */

(function(window) {
  'use strict';

  // ── الأحداث المدعومة ──
  const JOOD_EVENTS = {
    ACADEMIC_DECLINE:   'aljood.academic_decline',
    ATTENDANCE_ALERT:   'aljood.attendance_alert',
    GRADE_BELOW_AVG:    'aljood.grade_below_average',
    EXAM_FAILED:        'aljood.exam_failed',
    CONSISTENT_ABSENCE: 'aljood.consistent_absence',
    SUBJECT_WEAKNESS:   'aljood.subject_weakness',
  };

  // ── مستويات الخطورة ──
  const SEVERITY = {
    NOTE:   1,  // ملاحظة — لا تدخل فوري
    ALERT:  2,  // تنبيه — يحتاج متابعة
    URGENT: 3,  // تدخل عاجل
  };

  // ── قراءة config من globals أو window ──
  function getConfig() {
    return {
      url: window.SB_URL   || (window._eduosConfig && window._eduosConfig.url),
      key: window.SB_KEY   || (window._eduosConfig && window._eduosConfig.key),
    };
  }

  /**
   * دفع حدث طالب/ة إلى NAFAS student_state عبر Edge Function
   */
  async function pushStudentEvent(opts) {
    const { studentId, eventType, severity = SEVERITY.NOTE, payload = {}, schoolId } = opts;

    if (!studentId || !eventType) {
      console.warn('[StudentState] student_id و event_type مطلوبان');
      return { success: false, error: 'missing_required_fields' };
    }

    const { url, key } = getConfig();
    if (!url || !key) {
      console.warn('[StudentState] SB_URL / SB_KEY غير موجودان');
      return { success: false, error: 'missing_config' };
    }

    try {
      const resp = await fetch(`${url}/functions/v1/push-student-state`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${key}`,
          'Content-Type':  'application/json',
        },
        body: JSON.stringify({
          student_id: String(studentId),
          school_id:  schoolId ?? null,
          event_type: eventType,
          severity:   Number(severity),
          payload,
        }),
      });

      if (!resp.ok) {
        const errText = await resp.text();
        console.error('[StudentState] HTTP Error:', resp.status, errText);
        return { success: false, error: errText };
      }

      const data = await resp.json().catch(() => ({}));

      if (severity >= SEVERITY.URGENT) {
        console.warn(`[StudentState] 🚨 حدث عاجل: ${eventType} | طالب/ة: ${studentId}`);
      }

      return { success: true, ...data };

    } catch (err) {
      console.error('[StudentState] استثناء غير متوقع:', err);
      return { success: false, error: 'unexpected_error' };
    }
  }

  /**
   * فحص تراجع أكاديمي تلقائي — تُستدعى بعد حفظ/تحميل الدرجات
   * @param {string} studentId   — معرف الطالب/ة (نص)
   * @param {Object} gradeData   — { grade, average, subject, term }
   * @param {string} [schoolId]  — معرف المدرسة (اختياري)
   */
  async function checkAcademicDecline(studentId, gradeData, schoolId) {
    const { grade, average, subject, term } = gradeData;
    if (grade === null || grade === undefined) return null;

    let eventType = null;
    let severity  = SEVERITY.NOTE;

    // عتبة الرسوب ديناميكية حسب المنهج (MOE G4-8=50، G9-12=60، KHDA=60، إلخ)
    const _passThreshold = (typeof getPassScore === 'function') ? getPassScore() : 50;
    if (grade < _passThreshold) {
      eventType = JOOD_EVENTS.EXAM_FAILED;
      severity  = SEVERITY.URGENT;
    } else if (grade < average - 15) {
      eventType = JOOD_EVENTS.ACADEMIC_DECLINE;
      severity  = SEVERITY.ALERT;
    } else if (grade < average - 10) {
      eventType = JOOD_EVENTS.GRADE_BELOW_AVG;
      severity  = SEVERITY.NOTE;
    }

    if (eventType) {
      return await pushStudentEvent({
        studentId,
        eventType,
        severity,
        payload: { grade, average, subject, term },
        schoolId,
      });
    }
    return null;
  }

  /**
   * فحص تنبيه غياب
   * @param {string} studentId
   * @param {Object} absenceData — { consecutiveDays, totalAbsences, term }
   * @param {string} [schoolId]
   */
  async function checkAttendance(studentId, absenceData, schoolId) {
    const { consecutiveDays, totalAbsences, term } = absenceData;

    let eventType = null;
    let severity  = SEVERITY.NOTE;

    if (consecutiveDays >= 3) {
      eventType = JOOD_EVENTS.CONSISTENT_ABSENCE;
      severity  = consecutiveDays >= 5 ? SEVERITY.URGENT : SEVERITY.ALERT;
    } else if (totalAbsences >= 10) {
      eventType = JOOD_EVENTS.ATTENDANCE_ALERT;
      severity  = SEVERITY.ALERT;
    }

    if (eventType) {
      return await pushStudentEvent({
        studentId,
        eventType,
        severity,
        payload: { consecutive_days: consecutiveDays, total_absences: totalAbsences, term },
        schoolId,
      });
    }
    return null;
  }

  // ── تصدير ──
  window.EduOSStudentState = {
    push:                 pushStudentEvent,
    checkAcademicDecline,
    checkAttendance,
    EVENTS:   JOOD_EVENTS,
    SEVERITY,
  };

})(window);
