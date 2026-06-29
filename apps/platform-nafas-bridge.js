/**
 * ═══════════════════════════════════════════════════════════════
 *  platform-nafas-bridge.js  v1.0
 *  جسر أثير → NAFAS — emotional_flags للأخصائي/ة
 *  © 2026 NAFAS FOR ARTIFICIAL INTELLIGENCE — CN-6573712
 *
 *  يُضاف بعد platform-student-state.js
 *  يُرسل الإشارات العاطفية الحساسة من أثير إلى NAFAS مباشرة
 *  وفق القرار المعتمد: 28 يونيو 2026
 *  الأخصائي/ة وحدهم/ن يرون البيانات الفردية — بالموافقة
 * ═══════════════════════════════════════════════════════════════
 */

(function(window) {
  'use strict';

  const NAFAS_SB_URL = window.NAFAS_SB_URL || '';
  const NAFAS_SB_KEY = window.NAFAS_SB_KEY || '';

  // ── الإشارات التي تستحق إرسالها للأخصائي/ة ────────────────────
  const BRIDGE_THRESHOLDS = {
    // مشاعر تتطلب إشعار الأخصائي/ة
    critical_emotions: ['😔', '😰', '😠', 'حزن', 'قلق', 'غضب', 'بكاء'],
    // عدد التكرارات المتتالية قبل الإرسال
    repeat_count: 3,
    // مدة النافذة الزمنية (ساعات)
    window_hours: 48,
  };

  // ── تحقق هل تستحق الإشارة الإرسال ──────────────────────────────
  function _isSignalCritical(signalData) {
    const label = (signalData?.label || '').toLowerCase();
    const note  = (signalData?.note  || '').toLowerCase();
    return BRIDGE_THRESHOLDS.critical_emotions.some(kw =>
      label.includes(kw) || note.includes(kw)
    );
  }

  /**
   * إرسال إشارة أثير العاطفية إلى NAFAS
   * @param {Object} opts
   * @param {string} opts.studentId
   * @param {Object} opts.signalData   - { label, note, vark_style, ... }
   * @param {string} opts.schoolId
   * @param {string} opts.context      - 'exam' | 'ramadan' | 'normal'
   * @param {number} opts.sessionSignalCount - عدد إشارات سلبية في الجلسة
   */
  async function sendEmotionalFlag(opts) {
    const { studentId, signalData, schoolId, context, sessionSignalCount } = opts;

    if (!studentId) return { success: false, error: 'no_student_id' };
    if (!_isSignalCritical(signalData)) return { success: false, skipped: true, reason: 'not_critical' };

    // لا نُرسل إذا لم نتجاوز الحد
    if ((sessionSignalCount || 0) < BRIDGE_THRESHOLDS.repeat_count) {
      return { success: false, skipped: true, reason: 'below_threshold' };
    }

    // استخدم platform-student-state.js إذا متاح
    if (window.JoodStudentState) {
      return window.JoodStudentState.pushStudentEvent({
        studentId,
        eventType: 'aljood.emotional_flag',
        severity: 3, // URGENT
        payload: {
          emotional_flags: {
            label:        signalData.label,
            note:         signalData.note,
            vark_style:   signalData.vark_style,
            context:      context || 'normal',
            signal_count: sessionSignalCount,
            source:       'atheer_companion',
            timestamp:    new Date().toISOString(),
          },
          data_freshness: new Date().toISOString(),
          counselor_only: true, // الأخصائي/ة فقط
        },
        schoolId,
      });
    }

    // Direct push fallback
    try {
      const url  = window.SB_URL || '';
      const key  = window.SB_KEY || '';
      if (!url || !key) return { success: false, error: 'no_config' };

      const res = await fetch(`${url}/functions/v1/push-student-state`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${key}` },
        body: JSON.stringify({
          student_id:  studentId,
          school_id:   schoolId,
          event_type:  'aljood.emotional_flag',
          severity:    3,
          payload: {
            emotional_flags: {
              label:        signalData.label,
              note:         signalData.note,
              context:      context,
              signal_count: sessionSignalCount,
              source:       'atheer_companion',
            },
            counselor_only: true,
          },
        }),
      });
      return { success: res.ok };
    } catch (err) {
      return { success: false, error: err.message };
    }
  }

  /**
   * يُستدعى من companion.html عند نهاية الجلسة
   * يُحلّل الإشارات المجمعة ويُرسل ما يستحق
   */
  async function processsSessionSignals(signals, studentId, schoolId, platformContext) {
    if (!signals || !signals.length) return;

    const criticalSignals = signals.filter(s =>
      s.signal_type === 'emotional_state' && _isSignalCritical(s.signal_data)
    );

    if (criticalSignals.length < BRIDGE_THRESHOLDS.repeat_count) return;

    // أهم إشارة
    const topSignal = criticalSignals[criticalSignals.length - 1];

    const result = await sendEmotionalFlag({
      studentId,
      signalData: topSignal.signal_data,
      schoolId,
      context: platformContext?.state,
      sessionSignalCount: criticalSignals.length,
    });

    if (result.success) {
      console.info('[NAFAS Bridge] إشارة عاطفية أُرسلت للأخصائي/ة');
    }
    return result;
  }

  window.NAFASBridge = {
    sendEmotionalFlag,
    processsSessionSignals,
    isSignalCritical: _isSignalCritical,
  };

})(window);
