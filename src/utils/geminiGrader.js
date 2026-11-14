import { calculateWritingBand, getWordCount, roundIeltsBand } from './examHelpers';

export const GEMINI_PREFERRED_MODELS = [
  'gemini-2.5-flash',
  'gemini-3.8-flash',
  'gemini-2.0-flash',
  'gemini-2.5-flash-lite',
  'gemini-4-hydrogen',
  'gemini-2.5-pro',
  'gemini-flash-latest'
];

export function formatGeminiErrorMessage(status, rawText = '') {
  let parsedMsg = rawText;
  try {
    const parsed = JSON.parse(rawText);
    parsedMsg = parsed?.error?.message || rawText;
  } catch (_e) {}

  const lower = String(parsedMsg || '').toLowerCase();
  if (status === 400 && (lower.includes('api key') || lower.includes('api_key_invalid'))) {
    return 'API Key không hợp lệ. Vui lòng kiểm tra lại key từ Google AI Studio (aistudio.google.com).';
  }
  if (status === 401 || status === 403) {
    return 'API Key bị từ chối quyền truy cập hoặc chưa bật Generative Language API.';
  }
  if (status === 429) {
    return 'API Key đã vượt giới hạn lượt gọi (Quota). Vui lòng thử lại sau ít phút.';
  }
  if (status === 404) {
    return `Model AI không tồn tại hoặc đã ngừng hỗ trợ (${parsedMsg}).`;
  }
  return `Gemini API lỗi (${status}): ${parsedMsg}`;
}

export async function discoverGeminiModels(cleanKey) {
  const ordered = [];
  const pushUnique = (id) => {
    if (id && !ordered.includes(id)) ordered.push(id);
  };

  try {
    const listRes = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models?key=${encodeURIComponent(cleanKey)}`
    );
    if (!listRes.ok) {
      const errText = await listRes.text();
      if (listRes.status === 400 || listRes.status === 401 || listRes.status === 403) {
        throw new Error(formatGeminiErrorMessage(listRes.status, errText));
      }
    } else {
      const data = await listRes.json();
      const validIds = (data?.models || [])
        .filter(m => {
          const methods = m?.supportedGenerationMethods || [];
          const name = (m?.name || '').toLowerCase();
          return (
            methods.includes('generateContent') &&
            !name.includes('embedding') &&
            !name.includes('imagen') &&
            !name.includes('tts') &&
            !name.includes('aqa') &&
            !name.includes('robotics') &&
            !name.includes('computer-use')
          );
        })
        .map(m => String(m.name || '').replace(/^models\//, ''));

      GEMINI_PREFERRED_MODELS.forEach(pref => {
        if (validIds.includes(pref)) pushUnique(pref);
      });
      validIds.filter(id => id.includes('flash')).forEach(pushUnique);
      validIds.filter(id => id.includes('gemini')).forEach(pushUnique);
      validIds.forEach(pushUnique);
    }
  } catch (err) {
    if (err.message && (err.message.includes('API Key') || err.message.includes('quyền'))) {
      throw err;
    }
  }

  GEMINI_PREFERRED_MODELS.forEach(pushUnique);
  return ordered;
}

function dataUrlToGeminiPart(input) {
  if (!input) return null;
  if (typeof input === 'object' && input.inlineData?.data) return input;
  if (typeof input === 'object' && input.data && input.mimeType) {
    return { inlineData: { mimeType: input.mimeType, data: input.data } };
  }
  const str = String(input);
  const match = str.match(/^data:(image\/[a-zA-Z0-9.+-]+);base64,(.+)$/);
  if (!match) return null;
  return {
    inlineData: {
      mimeType: match[1],
      data: match[2]
    }
  };
}

export async function callGeminiGenerateJson({ apiKey, promptText, images = [], temperature = 0.2 }) {
  const cleanKey = (apiKey || '').trim().replace(/^['"]|['"]$/g, '');
  if (!cleanKey) {
    throw new Error('Chưa nhập Google Gemini API Key.');
  }

  const parts = [{ text: promptText }];
  (Array.isArray(images) ? images : []).forEach(img => {
    const part = dataUrlToGeminiPart(img);
    if (part) parts.push(part);
  });

  const candidates = await discoverGeminiModels(cleanKey);
  let lastError = null;

  for (const modelId of candidates) {
    const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(modelId)}:generateContent?key=${encodeURIComponent(cleanKey)}`;

    const attemptRequest = async (useJsonMime) => {
      const generationConfig = { temperature };
      if (useJsonMime) generationConfig.responseMimeType = 'application/json';
      return fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts }],
          generationConfig
        })
      });
    };

    let response = await attemptRequest(true);
    if (response.status === 400) {
      const errPreview = await response.clone().text();
      if (/mime|json/i.test(errPreview)) {
        response = await attemptRequest(false);
      }
    }

    if (response.ok) {
      const data = await response.json();
      const textContent = data?.candidates?.[0]?.content?.parts?.[0]?.text;
      if (!textContent) {
        lastError = new Error('AI không trả về nội dung.');
        continue;
      }
      const jsonMatch = textContent.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        lastError = new Error('AI không trả về đúng định dạng JSON.');
        continue;
      }
      return {
        parsed: JSON.parse(jsonMatch[0]),
        usedModel: modelId
      };
    }

    const errText = await response.text();
    const formatted = formatGeminiErrorMessage(response.status, errText);
    if (response.status === 404 || /not found|not supported for generatecontent/i.test(errText)) {
      lastError = new Error(formatted);
      continue;
    }
    throw new Error(formatted);
  }

  throw lastError || new Error('Không tìm thấy model Gemini phù hợp cho API Key này.');
}

