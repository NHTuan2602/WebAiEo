export const DEFAULT_VOCAB_TEXT = `UBIQUITOUS | Có mặt ở khắp mọi nơi, phổ biến rộng rãi | /juːˈbɪk.wɪ.təs/ | Smartphones have become ubiquitous in modern daily life.
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

export const FALLBACK_DISTRACTORS = ['ABUNDANT', 'OBSOLETE', 'FLOURISH', 'STAGNANT', 'CONDUCIVE', 'SPORADIC', 'EMPIRICAL', 'TRIVIAL'];
export const GAME_ROUND_TIME_LIMITS = { 1: 20, 2: 25, 3: 22, 4: 32 };
export const GAME_SPEED_OFFSETS = { relaxed: 6, normal: 0, turbo: -5 };

// Lexical relations for V3 (Synonym / Antonym / Definition) & V4 (Collocation)
export const VOCAB_LEXICAL_RELATIONS = {
  UBIQUITOUS: { syn: 'OMNIPRESENT', ant: 'RARE / SCARCE', def: 'Found or seeming to exist everywhere at the same time', collocation: 'become increasingly ubiquitous' },
  MITIGATE: { syn: 'ALLEVIATE', ant: 'AGGRAVATE', def: 'To make something less harmful, unpleasant, or severe', collocation: 'mitigate the adverse effects' },
  DETERIORATE: { syn: 'WORSEN', ant: 'IMPROVE', def: 'To progressively become worse in quality or condition', collocation: 'rapidly deteriorate over time' },
  PLAUSIBLE: { syn: 'CREDIBLE', ant: 'IMPLAUSIBLE', def: 'Seeming reasonable, believable, or likely to be true', collocation: 'a plausible explanation' },
  LUCRATIVE: { syn: 'PROFITABLE', ant: 'UNPROFITABLE', def: 'Producing a great deal of profit or financial reward', collocation: 'a highly lucrative career' },
  INEVITABLE: { syn: 'UNAVOIDABLE', ant: 'PREVENTABLE', def: 'Certain to happen and unable to be avoided', collocation: 'an inevitable consequence' },
  SCRUTINIZE: { syn: 'EXAMINE', ant: 'OVERLOOK', def: 'To examine or inspect something very carefully and critically', collocation: 'closely scrutinize data' },
  DETRIMENTAL: { syn: 'HARMFUL', ant: 'BENEFICIAL', def: 'Tending to cause harm, damage, or negative consequences', collocation: 'have a detrimental impact on' },
  PROLIFERATE: { syn: 'MULTIPLY', ant: 'DWINDLE', def: 'To increase rapidly in number or spread widely', collocation: 'proliferate across the globe' },
  ALLEVIATE: { syn: 'EASE / RELIEVE', ant: 'INTENSIFY', def: 'To make suffering, deficiency, or a problem less severe', collocation: 'alleviate traffic congestion' },
  AMBIGUOUS: { syn: 'VAGUE', ant: 'EXPLICIT', def: 'Open to more than one interpretation; unclear or inexact', collocation: 'deliberately ambiguous wording' },
  RESILIENT: { syn: 'ADAPTABLE', ant: 'FRAGILE', def: 'Able to recover quickly from difficulties or tough conditions', collocation: 'resilient to economic shocks' },
  SUSTAINABLE: { syn: 'ECO-FRIENDLY', ant: 'UNSUSTAINABLE', def: 'Able to continue over time without depleting natural resources', collocation: 'sustainable urban development' },
  BIODIVERSITY: { syn: 'ECOLOGICAL VARIETY', ant: 'MONOCULTURE', def: 'The variety of plant and animal life in a particular habitat', collocation: 'preserve global biodiversity' },
  ECOSYSTEM: { syn: 'BIOME / HABITAT', ant: 'BARREN VOID', def: 'A biological community of interacting organisms and their environment', collocation: 'fragile marine ecosystem' },
  EMISSION: { syn: 'DISCHARGE', ant: 'ABSORPTION', def: 'The production and release of gases or radiation into the air', collocation: 'curb carbon emissions' },
  CONTAMINATE: { syn: 'POLLUTE', ant: 'PURIFY', def: 'To make something impure or poisonous by adding harmful substances', collocation: 'contaminate water supplies' },
  CONSERVATION: { syn: 'PRESERVATION', ant: 'EXPLOITATION', def: 'Protection and careful management of natural environments', collocation: 'wildlife conservation efforts' },
  DEPLETE: { syn: 'EXHAUST', ant: 'REPLENISH', def: 'To use up the supply or resources of something drastically', collocation: 'deplete natural reserves' },
  RENEWABLE: { syn: 'SUSTAINABLE', ant: 'FINITE / FOSSIL', def: 'Natural energy or resource not depleted when used', collocation: 'transition to renewable energy' },
  AUTOMATION: { syn: 'MECHANIZATION', ant: 'MANUAL LABOR', def: 'Use of machines and software to perform tasks with minimal human input', collocation: 'industrial automation shift' },
  ALGORITHM: { syn: 'COMPUTATION RULE', ant: 'RANDOM GUESS', def: 'A step-by-step mathematical procedure used by computers to solve tasks', collocation: 'recommendation algorithm bias' },
  DISRUPTIVE: { syn: 'GAME-CHANGING', ant: 'CONVENTIONAL', def: 'Causing radical change in an existing industry or market', collocation: 'disruptive technological innovation' },
  OBSOLETE: { syn: 'OUTDATED', ant: 'CUTTING-EDGE', def: 'No longer produced or used because something newer exists', collocation: 'render skills obsolete' },
  CYBERSECURITY: { syn: 'DIGITAL DEFENSE', ant: 'VULNERABILITY', def: 'Practice of protecting networks and data from digital attacks', collocation: 'strengthen cybersecurity measures' },
  CONNECTIVITY: { syn: 'NETWORK ACCESS', ant: 'ISOLATION', def: 'The state or capability of being connected digitally across distances', collocation: 'high-speed internet connectivity' },
  INNOVATE: { syn: 'PIONEER', ant: 'STAGNATE', def: 'To introduce new methods, ideas, or creative solutions', collocation: 'continuously innovate solutions' },
  SYNTHETIC: { syn: 'ARTIFICIAL', ant: 'NATURAL / GENUINE', def: 'Made by chemical synthesis or computer generation rather than natural origin', collocation: 'generate synthetic training data' },
  CURRICULUM: { syn: 'SYLLABUS', ant: 'EXTRACURRICULAR', def: 'The structured set of subjects taught in a school or university', collocation: 'reform the national curriculum' },
  PEDAGOGY: { syn: 'TEACHING METHOD', ant: 'ROTE MEMORIZATION', def: 'The theory, principles, and practice of education and instruction', collocation: 'adopt student-centered pedagogy' },
  LITERACY: { syn: 'PROFICIENCY', ant: 'ILLITERACY', def: 'Competence or foundational knowledge in a specific area or reading/writing', collocation: 'boost digital literacy' },
  EMPIRICAL: { syn: 'EVIDENCE-BASED', ant: 'HYPOTHETICAL', def: 'Based on observation and verifiable experience rather than pure theory', collocation: 'backed by empirical evidence' },
  CRITICAL: { syn: 'ANALYTICAL / VITAL', ant: 'TRIVIAL', def: 'Involving careful objective judgment, or crucially important', collocation: 'foster critical thinking skills' },
  SCHOLARLY: { syn: 'ACADEMIC', ant: 'INFORMAL', def: 'Involving serious academic study, research, and citations', collocation: 'peer-reviewed scholarly journals' },
  MENTORSHIP: { syn: 'GUIDANCE', ant: 'NEGLECT', def: 'Support and advice provided by a more experienced person', collocation: 'peer mentorship program' },
  APTITUDE: { syn: 'NATURAL TALENT', ant: 'INABILITY', def: 'A natural ability or quick capacity to learn a particular skill', collocation: 'demonstrate analytical aptitude' },
  SEDENTARY: { syn: 'INACTIVE', ant: 'PHYSICALLY ACTIVE', def: 'Characterized by sitting much of the day with little exercise', collocation: 'adopt a sedentary lifestyle' },
  PREVALENT: { syn: 'WIDESPREAD', ant: 'UNCOMMON', def: 'Very common in a particular area or at a particular time', collocation: 'increasingly prevalent issue' },
  IMMUNITY: { syn: 'RESISTANCE', ant: 'SUSCEPTIBILITY', def: 'The body ability to resist infection and disease', collocation: 'boost natural immunity' },
  WELLBEING: { syn: 'WELFARE / HEALTH', ant: 'DISTRESS', def: 'The state of being comfortable, healthy, and happy', collocation: 'promote mental wellbeing' },
  NUTRITION: { syn: 'NOURISHMENT', ant: 'MALNUTRITION', def: 'The process of obtaining food necessary for health and growth', collocation: 'maintain balanced nutrition' },
  CHRONIC: { syn: 'PERSISTENT', ant: 'ACUTE / TEMPORARY', def: 'Persisting for a long time or constantly recurring', collocation: 'suffer from chronic stress' },
  THERAPEUTIC: { syn: 'HEALING', ant: 'DAMAGING', def: 'Relating to the healing of disease or calming of the mind', collocation: 'offer therapeutic benefits' },
  SANITATION: { syn: 'HYGIENE SYSTEM', ant: 'CONTAMINATION', def: 'Public infrastructure providing clean water and sewage disposal', collocation: 'improve urban sanitation' }
};

export const FALLBACK_LEXICAL_POOL = {
  synonyms: ['PROMINENT', 'VITAL', 'SUBSTANTIAL', 'ENHANCE', 'ACCELERATE', 'FLOURISH', 'SIGNIFICANT'],
  antonyms: ['NEGLIGIBLE', 'DECLINE', 'HINDER', 'SCARCE', 'MINIMAL', 'SUPERFICIAL', 'OBSTRUCT'],
  definitions: [
    'Relating to minor decorative details with no lasting effect',
    'Referring to a brief, purely accidental misunderstanding',
    'Describing an outdated rule enforced only during emergencies',
    'Measuring short-term weather variations in coastal areas'
  ],
  collocations: [
    'spark trivial controversy',
    'yield negligible returns',
    'hinder routine paperwork',
    'trigger temporary delays',
    'ignore minor discrepancies',
    'bypass standard guidelines'
  ]
};

export const VOCAB_PRESETS = {
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

export const DEFAULT_SECTION_ORDER = ['listening', 'reading', 'writing', 'speaking'];
export const ALL_SKILL_OPTIONS = ['listening', 'reading', 'writing', 'speaking'];
export const DEFAULT_SECTION_DURATIONS = { listening: 30, reading: 60, writing: 60, speaking: 14 };

export const DAILY_READING_SUBCATEGORIES = Array.from({ length: 14 }, (_, idx) => ({
  id: `shw_${idx + 1}`,
  label: `SuperHomework ${idx + 1}`,
  shortLabel: `SHW ${idx + 1}`
}));

export const DAILY_LISTENING_SUBCATEGORIES = [
  { id: 'listening_shw', label: '1. SuperHomework Listening', shortLabel: 'SuperHomework L' },
  { id: 'listening_sec1_spelling', label: '2. Section 1 • Spelling Names & Numbers', shortLabel: 'Sec 1 • Spelling/Numbers' },
  { id: 'listening_map', label: '3. Map', shortLabel: 'Listening Map' }
];

export const DAILY_WRITING_T1_SUBCATEGORIES = [
  { id: 'w1_map', label: 'Map', shortLabel: 'W1 • Map' },
  { id: 'w1_process', label: 'Process', shortLabel: 'W1 • Process' },
  { id: 'w1_dynamic', label: 'Dynamic', shortLabel: 'W1 • Dynamic' },
  { id: 'w1_static', label: 'Static', shortLabel: 'W1 • Static' }
];

export const DAILY_WRITING_T2_SUBCATEGORIES = [
  { id: 'w2_essay', label: 'Writing Task 2 (Essay)', shortLabel: 'W2 • Essay' }
];

export const getDailySubCategoryLabel = (subCatId = '') => {
  const clean = String(subCatId || '').trim();
  if (!clean) return '';
  const all = [
    ...DAILY_READING_SUBCATEGORIES,
    ...DAILY_LISTENING_SUBCATEGORIES,
    ...DAILY_WRITING_T1_SUBCATEGORIES,
    ...DAILY_WRITING_T2_SUBCATEGORIES
  ];
  return all.find(item => item.id === clean)?.label || '';
};

export const createDefaultSpeakingSection = (overrides = {}) => ({
  speakingTrack: 'general', // 'daily' | 'exam_room' | 'general'
  dailyDate: '',
  dailyMandatory: true,
  roomPassword: '',
  hasRoomPassword: false,
  hashtags: [],
  disableAiTts: false,
  hidePromptTextWhenAudio: false,
  isForecast: false,
  autoAiGrade: true,
  part1SpeakSec: 45,
  part2PrepSec: 60,
  part2SpeakSec: 120,
  part3SpeakSec: 60,
  part1: {
    enabled: true,
    topic: 'Hometown & Daily Routine',
    questions: [
      {
        id: 'sp1_q1',
        prompt: 'Where is your hometown and what do you like most about living there?',
        hint: 'Nêu vị trí, nét đặc trưng địa phương và 1 kỷ niệm hoặc lý do cá nhân.'
      },
      {
        id: 'sp1_q2',
        prompt: 'Is your hometown a popular place for tourists to visit?',
        hint: 'Dùng từ vựng: coastal attractions, vibrant street food, hospitality...'
      },
      {
        id: 'sp1_q3',
        prompt: 'What part of the day do you enjoy the most, and why?',
        hint: 'Giải thích thói quen sáng/tối giúp bạn tập trung hoặc thư giãn.'
      }
    ]
  },
  part2: {
    enabled: true,
    title: 'Describe a memorable journey you took',
    cueCardPrompt: 'Describe a memorable journey you made in the past.',
    bullets: [
      'where you went',
      'who you travelled with',
      'what happened during the journey',
      'and explain why it was so memorable to you'
    ],
    followUpQuestion: 'Do you think you will visit that place again in the future?'
  },
  part3: {
    enabled: true,
    topic: 'Modern Travel & Cultural Exchange',
    questions: [
      {
        id: 'sp3_q1',
        prompt: 'Why do people today travel more frequently than previous generations?',
        hint: 'So sánh chi phí vé máy bay, công việc từ xa, nhu cầu trải nghiệm.'
      },
      {
        id: 'sp3_q2',
        prompt: 'Do you think international tourism benefits local communities more than it harms them?',
        hint: 'Phân tích 2 mặt: doanh thu kinh tế vs quá tải hạ tầng & bảo tồn văn hóa.'
      },
      {
        id: 'sp3_q3',
        prompt: 'How might virtual reality change the way people explore new destinations in the future?',
        hint: 'Thảo luận tính tiện lợi và trải nghiệm thực tế không thể thay thế.'
      }
    ]
  },
  ...(overrides && typeof overrides === 'object' ? overrides : {})
});

export const PRESET_TEST_HASHTAGS = [
  { tag: '#ThiThật', label: '#ThiThật (Đề thi chính thức)', kind: 'real_exam' },
  { tag: '#CóPass', label: '#CóPass (Cần mật khẩu)', kind: 'password' },
  { tag: '#TeamSắpThi', label: '#TeamSắpThi', kind: 'real_exam' },
  { tag: '#SpeakingDaily', label: '#SpeakingDaily (Mỗi ngày)', kind: 'daily' },
  { tag: '#Forecast', label: '#Forecast (Đề dự đoán)', kind: 'forecast' },
  { tag: '#LuyệnTậpTựDo', label: '#LuyệnTậpTựDo (Miễn phí)', kind: 'practice' },
  { tag: '#MockTest', label: '#MockTest', kind: 'custom' },
  { tag: '#KiểmTraĐịnhKỳ', label: '#KiểmTraĐịnhKỳ', kind: 'custom' },
  { tag: '#Full3Parts', label: '#Full3Parts', kind: 'custom' },
  { tag: '#Part1', label: '#Part1', kind: 'custom' },
  { tag: '#Part2', label: '#Part2', kind: 'custom' },
  { tag: '#Part3', label: '#Part3', kind: 'custom' }
];

export const normalizeSingleHashtag = (rawTag = '') => {
  const trimmed = String(rawTag || '')
    .trim()
    .replace(/^#+/, '')
    .replace(/\s+/g, '');
  if (!trimmed) return '';
  return `#${trimmed.slice(0, 32)}`;
};

