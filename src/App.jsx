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
  Lightbulb,
  Users,
  Rocket,
  Copy,
  Check,
  Wifi,
  RefreshCw,
  Send,
  ShieldCheck,
  Crown,
  EyeOff,
  ArrowRight,
  DoorOpen,
  Camera,
  TrendingDown,
  Heart,
  Zap,
  Globe,
  ArrowUp,
  ArrowDown,
  SlidersHorizontal,
  Download,
  VolumeX,
  Snowflake,
  UserPlus,
  UserMinus,
  Filter,
  Share2,
  Pause
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
const GAME_SPEED_OFFSETS = { relaxed: 6, normal: 0, turbo: -5 };

const VOCAB_PRESETS = {
  environment: {
    label: 'Môi trường & Khí hậu',
    text: `SUSTAINABLE | Bền vững, không gây cạn kiệt tài nguyên | /səˈsteɪ.nə.bəl/ | Sustainable energy sources reduce long-term carbon emissions.
BIODIVERSITY | Đa dạng sinh học | /ˌbaɪ.əʊ.daɪˈvɜː.sə.ti/ | Deforestation poses a severe threat to global biodiversity.
ECOSYSTEM | Hệ sinh thái | /ˈiː.kəʊ.sɪs.təm/ | Plastic pollution disrupts fragile marine ecosystems.
EMISSION | Khí thải, sự phát thải | /iˈmɪʃ.ən/ | Governments agreed to cut greenhouse gas emissions by 2030.
CONTAMINATE | Làm ô nhiễm, làm nhiễm bẩn | /kənˈtæm.ɪ.neɪt/ | Industrial waste can easily contaminate local drinking water.
CONSERVATION | Sự bảo tồn thiên nhiên | /ˌkɒn.səˈveɪ.ʃən/ | Wildlife conservation programs help endangered species recover.
DEPLETE | Làm cạn kiệt, rút cạn | /dɪˈpliːt/ | Overfishing continues to deplete global fish stocks.
RENEWABLE | Có thể tái tạo | /rɪˈnjuː.ə.bəl/ | Solar and wind power are rapidly growing renewable resources.`
  },
  technology: {
    label: 'Công nghệ & AI',
    text: `AUTOMATION | Tự động hóa | /ˌɔː.təˈmeɪ.ʃən/ | Factory automation improves efficiency but reshapes labor markets.
ALGORITHM | Thuật toán | /ˈæl.ɡə.rɪ.ðəm/ | Social media platforms rely on algorithms to personalize feeds.
DISRUPTIVE | Mang tính đột phá, làm thay đổi cuộc chơi | /dɪsˈrʌp.tɪv/ | Generative AI has proved to be a disruptive innovation.
OBSOLETE | Lỗi thời, không còn được dùng | /ˌɒb.səlˈiːt/ | Smartphones rendered many standalone cameras obsolete.
CYBERSECURITY | An ninh mạng | /ˌsaɪ.bə.sɪˈkjʊə.rə.ti/ | Banks invest heavily in cybersecurity to protect customer data.
CONNECTIVITY | Khả năng kết nối mạng | /ˌkɒn.ekˈtɪv.ə.ti/ | High-speed connectivity enables remote work across rural regions.
INNOVATE | Đổi mới, sáng tạo | /ˈɪn.ə.veɪt/ | Startups must constantly innovate to survive fierce competition.
SYNTHETIC | Tổng hợp, nhân tạo | /sɪnˈθet.ɪk/ | Synthetic data helps train models without compromising privacy.`
  },
  education: {
    label: 'Giáo dục & Nghiên cứu',
    text: `CURRICULUM | Chương trình giảng dạy | /kəˈrɪk.jə.ləm/ | Digital literacy should be integrated into the school curriculum.
PEDAGOGY | Phương pháp sư phạm | /ˈped.ə.ɡɒdʒ.i/ | Interactive pedagogy encourages active student participation.
LITERACY | Trình độ đọc viết / kiến thức nền | /ˈlɪt.ər.ə.si/ | Financial literacy empowers young adults to manage savings.
EMPIRICAL | Dựa trên thực nghiệm, bằng chứng | /ɪmˈpɪr.ɪ.kəl/ | Policy reforms should be backed by empirical evidence.
CRITICAL | Mang tính phản biện, then chốt | /ˈkrɪt.ɪ.kəl/ | Universities aim to foster critical thinking skills.
SCHOLARLY | Mang tính học thuật | /ˈskɒl.ə.li/ | Citations are mandatory in scholarly research papers.
MENTORSHIP | Sự cố vấn, hướng dẫn | /ˈmen.tɔː.ʃɪp/ | Peer mentorship reduces dropout rates among first-year students.
APTITUDE | Năng khiếu, khả năng tiếp thu | /ˈæp.tɪ.tjuːd/ | Admission tests evaluate analytical aptitude alongside memory.`
  },
  health: {
    label: 'Y tế & Đời sống',
    text: `SEDENTARY | Ít vận động, ngồi nhiều | /ˈsed.ən.tər.i/ | A sedentary lifestyle increases the risk of heart disease.
PREVALENT | Phổ biến, thịnh hành rộng rãi | /ˈprev.əl.ənt/ | Burnout has become increasingly prevalent among office workers.
IMMUNITY | Hệ miễn dịch, khả năng miễn nhiễm | /ɪˈmjuː.nə.ti/ | Balanced nutrition supports natural immunity against illness.
WELLBEING | Sức khỏe toàn diện & hạnh phúc | /ˈwel.biː.ɪŋ/ | Green urban parks significantly improve resident wellbeing.
NUTRITION | Dinh dưỡng | /njuːˈtrɪʃ.ən/ | Poor nutrition affects both physical growth and concentration.
CHRONIC | Mãn tính, kéo dài | /ˈkrɒn.ɪk/ | Stress is a major contributor to chronic sleep disorders.
THERAPEUTIC | Mang tính trị liệu, chữa lành | /ˌθer.əˈpjuː.tɪk/ | Gardening offers strong therapeutic benefits for mental health.
SANITATION | Hệ thống vệ sinh công cộng | /ˌsæn.ɪˈteɪ.ʃən/ | Clean sanitation drastically lowers waterborne infections.`
  }
};

const DEFAULT_SECTION_ORDER = ['listening', 'reading', 'writing'];
const DEFAULT_SECTION_DURATIONS = { listening: 15, reading: 20, writing: 25 };

const normalizeExamConfig = (test) => {
  const rawOrder = Array.isArray(test?.sectionOrder) ? test.sectionOrder : DEFAULT_SECTION_ORDER;
  const validSkills = new Set(DEFAULT_SECTION_ORDER);
  const deduped = rawOrder.filter((s, idx) => validSkills.has(s) && rawOrder.indexOf(s) === idx);
  const missing = DEFAULT_SECTION_ORDER.filter(s => !deduped.includes(s));
  const order = [...deduped, ...missing];

  const rawDurations = test?.sectionDurations || {};
  const durations = {
    listening: Math.max(1, Number(rawDurations.listening ?? DEFAULT_SECTION_DURATIONS.listening) || 15),
    reading: Math.max(1, Number(rawDurations.reading ?? DEFAULT_SECTION_DURATIONS.reading) || 20),
    writing: Math.max(1, Number(rawDurations.writing ?? DEFAULT_SECTION_DURATIONS.writing) || 25)
  };

  return {
    visibility: test?.visibility === 'private' ? 'private' : 'public',
    maxAttempts: Math.max(0, Number(test?.maxAttempts ?? 0) || 0),
    sequentialMode: test?.sequentialMode !== false,
    allowEarlyNextSection: !!test?.allowEarlyNextSection,
    order,
    durations
  };
};

const getReadingPassages = (readingObj) => {
  if (Array.isArray(readingObj?.passages) && readingObj.passages.length > 0) {
    return readingObj.passages.map((p, idx) => ({
      id: p.id || `passage-${idx + 1}`,
      title: p.title || `Bài đọc ${idx + 1}`,
      imageUrl: p.imageUrl || '',
      imageFileName: p.imageFileName || '',
      passageText: p.passageText || ''
    }));
  }
  return [
    {
      id: 'passage-1',
      title: readingObj?.passageTitle || 'Reading Passage 1',
      imageUrl: readingObj?.imageUrl || '',
      imageFileName: readingObj?.imageFileName || '',
      passageText: readingObj?.passageText || ''
    }
  ];
};