export async function testGeminiApiConnection(apiKey) {
  const result = await callGeminiGenerateJson({
    apiKey,
    promptText: 'Return strictly valid JSON: {"status":"ok"}',
    temperature: 0
  });
  return result.usedModel;
}

export async function callGeminiWritingGrader({ apiKey, task1Prompt, task1Text, task2Prompt, task2Text }) {
  const w1Count = getWordCount(task1Text);
  const w2Count = getWordCount(task2Text);

  if (w1Count === 0 && w2Count === 0) {
    return {
      task1Band: 0,
      task2Band: 0,
      overallBand: 0,
      task1Criteria: { ta: 0, cc: 0, lr: 0, gra: 0, comment: 'Thí sinh để trống Task 1 (0 từ) → Band 0.0.' },
      task2Criteria: { tr: 0, cc: 0, lr: 0, gra: 0, comment: 'Thí sinh để trống Task 2 (0 từ) → Band 0.0.' },
      feedback: 'Thí sinh bỏ trống cả Task 1 và Task 2 (0 từ), không có nội dung để chấm điểm → Band Writing 0.0.',
      strengths: [],
      improvements: ['Cần viết đầy đủ bài làm Task 1 (tối thiểu 150 từ) và Task 2 (tối thiểu 250 từ) trước khi nộp bài.'],
      _usedModel: 'empty-submission-guard'
    };
  }

  const systemPrompt = `You are an official IELTS Writing Senior Examiner (certified by IDP and British Council).
Your task is to evaluate the candidate's IELTS Writing Task 1 and Task 2 submissions strictly according to the official IELTS Band Descriptors (scale 0.0 to 9.0, increments of 0.5):
- CRITICAL RULE: Band 4.0 is NOT the minimum. If a task is "(No submission)", empty, or contains zero meaningful English writing, you MUST assign Band 0.0 for that task and 0.0 for all its criteria (ta/tr, cc, lr, gra).
- Task 1 Criteria: Task Achievement (TA), Coherence & Cohesion (CC), Lexical Resource (LR), Grammatical Range & Accuracy (GRA).
- Task 2 Criteria: Task Response (TR), Coherence & Cohesion (CC), Lexical Resource (LR), Grammatical Range & Accuracy (GRA).

Task 1 Prompt: ${task1Prompt || 'No prompt specified'}
Candidate Task 1 Essay:
"""
${task1Text || '(No submission)'}
"""

Task 2 Prompt: ${task2Prompt || 'No prompt specified'}
Candidate Task 2 Essay:
"""
${task2Text || '(No submission)'}
"""

Calculate:
- task1Band: float (0.0 - 9.0, increments of 0.5)
- task2Band: float (0.0 - 9.0, increments of 0.5)
- overallBand: float = round to nearest 0.5 of ((task1Band + 2 * task2Band) / 3)

Return ONLY valid JSON format without markdown code fences or other prose:
{
  "task1Band": 6.5,
  "task2Band": 7.0,
  "overallBand": 7.0,
  "task1Criteria": {
    "ta": 6.5,
    "cc": 6.5,
    "lr": 7.0,
    "gra": 6.0,
    "comment": "Nhận xét chi tiết cho Task 1 bằng tiếng Việt"
  },
  "task2Criteria": {
    "tr": 7.0,
    "cc": 7.0,
    "lr": 7.0,
    "gra": 6.5,
    "comment": "Nhận xét chi tiết cho Task 2 bằng tiếng Việt"
  },
  "feedback": "Nhận xét tổng quan và phân tích điểm mạnh, điểm yếu, lỗi ngữ pháp từ vựng cần khắc phục bằng tiếng Việt.",
  "strengths": ["Điểm mạnh 1", "Điểm mạnh 2"],
  "improvements": ["Điểm cần khắc phục 1", "Điểm cần khắc phục 2"]
}`;

  const { parsed, usedModel } = await callGeminiGenerateJson({
    apiKey,
    promptText: systemPrompt,
    temperature: 0.2
  });

  const t1Band = w1Count === 0 ? 0 : roundIeltsBand(parsed?.task1Band ?? 0);
  const t2Band = w2Count === 0 ? 0 : roundIeltsBand(parsed?.task2Band ?? 0);
  const zeroCriteria = { ta: 0, cc: 0, lr: 0, gra: 0, comment: 'Thí sinh để trống Task 1 (0 từ) → Band 0.0.' };
  const zeroCriteria2 = { tr: 0, cc: 0, lr: 0, gra: 0, comment: 'Thí sinh để trống Task 2 (0 từ) → Band 0.0.' };

  return {
    ...parsed,
    task1Band: t1Band,
    task2Band: t2Band,
    overallBand: calculateWritingBand(t1Band, t2Band),
    task1Criteria: w1Count === 0 ? zeroCriteria : parsed?.task1Criteria,
    task2Criteria: w2Count === 0 ? zeroCriteria2 : parsed?.task2Criteria,
    _usedModel: usedModel
  };
}