export const normalizeTestHashtags = (rawHashtags) => {
  const list = Array.isArray(rawHashtags)
    ? rawHashtags
    : typeof rawHashtags === 'string'
    ? rawHashtags.split(/[,;\s]+/)
    : [];
  const seen = new Set();
  const result = [];
  list.forEach(item => {
    const clean = normalizeSingleHashtag(item);
    if (!clean) return;
    const key = clean.toLowerCase();
    if (seen.has(key)) return;
    seen.add(key);
    result.push(clean);
  });
  return result.slice(0, 12);
};

export const normalizeSpeakingSection = (rawSpeaking = {}) => {
  const def = createDefaultSpeakingSection();
  const s = rawSpeaking && typeof rawSpeaking === 'object' ? rawSpeaking : {};
  const p1 = s.part1 && typeof s.part1 === 'object' ? s.part1 : {};
  const p2 = s.part2 && typeof s.part2 === 'object' ? s.part2 : {};
  const p3 = s.part3 && typeof s.part3 === 'object' ? s.part3 : {};

  const cleanRoomPassword = String(s.roomPassword || '');
  const hasRoomPassword = Boolean(s.hasRoomPassword || cleanRoomPassword.trim().length > 0);
  const speakingTrack = ['daily', 'exam_room', 'general'].includes(s.speakingTrack)
    ? s.speakingTrack
    : hasRoomPassword
    ? 'exam_room'
    : 'general';

  return {
    speakingTrack,
    dailyDate: String(s.dailyDate || '').trim().slice(0, 10),
    dailyMandatory: speakingTrack === 'daily' ? s.dailyMandatory !== false : Boolean(s.dailyMandatory),
    roomPassword: cleanRoomPassword,
    hasRoomPassword,
    hashtags: normalizeTestHashtags(s.hashtags),
    disableAiTts: Boolean(s.disableAiTts),
    hidePromptTextWhenAudio: Boolean(s.hidePromptTextWhenAudio),
    isForecast: Boolean(s.isForecast),
    autoAiGrade: s.autoAiGrade !== false,
    part1SpeakSec: Math.max(15, Number(s.part1SpeakSec ?? def.part1SpeakSec) || 45),
    part2PrepSec: Math.max(10, Number(s.part2PrepSec ?? def.part2PrepSec) || 60),
    part2SpeakSec: Math.max(30, Number(s.part2SpeakSec ?? def.part2SpeakSec) || 120),
    part3SpeakSec: Math.max(15, Number(s.part3SpeakSec ?? def.part3SpeakSec) || 60),
    part1: {
      enabled: p1.enabled !== false,
      topic: String(p1.topic ?? def.part1.topic),
      questions: Array.isArray(p1.questions)
        ? p1.questions.map((q, idx) => ({
            id: q?.id || `sp1_${idx + 1}`,
            prompt: String(q?.prompt || '').trim(),
            hint: String(q?.hint || '').trim(),
            audioUrl: String(q?.audioUrl || '').trim(),
            audioFileName: String(q?.audioFileName || '').trim()
          }))
        : def.part1.questions
    },
    part2: {
      enabled: p2.enabled !== false,
      title: String(p2.title ?? def.part2.title),
      cueCardPrompt: String(p2.cueCardPrompt ?? def.part2.cueCardPrompt),
      bullets: Array.isArray(p2.bullets)
        ? p2.bullets.map(b => String(b || '').trim())
        : def.part2.bullets,
      followUpQuestion: String(p2.followUpQuestion ?? ''),
      audioUrl: String(p2.audioUrl || '').trim(),
      audioFileName: String(p2.audioFileName || '').trim()
    },
    part3: {
      enabled: p3.enabled !== false,
      topic: String(p3.topic ?? def.part3.topic),
      questions: Array.isArray(p3.questions)
        ? p3.questions.map((q, idx) => ({
            id: q?.id || `sp3_${idx + 1}`,
            prompt: String(q?.prompt || '').trim(),
            hint: String(q?.hint || '').trim(),
            audioUrl: String(q?.audioUrl || '').trim(),
            audioFileName: String(q?.audioFileName || '').trim()
          }))
        : def.part3.questions
    }
  };
};

export const getSpeakingQuestionItems = (rawSpeaking, partFilter = 'all') => {
  const sp = normalizeSpeakingSection(rawSpeaking);
  const items = [];

  if ((partFilter === 'all' || partFilter === 'part1') && sp.part1.enabled) {
    (sp.part1.questions || [])
      .filter(q => Boolean(String(q.prompt || '').trim() || String(q.audioUrl || '').trim()))
      .forEach((q, idx) => {
        items.push({
          id: q.id || `sp1_${idx + 1}`,
          part: 1,
          partLabel: 'Part 1',
          topic: sp.part1.topic || 'Part 1 Interview',
          prompt: q.prompt || '',
          bullets: [],
          hint: q.hint || '',
          audioUrl: q.audioUrl || '',
          audioFileName: q.audioFileName || '',
          prepSec: 0,
          speakSec: sp.part1SpeakSec
        });
      });
  }

  if (
    (partFilter === 'all' || partFilter === 'part2') &&
    sp.part2.enabled &&
    Boolean(String(sp.part2.cueCardPrompt || sp.part2.title || sp.part2.audioUrl || '').trim())
  ) {
    items.push({
      id: 'sp2_cuecard',
      part: 2,
      partLabel: 'Part 2 Cue Card',
      topic: sp.part2.title || 'Individual Long Turn',
      prompt: sp.part2.cueCardPrompt || sp.part2.title || '',
      bullets: (sp.part2.bullets || []).filter(Boolean),
      hint: sp.part2.followUpQuestion ? `Câu hỏi phụ gợi ý: ${sp.part2.followUpQuestion}` : '',
      audioUrl: sp.part2.audioUrl || '',
      audioFileName: sp.part2.audioFileName || '',
      prepSec: sp.part2PrepSec,
      speakSec: sp.part2SpeakSec
    });
  }

  if ((partFilter === 'all' || partFilter === 'part3') && sp.part3.enabled) {
    (sp.part3.questions || [])
      .filter(q => Boolean(String(q.prompt || '').trim() || String(q.audioUrl || '').trim()))
      .forEach((q, idx) => {
        items.push({
          id: q.id || `sp3_${idx + 1}`,
          part: 3,
          partLabel: 'Part 3 Discussion',
          topic: sp.part3.topic || 'Two-way Discussion',
          prompt: q.prompt || '',
          bullets: [],
          hint: q.hint || '',
          audioUrl: q.audioUrl || '',
          audioFileName: q.audioFileName || '',
          prepSec: 0,
          speakSec: sp.part3SpeakSec
        });
      });
  }

  return items;
};

export const parseScheduleTimestamp = (val) => {
  if (val === null || val === undefined || val === '') return null;
  if (typeof val === 'number') {
    return Number.isFinite(val) && val > 0 ? val : null;
  }
  const str = String(val).trim();
  if (!str) return null;
  const num = Number(str);
  if (Number.isFinite(num) && num > 0) return num;
  const parsed = Date.parse(str);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
};

export const normalizeExamConfig = (test) => {
  const testMode = test?.testMode === 'single_skill' ? 'single_skill' : 'full_exam';
  const focusSkill = testMode === 'single_skill' && ALL_SKILL_OPTIONS.includes(test?.focusSkill)
    ? test.focusSkill
    : null;

  let order;
  if (testMode === 'single_skill' && focusSkill) {
    order = [focusSkill];
  } else {
    const rawOrder = Array.isArray(test?.sectionOrder) ? test.sectionOrder : DEFAULT_SECTION_ORDER;
    const validSkills = new Set(DEFAULT_SECTION_ORDER);
    const deduped = rawOrder.filter((s, idx) => validSkills.has(s) && rawOrder.indexOf(s) === idx);
    const missing = DEFAULT_SECTION_ORDER.filter(s => !deduped.includes(s));
    order = [...deduped, ...missing];
  }

  const rawDurations = test?.sectionDurations || {};
  const durations = {
    listening: Math.max(1, Number(rawDurations.listening ?? DEFAULT_SECTION_DURATIONS.listening) || 30),
    reading: Math.max(1, Number(rawDurations.reading ?? DEFAULT_SECTION_DURATIONS.reading) || 60),
    writing: Math.max(1, Number(rawDurations.writing ?? DEFAULT_SECTION_DURATIONS.writing) || 60),
    speaking: Math.max(1, Number(rawDurations.speaking ?? DEFAULT_SECTION_DURATIONS.speaking) || 14)
  };

  const scheduleMode = ['deadline_lock', 'deadline_track', 'flexible'].includes(test?.scheduleMode)
    ? test.scheduleMode
    : 'flexible';
  const openAt = parseScheduleTimestamp(test?.openAt);
  const dueAt = parseScheduleTimestamp(test?.dueAt);

  const assignedClassIds = Array.isArray(test?.assignedClassIds)
    ? Array.from(new Set(test.assignedClassIds.map(id => String(id || '').trim()).filter(Boolean)))
    : [];

  const visibility = test?.visibility === 'private' ? 'private' : 'public';
  const priceVnd = testMode === 'single_skill' ? 0 : Math.max(0, Math.min(10_000_000, Math.round(Number(test?.priceVnd) || 0)));
  const examCategory =
    testMode === 'single_skill'
      ? 'daily_zone'
      : test?.examCategory === 'periodic_mock' || priceVnd >= 200000
      ? 'periodic_mock'
      : 'real_exam';

  const rawMaxAttempts = Math.max(0, Number(test?.maxAttempts ?? 0) || 0);
  // Thực Chiến Thi Thật & Mock Test Định Kỳ strictly 1 attempt; Daily Zone defaults to unlimited retries (0)
  const maxAttempts =
    testMode === 'full_exam'
      ? 1
      : rawMaxAttempts;

  const sequentialMode = testMode === 'single_skill' ? false : test?.sequentialMode !== false;
  const allowEarlyNextSection = testMode === 'single_skill' ? true : !!test?.allowEarlyNextSection;
  const spRoomPass = focusSkill === 'speaking' ? String(test?.speaking?.roomPassword || '').trim() : '';
  const spHasRoomPass = focusSkill === 'speaking' ? Boolean(test?.speaking?.hasRoomPassword || spRoomPass.length > 0) : false;
  const examPassword = String(test?.examPassword || spRoomPass || '').trim();
  const hasExamPassword = Boolean(test?.hasExamPassword || spHasRoomPass || examPassword.length > 0);
  const isSpeakingExamRoom = focusSkill === 'speaking' && (test?.speaking?.speakingTrack === 'exam_room' || spHasRoomPass);
  const explicitPurpose = ['real_exam', 'periodic_mock', 'paid_practice', 'free_practice', 'draft'].includes(test?.examPurpose)
    ? test.examPurpose
    : '';
  const examPurpose =
    visibility === 'private'
      ? 'draft'
      : examCategory === 'periodic_mock'
      ? 'periodic_mock'
      : testMode === 'full_exam' || isSpeakingExamRoom || hasExamPassword
      ? 'real_exam'
      : explicitPurpose || (maxAttempts === 1 ? 'real_exam' : 'free_practice');
  const hashtags = normalizeTestHashtags([
    ...(Array.isArray(test?.hashtags) ? test.hashtags : typeof test?.hashtags === 'string' ? [test.hashtags] : []),
    ...(Array.isArray(test?.speaking?.hashtags) ? test.speaking.hashtags : [])
  ]);

  const dailySubCategory = String(test?.dailySubCategory || '').trim();
  let writingTaskScope;
  if (testMode === 'single_skill' && focusSkill === 'writing') {
    // Daily Zone Writing is ALWAYS single-task (Task 1 OR Task 2); full 2-task Writing only exists in Thực Chiến / Mock Test full exams.
    if (test?.writingTaskScope === 'task2' || dailySubCategory === 'w2_essay' || /\b(task\s*2|w2)\b/i.test(String(test?.title || ''))) {
      writingTaskScope = 'task2';
    } else {
      writingTaskScope = 'task1';
    }
  } else {
    writingTaskScope = 'both';
  }

  return {
    testMode,
    focusSkill,
    examCategory,
    dailySubCategory,
    writingTaskScope,
    visibility,
    maxAttempts,
    sequentialMode,
    allowEarlyNextSection,
    priceVnd,
    examPassword,
    hasExamPassword,
    examPurpose,
    hashtags,
    antiCheatEnabled: test?.antiCheatEnabled !== false,
    allowInternalCopyPaste: test?.allowInternalCopyPaste !== false,
    assignedClassIds,
    scheduleMode,
    openAt,
    dueAt,
    order,
    durations
  };
};

