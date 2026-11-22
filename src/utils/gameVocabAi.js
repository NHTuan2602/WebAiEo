import { callGeminiGenerateJson } from './geminiGrader.js';

/**
 * Use Gemini AI to convert raw text, word lists, screenshots, or PDF pages
 * into structured 4-round Game Arena question cards (V1 Meaning, V2 Typing,
 * V3 Synonym/Antonym or 4-option Context MCQ, V4 Sentence-Blank Typing with multiple accepted answers).
 */
export async function generateGameVocabQuestionsWithAI({
  apiKey = '',
  rawInput = '',
  images = [],
  documents = [],
  mode = 'auto_4_rounds'
}) {
  const cleanText = String(rawInput || '').trim();
  const hasMedia = (Array.isArray(images) && images.length > 0) || (Array.isArray(documents) && documents.length > 0);
  if (!cleanText && !hasMedia) {
    throw new Error('Vui lòng dán danh sách từ/câu hỏi hoặc tải ảnh/PDF trước khi chạy AI.');
  }

  const modeInstruction =
    mode === 'extract_exact'
      ? `Ưu tiên TRÍCH XUẤT Y NGUYÊN các câu hỏi trắc nghiệm (4 đáp án) và câu điền từ (Typing có chỗ trống ____________ và mọi đáp án xanh được chấp nhận) xuất hiện trong văn bản / ảnh / PDF.`
      : `Từ danh sách từ vựng / chủ đề / tài liệu đầu vào, hãy TẠO ĐẦY ĐỦ dữ liệu cho cả 4 Màn Game IELTS:
- Màn 1 & 2: Từ vựng chuẩn (word), Nghĩa tiếng Việt ngắn gọn chính xác (prompt), phiên âm IPA (ipa).
- Màn 3: Từ ĐỒNG NGHĨA chuẩn IELTS (syn) và Từ TRÁI NGHĨA chuẩn IELTS (ant). Nếu nguồn có câu trắc nghiệm ngữ cảnh 4 lựa chọn, đặt v3CustomMode="mcq" kèm v3CustomQuestion, v3CustomChoices (4 phương án), v3CustomAnswer.
- Màn 4 (Typing diệt Boss): Tạo câu hoàn chỉnh tiếng Anh có chỗ trống ____________ (v4CustomSentence) và danh sách 1–3 cụm từ/từ đáp án đúng tương đương (v4AcceptedAnswers) để học sinh tự gõ vào chỗ trống.`;

  const promptText = `Bạn là chuyên gia biên soạn đề thi IELTS & kho câu hỏi Game Từ Vựng cho trung tâm IELTS Ms. Như.
${modeInstruction}

YÊU CẦU ĐẦU RA: Trả về DUY NHẤT một JSON object hợp lệ với cấu trúc:
{
  "items": [
    {
      "word": "ENFORCE",
      "prompt": "thi hành, thực thi (luật/quy định)",
      "ipa": "/ɪnˈfɔːs/",
      "example": "The government needs to enforce stricter environmental regulations on factories.",
      "syn": "IMPOSE",
      "ant": "IGNORE",
      "v3CustomMode": "syn_ant",
      "v3CustomQuestion": "",
      "v3CustomChoices": [],
      "v3CustomAnswer": "",
      "v4CustomSentence": "The government needs to ____________ stricter environmental regulations on factories in industrial zones.",
      "v4AcceptedAnswers": ["enforce", "strictly enforce"],
      "timeSec": 20
    }
  ]
}

QUY TẮC QUAN TRỌNG:
1. "v4CustomSentence" PHẢI chứa chỗ trống "____________" và KHÔNG được tiết lộ đáp án trong câu hỏi.
2. "v4AcceptedAnswers" là mảng gồm ít nhất 1 đáp án tiếng Anh chuẩn (viết thường tự nhiên, không dấu chấm cuối). Nếu câu có nhiều cách điền đồng nghĩa (như "unified global framework", "cohesive global strategy", "legally binding agreement"), liệt kê đủ vào mảng.
3. Nếu trích xuất câu trắc nghiệm 4 đáp án (MCQ), đặt "v3CustomMode": "mcq", "v3CustomQuestion": câu gốc có "_______", "v3CustomChoices": đúng 4 phương án, "v3CustomAnswer": phương án đúng (phải trùng khớp 1 phần tử trong v3CustomChoices), và vẫn điền "word" = đáp án đúng viết HOA, "prompt" = nghĩa tiếng Việt.
4. "syn" và "ant" phải là từ/cụm tiếng Anh ngắn gọn (1–3 từ), viết HOA, KHÔNG trùng với "word".
5. Không tạo quá 40 câu trong 1 lần gọi. Chỉ trả về JSON, không markdown giải thích.

NỘI DUNG NGUỒN CỦA GIÁO VIÊN:
${cleanText || '(Xem ảnh / file PDF đính kèm)'}`;

  const { parsed, usedModel } = await callGeminiGenerateJson({
    apiKey,
    promptText,
    images,
    documents,
    temperature: 0.25
  });

  const rawItems = Array.isArray(parsed?.items)
    ? parsed.items
    : Array.isArray(parsed)
    ? parsed
    : [];

  const normalized = rawItems
    .filter(it => it && typeof it === 'object')
    .map((it, idx) => {
      const v3Choices = Array.isArray(it.v3CustomChoices)
        ? it.v3CustomChoices.map(c => String(c || '').trim()).filter(Boolean).slice(0, 4)
        : [];
      const v3Answer = String(it.v3CustomAnswer || '').trim();
      const v4Answers = (Array.isArray(it.v4AcceptedAnswers) ? it.v4AcceptedAnswers : [it.collocation || it.word])
        .map(a => String(a || '').trim())
        .filter(Boolean);
      const word = String(it.word || v3Answer || v4Answers[0] || '').trim().toUpperCase();
      const prompt = String(it.prompt || it.v4CustomSentence || it.v3CustomQuestion || '').trim();
      if (!word || !prompt) return null;
      return {
        id: `ai_gq_${Date.now()}_${idx}`,
        word,
        prompt,
        ipa: String(it.ipa || '').trim(),
        example: String(it.example || '').trim(),
        syn: String(it.syn || '').trim().toUpperCase(),
        ant: String(it.ant || '').trim().toUpperCase(),
        collocation: v4Answers[0] || word.toLowerCase(),
        v3CustomMode: it.v3CustomMode === 'mcq' && v3Choices.length >= 2 && v3Answer ? 'mcq' : 'syn_ant',
        v3CustomQuestion: String(it.v3CustomQuestion || '').trim(),
        v3CustomChoices: v3Choices,
        v3CustomAnswer: v3Answer,
        v4CustomSentence: String(it.v4CustomSentence || '').trim(),
        v4AcceptedAnswers: v4Answers.length > 0 ? v4Answers : [word.toLowerCase()],
        timeSec: Math.max(0, Math.min(120, Math.round(Number(it.timeSec) || 20)))
      };
    })
    .filter(Boolean);

  if (normalized.length === 0) {
    throw new Error('AI không trích xuất được câu hỏi nào. Hãy thử nội dung rõ hơn hoặc ảnh sắc nét hơn.');
  }

  return { items: normalized, usedModel };
}