export function simulateAIWritingGrading({ _task1Prompt, task1Text, _task2Prompt, task2Text }) {
  const w1Count = getWordCount(task1Text);
  const w2Count = getWordCount(task2Text);

  let t1Band = 0;
  if (w1Count === 0) t1Band = 0;
  else if (w1Count < 20) t1Band = 1.5;
  else if (w1Count < 50) t1Band = 3.0;
  else if (w1Count < 80) t1Band = 4.0;
  else if (w1Count < 120) t1Band = 5.0;
  else if (w1Count < 150) t1Band = 5.5;
  else if (w1Count < 180) t1Band = 6.5;
  else t1Band = 7.0;

  const t1BonusWords = ['illustrates', 'depicts', 'fluctuated', 'significant', 'proportion', 'upward', 'downward', 'respectively', 'overall', 'decade', 'gradually'];
  const t1HasKeywords = t1BonusWords.filter(w => (task1Text || '').toLowerCase().includes(w)).length;
  if (w1Count >= 140 && t1HasKeywords >= 3) t1Band = Math.min(9.0, t1Band + 0.5);

  let t2Band = 0;
  if (w2Count === 0) t2Band = 0;
  else if (w2Count < 20) t2Band = 1.5;
  else if (w2Count < 80) t2Band = 3.0;
  else if (w2Count < 150) t2Band = 4.5;
  else if (w2Count < 200) t2Band = 5.5;
  else if (w2Count < 250) t2Band = 6.0;
  else if (w2Count < 300) t2Band = 7.0;
  else t2Band = 7.5;

  const t2BonusWords = ['furthermore', 'moreover', 'however', 'consequently', 'perspective', 'fundamental', 'substantial', 'infrastructure', 'crucial', 'in conclusion', 'allocate'];
  const t2HasKeywords = t2BonusWords.filter(w => (task2Text || '').toLowerCase().includes(w)).length;
  if (w2Count >= 240 && t2HasKeywords >= 3) t2Band = Math.min(9.0, t2Band + 0.5);

  const overall = calculateWritingBand(t1Band, t2Band);

  const strengths = [];
  const improvements = [];

  if (w1Count === 0) improvements.push('Task 1 bị bỏ trống (0 từ) → Band 0.0.');
  else if (w1Count >= 150) strengths.push(`Task 1 đạt yêu cầu độ dài tiêu chuẩn (${w1Count} từ >= 150 từ).`);
  else improvements.push(`Task 1 chưa đủ 150 từ (${w1Count} từ), bị giảm điểm tiêu chí Task Achievement.`);

  if (w2Count === 0) improvements.push('Task 2 bị bỏ trống (0 từ) → Band 0.0.');
  else if (w2Count >= 250) strengths.push(`Task 2 độ dài tốt (${w2Count} từ >= 250 từ), phát triển ý khá đầy đủ.`);
  else improvements.push(`Task 2 chưa đạt 250 từ (${w2Count} từ), cần mở rộng thêm luận cứ.`);

  if (w1Count > 0 || w2Count > 0) {
    if (t2HasKeywords >= 3) strengths.push('Sử dụng tốt các liên từ nối học thuật (Coherence & Cohesion).');
    else improvements.push('Cần đa dạng hóa cấu trúc câu phức và từ vựng học thuật (Lexical Resource).');
  }

  const feedback = (w1Count === 0 && w2Count === 0)
    ? '[AI Examiner - Đánh Giá Writing Tự Động]:\n• Thí sinh bỏ trống cả Task 1 và Task 2 (0 từ) → Writing Band 0.0.'
    : `[AI Examiner - Đánh Giá Writing Tự Động]:
• Task 1 (Band ${t1Band}): ${w1Count === 0 ? 'Bỏ trống (0 từ).' : w1Count >= 150 ? 'Nêu được xu hướng tổng quát, phân bổ số liệu hợp lý.' : 'Cần bổ sung thêm câu Overview và đạt tối thiểu 150 từ.'}
• Task 2 (Band ${t2Band}): ${w2Count === 0 ? 'Bỏ trống (0 từ).' : w2Count >= 250 ? 'Cấu trúc bài cân đối giữa các đoạn thân bài, quan điểm được bảo vệ nhất quán.' : 'Cần mở rộng lập luận, ví dụ thực tiễn và đạt tối thiểu 250 từ.'}
• Khuyến nghị: Hoàn thiện cả 2 Task và dùng cấu trúc câu phức + Collocation chuẩn học thuật.`;

  return {
    task1Band: t1Band,
    task2Band: t2Band,
    overallBand: overall,
    task1Criteria: {
      ta: t1Band,
      cc: t1Band,
      lr: t1Band,
      gra: t1Band,
      comment: w1Count === 0
        ? 'Task 1 bỏ trống (0 từ) → Band 0.'
        : `Task 1: Độ dài ${w1Count} từ. Đạt mức độ hoàn thành nhiệm vụ tương ứng Band ${t1Band}.`
    },
    task2Criteria: {
      tr: t2Band,
      cc: t2Band,
      lr: t2Band,
      gra: t2Band,
      comment: w2Count === 0
        ? 'Task 2 bỏ trống (0 từ) → Band 0.'
        : `Task 2: Độ dài ${w2Count} từ. Đạt mức độ phản hồi đề tài tương ứng Band ${t2Band}.`
    },
    feedback,
    strengths,
    improvements
  };
}