export const getEffectiveTestHashtags = (test) => {
  if (!test || typeof test !== 'object') return [];
  const cfg = normalizeExamConfig(test);
  const isSpeaking = cfg.testMode === 'single_skill' && cfg.focusSkill === 'speaking';
  const sp = isSpeaking ? normalizeSpeakingSection(test.speaking) : null;
  const hasPass = Boolean(cfg.hasExamPassword || cfg.examPassword || sp?.hasRoomPassword || sp?.roomPassword);
  const isRealExam =
    cfg.examPurpose === 'real_exam' ||
    hasPass ||
    sp?.speakingTrack === 'exam_room' ||
    cfg.maxAttempts === 1;
  const isDaily = Boolean(isSpeaking && sp?.speakingTrack === 'daily');
  const isForecast = Boolean(isSpeaking && sp?.isForecast);

  const items = [];
  const seen = new Set();
  const pushTag = (rawTag, kind = 'custom') => {
    const clean = normalizeSingleHashtag(rawTag);
    if (!clean) return;
    const key = clean.toLowerCase();
    if (seen.has(key)) return;
    seen.add(key);
    items.push({ tag: clean, kind });
  };

  if (isRealExam) {
    pushTag('#ThiThật', 'real_exam');
  }
  if (hasPass) {
    pushTag('#CóPass', 'password');
  }
  if (isDaily) {
    pushTag('#SpeakingDaily', 'daily');
  }
  if (isForecast) {
    pushTag('#Forecast', 'forecast');
  }
  if (!isRealExam && !isDaily) {
    pushTag('#LuyệnTậpTựDo', 'practice');
  }

  (cfg.hashtags || []).forEach(t => {
    const lower = t.toLowerCase();
    const inferredKind =
      lower === '#thithật' || lower === '#teamsắpthi'
        ? 'real_exam'
        : lower === '#cópass'
        ? 'password'
        : lower === '#speakingdaily'
        ? 'daily'
        : lower === '#forecast'
        ? 'forecast'
        : lower === '#luyệntậptựdo'
        ? 'practice'
        : 'custom';
    pushTag(t, inferredKind);
  });

  return items;
};

export const getUserClassIds = (classesDb, username) => {
  const uname = String(username || '').trim();
  if (!uname || !classesDb || typeof classesDb !== 'object') return [];
  return Object.values(classesDb)
    .filter(cls => cls && Array.isArray(cls.studentUsernames) && cls.studentUsernames.includes(uname))
    .map(cls => cls.id)
    .filter(Boolean);
};

export const canUserAccessTest = (test, classesDb, currentUser) => {
  if (!test) return false;
  const role = currentUser?.role || 'student';
  if (role === 'teacher' || role === 'admin') return true;
  const cfg = normalizeExamConfig(test);
  if (cfg.visibility === 'private') return false;
  if (!Array.isArray(cfg.assignedClassIds) || cfg.assignedClassIds.length === 0) {
    return true;
  }
  const myClassIds = getUserClassIds(classesDb, currentUser?.username);
  return cfg.assignedClassIds.some(cid => myClassIds.includes(cid));
};

export const getAssignedClassNames = (testOrIds, classesDb) => {
  const ids = Array.isArray(testOrIds)
    ? testOrIds
    : normalizeExamConfig(testOrIds).assignedClassIds;
  if (!Array.isArray(ids) || ids.length === 0 || !classesDb || typeof classesDb !== 'object') {
    return [];
  }
  return ids
    .map(id => {
      const cls = classesDb[id];
      return cls ? { id, name: cls.name || id } : null;
    })
    .filter(Boolean);
};

export const getVietnamTodayDateKey = (nowMs = Date.now()) =>
  new Date((Number(nowMs) || Date.now()) + 7 * 60 * 60 * 1000).toISOString().slice(0, 10);

export const canViewerSeeMember = (member, viewerUser, classesDb = {}) => {
  if (!member || !member.username) return false;
  if (!viewerUser) return false;
  const viewerIsAdmin = Boolean(viewerUser.isSuperAdmin || viewerUser.isSystemAdmin);
  const viewerIsTeacher = viewerUser.role === 'teacher';
  const memberIsAdmin = Boolean(member.isSystemAdmin || member.isSuperAdmin || member.role === 'admin');
  const memberIsTeacher = !memberIsAdmin && member.role === 'teacher';

  if (viewerIsAdmin) return true;
  if (member.hiddenFromTeacher || member.isSuperAdmin) return memberIsAdmin;
  if (viewerIsTeacher) return true;

  // Strict student isolation: only self + Teachers + System Admin + classmates sharing >= 1 class
  if (member.username === viewerUser.username) return true;
  if (memberIsAdmin || memberIsTeacher) return true;

  const myClassIds = getUserClassIds(classesDb, viewerUser.username);
  if (myClassIds.length === 0) return false;
  const peerClassIds = getUserClassIds(classesDb, member.username);
  return myClassIds.some(cid => peerClassIds.includes(cid));
};

export const evaluateSpeakingDailyCompliance = ({
  tests = [],
  attempts = [],
  usersDb = {},
  classesDb = {},
  viewerUser = null,
  nowMs = null,
  todayKey = ''
} = {}) => {
  const effectiveTodayKey = todayKey || getVietnamTodayDateKey(nowMs || Date.now());
  const dailyTests = (Array.isArray(tests) ? tests : []).filter(t => {
    const cfg = normalizeExamConfig(t);
    const sp = normalizeSpeakingSection(t?.speaking);
    return cfg.testMode === 'single_skill' && cfg.focusSkill === 'speaking' && sp.speakingTrack === 'daily';
  });

  const mandatoryDailyTests = dailyTests.filter(t => {
    const cfg = normalizeExamConfig(t);
    const sp = normalizeSpeakingSection(t?.speaking);
    return cfg.visibility !== 'private' && sp.dailyMandatory !== false;
  });

  const allStudents = Object.values(usersDb || {}).filter(
    u => u && u.role !== 'teacher' && u.role !== 'admin' && !u.isSuperAdmin && !u.isSystemAdmin && !u.hiddenFromTeacher
  );

  const attemptPairSet = new Set();
  (Array.isArray(attempts) ? attempts : []).forEach(att => {
    const uname = String(att?.studentId || att?.studentUsername || '').trim();
    if (uname && att?.testId) {
      attemptPairSet.add(`${att.testId}::${uname}`);
    }
  });

  const perTest = mandatoryDailyTests.map(test => {
    const cfg = normalizeExamConfig(test);
    const sp = normalizeSpeakingSection(test?.speaking);
    const targetStudents =
      cfg.assignedClassIds.length > 0
        ? allStudents.filter(stu =>
            getUserClassIds(classesDb, stu.username).some(cid => cfg.assignedClassIds.includes(cid))
          )
        : allStudents;

    const doneStudents = [];
    const missingStudents = [];
    targetStudents.forEach(stu => {
      if (attemptPairSet.has(`${test.id}::${stu.username}`)) {
        doneStudents.push(stu);
      } else {
        missingStudents.push(stu);
      }
    });

    return {
      test,
      dailyDate: sp.dailyDate || '',
      isToday: Boolean(sp.dailyDate && sp.dailyDate === effectiveTodayKey),
      targetStudents,
      doneStudents,
      missingStudents
    };
  });

  const missingStudentsMap = new Map();
  perTest.forEach(entry => {
    entry.missingStudents.forEach(stu => {
      if (!missingStudentsMap.has(stu.username)) {
        missingStudentsMap.set(stu.username, { student: stu, missingTests: [] });
      }
      missingStudentsMap.get(stu.username).missingTests.push(entry.test);
    });
  });

  const myDailyTests = viewerUser
    ? mandatoryDailyTests.filter(t => canUserAccessTest(t, classesDb, viewerUser))
    : [];
  const myPendingDailyTests = viewerUser
    ? myDailyTests.filter(t => !attemptPairSet.has(`${t.id}::${viewerUser.username}`))
    : [];
  const myCompletedDailyTests = viewerUser
    ? myDailyTests.filter(t => attemptPairSet.has(`${t.id}::${viewerUser.username}`))
    : [];

  return {
    todayKey: effectiveTodayKey,
    dailyTests,
    mandatoryDailyTests,
    perTest,
    missingStudentSummaries: Array.from(missingStudentsMap.values()),
    myDailyTests,
    myPendingDailyTests,
    myCompletedDailyTests
  };
};

export const evaluateTestSchedule = (testOrCfg, nowMs = Date.now()) => {
  const cfg = testOrCfg && Array.isArray(testOrCfg.order) && 'scheduleMode' in testOrCfg
    ? testOrCfg
    : normalizeExamConfig(testOrCfg);
  const notYetOpen = Boolean(cfg.openAt && nowMs < cfg.openAt);
  const hasDue = Boolean(cfg.scheduleMode !== 'flexible' && cfg.dueAt);
  const pastDue = Boolean(hasDue && nowMs > cfg.dueAt);
  const lockedBySchedule = notYetOpen || (cfg.scheduleMode === 'deadline_lock' && pastDue);
  const isLateWindow = cfg.scheduleMode === 'deadline_track' && pastDue;
  return {
    scheduleMode: cfg.scheduleMode,
    openAt: cfg.openAt,
    dueAt: cfg.dueAt,
    notYetOpen,
    hasDue,
    pastDue,
    lockedBySchedule,
    isLateWindow
  };
};

export const formatViDateTime = (tsMs) => {
  const num = parseScheduleTimestamp(tsMs);
  if (!num) return '';
  const d = new Date(num);
  const pad = n => String(n).padStart(2, '0');
  return `${pad(d.getHours())}:${pad(d.getMinutes())} ${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()}`;
};

export const toDatetimeLocalInputValue = (tsMs) => {
  const num = parseScheduleTimestamp(tsMs);
  if (!num) return '';
  const d = new Date(num);
  const pad = n => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
};

export const formatDurationVi = (totalSeconds) => {
  const secs = Math.max(0, Math.round(Number(totalSeconds) || 0));
  if (!secs) return '';
  const hrs = Math.floor(secs / 3600);
  const mins = Math.floor((secs % 3600) / 60);
  const rem = secs % 60;
  if (hrs > 0) return `${hrs}g ${mins}p ${rem}s`;
  if (mins > 0) return rem > 0 ? `${mins}p ${rem}s` : `${mins} phút`;
  return `${rem} giây`;
};

export const getReadingPassages = (readingObj) => {
  if (Array.isArray(readingObj?.passages) && readingObj.passages.length > 0) {
    return readingObj.passages.map((p, idx) => ({
      id: p.id || `passage-${idx + 1}`,
      title: p.title || `Bài đọc ${idx + 1}`,
      imageUrl: p.imageUrl || '',
      imageFileName: p.imageFileName || '',
      passageText: p.passageText || '',
      clozeText: p.clozeText || ''
    }));
  }
  return [
    {
      id: 'passage-1',
      title: readingObj?.passageTitle || 'Reading Passage 1',
      imageUrl: readingObj?.imageUrl || '',
      imageFileName: readingObj?.imageFileName || '',
      passageText: readingObj?.passageText || '',
      clozeText: readingObj?.clozeText || ''
    }
  ];
};

