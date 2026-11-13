import React, { useState, useEffect, useRef } from 'react';
import {
  BookOpen,
  Headphones,
  PenTool,
  ShieldAlert,
  CheckCircle,
  Clock,
  Plus,
  Trash2,
  Edit,
  Volume2,
  Play,
  MessageSquare,
  FileText,
  Save,
  Sparkles,
  X,
  AlertTriangle,
  ChevronLeft,
  Award,
  Loader2,
  Bot,
  Key,
  Gamepad2,
  LogOut,
  XCircle,
  Trophy,
  Lock,
  Unlock,
  TrendingUp,
  Target,
  GraduationCap,
  Calendar,
  History,
  BarChart2,
  UserCheck,
  Upload,
  Image,
  Eye,
  Sun,
  Moon,
  Lightbulb
} from 'lucide-react';

// ==========================================
// 1. DEFAULT SEED DATA & CONSTANTS
// ==========================================
const DEFAULT_VOCAB_TEXT = `UBIQUITOUS | Có mặt ở khắp mọi nơi, phổ biến rộng rãi | /juːˈbɪk.wɪ.təs/ | Smartphones have become ubiquitous in modern daily life.
MITIGATE | Làm giảm nhẹ, làm dịu bớt mức độ nghiêm trọng | /ˈmɪt.ɪ.ɡeɪt/ | Planting more trees helps mitigate the effects of climate change.
DETERIORATE | Trở nên tồi tệ hơn, xuống cấp | /dɪˈtɪə.ri.ə.reɪt/ | Air quality in major cities continues to deteriorate rapidly.
PLAUSIBLE | Hợp lý, đáng tin cậy, có vẻ đúng | /ˈplɔː.zə.bəl/ | The scientist provided a plausible explanation for the phenomenon.
LUCRATIVE | Sinh lời cao, mang lại nhiều lợi nhuận | /ˈluː.krə.tɪv/ | Software engineering remains a highly lucrative career path.
INEVITABLE | Không thể tránh khỏi, chắc chắn xảy ra | /ɪˈnev.ɪ.tə.bəl/ | Automation makes job transformation inevitable in many industries.
SCRUTINIZE | Xem xét, kiểm tra cực kỳ kỹ lưỡng | /ˈskruː.tɪ.naɪz/ | Auditors closely scrutinize the company's financial records.
DETRIMENTAL | Có hại, gây tổn hại | /ˌdet.rɪˈmen.təl/ | Lack of sleep has a detrimental impact on cognitive performance.
PROLIFERATE | Tăng nhanh về số lượng, sinh sôi nảy nở | /prəˈlɪf.ər.eɪt/ | AI tools have proliferated across the tech industry in recent years.
ALLEVIATE | Làm giảm bớt nỗi đau hoặc khó khăn | /əˈliː.vi.eɪt/ | New policies aim to alleviate traffic congestion in big cities.
AMBIGUOUS | Mơ hồ, nhập nhằng nhiều nghĩa | /æmˈbɪɡ.ju.əs/ | The wording of the agreement was deliberately ambiguous.
RESILIENT | Kiên cường, có khả năng phục hồi nhanh | /rɪˈzɪl.i.ənt/ | Local communities proved resilient in the face of natural disasters.`;

const FALLBACK_DISTRACTORS = ["ABUNDANT", "OBSOLETE", "FLOURISH", "STAGNANT", "CONDUCIVE", "SPORADIC", "EMPIRICAL", "TRIVIAL"];
const GAME_ROUND_TIME_LIMITS = { 1: 20, 2: 25, 3: 25 };

const DEFAULT_TESTS = [
  {
    id: 'test-1',
    title: 'IELTS Academic Practice Test 01 - Full Simulation',
    description: 'Đề thi thử Academic 3 kỹ năng Listening, Reading, Writing chuẩn cấu trúc IDP/BC.',
    createdAt: '2026-03-01',
    maxAudioPlays: 1,
    shuffleOptions: true,
    allowViewAnswers: false, // Quản lý bởi Giáo viên: Mặc định KHÓA đáp án đúng
    listening: {
      audioUrl: '',
      transcript: 'Welcome to the university campus tour. Today we will explore the main library, science hall, and student cafeteria...',
      questions: [
        {
          id: 'l1',
          type: 'mcq',
          question: '1. What is the main purpose of the campus tour?',
          options: [
            'A. To introduce key facilities to new students',
            'B. To collect student feedback on library services',
            'C. To inspect science laboratory safety equipment',
            'D. To organize a sports event in the cafeteria'
          ],
          correctAnswer: 'A. To introduce key facilities to new students'
        },
        {
          id: 'l2',
          type: 'fill',
          question: '2. The central library closes at ______ PM on Fridays.',
          correctAnswer: '9'
        },
        {
          id: 'l3',
          type: 'mcq',
          question: '3. Where can students renew their identity badges?',
          options: [
            'A. Student Affairs Office',
            'B. Main Security Desk',
            'C. Information Center in Hall B',
            'D. Online Portal only'
          ],
          correctAnswer: 'A. Student Affairs Office'
        }
      ]
    },
    reading: {
      passageTitle: 'Passage 1: The Evolution of Renewable Solar Tech',
      passageText: `Solar energy technology has advanced dramatically over the past two decades. Early photovoltaic cells had an efficiency rate of less than 10%, converting only a small fraction of sunlight into usable electricity. Modern silicon-based panels now exceed 22% efficiency, while experimental multi-junction cells achieve over 45% in laboratory settings.

One major driver of this progress is thin-film solar technology. By depositing ultra-thin layers of photovoltaic materials onto flexible substrates like glass or metal sheets, manufacturers have significantly reduced production costs and expanded applications. BIPV (Building-Integrated Photovoltaics) now allows windows and roofing tiles to generate clean power without altering architectural aesthetics.

However, energy storage remains a critical bottleneck. Solar power output fluctuates based on weather and day-night cycles, requiring large-scale battery systems such as lithium-ion or flow batteries to store surplus power during peak sun hours. Engineers are actively testing solid-state batteries to enhance storage density and safety for future grid integration.`,
      questions: [
        {
          id: 'r1',
          type: 'mcq',
          question: '1. What was the efficiency of early photovoltaic cells mentioned in the text?',
          options: [
            'A. Under 10%',
            'B. Exactly 22%',
            'C. Over 45%',
            'D. Around 15%'
          ],
          correctAnswer: 'A. Under 10%'
        },
        {
          id: 'r2',
          type: 'tfng',
          question: '2. Thin-film technology requires thicker glass layers than traditional panels.',
          options: ['TRUE', 'FALSE', 'NOT GIVEN'],
          correctAnswer: 'FALSE'
        },
        {
          id: 'r3',
          type: 'fill',
          question: '3. Solar energy production varies according to weather and ______ cycles.',
          correctAnswer: 'day-night'
        }
      ]
    },
    writing: {
      task1: {
        prompt: 'Task 1: The chart below shows global solar power capacity (in Gigawatts) from 2015 to 2025. Summarise the information by selecting and reporting the main features, and make comparisons where relevant.',
        minWords: 150,
        modelAnswer: 'The bar chart illustrates the progressive growth in global solar energy capacity, measured in gigawatts (GW), between 2015 and 2025. Overall, there was a steady and dramatic upward trajectory across the decade, with capacity expanding more than sevenfold from initial baseline levels. In the first five years, capacity grew moderately from roughly 230 GW to 710 GW. However, after 2020, investment accelerated exponentially, eventually peaking at over 1,650 GW by 2025.'
      },
      task2: {
        prompt: 'Task 2: Some people believe that governments should prioritize spending on renewable energy research, while others think traditional infrastructure (roads, bridges, hospitals) is more urgent. Discuss both views and give your opinion.',
        minWords: 250,
        modelAnswer: 'The question of whether government expenditure should be directed towards renewable energy research or conventional physical infrastructure remains a subject of intense global debate. While public infrastructure such as highways and healthcare systems addresses immediate social needs, I firmly believe that investment in sustainable energy research is far more vital for long-term ecological survival and sustainable economic growth.'
      }
    }
  }
];

const DEFAULT_ATTEMPTS = [
  {
    id: 'att-101',
    testId: 'test-1',
    testTitle: 'IELTS Academic Practice Test 01 - Full Simulation',
    studentId: 'hocsinh_01',
    studentName: 'Nguyễn Văn A',
    submittedAt: '2026-03-02 14:30',
    answers: {
      l1: 'A. To introduce key facilities to new students',
      l2: '9',
      l3: 'A. Student Affairs Office',
      r1: 'A. Under 10%',
      r2: 'FALSE',
      r3: 'day-night',
      w1: 'The given chart illustrates the global total solar power capacity measured in gigawatts between 2015 and 2025. Overall, there was a steady upward trend in capacity over the ten-year period, with substantial acceleration observed in the second half of the decade...',
      w2: 'In recent years, the allocation of public funds has spark intense debate. While some argue that funding primary infrastructure like highways and hospitals is essential, I strongly believe that investing in renewable energy is more vital for long-term survival...'
    },
    antiCheatLogs: [
      { timestamp: '14:05:12', skill: 'listening', event: 'Chuyển tab / Mất tập trung cửa sổ' },
      { timestamp: '14:22:45', skill: 'reading', event: 'Mất focus trình duyệt' }
    ],
    tabSwitchCount: 2,
    teacherGraded: true,
    aiGraded: true,
    scores: {
      listening: { raw: 3, total: 3, band: 9.0 },
      reading: { raw: 3, total: 3, band: 9.0 },
      writing: { task1Band: 7.0, task2Band: 7.5, overallBand: 7.5 }
    },
    overallBand: 8.5,
    teacherFeedback: 'Thí sinh làm bài rất tốt kỹ năng Listening và Reading. Phần Writing cấu trúc bài ổn, từ vựng phong phú, cần chú ý tính liên kết câu tốt hơn ở đoạn 2.'
  },
  {
    id: 'att-102',
    testId: 'test-1',
    testTitle: 'IELTS Academic Practice Test 01 - Full Simulation',
    studentId: 'hocsinh_01',
    studentName: 'Nguyễn Văn A',
    submittedAt: '2026-02-22 15:45',
    answers: {
      l1: 'A. To introduce key facilities to new students',
      l2: '9',
      l3: 'B. Main Security Desk',
      r1: 'A. Under 10%',
      r2: 'TRUE',
      r3: 'day-night',
      w1: 'The chart describes the development of solar energy generation worldwide from 2015 to 2025...',
      w2: 'Many people debate whether government money should be spent on renewable power or standard infrastructure...'
    },
    antiCheatLogs: [
      { timestamp: '15:10:02', skill: 'listening', event: 'Mất focus trình duyệt' }
    ],
    tabSwitchCount: 1,
    teacherGraded: true,
    aiGraded: true,
    scores: {
      listening: { raw: 2, total: 3, band: 7.5 },
      reading: { raw: 2, total: 3, band: 7.5 },
      writing: { task1Band: 7.0, task2Band: 7.0, overallBand: 7.0 }
    },
    overallBand: 7.5,
    teacherFeedback: 'Tiến bộ rõ rệt ở phần Writing Task 2. Cần cẩn thận hơn khi đọc câu hỏi TRUE/FALSE/NOT GIVEN ở Reading.'
  },
  {
    id: 'att-103',
    testId: 'test-1',
    testTitle: 'IELTS Academic Practice Test 01 - Full Simulation',
    studentId: 'hocsinh_01',
    studentName: 'Nguyễn Văn A',
    submittedAt: '2026-02-10 09:15',
    answers: {
      l1: 'A. To introduce key facilities to new students',
      l2: '10',
      l3: 'B. Main Security Desk',
      r1: 'D. Around 15%',
      r2: 'TRUE',
      r3: 'day-night',
      w1: 'The graph gives information about solar power capacity between 2015 and 2025...',
      w2: 'Nowadays energy is an important problem for every nation...'
    },
    antiCheatLogs: [
      { timestamp: '09:20:11', skill: 'listening', event: 'Chuyển tab' },
      { timestamp: '09:35:40', skill: 'reading', event: 'Chuột phải bị chặn' },
      { timestamp: '09:44:18', skill: 'writing', event: 'Chuyển tab' }
    ],
    tabSwitchCount: 3,
    teacherGraded: true,
    aiGraded: true,
    scores: {
      listening: { raw: 1, total: 3, band: 6.0 },
      reading: { raw: 1, total: 3, band: 6.0 },
      writing: { task1Band: 6.0, task2Band: 6.5, overallBand: 6.5 }
    },
    overallBand: 6.5,
    teacherFeedback: 'Lần thi đầu tiên để làm quen với hình thức thi trên máy tính (CD-IELTS). Cần quản lý thời gian tốt hơn.'
  },
  {
    id: 'att-104',
    testId: 'test-1',
    testTitle: 'IELTS Academic Practice Test 01 - Full Simulation',
    studentId: 'hocsinh_02',
    studentName: 'Trần Thị Mai',
    submittedAt: '2026-03-05 16:20',
    answers: {
      l1: 'A. To introduce key facilities to new students',
      l2: '9',
      l3: 'A. Student Affairs Office',
      r1: 'A. Under 10%',
      r2: 'FALSE',
      r3: 'day-night',
      w1: 'The presented graph portrays the progression of global solar electricity generation...',
      w2: 'Sustainable energy versus foundational infrastructure represents a core dilemma for modern authorities...'
    },
    antiCheatLogs: [],
    tabSwitchCount: 0,
    teacherGraded: true,
    aiGraded: true,
    scores: {
      listening: { raw: 3, total: 3, band: 9.0 },
      reading: { raw: 2, total: 3, band: 7.5 },
      writing: { task1Band: 7.0, task2Band: 7.5, overallBand: 7.5 }
    },
    overallBand: 8.0,
    teacherFeedback: 'Bài làm rất chắc chắn, không có vi phạm gian lận nào. Kỹ năng Listening hoàn hảo!'
  },
  {
    id: 'att-105',
    testId: 'test-1',
    testTitle: 'IELTS Academic Practice Test 01 - Full Simulation',
    studentId: 'hocsinh_03',
    studentName: 'Lê Hoàng Long',
    submittedAt: '2026-03-01 11:15',
    answers: {
      l1: 'B. To collect student feedback on library services',
      l2: '9',
      l3: 'A. Student Affairs Office',
      r1: 'A. Under 10%',
      r2: 'NOT GIVEN',
      r3: 'weather',
      w1: 'The diagram shows the change in total solar capacity across decade...',
      w2: 'Governments have many things to spend money on such as hospitals and green energy...'
    },
    antiCheatLogs: [
      { timestamp: '11:20:12', skill: 'listening', event: 'Chuyển tab' },
      { timestamp: '11:28:45', skill: 'reading', event: 'Chuyển tab' },
      { timestamp: '11:35:10', skill: 'writing', event: 'Mất focus' },
      { timestamp: '11:42:30', skill: 'writing', event: 'Chuyển tab' }
    ],
    tabSwitchCount: 4,
    teacherGraded: true,
    aiGraded: true,
    scores: {
      listening: { raw: 2, total: 3, band: 7.5 },
      reading: { raw: 1, total: 3, band: 6.0 },
      writing: { task1Band: 6.0, task2Band: 6.0, overallBand: 6.0 }
    },
    overallBand: 6.5,
    teacherFeedback: 'Cần chú ý không rời tab trong quá trình làm bài thi. Cần củng cố từ vựng đọc hiểu học thuật.'
  }
];

// Helper: Calculate Band Score
function calculateAutoBand(raw, total) {
  if (total === 0) return 0;
  const percentage = raw / total;
  if (percentage >= 0.9) return 9.0;
  if (percentage >= 0.8) return 8.0;
  if (percentage >= 0.7) return 7.0;
  if (percentage >= 0.6) return 6.5;
  if (percentage >= 0.5) return 6.0;
  if (percentage >= 0.4) return 5.5;
  if (percentage >= 0.3) return 5.0;
  return 4.0;
}

function getRiskAssessment(tabSwitchCount) {
  if (tabSwitchCount === 0) return { label: 'An toàn', color: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/30', icon: CheckCircle };
  if (tabSwitchCount <= 2) return { label: 'Nghi vấn nhẹ', color: 'bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/30', icon: AlertTriangle };
  return { label: 'Gian lận cao', color: 'bg-rose-500/10 text-rose-700 dark:text-rose-400 border-rose-500/30', icon: ShieldAlert };
}

function getWordCount(text) {
  if (!text) return 0;
  return text.trim().split(/\s+/).filter(Boolean).length;
}

function roundIeltsBand(score) {
  return Math.round(score * 2) / 2;
}

// Parse Raw Vocab text for Chicken Invaders
function parseRawVocabText(rawText) {
  const lines = rawText.split(/\r?\n/).map(l => l.trim()).filter(l => l.length > 0 && !l.startsWith('#'));
  const parsedItems = [];
  const seenWords = new Set();

  lines.forEach(line => {
    let parts;
    if (line.includes('|')) parts = line.split('|');
    else if (line.includes('\t')) parts = line.split('\t');
    else if (line.includes(';')) parts = line.split(';');
    else if (line.includes(':')) parts = line.split(':');
    else return;

    const cleanWord = (parts[0] || '').trim().toUpperCase();
    const cleanPrompt = (parts[1] || '').trim();
    const cleanIpa = (parts[2] || '').trim();
    const cleanExample = (parts[3] || '').trim();

    if (cleanWord && cleanPrompt && !seenWords.has(cleanWord)) {
      seenWords.add(cleanWord);
      parsedItems.push({
        word: cleanWord,
        prompt: cleanPrompt,
        ipa: cleanIpa || '',
        example: cleanExample || `Ghi nhớ cách dùng từ "${cleanWord}" trong bài thi IELTS.`,
        distractors: []
      });
    }
  });

  const allWords = parsedItems.map(item => item.word);
  parsedItems.forEach(item => {
    let pool = allWords.filter(w => w !== item.word);
    for (let fb of FALLBACK_DISTRACTORS) {
      if (pool.length >= 8) break;
      if (fb !== item.word && !pool.includes(fb)) pool.push(fb);
    }
    item.distractors = pool.sort(() => Math.random() - 0.5).slice(0, 4);
  });

  return parsedItems;
}

// Call Google Gemini API for IELTS Writing grading
async function callGeminiWritingGrader({ apiKey, task1Prompt, task1Text, task2Prompt, task2Text }) {
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

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: systemPrompt }] }],
        generationConfig: {
          temperature: 0.2,
          responseMimeType: 'application/json'
        }
      })
    }
  );

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`Gemini API lỗi (${response.status}): ${errText}`);
  }

  const data = await response.json();
  const textContent = data?.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!textContent) {
    throw new Error('AI không trả về nội dung.');
  }

  const jsonMatch = textContent.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    throw new Error('AI không trả về đúng định dạng JSON.');
  }
  return JSON.parse(jsonMatch[0]);
}

