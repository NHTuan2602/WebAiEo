/**
 * Shared IELTS Speaking AI Evaluation Engine (Environment-agnostic ES Module)
 * Used by both syncPlugin.js (Node server grading stored audio via Gemini multimodal API)
 * and browser fallback / UI formatting helpers.
 */

export function roundSpeakingBand(score) {
  const num = Number(score);
  if (!Number.isFinite(num) || num <= 0) return 0;
  // Speaking component bands and Speaking overall strictly use whole integer bands 1..9 (0 if silent/blank)
  return Math.min(9, Math.max(1, Math.round(num)));
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
Evaluate the candidate's IELTS Speaking performance strictly according to the official 4 IELTS Speaking Band Descriptors:
1. fc — Fluency and Coherence (độ trôi chảy, mạch lạc, tốc độ nói tự nhiên, phát triển ý, từ nối)
2. lr — Lexical Resource (vốn từ vựng học thuật/idiomatic, collocation, paraphrase)
3. gra — Grammatical Range and Accuracy (cấu trúc câu đơn/ghép/phức, thì, độ chính xác ngữ pháp)
4. pr — Pronunciation (phát âm âm vị rõ ràng, trọng âm từ, ngữ điệu câu, độ dễ nghe)

STRICT CRITICAL SCORING RULES:
- MANDATORY INTEGER SCORING: Every IELTS Speaking criterion score (fc, lr, gra, pr) and overallBand MUST BE A WHOLE INTEGER from 1 to 9 (no .5 decimals like 6.5! Allowed scores: 0, 1, 2, 3, 4, 5, 6, 7, 8, 9). Do NOT output half-bands.
- Band 4 is NOT the minimum! If a recording is silent, background noise only, contains under 2 seconds of meaningless sounds, or has no English speech, assign Band 0 (or 1 if isolated unrelated words) for that question and 0 overall if all answers are empty/silent.
- Judge strictly from the ACTUAL AUDIO RECORDINGS attached below when available (listen closely to pronunciation, intonation, pauses, filler words, self-corrections, grammar errors, spelling/word choice errors, and vocabulary).
- Test Title: "${testTitle || 'IELTS Speaking Test'}"
- Mode taken: "${partMode}" (${partMode === 'full' ? 'Full Test Parts 1-2-3' : `Quick Part Focus: ${partMode}`})

QUESTIONS EVALUATED:
${itemsText}

ORDER OF AUDIO ATTACHMENTS SENT WITH THIS REQUEST:
${attachedAudioOrder || '(None attached)'}

INSTRUCTIONS:
1. For EVERY question listed above (matching exact "questionId"):
   - Write an accurate verbatim "transcript" of what the candidate actually said in the audio (include noticeable pauses like "[pause]" or fillers like "um/uh" if audible; write "(Không có giọng nói rõ ràng)" if silent/empty).
   - Score individual "band" (integer 0 - 9, NO decimals) AND per-question "criteria": { "fc": 7, "lr": 7, "gra": 6, "pr": 7 }.
   - Provide detailed helpful "feedback" in Vietnamese mentioning specific pronunciation/fluency/idea points.
   - Provide "fluencyMetrics": { "fillerWords": ["um", "like"], "pauseCount": 1, "paceNote": "Tốc độ nói tự nhiên (~130 WPM)", "comment": "Nhận xét độ trôi chảy & ngập ngừng bằng tiếng Việt..." }.
   - Provide up to 5 concrete "grammarVocabularyFixes": array of { "original": "exact substring copied verbatim from transcript", "corrected": "natural corrected English replacement", "reason": "giải thích ngắn tiếng Việt" }. IMPORTANT: "original" MUST match an exact phrase inside your "transcript" so the UI renders inline red strikethrough + green replacement right inside the text!
   - Provide 2-4 "vocabularyUpgrades": array of { "basic": "simple word/phrase used", "upgraded": "Band 8+ academic/idiomatic collocation", "ipa": "/.../", "meaning": "nghĩa tiếng Việt" }.
   - Provide "upgradedSample": a natural, high-scoring (Band 8-9) sample answer in English keeping and elevating the candidate's own ideas!
2. Compute overall criterion scores: "fc", "lr", "gra", "pr" (strictly whole integers 0..9, NO .5 decimals).
3. Overall Speaking Band MUST equal the average of the 4 criteria rounded to the nearest whole integer (0..9, NO .5 decimals; 0 if silent/no speech).
4. Write "overallFeedback" in Vietnamese, plus 2-4 "strengths" and 2-4 "improvements" in Vietnamese.

Return ONLY strictly valid JSON matching this schema (no markdown fences):
{
  "overallBand": 6,
  "criteria": {
    "fc": 6,
    "lr": 6,
    "gra": 6,
    "pr": 6
  },
  "overallFeedback": "Nhận xét tổng quan chi tiết bằng tiếng Việt...",
  "strengths": ["Điểm mạnh 1", "Điểm mạnh 2"],
  "improvements": ["Cần cải thiện 1", "Cần cải thiện 2"],
  "questionEvaluations": [
    {
      "questionId": "exact_question_id",
      "transcript": "Verbatim English spoken answer...",
      "band": 6,
      "criteria": { "fc": 6, "lr": 6, "gra": 6, "pr": 6 },
      "feedback": "Nhận xét cụ thể bằng tiếng Việt cho câu này...",
      "fluencyMetrics": {
        "fillerWords": ["um", "like"],
        "pauseCount": 1,
        "paceNote": "Nhịp nói vừa phải, còn vài chỗ ngắt nhịp",
        "comment": "Có 2 chỗ ngập ngừng nhẹ khi chuyển ý..."
      },
      "grammarVocabularyFixes": [
        {
          "original": "offer",
          "corrected": "prefer",
          "reason": "Dùng sai động từ: 'prefer' (thích hơn) thay vì 'offer' (đề nghị)."
        }
      ],
      "vocabularyUpgrades": [
        {
          "basic": "saves me time",
          "upgraded": "streamlines my daily commute",
          "ipa": "/ˈstriːmlaɪnz/",
          "meaning": "giúp tối ưu hóa việc đi lại hằng ngày"
        }
      ],
      "upgradedSample": "Natural Band 8+ model response..."
    }
  ]
}`;
}

const FILLER_REGEX = /\b(um+|uh+|er+|ah+|you know|i mean|sort of|kind of|actually|basically|right)\b|\[pause[^\]]*\]/gi;

export function analyzeTranscriptFluency(transcript = '', durationSec = 0) {
  const clean = String(transcript || '').trim();
  const words = clean.split(/\s+/).filter(Boolean);
  const wordCount = words.length;
  const dur = Math.max(0, Number(durationSec) || 0);
  const wpm = dur > 0 && wordCount > 0 ? Math.round((wordCount / dur) * 60) : 0;
  const pauseMatches = clean.match(/\[pause[^\]]*\]|\.{3}/gi) || [];
  const fillerMatches = (clean.match(/\b(um+|uh+|er+|ah+|you know|i mean|sort of|kind of|actually|basically)\b/gi) || []).map(w => w.toLowerCase());
  const fillerCounts = {};
  fillerMatches.forEach(w => {
    fillerCounts[w] = (fillerCounts[w] || 0) + 1;
  });
  const topFillers = Object.entries(fillerCounts).map(([word, count]) => (count > 1 ? `${word} (×${count})` : word));
  const paceLabel =
    wpm === 0
      ? 'Chưa rõ nhịp nói'
      : wpm < 95
      ? 'Chậm — Cần tăng phản xạ nối ý'
      : wpm <= 165
      ? 'Nhịp độ lý tưởng IELTS'
      : 'Khá nhanh — Giữ ngắt nhịp tự nhiên';
  return {
    wordCount,
    wpm,
    pauseCount: pauseMatches.length,
    fillerCount: fillerMatches.length,
    fillerWords: topFillers,
    paceLabel
  };
}

export function buildTranscriptCorrectionSegments(transcript = '', fixes = []) {
  const text = String(transcript || '');
  const fixList = Array.isArray(fixes)
    ? fixes
        .map((f, idx) => ({
          idx,
          original: String(f?.original || '').trim(),
          corrected: String(f?.corrected || '').trim(),
          reason: String(f?.reason || '').trim()
        }))
        .filter(f => f.original && f.corrected)
    : [];

  if (!text || fixList.length === 0) {
    return {
      segments: text ? [{ type: 'text', text }] : [],
      unmatchedFixes: fixList
    };
  }

  const lowerText = text.toLowerCase();
  const candidates = [];
  const matchedIndices = new Set();

  fixList.forEach(fix => {
    const needle = fix.original.toLowerCase();
    let searchFrom = 0;
    while (searchFrom < lowerText.length) {
      const foundIdx = lowerText.indexOf(needle, searchFrom);
      if (foundIdx === -1) break;
      const beforeChar = foundIdx > 0 ? lowerText[foundIdx - 1] : ' ';
      const afterPos = foundIdx + needle.length;
      const afterChar = afterPos < lowerText.length ? lowerText[afterPos] : ' ';
      const startsClean = !/[a-z0-9]/i.test(beforeChar) || !/[a-z0-9]/i.test(needle[0]);
      const endsClean = !/[a-z0-9]/i.test(afterChar) || !/[a-z0-9]/i.test(needle[needle.length - 1]);
      if (startsClean && endsClean) {
        candidates.push({
          start: foundIdx,
          end: afterPos,
          matchedText: text.slice(foundIdx, afterPos),
          fix
        });
        break;
      }
      searchFrom = foundIdx + 1;
    }
  });

  candidates.sort((a, b) => a.start - b.start || (b.end - b.start) - (a.end - a.start));
  const accepted = [];
  let cursor = 0;
  candidates.forEach(cand => {
    if (cand.start >= cursor) {
      accepted.push(cand);
      matchedIndices.add(cand.fix.idx);
      cursor = cand.end;
    }
  });

  const segments = [];
  let pos = 0;
  accepted.forEach(cand => {
    if (cand.start > pos) {
      segments.push({ type: 'text', text: text.slice(pos, cand.start) });
    }
    segments.push({
      type: 'correction',
      matchedText: cand.matchedText,
      original: cand.fix.original,
      corrected: cand.fix.corrected,
      reason: cand.fix.reason,
      idx: cand.fix.idx
    });
    pos = cand.end;
  });
  if (pos < text.length) {
    segments.push({ type: 'text', text: text.slice(pos) });
  }

  return {
    segments,
    unmatchedFixes: fixList.filter(f => !matchedIndices.has(f.idx))
  };
}

export function buildFluencyHighlightSegments(transcript = '') {
  const text = String(transcript || '');
  if (!text) return [];
  const regex = new RegExp(FILLER_REGEX.source, 'gi');
  const segments = [];
  let lastIndex = 0;
  let match;
  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      segments.push({ type: 'text', text: text.slice(lastIndex, match.index) });
    }
    const token = match[0];
    segments.push({
      type: token.startsWith('[') ? 'pause' : 'filler',
      text: token
    });
    lastIndex = match.index + token.length;
  }
  if (lastIndex < text.length) {
    segments.push({ type: 'text', text: text.slice(lastIndex) });
  }
  return segments;
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
    const rawQCrit = matched.criteria || {};
    const qCriteria = hasSpokenInput
      ? {
          fc: roundSpeakingBand(rawQCrit.fc ?? qBand ?? fc),
          lr: roundSpeakingBand(rawQCrit.lr ?? qBand ?? lr),
          gra: roundSpeakingBand(rawQCrit.gra ?? qBand ?? gra),
          pr: roundSpeakingBand(rawQCrit.pr ?? qBand ?? pr)
        }
      : { fc: 0, lr: 0, gra: 0, pr: 0 };

    const transcriptText = String(matched.transcript || rec.clientTranscript || (hasSpokenInput ? '(Đã ghi âm giọng nói)' : '(Chưa thu âm / Không có lời nói)')).trim();
    const computedFluency = analyzeTranscriptFluency(transcriptText, rec.durationSec);
    const rawFm = matched.fluencyMetrics && typeof matched.fluencyMetrics === 'object' ? matched.fluencyMetrics : {};
    const fluencyMetrics = {
      wpm: Number(rawFm.wpm) || computedFluency.wpm,
      fillerCount: Number(rawFm.fillerCount ?? computedFluency.fillerCount) || 0,
      pauseCount: Number(rawFm.pauseCount ?? computedFluency.pauseCount) || 0,
      fillerWords: Array.isArray(rawFm.fillerWords) && rawFm.fillerWords.length > 0
        ? rawFm.fillerWords.map(w => String(w || '').trim()).filter(Boolean).slice(0, 8)
        : computedFluency.fillerWords,
      paceNote: String(rawFm.paceNote || rawFm.paceLabel || computedFluency.paceLabel).trim(),
      comment: String(rawFm.comment || '').trim()
    };

    const vocabularyUpgrades = Array.isArray(matched.vocabularyUpgrades)
      ? matched.vocabularyUpgrades
          .filter(v => v && (v.basic || v.upgraded))
          .slice(0, 5)
          .map(v => ({
            basic: String(v.basic || '').trim(),
            upgraded: String(v.upgraded || '').trim(),
            ipa: String(v.ipa || '').trim(),
            meaning: String(v.meaning || '').trim()
          }))
      : [];

    return {
      questionId: rec.questionId,
      part: rec.part || 1,
      prompt: rec.prompt || '',
      transcript: transcriptText,
      band: qBand,
      criteria: qCriteria,
      fluencyMetrics,
      feedback: String(matched.feedback || (hasSpokenInput ? 'Câu trả lời đã được ghi nhận và đánh giá.' : 'Thí sinh chưa thu âm câu này (0.0).')).trim(),
      grammarVocabularyFixes: Array.isArray(matched.grammarVocabularyFixes)
        ? matched.grammarVocabularyFixes
            .filter(f => f && (f.original || f.corrected))
            .slice(0, 6)
            .map(f => ({
              original: String(f.original || '').trim(),
              corrected: String(f.corrected || '').trim(),
              reason: String(f.reason || '').trim()
            }))
        : [],
      vocabularyUpgrades,
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
    const rawTx = words.length > 0 ? String(rec.clientTranscript || '').trim() : '';
    const heuristicFixes = [];
    const heuristicRules = [
      { pat: /\bvery\s+like\b/i, rep: 'really enjoy', why: "Không dùng 'very' đứng trước động từ 'like'; dùng 'really enjoy' hoặc 'be keen on'." },
      { pat: /\ba\s+lot\s+of\b/i, rep: 'a wide variety of', why: "Nâng cấp cụm lặp phổ biến sang collocation học thuật tự nhiên hơn." },
      { pat: /\bvery\s+good\b/i, rep: 'exceptionally beneficial', why: "Tránh lặp 'very good'; dùng tính từ mạnh chuẩn Band 7.5+." },
      { pat: /\bmore\s+easy\b/i, rep: 'much easier', why: "Tính từ ngắn 'easy' dùng dạng so sánh hơn 'easier', không dùng 'more easy'." },
      { pat: /\bmore\s+better\b/i, rep: 'far better', why: "Không ghép 'more' trước 'better'." }
    ];
    if (rawTx) {
      heuristicRules.forEach(rule => {
        const m = rawTx.match(rule.pat);
        if (m) {
          heuristicFixes.push({ original: m[0], corrected: rule.rep, reason: rule.why });
        }
      });
    }
    const qCrit = {
      fc: roundSpeakingBand(qBand),
      lr: roundSpeakingBand(Math.max(3.0, qBand + (uniqueLexicon.size >= 18 ? 0.5 : -0.5))),
      gra: roundSpeakingBand(Math.max(3.0, qBand - (heuristicFixes.length > 0 ? 0.5 : 0))),
      pr: roundSpeakingBand(qBand)
    };
    const fm = analyzeTranscriptFluency(rawTx, dur);
    return {
      questionId: rec.questionId,
      transcript: rawTx || `(Đã lưu file ghi âm ${Math.round(dur)}s — chờ Gemini API Key để chép lời chính xác)`,
      band: roundSpeakingBand(qBand),
      criteria: qCrit,
      fluencyMetrics: {
        ...fm,
        comment: rawTx
          ? `Ghi nhận ~${fm.wpm || 0} từ/phút (${fm.paceLabel}).${fm.fillerCount > 0 ? ` Có ${fm.fillerCount} từ đệm/ngập ngừng (${fm.fillerWords.join(', ')}).` : ' Chưa phát hiện từ đệm thừa lớn trong bản nháp.'}`
          : 'Nhập Google Gemini API Key để AI nghe trực tiếp nhịp điệu, phát âm & điểm ngừng thực tế trong file âm thanh.'
      },
      feedback: words.length > 0
        ? `Ghi âm ${Math.round(dur)}s (${words.length} từ${wpm ? `, ~${wpm} từ/phút` : ''}). ${words.length >= 25 ? 'Ý trả lời rõ ràng; hãy thêm ví dụ cụ thể và từ nối tự nhiên để tăng điểm Fluency & Coherence.' : 'Câu trả lời hơi ngắn; nên mở rộng thêm 2–3 câu giải thích lý do hoặc ví dụ.'}`
        : `Đã lưu an toàn file ghi âm (${Math.round(dur)} giây). Điểm ước lượng sơ bộ dựa trên thời lượng nói; giáo viên có thể nghe lại file ghi âm trực tiếp hoặc cấu hình Google Gemini API Key để AI chép lời & chấm phát âm chi tiết từng âm tiết.`,
      grammarVocabularyFixes: heuristicFixes,
      vocabularyUpgrades: [],
      upgradedSample: 'Cấu hình Google Gemini API Key trong Tài khoản Giáo viên để AI nghe trực tiếp file ghi âm, chép lời chính xác, sửa từng lỗi dùng từ và gợi ý câu trả lời nâng lên Band 8.0+.'
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
