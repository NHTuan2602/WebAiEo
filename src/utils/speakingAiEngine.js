/**
 * Shared IELTS Speaking AI Evaluation Engine (Environment-agnostic ES Module)
 * Used by both syncPlugin.js (Node server grading stored audio via Gemini multimodal API)
 * and browser fallback / UI formatting helpers.
 */

export function roundSpeakingBand(score) {
  const num = Number(score);
  if (!Number.isFinite(num) || num <= 0) return 0;
  return Math.min(9.0, Math.round((num + 1e-9) * 2) / 2);
}

export function cleanAudioMimeType(rawMime = '') {
  const lower = String(rawMime || 'audio/webm').split(';')[0].trim().toLowerCase();
  if (lower.startsWith('audio/')) return lower;
  return 'audio/webm';
}

export function inferAudioExtension(mimeType = '') {
  const clean = cleanAudioMimeType(mimeType);
  if (clean.includes('mp4') || clean.includes('m4a') || clean.includes('aac')) return 'm4a';
  if (clean.includes('mpeg') || clean.includes('mp3')) return 'mp3';
  if (clean.includes('ogg')) return 'ogg';
  if (clean.includes('wav')) return 'wav';
  return 'webm';
}

export function buildSpeakingExaminerPrompt({ testTitle = '', partMode = 'full', recordings = [] }) {
  const itemsText = recordings
    .map((rec, idx) => {
      const partTag = rec.part ? `Part ${rec.part}` : 'Speaking';
      const dur = Math.round(Number(rec.durationSec) || 0);
      const hintLine = rec.clientTranscript ? `Draft browser STT caption (may be inaccurate/empty): "${rec.clientTranscript}"` : 'Draft browser STT caption: (none)';
      const audioAttached = rec.hasAudioBinary ? 'YES (actual recorded audio file attached in exact order)' : 'NO (empty / silent / missing audio)';
      return `Question #${idx + 1} [id="${rec.questionId}", ${partTag}${rec.topic ? `, Topic: ${rec.topic}` : ''}, recorded duration: ${dur}s, audio attached: ${audioAttached}]
Prompt: "${rec.prompt || 'General speaking question'}"
${hintLine}`;
    })
    .join('\n\n');

  const attachedAudioOrder = recordings
    .filter(r => r.hasAudioBinary)
    .map((r, i) => `Audio Attachment #${i + 1} -> questionId "${r.questionId}" (Part ${r.part || 1}, ${Math.round(Number(r.durationSec) || 0)}s)`)
    .join('\n');

  return `You are an official IELTS Speaking Senior Examiner (certified by IDP and British Council).
Evaluate the candidate's IELTS Speaking performance strictly according to the official 4 IELTS Speaking Band Descriptors (0.0 to 9.0, increments of 0.5):
1. fc — Fluency and Coherence (độ trôi chảy, mạch lạc, tốc độ nói tự nhiên, phát triển ý, từ nối)
2. lr — Lexical Resource (vốn từ vựng học thuật/idiomatic, collocation, paraphrase)
3. gra — Grammatical Range and Accuracy (cấu trúc câu đơn/ghép/phức, thì, độ chính xác ngữ pháp)
4. pr — Pronunciation (phát âm âm vị rõ ràng, trọng âm từ, ngữ điệu câu, độ dễ nghe)

STRICT CRITICAL SCORING RULES:
- Band 4.0 is NOT the minimum! If a recording is silent, background noise only, contains under 2 seconds of meaningless sounds, or has no English speech, assign Band 0.0 (or 1.0 if isolated unrelated words) for that question and 0.0 overall if all answers are empty/silent.
- Judge primarily from the ACTUAL AUDIO RECORDINGS attached below when available (listen closely to pronunciation, intonation, pauses, filler words, self-corrections, grammar, and vocabulary).
- Test Title: "${testTitle || 'IELTS Speaking Test'}"
- Mode taken: "${partMode}" (${partMode === 'full' ? 'Full Test Parts 1-2-3' : `Quick Part Focus: ${partMode}`})

QUESTIONS EVALUATED:
${itemsText}

ORDER OF AUDIO ATTACHMENTS SENT WITH THIS REQUEST:
${attachedAudioOrder || '(None attached)'}

INSTRUCTIONS:
1. For EVERY question listed above (matching exact "questionId"):
   - Write an accurate verbatim "transcript" of what the candidate actually said in the audio (include noticeable pauses like "[pause]" or hesitations like "uh/um" if audible; write "(Không có giọng nói rõ ràng)" if silent/empty).
   - Score individual "band" (0.0 - 9.0, step 0.5).
   - Provide detailed helpful "feedback" in Vietnamese mentioning specific pronunciation/fluency/idea points.
   - Provide up to 3 concrete "grammarVocabularyFixes": array of { "original": "...", "corrected": "...", "reason": "giải thích ngắn tiếng Việt" }.
   - Provide "upgradedSample": a natural, high-scoring (Band 7.5-8.5) sample answer in English tailored to the candidate's own ideas!
2. Compute criterion scores: "fc", "lr", "gra", "pr" (0.0 - 9.0 step 0.5).
3. Overall Speaking Band MUST equal average of the 4 criteria rounded to nearest 0.5 (or 0.0 if silent/no speech).
4. Write "overallFeedback" in Vietnamese, plus 2-4 "strengths" and 2-4 "improvements" in Vietnamese.

Return ONLY strictly valid JSON matching this schema (no markdown fences):
{
  "overallBand": 6.5,
  "criteria": {
    "fc": 6.5,
    "lr": 6.0,
    "gra": 6.5,
    "pr": 6.5
  },
  "overallFeedback": "Nhận xét tổng quan chi tiết bằng tiếng Việt...",
  "strengths": ["Điểm mạnh 1", "Điểm mạnh 2"],
  "improvements": ["Cần cải thiện 1", "Cần cải thiện 2"],
  "questionEvaluations": [
    {
      "questionId": "exact_question_id",
      "transcript": "Verbatim English spoken answer...",
      "band": 6.5,
      "feedback": "Nhận xét cụ thể bằng tiếng Việt cho câu này...",
      "grammarVocabularyFixes": [
        {
          "original": "I very like...",
          "corrected": "I really enjoy...",
          "reason": "Trạng từ 'very' không đi trực tiếp trước động từ 'like'..."
        }
      ],
      "upgradedSample": "Natural Band 8.0 model response..."
    }
  ]
}`;
}

