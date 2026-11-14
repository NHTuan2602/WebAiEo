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
export const GAME_ROUND_TIME_LIMITS = { 1: 20, 2: 25, 3: 25 };
export const GAME_SPEED_OFFSETS = { relaxed: 6, normal: 0, turbo: -5 };

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

export const DEFAULT_SECTION_ORDER = ['listening', 'reading', 'writing'];
export const DEFAULT_SECTION_DURATIONS = { listening: 15, reading: 20, writing: 25 };

export const normalizeExamConfig = (test) => {
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
    antiCheatEnabled: test?.antiCheatEnabled !== false,
    order,
    durations
  };
};

export const getReadingPassages = (readingObj) => {
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
  visibility: 'private',
  maxAttempts: 0,
  sequentialMode: true,
  allowEarlyNextSection: false,
  antiCheatEnabled: true,
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
        transcript: ''
      }
    ],
    questions: []
  },
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

export const DEFAULT_TESTS = [
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
  }
];

export const DEFAULT_ATTEMPTS = [
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

export const DEFAULT_USERS = {
  'teacher_ielts': { username: 'teacher_ielts', pass: '123456', name: 'Thầy Minh IELTS Master', role: 'teacher', targetBand: 9.0, joinedDate: '2026-01-01' },
  'hocsinh_01': { username: 'hocsinh_01', pass: '123456', name: 'Nguyễn Văn A', role: 'student', targetBand: 8.0, joinedDate: '2026-02-01' },
  'hocsinh_02': { username: 'hocsinh_02', pass: '123456', name: 'Trần Thị Mai', role: 'student', targetBand: 7.5, joinedDate: '2026-02-15' },
  'hocsinh_03': { username: 'hocsinh_03', pass: '123456', name: 'Lê Hoàng Long', role: 'student', targetBand: 7.0, joinedDate: '2026-02-20' }
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
    players: {
      'Nguyễn Văn A': { name: 'Nguyễn Văn A', score: 1850, streak: 8, status: 'Vòng 3: Boss Speller', updatedAt: '14:32' },
      'Trần Thị Mai': { name: 'Trần Thị Mai', score: 1420, streak: 5, status: 'Vòng 2: Gõ từ khuyết', updatedAt: '15:10' }
    }
  }
};

export const DEFAULT_TEACHER_NOTES = {
  'hocsinh_01': 'Học sinh có tiến độ học tập rất xuất sắc, Band Overall đã tăng từ 6.5 lên 8.5 sau 3 lần thi. Kỹ năng Listening và Reading đã đạt mức 9.0 tuyệt đối. Cần tập trung thêm vào tính liên kết câu (Cohesion) trong Writing Task 2.',
  'hocsinh_02': 'Thái độ làm bài nghiêm túc, không vi phạm chuyển tab. Kỹ năng Listening nghe bắt keyword rất nhạy (Band 9.0). Cần luyện thêm tốc độ đọc Scanning cho Passage 3 để nâng Band Reading lên 8.5+.',
  'hocsinh_03': 'Cần lưu ý giữ tập trung trong phòng thi, hạn chế chuyển tab hoặc tra cứu từ điển bên ngoài. Cần rèn luyện thêm ngữ pháp câu phức và từ vựng học thuật cho Writing.'
};

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