export const getListeningTracks = (listeningObj) => {
  if (Array.isArray(listeningObj?.tracks) && listeningObj.tracks.length > 0) {
    return listeningObj.tracks.map((tr, idx) => ({
      id: tr.id || `track-${idx + 1}`,
      title: tr.title || `Chủ đề ${idx + 1}`,
      audioUrl: tr.audioUrl || '',
      audioFileName: tr.audioFileName || '',
      imageUrl: tr.imageUrl || '',
      imageFileName: tr.imageFileName || '',
      contextText: tr.contextText || tr.passageText || '',
      clozeText: tr.clozeText || '',
      transcript: tr.transcript || ''
    }));
  }
  return [
    {
      id: 'track-1',
      title: listeningObj?.audioTitle || 'Chủ đề 1',
      audioUrl: listeningObj?.audioUrl || '',
      audioFileName: listeningObj?.audioFileName || '',
      imageUrl: listeningObj?.imageUrl || '',
      imageFileName: listeningObj?.imageFileName || '',
      contextText: listeningObj?.contextText || '',
      clozeText: listeningObj?.clozeText || '',
      transcript: listeningObj?.transcript || ''
    }
  ];
};

export const getListeningAudioKey = (track, idx) =>
  idx === 0 && (!track?.id || track.id === 'track-1')
    ? 'mainAudio'
    : `track_${track?.id || idx}`;

export const createEmptyTestForm = () => ({
  title: '',
  description: '',
  testMode: 'full_exam',
  focusSkill: null,
  examCategory: 'real_exam',
  dailySubCategory: '',
  writingTaskScope: 'both',
  autoAiGrade: false,
  visibility: 'private',
  examPurpose: 'real_exam',
  priceVnd: 20000,
  examPassword: '',
  maxAttempts: 1,
  sequentialMode: true,
  allowEarlyNextSection: false,
  antiCheatEnabled: true,
  allowInternalCopyPaste: true,
  assignedClassIds: [],
  sectionOrder: [...DEFAULT_SECTION_ORDER],
  sectionDurations: { ...DEFAULT_SECTION_DURATIONS },
  maxAudioPlays: 1,
  shuffleOptions: true,
  allowViewAnswers: false,
  listening: {
    audioUrl: '',
    audioFileName: '',
    imageUrl: '',
    imageFileName: '',
    contextText: '',
    clozeText: '',
    transcript: '',
    tracks: [
      {
        id: 'track-1',
        title: 'Chủ đề 1',
        audioUrl: '',
        audioFileName: '',
        imageUrl: '',
        imageFileName: '',
        contextText: '',
        clozeText: '',
        transcript: ''
      }
    ],
    questions: []
  },
  reading: {
    passageTitle: '',
    passageText: '',
    clozeText: '',
    imageUrl: '',
    imageFileName: '',
    passages: [{ id: 'passage-1', title: 'Bài đọc 1', imageUrl: '', imageFileName: '', passageText: '', clozeText: '' }],
    questions: []
  },
  writing: {
    task1: { prompt: '', minWords: 150, imageUrl: '', modelAnswer: '' },
    task2: { prompt: '', minWords: 250, modelAnswer: '' }
  },
  speaking: createDefaultSpeakingSection()
});

export const createEmptySingleSkillTestForm = (skill = 'speaking', subOpts = {}) => {
  const safeSkill = ALL_SKILL_OPTIONS.includes(skill) ? skill : 'speaking';
  const taskScope =
    safeSkill === 'writing' && ['task1', 'task2', 'both'].includes(subOpts?.writingTaskScope)
      ? subOpts.writingTaskScope
      : safeSkill === 'writing'
      ? 'task1'
      : 'both';
  const defaultSubCat =
    subOpts?.dailySubCategory ||
    (safeSkill === 'reading'
      ? 'shw_1'
      : safeSkill === 'listening'
      ? 'listening_shw'
      : safeSkill === 'writing'
      ? (taskScope === 'task2' ? 'w2_essay' : 'w1_map')
      : '');
  const skillNames = {
    listening: 'Listening',
    reading: 'Reading',
    writing: taskScope === 'task1' ? 'Writing Task 1' : taskScope === 'task2' ? 'Writing Task 2' : 'Writing',
    speaking: 'Speaking'
  };
  const base = createEmptyTestForm();
  return {
    ...base,
    id: 'test-skill-' + Date.now(),
    title: `Bài Tập Daily ${skillNames[safeSkill]} Mới`,
    description:
      safeSkill === 'speaking'
        ? 'Bài tập Daily Speaking / Cày Forecast cùng Ms. Như - lưu ghi âm & chờ Ms. Như duyệt điểm.'
        : `Bài tập Daily Zone kỹ năng ${skillNames[safeSkill]} (làm lại nhiều lần • có Pass theo Team).`,
    createdAt: new Date().toISOString().split('T')[0],
    testMode: 'single_skill',
    focusSkill: safeSkill,
    examCategory: 'daily_zone',
    dailySubCategory: defaultSubCat,
    writingTaskScope: taskScope,
    priceVnd: 0,
    examPurpose: 'free_practice',
    autoAiGrade: false,
    visibility: 'private',
    maxAttempts: 0,
    sequentialMode: false,
    allowEarlyNextSection: true,
    antiCheatEnabled: false,
    allowViewAnswers: true,
    sectionOrder: [safeSkill],
    sectionDurations: { ...DEFAULT_SECTION_DURATIONS }
  };
};

const CAMBRIDGE_TASK1_CHART_SVG_URL =
  'data:image/svg+xml;charset=utf-8,' +
  encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 680 340" width="680" height="340">
  <rect width="680" height="340" rx="14" fill="#ffffff" stroke="#e2e8f0" stroke-width="2"/>
  <text x="340" y="30" text-anchor="middle" font-family="system-ui,-apple-system,sans-serif" font-size="14" font-weight="700" fill="#0f172a">Electricity Generation by Energy Source in Northland (TWh), 2005–2025</text>
  <line x1="72" y1="250" x2="640" y2="250" stroke="#94a3b8" stroke-width="1.5"/>
  <line x1="72" y1="66" x2="72" y2="250" stroke="#94a3b8" stroke-width="1.5"/>
  <g stroke="#e2e8f0" stroke-dasharray="4 4" stroke-width="1">
    <line x1="72" y1="204" x2="640" y2="204"/>
    <line x1="72" y1="158" x2="640" y2="158"/>
    <line x1="72" y1="112" x2="640" y2="112"/>
    <line x1="72" y1="66" x2="640" y2="66"/>
  </g>
  <g font-family="system-ui,-apple-system,sans-serif" font-size="11" fill="#475569" text-anchor="end">
    <text x="64" y="254">0</text>
    <text x="64" y="208">40</text>
    <text x="64" y="162">80</text>
    <text x="64" y="116">120</text>
    <text x="64" y="70">160</text>
  </g>
  <text x="20" y="160" transform="rotate(-90 20 160)" text-anchor="middle" font-family="system-ui,-apple-system,sans-serif" font-size="11" font-weight="600" fill="#475569">Output (TWh)</text>
  <!-- Coal: 140, 115, 45 -->
  <rect x="102" y="89" width="26" height="161" rx="3" fill="#334155"/><text x="115" y="84" text-anchor="middle" font-family="sans-serif" font-size="10" font-weight="700" fill="#334155">140</text>
  <rect x="132" y="118" width="26" height="132" rx="3" fill="#0284c7"/><text x="145" y="113" text-anchor="middle" font-family="sans-serif" font-size="10" font-weight="700" fill="#0284c7">115</text>
  <rect x="162" y="198" width="26" height="52" rx="3" fill="#0d9488"/><text x="175" y="193" text-anchor="middle" font-family="sans-serif" font-size="10" font-weight="700" fill="#0d9488">45</text>
  <text x="145" y="272" text-anchor="middle" font-family="system-ui,sans-serif" font-size="12" font-weight="700" fill="#0f172a">Coal</text>
  <!-- Natural Gas: 80, 105, 90 -->
  <rect x="242" y="158" width="26" height="92" rx="3" fill="#334155"/><text x="255" y="153" text-anchor="middle" font-family="sans-serif" font-size="10" font-weight="700" fill="#334155">80</text>
  <rect x="272" y="129" width="26" height="121" rx="3" fill="#0284c7"/><text x="285" y="124" text-anchor="middle" font-family="sans-serif" font-size="10" font-weight="700" fill="#0284c7">105</text>
  <rect x="302" y="146" width="26" height="104" rx="3" fill="#0d9488"/><text x="315" y="141" text-anchor="middle" font-family="sans-serif" font-size="10" font-weight="700" fill="#0d9488">90</text>
  <text x="285" y="272" text-anchor="middle" font-family="system-ui,sans-serif" font-size="12" font-weight="700" fill="#0f172a">Natural Gas</text>
  <!-- Hydroelectric: 45, 50, 55 -->
  <rect x="382" y="198" width="26" height="52" rx="3" fill="#334155"/><text x="395" y="193" text-anchor="middle" font-family="sans-serif" font-size="10" font-weight="700" fill="#334155">45</text>
  <rect x="412" y="192" width="26" height="58" rx="3" fill="#0284c7"/><text x="425" y="187" text-anchor="middle" font-family="sans-serif" font-size="10" font-weight="700" fill="#0284c7">50</text>
  <rect x="442" y="187" width="26" height="63" rx="3" fill="#0d9488"/><text x="455" y="182" text-anchor="middle" font-family="sans-serif" font-size="10" font-weight="700" fill="#0d9488">55</text>
  <text x="425" y="272" text-anchor="middle" font-family="system-ui,sans-serif" font-size="12" font-weight="700" fill="#0f172a">Hydro</text>
  <!-- Wind & Solar: 10, 42, 135 -->
  <rect x="522" y="238" width="26" height="12" rx="3" fill="#334155"/><text x="535" y="233" text-anchor="middle" font-family="sans-serif" font-size="10" font-weight="700" fill="#334155">10</text>
  <rect x="552" y="202" width="26" height="48" rx="3" fill="#0284c7"/><text x="565" y="197" text-anchor="middle" font-family="sans-serif" font-size="10" font-weight="700" fill="#0284c7">42</text>
  <rect x="582" y="95" width="26" height="155" rx="3" fill="#0d9488"/><text x="595" y="90" text-anchor="middle" font-family="sans-serif" font-size="10" font-weight="700" fill="#0d9488">135</text>
  <text x="565" y="272" text-anchor="middle" font-family="system-ui,sans-serif" font-size="12" font-weight="700" fill="#0f172a">Wind &amp; Solar</text>
  <!-- Legend -->
  <g transform="translate(225, 298)" font-family="system-ui,sans-serif" font-size="11" font-weight="600" fill="#334155">
    <rect x="0" y="0" width="14" height="14" rx="3" fill="#334155"/><text x="20" y="11">2005</text>
    <rect x="78" y="0" width="14" height="14" rx="3" fill="#0284c7"/><text x="98" y="11">2015</text>
    <rect x="156" y="0" width="14" height="14" rx="3" fill="#0d9488"/><text x="176" y="11">2025</text>
  </g>
</svg>`
  );

export const DEFAULT_TESTS = [
  {
    id: 'test-ielts-cam-18-01',
    seedTag: 'cam18_t1_v1',
    title: 'IELTS Academic Mock Test 02 - Cambridge Standard (Đục Lỗ + Full 4 Skills)',
    description:
      'Đề thi IELTS Academic hoàn chỉnh chuẩn phòng thi Luyện thi IELTS Nha Trang (Ms. Như): Listening 3 Parts, Reading 2 Academic Passages, Writing Task 1 + Task 2 và Speaking Part 1–3.',
    createdAt: '2026-11-14',
    visibility: 'public',
    maxAttempts: 1,
    sequentialMode: false,
    allowEarlyNextSection: true,
    antiCheatEnabled: false,
    sectionOrder: ['listening', 'reading', 'writing', 'speaking'],
    sectionDurations: { listening: 30, reading: 60, writing: 60, speaking: 14 },
    maxAudioPlays: 2,
    shuffleOptions: false,
    allowViewAnswers: true,
    listening: {
      audioUrl: '',
      clozeText: `Questions 1-10
Complete the notes below.
Write ONE WORD AND/OR A NUMBER for each answer.

**HIRING A PUBLIC ROOM**
Example
• the Main Hall – seats ..........200..........

### Room and cost
• the {{1}} Room – seats 100
• Cost of Main Hall for Saturday evening: £{{2}}
• + £250 deposit ({{3}} payment is required)
• Cost includes use of tables and chairs and also {{4}}
• Additional charge for use of the kitchen: £25

### Before and after the event
• Will need a {{5}} licence
• Caretaker must confirm floor is {{6}} before locking up
• Bring your own extension {{7}} if needed
• Do not leave {{8}} in the entrance corridor
• Sort all {{9}} waste after the dinner
• Contact caretaker Mr {{10}} for key collection`,
      transcript: `Receptionist: Good morning, Thorndyke Community Centre. Caller: Hello, I am calling to enquire about booking a room for our neighbourhood charity dinner next month. Receptionist: Certainly. We have the Main Hall which seats 200 people, and for smaller groups we offer the Garden Room, which seats 100. For a Saturday evening booking, the Main Hall costs one hundred and fifteen pounds, so 115 pounds flat rate. Caller: Is there a deposit? Receptionist: Yes, we ask for a 250 pound refundable deposit, and cash payment is required for that. The hire fee includes tables, chairs, and free parking right outside. If you need live singers or amplified music, you will need a music licence. After the dinner, please sort all recyclable waste and make sure the floor is swept clean. You should bring your own extension cables if needed, and remind guests not to leave bicycles inside the entrance corridor. Finally, please contact our caretaker, Mr Evans, to collect the keys.`,
      tracks: [
        {
          id: 'ltr_cam18_1',
          title: 'Part 1: Hiring a Public Room (Q1–10)',
          audioUrl: '',
          audioFileName: '',
          imageUrl: '',
          imageFileName: '',
          contextText: '',
          clozeText: `Questions 1-10