export function normalizeSpeakingEvaluation({ parsed, recordings = [], usedModel = 'gemini-audio', gradedMode = 'gemini_audio' }) {
  const recList = Array.isArray(recordings) ? recordings : [];
  const totalMeaningfulAudio = recList.filter(r => (Number(r.durationSec) || 0) >= 1 && (r.hasAudioBinary || String(r.clientTranscript || '').trim().length >= 3)).length;

  const rawCrit = parsed?.criteria || {};
  const fc = totalMeaningfulAudio === 0 ? 0 : roundSpeakingBand(rawCrit.fc ?? parsed?.overallBand ?? 0);
  const lr = totalMeaningfulAudio === 0 ? 0 : roundSpeakingBand(rawCrit.lr ?? parsed?.overallBand ?? 0);
  const gra = totalMeaningfulAudio === 0 ? 0 : roundSpeakingBand(rawCrit.gra ?? parsed?.overallBand ?? 0);
  const pr = totalMeaningfulAudio === 0 ? 0 : roundSpeakingBand(rawCrit.pr ?? parsed?.overallBand ?? 0);

  const avgCriteria = roundSpeakingBand((fc + lr + gra + pr) / 4);
  const rawOverall = Number(parsed?.overallBand);
  const overallBand = totalMeaningfulAudio === 0
    ? 0
    : (avgCriteria > 0 ? avgCriteria : roundSpeakingBand(rawOverall));

  const parsedEvalMap = new Map(
    (Array.isArray(parsed?.questionEvaluations) ? parsed.questionEvaluations : []).map(ev => [String(ev?.questionId || ''), ev])
  );

  const questionEvaluations = recList.map((rec, idx) => {
    const matched = parsedEvalMap.get(String(rec.questionId)) || parsed?.questionEvaluations?.[idx] || {};
    const hasSpokenInput = (Number(rec.durationSec) || 0) >= 1 && (rec.hasAudioBinary || String(rec.clientTranscript || '').trim().length >= 3);
    const qBand = hasSpokenInput ? roundSpeakingBand(matched.band ?? overallBand) : 0;

    return {
      questionId: rec.questionId,
      part: rec.part || 1,
      prompt: rec.prompt || '',
      transcript: String(matched.transcript || rec.clientTranscript || (hasSpokenInput ? '(Đã ghi âm giọng nói)' : '(Chưa thu âm / Không có lời nói)')).trim(),
      band: qBand,
      feedback: String(matched.feedback || (hasSpokenInput ? 'Câu trả lời đã được ghi nhận và đánh giá.' : 'Thí sinh chưa thu âm câu này (0.0).')).trim(),
      grammarVocabularyFixes: Array.isArray(matched.grammarVocabularyFixes)
        ? matched.grammarVocabularyFixes
            .filter(f => f && (f.original || f.corrected))
            .slice(0, 4)
            .map(f => ({
              original: String(f.original || '').trim(),
              corrected: String(f.corrected || '').trim(),
              reason: String(f.reason || '').trim()
            }))
        : [],
      upgradedSample: String(matched.upgradedSample || '').trim()
    };
  });

  return {
    overallBand,
    criteria: { fc, lr, gra, pr },
    overallFeedback: String(
      parsed?.overallFeedback ||
      (overallBand === 0
        ? 'Chưa ghi nhận bài nói tiếng Anh hợp lệ. Hãy kiểm tra micro và trả lời đầy đủ trước khi nộp.'
        : 'Bài nói đã được AI phân tích và chấm band theo 4 tiêu chí IELTS Speaking.')
    ).trim(),
    strengths: Array.isArray(parsed?.strengths) ? parsed.strengths.map(s => String(s || '').trim()).filter(Boolean) : [],
    improvements: Array.isArray(parsed?.improvements) ? parsed.improvements.map(s => String(s || '').trim()).filter(Boolean) : [],
    questionEvaluations,
    _usedModel: usedModel,
    _gradedMode: gradedMode
  };
}

