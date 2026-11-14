import { getWordCount, roundIeltsBand } from './examHelpers';

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

export async function callGeminiGenerateJson({ apiKey, promptText, temperature = 0.2 }) {
  const cleanKey = (apiKey || '').trim().replace(/^['"]|['"]$/g, '');
  if (!cleanKey) {
    throw new Error('Chưa nhập Google Gemini API Key.');
  }

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
          contents: [{ parts: [{ text: promptText }] }],
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
  const systemPrompt = `You are an official IELTS Writing Senior Examiner (certified by IDP and British Council).
Your task is to evaluate the candidate's IELTS Writing Task 1 and Task 2 submissions strictly according to the official IELTS Band Descriptors (scale 0 to 9.0, increments of 0.5):
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
- task1Band: float (0.0 - 9.0)
- task2Band: float (0.0 - 9.0)
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
  return { ...parsed, _usedModel: usedModel };
}

export function simulateAIWritingGrading({ _task1Prompt, task1Text, _task2Prompt, task2Text }) {
  const w1Count = getWordCount(task1Text);
  const w2Count = getWordCount(task2Text);

  let t1Band = 5.0;
  if (w1Count === 0) t1Band = 0;
  else if (w1Count < 80) t1Band = 4.0;
  else if (w1Count < 120) t1Band = 5.0;
  else if (w1Count < 150) t1Band = 5.5;
  else if (w1Count < 180) t1Band = 6.5;
  else t1Band = 7.0;

  const t1BonusWords = ['illustrates', 'depicts', 'fluctuated', 'significant', 'proportion', 'upward', 'downward', 'respectively', 'overall', 'decade', 'gradually'];
  const t1HasKeywords = t1BonusWords.filter(w => (task1Text || '').toLowerCase().includes(w)).length;
  if (w1Count >= 140 && t1HasKeywords >= 3) t1Band = Math.min(9.0, t1Band + 0.5);

  let t2Band = 5.0;
  if (w2Count === 0) t2Band = 0;
  else if (w2Count < 150) t2Band = 4.5;
  else if (w2Count < 200) t2Band = 5.5;
  else if (w2Count < 250) t2Band = 6.0;
  else if (w2Count < 300) t2Band = 7.0;
  else t2Band = 7.5;

  const t2BonusWords = ['furthermore', 'moreover', 'however', 'consequently', 'perspective', 'fundamental', 'substantial', 'infrastructure', 'crucial', 'in conclusion', 'allocate'];
  const t2HasKeywords = t2BonusWords.filter(w => (task2Text || '').toLowerCase().includes(w)).length;
  if (w2Count >= 240 && t2HasKeywords >= 3) t2Band = Math.min(9.0, t2Band + 0.5);

  const overall = (t1Band === 0 && t2Band === 0) ? 0 : roundIeltsBand((t1Band + t2Band * 2) / 3);

  const strengths = [];
  const improvements = [];

  if (w1Count >= 150) strengths.push(`Task 1 đạt yêu cầu độ dài tiêu chuẩn (${w1Count} từ >= 150 từ).`);
  else if (w1Count > 0) improvements.push(`Task 1 chưa đủ 150 từ (${w1Count} từ), bị giảm điểm tiêu chí Task Achievement.`);

  if (w2Count >= 250) strengths.push(`Task 2 độ dài tốt (${w2Count} từ >= 250 từ), phát triển ý khá đầy đủ.`);
  else if (w2Count > 0) improvements.push(`Task 2 chưa đạt 250 từ (${w2Count} từ), cần mở rộng thêm luận cứ.`);

  if (t2HasKeywords >= 3) strengths.push('Sử dụng tốt các liên từ nối học thuật (Coherence & Cohesion).');
  else improvements.push('Cần đa dạng hóa cấu trúc câu phức và từ vựng học thuật (Lexical Resource).');

  const feedback = `[AI Examiner - Đánh Giá Writing Tự Động]:
• Tổng quan: Thí sinh duy trì mạch văn mạch lạc, lập luận tương đối chặt chẽ.
• Task 1 (Band ${t1Band}): ${w1Count >= 150 ? 'Nêu được xu hướng tổng quát, phân bổ số liệu hợp lý.' : 'Cần bổ sung thêm câu Overview và mô tả chi tiết các điểm dữ liệu then chốt.'}
• Task 2 (Band ${t2Band}): ${w2Count >= 250 ? 'Cấu trúc bài cân đối giữa các đoạn thân bài, quan điểm được bảo vệ nhất quán.' : 'Cần phân tích sâu hơn hậu quả và giải pháp bằng các ví dụ thực tiễn.'}
• Khuyến nghị: Rèn luyện thêm các cấu trúc đảo ngữ (Inversion), câu điều kiện nâng cao và từ vựng Collocation C1/C2 để bứt phá lên Band 8.0+.`;

  return {
    task1Band: t1Band,
    task2Band: t2Band,
    overallBand: overall,
    task1Criteria: {
      ta: t1Band,
      cc: t1Band,
      lr: t1Band,
      gra: t1Band,
      comment: `Task 1: Độ dài ${w1Count} từ. Đạt mức độ hoàn thành nhiệm vụ tương ứng Band ${t1Band}.`
    },
    task2Criteria: {
      tr: t2Band,
      cc: t2Band,
      lr: t2Band,
      gra: t2Band,
      comment: `Task 2: Độ dài ${w2Count} từ. Đạt mức độ phản hồi đề tài tương ứng Band ${t2Band}.`
    },
    feedback,
    strengths,
    improvements
  };
}