Complete the notes below.
Write ONE WORD AND/OR A NUMBER for each answer.

**HIRING A PUBLIC ROOM**
Example
• the Main Hall – seats ..........200..........

### Room and cost
• the {{1}} Room – seats 100
• Cost of Main Hall for Saturday evening: £{{2}}
• + £250 deposit ({{3}} payment is required)
• Cost includes use of tables and chairs and also {{4}}
• Additional charge for use of the kitchen: £25

### Before and after the event
• Will need a {{5}} licence
• Caretaker must confirm floor is {{6}} before locking up
• Bring your own extension {{7}} if needed
• Do not leave {{8}} in the entrance corridor
• Sort all {{9}} waste after the dinner
• Contact caretaker Mr {{10}} for key collection`,
          transcript: `Receptionist: Good morning, Thorndyke Community Centre. Caller: Hello, I am calling to enquire about booking a room for our neighbourhood charity dinner next month. Receptionist: Certainly. We have the Main Hall which seats 200 people, and for smaller groups we offer the Garden Room, which seats 100. For a Saturday evening booking, the Main Hall costs one hundred and fifteen pounds, so 115 pounds flat rate. Caller: Is there a deposit? Receptionist: Yes, we ask for a 250 pound refundable deposit, and cash payment is required for that. The hire fee includes tables, chairs, and free parking right outside. If you need live singers or amplified music, you will need a music licence. After the dinner, please sort all recyclable waste and make sure the floor is swept clean. You should bring your own extension cables if needed, and remind guests not to leave bicycles inside the entrance corridor. Finally, please contact our caretaker, Mr Evans, to collect the keys.`
        },
        {
          id: 'ltr_cam18_2',
          title: 'Part 2: Portside Maritime Museum (Q11–15)',
          audioUrl: '',
          audioFileName: '',
          imageUrl: '',
          imageFileName: '',
          contextText: '',
          clozeText: '',
          transcript: `Welcome everyone to the Portside Maritime Museum briefing. Before you explore our galleries, here are a few practical details. We are standing inside the historic North Dock building. Although locals often assume it once housed retired sailors or repaired fishing boats, architectural records show it was constructed in 1840 strictly for storing timber and heavy hemp rope for shipyard riggers. Just outside pier two, you will see our newly restored Steam Tugboat. Because boarding spaces on the upper deck are strictly limited for safety reasons, weekend visitors need to collect free timed boarding passes at least 20 minutes before sailing. If you would like audio commentary during your walk, luggage lockers beside reception cost two pounds, whereas multilingual audio handsets are provided completely free of charge at the Information Desk. On Wednesday mornings, our upper-floor Museum Archives open exclusively to registered museum members without any admission charge. Finally, when you feel ready for refreshments, walk beside Pier 3 to our Compass Cafe, where bakers prepare traditional ship biscuits using a nineteenth-century recipe.`
        },
        {
          id: 'ltr_cam18_3',
          title: 'Part 3: Urban Soil Research Project (Q16–20)',
          audioUrl: '',
          audioFileName: '',
          imageUrl: '',
          imageFileName: '',
          contextText: '',
          clozeText: `Questions 16-20
Complete the research summary below.
Write ONE WORD ONLY for each answer.

**URBAN SOIL MICROBIOME PROJECT**
### Methodology
• Samples collected from twelve municipal {{16}} across the city.
• Soil core depth kept consistently at twenty {{17}} below surface turf.

### Key Findings
• Roadside plots showed heavy buildup of zinc and {{18}} particles.
• Adding organic {{19}} boosted earthworm numbers within six weeks.
• Dr Patel advises measuring moisture next semester using a digital {{20}}.`,
          transcript: `Tutor Dr Patel: So Liam and Maya, let us review your preliminary findings for the Urban Soil Microbiome Project. Maya: Right, over the autumn term we collected topsoil samples from twelve municipal parks scattered from the industrial riverfront out to quiet residential hills. Liam: Unlike earlier teams who sampled randomly, we fixed our core depth at twenty centimetres below the surface turf so bacterial layers stayed comparable. Dr Patel: Smart choice. What stood out in the chemistry assays? Maya: Roadside borders contained elevated traces of zinc from brake wear, along with fine lead particles near older arterial intersections. Liam: Fortunately, on plots where groundskeepers mixed in organic compost, earthworm populations bounced back noticeably within just six weeks. Dr Patel: Excellent. Before scaling up next semester, instead of weighing damp trays manually, I advise recording daily soil moisture using a digital sensor.`
        }
      ],
      questions: [
        { id: 'cam18_l1', type: 'fill', blankNum: 1, trackIdx: 0, question: '1. the ______ Room – seats 100', options: [], correctAnswer: 'Garden|garden' },
        { id: 'cam18_l2', type: 'fill', blankNum: 2, trackIdx: 0, question: '2. Cost of Main Hall for Saturday evening: £______', options: [], correctAnswer: '115|£115' },
        { id: 'cam18_l3', type: 'fill', blankNum: 3, trackIdx: 0, question: '3. + £250 deposit (______ payment is required)', options: [], correctAnswer: 'cash|Cash' },
        { id: 'cam18_l4', type: 'fill', blankNum: 4, trackIdx: 0, question: '4. Cost includes use of tables and chairs and also ______', options: [], correctAnswer: 'parking|free parking' },
        { id: 'cam18_l5', type: 'fill', blankNum: 5, trackIdx: 0, question: '5. Will need a ______ licence', options: [], correctAnswer: 'music|Music' },
        { id: 'cam18_l6', type: 'fill', blankNum: 6, trackIdx: 0, question: '6. Caretaker must confirm floor is ______ before locking up', options: [], correctAnswer: 'swept|clean|swept clean' },
        { id: 'cam18_l7', type: 'fill', blankNum: 7, trackIdx: 0, question: '7. Bring your own extension ______ if needed', options: [], correctAnswer: 'cables|cable' },
        { id: 'cam18_l8', type: 'fill', blankNum: 8, trackIdx: 0, question: '8. Do not leave ______ in the entrance corridor', options: [], correctAnswer: 'bicycles|bikes' },
        { id: 'cam18_l9', type: 'fill', blankNum: 9, trackIdx: 0, question: '9. Sort all ______ waste after the dinner', options: [], correctAnswer: 'recyclable|Recyclable' },
        { id: 'cam18_l10', type: 'fill', blankNum: 10, trackIdx: 0, question: '10. Contact caretaker Mr ______ for key collection', options: [], correctAnswer: 'Evans|evans' },
        {
          id: 'cam18_l11',
          type: 'mcq',
          trackIdx: 1,
          question: '11. What was the North Dock building originally constructed for in 1840?',
          options: [
            'A. Storing timber and hemp rope',
            'B. Repairing wooden fishing boats',
            'C. Serving as the harbour customs office',
            'D. Housing retired naval sailors'
          ],
          correctAnswer: 'A. Storing timber and hemp rope'
        },
        {
          id: 'cam18_l12',
          type: 'mcq',
          trackIdx: 1,
          question: '12. Why must weekend visitors collect timed passes for the Steam Tugboat tour?',
          options: [
            'A. Tide schedules change every hour',
            'B. Boarding capacity on deck is strictly limited',
            'C. Guided commentary only runs twice per day',
            'D. Engine maintenance closes the pier at noon'
          ],
          correctAnswer: 'B. Boarding capacity on deck is strictly limited'
        },
        {
          id: 'cam18_l13',
          type: 'mcq',
          trackIdx: 1,
          question: '13. Which service is provided free of charge at the Information Desk?',
          options: [
            'A. Secure luggage lockers',
            'B. Printed harbour charts',
            'C. Multilingual audio handsets',
            'D. Guided photography tours'
          ],
          correctAnswer: 'C. Multilingual audio handsets'
        },
        {
          id: 'cam18_l14',
          type: 'mcq',
          trackIdx: 1,
          question: '14. Who is eligible for free admission to the Museum Archives on Wednesday mornings?',
          options: [
            'A. Local school excursions',
            'B. Marine engineering students',
            'C. Registered museum members',
            'D. Retired dockyard staff'
          ],
          correctAnswer: 'C. Registered museum members'
        },
        {
          id: 'cam18_l15',
          type: 'fill',
          trackIdx: 1,
          question: '15. Visitors can sample traditional ship biscuits at the ______ Cafe near Pier 3. (ONE WORD)',
          options: [],
          correctAnswer: 'Compass|compass'
        },
        { id: 'cam18_l16', type: 'fill', blankNum: 16, trackIdx: 2, question: '16. Samples collected from twelve municipal ______ across the city.', options: [], correctAnswer: 'parks|park' },
        { id: 'cam18_l17', type: 'fill', blankNum: 17, trackIdx: 2, question: '17. Soil core depth kept consistently at twenty ______ below surface turf.', options: [], correctAnswer: 'centimetres|centimeters|cm' },
        { id: 'cam18_l18', type: 'fill', blankNum: 18, trackIdx: 2, question: '18. Roadside plots showed heavy buildup of zinc and ______ particles.', options: [], correctAnswer: 'lead' },
        { id: 'cam18_l19', type: 'fill', blankNum: 19, trackIdx: 2, question: '19. Adding organic ______ boosted earthworm numbers within six weeks.', options: [], correctAnswer: 'compost' },
        { id: 'cam18_l20', type: 'fill', blankNum: 20, trackIdx: 2, question: '20. Dr Patel advises measuring moisture next semester using a digital ______.', options: [], correctAnswer: 'sensor|probe' }
      ]
    },
    reading: {
      passageTitle: 'Passage 1: How Ancient Salt Shaped Trade and Empire',
      passageText: `A For thousands of years before artificial cooling transformed kitchens and shipping, sodium chloride was far more than a culinary seasoning: it functioned as the world’s premier natural preservative. By drawing moisture out of beef, pork, and ocean harvests, curing prevented lethal bacterial decay during winter scarcity and sustained crews across multi-month maritime voyages.

B Because fertile coastal pans and rock-salt deposits were unevenly scattered across continents, salt quickly forged long-distance highways. In Roman Italy, the Via Salaria - one of the peninsula’s oldest engineered roads - carried coastal salt inland toward upland towns. Historians frequently debate whether the modern word “salary” grew directly out of salt stipends; archaeological pay ledgers confirm legionaries were primarily paid in minted silver coins alongside occasional salt rations. Across North Africa, Saharan mines at Taghaza supplied immense rectangular slabs hauled south by camel caravans along desert tracks to Timbuktu, where scarcity made salt slabs rival equal weights of gold dust in regional barter.

C Inevitably, anything indispensable became a tempting fiscal target for monarchs and colonial empires. Medieval French kings imposed the notorious gabelle, forcing citizens above age eight to purchase fixed quotas of heavily taxed state salt - a grievance frequently cited in petitions before the 1789 Revolution. More than a century later, in 1930, Mahatma Gandhi selected British salt monopolies as the symbolic focal point of a 390-kilometre civil disobedience march to the Arabian Sea, demonstrating how an everyday mineral could mobilise political solidarity across social classes.

D Everything changed once household iceboxes gave way to electric refrigeration in the early twentieth century. Salt lost its historical monopoly over food preservation, yet modern industry consumes unprecedented tonnages today - over half of global production now feeds chemical manufacturing, producing chlorine, caustic soda, and glass rather than dining-table shakers.`,
      clozeText: `Questions 1-5
Complete the summary below.
Choose NO MORE THAN TWO WORDS from the passage for each answer.

**THE ECONOMIC HISTORY OF SALT**
• Long before mechanical cooling existed, communities relied on salt as the chief natural {{1}} for fish and meat.
• Across the Sahara Desert, merchants loaded mineral blocks onto {{2}} caravans bound for Timbuktu.
• In ancient Italy, coastal pans supplied inland towns along the historic {{3}}.
• Heavy anger over France’s mandatory {{4}} tax contributed to protests prior to 1789.
• Today, more than half of global salt tonnage supplies {{5}} manufacturing rather than kitchens.`,
      passages: [
        {
          id: 'pass_cam18_1',
          title: 'Passage 1: How Ancient Salt Shaped Trade and Empire',
          imageUrl: '',
          imageFileName: '',
          passageText: `A For thousands of years before artificial cooling transformed kitchens and shipping, sodium chloride was far more than a culinary seasoning: it functioned as the world’s premier natural preservative. By drawing moisture out of beef, pork, and ocean harvests, curing prevented lethal bacterial decay during winter scarcity and sustained crews across multi-month maritime voyages.

B Because fertile coastal pans and rock-salt deposits were unevenly scattered across continents, salt quickly forged long-distance highways. In Roman Italy, the Via Salaria - one of the peninsula’s oldest engineered roads - carried coastal salt inland toward upland towns. Historians frequently debate whether the modern word “salary” grew directly out of salt stipends; archaeological pay ledgers confirm legionaries were primarily paid in minted silver coins alongside occasional salt rations. Across North Africa, Saharan mines at Taghaza supplied immense rectangular slabs hauled south by camel caravans along desert tracks to Timbuktu, where scarcity made salt slabs rival equal weights of gold dust in regional barter.

C Inevitably, anything indispensable became a tempting fiscal target for monarchs and colonial empires. Medieval French kings imposed the notorious gabelle, forcing citizens above age eight to purchase fixed quotas of heavily taxed state salt - a grievance frequently cited in petitions before the 1789 Revolution. More than a century later, in 1930, Mahatma Gandhi selected British salt monopolies as the symbolic focal point of a 390-kilometre civil disobedience march to the Arabian Sea, demonstrating how an everyday mineral could mobilise political solidarity across social classes.