export async function extractExamFromImages({
  apiKey,
  skill = 'listening',
  questionImages = [],
  answerKeyImages = [],
  preferCloze = true,
  extraInstructions = ''
}) {
  if (!Array.isArray(questionImages) || questionImages.length === 0) {
    throw new Error('Vui lòng tải lên ít nhất 1 ảnh đề thi trước khi chạy AI.');
  }

  const allImages = [...questionImages, ...answerKeyImages];
  const hasAnswerKeyImages = answerKeyImages.length > 0;
  const skillLabel = skill === 'reading' ? 'IELTS Reading' : 'IELTS Listening';

  const extractionPrompt = `You are a precision ${skillLabel} exam digitization engine.
I am providing ${questionImages.length} exam question/sheet image(s) FIRST, followed by ${answerKeyImages.length} separate Answer Key image(s) (if > 0).

YOUR GOAL:
Convert the visual exam sheet accurately into structured JSON without missing text, numbers, bullet points, or questions.

RULES FOR INLINE CLOZE / NOTE / FORM / SUMMARY COMPLETION ("Đục Lỗ"):
- ${preferCloze ? 'Whenever the exam has Note Completion, Form Completion, Table/Flowchart Completion, or Summary Fill-in-the-blank (like "Questions 1-10: Complete the notes below", numbered gaps "1 .....", "(1)", inline blanks inside sentences/bullets):' : 'If the exam contains inline Note/Form/Summary Completion:'}
  1. Preserve the EXACT instruction header (e.g. "Questions 1-10\\nComplete the notes below.\\nWrite ONE WORD AND/OR A NUMBER for each answer."), the main uppercase box title (e.g. "**HIRING A PUBLIC ROOM**"), section subheadings (e.g. "**Room and cost**"), Example lines, and bullet lines prefixed with "• ".
  2. Replace EVERY answer gap in "clozeText" with the exact token "{{N}}" where N is the question number (example: "• the {{1}} Room – seats 100", "• Cost of Main Hall for Saturday evening: £{{2}}"). Keep all surrounding words intact!
  3. Also create a corresponding entry in "questions" with:
     - "blankNum": N (integer)
     - "type": "fill"
     - "question": "N. <short surrounding phrase with ____>"
     - "options": []
     - "correctAnswer": exact answer from Answer Key if known, otherwise ""

RULES FOR MCQ / TRUE-FALSE-NOT GIVEN / STANDALONE QUESTIONS:
- For Multiple Choice questions: set "type": "mcq", extract full question text into "question", and put clean array of options (e.g. ["A. ...", "B. ...", "C. ..."]) into "options".
- For True/False/Not Given: set "type": "tfng", "options": ["TRUE", "FALSE", "NOT GIVEN"], and match "correctAnswer" cleanly.
- If there are ONLY MCQ/TFNG questions and no note/summary cloze text, set "clozeText": "".

RULES FOR READING PASSAGES & TITLES:
- If ${skillLabel} includes a reading passage in the image(s), extract the full readable passage text cleanly into "passageText" (with paragraph breaks) and the title into "title". If not present, leave "passageText": "".
- For Listening, extract a clean concise topic title into "title" (if visible in image), and put any non-cloze context notes in "contextText" if helpful.

RULES FOR CORRECT ANSWERS ("correctAnswer"):
- ${hasAnswerKeyImages ? 'You MUST match answers carefully from the Answer Key image(s) provided at the end! If alternative acceptable answers are shown in the key (e.g. "15 / fifteen" or "(the) park"), format them using " | " or exact key.' : skill === 'reading' ? 'If the full reading passage text is visible in the image(s), carefully solve each question accurately and populate "correctAnswer"; otherwise leave "correctAnswer": "".' : 'Do NOT guess or invent answers for Listening gaps if no Answer Key image is provided; set "correctAnswer": "" cleanly unless an answer is explicitly printed on the sheet.'}
${extraInstructions ? `\nADDITIONAL TEACHER NOTES:\n${extraInstructions}` : ''}

Return ONLY strictly valid JSON matching this schema:
{
  "title": "Topic or test sheet title (or empty string)",
  "passageText": "Full reading passage text if present, else empty string",
  "clozeText": "Formatted Note/Summary/Cloze template with {{1}}, {{2}} inline placeholders, or empty string if only MCQ/TFNG",
  "questions": [
    {
      "blankNum": 1,
      "type": "fill",
      "question": "1. the ____ Room – seats 100",
      "options": [],
      "correctAnswer": ""
    }
  ]
}`;

  const { parsed, usedModel } = await callGeminiGenerateJson({
    apiKey,
    promptText: extractionPrompt,
    images: allImages,
    temperature: 0.1
  });

  const rawQuestions = Array.isArray(parsed?.questions) ? parsed.questions : [];
  const normalizedQuestions = rawQuestions.map((q, idx) => {
    const rawType = String(q?.type || 'fill').toLowerCase().trim();
    let type = 'fill';
    if (rawType === 'mcq' || rawType === 'multiple_choice' || (Array.isArray(q?.options) && q.options.length >= 2 && rawType !== 'tfng')) {
      type = 'mcq';
    } else if (rawType === 'tfng' || rawType === 'true_false_not_given' || rawType === 'ynng') {
      type = 'tfng';
    }

    const options =
      type === 'tfng'
        ? (Array.isArray(q?.options) && q.options.length > 0 ? q.options : ['TRUE', 'FALSE', 'NOT GIVEN'])
        : type === 'mcq'
        ? (Array.isArray(q?.options) ? q.options.map(o => String(o || '').trim()).filter(Boolean) : [])
        : [];

    const blankNum = Number.isFinite(Number(q?.blankNum)) && Number(q.blankNum) > 0
      ? Number(q.blankNum)
      : undefined;

    return {
      blankNum,
      type,
      question: String(q?.question || `${blankNum || idx + 1}. Câu hỏi`).trim(),
      options,
      correctAnswer: String(q?.correctAnswer ?? '').trim()
    };
  });

  return {
    title: String(parsed?.title || '').trim(),
    passageText: String(parsed?.passageText || '').trim(),
    clozeText: String(parsed?.clozeText || '').trim(),
    questions: normalizedQuestions,
    usedModel
  };
}
