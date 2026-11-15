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
  }
});

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
    title: 'IELTS Academic Mock Test 02 — Cambridge Standard (Đục Lỗ + Full 3 Skills)',
    description:
      'Đề thi IELTS Academic hoàn chỉnh chuẩn phòng thi Luyện thi IELTS Nha Trang (Ms. Như): Listening 3 Parts (Note Completion đục lỗ Q1–Q10, Bảo tàng Hàng hải Q11–Q15, Nghiên cứu đất đô thị Q16–Q20 có giọng đọc tiếng Anh), Reading 2 Academic Passages (16 câu Đục lỗ, TFNG, MCQ) và Writing Task 1 (kèm biểu đồ) + Task 2.',
    createdAt: '2026-11-14',
    visibility: 'public',
    maxAttempts: 0,
    sequentialMode: false,
    allowEarlyNextSection: true,
    antiCheatEnabled: false,
    sectionOrder: ['listening', 'reading', 'writing'],
    sectionDurations: { listening: 30, reading: 60, writing: 60 },
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

B Because fertile coastal pans and rock-salt deposits were unevenly scattered across continents, salt quickly forged long-distance highways. In Roman Italy, the Via Salaria—one of the peninsula’s oldest engineered roads—carried coastal salt inland toward upland towns. Historians frequently debate whether the modern word “salary” grew directly out of salt stipends; archaeological pay ledgers confirm legionaries were primarily paid in minted silver coins alongside occasional salt rations. Across North Africa, Saharan mines at Taghaza supplied immense rectangular slabs hauled south by camel caravans along desert tracks to Timbuktu, where scarcity made salt slabs rival equal weights of gold dust in regional barter.

C Inevitably, anything indispensable became a tempting fiscal target for monarchs and colonial empires. Medieval French kings imposed the notorious gabelle, forcing citizens above age eight to purchase fixed quotas of heavily taxed state salt—a grievance frequently cited in petitions before the 1789 Revolution. More than a century later, in 1930, Mahatma Gandhi selected British salt monopolies as the symbolic focal point of a 390-kilometre civil disobedience march to the Arabian Sea, demonstrating how an everyday mineral could mobilise political solidarity across social classes.

D Everything changed once household iceboxes gave way to electric refrigeration in the early twentieth century. Salt lost its historical monopoly over food preservation, yet modern industry consumes unprecedented tonnages today—over half of global production now feeds chemical manufacturing, producing chlorine, caustic soda, and glass rather than dining-table shakers.`,
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

B Because fertile coastal pans and rock-salt deposits were unevenly scattered across continents, salt quickly forged long-distance highways. In Roman Italy, the Via Salaria—one of the peninsula’s oldest engineered roads—carried coastal salt inland toward upland towns. Historians frequently debate whether the modern word “salary” grew directly out of salt stipends; archaeological pay ledgers confirm legionaries were primarily paid in minted silver coins alongside occasional salt rations. Across North Africa, Saharan mines at Taghaza supplied immense rectangular slabs hauled south by camel caravans along desert tracks to Timbuktu, where scarcity made salt slabs rival equal weights of gold dust in regional barter.

C Inevitably, anything indispensable became a tempting fiscal target for monarchs and colonial empires. Medieval French kings imposed the notorious gabelle, forcing citizens above age eight to purchase fixed quotas of heavily taxed state salt—a grievance frequently cited in petitions before the 1789 Revolution. More than a century later, in 1930, Mahatma Gandhi selected British salt monopolies as the symbolic focal point of a 390-kilometre civil disobedience march to the Arabian Sea, demonstrating how an everyday mineral could mobilise political solidarity across social classes.

D Everything changed once household iceboxes gave way to electric refrigeration in the early twentieth century. Salt lost its historical monopoly over food preservation, yet modern industry consumes unprecedented tonnages today—over half of global production now feeds chemical manufacturing, producing chlorine, caustic soda, and glass rather than dining-table shakers.`,
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
          passageText: `A Modern metropolises routinely register night-time temperatures three to five degrees Celsius warmer than adjacent agricultural fields—a phenomenon climatologists term the Urban Heat Island (UHI) effect. Dense concentrations of dark slate roofing and asphalt roadways possess low albedo, a technical measure of solar reflectance; instead of bouncing sunlight skyward, these dark materials absorb up to ninety percent of incoming solar radiation throughout the afternoon.

B After sunset, geometry determines how rapidly that trapped energy escapes. In leafy rural meadows, warmth radiates directly upward toward the night sky. By contrast, narrow downtown "street canyons" flanked by glass and concrete facades repeatedly re-emit and trap outgoing longwave thermal radiation between opposing walls, keeping pavements hot well past midnight and driving peak air-conditioning electricity demand.

C Field experiments in Athens and Los Angeles indicate that coating flat commercial rooftops with pale high-albedo paint lowers top-floor indoor temperatures by two to three degrees Celsius across sunny climates without mechanical cooling. Complementing reflective roofs, porous stone pavements—pioneered under "Sponge City" drainage plans—capture rainwater below porous bricks and passively cool surrounding pedestrian air through gradual daytime evaporation.

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
          'The bar chart illustrates electricity output across four energy sources—coal, natural gas, hydroelectric power, and wind and solar—measured in terawatt-hours (TWh) in Northland for 2005, 2015, and 2025. Overall, total reliance on coal plummeted dramatically over the twenty-year period, whereas wind and solar generation surged more than thirteenfold to overtake every other fuel by 2025. In 2005, coal dominated Northland’s grid at 140 TWh, followed by natural gas at 80 TWh, hydroelectricity at 45 TWh, and wind and solar at merely 10 TWh. Over the following decade, natural gas rose to 105 TWh while coal slipped to 115 TWh and renewables climbed steadily to 42 TWh. Between 2015 and 2025, energy transition accelerated sharply: coal output contracted to 45 TWh and gas eased back to 90 TWh, while wind and solar expanded rapidly to reach a peak of 135 TWh. Hydroelectric output remained the steadiest source, inching upward gradually from 45 to 55 TWh.'
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
  'teacher_ielts': { username: 'teacher_ielts', pass: '123456', name: 'Ms. Như — IELTS Nha Trang', role: 'teacher', targetBand: 9.0, joinedDate: '2026-01-01' },
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