D Everything changed once household iceboxes gave way to electric refrigeration in the early twentieth century. Salt lost its historical monopoly over food preservation, yet modern industry consumes unprecedented tonnages today - over half of global production now feeds chemical manufacturing, producing chlorine, caustic soda, and glass rather than dining-table shakers.`,
          clozeText: `Questions 1-5
Complete the summary below.
Choose NO MORE THAN TWO WORDS from the passage for each answer.

**THE ECONOMIC HISTORY OF SALT**
• Long before mechanical cooling existed, communities relied on salt as the chief natural {{1}} for fish and meat.
• Across the Sahara Desert, merchants loaded mineral blocks onto {{2}} caravans bound for Timbuktu.
• In ancient Italy, coastal pans supplied inland towns along the historic {{3}}.
• Heavy anger over France’s mandatory {{4}} tax contributed to protests prior to 1789.
• Today, more than half of global salt tonnage supplies {{5}} manufacturing rather than kitchens.`
        },
        {
          id: 'pass_cam18_2',
          title: 'Passage 2: Designing Cooler Cities & Urban Microclimates',
          imageUrl: '',
          imageFileName: '',
          passageText: `A Modern metropolises routinely register night-time temperatures three to five degrees Celsius warmer than adjacent agricultural fields - a phenomenon climatologists term the Urban Heat Island (UHI) effect. Dense concentrations of dark slate roofing and asphalt roadways possess low albedo, a technical measure of solar reflectance; instead of bouncing sunlight skyward, these dark materials absorb up to ninety percent of incoming solar radiation throughout the afternoon.

B After sunset, geometry determines how rapidly that trapped energy escapes. In leafy rural meadows, warmth radiates directly upward toward the night sky. By contrast, narrow downtown "street canyons" flanked by glass and concrete facades repeatedly re-emit and trap outgoing longwave thermal radiation between opposing walls, keeping pavements hot well past midnight and driving peak air-conditioning electricity demand.

C Field experiments in Athens and Los Angeles indicate that coating flat commercial rooftops with pale high-albedo paint lowers top-floor indoor temperatures by two to three degrees Celsius across sunny climates without mechanical cooling. Complementing reflective roofs, porous stone pavements - pioneered under "Sponge City" drainage plans - capture rainwater below porous bricks and passively cool surrounding pedestrian air through gradual daytime evaporation.

D Green infrastructure must still obey aerodynamic logic. Planting shade trees lowers surface temperatures under canopies, yet urban meteorologists caution that overly dense, unbroken rows of broadleaf trees can inadvertently block nocturnal sea breezes from flushing polluted warm air down central avenues. Well-designed cooling corridors carefully pair staggered shade trees with open wind channels so sunlit districts cool naturally once evening arrives.`,
          clozeText: ''
        }
      ],
      questions: [
        { id: 'cam18_r1', type: 'fill', blankNum: 1, passageIdx: 0, question: '1. ...chief natural ______ for fish and meat.', options: [], correctAnswer: 'preservative' },
        { id: 'cam18_r2', type: 'fill', blankNum: 2, passageIdx: 0, question: '2. ...loaded mineral blocks onto ______ caravans bound for Timbuktu.', options: [], correctAnswer: 'camel|camels' },
        { id: 'cam18_r3', type: 'fill', blankNum: 3, passageIdx: 0, question: '3. ...inland towns along the historic ______.', options: [], correctAnswer: 'Via Salaria|via salaria' },
        { id: 'cam18_r4', type: 'fill', blankNum: 4, passageIdx: 0, question: '4. ...France’s mandatory ______ tax...', options: [], correctAnswer: 'gabelle|Gabelle' },
        { id: 'cam18_r5', type: 'fill', blankNum: 5, passageIdx: 0, question: '5. ...supplies ______ manufacturing rather than kitchens.', options: [], correctAnswer: 'chemical' },
        {
          id: 'cam18_r6',
          type: 'tfng',
          passageIdx: 0,
          question: '6. Roman soldiers received all of their regular annual pay exclusively in salt rather than coins.',
          options: ['TRUE', 'FALSE', 'NOT GIVEN'],
          correctAnswer: 'FALSE'
        },
        {
          id: 'cam18_r7',
          type: 'tfng',
          passageIdx: 0,
          question: '7. In regional trade at Timbuktu, salt slabs could match an equivalent weight of gold in value.',
          options: ['TRUE', 'FALSE', 'NOT GIVEN'],
          correctAnswer: 'TRUE'
        },
        {
          id: 'cam18_r8',
          type: 'tfng',
          passageIdx: 0,
          question: '8. Excavation work at Taghaza extracted twice as much salt annually as coastal Italian pans.',
          options: ['TRUE', 'FALSE', 'NOT GIVEN'],
          correctAnswer: 'NOT GIVEN'
        },
        {
          id: 'cam18_r9',
          type: 'tfng',
          passageIdx: 0,
          question: '9. Electric household refrigerators brought an end to salt’s dominant role in preserving food.',
          options: ['TRUE', 'FALSE', 'NOT GIVEN'],
          correctAnswer: 'TRUE'
        },
        {
          id: 'cam18_r10',
          type: 'mcq',
          passageIdx: 1,
          question: '10. According to Paragraph B, why do narrow city streets remain hot long after dark?',
          options: [
            'A. Opposing building walls continuously absorb and re-emit thermal radiation',
            'B. Underground metro trains generate continuous mechanical heat',
            'C. Road paints seal soil moisture beneath thick asphalt',
            'D. Air conditioners exhaust steam directly into drainage channels'
          ],
          correctAnswer: 'A. Opposing building walls continuously absorb and re-emit thermal radiation'
        },
        {
          id: 'cam18_r11',
          type: 'mcq',
          passageIdx: 1,
          question: '11. Trials in Athens and Los Angeles showed that pale reflective roof coatings:',
          options: [
            'A. eliminated indoor cooling bills year-round',
            'B. reduced upper-floor indoor heat by two to three degrees Celsius',
            'C. worked only on slanted residential tile roofs',
            'D. increased winter glare on adjacent glass towers'
          ],
          correctAnswer: 'B. reduced upper-floor indoor heat by two to three degrees Celsius'
        },
        {
          id: 'cam18_r12',
          type: 'mcq',
          passageIdx: 1,
          question: '12. What potential drawback do urban meteorologists highlight regarding street trees?',
          options: [
            'A. Deep roots crack porous Sponge City stones within years',
            'B. Dense unbroken canopies can obstruct cool evening breezes',
            'C. Evergreen pollen triggers seasonal respiratory allergies',
            'D. Fallen branches block sunlight from rooftop solar cells'
          ],
          correctAnswer: 'B. Dense unbroken canopies can obstruct cool evening breezes'
        },
        {
          id: 'cam18_r13',
          type: 'tfng',
          passageIdx: 1,
          question: '13. Dark asphalt absorbs less daytime solar energy than pale painted concrete.',
          options: ['TRUE', 'FALSE', 'NOT GIVEN'],
          correctAnswer: 'FALSE'
        },
        {
          id: 'cam18_r14',
          type: 'tfng',
          passageIdx: 1,
          question: '14. Porous pavements lower street temperatures passively as trapped rainwater evaporates.',
          options: ['TRUE', 'FALSE', 'NOT GIVEN'],
          correctAnswer: 'TRUE'
        },
        {
          id: 'cam18_r15',
          type: 'tfng',
          passageIdx: 1,
          question: '15. Athens legally banned dark rooftop tiles across all commercial zones after its cool-roof trials.',
          options: ['TRUE', 'FALSE', 'NOT GIVEN'],
          correctAnswer: 'NOT GIVEN'
        },
        {
          id: 'cam18_r16',
          type: 'fill',
          passageIdx: 1,
          question: '16. The technical measure describing how much sunlight a surface reflects is its ______. (ONE WORD)',
          options: [],
          correctAnswer: 'albedo'
        }
      ]
    },
    writing: {
      task1: {
        prompt:
          'Task 1: The bar chart below shows electricity generation by energy source in Northland (in Terawatt-hours, TWh) in 2005, 2015, and 2025. Summarise the information by selecting and reporting the main features, and make comparisons where relevant.',
        minWords: 150,
        imageUrl: CAMBRIDGE_TASK1_CHART_SVG_URL,
        modelAnswer:
          'The bar chart illustrates electricity output across four energy sources - coal, natural gas, hydroelectric power, and wind and solar - measured in terawatt-hours (TWh) in Northland for 2005, 2015, and 2025. Overall, total reliance on coal plummeted dramatically over the twenty-year period, whereas wind and solar generation surged more than thirteenfold to overtake every other fuel by 2025. In 2005, coal dominated Northland’s grid at 140 TWh, followed by natural gas at 80 TWh, hydroelectricity at 45 TWh, and wind and solar at merely 10 TWh. Over the following decade, natural gas rose to 105 TWh while coal slipped to 115 TWh and renewables climbed steadily to 42 TWh. Between 2015 and 2025, energy transition accelerated sharply: coal output contracted to 45 TWh and gas eased back to 90 TWh, while wind and solar expanded rapidly to reach a peak of 135 TWh. Hydroelectric output remained the steadiest source, inching upward gradually from 45 to 55 TWh.'
      },
      task2: {
        prompt:
          'Task 2: In many cities, older historic buildings and traditional neighbourhoods are being demolished to make room for high-rise apartment complexes and commercial towers. Do the advantages of this urban redevelopment outweigh the disadvantages?',
        minWords: 250,
        modelAnswer:
          'Rapid urbanisation has compelled many municipal planners to weigh cultural preservation against economic modernisation, often resulting in the demolition of older districts to erect high-density towers. Although replacing ageing low-rise blocks boosts housing supply and updates civic infrastructure, I contend that sweeping demolition destroys irreplaceable cultural heritage and architectural diversity, making its long-term drawbacks clearly outweigh its immediate gains. Proponents rightly note that ageing structures frequently suffer from substandard plumbing, weak earthquake resilience, and poor thermal insulation. Replacing cramped brick terraces with multi-storey residential complexes enables metropolitan centres to accommodate growing populations efficiently near public transit nodes while lowering per-capita heating energy. Commercial skyscrapers can also attract multinational investment and expand municipal tax bases. Nevertheless, razing historic quarters inflicts irreversible damage upon urban identity. Traditional streetscapes preserve tactile evidence of local craftsmanship and shared collective memory, forming neighbourhood social cohesion that sterile glass towers rarely foster. Once vernacular courtyards and heritage shopfronts disappear under concrete foundations, successive generations lose tangible connections to regional architectural history. Furthermore, well-maintained historic quarters act as powerful magnets for sustainable cultural tourism, creative industries, and independent hospitality ventures, generating lasting economic returns far exceeding one-off construction booms. Rather than choosing between stagnation and complete erasure, visionary planners can deploy adaptive reuse: reinforcing historic facades structurally while modernising interior wiring, insulation, rooftop solar panels, and heating efficiency. In conclusion, while vertical construction addresses short-term land scarcity, indiscriminate demolition sacrifices cultural continuity that can never be reconstructed; targeted renovation paired with selective brownfield high-rises offers a far healthier urban balance.'
      }
    }
  },
  {
    id: 'test-1',
    title: 'IELTS Academic Practice Test 01 - Full 4 Skills Simulation',
    description: 'Đề thi thử Academic Full 4 kỹ năng Listening, Reading, Writing và Speaking chuẩn cấu trúc IDP/BC.',
    createdAt: '2026-03-01',
    visibility: 'public',
    maxAttempts: 1,
    sequentialMode: true,
    allowEarlyNextSection: false,
    sectionOrder: ['listening', 'reading', 'writing', 'speaking'],
    sectionDurations: { listening: 15, reading: 20, writing: 25, speaking: 12 },
    maxAudioPlays: 1,
    shuffleOptions: true,
    allowViewAnswers: false,
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
  },
  {
    id: 'test-spk-luyennoi-1',
    seedTag: 'speaking_luyennoi_full_v1',
    title: 'IELTS Speaking Full Test 01 - Hometown, Memorable Trip & Tourism',
    description: 'Đề thi thử IELTS Speaking đầy đủ 3 phần (Part 1, Cue Card Part 2, Part 3). Ghi âm câu trả lời lưu trực tiếp lên hệ thống và AI chấm band 4 tiêu chí.',
    createdAt: '2026-11-16',
    testMode: 'single_skill',
    focusSkill: 'speaking',
    autoAiGrade: true,
    visibility: 'public',
    maxAttempts: 0,
    sequentialMode: false,
    allowEarlyNextSection: true,
    antiCheatEnabled: false,
    sectionOrder: ['speaking'],
    sectionDurations: { listening: 15, reading: 20, writing: 25, speaking: 14 },
    maxAudioPlays: 2,
    shuffleOptions: false,
    allowViewAnswers: true,
    listening: { tracks: [], questions: [] },
    reading: { passages: [], questions: [] },
    writing: { task1: { prompt: '', minWords: 150, modelAnswer: '' }, task2: { prompt: '', minWords: 250, modelAnswer: '' } },
    speaking: createDefaultSpeakingSection()
  },
  {
    id: 'test-spk-forecast-2',
    seedTag: 'speaking_forecast_q4_v1',
    title: 'Forecast Speaking Mới Nhất - AI Technology, Study & Modern Lifestyle',
    description: 'Bộ câu hỏi Forecast Speaking cập nhật để học viên luyện từng Part hoặc thi Full Test với AI chấm điểm & gợi ý nâng Band.',
    createdAt: '2026-11-16',
    testMode: 'single_skill',
    focusSkill: 'speaking',
    autoAiGrade: true,
    visibility: 'public',
    maxAttempts: 0,
    sequentialMode: false,
    allowEarlyNextSection: true,
    antiCheatEnabled: false,
    sectionOrder: ['speaking'],
    sectionDurations: { listening: 15, reading: 20, writing: 25, speaking: 14 },
    maxAudioPlays: 2,
    shuffleOptions: false,
    allowViewAnswers: true,
    listening: { tracks: [], questions: [] },
    reading: { passages: [], questions: [] },
    writing: { task1: { prompt: '', minWords: 150, modelAnswer: '' }, task2: { prompt: '', minWords: 250, modelAnswer: '' } },
    speaking: {
      isForecast: true,
      autoAiGrade: true,
      part1SpeakSec: 45,
      part2PrepSec: 60,
      part2SpeakSec: 120,
      part3SpeakSec: 60,
      part1: {
        enabled: true,
        topic: 'Technology & Study Habits',
        questions: [
          {
            id: 'fc_p1_1',
            prompt: 'How much time do you usually spend using smartphones or computers every day?',
            hint: 'Dùng từ: screen time, indispensable tool, balance study and leisure...'
          },
          {
            id: 'fc_p1_2',
            prompt: 'Do you prefer studying in a quiet library or in a lively café?',
            hint: 'So sánh mức độ tập trung vs không gian thoải mái.'
          },
          {
            id: 'fc_p1_3',
            prompt: 'What app or piece of software has helped you the most in learning English?',
            hint: 'Nêu tên công cụ + 1 lợi ích cụ thể cho từ vựng hoặc phát âm.'
          }
        ]
      },
      part2: {
        enabled: true,
        title: 'Describe a useful skill you learned from a website or video',
        cueCardPrompt: 'Describe a practical skill you learned from an online video or website.',
        bullets: [
          'what skill you learned',
          'how you found that website or video',
          'what challenges you faced when learning it',
          'and explain why this skill has been useful to you'
        ],
        followUpQuestion: 'Would you recommend this learning method to older people?'
      },
      part3: {
        enabled: true,
        topic: 'AI & Future of Education',
        questions: [
          {
            id: 'fc_p3_1',
            prompt: 'In what ways has Artificial Intelligence changed how students learn today?',
            hint: 'Nhắc đến cá nhân hóa lộ trình, phản hồi tức thì và rủi ro phụ thuộc.'
          },
          {
            id: 'fc_p3_2',
            prompt: 'Can online teachers or AI tools ever completely replace human teachers in classrooms?',
            hint: 'Nêu vai trò cảm hứng, thấu hiểu tâm lý và giao tiếp người-người.'
          },
          {
            id: 'fc_p3_3',
            prompt: 'What skills will young workers need most in an automated economy?',
            hint: 'Critical thinking, adaptability, emotional intelligence...'
          }
        ]
      }
    }
  },
  {
    id: 'test-single-reading-alltypes-01',
    seedTag: 'single_r_all_v1',
    title: 'Reading Lẻ Full 11 Dạng - Ocean Kelp Forests & Urban Microgrids',
    description:
      'Đề Reading lẻ chuẩn IELTSMate tổng hợp đủ 11 dạng bài Reading: Multiple Choice, TRUE/FALSE/NOT GIVEN, YES/NO/NOT GIVEN, Matching Headings, Matching Information, Matching Features, Summary Box, Summary No Box, Correct Ending, Fill in the Blank (đục lỗ), Diagram Label & Short Answer.',
    createdAt: '2026-11-18',
    visibility: 'public',
    testMode: 'single_skill',
    focusSkill: 'reading',
    maxAttempts: 0,
    antiCheatEnabled: false,
    allowViewAnswers: true,
    sectionOrder: ['reading'],
    sectionDurations: { listening: 10, reading: 25, writing: 20 },
    reading: {
      passageTitle: 'Passage 1: Giant Kelp Forests - Underwater Climate Engineers',
      passageText: `A Along rocky temperate coastlines from California to Tasmania, towering brown macroalgae known as giant kelp form dense underwater canopies growing up to half a metre per day. Far from being passive seaweed, these three-dimensional forests shelter over 800 marine species, buffer coastlines against storm surges, and capture dissolved carbon at rates rivaling tropical rainforests.

