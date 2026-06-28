/**
 * platform-student-state.js
 * © 2026 NAFAS FOR ARTIFICIAL INTELLIGENCE — CN-6573712
 * 
 * مكتبة مشتركة لدفع أحداث الطالب/ة من الجود إلى NAFAS student_state
 * تُستدعى من أي صفحة في aljood-portal تحتاج إرسال حدث
 * 
 * القرار المعتمد: 28 يونيو 2026
 */

(function(window) {
  'use strict';

  // ── الأحداث المدعومة ──
  const JOOD_EVENTS = {
    ACADEMIC_DECLINE:   'academic_decline',
    ATTENDANCE_ALERT:   'attendance_alert',
    GRADE_BELOW_AVG:    'grade_below_average',
    EXAM_FAILED:        'exam_failed',
    CONSISTENT_ABSENCE: 'consistent_absence',
    SUBJECT_WEAKNESS:   'subject_weakness',
  };

  // ── مستويات الخطورة ──
  const SEVERITY = {
    NOTE:    1, // ملاحظة — لا تدخل فوري
    ALERT:   2, // تنبيه — يحتاج متابعة
    URGENT:  3, // تدخل عاجل
  };

  /**
   * دفع حدث طالب/ة إلى NAFAS student_state
   * @param {Object} opts
   * @param {string} opts.studentId   - معرف الطالب/ة (text)
   * @param {string} opts.eventType   - نوع الحدث (من JOOD_EVENTS)
   * @param {number} opts.severity    - مستوى الخطورة (1-3)
   * @param {Object} opts.payload     - بيانات إضافية
   * @param {string} [opts.schoolId]  - معرف المدرسة (اختياري)
   */
  async function pushStudentEvent(opts) {
    const { studentId, eventType, severity = SEVERITY.NOTE, payload = {}, schoolId } = opts;

    if (!studentId || !eventType) {
      console.warn('[StudentState] student_id و event_type مطلوبان');
      return { success: false, error: 'missing_required_fields' };
    }

    try {
      // استدعاء Edge Function في الجود
      const { data, error } = await window._eduosSupabase
        .functions
        .invoke('push-student-state', {
          body: {
            student_id: String(studentId),
            school_id:  schoolId ?? null,
            event_type: eventType,
            severity:   Number(severity),
            payload,
          },
        });

      if (error) {
        console.error('[StudentState] خطأ:', error.message);
        return { success: false, error: error.message };
      }

      if (severity >= SEVERITY.URGENT) {
        console.warn(`[StudentState] 🚨 حدث عاجل: ${eventType} | طالب: ${studentId}`);
      }

      return { success: true, ...data };
    } catch (err) {
      console.error('[StudentState] استثناء غير متوقع:', err);
      return { success: false, error: 'unexpected_error' };
    }
  }

  /**
   * دالة مساعدة: فحص تراجع أكاديمي تلقائي
   * تُستدعى بعد حفظ الدرجات
   */
  async function checkAcademicDecline(studentId, gradeData, schoolId) {
    const { grade, average, subject, term } = gradeData;

    if (grade === null || grade === undefined) return;

    let eventType = null;
    let severity = SEVERITY.NOTE;

    if (grade < 50) {
      eventType = JOOD_EVENTS.EXAM_FAILED;
      severity = SEVERITY.URGENT;
    } else if (grade < average - 15) {
      eventType = JOOD_EVENTS.ACADEMIC_DECLINE;
      severity = SEVERITY.ALERT;
    } else if (grade < average - 10) {
      eventType = JOOD_EVENTS.GRADE_BELOW_AVG;
      severity = SEVERITY.NOTE;
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
   * دالة مساعدة: تنبيه غياب
   */
  async function checkAttendance(studentId, absenceData, schoolId) {
    const { consecutiveDays, totalAbsences, term } = absenceData;

    let eventType = null;
    let severity = SEVERITY.NOTE;

    if (consecutiveDays >= 3) {
      eventType = JOOD_EVENTS.CONSISTENT_ABSENCE;
      severity = consecutiveDays >= 5 ? SEVERITY.URGENT : SEVERITY.ALERT;
    } else if (totalAbsences >= 10) {
      eventType = JOOD_EVENTS.ATTENDANCE_ALERT;
      severity = SEVERITY.ALERT;
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
    push: pushStudentEvent,
    checkAcademicDecline,
    checkAttendance,
    EVENTS: JOOD_EVENTS,
    SEVERITY,
  };

})(window);

/**
 * مثال الاستخدام:
 *
 * // تنبيه تراجع أكاديمي
 * await EduOSStudentState.push({
 *   studentId: '12345',
 *   eventType: EduOSStudentState.EVENTS.ACADEMIC_DECLINE,
 *   severity: EduOSStudentState.SEVERITY.ALERT,
 *   payload: { subject: 'رياضيات', grade: 42, average: 65 },
 *   schoolId: 'uuid-school'
 * });
 *
 * // فحص تلقائي بعد حفظ الدرجة
 * await EduOSStudentState.checkAcademicDecline('12345', {
 *   grade: 38, average: 65, subject: 'علوم', term: 'T1'
 * }, schoolId);
 */