const DEFAULT_TESTS = [
  {
    id: 'test-1',
    title: 'IELTS Academic Practice Test 01 - Full Simulation',
    description: 'Đề thi thử Academic 3 kỹ năng Listening, Reading, Writing chuẩn cấu trúc IDP/BC.',
    createdAt: '2026-03-01',
    visibility: 'public',
    maxAttempts: 0,
    sequentialMode: true,
    allowEarlyNextSection: false,
    sectionOrder: ['listening', 'reading', 'writing'],
    sectionDurations: { listening: 15, reading: 20, writing: 25 },
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

function getSpeedAdjustedTimeLimit(roundNum, speedMode = 'normal') {
  const base = GAME_ROUND_TIME_LIMITS[roundNum] || 20;
  const offset = GAME_SPEED_OFFSETS[speedMode] ?? 0;
  return Math.max(8, base + offset);
}

// Shared answer checker supporting multi-variant IELTS fill-in-the-blank keys (e.g. "15 | fifteen" or "color / colour")
function isObjectiveAnswerCorrect(question, userRaw) {
  const normalizedUser = String(userRaw ?? '').trim().replace(/\s+/g, ' ').toLowerCase();
  const normalizedKey = String(question?.correctAnswer ?? '').trim().replace(/\s+/g, ' ').toLowerCase();
  if (!normalizedUser || !normalizedKey) return false;
  if (question?.type === 'mcq' || question?.type === 'tfng' || !/[|/]/.test(normalizedKey)) {
    return normalizedUser === normalizedKey;
  }
  const acceptedVariants = normalizedKey
    .split(/[|/]/)
    .map(part => part.trim().replace(/\s+/g, ' '))
    .filter(Boolean);
  return acceptedVariants.includes(normalizedUser);
}

function buildRoomInviteLink(pin) {
  const cleanPin = String(pin || '').trim();
  if (!cleanPin || typeof window === 'undefined') return '';
  const url = new URL(window.location.href);
  url.searchParams.set('pin', cleanPin);
  return url.toString();
}

function exportAttemptsToCsv(attemptRows = []) {
  const headers = ['Học viên', 'Tài khoản', 'Đề thi', 'Ngày nộp', 'Listening', 'Reading', 'Writing', 'Overall', 'Chuyển Tab', 'Trạng thái'];
  const csvEscape = (val) => `"${String(val ?? '').replace(/"/g, '""')}"`;
  const lines = [
    headers.map(csvEscape).join(','),
    ...attemptRows.map(att => {
      const lBand = att.scores?.listening?.band ?? '-';
      const rBand = att.scores?.reading?.band ?? '-';
      const wBand = att.scores?.writing?.overallBand ?? '-';
      const overall = att.overallBand ?? '-';
      const statusLabel = att.teacherGraded ? (att.aiGraded ? 'AI Đã Chấm' : 'GV Đã Chấm') : 'Chờ Chấm Writing';
      return [
        att.studentName || '',
        att.studentId || '',
        att.testTitle || '',
        att.submittedAt || '',
        lBand,
        rBand,
        wBand,
        overall,
        att.tabSwitchCount || 0,
        statusLabel
      ].map(csvEscape).join(',');
    })
  ];
  const blob = new Blob(['\uFEFF' + lines.join('\r\n')], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const objectUrl = URL.createObjectURL(blob);
  link.href = objectUrl;
  link.download = `lexiprep-bang-diem-${new Date().toISOString().slice(0, 10)}.csv`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(objectUrl);
}

function parseBulkStudentsText(rawText) {
  const lines = String(rawText || '').split(/\r?\n/).map(l => l.trim()).filter(l => l && !l.startsWith('#'));
  return lines.map(line => {
    const parts = line.includes('|') ? line.split('|') : line.split(',');
    const username = (parts[0] || '').trim().replace(/\s+/g, '_');
    const name = (parts[1] || username).trim();
    const pass = (parts[2] || '123').trim();
    const rawBand = parseFloat((parts[3] || '7.0').trim());
    const targetBand = Number.isFinite(rawBand)
      ? Math.min(9.0, Math.max(4.0, Math.round(rawBand * 2) / 2))
      : 7.0;
    return { username, name, pass, targetBand };
  }).filter(u => u.username && u.pass);
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

const GEMINI_PREFERRED_MODELS = [
  'gemini-2.5-flash',
  'gemini-3.8-flash',
  'gemini-2.0-flash',
  'gemini-2.5-flash-lite',
  'gemini-4-hydrogen',
  'gemini-2.5-pro',
  'gemini-flash-latest'
];

function formatGeminiErrorMessage(status, rawText = '') {
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

async function discoverGeminiModels(cleanKey) {
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

async function callGeminiGenerateJson({ apiKey, promptText, temperature = 0.2 }) {
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

async function testGeminiApiConnection(apiKey) {
  const result = await callGeminiGenerateJson({
    apiKey,
    promptText: 'Return strictly valid JSON: {"status":"ok"}',
    temperature: 0
  });
  return result.usedModel;
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

  const { parsed, usedModel } = await callGeminiGenerateJson({
    apiKey,
    promptText: systemPrompt,
    temperature: 0.2
  });
  return { ...parsed, _usedModel: usedModel };
}

function compressAvatarImageFile(file, targetSize = 160) {
  return new Promise((resolve, reject) => {
    if (!file || !file.type?.startsWith('image/')) {
      reject(new Error('Vui lòng chọn tệp hình ảnh hợp lệ (PNG, JPG, WebP).'));
      return;
    }
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('Không thể đọc tệp ảnh.'));
    reader.onload = () => {
      const img = new window.Image();
      img.onerror = () => reject(new Error('Không thể xử lý định dạng ảnh này.'));
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = targetSize;
        canvas.height = targetSize;
        const ctx = canvas.getContext('2d');
        const minSide = Math.min(img.width, img.height);
        const sx = (img.width - minSide) / 2;
        const sy = (img.height - minSide) / 2;
        ctx.drawImage(img, sx, sy, minSide, minSide, 0, 0, targetSize, targetSize);
        resolve(canvas.toDataURL('image/jpeg', 0.84));
      };
      img.src = reader.result;
    };
    reader.readAsDataURL(file);
  });
}

function UserAvatarBadge({ user, sizeClass = 'w-8 h-8', textClass = 'text-xs', rounded = 'rounded-lg', className = '' }) {
  const initial = user?.name ? user.name[0] : (user?.username ? user.username[0] : 'U');
  if (user?.avatarUrl) {
    return (
      <img
        src={user.avatarUrl}
        alt={user?.name || 'Avatar'}
        className={`${sizeClass} ${rounded} object-cover border border-white/25 shadow-sm shrink-0 ${className}`}
      />
    );
  }
  return (
    <div className={`${sizeClass} ${rounded} bg-indigo-600 dark:bg-indigo-500 flex items-center justify-center font-bold ${textClass} text-white uppercase shrink-0 ${className}`}>
      {initial}
    </div>
  );
}

const CREWMATE_COLORS = [
  { id: 'red', label: 'Đỏ', fill: '#ef4444', shade: '#b91c1c' },
  { id: 'cyan', label: 'Cyan', fill: '#06b6d4', shade: '#0e7490' },
  { id: 'blue', label: 'Xanh', fill: '#3b82f6', shade: '#1d4ed8' },
  { id: 'lime', label: 'Lá', fill: '#22c55e', shade: '#15803d' },
  { id: 'yellow', label: 'Vàng', fill: '#eab308', shade: '#a16207' },
  { id: 'orange', label: 'Cam', fill: '#f97316', shade: '#c2410c' },
  { id: 'pink', label: 'Hồng', fill: '#ec4899', shade: '#be185d' },
  { id: 'purple', label: 'Tím', fill: '#8b5cf6', shade: '#6d28d9' },
  { id: 'white', label: 'Trắng', fill: '#e2e8f0', shade: '#94a3b8' }
];

function AmongUsCrewmate({ colorId = 'cyan', avatarUrl = '', size = 56, flip = false, animate = true }) {
  const isAvatarSuit = colorId === 'avatar' && Boolean(avatarUrl);
  const palette = isAvatarSuit
    ? { id: 'avatar', label: 'Mặt Avatar', fill: '#4f46e5', shade: '#312e81' }
    : (CREWMATE_COLORS.find(c => c.id === colorId) || CREWMATE_COLORS[1]);
  const headDia = Math.round(size * 0.68);

  return (
    <div
      className={`relative inline-flex items-end justify-center shrink-0 ${animate ? 'animate-crewmate-bob' : ''}`}
      style={{ width: size, height: Math.round(size * 1.15) }}
    >
      <svg
        width={size}
        height={size * 1.15}
        viewBox="0 0 64 74"
        className="drop-shadow-[0_6px_12px_rgba(0,0,0,0.45)]"
        style={flip ? { transform: 'scaleX(-1)' } : undefined}
      >
        {/* Oxygen Backpack */}
        <rect x="6" y="24" width="13" height="27" rx="6" fill={palette.shade} stroke="#0f172a" strokeWidth="3.5" />
        {/* Body Silhouette */}
        <path
          d="M17 24 C17 10, 49 10, 49 24 L49 52 L49 63 C49 67, 45 69, 41 69 C37 69, 36 66, 36 62 L36 55 L29 55 L29 62 C29 66, 27 69, 23 69 C19 69, 17 67, 17 63 Z"
          fill={palette.fill}
          stroke="#0f172a"
          strokeWidth="3.5"
          strokeLinejoin="round"
        />
        {/* Subtle Body Highlight */}
        <path
          d="M22 20 C24 14, 39 14, 43 19"
          stroke="rgba(255,255,255,0.3)"
          strokeWidth="3"
          strokeLinecap="round"
          fill="none"
        />
        {/* Visor */}
        <rect x="27" y="19" width="24" height="14" rx="7" fill="#7dd3fc" stroke="#0f172a" strokeWidth="3.2" />
        <ellipse cx="42" cy="23.5" rx="6" ry="2.6" fill="#e0f2fe" opacity="0.9" />
      </svg>

      {/* Avatar Helmet Head Overlay when user selects Avatar Face Suit */}
      {isAvatarSuit && (
        <div
          className="absolute left-1/2 -translate-x-1/2 rounded-full overflow-hidden border-[3px] border-cyan-300 bg-slate-900 shadow-[0_0_14px_rgba(34,211,238,0.65)] pointer-events-none"
          style={{
            width: headDia,
            height: headDia,
            top: -Math.round(headDia * 0.24)
          }}
        >
          <img src={avatarUrl} alt="Avatar nhân vật" className="w-full h-full object-cover" />
          <div className="absolute inset-0 rounded-full ring-1 ring-inset ring-white/30" />
        </div>
      )}
    </div>
  );
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
  if (typeof window !== 'undefined' && window.__lexiprepMuted) return;
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
  if (typeof window !== 'undefined' && window.__lexiprepMuted) return;
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

  // Room PIN Database for Game Arena (Among Us Lobby + Leaderboard)
  const normalizeRoomObject = (room, pinKey) => ({
    pin: String(room?.pin || pinKey || ''),
    name: room?.name || `Phòng Đấu Từ Vựng #${room?.pin || pinKey}`,
    pass: room?.pass ?? 'ielts',
    teacher: room?.teacher || 'teacher_ielts',
    status: room?.status || 'LOBBY', // 'LOBBY' | 'PLAYING' | 'ENDED'
    maxPlayers: room?.maxPlayers || 30,
    roundSize: Math.max(2, Math.min(8, Number(room?.roundSize) || 4)),
    speedMode: ['relaxed', 'normal', 'turbo'].includes(room?.speedMode) ? room.speedMode : 'normal',
    startedAt: room?.startedAt || null,
    lobbyPlayers: room?.lobbyPlayers || {},
    liveMatch: room?.liveMatch || {},
    chatMessages: Array.isArray(room?.chatMessages) ? room.chatMessages.slice(-50) : [],
    rawVocab: room?.rawVocab || DEFAULT_VOCAB_TEXT,
    players: room?.players || {}
  });

  const [roomsDb, setRoomsDb] = useState(() => {
    const saved = localStorage.getItem('ielts_rooms_db_v2');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed && typeof parsed === 'object') {
          const normalized = {};
          Object.entries(parsed).forEach(([k, v]) => {
            normalized[k] = normalizeRoomObject(v, k);
          });
          if (Object.keys(normalized).length > 0) return normalized;
        }
      } catch (_e) {}
    }
    const defaults = {
      '686868': {
        pin: '686868',
        name: 'Phòng Từ Vựng Academic IELTS #1',
        pass: 'ielts',
        teacher: 'teacher_ielts',
        status: 'LOBBY',
        maxPlayers: 30,
        roundSize: 4,
        speedMode: 'normal',
        startedAt: null,
        lobbyPlayers: {},
        liveMatch: {},
        chatMessages: [],
        rawVocab: DEFAULT_VOCAB_TEXT,
        players: {
          'Nguyễn Văn A': { name: 'Nguyễn Văn A', score: 1850, streak: 8, status: 'Vòng 3: Boss Speller', updatedAt: '14:32' },
          'Trần Thị Mai': { name: 'Trần Thị Mai', score: 1420, streak: 5, status: 'Vòng 2: Gõ từ khuyết', updatedAt: '15:10' }
        }
      }
    };
    localStorage.setItem('ielts_rooms_db_v2', JSON.stringify(defaults));
    return defaults;
  });

  const [currentRoomPin, setCurrentRoomPin] = useState('686868');
  const [joinedRoomPin, setJoinedRoomPin] = useState(null);
  const [roomJoinForm, setRoomJoinForm] = useState(() => {
    const pinFromUrl = typeof window !== 'undefined' ? (new URLSearchParams(window.location.search).get('pin') || '') : '';
    return { pin: pinFromUrl.trim(), pass: '' };
  });
  const [roomJoinError, setRoomJoinError] = useState('');
  const [myCrewColor, setMyCrewColor] = useState('cyan');
  const [lobbyCountdown, setLobbyCountdown] = useState(null);
  const [showCreateRoomModal, setShowCreateRoomModal] = useState(false);
  const [newRoomForm, setNewRoomForm] = useState({ pin: '', pass: 'ielts', name: 'Phòng Đấu Từ Vựng Mới', roundSize: 4, speedMode: 'normal' });
  const [hostRoomDraft, setHostRoomDraft] = useState({ pin: '686868', name: 'Phòng Từ Vựng Academic IELTS #1', pass: 'ielts', roundSize: 4, speedMode: 'normal' });
  const [lobbyChatInput, setLobbyChatInput] = useState('');
  const [lobbyNowTick, setLobbyNowTick] = useState(() => Date.now());
  const [serverSyncConnected, setServerSyncConnected] = useState(false);
  const [copiedRoomPin, setCopiedRoomPin] = useState(false);
  const [apiTestState, setApiTestState] = useState({ testing: false, ok: null, message: '', model: '' });
  const [showAuthPass, setShowAuthPass] = useState(false);
  const [showAvatarModal, setShowAvatarModal] = useState(false);
  const [liveRankDeltas, setLiveRankDeltas] = useState({});
  const prevLiveRanksRef = useRef({});

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
    dispatchSyncAction('TOGGLE_TEST_ANSWERS', { testId });
  };

  // Teacher Action: Toggle Exam Visibility (public <-> private)
  const toggleTestVisibility = (testId) => {
    let nextVisibility = 'public';
    setTests(prev =>
      prev.map(t => {
        if (t.id === testId) {
          nextVisibility = (t.visibility || 'public') === 'private' ? 'public' : 'private';
          return { ...t, visibility: nextVisibility };
        }
        return t;
      })
    );
    showToast(
      nextVisibility === 'private'
        ? 'Đã chuyển đề thi sang chế độ Ẩn (Chỉ mình giáo viên thấy).'
        : 'Đã công khai đề thi — Học viên có thể nhìn thấy & làm bài.'
    );
    dispatchSyncAction('TOGGLE_TEST_VISIBILITY', { testId });
  };

  // Shared helper to update quick exam settings on Teacher Dashboard and sync across browsers
  const updateTestQuickConfig = (testId, transformFn, toastMessage) => {
    let updatedTest = null;
    setTests(prev =>
      prev.map(t => {
        if (t.id !== testId) return t;
        updatedTest = transformFn(t);
        return updatedTest;
      })
    );
    if (updatedTest) {
      dispatchSyncAction('UPSERT_TEST', { test: updatedTest });
      if (toastMessage) showToast(toastMessage);
    }
  };

  // Teacher Action: Toggle Exam Mode (Thi thử nhiều lần <-> Thi thật 1 lần)
  const toggleTestExamMode = (testId) => {
    const target = tests.find(t => t.id === testId);
    if (!target) return;
    const cfg = normalizeExamConfig(target);
    const nextMaxAttempts = cfg.maxAttempts === 1 ? 0 : 1;
    updateTestQuickConfig(
      testId,
      t => ({ ...t, maxAttempts: nextMaxAttempts }),
      nextMaxAttempts === 1
        ? `Đã bật THI THẬT cho "${target.title}" — Học sinh chỉ được làm 1 lần!`
        : `Đã bật THI THỬ cho "${target.title}" — Học sinh được làm nhiều lần để ôn thi!`
    );
  };

  // Teacher Action: Quick-update single skill duration (minutes) on Teacher Dashboard
  const updateTestQuickDuration = (testId, skill, minsValue) => {
    const cleanMins = Math.max(1, Math.min(180, Number(minsValue) || 1));
    const skillLabel = { listening: 'Listening', reading: 'Reading', writing: 'Writing' }[skill] || skill;
    updateTestQuickConfig(
      testId,
      t => {
        const cfg = normalizeExamConfig(t);
        return {
          ...t,
          sectionDurations: { ...cfg.durations, [skill]: cleanMins },
          sectionOrder: cfg.order,
          sequentialMode: cfg.sequentialMode
        };
      },
      `Đã lưu thời gian ${skillLabel}: ${cleanMins} phút!`
    );
  };

  // Update User Target Band / Display Name / Goal (Teacher or Student)
  const handleUpdateUserProfileFields = (username, patch) => {
    if (!username || !usersDb[username]) return;
    const targetUser = usersDb[username];
    const cleanBand =
      patch.targetBand !== undefined
        ? Math.min(9.0, Math.max(4.0, Math.round((Number(patch.targetBand) || 7.0) * 2) / 2))
        : targetUser.targetBand;
    const updatedUser = {
      ...targetUser,
      ...(patch.name !== undefined ? { name: patch.name.trim() || targetUser.name } : {}),
      ...(patch.targetBand !== undefined ? { targetBand: cleanBand } : {}),
      ...(patch.studyGoal !== undefined ? { studyGoal: patch.studyGoal.trim() } : {})
    };
    setUsersDb(prev => ({ ...prev, [username]: updatedUser }));
    if (currentUser?.username === username) {
      setCurrentUser(updatedUser);
    }
    dispatchSyncAction('UPSERT_USER', { username, user: updatedUser });
    showToast(`Đã cập nhật mục tiêu cho ${updatedUser.name} (Target Band ${updatedUser.targetBand})!`);
  };

  // Teacher Action: Duplicate Test (defaults copy to private so students can't accidentally open it)
  const handleDuplicateTest = (testObj) => {
    if (!testObj) return;
    const copyId = `test-copy-${Date.now()}`;
    const duplicated = {
      ...JSON.parse(JSON.stringify(testObj)),
      id: copyId,
      title: `${testObj.title} (Bản sao)`,
      visibility: 'private',
      allowViewAnswers: false,
      createdAt: new Date().toISOString().split('T')[0]
    };
    setTests(prev => [duplicated, ...prev]);
    dispatchSyncAction('UPSERT_TEST', { test: duplicated });
    showToast(`Đã nhân bản đề "${testObj.title}" ở chế độ Riêng tư!`);
  };

  // Teacher Action: Delete Test
  const handleDeleteTest = (testObj) => {
    if (!testObj?.id) return;
    if (!window.confirm(`Bạn có chắc muốn xóa đề thi "${testObj.title}"? Dữ liệu bài nộp cũ vẫn được giữ trong bảng điểm.`)) {
      return;
    }
    setTests(prev => prev.filter(t => t.id !== testObj.id));
    dispatchSyncAction('DELETE_TEST', { testId: testObj.id });
    showToast(`Đã xóa đề thi "${testObj.title}".`, 'info');
  };

  // Teacher Action: Delete Attempt (unlock student on 1-attempt exam / reset attempt)
  const handleDeleteAttempt = (attemptObj) => {
    if (!attemptObj?.id) return;
    if (!window.confirm(`Xóa lượt làm bài của "${attemptObj.studentName}" cho đề "${attemptObj.testTitle}" để học viên có thể thi lại?`)) {
      return;
    }
    setAttempts(prev => prev.filter(a => a.id !== attemptObj.id));
    dispatchSyncAction('DELETE_ATTEMPT', { attemptId: attemptObj.id });
    showToast(`Đã mở khóa lượt làm lại cho học viên ${attemptObj.studentName}.`);
  };

  // Teacher Action: Create Single or Bulk Student Accounts
  const handleSaveNewStudents = (e) => {
    if (e) e.preventDefault();
    const today = new Date().toISOString().split('T')[0];

    if (addStudentMode === 'single') {
      const uname = (newStudentForm.username || '').trim().replace(/\s+/g, '_');
      const pass = (newStudentForm.password || '').trim();
      const name = (newStudentForm.name || '').trim() || uname;
      const band = Math.min(9.0, Math.max(4.0, roundIeltsBand(Number(newStudentForm.targetBand) || 7.0)));
      if (!uname || !pass) {
        showToast('Vui lòng nhập tên đăng nhập và mật khẩu học viên!', 'error');
        return;
      }
      if (usersDb[uname]) {
        showToast(`Tài khoản "${uname}" đã tồn tại!`, 'error');
        return;
      }
      const userObj = { username: uname, pass, name, role: 'student', targetBand: band, joinedDate: today };
      setUsersDb(prev => ({ ...prev, [uname]: userObj }));
      dispatchSyncAction('UPSERT_USER', { username: uname, user: userObj });
      setNewStudentForm({ username: '', name: '', password: '123', targetBand: 7.0 });
      setShowAddStudentModal(false);
      showToast(`Đã tạo tài khoản học viên "${name}" (@${uname})!`);
      return;
    }

    const parsedList = parseBulkStudentsText(bulkStudentsText);
    if (parsedList.length === 0) {
      showToast('Không có dòng hợp lệ. Định dạng: username | Họ tên | mật khẩu | targetBand', 'error');
      return;
    }
    const createdUsers = {};
    let skipped = 0;
    parsedList.forEach(item => {
      if (usersDb[item.username] || createdUsers[item.username]) {
        skipped++;
        return;
      }
      createdUsers[item.username] = {
        username: item.username,
        pass: item.pass,
        name: item.name,
        role: 'student',
        targetBand: item.targetBand,
        joinedDate: today
      };
    });
    const addedEntries = Object.entries(createdUsers);
    if (addedEntries.length === 0) {
      showToast('Tất cả tên tài khoản trong danh sách đều đã tồn tại!', 'error');
      return;
    }
    setUsersDb(prev => ({ ...prev, ...createdUsers }));
    addedEntries.forEach(([username, user]) => {
      dispatchSyncAction('UPSERT_USER', { username, user });
    });
    setShowAddStudentModal(false);
    showToast(`Đã thêm ${addedEntries.length} học viên${skipped > 0 ? ` (bỏ qua ${skipped} tài khoản trùng)` : ''}!`);
  };

  // Teacher Action: Reset Student Password
  const handleResetStudentPassword = (e) => {
    if (e) e.preventDefault();
    if (!editingStudentAccount) return;
    const nextPass = (studentPasswordDraft || '').trim();
    if (!nextPass) {
      showToast('Mật khẩu mới không được để trống!', 'error');
      return;
    }
    const uname = editingStudentAccount.username;
    const baseUser = usersDb[uname] || editingStudentAccount;
    const updatedUser = { ...baseUser, pass: nextPass };
    setUsersDb(prev => ({ ...prev, [uname]: updatedUser }));
    dispatchSyncAction('UPSERT_USER', { username: uname, user: updatedUser });
    setEditingStudentAccount(null);
    setStudentPasswordDraft('');
    showToast(`Đã đặt lại mật khẩu mới cho học viên ${updatedUser.name}!`);
  };

  // Teacher Action: Copy Room Invite Link (?pin=...)
  const handleCopyInviteLink = (pin = currentRoomPin) => {
    const url = buildRoomInviteLink(pin);
    if (!url) return;
    navigator.clipboard?.writeText(url).catch(() => {});
    showToast(`Đã sao chép Link mời vào phòng PIN ${pin}!`);
  };

  // Teacher Action: Kick player out of lobby / live room
  const handleKickLobbyPlayer = (pin, username, displayName) => {
    if (!pin || !username) return;
    setRoomsDb(prev => {
      const r = normalizeRoomObject(prev[pin], pin);
      const nextLobby = { ...r.lobbyPlayers };
      const nextLive = { ...r.liveMatch };
      delete nextLobby[username];
      delete nextLive[username];
      return {
        ...prev,
        [pin]: { ...r, lobbyPlayers: nextLobby, liveMatch: nextLive }
      };
    });
    dispatchSyncAction('KICK_LOBBY_PLAYER', { pin, username });
    showToast(`Đã mời "${displayName || username}" rời khỏi phòng ${pin}.`, 'info');
  };

  // Teacher Action: End active match & freeze standings
  const handleFinishRoomMatch = (pin = currentRoomPin) => {
    if (!pin) return;
    setRoomsDb(prev => {
      const r = normalizeRoomObject(prev[pin], pin);
      return { ...prev, [pin]: { ...r, status: 'ENDED' } };
    });
    dispatchSyncAction('FINISH_ROOM_MATCH', { pin });
    showToast(`Đã chốt bảng xếp hạng & kết thúc trận đấu phòng ${pin}!`);
  };

  // Teacher Action: Delete extra game room
  const handleDeleteRoom = (pin) => {
    const allPins = Object.keys(roomsDb);
    if (allPins.length <= 1) {
      showToast('Cần giữ lại ít nhất 1 phòng đấu mặc định!', 'info');
      return;
    }
    const target = roomsDb[pin];
    if (!window.confirm(`Xóa phòng "${target?.name || pin}" (PIN: ${pin})?`)) return;
    const fallbackPin = allPins.find(p => p !== pin) || '';
    setRoomsDb(prev => {
      const next = { ...prev };
      delete next[pin];
      return next;
    });
    if (currentRoomPin === pin && fallbackPin) setCurrentRoomPin(fallbackPin);
    if (joinedRoomPin === pin) {
      setJoinedRoomPin(null);
      setGameSubState('JOIN');
    }
    dispatchSyncAction('DELETE_ROOM', { pin });
    showToast(`Đã xóa phòng PIN ${pin}.`, 'info');
  };

  // Exam Mode State
  const [examState, setExamState] = useState({
    skill: 'listening',
    sectionIdx: 0,
    timeRemaining: 900,
    answers: {},
    audioPlays: {},
    highlights: [],
    notes: [],
    antiCheatLogs: [],
    tabSwitchCount: 0,
    readingPassageIdx: 0,
    showAllReadingQs: false
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
  const [builderReadingIdx, setBuilderReadingIdx] = useState(0);
  const [zoomedReadingImg, setZoomedReadingImg] = useState('');
  const [editingTargetUser, setEditingTargetUser] = useState(null);
  const [testForm, setTestForm] = useState({
    title: '',
    description: '',
    visibility: 'private',
    maxAttempts: 0,
    sequentialMode: true,
    allowEarlyNextSection: false,
    sectionOrder: [...DEFAULT_SECTION_ORDER],
    sectionDurations: { ...DEFAULT_SECTION_DURATIONS },
    maxAudioPlays: 1,
    shuffleOptions: true,
    allowViewAnswers: false,
    listening: { audioUrl: '', audioFileName: '', transcript: '', questions: [] },
    reading: {
      passageTitle: '',
      passageText: '',
      imageUrl: '',
      imageFileName: '',
      passages: [{ id: 'passage-1', title: 'Bài đọc 1', imageUrl: '', imageFileName: '', passageText: '' }],
      questions: []
    },
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
  const [gradingFilters, setGradingFilters] = useState({ testId: 'all', status: 'all', risk: 'all', search: '' });
  const [showAddStudentModal, setShowAddStudentModal] = useState(false);
  const [addStudentMode, setAddStudentMode] = useState('single'); // 'single' | 'bulk'
  const [newStudentForm, setNewStudentForm] = useState({ username: '', name: '', password: '123', targetBand: 7.0 });
  const [bulkStudentsText, setBulkStudentsText] = useState('hocsinh_04 | Lê Minh Tuấn | 123 | 7.0\nhocsinh_05 | Phạm Thảo Vy | 123 | 7.5');
  const [editingStudentAccount, setEditingStudentAccount] = useState(null);
  const [studentPasswordDraft, setStudentPasswordDraft] = useState('');

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
  const [gameSubState, setGameSubState] = useState('JOIN'); // 'JOIN' | 'LOBBY' | 'COUNTDOWN' | 'PLAYING' | 'TRANSITION' | 'GAMEOVER'
  const [gameOutcome, setGameOutcome] = useState(null); // 'VICTORY' | 'LOST' | null
  const [gameTimeLeft, setGameTimeLeft] = useState(GAME_ROUND_TIME_LIMITS[1]);
  const [gameTimeLimit, setGameTimeLimit] = useState(GAME_ROUND_TIME_LIMITS[1]);
  const [transitionCountdown, setTransitionCountdown] = useState(3);
  const [isSandboxRound, setIsSandboxRound] = useState(false);
  const [showMobileKeyboard, setShowMobileKeyboard] = useState(false);
  const [gameMuted, setGameMuted] = useState(false);
  const [gamePaused, setGamePaused] = useState(false);
  const [freezeCharges, setFreezeCharges] = useState(2);
  const [isFrozenBoost, setIsFrozenBoost] = useState(false);
  const freezeUntilRef = useRef(0);
  const bonusTimeSecRef = useRef(0);
  const pausedStartedAtRef = useRef(0);
  const justJoinedLobbyAtRef = useRef(0);
  const particlesRef = useRef([]);
  const missedWordsMatchRef = useRef([]);
  const [gameToast, setGameToast] = useState({ text: '', isSuccess: true, visible: false });
  const [gameReviewLog, setGameReviewLog] = useState([]);
  const [activeQuestion, setActiveQuestion] = useState(null);
  const [gameQueues, setGameQueues] = useState({ 1: [], 2: [], 3: [] });

  const lastLaunchedAtRef = useRef(null);
  const lobbyCountdownTimerRef = useRef(null);
  const syncChannelRef = useRef(null);
  const skipNextRoomBroadcastRef = useRef(false);
  const skipNextTestsBroadcastRef = useRef(false);
  const skipNextAttemptsBroadcastRef = useRef(false);
  const lastSyncVersionRef = useRef(-1);
  const chatScrollRef = useRef(null);

  const gameRuntimeRef = useRef({
    round: 1,
    score: 0,
    lives: 3,
    combo: 0,
    wordIdx: 0,
    typedProgress: 0,
    subState: 'JOIN',
    activeQuestion: null,
    queues: { 1: [], 2: [], 3: [] },
    isSandbox: false,
    paused: false,
    timeLimit: GAME_ROUND_TIME_LIMITS[1],
    questionResolved: false
  });

  // Sync state to local storage + cross-tab BroadcastChannel
  useEffect(() => {
    localStorage.setItem('ielts_tests', JSON.stringify(tests));
    if (skipNextTestsBroadcastRef.current) {
      skipNextTestsBroadcastRef.current = false;
      return;
    }
    syncChannelRef.current?.postMessage({ key: 'ielts_tests', payload: tests });
  }, [tests]);

  useEffect(() => {
    localStorage.setItem('ielts_attempts', JSON.stringify(attempts));
    if (skipNextAttemptsBroadcastRef.current) {
      skipNextAttemptsBroadcastRef.current = false;
      return;
    }
    syncChannelRef.current?.postMessage({ key: 'ielts_attempts', payload: attempts });
  }, [attempts]);

  useEffect(() => {
    localStorage.setItem('ielts_users_db_v2', JSON.stringify(usersDb));
  }, [usersDb]);

  useEffect(() => {
    localStorage.setItem('ielts_rooms_db_v2', JSON.stringify(roomsDb));
    if (skipNextRoomBroadcastRef.current) {
      skipNextRoomBroadcastRef.current = false;
      return;
    }
    syncChannelRef.current?.postMessage({ key: 'ielts_rooms_db_v2', payload: roomsDb });
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

  // Shared Cross-Browser Sync Dispatch Helpers (/api/sync via Vite Middleware + BroadcastChannel fallback)
  const applyRemoteSnapshotData = useRef(null);
  applyRemoteSnapshotData.current = (snap) => {
    if (!snap || typeof snap !== 'object') return;
    if (typeof snap.version === 'number') {
      if (snap.version < lastSyncVersionRef.current) return;
      lastSyncVersionRef.current = snap.version;
    }
    if (snap.rooms && typeof snap.rooms === 'object' && Object.keys(snap.rooms).length > 0) {
      const normalized = {};
      Object.entries(snap.rooms).forEach(([k, v]) => {
        normalized[k] = normalizeRoomObject(v, k);
      });
      skipNextRoomBroadcastRef.current = true;
      setRoomsDb(prev => (JSON.stringify(prev) === JSON.stringify(normalized) ? prev : normalized));
    }
    if (Array.isArray(snap.tests) && snap.tests.length > 0) {
      skipNextTestsBroadcastRef.current = true;
      setTests(prev => (JSON.stringify(prev) === JSON.stringify(snap.tests) ? prev : snap.tests));
    }
    if (Array.isArray(snap.attempts) && snap.attempts.length > 0) {
      skipNextAttemptsBroadcastRef.current = true;
      setAttempts(prev => (JSON.stringify(prev) === JSON.stringify(snap.attempts) ? prev : snap.attempts));
    }
    if (snap.teacherNotes && typeof snap.teacherNotes === 'object' && Object.keys(snap.teacherNotes).length > 0) {
      setTeacherNotes(prev => (JSON.stringify(prev) === JSON.stringify(snap.teacherNotes) ? prev : snap.teacherNotes));
    }
    if (snap.users && typeof snap.users === 'object' && Object.keys(snap.users).length > 0) {
      setUsersDb(prev => {
        const merged = { ...prev, ...snap.users };
        return JSON.stringify(prev) === JSON.stringify(merged) ? prev : merged;
      });
      setCurrentUser(prev => {
        if (!prev || !snap.users[prev.username]) return prev;
        const remote = snap.users[prev.username];
        return JSON.stringify(prev) === JSON.stringify(remote) ? prev : { ...prev, ...remote };
      });
    }
  };

  const pullServerSyncState = async (forceApply = false) => {
    try {
      const res = await fetch('/api/sync/state', { cache: 'no-store' });
      if (!res.ok) return null;
      const snap = await res.json();
      setServerSyncConnected(true);
      if (forceApply || (typeof snap?.version === 'number' && snap.version > lastSyncVersionRef.current)) {
        applyRemoteSnapshotData.current?.(snap);
      }
      return snap;
    } catch (_err) {
      setServerSyncConnected(false);
      return null;
    }
  };

  const dispatchSyncAction = async (type, payload) => {
    try {
      const res = await fetch('/api/sync/action', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type, payload })
      });
      if (!res.ok) return null;
      const data = await res.json();
      setServerSyncConnected(true);
      if (data?.snapshot) {
        applyRemoteSnapshotData.current?.(data.snapshot);
      }
      return data?.snapshot || null;
    } catch (_err) {
      setServerSyncConnected(false);
      return null;
    }
  };

  // Listen for live multi-browser (SSE + Polling) & multi-tab (BroadcastChannel + storage) updates
  useEffect(() => {
    const applyRemoteUpdate = (key, payload) => {
      if (!payload) return;
      if (key === 'ielts_rooms_db_v2' && typeof payload === 'object') {
        const normalized = {};
        Object.entries(payload).forEach(([k, v]) => {
          normalized[k] = normalizeRoomObject(v, k);
        });
        skipNextRoomBroadcastRef.current = true;
        setRoomsDb(prev => (JSON.stringify(prev) === JSON.stringify(normalized) ? prev : normalized));
      } else if (key === 'ielts_tests' && Array.isArray(payload)) {
        skipNextTestsBroadcastRef.current = true;
        setTests(prev => (JSON.stringify(prev) === JSON.stringify(payload) ? prev : payload));
      } else if (key === 'ielts_attempts' && Array.isArray(payload)) {
        skipNextAttemptsBroadcastRef.current = true;
        setAttempts(prev => (JSON.stringify(prev) === JSON.stringify(payload) ? prev : payload));
      } else if (key === 'ielts_teacher_notes' && typeof payload === 'object') {
        setTeacherNotes(prev => (JSON.stringify(prev) === JSON.stringify(payload) ? prev : payload));
      }
    };

    if (typeof BroadcastChannel !== 'undefined') {
      const ch = new BroadcastChannel('lexiprep_sync_v1');
      syncChannelRef.current = ch;
      ch.onmessage = (e) => {
        if (e.data?.key) applyRemoteUpdate(e.data.key, e.data.payload);
      };
    }

    const handleStorageEvent = (e) => {
      if (!e.newValue) return;
      if (['ielts_rooms_db_v2', 'ielts_tests', 'ielts_attempts', 'ielts_teacher_notes'].includes(e.key)) {
        try {
          applyRemoteUpdate(e.key, JSON.parse(e.newValue));
        } catch (_err) {}
      }
    };
    window.addEventListener('storage', handleStorageEvent);

    // Bootstrap cross-browser relay server state + SSE stream + 1.5s fallback poll
    let cancelled = false;
    let evtSource = null;

    const initServerSync = async () => {
      const snap = await pullServerSyncState(true);
      if (cancelled) return;
      if (snap) {
        if (!snap.seeded) {
          await dispatchSyncAction('SEED_DEFAULTS', {
            rooms: roomsDb,
            tests,
            attempts,
            teacherNotes,
            users: usersDb
          });
        } else {
          await dispatchSyncAction('SEED_DEFAULTS', { users: usersDb });
        }
      }

      if (cancelled || typeof EventSource === 'undefined') return;
      evtSource = new EventSource('/api/sync/stream');
      evtSource.addEventListener('sync', (e) => {
        try {
          const parsed = JSON.parse(e.data);
          setServerSyncConnected(true);
          applyRemoteSnapshotData.current?.(parsed);
        } catch (_err) {}
      });
      evtSource.onerror = () => {
        setServerSyncConnected(false);
      };
    };

    initServerSync();
    const pollTimer = setInterval(() => {
      pullServerSyncState(false);
    }, 1500);

    return () => {
      cancelled = true;
      clearInterval(pollTimer);
      evtSource?.close();
      window.removeEventListener('storage', handleStorageEvent);
      syncChannelRef.current?.close();
      syncChannelRef.current = null;
    };
  }, []);

  // Tick timer for Crewmate speech bubbles + auto-scroll Lobby Chat while in Lobby
  useEffect(() => {
    if (view !== 'GAME_ARENA' || gameSubState !== 'LOBBY') return;
    const t = setInterval(() => setLobbyNowTick(Date.now()), 1000);
    return () => clearInterval(t);
  }, [view, gameSubState]);

  const activeLobbyRoomChatCount = (roomsDb[joinedRoomPin || currentRoomPin]?.chatMessages || []).length;
  useEffect(() => {
    if (view === 'GAME_ARENA' && gameSubState === 'LOBBY' && chatScrollRef.current) {
      chatScrollRef.current.scrollTop = chatScrollRef.current.scrollHeight;
    }
  }, [view, gameSubState, activeLobbyRoomChatCount]);

  // Keep Teacher inline room draft aligned when selected PIN switches
  useEffect(() => {
    const r = roomsDb[currentRoomPin];
    if (r) {
      setHostRoomDraft({
        pin: r.pin || currentRoomPin,
        name: r.name || `Phòng Từ Vựng #${currentRoomPin}`,
        pass: r.pass ?? 'ielts',
        roundSize: Math.max(2, Math.min(8, Number(r.roundSize) || 4)),
        speedMode: ['relaxed', 'normal', 'turbo'].includes(r.speedMode) ? r.speedMode : 'normal'
      });
    }
  }, [currentRoomPin]);

  // Auto-save active exam progress so refreshing / closing tab won't lose answers
  useEffect(() => {
    if (view !== 'EXAM_MODE' || !selectedTestId) return;
    const draftKey = `ielts_exam_draft_${currentUser?.username || 'guest'}_${selectedTestId}`;
    try {
      localStorage.setItem(
        draftKey,
        JSON.stringify({
          ...examState,
          savedAt: Date.now()
        })
      );
    } catch (_err) {}
  }, [view, selectedTestId, examState, currentUser?.username]);

  // Track live ranking changes (Đua Top up/down indicator) for Teacher Spectate screen
  useEffect(() => {
    if (view !== 'GAME_ARENA' || gameSubState !== 'HOST_SPECTATE') {
      prevLiveRanksRef.current = {};
      return;
    }
    const activePin = joinedRoomPin || currentRoomPin;
    const room = activePin ? normalizeRoomObject(roomsDb[activePin], activePin) : null;
    if (!room) return;

    const entries = Object.values(room.liveMatch || {});
    const sorted = [...entries].sort((a, b) => {
      if ((b.score || 0) !== (a.score || 0)) return (b.score || 0) - (a.score || 0);
      if ((b.streak || 0) !== (a.streak || 0)) return (b.streak || 0) - (a.streak || 0);
      return (a.username || '').localeCompare(b.username || '');
    });

    const nextRanks = {};
    const deltas = {};
    let hasChanges = false;
    sorted.forEach((item, idx) => {
      nextRanks[item.username] = idx;
      const oldRank = prevLiveRanksRef.current[item.username];
      if (typeof oldRank === 'number' && oldRank !== idx) {
        deltas[item.username] = oldRank - idx; // positive = climbed up, negative = dropped down
        hasChanges = true;
      }
    });
    prevLiveRanksRef.current = nextRanks;
    if (hasChanges) {
      setLiveRankDeltas(deltas);
      const clearTimer = setTimeout(() => setLiveRankDeltas({}), 2200);
      return () => clearTimeout(clearTimer);
    }
  }, [view, gameSubState, roomsDb, joinedRoomPin, currentRoomPin]);

  // Synchronized Among Us Lobby -> Countdown -> Start Game watcher
  useEffect(() => {
    const activePin = joinedRoomPin || currentRoomPin;
    const room = activePin ? roomsDb[activePin] : null;
    if (view !== 'GAME_ARENA') return;

    if (room?.status === 'LOBBY') {
      lastLaunchedAtRef.current = null;
    }
    if (gameSubState !== 'LOBBY') return;

    if (!room || room.status === 'ENDED') {
      if (currentUser?.role !== 'teacher' && joinedRoomPin) {
        setJoinedRoomPin(null);
        setGameSubState('JOIN');
        gameRuntimeRef.current.subState = 'JOIN';
        setRoomJoinError('Phòng chơi đã kết thúc hoặc bị đóng bởi giáo viên.');
      }
      return;
    }

    if (
      currentUser?.role !== 'teacher' &&
      joinedRoomPin === activePin &&
      room.status === 'LOBBY' &&
      !room.lobbyPlayers?.[currentUser?.username] &&
      Date.now() - justJoinedLobbyAtRef.current > 2500
    ) {
      setJoinedRoomPin(null);
      setGameSubState('JOIN');
      gameRuntimeRef.current.subState = 'JOIN';
      setRoomJoinError('Bạn đã được giáo viên mời ra khỏi sảnh chờ.');
      return;
    }

    const isParticipant =
      currentUser?.role === 'teacher' ||
      joinedRoomPin === activePin ||
      Boolean(room.lobbyPlayers?.[currentUser?.username]);

    if (
      room.status === 'PLAYING' &&
      room.startedAt &&
      lastLaunchedAtRef.current !== room.startedAt &&
      isParticipant
    ) {
      lastLaunchedAtRef.current = room.startedAt;
      clearInterval(lobbyCountdownTimerRef.current);
      setLobbyCountdown(3);
      setGameSubState('COUNTDOWN');
      gameRuntimeRef.current.subState = 'COUNTDOWN';

      let count = 3;
      lobbyCountdownTimerRef.current = setInterval(() => {
        count -= 1;
        if (count <= 0) {
          clearInterval(lobbyCountdownTimerRef.current);
          setLobbyCountdown(null);
          if (currentUser?.role === 'teacher') {
            prevLiveRanksRef.current = {};
            setLiveRankDeltas({});
            setGameSubState('HOST_SPECTATE');
            gameRuntimeRef.current.subState = 'HOST_SPECTATE';
          } else {
            initGameCampaign(activePin, currentUser);
          }
        } else {
          setLobbyCountdown(count);
        }
      }, 900);
    }
  }, [view, gameSubState, roomsDb, joinedRoomPin, currentRoomPin, currentUser]);

  // Handle Toast in Game
  const triggerGameToast = (text, isSuccess) => {
    clearTimeout(gameToastTimerRef.current);
    setGameToast({ text, isSuccess, visible: true });
    gameToastTimerRef.current = setTimeout(() => {
      setGameToast(prev => ({ ...prev, visible: false }));
    }, 3000);
  };

  // Sync Student Game Score & Real-time Race Progress to Leaderboard
  const syncLiveMatchProgress = ({
    scoreVal = 0,
    streakVal = 0,
    livesVal = 3,
    roundNum = 1,
    progressText = 'Đang chơi',
    finished = false,
    outcome = null,
    missedWords = []
  }) => {
    if (!currentUser || currentUser.role === 'teacher' || gameRuntimeRef.current.isSandbox) return;
    const targetPin = joinedRoomPin || currentRoomPin;
    const roomObj = roomsDb[targetPin];
    const lobbyInfo = roomObj?.lobbyPlayers?.[currentUser.username];
    const liveEntry = {
      username: currentUser.username,
      name: currentUser.name || currentUser.username,
      role: 'student',
      colorId: lobbyInfo?.colorId || myCrewColor,
      avatarUrl: currentUser.avatarUrl || '',
      score: scoreVal,
      streak: streakVal,
      lives: livesVal,
      round: roundNum,
      progressText,
      finished,
      outcome,
      missed: missedWords,
      updatedAt: Date.now()
    };

    setRoomsDb(prev => {
      const room = normalizeRoomObject(prev[targetPin], targetPin);
      const nextLiveMatch = { ...(room.liveMatch || {}), [currentUser.username]: liveEntry };
      const currentPlayers = { ...(room.players || {}) };
      if (scoreVal > 0 || finished) {
        const prevRecord = currentPlayers[currentUser.username];
        const bestScore = prevRecord ? Math.max(prevRecord.score || 0, scoreVal) : scoreVal;
        currentPlayers[currentUser.username] = {
          name: currentUser.name || currentUser.username,
          score: bestScore,
          status: progressText,
          streak: streakVal,
          missed: missedWords,
          updatedAt: new Date().toLocaleTimeString('vi-VN')
        };
      }
      return {
        ...prev,
        [targetPin]: { ...room, liveMatch: nextLiveMatch, players: currentPlayers }
      };
    });

    dispatchSyncAction('UPDATE_LIVE_SCORE', {
      pin: targetPin,
      username: currentUser.username,
      entry: liveEntry
    });
  };

  const syncScoreToLeaderboard = (scoreVal, statusStr, streakVal, missedWords) => {
    if (!currentUser) return;
    const targetPin = joinedRoomPin || currentRoomPin;
    const nextRecord = {
      name: currentUser.name || currentUser.username,
      score: scoreVal,
      status: statusStr,
      streak: streakVal,
      missed: missedWords,
      updatedAt: new Date().toLocaleTimeString('vi-VN')
    };

    setRoomsDb(prev => {
      const room = normalizeRoomObject(prev[targetPin], targetPin);
      const currentPlayers = { ...(room.players || {}) };
      const prevRecord = currentPlayers[currentUser.username];
      const bestScore = prevRecord ? Math.max(prevRecord.score || 0, scoreVal) : scoreVal;
      currentPlayers[currentUser.username] = { ...nextRecord, score: bestScore };
      return { ...prev, [targetPin]: { ...room, players: currentPlayers } };
    });

    dispatchSyncAction('UPDATE_SCORE', { pin: targetPin, username: currentUser.username, record: nextRecord });
  };

  // Update Account Avatar & propagate to Lobby Character
  const handleUpdateUserAvatar = (newAvatarUrl) => {
    if (!currentUser) return;
    const updatedUser = { ...currentUser, avatarUrl: newAvatarUrl || '' };
    setCurrentUser(updatedUser);
    setUsersDb(prev => ({ ...prev, [currentUser.username]: updatedUser }));

    const nextColor = newAvatarUrl
      ? 'avatar'
      : (myCrewColor === 'avatar' ? 'cyan' : myCrewColor);
    setMyCrewColor(nextColor);

    const activePin = joinedRoomPin || currentRoomPin;
    setRoomsDb(prev => {
      const next = { ...prev };
      Object.entries(next).forEach(([pin, r]) => {
        const nr = normalizeRoomObject(r, pin);
        if (nr.lobbyPlayers?.[currentUser.username]) {
          nr.lobbyPlayers = {
            ...nr.lobbyPlayers,
            [currentUser.username]: {
              ...nr.lobbyPlayers[currentUser.username],
              avatarUrl: newAvatarUrl || '',
              colorId: pin === activePin ? nextColor : nr.lobbyPlayers[currentUser.username].colorId
            }
          };
          next[pin] = nr;
        }
      });
      return next;
    });

    dispatchSyncAction('UPSERT_USER', { username: currentUser.username, user: updatedUser });
    if (activePin && roomsDb[activePin]?.lobbyPlayers?.[currentUser.username]) {
      dispatchSyncAction('UPDATE_LOBBY_PLAYER', {
        pin: activePin,
        username: currentUser.username,
        patch: { avatarUrl: newAvatarUrl || '', colorId: nextColor }
      });
    }
    showToast(newAvatarUrl ? 'Đã cập nhật Avatar & bật chế độ Mặt Avatar cho nhân vật!' : 'Đã gỡ ảnh Avatar tài khoản.');
  };

  // Lobby & Room Flow Actions
  const buildLobbyPlayerEntry = (user, overrides = {}) => ({
    username: user.username,
    name: user.name || user.username,
    role: user.role,
    colorId: overrides.colorId ?? (user.avatarUrl && myCrewColor === 'avatar' ? 'avatar' : myCrewColor),
    avatarUrl: overrides.avatarUrl ?? user.avatarUrl ?? '',
    ready: overrides.ready ?? (user.role === 'teacher'),
    chat: '',
    chatAt: 0,
    joinedAt: Date.now()
  });

  const openStudentGamePortal = () => {
    clearTimeout(autoNextTimerRef.current);
    clearInterval(wordTimerRef.current);
    clearInterval(lobbyCountdownTimerRef.current);
    setLobbyCountdown(null);
    setRoomJoinError('');

    if (currentUser?.role === 'teacher') {
      handleTeacherOpenLobby(currentRoomPin);
      return;
    }

    const activeRoom = joinedRoomPin ? roomsDb[joinedRoomPin] : null;
    const isAlreadyInLobby =
      activeRoom &&
      activeRoom.status === 'LOBBY' &&
      Boolean(activeRoom.lobbyPlayers?.[currentUser?.username]);

    if (isAlreadyInLobby) {
      setGameSubState('LOBBY');
      gameRuntimeRef.current.subState = 'LOBBY';
    } else {
      setJoinedRoomPin(null);
      setGameSubState('JOIN');
      gameRuntimeRef.current.subState = 'JOIN';
    }
    setView('GAME_ARENA');
    pullServerSyncState(true);
  };

  const handleStudentJoinRoom = async (e) => {
    if (e) e.preventDefault();
    const cleanPin = (roomJoinForm.pin || '').trim();
    const cleanPass = (roomJoinForm.pass || '').trim();

    if (!cleanPin) {
      setRoomJoinError('Vui lòng nhập Mã Phòng (PIN) do giáo viên cung cấp.');
      return;
    }

    // Pull latest server state right before validating so newly created rooms on another browser match immediately
    const latestSnap = await pullServerSyncState(true);
    const liveRooms = latestSnap?.rooms && Object.keys(latestSnap.rooms).length > 0 ? latestSnap.rooms : roomsDb;
    const targetRoom = liveRooms[cleanPin] ? normalizeRoomObject(liveRooms[cleanPin], cleanPin) : null;

    if (!targetRoom) {
      setRoomJoinError(`Không tìm thấy phòng "${cleanPin}". Hãy kiểm tra lại mã phòng.`);
      return;
    }
    if (targetRoom.status === 'ENDED') {
      setRoomJoinError('Phòng đấu này đã kết thúc. Vui lòng xin mã phòng mới.');
      return;
    }
    if ((targetRoom.pass || '').trim() !== cleanPass) {
      setRoomJoinError('Mật khẩu phòng không chính xác. Vui lòng thử lại.');
      return;
    }
    const alreadyJoined = Boolean(targetRoom.lobbyPlayers?.[currentUser?.username]);
    if (targetRoom.status === 'PLAYING' && !alreadyJoined) {
      setRoomJoinError('Trận đấu đang diễn ra! Hãy bảo Giáo viên bấm "Mở Sảnh Mới" hoặc "Bắt đầu ván mới" để bạn vào sảnh chờ.');
      return;
    }

    setRoomJoinError('');
    setJoinedRoomPin(cleanPin);
    lastLaunchedAtRef.current = targetRoom.startedAt || null;

    const studentEntry = buildLobbyPlayerEntry(currentUser, { ready: false });
    setRoomsDb(prev => {
      const r = normalizeRoomObject(prev[cleanPin] || targetRoom, cleanPin);
      return {
        ...prev,
        [cleanPin]: {
          ...r,
          lobbyPlayers: {
            ...r.lobbyPlayers,
            [currentUser.username]: studentEntry
          }
        }
      };
    });

    justJoinedLobbyAtRef.current = Date.now();
    setLobbyChatInput('');
    setGameSubState('LOBBY');
    gameRuntimeRef.current.subState = 'LOBBY';
    setView('GAME_ARENA');

    await dispatchSyncAction('JOIN_LOBBY', { pin: cleanPin, player: studentEntry });
  };

  const handleTeacherOpenLobby = (pin = currentRoomPin) => {
    clearTimeout(autoNextTimerRef.current);
    clearInterval(wordTimerRef.current);
    clearInterval(lobbyCountdownTimerRef.current);
    setLobbyCountdown(null);

    const targetPin = pin || currentRoomPin;
    setCurrentRoomPin(targetPin);
    setJoinedRoomPin(targetPin);

    const baseRoom = normalizeRoomObject(roomsDb[targetPin], targetPin);
    const hasStudentsWaiting = Object.values(baseRoom.lobbyPlayers || {}).some(p => p.role !== 'teacher');
    // Auto-reopen room to LOBBY if an old match ended or nobody was waiting inside an old PLAYING session
    const nextStatus = baseRoom.status === 'ENDED' || (baseRoom.status === 'PLAYING' && !hasStudentsWaiting) ? 'LOBBY' : baseRoom.status;
    const nextStartedAt = nextStatus === 'LOBBY' ? null : baseRoom.startedAt;
    lastLaunchedAtRef.current = nextStartedAt;

    setHostRoomDraft({
      pin: baseRoom.pin,
      name: baseRoom.name,
      pass: baseRoom.pass,
      roundSize: baseRoom.roundSize || 4,
      speedMode: baseRoom.speedMode || 'normal'
    });

    const teacherEntry = buildLobbyPlayerEntry(currentUser, {
      name: currentUser?.name || 'Giáo viên',
      role: 'teacher',
      ready: true
    });

    setRoomsDb(prev => {
      const r = normalizeRoomObject(prev[targetPin], targetPin);
      return {
        ...prev,
        [targetPin]: {
          ...r,
          status: nextStatus,
          startedAt: nextStartedAt,
          lobbyPlayers: {
            ...r.lobbyPlayers,
            [currentUser.username]: teacherEntry
          }
        }
      };
    });

    setGameSubState('LOBBY');
    gameRuntimeRef.current.subState = 'LOBBY';
    setView('GAME_ARENA');

    if (nextStatus === 'LOBBY' && baseRoom.status !== 'LOBBY') {
      dispatchSyncAction('RESET_LOBBY', { pin: targetPin });
    }
    dispatchSyncAction('JOIN_LOBBY', { pin: targetPin, player: teacherEntry });
  };

  const handleSaveHostRoomSettings = (e) => {
    if (e) e.preventDefault();
    const oldPin = joinedRoomPin || currentRoomPin;
    const newPin = (hostRoomDraft.pin || '').trim() || oldPin;
    const newName = (hostRoomDraft.name || '').trim() || `Phòng Từ Vựng #${newPin}`;
    const newPass = (hostRoomDraft.pass || '').trim() || 'ielts';
    const cleanRoundSize = Math.max(2, Math.min(8, Number(hostRoomDraft.roundSize) || 4));
    const cleanSpeedMode = ['relaxed', 'normal', 'turbo'].includes(hostRoomDraft.speedMode) ? hostRoomDraft.speedMode : 'normal';

    if (newPin !== oldPin && roomsDb[newPin]) {
      showToast(`Mã phòng "${newPin}" đã tồn tại — hãy chọn mã PIN khác hoặc bấm chọn phòng đó!`, 'error');
      return;
    }

    setRoomsDb(prev => {
      const source = normalizeRoomObject(prev[oldPin], oldPin);
      const updatedRoom = normalizeRoomObject(
        {
          ...source,
          pin: newPin,
          name: newName,
          pass: newPass,
          roundSize: cleanRoundSize,
          speedMode: cleanSpeedMode
        },
        newPin
      );
      const next = { ...prev, [newPin]: updatedRoom };
      if (oldPin !== newPin) {
        delete next[oldPin];
      }
      return next;
    });

    setCurrentRoomPin(newPin);
    setJoinedRoomPin(newPin);
    setHostRoomDraft({ pin: newPin, name: newName, pass: newPass, roundSize: cleanRoundSize, speedMode: cleanSpeedMode });

    dispatchSyncAction('UPSERT_ROOM', {
      pin: newPin,
      oldPin: oldPin !== newPin ? oldPin : undefined,
      updates: { name: newName, pass: newPass, roundSize: cleanRoundSize, speedMode: cleanSpeedMode }
    });
    showToast(`Đã cập nhật phòng "${newName}" (PIN: ${newPin} • ${cleanRoundSize} từ/vòng • ${cleanSpeedMode})!`);
  };

  const handleTeacherResetLobby = (pin = currentRoomPin) => {
    clearTimeout(autoNextTimerRef.current);
    clearInterval(wordTimerRef.current);
    clearInterval(lobbyCountdownTimerRef.current);
    setLobbyCountdown(null);
    lastLaunchedAtRef.current = null;
    prevLiveRanksRef.current = {};
    setLiveRankDeltas({});

    setRoomsDb(prev => {
      const r = normalizeRoomObject(prev[pin], pin);
      return {
        ...prev,
        [pin]: {
          ...r,
          status: 'LOBBY',
          startedAt: null,
          liveMatch: {}
        }
      };
    });
    setGameSubState('LOBBY');
    gameRuntimeRef.current.subState = 'LOBBY';
    dispatchSyncAction('RESET_LOBBY', { pin });
    showToast(`Đã mở lại Sảnh Chờ cho phòng ${pin}! Học sinh có thể vào sảnh ngay.`);
  };

  const handleTeacherStartLobbyGame = (pin = currentRoomPin) => {
    const targetPin = pin || currentRoomPin;
    const targetRoom = normalizeRoomObject(roomsDb[targetPin], targetPin);
    const waitingStudents = Object.values(targetRoom.lobbyPlayers || {}).filter(p => p.role !== 'teacher');

    if (waitingStudents.length === 0) {
      showToast('Chưa có học sinh nào trong sảnh! Bạn chỉ có thể bấm "Chơi Thử GV" khi phòng trống.', 'info');
      return;
    }

    const launchTs = Date.now();
    const freshLive = {};
    waitingStudents.forEach(lp => {
      freshLive[lp.username] = {
        username: lp.username,
        name: lp.name || lp.username,
        role: 'student',
        colorId: lp.colorId || 'cyan',
        avatarUrl: lp.avatarUrl || usersDb[lp.username]?.avatarUrl || '',
        score: 0,
        streak: 0,
        lives: 3,
        round: 1,
        progressText: 'Đang vào Vòng 1',
        finished: false,
        outcome: null,
        updatedAt: launchTs
      };
    });

    setRoomsDb(prev => {
      const r = normalizeRoomObject(prev[targetPin], targetPin);
      return {
        ...prev,
        [targetPin]: {
          ...r,
          status: 'PLAYING',
          startedAt: launchTs,
          liveMatch: freshLive
        }
      };
    });
    dispatchSyncAction('START_GAME', { pin: targetPin, startedAt: launchTs });
  };

  const handleLeaveGameLobby = () => {
    clearTimeout(autoNextTimerRef.current);
    clearInterval(wordTimerRef.current);
    clearInterval(lobbyCountdownTimerRef.current);
    setLobbyCountdown(null);
    const activePin = joinedRoomPin || currentRoomPin;
    if (activePin && currentUser) {
      setRoomsDb(prev => {
        const r = prev[activePin];
        if (!r) return prev;
        const nextLobby = { ...(r.lobbyPlayers || {}) };
        delete nextLobby[currentUser.username];
        return {
          ...prev,
          [activePin]: { ...r, lobbyPlayers: nextLobby }
        };
      });
      dispatchSyncAction('LEAVE_LOBBY', { pin: activePin, username: currentUser.username });
    }
    setJoinedRoomPin(null);
    setGameSubState('JOIN');
    gameRuntimeRef.current.subState = 'JOIN';
    setView(currentUser?.role === 'teacher' ? 'TEACHER_DASHBOARD' : 'HOME');
  };

  const handleChangeCrewColor = (colorId) => {
    if (colorId === 'avatar' && !currentUser?.avatarUrl) {
      setShowAvatarModal(true);
      showToast('Hãy tải lên ảnh Avatar trước để dùng làm mặt nhân vật!', 'info');
      return;
    }
    setMyCrewColor(colorId);
    const activePin = joinedRoomPin || currentRoomPin;
    if (!activePin || !currentUser) return;
    const avatarUrl = currentUser.avatarUrl || '';
    const fallbackPlayer = buildLobbyPlayerEntry(currentUser, { colorId, avatarUrl });
    setRoomsDb(prev => {
      const r = normalizeRoomObject(prev[activePin], activePin);
      const currPlayer = r.lobbyPlayers?.[currentUser.username] || fallbackPlayer;
      return {
        ...prev,
        [activePin]: {
          ...r,
          lobbyPlayers: {
            ...r.lobbyPlayers,
            [currentUser.username]: { ...currPlayer, colorId, avatarUrl }
          }
        }
      };
    });
    dispatchSyncAction('UPDATE_LOBBY_PLAYER', {
      pin: activePin,
      username: currentUser.username,
      patch: { colorId, avatarUrl },
      fallbackPlayer
    });
  };

  const handleToggleLobbyReady = () => {
    const activePin = joinedRoomPin || currentRoomPin;
    if (!activePin || !currentUser) return;
    const currentRoom = normalizeRoomObject(roomsDb[activePin], activePin);
    const me = currentRoom.lobbyPlayers?.[currentUser.username] || buildLobbyPlayerEntry(currentUser, { ready: false });
    const nextReady = !me.ready;

    setRoomsDb(prev => {
      const r = normalizeRoomObject(prev[activePin], activePin);
      const curr = r.lobbyPlayers?.[currentUser.username] || me;
      return {
        ...prev,
        [activePin]: {
          ...r,
          lobbyPlayers: {
            ...r.lobbyPlayers,
            [currentUser.username]: { ...curr, ready: nextReady }
          }
        }
      };
    });
    dispatchSyncAction('UPDATE_LOBBY_PLAYER', {
      pin: activePin,
      username: currentUser.username,
      patch: { ready: nextReady },
      fallbackPlayer: { ...me, ready: nextReady }
    });
  };

  const handleSendLobbyChat = (text) => {
    const activePin = joinedRoomPin || currentRoomPin;
    const cleanText = (text || '').trim();
    if (!activePin || !currentUser || !cleanText) return;

    const msgId = Date.now() + Math.floor(Math.random() * 1000);
    const currentRoom = normalizeRoomObject(roomsDb[activePin], activePin);
    const me = currentRoom.lobbyPlayers?.[currentUser.username] || buildLobbyPlayerEntry(currentUser);
    const chatMessage = {
      id: msgId,
      username: currentUser.username,
      name: currentUser.name || currentUser.username,
      role: currentUser.role,
      colorId: me.colorId || myCrewColor,
      text: cleanText,
      createdAt: Date.now(),
      timeStr: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })
    };

    setRoomsDb(prev => {
      const r = normalizeRoomObject(prev[activePin], activePin);
      const curr = r.lobbyPlayers?.[currentUser.username] || me;
      const prevChats = Array.isArray(r.chatMessages) ? r.chatMessages : [];
      return {
        ...prev,
        [activePin]: {
          ...r,
          chatMessages: [...prevChats, chatMessage].slice(-50),
          lobbyPlayers: {
            ...r.lobbyPlayers,
            [currentUser.username]: { ...curr, chat: cleanText, chatAt: msgId }
          }
        }
      };
    });

    dispatchSyncAction('SEND_LOBBY_CHAT', {
      pin: activePin,
      message: chatMessage,
      fallbackPlayer: me
    });
  };

  const handleCreateRoom = (e) => {
    if (e) e.preventDefault();
    const generatedPin = (newRoomForm.pin || '').trim() || String(Math.floor(100000 + Math.random() * 900000));
    const cleanPass = (newRoomForm.pass || '').trim() || 'ielts';
    const cleanName = (newRoomForm.name || '').trim() || `Phòng Từ Vựng #${generatedPin}`;

    if (roomsDb[generatedPin] && roomsDb[generatedPin].status !== 'ENDED') {
      showToast(`Mã phòng ${generatedPin} đang tồn tại. Vui lòng chọn mã phòng khác.`, 'error');
      return;
    }

    const teacherEntry = currentUser
      ? buildLobbyPlayerEntry(currentUser, { name: currentUser.name || 'Giáo viên', role: 'teacher', ready: true })
      : null;

    const newRoomObj = {
      pin: generatedPin,
      name: cleanName,
      pass: cleanPass,
      teacher: currentUser?.username || 'teacher_ielts',
      status: 'LOBBY',
      maxPlayers: 30,
      roundSize: Math.max(2, Math.min(8, Number(newRoomForm.roundSize) || 4)),
      speedMode: ['relaxed', 'normal', 'turbo'].includes(newRoomForm.speedMode) ? newRoomForm.speedMode : 'normal',
      startedAt: null,
      lobbyPlayers: teacherEntry ? { [currentUser.username]: teacherEntry } : {},
      chatMessages: [],
      rawVocab: DEFAULT_VOCAB_TEXT,
      players: {}
    };

    setRoomsDb(prev => ({
      ...prev,
      [generatedPin]: newRoomObj
    }));
    setCurrentRoomPin(generatedPin);
    setJoinedRoomPin(generatedPin);
    setHostRoomDraft({
      pin: generatedPin,
      name: cleanName,
      pass: cleanPass,
      roundSize: newRoomObj.roundSize,
      speedMode: newRoomObj.speedMode
    });
    setShowCreateRoomModal(false);
    setNewRoomForm({ pin: '', pass: 'ielts', name: 'Phòng Đấu Từ Vựng Mới', roundSize: 4, speedMode: 'normal' });

    dispatchSyncAction('UPSERT_ROOM', { pin: generatedPin, updates: newRoomObj });
    showToast(`Đã tạo phòng "${cleanName}" (PIN: ${generatedPin} • Pass: ${cleanPass})!`);

    if (currentUser?.role === 'teacher') {
      setGameSubState('LOBBY');
      gameRuntimeRef.current.subState = 'LOBBY';
      setView('GAME_ARENA');
    }
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

  const examAutoAdvanceHandledRef = useRef(null);
  const autoAdvanceFnRef = useRef(null);

  // Exam Countdown Timer (only decrements safely; timeout triggers separate effect below)
  useEffect(() => {
    if (view !== 'EXAM_MODE') return;

    const timer = setInterval(() => {
      setExamState(prev => ({
        ...prev,
        timeRemaining: prev.timeRemaining > 0 ? prev.timeRemaining - 1 : 0
      }));
    }, 1000);

    return () => clearInterval(timer);
  }, [view]);

  useEffect(() => {
    if (view !== 'EXAM_MODE' || examState.timeRemaining > 0) return;
    const key = `${selectedTestId}:${examState.sectionIdx}`;
    if (examAutoAdvanceHandledRef.current === key) return;
    examAutoAdvanceHandledRef.current = key;
    autoAdvanceFnRef.current?.();
  }, [view, examState.timeRemaining, examState.sectionIdx, selectedTestId]);

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
      dispatchSyncAction('UPSERT_USER', { username: uname, user: newUser });
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
    clearTimeout(autoNextTimerRef.current);
    clearInterval(wordTimerRef.current);
    clearInterval(lobbyCountdownTimerRef.current);
    setLobbyCountdown(null);
    if (examAudioRef.current) {
      examAudioRef.current.pause();
      examAudioRef.current = null;
    }
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    setJoinedRoomPin(null);
    setGameSubState('JOIN');
    setCurrentUser(null);
    setView('AUTH');
    setAuthForm({ username: '', password: '', fullName: '' });
    setAuthError('');
  };

  // ==========================================
  // EXAM HANDLERS
  // ==========================================
  const stopExamAudio = () => {
    if (examAudioRef.current) {
      examAudioRef.current.pause();
      examAudioRef.current = null;
    }
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    setIsPlayingAudio(false);
  };

  const startExam = (testId) => {
    const test = tests.find(t => t.id === testId);
    if (!test) return;

    const cfg = normalizeExamConfig(test);
    if (cfg.visibility === 'private' && currentUser?.role !== 'teacher') {
      showToast('Đề thi này đang ở chế độ riêng tư (Giáo viên chưa công khai).');
      return;
    }

    if (currentUser?.role !== 'teacher' && cfg.maxAttempts > 0) {
      const usedCount = attempts.filter(
        a => (a.studentId === currentUser?.username || a.studentUsername === currentUser?.username) && a.testId === testId
      ).length;
      if (usedCount >= cfg.maxAttempts) {
        showToast(`Bạn đã dùng hết ${cfg.maxAttempts} lượt làm đề thi này!`);
        return;
      }
    }

    const firstSkill = cfg.order[0] || 'listening';
    examAutoAdvanceHandledRef.current = null;
    stopExamAudio();
    setSelectedTestId(testId);

    const draftKey = `ielts_exam_draft_${currentUser?.username || 'guest'}_${testId}`;
    let restoredDraft = null;
    try {
      const rawDraft = localStorage.getItem(draftKey);
      if (rawDraft) {
        const parsed = JSON.parse(rawDraft);
        if (parsed && typeof parsed === 'object' && cfg.order.includes(parsed.skill)) {
          restoredDraft = parsed;
        }
      }
    } catch (_err) {}

    if (restoredDraft) {
      const validIdx = Math.max(0, cfg.order.indexOf(restoredDraft.skill));
      setExamState({
        skill: cfg.order[validIdx],
        sectionIdx: validIdx,
        timeRemaining:
          typeof restoredDraft.timeRemaining === 'number' && restoredDraft.timeRemaining > 0
            ? restoredDraft.timeRemaining
            : (cfg.durations[cfg.order[validIdx]] || 15) * 60,
        answers: restoredDraft.answers || {},
        audioPlays: restoredDraft.audioPlays || { mainAudio: 0 },
        highlights: Array.isArray(restoredDraft.highlights) ? restoredDraft.highlights : [],
        notes: Array.isArray(restoredDraft.notes) ? restoredDraft.notes : [],
        antiCheatLogs: Array.isArray(restoredDraft.antiCheatLogs) ? restoredDraft.antiCheatLogs : [],
        tabSwitchCount: Number(restoredDraft.tabSwitchCount) || 0,
        readingPassageIdx: Number(restoredDraft.readingPassageIdx) || 0,
        showAllReadingQs: Boolean(restoredDraft.showAllReadingQs)
      });
      showToast('Đã tự động khôi phục bài làm dở trước đó của bạn!', 'info');
    } else {
      setExamState({
        skill: firstSkill,
        sectionIdx: 0,
        timeRemaining: (cfg.durations[firstSkill] || 15) * 60,
        answers: {},
        audioPlays: { mainAudio: 0 },
        highlights: [],
        notes: [],
        antiCheatLogs: [],
        tabSwitchCount: 0,
        readingPassageIdx: 0,
        showAllReadingQs: false
      });
    }
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
    stopExamAudio();
    const activeTest = tests.find(t => t.id === selectedTestId);
    if (!activeTest) return;

    let listeningRaw = 0;
    const lQuestions = activeTest.listening?.questions || [];
    lQuestions.forEach(q => {
      if (isObjectiveAnswerCorrect(q, examState.answers[q.id])) listeningRaw++;
    });

    let readingRaw = 0;
    const rQuestions = activeTest.reading?.questions || [];
    rQuestions.forEach(q => {
      if (isObjectiveAnswerCorrect(q, examState.answers[q.id])) readingRaw++;
    });

    const draftKey = `ielts_exam_draft_${currentUser?.username || 'guest'}_${activeTest.id}`;
    try { localStorage.removeItem(draftKey); } catch (_err) {}

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
    dispatchSyncAction('UPSERT_ATTEMPT', { attempt: newAttempt });
    setSelectedAttemptId(newAttempt.id);
    setView('RESULT_VIEW');
  };

  const advanceToNextExamSection = (isAutoTimeout = false) => {
    const activeTest = tests.find(t => t.id === selectedTestId);
    if (!activeTest) return;
    const cfg = normalizeExamConfig(activeTest);
    const currentIdx =
      typeof examState.sectionIdx === 'number'
        ? examState.sectionIdx
        : Math.max(0, cfg.order.indexOf(examState.skill));
    const nextIdx = currentIdx + 1;

    stopExamAudio();

    if (nextIdx >= cfg.order.length) {
      if (isAutoTimeout) {
        showToast('Hết giờ kỹ năng cuối cùng! Hệ thống đã tự động nộp bài.');
      }
      handleFinalExamSubmit();
      return;
    }

    const nextSkill = cfg.order[nextIdx];
    const nextDurationSecs = (cfg.durations[nextSkill] || 15) * 60;
    const skillNames = { listening: 'Listening', reading: 'Reading', writing: 'Writing' };

    setExamState(prev => ({
      ...prev,
      sectionIdx: nextIdx,
      skill: nextSkill,
      timeRemaining: nextDurationSecs,
      readingPassageIdx: 0
    }));
    showToast(
      isAutoTimeout
        ? `Hết giờ phần trước — Tự động chuyển sang ${skillNames[nextSkill]} (${cfg.durations[nextSkill]} phút)!`
        : `Đã chuyển sang phần ${skillNames[nextSkill]} (${cfg.durations[nextSkill]} phút)!`
    );
  };

  autoAdvanceFnRef.current = () => advanceToNextExamSection(true);

  const handleTestGeminiKey = async (keyOverride = aiApiKey) => {
    const cleanKey = (keyOverride || '').trim();
    if (!cleanKey) {
      setApiTestState({ testing: false, ok: false, message: 'Vui lòng nhập API Key trước khi kiểm tra.', model: '' });
      return;
    }
    setApiTestState({ testing: true, ok: null, message: 'Đang kết nối Google Gemini API...', model: '' });
    try {
      const usedModel = await testGeminiApiConnection(cleanKey);
      setAiApiKey(cleanKey);
      localStorage.setItem('ielts_ai_key', cleanKey);
      setApiTestState({
        testing: false,
        ok: true,
        model: usedModel,
        message: `Kết nối thành công! Hệ thống đang dùng model "${usedModel}" và đã lưu API Key.`
      });
    } catch (err) {
      setApiTestState({
        testing: false,
        ok: false,
        model: '',
        message: err?.message || 'Không thể kết nối với Google Gemini API.'
      });
    }
  };

  // Shared Writing AI Grading helper (Teacher-controlled)
  const runWritingGradingEngine = async (targetAttempt) => {
    const test = tests.find(t => t.id === targetAttempt.testId);
    const cleanKey = (aiApiKey || '').trim();

    if (cleanKey) {
      setAiGradingStep('Đang kết nối Google Gemini API...');
      try {
        const res = await callGeminiWritingGrader({
          apiKey: cleanKey,
          task1Prompt: test?.writing?.task1?.prompt,
          task1Text: targetAttempt.answers?.w1,
          task2Prompt: test?.writing?.task2?.prompt,
          task2Text: targetAttempt.answers?.w2
        });
        return { ...res, _engineLabel: `Google Gemini (${res._usedModel || 'Live API'})` };
      } catch (apiErr) {
        console.warn('Gemini API error:', apiErr);
        showToast(`Gemini API lỗi: ${apiErr.message}`, 'error');
        setAiGradingStep(`API lỗi (${apiErr.message}) — chuyển sang bộ chấm tích hợp...`);
        await new Promise(r => setTimeout(r, 900));
      }
    } else {
      await new Promise(r => setTimeout(r, 600));
      setAiGradingStep('Đang phân tích cấu trúc & đối chiếu 4 tiêu chí IELTS...');
      await new Promise(r => setTimeout(r, 700));
    }

    const fallback = simulateAIWritingGrading({
      _task1Prompt: test?.writing?.task1?.prompt,
      task1Text: targetAttempt.answers?.w1,
      _task2Prompt: test?.writing?.task2?.prompt,
      task2Text: targetAttempt.answers?.w2
    });
    return { ...fallback, _engineLabel: 'AI Examiner Tích Hợp (Offline)' };
  };

  // AI Writing Grading Trigger (Teacher only)
  const handleGradeWritingWithAI = async (targetAttempt) => {
    if (!targetAttempt || currentUser?.role !== 'teacher') return;
    setIsGradingAI(true);
    setAiGradingStep('Khởi tạo AI IELTS Senior Examiner...');

    try {
      const aiResult = await runWritingGradingEngine(targetAttempt);
      const t1 = parseFloat(aiResult.task1Band) || 0;
      const t2 = parseFloat(aiResult.task2Band) || 0;
      const writingOverall = parseFloat(aiResult.overallBand) || roundIeltsBand((t1 + t2 * 2) / 3);

      const lBand = targetAttempt.scores?.listening?.band || 0;
      const rBand = targetAttempt.scores?.reading?.band || 0;
      const finalOverall = parseFloat(((lBand + rBand + writingOverall * 2) / 4).toFixed(1));

      const updatedAiAttempt = {
        ...targetAttempt,
        teacherGraded: true,
        aiGraded: true,
        aiDetails: aiResult,
        scores: {
          ...targetAttempt.scores,
          writing: { task1Band: t1, task2Band: t2, overallBand: writingOverall }
        },
        overallBand: finalOverall,
        teacherFeedback: aiResult.feedback
      };
      setAttempts(prev => prev.map(att => (att.id === targetAttempt.id ? updatedAiAttempt : att)));
      dispatchSyncAction('UPSERT_ATTEMPT', { attempt: updatedAiAttempt });
      showToast(`Đã hoàn tất chấm điểm (${aiResult._engineLabel})!`);
    } catch (err) {
      alert('Có lỗi xảy ra trong quá trình chấm điểm: ' + err.message);
    } finally {
      setIsGradingAI(false);
      setAiGradingStep('');
    }
  };

  // Teacher AI grading assist in grading modal
  const handleTeacherAIGrade = async (targetAttempt) => {
    if (!targetAttempt || currentUser?.role !== 'teacher') return;
    setIsGradingAI(true);
    setAiGradingStep('AI đang phân tích bài thi và gợi ý band điểm...');

    try {
      const aiResult = await runWritingGradingEngine(targetAttempt);
      setGradingScores({
        task1Band: aiResult.task1Band,
        task2Band: aiResult.task2Band,
        feedback: aiResult.feedback
      });
      showToast(`Đã điền gợi ý điểm từ ${aiResult._engineLabel}!`);
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

    const updatedAttemptObj = {
      ...gradingAttempt,
      teacherGraded: true,
      scores: {
        ...gradingAttempt.scores,
        writing: {
          task1Band: t1,
          task2Band: t2,
          overallBand: writingOverall
        }
      },
      overallBand: finalOverall,
      teacherFeedback: gradingScores.feedback
    };
    const updatedAttempts = attempts.map(att => (att.id === gradingAttempt.id ? updatedAttemptObj : att));

    setAttempts(updatedAttempts);
    dispatchSyncAction('UPSERT_ATTEMPT', { attempt: updatedAttemptObj });
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
  const openExamBuilder = (testToEdit = null, initialTab = 'general') => {
    setEditingTest(testToEdit || null);
    setBuilderReadingIdx(0);
    if (testToEdit) {
      const cloned = JSON.parse(JSON.stringify(testToEdit));
      const cfg = normalizeExamConfig(cloned);
      const passages = getReadingPassages(cloned.reading);
      setTestForm({
        ...cloned,
        visibility: cfg.visibility,
        maxAttempts: cfg.maxAttempts,
        sequentialMode: cfg.sequentialMode,
        allowEarlyNextSection: cfg.allowEarlyNextSection,
        sectionOrder: cfg.order,
        sectionDurations: cfg.durations,
        allowViewAnswers: cloned.allowViewAnswers ?? false,
        listening: {
          audioUrl: '',
          audioFileName: '',
          transcript: '',
          questions: [],
          ...(cloned.listening || {})
        },
        reading: {
          passageTitle: passages[0]?.title || '',
          passageText: passages[0]?.passageText || '',
          imageUrl: passages[0]?.imageUrl || '',
          imageFileName: passages[0]?.imageFileName || '',
          questions: [],
          ...(cloned.reading || {}),
          passages
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
        visibility: 'private',
        maxAttempts: 0,
        sequentialMode: true,
        allowEarlyNextSection: false,
        sectionOrder: [...DEFAULT_SECTION_ORDER],
        sectionDurations: { ...DEFAULT_SECTION_DURATIONS },
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
          passageTitle: 'Bài 1: Urban Architecture & Sustainability',
          passageText: 'Modern cities are increasingly adopting sustainable architectural practices to reduce carbon footprints and improve residents\' quality of life...',
          imageUrl: '',
          imageFileName: '',
          passages: [
            {
              id: 'passage-1',
              title: 'Bài 1: Urban Architecture & Sustainability',
              imageUrl: '',
              imageFileName: '',
              passageText: 'Modern cities are increasingly adopting sustainable architectural practices to reduce carbon footprints and improve residents\' quality of life...'
            }
          ],
          questions: [
            {
              id: 'rq-' + (Date.now() + 1),
              type: 'tfng',
              passageIdx: 0,
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
    setBuilderTab(initialTab || 'general');
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

  // Upload Image for Reading Passage (Teacher Builder — supports multiple passages)
  const updateReadingPassageField = (idx, patch) => {
    setTestForm(prev => {
      const passages = getReadingPassages(prev.reading);
      const updatedPassages = passages.map((p, i) => (i === idx ? { ...p, ...patch } : p));
      const first = updatedPassages[0] || {};
      return {
        ...prev,
        reading: {
          ...prev.reading,
          passages: updatedPassages,
          passageTitle: first.title || '',
          passageText: first.passageText || '',
          imageUrl: first.imageUrl || '',
          imageFileName: first.imageFileName || ''
        }
      };
    });
  };

  const handleReadingImageUpload = (e, targetIdx = builderReadingIdx) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      updateReadingPassageField(targetIdx, {
        imageUrl: ev.target.result,
        imageFileName: file.name
      });
      showToast(`Đã thêm ảnh bài đọc số ${targetIdx + 1}: ${file.name}`);
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
      correctAnswer: 'A. Đáp án A',
      ...(skill === 'reading' ? { passageIdx: builderReadingIdx } : {})
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
    const cfg = normalizeExamConfig(testForm);
    const passages = getReadingPassages(testForm.reading);
    const firstPassage = passages[0] || {};
    const normalizedTest = {
      ...testForm,
      visibility: cfg.visibility,
      maxAttempts: cfg.maxAttempts,
      sequentialMode: cfg.sequentialMode,
      allowEarlyNextSection: cfg.allowEarlyNextSection,
      sectionOrder: cfg.order,
      sectionDurations: cfg.durations,
      reading: {
        ...testForm.reading,
        passages,
        passageTitle: firstPassage.title || '',
        passageText: firstPassage.passageText || '',
        imageUrl: firstPassage.imageUrl || '',
        imageFileName: firstPassage.imageFileName || ''
      }
    };
    const existingIndex = tests.findIndex(t => t.id === normalizedTest.id);
    if (existingIndex >= 0) {
      const updated = [...tests];
      updated[existingIndex] = normalizedTest;
      setTests(updated);
      showToast(`Đã cập nhật đề thi "${normalizedTest.title}" thành công!`);
    } else {
      setTests([...tests, normalizedTest]);
      showToast(`Đã tạo mới đề thi "${normalizedTest.title}" thành công!`);
    }
    dispatchSyncAction('UPSERT_TEST', { test: normalizedTest });
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

  // Sync mutable color id for Canvas spaceship rendering
  useEffect(() => {
    gameRuntimeRef.current.crewColorId = myCrewColor;
  }, [myCrewColor]);

  // Helper to spawn particle bursts inside Space Arena Canvas
  const pushGameParticles = (x, y, color = '#00f2fe', count = 18) => {
    const arr = particlesRef.current;
    for (let i = 0; i < count; i++) {
      const angle = (Math.PI * 2 * i) / count + Math.random() * 0.4;
      const speed = 1.6 + Math.random() * 4.2;
      arr.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        radius: 2 + Math.random() * 3,
        color,
        alpha: 1
      });
    }
  };

  const recordMissedWordInMatch = (word) => {
    const clean = String(word || '').trim().toUpperCase();
    if (!clean) return;
    if (!missedWordsMatchRef.current.includes(clean)) {
      missedWordsMatchRef.current = [...missedWordsMatchRef.current, clean];
    }
  };

  const resetWordTimer = (roundNum, speedModeOverride = null) => {
    const mode = speedModeOverride || gameRuntimeRef.current.speedMode || 'normal';
    const limit = getSpeedAdjustedTimeLimit(roundNum, mode);
    wordStartedAtRef.current = Date.now();
    bonusTimeSecRef.current = 0;
    freezeUntilRef.current = 0;
    setIsFrozenBoost(false);
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

  const buildRoundQueuesFromRoom = (pin) => {
    const room = normalizeRoomObject(roomsDb[pin] || { rawVocab: DEFAULT_VOCAB_TEXT }, pin);
    const vocabList = parseRawVocabText(room.rawVocab || DEFAULT_VOCAB_TEXT);
    const shuffled = [...vocabList].sort(() => Math.random() - 0.5);
    const total = shuffled.length;
    const desiredPerRound = Math.max(2, Math.min(8, Number(room.roundSize) || 4));
    const perRound = Math.max(1, Math.min(desiredPerRound, Math.floor(total / 3) || 1));
    return {
      1: shuffled.slice(0, perRound),
      2: shuffled.slice(perRound, perRound * 2),
      3: shuffled.slice(perRound * 2, perRound * 3)
    };
  };

  const initGameCampaign = (pin = joinedRoomPin || currentRoomPin, _userObj = currentUser) => {
    clearTimeout(autoNextTimerRef.current);
    clearInterval(wordTimerRef.current);

    const roomObj = normalizeRoomObject(roomsDb[pin] || {}, pin);
    const speedMode = roomObj.speedMode || 'normal';
    const queues = buildRoundQueuesFromRoom(pin);
    const firstQ = queues[1][0] || null;
    const initialProgress = firstQ ? skipNonAlphaIndex(firstQ.word, 0) : 0;

    homingLasersRef.current = [];
    particlesRef.current = [];
    missedWordsMatchRef.current = [];
    bonusTimeSecRef.current = 0;
    freezeUntilRef.current = 0;

    const r1Limit = getSpeedAdjustedTimeLimit(1, speedMode);
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
      paused: false,
      speedMode,
      crewColorId: myCrewColor,
      timeLimit: r1Limit,
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
    setGamePaused(false);
    setFreezeCharges(2);
    setIsFrozenBoost(false);
    setGameOutcome(null);
    setIsSandboxRound(false);
    setGameReviewLog([]);
    setActiveQuestion(firstQ);
    resetWordTimer(1, speedMode);
    syncLiveMatchProgress({
      scoreVal: 0,
      streakVal: 0,
      livesVal: 3,
      roundNum: 1,
      progressText: `Vòng 1/3 • Câu 1/${Math.max(1, queues[1]?.length || 1)}`,
      missedWords: []
    });
  };

  const jumpToGameSandboxRound = (roundNum) => {
    if (currentUser?.role !== 'teacher') return;
    const activePin = joinedRoomPin || currentRoomPin;
    const activeRoom = normalizeRoomObject(roomsDb[activePin] || {}, activePin);
    const hasStudents = Object.values(activeRoom?.lobbyPlayers || {}).some((p) => p?.role !== 'teacher');
    if (hasStudents) {
      showToast('Phòng đã có học sinh — Giáo viên chỉ giám sát Đua Top, không chơi lúc này!', 'info');
      return;
    }
    clearTimeout(autoNextTimerRef.current);
    clearInterval(wordTimerRef.current);

    let queues = gameRuntimeRef.current.queues;
    if (!queues?.[roundNum]?.length) {
      queues = buildRoundQueuesFromRoom(activePin);
      setGameQueues(queues);
    }
    const speedMode = activeRoom.speedMode || 'normal';
    const queue = queues[roundNum] || [];
    const firstQ = queue[0] || null;
    const initialProgress = firstQ ? skipNonAlphaIndex(firstQ.word, 0) : 0;

    homingLasersRef.current = [];
    particlesRef.current = [];
    missedWordsMatchRef.current = [];
    bonusTimeSecRef.current = 0;
    freezeUntilRef.current = 0;

    gameRuntimeRef.current = {
      ...gameRuntimeRef.current,
      round: roundNum,
      lives: 3,
      wordIdx: 0,
      typedProgress: initialProgress,
      subState: 'PLAYING',
      activeQuestion: firstQ,
      isSandbox: true,
      paused: false,
      speedMode,
      crewColorId: myCrewColor,
      timeLimit: getSpeedAdjustedTimeLimit(roundNum, speedMode),
      questionResolved: false
    };

    setGameRound(roundNum);
    setGameLives(3);
    setGameWordIdx(0);
    setGameTypedProgress(initialProgress);
    setGameSubState('PLAYING');
    setGamePaused(false);
    setFreezeCharges(2);
    setIsFrozenBoost(false);
    setGameOutcome(null);
    setIsSandboxRound(true);
    setActiveQuestion(firstQ);
    resetWordTimer(roundNum, speedMode);

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
    syncLiveMatchProgress({
      scoreVal: gameRuntimeRef.current.score,
      streakVal: gameRuntimeRef.current.combo,
      livesVal: gameRuntimeRef.current.lives,
      roundNum: nextR,
      progressText: `Vòng ${nextR}/3 • Câu 1/${Math.max(1, queue.length)}`,
      missedWords: [...missedWordsMatchRef.current]
    });

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
    if (!isCorrect) {
      recordMissedWordInMatch(q.word);
    }

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
      syncLiveMatchProgress({
        scoreVal: finalScore,
        streakVal: finalCombo,
        livesVal: rt.lives,
        roundNum: currentRoundNum,
        progressText: `Vòng ${currentRoundNum}/3 • Câu ${nextIdx + 1}/${Math.max(1, currentQueue.length)}`,
        missedWords: [...missedWordsMatchRef.current]
      });

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
        syncLiveMatchProgress({
          scoreVal: finalScore,
          streakVal: finalCombo,
          livesVal: rt.lives,
          roundNum: currentRoundNum,
          progressText: `Xong Vòng ${currentRoundNum}/3`,
          missedWords: [...missedWordsMatchRef.current]
        });
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
        const allMissed = [...missedWordsMatchRef.current];
        syncLiveMatchProgress({
          scoreVal: finalScore,
          streakVal: finalCombo,
          livesVal: rt.lives,
          roundNum: currentRoundNum,
          progressText: 'Hoàn thành 3 Vòng',
          finished: true,
          outcome: 'VICTORY',
          missedWords: allMissed
        });
        syncScoreToLeaderboard(
          finalScore,
          rt.isSandbox ? `Hoàn thành Màn ${currentRoundNum} (GV)` : 'Hoàn thành 3 Vòng',
          finalCombo,
          allMissed
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
      recordMissedWordInMatch(q.word);
    }
    const allMissed = [...missedWordsMatchRef.current];

    if (nextLives <= 0) {
      clearTimeout(autoNextTimerRef.current);
      clearInterval(wordTimerRef.current);
      rt.subState = 'GAMEOVER';
      rt.questionResolved = true;
      setGameOutcome('LOST');
      setGameSubState('GAMEOVER');
      syncLiveMatchProgress({
        scoreVal: rt.score,
        streakVal: 0,
        livesVal: 0,
        roundNum,
        progressText: `Hết mạng ở Vòng ${roundNum}`,
        finished: true,
        outcome: 'LOST',
        missedWords: allMissed
      });
      syncScoreToLeaderboard(
        rt.score,
        `Hết mạng ở Vòng ${roundNum}`,
        0,
        allMissed
      );
      return;
    }

    if (advanceOnSurvive) {
      handleWordCleared(false, rt.score, 0);
    } else {
      syncLiveMatchProgress({
        scoreVal: rt.score,
        streakVal: 0,
        livesVal: nextLives,
        roundNum,
        progressText: `Vòng ${roundNum}/3 • Câu ${rt.wordIdx + 1}/${Math.max(1, (rt.queues[roundNum] || []).length)}`,
        missedWords: allMissed
      });
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
        const feverMult = rt.combo >= 3 ? 2 : 1;
        const bonus = rt.round === 2 ? 150 : 250;
        const streakBonus = rt.combo * 25;
        const totalGain = (bonus + streakBonus) * feverMult;
        const nextScore = rt.score + totalGain;
        const nextCombo = rt.combo + 1;

        rt.score = nextScore;
        rt.combo = nextCombo;
        setGameScore(nextScore);
        setGameCombo(nextCombo);

        pushGameParticles(w / 2, Math.max(80, h * 0.3), feverMult > 1 ? '#fbbf24' : '#34d399', 26);
        playSound('word_clear');
        speakWord(q.word);
        triggerGameToast(
          `🎯 Chính xác! ${q.word} (${q.ipa}) +${totalGain}đ${feverMult > 1 ? ' 🔥 FEVER x2!' : ''}`,
          true
        );
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
    if (rt.subState !== 'PLAYING' || (rt.round !== 2 && rt.round !== 3) || !rt.activeQuestion || rt.paused) return;
    const nextChar = rt.activeQuestion.word.toUpperCase()[rt.typedProgress];
    if (!nextChar) return;
    const nextScore = Math.max(0, rt.score - 15);
    rt.score = nextScore;
    setGameScore(nextScore);
    handleGameTypingInput(nextChar);
  };

  const handleUseFreezePowerup = () => {
    const rt = gameRuntimeRef.current;
    if (rt.subState !== 'PLAYING' || rt.paused || freezeCharges <= 0 || !rt.activeQuestion) return;
    bonusTimeSecRef.current += 8;
    freezeUntilRef.current = Date.now() + 4500;
    setFreezeCharges(prev => Math.max(0, prev - 1));
    setIsFrozenBoost(true);
    setGameTimeLeft(prev => prev + 8);
    const canvas = canvasRef.current;
    pushGameParticles((canvas?.width || 800) / 2, Math.max(90, (canvas?.height || 460) * 0.35), '#38bdf8', 24);
    playSound('word_clear');
    triggerGameToast('❄️ Đóng băng mục tiêu +8 giây!', true);
    setTimeout(() => {
      if (Date.now() >= freezeUntilRef.current - 50) {
        setIsFrozenBoost(false);
      }
    }, 4500);
  };

  const handleToggleGamePause = () => {
    const rt = gameRuntimeRef.current;
    if (rt.subState !== 'PLAYING' || !rt.isSandbox) return;
    if (!rt.paused) {
      pausedStartedAtRef.current = Date.now();
      rt.paused = true;
      setGamePaused(true);
      showToast('Đã tạm dừng màn demo để giảng giải từ vựng.', 'info');
    } else {
      if (pausedStartedAtRef.current > 0) {
        bonusTimeSecRef.current += (Date.now() - pausedStartedAtRef.current) / 1000;
        pausedStartedAtRef.current = 0;
      }
      rt.paused = false;
      setGamePaused(false);
    }
  };

  const handleToggleGameMute = () => {
    const nextMuted = !gameMuted;
    setGameMuted(nextMuted);
    if (typeof window !== 'undefined') {
      window.__lexiprepMuted = nextMuted;
      if (nextMuted && 'speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
    }
    showToast(nextMuted ? 'Đã tắt âm thanh hiệu ứng & giọng đọc.' : 'Đã bật lại âm thanh Game.', 'info');
  };

  // Per-Word Countdown Timer for Game Arena (Round 1, Round 2, Round 3)
  useEffect(() => {
    clearInterval(wordTimerRef.current);
    if (view !== 'GAME_ARENA' || gameSubState !== 'PLAYING' || !activeQuestion) return;

    const speedMode = gameRuntimeRef.current.speedMode || 'normal';
    const limit = getSpeedAdjustedTimeLimit(gameRound, speedMode);
    wordStartedAtRef.current = Date.now();
    bonusTimeSecRef.current = 0;
    pausedStartedAtRef.current = 0;
    timeRemainingFloatRef.current = limit;
    gameRuntimeRef.current.timeLimit = limit;
    gameRuntimeRef.current.questionResolved = false;

    wordTimerRef.current = setInterval(() => {
      const rt = gameRuntimeRef.current;
      if (rt.subState !== 'PLAYING' || rt.paused) return;
      const elapsedSec = (Date.now() - wordStartedAtRef.current) / 1000;
      const effectiveLimit = limit + bonusTimeSecRef.current;
      const remaining = Math.max(0, effectiveLimit - elapsedSec);
      timeRemainingFloatRef.current = remaining;
      setGameTimeLeft(Math.ceil(remaining));

      if (remaining <= 0 && !rt.questionResolved) {
        rt.questionResolved = true;
        clearInterval(wordTimerRef.current);
        const currentWord = rt.activeQuestion?.word || '';
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
      if (e.code === 'Digit2') {
        e.preventDefault();
        handleUseFreezePowerup();
        return;
      }
      if (rt.paused) return;
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
  }, [view, gameSubState, freezeCharges, gamePaused]);

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
      if (gameRuntimeRef.current.round === 1 && gameRuntimeRef.current.subState === 'PLAYING' && !gameRuntimeRef.current.paused) {
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
      const isFrozen = Date.now() < freezeUntilRef.current;

      // Keyboard ship steering for Round 1
      if (rt.round === 1 && rt.subState === 'PLAYING' && !rt.paused) {
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
        if (!rt.paused) {
          s.y += s.speed * (isFrozen ? 0.35 : 1);
          if (s.y > height) {
            s.y = 0;
            s.x = Math.random() * width;
          }
        }
        ctx.globalAlpha = 0.5;
        ctx.beginPath();
        ctx.arc(s.x, s.y, s.size, 0, Math.PI * 2);
        ctx.fill();
      });
      ctx.globalAlpha = 1;

      const limit = Math.max(1, rt.timeLimit || 25);
      const elapsedRatio = Math.min(1, Math.max(0, 1 - timeRemainingFloatRef.current / limit));

      // Subtle Danger Warning Line near ship when time <= 6s
      if (rt.subState === 'PLAYING' && timeRemainingFloatRef.current <= 6) {
        const dangerY = height - 82;
        ctx.save();
        ctx.strokeStyle = 'rgba(244, 63, 94, 0.45)';
        ctx.setLineDash([8, 8]);
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(20, dangerY);
        ctx.lineTo(width - 20, dangerY);
        ctx.stroke();
        ctx.restore();
      }

      // Bullets & Hit detection (Round 1)
      ctx.fillStyle = '#00f2fe';
      for (let i = bullets.length - 1; i >= 0; i--) {
        const b = bullets[i];
        if (!rt.paused) b.y -= b.speed;
        ctx.beginPath();
        ctx.roundRect(b.x - 3, b.y, 6, 16, 3);
        ctx.fill();

        let bulletRemoved = false;
        if (rt.round === 1 && rt.subState === 'PLAYING' && !rt.questionResolved && !rt.paused) {
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
                const feverMult = rt.combo >= 3 ? 2 : 1;
                const gain = (120 + rt.combo * 20) * feverMult;
                const nextCombo = rt.combo + 1;
                const nextScore = rt.score + gain;
                rt.score = nextScore;
                rt.combo = nextCombo;
                setGameScore(nextScore);
                setGameCombo(nextCombo);

                pushGameParticles(c.x, c.y, feverMult > 1 ? '#fbbf24' : '#22d3ee', 26);
                playSound('word_clear');
                speakWord(rt.activeQuestion.word);
                triggerGameToast(
                  `✅ Xuất sắc! ${rt.activeQuestion.word} (${rt.activeQuestion.ipa}) +${gain}đ${feverMult > 1 ? ' 🔥 FEVER x2!' : ''}`,
                  true
                );
                handleWordCleared(true, nextScore, nextCombo);
              } else {
                pushGameParticles(c.x, c.y, '#fb7185', 16);
                chickens.splice(j, 1);
                handleGameLifeLoss(
                  `❌ Bắn nhầm "${c.word}"! Hãy nhìn kỹ nghĩa tiếng Việt & bắn mục tiêu đúng!`,
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
        if (!rt.paused) hl.progress += 0.22;
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

      // Particle explosions & Freeze crystal sparks
      const particles = particlesRef.current;
      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        if (!rt.paused) {
          p.x += p.vx;
          p.y += p.vy;
          p.vx *= 0.96;
          p.vy *= 0.96;
          p.alpha -= 0.028;
        }
        if (p.alpha <= 0) {
          particles.splice(i, 1);
          continue;
        }
        ctx.save();
        ctx.globalAlpha = Math.max(0, p.alpha);
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }

      // Draw Chickens (Round 1) — smoothly descend with timer
      if (rt.round === 1 && rt.subState === 'PLAYING') {
        const topBaseY = Math.max(46, height * 0.14);
        const maxDescendY = Math.max(topBaseY + 20, height - 155);
        chickens.forEach(c => {
          if (!rt.paused) {
            c.wingPhase += isFrozen ? 0.03 : 0.1;
            c.x = c.baseX + Math.sin(c.wingPhase * 0.5) * c.swayRange;
          }
          c.y = topBaseY + c.rowOffset + elapsedRatio * (maxDescendY - topBaseY - c.rowOffset);

          ctx.save();
          ctx.translate(c.x, c.y);

          if (isFrozen) {
            ctx.strokeStyle = 'rgba(56, 189, 248, 0.7)';
            ctx.lineWidth = 2.5;
            ctx.beginPath();
            ctx.arc(0, 0, 26, 0, Math.PI * 2);
            ctx.stroke();
          }

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

        // Freeze crystal aura or Danger halo
        if (isFrozen) {
          ctx.strokeStyle = 'rgba(56, 189, 248, 0.85)';
          ctx.lineWidth = 3.5;
          ctx.beginPath();
          ctx.arc(0, 0, 44 + Math.sin(Date.now() * 0.015) * 3, 0, Math.PI * 2);
          ctx.stroke();
        } else if (timeRemainingFloatRef.current <= 6) {
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

      // Draw Player Spaceship with Crewmate cockpit visor & glowing thruster
      const shipX = rt.round === 1 ? playerX : width / 2;
      const crewPalette = CREWMATE_COLORS.find(c => c.id === rt.crewColorId);
      const hullColor = crewPalette ? crewPalette.fill : (rt.round === 1 ? '#00f2fe' : '#a855f7');
      ctx.save();
      ctx.translate(shipX, height - 34);

      // Animated Thruster Flame
      if (!rt.paused) {
        const flameLen = 14 + Math.random() * 8;
        ctx.fillStyle = rt.combo >= 3 ? '#fbbf24' : '#38bdf8';
        ctx.beginPath();
        ctx.moveTo(-6, 10);
        ctx.lineTo(0, 10 + flameLen);
        ctx.lineTo(6, 10);
        ctx.closePath();
        ctx.fill();
      }

      // Main Hull + Wings
      ctx.fillStyle = hullColor;
      ctx.strokeStyle = '#0f172a';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(0, -22);
      ctx.lineTo(20, 14);
      ctx.lineTo(0, 8);
      ctx.lineTo(-20, 14);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      // Crewmate Visor Cockpit
      ctx.fillStyle = '#bae6fd';
      ctx.beginPath();
      ctx.roundRect(-6, -9, 12, 8, 4);
      ctx.fill();
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.ellipse(-2, -6.5, 2.5, 1.2, 0, 0, Math.PI * 2);
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
    const isTeacher = currentUser?.role === 'teacher';

    return (
      <header className="bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl border-b border-slate-200/80 dark:border-slate-800/80 text-slate-800 dark:text-slate-100 sticky top-0 z-50 transition-colors">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
          {/* Logo & Brand */}
          <div
            className="flex items-center gap-3 cursor-pointer group shrink-0"
            onClick={() => setView(isTeacher ? 'TEACHER_DASHBOARD' : 'HOME')}
          >
            <div className="w-9 h-9 rounded-xl bg-indigo-600 dark:bg-indigo-500 flex items-center justify-center shadow-sm group-hover:scale-105 transition-transform">
              <GraduationCap className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-base tracking-tight text-slate-900 dark:text-white">
                  LexiPrep
                </span>
                <span className="text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-indigo-50 dark:bg-indigo-500/15 text-indigo-600 dark:text-indigo-300 border border-indigo-200/70 dark:border-indigo-500/30">
                  IELTS
                </span>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 hidden sm:block leading-none mt-0.5">
                Nền tảng Luyện thi & Khảo thí Chuẩn Quốc tế
              </p>
            </div>
          </div>

          {/* Center Segmented Nav */}
          <nav className="hidden md:flex items-center gap-1 bg-slate-100/90 dark:bg-slate-800/90 p-1 rounded-xl border border-slate-200/70 dark:border-slate-700/70 text-xs font-semibold">
            <button
              onClick={() => setView('HOME')}
              className={`px-3.5 py-1.5 rounded-lg transition flex items-center gap-1.5 ${
                view === 'HOME'
                  ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-300 shadow-sm'
                  : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <BookOpen className="w-3.5 h-3.5" />
              <span>Phòng Luyện Đề</span>
            </button>
            <button
              onClick={openStudentGamePortal}
              className={`px-3.5 py-1.5 rounded-lg transition flex items-center gap-1.5 ${
                view === 'GAME_ARENA'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Gamepad2 className="w-3.5 h-3.5" />
              <span>Game Từ Vựng</span>
            </button>
            <button
              onClick={() => {
                setSelectedProfileStudent(currentUser?.username);
                setView('STUDENT_PROFILE');
              }}
              className={`px-3.5 py-1.5 rounded-lg transition flex items-center gap-1.5 ${
                view === 'STUDENT_PROFILE'
                  ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-300 shadow-sm'
                  : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <UserCheck className="w-3.5 h-3.5" />
              <span>{isTeacher ? 'Hồ Sơ Học Viên' : 'Tiến Trình Của Tôi'}</span>
            </button>
            {isTeacher && (
              <button
                onClick={() => setView('TEACHER_DASHBOARD')}
                className={`px-3.5 py-1.5 rounded-lg transition flex items-center gap-1.5 ${
                  view === 'TEACHER_DASHBOARD' || view === 'EXAM_BUILDER'
                    ? 'bg-amber-500 text-white shadow-sm'
                    : 'text-amber-700 dark:text-amber-300 hover:bg-amber-500/10'
                }`}
              >
                <ShieldAlert className="w-3.5 h-3.5" />
                <span>Quản Trị Giáo Viên</span>
              </button>
            )}
          </nav>

          {/* Right Utility Controls */}
          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => setDarkMode(d => !d)}
              className="flex items-center gap-1.5 px-2.5 py-2 rounded-xl text-xs font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-200/80 dark:hover:bg-slate-700 transition border border-slate-200/80 dark:border-slate-700"
              title={darkMode ? 'Chuyển sang giao diện Sáng' : 'Chuyển sang giao diện Tối'}
              aria-label={darkMode ? 'Chế độ sáng' : 'Chế độ tối'}
            >
              {darkMode ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-indigo-600" />}
              <span className="hidden xl:inline">{darkMode ? 'Sáng' : 'Tối'}</span>
            </button>

            {/* AI Key config button strictly for Teacher */}
            {isTeacher && (
              <button
                onClick={() => {
                  setApiTestState({ testing: false, ok: null, message: '', model: '' });
                  setShowApiKeyModal(true);
                }}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-200/80 dark:hover:bg-slate-700 transition border border-slate-200/80 dark:border-slate-700"
                title="Cấu hình Google Gemini API Key"
              >
                <Key className="w-3.5 h-3.5 text-amber-500" />
                <span className="hidden lg:inline">Gemini Key</span>
                <span className={`w-2 h-2 rounded-full ${aiApiKey?.trim() ? 'bg-emerald-500' : 'bg-slate-400'}`} />
              </button>
            )}

            <div className="flex items-center gap-1.5">
              <div
                onClick={() => {
                  setSelectedProfileStudent(currentUser?.username);
                  setView('STUDENT_PROFILE');
                }}
                className="flex items-center gap-2.5 pl-1.5 pr-3 py-1 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer transition border border-transparent hover:border-slate-200 dark:hover:border-slate-700"
                title="Xem hồ sơ học tập"
              >
                <UserAvatarBadge user={currentUser} sizeClass="w-8 h-8" textClass="text-xs" rounded="rounded-lg" />
                <div className="text-left text-xs hidden sm:block">
                  <p className="font-bold text-slate-800 dark:text-slate-100 leading-tight truncate max-w-[130px]">{currentUser?.name}</p>
                  <p className="text-[10px] font-medium text-slate-500 dark:text-slate-400">
                    {isTeacher ? 'Giáo viên' : 'Học viên'}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowAvatarModal(true)}
                className="p-2 rounded-xl text-slate-500 dark:text-slate-400 hover:bg-indigo-50 dark:hover:bg-indigo-500/15 hover:text-indigo-600 dark:hover:text-indigo-300 transition border border-slate-200/70 dark:border-slate-700/70"
                title="Cài đặt ảnh đại diện & đầu nhân vật Game"
              >
                <Camera className="w-4 h-4" />
              </button>
            </div>

            <button
              onClick={handleLogout}
              className="p-2 rounded-xl text-slate-500 dark:text-slate-400 hover:bg-rose-50 dark:hover:bg-rose-500/15 hover:text-rose-600 dark:hover:text-rose-400 transition"
              title="Đăng xuất"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Mobile Quick Nav Strip */}
        <div className="md:hidden border-t border-slate-200/70 dark:border-slate-800 px-3 py-2 flex items-center gap-1.5 overflow-x-auto text-xs font-semibold">
          <button
            onClick={() => setView('HOME')}
            className={`px-3 py-1.5 rounded-lg whitespace-nowrap transition flex items-center gap-1.5 ${
              view === 'HOME'
                ? 'bg-indigo-600 text-white'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
            }`}
          >
            <BookOpen className="w-3.5 h-3.5" /> Luyện Đề
          </button>
          <button
            onClick={openStudentGamePortal}
            className={`px-3 py-1.5 rounded-lg whitespace-nowrap transition flex items-center gap-1.5 ${
              view === 'GAME_ARENA'
                ? 'bg-indigo-600 text-white'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
            }`}
          >
            <Gamepad2 className="w-3.5 h-3.5" /> Game Từ Vựng
          </button>
          <button
            onClick={() => {
              setSelectedProfileStudent(currentUser?.username);
              setView('STUDENT_PROFILE');
            }}
            className={`px-3 py-1.5 rounded-lg whitespace-nowrap transition flex items-center gap-1.5 ${
              view === 'STUDENT_PROFILE'
                ? 'bg-indigo-600 text-white'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
            }`}
          >
            <UserCheck className="w-3.5 h-3.5" /> Tiến Trình
          </button>
          {isTeacher && (
            <button
              onClick={() => setView('TEACHER_DASHBOARD')}
              className={`px-3 py-1.5 rounded-lg whitespace-nowrap transition flex items-center gap-1.5 ${
                view === 'TEACHER_DASHBOARD' || view === 'EXAM_BUILDER'
                  ? 'bg-amber-500 text-white'
                  : 'bg-amber-50 dark:bg-amber-500/15 text-amber-700 dark:text-amber-300'
              }`}
            >
              <ShieldAlert className="w-3.5 h-3.5" /> Giáo Viên
            </button>
          )}
        </div>
      </header>
    );
  };

  // ==========================================
  // RENDER AUTH SCREEN (MODERN EDTECH PORTAL)
  // ==========================================
  const renderAuthScreen = () => (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col justify-between p-4 sm:p-8 select-none transition-colors">
      {/* Top Bar */}
      <div className="max-w-6xl w-full mx-auto flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-indigo-600 flex items-center justify-center shadow-sm">
            <GraduationCap className="w-5 h-5 text-white" />
          </div>
          <span className="font-extrabold text-lg tracking-tight text-slate-900 dark:text-white">LexiPrep Academy</span>
        </div>
        <button
          type="button"
          onClick={() => setDarkMode(d => !d)}
          className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 transition shadow-sm"
          title={darkMode ? 'Chuyển sang giao diện Sáng' : 'Chuyển sang giao diện Tối'}
        >
          {darkMode ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-indigo-600" />}
          <span>{darkMode ? 'Giao diện Sáng' : 'Giao diện Tối'}</span>
        </button>
      </div>

      {/* Main Centered Split Card */}
      <div className="max-w-5xl w-full mx-auto my-auto py-6">
        <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-xl shadow-slate-200/60 dark:shadow-black/40 border border-slate-200/80 dark:border-slate-800 overflow-hidden grid grid-cols-1 lg:grid-cols-12">
          {/* Left Educational Intro */}
          <div className="lg:col-span-6 bg-slate-900 dark:bg-slate-950 text-white p-8 sm:p-11 flex flex-col justify-between relative overflow-hidden border-b lg:border-b-0 lg:border-r border-slate-800">
            <div className="absolute -top-24 -right-24 w-64 h-64 bg-indigo-600/20 rounded-full blur-3xl pointer-events-none" />
            <div className="relative z-10">
              <div className="inline-flex items-center gap-2 bg-indigo-500/15 border border-indigo-400/30 px-3 py-1 rounded-full text-xs font-semibold text-indigo-300 mb-6">
                <Award className="w-3.5 h-3.5" /> Hệ thống Khảo thí IELTS trên Máy tính
              </div>

              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight leading-snug mb-4">
                Luyện thi chuẩn quốc tế, theo dõi lộ trình tăng Band mỗi ngày.
              </h1>

              <p className="text-slate-400 text-sm leading-relaxed mb-8">
                Môi trường làm bài thi thử tách đôi màn hình mượt mà như phòng thi thật, kèm kho từ vựng tương tác theo lớp học.
              </p>

              <div className="space-y-4">
                <div className="flex items-start gap-3.5">
                  <div className="w-9 h-9 rounded-xl bg-blue-500/15 text-blue-300 flex items-center justify-center shrink-0 border border-blue-500/20">
                    <Headphones className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="font-bold text-sm text-white">Thi thử Listening, Reading & Writing</h3>
                    <p className="text-xs text-slate-400 mt-0.5 leading-relaxed">
                      Highlight trực tiếp trên đoạn văn, giới hạn lượt nghe và bộ đếm từ tự động.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3.5">
                  <div className="w-9 h-9 rounded-xl bg-emerald-500/15 text-emerald-300 flex items-center justify-center shrink-0 border border-emerald-500/20">
                    <TrendingUp className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="font-bold text-sm text-white">Biểu đồ tiến trình & nhận xét chi tiết</h3>
                    <p className="text-xs text-slate-400 mt-0.5 leading-relaxed">
                      Lưu lịch sử làm bài theo từng kỹ năng và phản hồi sát sao từ giáo viên.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3.5">
                  <div className="w-9 h-9 rounded-xl bg-indigo-500/15 text-indigo-300 flex items-center justify-center shrink-0 border border-indigo-500/20">
                    <Gamepad2 className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="font-bold text-sm text-white">Đấu trường Từ Vựng theo phòng lớp</h3>
                    <p className="text-xs text-slate-400 mt-0.5 leading-relaxed">
                      Vào sảnh chờ trực tiếp cùng giáo viên và bạn học qua mã PIN phòng đấu.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-8 pt-5 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400 relative z-10">
              <span className="flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-emerald-400" /> Chế độ thi bảo mật
              </span>
              <span>Cambridge / IDP Format</span>
            </div>
          </div>

          {/* Right Form Panel */}
          <div className="lg:col-span-6 p-8 sm:p-11 flex flex-col justify-between">
            <div>
              <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white">
                {authMode === 'login' ? 'Đăng nhập tài khoản' : 'Tạo tài khoản học viên'}
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 mb-6">
                {authMode === 'login'
                  ? 'Sử dụng tài khoản học viên hoặc giáo viên để tiếp tục.'
                  : 'Đăng ký nhanh để bắt đầu làm bài thi thử và tham gia lớp học.'}
              </p>

              {/* Auth Mode Toggle */}
              <div className="grid grid-cols-2 gap-1 p-1 bg-slate-100 dark:bg-slate-800 rounded-xl text-xs font-bold mb-6">
                <button
                  type="button"
                  onClick={() => { setAuthMode('login'); setAuthError(''); }}
                  className={`py-2 rounded-lg transition ${
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
                  className={`py-2 rounded-lg transition ${
                    authMode === 'register'
                      ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-300 shadow-sm'
                      : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
                  }`}
                >
                  Đăng Ký Mới
                </button>
              </div>

              {authError && (
                <div className="p-3 bg-rose-50 dark:bg-rose-500/15 border border-rose-200 dark:border-rose-500/30 rounded-xl text-xs text-rose-700 dark:text-rose-300 mb-4 flex items-center gap-2 font-medium">
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                  <span>{authError}</span>
                </div>
              )}

              <form onSubmit={handleAuthSubmit} className="space-y-4">
                {authMode === 'register' && (
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Họ và tên</label>
                    <input
                      type="text"
                      required
                      placeholder="VD: Nguyễn Minh Anh"
                      value={authForm.fullName}
                      onChange={e => setAuthForm({ ...authForm, fullName: e.target.value })}
                      className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800/80 border border-slate-300 dark:border-slate-700 rounded-xl text-sm text-slate-900 dark:text-slate-100 focus:bg-white dark:focus:bg-slate-800 focus:ring-2 focus:ring-indigo-500 focus:outline-none transition"
                    />
                  </div>
                )}

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Tên đăng nhập</label>
                  <input
                    type="text"
                    required
                    placeholder="Nhập username..."
                    value={authForm.username}
                    onChange={e => setAuthForm({ ...authForm, username: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800/80 border border-slate-300 dark:border-slate-700 rounded-xl text-sm text-slate-900 dark:text-slate-100 focus:bg-white dark:focus:bg-slate-800 focus:ring-2 focus:ring-indigo-500 focus:outline-none transition"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Mật khẩu</label>
                  <div className="relative">
                    <input
                      type={showAuthPass ? 'text' : 'password'}
                      required
                      placeholder="Nhập mật khẩu..."
                      value={authForm.password}
                      onChange={e => setAuthForm({ ...authForm, password: e.target.value })}
                      className="w-full pl-3.5 pr-10 py-2.5 bg-slate-50 dark:bg-slate-800/80 border border-slate-300 dark:border-slate-700 rounded-xl text-sm text-slate-900 dark:text-slate-100 focus:bg-white dark:focus:bg-slate-800 focus:ring-2 focus:ring-indigo-500 focus:outline-none transition"
                    />
                    <button
                      type="button"
                      onClick={() => setShowAuthPass(v => !v)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                      tabIndex={-1}
                    >
                      {showAuthPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 rounded-xl transition shadow-sm flex items-center justify-center gap-2 text-sm mt-2"
                >
                  <span>{authMode === 'login' ? 'Đăng Nhập' : 'Tạo Tài Khoản'}</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </form>
            </div>

            <div className="mt-7 pt-5 border-t border-slate-200/80 dark:border-slate-800">
              <p className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 mb-2.5">Tài khoản dùng thử nhanh:</p>
              <div className="grid grid-cols-2 gap-2.5">
                <button
                  type="button"
                  onClick={() => {
                    setAuthMode('login');
                    setAuthForm({ username: 'hocsinh_01', password: '123456', fullName: '' });
                  }}
                  className="px-3 py-2 bg-slate-50 dark:bg-slate-800/80 hover:bg-indigo-50 dark:hover:bg-indigo-500/15 border border-slate-200 dark:border-slate-700 rounded-xl transition text-left"
                >
                  <span className="block text-xs font-bold text-slate-800 dark:text-slate-100">Học viên mẫu</span>
                  <span className="font-mono text-[10px] text-slate-500 dark:text-slate-400">hocsinh_01 / 123456</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setAuthMode('login');
                    setAuthForm({ username: 'teacher_ielts', password: '123456', fullName: '' });
                  }}
                  className="px-3 py-2 bg-slate-50 dark:bg-slate-800/80 hover:bg-amber-50 dark:hover:bg-amber-500/15 border border-slate-200 dark:border-slate-700 rounded-xl transition text-left"
                >
                  <span className="block text-xs font-bold text-slate-800 dark:text-slate-100">Giáo viên</span>
                  <span className="font-mono text-[10px] text-slate-500 dark:text-slate-400">teacher_ielts / 123456</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <p className="text-center text-xs text-slate-500 dark:text-slate-400">
        LexiPrep Academy • Hệ thống Luyện thi IELTS • 2026
      </p>
    </div>
  );

  // ==========================================
  // RENDER STUDENT HOME PAGE (CLEAN EDTECH DASHBOARD)
  // ==========================================
  const renderStudentHome = () => {
    const visibleTests = tests.filter(t => normalizeExamConfig(t).visibility !== 'private');
    const studentAttempts = attempts.filter(a => a.studentId === currentUser?.username || a.studentUsername === currentUser?.username);
    const gradedBands = studentAttempts.map(a => a.overallBand).filter(b => typeof b === 'number' && b > 0);
    const bestOverallBand = gradedBands.length > 0 ? Math.max(...gradedBands) : null;

    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-8">
        {/* Clean Modern Hero Banner */}
        <div className="bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 rounded-3xl p-6 sm:p-9 text-white border border-slate-800 shadow-lg relative overflow-hidden">
          <div className="absolute -right-12 -top-12 w-64 h-64 bg-indigo-500/20 rounded-full blur-3xl pointer-events-none" />
          <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            <div className="max-w-2xl">
              <div className="inline-flex items-center gap-1.5 bg-white/10 text-indigo-200 border border-white/15 px-3 py-1 rounded-full text-xs font-semibold mb-3">
                <BookOpen className="w-3.5 h-3.5" /> Không gian học tập cá nhân
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
                Chào {currentUser?.name || 'Học viên'}, sẵn sàng luyện đề hôm nay?
              </h1>
              <p className="text-slate-300 text-sm leading-relaxed mt-2">
                Trải nghiệm phòng thi Computer-Delivered IELTS chuẩn quốc tế với chia đôi màn hình đọc hiểu, ghi chú highlight và theo dõi kết quả từ giáo viên.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3 shrink-0">
              {visibleTests.length > 0 && (
                <button
                  onClick={() => startExam(visibleTests[0].id)}
                  className="bg-indigo-500 hover:bg-indigo-400 text-white font-bold text-xs sm:text-sm px-5 py-3 rounded-xl shadow-md transition flex items-center gap-2"
                >
                  <Play className="w-4 h-4 fill-white" /> Làm Đề Thi Thử
                </button>
              )}
              <button
                onClick={openStudentGamePortal}
                className="bg-white/10 hover:bg-white/20 text-white border border-white/20 font-bold text-xs sm:text-sm px-5 py-3 rounded-xl transition flex items-center gap-2 backdrop-blur"
              >
                <Gamepad2 className="w-4 h-4 text-cyan-300" /> Vào Phòng Game Từ Vựng
              </button>
            </div>
          </div>
        </div>

        {/* Clean 4-Card Learning Metrics (No Room PIN / No Self-AI clutter) */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200/80 dark:border-slate-800 shadow-sm flex items-center gap-4">
            <div className="w-11 h-11 rounded-xl bg-indigo-50 dark:bg-indigo-500/15 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Đề thi khả dụng</p>
              <p className="text-2xl font-extrabold text-slate-900 dark:text-white tabular-nums">{visibleTests.length}</p>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200/80 dark:border-slate-800 shadow-sm flex items-center gap-4">
            <div className="w-11 h-11 rounded-xl bg-blue-50 dark:bg-blue-500/15 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Bài thi đã nộp</p>
              <p className="text-2xl font-extrabold text-slate-900 dark:text-white tabular-nums">{studentAttempts.length}</p>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200/80 dark:border-slate-800 shadow-sm flex items-center gap-4">
            <div className="w-11 h-11 rounded-xl bg-emerald-50 dark:bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
              <Award className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Band cao nhất</p>
              <p className="text-2xl font-extrabold text-emerald-600 dark:text-emerald-400 tabular-nums">
                {bestOverallBand !== null ? bestOverallBand : '--'}
              </p>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200/80 dark:border-slate-800 shadow-sm flex items-center justify-between gap-3">
            <div className="flex items-center gap-4 min-w-0">
              <div className="w-11 h-11 rounded-xl bg-amber-50 dark:bg-amber-500/15 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
                <Target className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Mục tiêu Band</p>
                <p className="text-2xl font-extrabold text-slate-900 dark:text-white tabular-nums">{currentUser?.targetBand || '8.0'}</p>
                {currentUser?.studyGoal && (
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate max-w-[140px]" title={currentUser.studyGoal}>
                    {currentUser.studyGoal}
                  </p>
                )}
              </div>
            </div>
            {currentUser && (
              <button
                onClick={() =>
                  setEditingTargetUser({
                    username: currentUser.username,
                    name: currentUser.name || '',
                    targetBand: currentUser.targetBand || 7.5,
                    studyGoal: currentUser.studyGoal || ''
                  })
                }
                title="Chỉnh sửa mục tiêu Band"
                className="p-2 rounded-xl bg-amber-50 dark:bg-amber-500/15 hover:bg-amber-100 dark:hover:bg-amber-500/25 text-amber-700 dark:text-amber-300 transition shrink-0"
              >
                <Edit className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* Available Mock Tests */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-lg font-extrabold text-slate-900 dark:text-white">Bộ Đề Thi Thử IELTS</h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Chọn một đề thi công khai để bắt đầu làm bài theo chuẩn thời gian từng kỹ năng</p>
            </div>
          </div>

          {visibleTests.length === 0 ? (
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-dashed border-slate-300 dark:border-slate-700 p-10 text-center text-slate-500 dark:text-slate-400 text-sm">
              Hiện chưa có đề thi công khai nào. Giáo viên sẽ mở đề khi bắt đầu buổi kiểm tra.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {visibleTests.map(test => {
                const cfg = normalizeExamConfig(test);
                const myUsedCount = studentAttempts.filter(a => a.testId === test.id).length;
                const isExhausted = cfg.maxAttempts > 0 && myUsedCount >= cfg.maxAttempts;
                const skillShort = { listening: 'L', reading: 'R', writing: 'W' };
                const totalMins = cfg.order.reduce((sum, s) => sum + (cfg.durations[s] || 0), 0);

                return (
                  <div
                    key={test.id}
                    className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-6 flex flex-col justify-between hover:shadow-md hover:border-indigo-300 dark:hover:border-indigo-500/50 transition-all"
                  >
                    <div>
                      <div className="flex flex-wrap justify-between items-center gap-2 mb-3">
                        <span className="bg-indigo-50 dark:bg-indigo-500/15 text-indigo-700 dark:text-indigo-300 text-[11px] font-bold px-2.5 py-1 rounded-lg">
                          IELTS Academic • {totalMins}p
                        </span>
                        <span
                          className={`text-[11px] font-bold px-2.5 py-1 rounded-lg ${
                            cfg.maxAttempts === 0
                              ? 'bg-emerald-50 dark:bg-emerald-500/15 text-emerald-700 dark:text-emerald-300'
                              : isExhausted
                              ? 'bg-rose-50 dark:bg-rose-500/15 text-rose-700 dark:text-rose-300'
                              : 'bg-amber-50 dark:bg-amber-500/15 text-amber-700 dark:text-amber-300'
                          }`}
                        >
                          {cfg.maxAttempts === 0
                            ? `Không giới hạn (${myUsedCount} lượt)`
                            : `Giới hạn ${myUsedCount}/${cfg.maxAttempts} lượt`}
                        </span>
                      </div>
                      <h3 className="font-bold text-slate-900 dark:text-white text-base mb-1.5 leading-snug">{test.title}</h3>
                      <p className="text-slate-500 dark:text-slate-400 text-xs mb-4 line-clamp-2 leading-relaxed">{test.description}</p>

                      <div className="grid grid-cols-3 gap-2 py-3 border-y border-slate-100 dark:border-slate-800 text-xs mb-3 text-center">
                        <div>
                          <p className="text-[11px] text-slate-400 font-medium">Listening ({cfg.durations.listening}p)</p>
                          <p className="font-bold text-slate-800 dark:text-slate-100 mt-0.5">{test.listening?.questions?.length || 0} câu</p>
                        </div>
                        <div className="border-x border-slate-100 dark:border-slate-800">
                          <p className="text-[11px] text-slate-400 font-medium">Reading ({cfg.durations.reading}p)</p>
                          <p className="font-bold text-slate-800 dark:text-slate-100 mt-0.5">{test.reading?.questions?.length || 0} câu</p>
                        </div>
                        <div>
                          <p className="text-[11px] text-slate-400 font-medium">Writing ({cfg.durations.writing}p)</p>
                          <p className="font-bold text-slate-800 dark:text-slate-100 mt-0.5">2 Tasks</p>
                        </div>
                      </div>

                      <div className="text-[11px] text-slate-500 dark:text-slate-400 mb-4 flex items-center justify-between gap-2">
                        <span>Thứ tự: {cfg.order.map(s => skillShort[s]).join(' → ')}</span>
                        {cfg.sequentialMode && (
                          <span className="inline-flex items-center gap-1 text-indigo-600 dark:text-indigo-400 font-semibold">
                            <Lock className="w-3 h-3" /> Tuần tự
                          </span>
                        )}
                      </div>
                    </div>

                    <button
                      onClick={() => startExam(test.id)}
                      disabled={isExhausted}
                      className={`w-full font-bold py-2.5 rounded-xl text-xs transition flex items-center justify-center gap-2 shadow-sm ${
                        isExhausted
                          ? 'bg-slate-200 dark:bg-slate-800 text-slate-500 dark:text-slate-400 cursor-not-allowed'
                          : 'bg-indigo-600 hover:bg-indigo-700 text-white'
                      }`}
                    >
                      {isExhausted ? (
                        <>
                          <Lock className="w-3.5 h-3.5" />
                          <span>Đã hết lượt làm bài ({myUsedCount}/{cfg.maxAttempts})</span>
                        </>
                      ) : (
                        <>
                          <Play className="w-3.5 h-3.5 fill-white" />
                          <span>{myUsedCount > 0 ? 'Làm Lại Đề Thi' : 'Bắt Đầu Làm Bài'}</span>
                        </>
                      )}
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Clean Student Attempt History */}
        <div>
          <div className="flex items-center justify-between mb-4 gap-3 flex-wrap">
            <div>
              <h2 className="text-lg font-extrabold text-slate-900 dark:text-white">Lịch Sử Làm Bài</h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Theo dõi các bài thi bạn đã hoàn thành</p>
            </div>
            <button
              onClick={() => {
                setSelectedProfileStudent(currentUser?.username);
                setView('STUDENT_PROFILE');
              }}
              className="text-xs font-bold text-indigo-600 dark:text-indigo-300 hover:bg-indigo-50 dark:hover:bg-indigo-500/15 flex items-center gap-1.5 transition px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900"
            >
              <TrendingUp className="w-4 h-4" /> Xem Hồ Sơ & Biểu Đồ Tiến Độ
            </button>
          </div>

          {studentAttempts.length === 0 ? (
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-10 text-center text-slate-500 dark:text-slate-400 text-sm">
              Bạn chưa hoàn thành bài thi nào. Hãy chọn một đề thi ở phía trên để bắt đầu!
            </div>
          ) : (
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm text-slate-600 dark:text-slate-300">
                  <thead className="bg-slate-50 dark:bg-slate-800/70 border-b border-slate-200 dark:border-slate-800 text-xs text-slate-500 dark:text-slate-400 font-semibold">
                    <tr>
                      <th className="px-6 py-3.5">Tên Đề Thi</th>
                      <th className="px-6 py-3.5">Thời Gian Nộp</th>
                      <th className="px-6 py-3.5 text-center">Listening</th>
                      <th className="px-6 py-3.5 text-center">Reading</th>
                      <th className="px-6 py-3.5 text-center">Writing</th>
                      <th className="px-6 py-3.5 text-center">Overall</th>
                      <th className="px-6 py-3.5 text-right">Chi Tiết</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {studentAttempts.map(att => (
                      <tr key={att.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition">
                        <td className="px-6 py-4 font-bold text-slate-900 dark:text-white">{att.testTitle}</td>
                        <td className="px-6 py-4 text-xs text-slate-500 dark:text-slate-400">{att.submittedAt}</td>
                        <td className="px-6 py-4 text-center font-bold text-slate-800 dark:text-slate-100 tabular-nums">
                          {att.scores.listening.band !== null ? att.scores.listening.band : '-'}
                        </td>
                        <td className="px-6 py-4 text-center font-bold text-slate-800 dark:text-slate-100 tabular-nums">
                          {att.scores.reading.band !== null ? att.scores.reading.band : '-'}
                        </td>
                        <td className="px-6 py-4 text-center">
                          {att.teacherGraded ? (
                            <span className="font-bold text-slate-800 dark:text-slate-100 tabular-nums">
                              {att.scores.writing.overallBand}
                            </span>
                          ) : (
                            <span className="text-xs bg-amber-50 dark:bg-amber-500/15 text-amber-700 dark:text-amber-300 px-2.5 py-0.5 rounded-full font-semibold">Chờ chấm</span>
                          )}
                        </td>
                        <td className="px-6 py-4 text-center">
                          {att.overallBand ? (
                            <span className="text-sm font-extrabold text-indigo-600 dark:text-indigo-300 bg-indigo-50 dark:bg-indigo-500/15 px-2.5 py-1 rounded-lg tabular-nums">
                              {att.overallBand}
                            </span>
                          ) : (
                            <span className="text-xs text-slate-400">Chờ chấm</span>
                          )}
                        </td>
                        <td className="px-6 py-4 text-right">
                          <button
                            onClick={() => {
                              setSelectedAttemptId(att.id);
                              setPreviousView('HOME');
                              setView('RESULT_VIEW');
                            }}
                            className="bg-slate-100 dark:bg-slate-800 hover:bg-indigo-600 hover:text-white dark:hover:bg-indigo-600 text-slate-700 dark:text-slate-200 text-xs px-3.5 py-1.5 rounded-lg font-semibold transition"
                          >
                            Xem Bài Làm
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
  // RENDER GAME ARENA VIEW (AMONG US LOBBY + 3-ROUND SPACE ARENA)
  // ==========================================
  const renderGameArena = () => {
    const isTeacher = currentUser?.role === 'teacher';
    const activePin = joinedRoomPin || currentRoomPin;
    const room = normalizeRoomObject(roomsDb[activePin], activePin);
    const allRoomsList = Object.values(roomsDb || {}).map(r => normalizeRoomObject(r, r.pin));
    const roomChatMessages = Array.isArray(room.chatMessages) ? room.chatMessages : [];
    const leaderboardPlayers = Object.values(room.players || {}).sort((a, b) => b.score - a.score);
    const lobbyPlayersList = Object.values(room.lobbyPlayers || {}).sort((a, b) => {
      if (a.role === 'teacher' && b.role !== 'teacher') return -1;
      if (b.role === 'teacher' && a.role !== 'teacher') return 1;
      return (a.joinedAt || 0) - (b.joinedAt || 0);
    });
    const myLobbyEntry = currentUser?.username ? room.lobbyPlayers?.[currentUser.username] : null;
    const roomVocabCount = parseRawVocabText(room.rawVocab || DEFAULT_VOCAB_TEXT).length;
    const readyCount = lobbyPlayersList.filter(p => p.ready || p.role === 'teacher').length;
    const studentLobbyPlayers = lobbyPlayersList.filter(p => p.role !== 'teacher');
    const hasStudentsInLobby = studentLobbyPlayers.length > 0;
    const activeCrewColorId = myLobbyEntry?.colorId || myCrewColor;
    const myAvatarUrl = currentUser?.avatarUrl || '';
    const timePct = Math.max(0, Math.min(100, (gameTimeLeft / Math.max(1, gameTimeLimit)) * 100));
    const isLowTime = gameTimeLeft <= 5;
    const isMidTime = gameTimeLeft <= 10 && gameTimeLeft > 5;

    const exitGame = () => {
      clearTimeout(autoNextTimerRef.current);
      clearInterval(wordTimerRef.current);
      clearInterval(lobbyCountdownTimerRef.current);
      setLobbyCountdown(null);
      setView(isTeacher ? 'TEACHER_DASHBOARD' : 'HOME');
    };

    const renderCrewColorPicker = (compact = false) => {
      const swatchSize = compact ? 'w-5 h-5' : 'w-7 h-7';
      const applyColor = (colorId) => {
        if (gameSubState === 'JOIN') {
          setMyCrewColor(colorId);
        } else {
          handleChangeCrewColor(colorId);
        }
      };

      return (
        <div className="flex items-center justify-center gap-2 flex-wrap">
          {CREWMATE_COLORS.map(c => (
            <button
              key={c.id}
              type="button"
              onClick={() => applyColor(c.id)}
              className={`${swatchSize} rounded-full border-2 transition ${
                activeCrewColorId === c.id ? 'border-white scale-115 shadow-lg' : 'border-slate-700 opacity-75 hover:opacity-100'
              }`}
              style={{ backgroundColor: c.fill }}
              title={c.label}
            />
          ))}
          {myAvatarUrl ? (
            <div className="flex items-center gap-1.5 pl-1 border-l border-slate-700/80">
              <button
                type="button"
                onClick={() => applyColor('avatar')}
                className={`${compact ? 'w-6 h-6' : 'w-8 h-8'} rounded-full overflow-hidden border-2 transition bg-slate-800 ${
                  activeCrewColorId === 'avatar'
                    ? 'border-cyan-300 ring-2 ring-cyan-400/60 scale-115 shadow-lg'
                    : 'border-slate-600 opacity-85 hover:opacity-100'
                }`}
                title="Dùng Ảnh Avatar trên đầu nhân vật"
              >
                <img src={myAvatarUrl} alt="Avatar" className="w-full h-full object-cover" />
              </button>
              <button
                type="button"
                onClick={() => setShowAvatarModal(true)}
                className="px-2 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-[10px] font-bold text-cyan-300 transition flex items-center gap-1"
                title="Đổi ảnh Avatar khuôn mặt"
              >
                <Camera className="w-3 h-3" /> Đổi ảnh
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setShowAvatarModal(true)}
              className="ml-1 px-2.5 py-1 rounded-full border border-dashed border-cyan-500/60 bg-cyan-500/10 hover:bg-cyan-500/20 text-[10px] font-bold text-cyan-300 transition flex items-center gap-1"
              title="Tải ảnh khuôn mặt để gắn lên đầu nhân vật"
            >
              <Camera className="w-3 h-3" /> + Avatar
            </button>
          )}
        </div>
      );
    };

    const renderLobbyChatPanel = (heightClass = 'h-[270px] lg:h-[360px]', titleLabel = 'Chat Phòng Chờ') => (
      <div className={`lg:col-span-5 xl:col-span-4 bg-slate-900/85 border border-slate-700/80 rounded-3xl p-4 flex flex-col ${heightClass} shadow-xl backdrop-blur-md`}>
        <div className="flex items-center justify-between pb-2.5 border-b border-slate-800 mb-2.5 shrink-0">
          <span className="text-xs font-extrabold text-white flex items-center gap-2">
            <MessageSquare className="w-4 h-4 text-cyan-400" /> {titleLabel}
          </span>
          <span className="text-[11px] font-semibold text-slate-400">
            {roomChatMessages.length} tin nhắn
          </span>
        </div>

        <div ref={chatScrollRef} className="flex-1 min-h-0 overflow-y-auto space-y-2.5 pr-1">
          {roomChatMessages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center text-slate-500 text-xs px-3">
              <MessageSquare className="w-7 h-7 mb-1.5 opacity-40" />
              <p>Chưa có tin nhắn nào. Hãy nhắn chào cả phòng hoặc chọn câu chat nhanh bên dưới!</p>
            </div>
          ) : (
            roomChatMessages.map(msg => {
              const isMine = msg.username === currentUser?.username;
              const swatch = CREWMATE_COLORS.find(c => c.id === msg.colorId)?.fill || '#06b6d4';
              const msgAvatar = msg.avatarUrl || usersDb[msg.username]?.avatarUrl || '';
              return (
                <div key={msg.id} className={`flex flex-col ${isMine ? 'items-end' : 'items-start'}`}>
                  <div className="flex items-center gap-1.5 mb-0.5 text-[10px] text-slate-400">
                    {msgAvatar ? (
                      <img src={msgAvatar} alt="" className="w-4 h-4 rounded-full object-cover border border-slate-600 shrink-0" />
                    ) : (
                      <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: swatch }} />
                    )}
                    <span className="font-bold text-slate-200">{msg.name}</span>
                    {msg.role === 'teacher' && <Crown className="w-3 h-3 text-amber-400" />}
                    <span>• {msg.timeStr}</span>
                  </div>
                  <div className={`px-3 py-1.5 rounded-2xl text-xs max-w-[88%] break-words ${
                    isMine
                      ? 'bg-cyan-600/30 border border-cyan-500/40 text-cyan-100 rounded-tr-sm'
                      : 'bg-slate-800 border border-slate-700 text-slate-100 rounded-tl-sm'
                  }`}>
                    {msg.text}
                  </div>
                </div>
              );
            })
          )}
        </div>

        <div className="pt-2.5 mt-2 border-t border-slate-800 space-y-2 shrink-0">
          <div className="flex items-center gap-1.5 flex-wrap">
            {['Sẵn sàng!', 'Bắt đầu thôi!', 'Cố lên cả lớp!'].map(q => (
              <button
                key={q}
                type="button"
                onClick={() => handleSendLobbyChat(q)}
                className="px-2 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-[10px] font-semibold text-slate-300 transition"
              >
                {q}
              </button>
            ))}
          </div>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (!lobbyChatInput.trim()) return;
              handleSendLobbyChat(lobbyChatInput);
              setLobbyChatInput('');
            }}
            className="flex gap-2"
          >
            <input
              type="text"
              value={lobbyChatInput}
              onChange={e => setLobbyChatInput(e.target.value)}
              placeholder="Nhập tin nhắn chat..."
              maxLength={140}
              className="flex-1 px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white placeholder:text-slate-500 focus:ring-2 focus:ring-cyan-500 focus:outline-none"
            />
            <button
              type="submit"
              className="px-3 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold transition flex items-center gap-1 shrink-0"
            >
              <Send className="w-3.5 h-3.5" /> Gửi
            </button>
          </form>
        </div>
      </div>
    );

    // 1. JOIN ROOM SCREEN (Students must enter Teacher's Room PIN & Password)
    if (gameSubState === 'JOIN' && !isTeacher) {
      return (
        <div className="min-h-screen bg-[#070b14] text-white flex flex-col justify-between p-4 sm:p-6 relative overflow-hidden">
          <div className="absolute top-[-10%] left-[20%] w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute bottom-[-10%] right-[15%] w-96 h-96 bg-indigo-500/15 rounded-full blur-3xl pointer-events-none" />

          <div className="max-w-5xl w-full mx-auto flex items-center justify-between relative z-10">
            <button
              onClick={exitGame}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-900/90 hover:bg-slate-800 border border-slate-800 text-xs font-bold text-slate-200 transition"
            >
              <ChevronLeft className="w-4 h-4" /> Quay lại
            </button>
            <div className="flex items-center gap-2 text-xs">
              <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full font-bold border ${
                serverSyncConnected
                  ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'
                  : 'bg-amber-500/15 text-amber-300 border-amber-500/30'
              }`}>
                <Wifi className="w-3.5 h-3.5" />
                {serverSyncConnected ? 'Đã đồng bộ Live' : 'Local Mode'}
              </span>
              <span className="hidden sm:inline-flex text-slate-400 font-medium items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-cyan-400" /> Xác thực phòng thi đấu trực tiếp
              </span>
            </div>
          </div>

          <div className="max-w-xl w-full mx-auto my-auto py-6 relative z-10">
            <div className="bg-slate-900/90 backdrop-blur-xl border border-slate-800 rounded-3xl p-7 sm:p-9 shadow-2xl">
              <div className="flex flex-col items-center text-center mb-6">
                <div className="mb-3">
                  <AmongUsCrewmate colorId={myCrewColor} avatarUrl={myAvatarUrl} size={64} />
                </div>
                <span className="text-[11px] font-bold uppercase tracking-widest text-cyan-400 bg-cyan-500/10 border border-cyan-500/30 px-3 py-1 rounded-full mb-2">
                  Sảnh Chờ Phi Hành Đoàn
                </span>
                <h1 className="text-2xl font-extrabold text-white">Tham Gia Phòng Đấu Từ Vựng</h1>
                <p className="text-xs text-slate-400 mt-1.5 max-w-md leading-relaxed">
                  Nhập <b>Mã Phòng (PIN)</b> và <b>Mật Khẩu</b> do giáo viên tạo để bước vào Sảnh Chờ. Trận đấu sẽ chỉ bắt đầu khi giáo viên bấm khởi hành!
                </p>
              </div>

              {/* Pick Suit Color before entering */}
              <div className="mb-6">
                <p className="text-[11px] font-semibold text-slate-400 text-center mb-2">Chọn màu phi hành gia hoặc đầu Avatar:</p>
                {renderCrewColorPicker(false)}
              </div>

              {roomJoinError && (
                <div className="mb-4 p-3 rounded-xl bg-rose-500/15 border border-rose-500/40 text-xs text-rose-200 flex items-center gap-2 font-medium">
                  <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
                  <span>{roomJoinError}</span>
                </div>
              )}

              <form onSubmit={handleStudentJoinRoom} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">Mã Phòng (PIN)</label>
                  <input
                    type="text"
                    placeholder="VD: 686868"
                    value={roomJoinForm.pin}
                    onChange={e => {
                      setRoomJoinForm({ ...roomJoinForm, pin: e.target.value });
                      if (roomJoinError) setRoomJoinError('');
                    }}
                    className="w-full px-4 py-3 bg-slate-950 border border-slate-700 rounded-xl text-center font-mono text-lg font-extrabold tracking-widest text-cyan-300 placeholder:text-slate-600 focus:ring-2 focus:ring-cyan-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">Mật Khẩu Phòng</label>
                  <input
                    type="password"
                    placeholder="Nhập mật khẩu phòng..."
                    value={roomJoinForm.pass}
                    onChange={e => {
                      setRoomJoinForm({ ...roomJoinForm, pass: e.target.value });
                      if (roomJoinError) setRoomJoinError('');
                    }}
                    className="w-full px-4 py-3 bg-slate-950 border border-slate-700 rounded-xl text-center text-sm font-semibold text-white placeholder:text-slate-600 focus:ring-2 focus:ring-cyan-500 focus:outline-none"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full py-3.5 rounded-xl bg-gradient-to-r from-cyan-500 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-white font-extrabold text-sm shadow-lg shadow-cyan-500/20 transition flex items-center justify-center gap-2"
                >
                  <DoorOpen className="w-4 h-4" /> VÀO SẢNH CHỜ NGAY
                </button>
              </form>

              {allRoomsList.filter(r => r.status === 'LOBBY').length > 0 && (
                <div className="mt-5 pt-4 border-t border-slate-800/90">
                  <p className="text-[11px] font-semibold text-slate-400 mb-2 text-center">
                    Phòng đang mở sảnh chờ (bấm để chọn nhanh mã PIN):
                  </p>
                  <div className="flex flex-wrap justify-center gap-2">
                    {allRoomsList.filter(r => r.status === 'LOBBY').map(r => (
                      <button
                        key={r.pin}
                        type="button"
                        onClick={() => {
                          setRoomJoinForm(prev => ({ ...prev, pin: r.pin }));
                          setRoomJoinError('');
                        }}
                        className={`px-3 py-1.5 rounded-xl text-[11px] font-bold border transition flex items-center gap-1.5 ${
                          roomJoinForm.pin === r.pin
                            ? 'bg-cyan-500/20 border-cyan-400 text-cyan-200'
                            : 'bg-slate-950 border-slate-800 text-slate-300 hover:border-cyan-500/50'
                        }`}
                      >
                        <span className="font-mono text-amber-300">#{r.pin}</span>
                        <span className="truncate max-w-[140px]">{r.name}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="text-center text-[11px] text-slate-500 relative z-10">
            Mẹo: Nếu giáo viên mở phòng trong một tab/cửa sổ trình duyệt khác, danh sách người chơi sẽ đồng bộ trực tiếp.
          </div>
        </div>
      );
    }

    // 2. AMONG US DROPSHIP WAITING LOBBY + LAUNCH COUNTDOWN
    if (gameSubState === 'LOBBY' || gameSubState === 'COUNTDOWN') {
      const canHostLaunch = isTeacher && gameSubState === 'LOBBY' && hasStudentsInLobby;
      const isRoomAlreadyPlayingWithoutLaunch = !isTeacher && room.status === 'PLAYING' && gameSubState === 'LOBBY';

      return (
        <div className="h-[100dvh] w-full overflow-hidden bg-[#070b15] text-white flex flex-col select-none relative">
          {/* Top Lobby Header */}
          <header className="shrink-0 bg-slate-900/90 backdrop-blur-md border-b border-slate-800 px-4 py-2.5 flex items-center justify-between gap-2.5 flex-wrap z-30">
            <div className="flex items-center gap-2 flex-wrap">
              <button
                onClick={handleLeaveGameLobby}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-bold transition"
              >
                <ChevronLeft className="w-4 h-4" /> Rời Sảnh
              </button>
              <div className="flex items-center gap-2 bg-slate-800/80 border border-slate-700 px-3 py-1.5 rounded-xl">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span className="text-xs font-bold text-slate-200 max-w-[180px] truncate">{room.name}</span>
              </div>
              <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-[11px] font-bold border ${
                serverSyncConnected
                  ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'
                  : 'bg-amber-500/15 text-amber-300 border-amber-500/30'
              }`}>
                <Wifi className="w-3 h-3" /> {serverSyncConnected ? 'Live' : 'Local'}
              </span>
              {isTeacher && (
                <div className="flex items-center gap-2 bg-indigo-500/15 border border-indigo-500/30 px-3 py-1.5 rounded-xl text-xs">
                  <span className="text-slate-300">PIN: <b className="font-mono text-amber-300">{room.pin}</b></span>
                  <span className="text-slate-500">•</span>
                  <span className="text-slate-300">Pass: <b className="font-mono text-cyan-300">{room.pass}</b></span>
                  <button
                    onClick={() => {
                      navigator.clipboard?.writeText(`Mã phòng Game Từ Vựng: ${room.pin} | Mật khẩu: ${room.pass}`);
                      setCopiedRoomPin(true);
                      setTimeout(() => setCopiedRoomPin(false), 1800);
                      showToast(`Đã sao chép PIN ${room.pin} & Pass "${room.pass}"!`);
                    }}
                    className="ml-1 text-indigo-300 hover:text-white"
                    title="Sao chép mã PIN & Mật khẩu"
                  >
                    {copiedRoomPin ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                  <button
                    type="button"
                    onClick={() => handleCopyInviteLink(room.pin)}
                    className="text-cyan-300 hover:text-white pl-1 border-l border-indigo-500/30"
                    title="Sao chép Link mời tự điền PIN (?pin=...)"
                  >
                    <Share2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              <span className="bg-slate-800 border border-slate-700 px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 text-cyan-300">
                <Users className="w-3.5 h-3.5" /> {lobbyPlayersList.length}/{room.maxPlayers}
              </span>
              {isTeacher && (
                <>
                  <button
                    onClick={() => setShowCreateRoomModal(true)}
                    className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-xs font-bold text-white transition flex items-center gap-1"
                  >
                    <Plus className="w-3.5 h-3.5" /> Tạo Phòng
                  </button>
                  <button
                    onClick={() => {
                      setCustomVocabInput(room.rawVocab || DEFAULT_VOCAB_TEXT);
                      setShowVocabModal(true);
                    }}
                    className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs font-bold text-amber-300 transition"
                  >
                    Kho Từ ({roomVocabCount})
                  </button>
                  {!hasStudentsInLobby ? (
                    <button
                      onClick={() => jumpToGameSandboxRound(1)}
                      className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs font-bold text-slate-300 transition hidden sm:inline-flex items-center gap-1"
                      title="Chỉ khả dụng khi phòng chưa có học sinh"
                    >
                      Chơi Thử GV
                    </button>
                  ) : room.status === 'PLAYING' ? (
                    <button
                      onClick={() => setGameSubState('HOST_SPECTATE')}
                      className="px-3 py-1.5 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 border border-amber-400/40 text-xs font-bold text-amber-300 transition inline-flex items-center gap-1"
                    >
                      <Trophy className="w-3.5 h-3.5" /> Bảng Đua Top
                    </button>
                  ) : (
                    <span className="hidden sm:inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-cyan-500/10 border border-cyan-500/30 text-[11px] font-bold text-cyan-300">
                      <Trophy className="w-3.5 h-3.5" /> Giám Sát Đua Top
                    </span>
                  )}
                </>
              )}
            </div>
          </header>

          {/* Main Lobby Content Area */}
          <div className="flex-1 min-h-0 flex flex-col justify-between gap-3 p-3 sm:p-5 overflow-y-auto bg-[radial-gradient(ellipse_at_top,_rgba(30,58,138,0.28),_rgba(7,11,21,1)_70%)]">
            <div className="max-w-6xl w-full mx-auto space-y-3">
              {/* TEACHER INLINE ROOM NAME / PIN / PASSWORD EDITOR */}
              {isTeacher && (
                <div className="bg-slate-900/90 border border-indigo-500/30 rounded-2xl p-3.5 backdrop-blur-md shadow-lg space-y-3">
                  {allRoomsList.length > 1 && (
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-[11px] font-bold text-slate-400">Chuyển phòng:</span>
                      {allRoomsList.map(r => (
                        <div key={r.pin} className="inline-flex items-center rounded-lg overflow-hidden border border-slate-700">
                          <button
                            type="button"
                            onClick={() => handleTeacherOpenLobby(r.pin)}
                            className={`px-2.5 py-1 text-[11px] font-bold transition ${
                              r.pin === activePin
                                ? 'bg-indigo-600 text-white'
                                : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                            }`}
                          >
                            #{r.pin} • {r.name}
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteRoom(r.pin)}
                            className="px-1.5 py-1 bg-slate-900 hover:bg-rose-600 text-slate-400 hover:text-white text-[11px] transition border-l border-slate-700"
                            title={`Xóa phòng #${r.pin}`}
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}

                  <form onSubmit={handleSaveHostRoomSettings} className="grid grid-cols-1 sm:grid-cols-12 gap-2.5 items-end">
                    <div className="sm:col-span-4">
                      <label className="block text-[10px] font-bold uppercase tracking-wider text-indigo-300 mb-1">
                        Tên phòng hiển thị
                      </label>
                      <input
                        type="text"
                        value={hostRoomDraft.name}
                        onChange={e => setHostRoomDraft(prev => ({ ...prev, name: e.target.value }))}
                        placeholder="Nhập tên phòng..."
                        className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs font-semibold text-white placeholder:text-slate-500 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                      />
                    </div>
                    <div className="sm:col-span-2">
                      <label className="block text-[10px] font-bold uppercase tracking-wider text-amber-300 mb-1">
                        Mã PIN
                      </label>
                      <input
                        type="text"
                        value={hostRoomDraft.pin}
                        onChange={e => setHostRoomDraft(prev => ({ ...prev, pin: e.target.value }))}
                        placeholder="686868"
                        className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs font-mono font-bold text-amber-300 focus:ring-2 focus:ring-amber-500 focus:outline-none"
                      />
                    </div>
                    <div className="sm:col-span-2">
                      <label className="block text-[10px] font-bold uppercase tracking-wider text-cyan-300 mb-1">
                        Mật khẩu
                      </label>
                      <input
                        type="text"
                        value={hostRoomDraft.pass}
                        onChange={e => setHostRoomDraft(prev => ({ ...prev, pass: e.target.value }))}
                        placeholder="Mật khẩu..."
                        className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs font-mono font-bold text-cyan-300 focus:ring-2 focus:ring-cyan-500 focus:outline-none"
                      />
                    </div>
                    <div className="sm:col-span-1">
                      <label className="block text-[10px] font-bold uppercase tracking-wider text-emerald-300 mb-1">
                        Từ/vòng
                      </label>
                      <select
                        value={hostRoomDraft.roundSize || 4}
                        onChange={e => setHostRoomDraft(prev => ({ ...prev, roundSize: Number(e.target.value) }))}
                        className="w-full px-2 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs font-bold text-emerald-300 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                      >
                        {[2, 3, 4, 5, 6, 8].map(num => (
                          <option key={num} value={num}>{num}</option>
                        ))}
                      </select>
                    </div>
                    <div className="sm:col-span-1">
                      <label className="block text-[10px] font-bold uppercase tracking-wider text-pink-300 mb-1">
                        Tốc độ
                      </label>
                      <select
                        value={hostRoomDraft.speedMode || 'normal'}
                        onChange={e => setHostRoomDraft(prev => ({ ...prev, speedMode: e.target.value }))}
                        className="w-full px-1.5 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs font-bold text-pink-300 focus:ring-2 focus:ring-pink-500 focus:outline-none"
                      >
                        <option value="relaxed">Chậm</option>
                        <option value="normal">Chuẩn</option>
                        <option value="turbo">Nhanh</option>
                      </select>
                    </div>
                    <div className="sm:col-span-2">
                      <button
                        type="submit"
                        className="w-full py-2 px-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-extrabold transition flex items-center justify-center gap-1.5 shadow"
                      >
                        <Save className="w-3.5 h-3.5" /> Lưu Phòng
                      </button>
                    </div>
                  </form>
                </div>
              )}

              {/* Console Banner */}
              <div className="bg-slate-900/75 border border-slate-700/80 rounded-2xl px-4 py-2.5 flex flex-wrap items-center justify-between gap-3 backdrop-blur-md">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-cyan-500/15 border border-cyan-500/30 flex items-center justify-center text-cyan-300 shrink-0">
                    <Rocket className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="font-extrabold text-sm text-white">Khoang Chờ Tàu Vũ Trụ (Dropship Lobby)</h2>
                    <p className="text-[11px] text-slate-400">
                      {isTeacher
                        ? 'Học sinh nhập Mã PIN & Mật khẩu để vào khoang. Nhấn Bắt Đầu Trận Đấu để tất cả cùng vào game.'
                        : isRoomAlreadyPlayingWithoutLaunch
                        ? 'Lượt chơi trước đang chạy hoặc đã xong — chờ Giáo viên bấm Bắt Đầu / Mở Sảnh Mới để cùng khởi hành.'
                        : 'Bạn đã ở trong Sảnh Chờ! Bấm Sẵn Sàng và chờ Chủ phòng (Giáo viên) bấm khởi hành.'}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 text-xs">
                  <span className="px-2.5 py-1 rounded-lg bg-slate-800 text-slate-300 font-semibold">
                    {roomVocabCount} từ • {room.roundSize || 4}/vòng • {room.speedMode === 'relaxed' ? 'Chậm (+6s)' : room.speedMode === 'turbo' ? 'Siêu tốc (-5s)' : 'Chuẩn'}
                  </span>
                  <span className="px-2.5 py-1 rounded-lg bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 font-bold">
                    {readyCount}/{lobbyPlayersList.length} Sẵn sàng
                  </span>
                </div>
              </div>
            </div>

            {/* 2-Column Stage: Dropship Crewmates Grid + Persistent Lobby Chat */}
            <div className="max-w-6xl w-full mx-auto grid grid-cols-1 lg:grid-cols-12 gap-4 my-auto py-1">
              {/* Left: Crewmates Deck */}
              <div className="lg:col-span-7 xl:col-span-8 relative rounded-3xl border-2 border-slate-700/70 bg-slate-900/60 backdrop-blur-sm pt-12 pb-6 px-5 sm:px-8 shadow-2xl min-h-[260px] flex flex-col justify-center">
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-6 justify-items-center">
                  {lobbyPlayersList.length === 0 ? (
                    <div className="col-span-full py-10 text-center text-slate-400 text-sm">
                      Chưa có thành viên nào trong khoang chờ...
                    </div>
                  ) : (
                    lobbyPlayersList.map((player, idx) => {
                      const isHost = player.role === 'teacher';
                      const isSelf = player.username === currentUser?.username;
                      const showBubble = Boolean(player.chat && player.chatAt && Math.abs(lobbyNowTick - player.chatAt) < 5500);

                      return (
                        <div key={player.username} className="flex flex-col items-center relative group">
                          {/* Speech Bubble above Crewmate */}
                          {showBubble && (
                            <div className="absolute -top-10 z-20 bg-white text-slate-900 text-[11px] font-bold px-2.5 py-1 rounded-xl shadow-lg max-w-[150px] truncate border border-slate-200">
                              {player.chat}
                            </div>
                          )}

                          {/* Kick Button for Teacher */}
                          {isTeacher && !isHost && (
                            <button
                              type="button"
                              onClick={() => handleKickLobbyPlayer(activePin, player.username, player.name)}
                              className="absolute -top-2 -right-2 z-20 w-6 h-6 rounded-full bg-rose-600/90 hover:bg-rose-500 text-white flex items-center justify-center shadow opacity-90 sm:opacity-0 sm:group-hover:opacity-100 transition"
                              title={`Mời ${player.name} rời sảnh`}
                            >
                              <UserMinus className="w-3 h-3" />
                            </button>
                          )}

                          {/* Host Crown */}
                          {isHost ? (
                            <div className="mb-0.5 text-amber-400 flex items-center gap-1 text-[10px] font-extrabold uppercase tracking-wider">
                              <Crown className="w-3.5 h-3.5" /> Chủ Phòng
                            </div>
                          ) : (
                            <div className={`mb-0.5 text-[10px] font-bold uppercase tracking-wider ${player.ready ? 'text-emerald-400' : 'text-amber-400'}`}>
                              {player.ready ? 'Sẵn sàng' : 'Đang chờ'}
                            </div>
                          )}

                          <AmongUsCrewmate
                            colorId={player.colorId || 'cyan'}
                            avatarUrl={player.avatarUrl || usersDb[player.username]?.avatarUrl || ''}
                            size={56}
                            flip={idx % 2 === 1}
                            animate={true}
                          />

                          {/* Floor Shadow */}
                          <div className="w-11 h-2 bg-black/50 rounded-full blur-[2px] -mt-1 mb-2" />

                          {/* Nameplate */}
                          <div className={`px-2.5 py-1 rounded-lg text-[11px] font-bold flex items-center gap-1.5 border ${
                            isSelf
                              ? 'bg-cyan-500/20 border-cyan-400/60 text-cyan-200'
                              : 'bg-slate-800/90 border-slate-700 text-slate-200'
                          }`}>
                            <span className={`w-2 h-2 rounded-full ${
                              player.ready || isHost ? 'bg-emerald-400' : 'bg-amber-400'
                            }`} />
                            <span className="truncate max-w-[105px]">{player.name}</span>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>

              {/* Right: Persistent Live Lobby Chat Box */}
              {renderLobbyChatPanel('h-[270px] lg:h-[360px]', 'Chat Phòng Chờ')}
            </div>

            {/* Bottom Controls Bar (Suit Customize + Ready / Host Launch) */}
            <div className="max-w-6xl w-full mx-auto bg-slate-900/90 border border-slate-700/80 rounded-2xl p-3.5 flex flex-col md:flex-row items-center justify-between gap-3 backdrop-blur-md">
              <div className="flex items-center gap-2 bg-slate-950/70 px-3 py-2 rounded-xl border border-slate-800 flex-wrap justify-center">
                <span className="text-[11px] text-slate-400 font-semibold mr-1">Phi hành gia:</span>
                {renderCrewColorPicker(true)}
              </div>

              <div className="flex items-center gap-2.5 flex-wrap justify-center shrink-0">
                {!isTeacher ? (
                  <button
                    type="button"
                    onClick={handleToggleLobbyReady}
                    className={`px-5 py-2.5 rounded-xl font-extrabold text-xs sm:text-sm transition flex items-center gap-2 shadow-lg ${
                      myLobbyEntry?.ready
                        ? 'bg-emerald-600 hover:bg-emerald-500 text-white'
                        : 'bg-amber-500 hover:bg-amber-400 text-slate-950'
                    }`}
                  >
                    <CheckCircle className="w-4 h-4" />
                    {myLobbyEntry?.ready ? 'Đã Sẵn Sàng (Bấm để Hủy)' : 'Bấm Sẵn Sàng'}
                  </button>
                ) : (
                  <>
                    {room.status === 'PLAYING' && (
                      <button
                        type="button"
                        onClick={() => handleTeacherResetLobby(activePin)}
                        className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-600 text-xs font-bold text-slate-200 flex items-center gap-1.5 transition"
                      >
                        <RefreshCw className="w-3.5 h-3.5" /> Mở Lại Sảnh (Cho HS Vào)
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => handleTeacherStartLobbyGame(activePin)}
                      disabled={!canHostLaunch}
                      title={hasStudentsInLobby ? 'Khởi động trận đấu & mở bảng Đua Top cho Giáo viên' : 'Cần ít nhất 1 học sinh vào sảnh mới có thể bắt đầu'}
                      className={`px-6 py-2.5 rounded-xl font-extrabold text-sm transition flex items-center gap-2 shadow-xl ${
                        canHostLaunch
                          ? 'bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-400 hover:to-cyan-400 text-slate-950 shadow-emerald-500/25'
                          : 'bg-slate-700 text-slate-400 cursor-not-allowed'
                      }`}
                    >
                      <Rocket className="w-4 h-4" />
                      {hasStudentsInLobby
                        ? `BẮT ĐẦU ĐUA TOP (${studentLobbyPlayers.length} HS)`
                        : 'CHỜ HỌC SINH VÀO SẢNH (0 HS)'}
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Synchronized 3-2-1 Rocket Launch Countdown Overlay */}
          {gameSubState === 'COUNTDOWN' && (
            <div className="absolute inset-0 bg-slate-950/90 backdrop-blur-md z-50 flex flex-col items-center justify-center text-center p-6">
              <p className="text-xs font-bold uppercase tracking-[0.3em] text-cyan-400 mb-3">
                Tất cả phi hành gia chuẩn bị
              </p>
              <div className="text-7xl sm:text-8xl font-black text-white font-mono animate-bounce">
                {lobbyCountdown ?? 1}
              </div>
              <p className="text-sm text-slate-300 mt-4 font-semibold">
                {isTeacher ? 'Đang mở Bảng Xếp Hạng Đua Top Trực Tiếp...' : 'Đang khởi động Đấu Trường Từ Vựng 3 Vòng...'}
              </p>
            </div>
          )}
        </div>
      );
    }

    // 2B. TEACHER HOST LIVE "ĐUA TOP" SPECTATE LEADERBOARD (No Teacher Gameplay When Students Exist)
    if (gameSubState === 'HOST_SPECTATE' && isTeacher) {
      const mergedMap = {};
      studentLobbyPlayers.forEach(lp => {
        mergedMap[lp.username] = {
          username: lp.username,
          name: lp.name || lp.username,
          role: 'student',
          colorId: lp.colorId || 'cyan',
          avatarUrl: lp.avatarUrl || usersDb[lp.username]?.avatarUrl || '',
          score: 0,
          streak: 0,
          lives: 3,
          round: 1,
          progressText: 'Đang vào trận...',
          finished: false,
          outcome: null
        };
      });
      Object.values(room.liveMatch || {}).forEach(lm => {
        if (!lm?.username || lm.role === 'teacher') return;
        mergedMap[lm.username] = {
          ...(mergedMap[lm.username] || {}),
          ...lm,
          avatarUrl: lm.avatarUrl || mergedMap[lm.username]?.avatarUrl || usersDb[lm.username]?.avatarUrl || ''
        };
      });

      const rankedPlayers = Object.values(mergedMap).sort((a, b) => {
        if ((b.score || 0) !== (a.score || 0)) return (b.score || 0) - (a.score || 0);
        if ((b.streak || 0) !== (a.streak || 0)) return (b.streak || 0) - (a.streak || 0);
        if ((b.lives ?? 3) !== (a.lives ?? 3)) return (b.lives ?? 3) - (a.lives ?? 3);
        return (a.name || a.username).localeCompare(b.name || b.username);
      });

      const rankIndexMap = {};
      rankedPlayers.forEach((p, idx) => {
        rankIndexMap[p.username] = idx;
      });
      const stableDomPlayers = [...rankedPlayers].sort((a, b) => a.username.localeCompare(b.username));
      const finishedCount = rankedPlayers.filter(p => p.finished).length;
      const leaderScore = Math.max(150, rankedPlayers[0]?.score || 0);
      const ROW_STRIDE = 88;
      const podiumOrder = rankedPlayers.length >= 2 ? [1, 0, 2] : [0];
      const missedFreqMap = {};
      rankedPlayers.forEach(p => {
        (p.missed || []).forEach(wordStr => {
          const w = String(wordStr || '').trim().toUpperCase();
          if (w) missedFreqMap[w] = (missedFreqMap[w] || 0) + 1;
        });
      });
      const topMissedWords = Object.entries(missedFreqMap)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 8);

      return (
        <div className="min-h-[100dvh] w-full bg-[#060914] text-white flex flex-col select-none relative overflow-x-hidden">
          <div className="absolute top-[-10%] left-[15%] w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute bottom-[-10%] right-[10%] w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />

          {/* Host Spectate Header */}
          <header className="shrink-0 bg-slate-900/90 backdrop-blur-md border-b border-slate-800 px-4 py-2.5 flex items-center justify-between gap-2.5 flex-wrap z-30">
            <div className="flex items-center gap-2 flex-wrap">
              <button
                type="button"
                onClick={exitGame}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-bold transition"
              >
                <ChevronLeft className="w-4 h-4" /> Thoát Ra Bảng Tin
              </button>
              <div className="flex items-center gap-2 bg-amber-500/15 border border-amber-400/40 px-3 py-1.5 rounded-xl">
                <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping" />
                <Trophy className="w-4 h-4 text-amber-400" />
                <span className="text-xs font-extrabold text-amber-200 uppercase tracking-wide">Đua Top Trực Tiếp</span>
              </div>
              <span className="text-xs font-bold text-slate-300 bg-slate-800/80 border border-slate-700 px-3 py-1.5 rounded-xl">
                PIN: <b className="font-mono text-cyan-300">{room.pin}</b> • {room.name}
              </span>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              <span className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-[11px] font-bold border ${
                serverSyncConnected
                  ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'
                  : 'bg-amber-500/15 text-amber-300 border-amber-500/30'
              }`}>
                <Wifi className="w-3.5 h-3.5" /> {serverSyncConnected ? 'Live Sync' : 'Local'}
              </span>
              <span className="px-3 py-1.5 rounded-xl bg-slate-800 border border-slate-700 text-xs font-bold text-cyan-300 flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5" /> {finishedCount}/{rankedPlayers.length} Đã xong
              </span>
              {room.status !== 'ENDED' && (
                <button
                  type="button"
                  onClick={() => handleFinishRoomMatch(activePin)}
                  className="px-3.5 py-1.5 rounded-xl bg-rose-600/90 hover:bg-rose-500 text-white text-xs font-extrabold transition flex items-center gap-1.5 shadow"
                >
                  <Trophy className="w-3.5 h-3.5" /> Chốt BXH & Kết Thúc
                </button>
              )}
              <button
                type="button"
                onClick={() => {
                  handleTeacherResetLobby(activePin);
                  setGameSubState('LOBBY');
                }}
                className="px-3.5 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-extrabold transition flex items-center gap-1.5 shadow-lg shadow-indigo-600/20"
              >
                <RefreshCw className="w-3.5 h-3.5" /> Mở Sảnh Ván Mới
              </button>
            </div>
          </header>

          {/* Main Spectate Race Body */}
          <div className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 grid grid-cols-1 lg:grid-cols-12 gap-5 relative z-10">
            {/* Left 8 Cols: Live Top-3 Podium + Animated Rank Tracks */}
            <div className="lg:col-span-7 xl:col-span-8 flex flex-col gap-4">
              {/* Top 3 Live Podium */}
              {rankedPlayers.length > 0 && (
                <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-4 sm:p-5 backdrop-blur-md shadow-xl">
                  <div className="flex items-center justify-between mb-3">
                    <h2 className="text-xs font-extrabold uppercase tracking-widest text-amber-300 flex items-center gap-1.5">
                      <Crown className="w-4 h-4" /> Top 3 Dẫn Đầu Hiện Tại
                    </h2>
                    <span className="text-[11px] text-slate-400">Giáo viên chỉ giám sát • Tự động cập nhật</span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 items-end">
                    {podiumOrder.map((rankIdx) => {
                      const p = rankedPlayers[rankIdx];
                      if (!p) return null;
                      const isFirst = rankIdx === 0;
                      const medalStyles =
                        rankIdx === 0
                          ? 'bg-gradient-to-b from-amber-500/25 to-slate-900/90 border-amber-400/60 sm:py-5 shadow-lg shadow-amber-500/10'
                          : rankIdx === 1
                          ? 'bg-gradient-to-b from-slate-400/15 to-slate-900/90 border-slate-400/40'
                          : 'bg-gradient-to-b from-orange-500/15 to-slate-900/90 border-orange-500/40';
                      const rankLabel = rankIdx === 0 ? 'HẠNG #1' : rankIdx === 1 ? 'HẠNG #2' : 'HẠNG #3';

                      return (
                        <div key={`pod-${p.username}`} className={`rounded-2xl border p-3.5 flex flex-col items-center text-center transition-all duration-300 ${medalStyles}`}>
                          <span className={`text-[10px] font-black tracking-widest px-2.5 py-0.5 rounded-full mb-2 ${
                            isFirst ? 'bg-amber-400 text-slate-950' : 'bg-slate-800 text-slate-200 border border-slate-700'
                          }`}>
                            {rankLabel}
                          </span>
                          <AmongUsCrewmate
                            colorId={p.colorId || 'cyan'}
                            avatarUrl={p.avatarUrl}
                            size={isFirst ? 54 : 44}
                            animate={!p.finished && (p.lives ?? 3) > 0}
                          />
                          <p className="font-extrabold text-sm text-white mt-1.5 truncate max-w-full">{p.name}</p>
                          <p className="font-mono text-lg font-black text-amber-300 tabular-nums">{p.score || 0}đ</p>
                          <p className="text-[10px] text-slate-400 truncate max-w-full mt-0.5">{p.progressText || 'Đang đua'}</p>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Smoothly Animated Live Leaderboard Tracks */}
              <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-4 sm:p-5 backdrop-blur-md shadow-xl flex-1">
                <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-800">
                  <h3 className="text-sm font-extrabold text-white flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-cyan-400" /> Bảng Xếp Hạng Biến Động Thời Gian Thực
                  </h3>
                  <span className="text-[11px] font-semibold text-slate-400">
                    {rankedPlayers.length} thí sinh
                  </span>
                </div>

                {rankedPlayers.length === 0 ? (
                  <div className="py-12 text-center text-slate-400 text-sm">
                    Chưa có học sinh nào tham gia phòng này. Nhấn <b>Mở Sảnh Ván Mới</b> để học sinh vào phòng!
                  </div>
                ) : (
                  <div className="relative" style={{ height: `${rankedPlayers.length * ROW_STRIDE}px` }}>
                    {stableDomPlayers.map((p) => {
                      const rankIdx = rankIndexMap[p.username] ?? 0;
                      const delta = liveRankDeltas[p.username] || 0;
                      const livesLeft = Math.max(0, Math.min(3, p.lives ?? 3));
                      const barPct = Math.max(6, Math.min(100, Math.round(((p.score || 0) / leaderScore) * 100)));
                      const rowBorder =
                        rankIdx === 0
                          ? 'border-amber-400/60 bg-amber-500/10'
                          : rankIdx === 1
                          ? 'border-slate-500/60 bg-slate-800/80'
                          : rankIdx === 2
                          ? 'border-orange-500/50 bg-orange-500/10'
                          : 'border-slate-800 bg-slate-950/75';

                      return (
                        <div
                          key={p.username}
                          style={{ transform: `translateY(${rankIdx * ROW_STRIDE}px)` }}
                          className={`absolute inset-x-0 top-0 h-[78px] px-3.5 rounded-2xl border ${rowBorder} flex items-center gap-3 transition-transform duration-500 ease-out shadow-md`}
                        >
                          {/* Rank Number + Delta Badge */}
                          <div className="w-12 shrink-0 flex flex-col items-center justify-center">
                            <span className={`w-8 h-8 rounded-xl font-black text-sm flex items-center justify-center tabular-nums ${
                              rankIdx === 0
                                ? 'bg-amber-400 text-slate-950'
                                : rankIdx === 1
                                ? 'bg-slate-300 text-slate-950'
                                : rankIdx === 2
                                ? 'bg-orange-400 text-slate-950'
                                : 'bg-slate-800 text-slate-300 border border-slate-700'
                            }`}>
                              #{rankIdx + 1}
                            </span>
                            {delta !== 0 && (
                              <span className={`mt-0.5 text-[9px] font-extrabold inline-flex items-center gap-0.5 ${
                                delta > 0 ? 'text-emerald-400' : 'text-rose-400'
                              }`}>
                                {delta > 0 ? <TrendingUp className="w-2.5 h-2.5" /> : <TrendingDown className="w-2.5 h-2.5" />}
                                {delta > 0 ? `+${delta}` : delta}
                              </span>
                            )}
                          </div>

                          {/* Crewmate / Avatar Character */}
                          <div className="shrink-0">
                            <AmongUsCrewmate
                              colorId={p.colorId || 'cyan'}
                              avatarUrl={p.avatarUrl}
                              size={42}
                              animate={!p.finished && livesLeft > 0}
                            />
                          </div>

                          {/* Name, Progress Bar, Hearts & Combo */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-extrabold text-sm text-white truncate max-w-[150px] sm:max-w-[210px]">
                                {p.name}
                              </span>
                              {p.finished ? (
                                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                                  p.outcome === 'VICTORY'
                                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                                    : 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                                }`}>
                                  {p.outcome === 'VICTORY' ? 'Hoàn thành!' : 'Hết mạng'}
                                </span>
                              ) : (
                                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-cyan-500/15 text-cyan-300 border border-cyan-500/30 truncate max-w-[145px]">
                                  {p.progressText || `Vòng ${p.round || 1}/3`}
                                </span>
                              )}
                              {(p.streak || 0) > 0 && (
                                <span className="hidden sm:inline-flex items-center gap-0.5 text-[10px] font-extrabold text-amber-300 bg-amber-500/15 px-1.5 py-0.5 rounded-md">
                                  <Zap className="w-3 h-3" /> x{p.streak}
                                </span>
                              )}
                            </div>

                            <div className="flex items-center gap-3 mt-1.5">
                              <div className="flex-1 h-2 bg-slate-800 rounded-full overflow-hidden">
                                <div
                                  className={`h-full rounded-full transition-all duration-300 ${
                                    rankIdx === 0
                                      ? 'bg-gradient-to-r from-amber-400 to-yellow-300'
                                      : p.finished && p.outcome === 'LOST'
                                      ? 'bg-rose-500'
                                      : 'bg-gradient-to-r from-cyan-500 to-indigo-500'
                                  }`}
                                  style={{ width: `${barPct}%` }}
                                />
                              </div>
                              <div className="flex items-center gap-0.5 shrink-0" title={`Còn ${livesLeft}/3 mạng`}>
                                {[0, 1, 2].map(i => (
                                  <Heart
                                    key={i}
                                    className={`w-3 h-3 ${
                                      i < livesLeft ? 'text-rose-500 fill-rose-500' : 'text-slate-700'
                                    }`}
                                  />
                                ))}
                              </div>
                            </div>
                          </div>

                          {/* Live Score */}
                          <div className="text-right shrink-0 pl-2">
                            <p className={`font-mono text-lg sm:text-xl font-black tabular-nums ${
                              rankIdx === 0 ? 'text-amber-300' : 'text-cyan-300'
                            }`}>
                              {p.score || 0}<span className="text-xs font-bold ml-0.5">đ</span>
                            </p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Classroom Most-Missed Words Analytics for Live Review */}
              {topMissedWords.length > 0 && (
                <div className="bg-slate-900/80 border border-rose-500/30 rounded-3xl p-4 sm:p-5 backdrop-blur-md shadow-xl">
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <h3 className="text-xs font-extrabold uppercase tracking-wider text-rose-300 flex items-center gap-1.5">
                      <AlertTriangle className="w-4 h-4 text-rose-400" /> Từ Cả Lớp Hay Sai Nhất (Bấm Để Đọc Mẫu)
                    </h3>
                    <span className="text-[11px] text-slate-400">Phục vụ ôn tập ngay sau trận</span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {topMissedWords.map(([wordStr, errCount]) => (
                      <button
                        key={wordStr}
                        type="button"
                        onClick={() => speakWord(wordStr)}
                        className="px-3 py-1.5 rounded-xl bg-rose-500/15 hover:bg-rose-500/25 border border-rose-500/40 text-xs font-bold text-rose-200 flex items-center gap-1.5 transition"
                      >
                        <Volume2 className="w-3.5 h-3.5 text-cyan-300" />
                        <span className="font-mono">{wordStr}</span>
                        <span className="bg-rose-500/30 text-white text-[10px] px-1.5 py-0.5 rounded-md">{errCount} lượt sai</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Right 4 Cols: Live Lobby Chat during Match */}
            {renderLobbyChatPanel('h-[340px] lg:h-[520px]', 'Chat Trực Tiếp')}
          </div>
        </div>
      );
    }

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
            <span className="bg-indigo-500/20 text-indigo-300 border border-indigo-500/40 px-2.5 py-1 rounded-full font-bold">
              Phòng: {activePin}
            </span>
            <span className="hidden sm:inline-flex bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 px-2.5 py-1 rounded-full font-bold">
              {currentUser?.name || currentUser?.username}
            </span>
            <button
              type="button"
              onClick={handleToggleGameMute}
              className={`px-2.5 py-1 rounded-lg font-bold border transition flex items-center gap-1 ${
                gameMuted
                  ? 'bg-rose-500/20 border-rose-500/40 text-rose-300'
                  : 'bg-slate-800 hover:bg-slate-700 border-slate-700 text-cyan-300'
              }`}
              title={gameMuted ? 'Bật âm thanh Game' : 'Tắt âm thanh Game'}
            >
              {gameMuted ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
              <span className="hidden md:inline">{gameMuted ? 'Đang tắt tiếng' : 'Âm thanh'}</span>
            </button>
            {isTeacher && isSandboxRound && gameSubState === 'PLAYING' && (
              <button
                type="button"
                onClick={handleToggleGamePause}
                className={`px-2.5 py-1 rounded-lg font-bold border transition flex items-center gap-1 ${
                  gamePaused
                    ? 'bg-amber-500 text-slate-950 border-amber-400'
                    : 'bg-slate-800 hover:bg-slate-700 border-slate-700 text-amber-300'
                }`}
              >
                {gamePaused ? <Play className="w-3.5 h-3.5" /> : <Pause className="w-3.5 h-3.5" />}
                <span>{gamePaused ? 'Tiếp tục' : 'Tạm dừng'}</span>
              </button>
            )}
          </div>

          {/* Teacher Sandbox Controls */}
          {isTeacher && (
            <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
              <span className="text-slate-400 font-bold hidden sm:inline">GV Sandbox:</span>
              <button
                onClick={() => jumpToGameSandboxRound(1)}
                className={`px-2.5 py-1 rounded font-bold transition ${gameRound === 1 ? 'bg-cyan-500 text-slate-950' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'}`}
              >
                Màn 1
              </button>
              <button
                onClick={() => jumpToGameSandboxRound(2)}
                className={`px-2.5 py-1 rounded font-bold transition ${gameRound === 2 ? 'bg-amber-500 text-slate-950' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'}`}
              >
                Màn 2
              </button>
              <button
                onClick={() => jumpToGameSandboxRound(3)}
                className={`px-2.5 py-1 rounded font-bold transition ${gameRound === 3 ? 'bg-pink-500 text-white' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'}`}
              >
                Màn 3
              </button>
              <button
                onClick={() => setShowVocabModal(true)}
                className="bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 px-2.5 py-1 rounded font-bold transition"
              >
                Sửa Kho Từ
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
                  {gameRound === 1 ? 'VÒNG 1/3: NHẬN DIỆN' : gameRound === 2 ? 'VÒNG 2/3: GÕ TỪ KHUYẾT' : 'VÒNG 3/3: BOSS IPA'}
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
                    isFrozenBoost
                      ? 'bg-sky-500/25 text-sky-200 border-sky-400 animate-pulse'
                      : isLowTime
                      ? 'bg-rose-500/20 text-rose-300 border-rose-500/50 animate-pulse'
                      : isMidTime
                      ? 'bg-amber-500/20 text-amber-300 border-amber-500/50'
                      : 'bg-cyan-500/15 text-cyan-300 border-cyan-500/30'
                  }`}
                >
                  <Clock className="w-3.5 h-3.5" /> {gameTimeLeft}s
                </span>
                {gameCombo >= 3 && (
                  <span className="px-2 py-0.5 rounded-lg bg-gradient-to-r from-amber-500 to-rose-500 text-slate-950 font-black text-[11px] animate-pulse">
                    🔥 FEVER x2
                  </span>
                )}
                <span className="text-amber-400 font-extrabold text-xs sm:text-sm">Combo: {gameCombo}</span>
                <span className="text-cyan-400 font-extrabold text-xs sm:text-sm tabular-nums">Điểm: {gameScore}</span>
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
                  <button
                    type="button"
                    onClick={handleUseFreezePowerup}
                    disabled={freezeCharges <= 0 || gamePaused}
                    className={`px-2.5 py-0.5 rounded text-[11px] font-bold flex items-center gap-1 transition border ${
                      freezeCharges > 0 && !gamePaused
                        ? 'bg-sky-500/20 hover:bg-sky-500/30 text-sky-300 border-sky-400/40'
                        : 'bg-slate-800/60 text-slate-500 border-slate-700 cursor-not-allowed'
                    }`}
                    title="Đóng băng thời gian & làm chậm Boss (+8 giây) — Phím tắt [2]"
                  >
                    <Snowflake className="w-3 h-3" /> Đóng băng +8s [2] ({freezeCharges})
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
                        {showMobileKeyboard ? 'Ẩn phím' : 'Phím ảo'}
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

                {/* Optional On-Screen Keyboard */}
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

        {/* Game Canvas Container */}
        <div className="flex-1 min-h-0 w-full max-w-4xl mx-auto px-2 sm:px-0 py-1.5">
          <div className="relative w-full h-full rounded-2xl border border-slate-800 bg-slate-950 overflow-hidden shadow-2xl">
            <canvas ref={canvasRef} className="absolute inset-0 w-full h-full cursor-crosshair block touch-none" />

            {/* Sandbox Pause Overlay */}
            {gamePaused && gameSubState === 'PLAYING' && (
              <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm z-30 flex flex-col items-center justify-center p-6 text-center">
                <p className="text-xs font-extrabold uppercase tracking-widest text-amber-400 mb-2">Chế độ Giảng Bài GV</p>
                <h3 className="text-2xl font-black text-white mb-4">ĐANG TẠM DỪNG</h3>
                <button
                  type="button"
                  onClick={handleToggleGamePause}
                  className="px-6 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-extrabold text-sm transition flex items-center gap-2"
                >
                  <Play className="w-4 h-4" /> Tiếp Tục Chơi
                </button>
              </div>
            )}

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
                <h2 className="text-xl sm:text-2xl font-extrabold text-amber-400 mb-2">HOÀN THÀNH VÒNG {gameRound}/3!</h2>
                <p className="text-xs sm:text-sm text-slate-300 max-w-md mb-3 leading-relaxed">
                  Chuẩn bị bước sang <b>Vòng {gameRound + 1}</b> với <b>bộ từ vựng mới</b> (giới hạn {getSpeedAdjustedTimeLimit(gameRound + 1, room.speedMode || 'normal')} giây/từ)!
                </p>
                <p className="text-xs font-mono text-cyan-300 mb-5">
                  Tự động bắt đầu sau {transitionCountdown} giây...
                </p>
                <button
                  onClick={advanceNextGameRound}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold px-6 py-3 rounded-xl transition shadow-lg"
                >
                  VÀO NGAY VÒNG TIẾP THEO
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
                    ? `HẾT MẠNG TẠI VÒNG ${gameRound}`
                    : isSandboxRound
                    ? `HOÀN THÀNH MÀN ${gameRound} (GV)`
                    : 'TỔNG KẾT KẾT QUẢ ĐẤU TRƯỜNG'}
                </h2>
                <p className="text-xs text-slate-300 mb-4">
                  Điểm số: <b className="text-amber-400 text-base">{gameScore} điểm</b> • Đạt: <b className="text-emerald-400">{passedWordsCount}/{gameReviewLog.length} từ</b> • Đã lưu vào Bảng Xếp Hạng!
                </p>

                {/* Live Room Top 5 Standings at End of Match */}
                {(() => {
                  const matchEntries = Object.values(room.liveMatch || {});
                  const topStandings = (
                    matchEntries.length > 0
                      ? [...matchEntries].sort((a, b) => (b.score || 0) - (a.score || 0))
                      : leaderboardPlayers
                  ).slice(0, 5);
                  if (topStandings.length === 0) return null;
                  return (
                    <div className="max-w-xl w-full bg-slate-900/90 border border-indigo-500/30 rounded-xl p-3 mb-3 text-left text-xs">
                      <p className="text-[11px] font-extrabold uppercase tracking-wider text-amber-300 mb-2 flex items-center gap-1.5">
                        <Trophy className="w-3.5 h-3.5" /> Bảng Xếp Hạng Phòng #{activePin} (Top {topStandings.length})
                      </p>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                        {topStandings.map((st, sIdx) => {
                          const isMe = st.username === currentUser?.username || st.name === currentUser?.name;
                          return (
                            <div
                              key={st.username || st.name || sIdx}
                              className={`flex items-center justify-between px-2.5 py-1.5 rounded-lg border ${
                                isMe
                                  ? 'bg-cyan-500/15 border-cyan-400/50 text-cyan-200'
                                  : 'bg-slate-950/70 border-slate-800 text-slate-200'
                              }`}
                            >
                              <span className="truncate font-semibold">
                                #{sIdx + 1} {st.name || st.username} {isMe ? '(Bạn)' : ''}
                              </span>
                              <span className="font-mono font-extrabold text-amber-300 ml-2 shrink-0">{st.score || 0}đ</span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })()}

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
                            {item.passed ? 'Đạt' : 'Cần ôn'}
                          </span>
                          <b className="text-cyan-300">{item.word}</b>
                          <span className="text-slate-400 font-mono">{item.ipa}</span>
                          <button
                            type="button"
                            onClick={() => speakWord(item.word)}
                            className="ml-auto p-1 rounded-md bg-slate-800 hover:bg-cyan-500/20 text-cyan-300 transition"
                            title={`Nghe phát âm "${item.word}"`}
                          >
                            <Volume2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                        <p className="text-slate-300 mt-0.5">{item.prompt}</p>
                        <p className="text-[11px] text-slate-500 italic mt-0.5">"{item.example}"</p>
                      </div>
                    ))
                  )}
                </div>

                <div className="flex gap-3 flex-wrap justify-center">
                  {isTeacher ? (
                    <>
                      <button
                        onClick={() => handleTeacherResetLobby(activePin)}
                        className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold px-5 py-2.5 rounded-xl transition shadow flex items-center gap-2"
                      >
                        <RefreshCw className="w-4 h-4" /> Mở Sảnh Chờ Ván Mới
                      </button>
                      <button
                        onClick={() => initGameCampaign(activePin, currentUser)}
                        className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-5 py-2.5 rounded-xl transition shadow"
                      >
                        Chơi Thử Lại (GV)
                      </button>
                    </>
                  ) : (
                    <button
                      onClick={() => {
                        setGameSubState('LOBBY');
                        gameRuntimeRef.current.subState = 'LOBBY';
                      }}
                      className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold px-5 py-2.5 rounded-xl transition shadow flex items-center gap-2"
                    >
                      <Rocket className="w-4 h-4" /> Quay Lại Sảnh Chờ Phòng
                    </button>
                  )}
                  <button
                    onClick={exitGame}
                    className="bg-slate-800 hover:bg-slate-700 text-white font-bold px-4 py-2.5 rounded-xl transition border border-slate-700"
                  >
                    {isTeacher ? 'Về Quản Trị' : 'Về Trang Chủ'}
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

    const cfg = normalizeExamConfig(activeTest);
    const currentSectionIdx =
      typeof examState.sectionIdx === 'number'
        ? Math.min(Math.max(0, examState.sectionIdx), cfg.order.length - 1)
        : Math.max(0, cfg.order.indexOf(examState.skill));
    const skillMeta = {
      listening: { label: 'Listening', icon: Headphones },
      reading: { label: 'Reading', icon: BookOpen },
      writing: { label: 'Writing', icon: PenTool }
    };
    const readingPassages = getReadingPassages(activeTest.reading);
    const safePassageIdx = Math.min(Math.max(0, examState.readingPassageIdx || 0), readingPassages.length - 1);
    const activePassage = readingPassages[safePassageIdx];
    const allReadingQs = activeTest.reading?.questions || [];
    const hasScopedReadingQs = allReadingQs.some(q => typeof q.passageIdx === 'number');
    const displayedReadingQs =
      readingPassages.length > 1 && hasScopedReadingQs && !examState.showAllReadingQs
        ? allReadingQs.filter(q => typeof q.passageIdx !== 'number' || q.passageIdx === safePassageIdx)
        : allReadingQs;

    const formatTime = (seconds) => {
      const m = Math.floor(seconds / 60);
      const s = seconds % 60;
      return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    };

    return (
      <div className="min-h-screen bg-slate-100 dark:bg-slate-950 flex flex-col justify-between select-none">
        {/* Exam Header */}
        <header className="bg-slate-900 dark:bg-slate-950 text-white px-4 sm:px-6 py-3 flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 shadow sticky top-0 z-50">
          <div className="flex items-center gap-3 flex-wrap">
            <h2 className="font-bold text-sm md:text-base text-slate-100">{activeTest.title}</h2>
            <span className="text-[11px] bg-slate-800 text-slate-300 px-2.5 py-1 rounded border border-slate-700 uppercase font-bold">
              Phần {currentSectionIdx + 1}/{cfg.order.length}: {examState.skill}
            </span>
          </div>

          {/* Skill Selector Tabs (Sequential order respected when enabled) */}
          <div className="flex bg-slate-800 p-1 rounded-xl text-xs gap-1 flex-wrap">
            {cfg.order.map((sId, idx) => {
              const meta = skillMeta[sId] || { label: sId, icon: BookOpen };
              const IconComp = meta.icon;
              const isCurrent = examState.skill === sId && idx === currentSectionIdx;
              const isDone = cfg.sequentialMode && idx < currentSectionIdx;
              const isLocked = cfg.sequentialMode && idx !== currentSectionIdx;

              return (
                <button
                  key={sId}
                  type="button"
                  disabled={isLocked}
                  title={
                    isLocked
                      ? `Chế độ làm tuần tự: Hết giờ ${skillMeta[examState.skill]?.label || ''} hệ thống sẽ tự động chuyển phần.`
                      : `Kỹ năng ${meta.label} (${cfg.durations[sId]} phút)`
                  }
                  onClick={() => {
                    if (isLocked || isCurrent) return;
                    stopExamAudio();
                    setExamState(prev => ({
                      ...prev,
                      skill: sId,
                      sectionIdx: idx
                    }));
                  }}
                  className={`px-3 py-1.5 rounded-lg font-bold flex items-center gap-1.5 transition ${
                    isCurrent
                      ? 'bg-blue-600 text-white shadow'
                      : isDone
                      ? 'text-emerald-400/80 bg-slate-900/50 cursor-not-allowed'
                      : isLocked
                      ? 'text-slate-500 cursor-not-allowed'
                      : 'text-slate-300 hover:text-white hover:bg-slate-700'
                  }`}
                >
                  <span className="text-[10px] font-mono opacity-80">{idx + 1}.</span>
                  <IconComp className="w-3.5 h-3.5" />
                  <span>{meta.label}</span>
                  <span className="text-[10px] opacity-75">({cfg.durations[sId]}p)</span>
                  {isLocked && !isDone && <Lock className="w-3 h-3 text-slate-500" />}
                  {isDone && <Check className="w-3 h-3 text-emerald-400" />}
                </button>
              );
            })}
          </div>

          <div className="flex items-center gap-2.5 sm:gap-3 flex-wrap">
            {cfg.sequentialMode && cfg.allowEarlyNextSection && currentSectionIdx < cfg.order.length - 1 && (
              <button
                type="button"
                onClick={() => advanceToNextExamSection(false)}
                className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs px-3 py-2 rounded-lg transition shadow flex items-center gap-1"
              >
                <span>Sang Phần Tiếp Theo</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            )}

            <button
              type="button"
              onClick={() => setDarkMode(d => !d)}
              className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition"
              title={darkMode ? 'Chế độ Sáng' : 'Chế độ Tối'}
              aria-label={darkMode ? 'Chế độ Sáng' : 'Chế độ Tối'}
            >
              {darkMode ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-slate-300" />}
            </button>

            <div
              className={`flex items-center gap-2 font-mono font-bold text-lg bg-slate-800 px-3 py-1 rounded-lg border ${
                examState.timeRemaining <= 60
                  ? 'text-rose-400 border-rose-500/60'
                  : 'text-amber-400 border-slate-700'
              }`}
              title={cfg.sequentialMode ? 'Hết giờ kỹ năng sẽ tự động chuyển sang phần tiếp theo' : 'Thời gian còn lại'}
            >
              <Clock className="w-4 h-4 animate-pulse" />
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
                {/* Multi-Passage Switcher Buttons (1, 2, 3...) */}
                <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-slate-200 dark:border-slate-800 mb-3">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    {readingPassages.map((p, pIdx) => (
                      <button
                        key={p.id || pIdx}
                        type="button"
                        onClick={() => setExamState(prev => ({ ...prev, readingPassageIdx: pIdx }))}
                        className={`px-3 py-1.5 rounded-xl text-xs font-extrabold transition flex items-center gap-1.5 border ${
                          pIdx === safePassageIdx
                            ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm'
                            : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-indigo-50 dark:hover:bg-indigo-500/15'
                        }`}
                      >
                        <span className={`w-5 h-5 rounded-full text-[11px] font-black flex items-center justify-center ${
                          pIdx === safePassageIdx ? 'bg-white text-indigo-600' : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200'
                        }`}>
                          {pIdx + 1}
                        </span>
                        <span className="max-w-[140px] truncate">{p.title || `Bài ${pIdx + 1}`}</span>
                      </button>
                    ))}
                  </div>

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

                <h3 className="font-bold text-slate-900 dark:text-white text-base mb-3">
                  {readingPassages.length > 1 ? `Bài ${safePassageIdx + 1}: ` : ''}{activePassage?.title}
                </h3>

                <div
                  onMouseUp={handlePassageTextSelect}
                  className="flex-1 overflow-y-auto pr-3 text-slate-700 dark:text-slate-200 text-sm leading-relaxed whitespace-pre-line select-text font-serif"
                >
                  {activePassage?.imageUrl && (
                    <div className="mb-4 rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 p-2 relative group">
                      <img
                        src={activePassage.imageUrl}
                        alt={`Reading Passage ${safePassageIdx + 1}`}
                        onClick={() => setZoomedReadingImg(activePassage.imageUrl)}
                        className="w-full max-h-[52vh] object-contain rounded-lg mx-auto cursor-zoom-in"
                      />
                      <button
                        type="button"
                        onClick={() => setZoomedReadingImg(activePassage.imageUrl)}
                        className="mt-2 mx-auto flex items-center gap-1.5 text-[11px] font-bold text-indigo-600 dark:text-indigo-400 hover:underline"
                      >
                        <Eye className="w-3.5 h-3.5" /> Phóng to ảnh bài đọc #{safePassageIdx + 1}
                      </button>
                    </div>
                  )}
                  {activePassage?.passageText}
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

              <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 flex flex-col overflow-y-auto shadow-sm space-y-5">
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 dark:border-slate-800 pb-3">
                  <h3 className="font-bold text-slate-800 dark:text-white text-base">
                    Câu Hỏi Phần Reading {readingPassages.length > 1 && hasScopedReadingQs && !examState.showAllReadingQs ? `(Bài ${safePassageIdx + 1})` : ''}
                  </h3>
                  {readingPassages.length > 1 && hasScopedReadingQs && (
                    <button
                      type="button"
                      onClick={() => setExamState(prev => ({ ...prev, showAllReadingQs: !prev.showAllReadingQs }))}
                      className="text-[11px] font-bold px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 transition"
                    >
                      {examState.showAllReadingQs ? `Chỉ xem Bài ${safePassageIdx + 1}` : `Xem tất cả (${allReadingQs.length})`}
                    </button>
                  )}
                </div>

                {displayedReadingQs.length === 0 ? (
                  <p className="text-xs text-slate-500 dark:text-slate-400 italic py-6 text-center">
                    Chưa có câu hỏi gắn riêng cho Bài {safePassageIdx + 1}. Hãy chuyển bài đọc hoặc bấm "Xem tất cả".
                  </p>
                ) : (
                  displayedReadingQs.map(q => (
                    <div key={q.id} className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
                      <div className="flex items-start justify-between gap-2 mb-3">
                        <p className="font-bold text-slate-800 dark:text-slate-100 text-sm">{q.question}</p>
                        {typeof q.passageIdx === 'number' && readingPassages.length > 1 && (
                          <button
                            type="button"
                            onClick={() => setExamState(prev => ({ ...prev, readingPassageIdx: q.passageIdx }))}
                            className="shrink-0 text-[10px] font-bold px-2 py-0.5 rounded bg-indigo-50 dark:bg-indigo-500/20 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-500/30"
                          >
                            Bài {q.passageIdx + 1}
                          </button>
                        )}
                      </div>

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
                  ))
                )}
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

    const renderWritingCriteriaBox = (label, band, criteria, colorClass, firstCriterionKey, firstCriterionLabel) => (
      <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
        <div className="flex justify-between items-center mb-2">
          <span className={`font-bold text-xs flex items-center gap-1.5 ${colorClass}`}>
            <PenTool className="w-3.5 h-3.5" /> {label}: Band {band}
          </span>
          <span className="text-[10px] text-slate-400 font-semibold uppercase">4 Tiêu chí IELTS</span>
        </div>
        {criteria && (
          <div className="grid grid-cols-4 gap-1 text-center py-2 bg-slate-50 dark:bg-slate-800 rounded text-[11px] mb-2 font-mono text-slate-900 dark:text-slate-100">
            <div><span className="text-[9px] text-slate-400 block font-sans">{firstCriterionLabel}</span><strong>{criteria[firstCriterionKey]}</strong></div>
            <div><span className="text-[9px] text-slate-400 block font-sans">CC</span><strong>{criteria.cc}</strong></div>
            <div><span className="text-[9px] text-slate-400 block font-sans">LR</span><strong>{criteria.lr}</strong></div>
            <div><span className="text-[9px] text-slate-400 block font-sans">GRA</span><strong>{criteria.gra}</strong></div>
          </div>
        )}
        <p className="text-[11px] text-slate-600 dark:text-slate-300 leading-relaxed italic">{criteria?.comment}</p>
      </div>
    );

    const writingCriteriaGrid = attempt.aiDetails ? (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {renderWritingCriteriaBox('Task 1', attempt.scores.writing.task1Band, attempt.aiDetails.task1Criteria, 'text-blue-700 dark:text-blue-400', 'ta', 'TA')}
        {renderWritingCriteriaBox('Task 2', attempt.scores.writing.task2Band, attempt.aiDetails.task2Criteria, 'text-indigo-700 dark:text-indigo-400', 'tr', 'TR')}
      </div>
    ) : null;

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
                {isTeacher && attempt.aiGraded && (
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

          {/* WRITING EVALUATION CARD (TEACHER AI CONTROLS VS CLEAN STUDENT VIEW) */}
          {isTeacher ? (
            <div className="bg-gradient-to-r from-blue-50 via-indigo-50 to-purple-50 dark:from-indigo-950/60 dark:via-slate-900 dark:to-purple-950/50 rounded-2xl border border-indigo-100 dark:border-indigo-500/30 p-6 mb-8 shadow-sm">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="bg-indigo-600 text-white text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded-full flex items-center gap-1 shadow-sm">
                      <Sparkles className="w-3 h-3 text-amber-300" /> AI Examiner (GV)
                    </span>
                    <h3 className="font-bold text-slate-900 dark:text-white text-base">Công Cụ Chấm Điểm Writing Tự Động Bằng AI</h3>
                  </div>
                  <p className="text-xs text-slate-600 dark:text-slate-300 max-w-xl leading-relaxed">
                    Dành riêng cho Giáo viên: Đánh giá nhanh bài viết theo 4 tiêu chí chuẩn IDP/BC (TA/TR, CC, LR, GRA) qua Gemini API.
                  </p>
                </div>

                <div className="flex items-center gap-2.5">
                  <button
                    onClick={() => { setApiTestState({ testing: false, ok: null, message: '', model: '' }); setShowApiKeyModal(true); }}
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

              {/* Detailed Criteria Breakdown */}
              {writingCriteriaGrid && !isGradingAI && (
                <div className="mt-6 pt-6 border-t border-indigo-200/60 dark:border-indigo-500/30 space-y-4">
                  {writingCriteriaGrid}
                </div>
              )}
            </div>
          ) : (
            <div className="bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200 dark:border-slate-700 p-5 mb-8">
              {!attempt.scores.writing.overallBand ? (
                <div className="flex items-center gap-3.5">
                  <div className="w-10 h-10 rounded-xl bg-amber-100 dark:bg-amber-500/20 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
                    <Clock className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900 dark:text-white text-sm">Phần thi Writing đang chờ Giáo viên chấm điểm</h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                      Bài viết Task 1 & Task 2 của bạn đã được lưu lại an toàn. Điểm và nhận xét sẽ hiển thị sau khi Giáo viên hoàn tất chấm bài.
                    </p>
                  </div>
                </div>
              ) : writingCriteriaGrid ? (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="font-bold text-slate-900 dark:text-white text-sm flex items-center gap-2">
                      <PenTool className="w-4 h-4 text-emerald-600 dark:text-emerald-400" /> Bảng Điểm Chi Tiết Phần Thi Writing
                    </h3>
                    <span className="text-[11px] font-semibold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-500/15 px-2.5 py-1 rounded-full border border-emerald-200 dark:border-emerald-500/30">
                      Đã công bố điểm
                    </span>
                  </div>
                  {writingCriteriaGrid}
                </div>
              ) : (
                <div className="flex items-center gap-3">
                  <CheckCircle className="w-5 h-5 text-emerald-500 shrink-0" />
                  <p className="text-xs font-semibold text-slate-700 dark:text-slate-200">
                    Phần thi Writing đã được chấm: Overall Writing Band <strong>{attempt.scores.writing.overallBand}</strong>.
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Feedback */}
          {attempt.teacherFeedback && (
            <div className="bg-amber-50 dark:bg-amber-500/10 rounded-2xl p-6 border border-amber-200 dark:border-amber-500/30 mb-8">
              <h3 className="font-bold text-amber-900 dark:text-amber-300 text-sm mb-2 flex items-center gap-2">
                <MessageSquare className="w-4 h-4 text-amber-600 dark:text-amber-400" /> {isTeacher && attempt.aiGraded ? 'Nhận Xét Từ AI Examiner' : 'Nhận Xét Từ Giáo Viên'}
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
                      <span>Đáp án đúng & kết quả đúng/sai từng câu đang khóa (Chờ Giáo viên bật cho phép)</span>
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
                  const isCorrect = isObjectiveAnswerCorrect(q, userAns);

                  return (
                    <div
                      key={q.id}
                      className={`p-5 rounded-2xl border transition ${
                        !canShowCorrectAnswers
                          ? 'bg-slate-50/70 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700'
                          : isCorrect
                          ? 'bg-emerald-50/40 dark:bg-emerald-500/10 border-emerald-200 dark:border-emerald-500/30'
                          : 'bg-rose-50/40 dark:bg-rose-500/10 border-rose-200 dark:border-rose-500/30'
                      }`}
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
                        <span className="font-bold text-slate-900 dark:text-white text-sm">
                          Câu {idx + 1}: {q.question}
                        </span>
                        {canShowCorrectAnswers ? (
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
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold w-fit bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                            <EyeOff className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" /> Đã ghi nhận câu trả lời
                          </span>
                        )}
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                        {/* Student's Answer */}
                        <div className="bg-white dark:bg-slate-900 p-3.5 rounded-xl border border-slate-200 dark:border-slate-700">
                          <span className="text-[10px] font-bold uppercase text-slate-400 block mb-1">
                            Câu trả lời của thí sinh:
                          </span>
                          <span className={`font-bold ${
                            !canShowCorrectAnswers
                              ? 'text-slate-800 dark:text-slate-100'
                              : isCorrect
                              ? 'text-emerald-700 dark:text-emerald-400'
                              : 'text-rose-700 dark:text-rose-400'
                          }`}>
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
                              Giáo viên chưa bật hiển thị đáp án & kết quả đúng/sai
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
              <div className="shrink-0 flex flex-col items-center">
                <UserAvatarBadge user={student} sizeClass="w-20 h-20" textClass="text-3xl" rounded="rounded-2xl" />
                {student.username === currentUser?.username && (
                  <button
                    type="button"
                    onClick={() => setShowAvatarModal(true)}
                    className="mt-2 px-2.5 py-1 rounded-lg bg-white/15 hover:bg-white/25 border border-white/25 text-[11px] font-bold text-white flex items-center gap-1 transition"
                  >
                    <Camera className="w-3 h-3" /> Đổi Avatar
                  </button>
                )}
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
                  <span className="flex items-center gap-1.5 text-amber-300">
                    <Target className="w-3.5 h-3.5 text-amber-400" /> Mục tiêu Target: <b>Band {student.targetBand || '8.0'}</b>
                    {(isTeacherViewer || student.username === currentUser?.username) && (
                      <button
                        type="button"
                        onClick={() =>
                          setEditingTargetUser({
                            username: student.username,
                            name: student.name || '',
                            targetBand: student.targetBand || 7.5,
                            studyGoal: student.studyGoal || ''
                          })
                        }
                        className="ml-1 inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-amber-400/20 hover:bg-amber-400/35 border border-amber-300/40 text-amber-200 text-[11px] font-bold transition"
                      >
                        <Edit className="w-3 h-3" /> Chỉnh
                      </button>
                    )}
                  </span>
                  {student.studyGoal && (
                    <span className="text-xs text-cyan-200 bg-white/10 px-2.5 py-0.5 rounded-full border border-white/15">
                      🎯 {student.studyGoal}
                    </span>
                  )}
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
                            Xem Chi Tiết
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
                    dispatchSyncAction('UPSERT_NOTE', { username: activeUsername, text: textToSave });
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
                if (isTeacherViewer) {
                  handleTeacherOpenLobby(currentRoomPin);
                } else {
                  openStudentGamePortal();
                }
              }}
              className="bg-gradient-to-r from-pink-500 to-purple-500 hover:from-pink-600 hover:to-purple-600 text-white font-bold text-xs px-4 py-2 rounded-xl transition shadow flex items-center gap-1.5"
            >
              <Play className="w-3.5 h-3.5 fill-white" /> Vào Sảnh Chờ Đấu Trường
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-purple-950/60 rounded-2xl p-4 border border-purple-700/50">
              <p className="text-[11px] text-purple-300 font-bold uppercase">Điểm Kỷ Lục Phòng Game</p>
              <p className="text-2xl font-black text-amber-300 font-mono mt-1">
                {playerGameRecord ? `${playerGameRecord.score} pts` : '0 pts'}
              </p>
            </div>

            <div className="bg-purple-950/60 rounded-2xl p-4 border border-purple-700/50">
              <p className="text-[11px] text-purple-300 font-bold uppercase">Cấp Độ Cao Nhất Đạt Được</p>
              <p className="text-sm font-extrabold text-cyan-300 mt-1">
                {playerGameRecord?.status || 'Chưa tham gia trận đấu nào'}
              </p>
            </div>

            <div className="bg-purple-950/60 rounded-2xl p-4 border border-purple-700/50">
              <p className="text-[11px] text-purple-300 font-bold uppercase">Chuỗi Combo Từ Đúng</p>
              <p className="text-2xl font-black text-pink-400 font-mono mt-1">
                {playerGameRecord ? `${playerGameRecord.streak}x Combo` : '0x Combo'}
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
    const room = normalizeRoomObject(roomsDb[currentRoomPin] || { pin: currentRoomPin, pass: 'ielts', players: {} }, currentRoomPin);
    const allRoomsList = Object.values(roomsDb || {}).map(r => normalizeRoomObject(r, r.pin));
    const lobbyPlayersList = Object.values(room.lobbyPlayers || {});
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

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => openExamBuilder()}
              className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold px-4 py-2.5 rounded-xl shadow transition flex items-center gap-2"
            >
              <Plus className="w-4 h-4" /> Tạo Đề Thi Mới
            </button>
            <button
              onClick={() => handleTeacherOpenLobby(currentRoomPin)}
              className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold px-4 py-2.5 rounded-xl shadow transition flex items-center gap-2"
            >
              <Rocket className="w-4 h-4" /> Sảnh Chờ Game PIN ({currentRoomPin})
            </button>
            <button
              onClick={() => {
                setCustomVocabInput(room.rawVocab || DEFAULT_VOCAB_TEXT);
                setShowVocabModal(true);
              }}
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
            {tests.map(t => {
              const cfg = normalizeExamConfig(t);
              const passagesCount = getReadingPassages(t.reading).length;
              const isPrivate = cfg.visibility === 'private';
              const hasReadingImg = getReadingPassages(t.reading).some(p => !!p.imageUrl);

              return (
              <div key={t.id} className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-sm hover:shadow-md transition flex flex-col justify-between">
                <div>
                  <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
                    <span className="text-[11px] bg-indigo-50 dark:bg-indigo-500/15 text-indigo-700 dark:text-indigo-300 font-bold px-2.5 py-1 rounded-lg border border-indigo-100 dark:border-indigo-500/30">
                      Listening: {t.listening?.questions?.length || 0} • Reading: {t.reading?.questions?.length || 0}
                    </span>
                    <button
                      onClick={() => toggleTestVisibility(t.id)}
                      title="Bấm để chuyển Công khai / Chỉ mình tôi thấy"
                      className={`text-[11px] font-bold px-2.5 py-1 rounded-lg flex items-center gap-1 transition border ${
                        isPrivate
                          ? 'bg-amber-50 dark:bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-500/30 hover:bg-amber-100'
                          : 'bg-emerald-50 dark:bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-500/30 hover:bg-emerald-100'
                      }`}
                    >
                      {isPrivate ? <EyeOff className="w-3 h-3" /> : <Globe className="w-3 h-3" />}
                      {isPrivate ? 'Chỉ mình tôi' : 'Công khai'}
                    </button>
                  </div>
                  <h3 className="font-bold text-slate-900 dark:text-white text-base mb-2 leading-snug">{t.title}</h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mb-3 line-clamp-2 leading-relaxed">{t.description}</p>

                  {/* Exam Config Summary Badges */}
                  <div className="flex flex-wrap gap-1.5 mb-3">
                    <span className="text-[10px] bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 font-bold px-2 py-0.5 rounded-md">
                      ⏱ {cfg.durations.listening}p L • {cfg.durations.reading}p R • {cfg.durations.writing}p W
                    </span>
                    <span className="text-[10px] bg-indigo-50 dark:bg-indigo-500/15 text-indigo-700 dark:text-indigo-300 font-bold px-2 py-0.5 rounded-md">
                      {cfg.maxAttempts === 0 ? '∞ Làm tự do' : `🔒 Tối đa ${cfg.maxAttempts} lần`}
                    </span>
                    {cfg.sequentialMode && (
                      <span className="text-[10px] bg-amber-50 dark:bg-amber-500/15 text-amber-700 dark:text-amber-300 font-bold px-2 py-0.5 rounded-md">
                        Tuần tự: {cfg.order.map(s => s[0].toUpperCase()).join('→')}
                      </span>
                    )}
                  </div>

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
                    {(hasReadingImg || passagesCount > 1) && (
                      <span className="text-[10px] bg-emerald-50 dark:bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 font-bold px-2 py-0.5 rounded-md border border-emerald-200 dark:border-emerald-500/30">
                        🖼️ {passagesCount} bài Reading
                      </span>
                    )}
                    {t.writing?.task1?.imageUrl && (
                      <span className="text-[10px] bg-purple-50 dark:bg-purple-500/15 text-purple-700 dark:text-purple-300 font-bold px-2 py-0.5 rounded-md border border-purple-200 dark:border-purple-500/30">
                        📊 Có biểu đồ Task 1
                      </span>
                    )}
                  </div>

                  {/* Inline Quick Controls: Per-Skill Durations */}
                  <div className="p-3 rounded-2xl bg-indigo-50/60 dark:bg-indigo-500/10 border border-indigo-200/80 dark:border-indigo-500/30 mb-3 space-y-2">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-[11px] font-extrabold text-indigo-900 dark:text-indigo-200 flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" /> Thời gian từng phần (phút)
                      </span>
                      <button
                        type="button"
                        onClick={() => openExamBuilder(t, 'general')}
                        className="text-[10px] font-bold text-indigo-700 dark:text-indigo-300 hover:underline"
                      >
                        Thứ tự & Tuần tự →
                      </button>
                    </div>
                    <div className="grid grid-cols-3 gap-1.5">
                      {cfg.order.map((sId, sIdx) => (
                        <div key={sId} className="bg-white dark:bg-slate-900 rounded-xl p-1.5 border border-indigo-100 dark:border-slate-700 text-center">
                          <span className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase">
                            {sIdx + 1}. {sId === 'listening' ? 'Nghe' : sId === 'reading' ? 'Đọc' : 'Viết'}
                          </span>
                          <div className="flex items-center justify-center gap-0.5 mt-0.5">
                            <input
                              key={`${t.id}-${sId}-${cfg.durations[sId]}`}
                              type="number"
                              min={1}
                              max={180}
                              defaultValue={cfg.durations[sId]}
                              onBlur={e => {
                                const parsed = Math.max(1, Math.min(180, Number(e.target.value) || cfg.durations[sId]));
                                e.target.value = String(parsed);
                                if (parsed !== cfg.durations[sId]) {
                                  updateTestQuickDuration(t.id, sId, parsed);
                                }
                              }}
                              onKeyDown={e => {
                                if (e.key === 'Enter') e.currentTarget.blur();
                              }}
                              title="Nhập số phút rồi bấm ra ngoài hoặc nhấn Enter để lưu"
                              className="w-12 px-1 py-0.5 text-center bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-extrabold text-slate-900 dark:text-white"
                            />
                            <span className="text-[10px] text-slate-400 font-bold">p</span>
                          </div>
                        </div>
                      ))}
                    </div>
                    <p className="text-[10px] text-indigo-700/80 dark:text-indigo-300/80 font-medium">
                      {cfg.sequentialMode
                        ? 'Hết giờ từng phần sẽ tự động chuyển sang phần tiếp theo.'
                        : 'Đang cho phép chuyển tự do giữa các phần.'}
                    </p>
                  </div>

                  {/* Quick Toggle Visibility (Ẩn / Công khai) */}
                  <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/70 border border-slate-200/80 dark:border-slate-700 mb-2.5 flex items-center justify-between gap-2">
                    <div>
                      <p className="text-[11px] font-bold text-slate-800 dark:text-slate-100">Hiển thị đề cho học sinh</p>
                      <p className="text-[10px] text-slate-500 dark:text-slate-400">
                        {isPrivate ? 'Đang ẩn — HS chưa thấy để tránh làm nhầm' : 'Công khai — HS thấy đề & làm bài được'}
                      </p>
                    </div>
                    <button
                      onClick={() => toggleTestVisibility(t.id)}
                      className={`px-3 py-1.5 rounded-xl text-[11px] font-extrabold flex items-center gap-1 transition shadow-sm flex-shrink-0 ${
                        isPrivate
                          ? 'bg-amber-600 hover:bg-amber-700 text-white'
                          : 'bg-emerald-600 hover:bg-emerald-700 text-white'
                      }`}
                    >
                      {isPrivate ? <EyeOff className="w-3.5 h-3.5" /> : <Globe className="w-3.5 h-3.5" />}
                      {isPrivate ? 'Đang Ẩn' : 'Công Khai'}
                    </button>
                  </div>

                  {/* Quick Toggle Practice vs Real Exam (Thi thử nhiều lần / Thi thật 1 lần) */}
                  <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/70 border border-slate-200/80 dark:border-slate-700 mb-2.5 flex items-center justify-between gap-2">
                    <div>
                      <p className="text-[11px] font-bold text-slate-800 dark:text-slate-100">Chế độ Thi thử / Thi thật</p>
                      <p className="text-[10px] text-slate-500 dark:text-slate-400">
                        {cfg.maxAttempts === 1
                          ? 'Thi thật: Học sinh chỉ được làm 1 lần'
                          : cfg.maxAttempts === 0
                          ? 'Thi thử: Được làm nhiều lần để ôn thi'
                          : `Giới hạn tối đa ${cfg.maxAttempts} lần làm`}
                      </p>
                    </div>
                    <button
                      onClick={() => toggleTestExamMode(t.id)}
                      className={`px-3 py-1.5 rounded-xl text-[11px] font-extrabold flex items-center gap-1 transition shadow-sm flex-shrink-0 ${
                        cfg.maxAttempts === 1
                          ? 'bg-rose-600 hover:bg-rose-700 text-white'
                          : 'bg-indigo-600 hover:bg-indigo-700 text-white'
                      }`}
                    >
                      {cfg.maxAttempts === 1 ? 'Thi Thật (1 lần)' : cfg.maxAttempts === 0 ? 'Thi Thử (Nhiều lần)' : `Tối đa ${cfg.maxAttempts} lần`}
                    </button>
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

                <div className="flex flex-wrap items-center justify-between gap-2 border-t border-slate-100 dark:border-slate-800 pt-3 text-xs">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <button
                      onClick={() => openExamBuilder(t, 'general')}
                      className="bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold px-2.5 py-1.5 rounded-xl transition flex items-center gap-1"
                    >
                      <Clock className="w-3.5 h-3.5" /> Cài Giờ & Thứ Tự
                    </button>
                    <button
                      onClick={() => openExamBuilder(t, 'reading')}
                      className="bg-indigo-50 dark:bg-indigo-500/15 hover:bg-indigo-100 dark:hover:bg-indigo-500/25 text-indigo-700 dark:text-indigo-300 font-bold px-2.5 py-1.5 rounded-xl transition flex items-center gap-1 border border-indigo-200 dark:border-indigo-500/30"
                    >
                      <Edit className="w-3.5 h-3.5" /> Soạn Câu Hỏi & Ảnh
                    </button>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => handleDuplicateTest(t)}
                      className="p-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-blue-50 dark:hover:bg-blue-500/15 text-slate-600 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-300 border border-slate-200 dark:border-slate-700 transition"
                      title="Nhân bản đề thi (Bản sao tự động ở chế độ Riêng tư)"
                    >
                      <Copy className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDeleteTest(t)}
                      className="p-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-rose-50 dark:hover:bg-rose-500/15 text-slate-600 dark:text-slate-300 hover:text-rose-600 dark:hover:text-rose-400 border border-slate-200 dark:border-slate-700 transition"
                      title="Xóa đề thi này"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
              );
            })}
          </div>
        )}

        {/* Tab 2: Giám Sát Gian Lận & Chấm Điểm */}
        {teacherHubTab === 'grading' && (() => {
          const pendingCount = attempts.filter(a => !a.teacherGraded).length;
          const highRiskCount = attempts.filter(a => (a.tabSwitchCount || 0) >= 3).length;
          const gradedBands = attempts.filter(a => typeof a.overallBand === 'number').map(a => a.overallBand);
          const avgBandDisplay = gradedBands.length > 0
            ? (gradedBands.reduce((acc, b) => acc + b, 0) / gradedBands.length).toFixed(1)
            : '-';

          const filteredAttempts = attempts.filter(att => {
            if (gradingFilters.testId !== 'all' && att.testId !== gradingFilters.testId) return false;
            if (gradingFilters.status === 'pending' && att.teacherGraded) return false;
            if (gradingFilters.status === 'graded' && !att.teacherGraded) return false;
            if (gradingFilters.risk === 'risk' && (att.tabSwitchCount || 0) < 3) return false;
            if (gradingFilters.search.trim()) {
              const q = gradingFilters.search.trim().toLowerCase();
              const hay = `${att.studentName || ''} ${att.studentId || ''} ${att.testTitle || ''}`.toLowerCase();
              if (!hay.includes(q)) return false;
            }
            return true;
          });

          const uniqueAttemptTests = Array.from(
            new Map(attempts.map(a => [a.testId, a.testTitle || a.testId])).entries()
          );

          return (
          <div className="space-y-4">
            {/* 4 Analytics KPI Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
              <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-4 shadow-sm">
                <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Tổng bài đã nộp</p>
                <p className="text-2xl font-black text-slate-900 dark:text-white mt-1 tabular-nums">{attempts.length}</p>
              </div>
              <div className="bg-white dark:bg-slate-900 rounded-2xl border border-amber-200 dark:border-amber-500/30 p-4 shadow-sm">
                <p className="text-[11px] font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400">Chờ chấm Writing</p>
                <p className="text-2xl font-black text-amber-600 dark:text-amber-300 mt-1 tabular-nums">{pendingCount}</p>
              </div>
              <div className="bg-white dark:bg-slate-900 rounded-2xl border border-blue-200 dark:border-blue-500/30 p-4 shadow-sm">
                <p className="text-[11px] font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400">Band TB toàn lớp</p>
                <p className="text-2xl font-black text-blue-600 dark:text-blue-300 mt-1 tabular-nums">{avgBandDisplay}</p>
              </div>
              <div className="bg-white dark:bg-slate-900 rounded-2xl border border-rose-200 dark:border-rose-500/30 p-4 shadow-sm">
                <p className="text-[11px] font-bold uppercase tracking-wider text-rose-600 dark:text-rose-400">Cảnh báo tab (≥3)</p>
                <p className="text-2xl font-black text-rose-600 dark:text-rose-400 mt-1 tabular-nums">{highRiskCount}</p>
              </div>
            </div>

            {/* Filter & CSV Export Bar */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-4 shadow-sm flex flex-wrap items-center justify-between gap-3">
              <div className="flex flex-wrap items-center gap-2 flex-1">
                <span className="inline-flex items-center gap-1 text-xs font-bold text-slate-500 dark:text-slate-400 mr-1">
                  <Filter className="w-3.5 h-3.5" /> Lọc:
                </span>
                <select
                  value={gradingFilters.testId}
                  onChange={e => setGradingFilters(prev => ({ ...prev, testId: e.target.value }))}
                  className="px-3 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-800 dark:text-slate-100 max-w-[200px]"
                >
                  <option value="all">Tất cả đề thi</option>
                  {uniqueAttemptTests.map(([tid, title]) => (
                    <option key={tid} value={tid}>{title}</option>
                  ))}
                </select>
                <select
                  value={gradingFilters.status}
                  onChange={e => setGradingFilters(prev => ({ ...prev, status: e.target.value }))}
                  className="px-3 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-800 dark:text-slate-100"
                >
                  <option value="all">Tất cả trạng thái</option>
                  <option value="pending">Chờ chấm Writing</option>
                  <option value="graded">Đã chấm xong</option>
                </select>
                <select
                  value={gradingFilters.risk}
                  onChange={e => setGradingFilters(prev => ({ ...prev, risk: e.target.value }))}
                  className="px-3 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-800 dark:text-slate-100"
                >
                  <option value="all">Mọi mức độ tab</option>
                  <option value="risk">Nghi gian lận (≥3 tab)</option>
                </select>
                <input
                  type="text"
                  placeholder="🔍 Tên học viên..."
                  value={gradingFilters.search}
                  onChange={e => setGradingFilters(prev => ({ ...prev, search: e.target.value }))}
                  className="px-3 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-800 dark:text-slate-100 w-44 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <button
                type="button"
                onClick={() => {
                  exportAttemptsToCsv(filteredAttempts);
                  showToast(`Đã xuất file CSV bảng điểm (${filteredAttempts.length} dòng)!`);
                }}
                className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center gap-1.5 transition shadow-sm shrink-0"
              >
                <Download className="w-3.5 h-3.5" /> Xuất CSV Excel ({filteredAttempts.length})
              </button>
            </div>

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
                  {filteredAttempts.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="px-6 py-10 text-center text-xs text-slate-400">
                        Không có bài nộp nào khớp bộ lọc hiện tại.{' '}
                        <button
                          type="button"
                          onClick={() => setGradingFilters({ testId: 'all', status: 'all', risk: 'all', search: '' })}
                          className="text-blue-600 dark:text-blue-400 font-bold underline ml-1"
                        >
                          Đặt lại bộ lọc
                        </button>
                      </td>
                    </tr>
                  ) : filteredAttempts.map(att => {
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
                          <div className="inline-flex items-center gap-1.5">
                            <button
                              onClick={() => {
                                setGradingAttempt(att);
                                setGradingScores({
                                  task1Band: att.scores.writing.task1Band || 6.0,
                                  task2Band: att.scores.writing.task2Band || 6.5,
                                  feedback: att.teacherFeedback || ''
                                });
                              }}
                              className="bg-blue-600 hover:bg-blue-700 text-white text-xs px-3 py-1.5 rounded-lg font-bold transition shadow-sm"
                            >
                              Chấm Bài & Chi Tiết
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeleteAttempt(att)}
                              className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-rose-50 dark:hover:bg-rose-500/15 text-slate-500 hover:text-rose-600 dark:text-slate-400 dark:hover:text-rose-400 border border-slate-200 dark:border-slate-700 transition"
                              title="Xóa lượt thi này để mở khóa cho học viên thi lại"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
          </div>
          );
        })()}

        {/* Tab 3: Phòng Đấu Game PIN & Leaderboard */}
        {teacherHubTab === 'game_room' && (
          <div className="space-y-6">
            {/* Room Switcher + Create Room */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-wrap items-center justify-between gap-3">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-xs font-bold text-slate-500 dark:text-slate-400 mr-1">Danh sách phòng:</span>
                {allRoomsList.map(r => {
                  const isActiveRoom = r.pin === currentRoomPin;
                  const rLobbyCount = Object.keys(r.lobbyPlayers || {}).length;
                  return (
                    <div key={r.pin} className="inline-flex items-center rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700">
                      <button
                        onClick={() => {
                          setCurrentRoomPin(r.pin);
                          setCustomVocabInput(r.rawVocab || DEFAULT_VOCAB_TEXT);
                        }}
                        className={`px-3 py-1.5 text-xs font-bold transition flex items-center gap-2 ${
                          isActiveRoom
                            ? 'bg-indigo-600 text-white shadow-sm'
                            : 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700'
                        }`}
                      >
                        <span className="font-mono">#{r.pin}</span>
                        <span className={`w-1.5 h-1.5 rounded-full ${r.status === 'PLAYING' ? 'bg-emerald-400' : 'bg-amber-400'}`} />
                        {rLobbyCount > 0 && (
                          <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${isActiveRoom ? 'bg-white/20 text-white' : 'bg-indigo-100 dark:bg-indigo-500/20 text-indigo-700 dark:text-indigo-300'}`}>
                            {rLobbyCount} chờ
                          </span>
                        )}
                      </button>
                      {allRoomsList.length > 1 && (
                        <button
                          type="button"
                          onClick={() => handleDeleteRoom(r.pin)}
                          className="px-2 py-1.5 bg-slate-100 dark:bg-slate-900 hover:bg-rose-600 text-slate-400 hover:text-white border-l border-slate-200 dark:border-slate-700 transition"
                          title={`Xóa phòng #${r.pin}`}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>

              <button
                onClick={() => setShowCreateRoomModal(true)}
                className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold px-3.5 py-2 rounded-xl transition shadow-sm flex items-center gap-1.5"
              >
                <Plus className="w-4 h-4" /> Tạo Phòng Mới
              </button>
            </div>

            {/* Dropship Room Hero */}
            <div className="bg-gradient-to-br from-slate-900 via-indigo-950 to-purple-950 rounded-3xl p-6 sm:p-7 text-white border border-indigo-500/30 shadow-xl flex flex-col lg:flex-row justify-between items-start lg:items-center gap-5">
              <div>
                <div className="flex flex-wrap items-center gap-2 mb-2">
                  <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-extrabold uppercase tracking-wider border ${
                    room.status === 'LOBBY'
                      ? 'bg-emerald-500/20 text-emerald-300 border-emerald-400/40'
                      : room.status === 'PLAYING'
                      ? 'bg-cyan-500/20 text-cyan-300 border-cyan-400/40'
                      : 'bg-slate-700/60 text-slate-300 border-slate-600'
                  }`}>
                    <Wifi className="w-3 h-3" />
                    {room.status === 'LOBBY' ? 'Đang Mở Sảnh Chờ (Lobby)' : room.status === 'PLAYING' ? 'Trận Đấu Đang Diễn Ra' : 'Đã Kết Thúc'}
                  </span>
                  <span className="text-xs font-bold text-indigo-200">{room.name}</span>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                  <div>
                    <p className="text-[10px] text-indigo-300 font-bold uppercase tracking-wider">Mã Phòng (PIN)</p>
                    <p className="text-3xl font-black text-amber-300 font-mono tracking-widest">{currentRoomPin}</p>
                  </div>
                  <button
                    onClick={() => {
                      navigator.clipboard?.writeText(currentRoomPin);
                      setCopiedRoomPin(true);
                      setTimeout(() => setCopiedRoomPin(false), 1800);
                      showToast(`Đã sao chép mã phòng ${currentRoomPin}!`);
                    }}
                    className="px-3 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-xs font-bold border border-white/15 flex items-center gap-1.5 transition"
                    title="Sao chép mã phòng"
                  >
                    {copiedRoomPin ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedRoomPin ? 'Đã chép' : 'Copy PIN'}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleCopyInviteLink(currentRoomPin)}
                    className="px-3 py-2 rounded-xl bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-200 text-xs font-bold border border-cyan-400/30 flex items-center gap-1.5 transition"
                    title="Sao chép Link mời học viên tự điền mã PIN"
                  >
                    <Share2 className="w-3.5 h-3.5" />
                    <span>Copy Link Mời</span>
                  </button>
                </div>

                <div className="flex flex-wrap items-center gap-3 text-xs text-slate-300 mt-2.5">
                  <span>Mật khẩu: <b className="text-cyan-300 font-mono">{room.pass}</b></span>
                  <span>•</span>
                  <span className="flex items-center gap-1">
                    <Users className="w-3.5 h-3.5 text-emerald-400" />
                    <b>{lobbyPlayersList.length}</b> học sinh trong Sảnh Chờ
                  </span>
                  <span>•</span>
                  <span className="bg-white/10 px-2 py-0.5 rounded-md font-semibold text-[11px] text-amber-200">
                    {room.roundSize || 4} từ/vòng • {room.speedMode === 'relaxed' ? 'Chậm (+6s)' : room.speedMode === 'turbo' ? 'Siêu tốc (-5s)' : 'Chuẩn'}
                  </span>
                </div>
              </div>

              <div className="flex flex-wrap gap-2.5">
                <button
                  onClick={() => handleTeacherOpenLobby(currentRoomPin)}
                  className="bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-extrabold text-xs px-4 py-2.5 rounded-xl transition shadow-lg flex items-center gap-2"
                >
                  <Rocket className="w-4 h-4" /> Mở Sảnh Chờ (Among Us)
                </button>
                {room.status !== 'LOBBY' && (
                  <button
                    onClick={() => handleTeacherResetLobby(currentRoomPin)}
                    className="bg-amber-500/20 hover:bg-amber-500/30 text-amber-200 border border-amber-400/40 font-bold text-xs px-4 py-2.5 rounded-xl transition flex items-center gap-1.5"
                  >
                    <RefreshCw className="w-3.5 h-3.5" /> Mở Lại Sảnh Mới
                  </button>
                )}
                <button
                  onClick={() => {
                    initGameCampaign(currentRoomPin, currentUser);
                    setView('GAME_ARENA');
                  }}
                  className="bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-200 border border-cyan-400/40 font-bold text-xs px-4 py-2.5 rounded-xl transition flex items-center gap-1.5"
                >
                  <Gamepad2 className="w-4 h-4" /> Chơi Thử GV
                </button>
                <button
                  onClick={() => {
                    setCustomVocabInput(room.rawVocab || DEFAULT_VOCAB_TEXT);
                    setShowVocabModal(true);
                  }}
                  className="bg-purple-600/80 hover:bg-purple-600 text-white font-bold text-xs px-4 py-2.5 rounded-xl transition border border-purple-400/40 flex items-center gap-1.5"
                >
                  <Edit className="w-3.5 h-3.5" /> Sửa Bộ Từ Vựng
                </button>
              </div>
            </div>

            {/* Live Lobby Crewmates Preview */}
            {lobbyPlayersList.length > 0 && (
              <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-4 shadow-sm">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-600 dark:text-slate-300 flex items-center gap-2">
                    <Users className="w-4 h-4 text-emerald-500" /> Phi Hành Đoàn Đang Chờ Trong Sảnh ({lobbyPlayersList.length})
                  </h3>
                  <button
                    onClick={() => handleTeacherOpenLobby(currentRoomPin)}
                    className="text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1"
                  >
                    Vào Sảnh Điều Phối <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
                <div className="flex flex-wrap gap-3">
                  {lobbyPlayersList.map(lp => (
                    <div key={lp.username} className="flex items-center gap-2.5 px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                      <AmongUsCrewmate colorId={lp.colorId} avatarUrl={lp.avatarUrl || usersDb[lp.username]?.avatarUrl || ''} size={28} />
                      <div>
                        <p className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1">
                          {lp.name}
                          {lp.role === 'teacher' && <Crown className="w-3 h-3 text-amber-500" />}
                        </p>
                        <p className="text-[10px] font-semibold text-emerald-600 dark:text-emerald-400">
                          {lp.ready ? 'Đã sẵn sàng' : 'Đang chuẩn bị'}
                        </p>
                      </div>
                      {lp.role !== 'teacher' && (
                        <button
                          type="button"
                          onClick={() => handleKickLobbyPlayer(currentRoomPin, lp.username, lp.name)}
                          className="ml-1 p-1 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-500/15 transition"
                          title={`Mời ${lp.name} rời sảnh`}
                        >
                          <UserMinus className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

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
                          <td className="px-6 py-3.5 text-xs text-slate-600 dark:text-slate-300">
                            <div>{p.status}</div>
                            {Array.isArray(p.missed) && p.missed.length > 0 && (
                              <div className="flex flex-wrap gap-1 mt-1">
                                {p.missed.slice(0, 4).map((mw, mIdx) => (
                                  <span
                                    key={mIdx}
                                    className="px-1.5 py-0.5 rounded bg-rose-50 dark:bg-rose-500/15 text-rose-600 dark:text-rose-300 border border-rose-200 dark:border-rose-500/30 font-mono text-[10px] font-bold"
                                  >
                                    {mw}
                                  </span>
                                ))}
                              </div>
                            )}
                          </td>
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

              <div className="w-full md:w-auto flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
                <input
                  type="text"
                  placeholder="🔍 Tìm kiếm theo tên hoặc username..."
                  value={studentSearchQuery}
                  onChange={e => setStudentSearchQuery(e.target.value)}
                  className="w-full sm:w-64 px-4 py-2.5 text-xs bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 border border-slate-300 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none font-medium"
                />
                <button
                  type="button"
                  onClick={() => setShowAddStudentModal(true)}
                  className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-extrabold transition shadow-sm flex items-center justify-center gap-1.5 shrink-0"
                >
                  <UserPlus className="w-4 h-4" /> + Thêm Học Viên
                </button>
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
                              <button
                                type="button"
                                onClick={() =>
                                  setEditingTargetUser({
                                    username: student.username,
                                    name: student.name || '',
                                    targetBand: student.targetBand || 7.5,
                                    studyGoal: student.studyGoal || ''
                                  })
                                }
                                title="Bấm để chỉnh sửa mục tiêu Target & ghi chú học viên"
                                className="inline-flex items-center gap-1.5 text-xs font-bold bg-amber-50 dark:bg-amber-500/15 hover:bg-amber-100 dark:hover:bg-amber-500/25 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-500/30 px-2.5 py-1 rounded-full transition"
                              >
                                <Target className="w-3.5 h-3.5 text-amber-500" />
                                Band {student.targetBand || '7.5'}
                                <Edit className="w-3 h-3 opacity-70" />
                              </button>
                              {student.studyGoal && (
                                <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-1 max-w-[140px] mx-auto truncate" title={student.studyGoal}>
                                  {student.studyGoal}
                                </p>
                              )}
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
                              <div className="inline-flex items-center gap-1.5">
                                <button
                                  type="button"
                                  onClick={() => {
                                    setEditingStudentAccount(student);
                                    setStudentPasswordDraft('');
                                  }}
                                  className="px-2.5 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-amber-50 dark:hover:bg-amber-500/15 text-slate-700 dark:text-slate-200 hover:text-amber-700 dark:hover:text-amber-300 border border-slate-200 dark:border-slate-700 text-xs font-bold transition inline-flex items-center gap-1"
                                  title="Đặt lại mật khẩu đăng nhập cho học viên"
                                >
                                  <Key className="w-3.5 h-3.5" /> Đổi MK
                                </button>
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
                              </div>
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
          <FileText className="w-4 h-4" /> 1. Thời Gian Từng Phần, Ẩn/Hiện & Thi Thử/Thi Thật
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

      {/* TAB 1: GENERAL SETTINGS, VISIBILITY, ATTEMPT LIMITS, SECTION TIMERS & ANSWER PERMISSIONS */}
      {builderTab === 'general' && (() => {
        const cfg = normalizeExamConfig(testForm);
        const skillLabels = {
          listening: { name: 'Listening', icon: Headphones, color: 'text-blue-600 dark:text-blue-400' },
          reading: { name: 'Reading', icon: BookOpen, color: 'text-indigo-600 dark:text-indigo-400' },
          writing: { name: 'Writing', icon: PenTool, color: 'text-purple-600 dark:text-purple-400' }
        };
        const moveSectionOrder = (idx, dir) => {
          const nextIdx = idx + dir;
          if (nextIdx < 0 || nextIdx >= cfg.order.length) return;
          const nextOrder = [...cfg.order];
          [nextOrder[idx], nextOrder[nextIdx]] = [nextOrder[nextIdx], nextOrder[idx]];
          setTestForm(prev => ({ ...prev, sectionOrder: nextOrder }));
        };

        return (
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
              rows={2}
              value={testForm.description}
              onChange={e => setTestForm({ ...testForm, description: e.target.value })}
              className="w-full px-4 py-3 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 border border-slate-300 dark:border-slate-700 rounded-xl text-xs leading-relaxed focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              placeholder="Mô tả nội dung các phần thi để học viên nắm rõ trước khi bắt đầu..."
            />
          </div>

          {/* Visibility & Max Attempts Row */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Visibility Setting */}
            <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-3">
              <div>
                <h3 className="font-extrabold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                  {cfg.visibility === 'private' ? <EyeOff className="w-4 h-4 text-amber-500" /> : <Globe className="w-4 h-4 text-emerald-500" />}
                  Chế Độ Hiển Thị Đề Thi
                </h3>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                  Chọn <b>Chỉ mình tôi</b> khi đang soạn thảo để học viên không nhìn thấy hoặc bấm nhầm.
                </p>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setTestForm(prev => ({ ...prev, visibility: 'public' }))}
                  className={`px-3 py-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 border transition ${
                    cfg.visibility === 'public'
                      ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm'
                      : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                  }`}
                >
                  <Globe className="w-3.5 h-3.5" /> Công khai (HS thấy)
                </button>
                <button
                  type="button"
                  onClick={() => setTestForm(prev => ({ ...prev, visibility: 'private' }))}
                  className={`px-3 py-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 border transition ${
                    cfg.visibility === 'private'
                      ? 'bg-amber-600 text-white border-amber-600 shadow-sm'
                      : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                  }`}
                >
                  <EyeOff className="w-3.5 h-3.5" /> Chỉ mình tôi (Ẩn)
                </button>
              </div>
            </div>

            {/* Attempt Limit Setting */}
            <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-3">
              <div>
                <h3 className="font-extrabold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                  <SlidersHorizontal className="w-4 h-4 text-indigo-500" /> Số Lần Học Viên Được Làm Bài
                </h3>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                  Đặt <b>0</b> để ôn tập tự do không giới hạn, hoặc <b>1</b> nếu dùng để kiểm tra / thi thật.
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => setTestForm(prev => ({ ...prev, maxAttempts: 0 }))}
                  className={`px-3 py-2 rounded-xl text-xs font-bold border transition ${
                    cfg.maxAttempts === 0
                      ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm'
                      : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                  }`}
                >
                  ∞ Thi Thử (Nhiều lần)
                </button>
                <button
                  type="button"
                  onClick={() => setTestForm(prev => ({ ...prev, maxAttempts: 1 }))}
                  className={`px-3 py-2 rounded-xl text-xs font-bold border transition ${
                    cfg.maxAttempts === 1
                      ? 'bg-rose-600 text-white border-rose-600 shadow-sm'
                      : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                  }`}
                >
                  🔒 Thi Thật (1 lần)
                </button>
                <div className="flex items-center gap-1.5 ml-auto">
                  <span className="text-[11px] text-slate-500 dark:text-slate-400 font-semibold">Tùy chỉnh:</span>
                  <input
                    type="number"
                    min={0}
                    max={99}
                    value={cfg.maxAttempts}
                    onChange={e => setTestForm(prev => ({ ...prev, maxAttempts: Math.max(0, Number(e.target.value) || 0) }))}
                    className="w-16 px-2.5 py-2 bg-white dark:bg-slate-900 text-slate-900 dark:text-white border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-bold text-center"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Per-Skill Durations & Sequential Section Order */}
          <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h3 className="font-extrabold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                  <Clock className="w-4 h-4 text-blue-600 dark:text-blue-400" /> Thời Gian Từng Kỹ Năng & Thứ Tự Thi Luân Phiên
                </h3>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                  Đặt số phút riêng cho mỗi kỹ năng (VD: Reading 30p, Listening 15p) và sắp xếp thứ tự làm bài từ trên xuống dưới.
                </p>
              </div>
              <span className="text-xs font-bold bg-blue-100 dark:bg-blue-500/20 text-blue-800 dark:text-blue-200 px-3 py-1 rounded-full shrink-0">
                Tổng thời gian: {cfg.order.reduce((acc, s) => acc + cfg.durations[s], 0)} phút
              </span>
            </div>

            <div className="space-y-2.5">
              {cfg.order.map((sId, idx) => {
                const meta = skillLabels[sId];
                const IconComp = meta.icon;
                return (
                  <div
                    key={sId}
                    className="flex flex-wrap items-center justify-between gap-3 bg-white dark:bg-slate-900 px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700"
                  >
                    <div className="flex items-center gap-3">
                      <span className="w-6 h-6 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 font-black text-xs flex items-center justify-center">
                        {idx + 1}
                      </span>
                      <IconComp className={`w-4 h-4 ${meta.color}`} />
                      <span className="font-extrabold text-xs text-slate-900 dark:text-white">{meta.name}</span>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-1.5">
                        <input
                          type="number"
                          min={1}
                          max={180}
                          value={cfg.durations[sId]}
                          onChange={e => {
                            const mins = Math.max(1, Number(e.target.value) || 1);
                            setTestForm(prev => ({
                              ...prev,
                              sectionDurations: { ...normalizeExamConfig(prev).durations, [sId]: mins }
                            }));
                          }}
                          className="w-16 px-2.5 py-1.5 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white border border-slate-300 dark:border-slate-700 rounded-lg text-xs font-extrabold text-center"
                        />
                        <span className="text-xs text-slate-500 dark:text-slate-400 font-semibold">phút</span>
                      </div>

                      <div className="flex items-center gap-1 border-l border-slate-200 dark:border-slate-700 pl-3">
                        <button
                          type="button"
                          disabled={idx === 0}
                          onClick={() => moveSectionOrder(idx, -1)}
                          title="Đưa lên trước"
                          className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 disabled:opacity-30 text-slate-700 dark:text-slate-200 transition"
                        >
                          <ArrowUp className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          disabled={idx === cfg.order.length - 1}
                          onClick={() => moveSectionOrder(idx, 1)}
                          title="Đưa xuống sau"
                          className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 disabled:opacity-30 text-slate-700 dark:text-slate-200 transition"
                        >
                          <ArrowDown className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2 border-t border-slate-200 dark:border-slate-700">
              <label className="flex items-center gap-2.5 cursor-pointer text-xs font-bold text-slate-800 dark:text-slate-100">
                <input
                  type="checkbox"
                  checked={cfg.sequentialMode}
                  onChange={e => setTestForm(prev => ({ ...prev, sequentialMode: e.target.checked }))}
                  className="w-4 h-4 rounded text-indigo-600"
                />
                <span>Khóa tuần tự theo từng phần (Hết giờ mới tự động sang kỹ năng kế tiếp)</span>
              </label>

              {cfg.sequentialMode && (
                <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-slate-600 dark:text-slate-300">
                  <input
                    type="checkbox"
                    checked={cfg.allowEarlyNextSection}
                    onChange={e => setTestForm(prev => ({ ...prev, allowEarlyNextSection: e.target.checked }))}
                    className="w-4 h-4 rounded text-indigo-600"
                  />
                  <span>Cho phép nộp sớm để sang phần sau</span>
                </label>
              )}
            </div>
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
        );
      })()}

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
                      <div>
                        <input
                          type="text"
                          value={q.correctAnswer}
                          onChange={e => updateQuestionInSkill('listening', q.id, 'correctAnswer', e.target.value)}
                          className="w-full sm:w-96 px-3.5 py-2 bg-white dark:bg-slate-900 border border-emerald-300 dark:border-emerald-500/40 rounded-xl text-xs font-extrabold text-emerald-900 dark:text-emerald-200"
                          placeholder="VD: 15 | fifteen hoặc color / colour"
                        />
                        <p className="text-[11px] text-emerald-700/80 dark:text-emerald-300/80 mt-1">
                          Mẹo: Dùng dấu <code className="font-bold">|</code> hoặc <code className="font-bold">/</code> nếu chấp nhận nhiều đáp án tương đương.
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: READING BUILDER (MULTI-PASSAGE NUMBERED TOPICS + IMAGE UPLOAD + QUESTIONS CRUD) */}
      {builderTab === 'reading' && (() => {
        const passages = getReadingPassages(testForm.reading);
        const activeIdx = Math.min(Math.max(0, builderReadingIdx), passages.length - 1);
        const activePassage = passages[activeIdx];

        const addReadingPassage = () => {
          const nextNum = passages.length + 1;
          const newP = {
            id: `passage-${Date.now()}`,
            title: `Bài ${nextNum}: Chủ đề mới`,
            imageUrl: '',
            imageFileName: '',
            passageText: ''
          };
          setTestForm(prev => ({
            ...prev,
            reading: {
              ...prev.reading,
              passages: [...getReadingPassages(prev.reading), newP]
            }
          }));
          setBuilderReadingIdx(passages.length);
        };

        const removeReadingPassage = (removeIdx) => {
          if (passages.length <= 1) return;
          const nextPassages = passages.filter((_, i) => i !== removeIdx);
          const first = nextPassages[0] || {};
          setTestForm(prev => ({
            ...prev,
            reading: {
              ...prev.reading,
              passages: nextPassages,
              passageTitle: first.title || '',
              passageText: first.passageText || '',
              imageUrl: first.imageUrl || '',
              imageFileName: first.imageFileName || '',
              questions: (prev.reading?.questions || []).map(q => {
                if (typeof q.passageIdx !== 'number') return q;
                if (q.passageIdx === removeIdx) return { ...q, passageIdx: 0 };
                if (q.passageIdx > removeIdx) return { ...q, passageIdx: q.passageIdx - 1 };
                return q;
              })
            }
          }));
          setBuilderReadingIdx(Math.max(0, Math.min(activeIdx, nextPassages.length - 1)));
        };

        return (
        <div className="space-y-6">
          {/* Reading Passage & Image Upload Card */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 sm:p-8 shadow-sm space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h2 className="text-lg font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                  <BookOpen className="w-5 h-5 text-indigo-600 dark:text-indigo-400" /> Nội Dung Bài Đọc Reading ({passages.length} Chủ Đề / Bài)
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  Tạo nhiều bài đọc / chủ đề đánh số 1, 2, 3... để học sinh chuyển qua lại dễ dàng khi có nhiều ảnh hoặc nhiều đoạn đọc.
                </p>
              </div>
              <button
                type="button"
                onClick={addReadingPassage}
                className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-extrabold px-4 py-2.5 rounded-xl shadow-sm transition flex items-center gap-1.5 shrink-0"
              >
                <Plus className="w-4 h-4" /> Thêm Chủ Đề / Bài Đọc #{passages.length + 1}
              </button>
            </div>

            {/* Numbered Passage Selector Bar (1, 2, 3...) */}
            <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-50 dark:bg-slate-800/70 p-3 rounded-2xl border border-slate-200 dark:border-slate-700">
              <div className="flex flex-wrap items-center gap-2">
                {passages.map((p, pIdx) => (
                  <button
                    key={p.id || pIdx}
                    type="button"
                    onClick={() => setBuilderReadingIdx(pIdx)}
                    className={`px-3.5 py-2 rounded-xl text-xs font-extrabold flex items-center gap-2 border transition ${
                      pIdx === activeIdx
                        ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm'
                        : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-indigo-50 dark:hover:bg-indigo-500/15'
                    }`}
                  >
                    <span className={`w-5 h-5 rounded-full text-[11px] font-black flex items-center justify-center ${
                      pIdx === activeIdx ? 'bg-white text-indigo-600' : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200'
                    }`}>
                      {pIdx + 1}
                    </span>
                    <span className="max-w-[160px] truncate">{p.title || `Bài đọc ${pIdx + 1}`}</span>
                  </button>
                ))}
              </div>

              {passages.length > 1 && (
                <button
                  type="button"
                  onClick={() => removeReadingPassage(activeIdx)}
                  className="text-xs font-bold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-500/20 px-3 py-1.5 rounded-xl border border-rose-200 dark:border-rose-500/30 transition flex items-center gap-1"
                >
                  <Trash2 className="w-3.5 h-3.5" /> Xóa Bài #{activeIdx + 1}
                </button>
              )}
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                Tiêu Đề Bài Đọc / Chủ Đề #{activeIdx + 1}
              </label>
              <input
                type="text"
                value={activePassage?.title || ''}
                onChange={e => updateReadingPassageField(activeIdx, { title: e.target.value })}
                className="w-full px-4 py-2.5 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-sm font-bold text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                placeholder={`VD: Bài ${activeIdx + 1}: The Evolution of Urban Architecture`}
              />
            </div>

            {/* Reading Image Upload & URL */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-indigo-50/40 dark:bg-indigo-500/10 p-5 rounded-2xl border border-indigo-100 dark:border-indigo-500/30">
              <div className="space-y-3">
                <span className="text-xs font-extrabold text-indigo-950 dark:text-indigo-200 uppercase flex items-center gap-1.5">
                  <Image className="w-4 h-4 text-indigo-600 dark:text-indigo-400" /> Ảnh Minh Họa / Đề Chụp Bài #{activeIdx + 1}
                </span>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  Tải ảnh từ máy tính (.png, .jpg, .webp) hoặc dán link URL hình ảnh riêng cho bài đọc số {activeIdx + 1}.
                </p>

                <div className="flex flex-wrap items-center gap-2 pt-1">
                  <label className="cursor-pointer inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold px-4 py-2.5 rounded-xl shadow-sm transition">
                    <Upload className="w-4 h-4" />
                    <span>Tải Ảnh Cho Bài #{activeIdx + 1}</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={e => handleReadingImageUpload(e, activeIdx)}
                      className="hidden"
                    />
                  </label>

                  {activePassage?.imageUrl && (
                    <button
                      type="button"
                      onClick={() => updateReadingPassageField(activeIdx, { imageUrl: '', imageFileName: '' })}
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
                    value={activePassage?.imageUrl?.startsWith('data:') ? '' : (activePassage?.imageUrl || '')}
                    onChange={e => updateReadingPassageField(activeIdx, { imageUrl: e.target.value })}
                    placeholder="https://example.com/reading-diagram.png"
                    className="w-full px-3 py-2 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 border border-slate-300 dark:border-slate-700 rounded-xl text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="flex items-center justify-center bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700 p-3 min-h-[160px]">
                {activePassage?.imageUrl ? (
                  <img
                    src={activePassage.imageUrl}
                    alt={`Reading Preview ${activeIdx + 1}`}
                    onClick={() => setZoomedReadingImg(activePassage.imageUrl)}
                    className="max-h-48 object-contain rounded-lg cursor-zoom-in"
                  />
                ) : (
                  <div className="text-center text-xs text-slate-400">
                    <Image className="w-8 h-8 mx-auto mb-1.5 text-slate-300 dark:text-slate-600" />
                    <span>Chưa có hình ảnh cho Bài #{activeIdx + 1}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Passage Text */}
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                Nội Dung Văn Bản Bài Đọc #{activeIdx + 1} (Nếu chỉ dùng ảnh có thể bỏ trống)
              </label>
              <textarea
                rows={7}
                value={activePassage?.passageText || ''}
                onChange={e => updateReadingPassageField(activeIdx, { passageText: e.target.value })}
                className="w-full p-4 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 border border-slate-300 dark:border-slate-700 rounded-2xl text-xs leading-relaxed font-serif focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                placeholder={`Nhập nội dung văn bản cho Bài đọc số ${activeIdx + 1}...`}
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
                  Hỗ trợ True/False/Not Given, Trắc nghiệm (MCQ), Điền từ — và gắn câu hỏi vào Bài số 1, 2, 3... tương ứng.
                </p>
              </div>

              <button
                type="button"
                onClick={() => addQuestionToSkill('reading')}
                className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-extrabold px-4 py-2.5 rounded-xl shadow-sm transition flex items-center gap-1.5"
              >
                <Plus className="w-4 h-4" /> Thêm Câu Hỏi Reading {passages.length > 1 ? `(Bài #${activeIdx + 1})` : ''}
              </button>
            </div>

            <div className="space-y-5">
              {(testForm.reading?.questions || []).map((q, idx) => (
                <div key={q.id} className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-4">
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                    <span className="text-xs font-extrabold bg-indigo-600 text-white px-3 py-1 rounded-lg">
                      Câu hỏi Reading #{idx + 1}
                    </span>

                    <div className="flex flex-wrap items-center gap-2.5">
                      {passages.length > 1 && (
                        <select
                          value={typeof q.passageIdx === 'number' ? String(q.passageIdx) : ''}
                          onChange={e =>
                            updateQuestionInSkill(
                              'reading',
                              q.id,
                              'passageIdx',
                              e.target.value === '' ? null : Number(e.target.value)
                            )
                          }
                          className="px-3 py-1.5 bg-indigo-50 dark:bg-indigo-500/20 border border-indigo-200 dark:border-indigo-500/40 rounded-xl text-xs font-bold text-indigo-800 dark:text-indigo-200"
                        >
                          <option value="">Hiện ở tất cả bài</option>
                          {passages.map((p, pIdx) => (
                            <option key={p.id || pIdx} value={String(pIdx)}>
                              Thuộc Bài {pIdx + 1} ({(p.title || '').slice(0, 18)})
                            </option>
                          ))}
                        </select>
                      )}

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
                      <div>
                        <input
                          type="text"
                          value={q.correctAnswer}
                          onChange={e => updateQuestionInSkill('reading', q.id, 'correctAnswer', e.target.value)}
                          className="w-full sm:w-96 px-3.5 py-2 bg-white dark:bg-slate-900 border border-emerald-300 dark:border-emerald-500/40 rounded-xl text-xs font-extrabold text-emerald-900 dark:text-emerald-200"
                          placeholder="VD: 15 | fifteen hoặc color / colour"
                        />
                        <p className="text-[11px] text-emerald-700/80 dark:text-emerald-300/80 mt-1">
                          Mẹo: Dùng dấu <code className="font-bold">|</code> hoặc <code className="font-bold">/</code> nếu chấp nhận nhiều đáp án tương đương.
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
        );
      })()}

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

      {/* AI Key Configuration Modal (Strictly Teacher Only) */}
      {showApiKeyModal && currentUser?.role === 'teacher' && (
        <div className="fixed inset-0 bg-slate-900/75 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-lg w-full shadow-2xl border border-slate-200 dark:border-slate-700 p-6">
            <div className="flex justify-between items-center pb-3 border-b border-slate-200 dark:border-slate-800 mb-4">
              <h3 className="text-base font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                <Key className="w-4 h-4 text-indigo-600 dark:text-indigo-400" /> Cấu Hình Google Gemini API Key
              </h3>
              <button onClick={() => setShowApiKeyModal(false)} className="text-slate-400 hover:text-slate-700 dark:hover:text-slate-200">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  Google Gemini API Key (Chỉ dành cho Giáo viên)
                </label>
                <div className="flex gap-2">
                  <input
                    type="password"
                    placeholder="AIzaSy..."
                    value={aiApiKey}
                    onChange={e => {
                      setAiApiKey(e.target.value);
                      if (apiTestState.ok !== null) setApiTestState({ testing: false, ok: null, message: '', model: '' });
                    }}
                    className="flex-1 px-3.5 py-2.5 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-mono focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => handleTestGeminiKey(aiApiKey)}
                    disabled={apiTestState.testing}
                    className="px-3.5 py-2.5 rounded-xl bg-slate-900 dark:bg-indigo-600 hover:bg-slate-800 dark:hover:bg-indigo-500 text-white text-xs font-bold transition flex items-center gap-1.5 disabled:opacity-60 shrink-0"
                  >
                    {apiTestState.testing ? (
                      <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Đang thử...</>
                    ) : (
                      <><ShieldCheck className="w-3.5 h-3.5 text-emerald-400" /> Kiểm Tra Key</>
                    )}
                  </button>
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-2 leading-relaxed">
                  Tạo Key miễn phí tại <a href="https://aistudio.google.com/apikey" target="_blank" rel="noreferrer" className="text-blue-600 dark:text-blue-400 underline font-semibold">Google AI Studio</a>. Hệ thống tự động dò model khả dụng mới nhất (Gemini 2.5 Flash / 2.0 Flash...) cho API Key của bạn.
                </p>
              </div>

              {apiTestState.ok !== null && (
                <div className={`p-3.5 rounded-2xl border text-xs leading-relaxed flex items-start gap-2.5 ${
                  apiTestState.ok
                    ? 'bg-emerald-50 dark:bg-emerald-500/15 border-emerald-200 dark:border-emerald-500/30 text-emerald-800 dark:text-emerald-200'
                    : 'bg-rose-50 dark:bg-rose-500/15 border-rose-200 dark:border-rose-500/30 text-rose-800 dark:text-rose-200'
                }`}>
                  {apiTestState.ok ? (
                    <CheckCircle className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                  ) : (
                    <AlertTriangle className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
                  )}
                  <div>
                    <p className="font-bold">{apiTestState.ok ? 'Key hoạt động bình thường!' : 'Không thể xác thực API Key'}</p>
                    <p className="mt-0.5 text-[11px] opacity-90">{apiTestState.message}</p>
                  </div>
                </div>
              )}

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowApiKeyModal(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl"
                >
                  Đóng
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const trimmed = (aiApiKey || '').trim();
                    setAiApiKey(trimmed);
                    localStorage.setItem('ielts_ai_key', trimmed);
                    setShowApiKeyModal(false);
                    showToast(trimmed ? 'Đã lưu Google Gemini API Key!' : 'Đã xóa API Key (sẽ dùng bộ chấm tích hợp).');
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

      {/* Shared Modal: Edit Student/User Target Band & Study Goal */}
      {editingTargetUser && (currentUser?.role === 'teacher' || editingTargetUser.username === currentUser?.username) && (
        <div className="fixed inset-0 bg-slate-900/75 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <form
            onSubmit={e => {
              e.preventDefault();
              handleUpdateUserProfileFields(editingTargetUser.username, {
                name: editingTargetUser.name,
                targetBand: editingTargetUser.targetBand,
                studyGoal: editingTargetUser.studyGoal
              });
              setEditingTargetUser(null);
            }}
            className="bg-white dark:bg-slate-900 rounded-3xl max-w-md w-full shadow-2xl border border-slate-200 dark:border-slate-700 p-6"
          >
            <div className="flex justify-between items-center pb-3 border-b border-slate-200 dark:border-slate-800 mb-4">
              <h3 className="text-base font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                <Target className="w-4 h-4 text-amber-500" /> Chỉnh Sửa Mục Tiêu Target
              </h3>
              <button type="button" onClick={() => setEditingTargetUser(null)} className="text-slate-400 hover:text-slate-700 dark:hover:text-slate-200">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Tên hiển thị (@{editingTargetUser.username})
                </label>
                <input
                  type="text"
                  value={editingTargetUser.name}
                  onChange={e => setEditingTargetUser(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full px-3.5 py-2.5 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-bold focus:ring-2 focus:ring-amber-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  Target IELTS Band (4.0 – 9.0)
                </label>
                <div className="flex flex-wrap gap-1.5 mb-2">
                  {[6.0, 6.5, 7.0, 7.5, 8.0, 8.5].map(bandVal => (
                    <button
                      key={bandVal}
                      type="button"
                      onClick={() => setEditingTargetUser(prev => ({ ...prev, targetBand: bandVal }))}
                      className={`px-3 py-1.5 rounded-xl text-xs font-extrabold border transition ${
                        Number(editingTargetUser.targetBand) === bandVal
                          ? 'bg-amber-500 text-white border-amber-500 shadow-sm'
                          : 'bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                      }`}
                    >
                      {bandVal.toFixed(1)}
                    </button>
                  ))}
                </div>
                <input
                  type="number"
                  step="0.5"
                  min="4.0"
                  max="9.0"
                  value={editingTargetUser.targetBand}
                  onChange={e => setEditingTargetUser(prev => ({ ...prev, targetBand: e.target.value }))}
                  className="w-full px-3.5 py-2 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-mono font-bold focus:ring-2 focus:ring-amber-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Ghi chú mục tiêu học tập / Kỳ thi
                </label>
                <input
                  type="text"
                  value={editingTargetUser.studyGoal || ''}
                  onChange={e => setEditingTargetUser(prev => ({ ...prev, studyGoal: e.target.value }))}
                  placeholder="VD: Thi IELTS Academic tháng 12 - Ưu tiên Reading 8.0"
                  className="w-full px-3.5 py-2.5 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 border border-slate-300 dark:border-slate-700 rounded-xl text-xs focus:ring-2 focus:ring-amber-500 focus:outline-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setEditingTargetUser(null)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-bold bg-amber-600 hover:bg-amber-700 text-white rounded-xl shadow-sm flex items-center gap-1.5"
                >
                  <Save className="w-3.5 h-3.5" /> Lưu Mục Tiêu
                </button>
              </div>
            </div>
          </form>
        </div>
      )}

      {/* Zoomed Reading Passage Image Lightbox */}
      {zoomedReadingImg && (
        <div
          onClick={() => setZoomedReadingImg('')}
          className="fixed inset-0 bg-slate-950/90 backdrop-blur-sm z-[60] flex flex-col items-center justify-center p-4"
        >
          <div className="max-w-5xl w-full flex justify-end mb-2">
            <button
              type="button"
              onClick={() => setZoomedReadingImg('')}
              className="bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold px-3.5 py-2 rounded-xl flex items-center gap-1.5 border border-slate-700"
            >
              <X className="w-4 h-4" /> Đóng ảnh
            </button>
          </div>
          <img
            src={zoomedReadingImg}
            alt="Zoomed Reading Passage"
            onClick={e => e.stopPropagation()}
            className="max-w-full max-h-[85vh] object-contain rounded-2xl shadow-2xl bg-white dark:bg-slate-900 p-2"
          />
        </div>
      )}

      {/* Teacher Create Game Room Modal */}
      {showCreateRoomModal && currentUser?.role === 'teacher' && (
        <div className="fixed inset-0 bg-slate-900/75 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <form onSubmit={handleCreateRoom} className="bg-white dark:bg-slate-900 rounded-3xl max-w-md w-full shadow-2xl border border-slate-200 dark:border-slate-700 p-6">
            <div className="flex justify-between items-center pb-3 border-b border-slate-200 dark:border-slate-800 mb-4">
              <h3 className="text-base font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                <Rocket className="w-4 h-4 text-emerald-500" /> Tạo Phòng Đấu Từ Vựng Mới
              </h3>
              <button type="button" onClick={() => setShowCreateRoomModal(false)} className="text-slate-400 hover:text-slate-700 dark:hover:text-slate-200">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Tên phòng đấu</label>
                <input
                  type="text"
                  value={newRoomForm.name}
                  onChange={e => setNewRoomForm(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="VD: Phòng Ôn Từ Vựng Band 7.0"
                  className="w-full px-3.5 py-2.5 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 border border-slate-300 dark:border-slate-700 rounded-xl text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Mã PIN (Để trống = Tự tạo)</label>
                  <input
                    type="text"
                    value={newRoomForm.pin}
                    onChange={e => setNewRoomForm(prev => ({ ...prev, pin: e.target.value }))}
                    placeholder="6 số ngẫu nhiên"
                    className="w-full px-3.5 py-2.5 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-mono focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Mật khẩu phòng</label>
                  <input
                    type="text"
                    value={newRoomForm.pass}
                    onChange={e => setNewRoomForm(prev => ({ ...prev, pass: e.target.value }))}
                    placeholder="ielts"
                    className="w-full px-3.5 py-2.5 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-mono focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Số từ mỗi vòng</label>
                  <select
                    value={newRoomForm.roundSize || 4}
                    onChange={e => setNewRoomForm(prev => ({ ...prev, roundSize: Number(e.target.value) }))}
                    className="w-full px-3.5 py-2.5 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-semibold focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  >
                    {[2, 3, 4, 5, 6, 8].map(n => (
                      <option key={n} value={n}>{n} từ / vòng</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Tốc độ giới hạn giờ</label>
                  <select
                    value={newRoomForm.speedMode || 'normal'}
                    onChange={e => setNewRoomForm(prev => ({ ...prev, speedMode: e.target.value }))}
                    className="w-full px-3.5 py-2.5 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-semibold focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  >
                    <option value="relaxed">Chậm rãi (+6 giây/từ)</option>
                    <option value="normal">Tốc độ chuẩn</option>
                    <option value="turbo">Siêu tốc (-5 giây/từ)</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCreateRoomModal(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl shadow-sm flex items-center gap-1.5"
                >
                  <Plus className="w-3.5 h-3.5" /> Tạo Phòng & Mở Lobby
                </button>
              </div>
            </div>
          </form>
        </div>
      )}

      {/* Teacher Vocab Modal for Game */}
      {showVocabModal && (() => {
        const rawLines = customVocabInput.split(/\r?\n/).map(l => l.trim()).filter(l => l && !l.startsWith('#'));
        const parsedPreview = parseRawVocabText(customVocabInput);
        const badLinesCount = Math.max(0, rawLines.length - parsedPreview.length);
        return (
        <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-2xl w-full shadow-2xl border border-slate-200 dark:border-slate-700 p-6">
            <div className="flex justify-between items-center pb-3 border-b border-slate-200 dark:border-slate-800 mb-4">
              <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Edit className="w-4 h-4 text-purple-600 dark:text-purple-400" /> Sửa Bộ Từ Vựng Game 3 Vòng (Phòng {currentRoomPin})
              </h3>
              <button onClick={() => setShowVocabModal(false)} className="text-slate-400 hover:text-slate-700 dark:hover:text-slate-200">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Quick-Load IELTS Topic Presets */}
            <div className="mb-3">
              <p className="text-[11px] font-bold text-slate-500 dark:text-slate-400 mb-1.5">
                Nạp nhanh bộ từ vựng mẫu theo chủ đề IELTS:
              </p>
              <div className="flex flex-wrap gap-1.5">
                {Object.entries(VOCAB_PRESETS).map(([presetKey, preset]) => (
                  <button
                    key={presetKey}
                    type="button"
                    onClick={() => {
                      setCustomVocabInput(preset.text);
                      showToast(`Đã nạp bộ từ vựng "${preset.label}"! Bấm Lưu để áp dụng.`);
                    }}
                    className="px-2.5 py-1 rounded-lg bg-purple-50 dark:bg-purple-500/15 hover:bg-purple-100 dark:hover:bg-purple-500/25 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-500/30 text-[11px] font-bold transition"
                  >
                    + {preset.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Live Format Validation Status */}
            <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] mb-2">
              <span className="inline-flex items-center gap-1 font-bold text-emerald-600 dark:text-emerald-400">
                <CheckCircle className="w-3.5 h-3.5" /> Hợp lệ: {parsedPreview.length} từ
              </span>
              {badLinesCount > 0 ? (
                <span className="inline-flex items-center gap-1 font-bold text-amber-600 dark:text-amber-400">
                  <AlertTriangle className="w-3.5 h-3.5" /> {badLinesCount} dòng thiếu dấu | hoặc trùng từ
                </span>
              ) : (
                <span className="text-slate-400">Định dạng: TỪ | Nghĩa tiếng Việt | /IPA/ | Ví dụ</span>
              )}
            </div>

            <textarea
              rows={9}
              value={customVocabInput}
              onChange={e => setCustomVocabInput(e.target.value)}
              className="w-full p-3 font-mono text-xs bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 border border-slate-300 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-purple-500 focus:outline-none mb-4"
              placeholder="TỪ | Nghĩa tiếng Việt | /Phiên âm/ | Ví dụ câu..."
            />

            <div className="flex justify-between items-center flex-wrap gap-2">
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
                    if (parsedPreview.length < 3) {
                      alert('Vui lòng nhập tối thiểu 3 từ vựng!');
                      return;
                    }
                    setRoomsDb(prev => ({
                      ...prev,
                      [currentRoomPin]: {
                        ...normalizeRoomObject(prev[currentRoomPin], currentRoomPin),
                        rawVocab: customVocabInput
                      }
                    }));
                    dispatchSyncAction('UPSERT_ROOM', {
                      pin: currentRoomPin,
                      updates: { rawVocab: customVocabInput }
                    });
                    setShowVocabModal(false);
                    showToast(`Đã lưu ${parsedPreview.length} từ vựng cho phòng ${currentRoomPin}!`);
                  }}
                  className="px-4 py-2 text-xs font-bold bg-purple-600 hover:bg-purple-700 text-white rounded-xl shadow"
                >
                  Lưu & Cập Nhật
                </button>
              </div>
            </div>
          </div>
        </div>
        );
      })()}

      {/* Teacher Add / Bulk Import Student Account Modal */}
      {showAddStudentModal && currentUser?.role === 'teacher' && (() => {
        const bulkParsedCount = parseBulkStudentsText(bulkStudentsText).length;
        return (
        <div className="fixed inset-0 bg-slate-900/75 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
          <form onSubmit={handleSaveNewStudents} className="bg-white dark:bg-slate-900 rounded-3xl max-w-lg w-full shadow-2xl border border-slate-200 dark:border-slate-700 p-6">
            <div className="flex justify-between items-center pb-3 border-b border-slate-200 dark:border-slate-800 mb-4">
              <h3 className="text-base font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                <UserPlus className="w-4 h-4 text-indigo-600 dark:text-indigo-400" /> Thêm Tài Khoản Học Viên Mới
              </h3>
              <button type="button" onClick={() => setShowAddStudentModal(false)} className="text-slate-400 hover:text-slate-700 dark:hover:text-slate-200">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-2 p-1 rounded-xl bg-slate-100 dark:bg-slate-800 mb-4">
              <button
                type="button"
                onClick={() => setAddStudentMode('single')}
                className={`py-2 rounded-lg text-xs font-bold transition ${
                  addStudentMode === 'single' ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-300 shadow-sm' : 'text-slate-600 dark:text-slate-400'
                }`}
              >
                Thêm 1 Học Viên
              </button>
              <button
                type="button"
                onClick={() => setAddStudentMode('bulk')}
                className={`py-2 rounded-lg text-xs font-bold transition ${
                  addStudentMode === 'bulk' ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-300 shadow-sm' : 'text-slate-600 dark:text-slate-400'
                }`}
              >
                Nhập Hàng Loạt ({bulkParsedCount})
              </button>
            </div>

            {addStudentMode === 'single' ? (
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Tên đăng nhập</label>
                    <input
                      type="text"
                      value={newStudentForm.username}
                      onChange={e => setNewStudentForm(prev => ({ ...prev, username: e.target.value }))}
                      placeholder="VD: hocsinh_04"
                      className="w-full px-3.5 py-2.5 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-mono"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Mật khẩu ban đầu</label>
                    <input
                      type="text"
                      value={newStudentForm.password}
                      onChange={e => setNewStudentForm(prev => ({ ...prev, password: e.target.value }))}
                      placeholder="123"
                      className="w-full px-3.5 py-2.5 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-mono"
                      required
                    />
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-3">
                  <div className="col-span-2">
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Họ và tên</label>
                    <input
                      type="text"
                      value={newStudentForm.name}
                      onChange={e => setNewStudentForm(prev => ({ ...prev, name: e.target.value }))}
                      placeholder="VD: Nguyễn Minh Khôi"
                      className="w-full px-3.5 py-2.5 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 border border-slate-300 dark:border-slate-700 rounded-xl text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Target Band</label>
                    <select
                      value={newStudentForm.targetBand}
                      onChange={e => setNewStudentForm(prev => ({ ...prev, targetBand: Number(e.target.value) }))}
                      className="w-full px-3 py-2.5 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-bold"
                    >
                      {[5.0, 5.5, 6.0, 6.5, 7.0, 7.5, 8.0, 8.5, 9.0].map(b => (
                        <option key={b} value={b}>Band {b}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-2">
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  Mỗi dòng 1 học viên theo định dạng: <code className="font-bold text-indigo-600 dark:text-indigo-300">username | Họ tên | mật khẩu | TargetBand</code>
                </p>
                <textarea
                  rows={6}
                  value={bulkStudentsText}
                  onChange={e => setBulkStudentsText(e.target.value)}
                  className="w-full p-3 font-mono text-xs bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 border border-slate-300 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
                <p className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400">
                  Nhận diện hợp lệ: {bulkParsedCount} tài khoản học viên
                </p>
              </div>
            )}

            <div className="flex justify-end gap-2 pt-5">
              <button
                type="button"
                onClick={() => setShowAddStudentModal(false)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl"
              >
                Hủy
              </button>
              <button
                type="submit"
                className="px-4 py-2 text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl shadow flex items-center gap-1.5"
              >
                <UserPlus className="w-3.5 h-3.5" /> Lưu Tài Khoản
              </button>
            </div>
          </form>
        </div>
        );
      })()}

      {/* Teacher Reset Student Password Modal */}
      {editingStudentAccount && currentUser?.role === 'teacher' && (
        <div className="fixed inset-0 bg-slate-900/75 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <form onSubmit={handleResetStudentPassword} className="bg-white dark:bg-slate-900 rounded-3xl max-w-sm w-full shadow-2xl border border-slate-200 dark:border-slate-700 p-6">
            <div className="flex justify-between items-center pb-3 border-b border-slate-200 dark:border-slate-800 mb-4">
              <h3 className="text-base font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                <Key className="w-4 h-4 text-amber-500" /> Đặt Lại Mật Khẩu Học Viên
              </h3>
              <button type="button" onClick={() => setEditingStudentAccount(null)} className="text-slate-400 hover:text-slate-700 dark:hover:text-slate-200">
                <X className="w-5 h-5" />
              </button>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-3">
              Học viên: <b className="text-slate-900 dark:text-white">{editingStudentAccount.name}</b> (<code className="font-mono">@{editingStudentAccount.username}</code>)
            </p>
            <div className="mb-4">
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Mật khẩu mới</label>
              <input
                type="text"
                value={studentPasswordDraft}
                onChange={e => setStudentPasswordDraft(e.target.value)}
                placeholder="Nhập mật khẩu mới..."
                className="w-full px-3.5 py-2.5 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-mono focus:ring-2 focus:ring-amber-500 focus:outline-none"
                required
              />
            </div>
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setEditingStudentAccount(null)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl"
              >
                Hủy
              </button>
              <button
                type="submit"
                className="px-4 py-2 text-xs font-bold bg-amber-500 hover:bg-amber-600 text-slate-950 rounded-xl shadow"
              >
                Lưu Mật Khẩu
              </button>
            </div>
          </form>
        </div>
      )}
      {/* Account Avatar Upload & In-Game Head Preview Modal */}
      {showAvatarModal && currentUser && (
        <div className="fixed inset-0 bg-slate-900/75 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-md w-full shadow-2xl border border-slate-200 dark:border-slate-700 p-6">
            <div className="flex justify-between items-center pb-3 border-b border-slate-200 dark:border-slate-800 mb-4">
              <h3 className="text-base font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                <Camera className="w-4 h-4 text-indigo-500" /> Ảnh Đại Diện & Nhân Vật Game
              </h3>
              <button
                type="button"
                onClick={() => setShowAvatarModal(false)}
                className="text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3 mb-4">
              <div className="rounded-2xl bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 p-4 flex flex-col items-center text-center">
                <p className="text-[11px] font-bold text-slate-500 dark:text-slate-400 mb-2">Avatar Tài Khoản</p>
                <UserAvatarBadge user={currentUser} sizeClass="w-20 h-20" textClass="text-2xl" rounded="rounded-2xl" />
              </div>
              <div className="rounded-2xl bg-slate-950 border border-slate-800 p-4 flex flex-col items-center text-center">
                <p className="text-[11px] font-bold text-cyan-300 mb-2">Trong Game</p>
                <AmongUsCrewmate
                  colorId={currentUser.avatarUrl ? 'avatar' : myCrewColor}
                  avatarUrl={currentUser.avatarUrl}
                  size={68}
                  animate={true}
                />
              </div>
            </div>

            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed mb-4">
              Tải ảnh khuôn mặt lên để dùng làm Avatar tài khoản và mở khóa tùy chọn <b>Đầu Avatar</b> trên phi hành gia trong Sảnh Chờ &amp; Bảng Đua Top.
            </p>

            <div className="space-y-2.5">
              <label className="w-full py-2.5 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-extrabold cursor-pointer transition flex items-center justify-center gap-2 shadow-sm">
                <Upload className="w-4 h-4" />
                <span>{currentUser.avatarUrl ? 'Chọn Ảnh Khác' : 'Tải Ảnh Khuôn Mặt Lên'}</span>
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={async (e) => {
                    const file = e.target.files?.[0];
                    e.target.value = '';
                    if (!file) return;
                    try {
                      const compressed = await compressAvatarImageFile(file, 160);
                      handleUpdateUserAvatar(compressed);
                    } catch (err) {
                      showToast(err.message || 'Không thể xử lý ảnh này!', 'error');
                    }
                  }}
                />
              </label>

              {currentUser.avatarUrl && (
                <div className="flex items-center gap-2">
                  {myCrewColor !== 'avatar' && (
                    <button
                      type="button"
                      onClick={() => {
                        handleChangeCrewColor('avatar');
                        showToast('Đã chọn đầu Avatar làm nhân vật Game!');
                      }}
                      className="flex-1 py-2 px-3 rounded-xl bg-cyan-500/15 hover:bg-cyan-500/25 border border-cyan-500/40 text-cyan-700 dark:text-cyan-300 text-xs font-bold transition"
                    >
                      Đặt làm nhân vật Game
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => handleUpdateUserAvatar('')}
                    className="flex-1 py-2 px-3 rounded-xl bg-rose-50 dark:bg-rose-500/15 hover:bg-rose-100 dark:hover:bg-rose-500/25 border border-rose-200 dark:border-rose-500/30 text-rose-600 dark:text-rose-300 text-xs font-bold transition"
                  >
                    Gỡ Ảnh Avatar
                  </button>
                </div>
              )}

              <div className="flex justify-end pt-1">
                <button
                  type="button"
                  onClick={() => setShowAvatarModal(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl"
                >
                  Đóng
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Global Floating Toast */}
      {globalToast.visible && (
        <div className={`fixed bottom-6 right-6 z-50 text-white text-xs font-bold px-4 py-3 rounded-2xl shadow-2xl border flex items-center gap-2 max-w-md ${
          globalToast.type === 'error'
            ? 'bg-rose-900 dark:bg-rose-950 border-rose-500'
            : 'bg-slate-900 dark:bg-slate-800 border-slate-700'
        }`}>
          {globalToast.type === 'error' ? (
            <AlertTriangle className="w-4 h-4 text-rose-300 shrink-0" />
          ) : (
            <Sparkles className="w-4 h-4 text-emerald-400 shrink-0" />
          )}
          <span>{globalToast.text}</span>
        </div>
      )}
    </div>
  );
}