B Rather than drawing nutrients through underground roots like terrestrial trees, kelp anchors itself onto bedrock with a tough root-like structure called a holdfast. Gas-filled bladders known as pneumatocysts buoy each textured blade upward toward sunlit surface waters, allowing fronds to photosynthesise efficiently across towering 30-metre columns.

C Marine ecologist Dr. Hannah Sato emphasizes that healthy kelp ecosystems depend strictly on trophic balance involving sea otters. Dr. Lucas Meyer similarly demonstrated in Oregon reefs that unchecked purple sea urchin swarms can strip vibrant kelp beds down to barren stone within months, whereas predatory lobsters and otters restore kelp density naturally without chemical intervention.`,
      clozeText: `Complete the labelled diagram note below:
• Gas-filled sacs called {{10}} lift blades toward sunlit waters.
• At the ocean floor, a tough {{11}} grips rocky reefs without absorbing soil minerals.`,
      passages: [
        {
          id: 'pass_sr_1',
          title: 'Passage 1: Giant Kelp Forests - Underwater Climate Engineers',
          passageText: `A Along rocky temperate coastlines from California to Tasmania, towering brown macroalgae known as giant kelp form dense underwater canopies growing up to half a metre per day. Far from being passive seaweed, these three-dimensional forests shelter over 800 marine species, buffer coastlines against storm surges, and capture dissolved carbon at rates rivaling tropical rainforests.

B Rather than drawing nutrients through underground roots like terrestrial trees, kelp anchors itself onto bedrock with a tough root-like structure called a holdfast. Gas-filled bladders known as pneumatocysts buoy each textured blade upward toward sunlit surface waters, allowing fronds to photosynthesise efficiently across towering 30-metre columns.

C Marine ecologist Dr. Hannah Sato emphasizes that healthy kelp ecosystems depend strictly on trophic balance involving sea otters. Dr. Lucas Meyer similarly demonstrated in Oregon reefs that unchecked purple sea urchin swarms can strip vibrant kelp beds down to barren stone within months, whereas predatory lobsters and otters restore kelp density naturally without chemical intervention.`,
          clozeText: `Questions 10-11: Fill in the blanks from the passage.
• Gas-filled sacs called {{10}} lift blades toward sunlit waters.
• At the ocean floor, a tough {{11}} grips rocky reefs.`
        },
        {
          id: 'pass_sr_2',
          title: 'Passage 2: Resilient Neighbourhood Microgrids',
          passageText: `A Unlike centralised fossil-fuel power stations transmitting voltage across hundreds of kilometres, modern neighbourhood microgrids combine rooftop solar arrays, vanadium-flow batteries, and automated controllers to serve clustered blocks locally.

B Engineer Priya Nair argues in a 2025 IEEE report that islandable microgrids eliminate catastrophic blackouts during typhoons: once main transmission lines trip, an automated gateway isolates the district grid in under twenty milliseconds so hospitals and water pumps continue running uninterrupted.`,
          clozeText: ''
        }
      ],
      questions: [
        {
          id: 'sr_q1',
          type: 'mcq',
          passageIdx: 0,
          question: '1. [MCQ] According to Paragraph A, giant kelp forests contribute to coastal resilience by:',
          options: [
            'A. warming polar ocean currents during winter months',
            'B. absorbing wave energy during severe coastal storms',
            'C. replacing deep-sea coral reefs along equatorial beaches',
            'D. filtering plastic waste out of commercial shipping lanes'
          ],
          correctAnswer: 'B. absorbing wave energy during severe coastal storms'
        },
        {
          id: 'sr_q2',
          type: 'tfng',
          passageIdx: 0,
          question: '2. [TRUE / FALSE / NOT GIVEN] Giant kelp absorbs most of its mineral nutrients through its holdfast like land trees.',
          options: ['TRUE', 'FALSE', 'NOT GIVEN'],
          correctAnswer: 'FALSE'
        },
        {
          id: 'sr_q3',
          type: 'matching_headings',
          passageIdx: 0,
          question: '3. [Matching Headings] Choose the best heading for Paragraph B.',
          options: [
            'i. Anatomy that maximises sunlight capture',
            'ii. Economic subsidies for offshore harvesting',
            'iii. Reasons sea otters migrate inland',
            'iv. How ocean acidification dissolves limestone'
          ],
          correctAnswer: 'i. Anatomy that maximises sunlight capture'
        },
        {
          id: 'sr_q4',
          type: 'matching_information',
          passageIdx: 0,
          question: '4. [Matching Information] Which paragraph mentions the maximum daily vertical growth rate of giant kelp?',
          options: ['Paragraph A', 'Paragraph B', 'Paragraph C'],
          correctAnswer: 'Paragraph A'
        },
        {
          id: 'sr_q5',
          type: 'matching_features',
          passageIdx: 0,
          question: '5. [Matching Features] Researcher who documented Oregon reefs stripped bare by purple sea urchins:',
          options: ['A. Dr. Hannah Sato', 'B. Dr. Lucas Meyer', 'C. Priya Nair'],
          correctAnswer: 'B. Dr. Lucas Meyer'
        },
        {
          id: 'sr_q6',
          type: 'summary_box',
          passageIdx: 0,
          question: '6. [Summary Completion - Box] Predatory ______ help protect kelp beds from overgrazing urchins.',
          options: ['A. lobsters', 'B. sharks', 'C. penguins', 'D. corals'],
          correctAnswer: 'A. lobsters'
        },
        {
          id: 'sr_q7',
          type: 'summary_nobox',
          passageIdx: 0,
          wordLimit: 'ONE WORD',
          question: '7. [Summary Completion - No Box] Dense kelp beds provide shelter for more than 800 ______ species.',
          options: [],
          correctAnswer: 'marine'
        },
        {
          id: 'sr_q8',
          type: 'correct_ending',
          passageIdx: 1,
          question: '8. [Correct Ending] An islandable neighbourhood microgrid protects hospital electricity because:',
          options: [
            'A. its automated gateway disconnects faulted main lines in milliseconds.',
            'B. rooftop panels double sunlight output at night.',
            'C. residents manually restart diesel turbines after sunrise.',
            'D. coastal humidity prevents lightning strikes on transformers.'
          ],
          correctAnswer: 'A. its automated gateway disconnects faulted main lines in milliseconds.'
        },
        {
          id: 'sr_q9',
          type: 'ynng',
          passageIdx: 1,
          question: '9. [YES / NO / NOT GIVEN] Does Engineer Priya Nair agree that decentralised microgrids improve typhoon blackout resilience?',
          options: ['YES', 'NO', 'NOT GIVEN'],
          correctAnswer: 'YES'
        },
        {
          id: 'sr_q10',
          type: 'fill',
          blankNum: 10,
          passageIdx: 0,
          wordLimit: 'ONE WORD',
          question: '10. [Fill in the Blank / Đục lỗ] Gas-filled sacs lifting kelp fronds are termed ______.',
          options: [],
          correctAnswer: 'pneumatocysts'
        },
        {
          id: 'sr_q11',
          type: 'diagram_label',
          blankNum: 11,
          passageIdx: 0,
          wordLimit: 'ONE WORD',
          question: '11. [Diagram Label Completion] Structure anchoring kelp onto bedrock at the seabed: ______.',
          options: [],
          correctAnswer: 'holdfast'
        },
        {
          id: 'sr_q12',
          type: 'short_answer',
          passageIdx: 1,
          wordLimit: 'NO MORE THAN THREE WORDS',
          question: '12. [Short Answer Question] Which type of battery is paired with rooftop solar panels in Paragraph A?',
          options: [],
          correctAnswer: 'vanadium-flow batteries|vanadium flow batteries'
        }
      ]
    }
  },
  {
    id: 'test-single-listening-alltypes-01',
    seedTag: 'single_l_all_v1',
    title: 'Listening Lẻ Full 6 Dạng - Botanical Garden Tour & Eco-Packaging Lab',
    description:
      'Đề Listening lẻ tổng hợp đủ 6 dạng bài IELTS Listening: Form Completion (đục lỗ), Flow-chart Completion, Multiple Choice, Matching, Map/Plan/Diagram Labelling & Short Answer Questions - tích hợp giọng đọc AI tiếng Anh sẵn.',
    createdAt: '2026-11-18',
    visibility: 'public',
    testMode: 'single_skill',
    focusSkill: 'listening',
    maxAttempts: 0,
    antiCheatEnabled: false,
    allowViewAnswers: true,
    maxAudioPlays: 3,
    sectionOrder: ['listening'],
    sectionDurations: { listening: 20, reading: 20, writing: 20 },
    listening: {
      audioUrl: '',
      transcript: `Welcome to the Nha Trang Botanical Volunteer Orientation and Eco-Packaging Workshop.`,
      tracks: [
        {
          id: 'sl_track_1',
          title: 'Part 1: Botanical Volunteer Registration & Map (Q1–6)',
          audioUrl: '',
          transcript: `Coordinator: Hello! Thanks for signing up for our Botanical Garden Volunteer Programme. Can I take your surname for the badge? Volunteer: Yes, it is Bellamy, spelt B-E-L-L-A-M-Y. Coordinator: Great. And for the morning shift you will help water herbs starting at nine fifteen, so 9:15 a.m. Note that volunteers get free entry to the Glasshouse Cafe, and your team supervisor is Dr. Carter. Before heading out, look at our garden map: directly opposite the Main Gate is the Orchid Pavilion on Zone B, while the Seed Vault sits in Zone C beside the Pond. If you have allergies, inform Nurse Kim at reception by twelve pounds fee waiver - wait, there is no fee, just bring sturdy boots!`,
          clozeText: `Questions 1-2: Complete the Volunteer Form below.
