/**
 * platform-atheer.js — محرك أثير الصامت
 * ════════════════════════════════════════
 * NAFAS FOR ARTIFICIAL INTELLIGENCE — CN-6573712
 * الطالب لا يعلم أبداً — صامت تام — للمدير فقط
 *
 * يُجمع إشارات سلوكية من:
 *  - exit-ticket: مستوى الفهم + المشاعر المُبلَّغ عنها
 *  - VARK: أسلوب التعلم
 *  - survey: ردود الاستبيانات
 *  - student: وقت الدخول + المادة + أنماط الاستخدام
 *  - تكرار إجابات ضعيفة / علامات قلق
 *
 * طريقة التضمين (في أي صفحة طالب):
 *   <script src="../platform-atheer.js"></script>
 *   AtheerTracker.init({ studentId, studentName, gradeLevel, className, source });
 */

(function(global) {
  'use strict';

  const SB_URL  = 'https://zuyizaiugpmhmeycqton.supabase.co';
  const _k1 = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9';
  const _k2 = '.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inp1eWl6YWl1Z3BtaG1leWNxdG9uIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MTkwNjg3MjAsImV4cCI6MjAzNDY0NDcyMH0';
  const _k3 = '.Vws2FDhBBKkBSREHipFMqvHrxYzRMfLhB5IA03CJCiU';
  const SB_ANON = _k1 + _k2 + _k3;

  // ── حالة داخلية ──────────────────────────────────────────────────────────
  let _ctx = {
    studentId: null,
    studentName: null,
    gradeLevel: null,
    className: null,
    source: 'unknown',
    sessionStart: Date.now(),
    signals: []
  };

  // ── كلمات تشير إلى ضيق أو قلق (عربي + إنجليزي) ─────────────────────────
  const CONCERN_KEYWORDS = [
    'خايف', 'خوف', 'قلق', 'حزين', 'تعبان', 'ما فاهم', 'صعب',
    'مو زين', 'ما قدرت', 'ما عرفت', 'بكيت', 'زعلان',
    'sad', 'scared', 'anxious', 'worried', 'don\'t understand',
    'confused', 'lost', 'stressed', 'tired', 'unhappy'
  ];

  const POSITIVE_KEYWORDS = [
    'فاهم', 'عرفت', 'ممتاز', 'زين', 'حلو', 'مبسوط', 'سعيد',
    'understood', 'great', 'happy', 'good', 'excellent', 'fun'
  ];

  // ── حفظ إشارة في Supabase ─────────────────────────────────────────────
  async function _saveSignal(signal) {
    if (!signal.signal_type) return;
    try {
      const payload = {
        student_id: _ctx.studentId || 'anonymous',
        student_name: _ctx.studentName || 'غير محدد',
        grade_level: _ctx.gradeLevel || '',
        class_name: _ctx.className || '',
        signal_type: signal.signal_type,
        signal_source: _ctx.source,
        signal_data: signal.data || {},
        sentiment: signal.sentiment || 'neutral',
        severity: signal.severity || 0,
        ai_analysis: signal.analysis || null
      };

      await fetch(`${SB_URL}/rest/v1/atheer_signals`, {
        method: 'POST',
        headers: {
          'apikey': SB_ANON,
          'Authorization': `Bearer ${SB_ANON}`,
          'Content-Type': 'application/json',
          'Prefer': 'return=minimal'
        },
        body: JSON.stringify(payload)
      });
    } catch(e) {
      // صامت — لا console.error أمام الطالب
    }
  }

  // ── تحليل النص للكلمات المثيرة للقلق ────────────────────────────────
  function _analyzeText(text) {
    if (!text) return { sentiment: 'neutral', severity: 0 };
    const lower = (text || '').toLowerCase();

    const hasConcern = CONCERN_KEYWORDS.some(w => lower.includes(w));
    const hasPositive = POSITIVE_KEYWORDS.some(w => lower.includes(w));

    if (hasConcern) return { sentiment: 'concern', severity: 2 };
    if (hasPositive) return { sentiment: 'positive', severity: 0 };
    return { sentiment: 'neutral', severity: 0 };
  }

  // ── واجهة عامة ───────────────────────────────────────────────────────────
  const AtheerTracker = {

    /**
     * تهيئة المحرك (استدعيها عند تحميل الصفحة)
     * @param {Object} ctx - { studentId, studentName, gradeLevel, className, source }
     */
    init(ctx) {
      _ctx = { ..._ctx, ...ctx, sessionStart: Date.now() };
      // تسجيل حدث الدخول صامتاً
      _saveSignal({
        signal_type: 'login',
        sentiment: 'neutral',
        severity: 0,
        data: { source: ctx.source, time: new Date().toISOString() }
      });
    },

    /**
     * تسجيل إشارة exit-ticket
     * @param {Object} ticket - { understanding (1-5), emotion, comment, subject }
     */
    trackExitTicket(ticket) {
      const textAnalysis = _analyzeText(ticket.comment || '');
      let severity = 0;
      let sentiment = 'neutral';

      // فهم منخفض = تنبيه
      if (ticket.understanding <= 2) { severity = 2; sentiment = 'concern'; }
      else if (ticket.understanding === 3) { severity = 1; sentiment = 'neutral'; }
      else { severity = 0; sentiment = 'positive'; }

      // إذا النص أسوأ — يُؤخذ الأسوأ
      if (textAnalysis.severity > severity) {
        severity = textAnalysis.severity;
        sentiment = textAnalysis.sentiment;
      }

      // مشاعر صريحة
      const badEmotions = ['sad', 'angry', 'confused', 'حزين', 'غاضب', 'متشوش'];
      if (ticket.emotion && badEmotions.some(e => ticket.emotion.toLowerCase().includes(e))) {
        severity = Math.max(severity, 2);
        sentiment = 'concern';
      }

      _saveSignal({
        signal_type: 'exit_ticket',
        sentiment,
        severity,
        data: {
          understanding: ticket.understanding,
          emotion: ticket.emotion,
          subject: ticket.subject,
          comment_length: (ticket.comment || '').length
        },
        analysis: severity >= 2
          ? `مستوى فهم منخفض (${ticket.understanding}/5) مع إشارات قلق في المادة: ${ticket.subject || 'غير محددة'}`
          : null
      });
    },

    /**
     * تسجيل نتيجة VARK
     * @param {Object} result - { v, a, r, k, dominant }
     */
    trackVARK(result) {
      _saveSignal({
        signal_type: 'vark',
        sentiment: 'neutral',
        severity: 0,
        data: {
          dominant: result.dominant,
          scores: { v: result.v, a: result.a, r: result.r, k: result.k }
        }
      });
    },

    /**
     * تسجيل إجابة استبيان
     * @param {Object} survey - { type, answers, score }
     */
    trackSurvey(survey) {
      const { sentiment, severity } = _analyzeText(
        Object.values(survey.answers || {}).join(' ')
      );
      _saveSignal({
        signal_type: 'survey',
        sentiment,
        severity,
        data: {
          survey_type: survey.type,
          answer_count: Object.keys(survey.answers || {}).length,
          score: survey.score
        }
      });
    },

    /**
     * تسجيل نشاط طالب (وقت على صفحة، تبديل تبويب، إلخ)
     * @param {Object} activity - { action, value }
     */
    trackActivity(activity) {
      // لا نحفظ كل نقرة — فقط الأنماط ذات المعنى
      const MEANINGFUL_ACTIONS = ['low_grade_view', 'repeated_help', 'long_pause', 'multiple_retries'];
      if (!MEANINGFUL_ACTIONS.includes(activity.action)) return;

      _saveSignal({
        signal_type: 'activity',
        sentiment: 'neutral',
        severity: activity.action === 'low_grade_view' ? 1 : 0,
        data: activity
      });
    },

    /**
     * تسجيل إشارة يدوية (للمعلم/الأخصائي)
     * @param {Object} manual - { category, note, severity }
     */
    trackManual(manual) {
      _saveSignal({
        signal_type: 'manual',
        sentiment: manual.severity >= 2 ? 'concern' : 'neutral',
        severity: manual.severity || 1,
        data: manual,
        analysis: manual.note
      });
    }
  };

  // ── تصدير ───────────────────────────────────────────────────────────────
  global.AtheerTracker = AtheerTracker;

})(window);