/**
 * Fallback evaluator when no Gemini API Key is configured or offline:
 * Inspects actual audio presence + duration + browser SpeechRecognition transcript to prevent random hallucination
 * and assigns Band 0.0 when silent/empty.
 */
export function simulateAISpeakingGrading({ testTitle = '', partMode = 'full', recordings = [] }) {
  const recList = Array.isArray(recordings) ? recordings : [];
  const validRecs = recList.filter(r => (Number(r.durationSec) || 0) >= 1 && (r.hasAudioBinary || Boolean(r.audioUrl) || String(r.clientTranscript || '').trim().length > 0));

  if (validRecs.length === 0) {
    return normalizeSpeakingEvaluation({
      recordings: recList,
      usedModel: 'built-in-speaking-guard',
      gradedMode: 'fallback',
      parsed: {
        overallBand: 0,
        criteria: { fc: 0, lr: 0, gra: 0, pr: 0 },
        overallFeedback: 'Chưa phát hiện file ghi âm hoặc nội dung nói hợp lệ → Band Speaking 0.0. Hãy bật Micro và trả lời câu hỏi trước khi nộp.',
        strengths: [],
        improvements: ['Cho phép trình duyệt truy cập Micro và nói đủ độ dài câu trả lời (15–30s cho Part 1, 1–2 phút cho Part 2).'],
        questionEvaluations: recList.map(r => ({
          questionId: r.questionId,
          transcript: '(Chưa thu âm)',
          band: 0,
          feedback: 'Câu hỏi này chưa có bản thu âm.',
          grammarVocabularyFixes: [],
          upgradedSample: ''
        }))
      }
    });
  }

  let totalWords = 0;
  let totalSec = 0;
  const uniqueLexicon = new Set();
  const advancedConnectors = ['furthermore', 'moreover', 'however', 'nevertheless', 'personally', 'honestly', 'significantly', 'memorable', 'beneficial', 'consequently', 'nowadays', 'especially', 'definitely', 'actually', 'occasionally'];
  let connectorHits = 0;

  const qEvals = recList.map(rec => {
    const dur = Math.max(0, Number(rec.durationSec) || 0);
    const words = String(rec.clientTranscript || '').trim().split(/\s+/).filter(Boolean);
    const hasRecording = dur >= 1 && (rec.hasAudioBinary || Boolean(rec.audioUrl) || words.length > 0);
    if (!hasRecording) {
      return {
        questionId: rec.questionId,
        transcript: '(Chưa thu âm)',
        band: 0,
        feedback: 'Chưa có bản thu âm cho câu này → Band 0.0.',
        grammarVocabularyFixes: [],
        upgradedSample: ''
      };
    }

    totalSec += dur;
    totalWords += words.length;
    words.forEach(w => {
      const clean = w.toLowerCase().replace(/[^a-z']/g, '');
      if (clean.length > 2) uniqueLexicon.add(clean);
      if (advancedConnectors.includes(clean)) connectorHits++;
    });

    // Estimate band conservatively based on duration + transcribed lexical density
    const targetSec = rec.part === 2 ? 75 : 22;
    const durationRatio = Math.min(1.25, dur / targetSec);
    let qBand = 3.0;
    if (words.length > 0) {
      if (words.length >= 65 && dur >= 35) qBand = 6.5;
      else if (words.length >= 35 && dur >= 20) qBand = 5.5;
      else if (words.length >= 18) qBand = 4.5;
      else qBand = 3.5;
    } else {
      // Browser didn't capture SpeechRecognition text, judge conservatively from audio duration only until Gemini audio runs
      qBand = dur >= 50 ? 5.5 : dur >= 20 ? 5.0 : dur >= 8 ? 4.0 : 3.0;
    }
    if (durationRatio >= 1 && words.length >= 45) qBand = Math.min(7.5, qBand + 0.5);

    const wpm = dur > 0 && words.length > 0 ? Math.round((words.length / dur) * 60) : null;
    return {
      questionId: rec.questionId,
      transcript: words.length > 0 ? rec.clientTranscript : `(Đã lưu file ghi âm ${Math.round(dur)}s — chờ Gemini API Key để chép lời chính xác)`,
      band: roundSpeakingBand(qBand),
      feedback: words.length > 0
        ? `Ghi âm ${Math.round(dur)}s (${words.length} từ${wpm ? `, ~${wpm} từ/phút` : ''}). ${words.length >= 25 ? 'Ý trả lời rõ ràng; hãy thêm ví dụ cụ thể và từ nối tự nhiên để tăng điểm Fluency & Coherence.' : 'Câu trả lời hơi ngắn; nên mở rộng thêm 2–3 câu giải thích lý do hoặc ví dụ.'}`
        : `Đã lưu an toàn file ghi âm (${Math.round(dur)} giây). Điểm ước lượng sơ bộ dựa trên thời lượng nói; giáo viên có thể nghe lại file ghi âm trực tiếp hoặc cấu hình Google Gemini API Key để AI chép lời & chấm phát âm chi tiết từng âm tiết.`,
      grammarVocabularyFixes: [],
      upgradedSample: 'Cấu hình Google Gemini API Key trong Tài khoản Giáo viên để AI nghe trực tiếp file ghi âm, chép lời chính xác và gợi ý câu nâng Band cá nhân hóa.'
    };
  });

  const nonZeroBands = qEvals.map(e => e.band).filter(b => b > 0);
  const avgQBand = nonZeroBands.reduce((s, b) => s + b, 0) / nonZeroBands.length;
  const completenessFactor = recList.length > 0 ? validRecs.length / recList.length : 1;
  const fc = roundSpeakingBand(avgQBand * (0.75 + 0.25 * completenessFactor));
  const lr = roundSpeakingBand(Math.min(8.0, avgQBand + (uniqueLexicon.size >= 40 ? 0.5 : connectorHits >= 2 ? 0.0 : -0.5)));
  const gra = roundSpeakingBand(Math.max(0, avgQBand - (totalWords > 0 && totalWords < 30 ? 0.5 : 0)));
  const pr = roundSpeakingBand(avgQBand);
  const overall = roundSpeakingBand((fc + lr + gra + pr) / 4);

  return normalizeSpeakingEvaluation({
    recordings: recList,
    usedModel: 'built-in-speaking-heuristic',
    gradedMode: 'fallback',
    parsed: {
      overallBand: overall,
      criteria: { fc, lr, gra, pr },
      overallFeedback: `[Đánh Giá Speaking Tự Động — Bộ Chấm Cơ Bản]: Đã lưu ${validRecs.length}/${recList.length} file ghi âm (tổng ${Math.round(totalSec)} giây${totalWords > 0 ? `, ~${totalWords} từ` : ''}) cho bài "${testTitle || 'IELTS Speaking'}" (${partMode}). ${totalSec < 20 ? 'Thời lượng nói còn khá ngắn, cần mở rộng câu trả lời dài và tự nhiên hơn.' : 'Thời lượng nói ổn định. Để AI nghe trực tiếp file thu âm và chấm chính xác Phát âm (Pronunciation) & chép lời chi tiết, giáo viên hãy nhập Google Gemini API Key.'}`,
      strengths: [
        `Đã hoàn thành và lưu an toàn ${validRecs.length}/${recList.length} file ghi âm trên hệ thống (${Math.round(totalSec)}s).`,
        totalWords >= 40 ? `Tốc độ phản hồi và lượng từ vựng bước đầu tốt (${uniqueLexicon.size} từ khác nhau).` : 'Chủ động ghi âm phản xạ trực tiếp bằng Micro.'
      ],
      improvements: [
        totalSec < 30 ? 'Nên kéo dài mỗi câu trả lời Part 1 khoảng 20–30s (3–4 câu) và Part 2 từ 90–120s.' : 'Chú ý chèn thêm ví dụ thực tế và đa dạng cấu trúc câu phức (although, whereas, which...).',
        'Giáo viên có thể nghe trực tiếp audio trong phần chi tiết hoặc bấm "AI Chấm Lại (Gemini Audio)" sau khi nhập API Key.'
      ],
      questionEvaluations: qEvals
    }
  });
}