Write **ONE WORD AND/OR A NUMBER** for each answer.

**BOTANICAL VOLUNTEER REGISTRATION**
• Volunteer Surname: Mr. {{1}}
• Morning Shift Starts: {{2}} a.m.
• Team Supervisor: Dr. Carter`
        },
        {
          id: 'sl_track_2',
          title: 'Part 2: Eco-Packaging Lab Flow-Chart & Q7–10',
          audioUrl: '',
          transcript: `Lecturer: Today in the Eco-Packaging Lab we turn dried rice husks into compostable food trays. Follow our three-stage flow-chart: First, raw husks are washed and milled into fine powder. Second, natural cassava starch is blended in during the mixing stage before high-temperature pressing. Third, finished trays undergo waterproofing with beeswax. Remember in Question 8 that heat-pressed trays withstand ninety seconds in microwaves, so option C. Let's match our researchers: Sarah leads fibre strength testing, while Tom focuses on mould design. Finally, what local marine crop is being trialled next semester for edible films? Seaweed!`,
          clozeText: `Questions 7: Complete the Flow-chart step below.
Write **ONE WORD** for the answer.
1. Wash & mill rice powder -> 2. Mix with {{7}} starch -> 3. Waterproof coat`
        }
      ],
      questions: [
        {
          id: 'sl_q1',
          type: 'form_completion',
          blankNum: 1,
          trackIdx: 0,
          wordLimit: 'ONE WORD',
          question: '1. [Form Completion] Volunteer Surname: Mr. ______.',
          options: [],
          correctAnswer: 'Bellamy|bellamy'
        },
        {
          id: 'sl_q2',
          type: 'form_completion',
          blankNum: 2,
          trackIdx: 0,
          wordLimit: 'A TIME',
          question: '2. [Form Completion] Morning shift begins at ______ a.m.',
          options: [],
          correctAnswer: '9:15|9.15'
        },
        {
          id: 'sl_q3',
          type: 'mcq',
          trackIdx: 0,
          question: '3. [Multiple Choice] Which cafe offers complimentary entry/discounts for registered volunteers?',
          options: [
            'A. Palm Courtyard Cafe',
            'B. Glasshouse Cafe',
            'C. Pier Terrace Cafe',
            'D. Riverbank Bistro'
          ],
          correctAnswer: 'B. Glasshouse Cafe'
        },
        {
          id: 'sl_q4',
          type: 'map_diagram',
          trackIdx: 0,
          question: '4. [Map / Plan Labelling] Where is the Orchid Pavilion located relative to the Main Gate?',
          options: ['A. Zone A (West Gate)', 'B. Zone B (Opposite Main Gate)', 'C. Zone C (Beside Pond)'],
          correctAnswer: 'B. Zone B (Opposite Main Gate)'
        },
        {
          id: 'sl_q5',
          type: 'map_diagram',
          trackIdx: 0,
          question: '5. [Map / Plan Labelling] Which zone houses the Seed Vault beside the Pond?',
          options: ['A. Zone A (West Gate)', 'B. Zone B (Opposite Main Gate)', 'C. Zone C (Beside Pond)'],
          correctAnswer: 'C. Zone C (Beside Pond)'
        },
        {
          id: 'sl_q6',
          type: 'short_answer',
          trackIdx: 0,
          wordLimit: 'NO MORE THAN TWO WORDS',
          question: '6. [Short Answer] What footwear should volunteers bring on orientation day?',
          options: [],
          correctAnswer: 'sturdy boots|boots'
        },
        {
          id: 'sl_q7',
          type: 'flowchart_completion',
          blankNum: 7,
          trackIdx: 1,
          wordLimit: 'ONE WORD',
          question: '7. [Flow-chart Completion] Stage 2 mixes rice husk powder with natural ______ starch.',
          options: [],
          correctAnswer: 'cassava'
        },
        {
          id: 'sl_q8',
          type: 'mcq',
          trackIdx: 1,
          question: '8. [Multiple Choice] How long do the pressed eco-trays safely withstand microwave heating?',
          options: ['A. 30 seconds', 'B. 60 seconds', 'C. 90 seconds', 'D. 120 seconds'],
          correctAnswer: 'C. 90 seconds'
        },
        {
          id: 'sl_q9',
          type: 'matching',
          trackIdx: 1,
          question: '9. [Matching] Which researcher is responsible for fibre strength testing?',
          options: ['A. Sarah', 'B. Tom', 'C. Dr. Carter'],
          correctAnswer: 'A. Sarah'
        },
        {
          id: 'sl_q10',
          type: 'short_answer',
          trackIdx: 1,
          wordLimit: 'ONE WORD',
          question: '10. [Short Answer] Which marine crop will be trialled next semester for edible packaging films?',
          options: [],
          correctAnswer: 'seaweed|Seaweed'
        }
      ]
    }
  },
  {
    id: 'test-single-writing-academic-01',
    seedTag: 'single_w_acad_v1',
    title: 'Daily Writing Task 1 (Dynamic) - Clean Energy Transition',
    description:
      'Bài tập lẻ Writing Task 1 (Biểu đồ Dynamic) trong Daily Zone: luyện viết báo cáo xu hướng tối thiểu 150 từ, nộp chờ Ms. Như duyệt chấm & nhận xét lỗi chi tiết.',
    createdAt: '2026-11-18',
    visibility: 'public',
    testMode: 'single_skill',
    focusSkill: 'writing',
    examCategory: 'daily_zone',
    dailySubCategory: 'w1_dynamic',
    writingTaskScope: 'task1',
    maxAttempts: 0,
    antiCheatEnabled: false,
    allowViewAnswers: true,
    sectionOrder: ['writing'],
    sectionDurations: { listening: 10, reading: 20, writing: 20 },
    writing: {
      task1: {
        prompt:
          'Task 1: The bar chart illustrates electricity generation by source in Northland (in TWh) in 2005, 2015, and 2025. Summarise the key trends and make comparisons where relevant.',
        minWords: 150,
        imageUrl: CAMBRIDGE_TASK1_CHART_SVG_URL,
        modelAnswer:
          'The bar chart illustrates electricity output in Northland across coal, natural gas, hydroelectricity, and wind and solar power in 2005, 2015, and 2025. Overall, total coal generation fell steeply over the period, while wind and solar power surged more than thirteenfold to become the largest electricity source by 2025. Coal initially dominated supply at 140 TWh in 2005 before receding to 115 TWh in 2015 and dropping sharply to 45 TWh in 2025. Meanwhile, wind and solar expanded rapidly from 10 TWh to 42 TWh in 2015 and peaked at 135 TWh in 2025.'
      },
      task2: {
        prompt: '',
        minWords: 250,
        modelAnswer: ''
      }
    }
  },
  {
    id: 'test-single-writing-task2-01',
    seedTag: 'single_w2_acad_v1',
    title: 'Daily Writing Task 2 (Essay) - AI in Education',
    description:
      'Bài tập lẻ Writing Task 2 (Essay) trong Daily Zone: luyện viết bài luận tối thiểu 250 từ, nộp chờ Ms. Như duyệt chấm & chữa từng câu chi tiết.',
    createdAt: '2026-11-18',
    visibility: 'public',
    testMode: 'single_skill',
    focusSkill: 'writing',
    examCategory: 'daily_zone',
    dailySubCategory: 'w2_essay',
    writingTaskScope: 'task2',
    maxAttempts: 0,
    antiCheatEnabled: false,
    allowViewAnswers: true,
    sectionOrder: ['writing'],
    sectionDurations: { listening: 10, reading: 20, writing: 40 },
    writing: {
      task1: {
        prompt: '',
        minWords: 150,
        imageUrl: '',
        modelAnswer: ''
      },
      task2: {
        prompt:
          'Task 2: Artificial intelligence tools are increasingly replacing conventional homework and writing exercises in schools and universities. Do the advantages of this development outweigh the disadvantages?',
        minWords: 250,
        modelAnswer:
          'Although automated writing and tutoring tools deliver instantaneous grammatical feedback and personalised study schedules, excessive reliance risks undermining independent critical reasoning if schools fail to integrate structured human supervision. On balance, I contend that thoughtful guided adoption offers greater long-term educational value when paired with rigorous classroom assessment.'
      }
    }
  },
  {
    id: 'test-single-speaking-examroom-01',
    seedTag: 'single_s_room_v1',
    title: 'Phòng Thi Speaking Thực Chiến 01 - AI Tự Ghi 3s (Pass: 1234)',
    description:
      'Đề Speaking Phòng Thi Thực Chiến mẫu để kiểm tra giọng AI đọc toàn bộ câu hỏi và chế độ đếm ngược 3 giây tự động bật Micro ghi âm xuyên suốt Part 1 · Part 2 · Part 3. Mật khẩu test: 1234',
    createdAt: '2026-11-18',
    visibility: 'public',
    testMode: 'single_skill',
    focusSkill: 'speaking',
    maxAttempts: 0,
    antiCheatEnabled: false,
    allowViewAnswers: true,
    sectionOrder: ['speaking'],
    sectionDurations: { listening: 10, reading: 10, writing: 10, speaking: 12 },
    speaking: {
      speakingTrack: 'exam_room',
      roomPassword: '1234',
      part1DurationSec: 35,
      part2PrepSec: 20,
      part2SpeakSec: 90,
      part3DurationSec: 45,
      isForecast: false,
      autoAiGrade: true,
      part1: {
        enabled: true,
        topic: 'Hometown & Daily Study',
        questions: [
          { id: 'sp_er_p1_1', prompt: 'Where is your hometown located, and what do you like most about living there?' },
          { id: 'sp_er_p1_2', prompt: 'How do you usually organise your daily English or IELTS study routine?' }
        ]
      },
      part2: {
        enabled: true,
        title: 'Describe a goal you worked hard to achieve',
        cueCardPrompt: 'Describe an academic or personal goal that you worked hard to achieve.',
        bullets: [
          'what the goal was',
          'when you decided to pursue it',
          'what challenges you had to overcome',
          'and explain how achieving it made you feel'
        ],
        followUpQuestion: 'Do you find it easier to stay motivated when studying alone or with friends?'
      },
      part3: {
        enabled: true,
        topic: 'Technology & Independent Learning',
        questions: [
          { id: 'sp_er_p3_1', prompt: 'Do you think young people today rely too heavily on digital tools when studying?' },
          { id: 'sp_er_p3_2', prompt: 'How can teachers balance automated feedback with genuine personal mentorship?' }
        ]
      }
    }
  }
];

export const DEFAULT_ATTEMPTS = [];

export const DEFAULT_USERS = {
  'teacher_ielts': { username: 'teacher_ielts', name: 'Ms. Như - IELTS Nha Trang', role: 'teacher', targetBand: 9.0, joinedDate: '2026-01-01' }
};

export const DEFAULT_ROOMS = {
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
    players: {}
  }
};

export const DEFAULT_TEACHER_NOTES = {};

export const CREWMATE_COLORS = [
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

export const ANIMAL_CHARACTERS = [
  { id: 'cat', label: 'Mèo Cam', body: '#fb923c', belly: '#ffedd5', innerEar: '#fda4af', accent: '#c2410c' },
  { id: 'shiba', label: 'Cún Shiba', body: '#eab308', belly: '#fef9c3', innerEar: '#fde047', accent: '#854d0e' },
  { id: 'bunny', label: 'Thỏ Hồng', body: '#f472b6', belly: '#fdf2f8', innerEar: '#fbcfe8', accent: '#be185d' },
  { id: 'panda', label: 'Gấu Trúc', body: '#f8fafc', belly: '#e2e8f0', innerEar: '#1e293b', accent: '#0f172a' },
  { id: 'fox', label: 'Cáo Rừng', body: '#ef4444', belly: '#fff7ed', innerEar: '#fed7aa', accent: '#991b1b' },
  { id: 'penguin', label: 'Cánh Cụt', body: '#334155', belly: '#f8fafc', innerEar: '#94a3b8', accent: '#f59e0b' },
  { id: 'frog', label: 'Ếch IELTS', body: '#22c55e', belly: '#dcfce7', innerEar: '#86efac', accent: '#15803d' },
  { id: 'lion', label: 'Sư Tử', body: '#f59e0b', belly: '#fef3c7', innerEar: '#fde68a', accent: '#b45309' }
];

export const ANIMAL_ACCESSORIES = [
  { id: 'none', label: 'Tự nhiên', icon: '✨' },
  { id: 'crown', label: 'Vương Miện', icon: '👑' },
  { id: 'headphones', label: 'Tai Nghe', icon: '🎧' },
  { id: 'glasses', label: 'Kính Râm', icon: '🕶️' },
  { id: 'grad_cap', label: 'Mũ Cử Nhân', icon: '🎓' },
  { id: 'helmet', label: 'Mũ Vũ Trụ', icon: '👩‍🚀' },
  { id: 'bow', label: 'Nơ Xinh', icon: '🎀' },
  { id: 'halo', label: 'Hào Quang', icon: '😇' }
];

export const normalizeAnimalId = (animalId) =>
  ANIMAL_CHARACTERS.some(a => a.id === animalId) ? animalId : 'cat';

export const normalizeAccessoryId = (accessoryId) =>
  ANIMAL_ACCESSORIES.some(a => a.id === accessoryId) ? accessoryId : 'none';