// Built-in intelligent heuristic engine (offline fallback & instant simulation)
function simulateAIWritingGrading({ _task1Prompt, task1Text, _task2Prompt, task2Text }) {
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

// Speech synthesis helper
function speakWord(word) {
  if ('speechSynthesis' in window && word) {
    window.speechSynthesis.cancel();
    const utter = new SpeechSynthesisUtterance(word.toLowerCase());
    utter.lang = 'en-US';
    utter.rate = 0.9;
    window.speechSynthesis.speak(utter);
  }
}

// Sound effects synth
let audioCtx = null;
function playSound(type) {
  try {
    if (!audioCtx) {
      const AudioContextClass = window.AudioContext || window.webkitAudioContext;
      if (AudioContextClass) audioCtx = new AudioContextClass();
    }
    if (!audioCtx) return;
    if (audioCtx.state === 'suspended') audioCtx.resume();

    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    const now = audioCtx.currentTime;

    if (type === 'shoot') {
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(650, now);
      osc.frequency.exponentialRampToValueAtTime(180, now + 0.08);
      gain.gain.setValueAtTime(0.08, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.08);
      osc.start(now);
      osc.stop(now + 0.08);
    } else if (type === 'type_hit') {
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(580, now);
      osc.frequency.exponentialRampToValueAtTime(850, now + 0.06);
      gain.gain.setValueAtTime(0.12, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.06);
      osc.start(now);
      osc.stop(now + 0.06);
    } else if (type === 'word_clear') {
      osc.type = 'sine';
      osc.frequency.setValueAtTime(523.25, now);
      osc.frequency.setValueAtTime(659.25, now + 0.07);
      osc.frequency.setValueAtTime(783.99, now + 0.14);
      osc.frequency.setValueAtTime(1046.5, now + 0.22);
      gain.gain.setValueAtTime(0.2, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.38);
      osc.start(now);
      osc.stop(now + 0.38);
    } else if (type === 'wrong') {
      osc.type = 'square';
      osc.frequency.setValueAtTime(160, now);
      osc.frequency.linearRampToValueAtTime(80, now + 0.2);
      gain.gain.setValueAtTime(0.15, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.2);
      osc.start(now);
      osc.stop(now + 0.2);
    }
  } catch (_e) {
    // Ignore audio autoplay restrictions
  }
}

// ==========================================
// 2. MAIN APPLICATION COMPONENT
// ==========================================
export default function App() {
  // Accounts Database (LocalStorage initialized)
  const [usersDb, setUsersDb] = useState(() => {
    const saved = localStorage.getItem('ielts_users_db_v2');
    const defaults = {
      'teacher_ielts': { username: 'teacher_ielts', pass: '123456', name: 'Thầy Minh IELTS Master', role: 'teacher', targetBand: 9.0, joinedDate: '2026-01-01' },
      'hocsinh_01': { username: 'hocsinh_01', pass: '123456', name: 'Nguyễn Văn A', role: 'student', targetBand: 8.0, joinedDate: '2026-02-01' },
      'hocsinh_02': { username: 'hocsinh_02', pass: '123456', name: 'Trần Thị Mai', role: 'student', targetBand: 7.5, joinedDate: '2026-02-15' },
      'hocsinh_03': { username: 'hocsinh_03', pass: '123456', name: 'Lê Hoàng Long', role: 'student', targetBand: 7.0, joinedDate: '2026-02-20' }
    };
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        return { ...defaults, ...parsed };
      } catch (_e) {}
    }
    localStorage.setItem('ielts_users_db_v2', JSON.stringify(defaults));
    return defaults;
  });

  // Current Logged-in User (NULL = Must Login First)
  const [currentUser, setCurrentUser] = useState(() => {
    const saved = localStorage.getItem('ielts_current_user');
    if (saved) {
      try { return JSON.parse(saved); } catch (_e) {}
    }
    return null; // Forces login screen
  });

  // Room PIN Database for Game Arena
  const [roomsDb, setRoomsDb] = useState(() => {
    const saved = localStorage.getItem('ielts_rooms_db_v2');
    if (saved) {
      try { return JSON.parse(saved); } catch (_e) {}
    }
    const defaults = {
      '686868': {
        pin: '686868',
        pass: 'ielts',
        teacher: 'teacher_ielts',
        rawVocab: DEFAULT_VOCAB_TEXT,
        players: {
          'Nguyễn Văn A': { name: 'Nguyễn Văn A', score: 1850, streak: 8, status: 'Vòng 3: Boss Speller', time: '14:32' },
          'Trần Thị Mai': { name: 'Trần Thị Mai', score: 1420, streak: 5, status: 'Vòng 2: Gõ từ khuyết', time: '15:10' }
        }
      }
    };
    localStorage.setItem('ielts_rooms_db_v2', JSON.stringify(defaults));
    return defaults;
  });

  const [currentRoomPin] = useState('686868');

  // App Navigation: 'AUTH', 'HOME', 'EXAM_MODE', 'RESULT_VIEW', 'TEACHER_DASHBOARD', 'EXAM_BUILDER', 'GAME_ARENA', 'STUDENT_PROFILE'
  const [view, setView] = useState(() => {
    const saved = localStorage.getItem('ielts_current_user');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        return parsed.role === 'teacher' ? 'TEACHER_DASHBOARD' : 'HOME';
      } catch (_e) {}
    }
    return 'AUTH';
  });

  // Tests & Attempts states
  const [tests, setTests] = useState(() => {
    const saved = localStorage.getItem('ielts_tests');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed.map(t => {
            const def = DEFAULT_TESTS.find(d => d.id === t.id);
            return {
              ...t,
              allowViewAnswers: t.allowViewAnswers ?? false,
              writing: {
                task1: { ...t.writing?.task1, modelAnswer: t.writing?.task1?.modelAnswer || def?.writing?.task1?.modelAnswer || '' },
                task2: { ...t.writing?.task2, modelAnswer: t.writing?.task2?.modelAnswer || def?.writing?.task2?.modelAnswer || '' }
              }
            };
          });
        }
      } catch (_e) {}
    }
    return DEFAULT_TESTS;
  });

  const [attempts, setAttempts] = useState(() => {
    const saved = localStorage.getItem('ielts_attempts');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          const existingIds = new Set(parsed.map(a => a.id));
          const missingDefaults = DEFAULT_ATTEMPTS.filter(a => !existingIds.has(a.id));
          return [...parsed, ...missingDefaults];
        }
      } catch (_e) {}
    }
    return DEFAULT_ATTEMPTS;
  });

  const [selectedTestId, setSelectedTestId] = useState(null);
  const [selectedAttemptId, setSelectedAttemptId] = useState(null);

  // Student Profile States
  const [selectedProfileStudent, setSelectedProfileStudent] = useState(null);
  const [studentSearchQuery, setStudentSearchQuery] = useState('');
  const [previousView, setPreviousView] = useState('HOME');
  const [resultReviewTab, setResultReviewTab] = useState('listening'); // 'listening', 'reading', 'writing'
  const [teacherNotes, setTeacherNotes] = useState(() => {
    const saved = localStorage.getItem('ielts_teacher_notes');
    if (saved) {
      try { return JSON.parse(saved); } catch (_e) {}
    }
    return {
      'hocsinh_01': 'Học sinh có tiến độ học tập rất xuất sắc, Band Overall đã tăng từ 6.5 lên 8.5 sau 3 lần thi. Kỹ năng Listening và Reading đã đạt mức 9.0 tuyệt đối. Cần tập trung thêm vào tính liên kết câu (Cohesion) trong Writing Task 2.',
      'hocsinh_02': 'Thái độ làm bài nghiêm túc, không vi phạm chuyển tab. Kỹ năng Listening nghe bắt keyword rất nhạy (Band 9.0). Cần luyện thêm tốc độ đọc Scanning cho Passage 3 để nâng Band Reading lên 8.5+.',
      'hocsinh_03': 'Cần lưu ý giữ tập trung trong phòng thi, hạn chế chuyển tab hoặc tra cứu từ điển bên ngoài. Cần rèn luyện thêm ngữ pháp câu phức và từ vựng học thuật cho Writing.'
    };
  });
  const [tempNoteText, setTempNoteText] = useState('');
  const [globalToast, setGlobalToast] = useState({ text: '', visible: false, type: 'success' });

  const showToast = (text, type = 'success') => {
    setGlobalToast({ text, visible: true, type });
    setTimeout(() => setGlobalToast(prev => ({ ...prev, visible: false })), 3000);
  };

  // Toggle permission for students to view correct answers (Teacher-controlled)
  const toggleTestAllowViewAnswers = (testId) => {
    if (!testId) return;
    setTests(prev => {
      const updated = prev.map(t => {
        if (t.id === testId) {
          const nextState = !t.allowViewAnswers;
          showToast(
            nextState
              ? `Đã MỞ KHÓA cho học sinh xem đáp án đúng đề "${t.title}"!`
              : `Đã KHÓA đáp án đúng đề "${t.title}" đối với học sinh!`,
            nextState ? 'success' : 'info'
          );
          return { ...t, allowViewAnswers: nextState };
        }
        return t;
      });
      return updated;
    });
  };

  // Exam Mode State
  const [examState, setExamState] = useState({
    skill: 'listening',
    timeRemaining: 1800,
    answers: {},
    audioPlays: {},
    highlights: [],
    notes: [],
    antiCheatLogs: [],
    tabSwitchCount: 0
  });

  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [selectedPassageText, setSelectedPassageText] = useState('');
  const examAudioRef = useRef(null);

  // Dark Mode State
  const [darkMode, setDarkMode] = useState(() => localStorage.getItem('ielts_theme') === 'dark');

  useEffect(() => {
    document.documentElement.classList.toggle('dark', darkMode);
    localStorage.setItem('ielts_theme', darkMode ? 'dark' : 'light');
  }, [darkMode]);

  // Exam Builder State
  const [editingTest, setEditingTest] = useState(null);
  const [builderTab, setBuilderTab] = useState('general'); // 'general', 'listening', 'reading', 'writing'
  const [testForm, setTestForm] = useState({
    title: '',
    description: '',
    maxAudioPlays: 1,
    shuffleOptions: true,
    allowViewAnswers: false,
    listening: { audioUrl: '', audioFileName: '', transcript: '', questions: [] },
    reading: { passageTitle: '', passageText: '', imageUrl: '', imageFileName: '', questions: [] },
    writing: {
      task1: { prompt: '', minWords: 150, imageUrl: '', modelAnswer: '' },
      task2: { prompt: '', minWords: 250, modelAnswer: '' }
    }
  });

  // Teacher Grading Modal
  const [gradingAttempt, setGradingAttempt] = useState(null);
  const [gradingScores, setGradingScores] = useState({ task1Band: 6.0, task2Band: 6.5, feedback: '' });

  // AI Grading states
  const [isGradingAI, setIsGradingAI] = useState(false);
  const [aiGradingStep, setAiGradingStep] = useState('');
  const [aiApiKey, setAiApiKey] = useState(() => {
    return localStorage.getItem('ielts_ai_key') || (import.meta.env?.VITE_GEMINI_API_KEY || '');
  });
  const [showApiKeyModal, setShowApiKeyModal] = useState(false);

  // Auth Form State (Student-only UI, auto-routes teacher on login)
  const [authMode, setAuthMode] = useState('login'); // 'login' or 'register'
  const [authForm, setAuthForm] = useState({ username: '', password: '', fullName: '' });
  const [authError, setAuthError] = useState('');

  // Teacher Hub Sub-Tab ('tests', 'grading', 'game_room', 'students')
  const [teacherHubTab, setTeacherHubTab] = useState('tests');

  // Vocab Modal in Teacher View
  const [showVocabModal, setShowVocabModal] = useState(false);
  const [customVocabInput, setCustomVocabInput] = useState(DEFAULT_VOCAB_TEXT);

  // ==========================================
  // GAME ARENA STATE & REFS
  // ==========================================
  const canvasRef = useRef(null);
  const animFrameRef = useRef(null);
  const autoNextTimerRef = useRef(null);
  const wordTimerRef = useRef(null);
  const gameToastTimerRef = useRef(null);
  const homingLasersRef = useRef([]);
  const wordStartedAtRef = useRef(0);
  const timeRemainingFloatRef = useRef(GAME_ROUND_TIME_LIMITS[1]);

  const [gameRound, setGameRound] = useState(1);
  const [gameScore, setGameScore] = useState(0);
  const [gameLives, setGameLives] = useState(3);
  const [gameCombo, setGameCombo] = useState(0);
  const [gameWordIdx, setGameWordIdx] = useState(0);
  const [gameTypedProgress, setGameTypedProgress] = useState(0);
  const [gameSubState, setGameSubState] = useState('PLAYING'); // 'PLAYING', 'TRANSITION', 'GAMEOVER'
  const [gameOutcome, setGameOutcome] = useState(null); // 'VICTORY' | 'LOST' | null
  const [gameTimeLeft, setGameTimeLeft] = useState(GAME_ROUND_TIME_LIMITS[1]);
  const [gameTimeLimit, setGameTimeLimit] = useState(GAME_ROUND_TIME_LIMITS[1]);
  const [transitionCountdown, setTransitionCountdown] = useState(3);
  const [isSandboxRound, setIsSandboxRound] = useState(false);
  const [showMobileKeyboard, setShowMobileKeyboard] = useState(false);
  const [gameToast, setGameToast] = useState({ text: '', isSuccess: true, visible: false });
  const [gameReviewLog, setGameReviewLog] = useState([]);
  const [activeQuestion, setActiveQuestion] = useState(null);
  const [gameQueues, setGameQueues] = useState({ 1: [], 2: [], 3: [] });

  const gameRuntimeRef = useRef({
    round: 1,
    score: 0,
    lives: 3,
    combo: 0,
    wordIdx: 0,
    typedProgress: 0,
    subState: 'PLAYING',
    activeQuestion: null,
    queues: { 1: [], 2: [], 3: [] },
    isSandbox: false,
    timeLimit: GAME_ROUND_TIME_LIMITS[1],
    questionResolved: false
  });

  // Sync state to local storage
  useEffect(() => {
    localStorage.setItem('ielts_tests', JSON.stringify(tests));
  }, [tests]);

  useEffect(() => {
    localStorage.setItem('ielts_attempts', JSON.stringify(attempts));
  }, [attempts]);

  useEffect(() => {
    localStorage.setItem('ielts_users_db_v2', JSON.stringify(usersDb));
  }, [usersDb]);

  useEffect(() => {
    localStorage.setItem('ielts_rooms_db_v2', JSON.stringify(roomsDb));
  }, [roomsDb]);

  useEffect(() => {
    localStorage.setItem('ielts_teacher_notes', JSON.stringify(teacherNotes));
  }, [teacherNotes]);

  useEffect(() => {
    if (currentUser) {
      localStorage.setItem('ielts_current_user', JSON.stringify(currentUser));
    } else {
      localStorage.removeItem('ielts_current_user');
    }
  }, [currentUser]);

  // Handle Toast in Game
  const triggerGameToast = (text, isSuccess) => {
    clearTimeout(gameToastTimerRef.current);
    setGameToast({ text, isSuccess, visible: true });
    gameToastTimerRef.current = setTimeout(() => {
      setGameToast(prev => ({ ...prev, visible: false }));
    }, 3000);
  };

  // Sync Student Game Score to Room Leaderboard
  const syncScoreToLeaderboard = (scoreVal, statusStr, streakVal, missedWords) => {
    if (!currentUser) return;
    setRoomsDb(prev => {
      const room = prev[currentRoomPin] || { pin: currentRoomPin, pass: 'ielts', teacher: 'teacher_ielts', rawVocab: DEFAULT_VOCAB_TEXT, players: {} };
      const currentPlayers = { ...(room.players || {}) };
      const prevRecord = currentPlayers[currentUser.username];
      const bestScore = prevRecord ? Math.max(prevRecord.score || 0, scoreVal) : scoreVal;

      currentPlayers[currentUser.username] = {
        name: currentUser.name || currentUser.username,
        score: bestScore,
        status: statusStr,
        streak: streakVal,
        missed: missedWords,
        updatedAt: new Date().toLocaleTimeString('vi-VN')
      };

      const updated = { ...prev, [currentRoomPin]: { ...room, players: currentPlayers } };
      return updated;
    });
  };

  // ==========================================
  // STEALTH ANTI-CHEAT EVENT LISTENERS
  // ==========================================
  useEffect(() => {
    if (view !== 'EXAM_MODE') return;

    const handleVisibilityOrBlur = () => {
      const now = new Date();
      const timeStr = now.toTimeString().split(' ')[0];
      
      setExamState(prev => {
        const newCount = prev.tabSwitchCount + 1;
        const newLog = {
          timestamp: timeStr,
          skill: prev.skill,
          event: `Rời khỏi màn hình làm bài (${document.visibilityState === 'hidden' ? 'Ẩn tab' : 'Mất focus'})`
        };
        return {
          ...prev,
          tabSwitchCount: newCount,
          antiCheatLogs: [...prev.antiCheatLogs, newLog]
        };
      });
    };

    const handleBlur = () => handleVisibilityOrBlur();
    const handleVisibility = () => {
      if (document.visibilityState === 'hidden') handleVisibilityOrBlur();
    };

    window.addEventListener('blur', handleBlur);
    document.addEventListener('visibilitychange', handleVisibility);

    return () => {
      window.removeEventListener('blur', handleBlur);
      document.removeEventListener('visibilitychange', handleVisibility);
    };
  }, [view]);

  // Exam Countdown Timer
  useEffect(() => {
    if (view !== 'EXAM_MODE') return;

    const timer = setInterval(() => {
      setExamState(prev => {
        if (prev.timeRemaining <= 1) {
          clearInterval(timer);
          return { ...prev, timeRemaining: 0 };
        }
        return { ...prev, timeRemaining: prev.timeRemaining - 1 };
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [view]);

  // ==========================================
  // AUTHENTICATION HANDLERS
  // ==========================================
  const handleAuthSubmit = (e) => {
    e.preventDefault();
    setAuthError('');

    const uname = authForm.username.trim();
    const pass = authForm.password.trim();
    const fname = authForm.fullName.trim() || uname;

    if (!uname || !pass) {
      setAuthError('Vui lòng nhập đầy đủ tên tài khoản và mật khẩu!');
      return;
    }

    if (authMode === 'register') {
      if (usersDb[uname]) {
        setAuthError(`Tài khoản "${uname}" đã tồn tại! Vui lòng chọn tên khác hoặc chuyển sang Đăng nhập.`);
        return;
      }
      const newUser = {
        username: uname,
        pass: pass,
        name: fname,
        role: 'student',
        targetBand: 7.5,
        joinedDate: new Date().toISOString().split('T')[0]
      };
      setUsersDb(prev => ({ ...prev, [uname]: newUser }));
      setCurrentUser(newUser);
      setView('HOME');
      showToast(`Chào mừng học viên ${fname} đến với LexiPrep Academy!`);
    } else {
      // Login: tự động nhận diện tài khoản Giáo viên hay Học sinh
      const user = usersDb[uname];
      if (!user || user.pass !== pass) {
        setAuthError('Sai tên đăng nhập hoặc mật khẩu! Vui lòng kiểm tra lại.');
        return;
      }
      setCurrentUser(user);
      if (user.role === 'teacher') {
        setView('TEACHER_DASHBOARD');
        showToast(`Xin chào Giáo viên ${user.name}! Đã chuyển sang Trung tâm Quản trị.`);
      } else {
        setView('HOME');
        showToast(`Chào mừng trở lại, ${user.name}!`);
      }
    }
  };

  const handleLogout = () => {
    if (examAudioRef.current) {
      examAudioRef.current.pause();
      examAudioRef.current = null;
    }
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    setCurrentUser(null);
    setView('AUTH');
    setAuthForm({ username: '', password: '', fullName: '' });
    setAuthError('');
  };

  // ==========================================
  // EXAM HANDLERS
  // ==========================================
  const startExam = (testId) => {
    const test = tests.find(t => t.id === testId);
    if (!test) return;
    
    setSelectedTestId(testId);
    setExamState({
      skill: 'listening',
      timeRemaining: 1800,
      answers: {},
      audioPlays: { mainAudio: 0 },
      highlights: [],
      notes: [],
      antiCheatLogs: [],
      tabSwitchCount: 0
    });
    setView('EXAM_MODE');
  };

  const handlePlayListeningAudio = (audioKey = 'mainAudio', transcript = '') => {
    const activeTest = tests.find(t => t.id === selectedTestId);
    const maxPlays = activeTest?.maxAudioPlays || 1;
    const currentPlays = examState.audioPlays[audioKey] || 0;

    if (currentPlays >= maxPlays) {
      alert(`Bạn đã dùng hết số lần nghe cho phép (${maxPlays} lần).`);
      return;
    }

    setExamState(prev => ({
      ...prev,
      audioPlays: { ...prev.audioPlays, [audioKey]: currentPlays + 1 }
    }));

    const customAudioUrl = activeTest?.listening?.audioUrl;
    if (customAudioUrl) {
      try {
        if (examAudioRef.current) {
          examAudioRef.current.pause();
        }
        const audio = new Audio(customAudioUrl);
        examAudioRef.current = audio;
        setIsPlayingAudio(true);
        audio.onended = () => setIsPlayingAudio(false);
        audio.onerror = () => {
          setIsPlayingAudio(false);
          alert('Không thể phát file âm thanh này. Vui lòng kiểm tra lại định dạng file.');
        };
        audio.play();
        return;
      } catch (_err) {
        setIsPlayingAudio(false);
      }
    }

    if ('speechSynthesis' in window && transcript) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(transcript);
      utterance.rate = 0.9;
      utterance.lang = 'en-US';
      utterance.onstart = () => setIsPlayingAudio(true);
      utterance.onend = () => setIsPlayingAudio(false);
      utterance.onerror = () => setIsPlayingAudio(false);
      window.speechSynthesis.speak(utterance);
    } else {
      alert('Đang phát âm thanh bài thi nghe...');
    }
  };

  const handleFinalExamSubmit = () => {
    if (examAudioRef.current) {
      examAudioRef.current.pause();
      examAudioRef.current = null;
    }
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    setIsPlayingAudio(false);
    const activeTest = tests.find(t => t.id === selectedTestId);
    if (!activeTest) return;

    let listeningRaw = 0;
    const lQuestions = activeTest.listening?.questions || [];
    lQuestions.forEach(q => {
      const studentAns = (examState.answers[q.id] || '').trim().toLowerCase();
      const correctAns = (q.correctAnswer || '').trim().toLowerCase();
      if (studentAns && studentAns === correctAns) listeningRaw++;
    });

    let readingRaw = 0;
    const rQuestions = activeTest.reading?.questions || [];
    rQuestions.forEach(q => {
      const studentAns = (examState.answers[q.id] || '').trim().toLowerCase();
      const correctAns = (q.correctAnswer || '').trim().toLowerCase();
      if (studentAns && studentAns === correctAns) readingRaw++;
    });

    const lBand = calculateAutoBand(listeningRaw, lQuestions.length);
    const rBand = calculateAutoBand(readingRaw, rQuestions.length);

    const newAttempt = {
      id: 'att-' + Date.now(),
      testId: activeTest.id,
      testTitle: activeTest.title,
      studentId: currentUser?.username || 'std_guest',
      studentName: currentUser?.name || 'Học sinh',
      submittedAt: new Date().toLocaleString('vi-VN'),
      answers: examState.answers,
      antiCheatLogs: examState.antiCheatLogs,
      tabSwitchCount: examState.tabSwitchCount,
      teacherGraded: false,
      aiGraded: false,
      scores: {
        listening: { raw: listeningRaw, total: lQuestions.length, band: lBand },
        reading: { raw: readingRaw, total: rQuestions.length, band: rBand },
        writing: { task1Band: null, task2Band: null, overallBand: null }
      },
      overallBand: null,
      teacherFeedback: ''
    };

    setAttempts([newAttempt, ...attempts]);
    setSelectedAttemptId(newAttempt.id);
    setView('RESULT_VIEW');
  };

  // AI Writing Grading Trigger
  const handleGradeWritingWithAI = async (targetAttempt) => {
    if (!targetAttempt) return;
    const test = tests.find(t => t.id === targetAttempt.testId);

    setIsGradingAI(true);
    setAiGradingStep('Khởi tạo AI IELTS Senior Examiner...');

    try {
      let aiResult;
      if (aiApiKey && aiApiKey.trim()) {
        setAiGradingStep('Đang kết nối Google Gemini API...');
        try {
          aiResult = await callGeminiWritingGrader({
            apiKey: aiApiKey.trim(),
            task1Prompt: test?.writing?.task1?.prompt,
            task1Text: targetAttempt.answers?.w1,
            task2Prompt: test?.writing?.task2?.prompt,
            task2Text: targetAttempt.answers?.w2
          });
        } catch (apiErr) {
          console.warn('Gemini API call failed, falling back to simulated grader:', apiErr);
          setAiGradingStep(`API bận (${apiErr.message}), chuyển sang bộ chấm IELTS thông minh tích hợp...`);
          await new Promise(r => setTimeout(r, 1000));
          aiResult = simulateAIWritingGrading({
            _task1Prompt: test?.writing?.task1?.prompt,
            task1Text: targetAttempt.answers?.w1,
            _task2Prompt: test?.writing?.task2?.prompt,
            task2Text: targetAttempt.answers?.w2
          });
        }
      } else {
        await new Promise(r => setTimeout(r, 700));
        setAiGradingStep('Đang phân tích độ dài & cấu trúc đoạn văn Task 1 & Task 2...');
        await new Promise(r => setTimeout(r, 800));
        setAiGradingStep('Đang đối chiếu 4 tiêu chí IELTS (TA/TR, CC, LR, GRA)...');
        await new Promise(r => setTimeout(r, 700));
        setAiGradingStep('Đang tổng hợp band điểm và xuất nhận xét chi tiết...');
        await new Promise(r => setTimeout(r, 600));

        aiResult = simulateAIWritingGrading({
          _task1Prompt: test?.writing?.task1?.prompt,
          task1Text: targetAttempt.answers?.w1,
          _task2Prompt: test?.writing?.task2?.prompt,
          task2Text: targetAttempt.answers?.w2
        });
      }

      const t1 = parseFloat(aiResult.task1Band) || 0;
      const t2 = parseFloat(aiResult.task2Band) || 0;
      const writingOverall = parseFloat(aiResult.overallBand) || roundIeltsBand((t1 + t2 * 2) / 3);

      const lBand = targetAttempt.scores?.listening?.band || 0;
      const rBand = targetAttempt.scores?.reading?.band || 0;
      const finalOverall = parseFloat(((lBand + rBand + writingOverall * 2) / 4).toFixed(1));

      const updatedAttempts = attempts.map(att => {
        if (att.id === targetAttempt.id) {
          return {
            ...att,
            teacherGraded: true,
            aiGraded: true,
            aiDetails: aiResult,
            scores: {
              ...att.scores,
              writing: {
                task1Band: t1,
                task2Band: t2,
                overallBand: writingOverall
              }
            },
            overallBand: finalOverall,
            teacherFeedback: aiResult.feedback
          };
        }
        return att;
      });

      setAttempts(updatedAttempts);
    } catch (err) {
      alert('Có lỗi xảy ra trong quá trình chấm điểm: ' + err.message);
    } finally {
      setIsGradingAI(false);
      setAiGradingStep('');
    }
  };

  // Teacher AI grading assist in grading modal
  const handleTeacherAIGrade = async (targetAttempt) => {
    if (!targetAttempt) return;
    const test = tests.find(t => t.id === targetAttempt.testId);

    setIsGradingAI(true);
    setAiGradingStep('AI đang phân tích bài thi và gợi ý band điểm...');

    try {
      let aiResult;
      if (aiApiKey && aiApiKey.trim()) {
        try {
          aiResult = await callGeminiWritingGrader({
            apiKey: aiApiKey.trim(),
            task1Prompt: test?.writing?.task1?.prompt,
            task1Text: targetAttempt.answers?.w1,
            task2Prompt: test?.writing?.task2?.prompt,
            task2Text: targetAttempt.answers?.w2
          });
        } catch (_apiErr) {
          aiResult = simulateAIWritingGrading({
            _task1Prompt: test?.writing?.task1?.prompt,
            task1Text: targetAttempt.answers?.w1,
            _task2Prompt: test?.writing?.task2?.prompt,
            task2Text: targetAttempt.answers?.w2
          });
        }
      } else {
        await new Promise(r => setTimeout(r, 1200));
        aiResult = simulateAIWritingGrading({
          _task1Prompt: test?.writing?.task1?.prompt,
          task1Text: targetAttempt.answers?.w1,
          _task2Prompt: test?.writing?.task2?.prompt,
          task2Text: targetAttempt.answers?.w2
        });
      }

      setGradingScores({
        task1Band: aiResult.task1Band,
        task2Band: aiResult.task2Band,
        feedback: aiResult.feedback
      });
    } catch (err) {
      alert('Lỗi chấm AI: ' + err.message);
    } finally {
      setIsGradingAI(false);
      setAiGradingStep('');
    }
  };

  const saveTeacherGrading = () => {
    if (!gradingAttempt) return;

    const t1 = parseFloat(gradingScores.task1Band) || 0;
    const t2 = parseFloat(gradingScores.task2Band) || 0;
    const writingOverall = parseFloat(((t1 + t2 * 2) / 3).toFixed(1));

    const lBand = gradingAttempt.scores.listening.band || 0;
    const rBand = gradingAttempt.scores.reading.band || 0;
    const finalOverall = parseFloat(((lBand + rBand + writingOverall * 2) / 4).toFixed(1));

    const updatedAttempts = attempts.map(att => {
      if (att.id === gradingAttempt.id) {
        return {
          ...att,
          teacherGraded: true,
          scores: {
            ...att.scores,
            writing: {
              task1Band: t1,
              task2Band: t2,
              overallBand: writingOverall
            }
          },
          overallBand: finalOverall,
          teacherFeedback: gradingScores.feedback
        };
      }
      return att;
    });

    setAttempts(updatedAttempts);
    setGradingAttempt(null);
  };

  // Highlighter and Notes
  const handlePassageTextSelect = () => {
    const selection = window.getSelection();
    if (selection && selection.toString().trim()) {
      setSelectedPassageText(selection.toString().trim());
    }
  };

  const addHighlight = (color) => {
    if (!selectedPassageText) return;
    setExamState(prev => ({
      ...prev,
      highlights: [...prev.highlights, { id: Date.now(), text: selectedPassageText, color }]
    }));
    setSelectedPassageText('');
  };

  const addNote = () => {
    if (!selectedPassageText) return;
    const noteContent = prompt('Nhập ghi chú cho đoạn văn bản đã chọn:', '');
    if (noteContent) {
      setExamState(prev => ({
        ...prev,
        notes: [...prev.notes, { id: Date.now(), text: selectedPassageText, note: noteContent }]
      }));
    }
    setSelectedPassageText('');
  };

  // Exam Builder
  const openExamBuilder = (testToEdit = null) => {
    setEditingTest(testToEdit || null);
    if (testToEdit) {
      const cloned = JSON.parse(JSON.stringify(testToEdit));
      setTestForm({
        ...cloned,
        allowViewAnswers: cloned.allowViewAnswers ?? false,
        listening: {
          audioUrl: '',
          audioFileName: '',
          transcript: '',
          questions: [],
          ...(cloned.listening || {})
        },
        reading: {
          passageTitle: '',
          passageText: '',
          imageUrl: '',
          imageFileName: '',
          questions: [],
          ...(cloned.reading || {})
        },
        writing: {
          task1: { prompt: '', minWords: 150, imageUrl: '', modelAnswer: '', ...(cloned.writing?.task1 || {}) },
          task2: { prompt: '', minWords: 250, modelAnswer: '', ...(cloned.writing?.task2 || {}) }
        }
      });
    } else {
      setTestForm({
        id: 'test-' + Date.now(),
        title: 'Đề Thi Thử IELTS Academic Mới',
        description: 'Đề thi chuẩn cấu trúc 3 kỹ năng Listening, Reading, Writing.',
        createdAt: new Date().toISOString().split('T')[0],
        maxAudioPlays: 1,
        shuffleOptions: true,
        allowViewAnswers: false,
        listening: {
          audioUrl: '',
          audioFileName: '',
          transcript: 'Welcome to the lecture. Today we will discuss key developments in modern education...',
          questions: [
            {
              id: 'lq-' + Date.now(),
              type: 'mcq',
              question: '1. What is the main topic of the speaker\'s presentation?',
              options: [
                'A. Modern educational technology',
                'B. University admission requirements',
                'C. Library renovation schedules',
                'D. International student housing'
              ],
              correctAnswer: 'A. Modern educational technology'
            }
          ]
        },
        reading: {
          passageTitle: 'Reading Passage 1: Urban Architecture & Sustainability',
          passageText: 'Modern cities are increasingly adopting sustainable architectural practices to reduce carbon footprints and improve residents\' quality of life...',
          imageUrl: '',
          imageFileName: '',
          questions: [
            {
              id: 'rq-' + (Date.now() + 1),
              type: 'tfng',
              question: '1. Sustainable architecture helps lower carbon emissions in urban areas.',
              options: ['TRUE', 'FALSE', 'NOT GIVEN'],
              correctAnswer: 'TRUE'
            }
          ]
        },
        writing: {
          task1: {
            prompt: 'Task 1: The chart below shows changes in energy consumption between 2010 and 2025. Summarise the information by selecting and reporting the main features.',
            minWords: 150,
            imageUrl: '',
            modelAnswer: ''
          },
          task2: {
            prompt: 'Task 2: Some people think that universities should provide graduates with the knowledge and skills needed in the workplace. Others think that the true function of a university is to give access to knowledge for its own sake. Discuss both views and give your opinion.',
            minWords: 250,
            modelAnswer: ''
          }
        }
      });
    }
    setBuilderTab('general');
    setView('EXAM_BUILDER');
  };

  // Upload Audio File for Listening (Teacher Builder)
  const handleAudioFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 15 * 1024 * 1024) {
      alert('File âm thanh quá lớn (vui lòng chọn file dưới 15MB để lưu trữ mượt mà trên trình duyệt)!');
      return;
    }
    const reader = new FileReader();
    reader.onload = (ev) => {
      setTestForm(prev => ({
        ...prev,
        listening: {
          ...prev.listening,
          audioUrl: ev.target.result,
          audioFileName: file.name
        }
      }));
      showToast(`Đã tải lên file ghi âm: ${file.name}`);
    };
    reader.readAsDataURL(file);
  };

  // Upload Image for Reading Passage (Teacher Builder)
  const handleReadingImageUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      setTestForm(prev => ({
        ...prev,
        reading: {
          ...prev.reading,
          imageUrl: ev.target.result,
          imageFileName: file.name
        }
      }));
      showToast(`Đã thêm ảnh minh họa bài đọc: ${file.name}`);
    };
    reader.readAsDataURL(file);
  };

  // Upload Chart Image for Writing Task 1 (Teacher Builder)
  const handleWritingTask1ImageUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      setTestForm(prev => ({
        ...prev,
        writing: {
          ...prev.writing,
          task1: {
            ...prev.writing.task1,
            imageUrl: ev.target.result
          }
        }
      }));
      showToast(`Đã thêm ảnh biểu đồ Writing Task 1: ${file.name}`);
    };
    reader.readAsDataURL(file);
  };

  // Question CRUD Helpers for Listening & Reading Builder
  const addQuestionToSkill = (skill) => {
    const currentQuestions = testForm[skill]?.questions || [];
    const nextNum = currentQuestions.length + 1;
    const newQ = {
      id: `${skill[0]}q_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      type: 'mcq',
      question: `${nextNum}. Nhập nội dung câu hỏi số ${nextNum}...`,
      options: ['A. Đáp án A', 'B. Đáp án B', 'C. Đáp án C', 'D. Đáp án D'],
      correctAnswer: 'A. Đáp án A'
    };
    setTestForm(prev => ({
      ...prev,
      [skill]: {
        ...prev[skill],
        questions: [...(prev[skill]?.questions || []), newQ]
      }
    }));
  };

  const updateQuestionInSkill = (skill, qId, field, value) => {
    setTestForm(prev => ({
      ...prev,
      [skill]: {
        ...prev[skill],
        questions: (prev[skill]?.questions || []).map(q => {
          if (q.id !== qId) return q;
          if (field === 'type') {
            if (value === 'tfng') {
              return { ...q, type: 'tfng', options: ['TRUE', 'FALSE', 'NOT GIVEN'], correctAnswer: 'TRUE' };
            }
            if (value === 'mcq') {
              const defaultOpts = q.options?.length === 4 ? q.options : ['A. Lựa chọn A', 'B. Lựa chọn B', 'C. Lựa chọn C', 'D. Lựa chọn D'];
              return { ...q, type: 'mcq', options: defaultOpts, correctAnswer: defaultOpts[0] };
            }
            if (value === 'fill') {
              return { ...q, type: 'fill', options: [], correctAnswer: '' };
            }
          }
          return { ...q, [field]: value };
        })
      }
    }));
  };

  const updateOptionInSkill = (skill, qId, optIdx, newValue) => {
    setTestForm(prev => ({
      ...prev,
      [skill]: {
        ...prev[skill],
        questions: (prev[skill]?.questions || []).map(q => {
          if (q.id !== qId) return q;
          const oldOpt = q.options[optIdx];
          const updatedOpts = [...q.options];
          updatedOpts[optIdx] = newValue;
          const updatedCorrect = q.correctAnswer === oldOpt ? newValue : q.correctAnswer;
          return { ...q, options: updatedOpts, correctAnswer: updatedCorrect };
        })
      }
    }));
  };

  const removeQuestionFromSkill = (skill, qId) => {
    setTestForm(prev => ({
      ...prev,
      [skill]: {
        ...prev[skill],
        questions: (prev[skill]?.questions || []).filter(q => q.id !== qId)
      }
    }));
  };

  const handleSaveTestBuilder = () => {
    if (!testForm.title.trim()) {
      alert('Vui lòng nhập tên đề thi!');
      return;
    }
    const existingIndex = tests.findIndex(t => t.id === testForm.id);
    if (existingIndex >= 0) {
      const updated = [...tests];
      updated[existingIndex] = testForm;
      setTests(updated);
      showToast(`Đã cập nhật đề thi "${testForm.title}" thành công!`);
    } else {
      setTests([...tests, testForm]);
      showToast(`Đã tạo mới đề thi "${testForm.title}" thành công!`);
    }
    setEditingTest(null);
    setView('TEACHER_DASHBOARD');
  };

  // ==========================================
  // 3. GAME ARENA ENGINE LOGIC (REACT INTEGRATED)
  // ==========================================
  const skipNonAlphaIndex = (word, startIdx = 0) => {
    const upper = (word || '').toUpperCase();
    let idx = startIdx;
    while (idx < upper.length && !/^[A-Z]$/.test(upper[idx])) {
      idx++;
    }
    return idx;
  };

  const resetWordTimer = (roundNum) => {
    const limit = GAME_ROUND_TIME_LIMITS[roundNum] || 25;
    wordStartedAtRef.current = Date.now();
    timeRemainingFloatRef.current = limit;
    gameRuntimeRef.current.timeLimit = limit;
    gameRuntimeRef.current.questionResolved = false;
    setGameTimeLimit(limit);
    setGameTimeLeft(limit);
  };

  const recordGameWordReview = (questionObj, roundNum, isCorrect) => {
    if (!questionObj) return;
    setGameReviewLog(prev => {
      const idx = prev.findIndex(item => item.word === questionObj.word && item.round === roundNum);
      if (idx === -1) {
        return [...prev, {
          round: roundNum,
          word: questionObj.word,
          ipa: questionObj.ipa,
          prompt: questionObj.prompt,
          example: questionObj.example,
          passed: isCorrect
        }];
      }
      if (!isCorrect && prev[idx].passed) {
        const updated = [...prev];
        updated[idx] = { ...updated[idx], passed: false };
        return updated;
      }
      return prev;
    });
  };

  const initGameCampaign = (pin = currentRoomPin, _userObj = currentUser) => {
    clearTimeout(autoNextTimerRef.current);
    clearInterval(wordTimerRef.current);

    const room = roomsDb[pin] || { rawVocab: DEFAULT_VOCAB_TEXT };
    const vocabList = parseRawVocabText(room.rawVocab || DEFAULT_VOCAB_TEXT);
    const shuffled = [...vocabList].sort(() => Math.random() - 0.5);
    const total = shuffled.length;
    const perRound = Math.max(1, Math.min(4, Math.floor(total / 3)));

    const q1 = shuffled.slice(0, perRound);
    const q2 = shuffled.slice(perRound, perRound * 2);
    const q3 = shuffled.slice(perRound * 2, perRound * 3);
    const queues = { 1: q1, 2: q2, 3: q3 };
    const firstQ = q1[0] || null;
    const initialProgress = firstQ ? skipNonAlphaIndex(firstQ.word, 0) : 0;

    homingLasersRef.current = [];
    gameRuntimeRef.current = {
      round: 1,
      score: 0,
      lives: 3,
      combo: 0,
      wordIdx: 0,
      typedProgress: initialProgress,
      subState: 'PLAYING',
      activeQuestion: firstQ,
      queues,
      isSandbox: false,
      timeLimit: GAME_ROUND_TIME_LIMITS[1],
      questionResolved: false
    };

    setGameQueues(queues);
    setGameRound(1);
    setGameScore(0);
    setGameLives(3);
    setGameCombo(0);
    setGameWordIdx(0);
    setGameTypedProgress(initialProgress);
    setGameSubState('PLAYING');
    setGameOutcome(null);
    setIsSandboxRound(false);
    setGameReviewLog([]);
    setActiveQuestion(firstQ);
    resetWordTimer(1);
  };

  const jumpToGameSandboxRound = (roundNum) => {
    clearTimeout(autoNextTimerRef.current);
    clearInterval(wordTimerRef.current);

    const queues = gameRuntimeRef.current.queues;
    const queue = queues[roundNum] || [];
    const firstQ = queue[0] || null;
    const initialProgress = firstQ ? skipNonAlphaIndex(firstQ.word, 0) : 0;

    homingLasersRef.current = [];
    gameRuntimeRef.current = {
      ...gameRuntimeRef.current,
      round: roundNum,
      lives: 3,
      wordIdx: 0,
      typedProgress: initialProgress,
      subState: 'PLAYING',
      activeQuestion: firstQ,
      isSandbox: true,
      timeLimit: GAME_ROUND_TIME_LIMITS[roundNum] || 25,
      questionResolved: false
    };

    setGameRound(roundNum);
    setGameLives(3);
    setGameWordIdx(0);
    setGameTypedProgress(initialProgress);
    setGameSubState('PLAYING');
    setGameOutcome(null);
    setIsSandboxRound(true);
    setActiveQuestion(firstQ);
    resetWordTimer(roundNum);

    if (roundNum === 3 && firstQ) {
      speakWord(firstQ.word);
    }
  };

  const advanceNextGameRound = () => {
    clearTimeout(autoNextTimerRef.current);
    const nextR = gameRuntimeRef.current.round + 1;
    const queue = gameRuntimeRef.current.queues[nextR] || [];
    const firstQ = queue[0] || null;
    const initialProgress = firstQ ? skipNonAlphaIndex(firstQ.word, 0) : 0;

    homingLasersRef.current = [];
    gameRuntimeRef.current.round = nextR;
    gameRuntimeRef.current.wordIdx = 0;
    gameRuntimeRef.current.typedProgress = initialProgress;
    gameRuntimeRef.current.subState = 'PLAYING';
    gameRuntimeRef.current.activeQuestion = firstQ;
    gameRuntimeRef.current.questionResolved = false;

    setGameRound(nextR);
    setGameWordIdx(0);
    setGameTypedProgress(initialProgress);
    setGameSubState('PLAYING');
    setActiveQuestion(firstQ);
    resetWordTimer(nextR);

    if (firstQ && nextR === 3) {
      speakWord(firstQ.word);
    }
  };

  // Handle word progression in game
  const handleWordCleared = (isCorrect, latestScoreOverride = null, latestComboOverride = null) => {
    const rt = gameRuntimeRef.current;
    const q = rt.activeQuestion;
    if (!q || rt.subState !== 'PLAYING') return;

    const currentRoundNum = rt.round;
    const finalScore = latestScoreOverride !== null ? latestScoreOverride : rt.score;
    const finalCombo = latestComboOverride !== null ? latestComboOverride : rt.combo;

    recordGameWordReview(q, currentRoundNum, isCorrect);

    const currentQueue = rt.queues[currentRoundNum] || [];
    const nextIdx = rt.wordIdx + 1;

    if (nextIdx < currentQueue.length) {
      const nextQ = currentQueue[nextIdx];
      const nextTyped = skipNonAlphaIndex(nextQ.word, 0);
      rt.wordIdx = nextIdx;
      rt.activeQuestion = nextQ;
      rt.typedProgress = nextTyped;
      rt.questionResolved = false;

      setGameWordIdx(nextIdx);
      setActiveQuestion(nextQ);
      setGameTypedProgress(nextTyped);
      resetWordTimer(currentRoundNum);

      if (currentRoundNum === 3) {
        speakWord(nextQ.word);
      }
    } else {
      clearInterval(wordTimerRef.current);
      // Round completed!
      if (currentRoundNum < 3 && !rt.isSandbox) {
        rt.subState = 'TRANSITION';
        setGameSubState('TRANSITION');
        setTransitionCountdown(3);
        let countdown = 3;
        clearTimeout(autoNextTimerRef.current);
        const tick = () => {
          if (gameRuntimeRef.current.subState !== 'TRANSITION') return;
          countdown--;
          setTransitionCountdown(Math.max(0, countdown));
          if (countdown <= 0) {
            advanceNextGameRound();
          } else {
            autoNextTimerRef.current = setTimeout(tick, 1000);
          }
        };
        autoNextTimerRef.current = setTimeout(tick, 1000);
      } else {
        // Finished all 3 rounds or sandbox round
        rt.subState = 'GAMEOVER';
        setGameOutcome('VICTORY');
        setGameSubState('GAMEOVER');
        syncScoreToLeaderboard(
          finalScore,
          rt.isSandbox ? `Hoàn thành Màn ${currentRoundNum} (GV)` : 'Hoàn thành 3 Vòng',
          finalCombo,
          []
        );
      }
    }
  };

  // Unified life deduction & immediate Game Over when lives hit 0
  const handleGameLifeLoss = (reasonMessage, advanceOnSurvive = false) => {
    const rt = gameRuntimeRef.current;
    if (rt.subState !== 'PLAYING') return;

    const q = rt.activeQuestion;
    const roundNum = rt.round;
    const nextLives = Math.max(0, rt.lives - 1);

    rt.lives = nextLives;
    rt.combo = 0;
    setGameLives(nextLives);
    setGameCombo(0);

    playSound('wrong');
    triggerGameToast(reasonMessage, false);

    if (q) {
      recordGameWordReview(q, roundNum, false);
    }

    if (nextLives <= 0) {
      clearTimeout(autoNextTimerRef.current);
      clearInterval(wordTimerRef.current);
      rt.subState = 'GAMEOVER';
      rt.questionResolved = true;
      setGameOutcome('LOST');
      setGameSubState('GAMEOVER');
      syncScoreToLeaderboard(
        rt.score,
        `Hết mạng ở Vòng ${roundNum}`,
        0,
        q ? [q.word] : []
      );
      return;
    }

    if (advanceOnSurvive) {
      handleWordCleared(false, rt.score, 0);
    }
  };

  // Handle typing input in Round 2 and Round 3
  const handleGameTypingInput = (char) => {
    const rt = gameRuntimeRef.current;
    if (rt.subState !== 'PLAYING' || (rt.round !== 2 && rt.round !== 3) || !rt.activeQuestion || rt.questionResolved) return;

    const q = rt.activeQuestion;
    const target = q.word.toUpperCase();
    const expected = target[rt.typedProgress];

    if (char === expected) {
      playSound('type_hit');
      const nextProgress = skipNonAlphaIndex(target, rt.typedProgress + 1);
      rt.typedProgress = nextProgress;
      setGameTypedProgress(nextProgress);

      // Visual laser hit toward boss
      const canvas = canvasRef.current;
      const w = canvas?.width || 800;
      const h = canvas?.height || 460;
      homingLasersRef.current.push({
        x: w / 2,
        y: h - 42,
        targetX: w / 2 + (Math.random() * 44 - 22),
        targetY: Math.max(60, h * 0.28),
        progress: 0
      });

      if (nextProgress >= target.length) {
        rt.questionResolved = true;
        const bonus = rt.round === 2 ? 150 : 250;
        const streakBonus = rt.combo * 25;
        const totalGain = bonus + streakBonus;
        const nextScore = rt.score + totalGain;
        const nextCombo = rt.combo + 1;

        rt.score = nextScore;
        rt.combo = nextCombo;
        setGameScore(nextScore);
        setGameCombo(nextCombo);

        playSound('word_clear');
        speakWord(q.word);
        triggerGameToast(`🎯 Chính xác! ${q.word} (${q.ipa}) +${totalGain}đ`, true);
        handleWordCleared(true, nextScore, nextCombo);
      }
    } else {
      playSound('wrong');
      rt.combo = 0;
      setGameCombo(0);
      triggerGameToast(`❌ Sai chữ cái "${char}". Hãy thử lại!`, false);
    }
  };

  const handleGameHint = () => {
    const rt = gameRuntimeRef.current;
    if (rt.subState !== 'PLAYING' || (rt.round !== 2 && rt.round !== 3) || !rt.activeQuestion) return;
    const nextChar = rt.activeQuestion.word.toUpperCase()[rt.typedProgress];
    if (!nextChar) return;
    const nextScore = Math.max(0, rt.score - 15);
    rt.score = nextScore;
    setGameScore(nextScore);
    handleGameTypingInput(nextChar);
  };

  // Per-Word Countdown Timer for Game Arena (Round 1, Round 2, Round 3)
  useEffect(() => {
    clearInterval(wordTimerRef.current);
    if (view !== 'GAME_ARENA' || gameSubState !== 'PLAYING' || !activeQuestion) return;

    const limit = GAME_ROUND_TIME_LIMITS[gameRound] || 25;
    wordStartedAtRef.current = Date.now();
    timeRemainingFloatRef.current = limit;
    gameRuntimeRef.current.timeLimit = limit;
    gameRuntimeRef.current.questionResolved = false;

    wordTimerRef.current = setInterval(() => {
      if (gameRuntimeRef.current.subState !== 'PLAYING') return;
      const elapsedSec = (Date.now() - wordStartedAtRef.current) / 1000;
      const remaining = Math.max(0, limit - elapsedSec);
      timeRemainingFloatRef.current = remaining;
      setGameTimeLeft(Math.ceil(remaining));

      if (remaining <= 0 && !gameRuntimeRef.current.questionResolved) {
        gameRuntimeRef.current.questionResolved = true;
        clearInterval(wordTimerRef.current);
        const currentWord = gameRuntimeRef.current.activeQuestion?.word || '';
        handleGameLifeLoss(`⏰ Hết thời gian! Từ đúng là "${currentWord}"`, true);
      }
    }, 100);

    return () => clearInterval(wordTimerRef.current);
  }, [view, gameSubState, gameRound, activeQuestion]);

  // Keyboard Event Listeners for Game Arena
  useEffect(() => {
    if (view !== 'GAME_ARENA' || gameSubState !== 'PLAYING') return;

    const handleKeyDown = (e) => {
      const rt = gameRuntimeRef.current;
      if (e.code === 'Tab' && rt.activeQuestion) {
        e.preventDefault();
        speakWord(rt.activeQuestion.word);
        return;
      }
      if (rt.round === 2 || rt.round === 3) {
        if (e.code === 'Digit1') {
          e.preventDefault();
          handleGameHint();
          return;
        }
        if (e.key && e.key.length === 1 && /^[a-zA-Z]$/.test(e.key)) {
          e.preventDefault();
          handleGameTypingInput(e.key.toUpperCase());
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [view, gameSubState]);

  // Canvas Animation Game Loop (Space-Shooter Canvas with ResizeObserver)
  useEffect(() => {
    if (view !== 'GAME_ARENA') {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
      return;
    }

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const parentEl = canvas.parentElement;

    let width = (canvas.width = Math.max(300, parentEl?.clientWidth || 800));
    let height = (canvas.height = Math.max(220, parentEl?.clientHeight || 460));

    let playerX = width / 2;
    let bullets = [];
    let chickens = [];
    let stars = [];
    const pressedKeys = {};

    for (let i = 0; i < 65; i++) {
      stars.push({
        x: Math.random() * width,
        y: Math.random() * height,
        size: Math.random() * 2 + 0.5,
        speed: Math.random() * 1.1 + 0.3
      });
    }

    const spawnRound1Chickens = (q) => {
      chickens = [];
      if (!q) return;
      const choices = [
        { word: q.word, isCorrect: true },
        ...q.distractors.map(w => ({ word: w, isCorrect: false }))
      ].sort(() => Math.random() - 0.5);

      const twoRows = width < 620 && choices.length >= 4;
      const topCount = twoRows ? Math.ceil(choices.length / 2) : choices.length;
      const bottomCount = choices.length - topCount;

      choices.forEach((c, idx) => {
        const isSecondRow = twoRows && idx >= topCount;
        const rowCount = isSecondRow ? bottomCount : topCount;
        const rowIdx = isSecondRow ? idx - topCount : idx;
        const margin = Math.min(72, width * 0.14);
        const usableW = Math.max(120, width - margin * 2);
        const slotX = rowCount === 1
          ? width / 2
          : margin + (usableW * rowIdx) / (rowCount - 1);

        chickens.push({
          x: slotX,
          baseX: slotX,
          rowOffset: isSecondRow ? 74 : (idx % 2 === 0 ? 0 : 22),
          y: 70,
          width: Math.min(118, Math.max(88, width / 5.5)),
          height: 58,
          word: c.word,
          isCorrect: c.isCorrect,
          wingPhase: Math.random() * Math.PI * 2,
          swayRange: width < 520 ? 8 : 16
        });
      });
    };

    if (gameRound === 1 && activeQuestion && gameSubState === 'PLAYING') {
      spawnRound1Chickens(activeQuestion);
    }

    const syncCanvasDimensions = () => {
      if (!parentEl) return;
      const nextW = Math.max(300, Math.floor(parentEl.clientWidth));
      const nextH = Math.max(220, Math.floor(parentEl.clientHeight));
      if (nextW === width && nextH === height) return;

      const ratioX = nextW / Math.max(1, width);
      const ratioY = nextH / Math.max(1, height);

      width = canvas.width = nextW;
      height = canvas.height = nextH;

      playerX = Math.max(36, Math.min(width - 36, playerX * ratioX));
      chickens.forEach(c => {
        c.baseX = Math.max(54, Math.min(width - 54, c.baseX * ratioX));
        c.x = Math.max(54, Math.min(width - 54, c.x * ratioX));
      });
      stars.forEach(s => {
        s.x = (s.x * ratioX) % width;
        s.y = (s.y * ratioY) % height;
      });
    };

    let resizeObserver = null;
    if (typeof ResizeObserver !== 'undefined' && parentEl) {
      resizeObserver = new ResizeObserver(syncCanvasDimensions);
      resizeObserver.observe(parentEl);
    }
    window.addEventListener('resize', syncCanvasDimensions);

    const handleMouseMove = (e) => {
      const rect = canvas.getBoundingClientRect();
      const scaleX = width / Math.max(1, rect.width);
      playerX = Math.max(36, Math.min(width - 36, (e.clientX - rect.left) * scaleX));
    };

    const fireBullet = () => {
      if (gameRuntimeRef.current.round === 1 && gameRuntimeRef.current.subState === 'PLAYING') {
        bullets.push({ x: playerX, y: height - 52, speed: 13 });
        playSound('shoot');
      }
    };

    const handleClick = () => fireBullet();

    const handleTouchMove = (e) => {
      if (gameRuntimeRef.current.round !== 1 || gameRuntimeRef.current.subState !== 'PLAYING') return;
      if (!e.touches?.[0]) return;
      const rect = canvas.getBoundingClientRect();
      const scaleX = width / Math.max(1, rect.width);
      playerX = Math.max(36, Math.min(width - 36, (e.touches[0].clientX - rect.left) * scaleX));
    };

    const handleTouchStart = (e) => {
      if (gameRuntimeRef.current.round !== 1 || gameRuntimeRef.current.subState !== 'PLAYING') return;
      handleTouchMove(e);
      fireBullet();
    };

    const handleKeyDownCanvas = (e) => {
      pressedKeys[e.code] = true;
      if (e.code === 'Space' && gameRuntimeRef.current.round === 1 && gameRuntimeRef.current.subState === 'PLAYING') {
        e.preventDefault();
        fireBullet();
      }
    };

    const handleKeyUpCanvas = (e) => {
      pressedKeys[e.code] = false;
    };

    canvas.addEventListener('mousemove', handleMouseMove);
    canvas.addEventListener('click', handleClick);
    canvas.addEventListener('touchmove', handleTouchMove, { passive: true });
    canvas.addEventListener('touchstart', handleTouchStart, { passive: true });
    window.addEventListener('keydown', handleKeyDownCanvas);
    window.addEventListener('keyup', handleKeyUpCanvas);

    const renderLoop = () => {
      syncCanvasDimensions();
      ctx.clearRect(0, 0, width, height);

      const rt = gameRuntimeRef.current;

      // Keyboard ship steering for Round 1
      if (rt.round === 1 && rt.subState === 'PLAYING') {
        if (pressedKeys['ArrowLeft'] || pressedKeys['KeyA']) {
          playerX = Math.max(36, playerX - 7);
        }
        if (pressedKeys['ArrowRight'] || pressedKeys['KeyD']) {
          playerX = Math.min(width - 36, playerX + 7);
        }
      }

      // Starfield
      ctx.fillStyle = '#ffffff';
      stars.forEach(s => {
        s.y += s.speed;
        if (s.y > height) {
          s.y = 0;
          s.x = Math.random() * width;
        }
        ctx.globalAlpha = 0.5;
        ctx.beginPath();
        ctx.arc(s.x, s.y, s.size, 0, Math.PI * 2);
        ctx.fill();
      });
      ctx.globalAlpha = 1;

      const limit = Math.max(1, rt.timeLimit || 25);
      const elapsedRatio = Math.min(1, Math.max(0, 1 - timeRemainingFloatRef.current / limit));

      // Bullets & Hit detection (Round 1)
      ctx.fillStyle = '#00f2fe';
      for (let i = bullets.length - 1; i >= 0; i--) {
        const b = bullets[i];
        b.y -= b.speed;
        ctx.beginPath();
        ctx.roundRect(b.x - 3, b.y, 6, 16, 3);
        ctx.fill();

        let bulletRemoved = false;
        if (rt.round === 1 && rt.subState === 'PLAYING' && !rt.questionResolved) {
          for (let j = chickens.length - 1; j >= 0; j--) {
            const c = chickens[j];
            if (
              b.x > c.x - c.width / 2 &&
              b.x < c.x + c.width / 2 &&
              b.y > c.y - c.height / 2 &&
              b.y < c.y + c.height / 2 + 22
            ) {
              bullets.splice(i, 1);
              bulletRemoved = true;

              if (c.isCorrect) {
                rt.questionResolved = true;
                const nextCombo = rt.combo + 1;
                const nextScore = rt.score + 120 + rt.combo * 20;
                rt.score = nextScore;
                rt.combo = nextCombo;
                setGameScore(nextScore);
                setGameCombo(nextCombo);

                playSound('word_clear');
                speakWord(rt.activeQuestion.word);
                triggerGameToast(`✅ Xuất sắc! ${rt.activeQuestion.word} (${rt.activeQuestion.ipa})`, true);
                handleWordCleared(true, nextScore, nextCombo);
              } else {
                chickens.splice(j, 1);
                handleGameLifeLoss(
                  `❌ Bắn nhầm từ "${c.word}". Đáp án đúng là "${rt.activeQuestion.word}"`,
                  false
                );
              }
              break;
            }
          }
        }

        if (!bulletRemoved && b.y < -20) {
          bullets.splice(i, 1);
        }
      }

      // Homing Lasers (Round 2 & 3 typing hits)
      const lasers = homingLasersRef.current;
      for (let i = lasers.length - 1; i >= 0; i--) {
        const hl = lasers[i];
        hl.progress += 0.22;
        ctx.strokeStyle = '#10b981';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(hl.x, hl.y);
        const curX = hl.x + (hl.targetX - hl.x) * Math.min(1, hl.progress);
        const curY = hl.y + (hl.targetY - hl.y) * Math.min(1, hl.progress);
        ctx.lineTo(curX, curY);
        ctx.stroke();
        if (hl.progress >= 1) lasers.splice(i, 1);
      }

      // Draw Chickens (Round 1) — smoothly descend with timer
      if (rt.round === 1 && rt.subState === 'PLAYING') {
        const topBaseY = Math.max(46, height * 0.14);
        const maxDescendY = Math.max(topBaseY + 20, height - 155);
        chickens.forEach(c => {
          c.wingPhase += 0.1;
          c.x = c.baseX + Math.sin(c.wingPhase * 0.5) * c.swayRange;
          c.y = topBaseY + c.rowOffset + elapsedRatio * (maxDescendY - topBaseY - c.rowOffset);

          ctx.save();
          ctx.translate(c.x, c.y);

          // Wings
          const wingY = Math.sin(c.wingPhase) * 6;
          ctx.fillStyle = '#f8fafc';
          ctx.beginPath();
          ctx.ellipse(-24, wingY, 12, 6, -0.3, 0, Math.PI * 2);
          ctx.ellipse(24, wingY, 12, 6, 0.3, 0, Math.PI * 2);
          ctx.fill();

          // Body
          ctx.fillStyle = '#ffffff';
          ctx.beginPath();
          ctx.arc(0, 0, 18, 0, Math.PI * 2);
          ctx.fill();

          // Comb & Beak
          ctx.fillStyle = '#ef4444';
          ctx.beginPath();
          ctx.arc(0, -18, 5, 0, Math.PI * 2);
          ctx.fill();

          ctx.fillStyle = '#f59e0b';
          ctx.beginPath();
          ctx.moveTo(-4, -2);
          ctx.lineTo(4, -2);
          ctx.lineTo(0, 5);
          ctx.fill();

          // Word card
          ctx.font = 'bold 12px "JetBrains Mono", monospace';
          const textW = Math.max(82, ctx.measureText(c.word).width + 16);
          ctx.fillStyle = 'rgba(15, 23, 42, 0.95)';
          ctx.strokeStyle = '#00f2fe';
          ctx.lineWidth = 1.5;
          ctx.beginPath();
          ctx.roundRect(-textW / 2, 18, textW, 24, 6);
          ctx.fill();
          ctx.stroke();

          ctx.fillStyle = '#ffffff';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText(c.word, 0, 30);

          ctx.restore();
        });
      }

      // Draw Boss Chicken (Round 2 & Round 3) — descends toward player ship as time expires!
      if ((rt.round === 2 || rt.round === 3) && rt.activeQuestion && rt.subState === 'PLAYING') {
        const swayX = Math.sin(Date.now() * 0.0025) * Math.min(75, width * 0.14);
        const bossX = width / 2 + swayX;
        const startBossY = Math.max(58, height * 0.2);
        const endBossY = Math.max(startBossY + 35, height - 98);
        const bossY = startBossY + elapsedRatio * (endBossY - startBossY);

        // Update active homing laser targets
        lasers.forEach(hl => {
          hl.targetX = bossX;
          hl.targetY = bossY;
        });

        ctx.save();
        ctx.translate(bossX, bossY);

        // Danger halo when time <= 6s
        if (timeRemainingFloatRef.current <= 6) {
          ctx.strokeStyle = 'rgba(244, 63, 94, 0.65)';
          ctx.lineWidth = 3;
          ctx.beginPath();
          ctx.arc(0, 0, 42 + Math.sin(Date.now() * 0.02) * 4, 0, Math.PI * 2);
          ctx.stroke();
        }

        // Boss Wings
        const wingY = Math.sin(Date.now() * 0.01) * 7;
        ctx.fillStyle = rt.round === 3 ? '#f472b6' : '#fcd34d';
        ctx.beginPath();
        ctx.ellipse(-38, wingY, 16, 8, -0.3, 0, Math.PI * 2);
        ctx.ellipse(38, wingY, 16, 8, 0.3, 0, Math.PI * 2);
        ctx.fill();

        // Giant Boss Body
        ctx.fillStyle = rt.round === 3 ? '#ec4899' : '#f59e0b';
        ctx.beginPath();
        ctx.arc(0, 0, 30, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(-10, -5, 5, 0, Math.PI * 2);
        ctx.arc(10, -5, 5, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#0f172a';
        ctx.beginPath();
        ctx.arc(-10, -5, 2.5, 0, Math.PI * 2);
        ctx.arc(10, -5, 2.5, 0, Math.PI * 2);
        ctx.fill();

        // Crown on Boss in Round 3
        if (rt.round === 3) {
          ctx.fillStyle = '#fbbf24';
          ctx.beginPath();
          ctx.moveTo(-18, -30);
          ctx.lineTo(-9, -42);
          ctx.lineTo(0, -30);
          ctx.lineTo(9, -42);
          ctx.lineTo(18, -30);
          ctx.closePath();
          ctx.fill();
        }

        // Boss Time / Shield Progress Bar above Boss
        const barW = 96;
        const barH = 6;
        const remainRatio = Math.max(0, Math.min(1, timeRemainingFloatRef.current / limit));
        ctx.fillStyle = 'rgba(15, 23, 42, 0.9)';
        ctx.fillRect(-barW / 2, -52, barW, barH);
        ctx.fillStyle = remainRatio > 0.4 ? '#22d3ee' : remainRatio > 0.2 ? '#f59e0b' : '#f43f5e';
        ctx.fillRect(-barW / 2, -52, barW * remainRatio, barH);

        // Masked target label below Boss
        const wordUpper = rt.activeQuestion.word.toUpperCase();
        let masked = '';
        for (let k = 0; k < wordUpper.length; k++) {
          if (k < rt.typedProgress || !/^[A-Z]$/.test(wordUpper[k])) masked += wordUpper[k] + ' ';
          else if (rt.round === 2 && k % 2 === 0) masked += wordUpper[k] + ' ';
          else masked += '_ ';
        }
        const label = masked.trim();
        ctx.font = 'bold 13px "JetBrains Mono", monospace';
        const lblW = Math.max(100, ctx.measureText(label).width + 20);
        ctx.fillStyle = 'rgba(15, 23, 42, 0.92)';
        ctx.strokeStyle = rt.round === 3 ? '#ec4899' : '#f59e0b';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.roundRect(-lblW / 2, 36, lblW, 24, 6);
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = '#ffffff';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(label, 0, 48);

        ctx.restore();
      }

      // Draw Player Spaceship
      const shipX = rt.round === 1 ? playerX : width / 2;
      ctx.save();
      ctx.translate(shipX, height - 34);
      ctx.fillStyle = rt.round === 1 ? '#00f2fe' : '#a855f7';
      ctx.beginPath();
      ctx.moveTo(0, -20);
      ctx.lineTo(18, 14);
      ctx.lineTo(0, 8);
      ctx.lineTo(-18, 14);
      ctx.closePath();
      ctx.fill();
      ctx.restore();

      animFrameRef.current = requestAnimationFrame(renderLoop);
    };

    animFrameRef.current = requestAnimationFrame(renderLoop);

    return () => {
      if (resizeObserver) resizeObserver.disconnect();
      window.removeEventListener('resize', syncCanvasDimensions);
      canvas.removeEventListener('mousemove', handleMouseMove);
      canvas.removeEventListener('click', handleClick);
      canvas.removeEventListener('touchmove', handleTouchMove);
      canvas.removeEventListener('touchstart', handleTouchStart);
      window.removeEventListener('keydown', handleKeyDownCanvas);
      window.removeEventListener('keyup', handleKeyUpCanvas);
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, [view, gameRound, activeQuestion, gameSubState]);

  // ==========================================
  // RENDER NAVBAR COMPONENT (CLEAN MODERN EDTECH)
  // ==========================================
  const renderNavbar = () => {
    if (view === 'AUTH') return null;

    return (
      <header className="bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-b border-slate-200/80 dark:border-slate-800 text-slate-800 dark:text-slate-100 sticky top-0 z-50 transition-all shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between gap-4">
          {/* Logo & Brand Name */}
          <div
            className="flex items-center gap-3 cursor-pointer group"
            onClick={() => setView(currentUser?.role === 'teacher' ? 'TEACHER_DASHBOARD' : 'HOME')}
          >
            <div className="bg-gradient-to-tr from-indigo-600 via-blue-600 to-cyan-500 p-2.5 rounded-2xl shadow-md shadow-indigo-500/20 group-hover:scale-105 transition-transform flex items-center justify-center">
              <GraduationCap className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-base sm:text-lg tracking-tight bg-gradient-to-r from-slate-900 via-indigo-900 to-blue-700 dark:from-white dark:via-indigo-200 dark:to-cyan-300 bg-clip-text text-transparent">
                  LexiPrep Academy
                </span>
                <span className="text-[10px] bg-indigo-50 dark:bg-indigo-500/15 text-indigo-700 dark:text-indigo-300 font-extrabold px-2 py-0.5 rounded-full border border-indigo-200 dark:border-indigo-500/30">
                  EDU PRO
                </span>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">Hệ thống Khảo thí & Luyện thi IELTS Trực tuyến</p>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="hidden md:flex items-center gap-1.5 bg-slate-100/90 dark:bg-slate-800/90 p-1.5 rounded-2xl border border-slate-200/70 dark:border-slate-700/80 text-xs font-bold">
            <button
              onClick={() => setView('HOME')}
              className={`px-3.5 py-2 rounded-xl transition flex items-center gap-1.5 ${
                view === 'HOME'
                  ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-300 shadow-sm border border-slate-200/60 dark:border-slate-700'
                  : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-white/60 dark:hover:bg-slate-700/60'
              }`}
            >
              <FileText className="w-3.5 h-3.5" /> Phòng Luyện Đề
            </button>
            <button
              onClick={() => {
                initGameCampaign(currentRoomPin, currentUser);
                setView('GAME_ARENA');
              }}
              className={`px-3.5 py-2 rounded-xl transition flex items-center gap-1.5 ${
                view === 'GAME_ARENA'
                  ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-white/60 dark:hover:bg-slate-700/60'
              }`}
            >
              <Gamepad2 className="w-3.5 h-3.5 text-purple-500 dark:text-purple-400" /> Game Từ Vựng
            </button>
            <button
              onClick={() => {
                setSelectedProfileStudent(currentUser?.username);
                setView('STUDENT_PROFILE');
              }}
              className={`px-3.5 py-2 rounded-xl transition flex items-center gap-1.5 ${
                view === 'STUDENT_PROFILE'
                  ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-300 shadow-sm border border-slate-200/60 dark:border-slate-700'
                  : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-white/60 dark:hover:bg-slate-700/60'
              }`}
            >
              <UserCheck className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" /> Hồ Sơ {currentUser?.role === 'teacher' ? 'Học Viên' : 'Của Tôi'}
            </button>
            {currentUser?.role === 'teacher' && (
              <button
                onClick={() => setView('TEACHER_DASHBOARD')}
                className={`px-3.5 py-2 rounded-xl transition flex items-center gap-1.5 ${
                  view === 'TEACHER_DASHBOARD' || view === 'EXAM_BUILDER'
                    ? 'bg-amber-500 text-white shadow-sm'
                    : 'text-amber-700 dark:text-amber-300 bg-amber-50/70 dark:bg-amber-500/15 hover:bg-amber-100/80 dark:hover:bg-amber-500/25'
                }`}
              >
                <ShieldAlert className="w-3.5 h-3.5" /> Quản Trị Giáo Viên
              </button>
            )}
          </nav>

          {/* Right Header: Dark Mode, AI Key, User Profile, Logout */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setDarkMode(d => !d)}
              className="flex items-center gap-1.5 px-2.5 sm:px-3 py-2 rounded-xl text-xs font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-200/80 dark:hover:bg-slate-700 transition border border-slate-200/80 dark:border-slate-700"
              title={darkMode ? 'Chuyển sang giao diện Sáng' : 'Chuyển sang giao diện Tối'}
              aria-label={darkMode ? 'Chế độ sáng' : 'Chế độ tối'}
            >
              {darkMode ? (
                <>
                  <Sun className="w-3.5 h-3.5 text-amber-400" />
                  <span className="hidden xl:inline">Sáng</span>
                </>
              ) : (
                <>
                  <Moon className="w-3.5 h-3.5 text-indigo-600" />
                  <span className="hidden xl:inline">Tối</span>
                </>
              )}
            </button>

            <button
              onClick={() => setShowApiKeyModal(true)}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-200/80 dark:hover:bg-slate-700 transition border border-slate-200/80 dark:border-slate-700"
              title="Cấu hình Google Gemini API Key"
            >
              <Key className="w-3.5 h-3.5 text-amber-500" />
              <span className="hidden lg:inline">AI Examiner</span>
              <span className={`w-2 h-2 rounded-full ${aiApiKey ? 'bg-emerald-500' : 'bg-slate-400'}`} />
            </button>

            {/* User Profile Pill */}
            <div
              onClick={() => {
                setSelectedProfileStudent(currentUser?.username);
                setView('STUDENT_PROFILE');
              }}
              className="flex items-center gap-2.5 bg-slate-50 dark:bg-slate-800/80 hover:bg-slate-100 dark:hover:bg-slate-800 px-3 py-1.5 rounded-2xl border border-slate-200/80 dark:border-slate-700 cursor-pointer transition"
              title="Xem hồ sơ học tập và lịch sử thi"
            >
              <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-indigo-600 to-blue-500 flex items-center justify-center font-extrabold text-xs text-white uppercase shadow-sm">
                {currentUser?.name ? currentUser.name[0] : 'U'}
              </div>
              <div className="text-left text-xs hidden sm:block">
                <p className="font-bold text-slate-800 dark:text-slate-100 leading-tight truncate max-w-[130px]">{currentUser?.name}</p>
                <span className={`text-[10px] font-bold px-1.5 py-0.2 rounded ${
                  currentUser?.role === 'teacher'
                    ? 'bg-amber-100 dark:bg-amber-500/20 text-amber-800 dark:text-amber-300'
                    : 'bg-indigo-50 dark:bg-indigo-500/20 text-indigo-700 dark:text-indigo-300'
                }`}>
                  {currentUser?.role === 'teacher' ? 'Giáo viên' : 'Học viên'}
                </span>
              </div>
            </div>

            {/* Logout button */}
            <button
              onClick={handleLogout}
              className="p-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-rose-50 dark:hover:bg-rose-500/20 hover:text-rose-600 dark:hover:text-rose-400 text-slate-500 dark:text-slate-400 transition border border-slate-200/80 dark:border-slate-700"
              title="Đăng xuất khỏi hệ thống"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Mobile Quick Nav Strip */}
        <div className="md:hidden border-t border-slate-200/70 dark:border-slate-800 px-3 py-2 flex items-center gap-1.5 overflow-x-auto text-[11px] font-bold">
          <button
            onClick={() => setView('HOME')}
            className={`px-3 py-1.5 rounded-xl whitespace-nowrap transition flex items-center gap-1 ${
              view === 'HOME'
                ? 'bg-indigo-600 text-white'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
            }`}
          >
            <FileText className="w-3 h-3" /> Phòng Đề
          </button>
          <button
            onClick={() => {
              initGameCampaign(currentRoomPin, currentUser);
              setView('GAME_ARENA');
            }}
            className={`px-3 py-1.5 rounded-xl whitespace-nowrap transition flex items-center gap-1 ${
              view === 'GAME_ARENA'
                ? 'bg-purple-600 text-white'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
            }`}
          >
            <Gamepad2 className="w-3 h-3" /> Game Từ Vựng
          </button>
          <button
            onClick={() => {
              setSelectedProfileStudent(currentUser?.username);
              setView('STUDENT_PROFILE');
            }}
            className={`px-3 py-1.5 rounded-xl whitespace-nowrap transition flex items-center gap-1 ${
              view === 'STUDENT_PROFILE'
                ? 'bg-indigo-600 text-white'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
            }`}
          >
            <UserCheck className="w-3 h-3" /> Hồ Sơ
          </button>
          {currentUser?.role === 'teacher' && (
            <button
              onClick={() => setView('TEACHER_DASHBOARD')}
              className={`px-3 py-1.5 rounded-xl whitespace-nowrap transition flex items-center gap-1 ${
                view === 'TEACHER_DASHBOARD' || view === 'EXAM_BUILDER'
                  ? 'bg-amber-500 text-white'
                  : 'bg-amber-50 dark:bg-amber-500/15 text-amber-700 dark:text-amber-300'
              }`}
            >
              <ShieldAlert className="w-3 h-3" /> Giáo Viên
            </button>
          )}
        </div>
      </header>
    );
  };

  // ==========================================
  // RENDER AUTH SCREEN (STUDENT-FOCUSED EDTECH PORTAL)
  // ==========================================
  const renderAuthScreen = () => (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/40 to-indigo-100/50 dark:from-slate-950 dark:via-slate-900 dark:to-indigo-950 text-slate-900 dark:text-slate-100 flex flex-col justify-between p-4 sm:p-8 select-none relative overflow-hidden">
      {/* Soft Background Accents */}
      <div className="absolute top-[-8%] left-[-5%] w-[450px] h-[450px] bg-indigo-400/15 dark:bg-indigo-500/10 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute bottom-[-8%] right-[-5%] w-[450px] h-[450px] bg-cyan-400/15 dark:bg-cyan-500/10 rounded-full blur-[100px] pointer-events-none" />

      {/* Top Brand Header */}
      <div className="max-w-6xl w-full mx-auto flex items-center justify-between pt-2 z-10">
        <div className="flex items-center gap-3">
          <div className="bg-gradient-to-tr from-indigo-600 via-blue-600 to-cyan-500 p-2.5 rounded-2xl shadow-lg shadow-indigo-500/20 flex items-center justify-center">
            <GraduationCap className="w-6 h-6 text-white" />
          </div>
          <div>
            <span className="font-extrabold text-xl tracking-tight text-slate-900 dark:text-white">LexiPrep Academy</span>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">Nền tảng Học tập & Khảo thí IELTS Thế hệ mới</p>
          </div>
        </div>
        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={() => setDarkMode(d => !d)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold bg-white/90 dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700 transition shadow-sm"
            title={darkMode ? 'Chuyển sang giao diện Sáng' : 'Chuyển sang giao diện Tối'}
          >
            {darkMode ? <Sun className="w-3.5 h-3.5 text-amber-400" /> : <Moon className="w-3.5 h-3.5 text-indigo-600" />}
            <span>{darkMode ? 'Chế độ Sáng' : 'Chế độ Tối'}</span>
          </button>
          <span className="hidden sm:inline-flex items-center gap-1.5 text-xs font-bold text-indigo-700 dark:text-indigo-300 bg-indigo-50 dark:bg-indigo-500/15 border border-indigo-200/80 dark:border-indigo-500/30 px-3.5 py-1.5 rounded-full">
            <Sparkles className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" /> Chuẩn Khảo Thí Quốc Tế
          </span>
        </div>
      </div>

      {/* Main Split Portal Card */}
      <div className="max-w-5xl w-full mx-auto my-auto py-6 z-10">
        <div className="bg-white dark:bg-slate-900 rounded-[32px] shadow-2xl shadow-indigo-950/10 dark:shadow-black/50 border border-slate-200/80 dark:border-slate-800 overflow-hidden grid grid-cols-1 lg:grid-cols-12">
          {/* Left Showcase Column (7 cols) */}
          <div className="lg:col-span-7 bg-gradient-to-br from-indigo-900 via-blue-900 to-slate-900 text-white p-8 sm:p-12 flex flex-col justify-between relative overflow-hidden">
            <div className="absolute -right-16 -bottom-16 w-64 h-64 bg-cyan-500/10 rounded-full blur-2xl pointer-events-none" />

            <div>
              <div className="inline-flex items-center gap-2 bg-white/10 border border-white/15 px-3.5 py-1.5 rounded-full text-xs font-bold text-cyan-300 mb-6 backdrop-blur-sm">
                <Award className="w-4 h-4 text-amber-300" /> Hệ Thống Đào Tạo & Thi Thử Toàn Diện
              </div>

              <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight leading-tight mb-4">
                Chinh phục mục tiêu <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-300 to-amber-300">IELTS Band 8.0+</span> dễ dàng hơn mỗi ngày.
              </h1>

              <p className="text-slate-300 text-xs sm:text-sm leading-relaxed mb-8">
                Tham gia phòng thi mô phỏng máy tính chuẩn quốc tế, nhận chấm điểm & sửa bài Writing chi tiết từ AI Examiner, theo dõi tiến trình hồ sơ học tập và rèn luyện phản xạ từ vựng qua trò chơi tương tác sau khi đăng nhập.
              </p>

              {/* Feature Highlights */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="bg-white/5 border border-white/10 rounded-2xl p-4 backdrop-blur-sm">
                  <div className="w-8 h-8 rounded-xl bg-blue-500/20 text-cyan-300 flex items-center justify-center mb-2.5">
                    <Headphones className="w-4 h-4" />
                  </div>
                  <h3 className="font-bold text-sm text-white">Thi Thử 3 Kỹ Năng</h3>
                  <p className="text-[11px] text-slate-300 mt-1 leading-relaxed">
                    Giao diện chia đôi màn hình Reading, Highlight ghi chú & đếm từ tự động.
                  </p>
                </div>

                <div className="bg-white/5 border border-white/10 rounded-2xl p-4 backdrop-blur-sm">
                  <div className="w-8 h-8 rounded-xl bg-purple-500/20 text-purple-300 flex items-center justify-center mb-2.5">
                    <Bot className="w-4 h-4" />
                  </div>
                  <h3 className="font-bold text-sm text-white">AI Writing Examiner</h3>
                  <p className="text-[11px] text-slate-300 mt-1 leading-relaxed">
                    Phân tích chi tiết 4 tiêu chí chấm thi chuẩn quốc tế chỉ trong vài giây.
                  </p>
                </div>

                <div className="bg-white/5 border border-white/10 rounded-2xl p-4 backdrop-blur-sm">
                  <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-300 flex items-center justify-center mb-2.5">
                    <TrendingUp className="w-4 h-4" />
                  </div>
                  <h3 className="font-bold text-sm text-white">Hồ Sơ Học Tập Cá Nhân</h3>
                  <p className="text-[11px] text-slate-300 mt-1 leading-relaxed">
                    Lưu trữ toàn bộ lịch sử các lần thi, biểu đồ tăng trưởng & nhận xét từ giáo viên.
                  </p>
                </div>

                <div className="bg-white/5 border border-white/10 rounded-2xl p-4 backdrop-blur-sm">
                  <div className="w-8 h-8 rounded-xl bg-amber-500/20 text-amber-300 flex items-center justify-center mb-2.5">
                    <Gamepad2 className="w-4 h-4" />
                  </div>
                  <h3 className="font-bold text-sm text-white">Đấu Trường Từ Vựng</h3>
                  <p className="text-[11px] text-slate-300 mt-1 leading-relaxed">
                    Ôn luyện từ vựng học thuật qua 3 vòng thử thách không gian đầy kịch tính.
                  </p>
                </div>
              </div>
            </div>

            <div className="mt-8 pt-5 border-t border-white/10 flex items-center justify-between text-xs text-slate-300">
              <span>✨ Hơn 1,500+ học viên đang luyện tập</span>
              <span className="font-semibold text-cyan-300">Bảo mật & Chống gian lận thông minh</span>
            </div>
          </div>

          {/* Right Form Column (5 cols) — Student Login & Registration */}
          <div className="lg:col-span-5 p-8 sm:p-10 flex flex-col justify-between bg-white dark:bg-slate-900">
            <div>
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-2xl font-extrabold text-slate-900 dark:text-white">
                    {authMode === 'login' ? 'Đăng Nhập Học Viên' : 'Đăng Ký Tài Khoản'}
                  </h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                    {authMode === 'login'
                      ? 'Nhập thông tin tài khoản để bắt đầu học & làm bài'
                      : 'Tạo tài khoản học sinh mới hoàn toàn miễn phí'}
                  </p>
                </div>
              </div>

              {/* Mode Switcher Tabs (Login / Register) */}
              <div className="grid grid-cols-2 gap-1.5 p-1 bg-slate-100 dark:bg-slate-800 rounded-2xl border border-slate-200/70 dark:border-slate-700 text-xs font-bold mb-6">
                <button
                  type="button"
                  onClick={() => { setAuthMode('login'); setAuthError(''); }}
                  className={`py-2.5 rounded-xl transition ${
                    authMode === 'login'
                      ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-300 shadow-sm'
                      : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
                  }`}
                >
                  Đăng Nhập
                </button>
                <button
                  type="button"
                  onClick={() => { setAuthMode('register'); setAuthError(''); }}
                  className={`py-2.5 rounded-xl transition ${
                    authMode === 'register'
                      ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-300 shadow-sm'
                      : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
                  }`}
                >
                  Tạo Tài Khoản Mới
                </button>
              </div>

              {authError && (
                <div className="p-3.5 bg-rose-50 dark:bg-rose-500/15 border border-rose-200 dark:border-rose-500/30 rounded-2xl text-xs text-rose-700 dark:text-rose-300 mb-5 flex items-center gap-2 font-medium">
                  <AlertTriangle className="w-4 h-4 text-rose-600 dark:text-rose-400 flex-shrink-0" />
                  <span>{authError}</span>
                </div>
              )}

              <form onSubmit={handleAuthSubmit} className="space-y-4">
                {authMode === 'register' && (
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">Họ và Tên học sinh:</label>
                    <input
                      type="text"
                      required
                      placeholder="VD: Nguyễn Minh Anh"
                      value={authForm.fullName}
                      onChange={e => setAuthForm({ ...authForm, fullName: e.target.value })}
                      className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-900 dark:text-slate-100 focus:bg-white dark:focus:bg-slate-800 focus:ring-2 focus:ring-indigo-500 focus:outline-none transition"
                    />
                  </div>
                )}

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">Tên đăng nhập (Username):</label>
                  <input
                    type="text"
                    required
                    placeholder="Nhập tên đăng nhập..."
                    value={authForm.username}
                    onChange={e => setAuthForm({ ...authForm, username: e.target.value })}
                    className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-900 dark:text-slate-100 focus:bg-white dark:focus:bg-slate-800 focus:ring-2 focus:ring-indigo-500 focus:outline-none transition"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">Mật khẩu:</label>
                  <input
                    type="password"
                    required
                    placeholder="Nhập mật khẩu..."
                    value={authForm.password}
                    onChange={e => setAuthForm({ ...authForm, password: e.target.value })}
                    className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-900 dark:text-slate-100 focus:bg-white dark:focus:bg-slate-800 focus:ring-2 focus:ring-indigo-500 focus:outline-none transition"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-700 hover:to-blue-700 text-white font-extrabold py-3.5 rounded-xl transition shadow-lg shadow-indigo-600/20 flex items-center justify-center gap-2 text-xs tracking-wide mt-2 active:scale-98"
                >
                  {authMode === 'login' ? 'ĐĂNG NHẬP VÀO HỆ THỐNG' : 'ĐĂNG KÝ TÀI KHOẢN HỌC VIÊN'}
                </button>
              </form>
            </div>

            {/* Quick Credential Pre-fill Helpers */}
            <div className="mt-8 pt-5 border-t border-slate-100 dark:border-slate-800 text-[11px] text-slate-500 dark:text-slate-400">
              <p className="font-bold text-slate-700 dark:text-slate-300 mb-2">⚡ Chọn nhanh tài khoản có sẵn để trải nghiệm:</p>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setAuthMode('login');
                    setAuthForm({ username: 'hocsinh_01', password: '123456', fullName: '' });
                  }}
                  className="px-3 py-2 bg-indigo-50 dark:bg-indigo-500/15 hover:bg-indigo-100 dark:hover:bg-indigo-500/25 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-500/30 rounded-xl transition font-semibold text-left"
                >
                  <span className="block font-extrabold text-indigo-900 dark:text-indigo-200">🎓 Học sinh mẫu</span>
                  <span className="font-mono text-[10px]">hocsinh_01 / 123456</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setAuthMode('login');
                    setAuthForm({ username: 'teacher_ielts', password: '123456', fullName: '' });
                  }}
                  className="px-3 py-2 bg-amber-50 dark:bg-amber-500/15 hover:bg-amber-100 dark:hover:bg-amber-500/25 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-500/30 rounded-xl transition font-semibold text-left"
                >
                  <span className="block font-extrabold text-amber-900 dark:text-amber-200">👩‍🏫 TK Giáo viên</span>
                  <span className="font-mono text-[10px]">teacher_ielts / 123456</span>
                </button>
              </div>
              <p className="text-[10px] text-slate-400 mt-2 italic">
                * Lưu ý: Khi đăng nhập bằng tài khoản Giáo viên, hệ thống sẽ tự động chuyển thẳng sang giao diện Quản trị Giáo viên.
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="text-center py-2 text-xs text-slate-500 dark:text-slate-400 font-medium z-10">
        LexiPrep Academy • Hệ thống Luyện thi & Khảo thí IELTS Trực tuyến • © 2026
      </div>
    </div>
  );

  // ==========================================
  // RENDER STUDENT HOME PAGE (EDUCATIONAL DASHBOARD)
  // ==========================================
  const renderStudentHome = () => {
    const studentAttempts = attempts.filter(a => a.studentId === currentUser?.username);

    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        {/* Hero Welcome Banner */}
        <div className="bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 rounded-3xl p-6 sm:p-10 text-white shadow-xl mb-8 border border-slate-800 relative overflow-hidden">
          <div className="max-w-2xl z-10 relative">
            <div className="inline-flex items-center gap-2 bg-blue-500/20 text-cyan-300 border border-blue-400/30 px-3.5 py-1 rounded-full text-xs font-bold mb-3 backdrop-blur">
              <Sparkles className="w-3.5 h-3.5 text-amber-300" /> Trung Tâm Luyện Thi Toàn Diện
            </div>
            <h1 className="text-2xl sm:text-4xl font-extrabold mb-3 tracking-tight">
              Xin chào, {currentUser?.name || 'Học viên'}! 👋
            </h1>
            <p className="text-slate-300 text-xs sm:text-sm leading-relaxed mb-6">
              Bạn đang ở chế độ làm bài thi thử chuẩn <b>Computer-Delivered IELTS</b>. Hệ thống hỗ trợ chia đôi màn hình, highlight đoạn văn, đếm từ tự động và tích hợp sẵn <b>AI Examiner</b> chấm điểm Writing tức thì!
            </p>

            <div className="flex flex-wrap items-center gap-3">
              <button
                onClick={() => {
                  setSelectedProfileStudent(currentUser?.username);
                  setView('STUDENT_PROFILE');
                }}
                className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs px-5 py-2.5 rounded-xl shadow-lg transition flex items-center gap-2 active:scale-95"
              >
                <GraduationCap className="w-4 h-4 text-cyan-300" /> Xem Hồ Sơ & Lịch Sử Thi
              </button>
              <button
                onClick={() => {
                  initGameCampaign(currentRoomPin, currentUser);
                  setView('GAME_ARENA');
                }}
                className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white font-bold text-xs px-5 py-2.5 rounded-xl shadow-lg transition flex items-center gap-2 active:scale-95"
              >
                <Gamepad2 className="w-4 h-4" /> Đấu Trường Game (3 Vòng)
              </button>
              <button
                onClick={() => {
                  if (tests.length > 0) startExam(tests[0].id);
                }}
                className="bg-white/10 hover:bg-white/20 text-white border border-white/20 font-bold text-xs px-4 py-2.5 rounded-xl transition flex items-center gap-2 backdrop-blur"
              >
                <Play className="w-4 h-4 fill-white" /> Thi Thử Ngay (Test 01)
              </button>
            </div>
          </div>
        </div>

        {/* Quick Stat Highlights */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 border border-slate-200/80 dark:border-slate-800 shadow-sm flex items-center gap-3">
            <div className="p-3 bg-blue-50 dark:bg-blue-500/15 text-blue-600 dark:text-blue-400 rounded-xl">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 font-semibold uppercase">Bài thi đã làm</p>
              <p className="text-xl font-extrabold text-slate-900 dark:text-white">{studentAttempts.length}</p>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 border border-slate-200/80 dark:border-slate-800 shadow-sm flex items-center gap-3">
            <div className="p-3 bg-emerald-50 dark:bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 rounded-xl">
              <Award className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 font-semibold uppercase">Band điểm cao nhất</p>
              <p className="text-xl font-extrabold text-emerald-600 dark:text-emerald-400">
                {studentAttempts.length > 0
                  ? Math.max(...studentAttempts.map(a => a.overallBand || 0)) || 'Chờ chấm'
                  : '8.5'}
              </p>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 border border-slate-200/80 dark:border-slate-800 shadow-sm flex items-center gap-3">
            <div className="p-3 bg-purple-50 dark:bg-purple-500/15 text-purple-600 dark:text-purple-400 rounded-xl">
              <Gamepad2 className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 font-semibold uppercase">Phòng Game PIN</p>
              <p className="text-xl font-extrabold text-purple-600 dark:text-purple-400 font-mono">{currentRoomPin}</p>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 border border-slate-200/80 dark:border-slate-800 shadow-sm flex items-center gap-3">
            <div className="p-3 bg-amber-50 dark:bg-amber-500/15 text-amber-600 dark:text-amber-400 rounded-xl">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 font-semibold uppercase">AI Chấm Điểm</p>
              <p className="text-xl font-extrabold text-amber-600 dark:text-amber-400">Sẵn sàng</p>
            </div>
          </div>
        </div>

        {/* Available Tests List */}
        <div className="mb-10">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              Danh Sách Đề Thi Khả Dụng
            </h2>
            <span className="text-xs text-slate-500 dark:text-slate-400">Chuẩn hóa cấu trúc Cambridge & IDP</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {tests.map(test => (
              <div key={test.id} className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200/80 dark:border-slate-800 p-6 flex flex-col justify-between hover:shadow-md transition">
                <div>
                  <div className="flex justify-between items-start mb-3">
                    <span className="bg-blue-50 dark:bg-blue-500/15 text-blue-700 dark:text-blue-300 text-[11px] font-bold px-2.5 py-1 rounded-md border border-blue-100 dark:border-blue-500/30">
                      Academic Full Mock
                    </span>
                    <span className="text-xs text-slate-400 font-medium">{test.createdAt}</span>
                  </div>
                  <h3 className="font-bold text-slate-900 dark:text-white text-base mb-2 leading-snug">{test.title}</h3>
                  <p className="text-slate-600 dark:text-slate-400 text-xs mb-4 line-clamp-2 leading-relaxed">{test.description}</p>

                  <div className="grid grid-cols-3 gap-2 py-3 border-y border-slate-100 dark:border-slate-800 text-xs text-slate-500 dark:text-slate-400 mb-4 text-center">
                    <div>
                      <p className="text-[10px] text-slate-400 uppercase font-semibold">Listening</p>
                      <p className="font-bold text-slate-800 dark:text-slate-100">{test.listening?.questions?.length || 0} câu</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-slate-400 uppercase font-semibold">Reading</p>
                      <p className="font-bold text-slate-800 dark:text-slate-100">{test.reading?.questions?.length || 0} câu</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-slate-400 uppercase font-semibold">Writing</p>
                      <p className="font-bold text-slate-800 dark:text-slate-100">2 Tasks (AI)</p>
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => startExam(test.id)}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2.5 rounded-xl text-xs transition flex items-center justify-center gap-2 shadow-sm"
                >
                  <Play className="w-3.5 h-3.5 fill-white" />
                  Bắt Đầu Làm Bài Thi
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Student Attempts & AI Report History */}
        <div>
          <div className="flex items-center justify-between mb-4 gap-3 flex-wrap">
            <h2 className="text-lg font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
              <Award className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
              Lịch Sử Làm Bài & Báo Cáo AI Examiner
            </h2>
            <button
              onClick={() => {
                setSelectedProfileStudent(currentUser?.username);
                setView('STUDENT_PROFILE');
              }}
              className="text-xs font-bold text-blue-600 dark:text-blue-300 hover:text-blue-800 dark:hover:text-blue-200 flex items-center gap-1.5 transition bg-blue-50 dark:bg-blue-500/15 hover:bg-blue-100 dark:hover:bg-blue-500/25 px-3 py-1.5 rounded-lg border border-blue-200 dark:border-blue-500/30"
            >
              <TrendingUp className="w-4 h-4" /> Xem Tiến Trình & Hồ Sơ Toàn Diện →
            </button>
          </div>

          {studentAttempts.length === 0 ? (
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-8 text-center text-slate-500 dark:text-slate-400 text-xs">
              Bạn chưa tham gia bài thi nào. Hãy chọn một đề thi ở trên để bắt đầu!
            </div>
          ) : (
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm text-slate-600 dark:text-slate-300">
                  <thead className="bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-700 text-xs text-slate-500 dark:text-slate-400 uppercase">
                    <tr>
                      <th className="px-6 py-3.5">Tên Bài Thi</th>
                      <th className="px-6 py-3.5">Thời Gian Nộp</th>
                      <th className="px-6 py-3.5 text-center">Listening</th>
                      <th className="px-6 py-3.5 text-center">Reading</th>
                      <th className="px-6 py-3.5 text-center">Writing</th>
                      <th className="px-6 py-3.5 text-center">Band Overall</th>
                      <th className="px-6 py-3.5 text-right">Thao Tác</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {studentAttempts.map(att => (
                      <tr key={att.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition">
                        <td className="px-6 py-4 font-bold text-slate-900 dark:text-white">{att.testTitle}</td>
                        <td className="px-6 py-4 text-xs text-slate-500 dark:text-slate-400">{att.submittedAt}</td>
                        <td className="px-6 py-4 text-center font-bold text-slate-800 dark:text-slate-100">
                          {att.scores.listening.band !== null ? att.scores.listening.band : '-'}
                        </td>
                        <td className="px-6 py-4 text-center font-bold text-slate-800 dark:text-slate-100">
                          {att.scores.reading.band !== null ? att.scores.reading.band : '-'}
                        </td>
                        <td className="px-6 py-4 text-center">
                          {att.teacherGraded ? (
                            <span className="font-bold text-slate-800 dark:text-slate-100 inline-flex items-center gap-1">
                              {att.aiGraded && <Sparkles className="w-3.5 h-3.5 text-indigo-500 dark:text-indigo-400" title="Đã chấm bằng AI" />}
                              {att.scores.writing.overallBand}
                            </span>
                          ) : (
                            <span className="text-xs bg-amber-50 dark:bg-amber-500/15 text-amber-700 dark:text-amber-300 px-2 py-0.5 rounded border border-amber-200 dark:border-amber-500/30">Chờ chấm</span>
                          )}
                        </td>
                        <td className="px-6 py-4 text-center">
                          {att.overallBand ? (
                            <span className="text-sm font-extrabold text-blue-600 dark:text-blue-300 bg-blue-50 dark:bg-blue-500/15 px-2.5 py-1 rounded-lg">
                              {att.overallBand}
                            </span>
                          ) : (
                            <span className="text-xs text-slate-400">Đang chấm</span>
                          )}
                        </td>
                        <td className="px-6 py-4 text-right">
                          <button
                            onClick={() => {
                              setSelectedAttemptId(att.id);
                              setPreviousView('HOME');
                              setView('RESULT_VIEW');
                            }}
                            className="bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs px-3 py-1.5 rounded-lg font-semibold transition"
                          >
                            Chi Tiết & AI
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  };

  // ==========================================
  // RENDER GAME ARENA VIEW (CHICKEN INVADERS 3 ROUNDS)
  // ==========================================
  const renderGameArena = () => {
    const isTeacher = currentUser?.role === 'teacher';
    const room = roomsDb[currentRoomPin] || { pin: currentRoomPin, pass: 'ielts', players: {} };
    const leaderboardPlayers = Object.values(room.players || {}).sort((a, b) => b.score - a.score);
    const timePct = Math.max(0, Math.min(100, (gameTimeLeft / Math.max(1, gameTimeLimit)) * 100));
    const isLowTime = gameTimeLeft <= 5;
    const isMidTime = gameTimeLeft <= 10 && gameTimeLeft > 5;
    const exitGame = () => {
      clearTimeout(autoNextTimerRef.current);
      clearInterval(wordTimerRef.current);
      setView(isTeacher ? 'TEACHER_DASHBOARD' : 'HOME');
    };

    const passedWordsCount = gameReviewLog.filter(i => i.passed).length;

    return (
      <div className="h-[100dvh] w-full overflow-hidden bg-slate-950 text-white flex flex-col select-none">
        {/* Game Navigation Header */}
        <header className="shrink-0 bg-slate-900 border-b border-slate-800 px-3 sm:px-4 py-2 flex items-center justify-between text-xs flex-wrap gap-2 z-30">
          <div className="flex items-center gap-2 sm:gap-3">
            <button
              onClick={exitGame}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 font-bold transition"
            >
              <ChevronLeft className="w-4 h-4" /> Thoát Game
            </button>
            <span className="bg-purple-500/20 text-purple-300 border border-purple-500/40 px-2.5 py-1 rounded-full font-bold">
              🔑 Phòng: {currentRoomPin}
            </span>
            <span className="hidden sm:inline-flex bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 px-2.5 py-1 rounded-full font-bold">
              👤 {currentUser?.name || currentUser?.username}
            </span>
          </div>

          {/* Teacher Sandbox Controls */}
          {isTeacher && (
            <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
              <span className="text-slate-400 font-bold hidden sm:inline">⚡ GV Sandbox:</span>
              <button
                onClick={() => jumpToGameSandboxRound(1)}
                className={`px-2.5 py-1 rounded font-bold transition ${gameRound === 1 ? 'bg-cyan-500 text-slate-950' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'}`}
              >
                🛸 Màn 1
              </button>
              <button
                onClick={() => jumpToGameSandboxRound(2)}
                className={`px-2.5 py-1 rounded font-bold transition ${gameRound === 2 ? 'bg-amber-500 text-slate-950' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'}`}
              >
                ⌨️ Màn 2
              </button>
              <button
                onClick={() => jumpToGameSandboxRound(3)}
                className={`px-2.5 py-1 rounded font-bold transition ${gameRound === 3 ? 'bg-pink-500 text-white' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'}`}
              >
                👑 Màn 3
              </button>
              <button
                onClick={() => setShowVocabModal(true)}
                className="bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 px-2.5 py-1 rounded font-bold transition"
              >
                📝 Sửa Kho Từ
              </button>
            </div>
          )}
        </header>

        {/* HUD In-Game Bar */}
        <div className="shrink-0 w-full max-w-4xl mx-auto px-2 sm:px-0 pt-2 z-20">
          <div className="bg-slate-900/95 border border-slate-800 p-3 sm:p-3.5 rounded-2xl shadow-lg">
            <div className="flex items-center justify-between font-bold text-xs sm:text-sm gap-2 flex-wrap mb-2">
              <div className="flex items-center gap-2 flex-wrap">
                <span className={`px-2.5 py-1 rounded-lg text-white font-extrabold text-[11px] sm:text-xs ${
                  gameRound === 1 ? 'bg-gradient-to-r from-blue-600 to-cyan-500' : gameRound === 2 ? 'bg-gradient-to-r from-amber-600 to-orange-500' : 'bg-gradient-to-r from-pink-600 to-purple-600'
                }`}>
                  {gameRound === 1 ? '🛸 VÒNG 1/3: NHẬN DIỆN' : gameRound === 2 ? '⌨️ VÒNG 2/3: GÕ TỪ KHUYẾT' : '👑 VÒNG 3/3: BOSS IPA'}
                </span>
                <span className="bg-slate-800 px-2 py-1 rounded-lg text-slate-300 text-xs">
                  Từ: {gameWordIdx + 1}/{gameQueues[gameRound]?.length || 1}
                </span>
                <span className="text-rose-500 text-sm tracking-wide" title={`Còn ${gameLives} mạng`}>
                  {gameLives > 0 ? '❤️'.repeat(gameLives) : '💀'}
                </span>
              </div>

              <div className="flex items-center gap-2 sm:gap-3">
                <span
                  className={`px-2.5 py-1 rounded-lg font-mono font-extrabold text-xs flex items-center gap-1 border ${
                    isLowTime
                      ? 'bg-rose-500/20 text-rose-300 border-rose-500/50 animate-pulse'
                      : isMidTime
                      ? 'bg-amber-500/20 text-amber-300 border-amber-500/50'
                      : 'bg-cyan-500/15 text-cyan-300 border-cyan-500/30'
                  }`}
                >
                  <Clock className="w-3.5 h-3.5" /> {gameTimeLeft}s
                </span>
                <span className="text-amber-400 font-extrabold text-xs sm:text-sm">🔥 {gameCombo}</span>
                <span className="text-cyan-400 font-extrabold text-xs sm:text-sm">Điểm: {gameScore}</span>
              </div>
            </div>

            {/* Time Limit Progress Bar */}
            <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden mb-2.5">
              <div
                className={`h-full transition-all duration-100 ${
                  isLowTime ? 'bg-rose-500' : isMidTime ? 'bg-amber-400' : 'bg-cyan-400'
                }`}
                style={{ width: `${timePct}%` }}
              />
            </div>

            {/* Active Question Prompt */}
            {activeQuestion && (
              <div className="bg-slate-950/85 px-3 py-2.5 rounded-xl border border-slate-800 text-center">
                <div className="flex justify-center items-center gap-2 flex-wrap mb-1">
                  <span className="text-[10px] text-cyan-400 uppercase font-bold tracking-wider">
                    {gameRound === 1
                      ? `Di chuyển & bắn gà đúng (${gameTimeLimit}s)`
                      : `Nghe & gõ đủ từ trước khi Boss chạm tàu (${gameTimeLimit}s)`}
                  </span>
                  <button
                    onClick={() => speakWord(activeQuestion.word)}
                    className="bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 px-2.5 py-0.5 rounded text-[11px] font-bold flex items-center gap-1 transition"
                  >
                    <Volume2 className="w-3.5 h-3.5" /> Nghe (TAB)
                  </button>
                  {(gameRound === 2 || gameRound === 3) && (
                    <>
                      <button
                        onClick={handleGameHint}
                        className="bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 px-2.5 py-0.5 rounded text-[11px] font-bold flex items-center gap-1 transition"
                      >
                        <Lightbulb className="w-3 h-3" /> Gợi ý (-15đ)
                      </button>
                      <button
                        onClick={() => setShowMobileKeyboard(v => !v)}
                        className="bg-slate-800 hover:bg-slate-700 text-slate-300 px-2 py-0.5 rounded text-[11px] font-bold transition"
                      >
                        ⌨️ {showMobileKeyboard ? 'Ẩn phím' : 'Phím ảo'}
                      </button>
                    </>
                  )}
                </div>

                <p className="text-sm sm:text-base font-bold text-white leading-snug">
                  {activeQuestion.prompt}
                </p>

                {(gameRound === 2 || gameRound === 3) && (
                  <p className="text-[11px] sm:text-xs text-amber-300 font-mono mt-0.5">
                    Phiên âm: {activeQuestion.ipa || 'N/A'} • {activeQuestion.word.length} ký tự (Bắt đầu: "{activeQuestion.word[0]}")
                  </p>
                )}

                {/* Typing Character Boxes for Round 2 & Round 3 */}
                {(gameRound === 2 || gameRound === 3) && (
                  <div className="flex justify-center gap-1 sm:gap-1.5 mt-2 flex-wrap">
                    {activeQuestion.word.toUpperCase().split('').map((char, cIdx) => {
                      const isAlpha = /^[A-Z]$/.test(char);
                      const isTyped = cIdx < gameTypedProgress || !isAlpha;
                      const isCurrent = cIdx === gameTypedProgress;
                      const displayChar = isTyped
                        ? char
                        : (gameRound === 2 && cIdx % 2 === 0 ? char : '_');

                      return (
                        <div
                          key={cIdx}
                          className={`w-7 h-8 sm:w-8 sm:h-9 rounded-lg flex items-center justify-center font-mono font-bold text-sm sm:text-base transition-all ${
                            isTyped
                              ? 'bg-emerald-500 text-slate-950 border border-emerald-400 scale-105'
                              : isCurrent
                              ? 'bg-slate-800 text-white border-2 border-amber-400 shadow-md'
                              : 'bg-slate-900 text-slate-400 border border-slate-700'
                          }`}
                        >
                          {displayChar}
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* Optional On-Screen Keyboard for Touch / Mobile Users */}
                {(gameRound === 2 || gameRound === 3) && showMobileKeyboard && gameSubState === 'PLAYING' && (
                  <div className="mt-2.5 space-y-1">
                    {['QWERTYUIOP', 'ASDFGHJKL', 'ZXCVBNM'].map(rowStr => (
                      <div key={rowStr} className="flex justify-center gap-1">
                        {rowStr.split('').map(letter => (
                          <button
                            key={letter}
                            type="button"
                            onClick={() => handleGameTypingInput(letter)}
                            className="px-2 py-1.5 min-w-[26px] sm:min-w-[32px] bg-slate-800 hover:bg-cyan-500 hover:text-slate-950 text-white font-mono font-bold text-xs rounded border border-slate-700 transition active:scale-95"
                          >
                            {letter}
                          </button>
                        ))}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Game Canvas Container — locked to exact remaining viewport height */}
        <div className="flex-1 min-h-0 w-full max-w-4xl mx-auto px-2 sm:px-0 py-1.5">
          <div className="relative w-full h-full rounded-2xl border border-slate-800 bg-slate-950 overflow-hidden shadow-2xl">
            <canvas ref={canvasRef} className="absolute inset-0 w-full h-full cursor-crosshair block touch-none" />

            {/* Feedback Toast Overlay */}
            {gameToast.visible && (
              <div className={`absolute bottom-4 left-1/2 -translate-x-1/2 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold shadow-2xl transition-all border z-30 max-w-[90%] text-center ${
                gameToast.isSuccess ? 'bg-emerald-600/95 text-white border-emerald-400' : 'bg-rose-600/95 text-white border-rose-400'
              }`}>
                {gameToast.text}
              </div>
            )}

            {/* Round Transition Screen */}
            {gameSubState === 'TRANSITION' && (
              <div className="absolute inset-0 bg-slate-950/95 backdrop-blur-md flex flex-col items-center justify-center p-6 text-center z-40">
                <h2 className="text-xl sm:text-2xl font-extrabold text-amber-400 mb-2">🎉 HOÀN THÀNH VÒNG {gameRound}/3!</h2>
                <p className="text-xs sm:text-sm text-slate-300 max-w-md mb-3 leading-relaxed">
                  Chuẩn bị bước sang <b>Vòng {gameRound + 1}</b> với <b>bộ từ vựng hoàn toàn mới</b> (giới hạn {GAME_ROUND_TIME_LIMITS[gameRound + 1] || 25} giây/từ)!
                </p>
                <p className="text-xs font-mono text-cyan-300 mb-5">
                  Tự động bắt đầu sau {transitionCountdown} giây...
                </p>
                <button
                  onClick={advanceNextGameRound}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold px-6 py-3 rounded-xl transition shadow-lg"
                >
                  VÀO NGAY VÒNG TIẾP THEO ➔
                </button>
              </div>
            )}

            {/* Game Over & Review Summary */}
            {gameSubState === 'GAMEOVER' && (
              <div className="absolute inset-0 bg-slate-950/95 backdrop-blur-md flex flex-col items-center justify-center p-4 sm:p-6 text-center z-40 overflow-y-auto">
                <h2 className={`text-xl sm:text-2xl font-extrabold mb-1 ${
                  gameOutcome === 'LOST' ? 'text-rose-400' : 'text-cyan-300'
                }`}>
                  {gameOutcome === 'LOST'
                    ? `💀 HẾT MẠNG TẠI VÒNG ${gameRound}`
                    : isSandboxRound
                    ? `🏆 HOÀN THÀNH MÀN ${gameRound} (GV)`
                    : '🏆 TỔNG KẾT KẾT QUẢ ĐẤU TRƯỜNG'}
                </h2>
                <p className="text-xs text-slate-300 mb-4">
                  Điểm số: <b className="text-amber-400 text-base">{gameScore} điểm</b> • Đạt: <b className="text-emerald-400">{passedWordsCount}/{gameReviewLog.length} từ</b> • Đã lưu vào Bảng Xếp Hạng!
                </p>

                {/* Review List of Words */}
                <div className="max-w-xl w-full max-h-48 sm:max-h-56 overflow-y-auto bg-slate-900 border border-slate-800 rounded-xl p-3.5 text-left space-y-2 mb-4 text-xs">
                  {gameReviewLog.length === 0 ? (
                    <p className="text-slate-400 text-center py-4">Chưa có từ vựng nào được ghi nhận.</p>
                  ) : (
                    gameReviewLog.map((item, idx) => (
                      <div key={idx} className="border-b border-slate-800 pb-2 last:border-b-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-[10px] bg-slate-800 text-slate-400 px-1.5 py-0.5 rounded font-bold">V{item.round}</span>
                          <span className={item.passed ? 'text-emerald-400 font-bold' : 'text-rose-400 font-bold'}>
                            {item.passed ? '✅ Đạt' : '⚠️ Cần ôn'}
                          </span>
                          <b className="text-cyan-300">{item.word}</b>
                          <span className="text-slate-400 font-mono">{item.ipa}</span>
                        </div>
                        <p className="text-slate-300 mt-0.5">{item.prompt}</p>
                        <p className="text-[11px] text-slate-500 italic mt-0.5">"{item.example}"</p>
                      </div>
                    ))
                  )}
                </div>

                <div className="flex gap-3 flex-wrap justify-center">
                  <button
                    onClick={() => initGameCampaign(currentRoomPin, currentUser)}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-5 py-2.5 rounded-xl transition shadow"
                  >
                    🔄 Chơi Lại Lượt Mới
                  </button>
                  <button
                    onClick={exitGame}
                    className="bg-slate-800 hover:bg-slate-700 text-white font-bold px-4 py-2.5 rounded-xl transition border border-slate-700"
                  >
                    🏠 Về Trang Chủ
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Live Leaderboard Footer */}
        <div className="shrink-0 w-full bg-slate-900 border-t border-slate-800">
          <div className="max-w-4xl mx-auto px-4 py-2 flex items-center justify-between text-[11px] sm:text-xs text-slate-400 gap-2 flex-wrap">
            <span className="truncate">
              Top: {leaderboardPlayers.slice(0, 3).map((p, i) => `${i + 1}. ${p.name} (${p.score}đ)`).join(' • ') || 'Chưa có điểm'}
            </span>
            <span className="font-mono text-cyan-400">
              {gameRound === 1 ? 'Chuột / ← → để lái • Click / Space để bắn • [TAB] Nghe' : '[TAB] Nghe lại • [1] Gợi ý • Gõ bàn phím'}
            </span>
          </div>
        </div>
      </div>
    );
  };

  // ==========================================
  // RENDER EXAM MODE (CD-IELTS AUTHENTIC SPLIT)
  // ==========================================
  const renderExamMode = () => {
    const activeTest = tests.find(t => t.id === selectedTestId);
    if (!activeTest) return null;

    const formatTime = (seconds) => {
      const m = Math.floor(seconds / 60);
      const s = seconds % 60;
      return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    };

    return (
      <div className="min-h-screen bg-slate-100 dark:bg-slate-950 flex flex-col justify-between select-none">
        {/* Exam Header */}
        <header className="bg-slate-900 dark:bg-slate-950 text-white px-4 sm:px-6 py-3 flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 shadow sticky top-0 z-50">
          <div className="flex items-center gap-4">
            <h2 className="font-bold text-sm md:text-base text-slate-100">{activeTest.title}</h2>
            <span className="text-xs bg-slate-800 text-slate-300 px-2.5 py-1 rounded border border-slate-700 uppercase">
              Kỹ Năng: {examState.skill}
            </span>
          </div>

          {/* Skill Selector Tabs */}
          <div className="flex bg-slate-800 p-1 rounded-lg text-xs">
            <button
              onClick={() => setExamState(prev => ({ ...prev, skill: 'listening' }))}
              className={`px-3 py-1.5 rounded-md font-medium flex items-center gap-1.5 transition ${
                examState.skill === 'listening' ? 'bg-blue-600 text-white shadow' : 'text-slate-400 hover:text-white'
              }`}
            >
              <Headphones className="w-3.5 h-3.5" /> Listening
            </button>
            <button
              onClick={() => setExamState(prev => ({ ...prev, skill: 'reading' }))}
              className={`px-3 py-1.5 rounded-md font-medium flex items-center gap-1.5 transition ${
                examState.skill === 'reading' ? 'bg-blue-600 text-white shadow' : 'text-slate-400 hover:text-white'
              }`}
            >
              <BookOpen className="w-3.5 h-3.5" /> Reading
            </button>
            <button
              onClick={() => setExamState(prev => ({ ...prev, skill: 'writing' }))}
              className={`px-3 py-1.5 rounded-md font-medium flex items-center gap-1.5 transition ${
                examState.skill === 'writing' ? 'bg-blue-600 text-white shadow' : 'text-slate-400 hover:text-white'
              }`}
            >
              <PenTool className="w-3.5 h-3.5" /> Writing
            </button>
          </div>

          <div className="flex items-center gap-3 sm:gap-4">
            <button
              type="button"
              onClick={() => setDarkMode(d => !d)}
              className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition"
              title={darkMode ? 'Chế độ Sáng' : 'Chế độ Tối'}
              aria-label={darkMode ? 'Chế độ Sáng' : 'Chế độ Tối'}
            >
              {darkMode ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-slate-300" />}
            </button>

            <div className="flex items-center gap-2 text-amber-400 font-mono font-bold text-lg bg-slate-800 px-3 py-1 rounded-lg border border-slate-700">
              <Clock className="w-4 h-4 text-amber-400 animate-pulse" />
              <span>{formatTime(examState.timeRemaining)}</span>
            </div>

            <button
              onClick={handleFinalExamSubmit}
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs px-4 py-2 rounded-lg transition shadow"
            >
              Nộp Bài Thi (Finish)
            </button>
          </div>
        </header>

        {/* Exam Body */}
        <main className="flex-1 max-w-[1600px] w-full mx-auto p-4 overflow-hidden">
          {/* Listening */}
          {examState.skill === 'listening' && (
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm h-full flex flex-col justify-between">
              <div>
                <div className="bg-slate-50 dark:bg-slate-800/70 rounded-xl p-4 border border-slate-200 dark:border-slate-700 mb-6 flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <h3 className="font-bold text-slate-800 dark:text-white text-base flex items-center gap-2">
                      <Headphones className="w-5 h-5 text-blue-600 dark:text-blue-400" /> Listening Audio (Chuẩn No-Rewind IDP)
                    </h3>
                    <div className="flex flex-wrap items-center gap-3 mt-1">
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        Giới hạn nghe tối đa: <span className="font-bold text-slate-700 dark:text-slate-200">{activeTest.maxAudioPlays} lần</span>.
                      </p>
                      {activeTest.listening?.audioFileName && (
                        <span className="text-[11px] bg-blue-50 dark:bg-blue-500/15 text-blue-700 dark:text-blue-300 font-semibold px-2.5 py-0.5 rounded-full border border-blue-200 dark:border-blue-500/30">
                          🎵 File Audio: {activeTest.listening.audioFileName}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <span className="text-xs text-slate-600 dark:text-slate-300 bg-slate-200 dark:bg-slate-700 px-2.5 py-1 rounded font-mono font-bold">
                      Đã phát: {examState.audioPlays['mainAudio'] || 0} / {activeTest.maxAudioPlays}
                    </span>

                    <button
                      onClick={() => handlePlayListeningAudio('mainAudio', activeTest.listening?.transcript)}
                      disabled={(examState.audioPlays['mainAudio'] || 0) >= activeTest.maxAudioPlays || isPlayingAudio}
                      className={`px-4 py-2 rounded-lg text-xs font-bold flex items-center gap-2 transition ${
                        (examState.audioPlays['mainAudio'] || 0) >= activeTest.maxAudioPlays
                          ? 'bg-slate-300 dark:bg-slate-700 text-slate-500 dark:text-slate-400 cursor-not-allowed'
                          : isPlayingAudio
                          ? 'bg-amber-500 text-white animate-pulse'
                          : 'bg-blue-600 hover:bg-blue-700 text-white shadow'
                      }`}
                    >
                      {isPlayingAudio ? <Volume2 className="w-4 h-4" /> : <Play className="w-4 h-4 fill-white" />}
                      {isPlayingAudio ? 'Đang Phát Audio...' : 'Phát Bài Nghe'}
                    </button>
                  </div>
                </div>

                <div className="space-y-6 max-h-[65vh] overflow-y-auto pr-2">
                  {(activeTest.listening?.questions || []).map(q => (
                    <div key={q.id} className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
                      <p className="font-bold text-slate-800 dark:text-slate-100 text-sm mb-3">{q.question}</p>

                      {(q.type === 'mcq' || q.type === 'tfng') && (
                        <div className="space-y-2">
                          {(q.options || []).map((opt, optIdx) => (
                            <label key={optIdx} className="flex items-start gap-3 p-2.5 rounded-lg hover:bg-white dark:hover:bg-slate-800 cursor-pointer transition border border-transparent hover:border-slate-200 dark:hover:border-slate-700">
                              <input
                                type="radio"
                                name={`q_${q.id}`}
                                value={opt}
                                checked={examState.answers[q.id] === opt}
                                onChange={e => setExamState(prev => ({
                                  ...prev,
                                  answers: { ...prev.answers, [q.id]: e.target.value }
                                }))}
                                className="mt-0.5 text-blue-600 focus:ring-blue-500"
                              />
                              <span className="text-xs text-slate-700 dark:text-slate-200 font-medium">{opt}</span>
                            </label>
                          ))}
                        </div>
                      )}

                      {q.type === 'fill' && (
                        <input
                          type="text"
                          placeholder="Nhập câu trả lời..."
                          value={examState.answers[q.id] || ''}
                          onChange={e => setExamState(prev => ({
                            ...prev,
                            answers: { ...prev.answers, [q.id]: e.target.value }
                          }))}
                          className="w-full max-w-md px-3.5 py-2 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 border border-slate-300 dark:border-slate-700 rounded-lg text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none"
                        />
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Reading */}
          {examState.skill === 'reading' && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 h-[78vh]">
              <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 flex flex-col overflow-hidden shadow-sm">
                <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800 mb-4">
                  <h3 className="font-bold text-slate-900 dark:text-white text-base">{activeTest.reading?.passageTitle}</h3>

                  {selectedPassageText && (
                    <div className="flex items-center gap-1.5 bg-slate-900 text-white px-3 py-1 rounded-full text-xs animate-bounce shadow-lg">
                      <span className="text-[10px] text-slate-300 mr-1">Highlight:</span>
                      <button onClick={() => addHighlight('#fef08a')} className="w-4 h-4 rounded-full bg-yellow-300 hover:scale-110 transition" title="Vàng" />
                      <button onClick={() => addHighlight('#bbf7d0')} className="w-4 h-4 rounded-full bg-emerald-300 hover:scale-110 transition" title="Xanh lá" />
                      <button onClick={addNote} className="ml-2 flex items-center gap-1 bg-slate-800 hover:bg-slate-700 px-2 py-0.5 rounded text-[10px] text-cyan-300">
                        <MessageSquare className="w-3 h-3" /> Ghi chú
                      </button>
                    </div>
                  )}
                </div>

                <div
                  onMouseUp={handlePassageTextSelect}
                  className="flex-1 overflow-y-auto pr-3 text-slate-700 dark:text-slate-200 text-sm leading-relaxed whitespace-pre-line select-text font-serif"
                >
                  {activeTest.reading?.imageUrl && (
                    <div className="mb-4 rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 p-2">
                      <img
                        src={activeTest.reading.imageUrl}
                        alt="Reading Visual Illustration"
                        className="w-full max-h-64 object-contain rounded-lg mx-auto"
                      />
                    </div>
                  )}
                  {activeTest.reading?.passageText}
                </div>

                {(examState.highlights.length > 0 || examState.notes.length > 0) && (
                  <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center gap-2 text-xs overflow-x-auto">
                    <span className="text-slate-400 text-[10px] uppercase font-bold">Đã lưu:</span>
                    {examState.highlights.map(h => (
                      <span key={h.id} style={{ backgroundColor: h.color }} className="px-2 py-0.5 rounded text-[11px] truncate max-w-[120px] text-slate-900">
                        {h.text}
                      </span>
                    ))}
                    {examState.notes.map(n => (
                      <span key={n.id} className="bg-cyan-100 dark:bg-cyan-500/20 text-cyan-900 dark:text-cyan-200 px-2 py-0.5 rounded text-[11px] truncate max-w-[140px] border border-cyan-200 dark:border-cyan-500/30">
                        📝 {n.note}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 flex flex-col overflow-y-auto shadow-sm space-y-6">
                <h3 className="font-bold text-slate-800 dark:text-white text-base border-b border-slate-200 dark:border-slate-800 pb-3">Câu Hỏi Phần Reading</h3>

                {(activeTest.reading?.questions || []).map(q => (
                  <div key={q.id} className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
                    <p className="font-bold text-slate-800 dark:text-slate-100 text-sm mb-3">{q.question}</p>

                    {(q.type === 'mcq' || q.type === 'tfng') && (
                      <div className="space-y-2">
                        {(q.options || []).map((opt, optIdx) => (
                          <label key={optIdx} className="flex items-start gap-3 p-2.5 rounded-lg hover:bg-white dark:hover:bg-slate-800 cursor-pointer transition border border-transparent hover:border-slate-200 dark:hover:border-slate-700">
                            <input
                              type="radio"
                              name={`rq_${q.id}`}
                              value={opt}
                              checked={examState.answers[q.id] === opt}
                              onChange={e => setExamState(prev => ({
                                ...prev,
                                answers: { ...prev.answers, [q.id]: e.target.value }
                              }))}
                              className="mt-0.5 text-blue-600 focus:ring-blue-500"
                            />
                            <span className="text-xs text-slate-700 dark:text-slate-200 font-medium">{opt}</span>
                          </label>
                        ))}
                      </div>
                    )}

                    {q.type === 'fill' && (
                      <input
                        type="text"
                        placeholder="Nhập câu trả lời..."
                        value={examState.answers[q.id] || ''}
                        onChange={e => setExamState(prev => ({
                          ...prev,
                          answers: { ...prev.answers, [q.id]: e.target.value }
                        }))}
                        className="w-full max-w-md px-3.5 py-2 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 border border-slate-300 dark:border-slate-700 rounded-lg text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none"
                      />
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Writing */}
          {examState.skill === 'writing' && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 h-[78vh]">
              {/* Task 1 */}
              <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 flex flex-col justify-between shadow-sm">
                <div>
                  <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800 mb-3">
                    <h3 className="font-bold text-slate-900 dark:text-white text-sm flex items-center gap-2">
                      <PenTool className="w-4 h-4 text-blue-600 dark:text-blue-400" /> Writing Task 1
                    </h3>
                    <span className={`text-xs px-2.5 py-1 rounded-full font-bold ${
                      getWordCount(examState.answers['w1']) >= (activeTest.writing?.task1?.minWords || 150)
                        ? 'bg-emerald-100 dark:bg-emerald-500/20 text-emerald-800 dark:text-emerald-300'
                        : 'bg-amber-100 dark:bg-amber-500/20 text-amber-800 dark:text-amber-300'
                    }`}>
                      {getWordCount(examState.answers['w1'])} / {activeTest.writing?.task1?.minWords || 150} từ
                    </span>
                  </div>

                  <p className="text-xs text-slate-600 dark:text-slate-300 bg-slate-50 dark:bg-slate-800/70 p-3.5 rounded-xl border border-slate-200 dark:border-slate-700 leading-relaxed mb-3">
                    {activeTest.writing?.task1?.prompt}
                  </p>

                  {activeTest.writing?.task1?.imageUrl && (
                    <div className="mb-3 rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 p-2">
                      <img
                        src={activeTest.writing.task1.imageUrl}
                        alt="Writing Task 1 Chart"
                        className="w-full max-h-52 object-contain rounded-lg mx-auto"
                      />
                    </div>
                  )}

                  <textarea
                    rows={12}
                    placeholder="Viết bài Task 1 của bạn ở đây..."
                    value={examState.answers['w1'] || ''}
                    onChange={e => setExamState(prev => ({
                      ...prev,
                      answers: { ...prev.answers, w1: e.target.value }
                    }))}
                    className="w-full p-3.5 text-xs leading-relaxed bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 border border-slate-300 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none font-sans"
                  />
                </div>
              </div>

              {/* Task 2 */}
              <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 flex flex-col justify-between shadow-sm">
                <div>
                  <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800 mb-3">
                    <h3 className="font-bold text-slate-900 dark:text-white text-sm flex items-center gap-2">
                      <PenTool className="w-4 h-4 text-indigo-600 dark:text-indigo-400" /> Writing Task 2
                    </h3>
                    <span className={`text-xs px-2.5 py-1 rounded-full font-bold ${
                      getWordCount(examState.answers['w2']) >= (activeTest.writing?.task2?.minWords || 250)
                        ? 'bg-emerald-100 dark:bg-emerald-500/20 text-emerald-800 dark:text-emerald-300'
                        : 'bg-amber-100 dark:bg-amber-500/20 text-amber-800 dark:text-amber-300'
                    }`}>
                      {getWordCount(examState.answers['w2'])} / {activeTest.writing?.task2?.minWords || 250} từ
                    </span>
                  </div>

                  <p className="text-xs text-slate-600 dark:text-slate-300 bg-slate-50 dark:bg-slate-800/70 p-3.5 rounded-xl border border-slate-200 dark:border-slate-700 leading-relaxed mb-3">
                    {activeTest.writing?.task2?.prompt}
                  </p>

                  <textarea
                    rows={12}
                    placeholder="Viết bài Task 2 của bạn ở đây..."
                    value={examState.answers['w2'] || ''}
                    onChange={e => setExamState(prev => ({
                      ...prev,
                      answers: { ...prev.answers, w2: e.target.value }
                    }))}
                    className="w-full p-3.5 text-xs leading-relaxed bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 border border-slate-300 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none font-sans"
                  />
                </div>
              </div>
            </div>
          )}
        </main>
      </div>
    );
  };

  // ==========================================
  // RENDER RESULT VIEW WITH AI GRADER
  // ==========================================
  const renderResultView = () => {
    const attempt = attempts.find(a => a.id === selectedAttemptId);
    if (!attempt) return null;

    const targetTest = tests.find(t => t.id === attempt.testId) || tests[0];
    const isTeacher = currentUser?.role === 'teacher';
    const isAllowedByTeacher = Boolean(targetTest?.allowViewAnswers);
    const canShowCorrectAnswers = isTeacher || isAllowedByTeacher;

    return (
      <div className="max-w-5xl mx-auto px-4 py-8">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-6">
          <button
            onClick={() => {
              if (previousView === 'STUDENT_PROFILE') {
                setView('STUDENT_PROFILE');
              } else if (previousView === 'TEACHER_DASHBOARD') {
                setView('TEACHER_DASHBOARD');
              } else {
                setView(currentUser?.role === 'teacher' ? 'TEACHER_DASHBOARD' : 'HOME');
              }
            }}
            className="flex items-center gap-2 text-xs font-bold text-slate-600 dark:text-slate-200 hover:text-slate-900 dark:hover:text-white transition bg-white dark:bg-slate-900 px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm"
          >
            <ChevronLeft className="w-4 h-4" /> Quay Lại {previousView === 'STUDENT_PROFILE' ? 'Hồ Sơ Học Sinh' : previousView === 'TEACHER_DASHBOARD' ? 'Bảng Quản Lý Giáo Viên' : 'Trang Chủ'}
          </button>

          {/* Teacher Quick Toggle for Answer Visibility */}
          {isTeacher && targetTest && (
            <div className="flex items-center gap-3 bg-white dark:bg-slate-900 px-4 py-2 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm">
              <span className="text-xs font-bold text-slate-700 dark:text-slate-200">Quyền xem đáp án của học sinh:</span>
              <button
                onClick={() => toggleTestAllowViewAnswers(targetTest.id)}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-extrabold flex items-center gap-1.5 transition shadow-sm ${
                  isAllowedByTeacher
                    ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                    : 'bg-slate-800 hover:bg-slate-900 text-amber-300'
                }`}
              >
                {isAllowedByTeacher ? (
                  <>
                    <Unlock className="w-3.5 h-3.5" /> Đang Cho Phép (Bấm để Khóa)
                  </>
                ) : (
                  <>
                    <Lock className="w-3.5 h-3.5" /> Đang Khóa Đáp Án (Bấm để Mở)
                  </>
                )}
              </button>
            </div>
          )}
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-lg border border-slate-200 dark:border-slate-800 p-8 mb-8">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 pb-6 border-b border-slate-200 dark:border-slate-800">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs bg-emerald-100 dark:bg-emerald-500/20 text-emerald-800 dark:text-emerald-300 font-bold px-3 py-1 rounded-full">
                  Hoàn Thành Bài Thi
                </span>
                {attempt.aiGraded && (
                  <span className="text-xs bg-indigo-100 dark:bg-indigo-500/20 text-indigo-800 dark:text-indigo-300 font-bold px-3 py-1 rounded-full flex items-center gap-1 border border-indigo-200 dark:border-indigo-500/30">
                    <Sparkles className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" /> AI Graded
                  </span>
                )}
              </div>
              <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white mt-2">{attempt.testTitle}</h1>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Thí sinh: <b>{attempt.studentName}</b> • Nộp ngày: {attempt.submittedAt}</p>
            </div>

            <div className="bg-slate-900 dark:bg-slate-800 text-white rounded-2xl p-4 text-center min-w-[150px] shadow border border-slate-800 dark:border-slate-700">
              <p className="text-[10px] text-slate-400 uppercase tracking-widest font-semibold">BAND TỔNG OVERALL</p>
              <p className="text-4xl font-extrabold text-amber-400 mt-1">
                {attempt.overallBand ? attempt.overallBand : 'Chờ Chấm'}
              </p>
            </div>
          </div>

          {/* Breakdown cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 my-8">
            <div className="bg-slate-50 dark:bg-slate-800/60 rounded-2xl p-5 border border-slate-200 dark:border-slate-700">
              <div className="flex items-center justify-between mb-3">
                <span className="font-bold text-slate-800 dark:text-slate-100 text-sm flex items-center gap-2">
                  <Headphones className="w-4 h-4 text-blue-600 dark:text-blue-400" /> Listening
                </span>
                <span className="text-lg font-bold text-blue-600 dark:text-blue-400">{attempt.scores.listening.band}</span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Đúng: <span className="font-bold text-slate-800 dark:text-slate-100">{attempt.scores.listening.raw}</span> / {attempt.scores.listening.total} câu
              </p>
            </div>

            <div className="bg-slate-50 dark:bg-slate-800/60 rounded-2xl p-5 border border-slate-200 dark:border-slate-700">
              <div className="flex items-center justify-between mb-3">
                <span className="font-bold text-slate-800 dark:text-slate-100 text-sm flex items-center gap-2">
                  <BookOpen className="w-4 h-4 text-indigo-600 dark:text-indigo-400" /> Reading
                </span>
                <span className="text-lg font-bold text-indigo-600 dark:text-indigo-400">{attempt.scores.reading.band}</span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Đúng: <span className="font-bold text-slate-800 dark:text-slate-100">{attempt.scores.reading.raw}</span> / {attempt.scores.reading.total} câu
              </p>
            </div>

            <div className="bg-slate-50 dark:bg-slate-800/60 rounded-2xl p-5 border border-slate-200 dark:border-slate-700">
              <div className="flex items-center justify-between mb-3">
                <span className="font-bold text-slate-800 dark:text-slate-100 text-sm flex items-center gap-2">
                  <PenTool className="w-4 h-4 text-emerald-600 dark:text-emerald-400" /> Writing
                </span>
                <span className="text-lg font-bold text-emerald-600 dark:text-emerald-400">
                  {attempt.scores.writing.overallBand ?? 'Chờ Chấm'}
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Task 1: <span className="font-bold text-slate-800 dark:text-slate-100">{attempt.scores.writing.task1Band ?? '-'}</span> | Task 2: <span className="font-bold text-slate-800 dark:text-slate-100">{attempt.scores.writing.task2Band ?? '-'}</span>
              </p>
            </div>
          </div>

          {/* AI WRITING GRADING CARD WITH SPINNER */}
          <div className="bg-gradient-to-r from-blue-50 via-indigo-50 to-purple-50 dark:from-indigo-950/60 dark:via-slate-900 dark:to-purple-950/50 rounded-2xl border border-indigo-100 dark:border-indigo-500/30 p-6 mb-8 shadow-sm">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="bg-indigo-600 text-white text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded-full flex items-center gap-1 shadow-sm">
                    <Sparkles className="w-3 h-3 text-amber-300" /> AI Examiner
                  </span>
                  <h3 className="font-bold text-slate-900 dark:text-white text-base">Hệ Thống Chấm Điểm Writing Tự Động Bằng AI</h3>
                </div>
                <p className="text-xs text-slate-600 dark:text-slate-300 max-w-xl leading-relaxed">
                  Đánh giá tự động theo 4 tiêu chí chuẩn IDP/BC (Task Achievement/Response, Coherence & Cohesion, Lexical Resource, Grammatical Range & Accuracy).
                </p>
              </div>

              <div className="flex items-center gap-2.5">
                <button
                  onClick={() => setShowApiKeyModal(true)}
                  className="px-3 py-2 text-xs font-semibold text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 rounded-lg border border-slate-300 dark:border-slate-700 transition flex items-center gap-1.5 shadow-sm"
                  title="Cài đặt API Key (Gemini)"
                >
                  <Key className="w-3.5 h-3.5 text-amber-500" />
                  <span>{aiApiKey ? 'API Key (Đã lưu)' : 'Cấu hình API Key'}</span>
                </button>

                <button
                  onClick={() => handleGradeWritingWithAI(attempt)}
                  disabled={isGradingAI}
                  className={`px-5 py-2.5 rounded-lg text-xs font-bold transition flex items-center gap-2 shadow-md ${
                    isGradingAI
                      ? 'bg-slate-300 dark:bg-slate-700 text-slate-500 dark:text-slate-400 cursor-not-allowed'
                      : 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white active:scale-95'
                  }`}
                >
                  {isGradingAI ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin text-white" />
                      <span>Đang Chấm Điểm...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4 text-amber-300" />
                      <span>{attempt.scores.writing.overallBand ? 'Chấm Lại Bằng AI' : 'Chấm Điểm Bằng AI Ngay'}</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* AI Grading Loading Spinner View */}
            {isGradingAI && (
              <div className="mt-6 pt-6 border-t border-indigo-200/60 dark:border-indigo-500/30 flex flex-col items-center justify-center py-6 bg-white/80 dark:bg-slate-900/80 backdrop-blur rounded-xl shadow-inner">
                <div className="relative mb-3">
                  <Loader2 className="w-10 h-10 text-indigo-600 dark:text-indigo-400 animate-spin" />
                  <Sparkles className="w-4 h-4 text-amber-400 absolute -top-1 -right-1 animate-pulse" />
                </div>
                <h4 className="font-bold text-sm text-slate-800 dark:text-slate-100 animate-pulse">{aiGradingStep || 'AI Examiner đang tiến hành chấm bài...'}</h4>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Đang phân tích cấu trúc ngữ pháp, từ vựng và tiêu chí chấm điểm IELTS...</p>
              </div>
            )}

            {/* Detailed AI Criteria Breakdown */}
            {attempt.aiDetails && !isGradingAI && (
              <div className="mt-6 pt-6 border-t border-indigo-200/60 dark:border-indigo-500/30 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-indigo-100 dark:border-indigo-500/30 shadow-sm">
                    <div className="flex justify-between items-center mb-2">
                      <span className="font-bold text-xs text-blue-700 dark:text-blue-400 flex items-center gap-1.5">
                        <PenTool className="w-3.5 h-3.5" /> Task 1: Band {attempt.scores.writing.task1Band}
                      </span>
                      <span className="text-[10px] text-slate-400 font-semibold uppercase">4 Tiêu chí IELTS</span>
                    </div>
                    {attempt.aiDetails.task1Criteria && (
                      <div className="grid grid-cols-4 gap-1 text-center py-2 bg-slate-50 dark:bg-slate-800 rounded text-[11px] mb-2 font-mono text-slate-900 dark:text-slate-100">
                        <div><span className="text-[9px] text-slate-400 block font-sans">TA</span><strong>{attempt.aiDetails.task1Criteria.ta}</strong></div>
                        <div><span className="text-[9px] text-slate-400 block font-sans">CC</span><strong>{attempt.aiDetails.task1Criteria.cc}</strong></div>
                        <div><span className="text-[9px] text-slate-400 block font-sans">LR</span><strong>{attempt.aiDetails.task1Criteria.lr}</strong></div>
                        <div><span className="text-[9px] text-slate-400 block font-sans">GRA</span><strong>{attempt.aiDetails.task1Criteria.gra}</strong></div>
                      </div>
                    )}
                    <p className="text-[11px] text-slate-600 dark:text-slate-300 leading-relaxed italic">
                      {attempt.aiDetails.task1Criteria?.comment}
                    </p>
                  </div>

                  <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-indigo-100 dark:border-indigo-500/30 shadow-sm">
                    <div className="flex justify-between items-center mb-2">
                      <span className="font-bold text-xs text-indigo-700 dark:text-indigo-400 flex items-center gap-1.5">
                        <PenTool className="w-3.5 h-3.5" /> Task 2: Band {attempt.scores.writing.task2Band}
                      </span>
                      <span className="text-[10px] text-slate-400 font-semibold uppercase">4 Tiêu chí IELTS</span>
                    </div>
                    {attempt.aiDetails.task2Criteria && (
                      <div className="grid grid-cols-4 gap-1 text-center py-2 bg-slate-50 dark:bg-slate-800 rounded text-[11px] mb-2 font-mono text-slate-900 dark:text-slate-100">
                        <div><span className="text-[9px] text-slate-400 block font-sans">TR</span><strong>{attempt.aiDetails.task2Criteria.tr}</strong></div>
                        <div><span className="text-[9px] text-slate-400 block font-sans">CC</span><strong>{attempt.aiDetails.task2Criteria.cc}</strong></div>
                        <div><span className="text-[9px] text-slate-400 block font-sans">LR</span><strong>{attempt.aiDetails.task2Criteria.lr}</strong></div>
                        <div><span className="text-[9px] text-slate-400 block font-sans">GRA</span><strong>{attempt.aiDetails.task2Criteria.gra}</strong></div>
                      </div>
                    )}
                    <p className="text-[11px] text-slate-600 dark:text-slate-300 leading-relaxed italic">
                      {attempt.aiDetails.task2Criteria?.comment}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Feedback */}
          {attempt.teacherFeedback && (
            <div className="bg-amber-50 dark:bg-amber-500/10 rounded-2xl p-6 border border-amber-200 dark:border-amber-500/30 mb-8">
              <h3 className="font-bold text-amber-900 dark:text-amber-300 text-sm mb-2 flex items-center gap-2">
                <MessageSquare className="w-4 h-4 text-amber-600 dark:text-amber-400" /> {attempt.aiGraded ? 'Nhận Xét Từ AI Examiner' : 'Nhận Xét Từ Giáo Viên'}
              </h3>
              <p className="text-xs text-amber-950 dark:text-amber-100 leading-relaxed whitespace-pre-line font-medium">
                {attempt.teacherFeedback}
              </p>
            </div>
          )}

          {/* QUESTION-BY-QUESTION REVIEW & CORRECT ANSWERS SECTION */}
          <div className="border-t border-slate-200 dark:border-slate-800 pt-8">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
              <div>
                <h3 className="font-extrabold text-slate-900 dark:text-white text-lg flex items-center gap-2">
                  <Eye className="w-5 h-5 text-indigo-600 dark:text-indigo-400" /> Xem Lại Bài Làm & Đáp Án Chi Tiết
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  Đối chiếu câu trả lời đã nộp của thí sinh với đáp án chuẩn của đề thi.
                </p>
              </div>

              {/* Permission status badge */}
              {!isTeacher ? (
                <div className={`px-3.5 py-2 rounded-xl border text-xs font-bold flex items-center gap-2 ${
                  isAllowedByTeacher
                    ? 'bg-emerald-50 dark:bg-emerald-500/15 border-emerald-200 dark:border-emerald-500/30 text-emerald-800 dark:text-emerald-300'
                    : 'bg-amber-50 dark:bg-amber-500/15 border-amber-200 dark:border-amber-500/30 text-amber-800 dark:text-amber-300'
                }`}>
                  {isAllowedByTeacher ? (
                    <>
                      <Unlock className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                      <span>Giáo viên đã cho phép xem đáp án đúng</span>
                    </>
                  ) : (
                    <>
                      <Lock className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                      <span>Đáp án đúng đang khóa (Chờ Giáo viên bật cho phép)</span>
                    </>
                  )}
                </div>
              ) : (
                <div className="px-3.5 py-2 rounded-xl bg-indigo-50 dark:bg-indigo-500/15 border border-indigo-200 dark:border-indigo-500/30 text-indigo-800 dark:text-indigo-300 text-xs font-bold flex items-center gap-2">
                  <Eye className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                  <span>Chế độ Giáo viên: Luôn hiển thị toàn bộ đáp án đúng</span>
                </div>
              )}
            </div>

            {/* Skill Tabs for Review */}
            <div className="flex flex-wrap gap-2 mb-6 bg-slate-100 dark:bg-slate-800 p-1.5 rounded-2xl w-fit border border-slate-200 dark:border-slate-700">
              <button
                onClick={() => setResultReviewTab('listening')}
                className={`px-4 py-2 rounded-xl text-xs font-extrabold flex items-center gap-1.5 transition ${
                  resultReviewTab === 'listening'
                    ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-sm'
                    : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <Headphones className="w-3.5 h-3.5" /> Listening ({targetTest?.listening?.questions?.length || 0} câu)
              </button>
              <button
                onClick={() => setResultReviewTab('reading')}
                className={`px-4 py-2 rounded-xl text-xs font-extrabold flex items-center gap-1.5 transition ${
                  resultReviewTab === 'reading'
                    ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-sm'
                    : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <BookOpen className="w-3.5 h-3.5" /> Reading ({targetTest?.reading?.questions?.length || 0} câu)
              </button>
              <button
                onClick={() => setResultReviewTab('writing')}
                className={`px-4 py-2 rounded-xl text-xs font-extrabold flex items-center gap-1.5 transition ${
                  resultReviewTab === 'writing'
                    ? 'bg-white dark:bg-slate-900 text-emerald-600 dark:text-emerald-400 shadow-sm'
                    : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <PenTool className="w-3.5 h-3.5" /> Writing & Bài Mẫu
              </button>
            </div>

            {/* Listening & Reading Questions Review */}
            {(resultReviewTab === 'listening' || resultReviewTab === 'reading') && (
              <div className="space-y-4">
                {((resultReviewTab === 'listening' ? targetTest?.listening?.questions : targetTest?.reading?.questions) || []).map((q, idx) => {
                  const userAns = (attempt.answers?.[q.id] || '').trim();
                  const correctAns = (q.correctAnswer || '').trim();
                  const isCorrect = userAns.toLowerCase() === correctAns.toLowerCase() && correctAns !== '';

                  return (
                    <div
                      key={q.id}
                      className={`p-5 rounded-2xl border transition ${
                        isCorrect
                          ? 'bg-emerald-50/40 dark:bg-emerald-500/10 border-emerald-200 dark:border-emerald-500/30'
                          : 'bg-rose-50/40 dark:bg-rose-500/10 border-rose-200 dark:border-rose-500/30'
                      }`}
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
                        <span className="font-bold text-slate-900 dark:text-white text-sm">
                          Câu {idx + 1}: {q.question}
                        </span>
                        <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-extrabold w-fit ${
                          isCorrect
                            ? 'bg-emerald-100 dark:bg-emerald-500/20 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-500/40'
                            : 'bg-rose-100 dark:bg-rose-500/20 text-rose-800 dark:text-rose-300 border border-rose-300 dark:border-rose-500/40'
                        }`}>
                          {isCorrect ? (
                            <>
                              <CheckCircle className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" /> Chính xác
                            </>
                          ) : (
                            <>
                              <XCircle className="w-3.5 h-3.5 text-rose-600 dark:text-rose-400" /> Chưa chính xác
                            </>
                          )}
                        </span>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                        {/* Student's Answer */}
                        <div className="bg-white dark:bg-slate-900 p-3.5 rounded-xl border border-slate-200 dark:border-slate-700">
                          <span className="text-[10px] font-bold uppercase text-slate-400 block mb-1">
                            Câu trả lời của thí sinh:
                          </span>
                          <span className={`font-bold ${isCorrect ? 'text-emerald-700 dark:text-emerald-400' : 'text-rose-700 dark:text-rose-400'}`}>
                            {userAns || '(Bỏ trống - Không trả lời)'}
                          </span>
                        </div>

                        {/* Correct Answer (Gated by Teacher Permission) */}
                        {canShowCorrectAnswers ? (
                          <div className="bg-emerald-50/90 dark:bg-emerald-500/15 p-3.5 rounded-xl border border-emerald-200 dark:border-emerald-500/30">
                            <span className="text-[10px] font-bold uppercase text-emerald-700 dark:text-emerald-300 flex items-center gap-1 mb-1">
                              <Unlock className="w-3 h-3" /> Đáp án đúng chuẩn:
                            </span>
                            <span className="font-extrabold text-emerald-900 dark:text-emerald-200">
                              {q.correctAnswer}
                            </span>
                          </div>
                        ) : (
                          <div className="bg-slate-100 dark:bg-slate-800 p-3.5 rounded-xl border border-slate-200 dark:border-slate-700 flex items-center gap-2 text-slate-500 dark:text-slate-400">
                            <Lock className="w-4 h-4 text-amber-600 dark:text-amber-400 flex-shrink-0" />
                            <span className="font-semibold italic">
                              Đáp án đúng đang được bảo mật bởi Giáo viên
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Writing Review & Model Answers */}
            {resultReviewTab === 'writing' && (
              <div className="space-y-6">
                {/* Task 1 */}
                <div className="bg-slate-50 dark:bg-slate-800/60 rounded-2xl p-5 border border-slate-200 dark:border-slate-700 space-y-4">
                  <div>
                    <span className="text-xs font-extrabold uppercase text-blue-600 dark:text-blue-400">Writing Task 1</span>
                    <p className="text-xs text-slate-700 dark:text-slate-200 font-semibold mt-1">{targetTest?.writing?.task1?.prompt}</p>
                    {targetTest?.writing?.task1?.imageUrl && (
                      <img
                        src={targetTest.writing.task1.imageUrl}
                        alt="Task 1 Chart"
                        className="mt-3 max-h-48 rounded-xl border border-slate-200 dark:border-slate-700 object-contain bg-white dark:bg-slate-900 p-2"
                      />
                    )}
                  </div>

                  <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-700">
                    <p className="text-[11px] font-bold text-slate-400 uppercase mb-1.5">
                      Bài làm của thí sinh ({getWordCount(attempt.answers?.w1)} từ):
                    </p>
                    <p className="text-xs text-slate-800 dark:text-slate-100 whitespace-pre-line leading-relaxed">
                      {attempt.answers?.w1 || '(Chưa nộp bài viết Task 1)'}
                    </p>
                  </div>

                  {canShowCorrectAnswers ? (
                    targetTest?.writing?.task1?.modelAnswer ? (
                      <div className="bg-emerald-50/80 dark:bg-emerald-500/15 p-4 rounded-xl border border-emerald-200 dark:border-emerald-500/30">
                        <p className="text-[11px] font-bold text-emerald-800 dark:text-emerald-300 uppercase mb-1.5 flex items-center gap-1.5">
                          <Unlock className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" /> Bài mẫu tham khảo (Model Answer Task 1):
                        </p>
                        <p className="text-xs text-emerald-950 dark:text-emerald-100 whitespace-pre-line leading-relaxed">
                          {targetTest.writing.task1.modelAnswer}
                        </p>
                      </div>
                    ) : null
                  ) : (
                    <div className="bg-slate-100 dark:bg-slate-800 p-3.5 rounded-xl border border-slate-200 dark:border-slate-700 flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                      <Lock className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                      <span className="font-semibold italic">Bài mẫu tham khảo Task 1 đang được khóa bởi Giáo viên.</span>
                    </div>
                  )}
                </div>

                {/* Task 2 */}
                <div className="bg-slate-50 dark:bg-slate-800/60 rounded-2xl p-5 border border-slate-200 dark:border-slate-700 space-y-4">
                  <div>
                    <span className="text-xs font-extrabold uppercase text-indigo-600 dark:text-indigo-400">Writing Task 2</span>
                    <p className="text-xs text-slate-700 dark:text-slate-200 font-semibold mt-1">{targetTest?.writing?.task2?.prompt}</p>
                  </div>

                  <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-700">
                    <p className="text-[11px] font-bold text-slate-400 uppercase mb-1.5">
                      Bài làm của thí sinh ({getWordCount(attempt.answers?.w2)} từ):
                    </p>
                    <p className="text-xs text-slate-800 dark:text-slate-100 whitespace-pre-line leading-relaxed">
                      {attempt.answers?.w2 || '(Chưa nộp bài viết Task 2)'}
                    </p>
                  </div>

                  {canShowCorrectAnswers ? (
                    targetTest?.writing?.task2?.modelAnswer ? (
                      <div className="bg-emerald-50/80 dark:bg-emerald-500/15 p-4 rounded-xl border border-emerald-200 dark:border-emerald-500/30">
                        <p className="text-[11px] font-bold text-emerald-800 dark:text-emerald-300 uppercase mb-1.5 flex items-center gap-1.5">
                          <Unlock className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" /> Bài mẫu tham khảo (Model Answer Task 2):
                        </p>
                        <p className="text-xs text-emerald-950 dark:text-emerald-100 whitespace-pre-line leading-relaxed">
                          {targetTest.writing.task2.modelAnswer}
                        </p>
                      </div>
                    ) : null
                  ) : (
                    <div className="bg-slate-100 dark:bg-slate-800 p-3.5 rounded-xl border border-slate-200 dark:border-slate-700 flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                      <Lock className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                      <span className="font-semibold italic">Bài mẫu tham khảo Task 2 đang được khóa bởi Giáo viên.</span>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  // ==========================================
  // RENDER STUDENT PROFILE & ATTEMPTS HISTORY
  // ==========================================
  const renderStudentProfile = () => {
    const isTeacherViewer = currentUser?.role === 'teacher';
    const activeUsername = selectedProfileStudent || currentUser?.username || 'hocsinh_01';
    const student = usersDb[activeUsername] || {
      username: activeUsername,
      name: activeUsername,
      role: 'student',
      targetBand: 7.5,
      joinedDate: '2026-02-01'
    };

    const studentList = Object.values(usersDb).filter(u => u.role === 'student');
    const studentAttempts = attempts.filter(a => a.studentId === activeUsername);

    // Sort chronologically ascending (oldest to newest) for progression calculations
    const chronologicalAttempts = [...studentAttempts].reverse();
    const totalAttempts = studentAttempts.length;
    const highestBand = totalAttempts > 0 ? Math.max(...studentAttempts.map(a => a.overallBand || 0)) : null;
    const latestAttempt = studentAttempts[0];
    const firstAttempt = chronologicalAttempts[0];
    const bandGrowth = (latestAttempt?.overallBand && firstAttempt?.overallBand && totalAttempts > 1)
      ? (latestAttempt.overallBand - firstAttempt.overallBand).toFixed(1)
      : null;

    const avgListening = totalAttempts > 0
      ? (studentAttempts.reduce((acc, a) => acc + (a.scores.listening.band || 0), 0) / totalAttempts).toFixed(1)
      : null;
    const avgReading = totalAttempts > 0
      ? (studentAttempts.reduce((acc, a) => acc + (a.scores.reading.band || 0), 0) / totalAttempts).toFixed(1)
      : null;
    const avgWriting = totalAttempts > 0
      ? (studentAttempts.reduce((acc, a) => acc + (a.scores.writing.overallBand || 0), 0) / totalAttempts).toFixed(1)
      : null;
    const overallAvg = totalAttempts > 0
      ? (studentAttempts.reduce((acc, a) => acc + (a.overallBand || 0), 0) / totalAttempts).toFixed(1)
      : null;

    const totalTabSwitches = isTeacherViewer
      ? studentAttempts.reduce((acc, a) => acc + (a.tabSwitchCount || 0), 0)
      : 0;
    const avgTabSwitches = isTeacherViewer && totalAttempts > 0
      ? (totalTabSwitches / totalAttempts).toFixed(1)
      : 0;

    // Room score for this student
    const room = roomsDb[currentRoomPin] || { players: {} };
    const playerGameRecord = room.players?.[student.name] || room.players?.[student.username];

    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        {/* Navigation & Header Controls */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
          <button
            onClick={() => {
              if (isTeacherViewer) {
                setView('TEACHER_DASHBOARD');
              } else {
                setView('HOME');
              }
            }}
            className="flex items-center gap-2 text-xs font-bold text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm transition"
          >
            <ChevronLeft className="w-4 h-4" />
            {isTeacherViewer ? 'Quay Lại Bảng Quản Lý Giáo Viên' : 'Quay Lại Bảng Điều Khiển Học Sinh'}
          </button>

          {/* If teacher, allow switching between students */}
          {isTeacherViewer && (
            <div className="flex items-center gap-2 bg-white dark:bg-slate-900 px-3.5 py-1.5 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm">
              <span className="text-xs font-bold text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                <UserCheck className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" /> Chọn Học Viên:
              </span>
              <div className="flex items-center gap-1.5 flex-wrap">
                {studentList.map(s => (
                  <button
                    key={s.username}
                    onClick={() => {
                      setSelectedProfileStudent(s.username);
                      setTempNoteText('');
                    }}
                    className={`px-3 py-1 rounded-xl text-xs font-bold transition ${
                      activeUsername === s.username
                        ? 'bg-indigo-600 text-white shadow-sm'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                    }`}
                  >
                    {s.name}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Profile Hero Card */}
        <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-blue-950 rounded-3xl p-6 sm:p-8 text-white border border-slate-800 shadow-xl mb-8 relative overflow-hidden">
          <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
            <div className="flex items-center gap-5">
              <div className="w-20 h-20 rounded-2xl bg-gradient-to-tr from-indigo-500 via-blue-500 to-cyan-400 text-white font-extrabold text-3xl flex items-center justify-center shadow-lg border-2 border-white/20">
                {student.name ? student.name[0] : 'S'}
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap mb-1.5">
                  <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">{student.name}</h1>
                  <span className="text-xs font-mono bg-indigo-500/30 text-indigo-300 border border-indigo-400/30 px-2.5 py-0.5 rounded-full font-bold">
                    @{student.username}
                  </span>
                  <span className="text-xs bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 px-2.5 py-0.5 rounded-full font-bold flex items-center gap-1">
                    <CheckCircle className="w-3 h-3" /> Học Viên Chính Thức
                  </span>
                </div>
                <div className="flex items-center gap-4 text-xs text-slate-300 flex-wrap">
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5 text-slate-400" /> Ngày gia nhập: <b>{student.joinedDate || '01/02/2026'}</b>
                  </span>
                  <span className="flex items-center gap-1 text-amber-300">
                    <Target className="w-3.5 h-3.5 text-amber-400" /> Mục tiêu Target: <b>Band {student.targetBand || '8.0'}</b>
                  </span>
                </div>
              </div>
            </div>

            {/* Target Status Pill */}
            <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/15 text-right min-w-[200px]">
              <p className="text-[11px] uppercase tracking-wider text-slate-300 font-bold mb-1">Đánh Giá Tiến Độ</p>
              {highestBand ? (
                <div>
                  <p className="text-2xl font-black text-amber-300">
                    Band {highestBand} <span className="text-xs text-slate-300 font-normal">/ {student.targetBand || 8.0}</span>
                  </p>
                  <p className="text-xs text-cyan-300 font-semibold mt-1">
                    {highestBand >= (student.targetBand || 8.0)
                      ? '🎉 Đã đạt mục tiêu đề ra!'
                      : `⚡ Còn ${((student.targetBand || 8.0) - highestBand).toFixed(1)} Band nữa để đạt mục tiêu`}
                  </p>
                </div>
              ) : (
                <p className="text-xs text-slate-300">Chưa có kết quả bài thi</p>
              )}
            </div>
          </div>
        </div>

        {/* 4 Summary Metric Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200/80 dark:border-slate-800 shadow-sm flex items-center gap-3.5">
            <div className="p-3 bg-blue-50 dark:bg-blue-500/15 text-blue-600 dark:text-blue-400 rounded-xl">
              <History className="w-6 h-6" />
            </div>
            <div>
              <p className="text-[11px] text-slate-400 dark:text-slate-400 font-bold uppercase">Tổng Số Lần Thi</p>
              <p className="text-2xl font-black text-slate-900 dark:text-white">{totalAttempts} <span className="text-xs font-normal text-slate-500 dark:text-slate-400">lần</span></p>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200/80 dark:border-slate-800 shadow-sm flex items-center gap-3.5">
            <div className="p-3 bg-emerald-50 dark:bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 rounded-xl">
              <Award className="w-6 h-6" />
            </div>
            <div>
              <p className="text-[11px] text-slate-400 dark:text-slate-400 font-bold uppercase">Band Cao Nhất</p>
              <p className="text-2xl font-black text-emerald-600 dark:text-emerald-400">{highestBand || '-'}</p>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200/80 dark:border-slate-800 shadow-sm flex items-center gap-3.5">
            <div className="p-3 bg-indigo-50 dark:bg-indigo-500/15 text-indigo-600 dark:text-indigo-400 rounded-xl">
              <BarChart2 className="w-6 h-6" />
            </div>
            <div>
              <p className="text-[11px] text-slate-400 dark:text-slate-400 font-bold uppercase">Điểm Overall Trung Bình</p>
              <p className="text-2xl font-black text-indigo-600 dark:text-indigo-400">{overallAvg || '-'}</p>
              {totalAttempts > 0 && (
                <span className="text-[11px] block font-semibold text-slate-500 dark:text-slate-400 mt-0.5">
                  L: {avgListening} • R: {avgReading} • W: {avgWriting}
                </span>
              )}
            </div>
          </div>

          {isTeacherViewer ? (
            <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200/80 dark:border-slate-800 shadow-sm flex items-center gap-3.5">
              <div className="p-3 bg-purple-50 dark:bg-purple-500/15 text-purple-600 dark:text-purple-400 rounded-xl">
                <ShieldAlert className="w-6 h-6" />
              </div>
              <div>
                <p className="text-[11px] text-slate-400 dark:text-slate-400 font-bold uppercase">Chống Gian Lận (Tab)</p>
                <p className={`text-xl font-black ${avgTabSwitches <= 1 ? 'text-emerald-600 dark:text-emerald-400' : 'text-amber-600 dark:text-amber-400'}`}>
                  {avgTabSwitches <= 1 ? 'An toàn' : 'Cần chú ý'}
                  <span className="text-xs block font-normal text-slate-500 dark:text-slate-400">TB {avgTabSwitches} lần/bài</span>
                </p>
              </div>
            </div>
          ) : (
            <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200/80 dark:border-slate-800 shadow-sm flex items-center gap-3.5">
              <div className="p-3 bg-purple-50 dark:bg-purple-500/15 text-purple-600 dark:text-purple-400 rounded-xl">
                <Target className="w-6 h-6" />
              </div>
              <div>
                <p className="text-[11px] text-slate-400 dark:text-slate-400 font-bold uppercase">Mục Tiêu Band</p>
                <p className="text-2xl font-black text-purple-600 dark:text-purple-400">
                  Band {student.targetBand || '8.0'}
                </p>
                <span className="text-[11px] block font-normal text-slate-500 dark:text-slate-400 mt-0.5">
                  {highestBand && highestBand >= (student.targetBand || 8.0)
                    ? 'Đã chạm mốc mục tiêu'
                    : highestBand
                      ? `Cần thêm ${((student.targetBand || 8.0) - highestBand).toFixed(1)} Band`
                      : 'Luyện tập đều đặn mỗi ngày'}
                </span>
              </div>
            </div>
          )}
        </div>

        {/* SECTION 1: TIẾN TRÌNH & ĐỘT PHÁ ĐIỂM SỐ QUA CÁC LẦN THI (SCORE PROGRESSION TIMELINE) */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-sm p-6 sm:p-8 mb-8">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-6 pb-4 border-b border-slate-100 dark:border-slate-800">
            <div>
              <h2 className="text-lg font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                Tiến Trình & Đột Phá Điểm Số Qua Các Lần Thi
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Theo dõi sự thay đổi band điểm qua từng bài thi từ lần đầu tiên đến lần thi gần nhất.
              </p>
            </div>

            {bandGrowth && Number(bandGrowth) > 0 && (
              <span className="bg-emerald-50 dark:bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-500/30 text-xs font-extrabold px-3 py-1.5 rounded-xl flex items-center gap-1.5 shadow-sm">
                <Sparkles className="w-4 h-4 text-emerald-500" />
                Tăng trưởng: +{bandGrowth} Band Overall! 🚀
              </span>
            )}
          </div>

          {totalAttempts === 0 ? (
            <div className="p-8 text-center text-slate-400 text-xs">
              Học viên chưa có bài thi nào để phân tích tiến trình điểm.
            </div>
          ) : (
            <div className="space-y-6">
              {/* Chronological Trajectory Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {chronologicalAttempts.map((att, idx) => (
                  <div
                    key={att.id}
                    className={`rounded-2xl p-5 border transition ${
                      idx === chronologicalAttempts.length - 1
                        ? 'bg-gradient-to-b from-indigo-50/50 to-white dark:from-indigo-950/40 dark:to-slate-900 border-indigo-200 dark:border-indigo-500/40 shadow-md ring-2 ring-indigo-500/20'
                        : 'bg-slate-50/70 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700/80 shadow-sm'
                    }`}
                  >
                    <div className="flex justify-between items-start mb-3">
                      <span className={`text-[11px] font-extrabold px-2.5 py-1 rounded-lg ${
                        idx === chronologicalAttempts.length - 1
                          ? 'bg-indigo-600 text-white'
                          : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200'
                      }`}>
                        Lần thi #{idx + 1} {idx === chronologicalAttempts.length - 1 ? '(Gần nhất)' : ''}
                      </span>
                      <span className="text-xs text-slate-400 dark:text-slate-400 font-medium">{att.submittedAt}</span>
                    </div>

                    <p className="font-bold text-slate-800 dark:text-slate-100 text-sm mb-3 line-clamp-1">{att.testTitle}</p>

                    <div className="flex items-center justify-between py-2 border-y border-slate-200/60 dark:border-slate-700/70 mb-3">
                      <span className="text-xs text-slate-500 dark:text-slate-400 font-semibold">Band Overall:</span>
                      <span className="text-xl font-black text-indigo-600 dark:text-indigo-300 bg-indigo-50 dark:bg-indigo-500/15 px-2.5 py-0.5 rounded-lg border border-indigo-100 dark:border-indigo-500/30">
                        {att.overallBand || 'Chờ'}
                      </span>
                    </div>

                    {/* Skill breakdown mini bars */}
                    <div className="space-y-2 text-xs">
                      <div>
                        <div className="flex justify-between text-slate-600 dark:text-slate-300 font-semibold mb-1">
                          <span className="flex items-center gap-1">
                            <Headphones className="w-3.5 h-3.5 text-blue-500 dark:text-blue-400" /> Listening
                          </span>
                          <span className="font-bold text-slate-900 dark:text-white">{att.scores.listening.band ?? '-'}</span>
                        </div>
                        <div className="h-1.5 w-full bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-blue-500 rounded-full transition-all"
                            style={{ width: `${((att.scores.listening.band || 0) / 9) * 100}%` }}
                          />
                        </div>
                      </div>

                      <div>
                        <div className="flex justify-between text-slate-600 dark:text-slate-300 font-semibold mb-1">
                          <span className="flex items-center gap-1">
                            <BookOpen className="w-3.5 h-3.5 text-indigo-500 dark:text-indigo-400" /> Reading
                          </span>
                          <span className="font-bold text-slate-900 dark:text-white">{att.scores.reading.band ?? '-'}</span>
                        </div>
                        <div className="h-1.5 w-full bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-indigo-500 rounded-full transition-all"
                            style={{ width: `${((att.scores.reading.band || 0) / 9) * 100}%` }}
                          />
                        </div>
                      </div>

                      <div>
                        <div className="flex justify-between text-slate-600 dark:text-slate-300 font-semibold mb-1">
                          <span className="flex items-center gap-1">
                            <PenTool className="w-3.5 h-3.5 text-emerald-500 dark:text-emerald-400" /> Writing
                          </span>
                          <span className="font-bold text-slate-900 dark:text-white">{att.scores.writing.overallBand ?? '-'}</span>
                        </div>
                        <div className="h-1.5 w-full bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-emerald-500 rounded-full transition-all"
                            style={{ width: `${((att.scores.writing.overallBand || 0) / 9) * 100}%` }}
                          />
                        </div>
                      </div>
                    </div>

                    <button
                      onClick={() => {
                        setSelectedAttemptId(att.id);
                        setPreviousView('STUDENT_PROFILE');
                        setView('RESULT_VIEW');
                      }}
                      className="mt-4 w-full bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 text-xs font-bold py-2 rounded-xl transition shadow-sm"
                    >
                      Xem Chi Tiết Bài Làm →
                    </button>
                  </div>
                ))}
              </div>

              {/* Skill Growth Highlights */}
              {firstAttempt && latestAttempt && totalAttempts > 1 && (
                <div className="bg-slate-50 dark:bg-slate-800/60 rounded-2xl p-5 border border-slate-200 dark:border-slate-700 grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 bg-blue-100 dark:bg-blue-500/20 text-blue-700 dark:text-blue-300 rounded-xl font-bold text-xs">
                      <Headphones className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 font-bold uppercase">Tiến Độ Listening</p>
                      <p className="text-sm font-extrabold text-slate-900 dark:text-white">
                        Band {firstAttempt.scores.listening.band} → <b className="text-blue-600 dark:text-blue-400">Band {latestAttempt.scores.listening.band}</b>
                        <span className="text-xs text-emerald-600 dark:text-emerald-400 font-bold ml-1.5">
                          (+{(latestAttempt.scores.listening.band - firstAttempt.scores.listening.band).toFixed(1)})
                        </span>
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="p-2.5 bg-indigo-100 dark:bg-indigo-500/20 text-indigo-700 dark:text-indigo-300 rounded-xl font-bold text-xs">
                      <BookOpen className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 font-bold uppercase">Tiến Độ Reading</p>
                      <p className="text-sm font-extrabold text-slate-900 dark:text-white">
                        Band {firstAttempt.scores.reading.band} → <b className="text-indigo-600 dark:text-indigo-400">Band {latestAttempt.scores.reading.band}</b>
                        <span className="text-xs text-emerald-600 dark:text-emerald-400 font-bold ml-1.5">
                          (+{(latestAttempt.scores.reading.band - firstAttempt.scores.reading.band).toFixed(1)})
                        </span>
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="p-2.5 bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 rounded-xl font-bold text-xs">
                      <PenTool className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 font-bold uppercase">Tiến Độ Writing</p>
                      <p className="text-sm font-extrabold text-slate-900 dark:text-white">
                        Band {firstAttempt.scores.writing.overallBand} → <b className="text-emerald-600 dark:text-emerald-400">Band {latestAttempt.scores.writing.overallBand}</b>
                        <span className="text-xs text-emerald-600 dark:text-emerald-400 font-bold ml-1.5">
                          (+{(latestAttempt.scores.writing.overallBand - firstAttempt.scores.writing.overallBand).toFixed(1)})
                        </span>
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* SECTION 2: BẢNG LỊCH SỬ CHI TIẾT TẤT CẢ CÁC LẦN THI */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-sm overflow-hidden mb-8">
          <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center">
            <div>
              <h2 className="text-lg font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                <FileText className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                Lịch Sử Chi Tiết Từng Lần Thi
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Danh sách các bài thi đã hoàn thành của học viên {student.name}.</p>
            </div>
            <span className="text-xs font-bold text-slate-400">Tổng cộng: {studentAttempts.length} bài thi</span>
          </div>

          {studentAttempts.length === 0 ? (
            <div className="p-8 text-center text-slate-400 text-xs">
              Chưa có dữ liệu bài thi.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-slate-600 dark:text-slate-300">
                <thead className="bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-700 text-xs text-slate-500 dark:text-slate-400 uppercase">
                  <tr>
                    <th className="px-6 py-3.5">Đề Thi</th>
                    <th className="px-6 py-3.5">Thời Gian Nộp</th>
                    <th className="px-6 py-3.5 text-center">Listening</th>
                    <th className="px-6 py-3.5 text-center">Reading</th>
                    <th className="px-6 py-3.5 text-center">Writing</th>
                    <th className="px-6 py-3.5 text-center">Overall Band</th>
                    {isTeacherViewer && (
                      <th className="px-6 py-3.5 text-center">Gian Lận (Tab)</th>
                    )}
                    <th className="px-6 py-3.5 text-right">Chi Tiết</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {studentAttempts.map((att, idx) => {
                    const risk = isTeacherViewer ? getRiskAssessment(att.tabSwitchCount) : null;
                    const RiskIcon = risk?.icon;

                    return (
                      <tr key={att.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition">
                        <td className="px-6 py-4">
                          <p className="font-bold text-slate-900 dark:text-white">{att.testTitle}</p>
                          <span className="text-[10px] text-slate-400 font-mono">ID: {att.id} • Lần thi #{studentAttempts.length - idx}</span>
                        </td>
                        <td className="px-6 py-4 text-xs text-slate-500 dark:text-slate-400">{att.submittedAt}</td>
                        <td className="px-6 py-4 text-center">
                          <span className="font-bold text-slate-800 dark:text-slate-100">{att.scores.listening.band ?? '-'}</span>
                          <span className="text-[11px] text-slate-400 block font-normal">({att.scores.listening.raw}/{att.scores.listening.total} câu)</span>
                        </td>
                        <td className="px-6 py-4 text-center">
                          <span className="font-bold text-slate-800 dark:text-slate-100">{att.scores.reading.band ?? '-'}</span>
                          <span className="text-[11px] text-slate-400 block font-normal">({att.scores.reading.raw}/{att.scores.reading.total} câu)</span>
                        </td>
                        <td className="px-6 py-4 text-center">
                          <span className="font-bold text-slate-800 dark:text-slate-100">{att.scores.writing.overallBand ?? 'Chờ chấm'}</span>
                          <span className="text-[11px] text-slate-400 block font-normal">T1: {att.scores.writing.task1Band ?? '-'} | T2: {att.scores.writing.task2Band ?? '-'}</span>
                        </td>
                        <td className="px-6 py-4 text-center">
                          <span className="text-base font-black text-indigo-600 dark:text-indigo-300 bg-indigo-50 dark:bg-indigo-500/15 px-3 py-1 rounded-xl border border-indigo-100 dark:border-indigo-500/30">
                            {att.overallBand || 'Chờ'}
                          </span>
                        </td>
                        {isTeacherViewer && risk && (
                          <td className="px-6 py-4 text-center">
                            <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold border ${risk.color}`}>
                              <RiskIcon className="w-3 h-3" />
                              {risk.label} ({att.tabSwitchCount})
                            </span>
                          </td>
                        )}
                        <td className="px-6 py-4 text-right">
                          <button
                            onClick={() => {
                              setSelectedAttemptId(att.id);
                              setPreviousView('STUDENT_PROFILE');
                              setView('RESULT_VIEW');
                            }}
                            className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs px-3.5 py-1.5 rounded-lg font-bold transition shadow-sm"
                          >
                            Xem Bài Làm & AI
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* SECTION 3: NHẬN XÉT & ĐÁNH GIÁ CỦA GIÁO VIÊN */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-sm p-6 sm:p-8 mb-8">
          <div className="flex justify-between items-center pb-4 border-b border-slate-100 dark:border-slate-800 mb-4">
            <div>
              <h2 className="text-lg font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                <MessageSquare className="w-5 h-5 text-amber-500" />
                Đánh Giá & Nhận Xét Của Giáo Viên Quản Nhiệm
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Lời khuyên, phân tích điểm yếu và lộ trình rèn luyện cá nhân hóa.</p>
            </div>
            <span className="text-xs bg-amber-50 dark:bg-amber-500/15 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-500/30 px-3 py-1 rounded-full font-bold">
              Thầy Minh IELTS Master
            </span>
          </div>

          {isTeacherViewer ? (
            <div className="space-y-4">
              <textarea
                rows={4}
                value={tempNoteText !== '' ? tempNoteText : (teacherNotes[activeUsername] || '')}
                onChange={e => setTempNoteText(e.target.value)}
                placeholder="Nhập nhận xét chi tiết về quá trình học tập, các điểm cần khắc phục và định hướng cho học viên này..."
                className="w-full p-4 text-xs leading-relaxed bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 border border-slate-300 dark:border-slate-700 rounded-2xl focus:ring-2 focus:ring-indigo-500 focus:outline-none font-sans"
              />
              <div className="flex justify-end">
                <button
                  onClick={() => {
                    const textToSave = tempNoteText !== '' ? tempNoteText : (teacherNotes[activeUsername] || '');
                    setTeacherNotes(prev => ({ ...prev, [activeUsername]: textToSave }));
                    showToast('Đã lưu nhận xét hồ sơ học viên thành công!');
                  }}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold px-5 py-2.5 rounded-xl transition shadow flex items-center gap-2"
                >
                  <Save className="w-4 h-4" /> Lưu Nhận Xét Hồ Sơ
                </button>
              </div>
            </div>
          ) : (
            <div className="bg-amber-50/70 dark:bg-amber-500/10 rounded-2xl p-6 border border-amber-200/80 dark:border-amber-500/30">
              <p className="text-xs text-slate-700 dark:text-slate-200 leading-relaxed font-medium whitespace-pre-line">
                {teacherNotes[activeUsername] || 'Chưa có ghi chú nhận xét nào từ giáo viên. Hãy làm thêm các bài thi thử để giáo viên đánh giá năng lực.'}
              </p>
            </div>
          )}
        </div>

        {/* SECTION 4: THÀNH TÍCH ĐẤU TRƯỜNG TỪ VỰNG CHICKEN INVADERS */}
        <div className="bg-gradient-to-r from-purple-900 via-indigo-900 to-slate-900 rounded-3xl p-6 sm:p-8 text-white border border-purple-800 shadow-xl">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6 pb-4 border-b border-purple-800/80">
            <div>
              <h2 className="text-lg font-extrabold text-white flex items-center gap-2">
                <Gamepad2 className="w-5 h-5 text-pink-400" />
                Thành Tích Đấu Trường Game Từ Vựng (IELTS Chicken Invaders)
              </h2>
              <p className="text-xs text-purple-200 mt-0.5">Kết quả rèn luyện phản xạ từ vựng, ngữ nghĩa và chính tả qua game 3 vòng.</p>
            </div>
            <button
              onClick={() => {
                initGameCampaign(currentRoomPin, currentUser);
                setView('GAME_ARENA');
              }}
              className="bg-gradient-to-r from-pink-500 to-purple-500 hover:from-pink-600 hover:to-purple-600 text-white font-bold text-xs px-4 py-2 rounded-xl transition shadow flex items-center gap-1.5"
            >
              <Play className="w-3.5 h-3.5 fill-white" /> Vào Đấu Trường Game
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-purple-950/60 rounded-2xl p-4 border border-purple-700/50">
              <p className="text-[11px] text-purple-300 font-bold uppercase">Điểm Kỷ Lục Phòng Game</p>
              <p className="text-2xl font-black text-amber-300 font-mono mt-1">
                {playerGameRecord?.score || (activeUsername === 'hocsinh_01' ? 1850 : 1200)} pts
              </p>
            </div>

            <div className="bg-purple-950/60 rounded-2xl p-4 border border-purple-700/50">
              <p className="text-[11px] text-purple-300 font-bold uppercase">Cấp Độ Cao Nhất Đạt Được</p>
              <p className="text-sm font-extrabold text-cyan-300 mt-1">
                {playerGameRecord?.status || 'Vòng 3: Boss Speller (Hoàn thành)'}
              </p>
            </div>

            <div className="bg-purple-950/60 rounded-2xl p-4 border border-purple-700/50">
              <p className="text-[11px] text-purple-300 font-bold uppercase">Chuỗi Combo Từ Đúng</p>
              <p className="text-2xl font-black text-pink-400 font-mono mt-1">
                {playerGameRecord?.streak || (activeUsername === 'hocsinh_01' ? 8 : 4)}x Combo
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // ==========================================
  // RENDER TEACHER DASHBOARD HUB
  // ==========================================
  const renderTeacherDashboard = () => {
    const room = roomsDb[currentRoomPin] || { pin: currentRoomPin, pass: 'ielts', players: {} };
    const leaderboardPlayers = Object.values(room.players || {}).sort((a, b) => b.score - a.score);
    const studentList = Object.values(usersDb).filter(u => u.role === 'student');
    const filteredStudents = studentList.filter(s =>
      (s.name || '').toLowerCase().includes(studentSearchQuery.toLowerCase()) ||
      (s.username || '').toLowerCase().includes(studentSearchQuery.toLowerCase())
    );

    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
          <div>
            <div className="inline-flex items-center gap-1.5 bg-amber-500/10 text-amber-700 dark:text-amber-300 border border-amber-500/30 px-3 py-1 rounded-full text-xs font-bold mb-2">
              <ShieldAlert className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" /> Trung Tâm Điều Hành Giáo Viên
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white">Bảng Điều Khiển Giáo Viên (Teacher Hub)</h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Quản lý kho đề thi, chấm điểm bài làm với AI, giám sát chống gian lận và điều phối phòng Game PIN.</p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => openExamBuilder()}
              className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold px-4 py-2.5 rounded-xl shadow transition flex items-center gap-2"
            >
              <Plus className="w-4 h-4" /> Tạo Đề Thi Mới
            </button>
            <button
              onClick={() => setShowVocabModal(true)}
              className="bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold px-4 py-2.5 rounded-xl shadow transition flex items-center gap-2"
            >
              <Edit className="w-4 h-4" /> Sửa Bộ Từ Game
            </button>
          </div>
        </div>

        {/* Teacher Navigation Tabs */}
        <div className="flex border-b border-slate-200 dark:border-slate-800 mb-6 gap-2 flex-wrap">
          <button
            onClick={() => setTeacherHubTab('tests')}
            className={`px-4 py-2.5 text-xs font-bold border-b-2 transition flex items-center gap-2 ${
              teacherHubTab === 'tests' ? 'border-blue-600 text-blue-600 dark:text-blue-400' : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <BookOpen className="w-4 h-4" /> 1. Kho Đề Thi ({tests.length})
          </button>
          <button
            onClick={() => setTeacherHubTab('grading')}
            className={`px-4 py-2.5 text-xs font-bold border-b-2 transition flex items-center gap-2 ${
              teacherHubTab === 'grading' ? 'border-blue-600 text-blue-600 dark:text-blue-400' : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <PenTool className="w-4 h-4" /> 2. Chấm Bài & Giám Sát Chống Gian Lận ({attempts.length})
          </button>
          <button
            onClick={() => setTeacherHubTab('game_room')}
            className={`px-4 py-2.5 text-xs font-bold border-b-2 transition flex items-center gap-2 ${
              teacherHubTab === 'game_room' ? 'border-blue-600 text-blue-600 dark:text-blue-400' : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <Trophy className="w-4 h-4 text-amber-500" /> 3. Phòng Đấu Game PIN & Bảng Xếp Hạng ({leaderboardPlayers.length})
          </button>
          <button
            onClick={() => setTeacherHubTab('students')}
            className={`px-4 py-2.5 text-xs font-bold border-b-2 transition flex items-center gap-2 ${
              teacherHubTab === 'students' ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400' : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <GraduationCap className="w-4 h-4 text-indigo-500 dark:text-indigo-400" /> 4. Hồ Sơ & Quản Lý Học Sinh ({studentList.length})
          </button>
        </div>

        {/* Tab 1: Kho Đề Thi */}
        {teacherHubTab === 'tests' && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {tests.map(t => (
              <div key={t.id} className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-sm hover:shadow-md transition flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <span className="text-[11px] bg-indigo-50 dark:bg-indigo-500/15 text-indigo-700 dark:text-indigo-300 font-bold px-2.5 py-1 rounded-lg border border-indigo-100 dark:border-indigo-500/30">
                      Listening: {t.listening?.questions?.length || 0} • Reading: {t.reading?.questions?.length || 0}
                    </span>
                    <span className="text-[11px] text-slate-400 font-medium">{t.createdAt}</span>
                  </div>
                  <h3 className="font-bold text-slate-900 dark:text-white text-base mb-2 leading-snug">{t.title}</h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mb-4 line-clamp-2 leading-relaxed">{t.description}</p>

                  {/* Media Badges */}
                  <div className="flex flex-wrap gap-1.5 mb-4">
                    {t.listening?.audioUrl ? (
                      <span className="text-[10px] bg-blue-50 dark:bg-blue-500/15 text-blue-700 dark:text-blue-300 font-bold px-2 py-0.5 rounded-md border border-blue-200 dark:border-blue-500/30">
                        🎵 Đã đính kèm Audio
                      </span>
                    ) : (
                      <span className="text-[10px] bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 font-medium px-2 py-0.5 rounded-md">
                        🔊 Dùng AI Voice (TTS)
                      </span>
                    )}
                    {t.reading?.imageUrl && (
                      <span className="text-[10px] bg-emerald-50 dark:bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 font-bold px-2 py-0.5 rounded-md border border-emerald-200 dark:border-emerald-500/30">
                        🖼️ Có ảnh Reading
                      </span>
                    )}
                    {t.writing?.task1?.imageUrl && (
                      <span className="text-[10px] bg-purple-50 dark:bg-purple-500/15 text-purple-700 dark:text-purple-300 font-bold px-2 py-0.5 rounded-md border border-purple-200 dark:border-purple-500/30">
                        📊 Có biểu đồ Task 1
                      </span>
                    )}
                  </div>

                  {/* Quick Toggle Allow View Correct Answers */}
                  <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/70 border border-slate-200/80 dark:border-slate-700 mb-4 flex items-center justify-between gap-2">
                    <div>
                      <p className="text-[11px] font-bold text-slate-800 dark:text-slate-100">Cho phép HS xem đáp án đúng</p>
                      <p className="text-[10px] text-slate-500 dark:text-slate-400">
                        {t.allowViewAnswers ? 'Học sinh xem được đáp án sau khi nộp' : 'Đang ẩn đáp án đúng với học sinh'}
                      </p>
                    </div>
                    <button
                      onClick={() => toggleTestAllowViewAnswers(t.id)}
                      className={`px-3 py-1.5 rounded-xl text-[11px] font-extrabold flex items-center gap-1 transition shadow-sm flex-shrink-0 ${
                        t.allowViewAnswers
                          ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                          : 'bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200'
                      }`}
                    >
                      {t.allowViewAnswers ? (
                        <>
                          <Unlock className="w-3.5 h-3.5" /> Đã Mở
                        </>
                      ) : (
                        <>
                          <Lock className="w-3.5 h-3.5" /> Đang Khóa
                        </>
                      )}
                    </button>
                  </div>
                </div>

                <div className="flex items-center justify-between border-t border-slate-100 dark:border-slate-800 pt-3 text-xs">
                  <span className="text-slate-400 font-medium">Giới hạn nghe: {t.maxAudioPlays} lần</span>
                  <button
                    onClick={() => openExamBuilder(t)}
                    className="bg-indigo-50 dark:bg-indigo-500/15 hover:bg-indigo-100 dark:hover:bg-indigo-500/25 text-indigo-700 dark:text-indigo-300 font-bold px-3 py-1.5 rounded-xl transition flex items-center gap-1.5 border border-indigo-200 dark:border-indigo-500/30"
                  >
                    <Edit className="w-3.5 h-3.5" /> Soạn Câu Hỏi & Media
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Tab 2: Giám Sát Gian Lận & Chấm Điểm */}
        {teacherHubTab === 'grading' && (
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-slate-600 dark:text-slate-300">
                <thead className="bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-700 text-xs text-slate-500 dark:text-slate-400 uppercase">
                  <tr>
                    <th className="px-6 py-3.5">Học Sinh</th>
                    <th className="px-6 py-3.5">Đề Thi</th>
                    <th className="px-6 py-3.5">Thời Gian Nộp</th>
                    <th className="px-6 py-3.5 text-center">Chống Gian Lận (Tab Switch)</th>
                    <th className="px-6 py-3.5 text-center">Trạng Thái Chấm</th>
                    <th className="px-6 py-3.5 text-center">Overall</th>
                    <th className="px-6 py-3.5 text-right">Thao Tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {attempts.map(att => {
                    const risk = getRiskAssessment(att.tabSwitchCount);
                    const RiskIcon = risk.icon;

                    return (
                      <tr key={att.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition">
                        <td className="px-6 py-4 font-bold text-slate-900 dark:text-white">{att.studentName}</td>
                        <td className="px-6 py-4 text-xs text-slate-600 dark:text-slate-300">{att.testTitle}</td>
                        <td className="px-6 py-4 text-xs text-slate-500 dark:text-slate-400">{att.submittedAt}</td>
                        <td className="px-6 py-4 text-center">
                          <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border ${risk.color}`}>
                            <RiskIcon className="w-3.5 h-3.5" />
                            {risk.label} ({att.tabSwitchCount} lần)
                          </span>
                        </td>
                        <td className="px-6 py-4 text-center">
                          {att.teacherGraded ? (
                            <span className="text-xs bg-emerald-50 dark:bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 px-2.5 py-1 rounded-md font-bold border border-emerald-200 dark:border-emerald-500/30 inline-flex items-center gap-1">
                              {att.aiGraded && <Sparkles className="w-3.5 h-3.5 text-indigo-500 dark:text-indigo-400" />}
                              {att.aiGraded ? 'AI Đã Chấm' : 'Đã Chấm'}
                            </span>
                          ) : (
                            <span className="text-xs bg-amber-50 dark:bg-amber-500/15 text-amber-700 dark:text-amber-300 px-2.5 py-1 rounded-md font-bold border border-amber-200 dark:border-amber-500/30">
                              Cần Chấm Writing
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4 text-center font-bold text-blue-600 dark:text-blue-400">
                          {att.overallBand ?? '-'}
                        </td>
                        <td className="px-6 py-4 text-right">
                          <button
                            onClick={() => {
                              setGradingAttempt(att);
                              setGradingScores({
                                task1Band: att.scores.writing.task1Band || 6.0,
                                task2Band: att.scores.writing.task2Band || 6.5,
                                feedback: att.teacherFeedback || ''
                              });
                            }}
                            className="bg-blue-600 hover:bg-blue-700 text-white text-xs px-3.5 py-1.5 rounded-lg font-bold transition shadow-sm"
                          >
                            Chấm Bài & Chi Tiết
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Tab 3: Phòng Đấu Game PIN & Leaderboard */}
        {teacherHubTab === 'game_room' && (
          <div className="space-y-6">
            <div className="bg-gradient-to-r from-purple-900 to-indigo-900 rounded-2xl p-6 text-white border border-purple-800 shadow-lg flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div>
                <p className="text-xs text-purple-300 font-bold uppercase">Mã Phòng Hiện Tại (PIN):</p>
                <p className="text-3xl font-extrabold text-amber-300 font-mono tracking-wider">{currentRoomPin}</p>
                <p className="text-xs text-slate-300 mt-1">Mật khẩu phòng: <b className="text-cyan-300">{room.pass}</b></p>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => {
                    initGameCampaign(currentRoomPin, currentUser);
                    setView('GAME_ARENA');
                  }}
                  className="bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-400 hover:to-blue-400 text-slate-950 font-extrabold text-xs px-4 py-2.5 rounded-xl transition shadow flex items-center gap-2"
                >
                  <Gamepad2 className="w-4 h-4" /> Mở Màn Hình Game
                </button>
                <button
                  onClick={() => setShowVocabModal(true)}
                  className="bg-purple-700 hover:bg-purple-600 text-white font-bold text-xs px-4 py-2.5 rounded-xl transition border border-purple-500"
                >
                  📝 Sửa Bộ 12 Từ Của Phòng
                </button>
              </div>
            </div>

            {/* Leaderboard Table */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
              <div className="p-4 bg-slate-50 dark:bg-slate-800/70 border-b border-slate-200 dark:border-slate-700 flex justify-between items-center">
                <h3 className="font-extrabold text-sm text-slate-800 dark:text-white flex items-center gap-2">
                  <Trophy className="w-4 h-4 text-amber-500" /> Bảng Xếp Hạng Học Sinh Trong Phòng (Real-time)
                </h3>
                <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">Tự động đồng bộ điểm số</span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm text-slate-600 dark:text-slate-300">
                  <thead className="bg-slate-50 dark:bg-slate-800/80 text-xs text-slate-500 dark:text-slate-400 uppercase border-b border-slate-200 dark:border-slate-700">
                    <tr>
                      <th className="px-6 py-3">Hạng</th>
                      <th className="px-6 py-3">Tên Học Sinh</th>
                      <th className="px-6 py-3">Tiến Độ</th>
                      <th className="px-6 py-3 text-center">Điểm Số</th>
                      <th className="px-6 py-3 text-center">Streak</th>
                      <th className="px-6 py-3 text-right">Cập Nhật</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {leaderboardPlayers.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="text-center py-8 text-xs text-slate-400">
                          Chưa có học sinh nào nộp điểm vào phòng. Hãy chia sẻ mã PIN <b>{currentRoomPin}</b> cho học sinh!
                        </td>
                      </tr>
                    ) : (
                      leaderboardPlayers.map((p, idx) => (
                        <tr key={idx} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition">
                          <td className="px-6 py-3.5 font-bold text-amber-500">
                            {idx === 0 ? '🥇 #1' : idx === 1 ? '🥈 #2' : idx === 2 ? '🥉 #3' : `#${idx + 1}`}
                          </td>
                          <td className="px-6 py-3.5 font-bold text-slate-900 dark:text-white">{p.name}</td>
                          <td className="px-6 py-3.5 text-xs text-slate-600 dark:text-slate-300">{p.status}</td>
                          <td className="px-6 py-3.5 text-center font-extrabold text-blue-600 dark:text-blue-400">{p.score}đ</td>
                          <td className="px-6 py-3.5 text-center font-bold text-amber-600 dark:text-amber-400">🔥 {p.streak}</td>
                          <td className="px-6 py-3.5 text-right text-xs text-slate-400">{p.updatedAt}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Tab 4: Hồ Sơ & Quản Lý Học Sinh */}
        {teacherHubTab === 'students' && (
          <div className="space-y-6">
            {/* Search and Summary Bar */}
            <div className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div>
                <h3 className="font-extrabold text-base text-slate-900 dark:text-white flex items-center gap-2">
                  <GraduationCap className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                  Danh Sách & Hồ Sơ Học Viên Trong Hệ Thống ({studentList.length})
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  Bấm vào từng học viên để xem toàn bộ lịch sử các lần thi, biểu đồ tiến bộ band điểm và ghi chú học tập.
                </p>
              </div>

              <div className="w-full md:w-80">
                <input
                  type="text"
                  placeholder="🔍 Tìm kiếm theo tên hoặc username..."
                  value={studentSearchQuery}
                  onChange={e => setStudentSearchQuery(e.target.value)}
                  className="w-full px-4 py-2.5 text-xs bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 border border-slate-300 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none font-medium"
                />
              </div>
            </div>

            {/* Students Table */}
            <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm text-slate-600 dark:text-slate-300">
                  <thead className="bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-700 text-xs text-slate-500 dark:text-slate-400 uppercase">
                    <tr>
                      <th className="px-6 py-4">Học Viên</th>
                      <th className="px-6 py-4 text-center">Mục Tiêu Target</th>
                      <th className="px-6 py-4 text-center">Số Lần Thi</th>
                      <th className="px-6 py-4 text-center">Band Cao Nhất</th>
                      <th className="px-6 py-4 text-center">Lần Thi Gần Nhất</th>
                      <th className="px-6 py-4 text-center">Đánh Giá Gian Lận</th>
                      <th className="px-6 py-4 text-right">Thao Tác</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {filteredStudents.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="px-6 py-10 text-center text-xs text-slate-400">
                          Không tìm thấy học sinh nào phù hợp với từ khóa "{studentSearchQuery}".
                        </td>
                      </tr>
                    ) : (
                      filteredStudents.map(student => {
                        const studentAttempts = attempts.filter(a => a.studentId === student.username);
                        const bestBand = studentAttempts.length > 0
                          ? Math.max(...studentAttempts.map(a => a.overallBand || 0))
                          : null;
                        const latestAttempt = studentAttempts[0];
                        const totalTab = studentAttempts.reduce((acc, curr) => acc + (curr.tabSwitchCount || 0), 0);
                        const avgTab = studentAttempts.length > 0 ? (totalTab / studentAttempts.length).toFixed(1) : 0;

                        return (
                          <tr key={student.username} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition">
                            <td className="px-6 py-4">
                              <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-indigo-500 to-blue-500 text-white font-black text-sm flex items-center justify-center shadow-sm">
                                  {student.name ? student.name[0] : 'S'}
                                </div>
                                <div>
                                  <p className="font-bold text-slate-900 dark:text-white leading-tight">{student.name}</p>
                                  <p className="text-xs text-slate-400 font-mono mt-0.5">@{student.username}</p>
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-4 text-center">
                              <span className="inline-flex items-center gap-1 text-xs font-bold bg-amber-50 dark:bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-500/30 px-2.5 py-1 rounded-full">
                                <Target className="w-3.5 h-3.5 text-amber-500" />
                                Band {student.targetBand || '7.5'}
                              </span>
                            </td>
                            <td className="px-6 py-4 text-center font-bold text-slate-800 dark:text-slate-100">
                              {studentAttempts.length > 0 ? (
                                <span className="bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 text-xs px-2.5 py-1 rounded-md font-extrabold">
                                  {studentAttempts.length} lần
                                </span>
                              ) : (
                                <span className="text-xs text-slate-400">Chưa thi</span>
                              )}
                            </td>
                            <td className="px-6 py-4 text-center">
                              {bestBand ? (
                                <span className="text-sm font-black text-emerald-600 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-500/15 border border-emerald-200 dark:border-emerald-500/30 px-3 py-1 rounded-xl">
                                  {bestBand}
                                </span>
                              ) : (
                                <span className="text-xs text-slate-400">-</span>
                              )}
                            </td>
                            <td className="px-6 py-4 text-center">
                              {latestAttempt ? (
                                <div>
                                  <p className="text-xs font-bold text-slate-800 dark:text-slate-100">Band {latestAttempt.overallBand || 'Chờ'}</p>
                                  <p className="text-[11px] text-slate-400">{latestAttempt.submittedAt}</p>
                                </div>
                              ) : (
                                <span className="text-xs text-slate-400">-</span>
                              )}
                            </td>
                            <td className="px-6 py-4 text-center">
                              <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${
                                avgTab <= 1
                                  ? 'bg-emerald-50 dark:bg-emerald-500/15 text-emerald-700 dark:text-emerald-300'
                                  : 'bg-amber-50 dark:bg-amber-500/15 text-amber-700 dark:text-amber-300'
                              }`}>
                                TB {avgTab} lần tab
                              </span>
                            </td>
                            <td className="px-6 py-4 text-right">
                              <button
                                onClick={() => {
                                  setSelectedProfileStudent(student.username);
                                  setPreviousView('TEACHER_DASHBOARD');
                                  setView('STUDENT_PROFILE');
                                }}
                                className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs px-3.5 py-2 rounded-xl font-bold transition shadow-sm inline-flex items-center gap-1.5"
                              >
                                <GraduationCap className="w-3.5 h-3.5" /> Xem Hồ Sơ & Lịch Sử
                              </button>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* TEACHER GRADING MODAL WITH AI ASSIST */}
        {gradingAttempt && (
          <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
            <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-4xl w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-slate-200 dark:border-slate-700 p-6">
              <div className="flex justify-between items-center pb-4 border-b border-slate-200 dark:border-slate-800 mb-6">
                <div>
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <span>Chấm Bài: {gradingAttempt.studentName}</span>
                    {gradingAttempt.aiGraded && (
                      <span className="text-xs bg-indigo-100 dark:bg-indigo-500/20 text-indigo-800 dark:text-indigo-300 px-2 py-0.5 rounded-full flex items-center gap-1 border border-indigo-200 dark:border-indigo-500/30">
                        <Bot className="w-3 h-3 text-indigo-600 dark:text-indigo-400" /> AI Graded
                      </span>
                    )}
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">{gradingAttempt.testTitle} - {gradingAttempt.submittedAt}</p>
                </div>
                <button onClick={() => setGradingAttempt(null)} className="text-slate-400 hover:text-slate-700 dark:hover:text-slate-200">
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Anti-Cheat Log Detail */}
              <div className="bg-slate-900 dark:bg-slate-950 text-white p-4 rounded-2xl mb-6 border border-slate-800">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-bold text-xs text-amber-400 uppercase tracking-wider flex items-center gap-2">
                    <ShieldAlert className="w-4 h-4" /> Nhật Ký Vi Phạm Chống Gian Lận (Stealth Log)
                  </h4>
                  <span className="text-xs bg-slate-800 px-2.5 py-1 rounded font-mono">
                    Lượt rời màn hình: {gradingAttempt.tabSwitchCount}
                  </span>
                </div>
                {gradingAttempt.antiCheatLogs.length === 0 ? (
                  <p className="text-xs text-emerald-400">Không ghi nhận bất kỳ vi phạm rời màn hình nào trong suốt quá trình làm bài.</p>
                ) : (
                  <div className="space-y-1.5 max-h-32 overflow-y-auto pr-2 text-xs text-slate-300">
                    {gradingAttempt.antiCheatLogs.map((log, idx) => (
                      <div key={idx} className="flex justify-between border-b border-slate-800 pb-1">
                        <span>[{log.timestamp}] Skill: <strong className="text-amber-300 uppercase">{log.skill}</strong> - {log.event}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Student Writing Submissions */}
              <div className="space-y-4 mb-6">
                <h4 className="font-bold text-sm text-slate-800 dark:text-slate-100">Bài Viết Của Học Sinh</h4>

                <div className="bg-slate-50 dark:bg-slate-800/70 p-4 rounded-xl border border-slate-200 dark:border-slate-700">
                  <p className="font-bold text-xs text-slate-700 dark:text-slate-200 mb-2">Writing Task 1 ({getWordCount(gradingAttempt.answers.w1)} từ)</p>
                  <div className="text-xs text-slate-700 dark:text-slate-200 whitespace-pre-line leading-relaxed bg-white dark:bg-slate-900 p-3 rounded-lg border border-slate-200 dark:border-slate-700">
                    {gradingAttempt.answers.w1 || 'Không có bài làm'}
                  </div>
                </div>

                <div className="bg-slate-50 dark:bg-slate-800/70 p-4 rounded-xl border border-slate-200 dark:border-slate-700">
                  <p className="font-bold text-xs text-slate-700 dark:text-slate-200 mb-2">Writing Task 2 ({getWordCount(gradingAttempt.answers.w2)} từ)</p>
                  <div className="text-xs text-slate-700 dark:text-slate-200 whitespace-pre-line leading-relaxed bg-white dark:bg-slate-900 p-3 rounded-lg border border-slate-200 dark:border-slate-700">
                    {gradingAttempt.answers.w2 || 'Không có bài làm'}
                  </div>
                </div>
              </div>

              {/* Grading input and AI suggestion */}
              <div className="bg-blue-50/50 dark:bg-indigo-950/30 border border-blue-100 dark:border-indigo-500/30 rounded-2xl p-5 mb-6 space-y-4">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                  <h4 className="font-bold text-sm text-slate-800 dark:text-white">Nhập Điểm Chấm Kỹ Năng Writing (Band 0 - 9.0)</h4>
                  
                  <button
                    type="button"
                    onClick={() => handleTeacherAIGrade(gradingAttempt)}
                    disabled={isGradingAI}
                    className={`px-3.5 py-1.5 rounded-lg text-xs font-bold flex items-center gap-2 transition shadow-sm ${
                      isGradingAI ? 'bg-slate-300 dark:bg-slate-700 text-slate-500 dark:text-slate-400 cursor-not-allowed' : 'bg-indigo-600 hover:bg-indigo-700 text-white'
                    }`}
                  >
                    {isGradingAI ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        <span>AI Đang Chấm...</span>
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                        <span>✨ AI Gợi Ý Chấm Điểm</span>
                      </>
                    )}
                  </button>
                </div>

                {isGradingAI && (
                  <div className="p-3 bg-indigo-50 dark:bg-indigo-500/15 border border-indigo-200 dark:border-indigo-500/30 rounded-lg flex items-center gap-3 text-xs text-indigo-900 dark:text-indigo-200">
                    <Loader2 className="w-4 h-4 animate-spin text-indigo-600 dark:text-indigo-400 flex-shrink-0" />
                    <span>{aiGradingStep || 'AI đang phân tích bài thi và điền tự động điểm số & nhận xét...'}</span>
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Task 1 Band Score</label>
                    <input
                      type="number"
                      step="0.5"
                      min="0"
                      max="9"
                      value={gradingScores.task1Band}
                      onChange={e => setGradingScores({ ...gradingScores, task1Band: e.target.value })}
                      className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-xs font-bold text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Task 2 Band Score</label>
                    <input
                      type="number"
                      step="0.5"
                      min="0"
                      max="9"
                      value={gradingScores.task2Band}
                      onChange={e => setGradingScores({ ...gradingScores, task2Band: e.target.value })}
                      className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-xs font-bold text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Nhận Xét & Ghi Chú Của Giáo Viên</label>
                  <textarea
                    rows={4}
                    placeholder="Viết nhận xét chi tiết cho học sinh..."
                    value={gradingScores.feedback}
                    onChange={e => setGradingScores({ ...gradingScores, feedback: e.target.value })}
                    className="w-full p-3 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 border border-slate-300 dark:border-slate-700 rounded-lg text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none font-sans"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-200 dark:border-slate-800">
                <button
                  onClick={() => setGradingAttempt(null)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition"
                >
                  Hủy
                </button>
                <button
                  onClick={saveTeacherGrading}
                  className="px-5 py-2 text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white rounded-xl transition shadow flex items-center gap-2"
                >
                  <Save className="w-4 h-4" /> Lưu Kết Quả & Chấm Điểm
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };

  // ==========================================
  // RENDER EXAM BUILDER STUDIO (FULL 4-TAB AUTHORING)
  // ==========================================
  const renderExamBuilder = () => (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div>
          <button
            onClick={() => {
              setEditingTest(null);
              setView('TEACHER_DASHBOARD');
            }}
            className="mb-2 flex items-center gap-2 text-xs font-bold text-slate-600 dark:text-slate-200 hover:text-slate-900 dark:hover:text-white transition bg-white dark:bg-slate-900 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm"
          >
            <ChevronLeft className="w-4 h-4" /> Quay Lại Bảng Điều Khiển Giáo Viên
          </button>
          <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white">
            {editingTest ? `Chỉnh Sửa Đề Thi: ${editingTest.title}` : 'Tạo & Biên Soạn Đề Thi IELTS Mới'}
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Tùy chỉnh câu hỏi Listening (kèm file ghi âm MP3/WAV), Reading (kèm hình ảnh minh họa), Writing và quyền xem đáp án.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              setEditingTest(null);
              setView('TEACHER_DASHBOARD');
            }}
            className="px-4 py-2.5 text-xs font-bold text-slate-600 dark:text-slate-200 bg-white dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 transition"
          >
            Hủy Bỏ
          </button>
          <button
            onClick={handleSaveTestBuilder}
            className="bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-700 hover:to-blue-700 text-white text-xs font-extrabold px-5 py-2.5 rounded-xl shadow-md transition flex items-center gap-2"
          >
            <Save className="w-4 h-4" /> Lưu Toàn Bộ Đề Thi
          </button>
        </div>
      </div>

      {/* Builder Sub-Navigation Tabs */}
      <div className="flex flex-wrap gap-2 mb-6 bg-white dark:bg-slate-900 p-2 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
        <button
          onClick={() => setBuilderTab('general')}
          className={`px-4 py-2.5 rounded-xl text-xs font-extrabold flex items-center gap-2 transition ${
            builderTab === 'general'
              ? 'bg-indigo-600 text-white shadow-sm'
              : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <FileText className="w-4 h-4" /> 1. Cài Đặt Chung & Quyền Xem Đáp Án
        </button>
        <button
          onClick={() => setBuilderTab('listening')}
          className={`px-4 py-2.5 rounded-xl text-xs font-extrabold flex items-center gap-2 transition ${
            builderTab === 'listening'
              ? 'bg-blue-600 text-white shadow-sm'
              : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <Headphones className="w-4 h-4" /> 2. Phần Listening & File Ghi Âm ({testForm.listening?.questions?.length || 0} câu)
        </button>
        <button
          onClick={() => setBuilderTab('reading')}
          className={`px-4 py-2.5 rounded-xl text-xs font-extrabold flex items-center gap-2 transition ${
            builderTab === 'reading'
              ? 'bg-indigo-600 text-white shadow-sm'
              : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <BookOpen className="w-4 h-4" /> 3. Phần Reading & Hình Ảnh ({testForm.reading?.questions?.length || 0} câu)
        </button>
        <button
          onClick={() => setBuilderTab('writing')}
          className={`px-4 py-2.5 rounded-xl text-xs font-extrabold flex items-center gap-2 transition ${
            builderTab === 'writing'
              ? 'bg-emerald-600 text-white shadow-sm'
              : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <PenTool className="w-4 h-4" /> 4. Phần Writing & Bài Mẫu
        </button>
      </div>

      {/* TAB 1: GENERAL SETTINGS & ALLOW VIEW ANSWERS */}
      {builderTab === 'general' && (
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 sm:p-8 space-y-6 shadow-sm">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="md:col-span-2">
              <label className="block text-xs font-extrabold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">
                Tên Đề Thi IELTS
              </label>
              <input
                type="text"
                value={testForm.title}
                onChange={e => setTestForm({ ...testForm, title: e.target.value })}
                className="w-full px-4 py-3 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-sm font-bold text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                placeholder="VD: IELTS Academic Practice Test 05 - Cambridge Format"
              />
            </div>

            <div>
              <label className="block text-xs font-extrabold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">
                Giới Hạn Số Lần Nghe Audio
              </label>
              <input
                type="number"
                min={1}
                max={10}
                value={testForm.maxAudioPlays}
                onChange={e => setTestForm({ ...testForm, maxAudioPlays: Number(e.target.value) || 1 })}
                className="w-full px-4 py-3 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-sm font-bold text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-extrabold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">
              Mô Tả Chi Tiết Đề Thi
            </label>
            <textarea
              rows={3}
              value={testForm.description}
              onChange={e => setTestForm({ ...testForm, description: e.target.value })}
              className="w-full px-4 py-3 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 border border-slate-300 dark:border-slate-700 rounded-xl text-xs leading-relaxed focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              placeholder="Mô tả nội dung các phần thi để học viên nắm rõ trước khi bắt đầu..."
            />
          </div>

          {/* Permission Control Card */}
          <div className="p-5 rounded-2xl bg-gradient-to-r from-indigo-50 via-blue-50 to-slate-50 dark:from-indigo-950/50 dark:via-slate-800/80 dark:to-slate-900 border border-indigo-200 dark:border-indigo-500/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-start gap-3.5">
              <div className={`p-3 rounded-2xl ${testForm.allowViewAnswers ? 'bg-emerald-600 text-white' : 'bg-slate-800 text-amber-300'}`}>
                {testForm.allowViewAnswers ? <Unlock className="w-5 h-5" /> : <Lock className="w-5 h-5" />}
              </div>
              <div>
                <h3 className="font-extrabold text-sm text-slate-900 dark:text-white">
                  Quyền Xem Đáp Án Đúng Khi Xem Lại Điểm (Dành Cho Học Sinh)
                </h3>
                <p className="text-xs text-slate-600 dark:text-slate-300 mt-1 leading-relaxed max-w-xl">
                  Khi bật tính năng này, học sinh sau khi nộp bài có thể nhìn thấy đáp án đúng của từng câu Listening, Reading và bài mẫu Writing. Nếu tắt, học sinh chỉ biết câu trả lời của mình là Đúng/Sai còn đáp án đúng sẽ bị khóa.
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setTestForm(prev => ({ ...prev, allowViewAnswers: !prev.allowViewAnswers }))}
              className={`px-5 py-3 rounded-xl text-xs font-extrabold flex items-center gap-2 transition shadow-sm flex-shrink-0 ${
                testForm.allowViewAnswers
                  ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                  : 'bg-slate-900 hover:bg-slate-800 text-amber-300 border border-slate-700'
              }`}
            >
              {testForm.allowViewAnswers ? (
                <>
                  <Unlock className="w-4 h-4" /> Đang Bật Cho Phép Xem Đáp Án
                </>
              ) : (
                <>
                  <Lock className="w-4 h-4" /> Đang Khóa Đáp Án Với Học Sinh
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* TAB 2: LISTENING BUILDER (AUDIO UPLOAD + QUESTIONS CRUD) */}
      {builderTab === 'listening' && (
        <div className="space-y-6">
          {/* Audio Upload & Transcript Card */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 sm:p-8 shadow-sm space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-slate-100 dark:border-slate-800 pb-4">
              <div>
                <h2 className="text-lg font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                  <Headphones className="w-5 h-5 text-blue-600 dark:text-blue-400" /> Cấu Hình File Ghi Âm (Audio) Phần Listening
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  Tải lên file âm thanh (.mp3, .wav, .ogg) từ máy tính hoặc dán link URL. Nếu để trống, hệ thống sẽ tự động đọc Transcript bằng giọng AI.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Upload File Box */}
              <div className="border-2 border-dashed border-blue-200 dark:border-blue-500/40 bg-blue-50/40 dark:bg-blue-500/10 rounded-2xl p-5 flex flex-col justify-between">
                <div>
                  <span className="text-xs font-extrabold text-blue-900 dark:text-blue-300 uppercase tracking-wider flex items-center gap-1.5 mb-2">
                    <Upload className="w-4 h-4 text-blue-600 dark:text-blue-400" /> Tải File Ghi Âm Từ Máy Tính
                  </span>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mb-4">
                    Hỗ trợ định dạng MP3, WAV, OGG, M4A (Tối đa 15MB).
                  </p>
                </div>

                <div className="space-y-3">
                  <label className="cursor-pointer inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold px-4 py-2.5 rounded-xl shadow-sm transition">
                    <Upload className="w-4 h-4" />
                    <span>Chọn File Ghi Âm (.mp3 / .wav)</span>
                    <input
                      type="file"
                      accept="audio/*"
                      onChange={handleAudioFileUpload}
                      className="hidden"
                    />
                  </label>

                  {testForm.listening?.audioFileName && (
                    <div className="flex items-center justify-between bg-white dark:bg-slate-800 px-3.5 py-2 rounded-xl border border-blue-200 dark:border-blue-500/30 text-xs">
                      <span className="font-bold text-blue-800 dark:text-blue-300 truncate">
                        🎵 {testForm.listening.audioFileName}
                      </span>
                      <button
                        type="button"
                        onClick={() =>
                          setTestForm(prev => ({
                            ...prev,
                            listening: { ...prev.listening, audioUrl: '', audioFileName: '' }
                          }))
                        }
                        className="text-rose-600 dark:text-rose-400 hover:underline font-bold ml-2"
                      >
                        Xóa file
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Direct Audio URL & Preview */}
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                    Hoặc Dán Đường Dẫn URL File Audio (.mp3)
                  </label>
                  <input
                    type="text"
                    value={testForm.listening?.audioUrl?.startsWith('data:') ? '' : (testForm.listening?.audioUrl || '')}
                    onChange={e =>
                      setTestForm(prev => ({
                        ...prev,
                        listening: {
                          ...prev.listening,
                          audioUrl: e.target.value,
                          audioFileName: e.target.value ? 'External Audio URL' : ''
                        }
                      }))
                    }
                    placeholder="https://example.com/ielts-listening-section1.mp3"
                    className="w-full px-3.5 py-2.5 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 border border-slate-300 dark:border-slate-700 rounded-xl text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>

                {testForm.listening?.audioUrl && (
                  <div className="bg-slate-50 dark:bg-slate-800/70 p-3.5 rounded-2xl border border-slate-200 dark:border-slate-700">
                    <p className="text-[11px] font-bold text-slate-600 dark:text-slate-300 mb-2">Nghe thử file ghi âm đã tải lên:</p>
                    <audio controls src={testForm.listening.audioUrl} className="w-full h-9" />
                  </div>
                )}
              </div>
            </div>

            {/* Transcript */}
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                Nội Dung Transcript Bài Nghe (Dùng cho giọng đọc AI nếu không tải file MP3)
              </label>
              <textarea
                rows={4}
                value={testForm.listening?.transcript || ''}
                onChange={e =>
                  setTestForm(prev => ({
                    ...prev,
                    listening: { ...prev.listening, transcript: e.target.value }
                  }))
                }
                className="w-full p-3.5 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 border border-slate-300 dark:border-slate-700 rounded-xl text-xs leading-relaxed focus:ring-2 focus:ring-blue-500 focus:outline-none"
                placeholder="Nhập lời thoại bài nghe tại đây..."
              />
            </div>
          </div>

          {/* Listening Questions List */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 sm:p-8 shadow-sm">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 pb-4 border-b border-slate-200 dark:border-slate-800 mb-6">
              <div>
                <h3 className="font-extrabold text-base text-slate-900 dark:text-white">
                  Danh Sách Câu Hỏi Listening ({testForm.listening?.questions?.length || 0} câu)
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Thêm câu hỏi Trắc nghiệm (MCQ), Điền từ vào chỗ trống (Fill-in-the-blank) hoặc True/False/Not Given.
                </p>
              </div>

              <button
                type="button"
                onClick={() => addQuestionToSkill('listening')}
                className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-extrabold px-4 py-2.5 rounded-xl shadow-sm transition flex items-center gap-1.5"
              >
                <Plus className="w-4 h-4" /> Thêm Câu Hỏi Listening
              </button>
            </div>

            <div className="space-y-5">
              {(testForm.listening?.questions || []).map((q, idx) => (
                <div key={q.id} className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-4">
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                    <span className="text-xs font-extrabold bg-blue-600 text-white px-3 py-1 rounded-lg">
                      Câu hỏi #{idx + 1}
                    </span>

                    <div className="flex items-center gap-3">
                      <select
                        value={q.type}
                        onChange={e => updateQuestionInSkill('listening', q.id, 'type', e.target.value)}
                        className="px-3 py-1.5 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-200"
                      >
                        <option value="mcq">Trắc nghiệm 4 lựa chọn (MCQ)</option>
                        <option value="fill">Điền từ vào chỗ trống (Fill-in-blank)</option>
                        <option value="tfng">True / False / Not Given</option>
                      </select>

                      <button
                        type="button"
                        onClick={() => removeQuestionFromSkill('listening', q.id)}
                        className="p-2 text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-500/20 rounded-xl transition"
                        title="Xóa câu hỏi này"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-300 uppercase mb-1">
                      Nội dung câu hỏi
                    </label>
                    <input
                      type="text"
                      value={q.question}
                      onChange={e => updateQuestionInSkill('listening', q.id, 'question', e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                      placeholder="Nhập đề bài câu hỏi..."
                    />
                  </div>

                  {q.type === 'mcq' && (
                    <div>
                      <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-300 uppercase mb-2">
                        Các phương án lựa chọn (A, B, C, D)
                      </label>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                        {(q.options || []).map((opt, optIdx) => (
                          <input
                            key={optIdx}
                            type="text"
                            value={opt}
                            onChange={e => updateOptionInSkill('listening', q.id, optIdx, e.target.value)}
                            className="px-3 py-2 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 border border-slate-300 dark:border-slate-700 rounded-xl text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none"
                            placeholder={`Phương án ${optIdx + 1}`}
                          />
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Correct Answer Field */}
                  <div className="bg-emerald-50/80 dark:bg-emerald-500/15 p-3.5 rounded-xl border border-emerald-200 dark:border-emerald-500/30">
                    <label className="block text-[11px] font-extrabold text-emerald-800 dark:text-emerald-300 uppercase mb-1">
                      ✅ Đáp án đúng của câu hỏi này (Dùng để chấm điểm tự động)
                    </label>
                    {q.type === 'mcq' || q.type === 'tfng' ? (
                      <select
                        value={q.correctAnswer}
                        onChange={e => updateQuestionInSkill('listening', q.id, 'correctAnswer', e.target.value)}
                        className="w-full sm:w-80 px-3 py-2 bg-white dark:bg-slate-900 border border-emerald-300 dark:border-emerald-500/40 rounded-xl text-xs font-extrabold text-emerald-900 dark:text-emerald-200"
                      >
                        {(q.options || []).map((opt, i) => (
                          <option key={i} value={opt}>
                            {opt}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <input
                        type="text"
                        value={q.correctAnswer}
                        onChange={e => updateQuestionInSkill('listening', q.id, 'correctAnswer', e.target.value)}
                        className="w-full sm:w-80 px-3.5 py-2 bg-white dark:bg-slate-900 border border-emerald-300 dark:border-emerald-500/40 rounded-xl text-xs font-extrabold text-emerald-900 dark:text-emerald-200"
                        placeholder="Nhập từ/cụm từ đáp án đúng..."
                      />
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: READING BUILDER (PASSAGE + IMAGE UPLOAD + QUESTIONS CRUD) */}
      {builderTab === 'reading' && (
        <div className="space-y-6">
          {/* Reading Passage & Image Upload Card */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 sm:p-8 shadow-sm space-y-6">
            <div>
              <h2 className="text-lg font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-indigo-600 dark:text-indigo-400" /> Nội Dung Bài Đọc (Reading Passage) & Hình Ảnh Minh Họa
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Nhập văn bản bài đọc và tải lên hình ảnh minh họa, sơ đồ hoặc biểu đồ cho phần Reading.
              </p>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">Tiêu Đề Bài Đọc (Passage Title)</label>
              <input
                type="text"
                value={testForm.reading?.passageTitle || ''}
                onChange={e =>
                  setTestForm(prev => ({
                    ...prev,
                    reading: { ...prev.reading, passageTitle: e.target.value }
                  }))
                }
                className="w-full px-4 py-2.5 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-sm font-bold text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                placeholder="VD: READING PASSAGE 1: The Evolution of Urban Architecture"
              />
            </div>

            {/* Reading Image Upload & URL */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-indigo-50/40 dark:bg-indigo-500/10 p-5 rounded-2xl border border-indigo-100 dark:border-indigo-500/30">
              <div className="space-y-3">
                <span className="text-xs font-extrabold text-indigo-950 dark:text-indigo-200 uppercase flex items-center gap-1.5">
                  <Image className="w-4 h-4 text-indigo-600 dark:text-indigo-400" /> Thêm Ảnh Cho Phần Reading
                </span>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  Tải ảnh từ máy tính (.png, .jpg, .webp) hoặc dán đường dẫn URL hình ảnh minh họa cho bài đọc.
                </p>

                <div className="flex flex-wrap items-center gap-2 pt-1">
                  <label className="cursor-pointer inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold px-4 py-2.5 rounded-xl shadow-sm transition">
                    <Upload className="w-4 h-4" />
                    <span>Tải Ảnh Lên Từ Máy Tính</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleReadingImageUpload}
                      className="hidden"
                    />
                  </label>

                  {testForm.reading?.imageUrl && (
                    <button
                      type="button"
                      onClick={() =>
                        setTestForm(prev => ({
                          ...prev,
                          reading: { ...prev.reading, imageUrl: '' }
                        }))
                      }
                      className="px-3 py-2 text-xs font-bold text-rose-600 dark:text-rose-400 bg-white dark:bg-slate-900 hover:bg-rose-50 dark:hover:bg-rose-500/20 rounded-xl border border-rose-200 dark:border-rose-500/30 transition"
                    >
                      Xóa Ảnh
                    </button>
                  )}
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-300 mb-1">
                    Hoặc dán Link URL hình ảnh:
                  </label>
                  <input
                    type="text"
                    value={testForm.reading?.imageUrl?.startsWith('data:') ? '' : (testForm.reading?.imageUrl || '')}
                    onChange={e =>
                      setTestForm(prev => ({
                        ...prev,
                        reading: { ...prev.reading, imageUrl: e.target.value }
                      }))
                    }
                    placeholder="https://example.com/reading-diagram.png"
                    className="w-full px-3 py-2 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 border border-slate-300 dark:border-slate-700 rounded-xl text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="flex items-center justify-center bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700 p-3 min-h-[160px]">
                {testForm.reading?.imageUrl ? (
                  <img
                    src={testForm.reading.imageUrl}
                    alt="Reading Preview"
                    className="max-h-44 object-contain rounded-lg"
                  />
                ) : (
                  <div className="text-center text-xs text-slate-400">
                    <Image className="w-8 h-8 mx-auto mb-1.5 text-slate-300 dark:text-slate-600" />
                    <span>Chưa có hình ảnh đính kèm cho bài Reading</span>
                  </div>
                )}
              </div>
            </div>

            {/* Passage Text */}
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                Nội Dung Văn Bản Bài Đọc (Passage Text)
              </label>
              <textarea
                rows={8}
                value={testForm.reading?.passageText || ''}
                onChange={e =>
                  setTestForm(prev => ({
                    ...prev,
                    reading: { ...prev.reading, passageText: e.target.value }
                  }))
                }
                className="w-full p-4 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 border border-slate-300 dark:border-slate-700 rounded-2xl text-xs leading-relaxed font-serif focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                placeholder="Nhập toàn bộ nội dung bài đọc Reading tại đây..."
              />
            </div>
          </div>

          {/* Reading Questions CRUD */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 sm:p-8 shadow-sm">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 pb-4 border-b border-slate-200 dark:border-slate-800 mb-6">
              <div>
                <h3 className="font-extrabold text-base text-slate-900 dark:text-white">
                  Danh Sách Câu Hỏi Reading ({testForm.reading?.questions?.length || 0} câu)
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Hỗ trợ câu hỏi True/False/Not Given, Trắc nghiệm (MCQ) và Điền từ vào chỗ trống.
                </p>
              </div>

              <button
                type="button"
                onClick={() => addQuestionToSkill('reading')}
                className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-extrabold px-4 py-2.5 rounded-xl shadow-sm transition flex items-center gap-1.5"
              >
                <Plus className="w-4 h-4" /> Thêm Câu Hỏi Reading
              </button>
            </div>

            <div className="space-y-5">
              {(testForm.reading?.questions || []).map((q, idx) => (
                <div key={q.id} className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-4">
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                    <span className="text-xs font-extrabold bg-indigo-600 text-white px-3 py-1 rounded-lg">
                      Câu hỏi Reading #{idx + 1}
                    </span>

                    <div className="flex items-center gap-3">
                      <select
                        value={q.type}
                        onChange={e => updateQuestionInSkill('reading', q.id, 'type', e.target.value)}
                        className="px-3 py-1.5 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-200"
                      >
                        <option value="tfng">True / False / Not Given</option>
                        <option value="mcq">Trắc nghiệm 4 lựa chọn (MCQ)</option>
                        <option value="fill">Điền từ vào chỗ trống (Fill-in-blank)</option>
                      </select>

                      <button
                        type="button"
                        onClick={() => removeQuestionFromSkill('reading', q.id)}
                        className="p-2 text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-500/20 rounded-xl transition"
                        title="Xóa câu hỏi này"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-300 uppercase mb-1">
                      Nội dung câu hỏi
                    </label>
                    <input
                      type="text"
                      value={q.question}
                      onChange={e => updateQuestionInSkill('reading', q.id, 'question', e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                      placeholder="Nhập câu hỏi Reading..."
                    />
                  </div>

                  {q.type === 'mcq' && (
                    <div>
                      <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-300 uppercase mb-2">
                        Các phương án lựa chọn (A, B, C, D)
                      </label>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                        {(q.options || []).map((opt, optIdx) => (
                          <input
                            key={optIdx}
                            type="text"
                            value={opt}
                            onChange={e => updateOptionInSkill('reading', q.id, optIdx, e.target.value)}
                            className="px-3 py-2 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 border border-slate-300 dark:border-slate-700 rounded-xl text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                            placeholder={`Phương án ${optIdx + 1}`}
                          />
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Correct Answer Field */}
                  <div className="bg-emerald-50/80 dark:bg-emerald-500/15 p-3.5 rounded-xl border border-emerald-200 dark:border-emerald-500/30">
                    <label className="block text-[11px] font-extrabold text-emerald-800 dark:text-emerald-300 uppercase mb-1">
                      ✅ Đáp án đúng của câu hỏi này
                    </label>
                    {q.type === 'mcq' || q.type === 'tfng' ? (
                      <select
                        value={q.correctAnswer}
                        onChange={e => updateQuestionInSkill('reading', q.id, 'correctAnswer', e.target.value)}
                        className="w-full sm:w-80 px-3 py-2 bg-white dark:bg-slate-900 border border-emerald-300 dark:border-emerald-500/40 rounded-xl text-xs font-extrabold text-emerald-900 dark:text-emerald-200"
                      >
                        {(q.options || []).map((opt, i) => (
                          <option key={i} value={opt}>
                            {opt}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <input
                        type="text"
                        value={q.correctAnswer}
                        onChange={e => updateQuestionInSkill('reading', q.id, 'correctAnswer', e.target.value)}
                        className="w-full sm:w-80 px-3.5 py-2 bg-white dark:bg-slate-900 border border-emerald-300 dark:border-emerald-500/40 rounded-xl text-xs font-extrabold text-emerald-900 dark:text-emerald-200"
                        placeholder="Nhập từ/cụm từ đáp án đúng..."
                      />
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: WRITING BUILDER (PROMPTS, CHART IMAGE & MODEL ANSWERS) */}
      {builderTab === 'writing' && (
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 sm:p-8 space-y-8 shadow-sm">
          {/* Task 1 */}
          <div className="space-y-4 pb-6 border-b border-slate-200 dark:border-slate-800">
            <h3 className="font-extrabold text-base text-slate-900 dark:text-white flex items-center gap-2">
              <PenTool className="w-4 h-4 text-blue-600 dark:text-blue-400" /> Writing Academic Task 1 ( Tối thiểu 150 từ )
            </h3>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Đề Bài Writing Task 1 (Prompt)</label>
              <textarea
                rows={3}
                value={testForm.writing?.task1?.prompt || ''}
                onChange={e =>
                  setTestForm({
                    ...testForm,
                    writing: { ...testForm.writing, task1: { ...testForm.writing.task1, prompt: e.target.value } }
                  })
                }
                className="w-full p-3.5 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 border border-slate-300 dark:border-slate-700 rounded-xl text-xs leading-relaxed focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>

            {/* Task 1 Chart Image Upload */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-slate-50 dark:bg-slate-800/60 p-4 rounded-2xl border border-slate-200 dark:border-slate-700">
              <div className="space-y-2.5">
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-200">
                  Hình Ảnh Biểu Đồ / Bản Đồ Writing Task 1 (Tùy chọn)
                </label>
                <div className="flex items-center gap-2">
                  <label className="cursor-pointer inline-flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold px-3.5 py-2 rounded-xl transition">
                    <Upload className="w-3.5 h-3.5" />
                    <span>Tải Ảnh Biểu Đồ Task 1</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleWritingTask1ImageUpload}
                      className="hidden"
                    />
                  </label>
                  {testForm.writing?.task1?.imageUrl && (
                    <button
                      type="button"
                      onClick={() =>
                        setTestForm(prev => ({
                          ...prev,
                          writing: { ...prev.writing, task1: { ...prev.writing.task1, imageUrl: '' } }
                        }))
                      }
                      className="text-xs text-rose-600 dark:text-rose-400 font-bold hover:underline"
                    >
                      Xóa ảnh
                    </button>
                  )}
                </div>
              </div>

              {testForm.writing?.task1?.imageUrl && (
                <div className="bg-white dark:bg-slate-900 p-2 rounded-xl border border-slate-200 dark:border-slate-700 flex justify-center">
                  <img
                    src={testForm.writing.task1.imageUrl}
                    alt="Task 1 Chart Preview"
                    className="max-h-36 object-contain rounded"
                  />
                </div>
              )}
            </div>

            <div>
              <label className="block text-xs font-bold text-emerald-800 dark:text-emerald-300 mb-1">
                Bài Mẫu Tham Khảo Task 1 (Hiển thị khi Giáo viên bật cho phép xem đáp án)
              </label>
              <textarea
                rows={4}
                value={testForm.writing?.task1?.modelAnswer || ''}
                onChange={e =>
                  setTestForm({
                    ...testForm,
                    writing: { ...testForm.writing, task1: { ...testForm.writing.task1, modelAnswer: e.target.value } }
                  })
                }
                placeholder="Nhập bài viết mẫu Band 8.0+ cho Task 1..."
                className="w-full p-3.5 border border-emerald-300 dark:border-emerald-500/40 bg-emerald-50/30 dark:bg-emerald-500/10 text-slate-900 dark:text-slate-100 rounded-xl text-xs leading-relaxed focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              />
            </div>
          </div>

          {/* Task 2 */}
          <div className="space-y-4">
            <h3 className="font-extrabold text-base text-slate-900 dark:text-white flex items-center gap-2">
              <PenTool className="w-4 h-4 text-indigo-600 dark:text-indigo-400" /> Writing Academic Task 2 ( Tối thiểu 250 từ )
            </h3>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Đề Bài Writing Task 2 (Prompt)</label>
              <textarea
                rows={3}
                value={testForm.writing?.task2?.prompt || ''}
                onChange={e =>
                  setTestForm({
                    ...testForm,
                    writing: { ...testForm.writing, task2: { ...testForm.writing.task2, prompt: e.target.value } }
                  })
                }
                className="w-full p-3.5 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 border border-slate-300 dark:border-slate-700 rounded-xl text-xs leading-relaxed focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-emerald-800 dark:text-emerald-300 mb-1">
                Bài Mẫu Tham Khảo Task 2 (Hiển thị khi Giáo viên bật cho phép xem đáp án)
              </label>
              <textarea
                rows={4}
                value={testForm.writing?.task2?.modelAnswer || ''}
                onChange={e =>
                  setTestForm({
                    ...testForm,
                    writing: { ...testForm.writing, task2: { ...testForm.writing.task2, modelAnswer: e.target.value } }
                  })
                }
                placeholder="Nhập bài viết mẫu Band 8.0+ cho Task 2..."
                className="w-full p-3.5 border border-emerald-300 dark:border-emerald-500/40 bg-emerald-50/30 dark:bg-emerald-500/10 text-slate-900 dark:text-slate-100 rounded-xl text-xs leading-relaxed focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );

  // ==========================================
  // MAIN VIEW ROUTER
  // ==========================================
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 font-sans text-slate-900 dark:text-slate-100 antialiased selection:bg-blue-200 dark:selection:bg-indigo-700 transition-colors duration-200">
      {/* Navbar rendered when not on Auth or Full Exam view */}
      {view !== 'AUTH' && view !== 'EXAM_MODE' && view !== 'GAME_ARENA' && renderNavbar()}

      {/* Main Views */}
      {view === 'AUTH' && renderAuthScreen()}
      {view === 'HOME' && renderStudentHome()}
      {view === 'STUDENT_PROFILE' && renderStudentProfile()}
      {view === 'GAME_ARENA' && renderGameArena()}
      {view === 'EXAM_MODE' && renderExamMode()}
      {view === 'RESULT_VIEW' && renderResultView()}
      {view === 'TEACHER_DASHBOARD' && renderTeacherDashboard()}
      {view === 'EXAM_BUILDER' && renderExamBuilder()}

      {/* AI Key Configuration Modal */}
      {showApiKeyModal && (
        <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-md w-full shadow-2xl border border-slate-200 dark:border-slate-700 p-6">
            <div className="flex justify-between items-center pb-3 border-b border-slate-200 dark:border-slate-800 mb-4">
              <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Key className="w-4 h-4 text-indigo-600 dark:text-indigo-400" /> Cấu Hình AI Grader API Key
              </h3>
              <button onClick={() => setShowApiKeyModal(false)} className="text-slate-400 hover:text-slate-700 dark:hover:text-slate-200">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Google Gemini API Key
                </label>
                <input
                  type="password"
                  placeholder="AIzaSy..."
                  value={aiApiKey}
                  onChange={e => setAiApiKey(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-mono focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1.5 leading-relaxed">
                  Lấy API Key miễn phí tại <a href="https://aistudio.google.com" target="_blank" rel="noreferrer" className="text-blue-600 dark:text-blue-400 underline font-semibold">Google AI Studio</a>. Nếu để trống, hệ thống sẽ sử dụng thuật toán AI Examiner mô phỏng tiêu chí IELTS có sẵn.
                </p>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  onClick={() => setShowApiKeyModal(false)}
                  className="px-4 py-2 text-xs font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl"
                >
                  Đóng
                </button>
                <button
                  onClick={() => {
                    localStorage.setItem('ielts_ai_key', aiApiKey);
                    setShowApiKeyModal(false);
                    alert('Đã lưu cấu hình API Key!');
                  }}
                  className="px-4 py-2 text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl shadow-sm"
                >
                  Lưu Cấu Hình
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Teacher Vocab Modal for Game */}
      {showVocabModal && (
        <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-2xl w-full shadow-2xl border border-slate-200 dark:border-slate-700 p-6">
            <div className="flex justify-between items-center pb-3 border-b border-slate-200 dark:border-slate-800 mb-4">
              <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Edit className="w-4 h-4 text-purple-600 dark:text-purple-400" /> Sửa Bộ Từ Vựng Game 3 Vòng (Phòng {currentRoomPin})
              </h3>
              <button onClick={() => setShowVocabModal(false)} className="text-slate-400 hover:text-slate-700 dark:hover:text-slate-200">
                <X className="w-5 h-5" />
              </button>
            </div>

            <textarea
              rows={10}
              value={customVocabInput}
              onChange={e => setCustomVocabInput(e.target.value)}
              className="w-full p-3 font-mono text-xs bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 border border-slate-300 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-purple-500 focus:outline-none mb-4"
              placeholder="TỪ | Nghĩa tiếng Việt | /Phiên âm/ | Ví dụ câu..."
            />

            <div className="flex justify-between items-center">
              <button
                onClick={() => setCustomVocabInput(DEFAULT_VOCAB_TEXT)}
                className="text-xs text-slate-500 dark:text-slate-400 hover:underline"
              >
                Khôi phục 12 từ mặc định
              </button>
              <div className="flex gap-2">
                <button
                  onClick={() => setShowVocabModal(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl"
                >
                  Hủy
                </button>
                <button
                  onClick={() => {
                    const parsed = parseRawVocabText(customVocabInput);
                    if (parsed.length < 3) {
                      alert('Vui lòng nhập tối thiểu 3 từ vựng!');
                      return;
                    }
                    setRoomsDb(prev => ({
                      ...prev,
                      [currentRoomPin]: {
                        ...prev[currentRoomPin],
                        rawVocab: customVocabInput
                      }
                    }));
                    setShowVocabModal(false);
                    alert(`Đã lưu ${parsed.length} từ vựng cho phòng ${currentRoomPin}!`);
                  }}
                  className="px-4 py-2 text-xs font-bold bg-purple-600 hover:bg-purple-700 text-white rounded-xl shadow"
                >
                  Lưu & Cập Nhật
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      {/* Global Floating Toast */}
      {globalToast.visible && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 dark:bg-slate-800 text-white text-xs font-bold px-4 py-3 rounded-2xl shadow-2xl border border-slate-700 flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-emerald-400" />
          <span>{globalToast.text}</span>
        </div>
      )}
    </div>
  );
}
